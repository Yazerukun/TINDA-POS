import type Database from 'better-sqlite3'
import type { ProductInput } from '@shared/types'
import * as products from '../repositories/products'

export interface CsvRow { row_number: number; product_name: string; sku: string; barcode: string; category: string; selling_price: string; cost: string; stock: string; low_stock_level: string; supplier: string; base_unit: string }
export interface CsvPreviewRow extends CsvRow { valid: boolean; duplicate: boolean; existing_id?: number; reasons: string[] }
export interface CsvPreview { rows: CsvPreviewRow[]; total: number; valid: number; invalid: number; duplicates: number }

const HEADERS = ['product_name','sku','barcode','category','selling_price','cost','stock','low_stock_level','supplier','base_unit']
export const CSV_TEMPLATE = HEADERS.join(',') + '\n'

export function parseCsvLine(line: string): string[] {
  const out: string[] = []; let value = ''; let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"' && quoted && line[i + 1] === '"') { value += '"'; i++ }
    else if (c === '"') quoted = !quoted
    else if (c === ',' && !quoted) { out.push(value.trim()); value = '' }
    else value += c
  }
  if (quoted) throw new Error('CSV contains an unclosed quote.')
  out.push(value.trim()); return out
}

function numberReason(value: string, label: string, required = false): string | null {
  if (!value && !required) return null
  const n = Number(value)
  if (!value || !Number.isFinite(n)) return `Invalid ${label}`
  if (n < 0) return label === 'stock' ? 'Negative stock' : `${label.charAt(0).toUpperCase()}${label.slice(1)} cannot be negative`
  return null
}

export function previewCsv(db: Database.Database, text: string): CsvPreview {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((x) => x.trim())
  if (!lines.length) throw new Error('CSV file is empty.')
  const header = parseCsvLine(lines[0] ?? '').map((x) => x.toLowerCase())
  for (const required of ['product_name', 'selling_price']) if (!header.includes(required)) throw new Error(`Missing required column: ${required}`)
  const seenSku = new Set<string>(), seenBarcode = new Set<string>()
  const rows = lines.slice(1).map((line, index): CsvPreviewRow => {
    const values = parseCsvLine(line); const raw: Record<string,string> = {}
    header.forEach((h, i) => { raw[h] = values[i]?.trim() ?? '' })
    const row: CsvRow = { row_number: index + 2, ...Object.fromEntries(HEADERS.map((h) => [h, raw[h] ?? ''])) } as unknown as CsvRow
    const reasons: string[] = []
    if (!row.product_name) reasons.push('Missing product name')
    for (const r of [numberReason(row.selling_price, 'selling price', true), numberReason(row.cost, 'cost'), numberReason(row.stock, 'stock'), numberReason(row.low_stock_level, 'low stock level')]) if (r) reasons.push(r)
    const sku = row.sku.toLowerCase(), barcode = row.barcode.toLowerCase()
    let existing = row.sku ? products.findBySku(db, row.sku) : undefined
    if (!existing && row.barcode) existing = products.findByBarcode(db, row.barcode)
    if (sku && seenSku.has(sku)) reasons.push('Duplicate SKU in CSV')
    if (barcode && seenBarcode.has(barcode)) reasons.push('Duplicate barcode in CSV')
    if (sku) seenSku.add(sku); if (barcode) seenBarcode.add(barcode)
    return { ...row, valid: reasons.length === 0, duplicate: !!existing, existing_id: existing?.id, reasons }
  })
  return { rows, total: rows.length, valid: rows.filter(r => r.valid).length, invalid: rows.filter(r => !r.valid).length, duplicates: rows.filter(r => r.duplicate).length }
}

export function importCsv(db: Database.Database, text: string, strategy: 'SKIP' | 'UPDATE', userId: number): { created: number; updated: number; skipped: number; product_ids: number[] } {
  const preview = previewCsv(db, text)
  if (preview.invalid) throw new Error('Fix all invalid CSV rows before importing.')
  return db.transaction(() => {
    let created = 0, updated = 0, skipped = 0; const productIds: number[] = []
    for (const row of preview.rows) {
      if (row.duplicate && strategy === 'SKIP') { skipped++; continue }
      let categoryId: number | null = null, supplierId: number | null = null
      if (row.category) { db.prepare('INSERT OR IGNORE INTO categories(name) VALUES (?)').run(row.category); categoryId = (db.prepare('SELECT id FROM categories WHERE name=? COLLATE NOCASE').get(row.category) as {id:number}).id }
      if (row.supplier) { db.prepare("INSERT OR IGNORE INTO suppliers(name) VALUES (?)").run(row.supplier); supplierId = (db.prepare('SELECT id FROM suppliers WHERE name=? COLLATE NOCASE').get(row.supplier) as {id:number}).id }
      const unit = row.base_unit || 'pc'; const input: ProductInput = { name: row.product_name, sku: row.sku, barcode: row.barcode || null, category_id: categoryId, description: null, base_unit: unit, purchase_cost_c: Math.round(Number(row.cost || 0) * 100), default_price_c: Math.round(Number(row.selling_price) * 100), low_stock_threshold: Number(row.low_stock_level || 5), supplier_id: supplierId, has_expiration: false, notes: null, units: [{ name: unit, conversion_to_base: 1, barcode: null, selling_price_c: Math.round(Number(row.selling_price) * 100), is_default: true }] }
      let id: number
      const priorStock = row.existing_id ? products.getProduct(db, row.existing_id).stock : 0
      if (row.existing_id) { id = row.existing_id; products.updateProduct(db, id, input, userId); updated++ }
      else { id = products.createProduct(db, input, userId).id; created++ }
      if (row.stock !== '') {
        const targetStock = Number(row.stock)
        const change = row.existing_id ? targetStock - priorStock : targetStock
        if (change) products.adjustStock(db, id, change, 'INITIAL_STOCK', row.existing_id ? 'Stock updated from CSV import' : 'Opening stock from CSV import', userId, `CSV row ${row.row_number}`)
      }
      productIds.push(id)
    }
    return { created, updated, skipped, product_ids: productIds }
  })()
}
