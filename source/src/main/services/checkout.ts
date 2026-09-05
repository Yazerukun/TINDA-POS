import { getDb } from '../database/connection'
import type { CartItem, Sale } from '@shared/types'
import type { CheckoutPayload, PaymentInput } from '@shared/ipc'
import * as prodRepo from '../repositories/products'
import * as salesRepo from '../repositories/sales'
import * as shiftRepo from '../repositories/shifts'
import * as custRepo from '../repositories/customers'
import * as auditRepo from '../repositories/audit'
import * as heldRepo from '../repositories/heldSales'
import { requirePermission, requireUser } from './session'
import { getSettings } from '../repositories/settings'
import { randomBytes } from 'node:crypto'

export function validatePaymentTotals(totalC: number, payments: PaymentInput[]): void {
  if (!payments || payments.length === 0) throw new Error('At least one payment method is required.')
  const applied = payments.reduce((s, p) => s + p.amount_c, 0)
  if (applied < totalC) throw new Error('Payment is less than the total due.')
  if (payments.some((p) => p.amount_c <= 0)) throw new Error('Each payment must be greater than zero.')
}

export function buildLines(db: ReturnType<typeof getDb>, items: (CartItem | import('@shared/ipc').CartPayloadItem)[]): { cart: CartItem; cost_c: number }[] {
  if (!items || items.length === 0) throw new Error('Cart is empty.')
  const settings = getSettings(db)
  return items.map((raw) => {
    const it = raw as CartItem
    let costC = it.cost_base_c ?? 0
    let stockBase: number | null = it.stock_base ?? null
    if (it.product_id) {
      const p = prodRepo.getProduct(db, it.product_id)
      costC = p.purchase_cost_c
      stockBase = p.stock
      if (!settings.allow_negative_inventory && it.qty_base > p.stock) {
        throw new Error(`Insufficient stock for "${p.name}". Available: ${p.stock} ${p.base_unit}.`)
      }
    }
    const subtotal = it.subtotal_c ?? Math.round(it.unit_price_c * it.qty)
    const cart: CartItem = { ...it, cost_base_c: costC, stock_base: stockBase, subtotal_c: subtotal }
    return { cart, cost_c: costC }
  })
}

export function buildReceiptLines(store: { header: string; store_name: string; owner_name: string; address: string; phone: string; tin: string; currency: string; footer: string }, sale: Sale): string[] {
  const lines: string[] = []
  if (store.header.trim()) lines.push(...store.header.trim().split(/\r?\n/))
  lines.push('TINDA POS')
  if (store.store_name) lines.push(store.store_name)
  if (store.owner_name) lines.push(`Owner: ${store.owner_name}`)
  if (store.address) lines.push(store.address)
  if (store.phone) lines.push(`Tel: ${store.phone}`)
  if (store.tin) lines.push(`TIN: ${store.tin}`)
  lines.push('--------------------------------')
  lines.push(sale.transaction_no)
  lines.push(new Date(sale.created_at.replace(' ', 'T')).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }))
  lines.push(`Cashier: ${sale.cashier_name}`)
  if (sale.customer_name) lines.push(`Customer: ${sale.customer_name}`)
  lines.push('--------------------------------')
  for (const it of sale.items) {
    lines.push(`${it.product_name}`)
    lines.push(`  ${it.qty} x ${(it.unit_price_c / 100).toFixed(2)}        ${(it.subtotal_c / 100).toFixed(2)}`)
  }
  lines.push('--------------------------------')
  lines.push(`Subtotal      ${(sale.subtotal_c / 100).toFixed(2)}`)
  lines.push(`Discount      ${(sale.discount_c / 100).toFixed(2)}`)
  lines.push(`TOTAL         ${(sale.total_c / 100).toFixed(2)}`)
  const cash = sale.payments.find((p) => p.method === 'CASH')
  if (cash) {
    lines.push(`Cash          ${(cash.amount_c / 100).toFixed(2)}`)
    const paid = sale.payments.reduce((sum, payment) => sum + payment.amount_c, 0)
    lines.push(`SUKLI         ${(Math.max(0, paid - sale.total_c) / 100).toFixed(2)}`)
  }
  for (const p of sale.payments) if (p.method !== 'CASH') {
    lines.push(`${p.method}          ${(p.amount_c / 100).toFixed(2)}`)
    if (p.reference) lines.push(`Reference: ${p.reference}`)
  }
  lines.push('--------------------------------')
  lines.push(store.footer || 'Salamat po!')
  return lines
}

