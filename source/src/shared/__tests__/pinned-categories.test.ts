import { describe, it, expect } from 'vitest'
import { parsePinnedCategoryIds } from '../../main/repositories/settings'

describe('parsePinnedCategoryIds', () => {
  it('parses valid numeric arrays correctly', () => {
    expect(parsePinnedCategoryIds([1, 2, 3])).toEqual([1, 2, 3])
    expect(parsePinnedCategoryIds(['1', '2', '3'])).toEqual([1, 2, 3])
  })

  it('parses JSON stringified arrays correctly', () => {
    expect(parsePinnedCategoryIds('[1, 2, 8]')).toEqual([1, 2, 8])
    expect(parsePinnedCategoryIds('["1", "8"]')).toEqual([1, 8])
  })

  it('parses single number string correctly (the root-cause bug)', () => {
    // When SQLite stores '8', it should parse to [8]
    expect(parsePinnedCategoryIds('8')).toEqual([8])
    expect(parsePinnedCategoryIds(8)).toEqual([8])
  })

  it('parses comma-separated strings correctly', () => {
    expect(parsePinnedCategoryIds('1, 2, 8')).toEqual([1, 2, 8])
    expect(parsePinnedCategoryIds('8,9,10')).toEqual([8, 9, 10])
  })

  it('handles empty, null, and invalid values gracefully', () => {
    expect(parsePinnedCategoryIds('')).toEqual([])
    expect(parsePinnedCategoryIds(null)).toEqual([])
    expect(parsePinnedCategoryIds(undefined)).toEqual([])
    expect(parsePinnedCategoryIds('abc')).toEqual([])
    expect(parsePinnedCategoryIds('[]')).toEqual([])
  })

  it('deduplicates and filters out non-positive or NaN values', () => {
    expect(parsePinnedCategoryIds([1, 1, 2, -1, 0, NaN])).toEqual([1, 2])
    expect(parsePinnedCategoryIds('1, 1, 2, 0, -5')).toEqual([1, 2])
  })
})
