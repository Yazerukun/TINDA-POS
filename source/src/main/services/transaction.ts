import { getDb } from '../database/connection'
import { getSale, markVoided, updateSaleStatus, addRefundedQty } from '../repositories/sales'
import { adjustStock } from '../repositories/products'
import { createRefund } from '../repositories/refunds'
import { applyCreditEntry } from '../repositories/customers'
import { currentShiftFor } from '../repositories/shifts'
import { audit } from '../repositories/audit'
import { requirePermission, requireUser } from './session'
import { updateShiftTotals } from '../repositories/shifts'
import type { RefundPayload, VoidPayload } from '@shared/ipc'

export function processRefund(payload: RefundPayload): import('@shared/types').Refund {
  const db = getDb()
  const tx = db.transaction(() => {
    const user = requireUser()
    requirePermission('pos:refund')
    const sale = getSale(db, payload.sale_id)
    if (sale.status === 'VOIDED') throw new Error('Cannot refund a voided sale.')
    if (sale.status === 'REFUNDED') throw new Error('This sale is already fully refunded.')

    if (!payload.reason?.trim()) throw new Error('Refund reason is required.')
    if (!payload.items?.length) throw new Error('Select at least one item to refund.')

    let totalC = 0
    const refundItems = payload.items.map((it) => {
      const saleItem = sale.items.find((si) => si.id === it.sale_item_id)
      if (!saleItem) throw new Error('Invalid sale item.')
      const available = saleItem.qty_base - saleItem.refunded_qty_base
      if (it.qty_base <= 0 || it.qty_base > available)
        throw new Error(`Cannot refund ${it.qty_base}. Only ${available} available.`)
      const qty = Math.ceil(it.qty_base / (saleItem.unit_price_c === 0 ? 1 : 1)) // qty units derived if needed
      const amountC = Math.round((it.qty_base / saleItem.qty_base) * saleItem.subtotal_c)
      totalC += amountC
      return { ...it, amount_c: amountC, qty }
    })

    const refund = createRefund(db, {
      sale_id: payload.sale_id,
      user_id: user.id,
      reason: payload.reason.trim(),
      total_c: totalC,
      items: refundItems.map((it) => ({
        sale_item_id: it.sale_item_id,
        product_id: it.product_id,
        qty: it.qty,
        qty_base: it.qty_base,
        unit_name: it.unit_name,
        amount_c: it.amount_c
      }))
    })

    for (const it of refundItems) {
      addRefundedQty(db, it.sale_item_id, it.qty_base)
      if (it.product_id) {
        adjustStock(db, it.product_id, it.qty_base, 'REFUND', `Refund ${refund.refund_no}: ${payload.reason}`, user.id, refund.refund_no)
      }
    }

    const allRefunded = sale.items.every((si) => si.qty_base <= si.refunded_qty_base)
    if (allRefunded) updateSaleStatus(db, sale.id, 'REFUNDED')
    else updateSaleStatus(db, sale.id, 'PARTIALLY_REFUNDED')

    if (sale.customer_id && sale.payments.some((p) => p.method === 'UTANG')) {
      applyCreditEntry(db, {
        customer_id: sale.customer_id,
        entry_type: 'REFUND',
        amount_c: totalC,
        reference_type: 'REFUND',
        reference_id: refund.id,
        notes: `Refund ${refund.refund_no}`,
        user_id: user.id
      })
    }

    if (sale.shift_id) updateShiftTotals(db, sale.shift_id)
    audit(db, { action: 'REFUND', user_id: user.id, entity_type: 'REFUND', entity_id: refund.id, new_value: String(totalC), reason: payload.reason })
    return refund
  })
  return tx()
}

export function processVoid(payload: VoidPayload): import('@shared/types').Sale {
  const db = getDb()
  const tx = db.transaction(() => {
    const user = requireUser()
    requirePermission('pos:void')
    const sale = getSale(db, payload.sale_id)
    if (sale.status !== 'COMPLETED') throw new Error('Only COMPLETED sales can be voided.')
    if (!payload.reason?.trim()) throw new Error('Void reason is required.')

    const shift = currentShiftFor(db, user.id)
    if (shift && sale.shift_id !== shift.id) {
      const hasManager = user.roles.includes('MANAGER') || user.roles.includes('ADMIN')
      if (!hasManager) throw new Error('You cannot void sales from a different shift unless authorized.')
    }

    markVoided(db, sale.id, user.id, payload.reason.trim())

    for (const it of sale.items) {
      if (it.product_id) {
        adjustStock(
          db,
          it.product_id,
          it.qty_base,
          'RETURN',
          `Void ${sale.transaction_no}: ${payload.reason}`,
          user.id,
          sale.transaction_no
        )
      }
    }

    if (sale.customer_id && sale.payments.some((p) => p.method === 'UTANG')) {
      const utangAmt = sale.payments.filter((p) => p.method === 'UTANG').reduce((s, p) => s + p.amount_c, 0)
      if (utangAmt > 0) {
        applyCreditEntry(db, {
          customer_id: sale.customer_id,
          entry_type: 'REVERSAL',
          amount_c: utangAmt,
          reference_type: 'SALE',
          reference_id: sale.id,
          notes: `Voided ${sale.transaction_no}: ${payload.reason}`,
          user_id: user.id
        })
      }
    }

    if (sale.shift_id) updateShiftTotals(db, sale.shift_id)
    audit(db, { action: 'VOID_SALE', user_id: user.id, entity_type: 'SALE', entity_id: sale.id, reason: payload.reason })
    return getSale(db, sale.id)
  })
  return tx()
}