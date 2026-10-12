import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type Database from 'better-sqlite3'
import { getDb, closeDb } from '../../database/connection'
import * as products from '../../repositories/products'
import { createPurchase, getPurchase, listPurchases } from '../../repositories/purchases'
import { listReceiving } from '../../repositories/inventory'
import { createSaleRecord, insertSaleItem, insertPayment } from '../../repositories/sales'
import { itemSalesReport } from '../reporting'

let dataDir: string
let db: Database.Database
let productAId: number
let productBId: number

beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-v206-'))
  process.env.TINDA_DATA_DIR = dataDir
  db = getDb()
  db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES ('admin','x','x','Admin User')").run()
  db.prepare("INSERT INTO suppliers(name) VALUES ('San Miguel Wholesale')").run()

  productAId = products.createProduct(
    db,
    {
      category_id: null,
      name: 'Lucky Me Pancit Canton',
      sku: 'LM-PC-01',
      barcode: '4800016644801',
      description: 'Original Flavor 60g',
      base_unit: 'pack',
      purchase_cost_c: 1200,
      default_price_c: 1600,
      low_stock_threshold: 10,
      supplier_id: 1,
      has_expiration: false,
      notes: null,
      units: [{ name: 'pack', conversion_to_base: 1, barcode: '4800016644801', selling_price_c: 1600, is_default: true }],
      initial_stock_base: 20
    },
    1
  ).id

  productBId = products.createProduct(
    db,
    {
      category_id: null,
      name: 'Argentina Corned Beef 175g',
      sku: 'ARG-CB-175',
      barcode: '4800024567891',
      description: 'Canned Goods',
      base_unit: 'can',
      purchase_cost_c: 3800,
      default_price_c: 4500,
      low_stock_threshold: 5,
      supplier_id: 1,
      has_expiration: false,
      notes: null,
      units: [{ name: 'can', conversion_to_base: 1, barcode: '4800024567891', selling_price_c: 4500, is_default: true }],
      initial_stock_base: 15
    },
    1
  ).id
})

afterAll(() => {
  try { closeDb() } catch { /* ignore */ }
  try { rmSync(dataDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

describe('v2.0.6 Supplier Purchase Invoice & Item Sales Analytics', () => {
  it('records multi-item supplier purchase invoice, increments stock, updates costs, and logs receiving history', () => {
    const purchase = createPurchase(db, {
      supplier_id: 1,
      purchase_date: '2026-04-20',
      invoice_no: 'SI-2026-0098',
      receipt_no: 'OR-77881',
      is_paid: false,
      terms_days: 30,
      discount_c: 5000,
      notes: 'Monthly grocery restock',
      user_id: 1,
      update_product_costs: true,
      items: [
        {
          product_id: productAId,
          unit_name: 'pack',
          qty: 50,
          qty_base: 50,
          unit_cost_c: 1250,
          subtotal_c: 62500
        },
        {
          product_id: productBId,
          unit_name: 'can',
          qty: 20,
          qty_base: 20,
          unit_cost_c: 3900,
          subtotal_c: 78000
        }
      ]
    })

    expect(purchase.purchase_no).toBe('PPO-000001')
    expect(purchase.supplier_name).toBe('San Miguel Wholesale')
    expect(purchase.invoice_no).toBe('SI-2026-0098')
    expect(purchase.receipt_no).toBe('OR-77881')
    expect(purchase.is_paid).toBe(false)
    expect(purchase.terms_days).toBe(30)
    expect(purchase.total_c).toBe(140500)
    expect(purchase.discount_c).toBe(5000)
    expect(purchase.net_total_c).toBe(135500)
    expect(purchase.items).toHaveLength(2)

    // Verify atomic stock increment & cost update
    const updatedA = products.getProduct(db, productAId)
    const updatedB = products.getProduct(db, productBId)
    expect(updatedA.stock).toBe(70)
    expect(updatedA.purchase_cost_c).toBe(1250)
    expect(updatedB.stock).toBe(35)
    expect(updatedB.purchase_cost_c).toBe(3900)

    // Verify listPurchases and getPurchase
    const list = listPurchases(db, { supplier_id: 1 })
    expect(list.total).toBe(1)
    expect(list.rows[0]?.id).toBe(purchase.id)
    expect(getPurchase(db, purchase.id).net_total_c).toBe(135500)

    // Verify receiving audit log
    const rec = listReceiving(db, { source: 'PURCHASE' })
    expect(rec.total).toBe(2)
  })

  it('aggregates item-level sales quantity, gross sales, cost, net profit, and margin % in itemSalesReport', () => {
    const saleId = createSaleRecord(db, {
      transaction_no: 'TPOS-000001',
      user_id: 1,
      customer_id: null,
      subtotal_c: 17000,
      discount_c: 0,
      total_c: 17000,
      shift_id: null
    })
    insertSaleItem(db, {
      sale_id: saleId,
      product_id: productAId,
      product_name: 'Lucky Me Pancit Canton',
      unit_name: 'pack',
      qty: 5,
      qty_base: 5,
      unit_price_c: 1600,
      subtotal_c: 8000,
      cost_base_c: 1200
    })
    insertSaleItem(db, {
      sale_id: saleId,
      product_id: productBId,
      product_name: 'Argentina Corned Beef 175g',
      unit_name: 'can',
      qty: 2,
      qty_base: 2,
      unit_price_c: 4500,
      subtotal_c: 9000,
      cost_base_c: 3800
    })
    insertPayment(db, saleId, 'CASH', 20000, null)

    const report = itemSalesReport({ from: '2000-01-01', to: '2999-12-31' })
    expect(report.summary.unique_products_count).toBe(2)
    expect(report.summary.total_items_sold).toBe(7)
    expect(report.summary.total_sales_c).toBe(17000)
    expect(report.summary.total_cost_c).toBe(5 * 1200 + 2 * 3800) // 6000 + 7600 = 13600
    expect(report.summary.total_profit_c).toBe(3400)

    const luckyMeRow = report.rows.find((r) => r.product_id === productAId)
    expect(luckyMeRow).toBeDefined()
    expect(luckyMeRow?.total_qty).toBe(5)
    expect(luckyMeRow?.total_sales_c).toBe(8000)
    expect(luckyMeRow?.total_cost_c).toBe(6000)
    expect(luckyMeRow?.profit_c).toBe(2000)
    expect(luckyMeRow?.margin_pct).toBe(25)
  })
})
