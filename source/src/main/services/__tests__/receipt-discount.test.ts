import { describe, expect, it } from 'vitest'
import { formatDiscountPercent, generatePurchaseOrderDocumentHtml, type PurchaseOrderPrintPayload } from '@shared/receiptHtml'

describe('formatDiscountPercent dual-notation and cascading discount formatting', () => {
  it('formats cascading 20%+20% strictly as clean -20%-20% for receipts and printouts without compounding totals (v5.1.0 VIP feature)', () => {
    // Default / document / receipt mode: strictly clean percentage chain
    expect(formatDiscountPercent('20+20', 3600, 10000)).toBe('-20%-20%')
    expect(formatDiscountPercent('20-20', 3600, 10000)).toBe('-20%-20%')
    expect(formatDiscountPercent('-20%-20%', 3600, 10000)).toBe('-20%-20%')
    expect(formatDiscountPercent('less 20%-20%', 3600, 10000)).toBe('-20%-20%')
    expect(formatDiscountPercent('20/20', 3600, 10000)).toBe('-20%-20%')
    expect(formatDiscountPercent('20 20', 3600, 10000)).toBe('-20%-20%')

    // 10%+10% and 5%+5%+5% clean chain
    expect(formatDiscountPercent('10+10', 1900, 10000)).toBe('-10%-10%')
    expect(formatDiscountPercent('10-10', 1900, 10000)).toBe('-10%-10%')
    expect(formatDiscountPercent('-10%-10%', 1900, 10000)).toBe('-10%-10%')
    expect(formatDiscountPercent('5+5+5', 1426, 10000)).toBe('-5%-5%-5%')
    expect(formatDiscountPercent('5-5-5', 1426, 10000)).toBe('-5%-5%-5%')
    expect(formatDiscountPercent('-5%-5%-5%', 1426, 10000)).toBe('-5%-5%-5%')
  })

  it('renders document HTML with clean -20%-20% in the DISCOUNT column by default', () => {
    const payload: PurchaseOrderPrintPayload = {
      storeName: 'VIP Hardware Store',
      storeAddress: 'Iloilo City',
      storePhone: '0917-123-4567',
      purchase: {
        id: 1,
        purchase_no: 'PO-2026-001',
        supplier_name: 'Lucky Steel Corp',
        purchase_date: '2026-10-26',
        total_c: 100000,
        discount_c: 36000,
        net_total_c: 64000,
        created_at: '2026-10-26T00:00:00Z',
        items: [
          {
            id: 1,
                        product_name: 'Steel Bar 12mm',
            unit_name: 'pc',
            qty: 10,
            qty_base: 10,
            unit_cost_c: 10000,
            discount_input: '20+20',
            discount_c: 36000,
            subtotal_c: 64000
          }
        ]
      }
    }

    // Default document print: strictly clean -20%-20% (NOT "-20%-20% (Effective: 36%)")
    const docDefault = generatePurchaseOrderDocumentHtml(payload)
    expect(docDefault.html).toContain('-20%-20%')
    expect(docDefault.html).not.toContain('(Effective:')

    // Explicit customizer option with showEffectiveDiscount: true
    const docEffective = generatePurchaseOrderDocumentHtml(payload, { showEffectiveDiscount: true })
    expect(docEffective.html).toContain('-20%-20% (Effective: 36%)')
  })

  it('formats cascading 10%+10% with effective 19% only when explicitly requested via withEffective: true', () => {
    const formatted = formatDiscountPercent('10+10', 1900, 10000, { withEffective: true })
    expect(formatted).toBe('-10%-10% (Effective: 19%)')
  })

  it('formats cascading 10%+10% in compact/default mode for 58mm thermal receipts', () => {
    const formattedDefault = formatDiscountPercent('10+10', 1900, 10000)
    expect(formattedDefault).toBe('-10%-10%')

    const formattedCompact = formatDiscountPercent('10+10', 1900, 10000, { compact: true })
    expect(formattedCompact).toBe('-10%-10%')
    expect(formattedCompact.length).toBeLessThanOrEqual(10)
  })

  it('formats cascading 5%+5%+5% with effective 14.3% when explicitly requested via withEffective: true', () => {
    const formatted = formatDiscountPercent('5+5+5', 1426, 10000, { withEffective: true })
    expect(formatted).toBe('-5%-5%-5% (Effective: 14.3%)')
  })

  it('formats cascading 5%+5%+5% in compact/default mode for 58mm thermal receipts', () => {
    const formatted = formatDiscountPercent('5+5+5', 1426, 10000, { compact: true })
    expect(formatted).toBe('-5%-5%-5%')
    expect(formatted.length).toBeLessThanOrEqual(10)
  })

  it('handles flat peso discounts e.g. ₱50', () => {
    const formatted = formatDiscountPercent('₱50', 5000, 100000)
    expect(formatted).toBe('-5%')
  })

  it('handles single percentage discounts e.g. 20%', () => {
    expect(formatDiscountPercent('20%', 2000, 10000)).toBe('-20%')
    expect(formatDiscountPercent('-20%', 2000, 10000)).toBe('-20%')
    expect(formatDiscountPercent('20', 2000, 10000)).toBe('-20%')
  })

  it('handles empty or zero discount', () => {
    expect(formatDiscountPercent('')).toBe('—')
    expect(formatDiscountPercent(null)).toBe('—')
    expect(formatDiscountPercent('0')).toBe('—')
  })
})
