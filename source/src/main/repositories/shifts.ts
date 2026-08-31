import type Database from 'better-sqlite3'
import type { CashMovement, Shift } from '@shared/types'

export function getShift(db: Database.Database, id: number): Shift {
  const row = db
    .prepare(
      `SELECT s.*, COALESCE(u.full_name, u.username, '') AS cashier_name,
       (SELECT COUNT(*) FROM cash_movements cm WHERE cm.shift_id = s.id) AS movement_count
       FROM shifts s JOIN users u ON u.id = s.user_id WHERE s.id = ?`
    )
    .get(id) as Omit<Shift, 'cashier_name'> & { cashier_name: string } | undefined
  if (!row) throw new Error('Shift not found.')
  return row
}

export function currentShiftFor(db: Database.Database, userId: number): Shift | null {
  const row = db
    .prepare(
      `SELECT s.*, COALESCE(u.full_name, u.username, '') AS cashier_name,
       (SELECT COUNT(*) FROM cash_movements cm WHERE cm.shift_id = s.id) AS movement_count
       FROM shifts s JOIN users u ON u.id = s.user_id
       WHERE s.user_id = ? AND s.status = 'OPENED' ORDER BY s.id DESC LIMIT 1`
    )
    .get(userId) as Shift | undefined
  return row ?? null
}

export function anyOpenShift(db: Database.Database): Shift | null {
  const row = db
    .prepare(
      `SELECT s.*, COALESCE(u.full_name, u.username, '') AS cashier_name,
       (SELECT COUNT(*) FROM cash_movements cm WHERE cm.shift_id = s.id) AS movement_count
       FROM shifts s JOIN users u ON u.id = s.user_id
       WHERE s.status = 'OPENED' ORDER BY s.id DESC LIMIT 1`
    )
    .get() as Shift | undefined
  return row ?? null
}

export function openShift(db: Database.Database, userId: number, startingCashC: number): Shift {
  if (startingCashC < 0) throw new Error('Starting cash cannot be negative.')
  const existing = currentShiftFor(db, userId)
  if (existing) throw new Error('You already have an open shift.')
  const info = db
    .prepare(`INSERT INTO shifts (user_id, starting_cash_c, expected_cash_c) VALUES (?, ?, ?)`)
    .run(userId, startingCashC, startingCashC)
  return getShift(db, Number(info.lastInsertRowid))
}

export function updateShiftTotals(db: Database.Database, shiftId: number): void {
  const totals = db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN s.status != 'VOIDED' AND EXISTS (SELECT 1 FROM payments p WHERE p.sale_id = s.id AND p.method = 'CASH') THEN s.total_c ELSE 0 END), 0) AS cash_sales_c,
        COALESCE(SUM(CASE WHEN EXISTS (SELECT 1 FROM payments p1 WHERE p1.sale_id = s.id AND p1.method = 'GCASH') THEN (SELECT amount_c FROM payments WHERE sale_id = s.id AND method = 'GCASH' ORDER BY id LIMIT 1) ELSE 0 END), 0) AS gcash_c,
        COALESCE(SUM(CASE WHEN EXISTS (SELECT 1 FROM payments p2 WHERE p2.sale_id = s.id AND p2.method = 'MAYA') THEN (SELECT amount_c FROM payments WHERE sale_id = s.id AND method = 'MAYA' ORDER BY id LIMIT 1) ELSE 0 END), 0) AS maya_c,
        COALESCE(SUM(CASE WHEN EXISTS (SELECT 1 FROM payments p3 WHERE p3.sale_id = s.id AND p3.method = 'UTANG') THEN (SELECT amount_c FROM payments WHERE sale_id = s.id AND method = 'UTANG' ORDER BY id LIMIT 1) ELSE 0 END), 0) AS utang_sold_c
       FROM sales s WHERE s.shift_id = ? AND s.status != 'VOIDED'`
    )
    .get(shiftId) as { cash_sales_c: number; gcash_c: number; maya_c: number; utang_sold_c: number }

  const extras = db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'CASH_OUT' AND amount_c > 0 THEN amount_c ELSE 0 END), 0) AS cash_out_c,
        COALESCE(SUM(CASE WHEN type = 'CASH_IN' AND amount_c > 0 THEN amount_c ELSE 0 END), 0) AS cash_in_c
       FROM cash_movements WHERE shift_id = ?`
    )
    .get(shiftId) as { cash_out_c: number; cash_in_c: number }

  const refundCash = db
    .prepare(
      `SELECT COALESCE(SUM(r.total_c),0) AS s FROM refunds r
       JOIN sales s ON s.id = r.sale_id WHERE s.shift_id = ? AND s.status != 'VOIDED'`
    )
    .get(shiftId) as { s: number }

  const expenses = db
    .prepare(
      `SELECT COALESCE(SUM(e.amount_c),0) AS s FROM expenses e
       WHERE e.expense_date = date('now','localtime')`
    )
    .get() as { s: number }

  db.prepare(
    `UPDATE shifts SET
       cash_sales_c = ?, gcash_c = ?, maya_c = ?, utang_sold_c = ?,
       refund_cash_c = ?, cash_expenses_c = ?, cash_in_c = ?, cash_out_c = ?,
       expected_cash_c = starting_cash_c + ? + ? - ? - ? - ?
     WHERE id = ?`
  ).run(
    totals.cash_sales_c,
    totals.gcash_c,
    totals.maya_c,
    totals.utang_sold_c,
    refundCash.s,
    expenses.s,
    extras.cash_in_c,
    extras.cash_out_c,
    extras.cash_in_c,
    totals.cash_sales_c,
    refundCash.s,
    expenses.s,
    extras.cash_out_c,
    shiftId
  )
}

