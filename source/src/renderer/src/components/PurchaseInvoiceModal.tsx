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
  Layers,
  Minus,
  Maximize2,
  ChevronUp,
  ChevronDown,
  PackageSearch,
  Printer,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Eye,
  Edit3,
  Sliders,
  SlidersHorizontal,
  Settings2,
  RotateCcw,
  Check
} from 'lucide-react'
import type { Product, Supplier, Purchase, ProductUnit, CreatePurchaseInput, UpdatePurchaseInput } from '@shared/types'
import { money, moneyWholePesos, shortDate } from '@shared/format'
import { Modal } from './ui/Modal'
import { PurchaseItemPickerModal } from './PurchaseItemPickerModal'
import { toastSuccess, toastError } from '../stores/toast'
import { playScanBeep } from '../lib/barcodeScanner'
import { calculateChainDiscount } from '../utils/supplierDiscount'
import { matchesProductSearch } from '@shared/searchUtils'
import { useSettings } from '../stores/settings'
import { useAuth } from '../stores/auth'
import {
  formatPurchaseOrderSlipLines,
  generatePurchaseOrderDocumentHtml,
  formatDiscountPercent,
  receiptHtml,
  type PurchaseOrderPrintPayload,
  type PurchasePrintCustomizerOptions
} from '@shared/receiptHtml'

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
  const { settings, load: loadSettings } = useSettings()
  const user = useAuth((s) => s.user)

  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create')
  const [isMinimized, setIsMinimized] = useState(false)
  const [isHeaderPanelMinimized, setIsHeaderPanelMinimized] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loadingInitial, setLoadingInitial] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Invoice Header Fields (Create mode)
  const [supplierId, setSupplierId] = useState<number | ''>('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [receiptNo, setReceiptNo] = useState('')
  const [purchaseDate, setPurchaseDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
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
  const [showItemPicker, setShowItemPicker] = useState(false)

  // Line items for Create mode
  const [items, setItems] = useState<InvoiceLineItem[]>([])

  // History Tab state
  const [historyList, setHistoryList] = useState<Purchase[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historySearch, setHistorySearch] = useState('')

  // View / Edit Invoice from History (VIP feature)
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [authorizedManagerName, setAuthorizedManagerName] = useState('')
  const [viewSupplierId, setViewSupplierId] = useState<number | ''>('')
  const [viewInvoiceNo, setViewInvoiceNo] = useState('')
  const [viewReceiptNo, setViewReceiptNo] = useState('')
  const [viewPurchaseDate, setViewPurchaseDate] = useState('')
  const [viewIsPaid, setViewIsPaid] = useState(true)
  const [viewTermsDays, setViewTermsDays] = useState('0')
  const [viewNotes, setViewNotes] = useState('')
  const [viewDiscountPesos, setViewDiscountPesos] = useState('0')
  const [viewUpdateProductCosts, setViewUpdateProductCosts] = useState(true)
  const [viewItems, setViewItems] = useState<InvoiceLineItem[]>([])

  // Manager PIN Modal state
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [showPinText, setShowPinText] = useState(false)
  const [pinError, setPinError] = useState('')
  const [verifyingPin, setVerifyingPin] = useState(false)

  // Print P.O. Modal state
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printFormat, setPrintFormat] = useState<'DOCUMENT' | 'THERMAL'>('DOCUMENT')
  const [useSystemDialog, setUseSystemDialog] = useState(false)
  const [isPrintingPO, setIsPrintingPO] = useState(false)

  // Print Customizer State (Saved in LocalStorage for 1-Page Layout Persistence)
  const DEFAULT_CUSTOMIZER: PurchasePrintCustomizerOptions = {
    rowDensity: 'compact',
    rowPaddingY: 3,
    fontSize: 11,
    marginMm: 8,
    showRowNumber: false,
    showBarcode: false,
    showBaseUnits: false,
    showStoreHeader: true,
    compactHeader: true,
    showInfoCards: true,
    showMemoBar: true,
    showNotesBox: true,
    showSignatures: true,
    compactSignatures: true,
    scalePercent: 100,
    fitToOnePage: true
  }

  const [printCustomizer, setPrintCustomizer] = useState<PurchasePrintCustomizerOptions>(() => {
    try {
      const saved = localStorage.getItem('tinda_po_print_customizer_v1')
      if (saved) return { ...DEFAULT_CUSTOMIZER, ...JSON.parse(saved) }
    } catch {}
    return DEFAULT_CUSTOMIZER
  })

  const [showCustomizerControls, setShowCustomizerControls] = useState(true)

  const updateCustomizer = (patch: Partial<PurchasePrintCustomizerOptions>) => {
    setPrintCustomizer((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem('tinda_po_print_customizer_v1', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const applyPreset = (preset: '1page' | 'ultra' | 'standard') => {
    if (preset === '1page') {
      updateCustomizer({
        rowDensity: 'compact',
        rowPaddingY: 3,
        fontSize: 11,
        marginMm: 8,
        showRowNumber: false,
        showBarcode: false,
        showBaseUnits: false,
        showStoreHeader: true,
        compactHeader: true,
        showInfoCards: true,
        showMemoBar: true,
        showNotesBox: true,
        showSignatures: true,
        compactSignatures: true,
        scalePercent: 100,
        fitToOnePage: true
      })
    } else if (preset === 'ultra') {
      updateCustomizer({
        rowDensity: 'ultra-compact',
        rowPaddingY: 2,
        fontSize: 10,
        marginMm: 5,
        showRowNumber: false,
        showBarcode: false,
        showBaseUnits: false,
        showStoreHeader: true,
        compactHeader: true,
        showInfoCards: true,
        showMemoBar: true,
        showNotesBox: false,
        showSignatures: true,
        compactSignatures: true,
        scalePercent: 90,
        fitToOnePage: true
      })
    } else {
      updateCustomizer({
        rowDensity: 'normal',
        rowPaddingY: 6,
        fontSize: 12,
        marginMm: 12,
        showRowNumber: true,
        showBarcode: true,
        showBaseUnits: true,
        showStoreHeader: true,
        compactHeader: false,
        showInfoCards: true,
        showMemoBar: true,
        showNotesBox: true,
        showSignatures: true,
        compactSignatures: false,
        scalePercent: 100,
        fitToOnePage: false
      })
    }
  }

  // Refs for keyboard focus navigation
  const searchInputRef = useRef<HTMLInputElement>(null)
  const qtyInputRef = useRef<HTMLInputElement>(null)
  const costInputRef = useRef<HTMLInputElement>(null)
  const discountInputRef = useRef<HTMLInputElement>(null)
  const unitSelectRef = useRef<HTMLSelectElement>(null)

  // Selected supplier details (Create mode)
  const currentSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === Number(supplierId)) || null
  }, [suppliers, supplierId])

  // Selected supplier details (View/Edit mode)
  const currentViewSupplier = useMemo(() => {
    const sId = viewSupplierId || viewingPurchase?.supplier_id
    return suppliers.find((s) => s.id === Number(sId)) || null
  }, [suppliers, viewSupplierId, viewingPurchase])

  // Load initial data
  const loadData = async () => {
    setLoadingInitial(true)
    try {
      const [supList, prodRes] = await Promise.all([
        window.api.suppliers.list(),
        window.api.products.search('', { status: 'ACTIVE', limit: 3000 })
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
      const res = await window.api.purchases.list({ limit: 150 })
      setHistoryList(Array.isArray(res?.rows) ? res.rows : [])
    } catch (err) {
      console.error('Failed to load purchase history:', err)
      toastError('Failed to load purchase history', String((err as Error)?.message || err))
      setHistoryList([])
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setIsMinimized(false)
      void loadData()
      if (!settings) void loadSettings()
      if (activeTab === 'history') {
        void loadHistory()
      }
    }
  }, [open, activeTab])

  // Focus search when modal opens
  useEffect(() => {
    if (open && activeTab === 'create' && !viewingPurchase) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open, activeTab, viewingPurchase])

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
    const q = searchQuery.trim()
    if (!q) return []
    return allProducts
      .filter((p) => matchesProductSearch(p, q))
      .slice(0, 10)
  }, [allProducts, searchQuery])

  // Filtered History list by Search Bar (P.O. Number, Invoice #, Receipt #, Supplier, Date, Encoder)
  const filteredHistoryList = useMemo(() => {
    const q = historySearch.trim().toLowerCase()
    if (!q) return historyList
    return historyList.filter((p) => {
      return (
        (p.purchase_no && p.purchase_no.toLowerCase().includes(q)) ||
        (p.invoice_no && p.invoice_no.toLowerCase().includes(q)) ||
        (p.receipt_no && p.receipt_no.toLowerCase().includes(q)) ||
        (p.supplier_name && p.supplier_name.toLowerCase().includes(q)) ||
        (p.user_name && p.user_name.toLowerCase().includes(q)) ||
        (p.purchase_date && p.purchase_date.toLowerCase().includes(q)) ||
        (p.is_paid ? 'paid' : 'terms').includes(q)
      )
    })
  }, [historyList, historySearch])

  // Index and Prev / Next Navigation for viewing an invoice
  const currentHistoryIndex = useMemo(() => {
    if (!viewingPurchase) return -1
    return filteredHistoryList.findIndex((p) => p.id === viewingPurchase.id)
  }, [filteredHistoryList, viewingPurchase])

  const hasPrev = currentHistoryIndex > 0
  const hasNext = currentHistoryIndex >= 0 && currentHistoryIndex < filteredHistoryList.length - 1

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

    // Evaluate trade discount on this line
    const lineDiscount = calculateChainDiscount(grossSubtotalC, itemDiscountInput)
    const discountC = lineDiscount.discountAmountC
    const subtotalC = Math.max(0, grossSubtotalC - discountC)
    const netUnitCostC = qty > 0 ? Math.round(subtotalC / qty) : unitCostC

    const newItem: InvoiceLineItem = {
      tempId: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      barcode: selectedProduct.barcode || '',
      sku: selectedProduct.sku || '',
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

    // Determine target list: viewItems (if in edit mode) or items (if in create mode)
    if (viewingPurchase && isEditMode) {
      const existingIndex = viewItems.findIndex(
        (it) => it.productId === selectedProduct.id && it.unitName.toLowerCase() === effectiveUnitName.toLowerCase()
      )
      if (existingIndex >= 0) {
        const updated = [...viewItems]
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
          setViewItems(updated)
        }
      } else {
        setViewItems([...viewItems, newItem])
      }
    } else {
      const existingIndex = items.findIndex(
        (it) => it.productId === selectedProduct.id && it.unitName.toLowerCase() === effectiveUnitName.toLowerCase()
      )
      if (existingIndex >= 0) {
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
        setItems([...items, newItem])
      }
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

    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 50)
  }

  // Remove Line Item
  const handleRemoveItem = (tempId: string) => {
    if (viewingPurchase && isEditMode) {
      setViewItems((prev) => prev.filter((it) => it.tempId !== tempId))
    } else {
      setItems((prev) => prev.filter((it) => it.tempId !== tempId))
    }
  }

  // Remove Last Line Item
  const handleRemoveLastItem = () => {
    if (viewingPurchase && isEditMode) {
      if (viewItems.length > 0) setViewItems((prev) => prev.slice(0, -1))
    } else {
      if (items.length > 0) setItems((prev) => prev.slice(0, -1))
    }
  }

  // Create Mode Math Calculations
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

  // View / Edit Mode Math Calculations
  const viewGrossTotalC = useMemo(() => {
    return viewItems.reduce((sum, it) => sum + it.subtotalC, 0)
  }, [viewItems])

  const viewInvoiceDiscountResult = useMemo(() => {
    return calculateChainDiscount(viewGrossTotalC, viewDiscountPesos)
  }, [viewGrossTotalC, viewDiscountPesos])

  const viewDiscountC = viewInvoiceDiscountResult.discountAmountC

  const viewNetTotalC = useMemo(() => {
    return Math.max(0, viewGrossTotalC - viewDiscountC)
  }, [viewGrossTotalC, viewDiscountC])

  const viewTotalBaseUnits = useMemo(() => {
    return viewItems.reduce((sum, it) => sum + it.qtyBase, 0)
  }, [viewItems])

  // Save / Post New Purchase Invoice
  const handleSaveInvoice = async () => {
    if (!supplierId) {
      toastError('Supplier Missing', 'Please select a supplier for this invoice.')
      return
    }

    if (items.length === 0) {
      toastError('No Items', 'Please add at least one product to the invoice.')
      return
    }

    setSubmitting(true)
    try {
      const payload: CreatePurchaseInput = {
        supplier_id: Number(supplierId),
        purchase_date: purchaseDate,
        invoice_no: invoiceNo.trim() || null,
        receipt_no: receiptNo.trim() || null,
        is_paid: isPaid,
        terms_days: isPaid ? 0 : parseInt(termsDays, 10) || 0,
        discount_c: discountC,
        notes: notes.trim() || null,
        update_product_costs: updateProductCosts,
        items: items.map((it) => ({
          product_id: it.productId,
          unit_name: it.unitName,
          qty: it.qty,
          qty_base: it.qtyBase,
          unit_cost_c: it.unitCostC,
          discount_input: it.discountInput || null,
          discount_c: it.discountC,
          subtotal_c: it.subtotalC
        }))
      }

      const res = await window.api.purchases.create(payload)
      toastSuccess(
        'Invoice Saved & Stocks Updated!',
        `Purchase ${res.purchase_no} recorded successfully with ${items.length} items.`
      )

      // Reset form
      setItems([])
      setInvoiceNo('')
      setReceiptNo('')
      setNotes('')
      setDiscountPesos('0')
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Failed to create purchase invoice:', err)
      toastError('Failed to Save Invoice', String((err as Error)?.message || err))
    } finally {
      setSubmitting(false)
    }
  }

  // Open an invoice from history into View Panel (Image 2 -> Image 3)
  const handleOpenPurchaseDetails = (p: Purchase) => {
    setViewingPurchase(p)
    setIsEditMode(false)
    setAuthorizedManagerName('')
    setShowPinModal(false)
    setShowPrintModal(false)

    // Populate view / edit state
    setViewSupplierId(p.supplier_id)
    setViewInvoiceNo(p.invoice_no || '')
    setViewReceiptNo(p.receipt_no || '')
    setViewPurchaseDate(p.purchase_date || new Date().toISOString().slice(0, 10))
    setViewIsPaid(p.is_paid !== false)
    setViewTermsDays(String(p.terms_days || 0))
    setViewNotes(p.notes || '')
    setViewDiscountPesos(p.discount_c ? (p.discount_c / 100).toFixed(2) : '0')
    setViewUpdateProductCosts(true)

    // Populate line items
    const mappedItems: InvoiceLineItem[] = (p.items || []).map((it, idx) => {
      const matchedProd = allProducts.find((pr) => pr.id === it.product_id)
      const unitObj = matchedProd?.units?.find((u) => u.name.toLowerCase() === it.unit_name.toLowerCase())
      const conversion = unitObj?.conversion_to_base || (it.qty > 0 ? Math.round(it.qty_base / it.qty) : 1)

      const grossUnitCostC = it.unit_cost_c
      const discountC = it.discount_c || Math.max(0, grossUnitCostC * it.qty - it.subtotal_c)
      const discountInput: string = it.discount_input ? String(it.discount_input) : (discountC > 0 ? (discountC / 100).toFixed(2) : '')
      const netUnitCostC = it.qty > 0 ? Math.round(it.subtotal_c / it.qty) : grossUnitCostC

      return {
        tempId: `view-item-${it.id || idx}-${Date.now()}`,
        productId: it.product_id,
        productName: it.product_name,
        barcode: it.product_barcode || matchedProd?.barcode || '',
        sku: it.product_sku || matchedProd?.sku || '',
        unitName: it.unit_name,
        conversionToBase: conversion,
        qty: it.qty,
        qtyBase: it.qty_base,
        unitCostC: grossUnitCostC,
        discountInput,
        discountC,
        netUnitCostC,
        subtotalC: it.subtotal_c
      }
    })

    setViewItems(mappedItems)
  }

  // Previous and Next Invoice Navigation
  const handlePrevPurchase = () => {
    if (hasPrev) {
      const prev = filteredHistoryList[currentHistoryIndex - 1]
      if (prev) handleOpenPurchaseDetails(prev)
    }
  }

  const handleNextPurchase = () => {
    if (hasNext) {
      const next = filteredHistoryList[currentHistoryIndex + 1]
      if (next) handleOpenPurchaseDetails(next)
    }
  }

  // Verify Manager PIN / Password to unlock Edit Mode
  const handleVerifyPin = async () => {
    if (!pinInput.trim()) return
    setVerifyingPin(true)
    setPinError('')
    try {
      const res = await window.api.auth.verifyManagerPin(pinInput.trim())
      if (res.valid) {
        setIsEditMode(true)
        setAuthorizedManagerName(res.name ?? 'Manager')
        setShowPinModal(false)
        setPinInput('')
        toastSuccess('Access Granted', `Authorized by ${res.name || 'Admin/Manager'}. You can now edit this invoice.`)
      } else {
        setPinError('Invalid Admin or Manager PIN/Password. Access denied.')
      }
    } catch (err) {
      setPinError(String((err as Error)?.message || err))
    } finally {
      setVerifyingPin(false)
    }
  }

  // Save Edit (Image 3 bottom right)
  const handleSaveEdit = async () => {
    if (!viewingPurchase) return
    if (!viewSupplierId) {
      toastError('Supplier Missing', 'Please select a supplier for this invoice.')
      return
    }

    if (viewItems.length === 0) {
      toastError('No Items', 'Purchase invoice must have at least one line item.')
      return
    }

    setSubmitting(true)
    try {
      const payload: UpdatePurchaseInput = {
        supplier_id: Number(viewSupplierId),
        purchase_date: viewPurchaseDate,
        invoice_no: viewInvoiceNo.trim() || null,
        receipt_no: viewReceiptNo.trim() || null,
        is_paid: viewIsPaid,
        terms_days: viewIsPaid ? 0 : parseInt(viewTermsDays, 10) || 0,
        discount_c: viewDiscountC,
        notes: viewNotes.trim() || null,
        update_product_costs: viewUpdateProductCosts,
        items: viewItems.map((it) => ({
          product_id: it.productId,
          unit_name: it.unitName,
          qty: it.qty,
          qty_base: it.qtyBase,
          unit_cost_c: it.unitCostC,
          discount_input: it.discountInput || null,
          discount_c: it.discountC,
          subtotal_c: it.subtotalC
        }))
      }

      const updated = await window.api.purchases.update(viewingPurchase.id, payload)
      toastSuccess(
        'Purchase Invoice Updated!',
        `P.O. ${updated.purchase_no} updated successfully with inventory reconciliation.`
      )

      setIsEditMode(false)
      setViewingPurchase(updated)
      void loadHistory()
      onSuccess()
    } catch (err) {
      console.error('Failed to update purchase invoice:', err)
      toastError('Update Failed', String((err as Error)?.message || err))
    } finally {
      setSubmitting(false)
    }
  }

  // Print P.O. Voucher / Thermal Receipt
  const handlePrintPO = async () => {
    if (!viewingPurchase) return
    setIsPrintingPO(true)
    try {
      const preparedItems = (viewItems.length > 0 ? viewItems : (viewingPurchase.items || [])).map((it: any) => {
        const qty = it.qty || 1
        const unitCostC = it.unitCostC ?? it.grossUnitCostC ?? it.unit_cost_c ?? 0
        const subtotalC = it.subtotalC ?? it.subtotal_c ?? 0
        const grossC = unitCostC * qty
        const discC = it.discountC ?? it.discount_c ?? Math.max(0, grossC - subtotalC)
        const discInput = it.discountInput ?? it.discount_input ?? ''
        const formattedPercent = formatDiscountPercent(discInput, discC, grossC)

        return {
          id: it.id || 0,
          purchase_id: viewingPurchase.id,
          product_id: it.productId ?? it.product_id,
          product_name: it.productName ?? it.product_name,
          product_barcode: it.barcode ?? it.product_barcode ?? '',
          unit_name: it.unitName ?? it.unit_name,
          qty,
          qty_base: it.conversionToBase ? it.conversionToBase * qty : (it.qty_base || qty),
          unit_cost_c: unitCostC,
          discount_input: formattedPercent !== '—' ? formattedPercent : (discInput || null),
          discount_c: discC,
          subtotal_c: subtotalC
        }
      })

      const payload: PurchaseOrderPrintPayload = {
        storeName: settings?.store_name || 'TINDA POS',
        storeAddress: settings?.address || '',
        storePhone: settings?.phone || '',
        purchase: {
          ...viewingPurchase,
          supplier_address: currentViewSupplier?.address,
          supplier_contact: currentViewSupplier?.contact_person,
          supplier_phone: currentViewSupplier?.phone,
          items: preparedItems
        }
      }

      if (printFormat === 'DOCUMENT') {
        const { title, html } = generatePurchaseOrderDocumentHtml(payload, printCustomizer)
        if (window.api?.printer?.printDocument) {
          const res = await window.api.printer.printDocument(html, {
            manual: useSystemDialog,
            title,
            pageSize: 'A4'
          })
          if (res.ok) {
            toastSuccess('Document Printed', `P.O. Voucher ${viewingPurchase.purchase_no} sent to printer.`)
            setShowPrintModal(false)
          } else if (res.code !== 'DISABLED') {
            toastError('Print Failed', res.message)
          }
        } else {
          const printWin = window.open('', '_blank', 'width=850,height=1000')
          if (printWin) {
            printWin.document.write(html)
            printWin.document.close()
            printWin.focus()
            setTimeout(() => printWin.print(), 250)
          }
        }
      } else {
        // Thermal receipt format
        const lines = formatPurchaseOrderSlipLines(payload)
        const thermalHtml = receiptHtml(lines, '80mm', '₱', {
          fontScale: 100
        })
        if (window.api?.printer?.printDocument) {
          const res = await window.api.printer.printDocument(thermalHtml, {
            manual: useSystemDialog,
            title: `P.O. Slip ${viewingPurchase.purchase_no}`,
            widthMm: 80,
            heightMm: 220
          })
          if (res.ok) {
            toastSuccess('Thermal Slip Printed', `P.O. Slip ${viewingPurchase.purchase_no} printed on thermal roll.`)
            setShowPrintModal(false)
          } else if (res.code !== 'DISABLED') {
            toastError('Print Failed', res.message)
          }
        } else {
          const printWin = window.open('', '_blank', 'width=400,height=800')
          if (printWin) {
            printWin.document.write(thermalHtml)
            printWin.document.close()
            printWin.focus()
            setTimeout(() => printWin.print(), 250)
          }
        }
      }
    } catch (err) {
      console.error('P.O. print error:', err)
      toastError('Print Error', String((err as Error)?.message || err))
    } finally {
      setIsPrintingPO(false)
    }
  }

  // Keyboard Shortcuts: F1, F2, F3, Ctrl+S
  useEffect(() => {
    if (!open || isMinimized) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // F1: Toggle Universal Inventory Spotlight Explorer Modal
      if (e.key === 'F1') {
        e.preventDefault()
        setShowItemPicker((prev) => !prev)
        return
      }

      // F2: Commit Item
      if (e.key === 'F2') {
        e.preventDefault()
        handleCommitItem()
        return
      }

      // F3: Remove Last Item
      if (e.key === 'F3') {
        e.preventDefault()
        handleRemoveLastItem()
        return
      }

      // Ctrl+S / Cmd+S: Save Invoice
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (viewingPurchase && isEditMode) {
          void handleSaveEdit()
        } else if (activeTab === 'create') {
          void handleSaveInvoice()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    open,
    isMinimized,
    selectedProduct,
    qtyInput,
    unitCostPesos,
    selectedUnitName,
    items,
    viewItems,
    supplierId,
    viewSupplierId,
    invoiceNo,
    viewInvoiceNo,
    receiptNo,
    viewReceiptNo,
    isPaid,
    viewIsPaid,
    termsDays,
    viewTermsDays,
    discountC,
    viewDiscountC,
    notes,
    viewNotes,
    updateProductCosts,
    viewUpdateProductCosts,
    viewingPurchase,
    isEditMode,
    activeTab
  ])

  if (!open) return null

  return (
    <>
      {/* Floating Receiving Dock (Minimized State) */}
      {isMinimized && (
        <div
          className="fixed bottom-5 right-6 z-50 flex items-center gap-4 rounded-2xl border border-white/10 bg-ink-900/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 select-none cursor-pointer hover:border-emerald-500/30 transition-all"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Purchase Invoice Receiving</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                {viewingPurchase ? (isEditMode ? 'EDITING' : 'VIEWING') : 'ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {viewingPurchase
                ? `${viewingPurchase.purchase_no} (${viewItems.length} items · ${money(viewNetTotalC)})`
                : `${items.length} items staged (${money(netTotalC)})`}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsMinimized(false)
            }}
            className="ml-2 rounded-lg bg-white/10 p-2 text-zinc-300 hover:bg-white/20 hover:text-white transition-colors"
            title="Restore Window"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Full-Size Purchase Invoice Modal */}
      {!isMinimized && (
        <Modal
          open={open}
          onClose={onClose}
          maxWidth="max-w-7xl"
          title=""
        >
          <div className="flex flex-col space-y-4 p-5">
            {/* Top Navigation & Tab Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-ink-line">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">Purchase Invoice</h2>
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
                    onClick={() => {
                      setViewingPurchase(null)
                      setIsEditMode(false)
                      setActiveTab('create')
                    }}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                      activeTab === 'create' && !viewingPurchase
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
                      setViewingPurchase(null)
                      setIsEditMode(false)
                      setActiveTab('history')
                      void loadHistory()
                    }}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                      activeTab === 'history' || viewingPurchase
                        ? 'bg-ink-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <History className="h-3.5 w-3.5" />
                    Invoices History
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  title="Minimize to Floating Dock"
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Minus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* TAB CONTENT: HISTORY OR CREATE */}
            {activeTab === 'history' ? (
              viewingPurchase ? (
                /* VIEW / EDIT PURCHASE INVOICE DETAIL PANEL (IMAGE 3) */
                <div className="space-y-4">
                  {/* Top Bar for Viewing / Editing: Print, Edit, Prev, Next, Close (Image 3) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl border border-ink-line bg-ink-950">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPrintModal(true)}
                        className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-ink-850 hover:bg-ink-700 border border-ink-line rounded-lg transition-all shadow-sm"
                        title="Print Purchase Order / Receiving Slip"
                      >
                        <Printer className="h-4 w-4 text-emerald-400" />
                        <span>Print</span>
                      </button>

                      {!isEditMode ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPinInput('')
                            setPinError('')
                            setShowPinModal(true)
                          }}
                          className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-all"
                          title="Admin or Manager PIN required to edit this invoice"
                        >
                          <Lock className="h-3.5 w-3.5 text-amber-400" />
                          <span>Edit</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (viewingPurchase) handleOpenPurchaseDetails(viewingPurchase)
                          }}
                          className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-ink-850 border border-ink-line rounded-lg"
                        >
                          <X className="h-3.5 w-3.5 text-slate-400" />
                          <span>Cancel Edit</span>
                        </button>
                      )}

                      <span className="font-mono font-bold text-sm text-emerald-400 ml-2">
                        {viewingPurchase.purchase_no}
                      </span>

                      {isEditMode ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                          <Edit3 className="h-3 w-3" />
                          EDITING MODE ({authorizedManagerName || 'Authorized'})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 border border-slate-700 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                          <Lock className="h-3 w-3 text-slate-400" />
                          Read-Only
                        </span>
                      )}

                      <span
                        className={`badge inline-flex items-center text-[10px] font-semibold ${
                          viewingPurchase.is_paid
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {viewingPurchase.is_paid ? 'PAID' : `TERMS ${viewingPurchase.terms_days || 0}D`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-lg border border-ink-line bg-ink-900 p-1">
                        <button
                          type="button"
                          disabled={!hasPrev}
                          onClick={handlePrevPurchase}
                          className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                            hasPrev
                              ? 'text-white hover:bg-ink-800'
                              : 'text-slate-600 cursor-not-allowed opacity-40'
                          }`}
                          title="Previous Invoice"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          <span>Prev.</span>
                        </button>

                        <span className="px-2 text-[11px] font-mono text-slate-400 border-x border-ink-line">
                          {currentHistoryIndex >= 0 ? `${currentHistoryIndex + 1} of ${filteredHistoryList.length}` : '—'}
                        </span>

                        <button
                          type="button"
                          disabled={!hasNext}
                          onClick={handleNextPurchase}
                          className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                            hasNext
                              ? 'text-white hover:bg-ink-800'
                              : 'text-slate-600 cursor-not-allowed opacity-40'
                          }`}
                          title="Next Invoice"
                        >
                          <span>Next</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setViewingPurchase(null)}
                        className="btn-ghost flex items-center gap-1 text-xs text-slate-300 hover:text-white"
                        title="Back to Invoices History"
                      >
                        <X className="h-4 w-4" />
                        <span>Close</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. Header Information Panel */}
                  <div className="rounded-xl border border-ink-line bg-ink-950/70 p-3.5 backdrop-blur shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-ink-line/50">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Invoice Details & Supplier
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        Encoder: {viewingPurchase.user_name || 'Staff'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      {/* Supplier Picker */}
                      <div className="md:col-span-2">
                        <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5 text-emerald-400" />
                            Supplier {isEditMode && <span className="text-danger-400">*</span>}
                          </span>
                          {currentViewSupplier?.address && (
                            <span className="truncate max-w-[200px] text-[11px] font-normal text-slate-400">
                              {currentViewSupplier.address}
                            </span>
                          )}
                        </label>
                        {isEditMode ? (
                          <select
                            className="input w-full font-medium"
                            value={viewSupplierId}
                            onChange={(e) => setViewSupplierId(Number(e.target.value))}
                          >
                            <option value="">— Select Supplier —</option>
                            {suppliers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} {s.contact_person ? `(${s.contact_person})` : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="input w-full font-medium bg-ink-900 border-ink-line text-white flex items-center">
                            {viewingPurchase.supplier_name || '—'}
                          </div>
                        )}
                      </div>

                      {/* Receipt Number */}
                      <div>
                        <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-300">
                          <Hash className="h-3.5 w-3.5 text-sky-400" />
                          Receipt No.
                        </label>
                        <input
                          type="text"
                          disabled={!isEditMode}
                          value={viewReceiptNo}
                          onChange={(e) => setViewReceiptNo(e.target.value)}
                          placeholder="e.g. SI0000002966"
                          className="input w-full font-mono text-xs uppercase disabled:bg-ink-900 disabled:text-slate-300"
                        />
                      </div>

                      {/* Invoice Number / Transaction # */}
                      <div>
                        <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-300">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-amber-400" />
                          Invoice No. / Trans #
                        </label>
                        <input
                          type="text"
                          disabled={!isEditMode}
                          value={viewInvoiceNo}
                          onChange={(e) => setViewInvoiceNo(e.target.value)}
                          placeholder="e.g. BS-2024-017"
                          className="input w-full font-mono text-xs uppercase disabled:bg-ink-900 disabled:text-slate-300"
                        />
                      </div>

                      {/* Invoice Date */}
                      <div>
                        <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-300">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          Invoice Date
                        </label>
                        <input
                          type="date"
                          disabled={!isEditMode}
                          value={viewPurchaseDate}
                          onChange={(e) => setViewPurchaseDate(e.target.value)}
                          className="input w-full font-mono text-xs disabled:bg-ink-900 disabled:text-slate-300"
                        />
                      </div>

                      {/* Payment Terms & Status */}
                      <div>
                        <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-300">
                          <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                          Payment Status
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={!isEditMode}
                              checked={viewIsPaid}
                              onChange={(e) => setViewIsPaid(e.target.checked)}
                              className="rounded border-ink-line bg-ink-800 text-emerald-500 focus:ring-0 disabled:opacity-60"
                            />
                            <span>Paid</span>
                          </label>
                          {!viewIsPaid && (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                disabled={!isEditMode}
                                min="0"
                                value={viewTermsDays}
                                onChange={(e) => setViewTermsDays(e.target.value)}
                                className="input w-16 py-1 text-center font-mono text-xs disabled:bg-ink-900"
                              />
                              <span className="text-[11px] text-slate-400">days term</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Memo / Delivery Notes */}
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-300">
                          Memo / Delivery Notes
                        </label>
                        <input
                          type="text"
                          disabled={!isEditMode}
                          value={viewNotes}
                          onChange={(e) => setViewNotes(e.target.value)}
                          placeholder="e.g. CUS.BOOKING / Van delivery / Supplier rep"
                          className="input w-full text-xs disabled:bg-ink-900 disabled:text-slate-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. FAST ITEM ENTRY (Active only when in Edit Mode) */}
                  {isEditMode ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-ink-950 p-3.5 shadow-md space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-ink-line/40">
                        <div className="flex items-center gap-2">
                          <Barcode className="h-4 w-4 text-emerald-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                            Fast Item Entry
                          </span>
                          <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400">
                            F1 EXPLORER
                          </span>
                          <span className="rounded bg-sky-500/10 border border-sky-500/30 px-1.5 py-0.5 text-[10px] font-mono text-sky-300">
                            F2 TO COMMIT
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-12 items-end">
                        <div className="relative md:col-span-4">
                          <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-300">
                            <span>Item Code / Barcode</span>
                            <button
                              type="button"
                              onClick={() => setShowItemPicker(true)}
                              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-normal"
                            >
                              <Search className="h-3 w-3" /> F1 Explorer
                            </button>
                          </label>
                          <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value)
                              setShowDropdown(true)
                              setDropdownIndex(0)
                            }}
                            onFocus={() => setShowDropdown(true)}
                            placeholder="Scan barcode or type name…"
                            className="input w-full font-medium text-xs pr-8"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-1 block text-xs font-semibold text-slate-300">Unit</label>
                          <select
                            ref={unitSelectRef}
                            value={selectedUnitName}
                            onChange={(e) => handleUnitChange(e.target.value)}
                            className="input w-full text-xs font-medium"
                          >
                            {availableUnits.map((u) => (
                              <option key={u.name} value={u.name}>{u.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-1">
                          <label className="mb-1 block text-[11px] font-semibold text-slate-300 truncate">Pcs/Unit</label>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={unitMultiplierInput}
                            onChange={(e) => handleMultiplierChange(e.target.value)}
                            className="input w-full font-mono text-xs text-center"
                          />
                        </div>

                        <div className="md:col-span-1">
                          <label className="mb-1 block text-xs font-semibold text-slate-300">Unit Cost (₱)</label>
                          <input
                            ref={costInputRef}
                            type="number"
                            step="0.01"
                            value={unitCostPesos}
                            onChange={(e) => setUnitCostPesos(e.target.value)}
                            className="input w-full font-mono text-xs font-semibold"
                          />
                        </div>

                        <div className="md:col-span-1">
                          <label className="mb-1 block text-xs font-semibold text-slate-300">Qty</label>
                          <input
                            ref={qtyInputRef}
                            type="number"
                            min="1"
                            step="any"
                            value={qtyInput}
                            onChange={(e) => setQtyInput(e.target.value)}
                            className="input w-full font-mono text-xs text-center font-bold text-white bg-ink-800"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-1 flex items-center justify-between text-xs font-semibold text-amber-300">
                            <span>Supplier Disc</span>
                            <span className="text-[10px] text-slate-400 font-normal">5+5+5 / 10/5</span>
                          </label>
                          <input
                            ref={discountInputRef}
                            type="text"
                            value={itemDiscountInput}
                            onChange={(e) => setItemDiscountInput(e.target.value)}
                            placeholder="0 / 5+5+5 / 10/5"
                            className="input w-full font-mono text-xs font-semibold text-amber-300 border-amber-500/40"
                          />
                        </div>

                        <div className="md:col-span-1">
                          <button
                            type="button"
                            disabled={!selectedProduct}
                            onClick={handleCommitItem}
                            className="btn-primary w-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center p-2 font-bold shadow-sm"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-700/50 bg-ink-950/50 p-2.5 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-amber-400" />
                      <span>Read-Only Invoice View • Click <strong>Edit</strong> with Admin/Manager PIN to modify line items</span>
                    </div>
                  )}

                  {/* 3. INVOICE LINE ITEMS GRID */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Invoice Items ({viewItems.length})
                      </span>
                      {isEditMode && viewItems.length > 0 && (
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

                    <div className="max-h-[38vh] min-h-[160px] overflow-auto rounded-xl border border-ink-line bg-ink-950/60">
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
                            {isEditMode && <th className="w-10 py-2.5 px-3 text-center">Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {viewItems.map((it, idx) => (
                            <tr key={it.tempId} className="hover:bg-ink-800/60 transition-colors">
                              <td className="py-2 px-3 text-center text-xs font-mono text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3 font-mono text-xs text-slate-300">
                                {it.barcode || it.sku || '—'}
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
                                {isEditMode ? (
                                  <input
                                    type="number"
                                    min="1"
                                    step="any"
                                    value={it.qty}
                                    onChange={(e) => {
                                      const newQty = parseFloat(e.target.value) || 0
                                      const updated = [...viewItems]
                                      const row = updated[idx]
                                      if (row) {
                                        const newQtyBase = Math.round(newQty * row.conversionToBase * 1000) / 1000
                                        const newGross = Math.round(newQty * row.unitCostC)
                                        const newDisc = calculateChainDiscount(newGross, row.discountInput)
                                        const newSub = Math.max(0, newGross - newDisc.discountAmountC)
                                        updated[idx] = {
                                          ...row,
                                          qty: newQty,
                                          qtyBase: newQtyBase,
                                          discountC: newDisc.discountAmountC,
                                          netUnitCostC: newQty > 0 ? Math.round(newSub / newQty) : row.unitCostC,
                                          subtotalC: newSub
                                        }
                                        setViewItems(updated)
                                      }
                                    }}
                                    className="input w-16 py-0.5 text-center font-mono text-xs font-bold text-white bg-ink-800"
                                  />
                                ) : (
                                  it.qty
                                )}
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
                                    title={`Less ${money(it.discountC)}`}
                                  >
                                    {formatDiscountPercent(it.discountInput, it.discountC, it.unitCostC * it.qty, { withEffective: true })}
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
                              {isEditMode && (
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
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 4. BOTTOM SUMMARY & TOTALS */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-xl border border-ink-line bg-ink-950 p-3.5">
                    <div className="md:col-span-6 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <kbd className="rounded bg-ink-800 border border-ink-line px-1.5 py-0.5 font-mono text-white">
                          F1
                        </kbd>
                        Inventory Explorer
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <kbd className="rounded bg-emerald-900 border border-emerald-600 px-1.5 py-0.5 font-mono text-white">
                          F2
                        </kbd>
                        Commit Qty
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="rounded bg-ink-800 border border-ink-line px-1.5 py-0.5 font-mono text-white">
                          Ctrl+S
                        </kbd>
                        Save
                      </span>
                      <div className="mt-1 w-full text-[11px] text-slate-500">
                        Total Items: <strong className="text-white">{viewItems.length}</strong> · Total Base Units:{' '}
                        <strong className="text-emerald-400">+{viewTotalBaseUnits}</strong>
                      </div>
                    </div>

                    <div className="md:col-span-6 flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-4 text-xs text-slate-300">
                        <span>Gross Total:</span>
                        <span className="font-mono font-semibold text-white">{money(viewGrossTotalC)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span>Trade / Series Discount:</span>
                        <div className="flex items-center gap-1.5">
                          {isEditMode ? (
                            <input
                              type="text"
                              value={viewDiscountPesos}
                              onChange={(e) => setViewDiscountPesos(e.target.value)}
                              placeholder="0 / 5+5+5 / 10/5"
                              className="input w-36 py-0.5 text-right font-mono text-xs text-amber-300"
                            />
                          ) : (
                            <span className="font-mono font-bold text-amber-300">
                              {viewDiscountC > 0 ? `-${money(viewDiscountC)}` : '₱0.00'}
                            </span>
                          )}
                          {viewInvoiceDiscountResult.discountAmountC > 0 && isEditMode && (
                            <span className="rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 font-mono text-amber-400 text-xs">
                              -{money(viewInvoiceDiscountResult.discountAmountC)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 border-t border-ink-line pt-1 text-sm font-bold text-white">
                        <span>Net Payable:</span>
                        <span className="font-mono text-xl text-emerald-400">{money(viewNetTotalC)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setViewingPurchase(null)}
                      className="btn-ghost flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to Invoices History
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPrintModal(true)}
                        className="btn-ghost flex items-center gap-1.5 text-xs font-bold text-white bg-ink-850 hover:bg-ink-700 border border-ink-line px-4 py-2 rounded-lg"
                      >
                        <Printer className="h-4 w-4 text-emerald-400" />
                        <span>Print P.O. Voucher</span>
                      </button>

                      {isEditMode ? (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => void handleSaveEdit()}
                          className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 px-6 py-2.5 font-bold shadow-lg"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{submitting ? 'Saving Changes…' : 'Save Edit (Ctrl+S)'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPinInput('')
                            setPinError('')
                            setShowPinModal(true)
                          }}
                          className="btn-primary flex items-center gap-1.5 text-xs font-bold px-4 py-2"
                        >
                          <Lock className="h-4 w-4" />
                          <span>Authorize & Edit</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* INVOICES HISTORY LIST VIEW WITH SEARCH BAR (IMAGE 2) */
                <div className="space-y-4">
                  {/* Search Bar & Header Controls (Image 2) */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[280px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        placeholder="Search P.O. #, invoice #, receipt #, supplier, encoder..."
                        className="input w-full pl-9 pr-8 text-xs font-medium"
                        autoFocus
                      />
                      {historySearch && (
                        <button
                          type="button"
                          onClick={() => setHistorySearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        Showing {filteredHistoryList.length} of {historyList.length} purchase invoices
                      </span>
                      <button
                        onClick={() => void loadHistory()}
                        className="btn-ghost flex items-center gap-1.5 text-xs text-slate-300"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>
                  </div>

                  {historyLoading ? (
                    <div className="space-y-2 py-8 text-center text-sm text-slate-400">
                      Loading purchase invoices…
                    </div>
                  ) : filteredHistoryList.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-ink-line p-10 text-center text-slate-500">
                      {historySearch
                        ? `No purchase invoices match "${historySearch}".`
                        : 'No purchase invoices recorded yet. Click "+ New Invoice" to create one.'}
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
                          {filteredHistoryList.map((p) => (
                            <tr
                              key={p.id}
                              onClick={() => handleOpenPurchaseDetails(p)}
                              className="cursor-pointer hover:bg-ink-800 transition-colors group"
                            >
                              <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 group-hover:underline flex items-center gap-1.5">
                                <PackageSearch className="h-3.5 w-3.5 text-emerald-400/70" />
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
                </div>
              )
            ) : (
              /* CREATE INVOICE WORKFLOW */
              <>
                {/* 1. Header Information Panel */}
                <div className="rounded-xl border border-ink-line bg-ink-950/70 p-3.5 backdrop-blur shadow-sm space-y-3 transition-all">
                  <div className="flex items-center justify-between pb-2 border-b border-ink-line/50">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Invoice Details & Supplier
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsHeaderPanelMinimized(!isHeaderPanelMinimized)}
                      className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white hover:bg-ink-800 transition-colors"
                      title={isHeaderPanelMinimized ? 'Show Details' : 'Minimize Details'}
                    >
                      {isHeaderPanelMinimized ? (
                        <>
                          <ChevronDown className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Show Details</span>
                        </>
                      ) : (
                        <>
                          <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                          <span>Minimize Details</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isHeaderPanelMinimized ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 py-1 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-800/80 border border-ink-line px-2.5 py-1 text-white">
                          <span className="text-slate-400">Supplier:</span>
                          <strong className="text-emerald-300 font-semibold">{currentSupplier?.name || 'None'}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-800/80 border border-ink-line px-2.5 py-1 text-white">
                          <span className="text-slate-400">Inv:</span>
                          <span className="font-mono">{invoiceNo || '—'}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-800/80 border border-ink-line px-2.5 py-1 text-white">
                          <span className="text-slate-400">Ref:</span>
                          <span className="font-mono">{receiptNo || '—'}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-800/80 border border-ink-line px-2.5 py-1 text-white">
                          <span className="text-slate-400">Date:</span>
                          <span>{purchaseDate}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 font-semibold text-emerald-300 text-[11px]">
                          <span>Status:</span>
                          <span>Draft ({isPaid ? 'Paid' : `Terms ${termsDays || 0}D`})</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsHeaderPanelMinimized(false)}
                        className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-1 rounded hover:bg-emerald-500/10 transition-colors"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                        <span>Expand</span>
                      </button>
                    </div>
                  ) : (
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

                      {/* Receipt Number */}
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

                      {/* Invoice Number / Transaction # */}
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

                      {/* Invoice Date */}
                      <div>
                        <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-300">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          Invoice Date
                        </label>
                        <input
                          type="date"
                          value={purchaseDate}
                          onChange={(e) => setPurchaseDate(e.target.value)}
                          className="input w-full font-mono text-xs"
                        />
                      </div>

                      {/* Payment Terms & Status */}
                      <div>
                        <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-300">
                          <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                          Payment Status
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
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
                                className="input w-16 py-1 text-center font-mono text-xs"
                              />
                              <span className="text-[11px] text-slate-400">days term</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Memo / Delivery Notes */}
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-300">
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
                  )}
                </div>

                {/* 2. FAST ITEM ENTRY BAR */}
                <div className="rounded-xl border border-ink-line bg-ink-950 p-3.5 shadow-md space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-ink-line/40">
                    <div className="flex items-center gap-2">
                      <Barcode className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Fast Item Entry
                      </span>
                      <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400">
                        F1 EXPLORER
                      </span>
                      <span className="rounded bg-sky-500/10 border border-sky-500/30 px-1.5 py-0.5 text-[10px] font-mono text-sky-300">
                        F2 TO COMMIT
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-12 items-end">
                    <div className="relative md:col-span-4">
                      <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-300">
                        <span>Item Code / Barcode</span>
                        <button
                          type="button"
                          onClick={() => setShowItemPicker(true)}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-normal"
                        >
                          <Search className="h-3 w-3" /> F1 Explorer
                        </button>
                      </label>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          setShowDropdown(true)
                          setDropdownIndex(0)
                        }}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Scan barcode or type name…"
                        className="input w-full font-medium text-xs pr-8"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-300">Unit</label>
                      <select
                        ref={unitSelectRef}
                        value={selectedUnitName}
                        onChange={(e) => handleUnitChange(e.target.value)}
                        className="input w-full text-xs font-medium"
                      >
                        {availableUnits.map((u) => (
                          <option key={u.name} value={u.name}>{u.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-1">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-300 truncate">Pcs/Unit</label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={unitMultiplierInput}
                        onChange={(e) => handleMultiplierChange(e.target.value)}
                        className="input w-full font-mono text-xs text-center"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="mb-1 block text-xs font-semibold text-slate-300">Unit Cost (₱)</label>
                      <input
                        ref={costInputRef}
                        type="number"
                        step="0.01"
                        value={unitCostPesos}
                        onChange={(e) => setUnitCostPesos(e.target.value)}
                        className="input w-full font-mono text-xs font-semibold"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="mb-1 block text-xs font-semibold text-slate-300">Qty</label>
                      <input
                        ref={qtyInputRef}
                        type="number"
                        min="1"
                        step="any"
                        value={qtyInput}
                        onChange={(e) => setQtyInput(e.target.value)}
                        className="input w-full font-mono text-xs text-center font-bold text-white bg-ink-800"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 flex items-center justify-between text-xs font-semibold text-amber-300">
                        <span>Supplier Disc</span>
                        <span className="text-[10px] text-slate-400 font-normal">5+5+5 / 10/5</span>
                      </label>
                      <input
                        ref={discountInputRef}
                        type="text"
                        value={itemDiscountInput}
                        onChange={(e) => setItemDiscountInput(e.target.value)}
                        placeholder="0 / 5+5+5 / 10/5"
                        className="input w-full font-mono text-xs font-semibold text-amber-300 border-amber-500/40"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <button
                        type="button"
                        disabled={!selectedProduct}
                        onClick={handleCommitItem}
                        className="btn-primary w-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center p-2 font-bold shadow-sm"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. LINE ITEMS GRID */}
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

                  <div className="max-h-[38vh] min-h-[160px] overflow-auto rounded-xl border border-ink-line bg-ink-950/60">
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

                {/* 4. BOTTOM SUMMARY */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-xl border border-ink-line bg-ink-950 p-3.5">
                  <div className="md:col-span-6 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <kbd className="rounded bg-ink-800 border border-ink-line px-1.5 py-0.5 font-mono text-white">
                        F1
                      </kbd>
                      Inventory Explorer
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

                  <div className="md:col-span-6 flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-4 text-xs text-slate-300">
                      <span>Gross Total:</span>
                      <span className="font-mono font-semibold text-white">{money(grossTotalC)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span>Trade / Series Discount:</span>
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

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-ghost text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMinimized(true)}
                      className="btn-ghost text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      <Minus className="h-3.5 w-3.5" />
                      Minimize
                    </button>
                  </div>

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
      )}

      {/* Universal Inventory Spotlight Explorer Modal (F1) */}
      <PurchaseItemPickerModal
        open={showItemPicker}
        onClose={() => setShowItemPicker(false)}
        products={allProducts}
        onSelectProduct={(prod) => {
          setShowItemPicker(false)
          handleSelectProduct(prod)
        }}
      />

      {/* Admin / Manager PIN Authorization Modal */}
      {showPinModal && (
        <Modal
          open
          onClose={() => {
            setShowPinModal(false)
            setPinInput('')
            setPinError('')
          }}
          title="Manager Authorization Required"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
              <Lock className="h-5 w-5 flex-shrink-0 text-amber-400" />
              <div>
                <p className="font-bold">Manager Permission Required</p>
                <p className="text-amber-300/80 mt-0.5">
                  Enter Admin or Manager PIN or Password to unlock and modify P.O.{' '}
                  <span className="font-mono font-bold text-white">{viewingPurchase?.purchase_no}</span>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin / Manager PIN or Password:
              </label>
              <div className="relative">
                <input
                  type={showPinText ? 'text' : 'password'}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value)
                    setPinError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleVerifyPin()
                  }}
                  placeholder="Enter 4-digit PIN or password"
                  autoFocus
                  className="input w-full text-center text-lg font-mono tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPinText(!showPinText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  {showPinText ? 'Hide' : 'Show'}
                </button>
              </div>
              {pinError && (
                <p className="text-xs text-danger-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {pinError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-ink-line">
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false)
                  setPinInput('')
                  setPinError('')
                }}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={verifyingPin || !pinInput.trim()}
                onClick={() => void handleVerifyPin()}
                className="btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5"
              >
                {verifyingPin ? 'Verifying…' : 'Authorize & Edit'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Purchase Order Printing Modal (A4 Document & Thermal Slip + Full Print Customizer) */}
      {showPrintModal && viewingPurchase && (
        <Modal
          open
          onClose={() => setShowPrintModal(false)}
          title={`Print Purchase Order: ${viewingPurchase.purchase_no}`}
          maxWidth="max-w-6xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-400 flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useSystemDialog}
                    onChange={(e) => setUseSystemDialog(e.target.checked)}
                    className="checkbox-custom"
                  />
                  <span>Open System Print Dialog (Ctrl+P)</span>
                </label>
                {printFormat === 'DOCUMENT' && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    <Check className="h-3 w-3" />
                    <span>{printCustomizer.fitToOnePage ? '1-Page Fit Mode Active' : 'Multi-Page Layout'}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="btn-ghost text-xs" onClick={() => setShowPrintModal(false)}>
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => void handlePrintPO()}
                  disabled={isPrintingPO}
                  className="btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
                >
                  <Printer className="h-4 w-4" />
                  <span>
                    {isPrintingPO
                      ? 'Printing…'
                      : printFormat === 'DOCUMENT'
                        ? 'Print A4 Document'
                        : 'Print Thermal Receipt'}
                  </span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-3">
            {/* Top Toolbar: Format Selector + Quick Presets + Customizer Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-line bg-ink-950 p-2">
              {/* Format Toggle Tabs */}
              <div className="flex items-center gap-1.5 bg-ink-900 p-1 rounded-lg border border-ink-line">
                <button
                  type="button"
                  onClick={() => setPrintFormat('DOCUMENT')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                    printFormat === 'DOCUMENT'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-ink-800'
                  }`}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>A4 / Letter Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat('THERMAL')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                    printFormat === 'THERMAL'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-ink-800'
                  }`}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Thermal Slip (80mm)</span>
                </button>
              </div>

              {/* Quick Presets (Only for Document format) */}
              {printFormat === 'DOCUMENT' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden md:inline">Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset('1page')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1 ${
                      printCustomizer.rowPaddingY === 3 && printCustomizer.fontSize === 11 && !printCustomizer.showRowNumber
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                        : 'bg-ink-900 text-slate-300 border-ink-line hover:border-slate-600'
                    }`}
                    title="Optimized single-page layout with wide descriptions"
                  >
                    <span>📄 Fit 1 Page</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('ultra')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1 ${
                      printCustomizer.rowDensity === 'ultra-compact' || printCustomizer.rowPaddingY === 2
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-ink-900 text-slate-300 border-ink-line hover:border-slate-600'
                    }`}
                    title="Ultra-compact padding for 25+ line items on one sheet"
                  >
                    <span>⚡ Ultra-Compact</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('standard')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1 ${
                      printCustomizer.showRowNumber && (printCustomizer.rowPaddingY ?? 0) >= 6
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500'
                        : 'bg-ink-900 text-slate-300 border-ink-line hover:border-slate-600'
                    }`}
                    title="Standard layout with row numbers, barcodes, and relaxed spacing"
                  >
                    <span>📑 Standard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCustomizerControls(!showCustomizerControls)}
                    className={`ml-2 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                      showCustomizerControls
                        ? 'bg-slate-800 text-emerald-400 border-emerald-500/50'
                        : 'bg-ink-900 text-slate-400 border-ink-line hover:text-white'
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>{showCustomizerControls ? 'Hide Controls' : 'Customizer'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Main Content Area */}
            {printFormat === 'DOCUMENT' ? (
              <div className="flex flex-col lg:flex-row gap-3 items-stretch">
                {/* Left: Customizer Control Panel */}
                {showCustomizerControls && (
                  <div className="w-full lg:w-72 shrink-0 bg-ink-950 border border-ink-line rounded-xl p-3 space-y-3.5 text-xs overflow-y-auto max-h-[64vh]">
                    <div className="flex items-center justify-between border-b border-ink-line pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-200">
                        <Settings2 className="h-4 w-4 text-emerald-400" />
                        <span>Print Customizer</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => applyPreset('1page')}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-ink-800"
                        title="Reset to 1-Page recommended settings"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Reset</span>
                      </button>
                    </div>

                    {/* Row Padding (Vertical Spacing) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-medium">Row Spacing (Padding):</span>
                        <span className="font-mono font-bold text-emerald-400">{printCustomizer.rowPaddingY}px</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="10"
                        step="1"
                        value={printCustomizer.rowPaddingY}
                        onChange={(e) => updateCustomizer({ rowPaddingY: Number(e.target.value) })}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <div className="flex justify-between gap-1 pt-0.5">
                        {[
                          { label: 'Ultra', val: 2 },
                          { label: 'Tight', val: 3 },
                          { label: 'Med', val: 5 },
                          { label: 'Loose', val: 8 }
                        ].map((d) => (
                          <button
                            key={d.val}
                            type="button"
                            onClick={() => updateCustomizer({ rowPaddingY: d.val })}
                            className={`flex-1 py-0.5 text-[10px] rounded border transition-colors ${
                              printCustomizer.rowPaddingY === d.val
                                ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                                : 'bg-ink-900 text-slate-400 border-ink-line hover:text-white'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-medium">Table Font Size:</span>
                        <span className="font-mono font-bold text-emerald-400">{printCustomizer.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="9"
                        max="13"
                        step="1"
                        value={printCustomizer.fontSize}
                        onChange={(e) => updateCustomizer({ fontSize: Number(e.target.value) })}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Page Margin (mm) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-medium">Page Margins:</span>
                        <span className="font-mono font-bold text-emerald-400">{printCustomizer.marginMm}mm</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="18"
                        step="1"
                        value={printCustomizer.marginMm}
                        onChange={(e) => updateCustomizer({ marginMm: Number(e.target.value) })}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Print Zoom / Scale (%) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-medium">Print Zoom Scale:</span>
                        <span className="font-mono font-bold text-emerald-400">{printCustomizer.scalePercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="75"
                        max="100"
                        step="5"
                        value={printCustomizer.scalePercent}
                        onChange={(e) => updateCustomizer({ scalePercent: Number(e.target.value) })}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Table Column & Content Toggles */}
                    <div className="space-y-2 border-t border-ink-line pt-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Table Columns
                      </span>
                      <label className="flex items-center justify-between gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                        <span>Show Row Number (#)</span>
                        <input
                          type="checkbox"
                          checked={Boolean(printCustomizer.showRowNumber)}
                          onChange={(e) => updateCustomizer({ showRowNumber: e.target.checked })}
                          className="checkbox-custom"
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                        <span>Show Barcode Subtitle</span>
                        <input
                          type="checkbox"
                          checked={Boolean(printCustomizer.showBarcode)}
                          onChange={(e) => updateCustomizer({ showBarcode: e.target.checked })}
                          className="checkbox-custom"
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                        <span>Show Base Units Count</span>
                        <input
                          type="checkbox"
                          checked={Boolean(printCustomizer.showBaseUnits)}
                          onChange={(e) => updateCustomizer({ showBaseUnits: e.target.checked })}
                          className="checkbox-custom"
                        />
                      </label>
                    </div>

                    {/* Document Sections Toggles */}
                    <div className="space-y-2 border-t border-ink-line pt-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Voucher Sections
                      </span>
                      <label className="flex items-center justify-between gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                        <span>Store Header</span>
                        <input
                          type="checkbox"
                          checked={Boolean(printCustomizer.showStoreHeader)}
                          onChange={(e) => updateCustomizer({ showStoreHeader: e.target.checked })}
                          className="checkbox-custom"
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                        <span>Supplier & Ref Cards</span>
                        <input
                          type="checkbox"
                          checked={Boolean(printCustomizer.showInfoCards)}
                          onChange={(e) => updateCustomizer({ showInfoCards: e.target.checked })}
                          className="checkbox-custom"
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                        <span>Memo & Salesman Bar</span>
                        <input
                          type="checkbox"
                          checked={Boolean(printCustomizer.showMemoBar)}
                          onChange={(e) => updateCustomizer({ showMemoBar: e.target.checked })}
                          className="checkbox-custom"
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                        <span>Delivery Notes Box</span>
                        <input
                          type="checkbox"
                          checked={Boolean(printCustomizer.showNotesBox)}
                          onChange={(e) => updateCustomizer({ showNotesBox: e.target.checked })}
                          className="checkbox-custom"
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                        <span>Signatures Block</span>
                        <input
                          type="checkbox"
                          checked={Boolean(printCustomizer.showSignatures)}
                          onChange={(e) => updateCustomizer({ showSignatures: e.target.checked })}
                          className="checkbox-custom"
                        />
                      </label>
                    </div>

                    {/* Fit to 1 Page Checkbox */}
                    <div className="border-t border-ink-line pt-2.5">
                      <label className="flex items-center justify-between gap-2 text-[11px] font-bold text-emerald-400 cursor-pointer select-none bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/60">
                        <span>Fit to 1 Page Rule</span>
                        <input
                          type="checkbox"
                          checked={Boolean(printCustomizer.fitToOnePage)}
                          onChange={(e) => updateCustomizer({ fitToOnePage: e.target.checked })}
                          className="checkbox-custom"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Right: Interactive Live Paper Preview */}
                <div className="flex-1 min-w-0 bg-slate-800/60 border border-ink-line rounded-xl p-3 overflow-y-auto max-h-[64vh]">
                  <div
                    className="bg-white text-slate-900 rounded-md shadow-lg font-sans transition-all duration-150 mx-auto"
                    style={{
                      padding: `${Math.max(12, (printCustomizer.marginMm || 8) * 2)}px`,
                      fontSize: `${printCustomizer.fontSize || 11}px`,
                      maxWidth: '820px'
                    }}
                  >
                    {/* Header */}
                    {printCustomizer.showStoreHeader && (
                      <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-2 mb-2">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                            {settings?.store_name || 'TINDA POS STORE'}
                          </h3>
                          <p className="text-[10px] text-slate-600">{settings?.address || ''}</p>
                          <p className="text-[10px] font-bold text-emerald-700 mt-0.5">
                            PURCHASE ORDER & STOCK RECEIVING VOUCHER
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">
                            OFFICIAL P.O. NUMBER
                          </span>
                          <p className="text-base font-black font-mono text-slate-900 leading-tight">
                            {viewingPurchase.purchase_no}
                          </p>
                          <p className="text-[10px] text-slate-500">Date: {shortDate(viewingPurchase.purchase_date)}</p>
                        </div>
                      </div>
                    )}

                    {/* Vendor and References Cards */}
                    {printCustomizer.showInfoCards && (
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200 rounded p-2 text-[10px] mb-2">
                        <div>
                          <span className="text-slate-500 block font-semibold">SUPPLIER:</span>
                          <p className="font-bold text-slate-900 text-[11px]">{viewingPurchase.supplier_name}</p>
                          {currentViewSupplier?.address && (
                            <p className="text-slate-600 text-[9px]">{currentViewSupplier.address}</p>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Invoice #:</span>
                            <strong className="font-mono">{viewingPurchase.invoice_no || '—'}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Receipt #:</span>
                            <strong className="font-mono">{viewingPurchase.receipt_no || '—'}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Payment:</span>
                            <strong className={viewingPurchase.is_paid ? 'text-emerald-700' : 'text-amber-700'}>
                              {viewingPurchase.is_paid ? 'PAID' : `TERMS (${viewingPurchase.terms_days || 0}D)`}
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Memo & Salesman Bar */}
                    {printCustomizer.showMemoBar && (
                      <div className="mb-2">
                        <div className="flex justify-between items-end px-1 font-bold text-slate-800 text-[10px]">
                          <div>
                            <span className="font-extrabold text-slate-500">Memo:</span>{' '}
                            {viewingPurchase.notes || 'COD'}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-500">Salesman:</span>{' '}
                            {viewingPurchase.user_name || 'admin'}
                          </div>
                        </div>
                        <div className="border-t-2 border-double border-slate-900 mt-1" />
                      </div>
                    )}

                    {/* Main Table: Wide Description + Compact Meta Columns */}
                    <div className="border border-slate-200 rounded overflow-hidden mb-2">
                      <table className="w-full text-left border-collapse table-fixed">
                        <thead className="bg-slate-900 text-white text-[9px] uppercase font-bold tracking-wider">
                          <tr>
                            {printCustomizer.showRowNumber && (
                              <th style={{ width: '28px' }} className="p-1 text-center">
                                #
                              </th>
                            )}
                            <th style={{ width: '58px' }} className="p-1 text-center">
                              QUANTITY
                            </th>
                            <th style={{ width: '50px' }} className="p-1 text-center">
                              UNIT
                            </th>
                            <th className="p-1 text-left">DESCRIPTION</th>
                            <th style={{ width: '78px' }} className="p-1 text-right">
                              UNIT PRICE
                            </th>
                            <th style={{ width: '72px' }} className="p-1 text-center">
                              DISCOUNT
                            </th>
                            <th style={{ width: '86px' }} className="p-1 text-right">
                              AMOUNT
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {((viewItems.length > 0 ? viewItems : viewingPurchase.items) || []).map(
                            (it: any, idx: number) => {
                              const qty = it.qty || 1
                              const unitCostC = it.unitCostC ?? it.grossUnitCostC ?? it.unit_cost_c ?? 0
                              const subtotalC = it.subtotalC ?? it.subtotal_c ?? 0
                              const discInput = it.discountInput ?? it.discount_input ?? ''
                              const discC =
                                it.discountC ?? it.discount_c ?? Math.max(0, unitCostC * qty - subtotalC)
                              const discStr = formatDiscountPercent(discInput, discC, unitCostC * qty, { withEffective: true })

                              const padY = `${printCustomizer.rowPaddingY || 3}px`

                              return (
                                <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : ''}>
                                  {printCustomizer.showRowNumber && (
                                    <td
                                      style={{ padding: `${padY} 4px` }}
                                      className="text-center text-slate-500 font-mono text-[9px]"
                                    >
                                      {idx + 1}
                                    </td>
                                  )}
                                  <td
                                    style={{ padding: `${padY} 4px` }}
                                    className="text-center font-mono font-bold text-slate-900"
                                  >
                                    {qty}
                                  </td>
                                  <td style={{ padding: `${padY} 4px` }} className="text-center">
                                    <span className="bg-slate-100 border border-slate-300 rounded px-1 text-[9px] font-bold">
                                      {(it.unitName || it.unit_name || 'PC').toUpperCase()}
                                    </span>
                                  </td>
                                  <td
                                    style={{ padding: `${padY} 6px` }}
                                    className="font-bold uppercase text-slate-900 leading-tight"
                                  >
                                    {it.productName || it.product_name}
                                    {printCustomizer.showBarcode && (it.barcode || it.product_barcode) && (
                                      <span className="block font-mono text-[8px] text-slate-500 font-normal normal-case">
                                        BARCODE: {it.barcode || it.product_barcode}
                                      </span>
                                    )}
                                    {printCustomizer.showBaseUnits && it.qty_base > it.qty && (
                                      <span className="text-[8px] text-slate-500 font-normal normal-case ml-1">
                                        ({it.qty_base} total units)
                                      </span>
                                    )}
                                  </td>
                                  <td
                                    style={{ padding: `${padY} 4px` }}
                                    className="text-right font-mono text-slate-700 font-medium"
                                  >
                                    {money(unitCostC)}
                                  </td>
                                  <td
                                    style={{ padding: `${padY} 4px` }}
                                    className="text-center font-mono font-bold text-amber-700"
                                  >
                                    {discStr}
                                  </td>
                                  <td
                                    style={{ padding: `${padY} 4px` }}
                                    className="text-right font-mono font-bold text-slate-900"
                                  >
                                    {money(subtotalC)}
                                  </td>
                                </tr>
                              )
                            }
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Section: Notes Box + Totals */}
                    <div className="flex justify-between items-start gap-3 pt-1">
                      {printCustomizer.showNotesBox ? (
                        <div className="text-[10px] text-slate-600 flex-1 bg-slate-50 border border-dashed border-slate-300 rounded p-2">
                          <p>
                            <strong className="text-slate-800">Memo / Notes:</strong>{' '}
                            {viewingPurchase.notes || 'COD'}
                          </p>
                          <p className="mt-0.5 text-[9px] text-slate-500">
                            Total Received: {viewingPurchase.items?.length || 0} unique items (
                            {viewingPurchase.items?.reduce((s, i) => s + i.qty, 0)} packages)
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1" />
                      )}

                      <div className="w-52 bg-slate-50 border border-slate-200 rounded p-2 text-[10px] space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Gross:</span>
                          <span className="font-mono">{money(viewingPurchase.total_c)}</span>
                        </div>
                        {viewingPurchase.discount_c ? (
                          <div className="flex justify-between text-amber-700 font-semibold">
                            <span>Trade Disc:</span>
                            <span className="font-mono">-{money(viewingPurchase.discount_c)}</span>
                          </div>
                        ) : null}
                        <div className="flex justify-between text-xs font-black text-emerald-700 border-t border-emerald-600 pt-1">
                          <span>Net Payable:</span>
                          <span className="font-mono font-black">
                            {money(viewingPurchase.net_total_c ?? viewingPurchase.total_c)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Signatures */}
                    {printCustomizer.showSignatures && (
                      <div className="grid grid-cols-3 gap-4 pt-4 mt-2 border-t border-slate-200 text-center text-[9px] text-slate-600 font-medium">
                        <div className="border-t border-slate-400 pt-1">
                          Prepared / Encoded By
                          <br />
                          <strong className="text-slate-900 font-bold">{viewingPurchase.user_name || 'Staff'}</strong>
                        </div>
                        <div className="border-t border-slate-400 pt-1">
                          Received & Verified By
                          <br />
                          <strong className="text-slate-900 font-bold">Store Custodian</strong>
                        </div>
                        <div className="border-t border-slate-400 pt-1">
                          Approved By
                          <br />
                          <strong className="text-slate-900 font-bold">Store Manager</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Thermal Receipt Preview */
              <div className="rounded-xl border border-ink-line bg-ink-950 p-4 max-h-[60vh] overflow-y-auto">
                <div className="bg-white text-black p-4 rounded-lg shadow-sm font-mono text-xs whitespace-pre-wrap max-w-sm mx-auto leading-relaxed border border-slate-300">
                  {formatPurchaseOrderSlipLines({
                    storeName: settings?.store_name || 'TINDA POS',
                    purchase: {
                      ...viewingPurchase,
                      supplier_address: currentViewSupplier?.address,
                      supplier_contact: currentViewSupplier?.contact_person,
                      supplier_phone: currentViewSupplier?.phone
                    }
                  }).join('\n')}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
