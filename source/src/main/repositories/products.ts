import type Database from 'better-sqlite3'
import type { Product, ProductInput, ProductStatus, ProductUnit } from '@shared/types'
import { getSettings } from './settings'
import { applyExpirationStock, batchesFor, configureExpiration, validateExpiration, type ExpirationStockOptions } from './expiration'
import { localDate } from '@shared/expiration'

// The low-stock alert default a NEW product gets when the form/import does not
// specify one. v1.0.8 fix: the store setting (Settings → Default Low Stock
// Alert) is the single source of truth instead of a hard-coded 5.
export function defaultLowStock(db: Database.Database): number {
  return getSettings(db).default_low_stock
}

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

export function calculateCompositeStock(db: Database.Database, productId: number): number | null {
  try {
    const leaves = resolveLeafComponents(db, productId)
    if (leaves.size === 0) return null
    let maxBundles = Infinity
    for (const [leafId, leafData] of leaves) {
      if (leafId === productId) continue
      const comp = db.prepare('SELECT stock FROM products WHERE id = ?').get(leafId) as
        | { stock: number }
        | undefined
      if (!comp || leafData.qty <= 0) {
        maxBundles = 0
        break
      }
      const possible = Math.floor(Math.max(0, Number(comp.stock) || 0) / leafData.qty)
      maxBundles = Math.min(maxBundles, possible)
    }
    return maxBundles === Infinity ? null : Math.max(0, maxBundles)
  } catch {
    return null
  }
}

