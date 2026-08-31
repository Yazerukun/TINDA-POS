import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, Pencil, Trash2, RefreshCw, Boxes } from 'lucide-react'
import type { Product, Category } from '@shared/types'
import { money } from '@shared/format'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { toastSuccess, toastError } from '../stores/toast'

const BLANK_UNIT = { name: '', conversion_to_base: 1, barcode: null, selling_price_c: 0, is_default: true }

interface ProductForm {
  id: number | null
  name: string
  sku: string
  barcode: string
  category_id: number | null
  base_unit: string
  purchase_cost_c: number
  default_price_c: number
  low_stock_threshold: number
  initial_stock_base: number
}

export function Inventory(): React.JSX.Element {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState<number | 'ALL' | 'LOW' | 'OUT'>('ALL')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ProductForm | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [p, c] = await Promise.all([
        window.api.products.search('', { status: 'ACTIVE', limit: 1000 }),
        window.api.categories.list()
      ])
      setProducts(p.rows)
      setCategories(c)
    } catch (e) {
      toastError('Failed to load inventory', String((e as Error)?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => {
    let list = products
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.barcode || '').toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))
    if (catFilter === 'LOW') list = list.filter((p) => p.stock > 0 && p.stock <= p.low_stock_threshold)
    else if (catFilter === 'OUT') list = list.filter((p) => p.stock <= 0)
    else if (catFilter !== 'ALL') list = list.filter((p) => p.category_id === catFilter)
    return list
  }, [products, q, catFilter])

  const totalValue = products.reduce((s, p) => s + p.stock * p.purchase_cost_c, 0)

  const archive = async (id: number) => {
    if (!confirm('Archive this product?')) return
    try {
      await window.api.products.archive(id)
      toastSuccess('Product archived')
      void load()
    } catch (e) { toastError('Archive failed', String((e as Error)?.message || e)) }
  }

  const saveProduct = async (f: ProductForm) => {
    try {
      if (f.id) {
        await window.api.products.update(f.id, {
          name: f.name, sku: f.sku, barcode: f.barcode || null, category_id: f.category_id,
          base_unit: f.base_unit, purchase_cost_c: f.purchase_cost_c, default_price_c: f.default_price_c,
          low_stock_threshold: f.low_stock_threshold, units: [BLANK_UNIT]
        })
        toastSuccess('Product updated')
      } else {
        await window.api.products.create({
          name: f.name, sku: f.sku, barcode: f.barcode || null, category_id: f.category_id,
          base_unit: f.base_unit, purchase_cost_c: f.purchase_cost_c, default_price_c: f.default_price_c,
          low_stock_threshold: f.low_stock_threshold, units: [{ ...BLANK_UNIT, name: f.base_unit }],
          initial_stock_base: f.initial_stock_base,
          description: null, supplier_id: null, has_expiration: false, notes: null
        })
        toastSuccess('Product created')
      }
      setEditing(null)
      void load()
    } catch (e) { toastError('Save failed', String((e as Error)?.message || e)) }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Inventory"
        subtitle={`${products.length} active products · stock value ${money(totalValue)}`}
        actions={
          <button onClick={() => setEditing(blankForm())} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Product
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-52">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="input w-full pl-9" />
        </div>
        <select value={String(catFilter)} onChange={(e) => setCatFilter(e.target.value as never)} className="input w-44">
          <option value="ALL">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          <option value="LOW">Low stock</option>
          <option value="OUT">Out of stock</option>
        </select>
        <button onClick={() => void load()} className="btn-ghost flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No products" message="Add your first product to start tracking stock." action={<button onClick={() => setEditing(blankForm())} className="btn-primary">New Product</button>} icon={<Boxes className="h-7 w-7" />} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.sku} · {p.category_name ?? 'Uncategorized'}</p>
                </div>
                <StockBadge status={p.stock_status} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-lg font-black text-white">{p.stock} <span className="text-xs font-medium text-slate-500">{p.base_unit}</span></p>
                  <p className="text-xs text-slate-500">{money(p.purchase_cost_c)} cost</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing({ id: p.id, name: p.name, sku: p.sku, barcode: p.barcode ?? '', category_id: p.category_id, base_unit: p.base_unit, purchase_cost_c: p.purchase_cost_c, default_price_c: p.default_price_c, low_stock_threshold: p.low_stock_threshold, initial_stock_base: 0 })} className="btn-ghost-2 rounded-lg p-2" title="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => void archive(p.id)} className="btn-ghost-2 rounded-lg p-2 text-danger-400" title="Archive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <ProductModal form={editing} categories={categories} onSave={saveProduct} onClose={() => setEditing(null)} />}
    </div>
  )
}

