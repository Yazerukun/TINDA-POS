import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let dataDir: string
beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-petty-cash-'))
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
import * as users from '../../repositories/users'
import * as shifts from '../../repositories/shifts'
import * as expenses from '../../repositories/expenses'
import { calculateRead } from '../readReports'
import { salesReport } from '../reporting'
import { hashSecret } from '../../security/passwords'

describe('Petty Cash Out, Shift Reconciliation & True Net Profit', () => {
  it('correctly tracks petty cash disbursements and balances Z-Read expected cash', () => {
    const db = getDb()
    completeSetup({
      store: { store_name: 'Test Store', address: 'Manila' },
      admin: { username: 'admin', password: 'password123', pin: '1234' },
      receipt: { header: 'Header', footer: 'Footer' }
    })

    // 1. Create cashier user
    const cashier = users.createUser(db, {
      username: 'cashier1',
      passwordHash: hashSecret('secret'),
      pinHash: hashSecret('1234'),
      full_name: 'Maria Cashier',
      roles: ['CASHIER']
    })

    // 2. Open shift with ₱1,000 float (100,000 centavos)
    const openShift = shifts.openShift(db, cashier.id, 100000)
    expect(openShift.starting_cash_c).toBe(100000)
    expect(openShift.expected_cash_c).toBe(100000)

    // 3. Get Ice category (pre-seeded in Migration 1)
    const categories = expenses.listExpenseCategories(db)
    const iceCategory = categories.find((c) => /ice/i.test(c.name)) ?? categories[0]
    expect(iceCategory).toBeDefined()

    // 4. Record petty cash out of ₱50 (5,000 centavos) for tube ice
    const today = new Date().toISOString().slice(0, 10)
    const exp = expenses.createExpense(
      db,
      {
        category_id: iceCategory.id,
        amount_c: 5000,
        expense_date: today,
        description: '3 bags of tube ice for beverage cooler'
      },
      cashier.id
    )
    expect(exp.amount_c).toBe(5000)

    // 5. Update shift totals and verify expected cash is reduced
    shifts.updateShiftTotals(db, openShift.id)
    const updatedShift = shifts.getShift(db, openShift.id)
    expect(updatedShift.cash_expenses_c).toBe(5000)
    expect(updatedShift.expected_cash_c).toBe(95000) // 100,000 - 5,000

    // 6. Test Z-read report calculation
    const read = calculateRead(db, openShift.id, 'Z')
    expect(read.expenses_c).toBe(5000)
    expect(read.expected_cash_c).toBe(95000)

    // 7. Close shift with exactly ₱950 in drawer -> Should be BALANCED (difference = 0)
    const closed = shifts.closeShift(db, openShift.id, { actual_cash_c: 95000 })
    expect(closed.status).toBe('CLOSED')
    expect(closed.difference_c).toBe(0)
  })

  it('correctly calculates True Net Profit (Gross Profit - Operating Expenses)', () => {
    const db = getDb()
    completeSetup({
      store: { store_name: 'Test Store 2', address: 'Cebu' },
      admin: { username: 'admin2', password: 'password123', pin: '1234' },
      receipt: { header: 'Header', footer: 'Footer' }
    })

    const cashier = users.createUser(db, {
      username: 'cashier2',
      passwordHash: hashSecret('secret'),
      pinHash: hashSecret('1234'),
      full_name: 'Juan Cashier',
      roles: ['CASHIER']
    })

    const categories = expenses.listExpenseCategories(db)
    const suppliesCat = categories.find((c) => /supplies/i.test(c.name)) ?? categories[0]

    const today = new Date().toISOString().slice(0, 10)
    // Record ₱120 in store supplies expense
    expenses.createExpense(
      db,
      {
        category_id: suppliesCat.id,
        amount_c: 12000,
        expense_date: today,
        description: 'Packaging tape and sando bags'
      },
      cashier.id
    )

    // Run sales report for today
    const report = salesReport({ from: today, to: today })
    expect(report.summary.expenses_c).toBe(12000)
    // True Net Profit = profit_c - expenses_c
    expect(report.summary.net_profit_c).toBe(report.summary.profit_c - 12000)
  })
})
