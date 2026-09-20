import type Database from 'better-sqlite3'
import type { PriceComparisonStatus, PriceReference, PriceReferenceInput, PriceSourceType } from '../../shared/types'
import { SEED_PRICE_REFERENCES } from '../services/seedPriceReferences'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  sanitized?: PriceReferenceInput
}

export function validatePriceReferenceInput(input: PriceReferenceInput): ValidationResult {
  const errors: string[] = []
  const productName = input.product_name?.trim() || ''
  const sourceName = input.source_name?.trim() || ''

  if (!productName) {
    errors.push('Product name is required.')
  }
  if (!sourceName) {
    errors.push('Source name is required.')
  }

  const checkPrice = (val: number | null | undefined, name: string): number | null => {
    if (val === undefined || val === null) return null
    if (typeof val !== 'number' || isNaN(val) || !Number.isInteger(val) || val < 0) {
      errors.push(`${name} must be a non-negative integer centavos.`)
      return null
    }
    return val
  }

  const marketPriceC = checkPrice(input.market_price_c, 'Market price')
  const minPriceC = checkPrice(input.min_price_c, 'Minimum price')
  const maxPriceC = checkPrice(input.max_price_c, 'Maximum price')

  if (minPriceC !== null && maxPriceC !== null && minPriceC > maxPriceC) {
    errors.push('Minimum price cannot exceed maximum price.')
  }

  const validSourceTypes: PriceSourceType[] = ['official', 'market', 'reference', 'test']
  const sourceType = input.source_type && validSourceTypes.includes(input.source_type)
    ? input.source_type
    : 'market'

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    errors: [],
    sanitized: {
      product_id: input.product_id ?? null,
      barcode: input.barcode?.trim() || null,
      product_name: productName,
      brand: input.brand?.trim() || null,
      variant: input.variant?.trim() || null,
      unit: input.unit?.trim() || null,
      image_path: input.image_path?.trim() || null,
      image_url: input.image_url?.trim() || null,
      market_price_c: marketPriceC,
      min_price_c: minPriceC,
      max_price_c: maxPriceC,
      currency: input.currency?.trim() || 'PHP',
      source_name: sourceName,
      source_type: sourceType,
      source_url: input.source_url?.trim() || null,
      location: input.location?.trim() || 'Philippines',
      effective_date: input.effective_date?.trim() || null
    }
  }
}

export function createPriceReference(db: Database.Database, input: PriceReferenceInput): PriceReference {
  const validation = validatePriceReferenceInput(input)
  if (!validation.valid || !validation.sanitized) {
    throw new Error(validation.errors.join(' '))
  }

  const s = validation.sanitized
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  const stmt = db.prepare(`
    INSERT INTO price_references (
      product_id, barcode, product_name, brand, variant, unit,
      image_path, image_url, market_price_c, min_price_c, max_price_c,
      currency, source_name, source_type, source_url, location,
      effective_date, retrieved_at, last_synced_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `)

  const info = stmt.run(
    s.product_id,
    s.barcode,
    s.product_name,
    s.brand,
    s.variant,
    s.unit,
    s.image_path,
    s.image_url,
    s.market_price_c,
    s.min_price_c,
    s.max_price_c,
    s.currency,
    s.source_name,
    s.source_type,
    s.source_url,
    s.location,
    s.effective_date,
    now,
    now
  )

  return getPriceReference(db, Number(info.lastInsertRowid))!
}

