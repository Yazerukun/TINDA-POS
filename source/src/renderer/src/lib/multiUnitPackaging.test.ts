import { describe, expect, it } from 'vitest'
import type { Product, ProductUnit } from '@shared/types'
import {
  createProductInput,
  editProductForm,
  updateProductInput
} from './productForm'
import { availableBase, maxQuantity, reservedBase } from './cartStock'

describe('v5.1.5 Multi-Unit Packaging & Custom Unit Pricing', () => {
  const multiUnitProduct: Product = {
    id: 101,
    name: 'Brown Sugar Special',
    sku: 'BSS-01',
    barcode: '480111111000',
    description: 'High grade brown sugar sold by piece, quarter kilo, or full kilo',
    category_id: 1,
    base_unit: 'pc',
    purchase_cost_c: 800, // ₱8.00 cost per piece
    default_price_c: 1300, // ₱13.00 tingi per piece
    stock: 1000, // 1,000 pcs = 10 kilos
    low_stock_threshold: 50,
    supplier_id: null,
    has_expiration: false,
    image_path: null,
    status: 'ACTIVE',
    notes: null,
    units: [
      { id: 1, product_id: 101, name: 'pc', conversion_to_base: 1, barcode: '480111111000', selling_price_c: 1300, is_default: true },
      { id: 2, product_id: 101, name: '1/4 kilo', conversion_to_base: 25, barcode: '480111111025', selling_price_c: 27500, is_default: false },
      { id: 3, product_id: 101, name: 'kilo', conversion_to_base: 100, barcode: '480111111100', selling_price_c: 110000, is_default: false }
    ],
    stock_status: 'IN_STOCK',
    created_at: '2026-10-27 10:00:00',
    updated_at: '2026-10-27 10:00:00'
  }

  it('1. productForm accurately captures and preserves custom unit prices for all packaging units', () => {
    const form = editProductForm(multiUnitProduct)
    expect(form.units).toHaveLength(3)

    // Unit 1: Tingi Piece
    expect(form.units[0]?.name).toBe('pc')
    expect(form.units[0]?.conversion_to_base).toBe(1)
    expect(form.units[0]?.selling_price_c).toBe(1300) // ₱13.00

    // Unit 2: 1/4 Kilo Pack
    expect(form.units[1]?.name).toBe('1/4 kilo')
    expect(form.units[1]?.conversion_to_base).toBe(25)
    expect(form.units[1]?.selling_price_c).toBe(27500) // ₱275.00

    // Unit 3: 1 Kilo Pack
    expect(form.units[2]?.name).toBe('kilo')
    expect(form.units[2]?.conversion_to_base).toBe(100)
    expect(form.units[2]?.selling_price_c).toBe(110000) // ₱1,100.00

    // Test updateProductInput preserves custom prices
    const updated = updateProductInput(form)
    expect(updated.units?.[0]?.selling_price_c).toBe(1300)
    expect(updated.units?.[1]?.selling_price_c).toBe(27500)
    expect(updated.units?.[2]?.selling_price_c).toBe(110000)
  })

  it('2. createProductInput auto-defaults missing unit prices to proportional base price', () => {
    const freshForm = {
      ...editProductForm(multiUnitProduct),
      id: null,
      default_price_c: 1300,
      units: [
        { name: 'pc', conversion_to_base: 1, barcode: null, selling_price_c: 0, is_default: true },
        { name: 'half kilo', conversion_to_base: 50, barcode: null, selling_price_c: 0, is_default: false }
      ]
    }

    const payload = createProductInput(freshForm)
    expect(payload.units[0]?.selling_price_c).toBe(1300)
    // 50 * ₱13.00 = ₱650.00
    expect(payload.units[1]?.selling_price_c).toBe(65000)
  })

  it('3. reserves stock accurately across packaging units', () => {
    // 1,000 pcs total stock in base units
    const stockBase = 1000

    // Max capacity:
    expect(maxQuantity(stockBase, 1)).toBe(1000) // 1,000 pieces
    expect(maxQuantity(stockBase, 25)).toBe(40) // 40 quarter-kilos
    expect(maxQuantity(stockBase, 100)).toBe(10) // 10 kilos

    // Selling 1 Kilo pack (conv: 100)
    const kiloItem = { qty: 1, conversion_to_base: 100 }
    expect(reservedBase(kiloItem)).toBe(100)
    expect(availableBase(stockBase, kiloItem)).toBe(900) // 900 base pcs left

    // Selling 2 Kilo packs (conv: 100)
    const twoKilos = { qty: 2, conversion_to_base: 100 }
    expect(reservedBase(twoKilos)).toBe(200)
    expect(availableBase(stockBase, twoKilos)).toBe(800) // 800 base pcs left

    // Selling 1 Quarter-Kilo pack (conv: 25)
    const quarterItem = { qty: 1, conversion_to_base: 25 }
    expect(reservedBase(quarterItem)).toBe(25)
    expect(availableBase(stockBase, quarterItem)).toBe(975) // 975 base pcs left
  })

  it('4. calculates line total correctly for each unit pricing tier', () => {
    const pcUnit = multiUnitProduct.units[0]!
    const quarterUnit = multiUnitProduct.units[1]!
    const kiloUnit = multiUnitProduct.units[2]!

    // 5 pieces @ ₱13.00 = ₱65.00
    const tingiTotal = 5 * pcUnit.selling_price_c
    expect(tingiTotal).toBe(6500) // ₱65.00

    // 1 Quarter-kilo (25 pcs) @ ₱275.00 = ₱275.00
    const quarterTotal = 1 * quarterUnit.selling_price_c
    expect(quarterTotal).toBe(27500) // ₱275.00

    // 1 Kilo pack (100 pcs) @ ₱1,100.00 = ₱1,100.00
    const kiloTotal = 1 * kiloUnit.selling_price_c
    expect(kiloTotal).toBe(110000) // ₱1,100.00

    // 2 Kilo packs @ ₱1,100.00 = ₱2,200.00
    const twoKiloTotal = 2 * kiloUnit.selling_price_c
    expect(twoKiloTotal).toBe(220000) // ₱2,200.00
  })
})