export function closeShift(
  db: Database.Database,
  shiftId: number,
  input: { actual_cash_c: number; closing_note?: string | null }
): Shift {
  const shift = getShift(db, shiftId)
  if (shift.status !== 'OPENED') throw new Error('Shift is already closed.')
  if (input.actual_cash_c < 0) throw new Error('Actual cash cannot be negative.')
  updateShiftTotals(db, shiftId)
  const closed = getShift(db, shiftId)
  const difference = input.actual_cash_c - closed.expected_cash_c
  const note = input.closing_note ?? ''
  let finalNote = note
  if (Math.abs(difference) > 0 && !note.trim()) {
    finalNote = `Cash difference of ₱${(difference / 100).toFixed(2)} (${difference >= 0 ? 'over' : 'short'}).`
  }
  db.prepare(
    `UPDATE shifts SET closed_at = datetime('now','localtime'), actual_cash_c = ?, difference_c = ?, closing_note = ?, status = 'CLOSED'
     WHERE id = ?`
  ).run(input.actual_cash_c, difference, finalNote, shiftId)
  return getShift(db, shiftId)
}

export function insertCashMovement(
  db: Database.Database,
  shiftId: number,
  type: 'CASH_IN' | 'CASH_OUT',
  amount_c: number,
  reason: string | null,
  userId: number
): CashMovement {
  const shift = getShift(db, shiftId)
  if (shift.status !== 'OPENED') throw new Error('Shift is closed — cash movements not allowed.')
  if (amount_c <= 0) throw new Error('Amount must be greater than zero.')
  const info = db
    .prepare('INSERT INTO cash_movements (shift_id, type, amount_c, reason, user_id) VALUES (?, ?, ?, ?, ?)')
    .run(shiftId, type, amount_c, reason, userId)
  updateShiftTotals(db, shiftId)
  return db.prepare('SELECT * FROM cash_movements WHERE id = ?').get(Number(info.lastInsertRowid)) as CashMovement
}

export function listShifts(
  db: Database.Database,
  opts: { from?: string; to?: string; cashier_id?: number; status?: string; limit?: number; offset?: number } = {}
): { rows: Shift[]; total: number } {
  const where: string[] = []
  const params: unknown[] = []
  if (opts.from) {
    where.push('s.opened_at >= ?')
    params.push(opts.from)
  }
  if (opts.to) {
    where.push('s.opened_at <= ?')
    params.push(opts.to)
  }
  if (opts.cashier_id) {
    where.push('s.user_id = ?')
    params.push(opts.cashier_id)
  }
  if (opts.status) {
    where.push('s.status = ?')
    params.push(opts.status)
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) AS c FROM shifts s ${whereSql}`).get(...params) as { c: number }).c
  const limit = opts.limit ?? 50
  const offset = opts.offset ?? 0
  const rows = db
    .prepare(
      `SELECT s.*, COALESCE(u.full_name, u.username, '') AS cashier_name,
       (SELECT COUNT(*) FROM cash_movements cm WHERE cm.shift_id = s.id) AS movement_count
       FROM shifts s JOIN users u ON u.id = s.user_id
       ${whereSql} ORDER BY s.id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Shift[]
  return { rows, total }
}