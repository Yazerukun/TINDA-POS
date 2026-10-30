import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type Database from 'better-sqlite3'
import { getDb, closeDb } from '../../database/connection'
import { runMigrations, ensureSchemaColumns } from '../../database/migrations'
import * as products from '../../repositories/products'
import { isWeighableUnit, formatQuantity } from '../../../shared/format'
import { completeSetup } from '../auth'

let dataDir: string
let db: Database.Database

beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-weighable-'))
  process.env.TINDA_DATA_DIR = dataDir
  db = getDb()

  completeSetup({
    store: { store_name: 'VIP Scale Test Store', address: 'Bacolod City' },
    admin: { username: 'admin', password: 'password123', pin: '9999', full_name: 'Store Owner' },
    receipt: { footer: 'Salamat!' },
    data_dir: dataDir,
    load_demo: false
  })
})

afterAll(() => {
  try { closeDb() } catch { /* ignore */ }
  try { rmSync(dataDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

describe('TINDA POS v5.2.2 Micro-Precision Weighable & Kilo Units Architecture', () => {
  it('correctly identifies weighable units including extended variations', () => {
    // Standard kilo
    expect(isWeighableUnit('kilo')).toBe(true)
    expect(isWeighableUnit('KILO')).toBe(true)
    expect(isWeighableUnit('kg')).toBe(true)
    expect(isWeighableUnit('kgs')).toBe(true)
    expect(isWeighableUnit('kls')).toBe(true)
    expect(isWeighableUnit('kg.')).toBe(true)
    expect(isWeighableUnit('kilogram')).toBe(true)
    expect(isWeighableUnit('kilograms')).toBe(true)

    // Grams, liters, meters
    expect(isWeighableUnit('g')).toBe(true)
    expect(isWeighableUnit('gm')).toBe(true)
    expect(isWeighableUnit('gms')).toBe(true)
    expect(isWeighableUnit('gram')).toBe(true)
    expect(isWeighableUnit('liter')).toBe(true)
    expect(isWeighableUnit('ltr')).toBe(true)
    expect(isWeighableUnit('meter')).toBe(true)

    // Composite descriptions
    expect(isWeighableUnit('1/4 kilo')).toBe(true)
    expect(isWeighableUnit('half kilo')).toBe(true)
    expect(isWeighableUnit('per kilo')).toBe(true)

    // Non-weighable count units
    expect(isWeighableUnit('pc')).toBe(false)
    expect(isWeighableUnit('pcs')).toBe(false)
    expect(isWeighableUnit('bottle')).toBe(false)
    expect(isWeighableUnit('can')).toBe(false)
    expect(isWeighableUnit('sachet')).toBe(false)
  })

  it('formats fractional and micro-decimal quantities up to 6 decimal places without slop', () => {
    // Whole numbers
    expect(formatQuantity(1, 'kilo')).toBe('1 kilo')
    expect(formatQuantity(5)).toBe('5')

    // Standard 2-decimal fractional weights (e.g. 1/4 kilo)
    expect(formatQuantity(0.25, 'kg')).toBe('0.25 kg')
    expect(formatQuantity(0.5, 'kg')).toBe('0.5 kg')

    // VIP client scenario: 0.37755 kg
    expect(formatQuantity(0.37755, 'kg')).toBe('0.37755 kg')

    // 6-decimal micro weight: 0.205346 kg
    expect(formatQuantity(0.205346, 'kg')).toBe('0.205346 kg')

    // No redundant trailing zeros (e.g. 0.25 does not become 0.250000)
    expect(formatQuantity(0.25)).toBe('0.25')
  })

  it('VIP Client mathematical proof: 0.37755 kg at ₱98.00/kg equals exactly ₱37.00 with ZERO centavo error', () => {
    const unitPriceC = 9800 // ₱98.00
    const targetAmountPesos = 37.00

    // Exact weight computed by POS calculator
    const computedWeight = Math.round((targetAmountPesos / (unitPriceC / 100)) * 1_000_000) / 1_000_000
    expect(computedWeight).toBe(0.377551) // Rounded to 5-6 decimals is 0.377551

    // Subtotal in centavos computed at 0.37755 kg
    const subtotalC1 = Math.round(0.37755 * unitPriceC)
    expect(subtotalC1).toBe(3700) // Exactly ₱37.00!

    const subtotalC2 = Math.round(computedWeight * unitPriceC)
    expect(subtotalC2).toBe(3700) // Exactly ₱37.00!
  })

  it('automatically self-heals legacy database products where base_unit is kilo but product_units was pc', () => {
    // Simulate legacy buggy insertion: product created with base_unit = 'kilo', but product_units has 'pc'
    const info = db.prepare(`
      INSERT INTO products (name, sku, base_unit, purchase_cost_c, default_price_c, low_stock_threshold)
      VALUES ('Fresh Pork Belly (Liempo)', 'LIEMPO-KG', 'kilo', 22000, 28000, 5)
    `).run()
    const legacyProdId = Number(info.lastInsertRowid)

    // Insert buggy unit with name 'pc'
    db.prepare(`
      INSERT INTO product_units (product_id, name, conversion_to_base, selling_price_c, is_default)
      VALUES (?, 'pc', 1, 28000, 1)
    `).run(legacyProdId)

    // Verify it started as 'pc'
    const beforeUnit = db.prepare('SELECT name FROM product_units WHERE product_id = ?').get(legacyProdId) as { name: string }
    expect(beforeUnit.name).toBe('pc')

    // Trigger self-healing migration
    ensureSchemaColumns(db)

    // Verify unit name was self-healed to 'kilo'!
    const afterUnit = db.prepare('SELECT name FROM product_units WHERE product_id = ?').get(legacyProdId) as { name: string }
    expect(afterUnit.name).toBe('kilo')
  })

  it('maintains micro-decimal precision in stock adjustments without 3-decimal truncation', () => {
    const prod = products.createProduct(db, {
      category_id: null,
      name: 'Premium White Rice (Dinorado)',
      sku: 'RICE-DINORADO',
      barcode: '480999111222',
      description: null,
      base_unit: 'kilo',
      purchase_cost_c: 4500,
      default_price_c: 5500,
      low_stock_threshold: 5,
      supplier_id: null,
      has_expiration: false,
      notes: null,
      units: [{ name: 'kilo', conversion_to_base: 1, barcode: null, selling_price_c: 5500, is_default: true }],
      initial_stock_base: 50.000000
    }, 1)

    // Deduct exact 0.37755 kg
    products.adjustStock(db, prod.id, -0.37755, 'SALE', 'Customer sale 0.37755 kg', 1)

    // Verify stock has exact 6-decimal precision: 50 - 0.37755 = 49.62245 kg
    const updated = products.getProduct(db, prod.id)
    expect(updated?.stock).toBe(49.62245)
  })
})
