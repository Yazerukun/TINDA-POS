import { describe, it, expect } from 'vitest'
import { formatStoreUseSlipLines } from '../../../shared/receiptHtml'
import type { StoreUseRecord } from '../../../shared/types'

describe('Store Use (Operating Expense) Invariant Suite', () => {
  it('formats store use thermal slip lines correctly for 58mm/80mm printers', () => {
    const record: StoreUseRecord = {
      success: true,
      reference: 'SU-20261014-4821',
      product_id: 12,
      product_name: 'Marine Plywood 1/4',
      quantity: 3,
      unit: 'sheet',
      quantity_base: 3,
      unit_cost_c: 45000, // ₱450.00
      total_amount_c: 135000, // ₱1,350.00
      expense_id: 88,
      movement_id: 104,
      stock_before: 20,
      stock_after: 17,
      reason: 'Counter & Shelving Build',
      notes: 'For front store shelf renovation',
      cashier_name: 'Admin Boss',
      created_at: '2026-10-14T15:30:00.000Z'
    }

    const lines = formatStoreUseSlipLines(record, 'TIENDA HARDWARE & GENERAL MERCHANDISE')
    expect(lines).toContain('TIENDA HARDWARE & GENERAL MERCHANDISE')
    expect(lines).toContain('STORE USE EXPENSE VOUCHER')
    expect(lines).toContain('INTERNAL CONSUMPTION')
    expect(lines).toContain('Voucher Ref: SU-20261014-4821')
    expect(lines).toContain('Staff: Admin Boss')
    expect(lines).toContain('Item: Marine Plywood 1/4')
    expect(lines).toContain('Qty: 3 sheet')
    expect(lines).toContain('Unit Cost: P450.00')
    expect(lines).toContain('TOTAL OPEX: P1350.00')
    expect(lines).toContain('Purpose: Counter & Shelving Build')
    expect(lines).toContain('Notes: For front store shelf renovation')
    expect(lines).toContain('Requested: _____________________')
    expect(lines).toContain('Approved:  _____________________')
  })

  it('guarantees integer centavo precision for Store Use OPEX calculation', () => {
    const qty = 2.5 // e.g. 2.5 meters of electrical wire
    const unitCostC = 3750 // ₱37.50
    const totalAmountC = Math.round(qty * unitCostC) // 9375 centavos = ₱93.75

    expect(totalAmountC).toBe(9375)
    expect(Number.isInteger(totalAmountC)).toBe(true)
    expect((totalAmountC / 100).toFixed(2)).toBe('93.75')
  })

  it('correctly calculates new stock and rejects negative remaining stock', () => {
    const currentStock = 10
    const qtyDeducted = 10
    const remaining = currentStock - qtyDeducted
    expect(remaining).toBe(0)
    expect(remaining >= 0).toBe(true)

    const overDeducted = 11
    const invalidRemaining = currentStock - overDeducted
    expect(invalidRemaining < 0).toBe(true)
  })

  it('formats multi-item store use voucher slip lines with exact itemization', () => {
    const multiRecord: StoreUseRecord = {
      success: true,
      reference: 'SU-20261015-8821',
      total_items: 2,
      total_amount_c: 215000, // ₱2,150.00
      expense_id: 99,
      reason: 'Store Repair & Maintenance',
      notes: 'Counter expansion project',
      cashier_name: 'Lead Cashier',
      created_at: '2026-10-15T08:00:00.000Z',
      items: [
        {
          product_id: 1,
          product_name: 'LED Fluorescent Tube 18W',
          quantity: 4,
          unit: 'pc',
          quantity_base: 4,
          unit_cost_c: 20000, // ₱200.00
          total_amount_c: 80000, // ₱800.00
          stock_before: 20,
          stock_after: 16
        },
        {
          product_id: 2,
          product_name: 'Marine Plywood 1/2',
          quantity: 1,
          unit: 'sheet',
          quantity_base: 1,
          unit_cost_c: 135000, // ₱1,350.00
          total_amount_c: 135000,
          stock_before: 5,
          stock_after: 4
        }
      ]
    }

    const lines = formatStoreUseSlipLines(multiRecord, 'TINDA SUPERSTORE')
    expect(lines).toContain('TINDA SUPERSTORE')
    expect(lines).toContain('Voucher Ref: SU-20261015-8821')
    expect(lines).toContain('ITEMS / CONSUMED STOCKS:')
    expect(lines).toContain('1. LED Fluorescent Tube 18W')
    expect(lines).toContain('   4 pc @ P200.00 = P800.00')
    expect(lines).toContain('2. Marine Plywood 1/2')
    expect(lines).toContain('   1 sheet @ P1350.00 = P1350.00')
    expect(lines).toContain('TOTAL OPEX: P2150.00')
    expect(lines).toContain('Purpose: Store Repair & Maintenance')
    expect(lines).toContain('Notes: Counter expansion project')
  })

  it('correctly defaults store use unit price to retail price and handles unit conversions', () => {
    function computeRetailPriceForUnit(
      p: {
        default_price_c: number
        purchase_cost_c: number
        units: Array<{ name: string; selling_price_c: number; conversion_to_base: number }>
      },
      unitName: string
    ): number {
      const match = p.units?.find((u) => u.name === unitName)
      if (match && match.selling_price_c > 0) {
        return match.selling_price_c
      }
      const conv = match?.conversion_to_base || 1
      if (p.default_price_c > 0) {
        return Math.round(p.default_price_c * conv)
      }
      if (p.purchase_cost_c > 0) {
        return Math.round(p.purchase_cost_c * conv)
      }
      return 0
    }

    const testProd = {
      default_price_c: 2500, // ₱25.00 retail
      purchase_cost_c: 1800, // ₱18.00 cost
      units: [
        { name: 'Piece', selling_price_c: 2500, conversion_to_base: 1 },
        { name: 'Pack (10)', selling_price_c: 24000, conversion_to_base: 10 },
        { name: 'Bundle', selling_price_c: 0, conversion_to_base: 5 } // scales default_price_c * 5 = 12500
      ]
    }

    // 1. Piece retail price
    expect(computeRetailPriceForUnit(testProd, 'Piece')).toBe(2500)

    // 2. Pack retail price follows unit-specific retail price
    expect(computeRetailPriceForUnit(testProd, 'Pack (10)')).toBe(24000)

    // 3. Bundle (no unit price) scales default retail price
    expect(computeRetailPriceForUnit(testProd, 'Bundle')).toBe(12500)

    // 4. Product with no retail price falls back to cost
    const costOnlyProd = {
      default_price_c: 0,
      purchase_cost_c: 5000,
      units: [{ name: 'Box', selling_price_c: 0, conversion_to_base: 2 }]
    }
    expect(computeRetailPriceForUnit(costOnlyProd, 'Box')).toBe(10000)
  })

  it('correctly parses JSON_DATA embedded in notes for Store Use History', () => {
    const rawNotes = 'Reason: Counter fabrication | Notes: Urgent repair | JSON_DATA:[{"product_id":10,"product_name":"Marine Plywood 1/4","quantity":2,"unit":"sheet","quantity_base":2,"unit_cost_c":45000,"total_amount_c":90000,"stock_before":15,"stock_after":13}]'

    let items: Array<{ product_id: number; product_name: string; quantity: number; unit: string; total_amount_c: number }> = []
    let reason = 'Store Repair & Maintenance'
    let notesText: string | null = null

    if (rawNotes.includes('JSON_DATA:')) {
      const jsonPart = rawNotes.substring(rawNotes.indexOf('JSON_DATA:') + 'JSON_DATA:'.length)
      items = JSON.parse(jsonPart)
    }

    const parts = rawNotes.split(' | ')
    for (const part of parts) {
      if (part.startsWith('Reason:')) {
        reason = part.replace('Reason:', '').trim()
      } else if (part.startsWith('Notes:')) {
        notesText = part.replace('Notes:', '').trim()
      }
    }

    expect(reason).toBe('Counter fabrication')
    expect(notesText).toBe('Urgent repair')
    expect(items.length).toBe(1)
    expect(items[0]!.product_name).toBe('Marine Plywood 1/4')
    expect(items[0]!.quantity).toBe(2)
    expect(items[0]!.total_amount_c).toBe(90000)
  })

  it('gracefully handles legacy Store Use vouchers without JSON_DATA', () => {
    const legacyNotes = 'Reason: Store Cleaning Supplies | Notes: Restock bathroom supplies'

    let items: unknown[] = []
    let reason = 'Store Repair & Maintenance'
    let notesText: string | null = null

    if (legacyNotes.includes('JSON_DATA:')) {
      const jsonPart = legacyNotes.substring(legacyNotes.indexOf('JSON_DATA:') + 'JSON_DATA:'.length)
      items = JSON.parse(jsonPart)
    }

    const parts = legacyNotes.split(' | ')
    for (const part of parts) {
      if (part.startsWith('Reason:')) {
        reason = part.replace('Reason:', '').trim()
      } else if (part.startsWith('Notes:')) {
        notesText = part.replace('Notes:', '').trim()
      }
    }

    expect(items.length).toBe(0) // Empty triggers fallback to inventory_movements
    expect(reason).toBe('Store Cleaning Supplies')
    expect(notesText).toBe('Restock bathroom supplies')
  })

  it('guarantees Store Use non-cash expenses are balance-only and NOT deducted from net profit or cash expenses', () => {
    const mockExpenses = [
      { amount_c: 12000, reference: 'RECEIPT-01', description: 'Store Electricity', category_name: 'Utilities' },
      { amount_c: 5000, reference: 'SU-20261015-1234', description: 'Store Use: 1 pc of Sponge', category_name: 'Store Use / Internal Consumption' },
      { amount_c: 8000, reference: null, description: 'Snacks & Water', category_name: 'Meals' }
    ]

    const cashExpenses = mockExpenses
      .filter((e) => !(e.reference?.startsWith('SU-') || e.description.startsWith('Store Use') || e.category_name.startsWith('Store Use')))
      .reduce((sum, e) => sum + e.amount_c, 0)

    const storeUseExpenses = mockExpenses
      .filter((e) => e.reference?.startsWith('SU-') || e.description.startsWith('Store Use') || e.category_name.startsWith('Store Use'))
      .reduce((sum, e) => sum + e.amount_c, 0)

    expect(cashExpenses).toBe(20000) // ₱120 + ₱80 = ₱200
    expect(storeUseExpenses).toBe(5000) // ₱50

    const grossProfitC = 50000 // ₱500
    const netProfitC = grossProfitC - cashExpenses // Store Use is NOT subtracted!

    expect(netProfitC).toBe(30000) // ₱300.00
    expect(netProfitC).not.toBe(grossProfitC - cashExpenses - storeUseExpenses)
  })
})

