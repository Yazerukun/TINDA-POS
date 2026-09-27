import type Database from 'better-sqlite3'
import type { ProductInput } from '@shared/types'
import * as products from '../repositories/products'
import { createBackupSync } from '../repositories/backup'

export interface SimplePosProduct {
  id: number
  name: string
  categoryId?: number | null
  costPrice?: number
  sellPrice?: number
  qty?: number
  unit?: string
  isActive?: boolean
  createdAt?: string
  [key: string]: unknown
}

export interface SimplePosCategory {
  id: number
  name: string
  [key: string]: unknown
}

export interface SimplePosPayload {
  schemaVersion?: number
  categories?: SimplePosCategory[]
  products?: SimplePosProduct[]
  [key: string]: unknown
}

export interface SimplePosPreviewRow {
  row_number: number
  id: number
  product_name: string
  sku: string
  category: string
  selling_price: string
  cost: string
  stock: string
  base_unit: string
  valid: boolean
  duplicate: boolean
  existing_id?: number
  reasons: string[]
}

export interface SimplePosPreview {
  rows: SimplePosPreviewRow[]
  total: number
  valid: number
  invalid: number
  duplicates: number
  categories_count: number
  total_stock: number
  total_retail_value_c: number
  active_count: number
  inactive_count: number
}

export function isSimplePosPayload(text: string): boolean {
  try {
    const data = JSON.parse(text) as SimplePosPayload
    return Boolean(data && typeof data === 'object' && Array.isArray(data.products))
  } catch {
    return false
  }
}

export function parseSimplePosPayload(text: string): SimplePosPayload {
  const data = JSON.parse(text) as SimplePosPayload
  if (!data || typeof data !== 'object') throw new Error('Invalid JSON payload: root must be an object.')
  if (!Array.isArray(data.products)) throw new Error('Invalid Simple POS payload: missing "products" array.')
  return data
}

export function previewSimplePos(db: Database.Database, text: string): SimplePosPreview {
  const payload = parseSimplePosPayload(text)
  const categoryMap = new Map<number, string>()
  if (Array.isArray(payload.categories)) {
    for (const c of payload.categories) {
      if (c && c.id != null && c.name) {
        categoryMap.set(Number(c.id), String(c.name).trim())
      }
    }
  }

  const seenSku = new Set<string>()
  const rows: SimplePosPreviewRow[] = []
  let totalStock = 0
  let totalRetailValueC = 0
  let activeCount = 0
  let inactiveCount = 0

  const prods = payload.products ?? []
  for (let i = 0; i < prods.length; i++) {
    const p = prods[i]
    if (!p) continue
    const isActive = p.isActive !== false
    if (isActive) activeCount++
    else inactiveCount++

    // Only import active products by default from Simple POS backup
    if (!isActive) continue

    const pid = Math.round(Number(p.id) || i + 1)
    const sku = `SP-${String(pid).padStart(4, '0')}`
    const name = String(p.name ?? '').trim()
    const catId = p.categoryId != null ? Number(p.categoryId) : null
    const categoryName = (catId != null ? categoryMap.get(catId) : null) || 'Hardware'
    const sellPrice = Math.max(0, Number(p.sellPrice ?? 0))
    const costPrice = Math.max(0, Number(p.costPrice ?? 0))
    const rawQty = Number(p.qty ?? 0)
    const stock = Math.max(0, Math.round(rawQty)) // clamp negative, round fractional kg
    const unit = String(p.unit ?? 'pcs').trim() || 'pcs'

    const reasons: string[] = []
    if (!name) reasons.push('Missing product name')
    if (seenSku.has(sku.toLowerCase())) reasons.push('Duplicate SKU generated')
    seenSku.add(sku.toLowerCase())

    let existing = products.findBySku(db, sku)
    if (!existing) {
      // Also check if an active product with the exact name already exists
      const matchByName = db.prepare('SELECT id, sku FROM products WHERE name = ? COLLATE NOCASE').get(name) as { id: number; sku: string } | undefined
      if (matchByName) {
        existing = products.getProduct(db, matchByName.id)
      }
    }

    const row: SimplePosPreviewRow = {
      row_number: rows.length + 1,
      id: pid,
      product_name: name,
      sku,
      category: categoryName,
      selling_price: sellPrice.toFixed(2),
      cost: costPrice.toFixed(2),
      stock: String(stock),
      base_unit: unit,
      valid: reasons.length === 0,
      duplicate: Boolean(existing),
      existing_id: existing?.id,
      reasons
    }

    if (row.valid) {
      totalStock += stock
      totalRetailValueC += Math.round(sellPrice * 100) * stock
    }

    rows.push(row)
  }

  return {
    rows,
    total: rows.length,
    valid: rows.filter((r) => r.valid).length,
    invalid: rows.filter((r) => !r.valid).length,
    duplicates: rows.filter((r) => r.duplicate).length,
    categories_count: categoryMap.size || (rows.length > 0 ? 1 : 0),
    total_stock: totalStock,
    total_retail_value_c: totalRetailValueC,
    active_count: activeCount,
    inactive_count: inactiveCount
  }
}

