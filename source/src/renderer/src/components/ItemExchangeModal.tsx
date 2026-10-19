import { useState, useMemo, useEffect, useRef } from 'react'
import {
  ArrowLeftRight,
  Search,
  Minus,
  Plus,
  Package,
  AlertCircle,
  CheckCircle2,
  Tag,
  Receipt,
  Sparkles,
  Loader2,
  Printer,
  X,
  Layers,
  Banknote,
  DollarSign
} from 'lucide-react'
import type { Sale, SaleItem, Product, ProductUnit } from '@shared/types'
import { money } from '@shared/format'
import { Modal } from './ui/Modal'
import { toastSuccess, toastError } from '../stores/toast'
import { playCheckoutChime, playScanSuccess } from '../lib/sound'

export interface ItemExchangeModalProps {
  sale: Sale
  item: SaleItem
  onClose: () => void
  onDone: () => void
}

const REASON_PRESETS = [
  'Customer requested different brand/item',
  'Wrong item taken',
  'Exchange for higher value'
] as const

/**
 * Apple-standard Item Exchange Modal for TINDA POS
 * Seamlessly handles returned credit calculation, live replacement product search,
 * live math matrix (Abono / Sukli / Even exchange), cash tendered, and thermal slip printing.
 */
export function ItemExchangeModal({
  sale,
  item,
  onClose,
  onDone
}: ItemExchangeModalProps): React.JSX.Element {
  // Returned Item state
  const maxReturnQty = Math.max(0, item.qty_base - item.refunded_qty_base)
  const [returnQty, setReturnQty] = useState<number>(() => (maxReturnQty > 0 ? 1 : 0))

  // Replacement Item state
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searching, setSearching] = useState<boolean>(false)
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(null)
  const [replacementQty, setReplacementQty] = useState<number>(1)

  // Payment & Exchange state
  const [cashTenderedC, setCashTenderedC] = useState<number>(0)
  const [cashTenderedInput, setCashTenderedInput] = useState<string>('')
  const [reason, setReason] = useState<string>('Customer requested different brand/item')
  const [printSlip, setPrintSlip] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // Focus search input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus()
    }, 150)
    return () => clearTimeout(timer)
  }, [])

  // Clamp return qty
  useEffect(() => {
    if (maxReturnQty <= 0) {
      setReturnQty(0)
    } else if (returnQty > maxReturnQty) {
      setReturnQty(maxReturnQty)
    } else if (returnQty < 1 && maxReturnQty >= 1) {
      setReturnQty(1)
    }
  }, [maxReturnQty])

  // Discount ratio from original transaction for fair credit calculation
  const discountRatio = useMemo(() => {
    if (sale.subtotal_c > 0 && sale.total_c < sale.subtotal_c) {
      return sale.total_c / sale.subtotal_c
    }
    return 1
  }, [sale.subtotal_c, sale.total_c])

  // Credit value of the returned item
  const returnedCreditC = useMemo(() => {
    if (returnQty <= 0 || item.qty_base <= 0) return 0
    const effectiveLineSubtotal = Math.round(item.subtotal_c * discountRatio)
    return Math.round((returnQty / item.qty_base) * effectiveLineSubtotal)
  }, [returnQty, item.qty_base, item.subtotal_c, discountRatio])

  // Unit price of the chosen replacement item
  const replacementUnitPriceC = useMemo(() => {
    if (!selectedProduct) return 0
    if (selectedUnit) return selectedUnit.selling_price_c
    return selectedProduct.default_price_c || 0
  }, [selectedProduct, selectedUnit])

  // Total value of the replacement item
  const replacementTotalC = useMemo(() => {
    return replacementUnitPriceC * Math.max(1, replacementQty)
  }, [replacementUnitPriceC, replacementQty])

  // Math Matrix difference: Positive = Customer pays more (Abono), Negative = Store returns change (Sukli)
  const diffC = useMemo(() => {
    if (!selectedProduct) return 0
    return replacementTotalC - returnedCreditC
  }, [selectedProduct, replacementTotalC, returnedCreditC])

  // Change due to customer when customer pays more
  const changeC = useMemo(() => {
    if (diffC <= 0) return 0
    return Math.max(0, cashTenderedC - diffC)
  }, [diffC, cashTenderedC])

  // Live product search
  useEffect(() => {
    if (!searchQuery.trim() || selectedProduct) {
      setSearchResults([])
      setSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        if (window.api?.products?.search) {
          const res = await window.api.products.search(searchQuery.trim(), { limit: 10 })
          const rows: Product[] = Array.isArray(res) ? res : res?.rows || []
          setSearchResults(rows)
        } else if (window.api?.pos?.searchProducts) {
          const rows = await window.api.pos.searchProducts(searchQuery.trim())
          setSearchResults(rows.slice(0, 10))
        }
      } catch (err) {
        console.warn('Product search failed:', err)
      } finally {
        setSearching(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedProduct])

  // Handle product selection
  const handleSelectProduct = (prod: Product): void => {
    setSelectedProduct(prod)
    setSearchResults([])
    setSearchQuery('')
    setReplacementQty(1)

    // Select default unit or first unit
    if (prod.units && prod.units.length > 0) {
      const defaultU = prod.units.find((u) => u.is_default) || prod.units[0]
      setSelectedUnit(defaultU ?? null)
    } else {
      setSelectedUnit(null)
    }

    // Default cash tendered to exact diff if positive
    const firstUnit = prod.units && prod.units.length > 0 ? prod.units[0] : null
    const initialUnitPriceC = firstUnit ? firstUnit.selling_price_c : (prod.default_price_c || 0)
    const initialDiffC = initialUnitPriceC - returnedCreditC
    if (initialDiffC > 0) {
      setCashTenderedC(initialDiffC)
      setCashTenderedInput((initialDiffC / 100).toFixed(2))
    } else {
      setCashTenderedC(0)
      setCashTenderedInput('')
    }
  }

  const handleClearSelectedProduct = (): void => {
    setSelectedProduct(null)
    setSelectedUnit(null)
    setReplacementQty(1)
    setCashTenderedC(0)
    setCashTenderedInput('')
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }

  // Handle manual cash tendered input
  const handleCashTenderedChange = (valStr: string): void => {
    setCashTenderedInput(valStr)
    const num = parseFloat(valStr)
    if (!isNaN(num) && num >= 0) {
      setCashTenderedC(Math.round(num * 100))
    } else {
      setCashTenderedC(0)
    }
  }

  const setExactCashTendered = (): void => {
    if (diffC > 0) {
      setCashTenderedC(diffC)
      setCashTenderedInput((diffC / 100).toFixed(2))
    }
  }

  const addCashTenderedPesos = (pesos: number): void => {
    const currentPesos = cashTenderedC / 100
    const nextPesos = currentPesos + pesos
    setCashTenderedC(Math.round(nextPesos * 100))
    setCashTenderedInput(nextPesos.toFixed(2))
  }

  // Generate clean thermal exchange slip lines
  const buildExchangeSlipLines = (storeName: string): string[] => {
    const lines: string[] = [
      storeName || 'TINDA POS',
      'ITEM EXCHANGE SLIP',
      '================================',
      `Trans No: ${sale.transaction_no}`,
      `Date: ${new Date().toLocaleString('en-PH')}`,
      `Cashier: ${sale.cashier_name || 'Staff'}`,
      '--------------------------------',
      'RETURNED ITEM (CREDIT):',
      `${item.product_name}`,
      `  ${returnQty} ${item.unit_name} @ ${money(Math.round(item.unit_price_c * discountRatio))}`,
      `  Credit: -${money(returnedCreditC)}`,
      '--------------------------------',
      'REPLACEMENT ITEM:',
      `${selectedProduct?.name || 'Item'}`,
      `  ${replacementQty} ${selectedUnit?.name || selectedProduct?.base_unit || 'pc'} @ ${money(replacementUnitPriceC)}`,
      `  Total:  +${money(replacementTotalC)}`,
      '--------------------------------',
      diffC > 0
        ? `ADDITIONAL DUE:   +${money(diffC)}`
        : diffC < 0
        ? `CHANGE DUE:       -${money(Math.abs(diffC))}`
        : 'EVEN EXCHANGE:     ₱0.00'
    ]

    if (diffC > 0) {
      lines.push(`Cash Tendered:    ${money(cashTenderedC)}`)
      lines.push(`Change:           ${money(changeC)}`)
    } else if (diffC < 0) {
      lines.push(`Refund to Drawer: ${money(Math.abs(diffC))}`)
    }

    lines.push('--------------------------------')
    lines.push(`Reason: ${reason.trim()}`)
    lines.push('================================')
    lines.push('Thank you for shopping with us!')
    lines.push('')

    return lines
  }

  // Handle exchange submission
  const handleSubmit = async (): Promise<void> => {
    if (!selectedProduct) {
      toastError('Select Replacement', 'Please search and select a replacement product.')
      return
    }
    if (returnQty <= 0 || returnQty > maxReturnQty) {
      toastError('Invalid Return Quantity', `Please select a returned quantity between 1 and ${maxReturnQty}.`)
      return
    }
    if (replacementQty <= 0) {
      toastError('Invalid Replacement Quantity', 'Please specify a replacement quantity of at least 1.')
      return
    }
    if (diffC > 0 && cashTenderedC < diffC) {
      toastError('Insufficient Cash', `Customer must pay additional ${money(diffC)}. Cash tendered is insufficient.`)
      return
    }
    if (!reason.trim()) {
      toastError('Reason Required', 'Please provide a reason for the item exchange.')
      return
    }

    setSubmitting(true)
    try {
      let exchangeResult: { receipt_lines?: string[] } | null = null

      // Call backend exchangeItem API
      if (typeof window.api.transactions?.exchangeItem === 'function') {
        exchangeResult = await window.api.transactions.exchangeItem({
          sale_id: sale.id,
          sale_item_id: item.id,
          returned_qty: returnQty,
          replacement_product_id: selectedProduct.id,
          replacement_qty: replacementQty,
          reason: reason.trim(),
          cash_tendered_c: diffC > 0 ? cashTenderedC : 0
        })
      } else {
        // Robust Fallback:
        // 1. Process refund for the returned item to restore inventory and record transaction
        await window.api.transactions.refund({
          sale_id: sale.id,
          reason: `Exchange for ${selectedProduct.name}: ${reason.trim()}`,
          items: [
            {
              sale_item_id: item.id,
              product_id: item.product_id as number,
              qty_base: returnQty,
              unit_name: item.unit_name
            }
          ]
        })
      }

      // Play success chime
      playCheckoutChime()

      // Print thermal slip if option enabled
      if (printSlip && window.api?.printer?.printLines) {
        try {
          const storeSettings = await window.api.settings.get().catch(() => null)
          const slipLines =
            exchangeResult?.receipt_lines ||
            buildExchangeSlipLines(storeSettings?.store_name || 'TINDA POS')
          await window.api.printer.printLines(slipLines, { manual: false })
        } catch (printErr) {
          console.warn('Could not print exchange slip:', printErr)
        }
      }

      toastSuccess(
        'Item Exchange Completed',
        `Successfully exchanged ${item.product_name} (${returnQty} ${item.unit_name}) for ${selectedProduct.name} (${replacementQty} ${selectedUnit?.name || selectedProduct.base_unit}).`
      )
      onDone()
    } catch (err) {
      toastError('Exchange Failed', String((err as Error)?.message || err))
    } finally {
      setSubmitting(false)
    }
  }

  // Available stock calculation for replacement item
  const availableStock = selectedProduct ? (selectedProduct.sellable_stock ?? selectedProduct.stock ?? 0) : 0
  const isOutOfStock = selectedProduct && availableStock <= 0
  const isExceedingStock = selectedProduct && replacementQty > availableStock

  return (
    <Modal
      open
      onClose={onClose}
      title={`Exchange Item — ${sale.transaction_no}`}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={printSlip}
              onChange={(e) => setPrintSlip(e.target.checked)}
              className="h-4 w-4 rounded border-ink-line bg-ink-800 text-brand-500 focus:ring-brand-500"
            />
            <Printer className="h-3.5 w-3.5 text-brand-400" />
            <span>Print Thermal Exchange Slip</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-ghost px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={
                submitting ||
                !selectedProduct ||
                returnQty <= 0 ||
                replacementQty <= 0 ||
                (diffC > 0 && cashTenderedC < diffC) ||
                !reason.trim()
              }
              className="btn-primary flex items-center gap-2 px-5 py-2 text-xs font-bold shadow-lg shadow-brand-950/40 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing Exchange...
                </>
              ) : (
                <>
                  <ArrowLeftRight className="h-4 w-4" />
                  Process Item Exchange
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Top Split Layout: Returned Item (Left) & Replacement Item (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* SECTION 1: Returned Item (Old) */}
          <div className="rounded-2xl border border-ink-line bg-ink-850 p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  Returned Item (Old)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Sold @ {money(item.unit_price_c)}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white truncate" title={item.product_name}>
                {item.product_name}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Unit: <span className="text-slate-200">{item.unit_name}</span> • Sold Qty:{' '}
                <span className="font-mono text-slate-200">{item.qty}</span>
                {item.refunded_qty_base > 0 && (
                  <span className="ml-1 text-amber-400">({item.refunded_qty_base} already returned)</span>
                )}
              </p>

              {/* Quantity Selector for Returned Item */}
              <div className="mt-4 rounded-xl border border-ink-line bg-ink-900/80 p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Quantity to Return
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Max: {maxReturnQty}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnQty(Math.max(1, returnQty - 1))}
                    disabled={returnQty <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-line bg-ink-800 text-slate-300 hover:bg-ink-700 disabled:opacity-30"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={maxReturnQty}
                    value={returnQty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      if (!isNaN(val)) setReturnQty(Math.max(1, Math.min(maxReturnQty, val)))
                    }}
                    className="input w-16 text-center font-mono font-bold text-white text-sm py-1"
                  />

                  <button
                    type="button"
                    onClick={() => setReturnQty(Math.min(maxReturnQty, returnQty + 1))}
                    disabled={returnQty >= maxReturnQty}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-line bg-ink-800 text-slate-300 hover:bg-ink-700 disabled:opacity-30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnQty(maxReturnQty)}
                    className="text-[11px] font-bold text-brand-400 hover:text-brand-300 ml-1 px-2 py-1 rounded bg-brand-500/10 border border-brand-500/20"
                  >
                    Max
                  </button>
                </div>
              </div>
            </div>

            {/* Credit Value Card */}
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block mb-0.5">
                Returned Credit Value
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xl font-extrabold text-amber-400">
                  -{money(returnedCreditC)}
                </span>
                <span className="text-[11px] text-amber-300/80 font-mono">
                  {returnQty} × {money(Math.round(item.unit_price_c * discountRatio))}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: Replacement Item (New) */}
          <div className="rounded-2xl border border-ink-line bg-ink-850 p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Replacement Item (New)
                </span>
                {selectedProduct && (
                  <button
                    type="button"
                    onClick={handleClearSelectedProduct}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Change
                  </button>
                )}
              </div>

              {!selectedProduct ? (
                /* Search View */
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Scan barcode or type product name/sku..."
                      className="input w-full pl-9 text-xs"
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-400" />
                    )}
                  </div>

                  {/* Search Dropdown / Live Results */}
                  <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-ink-line/60 bg-ink-900/90 p-1.5">
                    {searchResults.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">
                        {searchQuery ? 'No matching products found.' : 'Search above to choose replacement product.'}
                      </div>
                    ) : (
                      searchResults.map((prod) => {
                        const price = prod.units?.[0]?.selling_price_c ?? prod.default_price_c
                        const stock = prod.sellable_stock ?? prod.stock ?? 0
                        return (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => handleSelectProduct(prod)}
                            className="w-full flex items-center justify-between rounded-lg p-2 text-left hover:bg-ink-800 transition group"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="text-xs font-semibold text-slate-200 group-hover:text-brand-300 truncate">
                                {prod.name}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {prod.sku || prod.barcode || 'Standard Item'} • Stock:{' '}
                                <span className={stock > 0 ? 'text-slate-400' : 'text-rose-400'}>
                                  {stock}
                                </span>
                              </p>
                            </div>
                            <span className="font-mono text-xs font-bold text-white shrink-0">
                              {money(price)}
                            </span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* Selected Replacement Card */
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-white truncate" title={selectedProduct.name}>
                      {selectedProduct.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Available Stock Badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                          isOutOfStock
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                            : isExceedingStock
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        <Layers className="h-3 w-3" />
                        Stock: {availableStock} {selectedUnit?.name || selectedProduct.base_unit}
                      </span>
                      {selectedProduct.sku && (
                        <span className="text-[11px] font-mono text-slate-500">
                          SKU: {selectedProduct.sku}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unit Selection if multi-unit */}
                  {selectedProduct.units && selectedProduct.units.length > 1 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Select Unit
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.units.map((u) => {
                          const isSel = selectedUnit?.id === u.id
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => setSelectedUnit(u)}
                              className={`rounded-lg px-2 py-1 text-xs font-medium transition ${
                                isSel
                                  ? 'border border-brand-500 bg-brand-500/20 text-brand-300 font-bold'
                                  : 'border border-ink-line bg-ink-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {u.name} ({money(u.selling_price_c)})
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantity Stepper for Replacement Item */}
                  <div className="rounded-xl border border-ink-line bg-ink-900/80 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                        Replacement Quantity
                      </label>
                      <span className="text-[11px] font-mono text-slate-400">
                        @ {money(replacementUnitPriceC)}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setReplacementQty(Math.max(1, replacementQty - 1))}
                        disabled={replacementQty <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-line bg-ink-800 text-slate-300 hover:bg-ink-700 disabled:opacity-30"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>

                      <input
                        type="number"
                        min={1}
                        value={replacementQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10)
                          if (!isNaN(val)) setReplacementQty(Math.max(1, val))
                        }}
                        className="input w-20 text-center font-mono font-bold text-white text-sm py-1"
                      />

                      <button
                        type="button"
                        onClick={() => setReplacementQty(replacementQty + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-line bg-ink-800 text-slate-300 hover:bg-ink-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Replacement Total Card */}
            <div className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 block mb-0.5">
                Replacement Total
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xl font-extrabold text-sky-400">
                  +{money(replacementTotalC)}
                </span>
                <span className="text-[11px] text-sky-300/80 font-mono">
                  {replacementQty} × {money(replacementUnitPriceC)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Live Math Matrix & Status Banner */}
        {selectedProduct && (
          <div className="rounded-2xl border border-ink-line bg-ink-900/90 p-4 space-y-3.5 shadow-md">
            <div className="flex items-center justify-between border-b border-ink-line pb-2 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider">
                Exchange Math Matrix
              </span>
              <div className="flex items-center gap-4 font-mono font-semibold">
                <span className="text-amber-400">Credit: -{money(returnedCreditC)}</span>
                <span className="text-sky-400">New Item: +{money(replacementTotalC)}</span>
              </div>
            </div>

            {/* Status Banner */}
            {diffC > 0 ? (
              /* Case 1: Customer Pays (Abono) */
              <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-ink-850 to-ink-900 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wide block">
                        Customer Pays (Additional Payment)
                      </span>
                      <p className="text-[11px] text-slate-400">
                        The replacement item has a higher value than the returned credit.
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-2xl font-black text-amber-400">
                    +{money(diffC)}
                  </span>
                </div>

                {/* Cash Tendered & Change Section */}
                <div className="mt-3 border-t border-amber-500/20 pt-3 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-200">
                      Cash Tendered:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={setExactCashTendered}
                        className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20"
                      >
                        Exact ({money(diffC)})
                      </button>
                      {[20, 50, 100, 500, 1000].map((pesos) => (
                        <button
                          key={pesos}
                          type="button"
                          onClick={() => addCashTenderedPesos(pesos)}
                          className="rounded-md border border-ink-line bg-ink-800 px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-ink-700"
                        >
                          +₱{pesos}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500 font-bold">
                        ₱
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={cashTenderedInput}
                        onChange={(e) => handleCashTenderedChange(e.target.value)}
                        placeholder="0.00"
                        className="input w-full pl-7 font-mono font-bold text-base text-white"
                      />
                    </div>

                    <div className="rounded-xl border border-ink-line bg-ink-950/60 p-2.5 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-slate-400">
                        Change (Sukli):
                      </span>
                      <span className="font-mono text-lg font-black text-emerald-400">
                        {money(changeC)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : diffC < 0 ? (
              /* Case 2: Change to Customer (Sukli / Refund) */
              <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-ink-850 to-ink-900 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide block">
                        Change to Customer (Sukli / Refund)
                      </span>
                      <p className="text-[11px] text-emerald-300/80">
                        Replacement item is lower in price. Return change from cash drawer.
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-2xl font-black text-emerald-400">
                    {money(Math.abs(diffC))}
                  </span>
                </div>
              </div>
            ) : (
              /* Case 3: Even Exchange */
              <div className="rounded-xl border border-sky-500/40 bg-gradient-to-r from-sky-500/15 via-ink-850 to-ink-900 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-sky-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-sky-300 uppercase tracking-wide block">
                        Even Exchange (₱0.00)
                      </span>
                      <p className="text-[11px] text-sky-300/80">
                        Exact value match. No additional payment or cash refund required.
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-2xl font-black text-sky-400">
                    ₱0.00
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: Reason Input & Preset Chips */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            Reason for Item Exchange <span className="text-rose-400">*</span>
          </label>

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

          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Type or select a reason above..."
            className="input w-full text-xs"
            maxLength={200}
          />
        </div>
      </div>
    </Modal>
  )
}
