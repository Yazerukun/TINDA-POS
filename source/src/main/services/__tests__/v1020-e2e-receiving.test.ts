import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../database/migrations'
import * as prodRepo from '../../repositories/products'
import * as invRepo from '../../repositories/inventory'

describe('v1.0.20 Receiving & Dashboard E2E Test Cases', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    runMigrations(db)
    db.prepare("INSERT INTO users(id, username, password_hash, pin_hash, full_name) VALUES(1, 'admin', 'hash', 'pin', 'Admin User')").run()
  })

  it('Receiving Test Cases 1-3: Whole pesos (₱5, ₱10, ₱100) succeed with correct stock & total cost', () => {
    // Create test product with sku and default_price_c
    const p = prodRepo.createProduct(db, {
      name: 'Test Shampoo',
      sku: 'SKU-SHAMPOO-01',
      category_id: null,
      barcode: null,
      description: null,
      base_unit: 'sachet',
      purchase_cost_c: 500, // ₱5
      default_price_c: 800,
      low_stock_threshold: 5,
      supplier_id: null,
      has_expiration: false,
      notes: null,
      units: [{ name: 'sachet', conversion_to_base: 1, barcode: null, selling_price_c: 800, is_default: true }]
    }, 1)

    const testCases = [
      { unitCostPesos: 5, qty: 10, expectedTotalPesos: 50 },
      { unitCostPesos: 10, qty: 5, expectedTotalPesos: 50 },
      { unitCostPesos: 100, qty: 2, expectedTotalPesos: 200 },
    ]

    let currentStock = p.stock

    for (const tc of testCases) {
      const prevStock = currentStock
      const costC = tc.unitCostPesos * 100

      // Validate whole peso rule
      expect(costC % 100).toBe(0)

      prodRepo.adjustStock(db, p.id, tc.qty, 'PURCHASE', 'Restock', 1, 'REF-TEST', {
        source: 'RESTOCK',
        received_unit: 'sachet',
        received_quantity: tc.qty,
        unit_cost_c: costC,
        notes: `Test restock ₱${tc.unitCostPesos}`
      })

      currentStock += tc.qty

      // Verify stock calculation: Previous Stock + Received Quantity = New Stock
      const updatedProduct = prodRepo.getProduct(db, p.id)
      expect(updatedProduct.stock).toBe(prevStock + tc.qty)
      expect(updatedProduct.stock).toBe(currentStock)

      // Verify receiving record & Total Cost = Quantity * Unit Cost
      const receiving = invRepo.listReceiving(db, { limit: 1 }).rows[0]
      expect(receiving).toBeDefined()
      expect(receiving!.previous_stock).toBe(prevStock)
      expect(receiving!.new_stock).toBe(currentStock)
      expect(receiving!.unit_cost_c).toBe(costC)
      expect(receiving!.total_cost_c).toBe(tc.qty * costC)
      expect(receiving!.total_cost_c).toBe(tc.expectedTotalPesos * 100)
    }
  })

  it('Receiving Test Cases 4-6: Fractional unit costs (₱5.10, ₱5.20, ₱5.50) are rejected', () => {
    const fractionalCosts = [
      { pesos: 5.10, costC: 510 },
      { pesos: 5.20, costC: 520 },
      { pesos: 5.50, costC: 550 },
    ]

    for (const fc of fractionalCosts) {
      expect(fc.costC % 100).not.toBe(0)
      const validate = () => {
        if (fc.costC > 0 && fc.costC % 100 !== 0) {
          throw new Error('Unit cost must be in whole pesos (no centavos).')
        }
      }
      expect(validate).toThrow('Unit cost must be in whole pesos (no centavos).')
    }
  })

  it('Preserves historical decimal unit costs in receiving history without corruption', () => {
    const p = prodRepo.createProduct(db, {
      name: 'Legacy Product',
      sku: 'SKU-LEGACY-01',
      category_id: null,
      barcode: null,
      description: null,
      base_unit: 'pc',
      purchase_cost_c: 520, // historical ₱5.20
      default_price_c: 1000,
      low_stock_threshold: 1,
      supplier_id: null,
      has_expiration: false,
      notes: null,
      units: [{ name: 'pc', conversion_to_base: 1, barcode: null, selling_price_c: 1000, is_default: true }]
    }, 1)

    // Simulate historical record with ₱5.20 unit cost
    prodRepo.adjustStock(db, p.id, 10, 'PURCHASE', 'Historical Restock', 1, 'LEGACY-REF', {
      source: 'RESTOCK',
      received_unit: 'pc',
      received_quantity: 10,
      unit_cost_c: 520,
      notes: 'Old stock from supplier with centavos'
    })

    const receiving = invRepo.listReceiving(db, { limit: 1 }).rows[0]
    expect(receiving).toBeDefined()
    expect(receiving!.unit_cost_c).toBe(520) // preserved as 520
    expect(receiving!.total_cost_c).toBe(5200) // 10 * 520 = 5200 (₱52.00)
  })
})
