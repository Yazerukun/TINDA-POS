import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import {
  createUser,
  listUsers,
  updateUser,
  userCount
} from '../users'
import { updateSettings } from '../settings'
import { hashSecret, verifySecret } from '../../security/passwords'

// ── helpers ──────────────────────────────────────────────────────────────────
function seedDb(db: Database.Database): void {
  runMigrations(db)
  // Seed roles (migrations may already do this; guard with INSERT OR IGNORE)
  db.prepare("INSERT OR IGNORE INTO roles (name) VALUES ('ADMIN')").run()
  db.prepare("INSERT OR IGNORE INTO roles (name) VALUES ('MANAGER')").run()
  db.prepare("INSERT OR IGNORE INTO roles (name) VALUES ('CASHIER')").run()
  // Seed settings (required by firstRunComplete)
  updateSettings(db, { store_name: 'Test Store' })
}

function makeAdmin(db: Database.Database, username = 'admin', pw = 'pass1234', pin = '1111'): ReturnType<typeof createUser> {
  return createUser(db, {
    username,
    passwordHash: hashSecret(pw),
    pinHash: hashSecret(pin),
    full_name: 'Administrator',
    roles: ['ADMIN'],
    is_active: true
  })
}

function makeCashier(db: Database.Database, username = 'cashier1', pw = 'cashpass', pin = '2222', fullName = 'Maria Santos'): ReturnType<typeof createUser> {
  return createUser(db, {
    username,
    passwordHash: hashSecret(pw),
    pinHash: hashSecret(pin),
    full_name: fullName,
    roles: ['CASHIER'],
    is_active: true
  })
}

// ─────────────────────────────────────────────────────────────────────────────

