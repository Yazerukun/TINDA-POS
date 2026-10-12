import { useState, useEffect, useRef, useMemo } from 'react'
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Search,
  Truck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Barcode,
  Sparkles,
  History,
  X,
  CreditCard,
  Building,
  RefreshCw,
  Hash,
  Percent,
  Tag,
  Layers
} from 'lucide-react'
import type { Product, Supplier, Purchase, ProductUnit } from '@shared/types'
import { money, moneyWholePesos, shortDate } from '@shared/format'
import { Modal } from './ui/Modal'
import { toastSuccess, toastError } from '../stores/toast'
import { playScanBeep } from '../lib/barcodeScanner'
import { calculateChainDiscount } from '../utils/supplierDiscount'

interface PurchaseInvoiceModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export const STANDARD_PACKAGING_UNITS: { name: string; label: string; defaultConversion: number }[] = [
  { name: 'pc', label: 'PCS (Piece)', defaultConversion: 1 },
  { name: 'pack', label: 'PACK (Pack)', defaultConversion: 10 },
  { name: 'bundle', label: 'BUNDLE (Bundle)', defaultConversion: 10 },
  { name: 'roll', label: 'ROLL (Roll)', defaultConversion: 1 },
  { name: 'box', label: 'BOX (Box)', defaultConversion: 24 },
  { name: 'case', label: 'CASE (Case)', defaultConversion: 24 },
  { name: 'dozen', label: 'DOZEN (Dozen)', defaultConversion: 12 },
  { name: 'sack', label: 'SACK (Sack / Bag)', defaultConversion: 50 },
  { name: 'can', label: 'CAN (Can / Lata)', defaultConversion: 1 },
  { name: 'bottle', label: 'BOTTLE (Bottle / Botelya)', defaultConversion: 1 },
  { name: 'kilo', label: 'KILO (Kilogram)', defaultConversion: 1 },
  { name: 'custom', label: 'CUSTOM (Other)', defaultConversion: 1 }
]

interface InvoiceLineItem {
  tempId: string
  productId: number
  productName: string
  barcode: string
  sku: string
  unitName: string
  conversionToBase: number
  qty: number
  qtyBase: number
  unitCostC: number      // gross unit cost
  discountInput: string  // chain discount formula e.g. "5+5+5"
  discountC: number      // calculated discount in cents
  netUnitCostC: number   // effective unit cost after discount
  subtotalC: number      // net line subtotal in cents
}

