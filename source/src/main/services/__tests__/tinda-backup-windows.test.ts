import { beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import { exportWindowsBackup, importWindowsBackup, snapshotWindows } from '../tindaBackupWindows'

let db: Database.Database
beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
  db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES ('admin','x','x','Admin')").run()
  db.prepare("INSERT INTO categories(name) VALUES ('Drinks')").run()
  db.prepare(
    `INSERT INTO products(category_id,name,sku,base_unit,default_price_c)
     VALUES (1,'Coke','CM-1','bottle',2000)`
  ).run()
})

describe('tinda-backup windows adapter', () => {
  it('snapshot captures all canonical tables present', async () => {
    const file = await snapshotWindows(db, '1.0.18')
    expect(file.manifest.source.platform).toBe('windows')
    const names = file.data.tables.map((t) => t.name)
    expect(names).toContain('products')
    expect(names).toContain('categories')
    expect(file.data.settings).not.toBeNull()
    const saved = file.checksum.length
    expect(saved).toBe(64)
  })

  it('restore replaces all rows and re-runs integrity check', async () => {
    const text = await exportWindowsBackup(db, '1.0.18')
    db.prepare('DELETE FROM products').run()
    db.prepare('DELETE FROM categories').run()
    expect(db.prepare('SELECT COUNT(*) AS c FROM products').get()).toEqual({ c: 0 })

    const { counts, unsupported } = await importWindowsBackup(db, text, { safetyBackup: false })
    expect(counts.products).toBe(1)
    expect(counts.categories).toBe(1)
    expect(counts.users).toBe(1)
    expect(unsupported.unsupportedTables).toEqual([])
    expect(db.prepare('SELECT name, base_unit FROM products').get()).toEqual({ name: 'Coke', base_unit: 'bottle' })
  })

  it('rejects tampered backups', async () => {
    const text = await exportWindowsBackup(db, '1.0.18')
    const file = JSON.parse(text) as { data: { tables: { name: string; rows: { name: string }[] }[] } }
    file.data.tables.find((t) => t.name === 'products')!.rows[0]!.name = 'Pepsi'
    await expect(importWindowsBackup(db, JSON.stringify(file), { safetyBackup: false })).rejects.toThrow(/checksum mismatch/i)
  })

  it('rejects backups with tables Windows cannot restore', async () => {
    const file = await snapshotWindows(db, '1.0.18')
    file.manifest.source.platform = 'android'
    file.data.tables.push({ name: 'sessions', rows: [{ id: 1, token: 'x' }] })
    file.checksum = 'bad'
    await expect(importWindowsBackup(db, JSON.stringify(file), { safetyBackup: false })).rejects.toThrow(/integrity|checksum|Invalid/i)
  })
})