import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let dataDir: string

beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-custom-price-'))
  process.env.TINDA_DATA_DIR = dataDir
})
afterAll(() => {
  try { closeDb() } catch { /* ignore */ }
  try { rmSync(dataDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

import { completeSetup } from '../auth'
import { checkout } from '../checkout'
import { createProduct } from '../../repositories/products'
import { getDb, closeDb } from '../../database/connection'

describe('Custom Price Override Checkout Workflow', () => {
  it('records custom overridden line item price and calculates exact subtotal & profit', async () => {
    const db = getDb()

    // 1. Initial setup
    completeSetup({
      store: { store_name: 'Hardware Bargain Shop', address: 'Davao' },
      admin: { username: 'admin', password: 'password123', pin: '1234', full_name: 'Store Owner' },
      receipt: { footer: 'Daghang Salamat' },
      data_dir: dataDir,
      load_demo: false
    })

    // 2. Create a hardware product: standard price ₱98.00 (9800c), cost ₱70.00 (7000c)
    const product = createProduct(db, {
      category_id: null,
      name: 'PVC Pipe Schedule 40 Blue 1/2 inch 3.2mm',
      sku: 'PVC-050-32',
      barcode: '480000000099',
      description: '3.2mm wall thickness, 10ft length',
      base_unit: 'pc',
      purchase_cost_c: 7000,
      default_price_c: 9800,
      low_stock_threshold: 5,
      supplier_id: null,
      has_expiration: false,
      notes: null,
      units: [{ name: 'pc', conversion_to_base: 1, selling_price_c: 9800, barcode: null, is_default: true }],
      initial_stock_base: 50
    }, 1)

    // 3. Customer buys 2 pcs, bargained down to ₱90.00 (9000c) each
    const customUnitPriceC = 9000
    const qty = 2
    const expectedSubtotalC = customUnitPriceC * qty // 18000c (₱180.00)

    const { sale } = checkout({
      items: [
        {
          product_id: product.id,
          name: product.name,
          unit_name: 'pc',
          qty: qty,
          qty_base: qty,
          unit_price_c: customUnitPriceC,
          cost_base_c: 7000,
          stock_base: 50,
          subtotal_c: expectedSubtotalC
        }
      ],
      discount_c: 0,
      customer_id: null,
      payments: [{ method: 'CASH', amount_c: 18000 }]
    })

    expect(sale.total_c).toBe(18000)
    expect(sale.items).toHaveLength(1)
    expect(sale.items[0]!.unit_price_c).toBe(9000)
    expect(sale.items[0]!.subtotal_c).toBe(18000)

    // Verify database row in sale_items
    const row = db.prepare('SELECT unit_price_c, subtotal_c, cost_base_c FROM sale_items WHERE sale_id = ?').get(sale.id) as {
      unit_price_c: number
      subtotal_c: number
      cost_base_c: number
    }
    expect(row.unit_price_c).toBe(9000)
    expect(row.subtotal_c).toBe(18000)
    expect(row.cost_base_c).toBe(7000)
  })
})
