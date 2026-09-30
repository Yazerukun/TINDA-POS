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
  Monitor
} from 'lucide-react'
import { createScannerListener } from '../lib/barcodeScanner'
import { CameraScannerModal } from '../components/CameraScannerModal'
import { CounterCameraScanner } from '../components/CounterCameraScanner'
import { QuickExpenseModal } from '../components/QuickExpenseModal'
import { useGuide } from '../stores/guide'
import type { Product, Customer, Sale, Category, HeldSale } from '@shared/types'
import { money } from '@shared/format'
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
  unit_name: string
  qty: number
  unit_price_c: number
  base_price_c?: number
  wholesale_price_c?: number | null
  wholesale_min_qty?: number | null
  is_wholesale?: boolean
  cost_base_c: number
  stock_base: number
  conversion_to_base: number
}

interface CartState {
  items: CartItem[]
  customer_id: number | null
  customer_name: string | null
  discount_pesos: number
  add: (p: Product) => void
  setQty: (product_id: number, qty: number) => void
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
  add: (p) =>
    set((s) => {
      const stock = saleStock(p)
      const ex = s.items.find((i) => i.product_id === p.id)
      if (stock < 1) return s
      if (ex) {
        const nextQty = Math.min(ex.qty + 1, maxQuantity(stock, ex.conversion_to_base))
        const { unitPriceC, isWholesale } = calculateItemUnitPrice(
          ex.base_price_c ?? ex.unit_price_c,
          nextQty,
          ex.wholesale_price_c,
          ex.wholesale_min_qty
        )
        return {
          items: s.items.map((i) =>
            i === ex
              ? {
                  ...i,
                  stock_base: stock,
                  qty: nextQty,
                  unit_price_c: unitPriceC,
                  is_wholesale: isWholesale
                }
              : i
          )
        }
      }
      const basePrice = p.default_price_c
      const { unitPriceC, isWholesale } = calculateItemUnitPrice(
        basePrice,
        1,
        p.wholesale_price_c,
        p.wholesale_min_qty
      )
      return {
        items: [
          ...s.items,
          {
            product_id: p.id,
            name: p.name,
            unit_name: p.base_unit,
            qty: 1,
            unit_price_c: unitPriceC,
            base_price_c: basePrice,
            wholesale_price_c: p.wholesale_price_c,
            wholesale_min_qty: p.wholesale_min_qty,
            is_wholesale: isWholesale,
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
          const nextQty = Math.min(
            Math.max(0, Number.isFinite(qty) ? qty : 0),
            maxQuantity(i.stock_base, i.conversion_to_base)
          )
          const { unitPriceC, isWholesale } = calculateItemUnitPrice(
            i.base_price_c ?? i.unit_price_c,
            nextQty,
            i.wholesale_price_c,
            i.wholesale_min_qty
          )
          return {
            ...i,
            qty: nextQty,
            unit_price_c: unitPriceC,
            is_wholesale: isWholesale
          }
        })
        .filter((i) => i.qty > 0)
    })),
  remove: (product_id) => set((s) => ({ items: s.items.filter((i) => i.product_id !== product_id) })),
  clear: () => set({ items: [], customer_id: null, customer_name: null, discount_pesos: 0 }),
  setCustomer: (id, name) => set({ customer_id: id, customer_name: id === null ? null : name ?? null }),
  setDiscountPesos: (v) => set({ discount_pesos: Math.max(0, v) }),
  replace: (items, discount_pesos) =>
    set({
      items: items.map((item) => {
        const { unitPriceC, isWholesale } = calculateItemUnitPrice(
          item.base_price_c ?? item.unit_price_c,
          item.qty,
          item.wholesale_price_c,
          item.wholesale_min_qty
        )
        return {
          ...item,
          base_price_c: item.base_price_c ?? item.unit_price_c,
          unit_price_c: unitPriceC,
          is_wholesale: isWholesale
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

  useEffect(() => {
    const handleToggleEvent = () => {
      setCounterCameraEnabled(localStorage.getItem('tinda_counter_camera_enabled') === 'true')
    }
    window.addEventListener('tinda-counter-camera-toggle', handleToggleEvent)
    return () => window.removeEventListener('tinda-counter-camera-toggle', handleToggleEvent)
  }, [])

  const handleToggleCounterCamera = (val: boolean) => {
    setCounterCameraEnabled(val)
    localStorage.setItem('tinda_counter_camera_enabled', String(val))
    if (val) {
      toastSuccess('Hands-Free Counter Camera Active', 'Wave products in front of camera to auto-scan')
    }
  }

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
      subtotal_c: i.qty * i.unit_price_c
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

  const search = async (term: string, categoryId?: number | null) => {
    setLoading(true)
    setError(null)
    try {
      const opts: { status: string; limit: number; category_id?: number | null } = { status: 'ACTIVE', limit: 60 }
      if (categoryId != null) opts.category_id = categoryId
      const res = await window.api.products.search(term, opts)
      setProducts(res.rows)
      usePosCart.getState().syncStocks(res.rows)

      try {
        const refs = await window.api.priceReferences.search({ linkedOnly: true, limit: 100 })
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
      setLoading(false)
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

      const res = await window.api.products.search(code, { status: 'ACTIVE', limit: 10 })
      const target = code.toLowerCase()
      // Strict matching: Barcode scans MUST match exact barcode or SKU only. Never pick random name matches.
      const found = res.rows.find(
        (p) =>
          p.barcode?.toLowerCase() === target ||
          p.sku?.toLowerCase() === target ||
          p.units?.some((u) => u.barcode?.toLowerCase() === target)
      )

      if (found) {
        if (saleStock(found) < 1) {
          toastError(`"${found.name}" is out of stock!`)
        } else {
          usePosCart.getState().add(found)
          toastSuccess(`Scanned: ${found.name}`)
          warnIfNearExpiry(found)
          setQ('')
        }
      } else {
        toastError(`No product found for barcode: ${code}`)
      }
    } catch (err) {
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
      if (e.key === 'F7') {
        e.preventDefault()
        setExpenseModalOpen(true)
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
  }, [categoryMenuOpen, q, catFilter])

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
                if (e.key === 'Enter' && q.trim()) {
                  e.preventDefault()
                  void handleScan(q.trim())
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
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400"
              title="Universal USB Hardware Barcode Scanner Active (Driver-free)"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <Barcode className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Scanner Ready</span>
            </div>

            {/* LAN Master / Satellite Status Badge */}
            {lanStatus?.role === 'master' && (
              <div
                className="flex items-center gap-1.5 rounded-md border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-300 shadow-sm"
                title={`Master Server Active (0.0.0.0:${lanStatus.port}) — ${lanStatus.connectedClients} connected satellite terminal(s)`}
              >
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                <Server className="h-3.5 w-3.5 text-sky-400" />
                <span className="hidden sm:inline">LAN Master {lanStatus.connectedClients > 0 ? `(${lanStatus.connectedClients})` : ''}</span>
              </div>
            )}
            {lanStatus?.role === 'satellite' && (
              <div
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold shadow-sm ${
                  lanStatus.satelliteConnected
                    ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                    : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                }`}
                title={lanStatus.satelliteConnected ? 'Connected to Store Master Server' : 'Reconnecting to Store Master Server...'}
              >
                <span className={`h-2 w-2 rounded-full ${lanStatus.satelliteConnected ? 'bg-sky-400 animate-pulse' : 'bg-amber-400'}`} />
                <Laptop className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{lanStatus.satelliteConnected ? 'Satellite Linked' : 'LAN Reconnecting'}</span>
              </div>
            )}

            {/* Hands-Free Counter Camera Toggle */}
            <button
              type="button"
              onClick={() => handleToggleCounterCamera(!counterCameraEnabled)}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
                counterCameraEnabled
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-sm'
                  : 'border-ink-line bg-ink-800 text-slate-300 hover:border-emerald-500/40 hover:bg-ink-700'
              }`}
              title={counterCameraEnabled ? 'Hands-Free Counter Camera is ON — wave items to auto-scan' : 'Turn On Hands-Free Counter Camera (Zero-click wave scan)'}
            >
              <span className={`h-2 w-2 rounded-full ${counterCameraEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <Camera className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{counterCameraEnabled ? 'Camera Active' : 'Counter Camera'}</span>
            </button>

            {/* Wireless Phone Scanner Status / Pair Button */}
            {phoneConnected ? (
              <button
                type="button"
                onClick={() => setCameraScannerOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-brand-500/40 bg-brand-500/15 px-2.5 py-1 text-xs font-semibold text-brand-300 hover:bg-brand-500/25 transition-colors shadow-sm"
                title="Wireless Phone Scanner Connected over Wi-Fi — Scans automatically beam to cart without clicking anything!"
              >
                <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
                <Smartphone className="h-3.5 w-3.5 text-brand-400" />
                <span className="hidden sm:inline">Phone Ready</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCameraScannerInitialTab('phone')
                  setCameraScannerOpen(true)
                }}
                className="flex items-center gap-1.5 rounded-md border border-ink-line bg-ink-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-brand-500/50 hover:bg-ink-700 hover:text-brand-300 transition-colors"
                title="Pair Phone via QR Code or Open Fullscreen Scanner"
              >
                <Smartphone className="h-3.5 w-3.5 text-brand-400" />
                <span className="hidden sm:inline">Pair Phone</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setCameraScannerInitialTab('cfd')
                setCameraScannerOpen(true)
              }}
              className="flex items-center gap-1.5 rounded-md border border-ink-line bg-ink-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-sky-500/50 hover:bg-ink-700 hover:text-sky-300 transition-colors"
              title="Customer Facing Display (CFD) & Dynamic QR — Pair customer tablet or secondary screen"
            >
              <Monitor className="h-3.5 w-3.5 text-sky-400" />
              <span className="hidden sm:inline">Customer Screen</span>
            </button>

            <button
              type="button"
              onClick={() => setExpenseModalOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 hover:border-amber-500/50 hover:bg-amber-500/20 transition-colors shadow-sm"
              title="Record Store Petty Cash / Cash Out (F7)"
            >
              <Receipt className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Petty Cash (F7)</span>
            </button>

            <button
              type="button"
              onClick={() => useGuide.getState().openGuide('pos')}
              className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 hover:border-amber-500/50 hover:bg-amber-500/20 transition-colors shadow-sm"
              title="Open Cashier & POS Instructions Guide"
            >
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Guide</span>
            </button>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Plus className="h-3.5 w-3.5" /> add
              <span className="text-slate-600">·</span>
              <span>F2 qty</span>
            </div>
          </div>
        </div>
        {error && <p className="mb-3 text-sm text-danger-400">{error}</p>}
        <div className="grid min-h-0 flex-1 auto-rows-[160px] grid-cols-[repeat(auto-fill,minmax(min(100%,180px),1fr))] content-start gap-3 overflow-y-auto pb-2">
          {loading && Array.from({ length: 12 }).map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
          {!loading && products.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-slate-500">No products found.</div>
          )}
          {!loading && products.map((p) => {
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
                className="card group flex h-40 min-w-0 flex-col p-3 text-left transition hover:border-brand-500/50 aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
              >
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <span className="truncate text-xs font-bold text-brand-400">{p.sku}</span>
                  <span className={`text-xs font-bold ${out ? 'text-red-400' : low ? 'text-amber-400' : 'text-slate-500'}`}>
                    {blocked > 0 ? `Sellable: ${stock}` : cartItem ? `Available: ${available} / ${stock}` : `Stock: ${stock}`} {p.base_unit}
                  </span>
                </div>
                <div className="flex items-start gap-2.5 min-w-0">
                  <ProductImage src={p.image_path} alt={p.name} className="h-10 w-10 rounded-md shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 break-words text-sm font-semibold leading-5 text-white" title={p.name}>{p.name}</p>
                    {blocked > 0 && <p className="truncate text-xs text-red-400">{blocked} expired / undated</p>}
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
        </div>
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
    </div>
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
  const discountInputRef = useRef<HTMLInputElement>(null)
  const lastQtyInputRef = useRef<HTMLInputElement>(null)

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.unit_price_c * i.qty, 0), [items])
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
          subtotal_c: item.unit_price_c * item.qty
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
      if (checkoutOpen || customerOpen || heldOpen) return

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
  }, [checkoutOpen, customerOpen, heldOpen, items, holdBusy, stockConflict])

  const resumeHeldSale = async (id: number) => {
    if (items.length && !confirm('Replace the current cart with this held sale?')) return
    setHoldBusy(true)
    try {
      const [held, productResult] = await Promise.all([
        window.api.pos.resumeHeld(id),
        window.api.products.search('', { status: 'ACTIVE', limit: 1000 })
      ])
      const catalog = new Map(productResult.rows.map((product) => [product.id, product]))
      usePosCart.getState().replace(held.items.map((item) => ({
        product_id: item.product_id as number,
        name: item.name,
        unit_name: item.unit_name,
        qty: item.qty,
        unit_price_c: item.unit_price_c,
        cost_base_c: item.cost_base_c,
        stock_base: item.product_id == null ? 0 : catalog.has(item.product_id) ? saleStock(catalog.get(item.product_id)!) : 0,
        conversion_to_base: item.qty > 0 ? item.qty_base / item.qty : 1
      })), held.discount_c)
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
                {i.is_wholesale && (
                  <span className="inline-flex items-center gap-1 mt-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
                    🏷️ Wholesale Tier
                  </span>
                )}
              </div>
              <button onClick={() => usePosCart.getState().remove(i.product_id)} className="shrink-0 text-slate-600 hover:text-danger-400" title="Remove">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button onClick={() => usePosCart.getState().setQty(i.product_id, i.qty - 1)} className="btn-ghost-2 h-10 w-10 rounded-lg" title="Decrease quantity"><Minus className="h-3.5 w-3.5" /></button>
                <input
                  ref={idx === items.length - 1 ? lastQtyInputRef : undefined}
                  value={i.qty}
                  onChange={(e) => usePosCart.getState().setQty(i.product_id, parseInt(e.target.value || '0', 10))}
                  aria-label={`Quantity for ${i.name}`} className="h-10 w-14 rounded-lg border border-ink-line bg-ink-950 py-1 text-center text-base font-bold text-white"
                  title="Press F2 to focus quantity"
                />
                <button disabled={i.qty >= maxQuantity(i.stock_base, i.conversion_to_base)} onClick={() => usePosCart.getState().setQty(i.product_id, i.qty + 1)} className="btn-ghost-2 h-10 w-10 rounded-lg disabled:opacity-30" title={i.qty >= maxQuantity(i.stock_base, i.conversion_to_base) ? `Only ${maxQuantity(i.stock_base, i.conversion_to_base)} remaining` : 'Increase quantity'}><Plus className="h-3.5 w-3.5" /></button>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">{money(i.unit_price_c * i.qty)}</p>
                <p className="text-sm text-slate-400">
                  @{money(i.unit_price_c)} / {i.unit_name}
                  {i.is_wholesale && i.base_price_c && i.base_price_c > i.unit_price_c && (
                    <span className="line-through text-xs text-slate-500 ml-1">
                      {money(i.base_price_c)}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <p className={`mt-1 text-xs ${reservedBase(i) > i.stock_base ? 'text-danger-400' : 'text-slate-500'}`}>Available: {availableBase(i.stock_base, i)} base units / {i.stock_base}</p>
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
          <span>Discount (₱) <span className="text-[10px] text-slate-500 font-mono">[F4]</span></span>
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
            <div className="mt-1 flex justify-between text-xs">
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
