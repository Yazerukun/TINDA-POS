import type Database from 'better-sqlite3'
import type { CreditLedgerEntry, Customer, CreditEntryType } from '@shared/types'
import type { CustomerInput } from '@shared/ipc'

export function listCustomers(
  db: Database.Database,
  opts: { search?: string; status?: string; limit?: number; offset?: number } = {}
): { rows: Customer[]; total: number } {
  const where: string[] = []
  const params: unknown[] = []
  if (opts.search?.trim()) {
    where.push('(full_name LIKE ? OR nickname LIKE ? OR phone LIKE ?)')
    const like = `%${opts.search.trim()}%`
    params.push(like, like, like)
  }
  if (opts.status === 'active') where.push('is_active = 1')
  if (opts.status === 'inactive') where.push('is_active = 0')
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) AS c FROM customers ${whereSql}`).get(...params) as { c: number }).c
  const limit = opts.limit ?? 50
  const offset = opts.offset ?? 0
  const rows = db
    .prepare(`SELECT * FROM customers ${whereSql} ORDER BY full_name COLLATE NOCASE LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as Customer[]
  return { rows, total }
}

export function getCustomer(db: Database.Database, id: number): Customer {
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as Customer | undefined
  if (!row) throw new Error('Customer not found.')
  return row
}

export function createCustomer(db: Database.Database, input: CustomerInput): Customer {
  if (!input.full_name?.trim()) throw new Error('Customer name is required.')
  if (input.credit_limit_c < 0) throw new Error('Credit limit cannot be negative.')
  const info = db
    .prepare(
      `INSERT INTO customers (full_name, nickname, phone, address, notes, credit_limit_c)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.full_name.trim(),
      input.nickname?.trim() || null,
      input.phone?.trim() || null,
      input.address?.trim() || null,
      input.notes?.trim() || null,
      input.credit_limit_c
    )
  return getCustomer(db, Number(info.lastInsertRowid))
}

export function updateCustomer(db: Database.Database, id: number, input: Partial<CustomerInput>): Customer {
  const cur = getCustomer(db, id)
  if (input.full_name !== undefined && !input.full_name.trim()) throw new Error('Customer name is required.')
  if ((input.credit_limit_c ?? cur.credit_limit_c) < 0) throw new Error('Credit limit cannot be negative.')
  db.prepare(
    `UPDATE customers SET full_name = ?, nickname = ?, phone = ?, address = ?, notes = ?, credit_limit_c = ?,
     updated_at = datetime('now','localtime') WHERE id = ?`
  ).run(
    input.full_name !== undefined ? input.full_name.trim() : cur.full_name,
    input.nickname !== undefined ? input.nickname?.trim() || null : cur.nickname,
    input.phone !== undefined ? input.phone?.trim() || null : cur.phone,
    input.address !== undefined ? input.address?.trim() || null : cur.address,
    input.notes !== undefined ? input.notes?.trim() || null : cur.notes,
    input.credit_limit_c !== undefined ? input.credit_limit_c : cur.credit_limit_c,
    id
  )
  return getCustomer(db, id)
}

export function customerLedger(db: Database.Database, customerId: number, limit = 200): CreditLedgerEntry[] {
  return db
    .prepare('SELECT * FROM credit_ledger WHERE customer_id = ? ORDER BY id DESC LIMIT ?')
    .all(customerId, limit) as CreditLedgerEntry[]
}

/**
 * Apply a credit ledger entry and update the customer balance atomically.
 * Positive amount = customer owes more (credit sale, adjustment up).
 * Negative amount = customer pays / reversal (reduces balance).
 */
export function applyCreditEntry(
  db: Database.Database,
  input: {
    customer_id: number
    entry_type: CreditEntryType
    amount_c: number
    reference_type?: string | null
    reference_id?: number | null
    notes?: string | null
    user_id: number
  }
): CreditLedgerEntry {
  const customer = getCustomer(db, input.customer_id)
  const balanceBefore = customer.balance_c
  switch (input.entry_type) {
    case 'CREDIT_SALE':
    case 'ADJUSTMENT':
      customer.balance_c = balanceBefore + input.amount_c
      break
    case 'PAYMENT':
    case 'REVERSAL':
    case 'REFUND':
      customer.balance_c = balanceBefore - input.amount_c
      break
    default:
      throw new Error('Invalid ledger entry type.')
  }
  if (customer.balance_c < 0) throw new Error('Ledger balance cannot go negative.')
  db.prepare(`UPDATE customers SET balance_c = ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(
    customer.balance_c,
    input.customer_id
  )
  const info = db
    .prepare(
      `INSERT INTO credit_ledger
       (customer_id, entry_type, amount_c, balance_before_c, balance_after_c, reference_type, reference_id, notes, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.customer_id,
      input.entry_type,
      input.amount_c,
      balanceBefore,
      customer.balance_c,
      input.reference_type ?? null,
      input.reference_id ?? null,
      input.notes ?? null,
      input.user_id
    )
  return db.prepare('SELECT * FROM credit_ledger WHERE id = ?').get(Number(info.lastInsertRowid)) as CreditLedgerEntry
}

export function canExtendCredit(customer: Customer, extra: number, allowOverlimit: boolean): boolean {
  if (customer.credit_limit_c <= 0) return false // limit 0 means no utang
  if (allowOverlimit) return true
  return customer.balance_c + extra <= customer.credit_limit_c
}