import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'
import { migrations, runMigrations } from '../migrations'

describe('v1.0.5 to v1.0.6 cash count migration', () => {
  it('keeps v1.0.5 data and passes integrity check', () => {
    const db = new Database(':memory:')
    db.pragma('foreign_keys=ON')
    db.exec('CREATE TABLE app_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT (datetime(\'now\',\'localtime\')))')
    for (const migration of migrations.filter((m) => m.version < 4)) {
      db.exec(migration.sql)
      db.prepare('INSERT INTO app_migrations(version,name) VALUES(?,?)').run(migration.version, migration.name)
    }
    db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES('cashier','hash','pin','Cashier')").run()
    db.prepare("INSERT INTO shifts(user_id,starting_cash_c,expected_cash_c) VALUES(1,100000,100000)").run()
    db.prepare("INSERT INTO products(name,sku,stock) VALUES('Coffee','COF-1',10)").run()
    runMigrations(db)
    expect(db.prepare('SELECT name FROM products WHERE sku=?').get('COF-1')).toMatchObject({ name: 'Coffee' })
    expect(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cash_counts'").get()).toBeTruthy()
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok')
  })
})
