import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import { PurchaseItemPickerModal } from '../PurchaseItemPickerModal'
import type { Product } from '@shared/types'

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Bear Brand Powder 33g',
    sku: 'BB-33G',
    barcode: '4800016644211',
    description: null,
    category_id: 1,
    category_name: 'Milk & Dairy',
    base_unit: 'pc',
    purchase_cost_c: 1350,
    default_price_c: 1600,
    stock: 4,
    low_stock_threshold: 10,
    stock_status: 'LOW_STOCK',
    supplier_id: 1,
    has_expiration: false,
    image_path: null,
    status: 'ACTIVE',
    notes: null,
    units: [],
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 2,
    name: 'Coca-Cola 1.5L',
    sku: 'CC-15L',
    barcode: '4801981112023',
    description: null,
    category_id: 2,
    category_name: 'Beverages',
    base_unit: 'btl',
    purchase_cost_c: 5800,
    default_price_c: 7000,
    stock: 48,
    low_stock_threshold: 12,
    stock_status: 'IN_STOCK',
    supplier_id: 1,
    has_expiration: false,
    image_path: null,
    status: 'ACTIVE',
    notes: null,
    units: [],
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 3,
    name: 'Out of Stock Coffee 25g',
    sku: 'CF-25G',
    barcode: '4800000000000',
    description: null,
    category_id: 2,
    category_name: 'Beverages',
    base_unit: 'sachet',
    purchase_cost_c: 800,
    default_price_c: 1200,
    stock: 0,
    low_stock_threshold: 5,
    stock_status: 'OUT_OF_STOCK',
    supplier_id: 1,
    has_expiration: false,
    image_path: null,
    status: 'ACTIVE',
    notes: null,
    units: [],
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  }
]

describe('PurchaseItemPickerModal', () => {
  it('renders null when open is false', () => {
    const markup = renderToStaticMarkup(
      React.createElement(PurchaseItemPickerModal, {
        open: false,
        onClose: () => {},
        products: mockProducts,
        onSelectProduct: () => {}
      })
    )

    expect(markup).toBe('')
  })

  it('renders Inventory Spotlight Explorer when open is true', () => {
    const markup = renderToStaticMarkup(
      React.createElement(PurchaseItemPickerModal, {
        open: true,
        onClose: () => {},
        products: mockProducts,
        onSelectProduct: () => {}
      })
    )

    // Header & Badges
    expect(markup).toContain('Inventory Spotlight Explorer')
    expect(markup).toContain('F1 Quick Picker')
    expect(markup).toContain('3 Products Active')

    // Category & Filter Pills
    expect(markup).toContain('All Items')
    expect(markup).toContain('Low / Out of Stock')
    expect(markup).toContain('Beverages')
    expect(markup).toContain('Milk &amp; Dairy')

    // Table Content & Rows
    expect(markup).toContain('Bear Brand Powder 33g')
    expect(markup).toContain('4800016644211')
    expect(markup).toContain('Low: 4')
    expect(markup).toContain('₱13.50')

    expect(markup).toContain('Coca-Cola 1.5L')
    expect(markup).toContain('48 on hand')
    expect(markup).toContain('₱58.00')

    expect(markup).toContain('Out of Stock Coffee 25g')
    expect(markup).toContain('Out of Stock (0)')

    // Keyboard navigation hints
    expect(markup).toContain('Esc / F1')
    expect(markup).toContain('↵ Enter')
    expect(markup).toContain('↑ / ↓')
  })

  it('handles large catalogs (>100 items) with instant 0ms progressive chunking', () => {
    // Generate 120 items
    const largeCatalog: Product[] = Array.from({ length: 120 }).map((_, i) => ({
      id: i + 1,
      name: `Catalog Item #${i + 1}`,
      sku: `SKU-${i + 1}`,
      barcode: `880000000${i + 1}`,
      description: null,
      category_id: 1,
      category_name: 'Grocery',
      base_unit: 'pc',
      purchase_cost_c: 1000,
      default_price_c: 1500,
      stock: 20,
      low_stock_threshold: 5,
      stock_status: 'IN_STOCK',
      supplier_id: 1,
      has_expiration: false,
      image_path: null,
      status: 'ACTIVE',
      notes: null,
      units: [],
      created_at: '2026-01-01',
      updated_at: '2026-01-01'
    }))

    const markup = renderToStaticMarkup(
      React.createElement(PurchaseItemPickerModal, {
        open: true,
        onClose: () => {},
        products: largeCatalog,
        onSelectProduct: () => {}
      })
    )

    // Should display the first 80 items without freezing DOM
    expect(markup).toContain('Catalog Item #1')
    expect(markup).toContain('Catalog Item #80')
    expect(markup).not.toContain('Catalog Item #81')
    expect(markup).toContain('Showing first 80 of 120 items')
  })
})
