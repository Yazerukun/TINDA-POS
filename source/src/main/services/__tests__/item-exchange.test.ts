import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let dataDir: string
beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-exchange-'))
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
import { processItemExchange, processVoid } from '../transaction'
import { createProduct, getProduct } from '../../repositories/products'
import { getSale } from '../../repositories/sales'
import type { ProductInput } from '../../../shared/types'
import { getDb, closeDb } from '../../database/connection'

function makeProduct(name: string, sku: string, priceC: number, stock: number): ProductInput {
  return {
    category_id: null,
    name,
    sku,
    barcode: sku,
    description: null,
    base_unit: 'pc',
    purchase_cost_c: Math.round(priceC * 0.6),
    default_price_c: priceC,
    low_stock_threshold: 5,
    supplier_id: null,
    has_expiration: false,
    notes: null,
    units: [{ name: 'pc', conversion_to_base: 1, selling_price_c: priceC, barcode: null, is_default: true }],
    initial_stock_base: stock
  }
}

describe('Item Exchange Service', () => {
  it('executes an even item exchange with exact inventory and refund tracking', () => {
    const db = getDb()
    completeSetup({
      store: { store_name: 'Exchange Mart', address: 'Cebu' },
      admin: { username: 'admin', password: 'secret', pin: '1234', full_name: 'Manager' },
      receipt: {}, data_dir: dataDir, load_demo: false
    })

    const prodA = createProduct(db, makeProduct('Shirt Red M', 'SHIRT-RED-M', 50000, 10), 1)
    const prodB = createProduct(db, makeProduct('Shirt Blue L', 'SHIRT-BLU-L', 50000, 10), 1)

    const sale = checkout({
      items: [{
        product_id: prodA.id,
        name: prodA.name,
        unit_name: 'pc',
        qty: 1,
        qty_base: 1,
        unit_price_c: 50000,
        cost_base_c: 30000,
        stock_base: 10,
        subtotal_c: 50000
      }],
      discount_c: 0,
      customer_id: null,
      payments: [{ method: 'CASH', amount_c: 50000 }]
    })

    const saleItem = sale.sale.items[0]!
    expect(getProduct(db, prodA.id).stock).toBe(9)
    expect(getProduct(db, prodB.id).stock).toBe(10)

    const result = processItemExchange({
      sale_id: sale.sale.id,
      sale_item_id: saleItem.id,
      returned_qty: 1,
      replacement_product_id: prodB.id,
      replacement_qty: 1,
      reason: 'Wrong size - change color/size'
    })

    expect(result.ok).toBe(true)
    expect(result.difference_c).toBe(0)
    expect(result.cash_tendered_c).toBe(0)
    expect(result.change_c).toBe(0)
    expect(result.returned_item.credit_c).toBe(50000)
    expect(result.replacement_item.total_c).toBe(50000)

    // Check inventory movements
    expect(getProduct(db, prodA.id).stock).toBe(10) // Restocked
    expect(getProduct(db, prodB.id).stock).toBe(9)  // Deducted

    // Check sale status
    const updatedSale = getSale(db, sale.sale.id)
    expect(updatedSale.status).toBe('REFUNDED') // all items returned in exchange

    // Check receipt lines
    expect(result.receipt_lines.join('\n')).toContain('ITEM EXCHANGE RECEIPT')
    expect(result.receipt_lines.join('\n')).toContain('EVEN EXCHANGE')
  })

  it('handles exchange with abono (customer pays difference)', () => {
    const db = getDb()
    completeSetup({
      store: { store_name: 'Exchange Mart', address: 'Cebu' },
      admin: { username: 'admin', password: 'secret', pin: '1234', full_name: 'Manager' },
      receipt: {}, data_dir: dataDir, load_demo: false
    })

    const prodSmall = createProduct(db, makeProduct('Item Standard', 'ITEM-STD', 30000, 10), 1)
    const prodPremium = createProduct(db, makeProduct('Item Premium', 'ITEM-PRM', 45000, 10), 1)

    const sale = checkout({
      items: [{
        product_id: prodSmall.id,
        name: prodSmall.name,
        unit_name: 'pc',
        qty: 1,
        qty_base: 1,
        unit_price_c: 30000,
        cost_base_c: 18000,
        stock_base: 10,
        subtotal_c: 30000
      }],
      discount_c: 0,
      customer_id: null,
      payments: [{ method: 'CASH', amount_c: 30000 }]
    })

    const saleItem = sale.sale.items[0]!

    // Expect fail if cash tendered is insufficient
    expect(() => processItemExchange({
      sale_id: sale.sale.id,
      sale_item_id: saleItem.id,
      returned_qty: 1,
      replacement_product_id: prodPremium.id,
      replacement_qty: 1,
      reason: 'Upgrade item',
      cash_tendered_c: 10000 // 100 pesos, but diff is 150 pesos (15000c)
    })).toThrow(/less than/)

    // Success with sufficient cash tendered
    const result = processItemExchange({
      sale_id: sale.sale.id,
      sale_item_id: saleItem.id,
      returned_qty: 1,
      replacement_product_id: prodPremium.id,
      replacement_qty: 1,
      reason: 'Upgrade item',
      cash_tendered_c: 20000 // 200 pesos
    })

    expect(result.difference_c).toBe(15000) // 450.00 - 300.00 = 150.00 (15000c)
    expect(result.cash_tendered_c).toBe(20000)
    expect(result.change_c).toBe(5000) // 200.00 - 150.00 = 50.00 change (5000c)
    expect(result.receipt_lines.join('\n')).toContain('AMOUNT DUE')
    expect(result.receipt_lines.join('\n')).toContain('150.00')
  })

  it('handles exchange with sukli/refund (store refunds customer difference)', () => {
    const db = getDb()
    completeSetup({
      store: { store_name: 'Exchange Mart', address: 'Cebu' },
      admin: { username: 'admin', password: 'secret', pin: '1234', full_name: 'Manager' },
      receipt: {}, data_dir: dataDir, load_demo: false
    })

    const prodExpensive = createProduct(db, makeProduct('Gold Watch', 'WATCH-GLD', 100000, 5), 1)
    const prodCheaper = createProduct(db, makeProduct('Silver Watch', 'WATCH-SLV', 70000, 5), 1)

    const sale = checkout({
      items: [{
        product_id: prodExpensive.id,
        name: prodExpensive.name,
        unit_name: 'pc',
        qty: 1,
        qty_base: 1,
        unit_price_c: 100000,
        cost_base_c: 60000,
        stock_base: 5,
        subtotal_c: 100000
      }],
      discount_c: 0,
      customer_id: null,
      payments: [{ method: 'CASH', amount_c: 100000 }]
    })

    const saleItem = sale.sale.items[0]!

    const result = processItemExchange({
      sale_id: sale.sale.id,
      sale_item_id: saleItem.id,
      returned_qty: 1,
      replacement_product_id: prodCheaper.id,
      replacement_qty: 1,
      reason: 'Downgrade to silver'
    })

    expect(result.difference_c).toBe(-30000) // 700.00 - 1000.00 = -300.00 (-30000c)
    expect(result.change_c).toBe(30000)     // Customer gets 300.00 back
    expect(result.receipt_lines.join('\n')).toContain('SUKLI')
    expect(result.receipt_lines.join('\n')).toContain('300.00')
  })

  it('pro-rates discount from original transaction', () => {
    const db = getDb()
    completeSetup({
      store: { store_name: 'Exchange Mart', address: 'Cebu' },
      admin: { username: 'admin', password: 'secret', pin: '1234', full_name: 'Manager' },
      receipt: {}, data_dir: dataDir, load_demo: false
    })

    const prodA = createProduct(db, makeProduct('Dress A', 'DR-A', 100000, 5), 1)
    const prodB = createProduct(db, makeProduct('Dress B', 'DR-B', 100000, 5), 1)

    // Total subtotal 1000.00 with 10% discount (100.00 discount) -> total = 900.00 (90000c)
    const sale = checkout({
      items: [{
        product_id: prodA.id,
        name: prodA.name,
        unit_name: 'pc',
        qty: 1,
        qty_base: 1,
        unit_price_c: 100000,
        cost_base_c: 60000,
        stock_base: 5,
        subtotal_c: 100000
      }],
      discount_c: 10000,
      customer_id: null,
      payments: [{ method: 'CASH', amount_c: 90000 }]
    })

    const saleItem = sale.sale.items[0]!

    const result = processItemExchange({
      sale_id: sale.sale.id,
      sale_item_id: saleItem.id,
      returned_qty: 1,
      replacement_product_id: prodB.id,
      replacement_qty: 1,
      reason: 'Exchange discounted dress',
      cash_tendered_c: 10000
    })

    // Returned credit is pro-rated: 900.00 (90000c)
    expect(result.returned_item.credit_c).toBe(90000)
    // Replacement is 1000.00 (100000c)
    expect(result.replacement_item.total_c).toBe(100000)
    // Difference is 100.00 (10000c)
    expect(result.difference_c).toBe(10000)
    expect(result.change_c).toBe(0)
  })

  it('rejects exchange on voided sale or excessive returned qty', () => {
    const db = getDb()
    completeSetup({
      store: { store_name: 'Exchange Mart', address: 'Cebu' },
      admin: { username: 'admin', password: 'secret', pin: '1234', full_name: 'Manager' },
      receipt: {}, data_dir: dataDir, load_demo: false
    })

    const prodA = createProduct(db, makeProduct('Cap', 'CAP-1', 20000, 5), 1)
    const prodB = createProduct(db, makeProduct('Hat', 'HAT-1', 20000, 5), 1)

    const sale = checkout({
      items: [{
        product_id: prodA.id,
        name: prodA.name,
        unit_name: 'pc',
        qty: 1,
        qty_base: 1,
        unit_price_c: 20000,
        cost_base_c: 10000,
        stock_base: 5,
        subtotal_c: 20000
      }],
      discount_c: 0,
      customer_id: null,
      payments: [{ method: 'CASH', amount_c: 20000 }]
    })

    const saleItem = sale.sale.items[0]!

    // Quantity excessive
    expect(() => processItemExchange({
      sale_id: sale.sale.id,
      sale_item_id: saleItem.id,
      returned_qty: 5,
      replacement_product_id: prodB.id,
      replacement_qty: 1,
      reason: 'Excessive'
    })).toThrow(/available/)

    // Void the sale
    processVoid({ sale_id: sale.sale.id, reason: 'Customer changed mind' })

    // Cannot exchange voided sale
    expect(() => processItemExchange({
      sale_id: sale.sale.id,
      sale_item_id: saleItem.id,
      returned_qty: 1,
      replacement_product_id: prodB.id,
      replacement_qty: 1,
      reason: 'Exchange voided'
    })).toThrow(/voided/)
  })
})
