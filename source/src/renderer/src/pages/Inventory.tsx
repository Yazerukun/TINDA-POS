import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Plus, Pencil, Trash2, RefreshCw, Boxes, Tags, ChevronDown, Check, Upload, PackagePlus, Download } from 'lucide-react'
import type { Product, Category, Supplier } from '@shared/types'
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
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ProductForm | null>(null)
  const [managingCategories, setManagingCategories] = useState(false)
  const [importing, setImporting] = useState(false)
  const [restocking, setRestocking] = useState<Product | true | null>(null)
  const filterMenuRef = useRef<HTMLDivElement>(null)

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
  useEffect(() => window.api.inventory.onChanged(() => { void load() }), [])

  useEffect(() => {
    if (!filterMenuOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!filterMenuRef.current?.contains(event.target as Node)) setFilterMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFilterMenuOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [filterMenuOpen])

  const filterLabel = catFilter === 'ALL'
    ? 'All categories'
    : catFilter === 'LOW'
      ? 'Low stock'
      : catFilter === 'OUT'
        ? 'Out of stock'
        : categories.find((category) => category.id === catFilter)?.name ?? 'All categories'

  const chooseFilter = (filter: number | 'ALL' | 'LOW' | 'OUT') => {
    setCatFilter(filter)
    setFilterMenuOpen(false)
  }

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
        actions={<div className="flex flex-wrap gap-2">
          <button onClick={() => setImporting(true)} className="btn-ghost flex items-center gap-2"><Upload className="h-4 w-4" /> Import CSV</button>
          <button onClick={() => setRestocking(true)} className="btn-primary flex items-center gap-2"><PackagePlus className="h-4 w-4" /> Restock</button>
          <button onClick={() => setEditing(blankForm())} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Product
          </button>
        </div>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-52">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="input w-full pl-9" />
        </div>
        <div ref={filterMenuRef} className="relative w-44 shrink-0">
          <button
            type="button"
            onClick={() => setFilterMenuOpen((open) => !open)}
            className="input flex w-full items-center justify-between gap-2 text-left"
            aria-haspopup="listbox"
            aria-expanded={filterMenuOpen}
          >
            <span className="truncate">{filterLabel}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${filterMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {filterMenuOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-ink-line bg-ink-850 p-1 shadow-pop" role="listbox">
              {([
                { value: 'ALL' as const, label: 'All categories' },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
                { value: 'LOW' as const, label: 'Low stock' },
                { value: 'OUT' as const, label: 'Out of stock' }
              ]).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => chooseFilter(item.value)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-ink-700 ${catFilter === item.value ? 'text-brand-300' : 'text-slate-200'}`}
                  role="option"
                  aria-selected={catFilter === item.value}
                >
                  <span className="truncate">{item.label}</span>
                  {catFilter === item.value && <Check className="h-4 w-4 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setManagingCategories(true)} className="btn-ghost flex items-center gap-2"><Tags className="h-4 w-4" /> Categories</button>
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
                  <button onClick={() => setRestocking(p)} className="btn-ghost-2 rounded-lg p-2 text-brand-400" title="Restock"><PackagePlus className="h-4 w-4" /></button>
                  <button onClick={() => setEditing({ id: p.id, name: p.name, sku: p.sku, barcode: p.barcode ?? '', category_id: p.category_id, base_unit: p.base_unit, purchase_cost_c: p.purchase_cost_c, default_price_c: p.default_price_c, low_stock_threshold: p.low_stock_threshold, initial_stock_base: 0 })} className="btn-ghost-2 rounded-lg p-2" title="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => void archive(p.id)} className="btn-ghost-2 rounded-lg p-2 text-danger-400" title="Archive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <ProductModal form={editing} categories={categories} onSave={saveProduct} onClose={() => setEditing(null)} />}
      {managingCategories && <CategoryModal categories={categories} onChanged={load} onClose={() => setManagingCategories(false)} />}
      {importing && <CsvImportModal onDone={() => { setImporting(false); void load() }} onClose={() => setImporting(false)} />}
      {restocking && <RestockModal products={products} initial={restocking === true ? null : restocking} onDone={() => { setRestocking(null); void load() }} onClose={() => setRestocking(null)} />}
    </div>
  )
}

function CsvImportModal({ onDone, onClose }: { onDone: () => void; onClose: () => void }): React.JSX.Element {
  const [text, setText] = useState(''); const [preview, setPreview] = useState<Awaited<ReturnType<typeof window.api.products.previewCsv>> | null>(null); const [strategy, setStrategy] = useState<'SKIP'|'UPDATE'>('SKIP'); const [busy, setBusy] = useState(false)
  const choose = async (file?: File) => { if (!file) return; const content = await file.text(); setText(content); try { setPreview(await window.api.products.previewCsv(content)) } catch (e) { setPreview(null); toastError('CSV validation failed', String((e as Error).message || e)) } }
  const download = async () => { const content = await window.api.products.csvTemplate(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], {type:'text/csv'})); a.download='TINDA-POS-product-import-template.csv'; a.click(); URL.revokeObjectURL(a.href) }
  const run = async () => { setBusy(true); try { const r = await window.api.products.importCsv(text, strategy); toastSuccess('CSV import complete', `${r.created} created · ${r.updated} updated · ${r.skipped} skipped`); onDone() } catch(e) { toastError('Import failed', String((e as Error).message || e)) } finally { setBusy(false) } }
  return <Modal open onClose={onClose} title="Import Products from CSV" maxWidth="max-w-4xl" footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={!preview || preview.invalid>0 || busy} onClick={() => void run()}>Import Products</button></>}>
    <div className="space-y-4"><div className="flex gap-2"><button className="btn-ghost flex gap-2" onClick={() => void download()}><Download className="h-4 w-4"/>Download Template</button><label className="btn-primary cursor-pointer">Select CSV<input className="hidden" type="file" accept=".csv,text/csv" onChange={e => void choose(e.target.files?.[0])}/></label></div>
    {preview && <><div className="grid grid-cols-4 gap-2">{[['Total Rows',preview.total],['Valid Rows',preview.valid],['Invalid Rows',preview.invalid],['Duplicates',preview.duplicates]].map(([a,b])=><div className="card p-3" key={String(a)}><p className="text-xs text-slate-500">{a}</p><p className="text-xl font-bold">{b}</p></div>)}</div>
    {preview.duplicates>0 && <div><label className="label">Existing SKU/barcode</label><select className="input" value={strategy} onChange={e=>setStrategy(e.target.value as 'SKIP'|'UPDATE')}><option value="SKIP">Skip Existing</option><option value="UPDATE">Update Existing</option></select></div>}
    <div className="max-h-72 overflow-auto card"><table className="table"><thead><tr><th>Row</th><th>Product</th><th>Status</th><th>Reason</th></tr></thead><tbody>{preview.rows.map(r=><tr key={r.row_number}><td>{r.row_number}</td><td>{r.product_name || '—'}</td><td>{!r.valid?'Invalid':r.duplicate?'Duplicate':'Valid'}</td><td className="text-danger-400">{r.reasons.join('; ') || '—'}</td></tr>)}</tbody></table></div></>}
    {!preview && <p className="text-sm text-slate-400">Download the template, fill it in, then select the CSV to preview and validate every row before importing.</p>}</div>
  </Modal>
}

function RestockModal({ products, initial, onDone, onClose }: { products: Product[]; initial: Product | null; onDone: () => void; onClose: () => void }): React.JSX.Element {
  const [productId,setProductId]=useState(initial?.id ?? products[0]?.id ?? 0); const [quantity,setQuantity]=useState(''); const [unit,setUnit]=useState(initial?.units[0]?.name ?? initial?.base_unit ?? ''); const [supplierId,setSupplierId]=useState<number|null>(initial?.supplier_id ?? null); const [suppliers,setSuppliers]=useState<Supplier[]>([]); const [cost,setCost]=useState('0'); const [reference,setReference]=useState(''); const [notes,setNotes]=useState(''); const [busy,setBusy]=useState(false)
  useEffect(()=>{ void window.api.suppliers.list({status:'ACTIVE'}).then(setSuppliers) },[])
  const product=products.find(p=>p.id===productId); const selectedUnit=product?.units.find(u=>u.name===unit) ?? product?.units[0]; const qty=Number(quantity); const addBase=Number.isFinite(qty) ? qty*(selectedUnit?.conversion_to_base ?? 1):0; const newStock=(product?.stock??0)+addBase
  const save=async()=>{setBusy(true);try{await window.api.inventory.restock({product_id:productId,quantity:qty,unit_name:selectedUnit?.name??'',supplier_id:supplierId,cost_c:Math.round(Number(cost)*100),reference,notes});toastSuccess('Restock saved');onDone()}catch(e){toastError('Restock failed',String((e as Error).message||e))}finally{setBusy(false)}}
  return <Modal open onClose={onClose} title="Restock Inventory" maxWidth="max-w-lg" footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy || !product || !(qty>0)} onClick={()=>void save()}>Save Restock</button></>}><div className="space-y-3">
    <div><label className="label">Product</label><select className="input w-full" value={productId} onChange={e=>{const id=Number(e.target.value);setProductId(id);const p=products.find(x=>x.id===id);setUnit(p?.units[0]?.name??p?.base_unit??'')}}>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
    <div className="rounded-lg border border-ink-line p-3 text-sm">Current Stock: <b>{product?.stock ?? 0} {product?.base_unit}</b></div><div className="grid grid-cols-2 gap-3"><div><label className="label">Quantity to Add</label><input className="input w-full" type="number" min="0.01" step="any" value={quantity} onChange={e=>setQuantity(e.target.value)}/></div><div><label className="label">Unit</label><select className="input w-full" value={selectedUnit?.name??''} onChange={e=>setUnit(e.target.value)}>{product?.units.map(u=><option key={u.id} value={u.name}>{u.name}</option>)}</select></div></div>
    <div className="rounded-lg bg-brand-500/10 p-3 text-sm">Conversion: {quantity||0} × {selectedUnit?.conversion_to_base??1} = {addBase||0} {product?.base_unit}<br/><b>New Stock: {newStock||product?.stock||0} {product?.base_unit}</b></div>
    <div><label className="label">Supplier (optional)</label><select className="input w-full" value={supplierId??''} onChange={e=>setSupplierId(e.target.value?Number(e.target.value):null)}><option value="">None</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div><label className="label">Cost (₱)</label><input className="input w-full" type="number" min="0" value={cost} onChange={e=>setCost(e.target.value)}/></div><div><label className="label">Reference (optional)</label><input className="input w-full" value={reference} onChange={e=>setReference(e.target.value)}/></div><div><label className="label">Notes (optional)</label><textarea className="input w-full" value={notes} onChange={e=>setNotes(e.target.value)}/></div>
  </div></Modal>
}

function CategoryModal({ categories, onChanged, onClose }: { categories: Category[]; onChanged: () => Promise<void>; onClose: () => void }): React.JSX.Element {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!name.trim()) { toastError('Category name is required'); return }
    setBusy(true)
    try {
      await window.api.categories.create(name)
      setName('')
      await onChanged()
      toastSuccess('Category added')
    } catch (e) { toastError('Add category failed', String((e as Error)?.message || e)) } finally { setBusy(false) }
  }

  const remove = async (category: Category) => {
    if (!confirm(`Delete category "${category.name}"? Products must be moved first if this category is in use.`)) return
    setBusy(true)
    try {
      await window.api.categories.remove(category.id)
      await onChanged()
      toastSuccess('Category deleted')
    } catch (e) { toastError('Delete category failed', String((e as Error)?.message || e)) } finally { setBusy(false) }
  }

  return (
    <Modal open onClose={onClose} title="Manage Categories" maxWidth="max-w-md" footer={<button onClick={onClose} className="btn-ghost">Close</button>}>
      <form onSubmit={(e) => { e.preventDefault(); void add() }} className="mb-4 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" className="input flex-1" autoFocus />
        <button type="submit" disabled={busy || !name.trim()} className="btn-primary flex items-center gap-1"><Plus className="h-4 w-4" /> Add</button>
      </form>
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {categories.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No categories yet.</p>}
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between rounded-lg border border-ink-line px-3 py-2">
            <span className="text-sm font-medium text-slate-200">{category.name}</span>
            <button onClick={() => void remove(category)} disabled={busy} className="btn-ghost-2 rounded-lg p-2 text-danger-400" title="Delete category"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">A category used by a product cannot be deleted until those products are moved or uncategorized.</p>
    </Modal>
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
