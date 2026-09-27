import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'
import { migrations, runMigrations } from '../migrations'

describe('v1.0.8 shift numbering migration', () => {
  it('backfills per-user sequential shift numbers over legacy rows and stays integer-perfect', () => {
    // Simulate a v1.0.7 database (migrations 1-4) with historical shifts.
    const db = new Database(':memory:')
    db.pragma('foreign_keys=ON')
    db.exec('CREATE TABLE app_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT (datetime(\'now\',\'localtime\')))')
    for (const migration of migrations.filter((m) => m.version < 5)) {
      db.exec(migration.sql)
      db.prepare('INSERT INTO app_migrations(version,name) VALUES(?,?)').run(migration.version, migration.name)
    }
    db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES('ana','x','x','Ana')").run()
    db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES('beth','x','x','Beth')").run()
    // Legacy shift rows carry no shift_no (column does not exist yet at v1.0.7).
    for (const userId of [1, 1, 1, 2, 2]) {
      db.prepare('INSERT INTO shifts(user_id,starting_cash_c,expected_cash_c) VALUES(?,100000,100000)').run(userId)
    }
    db.prepare("INSERT INTO products(name,sku,stock) VALUES('Coffee','COF-1',10)").run()

    // v1.0.8 boot: the migration engine runs, adding migration 5.
    runMigrations(db)

    const shifts = db
      .prepare('SELECT id, user_id, shift_no FROM shifts ORDER BY id')
      .all() as { id: number; user_id: number; shift_no: number | null }[]
    // Numbering is sequential per cashier in shift-open order.
    expect(shifts.map((s) => [s.user_id, s.shift_no])).toEqual([
      [1, 1],
      [1, 2],
      [1, 3],
      [2, 1],
      [2, 2]
    ])
    expect(shifts.every((s) => Number.isInteger(s.shift_no) && (s.shift_no ?? 0) > 0)).toBe(true)
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok')
    // No data loss in the migrated tables.
    expect((db.prepare('SELECT COUNT(*) c FROM products').get() as { c: number }).c).toBe(1)
    expect((db.prepare('SELECT COUNT(*) c FROM users').get() as { c: number }).c).toBe(2)
  })

  it('new shift_numbering migration is registered as version 5', () => {
    expect(migrations.find((m) => m.version === 5)?.name).toBe('shift_numbering')
  })
})