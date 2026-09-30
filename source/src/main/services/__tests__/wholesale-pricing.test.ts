import { beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import * as products from '../../repositories/products'

let db: Database.Database
beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys=ON')
  runMigrations(db)
  db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES ('admin','x','x','Admin')").run()
})

const baseProduct = {
  category_id: null as number | null,
  name: 'Lucky Me Pancit Canton',
  sku: 'PC-001',
  barcode: '4800016644409',
  description: 'Original Flavor 80g',
  base_unit: 'pc',
  purchase_cost_c: 1200, // ₱12.00
  default_price_c: 1500, // ₱15.00
  wholesale_price_c: 1350, // ₱13.50 (Wholesale)
  wholesale_min_qty: 10, // Min 10 pcs
  low_stock_threshold: 10,
  supplier_id: null as number | null,
  has_expiration: false,
  notes: 'High velocity item',
  units: [
    { name: 'pc', conversion_to_base: 1, barcode: '4800016644409', selling_price_c: 1500, is_default: true }
  ]
}

describe('v1.0.43 Wholesale Tiering & Volume Discounts', () => {
  it('creates product with wholesale price and min qty', () => {
    const created = products.createProduct(db, baseProduct, 1)
    expect(created.wholesale_price_c).toBe(1350)
    expect(created.wholesale_min_qty).toBe(10)

    const retrieved = products.getProduct(db, created.id)
    expect(retrieved.wholesale_price_c).toBe(1350)
    expect(retrieved.wholesale_min_qty).toBe(10)
  })

  it('updates wholesale pricing correctly', () => {
    const created = products.createProduct(db, baseProduct, 1)

    // Update wholesale price to ₱13.00 with min 12 pcs
    const updated = products.updateProduct(
      db,
      created.id,
      {
        wholesale_price_c: 1300,
        wholesale_min_qty: 12
      },
      1
    )
    expect(updated.wholesale_price_c).toBe(1300)
    expect(updated.wholesale_min_qty).toBe(12)

    // Clear wholesale pricing (set to null)
    const cleared = products.updateProduct(
      db,
      created.id,
      {
        wholesale_price_c: null,
        wholesale_min_qty: null
      },
      1
    )
    expect(cleared.wholesale_price_c).toBeNull()
    expect(cleared.wholesale_min_qty).toBeNull()
  })

  it('validates wholesale fields: rejects negative prices or invalid min quantities', () => {
    expect(() =>
      products.createProduct(
        db,
        {
          ...baseProduct,
          wholesale_price_c: -500
        },
        1
      )
    ).toThrow('Wholesale price cannot be negative')

    expect(() =>
      products.createProduct(
        db,
        {
          ...baseProduct,
          wholesale_min_qty: 0
        },
        1
      )
    ).toThrow('Minimum wholesale quantity must be at least 1')
  })

  it('searches and lists products with wholesale pricing intact', () => {
    products.createProduct(db, baseProduct, 1)
    const result = products.searchProducts(db, { q: 'Pancit', status: 'ACTIVE', limit: 10 })
    expect(result.rows.length).toBe(1)
    expect(result.rows[0]?.wholesale_price_c).toBe(1350)
    expect(result.rows[0]?.wholesale_min_qty).toBe(10)
  })
})
