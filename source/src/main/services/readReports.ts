import type Database from 'better-sqlite3'
import type { ReadReport, ZRead, DailyCashExpectedReport } from '@shared/types'
import { localDate } from '@shared/expiration'
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
  const paymentRows = db.prepare(`SELECT p.sale_id, p.method, COALESCE(p.amount_c,0) amount_c, s.total_c FROM payments p JOIN sales s ON s.id=p.sale_id WHERE s.shift_id=? AND s.status!='VOIDED'`).all(shiftId) as {sale_id:number;method:string;amount_c:number;total_c:number}[]
  const pay = paymentRows.reduce<Record<string, number>>((totals, row) => {
    totals[row.method] = (totals[row.method] ?? 0) + row.amount_c
    return totals
  }, {})
  // Cash payments store the tendered amount so checkout can calculate change.
  // For reports, count only the amount retained in the drawer, allocating the
  // sale total after non-cash payment portions have been accounted for.
  const cashBySale = new Map<number, { tendered: number; nonCash: number; total: number }>()
  for (const row of paymentRows) {
    const entry = cashBySale.get(row.sale_id) ?? { tendered: 0, nonCash: 0, total: row.total_c }
    if (row.method === 'CASH') entry.tendered += row.amount_c
    else entry.nonCash += row.amount_c
    cashBySale.set(row.sale_id, entry)
  }
  const cash = [...cashBySale.values()].reduce((sum, sale) => sum + Math.min(sale.tendered, Math.max(0, sale.total - sale.nonCash)), 0)
  const refunds = (db.prepare(`SELECT COALESCE(SUM(r.total_c),0) total FROM refunds r JOIN sales s ON s.id=r.sale_id WHERE s.shift_id=? AND s.status!='VOIDED'`).get(shiftId) as {total:number}).total
  // Credit reversals reduce the customer ledger, not physical drawer cash.
  // Legacy refunds do not store a payout method; non-credit refunds retain
  // the existing cash-payout behavior instead of guessing a wallet transfer.
  const cashRefunds = (db.prepare(`SELECT COALESCE(SUM(MAX(0, r.total_c - COALESCE((
    SELECT SUM(cl.amount_c) FROM credit_ledger cl
    WHERE cl.entry_type='REFUND' AND cl.reference_type='REFUND' AND cl.reference_id=r.id
  ),0))),0) total FROM refunds r JOIN sales s ON s.id=r.sale_id
  WHERE s.shift_id=? AND s.status!='VOIDED'`).get(shiftId) as {total:number}).total
  const expenses = (db.prepare(`
    SELECT COALESCE(SUM(e.amount_c),0) total
    FROM expenses e
    LEFT JOIN expense_categories ec ON ec.id = e.category_id
    WHERE e.user_id=? AND e.created_at>=? AND e.created_at<=COALESCE(?,datetime('now','localtime'))
      AND NOT (COALESCE(e.reference, '') LIKE 'SU-%' OR COALESCE(e.description, '') LIKE 'Store Use%' OR COALESCE(ec.name, '') LIKE 'Store Use%')
  `).get(shift.user_id, shift.opened_at, shift.closed_at) as {total:number}).total
  const moves = db.prepare(`SELECT COALESCE(SUM(CASE WHEN type='CASH_IN' THEN amount_c ELSE 0 END),0) cash_in, COALESCE(SUM(CASE WHEN type='CASH_OUT' THEN amount_c ELSE 0 END),0) cash_out FROM cash_movements WHERE shift_id=?`).get(shiftId) as {cash_in:number,cash_out:number}
  const split = (db.prepare(`SELECT COUNT(*) count FROM (SELECT p.sale_id FROM payments p JOIN sales s ON s.id=p.sale_id WHERE s.shift_id=? AND s.status!='VOIDED' GROUP BY p.sale_id HAVING COUNT(*)>1)`).get(shiftId) as {count:number}).count
  const gross = sales.gross || 0, discount = sales.discount || 0, voids = sales.voids || 0
  return { shift_id: shiftId, shift_no: shift.shift_no ?? null, report_type: type, report_at: nowSql(), cashier_id: shift.user_id, cashier_name: shift.cashier_name, opened_at: shift.opened_at, closed_at: shift.closed_at, starting_cash_c: shift.starting_cash_c, gross_sales_c: gross, discount_c: discount, refunds_c: refunds, cash_refunds_c: cashRefunds, voids_c: voids, net_sales_c: gross - discount - refunds, cash_c: cash, gcash_c: pay.GCASH || 0, maya_c: pay.MAYA || 0, maribank_c: pay.MARIBANK || 0, utang_c: pay.UTANG || 0, expenses_c: expenses, cash_in_c: moves.cash_in, cash_out_c: moves.cash_out, expected_cash_c: shift.starting_cash_c + cash - cashRefunds - expenses + moves.cash_in - moves.cash_out, transaction_count: sales.transactions || 0, void_count: sales.void_count || 0, split_count: split }
}

