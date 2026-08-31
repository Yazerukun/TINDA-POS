import type Database from 'better-sqlite3'
import type { InventoryMovement, InventoryMovementType } from '@shared/types'

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