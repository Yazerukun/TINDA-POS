import { describe, expect, it } from 'vitest'
import type { Product } from '@shared/types'
import { matchesProductSearch } from '@shared/searchUtils'

describe('Inventory Universal Search & Multi-Unit Barcode Matching', () => {
  const sampleProducts: Product[] = [
    {
      id: 101,
      name: 'Lucky Me Pancit Canton Kalamansi',
      sku: 'LM-CANTON-KAL',
      barcode: '4800016644001',
      description: null,
      category_id: 1,
      category_name: 'Instant Noodles',
      base_unit: 'pc',
      purchase_cost_c: 1200,
      default_price_c: 1500,
      stock: 50,
      low_stock_threshold: 10,
      stock_status: 'IN_STOCK',
      supplier_id: 1,
      has_expiration: false,
      image_path: null,
      status: 'ACTIVE',
      notes: null,
      units: [
        {
          id: 1,
          product_id: 101,
          name: 'Pack (6pcs)',
          conversion_to_base: 6,
          selling_price_c: 8500,
          barcode: '4800016644006',
          is_default: false
        },
        {
          id: 2,
          product_id: 101,
          name: 'Box (72pcs)',
          conversion_to_base: 72,
          selling_price_c: 100000,
          barcode: '4800016644072',
          is_default: false
        }
      ],
      created_at: '2026-01-01',
      updated_at: '2026-01-01'
    },
    {
      id: 102,
      name: 'Great Taste White Coffee Twin Pack',
      sku: 'GT-WHITE-TWIN',
      barcode: null, // primary barcode is null, barcode is on unit
      description: null,
      category_id: 2,
      category_name: 'Coffee & Milk',
      base_unit: 'twin pack',
      purchase_cost_c: 1000,
      default_price_c: 1300,
      stock: 25,
      low_stock_threshold: 5,
      stock_status: 'IN_STOCK',
      supplier_id: 1,
      has_expiration: false,
      image_path: null,
      status: 'ACTIVE',
      notes: null,
      units: [
        {
          id: 3,
          product_id: 102,
          name: 'Twin Pack',
          conversion_to_base: 1,
          selling_price_c: 1300,
          barcode: '4800016699887',
          is_default: true
        }
      ],
      created_at: '2026-01-01',
      updated_at: '2026-01-01'
    },
    {
      id: 103,
      name: 'Zesto Apple Drink 200ml',
      sku: 'ZESTO-APP-200',
      barcode: '4800049112233',
      description: null,
      category_id: 3,
      category_name: 'Juice & Beverages',
      base_unit: 'piece',
      purchase_cost_c: 800,
      default_price_c: 1100,
      stock: 100,
      low_stock_threshold: 15,
      stock_status: 'IN_STOCK',
      supplier_id: 1,
      has_expiration: false,
      image_path: null,
      status: 'ACTIVE',
      notes: null,
      units: [
        {
          id: 4,
          product_id: 103,
          name: 'Box of 10',
          conversion_to_base: 10,
          selling_price_c: 10500,
          barcode: '4800049112240',
          is_default: false
        }
      ],
      created_at: '2026-01-01',
      updated_at: '2026-01-01'
    }
  ]

  // Filter matcher mimicking updated Inventory.tsx
  function filterCatalog(
    products: Product[],
    query: string,
    catFilter: number | 'ALL'
  ): Product[] {
    let list = products
    if (query) {
      list = list.filter((p) => matchesProductSearch(p, query))
    }

    if (catFilter !== 'ALL') {
      const inFilter = list.filter((p) => p.category_id === catFilter)
      if (!query || inFilter.length > 0) {
        list = inFilter
      }
    }
    return list
  }

  it('matches product by unit barcode even if primary product barcode is empty', () => {
    // Search using the twin pack unit barcode
    const results = filterCatalog(sampleProducts, '4800016699887', 'ALL')
    expect(results).toHaveLength(1)
    expect(results[0]?.id).toBe(102)
    expect(results[0]?.name).toBe('Great Taste White Coffee Twin Pack')
  })

  it('matches product by secondary unit barcode (Box / Pack unit)', () => {
    // Search using Box unit barcode
    const results = filterCatalog(sampleProducts, '4800016644072', 'ALL')
    expect(results).toHaveLength(1)
    expect(results[0]?.id).toBe(101)
    expect(results[0]?.sku).toBe('LM-CANTON-KAL')
  })

  it('gracefully broadens search across categories when item is outside selected category filter', () => {
    // User is on Category 1 (Instant Noodles), but searches for Coffee (Category 2)
    const results = filterCatalog(sampleProducts, 'GT-WHITE', 1)
    // Should NOT return 0 items; gracefully broadens to show the matched product
    expect(results).toHaveLength(1)
    expect(results[0]?.id).toBe(102)
  })

  it('preserves category filtering when matching items exist inside the category', () => {
    // User searches "Pack", Category 1 has "Pack (6pcs)", Category 2 has "Twin Pack"
    const resultsInCat1 = filterCatalog(sampleProducts, 'Pack', 1)
    expect(resultsInCat1).toHaveLength(1)
    expect(resultsInCat1[0]?.id).toBe(101)

    const resultsInCat2 = filterCatalog(sampleProducts, 'Pack', 2)
    expect(resultsInCat2).toHaveLength(1)
    expect(resultsInCat2[0]?.id).toBe(102)
  })

  it('matches "Zesto" even when user types "zest-o" with a hyphen (VIP Client Fix)', () => {
    const resultsWithHyphen = filterCatalog(sampleProducts, 'zest-o', 'ALL')
    expect(resultsWithHyphen).toHaveLength(1)
    expect(resultsWithHyphen[0]?.id).toBe(103)
    expect(resultsWithHyphen[0]?.name).toBe('Zesto Apple Drink 200ml')

    const resultsWithSpace = filterCatalog(sampleProducts, 'zest o', 'ALL')
    expect(resultsWithSpace).toHaveLength(1)
    expect(resultsWithSpace[0]?.id).toBe(103)

    const resultsUnitBarcode = filterCatalog(sampleProducts, '4800049112240', 'ALL')
    expect(resultsUnitBarcode).toHaveLength(1)
    expect(resultsUnitBarcode[0]?.id).toBe(103)
  })
})