export function PurchaseInvoiceModal({
  open,
  onClose,
  onSuccess
}: PurchaseInvoiceModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loadingInitial, setLoadingInitial] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Invoice Header Fields
  const [supplierId, setSupplierId] = useState<number | ''>('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [receiptNo, setReceiptNo] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isPaid, setIsPaid] = useState(true)
  const [termsDays, setTermsDays] = useState('0')
  const [notes, setNotes] = useState('')
  const [updateProductCosts, setUpdateProductCosts] = useState(true)
  const [discountPesos, setDiscountPesos] = useState('0')

  // Item Entry Bar Fields
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedUnitName, setSelectedUnitName] = useState('')
  const [unitMultiplierInput, setUnitMultiplierInput] = useState('1')
  const [customUnitName, setCustomUnitName] = useState('')
  const [qtyInput, setQtyInput] = useState('1')
  const [unitCostPesos, setUnitCostPesos] = useState('0')
  const [itemDiscountInput, setItemDiscountInput] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownIndex, setDropdownIndex] = useState(0)

  // Line items
  const [items, setItems] = useState<InvoiceLineItem[]>([])

  // History Tab state
  const [historyList, setHistoryList] = useState<Purchase[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedHistoryPurchase, setSelectedHistoryPurchase] = useState<Purchase | null>(null)

  // Refs for keyboard focus navigation
  const searchInputRef = useRef<HTMLInputElement>(null)
  const qtyInputRef = useRef<HTMLInputElement>(null)
  const costInputRef = useRef<HTMLInputElement>(null)
  const discountInputRef = useRef<HTMLInputElement>(null)
  const unitSelectRef = useRef<HTMLSelectElement>(null)

  // Selected supplier details
  const currentSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === Number(supplierId)) || null
  }, [suppliers, supplierId])

  // Load initial data
  const loadData = async () => {
    setLoadingInitial(true)
    try {
      const [supList, prodRes] = await Promise.all([
        window.api.suppliers.list(),
        window.api.products.search('', { status: 'ACTIVE', limit: 2000 })
      ])
      setSuppliers(supList)
      setAllProducts(prodRes.rows)
      if (supList.length > 0 && !supplierId) {
        const firstSup = supList[0]
        if (firstSup) setSupplierId(firstSup.id)
      }
    } catch (err) {
      toastError('Failed to load purchase invoice data', String((err as Error)?.message || err))
    } finally {
      setLoadingInitial(false)
    }
  }

  // Load history
  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await window.api.purchases.list({ limit: 50 })
      setHistoryList(res.rows)
    } catch (err) {
      toastError('Failed to load purchase history', String((err as Error)?.message || err))
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      void loadData()
      if (activeTab === 'history') {
        void loadHistory()
      }
    }
  }, [open, activeTab])

  // Focus search when modal opens
  useEffect(() => {
    if (open && activeTab === 'create') {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open, activeTab])

  // Available units for the selected product: base unit, configured units, and standard packaging units
  const availableUnits = useMemo(() => {
    if (!selectedProduct) return []
    const units: { name: string; label: string; conversionToBase: number }[] = [
      {
        name: selectedProduct.base_unit || 'pc',
        label: `${(selectedProduct.base_unit || 'pc').toUpperCase()} (Base Unit)`,
        conversionToBase: 1
      }
    ]

    // 1. Existing configured multi-units on this product
    if (selectedProduct.units && selectedProduct.units.length > 0) {
      for (const u of selectedProduct.units) {
        if (!units.some((existing) => existing.name.toLowerCase() === u.name.toLowerCase())) {
          units.push({
            name: u.name,
            label: `${u.name.toUpperCase()} (x${u.conversion_to_base || 1} ${selectedProduct.base_unit || 'pc'})`,
            conversionToBase: u.conversion_to_base || 1
          })
        }
      }
    }

    // 2. Standard wholesale packaging units (PACK, BUNDLE, ROLL, BOX, CASE, DOZEN, SACK, etc.)
    for (const std of STANDARD_PACKAGING_UNITS) {
      if (!units.some((existing) => existing.name.toLowerCase() === std.name.toLowerCase())) {
        units.push({
          name: std.name,
          label: std.label,
          conversionToBase: std.defaultConversion
        })
      }
    }

    return units
  }, [selectedProduct])

  // Filtered products for dropdown suggestions
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return allProducts
      .filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q)
        const codeMatch = (p.barcode || '').toLowerCase().includes(q)
        const skuMatch = (p.sku || '').toLowerCase().includes(q)
        const unitMatch = p.units?.some((u) => (u.barcode || '').toLowerCase().includes(q))
        return nameMatch || codeMatch || skuMatch || unitMatch
      })
      .slice(0, 10)
  }, [allProducts, searchQuery])

  // Product Selection Handler
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    setSearchQuery(product.name)
    setShowDropdown(false)

    // Select default unit
    const defaultUnit = product.units?.find((u) => u.is_default)?.name || product.base_unit || 'pc'
    setSelectedUnitName(defaultUnit)
    setCustomUnitName('')

    // Default conversion multiplier
    const unitObj = product.units?.find((u) => u.name.toLowerCase() === defaultUnit.toLowerCase())
    const conversion = unitObj?.conversion_to_base || 1
    setUnitMultiplierInput(String(conversion))

    // Calculate default cost
    const costInPesos = ((product.purchase_cost_c * conversion) / 100).toFixed(2)
    setUnitCostPesos(costInPesos)

    setQtyInput('1')
    setItemDiscountInput('')

    // Ergonomic focus directly to Qty Box!
    setTimeout(() => {
      if (qtyInputRef.current) {
        qtyInputRef.current.focus()
        qtyInputRef.current.select()
      }
    }, 50)
  }

  // Unit Change Handler
  const handleUnitChange = (newUnitName: string) => {
    setSelectedUnitName(newUnitName)
    if (!selectedProduct) return

    let conversion = 1
    const foundConfig = selectedProduct.units?.find((u) => u.name.toLowerCase() === newUnitName.toLowerCase())
    if (foundConfig?.conversion_to_base) {
      conversion = foundConfig.conversion_to_base
    } else {
      const std = STANDARD_PACKAGING_UNITS.find((u) => u.name.toLowerCase() === newUnitName.toLowerCase())
      if (std) conversion = std.defaultConversion
    }

    setUnitMultiplierInput(String(conversion))
    const costInPesos = ((selectedProduct.purchase_cost_c * conversion) / 100).toFixed(2)
    setUnitCostPesos(costInPesos)
  }

  // Multiplier / Conversion Rate Handler (e.g. 10 pcs per bundle)
  const handleMultiplierChange = (val: string) => {
    setUnitMultiplierInput(val)
    if (!selectedProduct) return
    const mult = Math.max(0.001, parseFloat(val) || 1)
    const costInPesos = ((selectedProduct.purchase_cost_c * mult) / 100).toFixed(2)
    setUnitCostPesos(costInPesos)
  }

  // Live Item Gross & Trade Discount Evaluation
  const itemGrossC = useMemo(() => {
    const qty = parseFloat(qtyInput) || 0
    const cost = parseFloat(unitCostPesos) || 0
    return Math.round(qty * cost * 100)
  }, [qtyInput, unitCostPesos])

  const itemDiscountResult = useMemo(() => {
    return calculateChainDiscount(itemGrossC, itemDiscountInput)
  }, [itemGrossC, itemDiscountInput])

  // COMMIT ITEM TO GRID (F2 or Enter in Qty/Discount box)
  const handleCommitItem = () => {
    if (!selectedProduct) {
      toastError('Item Required', 'Please choose or scan a product first.')
      searchInputRef.current?.focus()
      return
    }

    const qty = parseFloat(qtyInput)
    if (isNaN(qty) || qty <= 0) {
      toastError('Invalid Quantity', 'Please enter a valid quantity greater than 0.')
      qtyInputRef.current?.focus()
      return
    }

    const unitCost = parseFloat(unitCostPesos)
    if (isNaN(unitCost) || unitCost < 0) {
      toastError('Invalid Cost', 'Please enter a valid unit cost.')
      costInputRef.current?.focus()
      return
    }

    const mult = Math.max(0.001, parseFloat(unitMultiplierInput) || 1)
    const effectiveUnitName =
      selectedUnitName === 'custom' && customUnitName.trim()
        ? customUnitName.trim()
        : selectedUnitName || selectedProduct.base_unit || 'pc'

    const qtyBase = Math.round(qty * mult * 1000) / 1000
    const unitCostC = Math.round(unitCost * 100)
    const grossSubtotalC = Math.round(qty * unitCostC)

    // Evaluate trade discount on this line (supports "-5%-5%-5%", "10/5", "5+5+5", "₱50", etc.)
    const lineDiscount = calculateChainDiscount(grossSubtotalC, itemDiscountInput)
    const discountC = lineDiscount.discountAmountC
    const subtotalC = Math.max(0, grossSubtotalC - discountC)
    const netUnitCostC = qty > 0 ? Math.round(subtotalC / qty) : unitCostC

    // Check if item with same product & unit already in grid
    const existingIndex = items.findIndex(
      (it) => it.productId === selectedProduct.id && it.unitName.toLowerCase() === effectiveUnitName.toLowerCase()
    )

    if (existingIndex >= 0) {
      // Update existing item
      const updated = [...items]
      const existing = updated[existingIndex]
      if (existing) {
        const newQty = existing.qty + qty
        const newQtyBase = Math.round(newQty * mult * 1000) / 1000
        const newGrossSubtotal = Math.round(newQty * unitCostC)
        const combinedFormula = itemDiscountInput.trim() || existing.discountInput
        const newDiscount = calculateChainDiscount(newGrossSubtotal, combinedFormula)
        const newSubtotal = Math.max(0, newGrossSubtotal - newDiscount.discountAmountC)
        updated[existingIndex] = {
          ...existing,
          qty: newQty,
          qtyBase: newQtyBase,
          unitCostC,
          discountInput: combinedFormula,
          discountC: newDiscount.discountAmountC,
          netUnitCostC: newQty > 0 ? Math.round(newSubtotal / newQty) : unitCostC,
          subtotalC: newSubtotal
        }
        setItems(updated)
      }
    } else {
      // Append new item
      const newItem: InvoiceLineItem = {
        tempId: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        barcode: selectedProduct.barcode || selectedProduct.sku || '—',
        sku: selectedProduct.sku,
        unitName: effectiveUnitName,
        conversionToBase: mult,
        qty,
        qtyBase,
        unitCostC,
        discountInput: itemDiscountInput.trim(),
        discountC,
        netUnitCostC,
        subtotalC
      }
      setItems([...items, newItem])
    }

    playScanBeep()

    // Reset item entry bar
    setSelectedProduct(null)
    setSearchQuery('')
    setQtyInput('1')
    setUnitCostPesos('0')
    setSelectedUnitName('')
    setUnitMultiplierInput('1')
    setCustomUnitName('')
    setItemDiscountInput('')
    setShowDropdown(false)

    // Focus back to Item Code / Search input for next item!
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 50)
  }

  // Remove Line Item (F3)
  const handleRemoveItem = (tempId: string) => {
    setItems((prev) => prev.filter((it) => it.tempId !== tempId))
  }

  // Remove Last Line Item
  const handleRemoveLastItem = () => {
    if (items.length > 0) {
      setItems((prev) => prev.slice(0, -1))
    }
  }

  // Math Calculations (including compound invoice trade discount)
  const grossTotalC = useMemo(() => {
    return items.reduce((sum, it) => sum + it.subtotalC, 0)
  }, [items])

  const invoiceDiscountResult = useMemo(() => {
    return calculateChainDiscount(grossTotalC, discountPesos)
  }, [grossTotalC, discountPesos])

  const discountC = invoiceDiscountResult.discountAmountC

  const netTotalC = useMemo(() => {
    return Math.max(0, grossTotalC - discountC)
  }, [grossTotalC, discountC])

  const totalBaseUnits = useMemo(() => {
    return items.reduce((sum, it) => sum + it.qtyBase, 0)
  }, [items])

  // Save / Post Purchase Invoice
  const handleSaveInvoice = async () => {
    if (!supplierId) {
      toastError('Supplier Missing', 'Please select a supplier for this invoice.')
      return
    }

    if (items.length === 0) {
      toastError('Empty Invoice', 'Please add at least one item before saving.')
      searchInputRef.current?.focus()
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        supplier_id: Number(supplierId),
        purchase_date: purchaseDate || new Date().toISOString().split('T')[0] || '2026-01-01',
        invoice_no: invoiceNo.trim() || null,
        receipt_no: receiptNo.trim() || null,
        reference: invoiceNo.trim() || receiptNo.trim() || null,
        is_paid: isPaid,
        terms_days: parseInt(termsDays, 10) || 0,
        discount_c: discountC,
        notes: notes.trim() || null,
        update_product_costs: updateProductCosts,
        items: items.map((it) => ({
          product_id: it.productId,
          unit_name: it.unitName,
          qty: it.qty,
          qty_base: it.qtyBase,
          unit_cost_c: it.unitCostC,
          subtotal_c: it.subtotalC
        }))
      }

      const res = await window.api.purchases.create(payload)

      toastSuccess(
        'Purchase Invoice Posted',
        `Invoice ${res.purchase_no} recorded! ${items.length} product(s) stock incremented.`
      )

      onSuccess()
      onClose()
    } catch (err) {
      toastError('Failed to Save Invoice', String((err as Error)?.message || err))
    } finally {
      setSubmitting(false)
    }
  }

  // Global Keyboard Shortcuts
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // F1: Focus Search/Item Code
      if (e.key === 'F1') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
        return
      }

      // F2: Commit Item (if product selected or entering qty)
      if (e.key === 'F2') {
        e.preventDefault()
        if (selectedProduct) {
          handleCommitItem()
        } else {
          // If no item staged and invoice has items, suggest save or focus
          if (items.length > 0) {
            void handleSaveInvoice()
          } else {
            searchInputRef.current?.focus()
          }
        }
        return
      }

      // F3: Remove Last Item
      if (e.key === 'F3') {
        e.preventDefault()
        handleRemoveLastItem()
        return
      }

      // F6: Barcode scan focus
      if (e.key === 'F6') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
        return
      }

      // Ctrl+S: Post Invoice
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void handleSaveInvoice()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedProduct, qtyInput, unitCostPesos, selectedUnitName, items, supplierId, invoiceNo, receiptNo, isPaid, termsDays, discountC, notes, updateProductCosts])

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      maxWidth="max-w-7xl"
      zIndex="z-50"
    >
      <div className="-mt-3 flex flex-col gap-4">
        {/* Header Tabs & Title */}
        <div className="flex flex-wrap items-center justify-between border-b border-ink-line pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Purchase Invoice</h2>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                  Batch Stock-In Receiving
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Receive vendor shipments, batch update stocks, and register supplier costs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-ink-line bg-ink-950 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === 'create'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                New Invoice
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('history')
                  void loadHistory()
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-ink-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                Invoices History
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'history' ? (
          /* HISTORY TAB */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Showing recent {historyList.length} purchase invoices
              </p>
              <button
                onClick={() => void loadHistory()}
                className="btn-ghost flex items-center gap-1.5 text-xs text-slate-300"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {historyLoading ? (
              <div className="space-y-2 py-8 text-center text-sm text-slate-400">
                Loading purchase invoices…
              </div>
            ) : historyList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-line p-10 text-center text-slate-500">
                No purchase invoices recorded yet. Click &quot;New Invoice&quot; to create one.
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-auto rounded-xl border border-ink-line">
                <table className="table min-w-[900px]">
                  <thead>
                    <tr>
                      <th className="py-2.5 px-3 text-left">P.O. Number</th>
                      <th className="py-2.5 px-3 text-left">Invoice #</th>
                      <th className="py-2.5 px-3 text-left">Receipt #</th>
                      <th className="py-2.5 px-3 text-left">Supplier</th>
                      <th className="py-2.5 px-3 text-center">Date</th>
                      <th className="py-2.5 px-3 text-center">Items</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Net Amount</th>
                      <th className="py-2.5 px-3 text-center">Encoder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedHistoryPurchase(p)}
                        className="cursor-pointer hover:bg-ink-800 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono font-semibold text-brand-300">
                          {p.purchase_no}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-white">
                          {p.invoice_no || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-slate-300">
                          {p.receipt_no || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-white truncate max-w-[200px]">
                          {p.supplier_name}
                        </td>
                        <td className="py-2.5 px-3 text-center text-xs text-slate-400">
                          {shortDate(p.purchase_date)}
                        </td>
                        <td className="py-2.5 px-3 text-center text-xs text-slate-300 font-mono">
                          {p.items?.length || 0}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`badge inline-flex items-center text-[10px] ${
                              p.is_paid
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {p.is_paid ? 'PAID' : `TERMS ${p.terms_days || 0}D`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400">
                          {money(p.net_total_c ?? p.total_c)}
                        </td>
                        <td className="py-2.5 px-3 text-center text-xs text-slate-400">
                          {p.user_name || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* History Details View Modal */}
            {selectedHistoryPurchase && (
              <Modal
                open
                onClose={() => setSelectedHistoryPurchase(null)}
                title={`Purchase Details: ${selectedHistoryPurchase.purchase_no}`}
                maxWidth="max-w-4xl"
                footer={
                  <button className="btn-ghost" onClick={() => setSelectedHistoryPurchase(null)}>
                    Close
                  </button>
                }
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 rounded-xl border border-ink-line bg-ink-950 p-3 text-xs">
                    <div>
                      <span className="text-slate-500">Supplier:</span>
                      <p className="font-semibold text-white">{selectedHistoryPurchase.supplier_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Invoice No:</span>
                      <p className="font-semibold text-white">{selectedHistoryPurchase.invoice_no || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Receipt No:</span>
                      <p className="font-semibold text-white">{selectedHistoryPurchase.receipt_no || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Date:</span>
                      <p className="font-semibold text-white">{shortDate(selectedHistoryPurchase.purchase_date)}</p>
                    </div>
                  </div>

                  <div className="max-h-[40vh] overflow-auto rounded-lg border border-ink-line">
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="py-2 px-3 text-left">Item Name</th>
                          <th className="py-2 px-3 text-center">Unit</th>
                          <th className="py-2 px-3 text-center">Qty</th>
                          <th className="py-2 px-3 text-center">Base Qty</th>
                          <th className="py-2 px-3 text-right">Unit Cost</th>
                          <th className="py-2 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedHistoryPurchase.items?.map((it, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-medium text-white">{it.product_name}</td>
                            <td className="py-2 px-3 text-center text-xs text-slate-300">{it.unit_name}</td>
                            <td className="py-2 px-3 text-center font-mono font-semibold">{it.qty}</td>
                            <td className="py-2 px-3 text-center font-mono text-xs text-slate-400">{it.qty_base}</td>
                            <td className="py-2 px-3 text-right font-mono text-xs">{money(it.unit_cost_c)}</td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-400">
                              {money(it.subtotal_c)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center bg-ink-900 rounded-lg p-3 border border-ink-line">
                    <span className="text-xs text-slate-400">
                      Total items: {selectedHistoryPurchase.items?.length || 0}
                    </span>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 mr-2">Total Amount:</span>
                      <span className="font-mono text-lg font-bold text-emerald-400">
                        {money(selectedHistoryPurchase.net_total_c ?? selectedHistoryPurchase.total_c)}
                      </span>
                    </div>
                  </div>
                </div>
              </Modal>
            )}
          </div>
        ) : (
          /* CREATE INVOICE WORKFLOW */
          <>
            {/* 1. Header Information Panel (Supplier & Invoice Metadata) */}
            <div className="rounded-xl border border-ink-line bg-ink-950/70 p-4 backdrop-blur shadow-sm space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {/* Supplier Picker */}
                <div className="md:col-span-2">
                  <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-emerald-400" />
                      Supplier <span className="text-danger-400">*</span>
                    </span>
                    {currentSupplier?.address && (
                      <span className="truncate max-w-[200px] text-[11px] font-normal text-slate-400">
                        {currentSupplier.address}
                      </span>
                    )}
                  </label>
                  <select
                    className="input w-full font-medium"
                    value={supplierId}
                    onChange={(e) => setSupplierId(Number(e.target.value))}
                  >
                    <option value="">— Select Supplier —</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.contact_person ? `(${s.contact_person})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Receipt Number (VIP requested) */}
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-300">
                    <Hash className="h-3.5 w-3.5 text-sky-400" />
                    Receipt No.
                  </label>
                  <input
                    type="text"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    placeholder="e.g. SI0000002966"
                    className="input w-full font-mono text-xs uppercase"
                  />
                </div>

                {/* Invoice Number / Transaction # (VIP requested) */}
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-300">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-amber-400" />
                    Invoice No. / Trans #
                  </label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="e.g. BS-2024-017"
                    className="input w-full font-mono text-xs uppercase"
                  />
                </div>
              </div>

              {/* Second row of meta */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 items-center pt-1 border-t border-ink-line/60">
                {/* Date */}
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="input w-full text-xs"
                  />
                </div>

                {/* Payment Status & Terms */}
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-400">
                    <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                    Payment Status
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-white">
                      <input
                        type="checkbox"
                        checked={isPaid}
                        onChange={(e) => setIsPaid(e.target.checked)}
                        className="rounded border-ink-line bg-ink-800 text-emerald-500 focus:ring-0"
                      />
                      <span>Paid</span>
                    </label>
                    {!isPaid && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={termsDays}
                          onChange={(e) => setTermsDays(e.target.value)}
                          placeholder="Days"
                          className="input w-16 py-0.5 text-xs font-mono text-center"
                        />
                        <span className="text-[11px] text-slate-400">Days</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Memo / Notes */}
                <div className="md:col-span-2">
                  <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-400">
                    Memo / Delivery Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. CUS.BOOKING / Van delivery / Supplier rep"
                    className="input w-full text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 2. FAST ITEM ENTRY BAR (VIP: Arrow point to Qty box then F2 mapupunta sa stocks sya) */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Barcode className="h-4 w-4 text-emerald-400" />
                  Fast Item Entry
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300 font-mono">
                    F1 to search · F2 in Qty to commit
                  </span>
                </span>
                {selectedProduct && (
                  <span className="text-xs text-slate-300">
                    Current Stock: <strong className="font-mono text-white">{selectedProduct.stock} {selectedProduct.base_unit}</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-12 items-end">
                {/* Search / Barcode Input (F1) */}
                <div className="relative md:col-span-3">
                  <label className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-300">
                    <span>Item Code / Barcode / Name</span>
                    <kbd className="rounded bg-ink-800 px-1 text-[10px] font-mono text-slate-400 border border-ink-line">
                      F1
                    </kbd>
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setShowDropdown(true)
                        setDropdownIndex(0)
                      }}
                      onFocus={() => {
                        if (searchQuery.trim()) setShowDropdown(true)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault()
                          setDropdownIndex((prev) => Math.min(prev + 1, searchResults.length - 1))
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault()
                          setDropdownIndex((prev) => Math.max(prev - 1, 0))
                        } else if (e.key === 'Enter') {
                          e.preventDefault()
                          const target = searchResults[dropdownIndex] || searchResults[0]
                          if (target) {
                            handleSelectProduct(target)
                          }
                        } else if (e.key === 'Escape') {
                          setShowDropdown(false)
                        }
                      }}
                      placeholder="Scan barcode or type name…"
                      className="input w-full pl-9 font-medium text-xs"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedProduct(null)
                          setShowDropdown(false)
                          searchInputRef.current?.focus()
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute left-0 top-full z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-ink-line bg-ink-850 p-1 shadow-2xl">
                      {searchResults.map((prod, idx) => (
                        <div
                          key={prod.id}
                          onClick={() => handleSelectProduct(prod)}
                          onMouseEnter={() => setDropdownIndex(idx)}
                          className={`flex items-center justify-between rounded-md px-3 py-2 text-xs cursor-pointer ${
                            idx === dropdownIndex ? 'bg-emerald-600 text-white' : 'text-slate-200 hover:bg-ink-750'
                          }`}
                        >
                          <div className="truncate">
                            <p className="font-semibold">{prod.name}</p>
                            <p className={`text-[10px] ${idx === dropdownIndex ? 'text-emerald-100' : 'text-slate-400'}`}>
                              Barcode: {prod.barcode || prod.sku} · Stock: {prod.stock} {prod.base_unit}
                            </p>
                          </div>
                          <span className="font-mono font-bold">
                            {money(prod.purchase_cost_c)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Packaging Unit Selector */}
                <div className="md:col-span-2">
                  <label className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-300">
                    <span>Unit</span>
                    <span className="text-[10px] text-slate-500">Box/Pack/Roll</span>
                  </label>
                  <select
                    ref={unitSelectRef}
                    disabled={!selectedProduct}
                    value={selectedUnitName}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    className="input w-full font-medium text-xs uppercase"
                  >
                    {availableUnits.map((u) => (
                      <option key={u.name} value={u.name}>
                        {u.name.toUpperCase()} {u.conversionToBase > 1 ? `(x${u.conversionToBase})` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedUnitName === 'custom' && (
                    <input
                      type="text"
                      value={customUnitName}
                      onChange={(e) => setCustomUnitName(e.target.value)}
                      placeholder="e.g. TIE, TUB"
                      className="input mt-1 w-full text-[11px] py-0.5 uppercase"
                    />
                  )}
                </div>

                {/* Multiplier (Pcs / Unit Conversion) */}
                <div className="md:col-span-1">
                  <label className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-300">
                    <span>Pcs/Unit</span>
                    <span className="text-[10px] text-emerald-400">Rate</span>
                  </label>
                  <input
                    disabled={!selectedProduct}
                    type="number"
                    step="any"
                    min="0.001"
                    value={unitMultiplierInput}
                    onChange={(e) => handleMultiplierChange(e.target.value)}
                    placeholder="1"
                    className="input w-full font-mono text-xs text-center font-semibold"
                    title="Conversion multiplier: how many base pieces are inside this packaging unit"
                  />
                </div>

                {/* Cost Price */}
                <div className="md:col-span-2">
                  <label className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-300">
                    <span>Unit Cost (₱)</span>
                    <span className="text-[10px] text-emerald-400">Supplier</span>
                  </label>
                  <input
                    ref={costInputRef}
                    disabled={!selectedProduct}
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitCostPesos}
                    onChange={(e) => setUnitCostPesos(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        qtyInputRef.current?.focus()
                        qtyInputRef.current?.select()
                      }
                    }}
                    placeholder="0.00"
                    className="input w-full font-mono text-xs font-semibold"
                  />
                </div>

                {/* Quantity Box (THE CORE F2 ERGONOMIC HOTSPOT) */}
                <div className="md:col-span-1">
                  <label className="mb-1 flex items-center justify-between text-[11px] font-bold text-emerald-300">
                    <span>Qty</span>
                    <kbd className="rounded bg-emerald-500/20 px-1 text-[9px] font-mono text-emerald-300 border border-emerald-500/30">
                      F2
                    </kbd>
                  </label>
                  <input
                    ref={qtyInputRef}
                    disabled={!selectedProduct}
                    type="number"
                    step="any"
                    min="1"
                    value={qtyInput}
                    onChange={(e) => setQtyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        discountInputRef.current?.focus()
                        discountInputRef.current?.select()
                      } else if (e.key === 'F2') {
                        e.preventDefault()
                        handleCommitItem()
                      }
                    }}
                    placeholder="Qty"
                    className="input w-full font-mono text-sm font-bold text-center border-emerald-500/60 focus:border-emerald-400 focus:ring-emerald-500"
                  />
                </div>

                {/* Supplier Trade Discount (Series / Cascading: Less 5 Less 5) */}
                <div className="md:col-span-2">
                  <label className="mb-1 flex items-center justify-between text-[11px] font-semibold text-amber-300">
                    <span>Supplier Disc</span>
                    <span className="text-[9px] text-amber-400 font-mono">5+5+5 / 10/5</span>
                  </label>
                  <input
                    ref={discountInputRef}
                    disabled={!selectedProduct}
                    type="text"
                    value={itemDiscountInput}
                    onChange={(e) => setItemDiscountInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCommitItem()
                      }
                    }}
                    placeholder="0 / 5+5+5 / 10/5"
                    className="input w-full font-mono text-xs font-semibold text-amber-300 border-amber-500/40 focus:border-amber-400 focus:ring-amber-500"
                    title="Supplier chain discount: enter series like *-5%-5%-5%, 5+5+5, 10/5, or flat ₱50"
                  />
                </div>

                {/* Add Item Button */}
                <div className="md:col-span-1">
                  <button
                    type="button"
                    disabled={!selectedProduct}
                    onClick={handleCommitItem}
                    title="Add Item to Invoice (F2 / Enter)"
                    className="btn-primary w-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center p-2 font-bold shadow-sm"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Live Calculation Strip: Total Base Stock Addition & Supplier Discount Preview */}
              {selectedProduct && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ink-900/90 border border-emerald-500/20 px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="font-semibold text-emerald-400">📦 Stock Addition:</span>
                    <span className="font-mono text-white">
                      {qtyInput || 0} {selectedUnitName.toUpperCase() || 'UNIT'} × {unitMultiplierInput || 1} ={' '}
                      <strong className="text-emerald-300 font-bold">
                        +{Math.round((parseFloat(qtyInput) || 0) * (parseFloat(unitMultiplierInput) || 1) * 1000) / 1000}{' '}
                        {selectedProduct.base_unit || 'pcs'}
                      </strong>
                    </span>
                    <span className="text-slate-500 text-[11px]">(automatically added to inventory stock on post)</span>
                  </div>

                  {itemDiscountInput.trim() && itemDiscountResult.discountAmountC > 0 ? (
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-amber-400 font-bold">
                        🏷️ Trade Discount ({itemDiscountResult.formula}):
                      </span>
                      <span className="text-slate-400 line-through">{money(itemGrossC)}</span>
                      <span className="text-amber-300 font-semibold">-{money(itemDiscountResult.discountAmountC)}</span>
                      <span className="text-emerald-400 font-bold">= {money(itemDiscountResult.netAmountC)}</span>
                      <span className="text-[10px] text-amber-500/90">
                        (-{itemDiscountResult.effectivePercent.toFixed(2)}% net)
                      </span>
                    </div>
                  ) : (
                    <div className="font-mono text-slate-300 text-xs">
                      Line Total: <strong className="text-emerald-400 font-bold">{money(itemGrossC)}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. INVOICE LINE ITEMS GRID (Matching CCTI POS Grid) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Invoice Items ({items.length})
                </span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={updateProductCosts}
                      onChange={(e) => setUpdateProductCosts(e.target.checked)}
                      className="rounded border-ink-line bg-ink-800 text-emerald-500 focus:ring-0"
                    />
                    <span>Update Product Catalog Cost</span>
                  </label>
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRemoveLastItem}
                      className="text-xs text-slate-400 hover:text-danger-400 flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove Last (F3)
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[36vh] min-h-[160px] overflow-auto rounded-xl border border-ink-line bg-ink-950/60">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-1">
                    <Barcode className="h-8 w-8 text-slate-600" />
                    <p className="text-xs font-medium">No items in this invoice yet.</p>
                    <p className="text-[11px] text-slate-600">
                      Press <strong>F1</strong> to search item, enter Qty, and press <strong>F2</strong> to commit to stocks.
                    </p>
                  </div>
                ) : (
                  <table className="table min-w-[920px]">
                    <thead>
                      <tr>
                        <th className="w-10 py-2.5 px-3 text-center">#</th>
                        <th className="py-2.5 px-3 text-left">Item Code</th>
                        <th className="py-2.5 px-3 text-left">Description</th>
                        <th className="py-2.5 px-3 text-center">Unit</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-center">Stock In</th>
                        <th className="py-2.5 px-3 text-right">Gross Cost</th>
                        <th className="py-2.5 px-3 text-center">Trade Disc</th>
                        <th className="py-2.5 px-3 text-right">Net Cost</th>
                        <th className="py-2.5 px-3 text-right">Net Amount</th>
                        <th className="w-10 py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={it.tempId} className="hover:bg-ink-800/60 transition-colors">
                          <td className="py-2 px-3 text-center text-xs font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 font-mono text-xs text-slate-300">
                            {it.barcode}
                          </td>
                          <td className="py-2 px-3 font-medium text-white truncate max-w-[220px]">
                            {it.productName}
                          </td>
                          <td className="py-2 px-3 text-center text-xs">
                            <span className="rounded bg-ink-800 border border-ink-line px-1.5 py-0.5 font-mono text-slate-300">
                              {it.unitName.toUpperCase()}
                              {it.conversionToBase > 1 ? ` (x${it.conversionToBase})` : ''}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-white">
                            {it.qty}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-xs text-emerald-400 font-semibold">
                            +{it.qtyBase}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-xs text-slate-300">
                            {money(it.unitCostC)}
                          </td>
                          <td className="py-2 px-3 text-center text-xs">
                            {it.discountC > 0 ? (
                              <span
                                className="rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 font-mono text-amber-300 text-[11px]"
                                title={it.discountInput}
                              >
                                {it.discountInput ? `${it.discountInput} ` : ''}(-{money(it.discountC)})
                              </span>
                            ) : (
                              <span className="text-slate-600 font-mono">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-xs font-semibold text-slate-200">
                            {money(it.netUnitCostC)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-300">
                            {money(it.subtotalC)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(it.tempId)}
                              className="rounded p-1 text-slate-500 hover:bg-danger-500/20 hover:text-danger-400 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* 4. BOTTOM SUMMARY & FUNCTION KEYS BAR (Matching CCTI POS Summary) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-xl border border-ink-line bg-ink-950 p-3.5">
              {/* Shortcut Keys Guide */}
              <div className="md:col-span-6 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-ink-800 border border-ink-line px-1.5 py-0.5 font-mono text-white">
                    F1
                  </kbd>
                  Search
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <kbd className="rounded bg-emerald-900 border border-emerald-600 px-1.5 py-0.5 font-mono text-white">
                    F2
                  </kbd>
                  Commit Qty
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-ink-800 border border-ink-line px-1.5 py-0.5 font-mono text-white">
                    F3
                  </kbd>
                  Remove
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-ink-800 border border-ink-line px-1.5 py-0.5 font-mono text-white">
                    Ctrl+S
                  </kbd>
                  Post
                </span>
                <div className="mt-1 w-full text-[11px] text-slate-500">
                  Total Items: <strong className="text-white">{items.length}</strong> · Total Base Units:{' '}
                  <strong className="text-emerald-400">+{totalBaseUnits}</strong>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="md:col-span-6 flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <span>Gross Total:</span>
                  <span className="font-mono font-semibold text-white">{money(grossTotalC)}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span title="Supports chain discount: e.g. 5+5+5 or 10/5 or ₱100">
                    Trade / Series Discount:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={discountPesos}
                      onChange={(e) => setDiscountPesos(e.target.value)}
                      placeholder="0 / 5+5+5 / 10/5"
                      className="input w-36 py-0.5 text-right font-mono text-xs text-amber-300"
                    />
                    {invoiceDiscountResult.discountAmountC > 0 && (
                      <span className="rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 font-mono text-amber-400 text-xs">
                        -{money(invoiceDiscountResult.discountAmountC)}
                        {invoiceDiscountResult.effectivePercent > 0 && (
                          <span className="text-[10px] text-amber-500/90 ml-1">
                            ({invoiceDiscountResult.effectivePercent.toFixed(1)}%)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t border-ink-line pt-1 text-sm font-bold text-white">
                  <span>Net Payable:</span>
                  <span className="font-mono text-xl text-emerald-400">{money(netTotalC)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting || items.length === 0 || !supplierId}
                  onClick={() => void handleSaveInvoice()}
                  className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 px-6 py-2.5 font-bold shadow-lg"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {submitting ? 'Posting Invoice…' : 'Post & Update Stocks (Ctrl+S)'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
