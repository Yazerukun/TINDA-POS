import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import { calculateRead, finalizeZ, getZ } from '../readReports'
import { readReportLines } from '@shared/readReport'
import * as shifts from '../../repositories/shifts'

let db: Database.Database
beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys=ON')
  runMigrations(db)
  db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES ('qa','x','x','QA')").run()
})
afterEach(() => db.close())

function sale(shiftId: number, method: string, total = 10000) {
  const id = Number(db.prepare('INSERT INTO sales(transaction_no,user_id,subtotal_c,total_c,shift_id) VALUES (?,1,?,?,?)').run(`S-${method}`, total, total, shiftId).lastInsertRowid)
  db.prepare('INSERT INTO payments(sale_id,method,amount_c) VALUES (?,?,?)').run(id, method, total)
  return id
}
function refund(saleId: number, amount: number) {
  return Number(db.prepare("INSERT INTO refunds(refund_no,sale_id,user_id,reason,total_c) VALUES (?, ?,1,'Return',?)").run(`R-${saleId}`, saleId, amount).lastInsertRowid)
}

describe('X-Read cash reconciliation hotfix', () => {
  it('deducts a cash refund and preserves the original sales total', () => {
    const shift = shifts.openShift(db, 1, 5000)
    refund(sale(shift.id, 'CASH'), 4000)
    const r = calculateRead(db, shift.id)
    expect(r).toMatchObject({ gross_sales_c: 10000, refunds_c: 4000, cash_refunds_c: 4000, net_sales_c: 6000, expected_cash_c: 11000 })
  })

  it('does not remove drawer cash for a refund reversed through the credit ledger', () => {
    const shift = shifts.openShift(db, 1, 5000)
    const refundId = refund(sale(shift.id, 'UTANG'), 10000)
    db.prepare("INSERT INTO customers(full_name) VALUES ('QA customer')").run()
    db.prepare("INSERT INTO credit_ledger(customer_id,entry_type,amount_c,balance_before_c,balance_after_c,reference_type,reference_id,user_id) VALUES (1,'REFUND',10000,10000,0,'REFUND',?,1)").run(refundId)
    const r = calculateRead(db, shift.id)
    expect(r).toMatchObject({ refunds_c: 10000, cash_refunds_c: 0, net_sales_c: 0, expected_cash_c: 5000 })
    shifts.updateShiftTotals(db, shift.id)
    expect(shifts.getShift(db, shift.id)).toMatchObject({ refund_cash_c: 0, expected_cash_c: 5000 })
  })

  it('deducts only the part not reversed to credit', () => {
    const shift = shifts.openShift(db, 1, 5000)
    const refundId = refund(sale(shift.id, 'CASH'), 10000)
    db.prepare("INSERT INTO customers(full_name) VALUES ('QA customer')").run()
    db.prepare("INSERT INTO credit_ledger(customer_id,entry_type,amount_c,balance_before_c,balance_after_c,reference_type,reference_id,user_id) VALUES (1,'REFUND',3000,3000,0,'REFUND',?,1)").run(refundId)
    expect(calculateRead(db, shift.id)).toMatchObject({ cash_refunds_c: 7000, expected_cash_c: 8000 })
  })

  it('keeps split-payment shift closing totals equal to X-Read and preserves the Z snapshot', () => {
    const shift = shifts.openShift(db, 1, 5000)
    const id = sale(shift.id, 'CASH')
    db.prepare("UPDATE payments SET amount_c=8000 WHERE sale_id=?").run(id)
    db.prepare("INSERT INTO payments(sale_id,method,amount_c) VALUES (?,'GCASH',4000)").run(id)
    const r = calculateRead(db, shift.id)
    expect(r).toMatchObject({ cash_c: 6000, gcash_c: 4000, expected_cash_c: 11000, split_count: 1 })
    const z = finalizeZ(db, shift.id, 1, 11000)
    expect(shifts.getShift(db, shift.id)).toMatchObject({ cash_sales_c: 6000, expected_cash_c: 11000, difference_c: 0 })
    refund(id, 1000)
    expect(getZ(db, z.id).snapshot).toEqual(z.snapshot)
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok')
  })

  it('renders the cash-refund breakdown and readable dates without requiring new fields on old snapshots', () => {
    const shift = shifts.openShift(db, 1, 0)
    const r = calculateRead(db, shift.id)
    const lines = readReportLines(r)
    expect(lines).toContain('CURRENT SHIFT - NOT FINAL')
    expect(lines).toContain('Cash Refunds   0.00')
    expect(lines.find(l => l.startsWith('Date:'))).not.toContain('T00:')
    const legacy = { ...r, cash_refunds_c: undefined }
    expect(readReportLines(legacy).some(l => l.startsWith('Cash Refunds'))).toBe(false)
  })

  it('excludes other cashiers and pre-shift expenses from both X-Read and stored totals', () => {
    db.prepare("INSERT INTO users(username,password_hash,pin_hash,full_name) VALUES ('other','x','x','Other')").run()
    const category = Number(db.prepare("INSERT INTO expense_categories(name) VALUES ('QA expense')").run().lastInsertRowid)
    const shift = shifts.openShift(db, 1, 10000)
    db.prepare("UPDATE shifts SET opened_at=datetime('now','localtime','-10 minutes') WHERE id=?").run(shift.id)
    db.prepare('INSERT INTO expenses(category_id,amount_c,user_id) VALUES (?,1000,1),(?,2000,2)').run(category, category)
    db.prepare("INSERT INTO expenses(category_id,amount_c,user_id,created_at) VALUES (?,3000,1,datetime('now','localtime','-20 minutes'))").run(category)
    expect(calculateRead(db, shift.id)).toMatchObject({ expenses_c: 1000, expected_cash_c: 9000 })
    shifts.updateShiftTotals(db, shift.id)
    expect(shifts.getShift(db, shift.id)).toMatchObject({ cash_expenses_c: 1000, expected_cash_c: 9000 })
  })

  it('does not count voided sales or their refunds in net sales or drawer cash', () => {
    const shift = shifts.openShift(db, 1, 5000)
    const id = sale(shift.id, 'CASH')
    refund(id, 10000)
    db.prepare("UPDATE sales SET status='VOIDED' WHERE id=?").run(id)
    expect(calculateRead(db, shift.id)).toMatchObject({ net_sales_c: 0, cash_refunds_c: 0, cash_c: 0, expected_cash_c: 5000, void_count: 1 })
  })
})
