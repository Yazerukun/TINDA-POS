import { describe, expect, it } from 'vitest'
import { actualCashC } from '../cashCounts'

describe('cash count denomination arithmetic', () => {
  it('calculates Philippine bills and coins in centavos', () => {
    const q = Array(11).fill(0)
    q[0] = 2; q[1] = 3; q[6] = 1; q[10] = 4
    expect(actualCashC(q)).toBe(352_100)
  })
  it('accepts zero quantities and rejects invalid quantities', () => {
    expect(actualCashC(Array(11).fill(0))).toBe(0)
    expect(() => actualCashC([-1, ...Array(10).fill(0)])).toThrow()
    expect(() => actualCashC([1.2, ...Array(10).fill(0)])).toThrow()
    expect(() => actualCashC(Array(10).fill(0))).toThrow()
  })
})
