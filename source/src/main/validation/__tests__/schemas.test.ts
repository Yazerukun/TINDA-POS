import { describe, it, expect } from 'vitest'
import { validateSetup } from '../schemas'

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
