import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let dataDir: string

beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-export-excel-test-'))
  process.env.TINDA_DATA_DIR = dataDir
})

afterAll(() => {
  try { closeDb() } catch { /* ignore */ }
  try { rmSync(dataDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

import { completeSetup } from '../auth'
import { createProduct } from '../../repositories/products'
import { getDb, closeDb } from '../../database/connection'
import { exportCsv } from '../export'

describe('v5.1.7 Microsoft Excel Inventory Export Engine', () => {
  it('exports complete inventory with UTF-8 BOM, multi-unit packaging, and converted stock equivalents', () => {
    const db = getDb()

    const setupResult = completeSetup({
      store: { store_name: 'Franz Sari-Sari Wholesale & Retail', address: 'Cebu' },
      admin: { username: 'admin', password: 'password123', pin: '1234', full_name: 'Boss Franz' },
      receipt: { footer: 'Salamat sa Pagpalit' },
      data_dir: dataDir,
      load_demo: false
    })

    const userId = setupResult.user.id

    // Create a product with multi-unit packaging (Tingi ₱13, 1/4 Kilo ₱275, 1 Kilo ₱1,100)
    const product = createProduct(db, {
      name: 'Brown Sugar Special',
      sku: 'BSS-001',
      barcode: '480123456001',
      description: 'Special grade sugar',
      base_unit: 'pc',
      purchase_cost_c: 800, // ₱8.00 cost per pc
      default_price_c: 1300, // ₱13.00 retail per pc
      low_stock_threshold: 50,
      has_expiration: false,
      notes: null,
      category_id: null,
      supplier_id: null,
      units: [
        { name: 'pc', conversion_to_base: 1, barcode: '480123456001', selling_price_c: 1300, is_default: true },
        { name: '1/4 Kilo', conversion_to_base: 25, barcode: '480123456025', selling_price_c: 27500, is_default: false },
        { name: '1 Kilo', conversion_to_base: 100, barcode: '480123456100', selling_price_c: 110000, is_default: false }
      ]
    }, userId)

    expect(product.id).toBeGreaterThan(0)

    // Set stock directly in database for testing (1,000 pcs = exactly 10 Kilos)
    db.prepare('UPDATE products SET stock = 1000 WHERE id = ?').run(product.id)

    // Run export
    const result = exportCsv('INVENTORY')

    expect(result.rows).toBeGreaterThanOrEqual(1)
    expect(existsSync(result.path)).toBe(true)
    expect(result.path).toContain('tinda-inventory-excel')
    expect(result.path.endsWith('.csv')).toBe(true)

    // Read exported CSV content
    const rawContent = readFileSync(result.path, 'utf8')

    // 1. Verify UTF-8 BOM is present for Excel compatibility
    expect(rawContent.startsWith('\uFEFF')).toBe(true)

    // 2. Verify Headers
    expect(rawContent).toContain('Barcode')
    expect(rawContent).toContain('SKU')
    expect(rawContent).toContain('Product Name')
    expect(rawContent).toContain('Packaging Units & Prices')
    expect(rawContent).toContain('Bodega Stock (Base Units)')
    expect(rawContent).toContain('Stock Equivalent (In Packs/Kilos)')
    expect(rawContent).toContain('Cost (PHP)')
    expect(rawContent).toContain('Selling Price (PHP)')
    expect(rawContent).toContain('Total Stock Value (PHP)')
    expect(rawContent).toContain('Stock Status')

    // 3. Verify Product Data Row
    expect(rawContent).toContain('Brown Sugar Special')
    expect(rawContent).toContain('BSS-001')
    expect(rawContent).toContain('480123456001')
    expect(rawContent).toContain('1/4 Kilo (25 base) = ₱275.00')
    expect(rawContent).toContain('1 Kilo (100 base) = ₱1100.00')
    expect(rawContent).toContain('1000') // Stock in base pcs
    expect(rawContent).toContain('10 1 Kilo') // Converted stock equivalent (10 kilos!)
    expect(rawContent).toContain('8.00') // Cost
    expect(rawContent).toContain('13.00') // Selling price
    expect(rawContent).toContain('8000.00') // 1,000 * 8.00 = ₱8,000.00 total stock value
    expect(rawContent).toContain('HEALTHY')
  })
})
