import { describe, it, expect } from 'vitest'
import { validateSetup, validateCheckout } from '../schemas'

const validPayload = {
  store: { store_name: 'Aling Nena', owner_name: 'Nena', address: 'Palengke', phone: '0917' },
  admin: { username: 'admin', password: 'secret', pin: '1234', full_name: 'Manager' },
  receipt: { header: 'HN', footer: 'Salamat' },
  data_dir: '/tmp/x',
  load_demo: true
}

describe('validateSetup', () => {
  it.each([undefined, null, 42, 'string', true])('throws a clear error when payload is %p (not an object)', (input) => {
    expect(() => validateSetup(input)).toThrow(/Setup payload was not received/)
  })

  it('throws a clear error when store data is missing', () => {
    const { store: _store, ...rest } = validPayload
    expect(() => validateSetup(rest)).toThrow(/Store setup data was not received/)
  })

  it('throws a clear error when admin data is missing', () => {
    const { admin: _admin, ...rest } = validPayload
    expect(() => validateSetup(rest)).toThrow(/Admin account data was not received/)
  })

  it('throws a clear error when receipt data is missing', () => {
    const { receipt: _receipt, ...rest } = validPayload
    expect(() => validateSetup(rest)).toThrow(/Receipt settings data was not received/)
  })

  it('throws "Store name is required" when store_name is blank', () => {
    expect(() =>
      validateSetup({ ...validPayload, store: { ...validPayload.store, store_name: '   ' } })
    ).toThrow(/Store name is required/)
  })

  it('returns a normalized payload for valid input with defaulted fields', () => {
    const out = validateSetup(validPayload)
    expect(out.store.store_name).toBe('Aling Nena')
    expect(out.admin.username).toBe('admin')
    expect(out.load_demo).toBe(true)
    expect(out.receipt.footer).toBe('Salamat')
    expect(out.receipt.header).toBe('HN')
  })
})

describe('validateCheckout', () => {
  const sampleCartItem = {
    product_id: 1,
    name: 'Rice',
    unit_name: 'kg',
    qty: 2,
    qty_base: 2,
    unit_price_c: 5000,
    cost_base_c: 4000,
    stock_base: 10,
    subtotal_c: 10000
  }

  it('accepts MARIBANK as a valid payment method', () => {
    const payload = {
      items: [sampleCartItem],
      discount_c: 0,
      payments: [{ method: 'MARIBANK', amount_c: 10000, reference: 'MB-12345678' }]
    }
    const out = validateCheckout(payload)
    expect(out.payments).toHaveLength(1)
    expect(out.payments[0]!.method).toBe('MARIBANK')
    expect(out.payments[0]!.reference).toBe('MB-12345678')
    expect(out.payments[0]!.amount_c).toBe(10000)
  })

  it('rejects unsupported payment methods', () => {
    const payload = {
      items: [sampleCartItem],
      discount_c: 0,
      payments: [{ method: 'CRYPTO', amount_c: 10000 }]
    }
    expect(() => validateCheckout(payload)).toThrow(/Invalid payment method/)
  })
})
