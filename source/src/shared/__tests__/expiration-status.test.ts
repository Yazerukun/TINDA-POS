import { describe, expect, it } from 'vitest'
import { expirationStatus, productExpirationStatus } from '../expiration'

describe('productExpirationStatus', () => {
  it('identifies unexpired items as OK', () => {
    const item = { expiration_mode: 'ITEM', expiration_date: '2099-12-31' }
    expect(productExpirationStatus(item, '2026-09-30')).toBe('OK')
  })

  it('identifies expired items', () => {
    const item = { expiration_mode: 'ITEM', expiration_date: '2026-09-01' }
    expect(productExpirationStatus(item, '2026-09-30')).toBe('EXPIRED')
  })

  it('identifies items expiring within 7 days as SOON', () => {
    const item = { expiration_mode: 'ITEM', expiration_date: '2026-10-05' }
    expect(productExpirationStatus(item, '2026-09-30')).toBe('SOON')
  })

  it('identifies items expiring within 30 days as NEAR', () => {
    const item = { expiration_mode: 'ITEM', expiration_date: '2026-10-25' }
    expect(productExpirationStatus(item, '2026-09-30')).toBe('NEAR')
  })

  it('handles batch expiration correctly prioritizing worst status', () => {
    const p1 = {
      expiration_mode: 'BATCH',
      batches: [
        { expiration_date: '2099-01-01', quantity: 10 },
        { expiration_date: '2026-09-01', quantity: 2 }
      ]
    }
    expect(productExpirationStatus(p1, '2026-09-30')).toBe('EXPIRED')

    const p2 = {
      expiration_mode: 'BATCH',
      batches: [
        { expiration_date: '2099-01-01', quantity: 10 },
        { expiration_date: '2026-10-04', quantity: 5 }
      ]
    }
    expect(productExpirationStatus(p2, '2026-09-30')).toBe('SOON')
  })

  it('ignores zero-quantity batches', () => {
    const p = {
      expiration_mode: 'BATCH',
      batches: [
        { expiration_date: '2099-01-01', quantity: 10 },
        { expiration_date: '2026-09-01', quantity: 0 } // depleted
      ]
    }
    expect(productExpirationStatus(p, '2026-09-30')).toBe('OK')
  })

  it('returns OK for products with no expiration tracking', () => {
    expect(productExpirationStatus({ expiration_mode: 'NONE' }, '2026-09-30')).toBe('OK')
    expect(productExpirationStatus({}, '2026-09-30')).toBe('OK')
  })
})
