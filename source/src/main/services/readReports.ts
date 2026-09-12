import type Database from 'better-sqlite3'
import type { ReadReport, ZRead } from '@shared/types'
import * as shifts from '../repositories/shifts'

const nowSql = () => new Date().toISOString()

export function calculateRead(db: Database.Database, shiftId: number, type: 'X' | 'Z' = 'X'): ReadReport {
  const shift = shifts.getShift(db, shiftId)
  const sales = db.prepare(`SELECT
    COALESCE(SUM(CASE WHEN status!='VOIDED' THEN subtotal_c ELSE 0 END),0) gross,
    COALESCE(SUM(CASE WHEN status!='VOIDED' THEN discount_c ELSE 0 END),0) discount,
    COALESCE(SUM(CASE WHEN status='VOIDED' THEN total_c ELSE 0 END),0) voids,
    SUM(CASE WHEN status!='VOIDED' THEN 1 ELSE 0 END) transactions,
    SUM(CASE WHEN status='VOIDED' THEN 1 ELSE 0 END) void_count
    FROM sales WHERE shift_id=?`).get(shiftId) as Record<string, number>
  const payments = db.prepare(`SELECT p.method, COALESCE(SUM(p.amount_c),0) total FROM payments p JOIN sales s ON s.id=p.sale_id WHERE s.shift_id=? AND s.status!='VOIDED' GROUP BY p.method`).all(shiftId) as {method:string,total:number}[]
  const pay = Object.fromEntries(payments.map(p => [p.method, p.total])) as Record<string,number>
  const refunds = (db.prepare(`SELECT COALESCE(SUM(r.total_c),0) total FROM refunds r JOIN sales s ON s.id=r.sale_id WHERE s.shift_id=? AND s.status!='VOIDED'`).get(shiftId) as {total:number}).total
  const expenses = (db.prepare(`SELECT COALESCE(SUM(amount_c),0) total FROM expenses WHERE user_id=? AND created_at>=? AND created_at<=COALESCE(?,datetime('now','localtime'))`).get(shift.user_id, shift.opened_at, shift.closed_at) as {total:number}).total
  const moves = db.prepare(`SELECT COALESCE(SUM(CASE WHEN type='CASH_IN' THEN amount_c ELSE 0 END),0) cash_in, COALESCE(SUM(CASE WHEN type='CASH_OUT' THEN amount_c ELSE 0 END),0) cash_out FROM cash_movements WHERE shift_id=?`).get(shiftId) as {cash_in:number,cash_out:number}
  const split = (db.prepare(`SELECT COUNT(*) count FROM (SELECT p.sale_id FROM payments p JOIN sales s ON s.id=p.sale_id WHERE s.shift_id=? AND s.status!='VOIDED' GROUP BY p.sale_id HAVING COUNT(*)>1)`).get(shiftId) as {count:number}).count
  const cash = pay.CASH || 0
  const gross = sales.gross || 0, discount = sales.discount || 0, voids = sales.voids || 0
  return { shift_id: shiftId, shift_no: shift.shift_no ?? null, report_type: type, report_at: nowSql(), cashier_id: shift.user_id, cashier_name: shift.cashier_name, opened_at: shift.opened_at, closed_at: shift.closed_at, starting_cash_c: shift.starting_cash_c, gross_sales_c: gross, discount_c: discount, refunds_c: refunds, voids_c: voids, net_sales_c: gross - discount - refunds, cash_c: cash, gcash_c: pay.GCASH || 0, maya_c: pay.MAYA || 0, utang_c: pay.UTANG || 0, expenses_c: expenses, cash_in_c: moves.cash_in, cash_out_c: moves.cash_out, expected_cash_c: shift.starting_cash_c + cash - refunds - expenses + moves.cash_in - moves.cash_out, transaction_count: sales.transactions || 0, void_count: sales.void_count || 0, split_count: split }
}

function rowToZ(row: Record<string, unknown>): ZRead {
  return { id: Number(row.id), shift_id: Number(row.shift_id), report_no: String(row.report_no), snapshot: JSON.parse(String(row.snapshot_json)) as ReadReport, finalized_by: Number(row.finalized_by), finalized_by_name: String(row.finalized_by_name), finalized_at: String(row.finalized_at) }
}

export function finalizeZ(db: Database.Database, shiftId: number, userId: number, actualCashC: number, note?: string): ZRead {
  return db.transaction(() => {
    const existing = db.prepare('SELECT id FROM z_reads WHERE shift_id=?').get(shiftId)
    if (existing) throw new Error('This shift already has a finalized Z-Read.')
    const shift = shifts.getShift(db, shiftId)
    if (shift.status !== 'OPENED') throw new Error('Only an open shift can be finalized.')
    const snapshot = calculateRead(db, shiftId, 'Z')
    const reportNo = `ZR-${new Date().getFullYear()}-${String((db.prepare('SELECT COUNT(*) c FROM z_reads').get() as {c:number}).c + 1).padStart(6,'0')}`
    db.prepare('INSERT INTO z_reads(shift_id,report_no,snapshot_json,finalized_by) VALUES (?,?,?,?)').run(shiftId, reportNo, JSON.stringify(snapshot), userId)
    shifts.closeShift(db, shiftId, { actual_cash_c: actualCashC, closing_note: note || `Finalized by ${reportNo}` })
    return getZ(db, Number((db.prepare('SELECT id FROM z_reads WHERE shift_id=?').get(shiftId) as {id:number}).id))
  })()
}

export function getZ(db: Database.Database, id: number): ZRead {
  const row = db.prepare('SELECT z.*, COALESCE(u.full_name,u.username) finalized_by_name FROM z_reads z JOIN users u ON u.id=z.finalized_by WHERE z.id=?').get(id) as Record<string,unknown> | undefined
  if (!row) throw new Error('Z-Read not found.')
  return rowToZ(row)
}
export function listZ(db: Database.Database): ZRead[] { return (db.prepare('SELECT z.*, COALESCE(u.full_name,u.username) finalized_by_name FROM z_reads z JOIN users u ON u.id=z.finalized_by ORDER BY z.id DESC').all() as Record<string,unknown>[]).map(rowToZ) }

export function readReportLines(r: ReadReport, reportNo?: string): string[] {
  const m = (n:number) => (n/100).toFixed(2)
  return [reportNo || 'X-READ', `${r.report_type}-READ`, `Date: ${r.report_at}`, `Cashier: ${r.cashier_name}`, `Shift: ${r.shift_no ?? r.shift_id}`, '--------------------------------', `Gross Sales    ${m(r.gross_sales_c)}`, `Discounts      ${m(r.discount_c)}`, `Refunds        ${m(r.refunds_c)}`, `Voids          ${m(r.voids_c)}`, `NET SALES      ${m(r.net_sales_c)}`, '--------------------------------', `Cash           ${m(r.cash_c)}`, `GCash          ${m(r.gcash_c)}`, `Maya           ${m(r.maya_c)}`, `Utang          ${m(r.utang_c)}`, `Expenses       ${m(r.expenses_c)}`, `Expected Cash  ${m(r.expected_cash_c)}`, `Transactions   ${r.transaction_count}`]
}