export function checkout(payload: CheckoutPayload): { sale: Sale; receipt: string[] } {
  const db = getDb()
  const saleId = db.transaction(() => {
    const u = requireUser()
    requirePermission('pos:checkout')
    const lines = buildLines(db, payload.items)
    const subtotal = lines.reduce((s, l) => s + l.cart.subtotal_c, 0)
    if (payload.discount_c < 0) throw new Error('Discount cannot be negative.')
    if (payload.discount_c > subtotal) throw new Error('Discount exceeds subtotal.')
    const total = subtotal - payload.discount_c
    validatePaymentTotals(total, payload.payments)

    const utangPayment = payload.payments.find((p) => p.method === 'UTANG')
    if (utangPayment && !payload.customer_id) throw new Error('A customer is required for utang.')
    if (utangPayment && payload.customer_id) {
      const customer = custRepo.getCustomer(db, payload.customer_id)
      if (!customer.is_active) throw new Error('Customer is inactive.')
      const balanceAfter = customer.balance_c + utangPayment.amount_c
      if (customer.credit_limit_c > 0 && balanceAfter > customer.credit_limit_c) {
        throw new Error(`Credit limit exceeded. New balance would be ₱${(balanceAfter / 100).toFixed(2)} over the ₱${(customer.credit_limit_c / 100).toFixed(2)} limit.`)
      }
    }

    const shift = shiftRepo.currentShiftFor(db, u.id)
    const txnNo = salesRepo.nextTransactionNo(db)
    const saleId = salesRepo.createSaleRecord(db, {
      transaction_no: txnNo,
      user_id: u.id,
      customer_id: payload.customer_id ?? null,
      subtotal_c: subtotal,
      discount_c: payload.discount_c,
      total_c: total,
      shift_id: shift ? shift.id : null,
      notes: payload.notes ?? null
    })

    for (const l of lines) {
      const it = l.cart
      if (it.product_id) {
        prodRepo.adjustStock(db, it.product_id, -it.qty_base, 'SALE', `${it.name} (${it.qty} ${it.unit_name})`, u.id, txnNo)
      }
      salesRepo.insertSaleItem(db, {
        sale_id: saleId,
        product_id: it.product_id,
        product_name: it.name,
        unit_name: it.unit_name,
        qty: it.qty,
        qty_base: it.qty_base,
        unit_price_c: it.unit_price_c,
        subtotal_c: it.subtotal_c,
        cost_base_c: it.cost_base_c ?? 0
      })
    }

    for (const p of payload.payments) {
      salesRepo.insertPayment(db, saleId, p.method, p.amount_c, p.method === 'CASH' ? null : p.reference || null)
      if (p.method === 'UTANG' && payload.customer_id) {
        custRepo.applyCreditEntry(db, {
          customer_id: payload.customer_id,
          entry_type: 'CREDIT_SALE',
          amount_c: p.amount_c,
          reference_type: 'SALE',
          reference_id: saleId,
          notes: `Utang for ${txnNo}`,
          user_id: u.id
        })
      }
    }

    auditRepo.audit(db, { action: 'CHECKOUT', user_id: u.id, entity_type: 'SALE', entity_id: saleId, new_value: String(total) })
    return saleId
  })()

  const sale = salesRepo.getSale(db, saleId)
  const settings = getSettings(db)
  const receipt = buildReceiptLines(
    { header: settings.receipt_header, store_name: settings.store_name, owner_name: settings.owner_name, address: settings.address, phone: settings.phone, tin: settings.tin, currency: settings.currency, footer: settings.receipt_footer },
    sale
  )
  return { sale, receipt }
}

export function holdSale(payload: CheckoutPayload): import('@shared/types').HeldSale {
  const db = getDb()
  const u = requireUser()
  requirePermission('pos:hold-sale')
  const lines = buildLines(db, payload.items)
  const subtotal = lines.reduce((s, l) => s + l.cart.subtotal_c, 0)
  const discount = payload.discount_c || 0
  if (discount > subtotal) throw new Error('Discount exceeds subtotal.')
  const total = subtotal - discount
  const token = randomBytes(4).toString('hex').toUpperCase()
  const items = lines.map((l) => l.cart)
  const stmtInsert = db.prepare(
    `INSERT INTO held_sales (token, subtotal_c, discount_c, total_c, user_id) VALUES (?, ?, ?, ?, ?)`
  )
  const stmtItem = db.prepare(
    `INSERT INTO held_sale_items (held_sale_id, product_id, name, unit_name, qty, qty_base, unit_price_c, subtotal_c, cost_base_c)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const heldId = db.transaction(() => {
    const id = Number(stmtInsert.run(token, subtotal, discount, total, u.id).lastInsertRowid)
    for (const it of items) {
      stmtItem.run(id, it.product_id, it.name, it.unit_name, it.qty, it.qty_base, it.unit_price_c, it.subtotal_c, it.cost_base_c ?? 0)
    }
    return id
  })()
  return heldRepo.getHeldSale(db, heldId)
}

export function reprint(saleId: number): string[] {
  const db = getDb()
  const sale = salesRepo.getSale(db, saleId)
  const settings = getSettings(db)
  return buildReceiptLines(
    { header: settings.receipt_header, store_name: settings.store_name, owner_name: settings.owner_name, address: settings.address, phone: settings.phone, tin: settings.tin, currency: settings.currency, footer: settings.receipt_footer },
    sale
  )
}
