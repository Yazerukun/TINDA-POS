import { getDb } from '../database/connection'
import { getSale, markVoided, updateSaleStatus, addRefundedQty } from '../repositories/sales'
import { adjustStock, getProduct } from '../repositories/products'
import { getSettings } from '../repositories/settings'
import { createRefund } from '../repositories/refunds'
import { applyCreditEntry, getCustomer } from '../repositories/customers'
import { currentShiftFor, updateShiftTotals } from '../repositories/shifts'
import { audit } from '../repositories/audit'
import { requirePermission, requireUser } from './session'
import { formatReceiptDate } from '../../shared/receiptHtml'
import type { ExchangeItemPayload, ExchangeResult, RefundPayload, VoidPayload } from '@shared/ipc'

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

export function processItemExchange(payload: ExchangeItemPayload): ExchangeResult {
  const db = getDb()
  const tx = db.transaction(() => {
    const user = requireUser()
    requirePermission('pos:refund')

    // 1. Validate payload basics
    const saleId = payload.sale_id
    const saleItemId = payload.sale_item_id ?? (payload as any).returned_item?.sale_item_id
    const returnedQty = payload.returned_qty ?? (payload as any).returned_item?.qty_base ?? (payload as any).returned_item?.qty
    const replacementProductId = payload.replacement_product_id ?? (payload as any).replacement_item?.product_id
    const replacementQty = payload.replacement_qty ?? (payload as any).replacement_item?.qty
    const reason = (payload.reason ?? (payload as any).reason ?? '').trim()

    if (!saleId) throw new Error('Sale ID is required.')
    if (!saleItemId) throw new Error('Sale item ID is required.')
    if (!replacementProductId) throw new Error('Replacement product ID is required.')
    if (!reason) throw new Error('Exchange reason is required.')
    if (!Number.isFinite(returnedQty) || returnedQty <= 0) {
      throw new Error('Returned quantity must be greater than zero.')
    }
    if (!Number.isFinite(replacementQty) || replacementQty <= 0) {
      throw new Error('Replacement quantity must be greater than zero.')
    }

    // 2. Validate sale exists and is not VOIDED or fully REFUNDED
    const sale = getSale(db, saleId)
    if (!sale) throw new Error('Sale not found.')
    if (sale.status === 'VOIDED') throw new Error('Cannot exchange items from a voided sale.')
    if (sale.status === 'REFUNDED') throw new Error('This sale is already fully refunded.')

    // 3. Validate sale_item exists, belongs to sale, and returned_qty <= available (qty_base - refunded_qty_base)
    const saleItem = sale.items.find((si) => si.id === saleItemId)
    if (!saleItem) throw new Error('Sale item does not belong to this sale.')
    const available = saleItem.qty_base - saleItem.refunded_qty_base
    if (returnedQty > available) {
      throw new Error(`Cannot return ${returnedQty}. Only ${available} available.`)
    }

    // 4. Validate replacement product exists, check allow_negative_inventory if stock < replacement_qty
    const replacementProduct = getProduct(db, replacementProductId)
    if (!replacementProduct) throw new Error('Replacement product not found.')
    const settings = getSettings(db)
    if (!settings.allow_negative_inventory && replacementProduct.stock < replacementQty) {
      throw new Error(`Insufficient stock for "${replacementProduct.name}". Available: ${replacementProduct.stock} ${replacementProduct.base_unit}.`)
    }

    // 5. Compute proportional credit for returned item using discountRatio = sale.total_c / sale.subtotal_c
    const discountRatio = (sale.subtotal_c > 0 && sale.total_c < sale.subtotal_c)
      ? (sale.total_c / sale.subtotal_c)
      : (sale.subtotal_c > 0 ? (sale.total_c / sale.subtotal_c) : 1)
    const effectiveLineSubtotal = Math.round(saleItem.subtotal_c * discountRatio)
    const returnedCreditC = Math.round((returnedQty / saleItem.qty_base) * effectiveLineSubtotal)

    // 6. Compute replacement price total (replacementProduct.retail_price_c * replacement_qty)
    const replacementUnitPriceC = (replacementProduct as any).retail_price_c ?? replacementProduct.default_price_c ?? (replacementProduct.units?.[0]?.selling_price_c ?? 0)
    const replacementTotalC = Math.round(replacementUnitPriceC * replacementQty)
    const replacementUnitName = replacementProduct.base_unit || replacementProduct.units?.[0]?.name || 'pc'

    // 7. Calculate difference_c = replacementTotalC - returnedCreditC
    // positive = customer pays abono, negative = customer change/sukli, 0 = even
    const differenceC = replacementTotalC - returnedCreditC

    // 8. Calculate change_c and validate cash_tendered_c if difference_c > 0
    let changeC = 0
    const cashTenderedC = payload.cash_tendered_c ?? (payload as any).cash_tendered_c ?? 0
    if (differenceC > 0) {
      if (cashTenderedC < differenceC) {
        throw new Error(`Cash tendered is less than additional balance due (tendered: ₱${(cashTenderedC / 100).toFixed(2)}, due: ₱${(differenceC / 100).toFixed(2)}).`)
      }
      changeC = cashTenderedC - differenceC
    } else if (differenceC < 0) {
      changeC = Math.abs(differenceC)
    } else {
      changeC = 0
    }

    // 9. Restock returned product with adjustStock(..., returned_qty, 'RETURN', ...)
    if (saleItem.product_id) {
      adjustStock(
        db,
        saleItem.product_id,
        returnedQty,
        'RETURN',
        `Exchange: Returned item from sale ${sale.transaction_no} - ${reason}`,
        user.id,
        sale.transaction_no,
        { return_reference: sale.transaction_no, sale_item_id: saleItem.id }
      )
    }

    // 10. Add refunded quantity to sale item with addRefundedQty(db, saleItem.id, payload.returned_qty)
    addRefundedQty(db, saleItem.id, returnedQty)

    // 11. Deduct replacement product with adjustStock(..., -replacement_qty, 'SALE', ...)
    adjustStock(
      db,
      replacementProduct.id,
      -replacementQty,
      'SALE',
      `Exchange: Replacement item for sale ${sale.transaction_no} - ${reason}`,
      user.id,
      sale.transaction_no
    )

    // 12. Create refund record in refunds table with createRefund for audit & financial trail
    const refund = createRefund(db, {
      sale_id: sale.id,
      user_id: user.id,
      reason: `Exchange: ${reason}`,
      total_c: returnedCreditC,
      items: [
        {
          sale_item_id: saleItem.id,
          product_id: saleItem.product_id ?? 0,
          qty: returnedQty,
          qty_base: returnedQty,
          unit_name: saleItem.unit_name,
          amount_c: returnedCreditC
        }
      ]
    })

    // 13. Update sale status to PARTIALLY_REFUNDED (or REFUNDED if all items refunded)
    const updatedSale = getSale(db, sale.id)
    const allRefunded = updatedSale.items.every((si) => si.qty_base <= si.refunded_qty_base)
    if (allRefunded) {
      updateSaleStatus(db, sale.id, 'REFUNDED')
    } else {
      updateSaleStatus(db, sale.id, 'PARTIALLY_REFUNDED')
    }

    // 14. If shift exists, update shift totals
    if (sale.shift_id) {
      updateShiftTotals(db, sale.shift_id)
    }
    const currentShift = currentShiftFor(db, user.id)
    if (currentShift && currentShift.id !== sale.shift_id) {
      updateShiftTotals(db, currentShift.id)
    }

    // 15. Log audit action 'EXCHANGE_ITEM'
    audit(db, {
      action: 'EXCHANGE_ITEM',
      user_id: user.id,
      entity_type: 'SALE',
      entity_id: sale.id,
      reason: reason,
      new_value: `Exchange sale #${sale.id}: returned item #${saleItem.id} (${returnedQty} ${saleItem.unit_name}), replacement #${replacementProduct.id} (${replacementQty} ${replacementUnitName}), diff: ${differenceC}c, refund: ${refund.refund_no}`
    })

    // 16. Build thermal receipt lines for 'ITEM EXCHANGE RECEIPT'
    const receiptLines: string[] = []
    if (settings.receipt_header?.trim()) receiptLines.push(...settings.receipt_header.trim().split(/\r?\n/))
    if (settings.store_name) receiptLines.push(settings.store_name)
    if (settings.address) receiptLines.push(settings.address)
    if (settings.phone) receiptLines.push(`Tel: ${settings.phone}`)
    receiptLines.push('--------------------------------')
    receiptLines.push('ITEM EXCHANGE RECEIPT')
    receiptLines.push(`Sale Ref: ${sale.transaction_no}`)
    receiptLines.push(`Date: ${formatReceiptDate(new Date())}`)
    receiptLines.push(`Cashier: ${user.full_name || user.username}`)
    if (sale.customer_name) receiptLines.push(`Customer: ${sale.customer_name}`)
    receiptLines.push('--------------------------------')
    receiptLines.push('RETURNED ITEM:')
    receiptLines.push(`${saleItem.product_name}`)
    const retQtyStr = returnedQty % 1 === 0 ? String(returnedQty) : Number(returnedQty.toFixed(3)).toString()
    receiptLines.push(`  ${retQtyStr} ${saleItem.unit_name} (Credit: ${(returnedCreditC / 100).toFixed(2)})`)
    receiptLines.push('--------------------------------')
    receiptLines.push('REPLACEMENT ITEM:')
    receiptLines.push(`${replacementProduct.name}`)
    const repQtyStr = replacementQty % 1 === 0 ? String(replacementQty) : Number(replacementQty.toFixed(3)).toString()
    receiptLines.push(`  ${repQtyStr} ${replacementUnitName} @ ${(replacementUnitPriceC / 100).toFixed(2)}    ${(replacementTotalC / 100).toFixed(2)}`)
    receiptLines.push('================================')
    receiptLines.push(`Replacement Total   ${(replacementTotalC / 100).toFixed(2)}`)
    receiptLines.push(`Returned Credit    -${(returnedCreditC / 100).toFixed(2)}`)
    receiptLines.push('--------------------------------')
    if (differenceC > 0) {
      receiptLines.push(`AMOUNT DUE          ${(differenceC / 100).toFixed(2)}`)
      receiptLines.push(`Cash Tendered       ${(cashTenderedC / 100).toFixed(2)}`)
      receiptLines.push(`SUKLI               ${(changeC / 100).toFixed(2)}`)
    } else if (differenceC < 0) {
      receiptLines.push(`SUKLI               ${(changeC / 100).toFixed(2)}`)
    } else {
      receiptLines.push(`EVEN EXCHANGE       0.00`)
    }
    receiptLines.push('--------------------------------')
    receiptLines.push(`Reason: ${reason}`)
    if (settings.receipt_footer?.trim()) receiptLines.push(settings.receipt_footer.trim())
    receiptLines.push('--------------------------------')

    const result: ExchangeResult = {
      ok: true,
      sale_id: sale.id,
      returned_item: {
        sale_item_id: saleItem.id,
        product_id: saleItem.product_id ?? 0,
        product_name: saleItem.product_name,
        qty: returnedQty,
        unit_name: saleItem.unit_name,
        credit_c: returnedCreditC
      },
      replacement_item: {
        product_id: replacementProduct.id,
        product_name: replacementProduct.name,
        qty: replacementQty,
        unit_name: replacementUnitName,
        unit_price_c: replacementUnitPriceC,
        total_c: replacementTotalC
      },
      difference_c: differenceC,
      cash_tendered_c: cashTenderedC,
      change_c: changeC,
      receipt_lines: receiptLines
    }

    return result
  })
  return tx()
}
