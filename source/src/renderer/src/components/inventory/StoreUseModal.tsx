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
  Package,
  Clock,
  Eye,
  RefreshCw,
  Calendar,
  FileText,
  X,
  ArrowLeft
} from 'lucide-react'
import type { Product, StoreUseRecord, StoreUseItemRecord } from '@shared/types'
import { money } from '@shared/format'
import { Modal } from '../ui/Modal'
import { toastSuccess, toastError } from '../../stores/toast'
import { formatStoreUseSlipLines } from '@shared/receiptHtml'
import { playScanSuccess } from '../../lib/sound'

interface StoreUseModalProps {
  products: Product[]
  initial: Product | null
  initialTab?: 'CREATE' | 'HISTORY'
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

/**
 * Automatically calculates the retail price for a given unit.
 * Priority:
 * 1. Unit-specific selling price (`u.selling_price_c`) if configured > 0
 * 2. Product retail selling price scaled by conversion factor (`p.default_price_c * conv`)
 * 3. Purchase cost fallback (`p.purchase_cost_c * conv`) if no retail price set
 */
export function getRetailPriceForUnit(p: Product, unitName: string): number {
  const match = p.units?.find((u) => u.name === unitName)
  if (match && match.selling_price_c > 0) {
    return match.selling_price_c
  }
  const conv = match?.conversion_to_base || 1
  if (p.default_price_c > 0) {
    return Math.round(p.default_price_c * conv)
  }
  if (p.purchase_cost_c > 0) {
    return Math.round(p.purchase_cost_c * conv)
  }
  return 0
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  try {
    const clean = String(iso).replace(' ', 'T')
    const d = new Date(clean)
    if (isNaN(d.getTime())) return String(iso)
    return d.toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return String(iso || '—')
  }
}

/**
 * Itemized Details Modal for viewing recorded Store Use vouchers
 */
export function StoreUseDetailsModal({
  record,
  onClose,
  onReprint
}: {
  record: StoreUseRecord
  onClose: () => void
  onReprint: (rec: StoreUseRecord) => Promise<void>
}): React.JSX.Element {
  const [reprinting, setReprinting] = useState(false)

  const itemsList: StoreUseItemRecord[] = useMemo(() => {
    if (record.items && record.items.length > 0) {
      return record.items
    }
    if (record.product_name) {
      return [
        {
          product_id: record.product_id || 0,
          product_name: record.product_name,
          quantity: record.quantity || 1,
          unit: record.unit || 'unit',
          quantity_base: record.quantity_base || record.quantity || 1,
          unit_cost_c: record.unit_cost_c || record.total_amount_c,
          total_amount_c: record.total_amount_c,
          stock_before: record.stock_before ?? 0,
          stock_after: record.stock_after ?? 0
        }
      ]
    }
    return []
  }, [record])

  const handlePrint = async () => {
    setReprinting(true)
    try {
      await onReprint(record)
    } finally {
      setReprinting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Store Use Voucher Details"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-xs text-slate-400">
            Recorded as Operating Expense (OPEX) in General Ledger
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handlePrint()}
              disabled={reprinting}
              className="btn-secondary flex items-center gap-1.5 text-xs"
              title="Reprint 58mm/80mm Thermal Expense Slip"
            >
              <Printer className="h-4 w-4 text-amber-400" />
              {reprinting ? 'Printing...' : 'Reprint Slip'}
            </button>
            <button type="button" onClick={onClose} className="btn-primary text-xs">
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Header Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-ink-line bg-surface-2 p-3">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Voucher Ref</span>
            <span className="font-mono text-sm font-bold text-amber-300 break-all">{record.reference}</span>
          </div>
          <div className="rounded-xl border border-ink-line bg-surface-2 p-3">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Date & Time</span>
            <span className="text-xs font-semibold text-white">{formatDateTime(record.created_at)}</span>
          </div>
          <div className="rounded-xl border border-ink-line bg-surface-2 p-3">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Staff / Issuer</span>
            <span className="text-xs font-semibold text-white">{record.cashier_name || 'Staff'}</span>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <span className="text-[11px] font-semibold text-amber-300 block mb-1">Total OPEX</span>
            <span className="font-mono text-base font-extrabold text-amber-400">{money(record.total_amount_c)}</span>
          </div>
        </div>

        {/* Purpose & Notes */}
        <div className="rounded-xl border border-ink-line bg-surface-1 p-3.5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Purpose / Department:</span>
            <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-xs">
              {record.reason || 'Store Repair & Maintenance'}
            </span>
          </div>
          {record.notes && (
            <div className="text-xs text-slate-300 bg-surface-2/60 p-2.5 rounded-lg border border-ink-line/50">
              <span className="font-semibold text-slate-400">Notes / Remarks: </span>
              {record.notes}
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="overflow-hidden rounded-xl border border-ink-line bg-surface-1">
          <div className="border-b border-ink-line bg-surface-2 px-3 py-2 text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Itemized Consumed Products ({itemsList.length} items)</span>
            <span className="text-amber-400 font-mono font-bold">Total: {money(record.total_amount_c)}</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 border-b border-ink-line bg-surface-2/95 text-slate-400">
                <tr>
                  <th className="py-2.5 pl-3 font-semibold">#</th>
                  <th className="py-2.5 font-semibold">Product Description</th>
                  <th className="py-2.5 font-semibold text-right">Qty</th>
                  <th className="py-2.5 font-semibold">Unit</th>
                  <th className="py-2.5 font-semibold text-right">Unit Price (OPEX)</th>
                  <th className="py-2.5 font-semibold text-right">Subtotal</th>
                  <th className="py-2.5 pr-3 text-center font-semibold">Stock Movement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line/50">
                {itemsList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-2/40 transition-colors">
                    <td className="py-2.5 pl-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 font-semibold text-white">{item.product_name}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-white">{item.quantity}</td>
                    <td className="py-2.5 font-medium text-slate-300">{item.unit}</td>
                    <td className="py-2.5 text-right font-mono text-slate-300">{money(item.unit_cost_c)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-amber-400">{money(item.total_amount_c)}</td>
                    <td className="py-2.5 pr-3 text-center text-[11px] font-mono text-slate-400">
                      {item.stock_before != null && item.stock_after != null ? (
                        <span>
                          {item.stock_before} ➔ <b className="text-amber-300">{item.stock_after}</b>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export function StoreUseModal({
  products,
  initial,
  initialTab = 'CREATE',
  onDone,
  onClose
}: StoreUseModalProps): React.JSX.Element {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'CREATE' | 'HISTORY'>(initialTab)

  // Purpose & Details (Create Mode)
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

  // History State
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyRecords, setHistoryRecords] = useState<StoreUseRecord[]>([])
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historySearch, setHistorySearch] = useState('')
  const [historyFrom, setHistoryFrom] = useState('')
  const [historyTo, setHistoryTo] = useState('')
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | '30days'>('all')
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<StoreUseRecord | null>(null)
  const [reprintingRef, setReprintingRef] = useState<string | null>(null)

  // Load History
  const loadHistory = async (): Promise<void> => {
    setHistoryLoading(true)
    try {
      const opts = {
        search: historySearch.trim() || undefined,
        from: historyFrom || undefined,
        to: historyTo || undefined,
        limit: 100
      }

      let res: { rows: StoreUseRecord[]; total: number }
      if (typeof window.api?.inventory?.storeUseHistory === 'function') {
        res = await window.api.inventory.storeUseHistory(opts)
      } else if (
        typeof (window.api as unknown as { rawInvoke?: (ch: string, ...args: unknown[]) => Promise<unknown> })
          ?.rawInvoke === 'function'
      ) {
        res = (await (
          window.api as unknown as { rawInvoke: (ch: string, ...args: unknown[]) => Promise<unknown> }
        ).rawInvoke('inventory:storeUseHistory', opts)) as { rows: StoreUseRecord[]; total: number }
      } else {
        res = { rows: [], total: 0 }
      }

      setHistoryRecords(res.rows || [])
      setHistoryTotal(res.total || 0)
    } catch (err) {
      toastError('Failed to load Store Use history', String((err as Error)?.message || err))
    } finally {
      setHistoryLoading(false)
    }
  }

  // Load history when tab becomes HISTORY or when filters change
  useEffect(() => {
    if (activeTab === 'HISTORY') {
      void loadHistory()
    }
  }, [activeTab, historyFrom, historyTo])

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
    // Auto-populate with retail price immediately
    const retailPriceC = getRetailPriceForUnit(p, defaultUnit)
    if (retailPriceC > 0) {
      setUnitCostPesos((retailPriceC / 100).toFixed(2))
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

  const defaultEntryCostC = selectedProduct ? getRetailPriceForUnit(selectedProduct, selectedUnitName) : 0
  const parsedCost = parseFloat(unitCostPesos)
  const entryCostC =
    !isNaN(parsedCost) && parsedCost > 0
      ? Math.round(parsedCost * 100)
      : defaultEntryCostC

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

  // Grand Totals for current creation
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

      let record: StoreUseRecord
      if (typeof window.api?.inventory?.storeUse === 'function') {
        record = await window.api.inventory.storeUse(payload)
      } else if (
        typeof (window.api as unknown as { rawInvoke?: (ch: string, ...args: unknown[]) => Promise<unknown> })
          ?.rawInvoke === 'function'
      ) {
        record = (await (
          window.api as unknown as { rawInvoke: (ch: string, ...args: unknown[]) => Promise<unknown> }
        ).rawInvoke('inventory:storeUse', payload)) as StoreUseRecord
      } else {
        throw new Error(
          'Store Use module requires TINDA POS v2.2.9 Full Setup. Please install or restart the latest full build.'
        )
      }

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

  // Quick Date Preset Handler
  const applyDatePreset = (preset: 'all' | 'today' | '7days' | '30days') => {
    setDatePreset(preset)
    const now = new Date()
    const toIso = (d: Date) => d.toISOString().slice(0, 10)
    if (preset === 'today') {
      const todayStr = toIso(now)
      setHistoryFrom(todayStr)
      setHistoryTo(todayStr)
    } else if (preset === '7days') {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      setHistoryFrom(toIso(d))
      setHistoryTo(toIso(now))
    } else if (preset === '30days') {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      setHistoryFrom(toIso(d))
      setHistoryTo(toIso(now))
    } else {
      setHistoryFrom('')
      setHistoryTo('')
    }
  }

  // Reprint Slip from History
  const handleReprintSlip = async (rec: StoreUseRecord): Promise<void> => {
    try {
      setReprintingRef(rec.reference)
      const settings = await window.api.settings.get()
      const slipLines = formatStoreUseSlipLines(rec, settings.store_name)
      await window.api.printer.printLines(slipLines)
      toastSuccess('Reprinting Voucher', `Slip sent to printer for ${rec.reference}`)
    } catch (err) {
      toastError('Reprint Failed', String((err as Error)?.message || err))
    } finally {
      setReprintingRef(null)
    }
  }

  // Computed KPI Metrics for History View
  const historySummary = useMemo(() => {
    const totalVouchers = historyRecords.length
    const totalOpexC = historyRecords.reduce((sum, r) => sum + (r.total_amount_c || 0), 0)
    const totalItems = historyRecords.reduce((sum, r) => {
      if (r.items && r.items.length > 0) {
        return sum + r.items.reduce((isum, i) => isum + (i.quantity || 1), 0)
      }
      return sum + (r.quantity || 1)
    }, 0)
    return { totalVouchers, totalOpexC, totalItems }
  }, [historyRecords])

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title="Store Use & Operating Expense Center"
        maxWidth="max-w-4xl"
        footer={
          activeTab === 'CREATE' ? (
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
          ) : (
            <div className="flex w-full items-center justify-between">
              <div className="text-xs text-slate-400">
                Showing <b className="text-white">{historyRecords.length}</b> of{' '}
                <b className="text-white">{historyTotal}</b> recorded vouchers
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('CREATE')}
                  className="btn-secondary flex items-center gap-1.5 text-xs font-semibold text-primary-300 border-primary-500/30"
                >
                  <Plus className="h-4 w-4" /> New Store Use Voucher
                </button>
                <button type="button" onClick={onClose} className="btn-primary text-xs">
                  Close
                </button>
              </div>
            </div>
          )
        }
      >
        <div className="space-y-4">
          {/* Top Segmented Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-ink-line pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('CREATE')}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === 'CREATE'
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-surface-2'
                }`}
              >
                <Plus className="h-4 w-4" />
                Create Voucher
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('HISTORY')
                  void loadHistory()
                }}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === 'HISTORY'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-surface-2'
                }`}
              >
                <Clock className="h-4 w-4 text-amber-400" />
                Voucher History & Details (VIP)
                {historyTotal > 0 && (
                  <span className="rounded-full bg-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                    {historyTotal}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'HISTORY' && (
              <button
                type="button"
                onClick={() => void loadHistory()}
                className="btn-ghost-2 flex items-center gap-1.5 text-xs text-slate-300 hover:text-white py-1.5 px-3 rounded-lg border border-ink-line"
                title="Refresh Store Use History"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? 'animate-spin text-amber-400' : ''}`} />
                Refresh
              </button>
            )}
          </div>

          {/* ==================== CREATE TAB ==================== */}
          {activeTab === 'CREATE' && (
            <div className="space-y-4">
              {/* Header Invariant Notice */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
                <div className="flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Multi-Item Store Use (VIP Purchase Invoice Style)</span>
                </div>
                <p className="mt-1 text-slate-300">
                  Quickly log all stocks consumed for internal maintenance, supplies, or renovations. A single atomic voucher
                  handles both the stock deduction and automatic posting to Operating Expense.
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
                              <span>
                                Stock: {p.stock} {p.base_unit} | <span className="font-semibold text-emerald-400">Retail: ₱{(p.default_price_c / 100).toFixed(2)}</span>
                                {p.purchase_cost_c > 0 ? ` (Cost: ₱${(p.purchase_cost_c / 100).toFixed(2)})` : ''}
                              </span>
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
                      onChange={(e) => {
                        const newUnit = e.target.value
                        setSelectedUnitName(newUnit)
                        if (selectedProduct) {
                          const retailPriceC = getRetailPriceForUnit(selectedProduct, newUnit)
                          if (retailPriceC > 0) {
                            setUnitCostPesos((retailPriceC / 100).toFixed(2))
                          }
                        }
                      }}
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

                  {/* Retail Price / Valuation Input */}
                  <div className="md:col-span-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₱</span>
                      <input
                        ref={costInputRef}
                        type="number"
                        min="0.01"
                        step="any"
                        placeholder="Retail ₱"
                        className="input w-full pl-6 font-mono text-xs"
                        value={unitCostPesos}
                        onChange={(e) => setUnitCostPesos(e.target.value)}
                        disabled={!selectedProduct}
                        title="Retail selling price (automatically follows retail price; editable if needed)"
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
                        <th className="py-2.5 font-semibold text-right">Unit Price</th>
                        <th className="py-2.5 font-semibold text-right">Subtotal (OPEX)</th>
                        <th className="py-2.5 pr-3 text-center font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-line/50">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            <Package className="mx-auto h-8 w-8 text-slate-600 mb-1 opacity-50" />
                            No items listed yet. Use the search bar above to add items.
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
          )}

          {/* ==================== HISTORY TAB ==================== */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="rounded-xl border border-ink-line bg-surface-2 p-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                  <div className="relative md:col-span-5">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search voucher ref (SU-...), purpose, product..."
                      className="input w-full pl-9 text-xs"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          void loadHistory()
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-1.5 md:col-span-4">
                    <input
                      type="date"
                      className="input w-full text-xs font-mono"
                      value={historyFrom}
                      onChange={(e) => {
                        setDatePreset('all')
                        setHistoryFrom(e.target.value)
                      }}
                      title="From Date"
                    />
                    <span className="text-xs text-slate-400">to</span>
                    <input
                      type="date"
                      className="input w-full text-xs font-mono"
                      value={historyTo}
                      onChange={(e) => {
                        setDatePreset('all')
                        setHistoryTo(e.target.value)
                      }}
                      title="To Date"
                    />
                  </div>

                  <div className="md:col-span-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void loadHistory()}
                      className="btn-primary w-full text-xs flex items-center justify-center gap-1.5 py-2"
                    >
                      <Search className="h-3.5 w-3.5" /> Filter
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-ink-line/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-semibold mr-1">Presets:</span>
                    {(['all', 'today', '7days', '30days'] as const).map((p) => {
                      const labels = {
                        all: 'All Time',
                        today: 'Today',
                        '7days': 'Last 7 Days',
                        '30days': 'Last 30 Days'
                      }
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => applyDatePreset(p)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                            datePreset === p
                              ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                              : 'bg-surface-3 text-slate-400 hover:text-white'
                          }`}
                        >
                          {labels[p]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-ink-line bg-surface-1 p-3">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Vouchers Recorded</span>
                  <span className="font-mono text-xl font-bold text-white">{historySummary.totalVouchers}</span>
                </div>
                <div className="rounded-xl border border-ink-line bg-surface-1 p-3">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Items Consumed</span>
                  <span className="font-mono text-xl font-bold text-amber-300">{historySummary.totalItems} units</span>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                  <span className="text-[11px] font-semibold text-amber-300 block mb-1">Total Operating Expense (OPEX)</span>
                  <span className="font-mono text-xl font-extrabold text-amber-400">{money(historySummary.totalOpexC)}</span>
                </div>
              </div>

              {/* History Table */}
              <div className="overflow-hidden rounded-xl border border-ink-line bg-surface-1">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-10 border-b border-ink-line bg-surface-2 text-slate-400">
                      <tr>
                        <th className="py-2.5 pl-3 font-semibold">Date & Time</th>
                        <th className="py-2.5 font-semibold">Voucher Ref</th>
                        <th className="py-2.5 font-semibold">Purpose</th>
                        <th className="py-2.5 font-semibold">Item Summary</th>
                        <th className="py-2.5 font-semibold">Staff</th>
                        <th className="py-2.5 font-semibold text-right">Total OPEX</th>
                        <th className="py-2.5 pr-3 text-center font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-line/50">
                      {historyLoading ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-amber-400 mb-2" />
                            Loading recorded vouchers...
                          </td>
                        </tr>
                      ) : historyRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-500">
                            <Clock className="mx-auto h-8 w-8 text-slate-600 mb-2 opacity-50" />
                            No Store Use vouchers found for the selected period.
                          </td>
                        </tr>
                      ) : (
                        historyRecords.map((r, idx) => {
                          const itemsCount = (r.items && r.items.length) || r.total_items || 1
                          const itemsSummaryText =
                            r.items && r.items.length > 0
                              ? `${r.items.length} item${r.items.length > 1 ? 's' : ''} (${r.items.map((i) => i.product_name).slice(0, 2).join(', ')}${r.items.length > 2 ? '...' : ''})`
                              : r.product_name || '1 item'

                          const isReprintingThis = reprintingRef === r.reference

                          return (
                            <tr key={r.reference || idx} className="hover:bg-surface-2/50 transition-colors">
                              <td className="py-2.5 pl-3 font-mono text-slate-300 whitespace-nowrap">
                                {formatDateTime(r.created_at)}
                              </td>
                              <td className="py-2.5 font-mono font-bold text-amber-300">
                                {r.reference}
                              </td>
                              <td className="py-2.5">
                                <span className="badge bg-slate-800 text-slate-200 text-[11px] font-medium border border-ink-line">
                                  {r.reason}
                                </span>
                              </td>
                              <td className="py-2.5 text-slate-300 max-w-xs truncate" title={itemsSummaryText}>
                                {itemsSummaryText}
                              </td>
                              <td className="py-2.5 text-slate-400">
                                {r.cashier_name || 'Staff'}
                              </td>
                              <td className="py-2.5 text-right font-mono font-bold text-amber-400">
                                {money(r.total_amount_c)}
                              </td>
                              <td className="py-2.5 pr-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedRecordForDetails(r)}
                                    className="btn-ghost-2 rounded-lg p-1.5 text-slate-300 hover:text-white hover:bg-surface-3 transition-colors"
                                    title="View Voucher Breakdown & Items"
                                  >
                                    <Eye className="h-4 w-4 text-brand-400" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleReprintSlip(r)}
                                    disabled={isReprintingThis}
                                    className="btn-ghost-2 rounded-lg p-1.5 text-slate-300 hover:text-white hover:bg-surface-3 transition-colors"
                                    title="Reprint 58mm/80mm Thermal Slip"
                                  >
                                    <Printer className={`h-4 w-4 ${isReprintingThis ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Itemized Details Dialog */}
      {selectedRecordForDetails && (
        <StoreUseDetailsModal
          record={selectedRecordForDetails}
          onClose={() => setSelectedRecordForDetails(null)}
          onReprint={handleReprintSlip}
        />
      )}
    </>
  )
}
