import { describe, it, expect, beforeEach } from 'vitest'
import {
  evaluateCartPromos,
  getStoredPromoBundles,
  savePromoBundles,
  DEFAULT_PROMO_BUNDLES,
  type PromoBundle
} from '../utils/promoBundles'

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
