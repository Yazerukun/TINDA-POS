import type Database from 'better-sqlite3'
import type { Product, ProductInput, ProductStatus, ProductUnit } from '@shared/types'

function listUnits(db: Database.Database, productId: number): ProductUnit[] {
  return db
    .prepare('SELECT * FROM product_units WHERE product_id = ? ORDER BY is_default DESC, id')
    .all(productId) as ProductUnit[]
}

export function stockStatusFor(stock: number, threshold: number): Product['stock_status'] {
  if (stock <= 0) return 'OUT_OF_STOCK'
  if (stock <= threshold) return 'LOW_STOCK'
  return 'IN_STOCK'
}

const BASE_SELECT = `
SELECT p.*, c.name AS category_name
FROM products p
LEFT JOIN categories c ON c.id = p.category_id`

function rowToProduct(db: Database.Database, row: Record<string, unknown>): Product {
  const units = listUnits(db, row.id as number)
  const stock = row.stock as number
  const threshold = row.low_stock_threshold as number
  return {
    id: row.id as number,
    category_id: (row.category_id as number | null) ?? null,
    category_name: (row.category_name as string | null) ?? null,
    name: row.name as string,
    sku: row.sku as string,
    barcode: (row.barcode as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    base_unit: row.base_unit as string,
    purchase_cost_c: row.purchase_cost_c as number,
    default_price_c: row.default_price_c as number,
    stock,
    low_stock_threshold: row.low_stock_threshold as number,
    supplier_id: (row.supplier_id as number | null) ?? null,
    has_expiration: !!row.has_expiration,
    image_path: (row.image_path as string | null) ?? null,
    status: row.status as ProductStatus,
    notes: (row.notes as string | null) ?? null,
    units,
    stock_status: stockStatusFor(stock, threshold),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string
  }
}

export interface SearchOptions {
  q?: string
  category_id?: number | null
  status?: string
  limit?: number
  offset?: number
}

export function searchProducts(db: Database.Database, opts: SearchOptions = {}): { rows: Product[]; total: number } {
  const { q, category_id, status, limit = 50, offset = 0 } = opts
  const where: string[] = []
  const params: unknown[] = []
  if (q && q.trim()) {
    where.push(`(p.name LIKE ? OR p.sku LIKE ? OR p.barcode = ? COLLATE NOCASE)`)
    const like = `%${q.trim()}%`
    params.push(like, like, q.trim())
  }
  if (category_id) {
    where.push('p.category_id = ?')
    params.push(category_id)
  }
  if (status) {
    where.push('p.status = ?')
    params.push(status)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const total = (db.prepare(`SELECT COUNT(*) AS c FROM products p ${whereSql}`).get(...params) as { c: number }).c
  const rows = db
    .prepare(`${BASE_SELECT} ${whereSql} ORDER BY p.name COLLATE NOCASE LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as Record<string, unknown>[]
  return { rows: rows.map((r) => rowToProduct(db, r)), total }
}

export function searchProductsSimple(db: Database.Database, q: string, limit = 100): Product[] {
  const s = q.trim()
  if (!s) return []
  const isBarcodeLike = /^[0-9A-Z-]{4,}$/i.test(s)
  const rows = db
    .prepare(
      `${BASE_SELECT}
       WHERE p.status = 'ACTIVE' AND (
         p.name LIKE ? OR p.sku LIKE ? ${isBarcodeLike ? 'OR p.barcode = ?' : ''}
         OR EXISTS (SELECT 1 FROM product_units pu WHERE pu.product_id = p.id AND pu.barcode = ?)
       )
       ORDER BY p.name COLLATE NOCASE LIMIT ?`
    )
    .all(`%${s}%`, `%${s}%`, ...(isBarcodeLike ? [s, s] : [s]), limit) as Record<string, unknown>[]
  return rows.map((r) => rowToProduct(db, r))
}

export function getProduct(db: Database.Database, id: number): Product {
  const row = db.prepare(`${BASE_SELECT} WHERE p.id = ?`).get(id) as Record<string, unknown> | undefined
  if (!row) throw new Error('Product not found.')
  return rowToProduct(db, row)
}

export function findByBarcode(db: Database.Database, barcode: string): Product | undefined {
  const row = db
    .prepare(`${BASE_SELECT} WHERE p.barcode = ? AND p.status = 'ACTIVE'`)
    .get(barcode) as Record<string, unknown> | undefined
  if (row) return rowToProduct(db, row)
  const unit = db.prepare(`SELECT product_id FROM product_units WHERE barcode = ? LIMIT 1`).get(barcode) as
    | { product_id: number }
    | undefined
  return unit ? getProduct(db, unit.product_id) : undefined
}

export function findBySku(db: Database.Database, sku: string): Product | undefined {
  const row = db.prepare(`${BASE_SELECT} WHERE p.sku = ? COLLATE NOCASE`).get(sku) as Record<string, unknown> | undefined
  return row ? rowToProduct(db, row) : undefined
}

export function validateProductInput(db: Database.Database, input: ProductInput, excludeId?: number): void {
  if (!input.name || !input.name.trim()) throw new Error('Product name is required.')
  if (!input.base_unit || !input.base_unit.trim()) throw new Error('Base unit is required.')
  if (input.default_price_c < 0) throw new Error('Selling price cannot be negative.')
  if (input.purchase_cost_c < 0) throw new Error('Purchase cost cannot be negative.')
  if (input.low_stock_threshold < 0) throw new Error('Low stock threshold cannot be negative.')
  const ex = excludeId ? 'AND id != ?' : ''
  const args = excludeId ? [input.sku.trim(), excludeId] : [input.sku.trim()]
  if (input.sku?.trim()) {
    const dupe = db.prepare(`SELECT id FROM products WHERE sku = ? COLLATE NOCASE ${ex}`).get(...args) as { id: number } | undefined
    if (dupe) throw new Error('Duplicate SKU.')
  }
  if (input.barcode?.trim()) {
    const dupe = db.prepare(`SELECT p.id FROM products p WHERE p.barcode = ? AND p.id != ?`).get(input.barcode.trim(), excludeId ?? -1) as
      | { id: number }
      | undefined
    if (dupe) throw new Error('Duplicate barcode.')
    const unitDupe = db.prepare(`SELECT id FROM product_units WHERE barcode = ?`).get(input.barcode.trim()) as
      | { id: number }
      | undefined
    if (unitDupe) throw new Error('Duplicate barcode on a product unit.')
  }
  if (!input.units || input.units.length === 0) throw new Error('At least one selling unit is required.')
  let foundBase = false
  for (const u of input.units) {
    if (!u.name?.trim()) throw new Error('Unit name is required.')
    if (!Number.isInteger(u.conversion_to_base) || u.conversion_to_base < 1) throw new Error('Invalid unit conversion.')
    if (u.selling_price_c < 0) throw new Error('Unit price cannot be negative.')
    if (u.conversion_to_base === 1) foundBase = true
    if (u.barcode?.trim()) {
      const dup = db.prepare(`SELECT id FROM product_units WHERE barcode = ?`).get(u.barcode.trim())
      if (dup) throw new Error(`Barcode ${u.barcode} already in use.`)
    }
  }
  if (!foundBase) throw new Error('One unit must convert to exactly 1 base unit.')
}

export function createProduct(db: Database.Database, input: ProductInput, userId: number): Product {
  validateProductInput(db, input)
  const txn = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO products
         (category_id, name, sku, barcode, description, base_unit, purchase_cost_c, default_price_c,
          low_stock_threshold, supplier_id, has_expiration, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.category_id,
        input.name.trim(),
        input.sku.trim(),
        input.barcode?.trim() || null,
        input.description?.trim() || null,
        input.base_unit.trim(),
        input.purchase_cost_c,
        input.default_price_c,
        input.low_stock_threshold,
        input.supplier_id,
        input.has_expiration ? 1 : 0,
        input.notes?.trim() || null
      )
    const productId = Number(info.lastInsertRowid)
    insertUnits(db, productId, input.units)
    return productId
  })
  const id = txn()
  if (input.initial_stock_base && input.initial_stock_base !== 0) {
    adjustStock(db, id, input.initial_stock_base, 'INITIAL_STOCK', 'Initial stock', userId)
  }
  return getProduct(db, id)
}

export function insertUnits(db: Database.Database, productId: number, units: ProductInput['units']): void {
  const stmt = db.prepare(
    `INSERT INTO product_units (product_id, name, conversion_to_base, barcode, selling_price_c, is_default) VALUES (?, ?, ?, ?, ?, ?)`
  )
  for (const u of units) {
    stmt.run(productId, u.name.trim(), u.conversion_to_base, u.barcode?.trim() || null, u.selling_price_c, u.is_default ? 1 : 0)
  }
}

export function updateProduct(db: Database.Database, id: number, input: Partial<ProductInput>, userId: number): Product {
  const cur = getProduct(db, id)
  const merged: ProductInput = {
    category_id: input.category_id !== undefined ? input.category_id : cur.category_id,
    name: input.name ?? cur.name,
    sku: input.sku ?? cur.sku,
    barcode: input.barcode !== undefined ? input.barcode : cur.barcode,
    description: input.description !== undefined ? input.description : cur.description,
    base_unit: input.base_unit ?? cur.base_unit,
    purchase_cost_c: input.purchase_cost_c ?? cur.purchase_cost_c,
    default_price_c: input.default_price_c ?? cur.default_price_c,
    low_stock_threshold: input.low_stock_threshold ?? cur.low_stock_threshold,
    supplier_id: input.supplier_id !== undefined ? input.supplier_id : cur.supplier_id,
    has_expiration: input.has_expiration !== undefined ? input.has_expiration : cur.has_expiration,
    notes: input.notes !== undefined ? input.notes : cur.notes,
    units: input.units ?? cur.units
  }
  validateProductInput(db, merged, id)
  const txn = db.transaction(() => {
    db.prepare(
      `UPDATE products SET category_id = ?, name = ?, sku = ?, barcode = ?, description = ?, base_unit = ?,
       purchase_cost_c = ?, default_price_c = ?, low_stock_threshold = ?, supplier_id = ?, has_expiration = ?,
       notes = ?, updated_at = datetime('now','localtime') WHERE id = ?`
    ).run(
      merged.category_id,
      merged.name.trim(),
      merged.sku.trim(),
      merged.barcode?.trim() || null,
      merged.description?.trim() || null,
      merged.base_unit.trim(),
      merged.purchase_cost_c,
      merged.default_price_c,
      merged.low_stock_threshold,
      merged.supplier_id,
      merged.has_expiration ? 1 : 0,
      merged.notes?.trim() || null,
      id
    )
    db.prepare('DELETE FROM product_units WHERE product_id = ?').run(id)
    insertUnits(db, id, merged.units)
  })
  txn()
  void userId
  return getProduct(db, id)
}

export function setProductStatus(db: Database.Database, id: number, status: ProductStatus, _userId: number): Product {
  db.prepare(`UPDATE products SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(status, id)
  return getProduct(db, id)
}

export function adjustStock(
  db: Database.Database,
  productId: number,
  change: number,
  movementType: string,
  reason: string | null,
  userId: number,
  reference?: string
): void {
  const p = db.prepare('SELECT id, stock, base_unit FROM products WHERE id = ?').get(productId) as
    | { id: number; stock: number; base_unit: string }
    | undefined
  if (!p) throw new Error('Product not found.')
  if (!Number.isInteger(change)) throw new Error('Quantity must be a whole base unit.')
  const before = p.stock
  const after = before + change
  if (after < 0) throw new Error('Insufficient stock — cannot go negative.')
  db.prepare("UPDATE products SET stock = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(after, productId)
  db.prepare(
    `INSERT INTO inventory_movements
     (product_id, quantity_before, quantity_change, quantity_after, unit, movement_type, reason, reference, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(productId, before, change, after, p.base_unit, movementType, reason, reference ?? null, userId)
}

export function listProductsBySupplier(db: Database.Database, supplierId: number): Product[] {
  const rows = db
    .prepare(`${BASE_SELECT} WHERE p.supplier_id = ? AND p.status = 'ACTIVE' ORDER BY p.name`)
    .all(supplierId) as Record<string, unknown>[]
  return rows.map((r) => rowToProduct(db, r))
}

export function productCount(db: Database.Database, status?: string): number {
  if (status) return (db.prepare('SELECT COUNT(*) AS c FROM products WHERE status = ?').get(status) as { c: number }).c
  return (db.prepare('SELECT COUNT(*) AS c FROM products').get() as { c: number }).c
}

export function lowStockProducts(db: Database.Database, includeOut = false): Product[] {
  const rows = db
    .prepare(
      `${BASE_SELECT}
       WHERE p.status = 'ACTIVE' AND p.stock <= p.low_stock_threshold
       ORDER BY p.stock ASC LIMIT 50`
    )
    .all() as Record<string, unknown>[]
  const all = rows.map((r) => rowToProduct(db, r))
  return includeOut ? all : all.filter((p) => p.stock > 0)
}

export function outOfStockProducts(db: Database.Database): Product[] {
  const rows = db
    .prepare(`${BASE_SELECT} WHERE p.status = 'ACTIVE' AND p.stock <= 0 ORDER BY p.name LIMIT 50`)
    .all() as Record<string, unknown>[]
  return rows.map((r) => rowToProduct(db, r))
}