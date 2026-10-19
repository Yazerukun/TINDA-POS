import { useState, useMemo, useEffect } from 'react'
import {
  RotateCcw,
  Minus,
  Plus,
  AlertCircle,
  CheckCircle2,
  Tag,
  Package,
  Receipt,
  Sparkles,
  Loader2
} from 'lucide-react'
import type { Sale, SaleItem } from '@shared/types'
import { money } from '@shared/format'
import { Modal } from './ui/Modal'
import { toastSuccess, toastError } from '../stores/toast'
import { playScanSuccess } from '../lib/sound'

export interface SingleItemVoidModalProps {
  sale: Sale
  item: SaleItem
  onClose: () => void
  onDone: () => void
}

const REASON_PRESETS = [
  'Wrong Item',
  'Customer Changed Mind',
  'Defective / Expired',
  'Damaged Packaging'
] as const

/**
 * Apple-standard Single-Item Void & Return Modal
 * Provides proportional discount refund calculation, interactive stepper,
 * quick reason chips, and Cupertino dark ink aesthetics.
 */
export function SingleItemVoidModal({
  sale,
  item,
  onClose,
  onDone
}: SingleItemVoidModalProps): React.JSX.Element {
  const maxQty = Math.max(0, item.qty_base - item.refunded_qty_base)
  const [qty, setQty] = useState<number>(() => (maxQty > 0 ? 1 : 0))
  const [reason, setReason] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Ensure qty stays clamped if maxQty changes
  useEffect(() => {
    if (maxQty <= 0) {
      setQty(0)
    } else if (qty > maxQty) {
      setQty(maxQty)
    } else if (qty < 1 && maxQty >= 1) {
      setQty(1)
    }
  }, [maxQty])

  // Proportional discount calculation matching server-side transaction engine
  const discountRatio = useMemo(() => {
    if (sale.subtotal_c > 0 && sale.total_c < sale.subtotal_c) {
      return sale.total_c / sale.subtotal_c
    }
    return 1
  }, [sale.subtotal_c, sale.total_c])

  const isProrated = discountRatio < 0.9999

  // Effective refund amount for the selected quantity
  const refundAmountC = useMemo(() => {
    if (qty <= 0 || item.qty_base <= 0) return 0
    const effectiveLineSubtotal = Math.round(item.subtotal_c * discountRatio)
    return Math.round((qty / item.qty_base) * effectiveLineSubtotal)
  }, [qty, item.qty_base, item.subtotal_c, discountRatio])

  const handleQtyChange = (val: number): void => {
    const clamped = Math.max(1, Math.min(maxQty, Math.floor(val) || 1))
    setQty(clamped)
  }

  const handleSubmit = async (): Promise<void> => {
    if (maxQty <= 0) {
      toastError('Already Refunded', 'This item has already been fully voided or refunded.')
      return
    }
    if (qty <= 0 || qty > maxQty) {
      toastError('Invalid Quantity', `Please select a quantity between 1 and ${maxQty}.`)
      return
    }
    if (!reason.trim()) {
      toastError('Reason Required', 'Please select or enter a reason for voiding this item.')
      return
    }
    if (!item.product_id) {
      toastError('Invalid Product', 'This item cannot be returned because it has no product ID.')
      return
    }

    setSubmitting(true)
    try {
      await window.api.transactions.refund({
        sale_id: sale.id,
        reason: reason.trim(),
        items: [
          {
            sale_item_id: item.id,
            product_id: item.product_id,
            qty_base: qty,
            unit_name: item.unit_name
          }
        ]
      })

      playScanSuccess()
      toastSuccess(
        'Item Voided / Returned',
        `Successfully refunded ${money(refundAmountC)} (${qty} ${item.unit_name}) for ${item.product_name}.`
      )
      onDone()
    } catch (err) {
      toastError('Void / Return Failed', String((err as Error)?.message || err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Single-Item Void & Return"
      maxWidth="max-w-lg"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-ghost px-4 py-2 text-sm text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || maxQty <= 0 || qty <= 0 || !reason.trim()}
            className="btn-primary flex items-center gap-2 px-5 py-2 text-sm font-semibold shadow-lg shadow-rose-950/40 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Confirm Void / Return ({money(refundAmountC)})
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Transaction Context Sub-header */}
        <div className="flex items-center justify-between rounded-xl border border-ink-line bg-ink-950/60 px-3.5 py-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <Receipt className="h-3.5 w-3.5 text-brand-400" />
            <span className="text-slate-300 font-semibold">{sale.transaction_no}</span>
          </div>
          <div className="text-slate-400">
            Cashier: <span className="text-slate-200 font-medium">{sale.cashier_name || 'Staff'}</span>
          </div>
        </div>

        {/* Product Information Card */}
        <div className="rounded-2xl border border-ink-line bg-ink-850 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Package className="h-4 w-4 text-brand-400 shrink-0" />
                <h3 className="text-base font-bold text-white truncate" title={item.product_name}>
                  {item.product_name}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1 rounded bg-ink-700/60 px-2 py-0.5 text-slate-300 font-medium">
                  <Tag className="h-3 w-3 text-brand-400" />
                  {item.unit_name}
                </span>
                <span>Original Price: <strong className="text-slate-200 font-mono">{money(item.unit_price_c)}</strong></span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Line Total</span>
              <span className="font-mono text-sm font-bold text-white">{money(item.subtotal_c)}</span>
            </div>
          </div>

          {/* Quantity Statistics Grid */}
          <div className="grid grid-cols-3 gap-2 border-t border-ink-line/60 pt-3 text-center">
            <div className="rounded-lg bg-ink-900/60 p-2">
              <span className="block text-[10px] uppercase font-bold text-slate-500">Sold Qty</span>
              <span className="font-mono text-sm font-bold text-slate-200">
                {item.qty} <span className="text-xs font-normal text-slate-400">{item.unit_name}</span>
              </span>
            </div>
            <div className="rounded-lg bg-ink-900/60 p-2">
              <span className="block text-[10px] uppercase font-bold text-amber-400/80">Already Voided</span>
              <span className="font-mono text-sm font-bold text-amber-400">
                {item.refunded_qty_base} <span className="text-xs font-normal text-amber-400/70">{item.unit_name}</span>
              </span>
            </div>
            <div className="rounded-lg bg-ink-900/60 p-2 border border-brand-500/20">
              <span className="block text-[10px] uppercase font-bold text-brand-400">Available</span>
              <span className="font-mono text-sm font-extrabold text-white">
                {maxQty} <span className="text-xs font-normal text-slate-300">{item.unit_name}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Warning if already fully refunded */}
        {maxQty <= 0 ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-bold">Item Already Fully Refunded</p>
              <p className="text-amber-300/80 mt-0.5">
                All purchased units for this line item have already been refunded or voided.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Quantity Selector Section */}
            <div className="rounded-2xl border border-ink-line bg-ink-850 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Quantity to Void / Return
                </label>
                <button
                  type="button"
                  onClick={() => handleQtyChange(maxQty)}
                  className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold text-brand-400 hover:bg-brand-500/20 transition"
                >
                  Return Max ({maxQty})
                </button>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleQtyChange(qty - 1)}
                  disabled={qty <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-line bg-ink-800 text-slate-200 transition active:scale-95 hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Decrease Quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <div className="relative flex-1 max-w-[140px]">
                  <input
                    type="number"
                    min={1}
                    max={maxQty}
                    value={qty}
                    onChange={(e) => handleQtyChange(Number(e.target.value))}
                    className="input w-full text-center font-mono text-xl font-black text-white"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
                    {item.unit_name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleQtyChange(qty + 1)}
                  disabled={qty >= maxQty}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-line bg-ink-800 text-slate-200 transition active:scale-95 hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Increase Quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Proportional Refund Calculation Preview Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-ink-850 to-ink-900 p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Refund Amount
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-black text-emerald-400 tracking-tight">
                      {money(refundAmountC)}
                    </span>
                    <span className="text-xs text-slate-400">
                      for {qty} {item.unit_name}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Refundable to Customer
                  </span>
                </div>
              </div>

              {isProrated && (
                <div className="mt-3 flex items-start gap-1.5 border-t border-emerald-500/15 pt-2 text-[11px] text-emerald-300/80">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
                  <span>
                    Includes prorated transaction discount (
                    {((1 - discountRatio) * 100).toFixed(1)}% discount applied to line item).
                  </span>
                </div>
              )}
            </div>

            {/* Reason Selection & Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Reason for Void / Return <span className="text-rose-400">*</span>
                </label>
                {reason && (
                  <button
                    type="button"
                    onClick={() => setReason('')}
                    className="text-[11px] text-slate-500 hover:text-slate-300"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Quick Select Reason Chips */}
              <div className="flex flex-wrap gap-1.5">
                {REASON_PRESETS.map((preset) => {
                  const isSelected = reason === preset
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReason(preset)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition active:scale-95 ${
                        isSelected
                          ? 'border border-brand-500 bg-brand-500/20 text-brand-300 font-semibold'
                          : 'border border-ink-line bg-ink-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  )
                })}
              </div>

              {/* Custom Reason Text Input */}
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Type or select a reason above..."
                className="input w-full text-xs"
                maxLength={200}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