function rowToProduct(db: Database.Database, row: Record<string, unknown>): Product {
  const productId = row.id as number
  const units = listUnits(db, productId)
  const itemType = ((row.item_type as string) || 'STANDARD') as import('@shared/types').ProductItemType
  const rawStock = row.stock as number
  const compositeStock = itemType === 'COMPOSITE' ? calculateCompositeStock(db, productId) : null
  const stock = compositeStock !== null ? compositeStock : rawStock
  const rawCostC = row.purchase_cost_c as number
  const purchaseCostC =
    itemType === 'COMPOSITE' && rawCostC === 0 ? calculateRollupCost(db, productId) : rawCostC
  const threshold = row.low_stock_threshold as number
  const mode = (row.expiration_mode ?? 'NONE') as NonNullable<Product['expiration_mode']>
  const batches = mode === 'BATCH' ? batchesFor(db, productId) : []
  const date = (row.expiration_date ?? null) as string | null
  const today = localDate()
  return {
    id: productId,
    category_id: (row.category_id as number | null) ?? null,
    category_name: (row.category_name as string | null) ?? null,
    name: row.name as string,
    sku: row.sku as string,
    barcode: (row.barcode as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    base_unit: row.base_unit as string,
    purchase_cost_c: purchaseCostC,
    default_price_c: row.default_price_c as number,
    srp_c: (row.srp_c as number | null) ?? null,
    wholesale_price_c: (row.wholesale_price_c as number | null) ?? null,
    wholesale_min_qty: (row.wholesale_min_qty as number | null) ?? null,
    stock,
    low_stock_threshold: row.low_stock_threshold as number,
    supplier_id: (row.supplier_id as number | null) ?? null,
    has_expiration: !!row.has_expiration,
    expiration_mode: mode,
    expiration_date: date,
    batches,
    sellable_stock:
      compositeStock !== null
        ? compositeStock
        : mode === 'BATCH'
        ? batches.reduce((n, b) => n + (b.expiration_date && b.expiration_date >= today ? b.quantity : 0), 0)
        : mode === 'ITEM' && (!date || date < today)
        ? 0
        : stock,
    image_path: (row.image_path as string | null) ?? null,
    status: row.status as ProductStatus,
    notes: (row.notes as string | null) ?? null,
    units,
    stock_status: stockStatusFor(stock, threshold),
    item_type: itemType,
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
    const trimmed = q.trim()
    where.push(`(p.name LIKE ? OR p.sku LIKE ? OR p.barcode = ? COLLATE NOCASE OR EXISTS (SELECT 1 FROM product_units pu WHERE pu.product_id = p.id AND pu.barcode = ? COLLATE NOCASE))`)
    const like = `%${trimmed}%`
    params.push(like, like, trimmed, trimmed)
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

  let orderBySql = 'p.name COLLATE NOCASE'
  const queryParams = [...params]
  if (q && q.trim()) {
    const trimmed = q.trim()
    orderBySql = `
      (CASE
        WHEN p.barcode = ? COLLATE NOCASE THEN 0
        WHEN EXISTS (SELECT 1 FROM product_units pu WHERE pu.product_id = p.id AND pu.barcode = ? COLLATE NOCASE) THEN 1
        WHEN p.sku = ? COLLATE NOCASE THEN 2
        WHEN p.name = ? COLLATE NOCASE THEN 3
        WHEN p.name LIKE ? COLLATE NOCASE THEN 4
        ELSE 5
      END), p.name COLLATE NOCASE
    `
    queryParams.push(trimmed, trimmed, trimmed, trimmed, `${trimmed}%`)
  }

  const rows = db
    .prepare(`${BASE_SELECT} ${whereSql} ORDER BY ${orderBySql} LIMIT ? OFFSET ?`)
    .all(...queryParams, limit, offset) as Record<string, unknown>[]
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
  const prod = rowToProduct(db, row)
  if (prod.item_type === 'COMPOSITE') {
    prod.recipe = getRecipe(db, id)
  }
  return prod
}

export function findByBarcode(db: Database.Database, barcode: string): Product | undefined {
  const row = db
    .prepare(`${BASE_SELECT} WHERE p.barcode = ? AND p.status = 'ACTIVE'`)
    .get(barcode) as Record<string, unknown> | undefined
  if (row) return rowToProduct(db, row)
  const unit = db.prepare(`SELECT u.product_id FROM product_units u JOIN products p ON u.product_id = p.id WHERE u.barcode = ? AND p.status = 'ACTIVE' LIMIT 1`).get(barcode) as
    | { product_id: number }
    | undefined
  return unit ? getProduct(db, unit.product_id) : undefined
}

export function lookupBarcodeDetails(db: Database.Database, barcode: string): {
  exists: boolean
  product?: Product
  unitName?: string
  isArchived?: boolean
} {
  const trimmed = barcode?.trim() || ''
  if (!trimmed) return { exists: false }

  // 1. Check active product primary barcode
  const activeProd = db.prepare(`${BASE_SELECT} WHERE p.barcode = ? AND p.status = 'ACTIVE'`).get(trimmed) as Record<string, unknown> | undefined
  if (activeProd) {
    return { exists: true, product: rowToProduct(db, activeProd), isArchived: false }
  }

  // 2. Check active product unit barcode
  const activeUnit = db.prepare(`
    SELECT u.product_id, u.name as unit_name
    FROM product_units u
    JOIN products p ON u.product_id = p.id
    WHERE u.barcode = ? AND p.status = 'ACTIVE'
    LIMIT 1
  `).get(trimmed) as { product_id: number; unit_name: string } | undefined
  if (activeUnit) {
    return { exists: true, product: getProduct(db, activeUnit.product_id), unitName: activeUnit.unit_name, isArchived: false }
  }

  // 3. Check archived product primary barcode
  const archProd = db.prepare(`${BASE_SELECT} WHERE p.barcode = ? AND p.status = 'ARCHIVED'`).get(trimmed) as Record<string, unknown> | undefined
  if (archProd) {
    return { exists: true, product: rowToProduct(db, archProd), isArchived: true }
  }

  // 4. Check archived product unit barcode
  const archUnit = db.prepare(`
    SELECT u.product_id, u.name as unit_name
    FROM product_units u
    JOIN products p ON u.product_id = p.id
    WHERE u.barcode = ? AND p.status = 'ARCHIVED'
    LIMIT 1
  `).get(trimmed) as { product_id: number; unit_name: string } | undefined
  if (archUnit) {
    return { exists: true, product: getProduct(db, archUnit.product_id), unitName: archUnit.unit_name, isArchived: true }
  }

  return { exists: false }
}

export function findBySku(db: Database.Database, sku: string): Product | undefined {
  const row = db.prepare(`${BASE_SELECT} WHERE p.sku = ? COLLATE NOCASE`).get(sku) as Record<string, unknown> | undefined
  return row ? rowToProduct(db, row) : undefined
}

export function generateSku(db: Database.Database): string {
  const maxRow = db.prepare(`SELECT MAX(id) as maxId FROM products`).get() as { maxId: number | null } | undefined
  const nextId = (maxRow?.maxId ?? 0) + 1
  let candidate = `SKU-${String(nextId).padStart(4, '0')}`
  let count = 0
  while (db.prepare(`SELECT id FROM products WHERE sku = ? COLLATE NOCASE`).get(candidate)) {
    count++
    candidate = `SKU-${String(nextId + count).padStart(4, '0')}`
  }
  return candidate
}

export function validateProductInput(db: Database.Database, input: ProductInput, excludeId?: number): void {
  if (input.expiration_mode !== undefined) validateExpiration(input.expiration_mode, input.expiration_date)
  if (!input.name || !input.name.trim()) throw new Error('Product name is required.')
  if (!input.base_unit || !input.base_unit.trim()) throw new Error('Base unit is required.')
  if (input.default_price_c < 0) throw new Error('Selling price cannot be negative.')
  if (input.purchase_cost_c < 0) throw new Error('Purchase cost cannot be negative.')
  if (input.srp_c !== undefined && input.srp_c !== null && input.srp_c < 0) throw new Error('Suggested retail price cannot be negative.')
  if (input.wholesale_price_c !== undefined && input.wholesale_price_c !== null && input.wholesale_price_c < 0) throw new Error('Wholesale price cannot be negative.')
  if (input.wholesale_min_qty !== undefined && input.wholesale_min_qty !== null && input.wholesale_min_qty < 1) throw new Error('Minimum wholesale quantity must be at least 1.')
  if ((input.low_stock_threshold ?? 0) < 0) throw new Error('Low stock threshold cannot be negative.')
  const ex = excludeId ? 'AND id != ?' : ''
  const trimmedSku = input.sku?.trim() || ''
  if (trimmedSku) {
    const args = excludeId ? [trimmedSku, excludeId] : [trimmedSku]
    const dupe = db.prepare(`SELECT id FROM products WHERE sku = ? COLLATE NOCASE ${ex}`).get(...args) as { id: number } | undefined
    if (dupe) throw new Error('Duplicate SKU.')
  }
  const trimmedBarcode = input.barcode?.trim() || null
  if (trimmedBarcode) {
    if (input.reassign_barcode) {
      // Reassign barcode: unbind from any other products or units
      db.prepare(`UPDATE products SET barcode = NULL WHERE barcode = ? AND id != ?`).run(trimmedBarcode, excludeId ?? -1)
      db.prepare(`UPDATE product_units SET barcode = NULL WHERE barcode = ? ${excludeId ? 'AND product_id != ?' : ''}`).run(trimmedBarcode, ...(excludeId ? [excludeId] : []))
    } else {
      // Auto-free barcode if it was held by an ARCHIVED product so it doesn't block re-adding items
      db.prepare(`UPDATE products SET barcode = NULL WHERE barcode = ? AND status = 'ARCHIVED' AND id != ?`).run(trimmedBarcode, excludeId ?? -1)
      db.prepare(`UPDATE product_units SET barcode = NULL WHERE barcode = ? AND product_id IN (SELECT id FROM products WHERE status = 'ARCHIVED' AND id != ?)`).run(trimmedBarcode, excludeId ?? -1)

      const dupe = db.prepare(`SELECT p.id, p.name FROM products p WHERE p.barcode = ? AND p.id != ? AND p.status = 'ACTIVE'`).get(trimmedBarcode, excludeId ?? -1) as
        | { id: number; name: string }
        | undefined
      if (dupe) throw new Error(`Duplicate barcode: already used by "${dupe.name}".`)
      const unitEx = excludeId ? 'AND u.product_id != ?' : ''
      const unitDupe = db.prepare(`SELECT u.id, p.name FROM product_units u JOIN products p ON u.product_id = p.id WHERE u.barcode = ? AND p.status = 'ACTIVE' ${unitEx}`).get(trimmedBarcode, ...(excludeId ? [excludeId] : [])) as
        | { id: number; name: string }
        | undefined
      if (unitDupe) throw new Error(`Duplicate barcode: already used on a selling unit of "${unitDupe.name}".`)
    }
  }
  if (!input.units || input.units.length === 0) throw new Error('At least one selling unit is required.')
  let foundBase = false
  const seenUnitBarcodes = new Set<string>()
  for (const u of input.units) {
    if (!u.name?.trim()) throw new Error('Please enter a name for the selling unit.')
    if (!Number.isInteger(u.conversion_to_base) || u.conversion_to_base < 1) throw new Error('Invalid unit conversion.')
    if (u.selling_price_c < 0) throw new Error('Unit price cannot be negative.')
    if (u.conversion_to_base === 1) foundBase = true
    const trimmedUnitBarcode = u.barcode?.trim() || null
    if (trimmedUnitBarcode) {
      if (seenUnitBarcodes.has(trimmedUnitBarcode)) {
        throw new Error(`Duplicate barcode "${trimmedUnitBarcode}" assigned to multiple selling units.`)
      }
      seenUnitBarcodes.add(trimmedUnitBarcode)

      if (input.reassign_barcode) {
        db.prepare(`UPDATE product_units SET barcode = NULL WHERE barcode = ? ${excludeId ? 'AND product_id != ?' : ''}`).run(trimmedUnitBarcode, ...(excludeId ? [excludeId] : []))
        db.prepare(`UPDATE products SET barcode = NULL WHERE barcode = ? AND id != ?`).run(trimmedUnitBarcode, excludeId ?? -1)
      } else {
        // Auto-free from archived products
        db.prepare(`UPDATE product_units SET barcode = NULL WHERE barcode = ? AND product_id IN (SELECT id FROM products WHERE status = 'ARCHIVED' AND id != ?)`).run(trimmedUnitBarcode, excludeId ?? -1)
        db.prepare(`UPDATE products SET barcode = NULL WHERE barcode = ? AND status = 'ARCHIVED' AND id != ?`).run(trimmedUnitBarcode, excludeId ?? -1)

        // Check if unit barcode is used by another ACTIVE product's unit
        const unitEx = excludeId ? 'AND u.product_id != ?' : ''
        const dup = db.prepare(`SELECT u.id, p.name FROM product_units u JOIN products p ON u.product_id = p.id WHERE u.barcode = ? AND p.status = 'ACTIVE' ${unitEx}`).get(trimmedUnitBarcode, ...(excludeId ? [excludeId] : [])) as
          | { id: number; name: string }
          | undefined
        if (dup) throw new Error(`Barcode ${trimmedUnitBarcode} already in use on "${dup.name}".`)
        // Check if unit barcode is used by another ACTIVE product as primary barcode
        const prodDup = db.prepare(`SELECT id, name FROM products WHERE barcode = ? AND id != ? AND status = 'ACTIVE'`).get(trimmedUnitBarcode, excludeId ?? -1) as
          | { id: number; name: string }
          | undefined
        if (prodDup) throw new Error(`Barcode ${trimmedUnitBarcode} is already used as a product primary barcode on "${prodDup.name}".`)
      }
    }
  }
  if (!foundBase) throw new Error('One unit must convert to exactly 1 base unit.')
}

function hasSrpColumn(db: Database.Database): boolean {
  const cols = db.pragma('table_info(products)') as { name: string }[]
  return cols.some((c) => c.name === 'srp_c')
}

function hasWholesaleColumns(db: Database.Database): boolean {
  const cols = db.pragma('table_info(products)') as { name: string }[]
  return cols.some((c) => c.name === 'wholesale_price_c')
}

export function createProduct(db: Database.Database, input: ProductInput, userId: number): Product {
  if (!input.sku || !input.sku.trim()) {
    input.sku = generateSku(db)
  }
  validateProductInput(db, input)
  const threshold = input.low_stock_threshold ?? defaultLowStock(db)
  const hasWholesale = hasWholesaleColumns(db)
  const hasSrp = hasSrpColumn(db)
  const txn = db.transaction(() => {
    const info = hasWholesale
      ? db
          .prepare(
            `INSERT INTO products
             (category_id, name, sku, barcode, description, base_unit, purchase_cost_c, default_price_c, srp_c,
              wholesale_price_c, wholesale_min_qty, low_stock_threshold, supplier_id, has_expiration, image_path, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
            input.srp_c ?? null,
            input.wholesale_price_c ?? null,
            input.wholesale_min_qty ?? null,
            threshold,
            input.supplier_id,
            input.has_expiration ? 1 : 0,
            input.image_path?.trim() || null,
            input.notes?.trim() || null
          )
      : hasSrp
      ? db
          .prepare(
            `INSERT INTO products
             (category_id, name, sku, barcode, description, base_unit, purchase_cost_c, default_price_c, srp_c,
              low_stock_threshold, supplier_id, has_expiration, image_path, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
            input.srp_c ?? null,
            threshold,
            input.supplier_id,
            input.has_expiration ? 1 : 0,
            input.image_path?.trim() || null,
            input.notes?.trim() || null
          )
      : db
          .prepare(
            `INSERT INTO products
             (category_id, name, sku, barcode, description, base_unit, purchase_cost_c, default_price_c,
              low_stock_threshold, supplier_id, has_expiration, image_path, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
            threshold,
            input.supplier_id,
            input.has_expiration ? 1 : 0,
            input.image_path?.trim() || null,
            input.notes?.trim() || null
          )
    const productId = Number(info.lastInsertRowid)
    if (input.item_type) {
      db.prepare('UPDATE products SET item_type = ? WHERE id = ?').run(input.item_type, productId)
    }
    if (input.recipe && input.recipe.length > 0) {
      saveRecipe(db, productId, input.recipe)
    }
    insertUnits(db, productId, input.units)
    if (input.expiration_mode !== undefined) configureExpiration(db, productId, input.expiration_mode, input.expiration_date ?? null, userId)
    if (input.initial_stock_base) {
      if (input.initial_stock_base < 0) throw new Error('Opening stock cannot be negative.')
      adjustStock(db, productId, input.initial_stock_base, 'INITIAL_STOCK', 'Initial stock', userId, undefined, { expiration_date: input.expiration_date })
    }
    return productId
  })
  const id = txn()
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
    sku: input.sku && input.sku.trim() ? input.sku.trim() : (cur.sku || generateSku(db)),
    barcode: input.barcode !== undefined ? input.barcode : cur.barcode,
    description: input.description !== undefined ? input.description : cur.description,
    base_unit: input.base_unit ?? cur.base_unit,
    purchase_cost_c: input.purchase_cost_c ?? cur.purchase_cost_c,
    default_price_c: input.default_price_c ?? cur.default_price_c,
    srp_c: input.srp_c !== undefined ? input.srp_c : cur.srp_c,
    wholesale_price_c: input.wholesale_price_c !== undefined ? input.wholesale_price_c : cur.wholesale_price_c,
    wholesale_min_qty: input.wholesale_min_qty !== undefined ? input.wholesale_min_qty : cur.wholesale_min_qty,
    low_stock_threshold: input.low_stock_threshold ?? cur.low_stock_threshold,
    supplier_id: input.supplier_id !== undefined ? input.supplier_id : cur.supplier_id,
    has_expiration: input.has_expiration !== undefined ? input.has_expiration : cur.has_expiration,
    expiration_mode: input.expiration_mode ?? cur.expiration_mode ?? 'NONE',
    expiration_date: input.expiration_date !== undefined ? input.expiration_date : cur.expiration_date,
    image_path: input.image_path !== undefined ? input.image_path : cur.image_path,
    notes: input.notes !== undefined ? input.notes : cur.notes,
    units: input.units ?? cur.units,
    reassign_barcode: input.reassign_barcode
  }
  validateProductInput(db, merged, id)
  const hasWholesale = hasWholesaleColumns(db)
  const hasSrp = hasSrpColumn(db)
  const txn = db.transaction(() => {
    if (input.expiration_mode !== undefined || input.expiration_date !== undefined) configureExpiration(db, id, merged.expiration_mode ?? 'NONE', merged.expiration_date ?? null, userId)
    if (hasWholesale) {
      db.prepare(
        `UPDATE products SET category_id = ?, name = ?, sku = ?, barcode = ?, description = ?, base_unit = ?,
         purchase_cost_c = ?, default_price_c = ?, srp_c = ?, wholesale_price_c = ?, wholesale_min_qty = ?,
         low_stock_threshold = ?, supplier_id = ?, has_expiration = ?,
         image_path = ?, notes = ?, updated_at = datetime('now','localtime') WHERE id = ?`
      ).run(
        merged.category_id,
        merged.name.trim(),
        merged.sku.trim(),
        merged.barcode?.trim() || null,
        merged.description?.trim() || null,
        merged.base_unit.trim(),
        merged.purchase_cost_c,
        merged.default_price_c,
        merged.srp_c ?? null,
        merged.wholesale_price_c ?? null,
        merged.wholesale_min_qty ?? null,
        merged.low_stock_threshold,
        merged.supplier_id,
        merged.expiration_mode !== 'NONE' ? 1 : input.expiration_mode !== undefined ? 0 : (merged.has_expiration ? 1 : 0),
        merged.image_path?.trim() || null,
        merged.notes?.trim() || null,
        id
      )
    } else if (hasSrp) {
      db.prepare(
        `UPDATE products SET category_id = ?, name = ?, sku = ?, barcode = ?, description = ?, base_unit = ?,
         purchase_cost_c = ?, default_price_c = ?, srp_c = ?, low_stock_threshold = ?, supplier_id = ?, has_expiration = ?,
         image_path = ?, notes = ?, updated_at = datetime('now','localtime') WHERE id = ?`
      ).run(
        merged.category_id,
        merged.name.trim(),
        merged.sku.trim(),
        merged.barcode?.trim() || null,
        merged.description?.trim() || null,
        merged.base_unit.trim(),
        merged.purchase_cost_c,
        merged.default_price_c,
        merged.srp_c ?? null,
        merged.low_stock_threshold,
        merged.supplier_id,
        merged.expiration_mode !== 'NONE' ? 1 : input.expiration_mode !== undefined ? 0 : (merged.has_expiration ? 1 : 0),
        merged.image_path?.trim() || null,
        merged.notes?.trim() || null,
        id
      )
    } else {
      db.prepare(
        `UPDATE products SET category_id = ?, name = ?, sku = ?, barcode = ?, description = ?, base_unit = ?,
         purchase_cost_c = ?, default_price_c = ?, low_stock_threshold = ?, supplier_id = ?, has_expiration = ?,
         image_path = ?, notes = ?, updated_at = datetime('now','localtime') WHERE id = ?`
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
        merged.expiration_mode !== 'NONE' ? 1 : input.expiration_mode !== undefined ? 0 : (merged.has_expiration ? 1 : 0),
        merged.image_path?.trim() || null,
        merged.notes?.trim() || null,
        id
      )
    }
    if (input.item_type) {
      db.prepare('UPDATE products SET item_type = ? WHERE id = ?').run(input.item_type, id)
    }
    if (input.recipe !== undefined) {
      saveRecipe(db, id, input.recipe)
    }
    db.prepare('DELETE FROM product_units WHERE product_id = ?').run(id)
    insertUnits(db, id, merged.units)
  })
  txn()
  void userId
  return getProduct(db, id)
}

export function setProductStatus(db: Database.Database, id: number, status: ProductStatus, _userId: number): Product {
  if (status === 'ACTIVE') {
    // Safety guard: if product has a barcode that is now taken by another ACTIVE product, null it so restoration doesn't fail
    const cur = db.prepare('SELECT barcode FROM products WHERE id = ?').get(id) as { barcode?: string | null } | undefined
    if (cur?.barcode) {
      const conflict = db.prepare('SELECT id FROM products WHERE barcode = ? AND id != ? AND status = "ACTIVE"').get(cur.barcode, id)
      if (conflict) {
        db.prepare('UPDATE products SET barcode = NULL WHERE id = ?').run(id)
      }
    }
    // Also check product units
    const units = db.prepare('SELECT id, barcode FROM product_units WHERE product_id = ? AND barcode IS NOT NULL').all(id) as { id: number; barcode: string }[]
    for (const u of units) {
      const uConflict = db.prepare('SELECT pu.id FROM product_units pu JOIN products p ON pu.product_id = p.id WHERE pu.barcode = ? AND pu.product_id != ? AND p.status = "ACTIVE"').get(u.barcode, id)
      if (uConflict) {
        db.prepare('UPDATE product_units SET barcode = NULL WHERE id = ?').run(u.id)
      }
    }
  }
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
  reference?: string,
  receiving?: ExpirationStockOptions & {
    source?: string
    supplier_id?: number | null
    received_unit?: string
    received_quantity?: number
    unit_cost_c?: number | null
    notes?: string | null
  }
): void {
  db.transaction(() => {
  const p = db.prepare('SELECT id, stock, base_unit FROM products WHERE id = ?').get(productId) as
    | { id: number; stock: number; base_unit: string }
    | undefined
  if (!p) throw new Error('Product not found.')
  if (!Number.isFinite(change)) throw new Error('Quantity must be a valid number.')
  const before = p.stock
  const after = Math.round((before + change) * 1000) / 1000
  if (after < 0) throw new Error('Insufficient stock — cannot go negative.')
  db.prepare("UPDATE products SET stock = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(after, productId)
  let movementId: number
  try {
    const movement = db.prepare(
      `INSERT INTO inventory_movements
       (product_id, quantity_before, quantity_change, quantity_after, unit, movement_type, reason, reference, user_id,
        source, supplier_id, received_unit, received_quantity, unit_cost_c, receiving_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(productId, before, change, after, p.base_unit, movementType, reason, reference ?? null, userId,
      receiving?.source ?? null, receiving?.supplier_id ?? null, receiving?.received_unit ?? null,
      receiving?.received_quantity ?? null, receiving?.unit_cost_c ?? null, receiving?.notes?.trim() || null)
    movementId = Number(movement.lastInsertRowid)
  } catch (err: unknown) {
    const errMsg = String((err as Error)?.message || err)
    if (errMsg.includes('has no column named') || errMsg.includes('no such column')) {
      const { ensureSchemaColumns } = require('../database/migrations')
      ensureSchemaColumns(db)
      const movement = db.prepare(
        `INSERT INTO inventory_movements
         (product_id, quantity_before, quantity_change, quantity_after, unit, movement_type, reason, reference, user_id,
          source, supplier_id, received_unit, received_quantity, unit_cost_c, receiving_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(productId, before, change, after, p.base_unit, movementType, reason, reference ?? null, userId,
        receiving?.source ?? null, receiving?.supplier_id ?? null, receiving?.received_unit ?? null,
        receiving?.received_quantity ?? null, receiving?.unit_cost_c ?? null, receiving?.notes?.trim() || null)
      movementId = Number(movement.lastInsertRowid)
    } else {
      throw err
    }
  }
  applyExpirationStock(db, productId, change, movementType, movementId, receiving)
  try {
    const { pushStockToCloud } = require('../services/cloudSync')
    const prodName = (db.prepare('SELECT name FROM products WHERE id=?').get(productId) as { name: string })?.name || 'Item'
    pushStockToCloud(db, {
      local_movement_id: movementId,
      product_name: prodName,
      movement_type: movementType,
      quantity_change: change,
      quantity_before: before,
      quantity_after: after,
      unit: p.base_unit,
      reference: reference ?? null,
      reason: reason ?? null,
      moved_at: new Date().toISOString()
    }).catch(() => {})
  } catch {}
  })()
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

export function getRecipe(db: Database.Database, parentProductId: number): import('@shared/types').ProductRecipeItem[] {
  return db
    .prepare(`
      SELECT r.id, r.parent_product_id, r.component_product_id, r.quantity, r.unit_name,
             p.name AS component_name, p.purchase_cost_c AS component_cost_c
      FROM product_recipes r
      JOIN products p ON p.id = r.component_product_id
      WHERE r.parent_product_id = ?
      ORDER BY r.id ASC
    `)
    .all(parentProductId) as import('@shared/types').ProductRecipeItem[]
}

export function saveRecipe(
  db: Database.Database,
  parentProductId: number,
  items: { component_product_id: number; quantity: number; unit_name?: string }[]
): void {
  const insert = db.prepare(`
    INSERT INTO product_recipes (parent_product_id, component_product_id, quantity, unit_name)
    VALUES (?, ?, ?, ?)
  `)
  db.prepare('DELETE FROM product_recipes WHERE parent_product_id = ?').run(parentProductId)
  for (const it of items) {
    if (it.component_product_id && it.quantity > 0) {
      insert.run(parentProductId, it.component_product_id, it.quantity, it.unit_name?.trim() || 'pc')
    }
  }
  const compStock = calculateCompositeStock(db, parentProductId)
  const rollupCost = calculateRollupCost(db, parentProductId)
  if (compStock !== null) {
    db.prepare(
      `UPDATE products
       SET stock = ?,
           purchase_cost_c = CASE WHEN purchase_cost_c = 0 THEN ? ELSE purchase_cost_c END,
           updated_at = datetime('now')
       WHERE id = ?`
    ).run(compStock, rollupCost, parentProductId)
  }
}

export function hasRecipeCycle(
  db: Database.Database,
  parentId: number,
  componentId: number,
  visited = new Set<number>()
): boolean {
  if (parentId === componentId) return true
  if (visited.has(componentId)) return false
  visited.add(componentId)

  const children = db
    .prepare('SELECT component_product_id FROM product_recipes WHERE parent_product_id = ?')
    .all(componentId) as { component_product_id: number }[]

  for (const c of children) {
    if (c.component_product_id === parentId) return true
    if (hasRecipeCycle(db, parentId, c.component_product_id, visited)) return true
  }
  return false
}

export function calculateRollupCost(
  db: Database.Database,
  productId: number,
  visited = new Set<number>()
): number {
  if (visited.has(productId)) return 0
  visited.add(productId)

  const p = db.prepare('SELECT item_type, purchase_cost_c FROM products WHERE id = ?').get(productId) as
    | { item_type: string; purchase_cost_c: number }
    | undefined
  if (!p) return 0
  if (p.item_type !== 'COMPOSITE') {
    return p.purchase_cost_c
  }

  const recipe = db
    .prepare('SELECT component_product_id, quantity FROM product_recipes WHERE parent_product_id = ?')
    .all(productId) as { component_product_id: number; quantity: number }[]

  let totalCost = 0
  for (const r of recipe) {
    const compCost = calculateRollupCost(db, r.component_product_id, new Set(visited))
    totalCost += Math.round(compCost * r.quantity)
  }
  return totalCost
}

export function resolveLeafComponents(
  db: Database.Database,
  productId: number,
  multiplier = 1,
  visited = new Set<number>()
): Map<number, { qty: number; unit: string; name: string }> {
  if (visited.has(productId)) {
    throw new Error(`Circular BOM dependency detected on product #${productId}`)
  }
  visited.add(productId)

  const leafMap = new Map<number, { qty: number; unit: string; name: string }>()
  const p = db.prepare('SELECT id, name, base_unit, item_type FROM products WHERE id = ?').get(productId) as
    | { id: number; name: string; base_unit: string; item_type: string }
    | undefined
  if (!p) return leafMap

  if (p.item_type !== 'COMPOSITE') {
    leafMap.set(p.id, { qty: multiplier, unit: p.base_unit, name: p.name })
    return leafMap
  }

  const recipe = db
    .prepare('SELECT component_product_id, quantity, unit_name FROM product_recipes WHERE parent_product_id = ?')
    .all(productId) as { component_product_id: number; quantity: number; unit_name: string }[]

  for (const r of recipe) {
    const childLeaves = resolveLeafComponents(db, r.component_product_id, r.quantity * multiplier, new Set(visited))
    for (const [leafId, leafData] of childLeaves) {
      const existing = leafMap.get(leafId)
      if (existing) {
        existing.qty += leafData.qty
      } else {
        leafMap.set(leafId, { qty: leafData.qty, unit: leafData.unit, name: leafData.name })
      }
    }
  }

  return leafMap
}

