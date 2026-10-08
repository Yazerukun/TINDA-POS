import type Database from 'better-sqlite3'
import type {
  EwalletTransactionRecord,
  EwalletAuditRecord,
  EwalletShiftSummary,
  EwalletChannel,
  EwalletTransactionType
} from '@shared/types'

export interface CreateEwalletTransactionInput {
  shift_id?: number | null
  channel: EwalletChannel
  type: EwalletTransactionType
  amount_c: number
  fee_c?: number
  reference_no?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  fee_collected_via?: 'CASH' | 'WALLET'
  notes?: string | null
}

export interface SaveEwalletAuditInput {
  shift_id?: number | null
  business_date?: string
  expected_cash_c: number
  actual_cash_c: number
  denominations: number[]
  starting_gcash_c: number
  actual_gcash_c: number
  starting_maya_c: number
  actual_maya_c: number
  starting_maribank_c?: number
  actual_maribank_c?: number
  notes?: string | null
}

function toTransactionRow(r: Record<string, unknown>): EwalletTransactionRecord {
  return {
    id: Number(r.id),
    shift_id: r.shift_id != null ? Number(r.shift_id) : null,
    user_id: r.user_id != null ? Number(r.user_id) : null,
    cashier_name: (r.cashier_name as string) || undefined,
    channel: r.channel as EwalletChannel,
    type: r.type as EwalletTransactionType,
    amount_c: Number(r.amount_c),
    fee_c: Number(r.fee_c || 0),
    reference_no: (r.reference_no as string | null) ?? null,
    customer_name: (r.customer_name as string | null) ?? null,
    customer_phone: (r.customer_phone as string | null) ?? null,
    fee_collected_via: (r.fee_collected_via as 'CASH' | 'WALLET') || 'CASH',
    notes: (r.notes as string | null) ?? null,
    created_at: String(r.created_at)
  }
}

function toAuditRow(r: Record<string, unknown>): EwalletAuditRecord {
  let denominations: number[] = []
  if (r.denominations_json) {
    try {
      denominations = JSON.parse(String(r.denominations_json)) as number[]
    } catch {
      denominations = []
    }
  }

  return {
    id: Number(r.id),
    shift_id: r.shift_id != null ? Number(r.shift_id) : null,
    user_id: r.user_id != null ? Number(r.user_id) : null,
    cashier_name: (r.cashier_name as string) || undefined,
    business_date: String(r.business_date),
    expected_cash_c: Number(r.expected_cash_c),
    actual_cash_c: Number(r.actual_cash_c),
    cash_difference_c: Number(r.cash_difference_c),
    cash_status: r.cash_status as 'BALANCED' | 'OVER' | 'SHORT',
    denominations,
    starting_gcash_c: Number(r.starting_gcash_c || 0),
    gcash_in_c: Number(r.gcash_in_c || 0),
    gcash_out_c: Number(r.gcash_out_c || 0),
    expected_gcash_c: Number(r.expected_gcash_c || 0),
    actual_gcash_c: Number(r.actual_gcash_c || 0),
    gcash_difference_c: Number(r.gcash_difference_c || 0),
    starting_maya_c: Number(r.starting_maya_c || 0),
    maya_in_c: Number(r.maya_in_c || 0),
    maya_out_c: Number(r.maya_out_c || 0),
    expected_maya_c: Number(r.expected_maya_c || 0),
    actual_maya_c: Number(r.actual_maya_c || 0),
    maya_difference_c: Number(r.maya_difference_c || 0),
    starting_maribank_c: Number(r.starting_maribank_c || 0),
    maribank_in_c: Number(r.maribank_in_c || 0),
    maribank_out_c: Number(r.maribank_out_c || 0),
    expected_maribank_c: Number(r.expected_maribank_c || 0),
    actual_maribank_c: Number(r.actual_maribank_c || 0),
    maribank_difference_c: Number(r.maribank_difference_c || 0),
    total_fees_c: Number(r.total_fees_c || 0),
    notes: (r.notes as string | null) ?? null,
    created_at: String(r.created_at)
  }
}

