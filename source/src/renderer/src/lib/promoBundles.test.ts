import { describe, it, expect, beforeEach } from 'vitest'
import {
  evaluateCartPromos,
  getStoredPromoBundles,
  savePromoBundles,
  getPromoBundleInventoryStatus,
  DEFAULT_PROMO_BUNDLES,
  type PromoBundle
} from '../utils/promoBundles'
import type { Product } from '@shared/types'

describe('Promo Bundles Engine', () => {
  beforeEach(() => {
    savePromoBundles([])
  })

  it('provides default promo combos (breakfast, snack, 3 for 50)', () => {
    const bundles = getStoredPromoBundles()
    expect(bundles.length).toBeGreaterThanOrEqual(3)
    expect(bundles[0]!.name).toContain('Breakfast Combo')
  })

  it('accurately evaluates combo savings when cart contains matching items', () => {
    const testBundle: PromoBundle = {
      id: 'test_combo',
      name: 'Burger + Fries Combo',
      type: 'FIXED_COMBO',
      bundle_price_c: 8000, // ₱80 (regular ₱60 + ₱30 = ₱90)
      is_active: true,
      description: 'Burger and fries bundle',
      items: [
        { name_keyword: 'burger', quantity: 1 },
        { name_keyword: 'fries', quantity: 1 }
      ]
    }

    const cart = [
      { product_id: 1, name: 'Cheese Burger', qty: 2, unit_price_c: 6000 },
      { product_id: 2, name: 'French Fries Regular', qty: 2, unit_price_c: 3000 }
    ]

    const matches = evaluateCartPromos(cart, [testBundle])
    expect(matches).toHaveLength(1)
    expect(matches[0]!.appliedCount).toBe(2)
    // Regular price per combo = 6000 + 3000 = 9000. Bundle = 8000. Savings per combo = 1000.
    // 2 combos = 2000 cents (₱20.00)
    expect(matches[0]!.savingsC).toBe(2000)
  })

  it('matches cart items by exact product_id priority', () => {
    const bundleWithId: PromoBundle = {
      id: 'id_combo',
      name: 'Coffee & Donut',
      type: 'FIXED_COMBO',
      bundle_price_c: 4500,
      is_active: true,
      description: 'Combo by id',
      items: [
        { product_id: 101, name_keyword: 'coffee', quantity: 1 },
        { product_id: 102, name_keyword: 'donut', quantity: 1 }
      ]
    }

    const cart = [
      { product_id: 101, name: 'Barako Coffee Hot', qty: 1, unit_price_c: 3500 },
      { product_id: 102, name: 'Choco Donut', qty: 1, unit_price_c: 2500 }
    ]

    const matches = evaluateCartPromos(cart, [bundleWithId])
    expect(matches).toHaveLength(1)
    expect(matches[0]!.appliedCount).toBe(1)
    expect(matches[0]!.savingsC).toBe(1500) // (3500 + 2500) - 4500 = 1500 cents
  })

  it('computes Loyverse-style available bundle inventory status accurately', () => {
    const mockProducts = [
      {
        id: 201,
        name: 'Corned Beef Can 150g',
        sku: 'CB-150',
        category_id: null,
        base_unit: 'can',
        stock: 10,
        sellable_stock: 10,
        default_price_c: 4000,
        purchase_cost_c: 3200,
        low_stock_threshold: 2,
        status: 'ACTIVE',
        created_at: '',
        updated_at: ''
      },
      {
        id: 202,
        name: 'Instant Noodles Pack',
        sku: 'IN-01',
        category_id: null,
        base_unit: 'pack',
        stock: 5, // Limiting component: 5 packs / 2 per bundle = 2 bundles
        sellable_stock: 5,
        default_price_c: 1500,
        purchase_cost_c: 1100,
        low_stock_threshold: 2,
        status: 'ACTIVE',
        created_at: '',
        updated_at: ''
      }
    ] as unknown as Product[]

    const groceryBundle: PromoBundle = {
      id: 'grocery_bundle_1',
      name: '1 Can + 2 Noodles Bundle',
      type: 'FIXED_COMBO',
      bundle_price_c: 6000, // ₱60 (regular: 40 + 2*15 = ₱70, saves ₱10)
      is_active: true,
      description: 'Affordable grocery combo',
      items: [
        { product_id: 201, name_keyword: 'corned beef', quantity: 1 },
        { product_id: 202, name_keyword: 'instant noodles', quantity: 2 }
      ]
    }

    const status = getPromoBundleInventoryStatus(groceryBundle, mockProducts)
    // 10 cans / 1 = 10; 5 noodles / 2 = 2. Max bundles = 2
    expect(status.availableBundles).toBe(2)
    // Regular price = 4000 + 2 * 1500 = 7000 cents
    expect(status.regularPriceC).toBe(7000)
    // Rollup cost = 3200 + 2 * 1100 = 5400 cents
    expect(status.totalCostC).toBe(5400)
    // Savings = 7000 - 6000 = 1000 cents (₱10.00)
    expect(status.savingsC).toBe(1000)
    expect(status.allLinkedToInventory).toBe(true)
    expect(status.components).toHaveLength(2)
    expect(status.components[1]?.maxBundles).toBe(2)
  })

  it('accurately evaluates volume tier savings for bulk quantity thresholds', () => {
    const volumeBundle: PromoBundle = {
      id: 'vol_soda',
      name: '3 Sodas for ₱50',
      type: 'VOLUME_TIER',
      bundle_price_c: 5000,
      is_active: true,
      description: 'Buy 3 for ₱50',
      items: [],
      target_name_keyword: 'soda',
      min_quantity: 3
    }

    const cart = [
      { product_id: 10, name: 'Soda Can 330ml', qty: 4, unit_price_c: 2000 }
    ]

    // 4 sodas: 3 count toward 1 tier. Regular for 3 = 6000 cents. Tier = 5000 cents. Savings = 1000 cents.
    const matches = evaluateCartPromos(cart, [volumeBundle])
    expect(matches).toHaveLength(1)
    expect(matches[0]!.appliedCount).toBe(1)
    expect(matches[0]!.savingsC).toBe(1000)
  })

  it('does not apply inactive promo bundles', () => {
    const inactiveBundle: PromoBundle = {
      id: 'inactive',
      name: 'Old Promo',
      type: 'FIXED_COMBO',
      bundle_price_c: 1000,
      is_active: false,
      description: 'Disabled promo',
      items: [{ name_keyword: 'bread', quantity: 1 }]
    }

    const cart = [{ product_id: 5, name: 'Pandesal Bread', qty: 10, unit_price_c: 200 }]
    const matches = evaluateCartPromos(cart, [inactiveBundle])
    expect(matches).toHaveLength(0)
  })
})
