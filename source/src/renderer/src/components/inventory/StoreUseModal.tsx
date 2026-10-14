import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Store,
  Search,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sparkles,
  Barcode,
  HelpCircle,
  ShieldCheck,
  Calculator
} from 'lucide-react'
import type { Product, StoreUseRecord } from '@shared/types'
import { money } from '@shared/format'
import { Modal } from '../ui/Modal'
import { toastSuccess, toastError } from '../../stores/toast'
import { formatStoreUseSlipLines } from '@shared/receiptHtml'
import { playScanSuccess } from '../../lib/sound'

interface StoreUseModalProps {
  products: Product[]
  initial: Product | null
  onDone: () => void
  onClose: () => void
}

const COMMON_PURPOSES = [
  'Store Repair & Maintenance',
  'Counter & Shelving Build',
  'Store Cleaning Supplies',
  'Office & Admin Use',
  'Product Display & Sample'
]

export function StoreUseModal({
  products,
  initial,
  onDone,
  onClose
}: StoreUseModalProps): React.JSX.Element {
  const [productSearch, setProductSearch] = useState('')
  const [productId, setProductId] = useState<number>(initial?.id ?? products[0]?.id ?? 0)
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState(initial?.units[0]?.name ?? initial?.base_unit ?? '')
  const [customCostPesos, setCustomCostPesos] = useState('')
  const [reason, setReason] = useState<string>('Store Repair & Maintenance')
  const [customReason, setCustomReason] = useState('')
  const [notes, setNotes] = useState('')
  const [managerPin, setManagerPin] = useState('')
  const [printVoucher, setPrintVoucher] = useState(true)
  const [busy, setBusy] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const product = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  )

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    )
  }, [products, productSearch])

  // Update selected product and default unit when initial changes or search narrows
  useEffect(() => {
    if (initial) {
      setProductId(initial.id)
      setUnit(initial.units[0]?.name ?? initial.base_unit ?? '')
    }
  }, [initial])

  // If active product cost changes or is zero, prepare cost field
  useEffect(() => {
    if (product) {
      if (!unit) {
        setUnit(product.units[0]?.name ?? product.base_unit ?? '')
      }
      if (product.purchase_cost_c > 0) {
        setCustomCostPesos((product.purchase_cost_c / 100).toFixed(2))
      } else {
        setCustomCostPesos('')
      }
    }
  }, [product])

  const selectedUnit = useMemo(() => {
    return (
      product?.units.find((u) => u.name === unit) ?? {
        name: product?.base_unit ?? '',
        conversion_to_base: 1
      }
    )
  }, [product, unit])

  const qtyNumber = parseFloat(quantity) || 0
  const conv = selectedUnit.conversion_to_base || 1
  const subBase = Math.round(qtyNumber * conv * 1000) / 1000
  const currentStock = product?.stock ?? 0
  const newStock = Math.round((currentStock - subBase) * 1000) / 1000

  // Calculate Landed Cost and Total Operating Expense
  const parsedCost = parseFloat(customCostPesos)
  const effectiveCostC =
    !isNaN(parsedCost) && parsedCost > 0
      ? Math.round(parsedCost * 100)
      : product?.purchase_cost_c ?? 0

  const totalOpexC = Math.round(qtyNumber * effectiveCostC)
  const effectiveReason: string = (reason === 'Other' ? customReason.trim() : reason) || 'Store Repair & Maintenance'

  const canSave =
    !busy &&
    Boolean(product) &&
    qtyNumber > 0 &&
    newStock >= 0 &&
    effectiveCostC > 0 &&
    Boolean(effectiveReason)

  const handleSave = async (): Promise<void> => {
    if (!canSave || !product) return
    setBusy(true)

    try {
      const record: StoreUseRecord = await window.api.inventory.storeUse({
        product_id: product.id,
        quantity: qtyNumber,
        unit_name: selectedUnit.name,
        conversion_to_base: conv,
        cost_c: effectiveCostC,
        reason: effectiveReason,
        notes: notes.trim() || undefined,
        manager_pin: managerPin.trim() || undefined
      })

      playScanSuccess()
      toastSuccess(
        'Store Use Recorded',
        `Deducted ${record.quantity} ${record.unit} (${money(record.total_amount_c)} OPEX)`
      )

      // Print thermal voucher if enabled
      if (printVoucher) {
        try {
          const settings = await window.api.settings.get()
          const slipLines = formatStoreUseSlipLines(record, settings.store_name)
          await window.api.printer.printLines(slipLines)
        } catch (printErr) {
          console.warn('Printer warning:', printErr)
        }
      }

      onDone()
    } catch (err: unknown) {
      toastError('Store Use Failed', String((err as Error)?.message || err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Store Use / Operating Expense"
      maxWidth="max-w-xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={printVoucher}
              onChange={(e) => setPrintVoucher(e.target.checked)}
              className="checkbox checkbox-sm checkbox-primary"
            />
            <Printer className="h-3.5 w-3.5 text-slate-400" />
            <span>Print 58/80mm Voucher</span>
          </label>
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button
              className="btn-primary flex items-center gap-2"
              disabled={!canSave}
              onClick={() => void handleSave()}
            >
              <Store className="h-4 w-4" />
              {busy ? 'Recording...' : 'Record Store Use'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Header Alert & Invariant Information */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>VIP Store Use Feature: Automatic Inventory & OPEX Ledger</span>
          </div>
          <p className="mt-1 text-slate-300">
            Deducts stock quantity at <b>Landed Cost Price</b> and records an atomic entry into
            Operating Expenses under <i>Store Use / Internal Consumption</i> for BIR tax
            compliance and accurate Gross Margin accounting.
          </p>
        </div>

        {/* Product Selector */}
        <div>
          <label className="label text-xs font-semibold text-slate-300">
            Select Product (Search or Scan Barcode)
          </label>
          <div className="mb-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search product name, SKU, or barcode..."
                className="input w-full pl-9"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
            {productSearch && (
              <button
                type="button"
                onClick={() => setProductSearch('')}
                className="btn-ghost text-xs"
              >
                Clear
              </button>
            )}
          </div>
          <select
            className="input w-full font-medium"
            value={productId}
            onChange={(e) => {
              const id = Number(e.target.value)
              setProductId(id)
              const p = products.find((x) => x.id === id)
              if (p) {
                setUnit(p.units[0]?.name ?? p.base_unit ?? '')
                if (p.purchase_cost_c > 0) setCustomCostPesos((p.purchase_cost_c / 100).toFixed(2))
              }
            }}
          >
            {filteredProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.barcode ? `[${p.barcode}]` : ''} — Stock: {p.stock} {p.base_unit}
              </option>
            ))}
          </select>
        </div>

        {/* Current Product Info Card */}
        {product && (
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-ink-line bg-surface-2 p-3 text-xs">
            <div>
              <span className="text-slate-400">Current Stock</span>
              <p className="font-semibold text-white">
                {product.stock} {product.base_unit}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Recorded Cost</span>
              <p className="font-semibold text-emerald-400">
                {product.purchase_cost_c > 0 ? money(product.purchase_cost_c) : '₱0.00 (Unset)'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Selling Price</span>
              <p className="font-semibold text-sky-400">{money(product.default_price_c)}</p>
            </div>
          </div>
        )}

        {/* Quantity & Unit Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label text-xs font-semibold text-slate-300">
              Quantity for Store Use *
            </label>
            <input
              type="number"
              min="0.001"
              step="any"
              className="input w-full font-mono text-base font-bold text-white"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 2"
            />
          </div>
          <div>
            <label className="label text-xs font-semibold text-slate-300">Unit</label>
            <select
              className="input w-full font-medium"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {product?.units.map((u) => (
                <option key={u.id || u.name} value={u.name}>
                  {u.name} (×{u.conversion_to_base} {product.base_unit})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Landed Cost Validation / Override */}
        <div>
          <label className="label flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Landed Cost Price per {unit || 'unit'} (₱) *</span>
            {effectiveCostC <= 0 && (
              <span className="flex items-center gap-1 text-danger-400">
                <AlertTriangle className="h-3 w-3" /> Cost required for OPEX
              </span>
            )}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 font-bold text-slate-400">₱</span>
            <input
              type="number"
              min="0.01"
              step="any"
              className={`input w-full pl-8 font-mono font-semibold ${
                effectiveCostC <= 0 ? 'border-danger-500 bg-danger-500/10' : ''
              }`}
              value={customCostPesos}
              onChange={(e) => setCustomCostPesos(e.target.value)}
              placeholder="0.00"
            />
          </div>
          {product && product.purchase_cost_c <= 0 && (
            <p className="mt-1 text-[11px] text-amber-400">
              ⚠️ This item has ₱0.00 cost in inventory. Enter the approximate purchase cost so it
              can be recorded accurately in operating expenses.
            </p>
          )}
        </div>

        {/* Purpose / Reason with Quick Chips */}
        <div>
          <label className="label text-xs font-semibold text-slate-300">
            Purpose / Department *
          </label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {COMMON_PURPOSES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReason(p)}
                className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                  reason === p
                    ? 'bg-brand-500 text-white font-semibold'
                    : 'bg-surface-2 text-slate-400 hover:bg-surface-3 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setReason('Other')}
              className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                reason === 'Other'
                  ? 'bg-brand-500 text-white font-semibold'
                  : 'bg-surface-2 text-slate-400 hover:bg-surface-3 hover:text-white'
              }`}
            >
              Other
            </button>
          </div>
          {reason === 'Other' && (
            <input
              type="text"
              className="input w-full text-xs"
              placeholder="Specify purpose (e.g. Broken Glass Counter Replacement)"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
          )}
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="label text-xs font-semibold text-slate-300">
            Additional Notes (Optional)
          </label>
          <input
            type="text"
            className="input w-full text-xs"
            placeholder="e.g. Requested by Mang Boy for branch hardware repairs"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Live Calculation & Stock Impact Card */}
        <div className="rounded-xl border border-ink-line bg-surface-2 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>Deduction:</span>
            <span className="font-mono text-white">
              {qtyNumber || 0} {selectedUnit.name} ({subBase} {product?.base_unit})
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>New Stock Remaining:</span>
            <span
              className={`font-mono font-bold ${
                newStock < 0 ? 'text-danger-400' : 'text-emerald-400'
              }`}
            >
              {newStock} {product?.base_unit}
            </span>
          </div>
          <div className="border-t border-ink-line pt-2 flex items-center justify-between">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Calculator className="h-3.5 w-3.5" /> Total Operating Expense Charged:
            </span>
            <span className="font-mono text-base font-extrabold text-amber-400">
              {money(totalOpexC)}
            </span>
          </div>
        </div>

        {newStock < 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-danger-500/10 p-2.5 text-xs text-danger-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Cannot withdraw more than current inventory stock ({currentStock} available).</span>
          </div>
        )}

        {/* Optional Manager PIN (Dr. Aegis Anti-Kupit Guard) */}
        <div>
          <div className="flex items-center justify-between">
            <label className="label flex items-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
              <span>Manager Authorization PIN (Optional for Cashiers)</span>
            </label>
          </div>
          <input
            type="password"
            maxLength={6}
            placeholder="Enter 4-digit Manager PIN if required"
            className="input w-full font-mono text-xs"
            value={managerPin}
            onChange={(e) => setManagerPin(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