/**
 * Record a new E-Wallet Cash In or Cash Out transaction.
 */
export function recordEwalletTransaction(
  db: Database.Database,
  userId: number,
  input: CreateEwalletTransactionInput
): EwalletTransactionRecord {
  if (!input.channel || !['GCASH', 'MAYA', 'MARIBANK'].includes(input.channel)) {
    throw new Error('Valid channel (GCASH, MAYA, or MARIBANK) is required.')
  }
  if (!input.type || !['CASH_IN', 'CASH_OUT'].includes(input.type)) {
    throw new Error('Valid transaction type (CASH_IN or CASH_OUT) is required.')
  }
  if (!Number.isInteger(input.amount_c) || input.amount_c <= 0) {
    throw new Error('Amount must be a positive integer in centavos.')
  }

  const feeC = Number.isInteger(input.fee_c) && (input.fee_c ?? 0) >= 0 ? input.fee_c! : 0
  const feeVia = input.fee_collected_via === 'WALLET' ? 'WALLET' : 'CASH'

  // Auto-detect open shift if not explicitly provided
  let shiftId = input.shift_id ?? null
  if (shiftId == null) {
    const s = db
      .prepare("SELECT id FROM shifts WHERE user_id=? AND status='OPENED' ORDER BY id DESC LIMIT 1")
      .get(userId) as { id: number } | undefined
    if (s) shiftId = s.id
  }

  const info = db
    .prepare(
      `INSERT INTO ewallet_transactions (
        shift_id, user_id, channel, type, amount_c, fee_c,
        reference_no, customer_name, customer_phone, fee_collected_via, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      shiftId,
      userId,
      input.channel,
      input.type,
      input.amount_c,
      feeC,
      input.reference_no?.trim() || null,
      input.customer_name?.trim() || null,
      input.customer_phone?.trim() || null,
      feeVia,
      input.notes?.trim() || null
    )

  return getEwalletTransaction(db, Number(info.lastInsertRowid))
}

export function getEwalletTransaction(db: Database.Database, id: number): EwalletTransactionRecord {
  const r = db
    .prepare(
      `SELECT t.*, COALESCE(u.full_name, u.username) as cashier_name
       FROM ewallet_transactions t
       LEFT JOIN users u ON u.id = t.user_id
       WHERE t.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined

  if (!r) throw new Error('E-Wallet transaction not found.')
  return toTransactionRow(r)
}

export function deleteEwalletTransaction(db: Database.Database, id: number): boolean {
  const res = db.prepare('DELETE FROM ewallet_transactions WHERE id = ?').run(id)
  return res.changes > 0
}

export function listEwalletTransactions(
  db: Database.Database,
  opts: {
    shift_id?: number
    channel?: EwalletChannel
    type?: EwalletTransactionType
    limit?: number
  } = {}
): EwalletTransactionRecord[] {
  const where: string[] = []
  const params: unknown[] = []

  if (opts.shift_id != null) {
    where.push('t.shift_id = ?')
    params.push(opts.shift_id)
  }
  if (opts.channel) {
    where.push('t.channel = ?')
    params.push(opts.channel)
  }
  if (opts.type) {
    where.push('t.type = ?')
    params.push(opts.type)
  }

  const limitClause = opts.limit ? `LIMIT ${Number(opts.limit)}` : 'LIMIT 200'
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const rows = db
    .prepare(
      `SELECT t.*, COALESCE(u.full_name, u.username) as cashier_name
       FROM ewallet_transactions t
       LEFT JOIN users u ON u.id = t.user_id
       ${whereSql}
       ORDER BY t.id DESC
       ${limitClause}`
    )
    .all(...params) as Record<string, unknown>[]

  return rows.map(toTransactionRow)
}

/**
 * Compute aggregated E-Wallet summary for an active shift.
 */
export function getEwalletShiftSummary(
  db: Database.Database,
  shiftId: number | null
): EwalletShiftSummary {
  const whereSql = shiftId != null ? 'WHERE shift_id = ?' : ''
  const params = shiftId != null ? [shiftId] : []

  const rows = db
    .prepare(
      `SELECT channel, type, fee_collected_via, amount_c, fee_c
       FROM ewallet_transactions
       ${whereSql}`
    )
    .all(...params) as {
    channel: string
    type: string
    fee_collected_via: string
    amount_c: number
    fee_c: number
  }[]

  let gcash_in_count = 0
  let gcash_in_amount_c = 0
  let gcash_in_fees_c = 0

  let gcash_out_count = 0
  let gcash_out_amount_c = 0
  let gcash_out_fees_c = 0

  let maya_in_count = 0
  let maya_in_amount_c = 0
  let maya_in_fees_c = 0

  let maya_out_count = 0
  let maya_out_amount_c = 0
  let maya_out_fees_c = 0

  let maribank_in_count = 0
  let maribank_in_amount_c = 0
  let maribank_in_fees_c = 0

  let maribank_out_count = 0
  let maribank_out_amount_c = 0
  let maribank_out_fees_c = 0

  let net_cash_drawer_delta_c = 0

  for (const r of rows) {
    const feeInCash = r.fee_collected_via === 'CASH' ? r.fee_c : 0

    if (r.channel === 'GCASH') {
      if (r.type === 'CASH_IN') {
        gcash_in_count++
        gcash_in_amount_c += r.amount_c
        gcash_in_fees_c += r.fee_c
        // Customer gives cash into drawer: Principal + Fee
        net_cash_drawer_delta_c += r.amount_c + feeInCash
      } else {
        gcash_out_count++
        gcash_out_amount_c += r.amount_c
        gcash_out_fees_c += r.fee_c
        // Cashier gives physical cash out of drawer: -Principal + Fee
        net_cash_drawer_delta_c -= r.amount_c - feeInCash
      }
    } else if (r.channel === 'MAYA') {
      if (r.type === 'CASH_IN') {
        maya_in_count++
        maya_in_amount_c += r.amount_c
        maya_in_fees_c += r.fee_c
        net_cash_drawer_delta_c += r.amount_c + feeInCash
      } else {
        maya_out_count++
        maya_out_amount_c += r.amount_c
        maya_out_fees_c += r.fee_c
        net_cash_drawer_delta_c -= r.amount_c - feeInCash
      }
    } else if (r.channel === 'MARIBANK') {
      if (r.type === 'CASH_IN') {
        maribank_in_count++
        maribank_in_amount_c += r.amount_c
        maribank_in_fees_c += r.fee_c
        net_cash_drawer_delta_c += r.amount_c + feeInCash
      } else {
        maribank_out_count++
        maribank_out_amount_c += r.amount_c
        maribank_out_fees_c += r.fee_c
        net_cash_drawer_delta_c -= r.amount_c - feeInCash
      }
    }
  }

  const total_fees_c =
    gcash_in_fees_c + gcash_out_fees_c + maya_in_fees_c + maya_out_fees_c + maribank_in_fees_c + maribank_out_fees_c

  return {
    gcash_in_count,
    gcash_in_amount_c,
    gcash_in_fees_c,
    gcash_out_count,
    gcash_out_amount_c,
    gcash_out_fees_c,
    maya_in_count,
    maya_in_amount_c,
    maya_in_fees_c,
    maya_out_count,
    maya_out_amount_c,
    maya_out_fees_c,
    maribank_in_count,
    maribank_in_amount_c,
    maribank_in_fees_c,
    maribank_out_count,
    maribank_out_amount_c,
    maribank_out_fees_c,
    total_fees_c,
    net_cash_drawer_delta_c
  }
}

/**
 * Save an End-of-Day or End-of-Shift 3-Way Audit Snapshot.
 */
export function saveEwalletAudit(
  db: Database.Database,
  userId: number,
  input: SaveEwalletAuditInput
): EwalletAuditRecord {
  let shiftId = input.shift_id ?? null
  if (shiftId == null) {
    const s = db
      .prepare("SELECT id FROM shifts WHERE user_id=? AND status='OPENED' ORDER BY id DESC LIMIT 1")
      .get(userId) as { id: number } | undefined
    if (s) shiftId = s.id
  }

  const businessDate = input.business_date || new Date().toISOString().slice(0, 10)
  const summary = getEwalletShiftSummary(db, shiftId)

  // 1. Physical Cash Variance
  const cashDifference = input.actual_cash_c - input.expected_cash_c
  const cashStatus: 'BALANCED' | 'OVER' | 'SHORT' =
    cashDifference === 0 ? 'BALANCED' : cashDifference > 0 ? 'OVER' : 'SHORT'

  // 2. GCash Wallet Audit:
  // In Cash In: store sends GCash to customer (-inflow from wallet)
  // In Cash Out: customer sends GCash to store (+outflow into wallet)
  const expectedGcash = input.starting_gcash_c - summary.gcash_in_amount_c + summary.gcash_out_amount_c
  const gcashDiff = input.actual_gcash_c - expectedGcash

  // 3. Maya Wallet Audit:
  const expectedMaya = input.starting_maya_c - summary.maya_in_amount_c + summary.maya_out_amount_c
  const mayaDiff = input.actual_maya_c - expectedMaya

  // 4. MariBank Wallet Audit:
  const startingMaribank = input.starting_maribank_c || 0
  const actualMaribank = input.actual_maribank_c || 0
  const expectedMaribank = startingMaribank - summary.maribank_in_amount_c + summary.maribank_out_amount_c
  const maribankDiff = actualMaribank - expectedMaribank

  const info = db
    .prepare(
      `INSERT INTO ewallet_audits (
        shift_id, user_id, business_date,
        expected_cash_c, actual_cash_c, cash_difference_c, cash_status, denominations_json,
        starting_gcash_c, gcash_in_c, gcash_out_c, expected_gcash_c, actual_gcash_c, gcash_difference_c,
        starting_maya_c, maya_in_c, maya_out_c, expected_maya_c, actual_maya_c, maya_difference_c,
        starting_maribank_c, maribank_in_c, maribank_out_c, expected_maribank_c, actual_maribank_c, maribank_difference_c,
        total_fees_c, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      shiftId,
      userId,
      businessDate,
      input.expected_cash_c,
      input.actual_cash_c,
      cashDifference,
      cashStatus,
      JSON.stringify(input.denominations),
      input.starting_gcash_c,
      summary.gcash_in_amount_c,
      summary.gcash_out_amount_c,
      expectedGcash,
      input.actual_gcash_c,
      gcashDiff,
      input.starting_maya_c,
      summary.maya_in_amount_c,
      summary.maya_out_amount_c,
      expectedMaya,
      input.actual_maya_c,
      mayaDiff,
      startingMaribank,
      summary.maribank_in_amount_c,
      summary.maribank_out_amount_c,
      expectedMaribank,
      actualMaribank,
      maribankDiff,
      summary.total_fees_c,
      input.notes?.trim() || null
    )

  return getEwalletAudit(db, Number(info.lastInsertRowid))
}

export function getEwalletAudit(db: Database.Database, id: number): EwalletAuditRecord {
  const r = db
    .prepare(
      `SELECT a.*, COALESCE(u.full_name, u.username) as cashier_name
       FROM ewallet_audits a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined

  if (!r) throw new Error('E-Wallet audit record not found.')
  return toAuditRow(r)
}

export function listEwalletAudits(
  db: Database.Database,
  opts: { limit?: number } = {}
): EwalletAuditRecord[] {
  const limitClause = opts.limit ? `LIMIT ${Number(opts.limit)}` : 'LIMIT 50'
  const rows = db
    .prepare(
      `SELECT a.*, COALESCE(u.full_name, u.username) as cashier_name
       FROM ewallet_audits a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.id DESC
       ${limitClause}`
    )
    .all() as Record<string, unknown>[]

  return rows.map(toAuditRow)
}

export function deleteEwalletAudit(db: Database.Database, id: number): boolean {
  const res = db.prepare('DELETE FROM ewallet_audits WHERE id = ?').run(id)
  return res.changes > 0
}

export function clearAllEwalletAudits(db: Database.Database): number {
  const res = db.prepare('DELETE FROM ewallet_audits').run()
  return res.changes
}