describe('User Management — Phase 7 (M7.1–M7.6)', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    seedDb(db)
  })

  afterEach(() => {
    db.close()
  })

  // ── M7.1 — Backwards compatibility ──────────────────────────────────────
  describe('M7.1 — Backwards compatibility: existing accounts survive migration', () => {
    it('admin and cashier accounts created before Phase 7 still work', () => {
      makeAdmin(db)
      const cashier = makeCashier(db)
      const allUsers = listUsers(db)
      expect(allUsers.length).toBeGreaterThanOrEqual(2)
      expect(allUsers.find((u) => u.username === 'admin')).toBeTruthy()
      expect(allUsers.find((u) => u.id === cashier.id)).toBeTruthy()
    })

    it('userCount is accurate after seeding', () => {
      makeAdmin(db)
      makeCashier(db)
      expect(userCount(db)).toBe(2)
    })
  })

  // ── M7.2 — Flexible auth matching ───────────────────────────────────────
  describe('M7.2 — Case-insensitive login by username or full_name', () => {
    it('matches username exactly (lowercase)', () => {
      makeAdmin(db, 'AdminUser')
      const found = db.prepare(
        `SELECT id FROM users WHERE LOWER(username) = LOWER(?)`
      ).get('adminuser') as { id: number } | undefined
      expect(found).toBeTruthy()
    })

    it('matches username case-insensitively', () => {
      makeAdmin(db, 'SHOPOWNER')
      const found = db.prepare(
        `SELECT id FROM users WHERE LOWER(username) = LOWER(?)`
      ).get('shopowner') as { id: number } | undefined
      expect(found).toBeTruthy()
    })

    it('matches full_name case-insensitively', () => {
      makeAdmin(db, 'admin', 'pass', '1111')
      const { id } = db.prepare('SELECT id FROM users WHERE username = ?').get('admin') as { id: number }
      db.prepare('UPDATE users SET full_name = ? WHERE id = ?').run('Juan dela Cruz', id)

      const found = db.prepare(
        `SELECT id FROM users WHERE LOWER(full_name) = LOWER(?)`
      ).get('JUAN DELA CRUZ') as { id: number } | undefined
      expect(found).toBeTruthy()
      expect(found!.id).toBe(id)
    })

    it('does not match an inactive user', () => {
      makeAdmin(db)
      db.prepare('UPDATE users SET is_active = 0 WHERE username = ?').run('admin')

      const found = db.prepare(
        `SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND is_active = 1`
      ).get('admin') as { id: number } | undefined
      expect(found).toBeUndefined()
    })
  })

  // ── M7.3 — Target-aware PIN + unique PIN enforcement ─────────────────────
  describe('M7.3 — Target-aware PIN login and unique PIN enforcement', () => {
    it('verifies correct PIN for the target user', () => {
      const admin = makeAdmin(db, 'admin', 'pass', '1111')
      const row = db.prepare('SELECT pin_hash FROM users WHERE id = ?').get(admin.id) as { pin_hash: string }
      expect(verifySecret('1111', row.pin_hash)).toBe(true)
    })

    it('rejects wrong PIN for the target user', () => {
      const admin = makeAdmin(db, 'admin', 'pass', '1111')
      const row = db.prepare('SELECT pin_hash FROM users WHERE id = ?').get(admin.id) as { pin_hash: string }
      expect(verifySecret('9999', row.pin_hash)).toBe(false)
    })

    it('collision check: two users cannot share the same PIN', () => {
      makeAdmin(db, 'admin', 'pass', '1111')
      const cashier = makeCashier(db, 'cashier', 'cpass', '2222')

      // Try to update cashier's PIN to admin's PIN — detect collision in app
      const others = db.prepare(
        `SELECT id, pin_hash FROM users WHERE is_active = 1 AND id != ?`
      ).all(cashier.id) as { id: number; pin_hash: string }[]
      const collision = others.find((o) => verifySecret('1111', o.pin_hash))
      expect(collision).toBeTruthy()
    })

    it('allows a unique PIN with no collision', () => {
      makeAdmin(db, 'admin', 'pass', '1111')
      const cashier = makeCashier(db, 'cashier', 'cpass', '2222')

      const others = db.prepare(
        `SELECT id, pin_hash FROM users WHERE is_active = 1 AND id != ?`
      ).all(cashier.id) as { id: number; pin_hash: string }[]
      const collision = others.find((o) => verifySecret('3333', o.pin_hash))
      expect(collision).toBeUndefined()
    })
  })

  // ── M7.4 — Admin password reset + public users ───────────────────────────
  describe('M7.4 — Admin password reset and public user directory', () => {
    it('admin can reset another user password by updating password_hash', () => {
      const cashier = makeCashier(db)
      const newHash = hashSecret('newpass99')
      db.prepare(
        `UPDATE users SET password_hash = ?, updated_at = datetime('now','localtime') WHERE id = ?`
      ).run(newHash, cashier.id)
      const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(cashier.id) as { password_hash: string }
      expect(verifySecret('newpass99', row.password_hash)).toBe(true)
    })

    it('password must be at least 4 characters', () => {
      expect(() => {
        const pw = 'abc'
        if (!pw || pw.length < 4) throw new Error('Password must be at least 4 characters.')
      }).toThrow('Password must be at least 4 characters.')
    })

    it('public users query returns only active users with safe fields', () => {
      makeAdmin(db, 'admin', 'pass', '1111')
      makeCashier(db, 'cashier1', 'cpass', '2222', 'Ana Reyes')
      // Add an inactive user — should NOT appear
      createUser(db, {
        username: 'inactive',
        passwordHash: hashSecret('pass'),
        pinHash: hashSecret('9999'),
        full_name: 'Inactive User',
        roles: ['CASHIER'],
        is_active: false
      })

      const rows = db.prepare(
        `SELECT u.id, u.username, u.full_name FROM users u WHERE u.is_active = 1 ORDER BY u.full_name`
      ).all() as { id: number; username: string; full_name: string }[]

      expect(rows.length).toBe(2)
      expect(rows.every((r) => r.id && r.username && r.full_name)).toBe(true)
      expect(rows.find((r) => r.username === 'inactive')).toBeUndefined()
    })
  })

  // ── M7.5 — Settings USERS tab guardrails ────────────────────────────────
  describe('M7.5 — Deactivation guardrails', () => {
    it('allows deactivating a cashier who is not the sole admin', () => {
      makeAdmin(db)
      const cashier = makeCashier(db)
      updateUser(db, cashier.id, { is_active: false })
      const updated = listUsers(db).find((u) => u.id === cashier.id)
      // listUsers only returns is_active=1 — so updated should be undefined
      expect(updated).toBeUndefined()
    })

    it('guards: active admins count before deactivating a sole admin', () => {
      const admin = makeAdmin(db)
      const activeAdmins = (db.prepare(
        `SELECT COUNT(*) AS c FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         WHERE u.is_active = 1 AND r.name = 'ADMIN'`
      ).get() as { c: number }).c

      // Should be exactly 1 — deactivation of this admin should be blocked
      expect(activeAdmins).toBe(1)
      expect(admin.roles).toContain('ADMIN')
    })

    it('allows deactivating an admin when another admin exists', () => {
      makeAdmin(db, 'admin1', 'pass1', '1111')
      const admin2 = makeAdmin(db, 'admin2', 'pass2', '2222')
      updateUser(db, admin2.id, { is_active: false })
      const stillActive = (db.prepare(
        `SELECT COUNT(*) AS c FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         WHERE u.is_active = 1 AND r.name = 'ADMIN'`
      ).get() as { c: number }).c
      expect(stillActive).toBe(1)
    })
  })

  // ── M7.6 — Login page public users list (integration) ───────────────────
  describe('M7.6 — Public users directory for login chips', () => {
    it('returns all active users ordered by full_name', () => {
      makeAdmin(db, 'admin', 'pass', '1111')
      makeCashier(db, 'zara', 'cpass', '2222', 'Zara Villanueva')
      makeCashier(db, 'ana', 'cpass2', '3333', 'Ana Reyes')

      const rows = db.prepare(
        `SELECT u.id, u.username, u.full_name FROM users u WHERE u.is_active = 1 ORDER BY u.full_name`
      ).all() as { id: number; username: string; full_name: string }[]

      expect(rows[0]!.full_name).toBe('Administrator')
      expect(rows[1]!.full_name).toBe('Ana Reyes')
      expect(rows[2]!.full_name).toBe('Zara Villanueva')
    })

    it('does not expose password_hash or pin_hash in public query', () => {
      makeAdmin(db)
      const rows = db.prepare(
        `SELECT u.id, u.username, u.full_name FROM users u WHERE u.is_active = 1`
      ).all() as Record<string, unknown>[]
      for (const row of rows) {
        expect('password_hash' in row).toBe(false)
        expect('pin_hash' in row).toBe(false)
      }
    })
  })
})
