import { beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { readFileSync, existsSync } from 'node:fs'
import { runMigrations } from '../../database/migrations'
import {
  isSimplePosPayload,
  previewSimplePos,
  importSimplePos
} from '../simplePosImport'
import * as products from '../../repositories/products'

let db: Database.Database
beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys=ON')
  runMigrations(db)
  db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES ('admin','secure_pass_123','pin_123','Admin Owner')").run()
})

describe('v1.0.29 Simple POS JSON Import Engine', () => {
  it('correctly detects Simple POS JSON payload vs other formats', () => {
    expect(isSimplePosPayload('not json')).toBe(false)
    expect(isSimplePosPayload('{"foo":"bar"}')).toBe(false)
    expect(isSimplePosPayload(JSON.stringify({ products: [] }))).toBe(true)
    expect(isSimplePosPayload(JSON.stringify({ schemaVersion: 1, categories: [], products: [{ id: 1, name: 'Item' }] }))).toBe(true)
  })

  it('previews and sanitizes Simple POS items: auto-SKU, clamps negative stock, calculates retail value', () => {
    const payload = JSON.stringify({
      schemaVersion: 1,
      categories: [
        { id: 1, name: 'Hardware' },
        { id: 2, name: 'Electrical' }
      ],
      products: [
        { id: 1, name: 'Stranded Wire 2.0mm', categoryId: 2, costPrice: 0, sellPrice: 25.0, qty: 465, unit: 'pcs', isActive: true },
        { id: 2, name: 'Royu Outlet', categoryId: 1, costPrice: 0, sellPrice: 205.0, qty: -14, unit: 'pcs', isActive: true },
        { id: 3, name: 'Common Nail 23kg', categoryId: 1, costPrice: 0, sellPrice: 95.0, qty: 229.236, unit: 'kg', isActive: true },
        { id: 4, name: 'Old Discontinued Tool', categoryId: 1, costPrice: 0, sellPrice: 10.0, qty: 0, unit: 'pcs', isActive: false }
      ]
    })

    const preview = previewSimplePos(db, payload)
    expect(preview.total).toBe(3) // 3 active, 1 inactive skipped
    expect(preview.valid).toBe(3)
    expect(preview.invalid).toBe(0)
    expect(preview.active_count).toBe(3)
    expect(preview.inactive_count).toBe(1)
    expect(preview.categories_count).toBe(2)

    // Check SKU generation
    expect(preview.rows[0]?.sku).toBe('SP-0001')
    expect(preview.rows[1]?.sku).toBe('SP-0002')

    // Check negative stock clamped to 0
    expect(preview.rows[1]?.stock).toBe('0')

    // Check fractional quantity rounded to whole base integer
    expect(preview.rows[2]?.stock).toBe('229')

    // Total stock: 465 + 0 + 229 = 694
    expect(preview.total_stock).toBe(694)
  })

  it('imports atomically into database, creates categories, product units, and logs SIMPLE_POS_IMPORT movements', () => {
    const payload = JSON.stringify({
      categories: [{ id: 1, name: 'Hardware' }],
      products: [
        { id: 10, name: 'Steel Hammer 16oz', categoryId: 1, costPrice: 150.0, sellPrice: 250.0, qty: 15, unit: 'pcs', isActive: true }
      ]
    })

    const result = importSimplePos(db, payload, 'SKIP', 1)
    expect(result.created).toBe(1)
    expect(result.updated).toBe(0)
    expect(result.skipped).toBe(0)
    expect(result.total_stock).toBe(15)

    // Check created product
    const p = products.findBySku(db, 'SP-0010')
    expect(p).toBeDefined()
    expect(p?.name).toBe('Steel Hammer 16oz')
    expect(p?.category_name).toBe('Hardware')
    expect(p?.default_price_c).toBe(25000) // ₱250.00 in centavos
    expect(p?.purchase_cost_c).toBe(15000) // ₱150.00 in centavos
    expect(p?.stock).toBe(15)

    // Check inventory movements
    const movement = db.prepare("SELECT * FROM inventory_movements WHERE source = 'SIMPLE_POS_IMPORT'").get() as { quantity_change: number; reason: string }
    expect(movement).toBeDefined()
    expect(movement.quantity_change).toBe(15)
    expect(movement.reason).toContain('Simple POS import')
  })

  it('guarantees user safety: never alters, overwrites or touches existing users or credentials', () => {
    const userBefore = db.prepare('SELECT * FROM users WHERE id = 1').get() as { username: string; password_hash: string }
    expect(userBefore.username).toBe('admin')
    expect(userBefore.password_hash).toBe('secure_pass_123')

    // Payload containing foreign malicious/conflicting user accounts
    const payloadWithUsers = JSON.stringify({
      users: [
        { id: 1, username: 'hacked_admin', passwordHash: 'corrupted_hash', fullName: 'Hacker' }
      ],
      categories: [{ id: 5, name: 'Paints' }],
      products: [
        { id: 100, name: 'Boysen White 1L', categoryId: 5, sellPrice: 180.0, qty: 5, unit: 'pcs', isActive: true }
      ]
    })

    importSimplePos(db, payloadWithUsers, 'SKIP', 1)

    // Verify existing user account is 100% UNTOUCHED
    const userAfter = db.prepare('SELECT * FROM users WHERE id = 1').get() as { username: string; password_hash: string }
    expect(userAfter.username).toBe('admin')
    expect(userAfter.password_hash).toBe('secure_pass_123')
    expect((db.prepare('SELECT COUNT(*) c FROM users').get() as { c: number }).c).toBe(1)
  })

  it('successfully validates and imports actual user file if present in Downloads', () => {
    const testFile = '/home/ian/Downloads/simple_pos_secure_20260923084234.json'
    if (!existsSync(testFile)) {
      console.log('Skipping real file test, not found')
      return
    }

    const raw = readFileSync(testFile, 'utf8')
    const preview = previewSimplePos(db, raw)
    expect(preview.total).toBe(892)
    expect(preview.valid).toBe(892)
    expect(preview.invalid).toBe(0)
    expect(preview.categories_count).toBe(3)
    expect(preview.total_stock).toBe(45355)

    const result = importSimplePos(db, raw, 'SKIP', 1)
    expect(result.created).toBe(892)
    expect(result.total_stock).toBe(45355)

    // Check DB counts
    const count = (db.prepare('SELECT COUNT(*) c FROM products').get() as { c: number }).c
    expect(count).toBe(892)
    const stockSum = (db.prepare('SELECT SUM(stock) s FROM products').get() as { s: number }).s
    expect(stockSum).toBe(45355)
  })
})