export function calculateDailyExpected(
  db: Database.Database,
  dateStr?: string,
  userId?: number
): DailyCashExpectedReport {
  const today = dateStr || localDate()
  const from = `${today} 00:00:00`
  const to = `${today} 23:59:59`

  // 1. Sales payments retained in cash for today
  const paymentRows = db
    .prepare(
      `SELECT p.sale_id, p.method, COALESCE(p.amount_c, 0) AS amount_c, s.total_c
       FROM payments p
       JOIN sales s ON s.id = p.sale_id
       WHERE s.created_at >= ? AND s.created_at <= ? AND s.status != 'VOIDED'`
    )
    .all(from, to) as { sale_id: number; method: string; amount_c: number; total_c: number }[]

  const cashBySale = new Map<number, { tendered: number; nonCash: number; total: number }>()
  for (const row of paymentRows) {
    const entry = cashBySale.get(row.sale_id) ?? { tendered: 0, nonCash: 0, total: row.total_c }
    if (row.method === 'CASH') entry.tendered += row.amount_c
    else entry.nonCash += row.amount_c
    cashBySale.set(row.sale_id, entry)
  }
  const today_sales_cash_c = [...cashBySale.values()].reduce(
    (sum, sale) => sum + Math.min(sale.tendered, Math.max(0, sale.total - sale.nonCash)),
    0
  )

  // 2. Cash refunds for today
  const refundRow = db
    .prepare(
      `SELECT COALESCE(SUM(MAX(0, r.total_c - COALESCE((
        SELECT SUM(cl.amount_c) FROM credit_ledger cl
        WHERE cl.entry_type = 'REFUND' AND cl.reference_type = 'REFUND' AND cl.reference_id = r.id
      ), 0))), 0) AS total
      FROM refunds r
      JOIN sales s ON s.id = r.sale_id
      WHERE r.created_at >= ? AND r.created_at <= ? AND s.status != 'VOIDED'`
    )
    .get(from, to) as { total: number } | undefined
  const today_cash_refunds_c = refundRow?.total || 0

  // 3. Expenses for today
  const expenseRow = db
    .prepare(
      `SELECT COALESCE(SUM(e.amount_c), 0) AS total
       FROM expenses e
       LEFT JOIN expense_categories ec ON ec.id = e.category_id
       WHERE (e.expense_date = ? OR (e.created_at >= ? AND e.created_at <= ?))
         AND NOT (COALESCE(e.reference, '') LIKE 'SU-%' OR COALESCE(e.description, '') LIKE 'Store Use%' OR COALESCE(ec.name, '') LIKE 'Store Use%')`
    )
    .get(today, from, to) as { total: number } | undefined
  const today_expenses_c = expenseRow?.total || 0

  // 4. Cash movements for today
  const moveRow = db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'CASH_IN' THEN amount_c ELSE 0 END), 0) AS cash_in,
        COALESCE(SUM(CASE WHEN type = 'CASH_OUT' THEN amount_c ELSE 0 END), 0) AS cash_out
      FROM cash_movements
      WHERE created_at >= ? AND created_at <= ?`
    )
    .get(from, to) as { cash_in: number; cash_out: number } | undefined
  const today_cash_in_c = moveRow?.cash_in || 0
  const today_cash_out_c = moveRow?.cash_out || 0

  // 5. Open Shift detection and multi-day check
  const shift = userId ? shifts.currentShiftFor(db, userId) || shifts.anyOpenShift(db) : shifts.anyOpenShift(db)
  let shift_id: number | null = null
  let shift_no: number | null = null
  let shift_opened_at: string | null = null
  let shift_starting_cash_c: number | null = null
  let shift_expected_cash_c: number | null = null
  let is_multi_day = false
  let days_open = 0
  let today_starting_float_c = 0

  if (shift) {
    shift_id = shift.id
    shift_no = shift.shift_no ?? null
    shift_opened_at = shift.opened_at
    shift_starting_cash_c = shift.starting_cash_c
    try {
      const fullShiftRead = calculateRead(db, shift.id, 'X')
      shift_expected_cash_c = fullShiftRead.expected_cash_c
    } catch {
      shift_expected_cash_c = shift.expected_cash_c
    }

    const shiftDate = shift.opened_at ? shift.opened_at.slice(0, 10) : today
    if (shiftDate < today) {
      is_multi_day = true
      const shiftTime = new Date(shiftDate).getTime()
      const todayTime = new Date(today).getTime()
      days_open = Math.max(1, Math.round((todayTime - shiftTime) / (1000 * 60 * 60 * 24)))
    } else {
      is_multi_day = false
      days_open = 1
    }
    today_starting_float_c = shift.starting_cash_c
  }

  const today_pos_net_cash_c =
    today_sales_cash_c - today_cash_refunds_c - today_expenses_c + today_cash_in_c - today_cash_out_c
  const today_expected_cash_c = Math.max(0, today_starting_float_c + today_pos_net_cash_c)

  return {
    business_date: today,
    today_sales_cash_c,
    today_cash_refunds_c,
    today_expenses_c,
    today_cash_in_c,
    today_cash_out_c,
    today_pos_net_cash_c,
    today_starting_float_c,
    today_expected_cash_c,
    shift_id,
    shift_no,
    shift_opened_at,
    shift_starting_cash_c,
    shift_expected_cash_c,
    is_multi_day,
    days_open
  }
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
    const z = getZ(db, Number((db.prepare('SELECT id FROM z_reads WHERE shift_id=?').get(shiftId) as {id:number}).id))
    try {
      const { pushShiftToCloud } = require('./cloudSync')
      const snap = z.snapshot
      pushShiftToCloud(db, {
        local_shift_id: shiftId,
        cashier_name: snap.cashier_name || 'Cashier',
        shift_date: (snap.opened_at || new Date().toISOString()).slice(0, 10),
        opened_at: snap.opened_at || '',
        closed_at: snap.closed_at || new Date().toISOString(),
        gross_sales_c: snap.gross_sales_c || 0,
        cash_c: snap.cash_c || 0,
        gcash_c: snap.gcash_c || 0,
        maya_c: snap.maya_c || 0,
        utang_c: snap.utang_c || 0,
        refund_total_c: snap.refunds_c || 0,
        void_count: snap.void_count || 0,
        transaction_count: snap.transaction_count || 0,
        expenses_c: snap.expenses_c || 0,
        net_sales_c: Math.max(0, (snap.net_sales_c || 0) - (snap.utang_c || 0))
      }).catch(() => {})
    } catch {}
    return z
  })()
}

export function getZ(db: Database.Database, id: number): ZRead {
  const row = db.prepare('SELECT z.*, COALESCE(u.full_name,u.username) finalized_by_name FROM z_reads z JOIN users u ON u.id=z.finalized_by WHERE z.id=?').get(id) as Record<string,unknown> | undefined
  if (!row) throw new Error('Z-Read not found.')
  return rowToZ(row)
}
export function listZ(db: Database.Database): ZRead[] { return (db.prepare('SELECT z.*, COALESCE(u.full_name,u.username) finalized_by_name FROM z_reads z JOIN users u ON u.id=z.finalized_by ORDER BY z.id DESC').all() as Record<string,unknown>[]).map(rowToZ) }

export { readReportLines } from '@shared/readReport'
