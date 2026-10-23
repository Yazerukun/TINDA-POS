import { describe, expect, it } from 'vitest'
import { formatDiscountPercent } from '@shared/receiptHtml'

describe('formatDiscountPercent dual-notation and cascading discount formatting', () => {
  it('formats cascading 10%+10% with effective 19% for screen & documents when withEffective: true', () => {
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

  it('formats cascading 5%+5%+5% with effective 14.3% for documents when withEffective: true', () => {
    // 10000 gross, 5%+5%+5% -> net 8574 -> discount 1426
    const formatted = formatDiscountPercent('5+5+5', 1426, 10000, { withEffective: true })
    expect(formatted).toBe('-5%-5%-5% (Effective: 14.3%)')
  })

  it('formats cascading 5%+5%+5% in compact/default mode for 58mm thermal receipts', () => {
    const formatted = formatDiscountPercent('5+5+5', 1426, 10000, { compact: true })
    expect(formatted).toBe('-5%-5%-5%')
    expect(formatted.length).toBeLessThanOrEqual(10)
  })

  it('calculates compounded effective percentage if grossC is not provided when withEffective: true', () => {
    const formatted = formatDiscountPercent('10+10', undefined, undefined, { withEffective: true })
    expect(formatted).toBe('-10%-10% (Effective: 19%)')
  })

  it('handles flat peso discounts e.g. ₱50', () => {
    const formatted = formatDiscountPercent('₱50', 5000, 100000)
    expect(formatted).toBe('-5%')
  })

  it('handles single percentage discounts e.g. 20%', () => {
    const formatted = formatDiscountPercent('20%', 2000, 10000)
    expect(formatted).toBe('-20%')
  })

  it('handles empty or zero discount', () => {
    expect(formatDiscountPercent('')).toBe('—')
    expect(formatDiscountPercent(null)).toBe('—')
    expect(formatDiscountPercent('0')).toBe('—')
  })
})