export function importSimplePos(
  db: Database.Database,
  text: string,
  strategy: 'SKIP' | 'UPDATE',
  userId: number
): { created: number; updated: number; skipped: number; total_stock: number; product_ids: number[] } {
  const preview = previewSimplePos(db, text)
  if (preview.invalid > 0) throw new Error('Fix all invalid rows before importing.')

  // Safety trigger: create automatic snapshot backup before multi-product import (in desktop runtime)
  try {
    const { app } = require('electron')
    if (app && typeof app.getPath === 'function') {
      createBackupSync(db, 'AUTO')
    }
  } catch (err) {
    // In headless test environments electron app is not running
  }

  return db.transaction(() => {
    let created = 0
    let updated = 0
    let skipped = 0
    let totalStockImported = 0
    const productIds: number[] = []

    for (const row of preview.rows) {
      if (row.duplicate && strategy === 'SKIP') {
        skipped++
        continue
      }

      let categoryId: number | null = null
      if (row.category) {
        db.prepare('INSERT OR IGNORE INTO categories(name) VALUES (?)').run(row.category)
        const catRow = db.prepare('SELECT id FROM categories WHERE name = ? COLLATE NOCASE').get(row.category) as { id: number } | undefined
        if (catRow) categoryId = catRow.id
      }

      const sellPriceC = Math.round(Number(row.selling_price) * 100)
      const costPriceC = Math.round(Number(row.cost) * 100)
      const targetStock = Number(row.stock)

      const input: ProductInput = {
        name: row.product_name,
        sku: row.sku,
        barcode: null,
        category_id: categoryId,
        description: null,
        base_unit: row.base_unit || 'pcs',
        purchase_cost_c: costPriceC,
        default_price_c: sellPriceC,
        low_stock_threshold: 5,
        supplier_id: null,
        has_expiration: false,
        notes: `Imported from Simple POS (ID: ${row.id})`,
        units: [
          {
            name: row.base_unit || 'pcs',
            conversion_to_base: 1,
            barcode: null,
            selling_price_c: sellPriceC,
            is_default: true
          }
        ]
      }

      let id: number
      const priorStock = row.existing_id ? products.getProduct(db, row.existing_id).stock : 0

      if (row.existing_id) {
        id = row.existing_id
        products.updateProduct(db, id, input, userId)
        updated++
      } else {
        const createdProduct = products.createProduct(db, input, userId)
        id = createdProduct.id
        created++
      }

      const change = row.existing_id ? targetStock - priorStock : targetStock
      if (change) {
        products.adjustStock(
          db,
          id,
          change,
          'INITIAL_STOCK',
          row.existing_id ? 'Stock updated from Simple POS import' : 'Opening stock from Simple POS import',
          userId,
          `Simple POS ID ${row.id}`,
          {
            source: 'SIMPLE_POS_IMPORT',
            received_unit: input.base_unit,
            received_quantity: change,
            unit_cost_c: input.purchase_cost_c,
            notes: `Batch import from Simple POS backup (PID: ${row.id})`
          }
        )
        totalStockImported += change
      }

      productIds.push(id)
    }

    return {
      created,
      updated,
      skipped,
      total_stock: totalStockImported,
      product_ids: productIds
    }
  })()
}
