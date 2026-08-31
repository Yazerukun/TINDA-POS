import type Database from 'better-sqlite3'
import type { Refund, RefundItem } from '@shared/types'

export function getRefund(db: Database.Database, id: number): Refund {
  const row = db
    .prepare(
      `SELECT r.*, s.transaction_no, COALESCE(u.full_name, u.username, '') AS user_name
       FROM refunds r
       JOIN sales s ON s.id = r.sale_id
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined
  if (!row) throw new Error('Refund not found.')
  const items = db.prepare('SELECT * FROM refund_items WHERE refund_id = ?').all(id) as RefundItem[]
  return {
    id: row.id as number,
    refund_no: row.refund_no as string,
    sale_id: row.sale_id as number,
    transaction_no: row.transaction_no as string,
    user_id: row.user_id as number,
    user_name: row.user_name as string,
    reason: row.reason as string,
    total_c: row.total_c as number,
    created_at: row.created_at as string,
    items
  }
}

export function nextRefundNo(db: Database.Database): string {
  const row = db.prepare(`SELECT refund_no FROM refunds ORDER BY id DESC LIMIT 1`).get() as
    | { refund_no: string }
    | undefined
  let seq = 1
  if (row) {
    const m = /REF-(\d+)/.exec(row.refund_no)
    if (m) seq = Number(m[1]) + 1
  }
  return `REF-${String(seq).padStart(6, '0')}`
}

export function createRefund(
  db: Database.Database,
  input: {
    sale_id: number
    user_id: number
    reason: string
    total_c: number
    items: { sale_item_id: number; product_id: number; qty: number; qty_base: number; unit_name: string; amount_c: number }[]
  }
): Refund {
  if (!input.reason?.trim()) throw new Error('Refund reason is required.')
  if (input.items.length === 0) throw new Error('Select at least one item to refund.')
  const no = nextRefundNo(db)
  const txn = db.transaction(() => {
    const info = db
      .prepare(`INSERT INTO refunds (refund_no, sale_id, user_id, reason, total_c) VALUES (?, ?, ?, ?, ?)`)
      .run(no, input.sale_id, input.user_id, input.reason.trim(), input.total_c)
    const refundId = Number(info.lastInsertRowid)
    const stmt = db.prepare(
      `INSERT INTO refund_items (refund_id, sale_item_id, product_id, qty, qty_base, unit_name, amount_c)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    for (const it of input.items) stmt.run(refundId, it.sale_item_id, it.product_id, it.qty, it.qty_base, it.unit_name, it.amount_c)
    return refundId
  })
  return getRefund(db, txn())
}

export function refundsForSale(db: Database.Database, saleId: number): Refund[] {
  const rows = db
    .prepare(
      `SELECT r.*, s.transaction_no, COALESCE(u.full_name, u.username, '') AS user_name
       FROM refunds r JOIN sales s ON s.id = r.sale_id LEFT JOIN users u ON u.id = r.user_id
       WHERE r.sale_id = ? ORDER BY r.id DESC`
    )
    .all(saleId) as Record<string, unknown>[]
  return rows.map((row) => {
    const id = row.id as number
    return {
      id,
      refund_no: row.refund_no as string,
      sale_id: row.sale_id as number,
      transaction_no: row.transaction_no as string,
      user_id: row.user_id as number,
      user_name: row.user_name as string,
      reason: row.reason as string,
      total_c: row.total_c as number,
      created_at: row.created_at as string,
      items: db.prepare('SELECT * FROM refund_items WHERE refund_id = ?').all(id) as RefundItem[]
    }
  })
}

export function refundCount(db: Database.Database): number {
  return (db.prepare('SELECT COUNT(*) AS c FROM refunds').get() as { c: number }).c
}