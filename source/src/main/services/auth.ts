import { getDb } from '../database/connection'
import { getSettings, updateSettings } from '../repositories/settings'
import { hashSecret, verifySecret } from '../security/passwords'
import { createUser, getUserByUsername, updatePassword, updateUser, userCount } from '../repositories/users'
import { getSession, requirePermission, requireUser, setSession } from './session'
import { createBackupSync } from '../repositories/backup'
import { audit } from '../repositories/audit'
import { loadDemoData } from './demoData'
import type { SessionUser } from '@shared/types'
import Database from 'better-sqlite3'

type DB = InstanceType<typeof Database>

export function toSession(db: DB, id: number): SessionUser {
  const row = db
    .prepare(
      `SELECT u.id, u.username, u.full_name FROM users u WHERE u.id = ? AND u.is_active = 1`
    )
    .get(id) as { id: number; username: string; full_name: string } | undefined
  if (!row) throw new Error('Account is inactive or not found.')
  const roles = (
    db.prepare(
      `SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ? ORDER BY r.name`
    ).all(id) as { name: string }[]
  ).map((x) => x.name as SessionUser['roles'][number])
  return { id: row.id, username: row.username, full_name: row.full_name, roles }
}

export function firstRunComplete(db: DB): boolean {
  return userCount(db) > 0 && !!getSettings(db).store_name
}

export function login(username: string, password: string): { user: SessionUser; firstRun: boolean; shiftOpen: boolean } {
  const db = getDb()
  const user = getUserByUsername(db, username.trim())
  if (!user || !verifySecret(password, user.password_hash)) {
    audit(db, { action: 'LOGIN_FAILED', user_id: null, reason: `Failed login for "${username}"` })
    throw new Error('Invalid username or password.')
  }
  if (!user.is_active) throw new Error('Account is deactivated.')
  return finalize(db, user.id)
}

export function loginPin(pin: string): { user: SessionUser; firstRun: boolean; shiftOpen: boolean } {
  const db = getDb()
  const candidates = db.prepare('SELECT id, pin_hash, is_active FROM users WHERE is_active = 1').all() as {
    id: number
    pin_hash: string
    is_active: number
  }[]
  const match = candidates.find((c) => verifySecret(pin, c.pin_hash))
  if (!match) {
    audit(db, { action: 'LOGIN_FAILED', user_id: null, reason: 'Failed PIN login' })
    throw new Error('Invalid PIN.')
  }
  return finalize(db, match.id)
}

function finalize(
  db: DB,
  userId: number
): { user: SessionUser; firstRun: boolean; shiftOpen: boolean } {
  const user = toSession(db, userId)
  setSession(user)
  const shiftOpen =
    (db.prepare(`SELECT COUNT(*) AS c FROM shifts WHERE user_id = ? AND status = 'OPENED'`).get(userId) as { c: number }).c >
    0
  audit(db, { action: 'LOGIN', user_id: userId, reason: 'User logged in' })
  return { user, firstRun: !firstRunComplete(db), shiftOpen }
}

export function logout(): void {
  const session = getSession()
  if (session) audit(getDb(), { action: 'LOGOUT', user_id: session.id })
  setSession(null)
}

export function changePassword(current: string, next: string): void {
  const db = getDb()
  const u = requireUser()
  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(u.id) as { password_hash: string }
  if (!verifySecret(current, user.password_hash)) throw new Error('Current password is incorrect.')
  if (next.length < 4) throw new Error('New password must be at least 4 characters.')
  updatePassword(db, u.id, hashSecret(next))
  audit(db, { action: 'PASSWORD_CHANGE', user_id: u.id })
}

export function changePin(pin: string): void {
  const db = getDb()
  const u = requireUser()
  if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be exactly 4 digits.')
  updateUser(db, u.id, { pinHash: hashSecret(pin) })
  audit(db, { action: 'PIN_CHANGE', user_id: u.id })
  refreshSession(db, u.id)
}

export function adminResetPin(targetUserId: number, newPin: string): void {
  const db = getDb()
  requirePermission('users:manage')
  if (!/^\d{4}$/.test(newPin)) throw new Error('PIN must be exactly 4 digits.')
  updateUser(db, targetUserId, { pinHash: hashSecret(newPin) })
  audit(db, { action: 'ADMIN_RESET_PIN', user_id: requireUser().id, entity_type: 'USER', entity_id: targetUserId, reason: newPin })
}

export function refreshSession(db: DB, userId: number): void {
  const u = getSession()
  if (u && u.id === userId) setSession(toSession(db, userId))
}

export function completeSetup(input: {
  store: { store_name: string; owner_name?: string; address?: string; phone?: string }
  admin: { username: string; password: string; pin: string; full_name?: string }
  receipt: { header?: string; footer?: string }
  data_dir: string
  load_demo: boolean
}): { user: SessionUser; firstRun: boolean; shiftOpen: boolean } {
  // Defensive validation mirrors the IPC-layer validation but runs here too,
  // so a partial/manually-crafted payload can never cause a nested-property
  // TypeError or leave the store half-initialized.
  if (!input || typeof input !== 'object') {
    throw new Error('Setup payload was not received.')
  }
  if (!input.store || typeof input.store !== 'object' || !input.store.store_name?.trim()) {
    throw new Error('Store name is required.')
  }
  if (!input.admin || typeof input.admin !== 'object' || !input.admin.username?.trim()) {
    throw new Error('Admin username is required.')
  }
  if (!input.admin.password || input.admin.password.length < 4) {
    throw new Error('Admin password must be at least 4 characters.')
  }
  if (!/^\d{4}$/.test(input.admin.pin)) {
    throw new Error('Admin PIN must be exactly 4 digits.')
  }
  if (!input.receipt || typeof input.receipt !== 'object') {
    throw new Error('Receipt settings data was not received.')
  }

  const db = getDb()

  // All setup writing happens inside ONE transaction. If any step throws the
  // whole operation rolls back, so we never leave a partially-initialized store.
  const wasFirstRun = !firstRunComplete(db)

  const runSetup = db.transaction(() => {
    if (wasFirstRun) {
      updateSettings(db, {
        store_name: input.store.store_name.trim(),
        owner_name: input.store.owner_name ?? '',
        address: input.store.address ?? '',
        phone: input.store.phone ?? '',
        receipt_header: input.receipt?.header ?? input.store.store_name.trim(),
        receipt_footer: input.receipt?.footer ?? 'Salamat po!',
        data_dir: input.data_dir
      })
      createUser(db, {
        username: input.admin.username.trim(),
        passwordHash: hashSecret(input.admin.password),
        pinHash: hashSecret(input.admin.pin),
        full_name: input.admin.full_name?.trim() || 'Administrator',
        roles: ['ADMIN'],
        is_active: true
      })
      if (input.load_demo) loadDemoData(db)
      audit(db, { action: 'SETUP_COMPLETE', user_id: 1, reason: 'First-run wizard finished' })
    }
  })

  runSetup()

  // Only after the transaction committed successfully do we snapshot a backup,
  // so the backup file reflects a fully-initialized store. Uses the same
  // pre-transaction flag: `firstRunComplete(db)` is true post-commit, so it
  // cannot be relied on to gate the backup.
  if (wasFirstRun) {
    createBackupSync(db, 'MANUAL')
  }

  const users = db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get() as { id: number }
  return finalize(db, users.id)
}

export function authStatus(): SessionUser | null {
  return getSession()
}