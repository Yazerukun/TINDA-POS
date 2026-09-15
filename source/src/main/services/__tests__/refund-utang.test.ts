import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let dataDir: string
beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-rf-'))
  process.env.TINDA_DATA_DIR = dataDir
})
afterAll(() => {
  try { closeDb() } catch { /* ignore */ }
  try { rmSync(dataDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

import { completeSetup } from '../auth'
import { checkout } from '../checkout'
import { processRefund } from '../transaction'
import { createProduct } from '../../repositories/products'
import { createCustomer, getCustomer, applyCreditEntry } from '../../repositories/customers'
import { getDb, closeDb } from '../../database/connection'
import type { ProductInput } from '../../../shared/types'

function input(): ProductInput {
  return {
    category_id: null,
    name: 'Milo (Sachet)', sku: 'REF-PAID', barcode: 'REFPAID1', description: null,
    base_unit: 'sachet', purchase_cost_c: 600, default_price_c: 900, low_stock_threshold: 5,
    supplier_id: null, has_expiration: false, notes: null,
    units: [{ name: 'sachet', conversion_to_base: 1, selling_price_c: 900, barcode: null, is_default: true }],
    initial_stock_base: 50
  }
}

describe('Refund of a utang sale after the customer already paid it off', () => {
  it('should still allow the refund (store pays out of drawer, customer balance stays 0)', () => {
    const db = getDb()
    completeSetup({
      store: { store_name: 'Test Store', address: 'Manila' },
      admin: { username: 'admin', password: 'secret', pin: '1234', full_name: 'Manager' },
      receipt: {}, data_dir: dataDir, load_demo: false
    })
    const milo = createProduct(db, input(), 1)

    const cust = createCustomer(db, { full_name: 'Juan', credit_limit_c: 100000 })
    const sale = checkout({
      items: [{ product_id: milo.id, name: milo.name, unit_name: 'sachet', qty: 2, qty_base: 2, unit_price_c: 900, cost_base_c: 600, stock_base: 50, subtotal_c: 1800 }],
      discount_c: 0, customer_id: cust.id,
      payments: [{ method: 'UTANG', amount_c: 1800 }]
    })
    expect(getCustomer(db, cust.id).balance_c).toBe(1800)

    applyCreditEntry(db, { customer_id: cust.id, entry_type: 'PAYMENT', amount_c: 1800, user_id: 1, notes: 'paid' })
    expect(getCustomer(db, cust.id).balance_c).toBe(0)

    const saleItem = sale.sale.items[0] as NonNullable<(typeof sale.sale.items)[0]>
    const refund = processRefund({
      sale_id: sale.sale.id,
      reason: 'returned after paying',
      items: [{ sale_item_id: saleItem.id, product_id: milo.id, qty_base: 2, unit_name: 'sachet' }]
    })
    expect(refund.total_c).toBe(1800)
    expect(getCustomer(db, cust.id).balance_c).toBe(0)
  })
})