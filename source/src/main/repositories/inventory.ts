import type Database from 'better-sqlite3'
import type { InventoryMovement, InventoryMovementType, StockReceivingRecord, StockReceivingSource } from '@shared/types'

export function listMovements(
  db: Database.Database,
  opts: {
    product_id?: number
    movement_type?: InventoryMovementType | ''
    limit?: number
    offset?: number
    from?: string
    to?: string
  } = {}
): { rows: InventoryMovement[]; total: number } {
  const where: string[] = []
  const params: unknown[] = []
  if (opts.product_id) {
    where.push('im.product_id = ?')
    params.push(opts.product_id)
  }
  if (opts.movement_type) {
    where.push('im.movement_type = ?')
    params.push(opts.movement_type)
  }
  if (opts.from) {
    where.push('im.created_at >= ?')
    params.push(opts.from)
  }
  if (opts.to) {
    where.push('im.created_at <= ?')
    params.push(opts.to)
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) AS c FROM inventory_movements im ${whereSql}`).get(...params) as { c: number }).c
  const limit = opts.limit ?? 100
  const offset = opts.offset ?? 0
  const rows = db
    .prepare(
      `SELECT im.*, COALESCE(u.full_name, u.username, '') AS user_name
       FROM inventory_movements im LEFT JOIN users u ON u.id = im.user_id
       ${whereSql} ORDER BY im.id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as (InventoryMovement & { user_name: string })[]
  return { rows, total }
}

export function movementsForProduct(db: Database.Database, productId: number, limit = 100): InventoryMovement[] {
  return db
    .prepare('SELECT * FROM inventory_movements WHERE product_id = ? ORDER BY id DESC LIMIT ?')
    .all(productId, limit) as InventoryMovement[]
}

export function listReceiving(
  db: Database.Database,
  opts: { search?: string; from?: string; to?: string; supplier_id?: number; source?: StockReceivingSource | ''; limit?: number; offset?: number } = {}
): { rows: StockReceivingRecord[]; total: number; total_cost_c: number } {
  const sourceSql = `CASE
    WHEN im.source IS NOT NULL THEN im.source
    WHEN im.movement_type = 'INITIAL_STOCK' AND im.reason LIKE '%CSV%' THEN 'CSV OPENING STOCK'
    WHEN im.movement_type = 'INITIAL_STOCK' THEN 'INITIAL STOCK'
    WHEN im.reason LIKE 'Restock:%' THEN 'RESTOCK'
    ELSE 'PURCHASE' END`
  const where = ["im.quantity_change > 0", "im.movement_type IN ('PURCHASE','INITIAL_STOCK')"]
  const params: unknown[] = []
  if (opts.search?.trim()) { where.push('p.name LIKE ?'); params.push(`%${opts.search.trim()}%`) }
  if (opts.from) { where.push('date(im.created_at) >= date(?)'); params.push(opts.from) }
  if (opts.to) { where.push('date(im.created_at) <= date(?)'); params.push(opts.to) }
  if (opts.supplier_id) { where.push('COALESCE(im.supplier_id, pu.supplier_id) = ?'); params.push(opts.supplier_id) }
  if (opts.source) { where.push(`${sourceSql} = ?`); params.push(opts.source) }
  const whereSql = `WHERE ${where.join(' AND ')}`
  const joins = `
    JOIN products p ON p.id = im.product_id
    LEFT JOIN users u ON u.id = im.user_id
    LEFT JOIN purchases pu ON pu.purchase_no = im.reference OR (im.reference IS NOT NULL AND pu.reference = im.reference)
    LEFT JOIN purchase_items pi ON pi.purchase_id = pu.id AND pi.product_id = im.product_id
    LEFT JOIN suppliers s ON s.id = COALESCE(im.supplier_id, pu.supplier_id)`
  const total = (db.prepare(`SELECT COUNT(DISTINCT im.id) AS c FROM inventory_movements im ${joins} ${whereSql}`).get(...params) as { c: number }).c
  const summary = db.prepare(`SELECT COALESCE(SUM(total_cost_c), 0) AS total_cost_c FROM (
    SELECT im.id, COALESCE(im.unit_cost_c, pi.unit_cost_c) * COALESCE(im.received_quantity, pi.qty, im.quantity_change) AS total_cost_c
    FROM inventory_movements im ${joins} ${whereSql} GROUP BY im.id
  )`).get(...params) as { total_cost_c: number }
  const rows = db.prepare(`
    SELECT im.id, im.product_id, p.name AS product_name,
      COALESCE(im.received_quantity, pi.qty, im.quantity_change) AS quantity_received,
      COALESCE(im.received_unit, pi.unit_name, im.unit, p.base_unit) AS received_unit,
      im.quantity_change AS base_quantity, p.base_unit,
      im.quantity_before AS previous_stock, im.quantity_after AS new_stock,
      COALESCE(im.supplier_id, pu.supplier_id) AS supplier_id, s.name AS supplier_name,
      COALESCE(im.unit_cost_c, pi.unit_cost_c) AS unit_cost_c,
      CASE WHEN COALESCE(im.unit_cost_c, pi.unit_cost_c) IS NULL THEN NULL
        ELSE COALESCE(im.unit_cost_c, pi.unit_cost_c) * COALESCE(im.received_quantity, pi.qty, im.quantity_change) END AS total_cost_c,
      COALESCE(im.reference, pu.reference, pu.purchase_no) AS reference,
      COALESCE(im.receiving_notes, pu.notes, im.reason) AS notes,
      COALESCE(u.full_name, u.username, '') AS received_by,
      ${sourceSql} AS source, im.created_at
    FROM inventory_movements im ${joins} ${whereSql}
    GROUP BY im.id ORDER BY im.id DESC LIMIT ? OFFSET ?
  `).all(...params, opts.limit ?? 250, opts.offset ?? 0) as StockReceivingRecord[]
  return { rows, total, total_cost_c: summary.total_cost_c }
}
