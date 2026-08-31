import type Database from 'better-sqlite3'
import type { Purchase, PurchaseItem } from '@shared/types'

export function getPurchase(db: Database.Database, id: number): Purchase {
  const row = db
    .prepare(
      `SELECT p.*, s.name AS supplier_name, COALESCE(u.full_name, u.username, '') AS user_name
       FROM purchases p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       LEFT JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined
  if (!row) throw new Error('Purchase not found.')
  const items = db.prepare('SELECT * FROM purchase_items WHERE purchase_id = ? ORDER BY id').all(id) as PurchaseItem[]
  return {
    id: row.id as number,
    purchase_no: row.purchase_no as string,
    supplier_id: row.supplier_id as number,
    supplier_name: (row.supplier_name as string) || '—',
    purchase_date: row.purchase_date as string,
    reference: (row.reference as string | null) ?? null,
    total_c: row.total_c as number,
    notes: (row.notes as string | null) ?? null,
    user_id: row.user_id as number,
    user_name: row.user_name as string,
    created_at: row.created_at as string,
    items
  }
}

export function nextPurchaseNo(db: Database.Database): string {
  const row = db.prepare(`SELECT purchase_no FROM purchases ORDER BY id DESC LIMIT 1`).get() as
    | { purchase_no: string }
    | undefined
  let seq = 1
  if (row) {
    const m = /PPO-(\d+)/.exec(row.purchase_no)
    if (m) seq = Number(m[1]) + 1
  }
  return `PPO-${String(seq).padStart(6, '0')}`
}

export function createPurchase(
  db: Database.Database,
  input: {
    supplier_id: number
    purchase_date: string
    reference?: string | null
    notes?: string | null
    user_id: number
    items: { product_id: number; unit_name: string; qty: number; qty_base: number; unit_cost_c: number; subtotal_c: number }[]
  }
): Purchase {
  if (!input.supplier_id) throw new Error('Supplier is required.')
  if (input.items.length === 0) throw new Error('Purchase must have at least one item.')
  const total = input.items.reduce((s, i) => s + i.subtotal_c, 0)
  const no = nextPurchaseNo(db)
  const txn = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO purchases (purchase_no, supplier_id, purchase_date, reference, total_c, notes, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(no, input.supplier_id, input.purchase_date, input.reference ?? null, total, input.notes ?? null, input.user_id)
    const purchaseId = Number(info.lastInsertRowid)
    const stmt = db.prepare(
      `INSERT INTO purchase_items (purchase_id, product_id, unit_name, qty, qty_base, unit_cost_c, subtotal_c)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    for (const it of input.items) {
      stmt.run(purchaseId, it.product_id, it.unit_name, it.qty, it.qty_base, it.unit_cost_c, it.subtotal_c)
    }
    return purchaseId
  })
  const id = txn()
  return getPurchase(db, id)
}

export function listPurchases(
  db: Database.Database,
  opts: { supplier_id?: number; from?: string; to?: string; limit?: number; offset?: number } = {}
): { rows: Purchase[]; total: number } {
  const where: string[] = []
  const params: unknown[] = []
  if (opts.supplier_id) {
    where.push('p.supplier_id = ?')
    params.push(opts.supplier_id)
  }
  if (opts.from) {
    where.push('p.purchase_date >= ?')
    params.push(opts.from)
  }
  if (opts.to) {
    where.push('p.purchase_date <= ?')
    params.push(opts.to)
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) AS c FROM purchases p ${whereSql}`).get(...params) as { c: number }).c
  const limit = opts.limit ?? 50
  const offset = opts.offset ?? 0
  const rows = db
    .prepare(
      `SELECT p.*, s.name AS supplier_name, COALESCE(u.full_name, u.username, '') AS user_name
       FROM purchases p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       LEFT JOIN users u ON u.id = p.user_id
       ${whereSql} ORDER BY p.id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Record<string, unknown>[]
  return {
    rows: rows.map((r) => ({
      id: r.id as number,
      purchase_no: r.purchase_no as string,
      supplier_id: r.supplier_id as number,
      supplier_name: (r.supplier_name as string) || '—',
      purchase_date: r.purchase_date as string,
      reference: (r.reference as string | null) ?? null,
      total_c: r.total_c as number,
      notes: (r.notes as string | null) ?? null,
      user_id: r.user_id as number,
      user_name: r.user_name as string,
      created_at: r.created_at as string,
      items: db.prepare('SELECT * FROM purchase_items WHERE purchase_id = ? ORDER BY id').all(r.id as number) as PurchaseItem[]
    })),
    total
  }
}