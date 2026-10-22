import { beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import * as products from '../products'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys=ON')
  runMigrations(db)
  db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES ('admin','x','x','Admin')").run()

  // Seed sample products representing Philippine sari-sari store inventory
  // 1. Camel Stick (has "Stick" in name, plus base_unit "stick")
  products.createProduct(db, {
    category_id: null,
    description: null,
    supplier_id: null,
    notes: null,
    name: 'Camel Stick',
    sku: 'SKU-CAMEL',
    barcode: '480001',
    base_unit: 'stick',
    purchase_cost_c: 800,
    default_price_c: 1000,
    low_stock_threshold: 5,
    has_expiration: false,
    units: [
      { name: 'stick', conversion_to_base: 1, barcode: '480001-STK', selling_price_c: 1000, is_default: true },
      { name: 'pack', conversion_to_base: 20, barcode: '480001-PCK', selling_price_c: 19000, is_default: false }
    ]
  }, 1)

  // 2. Marlboro Red (does NOT have "Stick" in name, but has unit "stick")
  products.createProduct(db, {
    category_id: null,
    description: null,
    supplier_id: null,
    notes: null,
    name: 'Marlboro Red',
    sku: 'SKU-MARL',
    barcode: '480002',
    base_unit: 'stick',
    purchase_cost_c: 800,
    default_price_c: 1100,
    low_stock_threshold: 5,
    has_expiration: false,
    units: [
      { name: 'stick', conversion_to_base: 1, barcode: '480002-STK', selling_price_c: 1100, is_default: true },
      { name: 'pack', conversion_to_base: 20, barcode: '480002-PCK', selling_price_c: 19500, is_default: false }
    ]
  }, 1)

  // 3. Coca Cola 1.5L
  products.createProduct(db, {
    category_id: null,
    description: null,
    supplier_id: null,
    notes: null,
    name: 'Coca Cola 1.5L',
    sku: 'SKU-COKE',
    barcode: '480003',
    base_unit: 'bottle',
    purchase_cost_c: 6500,
    default_price_c: 8000,
    low_stock_threshold: 5,
    has_expiration: false,
    units: [
      { name: 'bottle', conversion_to_base: 1, barcode: '480003-BTL', selling_price_c: 8000, is_default: true },
      { name: 'case', conversion_to_base: 12, barcode: '480003-CSE', selling_price_c: 90000, is_default: false }
    ]
  }, 1)

  // 4. Zest-O Orange (hyphenated brand)
  products.createProduct(db, {
    category_id: null,
    description: null,
    supplier_id: null,
    notes: null,
    name: 'Zest-O Orange',
    sku: 'SKU-ZESTO',
    barcode: '480004',
    base_unit: 'piece',
    purchase_cost_c: 1200,
    default_price_c: 1500,
    low_stock_threshold: 5,
    has_expiration: false,
    units: [
      { name: 'piece', conversion_to_base: 1, barcode: '480004-PC', selling_price_c: 1500, is_default: true }
    ]
  }, 1)
})

describe('POS Search Precision & Multi-Unit Search Parity', () => {
  it('searching "marlboro" must ONLY return Marlboro Red, never Camel Stick', () => {
    const res = products.searchProducts(db, { q: 'marlboro', status: 'ACTIVE' })
    expect(res.rows.map((p) => p.name)).toContain('Marlboro Red')
    expect(res.rows.map((p) => p.name)).not.toContain('Camel Stick')
  })

  it('searching "marlboro stick" matches Marlboro Red via name + unit token matching', () => {
    const res = products.searchProducts(db, { q: 'marlboro stick', status: 'ACTIVE' })
    expect(res.rows.map((p) => p.name)).toContain('Marlboro Red')
    expect(res.rows.map((p) => p.name)).not.toContain('Camel Stick')
    expect(res.rows.map((p) => p.name)).not.toContain('Coca Cola 1.5L')
  })

  it('searching "camel" must return Camel Stick and not Marlboro Red', () => {
    const res = products.searchProducts(db, { q: 'camel', status: 'ACTIVE' })
    expect(res.rows.map((p) => p.name)).toContain('Camel Stick')
    expect(res.rows.map((p) => p.name)).not.toContain('Marlboro Red')
  })

  it('searching single letter "c" does not match every product just because of unit name "piece" or "pack"', () => {
    const res = products.searchProducts(db, { q: 'c', status: 'ACTIVE' })
    const names = res.rows.map((p) => p.name)
    // "Camel Stick" has 'c', "Coca Cola 1.5L" has 'c'
    expect(names).toContain('Camel Stick')
    expect(names).toContain('Coca Cola 1.5L')
    // "Marlboro Red" has NO 'c' in name, should NOT match on single letter "c" just because it has a "pack" unit!
    expect(names).not.toContain('Marlboro Red')
  })

  it('searching unit barcode directly returns the exact parent product', () => {
    const res = products.searchProducts(db, { q: '480002-STK', status: 'ACTIVE' })
    expect(res.rows).toHaveLength(1)
    expect(res.rows[0]?.name).toBe('Marlboro Red')
  })

  it('hyphen-agnostic search "zesto" matches "Zest-O Orange"', () => {
    const res = products.searchProducts(db, { q: 'zesto', status: 'ACTIVE' })
    expect(res.rows.map((p) => p.name)).toContain('Zest-O Orange')
  })
})
