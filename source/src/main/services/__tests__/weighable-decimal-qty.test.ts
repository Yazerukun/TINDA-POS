import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let dataDir: string
beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'tinda-weighable-'))
  process.env.TINDA_DATA_DIR = dataDir
})
beforeEach(() => {
  closeDb()
  rmSync(dataDir, { recursive: true, force: true })
  mkdirSync(join(dataDir, 'database'), { recursive: true })
})
afterAll(() => {
  try { closeDb() } catch { /* ignore */ }
  try { rmSync(dataDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

import { getDb, closeDb } from '../../database/connection'
import { completeSetup } from '../auth'
import * as users from '../../repositories/users'
import * as shifts from '../../repositories/shifts'
import * as prodRepo from '../../repositories/products'
import { checkout } from '../checkout'
import { processRefund } from '../transaction'
import { setSession } from '../session'
import { hashSecret } from '../../security/passwords'
import { isWeighableUnit, formatQuantity } from '../../../shared/format'
import { maxQuantity } from '../../../renderer/src/lib/cartStock'

describe('v1.0.44 Kilo & Weighable Decimal Quantity Mode', () => {
  it('correctly classifies weighable units vs standard discrete packaging', () => {
    expect(isWeighableUnit('kilo')).toBe(true)
    expect(isWeighableUnit('Kilos')).toBe(true)
    expect(isWeighableUnit('kg')).toBe(true)
    expect(isWeighableUnit('KG')).toBe(true)
    expect(isWeighableUnit('kls')).toBe(true)
    expect(isWeighableUnit('g')).toBe(true)
    expect(isWeighableUnit('gram')).toBe(true)
    expect(isWeighableUnit('grams')).toBe(true)
    expect(isWeighableUnit('liter')).toBe(true)
    expect(isWeighableUnit('L')).toBe(true)
    expect(isWeighableUnit('ml')).toBe(true)

    // Discrete items remain non-weighable
    expect(isWeighableUnit('pc')).toBe(false)
    expect(isWeighableUnit('piece')).toBe(false)
    expect(isWeighableUnit('can')).toBe(false)
    expect(isWeighableUnit('bottle')).toBe(false)
    expect(isWeighableUnit('sachet')).toBe(false)
    expect(isWeighableUnit('box')).toBe(false)
    expect(isWeighableUnit(null)).toBe(false)
    expect(isWeighableUnit(undefined)).toBe(false)
  })

  it('formats quantities accurately with formatQuantity', () => {
    expect(formatQuantity(2.5, 'kg')).toBe('2.5 kg')
    expect(formatQuantity(2.24, 'kls')).toBe('2.24 kls')
    expect(formatQuantity(2.25, 'kilo')).toBe('2.25 kilo')
    expect(formatQuantity(0.75, 'kg')).toBe('0.75 kg')
    expect(formatQuantity(3, 'pcs')).toBe('3 pcs')
    expect(formatQuantity(1)).toBe('1')
  })

  it('computes maxQuantity accurately for fractional and integer units', () => {
    expect(maxQuantity(10, 1, true)).toBe(10)
    expect(maxQuantity(7.75, 1, true)).toBe(7.75)
    expect(maxQuantity(10.5, 1, false)).toBe(10) // discrete floored
  })

  it('executes real-world sale of 2.25 kilos @ ₱180.00/kg (₱405.00 total) and adjusts inventory', () => {
    const db = getDb()
    completeSetup({
      store: { store_name: 'Aling Nena Meat Shop', address: 'Davao City' },
      admin: { username: 'admin', password: 'password123', pin: '1234' },
      receipt: { header: 'Header', footer: 'Footer' },
      data_dir: dataDir,
      load_demo: false
    })

    const cashier = users.createUser(db, {
      username: 'cashier1',
      passwordHash: hashSecret('secret'),
      pinHash: hashSecret('1234'),
      full_name: 'Bong Meat Cashier',
      roles: ['CASHIER']
    })
    setSession({
      id: cashier.id,
      username: cashier.username,
      full_name: cashier.full_name,
      roles: ['CASHIER']
    })

    shifts.openShift(db, cashier.id, 50000)

    // Create Pork Liempo: ₱180/kilo (18,000 centavos), Cost ₱140/kilo (14,000 centavos), 10 kilos initial stock
    const pork = prodRepo.createProduct(db, {
      name: 'Pork Liempo (Fresh)',
      sku: 'MEAT-PORK-01',
      barcode: '4800011223344',
      description: 'Fresh pork belly per kilo',
      base_unit: 'kilo',
      purchase_cost_c: 14000,
      default_price_c: 18000,
      category_id: null,
      supplier_id: null,
      has_expiration: false,
      initial_stock_base: 10,
      notes: null,
      units: [{ name: 'kilo', conversion_to_base: 1, barcode: null, selling_price_c: 18000, is_default: true }]
    }, cashier.id)

    expect(pork.stock).toBe(10)

    // Customer buys 2.25 kilos @ ₱180.00/kilo = ₱405.00 (40,500 centavos)
    const qty1 = 2.25
    const unitPriceC = 18000
    const subtotalC1 = Math.round(qty1 * unitPriceC) // 40500
    expect(subtotalC1).toBe(40500)

    const res1 = checkout({
      items: [{
        product_id: pork.id,
        name: pork.name,
        unit_name: 'kilo',
        qty: qty1,
        qty_base: qty1,
        unit_price_c: unitPriceC,
        subtotal_c: subtotalC1,
        cost_base_c: 14000,
        stock_base: 10
      }],
      discount_c: 0,
      customer_id: null,
      payments: [{ method: 'CASH', amount_c: 50000 }] // Customer paid ₱500
    })

    expect(res1.sale.total_c).toBe(40500)
    // Receipt verifies exact decimal quantity
    expect(res1.receipt.some((line) => line.includes('2.25 x 180.00') && line.includes('405.00'))).toBe(true)

    // Verify remaining stock is 10 - 2.25 = 7.75 kilos
    const updatedPork1 = prodRepo.getProduct(db, pork.id)
    expect(updatedPork1.stock).toBe(7.75)
  })

  it('executes real-world sale of 2.24 kilos @ ₱180.00/kg (₱403.20 total) and processes fractional refund', () => {
    const db = getDb()
    completeSetup({
      store: { store_name: 'Aling Nena Meat Shop', address: 'Davao City' },
      admin: { username: 'admin', password: 'password123', pin: '1234' },
      receipt: { header: 'Header', footer: 'Footer' },
      data_dir: dataDir,
      load_demo: false
    })

    const cashier = users.createUser(db, {
      username: 'cashier1',
      passwordHash: hashSecret('secret'),
      pinHash: hashSecret('1234'),
      full_name: 'Bong Meat Cashier',
      roles: ['CASHIER', 'MANAGER']
    })
    setSession({
      id: cashier.id,
      username: cashier.username,
      full_name: cashier.full_name,
      roles: ['CASHIER', 'MANAGER']
    })

    shifts.openShift(db, cashier.id, 50000)

    const pork = prodRepo.createProduct(db, {
      name: 'Pork Liempo (Fresh)',
      sku: 'MEAT-PORK-02',
      barcode: '4800011223345',
      description: 'Fresh pork belly per kilo',
      base_unit: 'kilo',
      purchase_cost_c: 14000,
      default_price_c: 18000,
      category_id: null,
      supplier_id: null,
      has_expiration: false,
      initial_stock_base: 10,
      notes: null,
      units: [{ name: 'kilo', conversion_to_base: 1, barcode: null, selling_price_c: 18000, is_default: true }]
    }, cashier.id)

    // Customer buys 2.24 kilos @ ₱180.00/kilo = ₱403.20 (40,320 centavos)
    const qty2 = 2.24
    const unitPriceC = 18000
    const subtotalC2 = Math.round(qty2 * unitPriceC) // 40320
    expect(subtotalC2).toBe(40320)

    const res2 = checkout({
      items: [{
        product_id: pork.id,
        name: pork.name,
        unit_name: 'kilo',
        qty: qty2,
        qty_base: qty2,
        unit_price_c: unitPriceC,
        subtotal_c: subtotalC2,
        cost_base_c: 14000,
        stock_base: 10
      }],
      discount_c: 0,
      customer_id: null,
      payments: [{ method: 'CASH', amount_c: 50000 }]
    })

    expect(res2.sale.total_c).toBe(40320)
    expect(res2.receipt.some((line) => line.includes('2.24 x 180.00') && line.includes('403.20'))).toBe(true)

    // Remaining stock: 10 - 2.24 = 7.76 kilos
    const updatedPork2 = prodRepo.getProduct(db, pork.id)
    expect(updatedPork2.stock).toBe(7.76)

    // Test refund: Customer returns 1.24 kilos due to trimmed fat
    const saleItem = res2.sale.items[0]!
    const refund = processRefund({
      sale_id: res2.sale.id,
      reason: 'Trimmed fat returned',
      items: [{
        sale_item_id: saleItem.id,
        product_id: pork.id,
        qty_base: 1.24,
        unit_name: 'kilo'
      }]
    })

    // Refund amount: (1.24 / 2.24) * 40320 = 22320 (₱223.20)
    expect(refund.total_c).toBe(22320)

    // Stock after refund: 7.76 + 1.24 = 9.0 kilos
    const updatedPorkAfterRefund = prodRepo.getProduct(db, pork.id)
    expect(updatedPorkAfterRefund.stock).toBe(9)
  })
})
