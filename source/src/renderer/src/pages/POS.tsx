import { useEffect, useMemo, useRef, useState } from 'react'
import { create } from 'zustand'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  Check,
  Banknote,
  Smartphone,
  Wallet,
  Pause,
  Loader2,
  ChevronDown,
  AlertTriangle,
  Barcode,
  Camera,
  HelpCircle,
  Server,
  Laptop,
  Receipt,
  Monitor,
  Tv,
  Tag,
  Edit3,
  KeyRound,
  Landmark,
  LayoutList,
  LayoutGrid,
  Volume2,
  VolumeX,
  Printer,
  Wrench
} from 'lucide-react'
import { playScanSuccess, playScanError, playCheckoutChime, isSoundMuted, setSoundMuted } from '../lib/sound'
import { useAuth } from '../stores/auth'
import { createScannerListener } from '../lib/barcodeScanner'
import { CameraScannerModal } from '../components/CameraScannerModal'
import { CounterCameraScanner } from '../components/CounterCameraScanner'
import { QuickExpenseModal } from '../components/QuickExpenseModal'
import { PosToolsModal } from '../components/PosToolsModal'
import { useGuide } from '../stores/guide'
import type { Product, Customer, Sale, Category, HeldSale } from '@shared/types'
import { money, isWeighableUnit, formatQuantity } from '@shared/format'
import { Modal } from '../components/ui/Modal'
import { ReceiptPaper } from '../components/ReceiptPaper'
import type { PaymentInput } from '@shared/ipc'
import type { PrintResult } from '@shared/ipc'
import { ProductImage } from '../components/ui/ProductImage'
import { toastSuccess, toastError, toastWarning } from '../stores/toast'
import { useNav } from '../stores/nav'
import { cashInputFromCents } from '../lib/payment'
import { availableBase, cartHasStockConflict, maxQuantity, reservedBase, calculateItemUnitPrice } from '../lib/cartStock'
import { localDate, productExpirationStatus } from '@shared/expiration'

function warnIfNearExpiry(p: Product): void {
  const status = productExpirationStatus(p)
  if (status === 'SOON' || status === 'NEAR') {
    const detail = p.expiration_mode === 'BATCH'
      ? 'Batch stock expiring soon'
      : p.expiration_date
        ? `Expires on ${p.expiration_date}`
        : 'Expiring soon'
    toastWarning(`⚠️ Near Expiry: "${p.name}"`, `${detail} (${status === 'SOON' ? 'within 7 days' : 'within 30 days'})`)
  }
}

const saleStock = (p: Product): number => p.expiration_mode === 'ITEM' && (!p.expiration_date || p.expiration_date < localDate()) ? 0
  : p.expiration_mode === 'BATCH' ? (p.batches ?? []).reduce((n, b) => n + (b.expiration_date && b.expiration_date >= localDate() ? b.quantity : 0), 0)
    : p.sellable_stock ?? p.stock

interface CartItem {
  product_id: number
  name: string
  description?: string | null
  unit_name: string
  qty: number
  unit_price_c: number
  base_price_c?: number
  wholesale_price_c?: number | null
  wholesale_min_qty?: number | null
  is_wholesale?: boolean
  custom_price_c?: number | null
  is_custom_price?: boolean
  cost_base_c: number
  stock_base: number
  conversion_to_base: number
}

interface CartState {
  items: CartItem[]
  customer_id: number | null
  customer_name: string | null
  discount_pesos: number
  add: (p: Product, qtyToAdd?: number) => void
  setQty: (product_id: number, qty: number) => void
  setItemPrice: (product_id: number, priceC: number) => void
  resetItemPrice: (product_id: number) => void
  remove: (product_id: number) => void
  clear: () => void
  setCustomer: (id: number | null, name?: string) => void
  setDiscountPesos: (v: number) => void
  replace: (items: CartItem[], discount_pesos: number) => void
  syncStocks: (products: Product[]) => void
}

export const usePosCart = create<CartState>((set) => ({
  items: [],
  customer_id: null,
  customer_name: null,
  discount_pesos: 0,
  add: (p: Product, qtyToAdd = 1) =>
    set((s) => {
      const stock = saleStock(p)
      const ex = s.items.find((i) => i.product_id === p.id)
      if (stock <= 0) return s
      const weighable = isWeighableUnit(p.base_unit)
      const quantityToAdd = Math.max(weighable ? 0.001 : 1, qtyToAdd)
      if (ex) {
        const nextQty = Math.min(ex.qty + quantityToAdd, maxQuantity(stock, ex.conversion_to_base, weighable))
        const { unitPriceC, isWholesale, isCustom } = calculateItemUnitPrice(
          ex.base_price_c ?? ex.unit_price_c,
          nextQty,
          ex.wholesale_price_c,
          ex.wholesale_min_qty,
          ex.custom_price_c
        )
        return {
          items: s.items.map((i) =>
            i === ex
              ? {
                  ...i,
                  stock_base: stock,
                  qty: nextQty,
                  unit_price_c: unitPriceC,
                  is_wholesale: isWholesale,
                  is_custom_price: isCustom
                }
              : i
          )
        }
      }
      const initialQty = Math.min(quantityToAdd, maxQuantity(stock, 1, weighable))
      const basePrice = p.default_price_c
      const { unitPriceC, isWholesale, isCustom } = calculateItemUnitPrice(
        basePrice,
        initialQty,
        p.wholesale_price_c,
        p.wholesale_min_qty,
        null
      )
      return {
        items: [
          ...s.items,
          {
            product_id: p.id,
            name: p.name,
            description: p.description ?? null,
            unit_name: p.base_unit,
            qty: initialQty,
            unit_price_c: unitPriceC,
            base_price_c: basePrice,
            wholesale_price_c: p.wholesale_price_c,
            wholesale_min_qty: p.wholesale_min_qty,
            is_wholesale: isWholesale,
            custom_price_c: null,
            is_custom_price: isCustom,
            cost_base_c: p.purchase_cost_c,
            stock_base: stock,
            conversion_to_base: 1
          }
        ]
      }
    }),
  setQty: (product_id, qty) =>
    set((s) => ({
      items: s.items
        .map((i) => {
          if (i.product_id !== product_id) return i
          const weighable = isWeighableUnit(i.unit_name)
          const safeQty = Number.isFinite(qty) ? (weighable ? Math.round(qty * 1000) / 1000 : Math.round(qty)) : 0
          const maxQ = maxQuantity(i.stock_base, i.conversion_to_base, weighable)
          const nextQty = Math.min(Math.max(0, safeQty), maxQ)
          const { unitPriceC, isWholesale, isCustom } = calculateItemUnitPrice(
            i.base_price_c ?? i.unit_price_c,
            nextQty,
            i.wholesale_price_c,
            i.wholesale_min_qty,
            i.custom_price_c
          )
          return {
            ...i,
            qty: nextQty,
            unit_price_c: unitPriceC,
            is_wholesale: isWholesale,
            is_custom_price: isCustom
          }
        })
        .filter((i) => i.qty > 0)
    })),
  setItemPrice: (product_id, priceC) =>
    set((s) => ({
      items: s.items.map((i) => {
        if (i.product_id !== product_id) return i
        const safePriceC = Math.max(0, Math.round(priceC))
        const { unitPriceC, isWholesale, isCustom } = calculateItemUnitPrice(
          i.base_price_c ?? i.unit_price_c,
          i.qty,
          i.wholesale_price_c,
          i.wholesale_min_qty,
          safePriceC
        )
        return {
          ...i,
          custom_price_c: safePriceC,
          unit_price_c: unitPriceC,
          is_wholesale: isWholesale,
          is_custom_price: isCustom
        }
      })
    })),
  resetItemPrice: (product_id) =>
    set((s) => ({
      items: s.items.map((i) => {
        if (i.product_id !== product_id) return i
        const { unitPriceC, isWholesale, isCustom } = calculateItemUnitPrice(
          i.base_price_c ?? i.unit_price_c,
          i.qty,
          i.wholesale_price_c,
          i.wholesale_min_qty,
          null
        )
        return {
          ...i,
          custom_price_c: null,
          unit_price_c: unitPriceC,
          is_wholesale: isWholesale,
          is_custom_price: isCustom
        }
      })
    })),
  remove: (product_id) => set((s) => ({ items: s.items.filter((i) => i.product_id !== product_id) })),
  clear: () => set({ items: [], customer_id: null, customer_name: null, discount_pesos: 0 }),
  setCustomer: (id, name) => set({ customer_id: id, customer_name: id === null ? null : name ?? null }),
  setDiscountPesos: (v) => set({ discount_pesos: Math.max(0, v) }),
  replace: (items, discount_pesos) =>
    set({
      items: items.map((item) => {
        const { unitPriceC, isWholesale, isCustom } = calculateItemUnitPrice(
          item.base_price_c ?? item.unit_price_c,
          item.qty,
          item.wholesale_price_c,
          item.wholesale_min_qty,
          item.custom_price_c
        )
        return {
          ...item,
          base_price_c: item.base_price_c ?? item.unit_price_c,
          unit_price_c: unitPriceC,
          is_wholesale: isWholesale,
          is_custom_price: isCustom
        }
      }),
      customer_id: null,
      customer_name: null,
      discount_pesos
    }),
  syncStocks: (products) =>
    set((s) => {
      const stocks = new Map(products.map((p) => [p.id, saleStock(p)]))
      return { items: s.items.map((item) => ({ ...item, stock_base: stocks.get(item.product_id) ?? item.stock_base })) }
    })
}))

