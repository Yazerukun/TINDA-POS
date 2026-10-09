import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let dataDir: string
beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-utang-del-'))
  process.env.TINDA_DATA_DIR = dataDir
})
afterAll(() => {
  try { closeDb() } catch { /* ignore */ }
  try { rmSync(dataDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

import { completeSetup } from '../auth'
import { checkout } from '../checkout'
import { processVoid, deleteTransaction } from '../transaction'
import { createProduct } from '../../repositories/products'
import {
  createCustomer,
  getCustomer,
  customerLedger,
  recalculateCustomerBalance,
  deleteCreditLedgerEntry
} from '../../repositories/customers'
import { updateSaleItemPrice, getSale } from '../../repositories/sales'
import { getDb, closeDb } from '../../database/connection'
import type { ProductInput } from '../../../shared/types'

function testProductInput(): ProductInput {
  return {
    category_id: null,
    name: 'Rice 25kg Sack',
    sku: 'RICE-25KG',
    barcode: '480001234567',
    description: null,
    base_unit: 'sack',
    purchase_cost_c: 100000,
    default_price_c: 125000,
    low_stock_threshold: 2,
    supplier_id: null,
    has_expiration: false,
    notes: null,
    units: [{ name: 'sack', conversion_to_base: 1, selling_price_c: 125000, barcode: null, is_default: true }],
    initial_stock_base: 100
  }
}

describe('Utang Ledger Void, Delete, and Recalculation Integrity', () => {
  it('does NOT double-reverse customer balance when voiding and then deleting a credit sale', () => {
    const db = getDb()
    completeSetup({
      store: { store_name: 'Test Store', address: 'Manila' },
      admin: { username: 'admin', password: 'secret', pin: '1234', full_name: 'Manager' },
      receipt: {},
      data_dir: dataDir,
      load_demo: false
    })

    const product = createProduct(db, testProductInput(), 1)
    const customer = createCustomer(db, { full_name: 'Charie Sungcang', credit_limit_c: 50000000 })

    // 1. Initial valid credit sale #1: ₱325,065.00
    const sale1 = checkout({
      items: [
        {
          product_id: product.id,
          name: product.name,
          unit_name: 'sack',
          qty: 1,
          qty_base: 1,
          unit_price_c: 32506500,
          cost_base_c: 100000,
          stock_base: 100,
          subtotal_c: 32506500
        }
      ],
      discount_c: 0,
      customer_id: customer.id,
      payments: [{ method: 'UTANG', amount_c: 32506500 }]
    })

    expect(getCustomer(db, customer.id).balance_c).toBe(32506500)

    // 2. Accidental credit sale #2: ₱34,555.00
    const sale2 = checkout({
      items: [
        {
          product_id: product.id,
          name: product.name,
          unit_name: 'sack',
          qty: 1,
          qty_base: 1,
          unit_price_c: 3455500,
          cost_base_c: 100000,
          stock_base: 99,
          subtotal_c: 3455500
        }
      ],
      discount_c: 0,
      customer_id: customer.id,
      payments: [{ method: 'UTANG', amount_c: 3455500 }]
    })

    expect(getCustomer(db, customer.id).balance_c).toBe(32506500 + 3455500)

    // 3. Void sale #2 -> balance reverts back to ₱325,065.00
    processVoid({
      sale_id: sale2.sale.id,
      reason: 'Mistake sale'
    })

    expect(getCustomer(db, customer.id).balance_c).toBe(32506500)

    // 4. Delete the voided sale #2 -> balance MUST REMAIN ₱325,065.00 (NOT double-deduct to ₱290,510.00!)
    deleteTransaction(sale2.sale.id)

    const afterDelete = getCustomer(db, customer.id)
    expect(afterDelete.balance_c).toBe(32506500)
  })

  it('allows individual ledger entry deletion and automatically recalculates customer balance', () => {
    const db = getDb()
    const customer = createCustomer(db, { full_name: 'Test Ledger Customer', credit_limit_c: 10000000 })

    // Simulate entries
    const prod = createProduct(db, { ...testProductInput(), sku: 'RICE-TEST-2', barcode: '480009999999' }, 1)

    // Sale 1: ₱100.00
    checkout({
      items: [{ product_id: prod.id, name: prod.name, unit_name: 'sack', qty: 1, qty_base: 1, unit_price_c: 10000, cost_base_c: 5000, stock_base: 50, subtotal_c: 10000 }],
      discount_c: 0,
      customer_id: customer.id,
      payments: [{ method: 'UTANG', amount_c: 10000 }]
    })

    // Sale 2: ₱50.00
    checkout({
      items: [{ product_id: prod.id, name: prod.name, unit_name: 'sack', qty: 1, qty_base: 1, unit_price_c: 5000, cost_base_c: 5000, stock_base: 49, subtotal_c: 5000 }],
      discount_c: 0,
      customer_id: customer.id,
      payments: [{ method: 'UTANG', amount_c: 5000 }]
    })

    expect(getCustomer(db, customer.id).balance_c).toBe(15000)

    const entries = customerLedger(db, customer.id)
    expect(entries.length).toBe(2)

    // Delete the ₱50.00 entry
    const entry50 = entries.find((e) => e.amount_c === 5000)!
    const deleteResult = deleteCreditLedgerEntry(db, entry50.id)

    expect(deleteResult.ok).toBe(true)
    expect(deleteResult.customer.balance_c).toBe(10000)
    expect(getCustomer(db, customer.id).balance_c).toBe(10000)

    // Remaining entries
    const remaining = customerLedger(db, customer.id)
    expect(remaining.length).toBe(1)
    expect(remaining[0]!.balance_after_c).toBe(10000)
  })

  it('supports Split / Mixed Payment checkout with multiple methods including Utang', () => {
    const db = getDb()
    const customer = createCustomer(db, { full_name: 'Split Pay Customer', credit_limit_c: 500000 })
    const prod = createProduct(db, { ...testProductInput(), sku: 'RICE-SPLIT', barcode: '480008888888' }, 1)

    // Cart total = ₱1,000.00
    // Split: Cash ₱200, GCash ₱300, MariBank ₱200, Utang ₱300
    const res = checkout({
      items: [{ product_id: prod.id, name: prod.name, unit_name: 'sack', qty: 1, qty_base: 1, unit_price_c: 100000, cost_base_c: 50000, stock_base: 50, subtotal_c: 100000 }],
      discount_c: 0,
      customer_id: customer.id,
      payments: [
        { method: 'CASH', amount_c: 20000, reference: null },
        { method: 'GCASH', amount_c: 30000, reference: 'GC-12345' },
        { method: 'MARIBANK', amount_c: 20000, reference: 'MB-99999' },
        { method: 'UTANG', amount_c: 30000, reference: null }
      ]
    })

    expect(res.sale.total_c).toBe(100000)
    expect(res.sale.payments.length).toBe(4)

    // Customer balance should have increased only by the Utang portion (₱300.00)
    expect(getCustomer(db, customer.id).balance_c).toBe(30000)
  })

  it('updates credit sale item price and adjusts sale and utang payment totals', () => {
    const db = getDb()
    const customer = createCustomer(db, { full_name: 'Price Edit Customer', credit_limit_c: 500000 })
    const prod = createProduct(db, { ...testProductInput(), sku: 'RICE-PRICE-EDIT', barcode: '480007777777' }, 1)

    // Sale of 2 sacks at ₱100.00 each = ₱200.00 on Utang
    const res = checkout({
      items: [{ product_id: prod.id, name: prod.name, unit_name: 'sack', qty: 2, qty_base: 2, unit_price_c: 10000, cost_base_c: 5000, stock_base: 50, subtotal_c: 20000 }],
      discount_c: 0,
      customer_id: customer.id,
      payments: [{ method: 'UTANG', amount_c: 20000 }]
    })

    const saleItemId = res.sale.items[0]!.id

    // Edit price from ₱100.00 (10000) to ₱90.00 (9000)
    // New subtotal: 2 * 9000 = 18000. Delta = -2000 (-₱20.00)
    const updateResult = updateSaleItemPrice(db, saleItemId, 9000)

    expect(updateResult.ok).toBe(true)
    expect(updateResult.deltaC).toBe(-2000)

    const updatedSale = getSale(db, res.sale.id)
    expect(updatedSale.items[0]!.unit_price_c).toBe(9000)
    expect(updatedSale.items[0]!.subtotal_c).toBe(18000)
    expect(updatedSale.total_c).toBe(18000)
    expect(updatedSale.payments.find((p: any) => p.method === 'UTANG')!.amount_c).toBe(18000)
  })
})

