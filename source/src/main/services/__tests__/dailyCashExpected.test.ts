import Database from 'better-sqlite3'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { runMigrations } from '../../database/migrations'
import { calculateDailyExpected } from '../readReports'
import { getDailyExpected } from '../../repositories/cashCounts'
import { localDate } from '@shared/expiration'

describe('Daily Cash Expected Service (Multi-Day Shift Isolation)', () => {
  let db: Database.Database
  const today = localDate()

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys=ON')
    runMigrations(db)

    // Seed test cashier
    db.prepare(
      `INSERT INTO users (id, username, password_hash, pin_hash, full_name)
       VALUES (1, 'cashier1', 'hash', 'hash', 'Test Cashier')`
    ).run()
  })

  afterEach(() => {
    db.close()
  })

  it('isolates TODAY cash sales and movements when a shift spans multiple days', () => {
    // 1. Shift opened 2 days ago with float ₱1,000 (100,000c)
    db.prepare(
      `INSERT INTO shifts (id, user_id, shift_no, starting_cash_c, expected_cash_c, opened_at, status)
       VALUES (1, 1, 1, 100000, 100000, '2026-10-12 08:00:00', 'OPENED')`
    ).run()

    // 2. Day 1 (2026-10-12) Cash Sale ₱5,000 (500,000c)
    db.prepare(
      `INSERT INTO sales (id, user_id, shift_id, transaction_no, total_c, subtotal_c, discount_c, status, created_at)
       VALUES (101, 1, 1, 'TX-101', 500000, 500000, 0, 'COMPLETED', '2026-10-12 10:00:00')`
    ).run()
    db.prepare(
      `INSERT INTO payments (sale_id, method, amount_c, created_at)
       VALUES (101, 'CASH', 500000, '2026-10-12 10:00:00')`
    ).run()

    // 3. Day 2 (2026-10-13) Cash Sale ₱7,000 (700,000c)
    db.prepare(
      `INSERT INTO sales (id, user_id, shift_id, transaction_no, total_c, subtotal_c, discount_c, status, created_at)
       VALUES (102, 1, 1, 'TX-102', 700000, 700000, 0, 'COMPLETED', '2026-10-13 14:00:00')`
    ).run()
    db.prepare(
      `INSERT INTO payments (sale_id, method, amount_c, created_at)
       VALUES (102, 'CASH', 700000, '2026-10-13 14:00:00')`
    ).run()

    // 4. Day 3 (TODAY) Cash Sale ₱2,500 (250,000c)
    db.prepare(
      `INSERT INTO sales (id, user_id, shift_id, transaction_no, total_c, subtotal_c, discount_c, status, created_at)
       VALUES (103, 1, 1, 'TX-103', 250000, 250000, 0, 'COMPLETED', '${today} 11:00:00')`
    ).run()
    db.prepare(
      `INSERT INTO payments (sale_id, method, amount_c, created_at)
       VALUES (103, 'CASH', 250000, '${today} 11:00:00')`
    ).run()

    // 5. Day 3 (TODAY) Expense ₱200 (20,000c)
    db.prepare(
      `INSERT INTO expenses (user_id, category_id, amount_c, expense_date, created_at)
       VALUES (1, 1, 20000, '${today}', '${today} 12:00:00')`
    ).run()

    // 6. Day 3 (TODAY) Cash In movement ₱500 (50,000c)
    db.prepare(
      `INSERT INTO cash_movements (shift_id, user_id, type, amount_c, reason, created_at)
       VALUES (1, 1, 'CASH_IN', 50000, 'Change fund', '${today} 09:00:00')`
    ).run()

    const report = calculateDailyExpected(db, today, 1)

    // Verify multi-day shift detection
    expect(report.is_multi_day).toBe(true)
    expect(report.days_open).toBeGreaterThanOrEqual(1)
    expect(report.shift_id).toBe(1)
    expect(report.shift_no).toBe(1)

    // Verify Full Shift Expected (sums all 3 days)
    // 100,000 (starting) + 500,000 (day1) + 700,000 (day2) + 250,000 (day3) - 20,000 (exp) + 50,000 (in) = 1,580,000c
    expect(report.shift_expected_cash_c).toBe(1_580_000)

    // Verify TODAY ONLY calculations (strictly day 3)
    // Today POS Cash Sales: ONLY 250,000c
    expect(report.today_sales_cash_c).toBe(250_000)
    // Today Cash Refunds: 0
    expect(report.today_cash_refunds_c).toBe(0)
    // Today Expenses: 20,000c
    expect(report.today_expenses_c).toBe(20_000)
    // Today Cash In: 50,000c
    expect(report.today_cash_in_c).toBe(50_000)
    // Today Cash Out: 0
    expect(report.today_cash_out_c).toBe(0)

    // Today POS Net Cash: 250,000 - 20,000 + 50,000 = 280,000c (₱2,800.00)
    expect(report.today_pos_net_cash_c).toBe(280_000)

    // Today Starting Float: 100,000c (₱1,000.00)
    expect(report.today_starting_float_c).toBe(100_000)

    // Today Target Expected Cash: 100,000 + 280,000 = 380,000c (₱3,800.00)
    expect(report.today_expected_cash_c).toBe(380_000)
  })

  it('correctly reports single-day shift when shift opened today', () => {
    // Shift opened today
    db.prepare(
      `INSERT INTO shifts (id, user_id, shift_no, starting_cash_c, expected_cash_c, opened_at, status)
       VALUES (2, 1, 2, 50000, 50000, '${today} 08:30:00', 'OPENED')`
    ).run()

    // Today sale ₱1,000
    db.prepare(
      `INSERT INTO sales (id, user_id, shift_id, transaction_no, total_c, subtotal_c, discount_c, status, created_at)
       VALUES (201, 1, 2, 'TX-201', 100000, 100000, 0, 'COMPLETED', '${today} 10:00:00')`
    ).run()
    db.prepare(
      `INSERT INTO payments (sale_id, method, amount_c, created_at)
       VALUES (201, 'CASH', 100000, '${today} 10:00:00')`
    ).run()

    const report = getDailyExpected(db, today, 1)

    expect(report.is_multi_day).toBe(false)
    expect(report.days_open).toBe(1)
    expect(report.today_sales_cash_c).toBe(100_000)
    expect(report.today_starting_float_c).toBe(50_000)
    expect(report.today_expected_cash_c).toBe(150_000)
    expect(report.shift_expected_cash_c).toBe(150_000)
  })

  it('handles clean zero-activity day when no shift is open', () => {
    const report = calculateDailyExpected(db, today)

    expect(report.is_multi_day).toBe(false)
    expect(report.shift_id).toBeNull()
    expect(report.today_sales_cash_c).toBe(0)
    expect(report.today_expected_cash_c).toBe(0)
    expect(report.today_starting_float_c).toBe(0)
  })
})
