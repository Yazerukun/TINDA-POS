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
  ChevronDown
} from 'lucide-react'
import type { Product, Customer, Sale, Category, HeldSale } from '@shared/types'
import { money } from '@shared/format'
import { Modal } from '../components/ui/Modal'
import { toastSuccess, toastError } from '../stores/toast'
import type { PaymentInput } from '@shared/ipc'

interface CartItem {
  product_id: number
  name: string
  unit_name: string
  qty: number
  unit_price_c: number
  cost_base_c: number
  stock_base: number
}

interface CartState {
  items: CartItem[]
  customer_id: number | null
  discount_pesos: number
  add: (p: Product) => void
  setQty: (product_id: number, qty: number) => void
  remove: (product_id: number) => void
  clear: () => void
  setCustomer: (id: number | null) => void
  setDiscountPesos: (v: number) => void
  replace: (items: CartItem[], discount_pesos: number) => void
}

export const usePosCart = create<CartState>((set) => ({
  items: [],
  customer_id: null,
  discount_pesos: 0,
  add: (p) =>
    set((s) => {
      const ex = s.items.find((i) => i.product_id === p.id)
      if (ex) return { items: s.items.map((i) => (i === ex ? { ...i, qty: i.qty + 1 } : i)) }
      return {
        items: [...s.items, {
          product_id: p.id,
          name: p.name,
          unit_name: p.base_unit,
          qty: 1,
          unit_price_c: p.default_price_c,
          cost_base_c: p.purchase_cost_c,
          stock_base: p.stock
        }]
      }
    }),
  setQty: (product_id, qty) =>
    set((s) => ({ items: s.items.map((i) => (i.product_id === product_id ? { ...i, qty: Math.max(0, qty) } : i)).filter((i) => i.qty > 0) })),
  remove: (product_id) => set((s) => ({ items: s.items.filter((i) => i.product_id !== product_id) })),
  clear: () => set({ items: [], customer_id: null, discount_pesos: 0 }),
  setCustomer: (id) => set({ customer_id: id }),
  setDiscountPesos: (v) => set({ discount_pesos: Math.max(0, v) }),
  replace: (items, discount_pesos) => set({ items, customer_id: null, discount_pesos })
}))

export function POS(): React.JSX.Element {
  const [q, setQ] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [catFilter, setCatFilter] = useState<number | 'ALL'>('ALL')
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const categoryMenuRef = useRef<HTMLDivElement>(null)

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

  const chooseCategory = (categoryId: number | 'ALL') => {
    setCatFilter(categoryId)
    setCategoryMenuOpen(false)
    void search(q, categoryId === 'ALL' ? null : categoryId)
  }

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); void search(e.target.value, catFilter === 'ALL' ? null : catFilter) }}
              placeholder="Search product by name or barcode…"
              className="input w-full pl-9"
              autoFocus
            />
          </div>
          <div ref={categoryMenuRef} className="relative w-44 shrink-0">
            <button
              type="button"
              onClick={() => setCategoryMenuOpen((open) => !open)}
              className="input flex w-full items-center justify-between gap-2 text-left"
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
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Plus className="h-3.5 w-3.5" /> add
            <span className="text-slate-600">·</span>
            <span>F2 qty</span>
          </div>
        </div>
        {error && <p className="mb-3 text-sm text-danger-400">{error}</p>}
        <div className="grid flex-1 grid-cols-3 gap-3 overflow-y-auto pb-2 lg:grid-cols-4 xl:grid-cols-5">
          {loading && Array.from({ length: 12 }).map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
          {!loading && products.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-slate-500">No products found.</div>
          )}
          {!loading && products.map((p) => {
            const low = p.stock > 0 && p.stock <= p.low_stock_threshold
            const out = p.stock <= 0
            return (
              <button
                key={p.id}
                onClick={() => usePosCart.getState().add(p)}
                disabled={out}
                className="card group p-3 text-left transition hover:border-brand-500/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <div className="mb-1.5 flex items-center justify-between gap-1">
                  <span className="truncate text-[10px] font-bold text-brand-400">{p.sku}</span>
                  <span className={`shrink-0 text-[10px] font-bold ${out ? 'text-red-400' : low ? 'text-amber-400' : 'text-slate-500'}`}>
                    {p.stock} {p.base_unit}
                  </span>
                </div>
                <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-white">{p.name}</p>
                <p className="mt-1 text-base font-black text-brand-400">{money(p.default_price_c)}</p>
              </button>
            )
          })}
        </div>
      </div>

      <CartPanel />
    </div>
  )
}

