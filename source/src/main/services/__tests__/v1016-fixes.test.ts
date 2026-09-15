import { describe, expect, it } from 'vitest'
import { buildReceiptLines } from '../checkout'
import type { Sale } from '@shared/types'

describe('v1.0.16 payment breakdown and receipt alignment', () => {
  it('prints all payments before SUKLI so Cash + GCash coincides with TOTAL', () => {
    const store = {
      header: '',
      store_name: 'QA Sari-Sari Store',
      owner_name: 'Ian',
      address: 'Omarchy',
      phone: '09123456789',
      tin: '',
      currency: 'PHP',
      footer: 'Salamat po!'
    }

    const splitSale = {
      id: 101,
      user_id: 1,
      customer_id: null,
      shift_id: 1,
      notes: null,
      refunded_total_c: 0,
      cash_refunded_c: 0,
      offline_created: false,
      transaction_no: 'TPOS-20260915-0001',
      created_at: '2026-09-15 20:30:00',
      cashier_name: 'Ian Cashier',
      customer_name: null,
      subtotal_c: 10000, // 100.00
      discount_c: 0,
      total_c: 10000,    // 100.00
      status: 'COMPLETED',
      items: [
        { id: 1, product_name: 'Item A', qty: 1, unit_price_c: 10000, subtotal_c: 10000, unit_name: 'pc' }
      ] as Sale['items'],
      payments: [
        { id: 1, sale_id: 101, method: 'CASH', amount_c: 5000, reference: null, created_at: '2026-09-15 20:30:00' },
        { id: 2, sale_id: 101, method: 'GCASH', amount_c: 5000, reference: 'REF-123456', created_at: '2026-09-15 20:30:00' }
      ]
    } as unknown as Sale

    const lines = buildReceiptLines(store, splitSale)
    
    // Ensure TOTAL is printed before payments
    const totalIdx = lines.findIndex((l) => l.startsWith('TOTAL '))
    const cashIdx = lines.findIndex((l) => l.startsWith('Cash '))
    const gcashIdx = lines.findIndex((l) => l.startsWith('GCASH '))
    const sukliIdx = lines.findIndex((l) => l.startsWith('SUKLI '))

    expect(totalIdx).toBeGreaterThan(-1)
    expect(cashIdx).toBeGreaterThan(totalIdx)
    expect(gcashIdx).toBeGreaterThan(totalIdx)
    // Critical fix: SUKLI must come AFTER GCASH, not between Cash and GCash
    expect(sukliIdx).toBeGreaterThan(gcashIdx)
    expect(sukliIdx).toBeGreaterThan(cashIdx)
    expect(lines[sukliIdx]).toBe('SUKLI         0.00')
  })

  it('correctly reports change when cash tendered is larger than remaining split balance', () => {
    const store = {
      header: '',
      store_name: 'QA Store',
      owner_name: '',
      address: '',
      phone: '',
      tin: '',
      currency: 'PHP',
      footer: ''
    }

    const splitSaleWithChange = {
      id: 102,
      transaction_no: 'TPOS-20260915-0002',
      created_at: '2026-09-15 20:35:00',
      cashier_name: 'Ian Cashier',
      customer_name: null,
      subtotal_c: 10000, // 100.00
      discount_c: 0,
      total_c: 10000,    // 100.00
      status: 'COMPLETED',
      items: [
        { id: 1, product_name: 'Item A', qty: 1, unit_price_c: 10000, subtotal_c: 10000, unit_name: 'pc' }
      ] as Sale['items'],
      payments: [
        { id: 1, sale_id: 102, method: 'CASH', amount_c: 10000, reference: null, created_at: '2026-09-15 20:35:00' }, // Handed 100 bill
        { id: 2, sale_id: 102, method: 'GCASH', amount_c: 5000, reference: 'REF-888888', created_at: '2026-09-15 20:35:00' } // and 50 GCash
      ]
    } as unknown as Sale

    const lines = buildReceiptLines(store, splitSaleWithChange)
    const sukliLine = lines.find((l) => l.startsWith('SUKLI'))
    // Total paid = 150.00, total = 100.00, sukli = 50.00
    expect(sukliLine).toBe('SUKLI         50.00')
  })
})
