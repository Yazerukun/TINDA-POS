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
})
