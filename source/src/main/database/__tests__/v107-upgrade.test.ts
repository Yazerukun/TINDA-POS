import { beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { migrations, runMigrations } from '../migrations'
import * as products from '../../repositories/products'
import * as shifts from '../../repositories/shifts'
import * as cashCounts from '../../repositories/cashCounts'

let db: Database.Database
beforeEach(() => {
  db = new Database(':memory:'); db.pragma('foreign_keys=ON'); runMigrations(db)
  db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES ('ana','x','x','Ana')").run()
})

describe('v1.0.6 to v1.0.7 upgrade preserves data (user feedback release)', () => {
  it('keeps the v1.0.7 baseline schema; v1.0.8 adds only the documented migration 5', () => {
    // v1.0.7 is a bug-fix / feature release on the v1.0.6 schema (no new DB
    // migration). The v1.0.8 plan intentionally adds exactly one migration:
    // version 5 (shift_numbering). Any migration beyond that must ship with
    // its own upgrade test.
    expect(migrations.filter((m) => m.version !== 5 && m.version > 4)).toEqual([])
    const shiftNumbering = migrations.find((m) => m.version === 5)
    expect(shiftNumbering?.name).toBe('shift_numbering')
  })

  it('re-running the migration engine on a real v1.0.6 database keeps all data and integrity ok', () => {
    // Build a realistic v1.0.6 database using the same repositories the app uses.
    const product = products.createProduct(db, {
      category_id: null, name: 'Coke Mismo', sku: 'CM-1', barcode: '480000000001',
      description: 'Coke Mismo 500ml', base_unit: 'bottle', purchase_cost_c: 1500, default_price_c: 2000,
      low_stock_threshold: 5, supplier_id: null, has_expiration: false, notes: 'suki order',
      units: [
        { name: 'bottle', conversion_to_base: 1, barcode: null, selling_price_c: 2000, is_default: true },
        { name: 'case', conversion_to_base: 24, barcode: '480000000024', selling_price_c: 48000, is_default: false }
      ],
      initial_stock_base: 24
    }, 1)
    const shift = shifts.openShift(db, 1, 500000)
    const cc = cashCounts.save(db, 1, { shift_id: shift.id, quantities: [4, 1, 2, 0, 1, 1, 0, 1, 0, 0, 0], notes: 'short by 20' })
    const before = {
      products: (db.prepare('SELECT COUNT(*) c FROM products').get() as { c: number }).c,
      units: (db.prepare('SELECT COUNT(*) c FROM product_units').get() as { c: number }).c,
      cashCounts: (db.prepare('SELECT COUNT(*) c FROM cash_counts').get() as { c: number }).c,
      movements: (db.prepare('SELECT COUNT(*) c FROM inventory_movements').get() as { c: number }).c,
      shifts: (db.prepare('SELECT COUNT(*) c FROM shifts').get() as { c: number }).c
    }
    expect(product.units.map((u) => u.name)).toEqual(['bottle', 'case'])
    expect(cc.expected_cash_c).toBe(shift.starting_cash_c)
    expect(cc.status).toBe('SHORT')

    // Simulate the v1.0.7 app boot: the same migration engine runs again.
    runMigrations(db)

    expect(db.pragma('integrity_check', { simple: true })).toBe('ok')
    const after = {
      products: (db.prepare('SELECT COUNT(*) c FROM products').get() as { c: number }).c,
      units: (db.prepare('SELECT COUNT(*) c FROM product_units').get() as { c: number }).c,
      cashCounts: (db.prepare('SELECT COUNT(*) c FROM cash_counts').get() as { c: number }).c,
      movements: (db.prepare('SELECT COUNT(*) c FROM inventory_movements').get() as { c: number }).c,
      shifts: (db.prepare('SELECT COUNT(*) c FROM shifts').get() as { c: number }).c
    }
    expect(after).toEqual(before)
    const saved = cashCounts.get(db, cc.id)
    expect(saved.expected_cash_c).toBe(cc.expected_cash_c)
    expect(saved.actual_cash_c).toBe(cc.actual_cash_c)
    expect(saved.status).toBe('SHORT')
    expect(products.getProduct(db, product.id).units.map((u) => u.name)).toEqual(['bottle', 'case'])
  })
})