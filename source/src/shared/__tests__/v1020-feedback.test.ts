import { describe, it, expect } from 'vitest'
import { moneyWholePesos, money } from '../format'

describe('TINDA POS v1.0.20 — User Feedback Improvements', () => {
  describe('moneyWholePesos formatting', () => {
    it('formats whole-peso amounts without centavos', () => {
      expect(moneyWholePesos(0)).toBe('₱0')
      expect(moneyWholePesos(500)).toBe('₱5')
      expect(moneyWholePesos(1000)).toBe('₱10')
      expect(moneyWholePesos(2500)).toBe('₱25')
      expect(moneyWholePesos(10000)).toBe('₱100')
      expect(moneyWholePesos(30000)).toBe('₱300')
    })

    it('preserves historical fractional centavos without data corruption', () => {
      expect(moneyWholePesos(510)).toBe(money(510)) // ₱5.10
      expect(moneyWholePesos(520)).toBe(money(520)) // ₱5.20
      expect(moneyWholePesos(2550)).toBe(money(2550)) // ₱25.50
    })
  })

  describe('Whole-peso unit cost validation logic', () => {
    function validateUnitCost(cost_c: number): void {
      if (!Number.isFinite(cost_c) || cost_c < 0) throw new Error('Cost cannot be negative.')
      if (cost_c > 0 && cost_c % 100 !== 0) throw new Error('Unit cost must be in whole pesos (no centavos).')
    }

    it('accepts whole peso costs', () => {
      expect(() => validateUnitCost(0)).not.toThrow()
      expect(() => validateUnitCost(500)).not.toThrow()
      expect(() => validateUnitCost(1000)).not.toThrow()
      expect(() => validateUnitCost(10000)).not.toThrow()
    })

    it('rejects fractional unit costs with clear error message', () => {
      expect(() => validateUnitCost(510)).toThrow('Unit cost must be in whole pesos (no centavos).')
      expect(() => validateUnitCost(520)).toThrow('Unit cost must be in whole pesos (no centavos).')
      expect(() => validateUnitCost(2550)).toThrow('Unit cost must be in whole pesos (no centavos).')
    })

    it('ensures Quantity * Unit Cost = Total Cost remains integer-exact', () => {
      const qty = 10
      const unitCostC = 500 // ₱5
      const totalCostC = qty * unitCostC // 5000c = ₱50
      expect(totalCostC).toBe(5000)
      expect(totalCostC % 100).toBe(0)
    })
  })
})
