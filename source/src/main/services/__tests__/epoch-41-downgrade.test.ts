import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import { initializeEpochLock } from '../../database/connection'

describe('Epoch 41 Cryptographic Anti-Downgrade System', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    runMigrations(db)
  })

  afterEach(() => {
    db.close()
  })

  it('successfully migrates to Epoch 41 and initializes app_session_auth', () => {
    const row = db.prepare('SELECT * FROM app_session_auth WHERE id = 1').get() as { epoch: number; session_token: string }
    expect(row).toBeDefined()
    expect(row.epoch).toBe(41)
  })

  it('allows normal product insert when epoch is 41', () => {
    // Insert a category first
    const cat = db.prepare('INSERT INTO categories (name) VALUES (?)').run('Test Category')
    const res = db.prepare(`
      INSERT INTO products (category_id, name, sku, barcode, purchase_cost_c, default_price_c, stock)
      VALUES (?, 'Item 1', 'SKU-1', 'BAR-1', 100, 200, 10)
    `).run(cat.lastInsertRowid)
    expect(res.changes).toBe(1)
  })

  it('aborts insert into products if epoch is downgraded below 41', () => {
    const cat = db.prepare('INSERT INTO categories (name) VALUES (?)').run('Test Category')
    // Simulate legacy runtime downgrade (epoch < 41)
    db.prepare('UPDATE app_session_auth SET epoch = 39 WHERE id = 1').run()

    expect(() => {
      db.prepare(`
        INSERT INTO products (category_id, name, sku, barcode, purchase_cost_c, default_price_c, stock)
        VALUES (?, 'Item Downgraded', 'SKU-DOWN', 'BAR-DOWN', 100, 200, 10)
      `).run(cat.lastInsertRowid)
    }).toThrow(/EPOCH_DOWNGRADE_LOCKED/)
  })

  it('aborts insert into sales if app_session_auth row is missing', () => {
    // Delete epoch session
    db.prepare('DELETE FROM app_session_auth').run()

    expect(() => {
      db.prepare(`
        INSERT INTO sales (transaction_no, total_c, status)
        VALUES ('TXN-EPOCH-TEST', 500, 'COMPLETED')
      `).run()
    }).toThrow(/EPOCH_DOWNGRADE_LOCKED/)
  })

  it('restores write capability once Epoch 41 is initialized', () => {
    // Break epoch
    db.prepare('UPDATE app_session_auth SET epoch = 10 WHERE id = 1').run()

    // Restore via initializeEpochLock
    initializeEpochLock(db)

    const cat = db.prepare('INSERT INTO categories (name) VALUES (?)').run('Restored Category')
    const res = db.prepare(`
      INSERT INTO products (category_id, name, sku, barcode, purchase_cost_c, default_price_c, stock)
      VALUES (?, 'Item Restored', 'SKU-RES', 'BAR-RES', 100, 200, 10)
    `).run(cat.lastInsertRowid)
    expect(res.changes).toBe(1)
  })
})
