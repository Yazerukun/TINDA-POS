import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../main/database/migrations'
import { hashSecret } from '../main/security/passwords'
import * as users from '../main/repositories/users'
import * as products from '../main/repositories/products'
import { isWeighableUnit } from '../shared/format'

function makeDb(): Database.Database {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
  return db
}

describe('Weighable Kilo & Decimal Quantity Checkout', () => {
  it('identifies weighable units correctly', () => {
    expect(isWeighableUnit('kilo')).toBe(true)
    expect(isWeighableUnit('kg')).toBe(true)
    expect(isWeighableUnit('KLS')).toBe(true)
    expect(isWeighableUnit('g')).toBe(true)
    expect(isWeighableUnit('liter')).toBe(true)
    expect(isWeighableUnit('pc')).toBe(false)
    expect(isWeighableUnit('can')).toBe(false)
    expect(isWeighableUnit('bottle')).toBe(false)
  })

  it('allows adjustStock with fractional / decimal weights', () => {
    const db = makeDb()
    const u = users.createUser(db, {
      username: 'cashier1',
      passwordHash: hashSecret('secret'),
      pinHash: hashSecret('1234'),
      full_name: 'Cashier One',
      roles: ['CASHIER']
    })

    // Create a weighable test product with initial stock 10.5 kg
    const prod = products.createProduct(
      db,
      {
        name: 'Fresh Pork Liempo',
        sku: 'LIEMPO-01',
        barcode: null,
        description: null,
        category_id: null,
        low_stock_threshold: 5,
        base_unit: 'kilo',
        initial_stock_base: 10.5,
        purchase_cost_c: 18000,
        default_price_c: 24000,
        units: [{ name: 'kilo', conversion_to_base: 1, selling_price_c: 24000 }]
      },
      u.id
    )

    expect(prod.stock).toBe(10.5)

    // Sell 2.25 kilos
    products.adjustStock(db, prod.id, -2.25, 'SALE', 'Test Sale 2.25kg', u.id, 'TXN-KILO-001')
    const updated = products.getProduct(db, prod.id)
    expect(updated.stock).toBe(8.25)

    // Restock 1.5 kilos
    products.adjustStock(db, prod.id, 1.5, 'PURCHASE', 'Test Restock 1.5kg', u.id, 'TXN-KILO-002')
    const restocked = products.getProduct(db, prod.id)
    expect(restocked.stock).toBe(9.75)
  })
})
