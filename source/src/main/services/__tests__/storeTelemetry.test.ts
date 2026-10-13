import Database from 'better-sqlite3'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { runMigrations } from '../../database/migrations'
import { getStoreTelemetrySummary } from '../storeTelemetry'
import { localDate } from '@shared/expiration'

describe('Store Telemetry Service', () => {
  let db: Database.Database
  const today = localDate()

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys=ON')
    runMigrations(db)

    // Seed test cashier and settings
    db.prepare(
      `INSERT INTO users (id, username, password_hash, pin_hash, full_name)
       VALUES (1, 'cashier1', 'hash', 'hash', 'Test Cashier')`
    ).run()

    db.prepare(
      `INSERT OR REPLACE INTO settings (key, value) VALUES ('cloud_last_synced_at', '2026-10-13T08:00:00Z')`
    ).run()
  })

  afterEach(() => {
    db.close()
  })

  it('computes empty telemetry with zero-error mathematical precision', () => {
    const summary = getStoreTelemetrySummary(db)

    expect(summary.business_date).toBe(today)
    expect(summary.net_sales_c).toBe(0)
    expect(summary.gross_sales_c).toBe(0)
    expect(summary.discount_c).toBe(0)
    expect(summary.refund_total_c).toBe(0)
    expect(summary.void_count).toBe(0)
    expect(summary.void_total_c).toBe(0)
    expect(summary.transaction_count).toBe(0)
    expect(summary.cash_c).toBe(0)
    expect(summary.gcash_c).toBe(0)
    expect(summary.maya_c).toBe(0)
    expect(summary.expected_drawer_cash_c).toBe(0)
    expect(summary.top_products).toEqual([])
    expect(summary.last_sync_at).toBe('2026-10-13T08:00:00Z')
  })

  it('computes sales, refunds, voids, payments, and drawer cash accurately', () => {
    // 1. Shift with starting float ₱1,000 (100,000c)
    db.prepare(
      `INSERT INTO shifts (id, user_id, shift_no, starting_cash_c, expected_cash_c, opened_at, status)
       VALUES (1, 1, 1, 100000, 100000, datetime('now','localtime'), 'OPENED')`
    ).run()

    // 2. Insert products
    db.prepare(
      `INSERT INTO products (id, name, sku, stock, low_stock_threshold, base_unit, default_price_c)
       VALUES (10, 'Coke 1.5L', 'COKE-1.5', 4, 10, 'bottle', 7500),
              (20, 'Lucky Me Pancit Canton', 'CANTON', 25, 5, 'pc', 1500),
              (30, 'Rice 1kg', 'RICE-1KG', 2, 5, 'kg', 5500)`
    ).run()

    // 3. Sale 1: Completed, ₱150 gross, ₱10 discount, net ₱140 (paid cash ₱200, change ₱60 -> retained ₱140)
    db.prepare(
      `INSERT INTO sales (id, transaction_no, user_id, subtotal_c, discount_c, total_c, status, created_at)
       VALUES (101, 'TX-001', 1, 15000, 1000, 14000, 'COMPLETED', datetime('now','localtime'))`
    ).run()
    db.prepare(
      `INSERT INTO sale_items (sale_id, product_id, product_name, unit_name, qty, qty_base, unit_price_c, subtotal_c)
       VALUES (101, 10, 'Coke 1.5L', 'bottle', 2, 2, 7500, 15000)`
    ).run()
    db.prepare(
      `INSERT INTO payments (sale_id, method, amount_c, created_at)
       VALUES (101, 'CASH', 20000, datetime('now','localtime'))`
    ).run()

    // 4. Sale 2: Split payment, ₱300 total (₱200 GCash + ₱100 Cash)
    db.prepare(
      `INSERT INTO sales (id, transaction_no, user_id, subtotal_c, discount_c, total_c, status, created_at)
       VALUES (102, 'TX-002', 1, 30000, 0, 30000, 'COMPLETED', datetime('now','localtime'))`
    ).run()
    db.prepare(
      `INSERT INTO sale_items (sale_id, product_id, product_name, unit_name, qty, qty_base, unit_price_c, subtotal_c)
       VALUES (102, 20, 'Lucky Me Pancit Canton', 'pc', 20, 20, 1500, 30000)`
    ).run()
    db.prepare(
      `INSERT INTO payments (sale_id, method, amount_c, created_at)
       VALUES (102, 'GCASH', 20000, datetime('now','localtime')),
              (102, 'CASH', 10000, datetime('now','localtime'))`
    ).run()

    // 5. Sale 3: Voided sale, ₱500 total
    db.prepare(
      `INSERT INTO sales (id, transaction_no, user_id, subtotal_c, discount_c, total_c, status, created_at)
       VALUES (103, 'TX-003', 1, 50000, 0, 50000, 'VOIDED', datetime('now','localtime'))`
    ).run()

    // 6. Cash In movement (+₱500) and Cash Out movement (-₱200)
    db.prepare(
      `INSERT INTO cash_movements (shift_id, type, amount_c, user_id, created_at)
       VALUES (1, 'CASH_IN', 50000, 1, datetime('now','localtime')),
              (1, 'CASH_OUT', 20000, 1, datetime('now','localtime'))`
    ).run()

    // 7. Store expense (₱50 cash for Ice)
    db.prepare(
      `INSERT INTO expenses (category_id, amount_c, expense_date, description, created_at)
       VALUES (1, 5000, date('now','localtime'), 'Ice tube purchase', datetime('now','localtime'))`
    ).run()

    // 8. Refund for Sale 1: ₱40 refunded in cash
    db.prepare(
      `INSERT INTO refunds (id, refund_no, sale_id, user_id, reason, total_c, created_at)
       VALUES (1, 'REF-001', 101, 1, 'Customer return 1 item', 4000, datetime('now','localtime'))`
    ).run()

    // 9. Customers with Utang
    db.prepare(
      `INSERT INTO customers (id, full_name, credit_limit_c, balance_c, is_active)
       VALUES (1, 'Aling Nena', 50000, 60000, 1),
              (2, 'Mang Juan', 100000, 30000, 1)`
    ).run()

    const summary = getStoreTelemetrySummary(db)

    // Gross Sales = 15000 + 30000 = 45000c (₱450)
    expect(summary.gross_sales_c).toBe(45000)
    // Discount = 1000c (₱10)
    expect(summary.discount_c).toBe(1000)
    // Refund = 4000c (₱40)
    expect(summary.refund_total_c).toBe(4000)
    // Net Sales = 45000 - 1000 - 4000 = 40000c (₱400)
    expect(summary.net_sales_c).toBe(40000)

    // Voided: 1 void totaling 50000c (₱500)
    expect(summary.void_count).toBe(1)
    expect(summary.void_total_c).toBe(50000)
    expect(summary.transaction_count).toBe(2)

    // Cash Sales retained in drawer:
    // Sale 1: min(20000, 14000 - 0) = 14000c
    // Sale 2: min(10000, 30000 - 20000) = 10000c
    // Total cash_c = 24000c
    expect(summary.cash_c).toBe(24000)
    expect(summary.gcash_c).toBe(20000)

    // Drawer Cash:
    // float (100000) + cash (24000) + cash_in (50000) - cash_out (20000) - expenses (5000) - cash_refunds (4000)
    // = 100000 + 24000 + 50000 - 20000 - 5000 - 4000 = 145000c (₱1,450.00)
    expect(summary.expected_drawer_cash_c).toBe(145000)

    // Top Products:
    expect(summary.top_products.length).toBe(2)
    expect(summary.top_products[0]?.name).toBe('Lucky Me Pancit Canton')
    expect(summary.top_products[0]?.qty_sold).toBe(20)
    expect(summary.top_products[1]?.name).toBe('Coke 1.5L')
    expect(summary.top_products[1]?.qty_sold).toBe(2)

    // Critically Low Stock:
    // Product 10: stock 4 <= threshold 10
    // Product 30: stock 2 <= threshold 5
    expect(summary.critically_low_stock.length).toBe(2)
    expect(summary.critically_low_stock.map((p) => p.name)).toContain('Coke 1.5L')
    expect(summary.critically_low_stock.map((p) => p.name)).toContain('Rice 1kg')

    // Utang:
    expect(summary.unpaid_utang_due.total_outstanding_c).toBe(90000) // 60000 + 30000
    expect(summary.unpaid_utang_due.customer_count).toBe(2)
    expect(summary.unpaid_utang_due.over_limit_count).toBe(1) // Aling Nena is 60000 > 50000 limit
    expect(summary.unpaid_utang_due.top_debtors[0]?.name).toBe('Aling Nena')
    expect(summary.unpaid_utang_due.top_debtors[0]?.is_over_limit).toBe(true)
  })
})
