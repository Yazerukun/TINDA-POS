import { beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import * as products from '../../repositories/products'
import { listReceiving } from '../../repositories/inventory'

let db: Database.Database
let productId: number

beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys=ON')
  runMigrations(db)
  db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES ('admin','x','x','Admin User')").run()
  db.prepare("INSERT INTO suppliers(name) VALUES ('ABC Trading')").run()
  productId = products.createProduct(db, {
    category_id: null, name: 'Coke 1L', sku: 'COKE-1L', barcode: null, description: null,
    base_unit: 'bottle', purchase_cost_c: 3000, default_price_c: 4000, low_stock_threshold: 5,
    supplier_id: null, has_expiration: false, notes: null,
    units: [{ name: 'bottle', conversion_to_base: 1, barcode: null, selling_price_c: 4000, is_default: true }],
    initial_stock_base: 10
  }, 1).id
})

describe('v1.0.5 Stock Receiving history', () => {
  it('returns structured restock fields without mutating stock a second time', () => {
    products.adjustStock(db, productId, 20, 'PURCHASE', 'Restock: 20 bottle', 1, 'DR-00123', {
      source: 'RESTOCK', supplier_id: 1, received_unit: 'bottle', received_quantity: 20,
      unit_cost_c: 3000, notes: 'Morning delivery'
    })
    const result = listReceiving(db, { source: 'RESTOCK', supplier_id: 1, search: 'Coke' })
    expect(result.total).toBe(1)
    expect(result.rows[0]).toMatchObject({
      product_name: 'Coke 1L', quantity_received: 20, received_unit: 'bottle', base_quantity: 20,
      previous_stock: 10, new_stock: 30, supplier_name: 'ABC Trading', unit_cost_c: 3000,
      total_cost_c: 60000, reference: 'DR-00123', notes: 'Morning delivery',
      received_by: 'Admin User', source: 'RESTOCK'
    })
    expect(products.getProduct(db, productId).stock).toBe(30)
  })

  it('includes purchase and opening stock, excludes negative movements, filters dates, and sees new rows immediately', () => {
    products.adjustStock(db, productId, 5, 'PURCHASE', 'Purchase receiving', 1, 'PPO-1', { source: 'PURCHASE' })
    products.adjustStock(db, productId, -2, 'DAMAGE', 'Damaged', 1)
    expect(listReceiving(db).rows.map(row => row.source)).toEqual(['PURCHASE', 'INITIAL STOCK'])
    products.adjustStock(db, productId, 3, 'PURCHASE', 'Manual receiving', 1, undefined, { source: 'MANUAL RECEIVING' })
    expect(listReceiving(db, { source: 'MANUAL RECEIVING', from: '2000-01-01', to: '2999-12-31' }).rows).toHaveLength(1)
    expect(products.getProduct(db, productId).stock).toBe(16)
  })
})
