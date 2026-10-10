import { describe, it, expect } from 'vitest'
import { safeEvalArithmetic } from './calculator'

describe('safeEvalArithmetic', () => {
  it('evaluates basic addition, subtraction, multiplication, and division', () => {
    expect(safeEvalArithmetic('10 + 20')).toEqual({ value: 30 })
    expect(safeEvalArithmetic('100 - 35')).toEqual({ value: 65 })
    expect(safeEvalArithmetic('12 * 8')).toEqual({ value: 96 })
    expect(safeEvalArithmetic('100 / 4')).toEqual({ value: 25 })
  })

  it('respects standard operator precedence (* and / before + and -)', () => {
    expect(safeEvalArithmetic('10 + 5 * 2')).toEqual({ value: 20 })
    expect(safeEvalArithmetic('100 - 20 / 2')).toEqual({ value: 90 })
    expect(safeEvalArithmetic('2 * 3 + 4 * 5')).toEqual({ value: 26 })
  })

  it('handles decimal numbers and IEEE 754 precision smoothly', () => {
    expect(safeEvalArithmetic('0.1 + 0.2')).toEqual({ value: 0.3 })
    expect(safeEvalArithmetic('0.05 + 0.95')).toEqual({ value: 1 })
    expect(safeEvalArithmetic('12.5 * 2.5')).toEqual({ value: 31.25 })
    expect(safeEvalArithmetic('50,5 + 49,5')).toEqual({ value: 100 }) // comma decimal support
  })

  it('handles numbers with leading zeroes without JS octal syntax errors', () => {
    expect(safeEvalArithmetic('05 + 10')).toEqual({ value: 15 })
    expect(safeEvalArithmetic('007 * 2')).toEqual({ value: 14 })
    expect(safeEvalArithmetic('0100 / 2')).toEqual({ value: 50 })
  })

  it('handles percentage conversions', () => {
    expect(safeEvalArithmetic('50 * 20%')).toEqual({ value: 10 })
    expect(safeEvalArithmetic('100 * 15%')).toEqual({ value: 15 })
    expect(safeEvalArithmetic('200 * 50%')).toEqual({ value: 100 })
  })

  it('safely guards division by zero', () => {
    expect(safeEvalArithmetic('100 / 0')).toEqual({ value: null, error: 'Cannot divide by 0' })
    expect(safeEvalArithmetic('5 / 0.0000000000001')).toEqual({ value: null, error: 'Cannot divide by 0' })
  })

  it('handles malformed, trailing, and consecutive operators cleanly', () => {
    expect(safeEvalArithmetic('50 + ')).toEqual({ value: 50 })
    expect(safeEvalArithmetic('50 * ')).toEqual({ value: 50 })
    expect(safeEvalArithmetic('10 + - * 5')).toEqual({ value: 50 }) // last operator * wins
    expect(safeEvalArithmetic('')).toEqual({ value: 0 })
    expect(safeEvalArithmetic('   ')).toEqual({ value: 0 })
  })

  it('supports visual symbols like ÷, ×, and −', () => {
    expect(safeEvalArithmetic('100 ÷ 4')).toEqual({ value: 25 })
    expect(safeEvalArithmetic('20 × 5')).toEqual({ value: 100 })
    expect(safeEvalArithmetic('50 − 15')).toEqual({ value: 35 })
  })
})
