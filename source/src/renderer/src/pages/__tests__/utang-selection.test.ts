import { beforeEach, describe, expect, it } from 'vitest'
import { usePosCart } from '../POS'

beforeEach(() => usePosCart.getState().clear())
describe('Existing Utang customer selection', () => {
  it('keeps the selected customer ID and display name together', () => {
    usePosCart.getState().setCustomer(12, 'Maria Santos')
    expect(usePosCart.getState()).toMatchObject({ customer_id: 12, customer_name: 'Maria Santos' })
    usePosCart.getState().setCustomer(19, 'Juan Cruz')
    expect(usePosCart.getState()).toMatchObject({ customer_id: 19, customer_name: 'Juan Cruz' })
  })
  it('clears the name and ID for Walk-in', () => {
    usePosCart.getState().setCustomer(12, 'Maria')
    usePosCart.getState().setCustomer(null)
    expect(usePosCart.getState()).toMatchObject({ customer_id: null, customer_name: null })
  })
  it.each(['clear', 'replace'] as const)('does not carry a previous borrower through %s', (action) => {
    usePosCart.getState().setCustomer(12, 'Maria')
    if (action === 'clear') usePosCart.getState().clear()
    else usePosCart.getState().replace([], 0)
    expect(usePosCart.getState()).toMatchObject({ customer_id: null, customer_name: null })
  })
})