export function updatePriceReference(
  db: Database.Database,
  id: number,
  input: Partial<PriceReferenceInput>
): PriceReference {
  const existing = getPriceReference(db, id)
  if (!existing) {
    throw new Error(`Price reference #${id} not found.`)
  }

  const merged: PriceReferenceInput = {
    product_id: input.product_id !== undefined ? input.product_id : existing.product_id,
    barcode: input.barcode !== undefined ? input.barcode : existing.barcode,
    product_name: input.product_name !== undefined ? input.product_name : existing.product_name,
    brand: input.brand !== undefined ? input.brand : existing.brand,
    variant: input.variant !== undefined ? input.variant : existing.variant,
    unit: input.unit !== undefined ? input.unit : existing.unit,
    image_path: input.image_path !== undefined ? input.image_path : existing.image_path,
    image_url: input.image_url !== undefined ? input.image_url : existing.image_url,
    market_price_c: input.market_price_c !== undefined ? input.market_price_c : existing.market_price_c,
    min_price_c: input.min_price_c !== undefined ? input.min_price_c : existing.min_price_c,
    max_price_c: input.max_price_c !== undefined ? input.max_price_c : existing.max_price_c,
    currency: input.currency !== undefined ? input.currency : existing.currency,
    source_name: input.source_name !== undefined ? input.source_name : existing.source_name,
    source_type: input.source_type !== undefined ? input.source_type : existing.source_type,
    source_url: input.source_url !== undefined ? input.source_url : existing.source_url,
    location: input.location !== undefined ? input.location : existing.location,
    effective_date: input.effective_date !== undefined ? input.effective_date : existing.effective_date
  }

  const validation = validatePriceReferenceInput(merged)
  if (!validation.valid || !validation.sanitized) {
    throw new Error(validation.errors.join(' '))
  }

  const s = validation.sanitized
  const stmt = db.prepare(`
    UPDATE price_references SET
      product_id = ?,
      barcode = ?,
      product_name = ?,
      brand = ?,
      variant = ?,
      unit = ?,
      image_path = ?,
      image_url = ?,
      market_price_c = ?,
      min_price_c = ?,
      max_price_c = ?,
      currency = ?,
      source_name = ?,
      source_type = ?,
      source_url = ?,
      location = ?,
      effective_date = ?,
      updated_at = datetime('now','localtime')
    WHERE id = ?
  `)

  stmt.run(
    s.product_id,
    s.barcode,
    s.product_name,
    s.brand,
    s.variant,
    s.unit,
    s.image_path,
    s.image_url,
    s.market_price_c,
    s.min_price_c,
    s.max_price_c,
    s.currency,
    s.source_name,
    s.source_type,
    s.source_url,
    s.location,
    s.effective_date,
    id
  )

  return getPriceReference(db, id)!
}

export function deletePriceReference(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM price_references WHERE id = ?').run(id)
}

export function getPriceReference(db: Database.Database, id: number): PriceReference | undefined {
  return db.prepare('SELECT * FROM price_references WHERE id = ?').get(id) as PriceReference | undefined
}

export function getPriceReferenceByProductId(
  db: Database.Database,
  productId: number
): PriceReference | undefined {
  return db
    .prepare('SELECT * FROM price_references WHERE product_id = ? ORDER BY updated_at DESC LIMIT 1')
    .get(productId) as PriceReference | undefined
}

export function getPriceReferenceByBarcode(
  db: Database.Database,
  barcode: string
): PriceReference | undefined {
  if (!barcode || !barcode.trim()) return undefined
  return db
    .prepare('SELECT * FROM price_references WHERE barcode = ? ORDER BY updated_at DESC LIMIT 1')
    .get(barcode.trim()) as PriceReference | undefined
}

export interface SearchPriceReferencesOptions {
  query?: string
  sourceType?: PriceSourceType
  linkedOnly?: boolean
  unlinkedOnly?: boolean
  limit?: number
  offset?: number
}

