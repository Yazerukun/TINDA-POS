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

  it('restores complex store data with interdependent foreign keys without FK error', async () => {
    // Populate interconnected entities
    db.prepare("INSERT INTO shifts(user_id, status) VALUES (1, 'OPENED')").run()
    db.prepare("INSERT INTO customers(full_name) VALUES ('Juan Dela Cruz')").run()
    db.prepare(`
      INSERT INTO sales(transaction_no, user_id, customer_id, shift_id, total_c)
      VALUES ('TX-001', 1, 1, 1, 2000)
    `).run()
    db.prepare(`
      INSERT INTO sale_items(sale_id, product_id, product_name, unit_name, qty, qty_base, unit_price_c, subtotal_c)
      VALUES (1, 1, 'Coke', 'bottle', 1, 1, 2000, 2000)
    `).run()
    db.prepare(`
      INSERT INTO stock_batches(product_id, label, quantity)
      VALUES (1, 'BATCH-01', 9)
    `).run()
    db.prepare(`
      INSERT INTO inventory_movements(product_id, quantity_before, quantity_change, quantity_after, movement_type)
      VALUES (1, 10, -1, 9, 'SALE')
    `).run()
    db.prepare(`
      INSERT INTO batch_movements(batch_id, movement_id, sale_item_id, quantity_change)
      VALUES (1, 1, 1, -1)
    `).run()

    // Export complete snapshot
    const backupJson = await exportWindowsBackup(db, '4.1.3')

    // Wipe test db or create a brand new target db
    const targetDb = new Database(':memory:')
    targetDb.pragma('foreign_keys = ON')
    runMigrations(targetDb)

    // Restore should succeed completely without FOREIGN KEY constraint failed error
    const { counts } = await importWindowsBackup(targetDb, backupJson, { safetyBackup: false })
    expect(counts.sales).toBe(1)
    expect(counts.shifts).toBe(1)
    expect(counts.sale_items).toBe(1)
    expect(counts.batch_movements).toBe(1)
    expect(targetDb.prepare('SELECT COUNT(*) AS c FROM sales').get()).toEqual({ c: 1 })
    expect(targetDb.prepare('SELECT COUNT(*) AS c FROM shifts').get()).toEqual({ c: 1 })
  })

  it('imports real-world web format backup file seamlessly', async () => {
    const fs = await import('node:fs')
    const samplePath = '/home/ian/Downloads/tinda-backup-2026-10-11.tinda-backup'
    if (fs.existsSync(samplePath)) {
      const text = fs.readFileSync(samplePath, 'utf8')
      const targetDb = new Database(':memory:')
      targetDb.pragma('foreign_keys = ON')
      runMigrations(targetDb)

      const { counts } = await importWindowsBackup(targetDb, text, { safetyBackup: false })
      expect(counts.products).toBeGreaterThan(0)
      expect(counts.categories).toBeGreaterThan(0)
    }
  })
})