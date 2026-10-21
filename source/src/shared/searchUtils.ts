import type { Product } from './types'

/**
 * Normalizes an arbitrary string for punctuation-, hyphen-, and space-agnostic matching.
 * Converts to lowercase and removes all non-alphanumeric characters.
 * Example: "Zest-O Apple 200ml" -> "zestoapple200ml"
 */
export function normalizeSearchTerm(term: string): string {
  return (term || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Evaluates whether a Product matches a given query string across:
 * - Product Name (exact, substring, or hyphen-normalized)
 * - Primary Barcode
 * - SKU
 * - Packaging Unit Barcodes (Piece, Pack, Box, Case)
 * - Packaging Unit Names
 * - Multi-word tokens in any order (e.g. "zest-o apple" vs "apple zest-o")
 */
export function matchesProductSearch(product: Product, query: string): boolean {
  if (!query || !query.trim()) return true
  const qTrim = query.trim().toLowerCase()
  const qNorm = normalizeSearchTerm(qTrim)

  // 1. Direct contains check (fast path)
  if (product.name && product.name.toLowerCase().includes(qTrim)) return true
  if (product.barcode && product.barcode.toLowerCase().includes(qTrim)) return true
  if (product.sku && product.sku.toLowerCase().includes(qTrim)) return true

  // 2. Normalized punctuation/hyphen-agnostic check (handles "zest-o" vs "Zesto" vs "Zest O")
  if (qNorm.length >= 2) {
    const nameNorm = normalizeSearchTerm(product.name || '')
    if (nameNorm.includes(qNorm)) return true
    if (product.sku && normalizeSearchTerm(product.sku).includes(qNorm)) return true
  }

  // 3. Multi-unit packaging barcode & unit name inspection
  if (product.units && product.units.length > 0) {
    for (const u of product.units) {
      if (u.barcode && u.barcode.toLowerCase().includes(qTrim)) return true
      if (u.name && u.name.toLowerCase().includes(qTrim)) return true
      if (qNorm.length >= 2) {
        if (u.barcode && normalizeSearchTerm(u.barcode).includes(qNorm)) return true
        if (u.name && normalizeSearchTerm(u.name).includes(qNorm)) return true
      }
    }
  }

  // 4. Token-based multi-word search (handles arbitrary word order and mixed punctuation)
  const tokens = qTrim.split(/[\s\-_]+/).filter((t) => t.length > 0)
  if (tokens.length > 1) {
    const fullNormalized = normalizeSearchTerm(
      `${product.name || ''} ${product.sku || ''} ${product.barcode || ''} ${
        product.units?.map((u) => `${u.name} ${u.barcode || ''}`).join(' ') || ''
      }`
    )
    if (tokens.every((tok) => fullNormalized.includes(normalizeSearchTerm(tok)))) {
      return true
    }
  }

  return false
}