function CartPanel(): React.JSX.Element {
  const { items, discount_pesos } = usePosCart()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [heldOpen, setHeldOpen] = useState(false)
  const [heldSales, setHeldSales] = useState<HeldSale[]>([])
  const [holdBusy, setHoldBusy] = useState(false)

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.unit_price_c * i.qty, 0), [items])
  const total = Math.max(0, subtotal - discount_pesos)

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
          qty_base: item.qty,
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
        stock_base: item.product_id == null ? 0 : catalog.get(item.product_id)?.stock ?? 0
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
    <aside className="flex w-[22rem] shrink-0 flex-col border-l border-ink-line bg-ink-900">
      <div className="flex items-center justify-between border-b border-ink-line px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-300">
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

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {items.length === 0 && (
          <p className="py-10 text-center text-sm leading-6 text-slate-500">
            Cart is empty.
            <br />
            Tap a product to add it.
          </p>
        )}
        {items.map((i) => (
          <div key={i.product_id} className="rounded-lg border border-ink-line bg-ink-800/50 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-medium text-slate-200">{i.name}</p>
              <button onClick={() => usePosCart.getState().remove(i.product_id)} className="shrink-0 text-slate-600 hover:text-danger-400" title="Remove">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button onClick={() => usePosCart.getState().setQty(i.product_id, i.qty - 1)} className="btn-ghost-2 h-7 w-7 rounded-lg"><Minus className="h-3.5 w-3.5" /></button>
                <input
                  value={i.qty}
                  onChange={(e) => usePosCart.getState().setQty(i.product_id, parseInt(e.target.value || '0', 10))}
                  className="w-11 rounded-lg border border-ink-line bg-ink-950 py-1 text-center text-sm font-bold text-white"
                />
                <button onClick={() => usePosCart.getState().setQty(i.product_id, i.qty + 1)} className="btn-ghost-2 h-7 w-7 rounded-lg"><Plus className="h-3.5 w-3.5" /></button>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{money(i.unit_price_c * i.qty)}</p>
                <p className="text-[10px] text-slate-500">@{money(i.unit_price_c)} / {i.unit_name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 border-t border-ink-line px-4 py-3 text-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span>Customer</span>
          <button onClick={() => setCustomerOpen(true)} className="flex items-center gap-1 text-brand-400 hover:text-brand-300">
            <User className="h-3.5 w-3.5" /> Select (utang)
          </button>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Subtotal</span><span className="text-slate-200">{money(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Discount (₱)</span>
          <input
            type="number"
            min={0}
            value={discount_pesos}
            onChange={(e) => usePosCart.getState().setDiscountPesos((parseFloat(e.target.value) || 0) * 100)}
            className="w-24 rounded-lg border border-ink-line bg-ink-950 px-2 py-1 text-right text-sm text-slate-200"
          />
        </div>
        <div className="flex justify-between border-t border-ink-line pt-1.5">
          <span className="font-bold text-white">TOTAL</span>
          <span className="text-xl font-black text-brand-400">{money(total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 pb-4 pt-1">
        <button
          disabled={items.length === 0}
          onClick={() => void holdCurrentSale()}
          className="btn-ghost flex flex-col items-center gap-0.5 py-2 text-xs disabled:opacity-40"
        >
          {holdBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />} Hold
        </button>
        <button
          disabled={items.length === 0}
          onClick={() => usePosCart.getState().clear()}
          className="btn-secondary col-span-1 py-2 text-xs disabled:opacity-40"
        >
          Clear
        </button>
        <button
          disabled={items.length === 0}
          onClick={() => !items.length ? undefined : setCheckoutOpen(true)}
          className="btn-primary col-span-1 py-2 text-sm disabled:opacity-40"
        >
          CHECKOUT
        </button>
      </div>

      {checkoutOpen && <CheckoutModal subtotal={subtotal} total={total} onClose={() => setCheckoutOpen(false)} />}
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

function CheckoutModal({ subtotal, total, onClose }: { subtotal: number; total: number; onClose: () => void }): React.JSX.Element {
  const { items, customer_id, discount_pesos } = usePosCart()
  const [method, setMethod] = useState<'CASH' | 'GCASH' | 'MAYA' | 'UTANG'>('CASH')
  const [cash, setCash] = useState<string>(String(total))
  const [reference, setReference] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ sale: Sale; receipt: string[] } | null>(null)

  const cashC = Math.round((parseFloat(cash) || 0) * 100)
  const change = cashC - total

  const openShift = async () => {
    const shift = await window.api.shifts.current()
    if (!shift) {
      await window.api.shifts.open(0)
    }
  }

  useEffect(() => { void openShift() }, [])

  const doCheckout = async () => {
    setSubmitting(true)
    try {
      const payments: PaymentInput[] =
        method === 'UTANG'
          ? [{ method, amount_c: total }]
          : method === 'CASH'
            ? [{ method, amount_c: total, reference: reference || null }]
            : [{ method, amount_c: total, reference: reference || null }]
      const payload = {
        items: items.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          unit_name: i.unit_name,
          qty: i.qty,
          qty_base: i.qty,
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
      onClose()
      toastSuccess('Sale completed', res.sale.transaction_no)
    } catch (e) {
      toastError('Checkout failed', String((e as Error)?.message || e))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <Modal open onClose={() => setDone(null)} title="Sale Complete" footer={<button onClick={() => setDone(null)} className="btn-primary">Done</button>}>
        <div className="mb-3 text-center">
          <Check className="mx-auto mb-2 h-12 w-12 text-emerald-400" />
          <p className="text-lg font-bold text-white">{money(done.sale.total_c)}</p>
          <p className="text-sm text-slate-400">{done.sale.transaction_no}</p>
        </div>
        <div className="rounded-lg border border-ink-line bg-ink-950 p-3 font-mono text-[11px] leading-5 text-slate-300">
          {done.receipt.map((line, i) => <div key={i} className="whitespace-pre-wrap">{line}</div>)}
        </div>
      </Modal>
    )
  }

  const methods: { key: typeof method; label: string; icon: React.ReactNode }[] = [
    { key: 'CASH', label: 'Cash', icon: <Banknote className="h-4 w-4" /> },
    { key: 'GCASH', label: 'GCash', icon: <Smartphone className="h-4 w-4" /> },
    { key: 'MAYA', label: 'Maya', icon: <Smartphone className="h-4 w-4" /> },
    { key: 'UTANG', label: 'Utang', icon: <Wallet className="h-4 w-4" /> }
  ]

  return (
    <Modal open onClose={onClose} title="Checkout" maxWidth="max-w-md" footer={
      <>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={doCheckout} disabled={submitting} className="btn-primary flex items-center gap-2">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Charge {money(total)}
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
              className={`btn-ghost flex flex-col items-center gap-1 py-2 text-xs ${method === m.key ? '!border-brand-500 !text-brand-400' : ''}`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {method === 'CASH' && (
          <div>
            <label className="mb-1 block text-xs text-slate-400">Cash Received</label>
            <input
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
            <input value={reference} onChange={(e) => setReference(e.target.value)} className="input w-full" placeholder="e.g. 1234-5678" />
          </div>
        )}

        {method === 'UTANG' && (
          <p className="text-xs text-amber-400">This sale will be charged to the selected customer&apos;s utang account.</p>
        )}
      </div>
    </Modal>
  )
}

function CustomerPicker({ onClose }: { onClose: () => void }): React.JSX.Element {
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
    <Modal open onClose={onClose} title="Select Customer (Utang)" maxWidth="max-w-md" footer={
      <button onClick={() => { usePosCart.getState().setCustomer(null); onClose() }} className="btn-ghost">Walk-in (no utang)</button>
    }>
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); void load(e.target.value) }}
        placeholder="Search customer…"
        className="input mb-3 w-full"
        autoFocus
      />
      <div className="max-h-72 space-y-1 overflow-y-auto">
        {loading && <p className="py-4 text-center text-sm text-slate-500">Loading…</p>}
        {!loading && rows.map((c) => (
          <button
            key={c.id}
            onClick={() => { usePosCart.getState().setCustomer(c.id); onClose() }}
            className="flex w-full items-center justify-between rounded-lg border border-ink-line px-3 py-2 text-left hover:border-brand-500/50"
          >
            <div>
              <p className="text-sm font-medium text-slate-200">{c.full_name}</p>
              <p className="text-xs text-slate-500">Limit {money(c.credit_limit_c)}</p>
            </div>
            <span className={`text-xs font-bold ${c.balance_c > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{money(c.balance_c)}</span>
          </button>
        ))}
        {!loading && rows.length === 0 && <p className="py-4 text-center text-sm text-slate-500">No customers found.</p>}
      </div>
    </Modal>
  )
}
