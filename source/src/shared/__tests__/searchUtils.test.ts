import { describe, it, expect } from 'vitest'
import { matchesProductSearch, normalizeSearchTerm } from '../searchUtils'
import type { Product } from '../types'

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'Sample Item',
    sku: 'SKU-001',
    barcode: '480000000001',
    description: null,
    category_id: null,
    category_name: null,
    supplier_id: null,
    purchase_cost_c: 1000,
    default_price_c: 1500,
    stock: 50,
    low_stock_threshold: 10,
    stock_status: 'IN_STOCK',
    base_unit: 'Piece',
    has_expiration: false,
    image_path: null,
    status: 'ACTIVE',
    notes: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    item_type: 'STANDARD',
    units: [],
    ...overrides
  }
}

describe('searchUtils - Universal Hyphen & Punctuation Agnostic Product Search', () => {
  it('normalizes terms properly', () => {
    expect(normalizeSearchTerm('Zest-O Apple 200ml')).toBe('zestoapple200ml')
    expect(normalizeSearchTerm('zest-o')).toBe('zesto')
    expect(normalizeSearchTerm('zest o')).toBe('zesto')
    expect(normalizeSearchTerm('Coca-Cola Zero')).toBe('cocacolazero')
  })

  it('matches product when user types "zest-o" but product was encoded as "Zesto Apple 200ml"', () => {
    const prod = makeProduct({ name: 'Zesto Apple 200ml' })
    expect(matchesProductSearch(prod, 'zest-o')).toBe(true)
    expect(matchesProductSearch(prod, 'zesto')).toBe(true)
    expect(matchesProductSearch(prod, 'zest o')).toBe(true)
  })

  it('matches product when user types "zesto" but product was encoded as "Zest-O Orange 200ml"', () => {
    const prod = makeProduct({ name: 'Zest-O Orange 200ml' })
    expect(matchesProductSearch(prod, 'zesto')).toBe(true)
    expect(matchesProductSearch(prod, 'zest-o')).toBe(true)
    expect(matchesProductSearch(prod, 'zest o')).toBe(true)
  })

  it('matches product when user types "zest o" but product was encoded as "Zest-O Mango"', () => {
    const prod = makeProduct({ name: 'Zest-O Mango' })
    expect(matchesProductSearch(prod, 'zest o')).toBe(true)
  })

  it('matches multi-word queries with arbitrary order', () => {
    const prod = makeProduct({ name: 'Zest-O Fruit Juice Apple 200ml' })
    expect(matchesProductSearch(prod, 'apple zest-o')).toBe(true)
    expect(matchesProductSearch(prod, 'zesto apple')).toBe(true)
  })

  it('matches via unit packaging barcode', () => {
    const prod = makeProduct({
      name: 'Zest-O Apple',
      barcode: null,
      units: [
        {
          id: 10,
          product_id: 1,
          name: 'Pack of 10',
          conversion_to_base: 10,
          barcode: '480004999999',
          selling_price_c: 12000,
          is_default: false
        }
      ]
    })
    expect(matchesProductSearch(prod, '480004999999')).toBe(true)
    expect(matchesProductSearch(prod, 'Pack of 10')).toBe(true)
  })
})