export function POS(): React.JSX.Element {
  const { setPage } = useNav()
  const [q, setQ] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [catFilter, setCatFilter] = useState<number | 'ALL'>('ALL')
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [priceRefs, setPriceRefs] = useState<Record<number, number>>({})
  const categoryMenuRef = useRef<HTMLDivElement>(null)
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [counterCameraEnabled, setCounterCameraEnabled] = useState(() => {
    return localStorage.getItem('tinda_counter_camera_enabled') === 'true'
  })

  const [posToolsOpen, setPosToolsOpen] = useState(false)

  useEffect(() => {
    const handleToggleEvent = () => {
      setCounterCameraEnabled(localStorage.getItem('tinda_counter_camera_enabled') === 'true')
    }
    const handleOpenTools = () => {
      setPosToolsOpen(true)
    }
    window.addEventListener('tinda-counter-camera-toggle', handleToggleEvent)
    window.addEventListener('tinda-open-pos-tools', handleOpenTools)
    return () => {
      window.removeEventListener('tinda-counter-camera-toggle', handleToggleEvent)
      window.removeEventListener('tinda-open-pos-tools', handleOpenTools)
    }
  }, [])

  const handleToggleCounterCamera = (val: boolean) => {
    setCounterCameraEnabled(val)
    localStorage.setItem('tinda_counter_camera_enabled', String(val))
    if (val) {
      toastSuccess('Hands-Free Counter Camera Active', 'Wave products in front of camera to auto-scan')
    }
  }

  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('tinda_pos_view_mode') as 'list' | 'grid') || 'list'
  })

  const setAndSaveViewMode = (mode: 'list' | 'grid') => {
    setViewMode(mode)
    localStorage.setItem('tinda_pos_view_mode', mode)
  }

  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const gridContainerRef = useRef<HTMLDivElement>(null)

  // Infinite scroll pagination state
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalProductsCount, setTotalProductsCount] = useState<number | null>(null)
  const currentOffsetRef = useRef(0)

  // Sound effects mute state
  const [soundMuted, setSoundMutedState] = useState(() => isSoundMuted())
  const toggleSoundMute = () => {
    const next = !soundMuted
    setSoundMuted(next)
    setSoundMutedState(next)
    if (!next) {
      playScanSuccess()
    }
  }

  // Low stock and Near Expiry counts for HUD badge
  const [lowStockCount, setLowStockCount] = useState(0)
  const [nearExpiryCount, setNearExpiryCount] = useState(0)
  const [activeHudFilter, setActiveHudFilter] = useState<'ALL' | 'LOW' | 'EXPIRY'>('ALL')
  const [zReadingBusy, setZReadingBusy] = useState(false)

  const handleQuickZRead = async () => {
    if (zReadingBusy) return
    setZReadingBusy(true)
    try {
      const result = await window.api.reports.printXRead()
      if (result.ok) {
        toastSuccess('Shift & Day Balancing Slip Sent to Printer', 'Printing Z-Reading thermal report...')
      } else {
        toastError('Z-Reading print failed', result.message)
      }
    } catch (err) {
      toastError('Unable to print Z-Reading', String((err as Error)?.message || err))
    } finally {
      setZReadingBusy(false)
    }
  }

  const displayedProducts = useMemo(() => {
    if (activeHudFilter === 'ALL') return products
    if (activeHudFilter === 'LOW') {
      return products.filter((p) => {
        const stock = saleStock(p)
        return stock > 0 && stock <= p.low_stock_threshold
      })
    }
    if (activeHudFilter === 'EXPIRY') {
      return products.filter((p) => {
        const exp = productExpirationStatus(p)
        return exp === 'SOON' || exp === 'NEAR'
      })
    }
    return products
  }, [products, activeHudFilter])

  useEffect(() => {
    setSelectedRowIndex(displayedProducts.length > 0 ? 0 : -1)
  }, [displayedProducts])

  useEffect(() => {
    if (selectedRowIndex >= 0 && viewMode === 'list' && tableContainerRef.current) {
      const rowEl = tableContainerRef.current.querySelector(`[data-row-index="${selectedRowIndex}"]`) as HTMLElement | null
      if (rowEl) {
        rowEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedRowIndex, viewMode])

  const [lanStatus, setLanStatus] = useState<import('@shared/types').LanStatus | null>(null)
  useEffect(() => {
    void window.api.lan?.getStatus().then(setLanStatus).catch(() => {})
    const unsub = window.api.lan?.onStatus((s) => setLanStatus(s))
    return () => unsub?.()
  }, [])

  const cartItems = usePosCart((state) => state.items)
  const cartDiscount = usePosCart((state) => state.discount_pesos)
  const cartCustomer = usePosCart((state) => state.customer_name)

  useEffect(() => {
    const items = cartItems.map((i) => ({
      id: i.product_id,
      name: i.name,
      qty: i.qty,
      unit_name: i.unit_name,
      price_c: i.unit_price_c,
      subtotal_c: Math.round(i.qty * i.unit_price_c)
    }))
    const subtotal_c = items.reduce((sum, x) => sum + x.subtotal_c, 0)
    const discount_c = cartDiscount
    const total_c = Math.max(0, subtotal_c - discount_c)
    void window.api.phoneScanner?.updateCfd({
      status: items.length > 0 ? 'ACTIVE' : 'IDLE',
      items,
      subtotal_c,
      discount_c,
      total_c,
      customerName: cartCustomer ?? undefined
    }).catch(() => {})
  }, [cartItems, cartDiscount, cartCustomer])

  useEffect(() => {
    let alive = true
    const refresh = async () => {
      const ids = [...new Set([...products.map((p) => p.id), ...usePosCart.getState().items.map((i) => i.product_id)])]
      try {
        const updated = await Promise.all(ids.map((id) => window.api.products.get(id)))
        if (!alive) return
        usePosCart.getState().syncStocks(updated)
        const byId = new Map(updated.map((p) => [p.id, p]))
        setProducts((current) => current.map((p) => byId.get(p.id) ?? p))
      } catch { /* Checkout revalidates stock if the refresh is unavailable. */ }
    }
    const onFocus = () => { void refresh() }
    window.addEventListener('focus', onFocus)
    const timer = window.setInterval(onFocus, 15000)
    return () => { alive = false; window.removeEventListener('focus', onFocus); window.clearInterval(timer) }
  }, [products])

  const selectedCategory = catFilter === 'ALL'
    ? 'All categories'
    : categories.find((category) => category.id === catFilter)?.name ?? 'All categories'

  const PAGE_SIZE = 120

  const search = async (term: string, categoryId?: number | null, isLoadMore = false) => {
    if (isLoadMore) {
      if (loadingMore || !hasMore) return
      setLoadingMore(true)
    } else {
      setLoading(true)
      currentOffsetRef.current = 0
    }
    setError(null)
    try {
      const offset = isLoadMore ? currentOffsetRef.current : 0
      const opts: { status: string; limit: number; offset: number; category_id?: number | null } = {
        status: 'ACTIVE',
        limit: PAGE_SIZE,
        offset
      }
      if (categoryId != null) opts.category_id = categoryId
      const res = await window.api.products.search(term, opts)
      const newRows = res.rows || []
      const total = res.total ?? newRows.length

      setTotalProductsCount(total)

      if (isLoadMore) {
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id))
          const filtered = newRows.filter((p) => !existingIds.has(p.id))
          const merged = [...prev, ...filtered]
          currentOffsetRef.current = merged.length
          setHasMore(merged.length < total && newRows.length === PAGE_SIZE)
          return merged
        })
      } else {
        setProducts(newRows)
        currentOffsetRef.current = newRows.length
        setHasMore(newRows.length < total && newRows.length === PAGE_SIZE)
        usePosCart.getState().syncStocks(newRows)
      }

      // Compute HUD counts for low stock and near expiry
      let lowCount = 0
      let nearExpCount = 0
      for (const p of newRows) {
        const stock = saleStock(p)
        if (stock > 0 && stock <= p.low_stock_threshold) lowCount++
        const exp = productExpirationStatus(p)
        if (exp === 'SOON' || exp === 'NEAR') nearExpCount++
      }
      setLowStockCount(lowCount)
      setNearExpiryCount(nearExpCount)

      try {
        const refs = await window.api.priceReferences.search({ linkedOnly: true, limit: 150 })
        const map: Record<number, number> = {}
        const refsList = refs?.rows || (refs as any)?.references || []
        for (const r of refsList) {
          if (r.product_id && r.market_price_c !== null) {
            map[r.product_id] = r.market_price_c
          }
        }
        setPriceRefs(map)
      } catch {
        // Non-blocking
      }
    } catch (e) {
      setError(String((e as Error)?.message || e))
    } finally {
      if (isLoadMore) setLoadingMore(false)
      else setLoading(false)
    }
  }

  const loadMoreProducts = () => {
    if (!loading && !loadingMore && hasMore) {
      void search(q, catFilter === 'ALL' ? null : catFilter, true)
    }
  }

  useEffect(() => {
    void search('')
    window.api.categories.list().then(setCategories).catch(() => {})
  }, [])
  useEffect(() => window.api.inventory.onChanged((event) => {
    void Promise.all(event.product_ids.map(id => window.api.products.get(id)))
      .then(changed => usePosCart.getState().syncStocks(changed))
      .catch(() => {})
    void search(q, catFilter === 'ALL' ? null : catFilter)
  }), [q, catFilter])

  useEffect(() => {
    if (!categoryMenuOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!categoryMenuRef.current?.contains(event.target as Node)) setCategoryMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCategoryMenuOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [categoryMenuOpen])

  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 })

  const handleScan = async (scannedBarcode: string) => {
    try {
      const code = scannedBarcode.trim()
      if (!code) return

      const now = Date.now()
      // Enforce 2.5s debounce for identical barcode scans to prevent accidental duplicate cart additions
      if (lastScanRef.current.code.toLowerCase() === code.toLowerCase() && now - lastScanRef.current.time < 2500) {
        return
      }
      lastScanRef.current = { code, time: now }

      // Parse multiplier prefix if any (e.g. "5*BARCODE" or "10*48000123")
      let qtyMultiplier = 1
      let cleanCode = code
      const multiMatch = code.match(/^(\d+(?:\.\d+)?)\s*[*xX]\s*(.+)$/)
      if (multiMatch && multiMatch[1] && multiMatch[2]) {
        qtyMultiplier = parseFloat(multiMatch[1]) || 1
        cleanCode = multiMatch[2].trim()
      }

      const res = await window.api.products.search(cleanCode, { status: 'ACTIVE', limit: 10 })
      const target = cleanCode.toLowerCase()
      // Strict matching: Barcode scans MUST match exact barcode or SKU only. Never pick random name matches.
      const found = res.rows.find(
        (p) =>
          p.barcode?.toLowerCase() === target ||
          p.sku?.toLowerCase() === target ||
          p.units?.some((u) => u.barcode?.toLowerCase() === target)
      )

      if (found) {
        if (saleStock(found) < 1) {
          playScanError()
          toastError(`"${found.name}" is out of stock!`)
        } else {
          usePosCart.getState().add(found, qtyMultiplier)
          playScanSuccess()
          toastSuccess(`Scanned: ${qtyMultiplier > 1 ? `${qtyMultiplier}x ` : ''}${found.name}`)
          warnIfNearExpiry(found)
          setQ('')
        }
      } else {
        playScanError()
        toastError(`No product found for barcode: ${cleanCode}`)
      }
    } catch (err) {
      playScanError()
      toastError(`Barcode scan failed: ${String((err as Error)?.message || err)}`)
    }
  }

  const [phoneConnected, setPhoneConnected] = useState(false)
  const [cameraScannerInitialTab, setCameraScannerInitialTab] = useState<'phone' | 'camera' | 'guide' | 'cfd'>('phone')

  useEffect(() => {
    const scannerListener = createScannerListener({
      onScan: (code) => {
        void handleScan(code)
      }
    })

    window.addEventListener('keydown', scannerListener)

    // Check initial phone scanner status
    void window.api.phoneScanner?.getStatus().then((status) => {
      if (status?.connected) setPhoneConnected(true)
    })

    // Listen for phone scanner scans over Wi-Fi
    const cleanupPhoneScan = window.api.phoneScanner?.onScan((code) => {
      void handleScan(code)
    })

    // Listen for phone connection state changes
    const cleanupPhoneStatus = window.api.phoneScanner?.onStatus((status) => {
      setPhoneConnected(!!status.connected)
    })

    return () => {
      window.removeEventListener('keydown', scannerListener)
      cleanupPhoneScan?.()
      cleanupPhoneStatus?.()
    }
  }, [])

  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handlePosHotkeys = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
        return
      }
      if (e.key === 'F3') {
        e.preventDefault()
        setPosToolsOpen((prev) => !prev)
        return
      }
      if (e.key === 'F7') {
        e.preventDefault()
        setExpenseModalOpen(true)
        return
      }
      if (e.key === 'F8') {
        e.preventDefault()
        setPage('ewallet')
        return
      }
      if (e.key === '/') {
        const tag = (document.activeElement?.tagName || '').toLowerCase()
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault()
          searchInputRef.current?.focus()
          searchInputRef.current?.select()
          return
        }
      }
      if (e.key === 'ArrowDown') {
        const tag = (document.activeElement?.tagName || '').toLowerCase()
        if (tag === 'textarea') return
        e.preventDefault()
        setSelectedRowIndex((prev) => (displayedProducts.length > 0 ? Math.min(prev + 1, displayedProducts.length - 1) : -1))
        return
      }
      if (e.key === 'ArrowUp') {
        const tag = (document.activeElement?.tagName || '').toLowerCase()
        if (tag === 'textarea') return
        e.preventDefault()
        setSelectedRowIndex((prev) => (displayedProducts.length > 0 ? Math.max(prev - 1, 0) : -1))
        return
      }
      if (e.key === 'Enter') {
        const activeTag = (document.activeElement?.tagName || '').toLowerCase()
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          if (selectedRowIndex >= 0 && selectedRowIndex < displayedProducts.length) {
            const p = displayedProducts[selectedRowIndex]
            if (p) {
              e.preventDefault()
              if (saleStock(p) > 0) {
                usePosCart.getState().add(p)
                warnIfNearExpiry(p)
              } else {
                toastError('Out of stock', `Available for sale: 0 ${p.base_unit}`)
              }
            }
          }
        }
      }
      if (e.key === 'Escape') {
        if (categoryMenuOpen) {
          setCategoryMenuOpen(false)
          return
        }
        if (q) {
          setQ('')
          searchInputRef.current?.blur()
          void search('', catFilter === 'ALL' ? null : catFilter)
        }
      }
    }
    window.addEventListener('keydown', handlePosHotkeys)
    return () => window.removeEventListener('keydown', handlePosHotkeys)
  }, [categoryMenuOpen, q, catFilter, displayedProducts, selectedRowIndex])

  const chooseCategory = (categoryId: number | 'ALL') => {
    setCatFilter(categoryId)
    setCategoryMenuOpen(false)
    void search(q, categoryId === 'ALL' ? null : categoryId)
  }

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[160px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchInputRef}
              value={q}
              onChange={(e) => { setQ(e.target.value); void search(e.target.value, catFilter === 'ALL' ? null : catFilter) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const trimmed = q.trim()
                  // Check if user entered a quantity multiplier with product name/code (e.g. "5*Coke" or "10*48000123")
                  const multiMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*[*xX]\s*(.+)$/)
                  if (multiMatch && multiMatch[1] && multiMatch[2]) {
                    e.preventDefault()
                    void handleScan(trimmed)
                  } else if (trimmed) {
                    e.preventDefault()
                    void handleScan(trimmed)
                  } else if (selectedRowIndex >= 0 && selectedRowIndex < displayedProducts.length) {
                    const p = displayedProducts[selectedRowIndex]
                    if (p) {
                      e.preventDefault()
                      if (saleStock(p) > 0) {
                        usePosCart.getState().add(p)
                        warnIfNearExpiry(p)
                      } else {
                        toastError('Out of stock', `Available for sale: 0 ${p.base_unit}`)
                      }
                    }
                  }
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setSelectedRowIndex((prev) => (displayedProducts.length > 0 ? Math.min(prev + 1, displayedProducts.length - 1) : -1))
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setSelectedRowIndex((prev) => (displayedProducts.length > 0 ? Math.max(prev - 1, 0) : -1))
                }
              }}
              placeholder="Search product by name or barcode… (F1 or /)"
              className="input h-11 w-full pl-9 !text-base"
              autoFocus
            />
          </div>
          <div ref={categoryMenuRef} className="relative w-44 shrink-0">
            <button
              type="button"
              onClick={() => setCategoryMenuOpen((open) => !open)}
              className="input flex min-h-11 w-full items-center justify-between gap-2 text-left !text-base"
              aria-haspopup="listbox"
              aria-expanded={categoryMenuOpen}
            >
              <span className="truncate">{selectedCategory}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {categoryMenuOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-ink-line bg-ink-850 p-1 shadow-pop" role="listbox">
                <button
                  type="button"
                  onClick={() => chooseCategory('ALL')}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-ink-700 ${catFilter === 'ALL' ? 'text-brand-300' : 'text-slate-200'}`}
                  role="option"
                  aria-selected={catFilter === 'ALL'}
                >
                  <span>All categories</span>
                  {catFilter === 'ALL' && <Check className="h-4 w-4" />}
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => chooseCategory(category.id)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-ink-700 ${catFilter === category.id ? 'text-brand-300' : 'text-slate-200'}`}
                    role="option"
                    aria-selected={catFilter === category.id}
                  >
                    <span className="truncate">{category.name}</span>
                    {catFilter === category.id && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                ))}
                {categories.length === 0 && <p className="px-3 py-2 text-xs text-slate-500">No categories yet.</p>}
              </div>
            )}
          </div>

          {/* Inventory Safety HUD Filter Badges */}
          <div className="flex items-center gap-1.5 shrink-0" role="group" aria-label="Inventory HUD Filters">
            {lowStockCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveHudFilter((prev) => (prev === 'LOW' ? 'ALL' : 'LOW'))}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  activeHudFilter === 'LOW'
                    ? 'border-amber-400 bg-amber-500/30 text-amber-200 ring-2 ring-amber-400/40 shadow-sm'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                }`}
                title="Filter products with low stock alert"
              >
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Low Stock</span>
                <span className="ml-0.5 rounded-full bg-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-200">
                  {lowStockCount}
                </span>
              </button>
            )}

            {nearExpiryCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveHudFilter((prev) => (prev === 'EXPIRY' ? 'ALL' : 'EXPIRY'))}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  activeHudFilter === 'EXPIRY'
                    ? 'border-orange-400 bg-orange-500/30 text-orange-200 ring-2 ring-orange-400/40 shadow-sm'
                    : 'border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20'
                }`}
                title="Filter products nearing expiration"
              >
                <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
                <span>Near Expiry</span>
                <span className="ml-0.5 rounded-full bg-orange-500/30 px-1.5 py-0.2 text-[10px] font-bold text-orange-200">
                  {nearExpiryCount}
                </span>
              </button>
            )}

            {activeHudFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setActiveHudFilter('ALL')}
                className="text-[11px] font-medium text-slate-400 hover:text-white underline underline-offset-2 px-1"
                title="Clear HUD filter and show all products"
              >
                Reset
              </button>
            )}
          </div>

          {/* View Mode Toggle: List vs Grid */}
          <div className="flex items-center rounded-lg border border-ink-line bg-ink-850 p-0.5 shrink-0" role="group" aria-label="Catalog view mode">
            <button
              type="button"
              onClick={() => setAndSaveViewMode('list')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-brand-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Listing Table View (Dense Professional)"
            >
              <LayoutList className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => setAndSaveViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-brand-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Card Grid View (Visual Tiles)"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>
        {error && <p className="mb-3 text-sm text-danger-400">{error}</p>}


        {viewMode === 'list' ? (
          /* High-Density Enterprise Listing Table */
          <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-ink-line bg-ink-900/60 overflow-hidden shadow-sm">
            <div
              ref={tableContainerRef}
              className="flex-1 min-h-0 overflow-auto pb-28"
              onScroll={(e) => {
                const el = e.currentTarget
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
                  loadMoreProducts()
                }
              }}
            >
              <div className="min-w-[680px]">
                {/* Table Header */}
                <div className="sticky top-0 z-10 grid grid-cols-[minmax(240px,2fr)_120px_130px_120px_140px] items-center gap-3 border-b border-ink-line bg-ink-850 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 select-none shadow-sm">
                  <div>Product / SKU / Barcode</div>
                  <div>Category</div>
                  <div>Stock Level</div>
                  <div className="text-right">Price / Tier</div>
                  <div className="text-center">Cart / Action</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-ink-line/50">
                  {loading && Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                      <div className="h-9 w-9 rounded-lg bg-ink-800 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-44 rounded bg-ink-800" />
                        <div className="h-3 w-28 rounded bg-ink-800" />
                      </div>
                      <div className="h-5 w-20 rounded bg-ink-800" />
                      <div className="h-5 w-24 rounded bg-ink-800" />
                    </div>
                  ))}

                  {!loading && displayedProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                      <Search className="h-8 w-8 text-slate-600 mb-2" />
                      <p className="text-sm font-medium text-slate-300">No products found</p>
                      <p className="text-xs text-slate-500 mt-1">Try searching by product name, SKU, or scanning a barcode.</p>
                    </div>
                  )}

                  {!loading && displayedProducts.map((p, idx) => {
                    const cartItem = cartItems.find((item) => item.product_id === p.id)
                    const stock = saleStock(p)
                    const available = availableBase(stock, cartItem)
                    const blocked = p.stock - stock
                    const low = available > 0 && available <= p.low_stock_threshold
                    const out = available <= 0
                    const isSelected = selectedRowIndex === idx
                    const expStatus = productExpirationStatus(p)
                    const isNearExpiry = expStatus === 'SOON' || expStatus === 'NEAR'
                    const categoryName = categories.find((c) => c.id === p.category_id)?.name || 'General'

                    return (
                      <div
                        key={p.id}
                        data-row-index={idx}
                        onClick={() => {
                          if (out) {
                            toastError(blocked > 0 ? 'Expired or undated stock is blocked' : 'Out of stock', `Available for sale: ${stock} ${p.base_unit}.`)
                          } else {
                            usePosCart.getState().add(p)
                            warnIfNearExpiry(p)
                          }
                        }}
                        className={`grid grid-cols-[minmax(240px,2fr)_120px_130px_120px_140px] items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer select-none ${
                          out
                            ? 'opacity-40 bg-ink-950/40 hover:bg-ink-950/60'
                            : isSelected
                            ? 'bg-brand-500/15 border-l-4 border-l-brand-400'
                            : 'hover:bg-ink-800/80 active:bg-ink-700/80'
                        }`}
                      >
                        {/* Column 1: Product Thumbnail, Name, SKU, Barcode */}
                        <div className="flex items-center gap-3 min-w-0">
                          <ProductImage
                            src={p.image_path}
                            alt={p.name}
                            className="h-9 w-9 rounded-lg border border-ink-line/80 object-cover shrink-0 bg-ink-800"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold text-white group-hover:text-brand-300" title={p.name}>
                                {p.name}
                              </span>
                              {cartItem && (
                                <span className="flex items-center gap-1 rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-300 border border-brand-500/30 shrink-0">
                                  <ShoppingCart className="h-2.5 w-2.5" />
                                  {cartItem.qty}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span className="font-mono text-brand-400/90 font-medium text-[11px]">{p.sku}</span>
                              {p.barcode && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className="font-mono text-slate-400 text-[11px] truncate">{p.barcode}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Category */}
                        <div className="truncate text-xs text-slate-300">
                          <span className="inline-block max-w-full truncate rounded-md bg-ink-800/90 px-2 py-1 border border-ink-line/60 font-medium text-slate-300">
                            {categoryName}
                          </span>
                        </div>

                        {/* Column 3: Stock Level & Expiry */}
                        <div className="flex flex-col text-xs min-w-0">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${out ? 'bg-red-400' : low ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                            <span className={`font-semibold ${out ? 'text-red-400' : low ? 'text-amber-300' : 'text-slate-200'}`}>
                              {blocked > 0
                                ? `${formatQuantity(stock)} ${p.base_unit}`
                                : cartItem
                                ? `${formatQuantity(available)} / ${formatQuantity(stock)} ${p.base_unit}`
                                : `${formatQuantity(stock)} ${p.base_unit}`}
                            </span>
                          </div>
                          {out ? (
                            <span className="text-[10px] text-red-400/80 font-medium mt-0.5">Out of Stock</span>
                          ) : low ? (
                            <span className="text-[10px] text-amber-400/90 font-medium mt-0.5">Low Stock Alert</span>
                          ) : isNearExpiry ? (
                            <span className="text-[10px] text-amber-300 font-medium mt-0.5">⚠️ Near Expiry</span>
                          ) : blocked > 0 ? (
                            <span className="text-[10px] text-red-400 font-medium mt-0.5">{blocked} blocked</span>
                          ) : (
                            <span className="text-[10px] text-slate-500 mt-0.5">Available</span>
                          )}
                        </div>

                        {/* Column 4: Price & Wholesale / SRP */}
                        <div className="flex flex-col items-end text-right min-w-0">
                          <span className="text-base font-bold text-brand-400">
                            {money(p.default_price_c)}
                          </span>
                          {p.wholesale_price_c != null && p.wholesale_min_qty != null ? (
                            <span className="text-[10px] font-semibold text-emerald-400" title={`Wholesale price for ${p.wholesale_min_qty}+ units`}>
                              WS: {money(p.wholesale_price_c)} (≥{p.wholesale_min_qty})
                            </span>
                          ) : p.srp_c != null ? (
                            <span className="text-[10px] text-slate-400" title="Suggested Retail Price">
                              SRP: {money(p.srp_c)}
                            </span>
                          ) : priceRefs[p.id] !== undefined ? (
                            <span className="text-[10px] text-brand-400/70" title="Market Reference Price">
                              Ref: {money(priceRefs[p.id]!)}
                            </span>
                          ) : null}
                        </div>

                        {/* Column 5: Action / Quick Stepper */}
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {cartItem ? (
                            <div className="flex items-center gap-1 rounded-lg border border-brand-500/40 bg-ink-950 p-0.5 shadow-sm">
                              <button
                                type="button"
                                onClick={() => {
                                  if (cartItem.qty > 1) {
                                    usePosCart.getState().setQty(p.id, cartItem.qty - 1)
                                  } else {
                                    usePosCart.getState().remove(p.id)
                                  }
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-800 text-slate-300 hover:bg-ink-700 hover:text-white transition-colors"
                                title="Decrease Quantity"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="min-w-7 text-center font-bold text-xs text-white">
                                {cartItem.qty}
                              </span>
                              <button
                                type="button"
                                disabled={available <= 0}
                                onClick={() => {
                                  if (available > 0) {
                                    usePosCart.getState().add(p)
                                  } else {
                                    toastError('Out of stock', `Cannot exceed available stock (${stock} ${p.base_unit}).`)
                                  }
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-slate-950 hover:bg-brand-400 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Increase Quantity"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={out}
                              onClick={() => {
                                if (!out) {
                                  usePosCart.getState().add(p)
                                  warnIfNearExpiry(p)
                                }
                              }}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                out
                                  ? 'border border-ink-line/40 bg-ink-800/40 text-slate-500 cursor-not-allowed'
                                  : 'border border-brand-500/40 bg-brand-500/10 text-brand-300 hover:bg-brand-500 hover:text-slate-950 shadow-sm active:scale-95'
                              }`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {loadingMore && (
                    <div className="flex items-center justify-center py-4 text-xs text-slate-400 gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                      <span>Loading more products...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Card Grid View (Visual Tiles) */
          <div
            ref={gridContainerRef}
            onScroll={(e) => {
              const el = e.currentTarget
              if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
                loadMoreProducts()
              }
            }}
            className="grid min-h-0 flex-1 auto-rows-[185px] grid-cols-[repeat(auto-fill,minmax(min(100%,180px),1fr))] content-start gap-3 overflow-y-auto pb-28"
          >
            {loading && Array.from({ length: 12 }).map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
            {!loading && displayedProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm text-slate-500">No products found.</div>
            )}
            {!loading && displayedProducts.map((p) => {
              const cartItem = cartItems.find(item => item.product_id === p.id)
              const stock = saleStock(p)
              const available = availableBase(stock, cartItem)
              const blocked = p.stock - stock
              const low = available > 0 && available <= p.low_stock_threshold
              const out = available <= 0
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (out) {
                      toastError(blocked > 0 ? 'Expired or undated stock is blocked' : 'Out of stock', `Available for sale: ${stock} ${p.base_unit}.`)
                    } else {
                      usePosCart.getState().add(p)
                      warnIfNearExpiry(p)
                    }
                  }}
                  aria-disabled={out}
                  className="card group flex h-[185px] min-w-0 flex-col p-3 text-left transition hover:border-brand-500/50 aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
                >
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <span className="truncate text-xs font-bold text-brand-400">{p.sku}</span>
                    <span className={`text-xs font-bold ${out ? 'text-red-400' : low ? 'text-amber-400' : 'text-slate-500'}`}>
                      {blocked > 0 ? `Sellable: ${formatQuantity(stock)}` : cartItem ? `Available: ${formatQuantity(available)} / ${formatQuantity(stock)}` : `Stock: ${formatQuantity(stock)}`} {p.base_unit}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 min-w-0">
                    <ProductImage src={p.image_path} alt={p.name} className="h-10 w-10 rounded-md shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 break-words text-xs sm:text-sm font-semibold leading-snug text-white" title={p.name}>{p.name}</p>
                      {p.description && (
                        <p className="line-clamp-2 break-words text-[11px] text-slate-400 mt-0.5" title={p.description}>{p.description}</p>
                      )}
                      {blocked > 0 && <p className="truncate text-xs text-red-400 mt-0.5">{blocked} expired / undated</p>}
                    </div>
                  </div>
                  <div className="mt-auto flex items-baseline justify-between gap-1 pt-1">
                    <div>
                      <p className="text-xl font-bold text-brand-400">{money(p.default_price_c)}</p>
                      {p.wholesale_price_c != null && p.wholesale_min_qty != null && (
                        <p className="text-[10px] font-semibold text-emerald-400">
                          WS: {money(p.wholesale_price_c)} (≥{p.wholesale_min_qty})
                        </p>
                      )}
                    </div>
                    {p.srp_c != null ? (
                      <span className="text-[11px] text-slate-400 font-normal" title="Suggested Retail Price">
                        SRP: {money(p.srp_c)}
                      </span>
                    ) : priceRefs[p.id] !== undefined ? (
                      <span className="text-[11px] text-brand-400/80 font-normal" title="Market Reference Price">
                        Ref: {money(priceRefs[p.id]!)}
                      </span>
                    ) : null}
                  </div>
                </button>
              )
            })}
            {loadingMore && (
              <div className="col-span-full flex items-center justify-center py-4 text-xs text-slate-400 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                <span>Loading more products...</span>
              </div>
            )}
          </div>
        )}
      </div>

      <CartPanel
        counterCameraEnabled={counterCameraEnabled}
        onToggleCounterCamera={handleToggleCounterCamera}
        onScan={(code) => void handleScan(code)}
      />

      <CameraScannerModal
        open={cameraScannerOpen}
        initialTab={cameraScannerInitialTab}
        onClose={() => setCameraScannerOpen(false)}
        onScan={(code) => void handleScan(code)}
      />

      <QuickExpenseModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
      />

      <PosToolsModal
        open={posToolsOpen}
        onClose={() => setPosToolsOpen(false)}
        counterCameraEnabled={counterCameraEnabled}
        onToggleCounterCamera={handleToggleCounterCamera}
        phoneConnected={phoneConnected}
        onOpenPhonePair={() => {
          setCameraScannerInitialTab('phone')
          setCameraScannerOpen(true)
        }}
        onOpenCfd={() => {
          setCameraScannerInitialTab('cfd')
          setCameraScannerOpen(true)
        }}
        lanStatus={lanStatus}
        soundMuted={soundMuted}
        onToggleSoundMute={toggleSoundMute}
        onQuickZRead={() => void handleQuickZRead()}
        zReadingBusy={zReadingBusy}
        onOpenQuickExpense={() => setExpenseModalOpen(true)}
      />
    </div>
  )
}

function CartQtyInput({
  item,
  inputRef
}: {
  item: CartItem
  inputRef?: React.RefObject<HTMLInputElement | null>
}): React.JSX.Element {
  const weighable = isWeighableUnit(item.unit_name)
  const [val, setVal] = useState(String(item.qty))

  useEffect(() => {
    if (parseFloat(val) !== item.qty) {
      setVal(String(item.qty))
    }
  }, [item.qty])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (weighable) {
      if (!/^\d*\.?\d*$/.test(raw)) return
      setVal(raw)
      const parsed = parseFloat(raw)
      if (!isNaN(parsed) && parsed > 0) {
        usePosCart.getState().setQty(item.product_id, parsed)
      }
    } else {
      const clean = raw.replace(/\D/g, '')
      setVal(clean)
      const parsed = parseInt(clean || '0', 10)
      usePosCart.getState().setQty(item.product_id, parsed)
    }
  }

  const handleBlur = () => {
    const parsed = parseFloat(val)
    if (isNaN(parsed) || parsed <= 0) {
      if (parsed === 0) {
        usePosCart.getState().remove(item.product_id)
      } else {
        setVal(String(item.qty))
      }
    } else {
      usePosCart.getState().setQty(item.product_id, parsed)
      setVal(String(item.qty))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={weighable ? 'decimal' : 'numeric'}
      value={val}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      aria-label={`Quantity for ${item.name}`}
      className={`h-10 ${weighable ? 'w-20' : 'w-14'} rounded-lg border border-ink-line bg-ink-950 py-1 text-center text-base font-bold text-white focus:border-brand-500 focus:outline-none`}
      title={weighable ? 'Enter weight/kilos (e.g. 2.5, 2.24). Press F2 to focus' : 'Press F2 to focus quantity'}
    />
  )
}

function ManagerPinModal({
  item,
  onAuthorized,
  onClose
}: {
  item: CartItem
  onAuthorized: () => void
  onClose: () => void
}): React.JSX.Element {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const checkPin = async (inputPin: string) => {
    if (!/^\d{4}$/.test(inputPin)) {
      setError('Please enter a 4-digit PIN.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await window.api.auth.verifyManagerPin(inputPin)
      if (res.valid) {
        toastSuccess('Manager Authorized', `Approved by ${res.name || 'Manager/Admin'}`)
        onAuthorized()
      } else {
        setError('Invalid PIN or not authorized. Only Admin or Manager PIN can approve price overrides.')
      }
    } catch (err) {
      setError(String((err as Error)?.message || err))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    void checkPin(pin)
  }

  return (
    <Modal open title="Manager Authorization Required" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300">
          <KeyRound className="h-6 w-6 shrink-0 text-amber-400" />
          <div className="text-xs">
            <p className="font-semibold text-sm">Manager / Admin PIN Required</p>
            <p className="text-amber-300/80 mt-0.5">
              Price edit override for <strong>{item.name}</strong> requires manager authorization.
            </p>
          </div>
        </div>

        <div>
          <label className="label">Enter 4-Digit Manager / Admin PIN</label>
          <input
            ref={inputRef}
            type="password"
            maxLength={4}
            inputMode="numeric"
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4)
              setPin(val)
              setError(null)
              if (val.length === 4) {
                void checkPin(val)
              }
            }}
            placeholder="••••"
            className="input w-full text-center text-2xl tracking-[0.5em] font-mono"
            disabled={loading}
          />
        </div>

        {error && <p className="text-xs text-danger-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={pin.length !== 4 || loading} className="btn-primary">
            {loading ? 'Verifying…' : 'Authorize Override'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function PriceOverrideModal({
  item,
  onClose
}: {
  item: CartItem
  onClose: () => void
}): React.JSX.Element {
  const basePricePesos = (item.base_price_c ?? item.unit_price_c) / 100
  const currentPricePesos = item.unit_price_c / 100
  const costPesos = item.cost_base_c / 100
  const [newPrice, setNewPrice] = useState<string>(String(currentPricePesos))
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const enteredPesos = parseFloat(newPrice) || 0
  const enteredCents = Math.round(enteredPesos * 100)
  const diffPesos = basePricePesos - enteredPesos
  const totalItemCents = Math.round(enteredCents * item.qty)

  const isBelowCost = costPesos > 0 && enteredPesos < costPesos

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (isNaN(enteredPesos) || enteredPesos < 0) {
      setError('Please enter a valid price greater than or equal to 0.')
      return
    }
    usePosCart.getState().setItemPrice(item.product_id, enteredCents)
    toastSuccess('Price Updated', `${item.name} set to ${money(enteredCents)}`)
    onClose()
  }

  const handleReset = () => {
    usePosCart.getState().resetItemPrice(item.product_id)
    toastSuccess('Price Reset', `${item.name} reverted to normal price`)
    onClose()
  }

  return (
    <Modal open title={`Edit Unit Price: ${item.name}`} onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="rounded-lg border border-ink-line bg-ink-900/50 p-3 text-xs space-y-1.5">
          <div className="flex justify-between items-center text-slate-300">
            <span>Item:</span>
            <span className="font-semibold text-white break-words text-right max-w-[200px]">{item.name}</span>
          </div>
          {item.description && (
            <div className="flex justify-between items-center text-slate-400">
              <span>Specs / Description:</span>
              <span className="text-right text-slate-300 break-words max-w-[200px]">{item.description}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-slate-300">
            <span>Original Retail Price:</span>
            <span className="font-bold text-brand-400">{money(item.base_price_c ?? item.unit_price_c)}</span>
          </div>
          {costPesos > 0 && (
            <div className="flex justify-between items-center text-slate-400">
              <span>Purchase Cost:</span>
              <span className="font-medium text-slate-300">{money(item.cost_base_c)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-slate-300">
            <span>Current Quantity:</span>
            <span className="font-semibold text-white">{item.qty} {item.unit_name}</span>
          </div>
        </div>

        <div>
          <label className="label flex items-center justify-between">
            <span>New Unit Price (₱) *</span>
            <span className="text-[11px] text-slate-500">Per 1 {item.unit_name}</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₱</span>
            <input
              ref={inputRef}
              type="number"
              step="any"
              min="0"
              required
              value={newPrice}
              onChange={(e) => {
                setNewPrice(e.target.value)
                setError(null)
              }}
              placeholder="0.00"
              className="input w-full pl-8 text-xl font-bold text-white focus:border-brand-500"
            />
          </div>
        </div>

        {enteredPesos > 0 && (
          <div className="rounded-lg border border-ink-line bg-ink-950/60 p-3 text-xs space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>Unit Discount:</span>
              <span className={diffPesos > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                {diffPesos > 0 ? `-₱${diffPesos.toFixed(2)} / pc` : diffPesos < 0 ? `+₱${Math.abs(diffPesos).toFixed(2)} / pc` : 'No discount'}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>New Line Subtotal ({item.qty} {item.unit_name}):</span>
              <span className="font-bold text-brand-300 text-sm">{money(totalItemCents)}</span>
            </div>
          </div>
        )}

        {isBelowCost && (
          <div className="flex items-center gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 p-2.5 text-xs text-danger-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-danger-400" />
            <span>Warning: ₱{enteredPesos.toFixed(2)} is lower than purchase cost ({money(item.cost_base_c)}). Store will lose margin.</span>
          </div>
        )}

        {error && <p className="text-xs text-danger-400">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          {item.is_custom_price ? (
            <button
              type="button"
              onClick={handleReset}
              className="btn-ghost text-xs text-amber-400 hover:text-amber-300"
            >
              Reset to Base Price
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Apply Price
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function CartPanel({
  counterCameraEnabled,
  onToggleCounterCamera,
  onScan
}: {
  counterCameraEnabled: boolean
  onToggleCounterCamera: (enabled: boolean) => void
  onScan: (code: string) => void
}): React.JSX.Element {
  const { items, discount_pesos, customer_name } = usePosCart()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutMethod, setCheckoutMethod] = useState<'CASH' | 'GCASH' | 'MAYA' | 'UTANG'>('CASH')
  const [customerOpen, setCustomerOpen] = useState(false)
  const [heldOpen, setHeldOpen] = useState(false)
  const [heldSales, setHeldSales] = useState<HeldSale[]>([])
  const [holdBusy, setHoldBusy] = useState(false)
  const [priceEditItem, setPriceEditItem] = useState<CartItem | null>(null)
  const [pinPromptItem, setPinPromptItem] = useState<CartItem | null>(null)
  const discountInputRef = useRef<HTMLInputElement>(null)
  const lastQtyInputRef = useRef<HTMLInputElement>(null)

  const [seniorPwdOpen, setSeniorPwdOpen] = useState(false)
  const [discountType, setDiscountType] = useState<'SENIOR_PWD' | 'CUSTOM'>('SENIOR_PWD')
  const [seniorName, setSeniorName] = useState('')
  const [seniorIdNumber, setSeniorIdNumber] = useState('')
  const [customMode, setCustomMode] = useState<'PERCENT' | 'PESOS'>('PERCENT')
  const [customPercent, setCustomPercent] = useState('10')
  const [customAmount, setCustomAmount] = useState('')

  const handleApplySeniorPwd = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!seniorIdNumber.trim()) {
      toastError('ID Required', 'Please enter the Senior Citizen / PWD booklet or ID number.')
      return
    }
    // Statutory 20% discount on cart subtotal
    const discountC = Math.round(subtotal * 0.2)
    usePosCart.getState().setDiscountPesos(discountC)
    if (seniorName.trim() && !customer_name) {
      usePosCart.getState().setCustomer(null, `${seniorName.trim()} (SC/PWD #${seniorIdNumber.trim()})`)
    }
    toastSuccess('Senior / PWD 20% Discount Applied', `Saved ${money(discountC)} (ID #${seniorIdNumber})`)
    setSeniorPwdOpen(false)
  }

  const handleApplyCustomDiscount = (e?: React.FormEvent) => {
    e?.preventDefault()
    let discountC = 0
    if (customMode === 'PERCENT') {
      const pct = Math.min(100, Math.max(0, parseFloat(customPercent) || 0))
      if (pct <= 0) {
        toastError('Invalid Percentage', 'Please enter a valid discount percentage.')
        return
      }
      discountC = Math.round(subtotal * (pct / 100))
    } else {
      const amt = parseFloat(customAmount) || 0
      if (amt <= 0) {
        toastError('Invalid Amount', 'Please enter a valid discount peso amount.')
        return
      }
      discountC = Math.min(subtotal, Math.round(amt * 100))
    }

    usePosCart.getState().setDiscountPesos(discountC)
    toastSuccess('Custom Discount Applied', `Deducted ${money(discountC)} from cart total.`)
    setSeniorPwdOpen(false)
  }


  const handleEditPriceClick = (item: CartItem) => {
    const currentUser = useAuth.getState().user
    const isManagerOrAdmin = currentUser?.roles.some((r) => r === 'ADMIN' || r === 'MANAGER') ?? false
    if (isManagerOrAdmin) {
      setPriceEditItem(item)
    } else {
      setPinPromptItem(item)
    }
  }

  const subtotal = useMemo(() => items.reduce((s, i) => s + Math.round(i.unit_price_c * i.qty), 0), [items])
  const total = Math.max(0, subtotal - discount_pesos)
  const stockConflict = cartHasStockConflict(items)

  const loadHeldSales = async () => {
    try {
      setHeldSales(await window.api.pos.held())
    } catch (e) {
      toastError('Held sales failed', String((e as Error)?.message || e))
    }
  }

  useEffect(() => { void loadHeldSales() }, [])

  const holdCurrentSale = async () => {
    if (!items.length || holdBusy) return
    setHoldBusy(true)
    try {
      const held = await window.api.pos.hold({
        items: items.map((item) => ({
          product_id: item.product_id,
          name: item.name,
          unit_name: item.unit_name,
          qty: item.qty,
          qty_base: item.qty * item.conversion_to_base,
          unit_price_c: item.unit_price_c,
          cost_base_c: item.cost_base_c,
          stock_base: item.stock_base,
          subtotal_c: Math.round(item.unit_price_c * item.qty)
        })),
        discount_c: discount_pesos,
        customer_id: null,
        payments: []
      })
      usePosCart.getState().clear()
      await loadHeldSales()
      toastSuccess('Sale held', `Reference ${held.token}`)
    } catch (e) {
      toastError('Hold failed', String((e as Error)?.message || e))
    } finally {
      setHoldBusy(false)
    }
  }

  useEffect(() => {
    const handleCartHotkeys = (e: KeyboardEvent) => {
      if (checkoutOpen || customerOpen || heldOpen || priceEditItem || pinPromptItem) return

      if (e.key === 'F2') {
        if (items.length > 0) {
          e.preventDefault()
          lastQtyInputRef.current?.focus()
          lastQtyInputRef.current?.select()
        }
        return
      }

      if (e.key === 'F4') {
        e.preventDefault()
        discountInputRef.current?.focus()
        discountInputRef.current?.select()
        return
      }

      if (e.key === 'F8') {
        if (items.length > 0 && !holdBusy) {
          e.preventDefault()
          void holdCurrentSale()
        }
        return
      }

      if (e.key === 'F9') {
        if (items.length > 0 && !stockConflict) {
          e.preventDefault()
          setCheckoutMethod('CASH')
          setCheckoutOpen(true)
        }
        return
      }

      if (e.key === 'F10') {
        if (items.length > 0 && !stockConflict) {
          e.preventDefault()
          setCheckoutMethod('GCASH')
          setCheckoutOpen(true)
        }
        return
      }
    }

    window.addEventListener('keydown', handleCartHotkeys)
    return () => window.removeEventListener('keydown', handleCartHotkeys)
  }, [checkoutOpen, customerOpen, heldOpen, priceEditItem, pinPromptItem, items, holdBusy, stockConflict])

  const resumeHeldSale = async (id: number) => {
    if (items.length && !confirm('Replace the current cart with this held sale?')) return
    setHoldBusy(true)
    try {
      const [held, productResult] = await Promise.all([
        window.api.pos.resumeHeld(id),
        window.api.products.search('', { status: 'ACTIVE', limit: 1000 })
      ])
      const catalog = new Map(productResult.rows.map((product) => [product.id, product]))
      usePosCart.getState().replace(held.items.map((item) => {
        const prod = item.product_id != null ? catalog.get(item.product_id) : undefined
        const basePrice = prod?.default_price_c ?? item.unit_price_c
        const isCustom = item.unit_price_c !== basePrice
        return {
          product_id: item.product_id as number,
          name: item.name,
          description: prod?.description ?? null,
          unit_name: item.unit_name,
          qty: item.qty,
          unit_price_c: item.unit_price_c,
          base_price_c: basePrice,
          wholesale_price_c: prod?.wholesale_price_c ?? null,
          wholesale_min_qty: prod?.wholesale_min_qty ?? null,
          custom_price_c: isCustom ? item.unit_price_c : null,
          is_custom_price: isCustom,
          cost_base_c: item.cost_base_c,
          stock_base: item.product_id == null ? 0 : catalog.has(item.product_id) ? saleStock(catalog.get(item.product_id)!) : 0,
          conversion_to_base: item.qty > 0 ? item.qty_base / item.qty : 1
        }
      }), held.discount_c)
      setHeldOpen(false)
      await loadHeldSales()
      toastSuccess('Sale resumed', `Reference ${held.token}`)
    } catch (e) {
      toastError('Resume failed', String((e as Error)?.message || e))
    } finally {
      setHoldBusy(false)
    }
  }

  const deleteHeldSale = async (held: HeldSale) => {
    if (!confirm(`Delete held sale ${held.token}?`)) return
    setHoldBusy(true)
    try {
      await window.api.pos.deleteHeld(held.id)
      await loadHeldSales()
      toastSuccess('Held sale deleted', held.token)
    } catch (e) {
      toastError('Delete failed', String((e as Error)?.message || e))
    } finally {
      setHoldBusy(false)
    }
  }

  return (
    <aside className="flex min-h-0 w-full shrink-0 flex-col border-t border-ink-line bg-ink-900 md:w-[23rem] md:border-l md:border-t-0 xl:w-[26rem]">
      <div className="flex items-center justify-between border-b border-ink-line px-4 py-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-200">
          <ShoppingCart className="h-4 w-4" /> Cart
          {items.length > 0 && <span className="badge bg-brand-600/20 text-brand-300">{items.length}</span>}
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={() => setHeldOpen(true)} className="btn-ghost-2 rounded-lg px-2 py-1 text-xs" title="Resume held sales">
            Held {heldSales.length > 0 && `(${heldSales.length})`}
          </button>
        {items.length > 0 && (
          <button onClick={() => usePosCart.getState().clear()} className="rounded-lg p-1.5 text-slate-500 hover:bg-ink-800 hover:text-danger-400" title="Clear cart">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        </div>
      </div>

      {/* Hands-Free Counter Camera Scanner Widget */}
      <CounterCameraScanner
        enabled={counterCameraEnabled}
        onToggleEnabled={onToggleCounterCamera}
        onScan={onScan}
      />

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {items.length === 0 && (
          <p className="py-10 text-center text-sm leading-6 text-slate-500">
            Cart is empty.
            <br />
            Tap a product to add it.
          </p>
        )}
        {items.map((i, idx) => (
          <div key={i.product_id} className="rounded-lg border border-ink-line bg-ink-800/50 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="min-w-0 break-words text-base font-semibold leading-6 text-slate-200">{i.name}</p>
                {i.description && (
                  <p className="text-xs text-slate-400 break-words mt-0.5 line-clamp-2" title={i.description}>
                    {i.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {i.is_custom_price && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 border border-amber-500/30 text-[10px] font-bold text-amber-300">
                      <Tag className="h-3 w-3" /> Custom Unit Price
                    </span>
                  )}
                  {i.is_wholesale && !i.is_custom_price && (
                    <span className="inline-flex items-center gap-1 mt-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
                      🏷️ Wholesale Tier
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => usePosCart.getState().remove(i.product_id)} className="shrink-0 text-slate-600 hover:text-danger-400 p-1" title="Remove">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const weighable = isWeighableUnit(i.unit_name)
                    const step = weighable && i.qty <= 1 ? (i.qty > 0.25 ? 0.25 : i.qty) : 1
                    usePosCart.getState().setQty(i.product_id, Math.max(0, Math.round((i.qty - step) * 1000) / 1000))
                  }}
                  className="btn-ghost-2 h-10 w-10 rounded-lg"
                  title="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <CartQtyInput item={i} inputRef={idx === items.length - 1 ? lastQtyInputRef : undefined} />
                <button
                  disabled={i.qty >= maxQuantity(i.stock_base, i.conversion_to_base, isWeighableUnit(i.unit_name))}
                  onClick={() => {
                    const weighable = isWeighableUnit(i.unit_name)
                    const step = weighable && i.qty < 1 ? 0.25 : 1
                    usePosCart.getState().setQty(i.product_id, Math.round((i.qty + step) * 1000) / 1000)
                  }}
                  className="btn-ghost-2 h-10 w-10 rounded-lg disabled:opacity-30"
                  title={i.qty >= maxQuantity(i.stock_base, i.conversion_to_base, isWeighableUnit(i.unit_name)) ? `Only ${formatQuantity(maxQuantity(i.stock_base, i.conversion_to_base, isWeighableUnit(i.unit_name)))} remaining` : 'Increase quantity'}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">{money(Math.round(i.unit_price_c * i.qty))}</p>
                <div className="flex items-center justify-end gap-1.5">
                  <p className="text-sm text-slate-400">
                    @{money(i.unit_price_c)} / {i.unit_name}
                    {i.base_price_c && i.base_price_c !== i.unit_price_c && (
                      <span className="line-through text-xs text-slate-500 ml-1">
                        {money(i.base_price_c)}
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleEditPriceClick(i)}
                    className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold text-brand-400 hover:bg-brand-500/10 hover:text-brand-300 transition"
                    title="Edit line item unit price"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
            <p className={`mt-1 text-xs ${reservedBase(i) > i.stock_base ? 'text-danger-400' : 'text-slate-500'}`}>Available: {formatQuantity(availableBase(i.stock_base, i))} {i.unit_name} / {formatQuantity(i.stock_base)} {i.unit_name}</p>
          </div>
        ))}
      </div>

      {stockConflict && <div className="mx-4 mb-2 rounded-lg border border-danger-500/30 bg-danger-500/10 p-2 text-xs text-danger-300">Current stock changed. Please adjust the cart to the available quantity before checkout.</div>}

      <div className="space-y-2 border-t border-ink-line px-4 py-3 text-base">
        <div className="flex items-center justify-between text-slate-400">
          <span className="min-w-0">Select the borrower</span>
          <button onClick={() => setCustomerOpen(true)} className="flex shrink-0 items-center gap-1 text-brand-400 hover:text-brand-300">
            <User className="h-3.5 w-3.5" /> Select Customer
          </button>
        </div>
        {customer_name && <p role="status" className="flex items-center gap-2 break-words text-brand-400"><span>Selected: {customer_name}</span><Check aria-label="Selected" className="h-4 w-4 shrink-0" /></p>}
        <div className="flex items-center justify-between text-slate-400">
          <span>Subtotal</span><span className="text-slate-200">{money(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>Discount (₱)</span>
            <span className="text-[10px] text-slate-500 font-mono">[F4]</span>
            <button
              type="button"
              onClick={() => setSeniorPwdOpen(true)}
              className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-300 border border-brand-500/30 hover:bg-brand-500/20 transition-colors"
              title="Apply Senior / PWD 20% or Custom Discount"
            >
              Discounts
            </button>
          </div>

          <input
            ref={discountInputRef}
            type="number"
            min={0}
            value={discount_pesos ? discount_pesos / 100 : ''}
            onChange={(e) => usePosCart.getState().setDiscountPesos(Math.max(0, Math.round((parseFloat(e.target.value) || 0) * 100)))}
            placeholder="0.00"
            className="w-24 rounded-lg border border-ink-line bg-ink-950 px-2 py-1 text-right text-sm text-slate-200"
          />
        </div>
        <div className="flex justify-between border-t border-ink-line pt-1.5">
          <span className="font-bold text-white">TOTAL</span>
          <span className="text-2xl font-bold text-brand-400">{money(total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 pb-4 pt-1">
        <button
          disabled={items.length === 0}
          onClick={() => void holdCurrentSale()}
          className="btn-ghost flex flex-col items-center gap-0.5 py-2 text-xs disabled:opacity-40"
          title="Hold Current Sale (F8)"
        >
          {holdBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />} Hold (F8)
        </button>
        <button
          disabled={items.length === 0}
          onClick={() => usePosCart.getState().clear()}
          className="btn-secondary col-span-1 py-2 text-xs disabled:opacity-40"
        >
          Clear
        </button>
        <button
          disabled={items.length === 0 || stockConflict}
          onClick={() => {
            if (!items.length) return
            setCheckoutMethod('CASH')
            setCheckoutOpen(true)
          }}
          className="btn-primary col-span-2 min-h-12 py-3 !text-base disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <span>CHECKOUT</span>
          <span className="text-xs font-normal opacity-80">(F9 Cash / F10 GCash)</span>
        </button>
      </div>

      {checkoutOpen && (
        <CheckoutModal
          subtotal={subtotal}
          total={total}
          initialMethod={checkoutMethod}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
      {customerOpen && <CustomerPicker onClose={() => setCustomerOpen(false)} />}
      {heldOpen && (
        <Modal open onClose={() => setHeldOpen(false)} title="Held Sales" maxWidth="max-w-lg">
          <div className="space-y-2">
            {heldSales.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No held sales.</p>}
            {heldSales.map((held) => (
              <div key={held.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-line bg-ink-900 p-3">
                <div className="min-w-0">
                  <p className="font-semibold text-white">Hold #{held.token}</p>
                  <p className="text-xs text-slate-500">{new Date(held.created_at).toLocaleString()} · {money(held.total_c)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button disabled={holdBusy} onClick={() => void deleteHeldSale(held)} className="btn-ghost-2 px-2.5 py-1.5 text-xs text-danger-400">Delete</button>
                  <button disabled={holdBusy} onClick={() => void resumeHeldSale(held.id)} className="btn-primary px-2.5 py-1.5 text-xs">Resume</button>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {pinPromptItem && (
        <ManagerPinModal
          item={pinPromptItem}
          onAuthorized={() => {
            const itemToEdit = pinPromptItem
            setPinPromptItem(null)
            setPriceEditItem(itemToEdit)
          }}
          onClose={() => setPinPromptItem(null)}
        />
      )}

      {priceEditItem && (
        <PriceOverrideModal
          item={priceEditItem}
          onClose={() => setPriceEditItem(null)}
        />
      )}

      {seniorPwdOpen && (
        <Modal open onClose={() => setSeniorPwdOpen(false)} title="Apply Cart Discount" maxWidth="max-w-md">
          <div className="space-y-4">
            {/* Discount Type Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiscountType('SENIOR_PWD')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  discountType === 'SENIOR_PWD'
                    ? 'border-brand-500 bg-brand-500/20 text-brand-300 shadow-sm'
                    : 'border-ink-line bg-ink-900 text-slate-400 hover:text-white'
                }`}
              >
                Senior Citizen / PWD (20%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('CUSTOM')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  discountType === 'CUSTOM'
                    ? 'border-brand-500 bg-brand-500/20 text-brand-300 shadow-sm'
                    : 'border-ink-line bg-ink-900 text-slate-400 hover:text-white'
                }`}
              >
                Custom Discount (% or ₱)
              </button>
            </div>

            {discountType === 'SENIOR_PWD' ? (
              <form onSubmit={handleApplySeniorPwd} className="space-y-4">
                <div className="rounded-lg border border-brand-500/30 bg-brand-500/10 p-3 text-xs text-brand-300">
                  <p className="font-semibold">Statutory 20% Discount Law</p>
                  <p className="mt-1 text-slate-400">
                    Calculates 20% discount on cart subtotal ({money(subtotal)} → -{money(Math.round(subtotal * 0.2))}).
                  </p>
                </div>

                <div>
                  <label className="label">OSCA / PWD ID or Booklet Number *</label>
                  <input
                    required
                    value={seniorIdNumber}
                    onChange={(e) => setSeniorIdNumber(e.target.value)}
                    placeholder="e.g. OSCA-12345 or PWD-67890"
                    className="input w-full"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="label">Full Name of Senior / PWD (Optional)</label>
                  <input
                    value={seniorName}
                    onChange={(e) => setSeniorName(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz"
                    className="input w-full"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-ink-line pt-3">
                  <button type="button" onClick={() => setSeniorPwdOpen(false)} className="btn-ghost">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Apply 20% Discount
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleApplyCustomDiscount} className="space-y-4">
                <div className="rounded-lg border border-ink-line bg-ink-900 p-3 text-xs text-slate-300">
                  <p className="font-semibold text-white">Custom Cart Discount</p>
                  <p className="mt-1 text-slate-400">
                    Apply custom percentage or exact peso deduction on current subtotal of <strong className="text-white">{money(subtotal)}</strong>.
                  </p>
                </div>

                {/* Sub-mode: Percentage vs Fixed Pesos */}
                <div className="flex rounded-lg border border-ink-line p-1 bg-ink-950">
                  <button
                    type="button"
                    onClick={() => setCustomMode('PERCENT')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                      customMode === 'PERCENT' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomMode('PESOS')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                      customMode === 'PESOS' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Exact Amount (₱)
                  </button>
                </div>

                {customMode === 'PERCENT' ? (
                  <div>
                    <label className="label">Discount Percentage (%)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        step="any"
                        required
                        value={customPercent}
                        onChange={(e) => setCustomPercent(e.target.value)}
                        placeholder="e.g. 10"
                        className="input flex-1"
                        autoFocus
                      />
                      <span className="text-sm font-bold text-slate-400">%</span>
                    </div>
                    {/* Quick percentage chips */}
                    <div className="mt-2 flex gap-1.5">
                      {['5', '10', '15', '20', '50'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCustomPercent(p)}
                          className="rounded bg-ink-800 border border-ink-line px-2 py-1 text-[11px] font-bold text-brand-300 hover:bg-brand-500/20"
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="label">Discount Amount (₱)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-400">₱</span>
                      <input
                        type="number"
                        min={0.01}
                        step="0.01"
                        required
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="0.00"
                        className="input flex-1"
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {/* Live Preview */}
                <div className="rounded-lg bg-ink-950 p-2.5 border border-ink-line text-xs flex justify-between items-center">
                  <span className="text-slate-400">Estimated Total:</span>
                  <span className="font-bold text-base text-emerald-400">
                    {money(
                      Math.max(
                        0,
                        subtotal -
                          (customMode === 'PERCENT'
                            ? Math.round(subtotal * (Math.min(100, Math.max(0, parseFloat(customPercent) || 0)) / 100))
                            : Math.round((parseFloat(customAmount) || 0) * 100))
                      )
                    )}
                  </span>
                </div>

                <div className="flex justify-end gap-2 border-t border-ink-line pt-3">
                  <button type="button" onClick={() => setSeniorPwdOpen(false)} className="btn-ghost">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Apply Custom Discount
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}

    </aside>
  )
}

function CheckoutModal({
  subtotal,
  total,
  initialMethod = 'CASH',
  onClose
}: {
  subtotal: number
  total: number
  initialMethod?: 'CASH' | 'GCASH' | 'MAYA' | 'UTANG'
  onClose: () => void
}): React.JSX.Element {
  const { items, customer_id, customer_name, discount_pesos } = usePosCart()
  const [method, setMethod] = useState<'CASH' | 'GCASH' | 'MAYA' | 'UTANG'>(initialMethod)
  const [cash, setCash] = useState<string>(cashInputFromCents(total))
  const [reference, setReference] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [done, setDone] = useState<{ sale: Sale; receipt: string[]; print: PrintResult } | null>(null)
  const [printing, setPrinting] = useState(false)
  const setPage = useNav((state) => state.setPage)

  const cashInputRef = useRef<HTMLInputElement>(null)
  const refInputRef = useRef<HTMLInputElement>(null)

  const cashC = Math.round((parseFloat(cash) || 0) * 100)
  const change = cashC - total

  const openShift = async () => {
    const shift = await window.api.shifts.current()
    if (!shift) {
      await window.api.shifts.open(0)
    }
  }

  useEffect(() => { void openShift() }, [])

  useEffect(() => {
    let qrPayload: string | undefined = undefined
    if (method === 'GCASH' || method === 'MAYA') {
      const storeName = 'TINDA POS'
      const pesos = (total / 100).toFixed(2)
      qrPayload = `${method.toLowerCase()}://pay?amount=${pesos}&store=${encodeURIComponent(storeName)}&ref=${Date.now()}`
    }
    void window.api.phoneScanner?.updateCfd({
      status: 'PAYMENT',
      paymentMethod: method,
      total_c: total,
      amount_tendered_c: method === 'CASH' ? cashC : total,
      change_c: method === 'CASH' ? Math.max(0, change) : 0,
      qrCodeUrl: qrPayload
    }).catch(() => {})
  }, [method, total, cashC, change])

  const doCheckout = async () => {
    if (submitting) return
    if (method === 'UTANG' && customer_id === null) {
      setPickerOpen(true)
      toastError('Customer required', 'Please select the customer for this Utang.')
      return
    }
    if (cartHasStockConflict(items)) {
      toastError('Stock changed', 'Please adjust the cart to the available quantity before checkout.')
      return
    }
    setSubmitting(true)
    try {
      const payments: PaymentInput[] =
        method === 'UTANG'
          ? [{ method, amount_c: total }]
          : method === 'CASH'
            ? [{ method, amount_c: cashC, reference: null }]
            : [{ method, amount_c: total, reference: reference || null }]
      const payload = {
        items: items.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          unit_name: i.unit_name,
          qty: i.qty,
          qty_base: i.qty * i.conversion_to_base,
          unit_price_c: i.unit_price_c,
          cost_base_c: i.cost_base_c,
          stock_base: i.stock_base,
          subtotal_c: i.unit_price_c * i.qty
        })),
        discount_c: discount_pesos,
        customer_id,
        payments
      }
      const res = await window.api.pos.checkout(payload)
      setDone(res)
      playCheckoutChime()
      usePosCart.getState().clear()
      void window.api.phoneScanner?.updateCfd({
        status: 'COMPLETED',
        total_c: res.sale.total_c,
        amount_tendered_c: method === 'CASH' ? cashC : res.sale.total_c,
        change_c: method === 'CASH' ? Math.max(0, change) : 0,
        paymentMethod: method
      }).catch(() => {})
      if (res.print.ok || res.print.code === 'DISABLED') toastSuccess('Sale completed successfully', res.sale.transaction_no)
      else toastError('Sale completed successfully', res.print.message)
    } catch (e) {
      toastError('Checkout failed', String((e as Error)?.message || e))
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    const handleCheckoutHotkeys = (e: KeyboardEvent) => {
      if (done || pickerOpen) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        void doCheckout()
        return
      }
      if (e.key === 'F9') {
        e.preventDefault()
        setMethod('CASH')
        setTimeout(() => { cashInputRef.current?.focus(); cashInputRef.current?.select() }, 50)
        return
      }
      if (e.key === 'F10') {
        e.preventDefault()
        setMethod('GCASH')
        setTimeout(() => { refInputRef.current?.focus(); refInputRef.current?.select() }, 50)
        return
      }
      if (e.key === 'F11') {
        e.preventDefault()
        setMethod('MAYA')
        setTimeout(() => { refInputRef.current?.focus(); refInputRef.current?.select() }, 50)
        return
      }
    }

    window.addEventListener('keydown', handleCheckoutHotkeys)
    return () => window.removeEventListener('keydown', handleCheckoutHotkeys)
  }, [done, pickerOpen, method, cash, reference, items, customer_id, total, submitting])

  if (done) {
    const retryPrint = async () => {
      setPrinting(true)
      try {
        const result = await window.api.printer.printReceipt(done.sale.id)
        setDone({ ...done, print: result })
        if (result.ok) toastSuccess('Receipt printed successfully')
        else toastError('Receipt printing failed', result.message)
      } catch (e) { toastError('Receipt printing failed', String((e as Error)?.message || e)) } finally { setPrinting(false) }
    }
    return (
      <Modal open onClose={onClose} title="Sale Complete" footer={
        <>
          {!done.print.ok && done.print.code !== 'DISABLED' && <button onClick={() => void retryPrint()} disabled={printing} className="btn-ghost">Retry Print</button>}
          {(done.print.code === 'NO_PRINTER' || done.print.code === 'UNAVAILABLE') && <button onClick={() => { onClose(); setPage('settings') }} className="btn-ghost">Configure Printer</button>}
          <button onClick={onClose} className="btn-primary">Done</button>
        </>
      }>
        <div className="mb-3 text-center">
          <Check className="mx-auto mb-2 h-12 w-12 text-emerald-400" />
          <p className="text-lg font-bold text-white">{money(done.sale.total_c)}</p>
          <p className="text-sm text-slate-400">{done.sale.transaction_no}</p>
        </div>
        <p className={`mb-3 rounded-lg border p-2 text-xs ${done.print.ok ? 'border-emerald-500/30 text-emerald-300' : 'border-amber-500/30 text-amber-300'}`}>{done.print.message}</p>
        <ReceiptPaper lines={done.receipt} />
      </Modal>
    )
  }

  const methods: { key: typeof method; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { key: 'CASH', label: 'Cash', icon: <Banknote className="h-4 w-4" />, shortcut: 'F9' },
    { key: 'GCASH', label: 'GCash', icon: <Smartphone className="h-4 w-4" />, shortcut: 'F10' },
    { key: 'MAYA', label: 'Maya', icon: <Smartphone className="h-4 w-4" />, shortcut: 'F11' },
    { key: 'UTANG', label: 'Utang', icon: <Wallet className="h-4 w-4" />, shortcut: '' }
  ]

  return (
    <Modal open onClose={onClose} title="Checkout" maxWidth="max-w-md" footer={
      <>
        <button onClick={onClose} className="btn-ghost">Cancel (Esc)</button>
        <button onClick={doCheckout} disabled={submitting} className="btn-primary flex items-center gap-2">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Charge {money(total)} (Enter)
        </button>
      </>
    }>
      <div className="space-y-4">
        <div className="rounded-lg border border-ink-line bg-ink-950 p-3 text-center">
          <p className="text-xs text-slate-500">TOTAL</p>
          <p className="text-3xl font-black text-white">{money(total)}</p>
          <p className="mt-1 text-xs text-slate-500">Subtotal {money(subtotal)} · Discount {money(discount_pesos)}</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {methods.map((m) => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={`btn-ghost flex flex-col items-center gap-1 py-2 text-xs ${method === m.key ? '!border-brand-500 !text-brand-400 font-semibold' : ''}`}
            >
              {m.icon}
              <span>{m.label}</span>
              {m.shortcut && <span className="text-[10px] text-slate-500 font-mono">[{m.shortcut}]</span>}
            </button>
          ))}
        </div>

        {method === 'CASH' && (
          <div>
            <label className="mb-1 block text-xs text-slate-400">Cash Received</label>
            <input
              ref={cashInputRef}
              type="number"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              className="input w-full text-lg font-bold"
              autoFocus
            />

            {/* Quick Cash Denomination & Increment Chips */}
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Quick cash denomination buttons">
              <button
                type="button"
                onClick={() => setCash(cashInputFromCents(total))}
                className="rounded-md border border-brand-500/40 bg-brand-500/10 px-2 py-1 text-xs font-bold text-brand-300 hover:bg-brand-500/20 transition-colors"
                title="Exact total payment"
              >
                Exact ({money(total)})
              </button>
              {[20, 50, 100, 200, 500, 1000].map((bill) => {
                const billCents = bill * 100
                if (billCents < total && billCents !== 1000 && billCents !== 500) return null
                return (
                  <button
                    key={`exact-${bill}`}
                    type="button"
                    onClick={() => setCash(String(bill))}
                    className="rounded-md border border-ink-line bg-ink-900 px-2 py-1 text-xs font-semibold text-slate-200 hover:border-brand-500/50 hover:bg-ink-800 transition-colors"
                  >
                    ₱{bill}
                  </button>
                )
              })}
              {[20, 50, 100].map((addAmount) => (
                <button
                  key={`add-${addAmount}`}
                  type="button"
                  onClick={() => {
                    const currentVal = parseFloat(cash) || (total / 100)
                    setCash(String(Math.round((currentVal + addAmount) * 100) / 100))
                  }}
                  className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                  title={`Add ₱${addAmount} to cash`}
                >
                  +₱{addAmount}
                </button>
              ))}
            </div>

            <div className="mt-2 flex justify-between text-xs">
              <span className="text-slate-500">Change (sukli)</span>
              <span className={change >= 0 ? 'font-bold text-emerald-400' : 'font-bold text-danger-400'}>
                {money(Math.max(0, change))}
              </span>
            </div>
          </div>
        )}

        {(method === 'GCASH' || method === 'MAYA') && (
          <div>
            <label className="mb-1 block text-xs text-slate-400">Reference No.</label>
            <input
              ref={refInputRef}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="input w-full"
              placeholder="e.g. 1234-5678"
              autoFocus
            />
          </div>
        )}

        {method === 'UTANG' && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            {customer_id === null ? (
              <>
                <p className="flex items-start gap-2 text-sm text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Please select the customer for this Utang before checkout.</span>
                </p>
                <button onClick={() => setPickerOpen(true)} className="btn-primary mt-2 flex w-full items-center justify-center gap-2 py-2">
                  <User className="h-4 w-4" /> Select Customer
                </button>
              </>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="break-words text-sm text-emerald-300">
                  <Check aria-label="Selected" className="mr-1 inline h-4 w-4" />
                  Selected: {customer_name ?? `Customer #${customer_id}`}
                </p>
                <button onClick={() => setPickerOpen(true)} className="shrink-0 text-xs text-brand-400 hover:text-brand-300">Change</button>
              </div>
            )}
          </div>
        )}
      </div>
      {pickerOpen && <CustomerPicker onClose={() => setPickerOpen(false)} />}
    </Modal>
  )
}

function CustomerPicker({ onClose }: { onClose: () => void }): React.JSX.Element {
  const selectedId = usePosCart((state) => state.customer_id)
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const load = async (term: string) => {
    setLoading(true)
    try {
      const res = await window.api.customers.list({ search: term || undefined, status: 'ACTIVE', limit: 30 })
      setRows(res.rows)
    } catch (e) {
      toastError('Failed to load customers', String((e as Error)?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load('') }, [])

  return (
    <Modal open onClose={onClose} title="Select the Borrower" maxWidth="max-w-md" footer={
      <button onClick={() => { usePosCart.getState().setCustomer(null); onClose() }} className="btn-ghost">Walk-in (no utang)</button>
    }>
      <p className="mb-3 text-sm text-slate-400">Click a customer in the list to select them.</p>
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); void load(e.target.value) }}
        placeholder="Search customer name or phone..."
        className="input mb-3 w-full"
        autoFocus
      />
      <div className="max-h-72 space-y-1 overflow-y-auto">
        {loading && <p className="py-4 text-center text-sm text-slate-500">Loading…</p>}
        {!loading && rows.map((c) => (
          <button
            key={c.id}
            onClick={() => { usePosCart.getState().setCustomer(c.id, c.full_name); onClose() }}
            aria-pressed={selectedId === c.id}
            className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left hover:border-brand-500/50 ${selectedId === c.id ? 'border-brand-500 bg-brand-500/10' : 'border-ink-line'}`}
          >
            <div>
              <p className="break-words text-sm font-medium text-slate-200">{c.full_name}</p>
              <p className="text-xs text-slate-500">Limit {money(c.credit_limit_c)}</p>
            </div>
            {selectedId === c.id && <Check aria-label="Selected" className="h-4 w-4 shrink-0 text-brand-400" />}
            <span className={`text-xs font-bold ${c.balance_c > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{money(c.balance_c)}</span>
          </button>
        ))}
        {!loading && rows.length === 0 && <p className="py-4 text-center text-sm text-slate-500">No customers found.</p>}
      </div>
    </Modal>
  )
}
