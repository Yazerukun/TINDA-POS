import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let dataDir: string
beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-profit-'))
  process.env.TINDA_DATA_DIR = dataDir
})
beforeEach(() => {
  closeDb()
  rmSync(dataDir, { recursive: true, force: true })
  mkdirSync(join(dataDir, 'database'), { recursive: true })
})
afterAll(() => {
  try { closeDb() } catch { /* ignore */ }
  try { rmSync(dataDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

import { completeSetup } from '../auth'
import { checkout } from '../checkout'
import { processRefund } from '../transaction'
import { salesReport } from '../reporting'
import { dashboardStats } from '../dashboard'
import { createProduct } from '../../repositories/products'
import type { ProductInput } from '../../../shared/types'
import { getDb, closeDb } from '../../database/connection'

function makeProduct(suffix: string): ProductInput {
  return {
    category_id: null,
    name: `Milo ${suffix}`, sku: `RPI-${suffix}`, barcode: `RPI${suffix}`, description: null,
    base_unit: 'sachet', purchase_cost_c: 600, default_price_c: 900, low_stock_threshold: 5,
    supplier_id: null, has_expiration: false, notes: null,
    units: [{ name: 'sachet', conversion_to_base: 1, selling_price_c: 900, barcode: null, is_default: true }],
    initial_stock_base: 50
  }
}

describe('Refunds reduce estimated profit (Refund -> Profit fix)', () => {
  it('fully refunded sale = zero profit for that transaction', () => {
    const db = getDb()
    completeSetup({
      store: { store_name: 'Test Store', address: 'Manila' },
      admin: { username: 'admin', password: 'secret', pin: '1234', full_name: 'Manager' },
      receipt: {}, data_dir: dataDir, load_demo: false
    })
    const p = createProduct(db, makeProduct('full'), 1)
    const sale = checkout({
      items: [{ product_id: p.id, name: p.name, unit_name: 'sachet', qty: 2, qty_base: 2, unit_price_c: 900, cost_base_c: 600, stock_base: 50, subtotal_c: 1800 }],
      discount_c: 0, customer_id: null,
      payments: [{ method: 'CASH', amount_c: 1800 }]
    })
    const saleItem = sale.sale.items[0] as NonNullable<(typeof sale.sale.items)[0]>
    processRefund({
      sale_id: sale.sale.id,
      reason: 'full return',
      items: [{ sale_item_id: saleItem.id, product_id: p.id, qty_base: 2, unit_name: 'sachet' }]
    })

    const today = new Date().toISOString().slice(0, 10)
    const { summary } = salesReport({ from: today, to: today })
    expect(summary.profit_c).toBe(0)
    expect(dashboardStats().today_profit_c).toBe(0)
  })

  it('partial refund keeps proportional profit', () => {
    const db = getDb()
    completeSetup({
      store: { store_name: 'Test Store', address: 'Manila' },
      admin: { username: 'admin', password: 'secret', pin: '1234', full_name: 'Manager' },
      receipt: {}, data_dir: dataDir, load_demo: false
    })
    const p = createProduct(db, makeProduct('part'), 1)
    const sale = checkout({
      items: [{ product_id: p.id, name: p.name, unit_name: 'sachet', qty: 2, qty_base: 2, unit_price_c: 900, cost_base_c: 600, stock_base: 50, subtotal_c: 1800 }],
      discount_c: 0, customer_id: null,
      payments: [{ method: 'CASH', amount_c: 1800 }]
    })
    const saleItem = sale.sale.items[0] as NonNullable<(typeof sale.sale.items)[0]>
    processRefund({
      sale_id: sale.sale.id,
      reason: 'partial return',
      items: [{ sale_item_id: saleItem.id, product_id: p.id, qty_base: 1, unit_name: 'sachet' }]
    })

    const today = new Date().toISOString().slice(0, 10)
    const { summary } = salesReport({ from: today, to: today })
    expect(summary.profit_c).toBe(300) // (1800-900) - (1200-600)
  })

  it('profit nets out sale-level discounts and refunds, no double deduction', () => {
    const db = getDb()
    completeSetup({
      store: { store_name: 'Test Store', address: 'Manila' },
      admin: { username: 'admin', password: 'secret', pin: '1234', full_name: 'Manager' },
      receipt: {}, data_dir: dataDir, load_demo: false
    })
    const p = createProduct(db, makeProduct('disc'), 1)
    const sale = checkout({
      items: [{ product_id: p.id, name: p.name, unit_name: 'sachet', qty: 2, qty_base: 2, unit_price_c: 900, cost_base_c: 600, stock_base: 50, subtotal_c: 1800 }],
      discount_c: 300, customer_id: null,
      payments: [{ method: 'CASH', amount_c: 1500 }]
    })
    const saleItem = sale.sale.items[0] as NonNullable<(typeof sale.sale.items)[0]>
    const refund = processRefund({
      sale_id: sale.sale.id,
      reason: 'discount guard',
      items: [{ sale_item_id: saleItem.id, product_id: p.id, qty_base: 1, unit_name: 'sachet' }]
    })
    expect(refund.total_c).toBe(900)

    const today = new Date().toISOString().slice(0, 10)
    const { summary } = salesReport({ from: today, to: today })
    // (1500 - 900) - (1200 - 600) = 0 --- cost is net of the refunded item only
    expect(summary.profit_c).toBe(0)
  })
})