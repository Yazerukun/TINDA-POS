import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Store,
  Search,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  Barcode,
  AlertTriangle,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Package
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

interface StoreUseItemRow {
  tempId: string
  productId: number
  productName: string
  barcode: string
  sku: string
  baseUnit: string
  currentStock: number
  unitName: string
  conversionToBase: number
  quantity: number
  quantityBase: number
  unitCostC: number
  subtotalC: number
  remainingStock: number
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
  // Purpose & Details
  const [reason, setReason] = useState<string>('Store Repair & Maintenance')
  const [customReason, setCustomReason] = useState('')
  const [notes, setNotes] = useState('')
  const [managerPin, setManagerPin] = useState('')
  const [printVoucher, setPrintVoucher] = useState(true)
  const [busy, setBusy] = useState(false)

  // Staged Multi-Item Lines
  const [items, setItems] = useState<StoreUseItemRow[]>([])

  // Entry Bar Fields
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownIndex, setDropdownIndex] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initial ?? null)
  const [selectedUnitName, setSelectedUnitName] = useState('')
  const [qtyInput, setQtyInput] = useState('1')
  const [unitCostPesos, setUnitCostPesos] = useState('')

  const searchInputRef = useRef<HTMLInputElement>(null)
  const qtyInputRef = useRef<HTMLInputElement>(null)
  const costInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter products for quick search dropdown
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      )
      .slice(0, 8)
  }, [products, searchQuery])

  // Select initial product if provided
  useEffect(() => {
    if (initial) {
      chooseProduct(initial)
    }
  }, [initial])

  const chooseProduct = (p: Product) => {
    setSelectedProduct(p)
    const defaultUnit = p.units[0]?.name ?? p.base_unit ?? ''
    setSelectedUnitName(defaultUnit)
    if (p.purchase_cost_c > 0) {
      setUnitCostPesos((p.purchase_cost_c / 100).toFixed(2))
    } else {
      setUnitCostPesos('')
    }
    setSearchQuery('')
    setShowDropdown(false)
    setTimeout(() => qtyInputRef.current?.focus(), 50)
  }

  // Active unit calculation
  const activeUnit = useMemo(() => {
    if (!selectedProduct) return { name: '', conversion_to_base: 1 }
    const match = selectedProduct.units.find((u) => u.name === selectedUnitName)
    return match ?? { name: selectedProduct.base_unit, conversion_to_base: 1 }
  }, [selectedProduct, selectedUnitName])

  // Computed values for entry row
  const parsedQty = parseFloat(qtyInput) || 0
  const conv = activeUnit.conversion_to_base || 1
  const entryQtyBase = Math.round(parsedQty * conv * 1000) / 1000

  // Calculate already allocated base quantity in table
  const allocatedBaseForSelected = useMemo(() => {
    if (!selectedProduct) return 0
    return items
      .filter((it) => it.productId === selectedProduct.id)
      .reduce((sum, it) => sum + it.quantityBase, 0)
  }, [items, selectedProduct])

  const availableAfterAllocated = selectedProduct
    ? Math.round((selectedProduct.stock - allocatedBaseForSelected) * 1000) / 1000
    : 0

  const entryRemStock = Math.round((availableAfterAllocated - entryQtyBase) * 1000) / 1000

  const parsedCost = parseFloat(unitCostPesos)
  const entryCostC =
    !isNaN(parsedCost) && parsedCost > 0
      ? Math.round(parsedCost * 100)
      : selectedProduct?.purchase_cost_c ?? 0

  const canAddLine =
    Boolean(selectedProduct) &&
    parsedQty > 0 &&
    entryRemStock >= 0 &&
    entryCostC > 0

  // Add Item to table
  const handleAddItem = () => {
    if (!canAddLine || !selectedProduct) return

    const lineSubtotalC = Math.round(parsedQty * entryCostC)
    const newItem: StoreUseItemRow = {
      tempId: `item-${Date.now()}-${Math.random()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      barcode: selectedProduct.barcode || '',
      sku: selectedProduct.sku || '',
      baseUnit: selectedProduct.base_unit,
      currentStock: selectedProduct.stock,
      unitName: activeUnit.name,
      conversionToBase: conv,
      quantity: parsedQty,
      quantityBase: entryQtyBase,
      unitCostC: entryCostC,
      subtotalC: lineSubtotalC,
      remainingStock: entryRemStock
    }

    setItems((prev) => [...prev, newItem])
    playScanSuccess()

    // Reset entry bar
    setSelectedProduct(null)
    setQtyInput('1')
    setUnitCostPesos('')
    setSearchQuery('')
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }

  // Remove Item
  const handleRemoveItem = (tempId: string) => {
    setItems((prev) => prev.filter((it) => it.tempId !== tempId))
  }

  // Grand Totals
  const totalOpexC = useMemo(() => {
    return items.reduce((sum, it) => sum + it.subtotalC, 0)
  }, [items])

  const effectiveReason =
    (reason === 'Other' ? customReason.trim() : reason) || 'Store Repair & Maintenance'

  const canSave = !busy && items.length > 0 && Boolean(effectiveReason)

  // Save Transaction
  const handleSave = async (): Promise<void> => {
    if (!canSave) return
    setBusy(true)

    try {
      const payload = {
        items: items.map((it) => ({
          product_id: it.productId,
          quantity: it.quantity,
          unit_name: it.unitName,
          conversion_to_base: it.conversionToBase,
          cost_c: it.unitCostC
        })),
        reason: effectiveReason,
        notes: notes.trim() || undefined,
        manager_pin: managerPin.trim() || undefined
      }

      const record: StoreUseRecord = await window.api.inventory.storeUse(payload)

      playScanSuccess()
      toastSuccess(
        'Store Use Voucher Recorded',
        `Recorded ${record.total_items} items (${money(record.total_amount_c)} OPEX) — Ref: ${record.reference}`
      )

      // Print thermal slip if requested
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
      title="Store Use / Operating Expense Voucher"
      maxWidth="max-w-4xl"
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
            <span>Print 58/80mm Multi-Item Voucher</span>
          </label>
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-bold shadow-lg shadow-brand-500/20"
              disabled={!canSave}
              onClick={() => void handleSave()}
            >
              <Store className="h-4 w-4" />
              {busy ? 'Recording Voucher...' : `Record Store Use (${items.length} items)`}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Header Invariant Notice */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Multi-Item Store Use (VIP Purchase Invoice Style)</span>
          </div>
          <p className="mt-1 text-slate-300">
            Paspas nga pag-lista sa tanang stocks nga gi-gamit para sa internal maintenance o supplies.
            Usa ra ka atomic voucher para sa deduction sa inventory ug automatic posting sa Operating Expense.
          </p>
        </div>

        {/* Voucher Header: Purpose & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-ink-line bg-surface-2 p-3 text-xs">
          <div>
            <label className="label text-xs font-semibold text-slate-300">
              Purpose / Department *
            </label>
            <div className="mb-2 flex flex-wrap gap-1">
              {COMMON_PURPOSES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setReason(p)}
                  className={`rounded-lg px-2 py-0.5 text-[11px] transition-colors ${
                    reason === p
                      ? 'bg-brand-500 text-white font-semibold'
                      : 'bg-surface-3 text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setReason('Other')}
                className={`rounded-lg px-2 py-0.5 text-[11px] transition-colors ${
                  reason === 'Other'
                    ? 'bg-brand-500 text-white font-semibold'
                    : 'bg-surface-3 text-slate-400 hover:text-white'
                }`}
              >
                Other
              </button>
            </div>
            {reason === 'Other' && (
              <input
                type="text"
                className="input w-full text-xs"
                placeholder="Specify purpose (e.g. Broken Light Fixtures Replacement)"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            )}
          </div>
          <div className="space-y-2">
            <div>
              <label className="label text-xs font-semibold text-slate-300">
                Additional Notes / Reference (Optional)
              </label>
              <input
                type="text"
                className="input w-full text-xs"
                placeholder="e.g. Counter fabrication by Hardware team"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div>
              <label className="label flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="h-3 w-3 text-slate-400" />
                <span>Manager Authorization PIN (Optional)</span>
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder="PIN if required"
                className="input w-full font-mono text-xs"
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Item Entry Bar (Like Purchase Invoice) */}
        <div className="rounded-xl border border-brand-500/30 bg-surface-2 p-3 shadow-inner">
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-brand-400">
            <span className="flex items-center gap-1.5">
              <Package className="h-4 w-4" /> Add Item to Store Use Voucher
            </span>
            {selectedProduct && (
              <span className="text-[11px] font-normal text-slate-400">
                Current Stock: <b className="text-white">{selectedProduct.stock} {selectedProduct.base_unit}</b>
                {allocatedBaseForSelected > 0 && ` (Allocated in table: ${allocatedBaseForSelected})`}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            {/* Search / Scan Box */}
            <div className="relative md:col-span-5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Scan barcode or type product name..."
                  className="input w-full pl-9 text-xs"
                  value={selectedProduct ? selectedProduct.name : searchQuery}
                  onChange={(e) => {
                    if (selectedProduct) setSelectedProduct(null)
                    setSearchQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) setShowDropdown(true)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      setDropdownIndex((prev) => Math.min(prev + 1, filteredProducts.length - 1))
                    } else if (e.key === 'ArrowUp') {
                      setDropdownIndex((prev) => Math.max(prev - 1, 0))
                    } else if (e.key === 'Enter' && showDropdown && filteredProducts[dropdownIndex]) {
                      e.preventDefault()
                      chooseProduct(filteredProducts[dropdownIndex])
                    }
                  }}
                />
                {selectedProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null)
                      setSearchQuery('')
                    }}
                    className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Search Dropdown */}
              {showDropdown && filteredProducts.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-ink-line bg-surface-1 shadow-2xl"
                >
                  {filteredProducts.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => chooseProduct(p)}
                      className={`cursor-pointer border-b border-ink-line/50 p-2 text-xs transition-colors ${
                        idx === dropdownIndex ? 'bg-brand-500/20 text-brand-300' : 'hover:bg-surface-2 text-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{p.barcode || p.sku || 'No Barcode'}</span>
                        <span>Stock: {p.stock} {p.base_unit} | Cost: ₱{(p.purchase_cost_c / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unit Selector */}
            <div className="md:col-span-2">
              <select
                className="input w-full text-xs font-medium"
                value={selectedUnitName}
                onChange={(e) => setSelectedUnitName(e.target.value)}
                disabled={!selectedProduct}
              >
                {selectedProduct?.units.map((u) => (
                  <option key={u.id || u.name} value={u.name}>
                    {u.name} (×{u.conversion_to_base} {selectedProduct.base_unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Qty Input */}
            <div className="md:col-span-2">
              <input
                ref={qtyInputRef}
                type="number"
                min="0.001"
                step="any"
                placeholder="Qty"
                className="input w-full font-mono text-xs font-bold"
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                disabled={!selectedProduct}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (canAddLine) handleAddItem()
                  }
                }}
              />
            </div>

            {/* Landed Cost Input */}
            <div className="md:col-span-2">
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₱</span>
                <input
                  ref={costInputRef}
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder="Cost"
                  className="input w-full pl-6 font-mono text-xs"
                  value={unitCostPesos}
                  onChange={(e) => setUnitCostPesos(e.target.value)}
                  disabled={!selectedProduct}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (canAddLine) handleAddItem()
                    }
                  }}
                />
              </div>
            </div>

            {/* Add Button */}
            <div className="md:col-span-1">
              <button
                type="button"
                className="btn-primary w-full flex items-center justify-center p-2 text-xs"
                disabled={!canAddLine}
                onClick={handleAddItem}
                title="Add item to list"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Validation warnings for entry */}
          {selectedProduct && entryRemStock < 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-danger-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Insufficient stock! Available after table allocations: {availableAfterAllocated} {selectedProduct.base_unit}.</span>
            </div>
          )}
        </div>

        {/* Multi-Item Table (The Invoice Style List) */}
        <div className="overflow-hidden rounded-xl border border-ink-line bg-surface-1">
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 border-b border-ink-line bg-surface-2 text-slate-400">
                <tr>
                  <th className="py-2.5 pl-3 font-semibold">#</th>
                  <th className="py-2.5 font-semibold">Product Description</th>
                  <th className="py-2.5 font-semibold text-right">Qty</th>
                  <th className="py-2.5 font-semibold">Unit</th>
                  <th className="py-2.5 font-semibold text-right">Unit Cost</th>
                  <th className="py-2.5 font-semibold text-right">Subtotal (OPEX)</th>
                  <th className="py-2.5 pr-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line/50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      <Package className="mx-auto h-8 w-8 text-slate-600 mb-1 opacity-50" />
                      Walay items nga nalista. Gamita ang search bar sa ibabaw aron mag-add og mga stocks.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => (
                    <tr key={it.tempId} className="hover:bg-surface-2/50 transition-colors">
                      <td className="py-2.5 pl-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2.5">
                        <div className="font-semibold text-white">{it.productName}</div>
                        <div className="text-[11px] text-slate-400">
                          {it.barcode ? `Barcode: ${it.barcode} | ` : ''}Deduction: {it.quantityBase} {it.baseUnit}
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-white">
                        {it.quantity}
                      </td>
                      <td className="py-2.5 font-medium text-slate-300">
                        {it.unitName}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-300">
                        {money(it.unitCostC)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-amber-400">
                        {money(it.subtotalC)}
                      </td>
                      <td className="py-2.5 pr-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.tempId)}
                          className="rounded p-1 text-slate-400 hover:bg-danger-500/20 hover:text-danger-400 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Grand Totals Bar */}
          <div className="flex items-center justify-between border-t border-ink-line bg-surface-2 p-3 text-xs">
            <div className="text-slate-400">
              Total Items in Voucher: <b className="text-white">{items.length}</b> ({items.reduce((sum, it) => sum + it.quantity, 0)} units total)
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Calculator className="h-4 w-4" /> Grand Total Operating Expense:
              </span>
              <span className="font-mono text-lg font-extrabold text-amber-400">
                {money(totalOpexC)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
