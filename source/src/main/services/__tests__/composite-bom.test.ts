import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let dataDir: string

beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-bom-'))
  process.env.TINDA_DATA_DIR = dataDir
})

afterAll(() => {
  try {
    closeDb()
  } catch {
    /* ignore */
  }
  try {
    rmSync(dataDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})

import { completeSetup, login } from '../auth'
import { checkout } from '../checkout'
import * as prodRepo from '../../repositories/products'
import * as shiftRepo from '../../repositories/shifts'
import { getDb, closeDb } from '../../database/connection'

describe('Composite & Nested Composite Items (BOM / Recipe Assembly)', () => {
  it('correctly builds, rolls up cost, resolves leaf components, and decrements nested stock on checkout', () => {
    // 1. Initialize store setup & login
    const setup = completeSetup({
      store: { store_name: 'BOM Test Store', address: 'Cebu' },
      admin: { username: 'bomadmin', password: 'secretpassword', pin: '9999', full_name: 'BOM Admin' },
      receipt: { footer: 'Thank you' },
      data_dir: dataDir,
      load_demo: false
    })
    const auth = login('bomadmin', 'secretpassword')
    expect(auth.user.username).toBe('bomadmin')

    const db = getDb()
    shiftRepo.openShift(db, auth.user.id, 10000)

    // 2. Create raw components
    const bun = prodRepo.createProduct(db, {
      name: 'Burger Bun',
      sku: 'SKU-BUN',
      barcode: null,
      description: null,
      base_unit: 'pc',
      purchase_cost_c: 500, // ₱5.00
      default_price_c: 800,
      initial_stock_base: 50,
      has_expiration: false,
      units: [{ name: 'pc', conversion_to_base: 1, barcode: null, selling_price_c: 800, is_default: true }],
      category_id: null,
      supplier_id: null,
      notes: null,
      item_type: 'STANDARD'
    }, auth.user.id)

    const patty = prodRepo.createProduct(db, {
      name: 'Beef Patty',
      sku: 'SKU-PATTY',
      barcode: null,
      description: null,
      base_unit: 'pc',
      purchase_cost_c: 1200, // ₱12.00
      default_price_c: 2000,
      initial_stock_base: 40,
      has_expiration: false,
      units: [{ name: 'pc', conversion_to_base: 1, barcode: null, selling_price_c: 2000, is_default: true }],
      category_id: null,
      supplier_id: null,
      notes: null,
      item_type: 'STANDARD'
    }, auth.user.id)

    const soda = prodRepo.createProduct(db, {
      name: 'Soda Drink',
      sku: 'SKU-SODA',
      barcode: null,
      description: null,
      base_unit: 'can',
      purchase_cost_c: 1500, // ₱15.00
      default_price_c: 2500,
      initial_stock_base: 30,
      has_expiration: false,
      units: [{ name: 'can', conversion_to_base: 1, barcode: null, selling_price_c: 2500, is_default: true }],
      category_id: null,
      supplier_id: null,
      notes: null,
      item_type: 'STANDARD'
    }, auth.user.id)

    // 3. Composite Product (Level 1): Classic Burger = 1 Bun + 1 Patty
    const burger = prodRepo.createProduct(db, {
      name: 'Classic Burger',
      sku: 'SKU-BURGER',
      barcode: null,
      description: null,
      base_unit: 'pc',
      purchase_cost_c: 0,
      default_price_c: 3500, // ₱35.00
      initial_stock_base: 0,
      has_expiration: false,
      units: [{ name: 'pc', conversion_to_base: 1, barcode: null, selling_price_c: 3500, is_default: true }],
      category_id: null,
      supplier_id: null,
      notes: null,
      item_type: 'COMPOSITE',
      recipe: [
        { component_product_id: bun.id, quantity: 1, unit_name: 'pc' },
        { component_product_id: patty.id, quantity: 1, unit_name: 'pc' }
      ]
    }, auth.user.id)

    // Verify Level 1 Rollup Cost: 500 + 1200 = 1700 (₱17.00)
    expect(prodRepo.calculateRollupCost(db, burger.id)).toBe(1700)

    // 4. Nested Composite Product (Level 2): Double Burger Value Meal = 2 Classic Burgers + 1 Soda Drink
    const combo = prodRepo.createProduct(db, {
      name: 'Double Burger Value Meal',
      sku: 'SKU-COMBO-MEAL',
      barcode: null,
      description: null,
      base_unit: 'set',
      purchase_cost_c: 0,
      default_price_c: 9900, // ₱99.00
      initial_stock_base: 0,
      has_expiration: false,
      units: [{ name: 'set', conversion_to_base: 1, barcode: null, selling_price_c: 9900, is_default: true }],
      category_id: null,
      supplier_id: null,
      notes: null,
      item_type: 'COMPOSITE',
      recipe: [
        { component_product_id: burger.id, quantity: 2, unit_name: 'pc' },
        { component_product_id: soda.id, quantity: 1, unit_name: 'can' }
      ]
    }, auth.user.id)

    // Verify Level 2 Rollup Cost: (2 * 1700) + (1 * 1500) = 3400 + 1500 = 4900 (₱49.00)
    expect(prodRepo.calculateRollupCost(db, combo.id)).toBe(4900)

    // 5. Test Cycle Detection
    expect(prodRepo.hasRecipeCycle(db, burger.id, burger.id)).toBe(true)
    expect(prodRepo.hasRecipeCycle(db, burger.id, combo.id)).toBe(true)
    expect(prodRepo.hasRecipeCycle(db, combo.id, bun.id)).toBe(false)

    // 6. Test Recursive Leaf Component Resolution
    // For 3 sets of combo meal:
    // Buns: 3 * (2 * 1) = 6
    // Patties: 3 * (2 * 1) = 6
    // Sodas: 3 * 1 = 3
    const leaves = prodRepo.resolveLeafComponents(db, combo.id, 3)
    expect(leaves.get(bun.id)?.qty).toBe(6)
    expect(leaves.get(patty.id)?.qty).toBe(6)
    expect(leaves.get(soda.id)?.qty).toBe(3)

    // 7. Perform POS checkout of 2 Double Burger Value Meals
    // Should deduct: 2 * (2 * 1) = 4 Buns (50 - 4 = 46)
    //                2 * (2 * 1) = 4 Patties (40 - 4 = 36)
    //                2 * 1 = 2 Sodas (30 - 2 = 28)
    const result = checkout({
      items: [
        {
          product_id: combo.id,
          name: combo.name,
          unit_name: 'set',
          qty: 2,
          qty_base: 2,
          unit_price_c: 9900,
          cost_base_c: 4900,
          stock_base: 0,
          subtotal_c: 19800
        }
      ],
      payments: [{ method: 'CASH', amount_c: 19800 }],
      discount_c: 0,
      customer_id: null,
      notes: 'Nested BOM Checkout Test'
    })

    expect(result.sale.id).toBeGreaterThan(0)

    // Verify that constituent raw leaf stocks are accurately decremented!
    const updatedBun = prodRepo.getProduct(db, bun.id)
    const updatedPatty = prodRepo.getProduct(db, patty.id)
    const updatedSoda = prodRepo.getProduct(db, soda.id)

    expect(updatedBun.stock).toBe(46)
    expect(updatedPatty.stock).toBe(36)
    expect(updatedSoda.stock).toBe(28)
  })
})
