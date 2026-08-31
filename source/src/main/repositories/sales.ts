import type Database from 'better-sqlite3'
import type { Payment, Sale, SaleItem } from '@shared/types'

function getSaleItems(db: Database.Database, saleId: number): SaleItem[] {
  return db.prepare('SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id').all(saleId) as SaleItem[]
}

function getPayments(db: Database.Database, saleId: number): Payment[] {
  return db.prepare('SELECT * FROM payments WHERE sale_id = ? ORDER BY id').all(saleId) as Payment[]
}

export function getSale(db: Database.Database, id: number): Sale {
  const row = db
    .prepare(
      `SELECT s.*, COALESCE(u.full_name, u.username, '') AS cashier_name,
              COALESCE(c.full_name, '') AS customer_name
       FROM sales s
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined
  if (!row) throw new Error('Sale not found.')
  return {
    id: row.id as number,
    transaction_no: row.transaction_no as string,
    user_id: row.user_id as number,
    cashier_name: row.cashier_name as string,
    customer_id: (row.customer_id as number | null) ?? null,
    customer_name: (row.customer_name as string) || null,
    subtotal_c: row.subtotal_c as number,
    discount_c: row.discount_c as number,
    total_c: row.total_c as number,
    status: row.status as Sale['status'],
    shift_id: (row.shift_id as number | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    created_at: row.created_at as string,
    voided_at: (row.voided_at as string | null) ?? null,
    voided_by: (row.voided_by as number | null) ?? null,
    void_reason: (row.void_reason as string | null) ?? null,
    items: getSaleItems(db, id),
    payments: getPayments(db, id)
  }
}

export function nextTransactionNo(db: Database.Database): string {
  const row = db
    .prepare(`SELECT transaction_no FROM sales ORDER BY id DESC LIMIT 1`)
    .get() as { transaction_no: string } | undefined
  let seq = 1
  if (row) {
    const m = /TPOS-(\d+)/.exec(row.transaction_no)
    if (m) seq = Number(m[1]) + 1
  }
  return `TPOS-${String(seq).padStart(6, '0')}`
}

export function listSales(
  db: Database.Database,
  opts: {
    from?: string
    to?: string
    status?: string
    method?: string
    cashier_id?: number
    search?: string
    limit?: number
    offset?: number
  } = {}
): { rows: Sale[]; total: number } {
  const where: string[] = []
  const params: unknown[] = []
  if (opts.from) {
    where.push('s.created_at >= ?')
    params.push(opts.from)
  }
  if (opts.to) {
    where.push('s.created_at <= ?')
    params.push(opts.to)
  }
  if (opts.status) {
    where.push('s.status = ?')
    params.push(opts.status)
  }
  if (opts.method) {
    where.push("EXISTS (SELECT 1 FROM payments p WHERE p.sale_id = s.id AND p.method = ?)")
    params.push(opts.method)
  }
  if (opts.cashier_id) {
    where.push('s.user_id = ?')
    params.push(opts.cashier_id)
  }
  if (opts.search?.trim()) {
    where.push('(s.transaction_no LIKE ? OR s.notes LIKE ?)')
    const like = `%${opts.search.trim()}%`
    params.push(like, like)
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) AS c FROM sales s ${whereSql}`).get(...params) as { c: number }).c
  const limit = opts.limit ?? 50
  const offset = opts.offset ?? 0
  const rows = db
    .prepare(
      `SELECT s.*, COALESCE(u.full_name, u.username, '') AS cashier_name, COALESCE(c.full_name, '') AS customer_name
       FROM sales s
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN customers c ON c.id = s.customer_id
       ${whereSql}
       ORDER BY s.id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Record<string, unknown>[]
  const sales = rows.map((row) => {
    const id = row.id as number
    return {
      id,
      transaction_no: row.transaction_no as string,
      user_id: row.user_id as number,
      cashier_name: row.cashier_name as string,
      customer_id: (row.customer_id as number | null) ?? null,
      customer_name: (row.customer_name as string) || null,
      subtotal_c: row.subtotal_c as number,
      discount_c: row.discount_c as number,
      total_c: row.total_c as number,
      status: row.status as Sale['status'],
      shift_id: (row.shift_id as number | null) ?? null,
      notes: (row.notes as string | null) ?? null,
      created_at: row.created_at as string,
      voided_at: (row.voided_at as string | null) ?? null,
      voided_by: (row.voided_by as number | null) ?? null,
      void_reason: (row.void_reason as string | null) ?? null,
      items: getSaleItems(db, id),
      payments: getPayments(db, id)
    }
  })
  return { rows: sales, total }
}

export function createSaleRecord(
  db: Database.Database,
  input: {
    transaction_no: string
    user_id: number
    customer_id: number | null
    subtotal_c: number
    discount_c: number
    total_c: number
    shift_id: number | null
    notes?: string | null
  }
): number {
  const info = db
    .prepare(
      `INSERT INTO sales (transaction_no, user_id, customer_id, subtotal_c, discount_c, total_c, shift_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.transaction_no,
      input.user_id,
      input.customer_id,
      input.subtotal_c,
      input.discount_c,
      input.total_c,
      input.shift_id,
      input.notes ?? null
    )
  return Number(info.lastInsertRowid)
}

export function insertSaleItem(
  db: Database.Database,
  input: {
    sale_id: number
    product_id: number | null
    product_name: string
    unit_name: string
    qty: number
    qty_base: number
    unit_price_c: number
    subtotal_c: number
    cost_base_c: number
  }
): void {
  db.prepare(
    `INSERT INTO sale_items (sale_id, product_id, product_name, unit_name, qty, qty_base, unit_price_c, subtotal_c, cost_base_c)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    input.sale_id,
    input.product_id,
    input.product_name,
    input.unit_name,
    input.qty,
    input.qty_base,
    input.unit_price_c,
    input.subtotal_c,
    input.cost_base_c
  )
}

export function insertPayment(
  db: Database.Database,
  sale_id: number,
  method: Payment['method'],
  amount_c: number,
  reference: string | null
): void {
  db.prepare('INSERT INTO payments (sale_id, method, amount_c, reference) VALUES (?, ?, ?, ?)').run(
    sale_id,
    method,
    amount_c,
    reference
  )
}

export function updateSaleStatus(db: Database.Database, saleId: number, status: Sale['status']): void {
  db.prepare('UPDATE sales SET status = ? WHERE id = ?').run(status, saleId)
}

export function markVoided(db: Database.Database, saleId: number, userId: number, reason: string): void {
  db.prepare(
    `UPDATE sales SET status = 'VOIDED', voided_at = datetime('now','localtime'), voided_by = ?, void_reason = ?
     WHERE id = ?`
  ).run(userId, reason, saleId)
}

export function addRefundedQty(db: Database.Database, saleItemId: number, refundedQtyBase: number): void {
  db.prepare('UPDATE sale_items SET refunded_qty_base = refunded_qty_base + ? WHERE id = ?').run(
    refundedQtyBase,
    saleItemId
  )
}

export function todaySalesC(db: Database.Database): number {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(total_c),0) AS s FROM sales
       WHERE status != 'VOIDED' AND date(created_at) = date('now','localtime')`
    )
    .get() as { s: number }
  return row.s
}