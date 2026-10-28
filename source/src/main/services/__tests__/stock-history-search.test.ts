import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let dataDir: string

beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-stock-history-search-test-'))
  process.env.TINDA_DATA_DIR = dataDir
})

afterAll(() => {
  try { closeDb() } catch { /* ignore */ }
  try { rmSync(dataDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

import { completeSetup } from '../auth'
import { createProduct, adjustStock } from '../../repositories/products'
import { getDb, closeDb } from '../../database/connection'
import { listMovements } from '../../repositories/inventory'
import { exportCsv } from '../export'

describe('v5.1.8 Stock History Spotlight Search, Telemetry & Excel Export', () => {
  it('searches stock movements by product name, barcode, SKU, reason, reference, and exports to Excel', () => {
    const db = getDb()

    const setupResult = completeSetup({
      store: { store_name: 'Franz Retail Hub', address: 'Davao City' },
      admin: { username: 'bossfranz', password: 'password123', pin: '8888', full_name: 'Boss Franz' },
      receipt: { footer: 'Daghang Salamat' },
      data_dir: dataDir,
      load_demo: false
    })

    const userId = setupResult.user.id

    // Product 1: Coca-Cola 1.5L
    const prod1 = createProduct(db, {
      name: 'Coca-Cola 1.5L Bottle',
      sku: 'COKE-15L-PET',
      barcode: '480000100155',
      description: 'Soda bottle',
      base_unit: 'bottle',
      purchase_cost_c: 5500, // ₱55.00
      default_price_c: 7500, // ₱75.00
      low_stock_threshold: 12,
      has_expiration: false,
      notes: null,
      category_id: null,
      supplier_id: null,
      units: [
        { name: 'bottle', conversion_to_base: 1, barcode: '480000100155', selling_price_c: 7500, is_default: true }
      ]
    }, userId)

    // Product 2: Bear Brand 150g
    const prod2 = createProduct(db, {
      name: 'Bear Brand Fortified 150g',
      sku: 'BB-MILK-150G',
      barcode: '480000200233',
      description: 'Powdered milk',
      base_unit: 'pack',
      purchase_cost_c: 4200, // ₱42.00
      default_price_c: 5200, // ₱52.00
      low_stock_threshold: 20,
      has_expiration: false,
      notes: null,
      category_id: null,
      supplier_id: null,
      units: [
        { name: 'pack', conversion_to_base: 1, barcode: '480000200233', selling_price_c: 5200, is_default: true }
      ]
    }, userId)

    // 1. Initial Stock / Purchase for Coke
    adjustStock(db, prod1.id, 50, 'PURCHASE', 'Supplier restock batch #1', userId, 'INV-COKE-001')

    // 2. Sale deduction for Coke
    adjustStock(db, prod1.id, -5, 'SALE', 'POS sale checkout', userId, 'TX-10001')

    // 3. Store use deduction for Coke
    adjustStock(db, prod1.id, -2, 'STORE_USE', 'Staff lunch consumption', userId, 'SU-2026-001')

    // 4. Purchase for Bear Brand
    adjustStock(db, prod2.id, 100, 'PURCHASE', 'Opening warehouse delivery', userId, 'INV-MILK-999')

    // 5. Damage / Withdrawal for Bear Brand
    adjustStock(db, prod2.id, -3, 'WITHDRAWAL', 'Punctured packaging during transit', userId, 'WD-0042')

    // Test A: Search by Product Name "Coca-Cola"
    const searchByName = listMovements(db, { search: 'Coca-Cola' })
    expect(searchByName.rows.length).toBe(3)
    expect(searchByName.rows.every((r) => r.product_id === prod1.id)).toBe(true)
    expect(searchByName.rows[0]!.product_name).toBe('Coca-Cola 1.5L Bottle')
    expect(searchByName.rows[0]!.product_sku).toBe('COKE-15L-PET')

    // Test B: Search by Barcode
    const searchByBarcode = listMovements(db, { search: '480000200233' })
    expect(searchByBarcode.rows.length).toBe(2)
    expect(searchByBarcode.rows.every((r) => r.product_id === prod2.id)).toBe(true)

    // Test C: Search by SKU "BB-MILK"
    const searchBySku = listMovements(db, { search: 'BB-MILK' })
    expect(searchBySku.rows.length).toBe(2)
    expect(searchBySku.rows[0]!.product_sku).toBe('BB-MILK-150G')

    // Test D: Search by Reason "Staff lunch"
    const searchByReason = listMovements(db, { search: 'Staff lunch' })
    expect(searchByReason.rows.length).toBe(1)
    expect(searchByReason.rows[0]!.movement_type).toBe('STORE_USE')
    expect(searchByReason.rows[0]!.quantity_change).toBe(-2)

    // Test E: Search by Reference "WD-0042"
    const searchByRef = listMovements(db, { search: 'WD-0042' })
    expect(searchByRef.rows.length).toBe(1)
    expect(searchByRef.rows[0]!.movement_type).toBe('WITHDRAWAL')
    expect(searchByRef.rows[0]!.quantity_change).toBe(-3)

    // Test F: Combined Movement Type Filter + Search
    const searchCombined = listMovements(db, { movement_type: 'PURCHASE', search: 'Coke' })
    expect(searchCombined.rows.length).toBe(1)
    expect(searchCombined.rows[0]!.quantity_change).toBe(50)

    // Test G: Export Stock History to Excel CSV
    const exportResult = exportCsv('MOVEMENTS', { search: 'Coke' })
    expect(exportResult.rows).toBe(3)
    expect(existsSync(exportResult.path)).toBe(true)

    const csvContent = readFileSync(exportResult.path, 'utf8')
    // Verify UTF-8 BOM
    expect(csvContent.charCodeAt(0)).toBe(0xFEFF)

    // Verify CSV Headers
    expect(csvContent).toContain('Date & Time,Product Name,SKU,Barcode,Movement Type,Quantity Change,Unit,Stock After,Reason,Reference / Invoice,Recorded By')

    // Verify Content rows
    expect(csvContent).toContain('Coca-Cola 1.5L Bottle')
    expect(csvContent).toContain('COKE-15L-PET')
    expect(csvContent).toContain('480000100155')
    expect(csvContent).toContain('PURCHASE')
    expect(csvContent).toContain('+50')
    expect(csvContent).toContain('Boss Franz')
  })
})
