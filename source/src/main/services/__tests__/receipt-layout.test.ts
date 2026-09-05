import { describe, expect, it } from 'vitest'
import type { Sale } from '../../../shared/types'
import { receiptBodyHtml, receiptCss, receiptHtml } from '@shared/receiptHtml'
import { buildReceiptLines } from '../checkout'

const store = { header: 'CUSTOM HEADER', store_name: 'QA Store', owner_name: 'Owner', address: 'Test Address', phone: '000', tin: '123', currency: 'PHP', footer: 'CUSTOM FOOTER' }

const longItem = 'QA LONG PRODUCT NAME FOR 58MM WRAPPING THAT MUST WRAP CLEANLY WITHOUT CLIPPING'
const cashSale = {
  id: 1,
  transaction_no: 'TPOS-000001',
  created_at: '2026-09-05 10:30:00',
  cashier_name: 'QA Cashier',
  customer_name: null,
  subtotal_c: 12000,
  discount_c: 1000,
  total_c: 11000,
  items: [
    { id: 1, product_name: longItem, qty: 2, unit_price_c: 6000, subtotal_c: 12000, unit_name: 'pc' },
    { id: 2, product_name: 'Milo Sachet', qty: 1, unit_price_c: 1200, subtotal_c: 1200, unit_name: 'pc' }
  ] as Sale['items'],
  payments: [{ id: 1, method: 'CASH', amount_c: 15000, reference: null }]
} as Sale

const gcashSale = {
  ...cashSale,
  transaction_no: 'TPOS-000002',
  customer_name: 'Juan Customer',
  payments: [{ id: 1, method: 'GCASH', amount_c: 11000, reference: 'REF-98765' }]
} as Sale

const utangSale = {
  ...cashSale,
  transaction_no: 'TPOS-000003',
  customer_name: 'Aling Nena',
  payments: [{ id: 1, method: 'UTANG', amount_c: 11000, reference: null }]
} as Sale

describe('thermal receipt HTML layout', () => {
  it('is pure black-on-white with safe zero page margins and no backgrounds', () => {
    const css = receiptCss('80mm')
    expect(css).toContain('background: white')
    expect(css).toContain('color: black')
    expect(css).toContain('@page { size: 80mm auto; margin: 0; }')
    expect(css).not.toContain('gradient')
    expect(receiptCss('58mm')).toContain('@page { size: 58mm auto; margin: 0; }')
  })

  it('optimizes 80mm for ~72mm and 58mm for ~48mm printable content', () => {
    expect(receiptCss('80mm')).toContain('.tp-sheet { width: 72mm')
    expect(receiptCss('58mm')).toContain('.tp-sheet { width: 48mm')
    expect(receiptCss('58mm')).toContain('font-size: 9.5px')
    expect(receiptCss('80mm')).toContain('font-size: 11.5px')
  })

  it('renders header/footer, wrapped long names, totals, and a prominent SUKLI', () => {
    const lines = buildReceiptLines(store, cashSale)
    const html = receiptBodyHtml(lines, '80mm', 'PHP')
    expect(html).toContain('CUSTOM HEADER')
    expect(html).toContain('CUSTOM FOOTER')
    expect(html).toContain(longItem)
    expect(receiptCss('80mm')).toContain('overflow-wrap: anywhere')
    expect(html).toContain('tp-total')
    expect(html).toContain('₱110.00')
    expect(html).toContain('tp-sukli')
    expect(html).toContain('₱40.00')
    expect(html).toContain('2 x 60.00')
  })

  it('keeps electronic payment reference and utang customer details', () => {
    const gcashHtml = receiptBodyHtml(buildReceiptLines(store, gcashSale), '80mm')
    expect(gcashHtml).toContain('GCASH')
    expect(gcashHtml).toContain('REF-98765')
    expect(gcashHtml).toContain('Juan Customer')
    const utangHtml = receiptBodyHtml(buildReceiptLines(store, utangSale), '80mm')
    expect(utangHtml).toContain('UTANG')
    expect(utangHtml).toContain('Aling Nena')
  })

  it('keeps the same body structure but distinct per-width CSS for 58mm and 80mm', () => {
    const lines = buildReceiptLines(store, cashSale)
    const eighty = receiptBodyHtml(lines, '80mm')
    const fiftyEight = receiptBodyHtml(lines, '58mm')
    expect(fiftyEight).toContain('tp-sukli')
    // Markup stays identical; width/typography differences live in the CSS.
    expect(fiftyEight).toBe(eighty)
    expect(receiptCss('58mm')).not.toBe(receiptCss('80mm'))
    expect(receiptCss('58mm')).toContain('width: 48mm')
    expect(receiptCss('80mm')).toContain('width: 72mm')
  })

  it('escapes custom header/footer user text before rendering', () => {
    const html = receiptHtml(['<script>alert(1)</script>', 'SUKLI         40.00'], '80mm', 'PHP')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>alert')
  })
})
