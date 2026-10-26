import { describe, it, expect } from 'vitest'
import { calculateChainDiscount } from './supplierDiscount'

describe('Supplier Trade Chain Discount Calculator ("Less 5 Less 5")', () => {
  it('calculates -5%-5%-5% ("Less 5 Less 5 Less 5") accurately on ₱1,000.00 gross', () => {
    // Gross: ₱1,000.00 (100,000 cents)
    // Step 1: 100,000 - 5% (5,000) = 95,000
    // Step 2: 95,000 - 5% (4,750) = 90,250
    // Step 3: 90,250 - 5% (4,513) = 85,737 cents (₱857.37)
    // Total discount: 14,263 cents (₱142.63)
    const res = calculateChainDiscount(100000, '-5%-5%-5%')
    expect(res.percentages).toEqual([5, 5, 5])
    expect(res.isChain).toBe(true)
    expect(res.discountAmountC).toBe(14263)
    expect(res.netAmountC).toBe(85737)
    expect(res.displayText).toContain('Less 5% Less 5% Less 5%')
    expect(res.displayText).toContain('-14.26%')
  })

  it('calculates 5+5+5 and 5/5/5 formats identically', () => {
    const resPlus = calculateChainDiscount(100000, '5+5+5')
    const resSlash = calculateChainDiscount(100000, '5/5/5')
    expect(resPlus.discountAmountC).toBe(14263)
    expect(resSlash.discountAmountC).toBe(14263)
  })

  it('calculates -10%-5% ("Less 10 Less 5") accurately on ₱1,000.00 gross', () => {
    // Gross: ₱1,000.00 (100,000 cents)
    // Step 1: 100,000 - 10% (10,000) = 90,000
    // Step 2: 90,000 - 5% (4,500) = 85,500 cents (₱855.00)
    // Total discount: 14,500 cents (₱145.00) -> 14.50%
    const res = calculateChainDiscount(100000, '-10%-5%')
    expect(res.percentages).toEqual([10, 5])
    expect(res.isChain).toBe(true)
    expect(res.discountAmountC).toBe(14500)
    expect(res.netAmountC).toBe(85500)
    expect(res.displayText).toContain('Less 10% Less 5%')
    expect(res.displayText).toContain('-14.50%')
  })

  it('calculates single percentage like -50%, -50, 50%, 5%', () => {
    // User entering "-50%" on ₱1,000.00 gross
    const resMinus50Pct = calculateChainDiscount(100000, '-50%')
    expect(resMinus50Pct.percentages).toEqual([50])
    expect(resMinus50Pct.discountAmountC).toBe(50000) // ₱500.00
    expect(resMinus50Pct.netAmountC).toBe(50000)

    // User entering "-50" shorthand (leading minus) on ₱1,000.00 gross
    const resMinus50 = calculateChainDiscount(100000, '-50')
    expect(resMinus50.percentages).toEqual([50])
    expect(resMinus50.discountAmountC).toBe(50000) // ₱500.00
    expect(resMinus50.netAmountC).toBe(50000)

    // User entering "50%"
    const res50Pct = calculateChainDiscount(100000, '50%')
    expect(res50Pct.percentages).toEqual([50])
    expect(res50Pct.discountAmountC).toBe(50000)

    // User entering "5%"
    const res5Pct = calculateChainDiscount(50000, '5%')
    expect(res5Pct.percentages).toEqual([5])
    expect(res5Pct.discountAmountC).toBe(2500) // ₱25.00
    expect(res5Pct.netAmountC).toBe(47500)     // ₱475.00
  })

  it('calculates cascading -20%-20%', () => {
    // 100,000 - 20% = 80,000 - 20% = 64,000
    const res = calculateChainDiscount(100000, '-20%-20%')
    expect(res.percentages).toEqual([20, 20])
    expect(res.discountAmountC).toBe(36000)
    expect(res.netAmountC).toBe(64000)
  })

  it('evaluates percentages and formula even when gross is 0 (for live UI preview)', () => {
    const res = calculateChainDiscount(0, '-50%')
    expect(res.percentages).toEqual([50])
    expect(res.effectivePercent).toBe(50)
    expect(res.discountAmountC).toBe(0)
  })

  it('handles flat peso discount like ₱50 or P50 or 50', () => {
    const resPeso = calculateChainDiscount(100000, '₱50')
    expect(resPeso.discountAmountC).toBe(5000)
    expect(resPeso.netAmountC).toBe(95000)

    const resRaw = calculateChainDiscount(100000, '50')
    expect(resRaw.discountAmountC).toBe(5000)
    expect(resRaw.netAmountC).toBe(95000)
  })

  it('handles empty, zero, or invalid discounts gracefully', () => {
    expect(calculateChainDiscount(100000, '').discountAmountC).toBe(0)
    expect(calculateChainDiscount(100000, '0').discountAmountC).toBe(0)
    expect(calculateChainDiscount(0, '0').discountAmountC).toBe(0)
  })
})