export function ensureSeedData(db: Database.Database): void {
  try {
    const countRow = db.prepare('SELECT COUNT(*) as c FROM price_references').get() as { c: number }
    if (countRow.c === 0) {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
      const insert = db.prepare(`
        INSERT INTO price_references (
          product_id, barcode, product_name, brand, variant, unit,
          image_path, image_url, market_price_c, min_price_c, max_price_c,
          currency, source_name, source_type, source_url, location,
          effective_date, retrieved_at, last_synced_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?
        )
      `)
      const seedTx = db.transaction(() => {
        for (const s of SEED_PRICE_REFERENCES) {
          insert.run(
            s.product_id ?? null,
            s.barcode?.trim() || null,
            s.product_name.trim(),
            s.brand?.trim() || null,
            s.variant?.trim() || null,
            s.unit?.trim() || null,
            s.image_path?.trim() || null,
            s.image_url?.trim() || null,
            s.market_price_c ?? null,
            s.min_price_c ?? null,
            s.max_price_c ?? null,
            s.currency || 'PHP',
            s.source_name,
            s.source_type || 'market',
            s.source_url?.trim() || null,
            s.location || 'Philippines',
            s.effective_date || null,
            now,
            now
          )
        }
      })
      seedTx()
    }
  } catch {
    // Non-blocking
  }
}

