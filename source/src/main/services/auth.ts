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
  const count = userCount(db)
  if (count <= 0) return false
  const settings = getSettings(db)
  if (!settings.store_name || !settings.store_name.trim()) {
    updateSettings(db, { store_name: 'My Sari-Sari Store' })
  }
  return true
}

// M7.2 — Case-insensitive login by either username OR full_name
export function login(username: string, password: string): { user: SessionUser; firstRun: boolean; shiftOpen: boolean } {
  const db = getDb()
  const trimmed = username.trim()
  const user = db.prepare(
    `SELECT u.id, u.username, u.password_hash, u.full_name, u.is_active
     FROM users u
     WHERE (LOWER(u.username) = LOWER(?) OR LOWER(u.full_name) = LOWER(?))
     AND u.is_active = 1
     LIMIT 1`
  ).get(trimmed, trimmed) as { id: number; username: string; password_hash: string; full_name: string; is_active: number } | undefined
  if (!user || !verifySecret(password, user.password_hash)) {
    audit(db, { action: 'LOGIN_FAILED', user_id: null, reason: `Failed login for "${username}"` })
    throw new Error('Invalid username or password.')
  }
  if (!user.is_active) throw new Error('Account is deactivated.')
  return finalize(db, user.id)
}

// M7.3 — Target-aware PIN login: if targetUserId given, only verify that user's PIN
export function loginPin(pin: string, targetUserId?: number): { user: SessionUser; firstRun: boolean; shiftOpen: boolean } {
  const db = getDb()
  let candidates: { id: number; pin_hash: string; is_active: number }[]
  if (targetUserId != null) {
    candidates = db.prepare(
      `SELECT id, pin_hash, is_active FROM users WHERE is_active = 1 AND id = ?`
    ).all(targetUserId) as typeof candidates
  } else {
    candidates = db.prepare(
      `SELECT id, pin_hash, is_active FROM users WHERE is_active = 1`
    ).all() as typeof candidates
  }
  const match = candidates.find((c) => verifySecret(pin, c.pin_hash))
  if (!match) {
    audit(db, { action: 'LOGIN_FAILED', user_id: null, reason: 'Failed PIN login' })
    throw new Error('Invalid PIN.')
  }
  return finalize(db, match.id)
}

export function verifyManagerPin(secret: string): { valid: boolean; name?: string } {
  const db = getDb()
  const candidates = db.prepare('SELECT id, pin_hash, password_hash, is_active FROM users WHERE is_active = 1').all() as {
    id: number
    pin_hash: string
    password_hash: string
    is_active: number
  }[]
  const match = candidates.find((c) => verifySecret(secret, c.pin_hash) || (c.password_hash && verifySecret(secret, c.password_hash)))
  if (!match) return { valid: false }
  const user = toSession(db, match.id)
  const isManagerOrAdmin = user.roles.some((r) => {
    const roleUpper = r.toUpperCase()
    return roleUpper === 'ADMIN' || roleUpper === 'MANAGER'
  })
  if (!isManagerOrAdmin) return { valid: false }
  return { valid: true, name: user.full_name }
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
  checkPinUniqueness(db, pin, u.id)
  updateUser(db, u.id, { pinHash: hashSecret(pin) })
  audit(db, { action: 'PIN_CHANGE', user_id: u.id })
  refreshSession(db, u.id)
}

export function adminResetPin(targetUserId: number, newPin: string): void {
  const db = getDb()
  requirePermission('users:manage')
  if (!/^\d{4}$/.test(newPin)) throw new Error('PIN must be exactly 4 digits.')
  checkPinUniqueness(db, newPin, targetUserId)
  updateUser(db, targetUserId, { pinHash: hashSecret(newPin) })
  audit(db, { action: 'ADMIN_RESET_PIN', user_id: requireUser().id, entity_type: 'USER', entity_id: targetUserId, reason: newPin })
}

// M7.4 — Admin password reset for any user (requires users:manage permission)
export function adminResetPassword(targetUserId: number, newPassword: string): void {
  const db = getDb()
  requirePermission('users:manage')
  if (!newPassword || newPassword.length < 4) throw new Error('Password must be at least 4 characters.')
  updatePassword(db, targetUserId, hashSecret(newPassword))
  audit(db, { action: 'ADMIN_RESET_PASSWORD', user_id: requireUser().id, entity_type: 'USER', entity_id: targetUserId })
}

// M7.4 — Public user directory for login chips (no auth required — returns safe fields only)
export function publicUsers(): { id: number; username: string; full_name: string; roles: string[] }[] {
  const db = getDb()
  const rows = db.prepare(
    `SELECT u.id, u.username, u.full_name FROM users u WHERE u.is_active = 1 ORDER BY u.full_name`
  ).all() as { id: number; username: string; full_name: string }[]
  return rows.map((r) => {
    const roles = (
      db.prepare(
        `SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ? ORDER BY r.name`
      ).all(r.id) as { name: string }[]
    ).map((x) => x.name)
    return { id: r.id, username: r.username, full_name: r.full_name, roles }
  })
}

// M7.3 — Unique PIN enforcement helper
function checkPinUniqueness(db: DB, pin: string, excludeUserId: number): void {
  const others = db.prepare(
    `SELECT id, pin_hash FROM users WHERE is_active = 1 AND id != ?`
  ).all(excludeUserId) as { id: number; pin_hash: string }[]
  const collision = others.find((o) => verifySecret(pin, o.pin_hash))
  if (collision) throw new Error('This PIN is already used by another user. Please choose a different PIN.')
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
  const isInitialFirstRun = userCount(db) === 0

  const runSetup = db.transaction(() => {
    updateSettings(db, {
      store_name: input.store.store_name.trim(),
      owner_name: input.store.owner_name ?? '',
      address: input.store.address ?? '',
      phone: input.store.phone ?? '',
      receipt_header: input.receipt?.header ?? input.store.store_name.trim(),
      receipt_footer: input.receipt?.footer ?? 'Thank you for your purchase!',
      data_dir: input.data_dir
    })
    const cleanUsername = input.admin.username.trim()
    const existingUser = getUserByUsername(db, cleanUsername)
    if (existingUser) {
      updateUser(db, existingUser.id, {
        username: cleanUsername,
        passwordHash: hashSecret(input.admin.password),
        pinHash: hashSecret(input.admin.pin),
        full_name: input.admin.full_name?.trim() || existingUser.full_name || 'Administrator',
        roles: ['ADMIN'],
        is_active: true
      })
    } else {
      createUser(db, {
        username: cleanUsername,
        passwordHash: hashSecret(input.admin.password),
        pinHash: hashSecret(input.admin.pin),
        full_name: input.admin.full_name?.trim() || 'Administrator',
        roles: ['ADMIN'],
        is_active: true
      })
    }
    if (input.load_demo) loadDemoData(db)
    audit(db, { action: 'SETUP_COMPLETE', user_id: 1, reason: 'First-run wizard finished' })
  })

  runSetup()

  if (isInitialFirstRun) {
    createBackupSync(db, 'MANUAL')
  }

  const adminUser = getUserByUsername(db, input.admin.username.trim())
  const targetId = adminUser ? adminUser.id : (db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get() as { id: number }).id
  return finalize(db, targetId)
}

export function authStatus(): SessionUser | null {
  return getSession()
}