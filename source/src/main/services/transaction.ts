import { getDb } from '../database/connection'
import { getSale, markVoided, updateSaleStatus, addRefundedQty } from '../repositories/sales'
import { adjustStock } from '../repositories/products'
import { createRefund } from '../repositories/refunds'
import { applyCreditEntry, getCustomer } from '../repositories/customers'
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
    const seen = new Set<number>()
    const refundItems = payload.items.map((it) => {
      if (seen.has(it.sale_item_id)) throw new Error('A sale item may only appear once in a refund.')
      seen.add(it.sale_item_id)
      const saleItem = sale.items.find((si) => si.id === it.sale_item_id)
      if (!saleItem) throw new Error('Invalid sale item.')
      if (it.product_id !== saleItem.product_id) throw new Error('Refund product does not match the sale item.')
      const available = saleItem.qty_base - saleItem.refunded_qty_base
      if (!Number.isFinite(it.qty_base) || it.qty_base <= 0 || it.qty_base > available)
        throw new Error(`Cannot refund ${it.qty_base}. Only ${available} available.`)
      const qty = it.qty_base / (saleItem.unit_price_c === 0 ? 1 : 1) // qty units derived if needed
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
        adjustStock(db, it.product_id, it.qty_base, 'REFUND', `Refund ${refund.refund_no}: ${payload.reason}`, user.id, refund.refund_no, { return_reference: sale.transaction_no, sale_item_id: it.sale_item_id })
      }
    }

    const updatedSale = getSale(db, sale.id)
    const allRefunded = updatedSale.items.every((si) => si.qty_base <= si.refunded_qty_base)
    if (allRefunded) updateSaleStatus(db, sale.id, 'REFUNDED')
    else updateSaleStatus(db, sale.id, 'PARTIALLY_REFUNDED')

    if (sale.customer_id && sale.payments.some((p) => p.method === 'UTANG')) {
      // Only reduce the customer's outstanding balance by the portion they
      // still owe. If the utang was already paid off, the excess is returned
      // from the drawer instead of pushing the ledger below zero.
      const customer = getCustomer(db, sale.customer_id)
      const ledgerAmount = Math.min(totalC, customer.balance_c)
      if (ledgerAmount > 0) {
        applyCreditEntry(db, {
          customer_id: sale.customer_id,
          entry_type: 'REFUND',
          amount_c: ledgerAmount,
          reference_type: 'REFUND',
          reference_id: refund.id,
          notes: `Refund ${refund.refund_no}`,
          user_id: user.id
        })
      }
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
          sale.transaction_no,
          { return_reference: sale.transaction_no, sale_item_id: it.id }
        )
      }
    }

    if (sale.customer_id && sale.payments.some((p) => p.method === 'UTANG')) {
      const utangAmt = sale.payments.filter((p) => p.method === 'UTANG').reduce((s, p) => s + p.amount_c, 0)
      if (utangAmt > 0) {
        // Only reverse the portion of the utang the customer still owes; any
        // already-settled excess must not push the ledger below zero.
        const customer = getCustomer(db, sale.customer_id)
        const ledgerAmount = Math.min(utangAmt, customer.balance_c)
        if (ledgerAmount > 0) {
          applyCreditEntry(db, {
            customer_id: sale.customer_id,
            entry_type: 'REVERSAL',
            amount_c: ledgerAmount,
            reference_type: 'SALE',
            reference_id: sale.id,
            notes: `Voided ${sale.transaction_no}: ${payload.reason}`,
            user_id: user.id
          })
        }
      }
    }

    if (sale.shift_id) updateShiftTotals(db, sale.shift_id)
    audit(db, { action: 'VOID_SALE', user_id: user.id, entity_type: 'SALE', entity_id: sale.id, reason: payload.reason })
    return getSale(db, sale.id)
  })
  return tx()
}

export function deleteTransaction(saleId: number, options?: { restoreStock?: boolean }): { ok: boolean; transaction_no: string; product_ids: number[] } {
  const db = getDb()
  const tx = db.transaction(() => {
    const user = requireUser()
    requirePermission('transactions:delete')
    const sale = getSale(db, saleId)

    // 1. If sale was completed and restoreStock is true (default true), return inventory
    const shouldRestore = options?.restoreStock ?? (sale.status === 'COMPLETED')
    if (shouldRestore && sale.status !== 'VOIDED') {
      for (const it of sale.items) {
        if (it.product_id) {
          adjustStock(
            db,
            it.product_id,
            it.qty_base,
            'RETURN',
            `Delete sale ${sale.transaction_no}`,
            user.id,
            sale.transaction_no,
            { return_reference: sale.transaction_no, sale_item_id: it.id }
          )
        }
      }
    }

    // 2. Reverse customer utang ledger if applicable
    if (sale.customer_id && sale.payments.some((p) => p.method === 'UTANG')) {
      const utangAmt = sale.payments.filter((p) => p.method === 'UTANG').reduce((s, p) => s + p.amount_c, 0)
      if (utangAmt > 0) {
        const customer = getCustomer(db, sale.customer_id)
        const ledgerAmount = Math.min(utangAmt, customer.balance_c)
        if (ledgerAmount > 0) {
          applyCreditEntry(db, {
            customer_id: sale.customer_id,
            entry_type: 'REVERSAL',
            amount_c: ledgerAmount,
            reference_type: 'SALE',
            reference_id: sale.id,
            notes: `Deleted transaction ${sale.transaction_no}`,
            user_id: user.id
          })
        }
      }
    }

    // 3. Remove refunds if any
    const refundRows = db.prepare('SELECT id FROM refunds WHERE sale_id = ?').all(sale.id) as { id: number }[]
    for (const r of refundRows) {
      db.prepare('DELETE FROM refund_items WHERE refund_id = ?').run(r.id)
    }
    db.prepare('DELETE FROM refunds WHERE sale_id = ?').run(sale.id)

    // 4. Remove sale items & payments
    db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(sale.id)
    db.prepare('DELETE FROM payments WHERE sale_id = ?').run(sale.id)

    // 5. Delete sale record
    db.prepare('DELETE FROM sales WHERE id = ?').run(sale.id)

    // 6. Update shift totals
    if (sale.shift_id) updateShiftTotals(db, sale.shift_id)

    // 7. Audit log
    audit(db, {
      action: 'DELETE_SALE',
      user_id: user.id,
      entity_type: 'SALE',
      entity_id: sale.id,
      reason: `Permanently deleted transaction ${sale.transaction_no}`
    })

    const product_ids = sale.items.flatMap((item) => item.product_id ? [item.product_id] : [])

    return { ok: true, transaction_no: sale.transaction_no, product_ids }
  })
  return tx()
}