export function searchPriceReferences(
  db: Database.Database,
  options: SearchPriceReferencesOptions = {}
): { rows: PriceReference[]; references: PriceReference[]; total: number } {
  // Ensure seed data is populated if table is empty
  ensureSeedData(db)

  const conditions: string[] = []
  const params: unknown[] = []

  if (options.query && options.query.trim()) {
    const q = `%${options.query.trim()}%`
    conditions.push('(product_name LIKE ? OR brand LIKE ? OR barcode LIKE ? OR variant LIKE ?)')
    params.push(q, q, q, q)
  }

  if (options.sourceType) {
    conditions.push('source_type = ?')
    params.push(options.sourceType)
  }

  if (options.linkedOnly) {
    conditions.push('product_id IS NOT NULL')
  } else if (options.unlinkedOnly) {
    conditions.push('product_id IS NULL')
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM price_references ${whereClause}`)
    .get(...params) as { total: number }

  const limit = Math.max(1, Math.min(options.limit ?? 50, 200))
  const offset = Math.max(0, options.offset ?? 0)

  const rows = db
    .prepare(
      `SELECT * FROM price_references ${whereClause} ORDER BY updated_at DESC, id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as PriceReference[]

  return {
    rows,
    references: rows,
    total: countRow.total
  }
}

export function linkProduct(
  db: Database.Database,
  referenceId: number,
  productId: number
): PriceReference {
  const ref = getPriceReference(db, referenceId)
  if (!ref) {
    throw new Error(`Price reference #${referenceId} not found.`)
  }

  const prod = db.prepare('SELECT id FROM products WHERE id = ?').get(productId)
  if (!prod) {
    throw new Error(`Product #${productId} not found.`)
  }

  db.prepare(`
    UPDATE price_references
    SET product_id = ?, updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(productId, referenceId)

  return getPriceReference(db, referenceId)!
}

export function unlinkProduct(db: Database.Database, referenceId: number): PriceReference {
  const ref = getPriceReference(db, referenceId)
  if (!ref) {
    throw new Error(`Price reference #${referenceId} not found.`)
  }

  db.prepare(`
    UPDATE price_references
    SET product_id = NULL, updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(referenceId)

  return getPriceReference(db, referenceId)!
}

export function matchReferenceForProduct(
  db: Database.Database,
  product: { id: number; name: string; barcode?: string | null }
): PriceReference | null {
  // 1. Explicitly linked product
  const explicitlyLinked = getPriceReferenceByProductId(db, product.id)
  if (explicitlyLinked) return explicitlyLinked

  // 2. Exact barcode match
  if (product.barcode && product.barcode.trim()) {
    const barcodeMatch = getPriceReferenceByBarcode(db, product.barcode)
    if (barcodeMatch) return barcodeMatch
  }

  // 3. Exact product name match (case-insensitive)
  if (product.name && product.name.trim()) {
    const nameMatch = db
      .prepare('SELECT * FROM price_references WHERE product_name = ? COLLATE NOCASE LIMIT 1')
      .get(product.name.trim()) as PriceReference | undefined
    if (nameMatch) return nameMatch
  }

  // Never auto-link ambiguous/fuzzy matches
  return null
}

export function comparePrice(
  retailPriceC: number,
  reference: PriceReference | null | undefined
): PriceComparisonStatus {
  if (!reference) return 'NO_REFERENCE'

  const hasRange = reference.min_price_c !== null && reference.max_price_c !== null
  if (hasRange) {
    if (retailPriceC < reference.min_price_c!) return 'BELOW_RANGE'
    if (retailPriceC > reference.max_price_c!) return 'ABOVE_RANGE'
    return 'WITHIN_RANGE'
  }

  if (reference.market_price_c !== null) {
    if (retailPriceC < reference.market_price_c) return 'BELOW_RANGE'
    if (retailPriceC > reference.market_price_c) return 'ABOVE_RANGE'
    return 'WITHIN_RANGE'
  }

  return 'NO_REFERENCE'
}

export function upsertPriceReference(
  db: Database.Database,
  input: PriceReferenceInput
): { reference: PriceReference; created: boolean } {
  const validation = validatePriceReferenceInput(input)
  if (!validation.valid || !validation.sanitized) {
    throw new Error(validation.errors.join(' '))
  }

  const s = validation.sanitized

  // Search existing by barcode (if present) OR by (product_name, source_name)
  let existing: PriceReference | undefined
  if (s.barcode) {
    existing = db
      .prepare('SELECT * FROM price_references WHERE barcode = ? LIMIT 1')
      .get(s.barcode) as PriceReference | undefined
  }

  if (!existing) {
    existing = db
      .prepare(`
        SELECT * FROM price_references
        WHERE product_name = ? COLLATE NOCASE AND source_name = ? COLLATE NOCASE
        LIMIT 1
      `)
      .get(s.product_name, s.source_name) as PriceReference | undefined
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  if (existing) {
    // Preserve existing product_id if input didn't specify one
    const targetProductId = s.product_id !== undefined && s.product_id !== null
      ? s.product_id
      : existing.product_id

    // Preserve existing image_path if remote sync doesn't overwrite local cached image
    const targetImagePath = s.image_path || existing.image_path

    db.prepare(`
      UPDATE price_references SET
        product_id = ?,
        barcode = ?,
        product_name = ?,
        brand = ?,
        variant = ?,
        unit = ?,
        image_path = ?,
        image_url = ?,
        market_price_c = ?,
        min_price_c = ?,
        max_price_c = ?,
        currency = ?,
        source_name = ?,
        source_type = ?,
        source_url = ?,
        location = ?,
        effective_date = ?,
        last_synced_at = ?,
        updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(
      targetProductId,
      s.barcode,
      s.product_name,
      s.brand,
      s.variant,
      s.unit,
      targetImagePath,
      s.image_url,
      s.market_price_c,
      s.min_price_c,
      s.max_price_c,
      s.currency,
      s.source_name,
      s.source_type,
      s.source_url,
      s.location,
      s.effective_date,
      now,
      existing.id
    )

    return {
      reference: getPriceReference(db, existing.id)!,
      created: false
    }
  }

  // Create new
  const info = db.prepare(`
    INSERT INTO price_references (
      product_id, barcode, product_name, brand, variant, unit,
      image_path, image_url, market_price_c, min_price_c, max_price_c,
      currency, source_name, source_type, source_url, location,
      effective_date, retrieved_at, last_synced_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `).run(
    s.product_id,
    s.barcode,
    s.product_name,
    s.brand,
    s.variant,
    s.unit,
    s.image_path,
    s.image_url,
    s.market_price_c,
    s.min_price_c,
    s.max_price_c,
    s.currency,
    s.source_name,
    s.source_type,
    s.source_url,
    s.location,
    s.effective_date,
    now,
    now
  )

  return {
    reference: getPriceReference(db, Number(info.lastInsertRowid))!,
    created: true
  }
}
