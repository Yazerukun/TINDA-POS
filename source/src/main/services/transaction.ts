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
      const discountRatio = (sale.subtotal_c > 0 && sale.total_c < sale.subtotal_c)
        ? (sale.total_c / sale.subtotal_c)
        : 1
      const effectiveLineSubtotal = Math.round(saleItem.subtotal_c * discountRatio)
      const amountC = Math.round((it.qty_base / saleItem.qty_base) * effectiveLineSubtotal)
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
    const voidedSale = getSale(db, sale.id)

    // Sync voided status to Cloud Owner Dashboard asynchronously
    try {
      const { pushSaleToCloud, pushShiftToCloud } = require('./cloudSync')
      const payments = (voidedSale as any).payments || []
      const getAmt = (m: string): number =>
        payments.filter((p: any) => p.method === m).reduce((sum: number, p: any) => sum + (p.amount_c || 0), 0)

      pushSaleToCloud(db, {
        local_sale_id: voidedSale.id,
        transaction_no: voidedSale.transaction_no,
        cashier_name: user.full_name || user.username,
        customer_name: (voidedSale as any).customer_name || null,
        subtotal_c: voidedSale.subtotal_c,
        discount_c: voidedSale.discount_c,
        total_c: voidedSale.total_c,
        status: voidedSale.status, // 'VOIDED'
        cash_c: getAmt('CASH'),
        gcash_c: getAmt('GCASH'),
        maya_c: getAmt('MAYA'),
        utang_c: getAmt('UTANG'),
        net_sales_c: 0,
        local_shift_id: voidedSale.shift_id,
        sold_at: voidedSale.created_at,
        items: ((voidedSale as any).items || []).map((it: any) => ({
          product_name: it.product_name || it.name || 'Item',
          unit_name: it.unit_name || 'pc',
          qty: it.qty,
          unit_price_c: it.unit_price_c,
          subtotal_c: it.subtotal_c
        }))
      }).catch(() => {})

      if (voidedSale.shift_id) {
        const { calculateRead } = require('./readReports')
        const snap = calculateRead(db, voidedSale.shift_id, 'X')
        pushShiftToCloud(db, {
          local_shift_id: voidedSale.shift_id,
          cashier_name: snap.cashier_name || 'Cashier',
          shift_date: (snap.opened_at || new Date().toISOString()).slice(0, 10),
          opened_at: snap.opened_at || '',
          closed_at: snap.closed_at || '',
          gross_sales_c: snap.gross_sales_c || 0,
          cash_c: snap.cash_c || 0,
          gcash_c: snap.gcash_c || 0,
          maya_c: snap.maya_c || 0,
          utang_c: snap.utang_c || 0,
          refund_total_c: snap.refunds_c || 0,
          void_count: snap.void_count || 0,
          transaction_count: snap.transaction_count || 0,
          expenses_c: snap.expenses_c || 0,
          net_sales_c: Math.max(0, (snap.net_sales_c || 0) - (snap.utang_c || 0))
        }).catch(() => {})
      }
    } catch {}

    return voidedSale
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

    // 2. Reverse customer utang ledger if applicable (only if not already voided, as voiding already reversed the credit)
    if (sale.status !== 'VOIDED' && sale.customer_id && sale.payments.some((p) => p.method === 'UTANG')) {
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

    // Sync deleted sale to Cloud Owner Dashboard as VOIDED so it is dropped from cloud totals
    try {
      const { pushSaleToCloud } = require('./cloudSync')
      pushSaleToCloud(db, {
        local_sale_id: sale.id,
        transaction_no: sale.transaction_no,
        cashier_name: user.full_name || user.username,
        customer_name: (sale as any).customer_name || null,
        subtotal_c: sale.subtotal_c,
        discount_c: sale.discount_c,
        total_c: sale.total_c,
        status: 'VOIDED',
        cash_c: 0,
        gcash_c: 0,
        maya_c: 0,
        utang_c: 0,
        net_sales_c: 0,
        local_shift_id: sale.shift_id,
        sold_at: sale.created_at,
        items: []
      }).catch(() => {})
    } catch {}

    return { ok: true, transaction_no: sale.transaction_no, product_ids }
  })
  return tx()
}
