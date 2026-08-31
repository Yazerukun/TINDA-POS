import type Database from 'better-sqlite3'
import type { Role, User } from '@shared/types'

interface UserRow {
  id: number
  username: string
  password_hash: string
  pin_hash: string
  full_name: string
  is_active: number
  created_at: string
}

const SELECT_USER = `SELECT u.id, u.username, u.password_hash, u.pin_hash, u.full_name, u.is_active, u.created_at FROM users u`

export function listUsers(db: Database.Database): User[] {
  const rows = db
    .prepare(`${SELECT_USER} WHERE u.is_active = 1 ORDER BY u.username`)
    .all() as UserRow[]
  return rows.map((r) => {
    const roles = (
      db
        .prepare(
          `SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ? ORDER BY r.name`
        )
        .all(r.id) as { name: Role['name'] }[]
    ).map((x) => x.name)
    return { id: r.id, username: r.username, full_name: r.full_name, pin: '', roles, is_active: !!r.is_active, created_at: r.created_at }
  })
}

export function getUserRoles(db: Database.Database, userId: number): Role['name'][] {
  return (
    db
      .prepare(
        `SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ? ORDER BY r.name`
      )
      .all(userId) as { name: Role['name'] }[]
  ).map((x) => x.name)
}

export function getUserByUsername(db: Database.Database, username: string): UserRow | undefined {
  return db.prepare(`${SELECT_USER} WHERE u.username = ?`).get(username) as UserRow | undefined
}

export function getUserById(db: Database.Database, id: number): UserRow | undefined {
  return db.prepare(`${SELECT_USER} WHERE u.id = ?`).get(id) as UserRow | undefined
}

export function getUserByPin(db: Database.Database, pinHash: string): UserRow | undefined {
  return db.prepare(`${SELECT_USER} WHERE u.pin_hash = ? AND u.is_active = 1`).get(pinHash) as UserRow | undefined
}

export function createUser(
  db: Database.Database,
  input: { username: string; passwordHash: string; pinHash: string; full_name: string; roles: string[]; is_active?: boolean }
): User {
  const info = db
    .prepare(
      `INSERT INTO users (username, password_hash, pin_hash, full_name, is_active) VALUES (?, ?, ?, ?, ?)`
    )
    .run(input.username, input.passwordHash, input.pinHash, input.full_name, input.is_active === false ? 0 : 1)
  const id = Number(info.lastInsertRowid)
  assignRoles(db, id, input.roles)
  return listUsers(db).find((u) => u.id === id)!
}

export function assignRoles(db: Database.Database, userId: number, roles: string[]): void {
  db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(userId)
  for (const roleName of roles) {
    const role = db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName) as { id: number } | undefined
    if (role) db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, role.id)
  }
}

export function updateUser(
  db: Database.Database,
  id: number,
  patch: Partial<{ username: string; passwordHash: string; pinHash: string; full_name: string; roles: string[]; is_active: boolean }>
): User {
  const cur = getUserById(db, id)
  if (!cur) throw new Error('User not found')
  const username = patch.username ?? cur.username
  const fullName = patch.full_name ?? cur.full_name
  const passwordHash = patch.passwordHash ?? cur.password_hash
  const pinHash = patch.pinHash ?? cur.pin_hash
  const isActive = patch.is_active ?? !!cur.is_active
  db.prepare(
    `UPDATE users SET username = ?, full_name = ?, password_hash = ?, pin_hash = ?, is_active = ?, updated_at = datetime('now','localtime') WHERE id = ?`
  ).run(username, fullName, passwordHash, pinHash, isActive ? 1 : 0, id)
  if (patch.roles) assignRoles(db, id, patch.roles)
  return listUsers(db).find((u) => u.id === id)!
}

export function updatePassword(db: Database.Database, id: number, passwordHash: string, pinHash?: string): void {
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(
    passwordHash,
    id
  )
  if (pinHash) db.prepare(`UPDATE users SET pin_hash = ? WHERE id = ?`).run(pinHash, id)
}

export function userCount(db: Database.Database): number {
  return (db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }).c
}

export function listRoles(db: Database.Database): string[] {
  return (db.prepare('SELECT name FROM roles ORDER BY id').all() as { name: string }[]).map((r) => r.name)
}