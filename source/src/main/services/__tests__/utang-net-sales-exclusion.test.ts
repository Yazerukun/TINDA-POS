import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let dataDir: string
beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-utang-exclusion-'))
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

import { getDb, closeDb } from '../../database/connection'
import { completeSetup } from '../auth'
import { checkout } from '../checkout'
import { createProduct } from '../../repositories/products'
import { createCustomer } from '../../repositories/customers'
import { salesReport } from '../reporting'
import { dashboardStats } from '../dashboard'
import { setSession } from '../session'

describe('Client Feedback: UTANG exclusion from Today Net Sales', () => {
  it('excludes items purchased via UTANG from Today Net Sales while keeping them in customer credit', () => {
    const db = getDb()
    completeSetup({
      store: { store_name: 'TINDA Store', address: 'Davao' },
      admin: { username: 'admin', password: 'password123', pin: '1234', full_name: 'Store Manager' },
      receipt: { header: 'Header', footer: 'Footer' },
      data_dir: dataDir,
      load_demo: false
    })

    setSession({ id: 1, username: 'admin', full_name: 'Store Manager', roles: ['ADMIN', 'MANAGER', 'CASHIER'] })

    // Create a product: ₱100 (10,000 centavos)
    const product = createProduct(db, {
      name: 'Rice 1kg',
      sku: 'RICE-01',
      barcode: '11111111',
      category_id: null,
      description: null,
      base_unit: 'kg',
      purchase_cost_c: 4000,
      default_price_c: 10000,
      low_stock_threshold: 5,
      supplier_id: null,
      has_expiration: false,
      notes: null,
      units: [{ name: 'kg', conversion_to_base: 1, selling_price_c: 10000, barcode: null, is_default: true }],
      initial_stock_base: 50
    }, 1)

    // Create a suki customer
    const customer = createCustomer(db, {
      full_name: 'Aling Nena',
      phone: '09123456789',
      credit_limit_c: 100000
    })

    // Sale 1: CASH sale of ₱100
    checkout({
      items: [{
        product_id: product.id,
        name: product.name,
        unit_name: 'kg',
        qty: 1,
        qty_base: 1,
        unit_price_c: 10000,
        subtotal_c: 10000,
        cost_base_c: 4000,
        stock_base: 50
      }],
      discount_c: 0,
      customer_id: null,
      payments: [{ method: 'CASH', amount_c: 10000 }]
    })

    // Sale 2: UTANG sale of ₱100
    checkout({
      items: [{
        product_id: product.id,
        name: product.name,
        unit_name: 'kg',
        qty: 1,
        qty_base: 1,
        unit_price_c: 10000,
        subtotal_c: 10000,
        cost_base_c: 4000,
        stock_base: 49
      }],
      discount_c: 0,
      customer_id: customer.id,
      payments: [{ method: 'UTANG', amount_c: 10000 }]
    })

    // Sale 3: SPLIT sale (₱50 Cash, ₱50 Utang)
    checkout({
      items: [{
        product_id: product.id,
        name: product.name,
        unit_name: 'kg',
        qty: 1,
        qty_base: 1,
        unit_price_c: 10000,
        subtotal_c: 10000,
        cost_base_c: 4000,
        stock_base: 48
      }],
      discount_c: 0,
      customer_id: customer.id,
      payments: [
        { method: 'CASH', amount_c: 5000 },
        { method: 'UTANG', amount_c: 5000 }
      ]
    })

    const today = new Date().toISOString().slice(0, 10)
    const rep = salesReport({ from: today, to: today })

    // Gross total of all transactions = 100 + 100 + 100 = ₱300 (30,000c)
    expect(rep.summary.gross_sales_total_c).toBe(30000)

    // Total Utang = 10,000 + 5,000 = ₱150 (15,000c)
    expect(rep.summary.utang_sales_c).toBe(15000)

    // Realized Net Sales (excludes UTANG) = 10,000 (Cash) + 5,000 (Cash) = ₱150 (15,000c)
    expect(rep.summary.sales_total_c).toBe(15000)

    // Gross Profit preserves true margin: 3 sales * (100 - 40) = ₱180 (18,000c)
    // Not falsely depressed to ₱30 or negative by deducting uncollected utang from gross margin
    expect(rep.summary.profit_c).toBe(18000)

    // Verify dashboardStats() also excludes utang from realized sales while keeping profit intact
    const dash = dashboardStats()
    expect(dash.today_sales_c).toBe(15000) // ₱150 realized, NOT ₱300
    expect(dash.today_profit_c).toBe(18000) // ₱180 gross merchandise margin
    expect(dash.outstanding_utang_c).toBe(15000) // Aling Nena's ₱150 balance in credit card
  })
})