function blankForm(): ProductForm {
  return { id: null, name: '', sku: '', barcode: '', category_id: null, base_unit: 'pc', purchase_cost_c: 0, default_price_c: 0, low_stock_threshold: 5, initial_stock_base: 0 }
}

function StockBadge({ status }: { status: string }): React.JSX.Element {
  const map: Record<string, string> = {
    IN_STOCK: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    LOW_STOCK: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    OUT_OF_STOCK: 'bg-red-500/10 text-red-400 border-red-500/30'
  }
  return <span className={`badge shrink-0 border ${map[status] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>{status.replace(/_/g, ' ')}</span>
}

function ProductModal({ form, categories, onSave, onClose }: { form: ProductForm; categories: Category[]; onSave: (f: ProductForm) => void; onClose: () => void }): React.JSX.Element {
  const [f, setF] = useState<ProductForm>(form)
  const set = (patch: Partial<ProductForm>) => setF((prev) => ({ ...prev, ...patch }))
  return (
    <Modal open onClose={onClose} title={form.id ? 'Edit Product' : 'New Product'} maxWidth="max-w-lg" footer={
      <>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={() => onSave(f)} className="btn-primary">Save</button>
      </>
    }>
      <form onSubmit={(e) => { e.preventDefault(); onSave(f) }} className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Name *</label>
          <input required value={f.name} onChange={(e) => set({ name: e.target.value })} className="input w-full" />
        </div>
        <div>
          <label className="label">SKU</label>
          <input value={f.sku} onChange={(e) => set({ sku: e.target.value })} className="input w-full" />
        </div>
        <div>
          <label className="label">Barcode</label>
          <input value={f.barcode} onChange={(e) => set({ barcode: e.target.value })} className="input w-full" />
        </div>
        <div>
          <label className="label">Category</label>
          <select value={String(f.category_id ?? '')} onChange={(e) => set({ category_id: e.target.value ? Number(e.target.value) : null })} className="input w-full">
            <option value="">Uncategorized</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Base Unit</label>
          <input value={f.base_unit} onChange={(e) => set({ base_unit: e.target.value })} className="input w-full" placeholder="pc, sachet, bottle" />
        </div>
        <div>
          <label className="label">Purchase Cost (₱)</label>
          <input type="number" min={0} value={f.purchase_cost_c / 100} onChange={(e) => set({ purchase_cost_c: Math.round(parseFloat(e.target.value || '0') * 100) })} className="input w-full" />
        </div>
        <div>
          <label className="label">Selling Price (₱)</label>
          <input type="number" min={0} value={f.default_price_c / 100} onChange={(e) => set({ default_price_c: Math.round(parseFloat(e.target.value || '0') * 100) })} className="input w-full" />
        </div>
        <div>
          <label className="label">Low Stock Alert</label>
          <input type="number" min={0} value={f.low_stock_threshold} onChange={(e) => set({ low_stock_threshold: parseInt(e.target.value || '0', 10) })} className="input w-full" />
        </div>
        {!form.id && (
          <div>
            <label className="label">Opening Stock</label>
            <input type="number" min={0} value={f.initial_stock_base} onChange={(e) => set({ initial_stock_base: parseInt(e.target.value || '0', 10) })} className="input w-full" />
          </div>
        )}
      </form>
    </Modal>
  )
}