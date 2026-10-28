import type Database from 'better-sqlite3'
import type { InventoryMovement, InventoryMovementType, StockReceivingRecord, StockReceivingSource, StoreUseRecord, StoreUseItemRecord } from '@shared/types'

export function listMovements(
  db: Database.Database,
  opts: {
    product_id?: number
    movement_type?: InventoryMovementType | ''
    limit?: number
    offset?: number
    from?: string
    to?: string
    search?: string
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
  if (opts.search?.trim()) {
    const q = `%${opts.search.trim()}%`
    where.push(
      '(p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ? OR im.reason LIKE ? OR im.reference LIKE ? OR u.full_name LIKE ? OR u.username LIKE ?)'
    )
    params.push(q, q, q, q, q, q, q)
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  const joins = 'LEFT JOIN products p ON p.id = im.product_id LEFT JOIN users u ON u.id = im.user_id'
  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM inventory_movements im ${joins} ${whereSql}`).get(...params) as { c: number }
  ).c
  const limit = opts.limit ?? 100
  const offset = opts.offset ?? 0
  const rows = db
    .prepare(
      `SELECT im.*,
              COALESCE(p.name, '') AS product_name,
              p.sku AS product_sku,
              p.barcode AS product_barcode,
              COALESCE(u.full_name, u.username, '') AS user_name
       FROM inventory_movements im
       ${joins}
       ${whereSql}
       ORDER BY im.id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as InventoryMovement[]
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

export function listStoreUseHistory(
  db: Database.Database,
  opts: {
    search?: string
    from?: string
    to?: string
    limit?: number
    offset?: number
  } = {}
): { rows: StoreUseRecord[]; total: number } {
  const where: string[] = ["(e.reference LIKE 'SU-%' OR e.description LIKE 'Store Use%')"]
  const params: unknown[] = []

  if (opts.from) {
    where.push('(e.expense_date >= ? OR substr(e.created_at, 1, 10) >= ?)')
    params.push(opts.from, opts.from)
  }
  if (opts.to) {
    where.push('(e.expense_date <= ? OR substr(e.created_at, 1, 10) <= ?)')
    params.push(opts.to, opts.to)
  }
  if (opts.search?.trim()) {
    const q = `%${opts.search.trim()}%`
    where.push('(e.reference LIKE ? OR e.description LIKE ? OR e.notes LIKE ?)')
    params.push(q, q, q)
  }

  const whereSql = `WHERE ${where.join(' AND ')}`
  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM expenses e ${whereSql}`).get(...params) as { c: number }
  ).c

  const limit = opts.limit ?? 100
  const offset = opts.offset ?? 0

  const expenseRows = db
    .prepare(
      `SELECT e.id AS expense_id, e.reference, e.amount_c AS total_amount_c,
              e.expense_date, e.description, e.notes, e.created_at,
              COALESCE(u.full_name, u.username, 'Cashier') AS cashier_name
       FROM expenses e
       LEFT JOIN users u ON u.id = e.user_id
       ${whereSql}
       ORDER BY e.created_at DESC, e.id DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Array<{
      expense_id: number
      reference: string | null
      total_amount_c: number
      expense_date: string
      description: string | null
      notes: string | null
      created_at: string
      cashier_name: string
    }>

  // Prepared statement to query inventory_movements for line items if needed
  const getMovementsStmt = db.prepare(`
    SELECT im.id, im.product_id, COALESCE(p.name, 'Unknown Product') AS product_name,
           COALESCE(im.received_unit, im.unit, p.base_unit, 'pc') AS unit,
           COALESCE(im.received_quantity, ABS(im.quantity_change)) AS quantity,
           ABS(im.quantity_change) AS quantity_base,
           COALESCE(im.unit_cost_c, 0) AS unit_cost_c,
           im.quantity_before AS stock_before,
           im.quantity_after AS stock_after,
           im.reason
    FROM inventory_movements im
    LEFT JOIN products p ON p.id = im.product_id
    WHERE im.reference = ? AND im.movement_type = 'STORE_USE'
    ORDER BY im.id ASC
  `)

  const records: StoreUseRecord[] = expenseRows.map((e) => {
    let items: StoreUseItemRecord[] = []
    let reason = 'Store Repair & Maintenance'
    let notesText: string | null = null

    // 1. Try parsing JSON_DATA from e.notes
    if (e.notes && e.notes.includes('JSON_DATA:')) {
      try {
        const jsonPart = e.notes.substring(e.notes.indexOf('JSON_DATA:') + 'JSON_DATA:'.length)
        const parsed = JSON.parse(jsonPart)
        if (Array.isArray(parsed) && parsed.length > 0) {
          items = parsed
        }
      } catch {}
    }

    // 2. Extract Reason and Notes from text notes
    if (e.notes) {
      const parts = e.notes.split(' | ')
      for (const part of parts) {
        if (part.startsWith('Reason:')) {
          reason = part.replace('Reason:', '').trim()
        } else if (part.startsWith('Notes:')) {
          notesText = part.replace('Notes:', '').trim()
        }
      }
    }

    if (!reason && e.description) {
      const match = e.description.match(/\(([^)]+)\)/)
      if (match && match[1]) reason = match[1]
    }

    // 3. Fallback: if items were not in JSON_DATA, load from inventory_movements
    if (items.length === 0 && e.reference) {
      const movements = getMovementsStmt.all(e.reference) as Array<{
        id: number
        product_id: number
        product_name: string
        unit: string
        quantity: number
        quantity_base: number
        unit_cost_c: number
        stock_before: number
        stock_after: number
        reason: string | null
      }>

      if (movements.length > 0) {
        items = movements.map((m) => {
          const lineTotal = Math.round(m.quantity * m.unit_cost_c)
          return {
            product_id: m.product_id,
            product_name: m.product_name,
            quantity: m.quantity,
            unit: m.unit,
            quantity_base: m.quantity_base,
            unit_cost_c: m.unit_cost_c,
            total_amount_c: lineTotal > 0 ? lineTotal : Math.round(e.total_amount_c / movements.length),
            stock_before: m.stock_before,
            stock_after: m.stock_after
          }
        })
      }
    }

    const firstItem = items[0]

    return {
      success: true,
      reference: e.reference || `SU-${e.expense_date}-${e.expense_id}`,
      items,
      total_amount_c: e.total_amount_c,
      total_items: items.length || 1,
      expense_id: e.expense_id,
      reason: reason || 'Store Operation',
      notes: notesText,
      cashier_name: e.cashier_name,
      created_at: e.created_at,
      product_id: firstItem?.product_id,
      product_name: firstItem?.product_name,
      quantity: firstItem?.quantity,
      unit: firstItem?.unit,
      quantity_base: firstItem?.quantity_base,
      unit_cost_c: firstItem?.unit_cost_c,
      stock_before: firstItem?.stock_before,
      stock_after: firstItem?.stock_after
    }
  })

  return { rows: records, total }
}

