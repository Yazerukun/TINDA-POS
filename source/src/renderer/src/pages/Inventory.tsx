import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, Plus, Pencil, Trash2, RefreshCw, Boxes, Tags, ChevronDown, Check, Upload, PackagePlus, Download, ClipboardList, X, PackageMinus, ArrowDownUp, Image as ImageIcon, Sparkles } from 'lucide-react'
import type { Product, Category, Supplier, StockReceivingRecord, StockReceivingSource, InventoryMovement, WithdrawalReason } from '@shared/types'
import { money, moneyWholePesos } from '@shared/format'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { toastSuccess, toastError } from '../stores/toast'
import { ProductExpiry, ExpirationList } from '../components/Expiration'
import { ProductImage } from '../components/ui/ProductImage'
import {
  createProductInput,
  editProductForm,
  firstUnitError,
  newProductForm,
  updateProductInput,
  type ProductFormData,
  type ProductUnitInput
} from '../lib/productForm'

export function Inventory(): React.JSX.Element {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState<number | 'ALL' | 'LOW' | 'OUT'>('ALL')
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ProductFormData | null>(null)
  const [managingCategories, setManagingCategories] = useState(false)
  const [importing, setImporting] = useState(false)
  const [restocking, setRestocking] = useState<Product | true | null>(null)
  const [viewingReceiving, setViewingReceiving] = useState(false)
  const [withdrawing, setWithdrawing] = useState<Product | true | null>(null)
  const [viewingMovements, setViewingMovements] = useState(false)
  const [defaultThreshold, setDefaultThreshold] = useState(5)
  const [expirationOpen, setExpirationOpen] = useState(false)
  const filterMenuRef = useRef<HTMLDivElement>(null)
  const loadState = useRef({ sequence: 0 })

  const load = useCallback(async (showLoading = true) => {
    const request = ++loadState.current.sequence
    if (showLoading) setLoading(true)
    try {
      const [p, c, settings] = await Promise.all([
        window.api.products.search('', { status: 'ACTIVE', limit: 1000 }),
        window.api.categories.list(),
        window.api.settings.get()
      ])
      if (request !== loadState.current.sequence) return
      setProducts(p.rows)
      setCategories(c)
      setDefaultThreshold(settings.default_low_stock)
    } catch (e) {
      if (request === loadState.current.sequence && showLoading) toastError('Failed to load inventory', String((e as Error)?.message || e))
    } finally {
      if (request === loadState.current.sequence) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const state = loadState.current
    void load()
    const refresh = () => { void load(false) }
    const unsubscribe = window.api.inventory.onChanged(refresh)
    window.addEventListener('focus', refresh)
    const timer = window.setInterval(refresh, 15000)
    return () => { ++state.sequence; unsubscribe(); window.removeEventListener('focus', refresh); window.clearInterval(timer) }
  }, [load])

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

  const saveProduct = async (f: ProductFormData) => {
    const unitError = firstUnitError(f.units)
    if (unitError) {
      toastError('Save failed', unitError)
      return
    }
    try {
      if (f.id) {
        await window.api.products.update(f.id, updateProductInput(f))
        toastSuccess('Product updated')
      } else {
        await window.api.products.create(createProductInput(f))
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
          <button onClick={() => setExpirationOpen(true)} className="btn-ghost flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Expiration Dates</button>
          <button onClick={() => setImporting(true)} className="btn-ghost flex items-center gap-2"><Upload className="h-4 w-4" /> Import CSV</button>
          <button onClick={() => setViewingReceiving(true)} className="btn-ghost flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Stock Receiving</button>
          <button onClick={() => setViewingMovements(true)} className="btn-ghost flex items-center gap-2"><ArrowDownUp className="h-4 w-4" /> Stock History</button>
          <button onClick={() => setRestocking(true)} className="btn-primary flex items-center gap-2"><PackagePlus className="h-4 w-4" /> Restock</button>
          <button onClick={() => setWithdrawing(true)} className="btn-primary flex items-center gap-2"><PackageMinus className="h-4 w-4" /> Withdraw</button>
          <button onClick={() => setEditing(newProductForm(defaultThreshold))} className="btn-primary flex items-center gap-2">
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
        <EmptyState title="No products" message="Add your first product to start tracking stock." action={<button onClick={() => setEditing(newProductForm(defaultThreshold))} className="btn-primary">New Product</button>} icon={<Boxes className="h-7 w-7" />} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <div key={p.id} className="card p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-3">
                  <ProductImage src={p.image_path} alt={p.name} className="h-12 w-12 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white" title={p.name}>{p.name}</p>
                        <p className="truncate text-xs text-slate-500">{p.sku} · {p.category_name ?? 'Uncategorized'}</p>
                      </div>
                      <StockBadge status={p.stock_status} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-xs">
                      <span className="font-bold text-brand-400">{money(p.default_price_c)}</span>
                      {p.srp_c != null && (
                        <span className="text-[11px] text-slate-400" title="Suggested Retail Price">
                          SRP: {money(p.srp_c)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-ink-line/50">
                <div>
                  <p className="text-lg font-black text-white">{p.stock} <span className="text-xs font-medium text-slate-500">{p.base_unit}</span></p>
                  <p className="text-xs text-slate-500">{money(p.purchase_cost_c)} cost</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setRestocking(p)} className="btn-ghost-2 rounded-lg p-2 text-brand-400" title="Restock"><PackagePlus className="h-4 w-4" /></button>
                  <button onClick={() => setEditing(editProductForm(p))} className="btn-ghost-2 rounded-lg p-2" title="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => void archive(p.id)} className="btn-ghost-2 rounded-lg p-2 text-danger-400" title="Archive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <ProductExpiry product={p} />
            </div>
          ))}
        </div>
      )}

      {editing && <ProductModal form={editing} categories={categories} onSave={saveProduct} onClose={() => setEditing(null)} />}
      {expirationOpen && <ExpirationList onClose={() => setExpirationOpen(false)} />}
      {managingCategories && <CategoryModal categories={categories} onChanged={load} onClose={() => setManagingCategories(false)} />}
      {importing && <CsvImportModal onDone={() => { setImporting(false); void load() }} onClose={() => setImporting(false)} />}
      {restocking && <RestockModal products={products} initial={restocking === true ? null : restocking} onDone={() => { setRestocking(null); void load() }} onClose={() => setRestocking(null)} />}
      {withdrawing && <WithdrawModal products={products} initial={withdrawing === true ? null : withdrawing} onDone={() => { setWithdrawing(null); void load() }} onClose={() => setWithdrawing(null)} />}
      {viewingMovements && <StockHistoryView products={products} onClose={() => setViewingMovements(false)} />}
      {viewingReceiving && <StockReceivingView onClose={() => setViewingReceiving(false)} />}
    </div>
  )
}

function StockReceivingView({ onClose }: { onClose: () => void }): React.JSX.Element {
  const [rows, setRows] = useState<StockReceivingRecord[]>([])
  const [total, setTotal] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [source, setSource] = useState<StockReceivingSource | ''>('')
  const [detail, setDetail] = useState<StockReceivingRecord | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.api.inventory.receiving({ search, from, to, supplier_id: supplierId ? Number(supplierId) : undefined, source, limit: 500 })
      setRows(result.rows)
      setTotal(result.total)
      setTotalCost(result.total_cost_c)
    } catch (e) { toastError('Stock Receiving failed', String((e as Error).message || e)) } finally { setLoading(false) }
  }, [search, from, to, supplierId, source])
  useEffect(() => { void window.api.suppliers.list({ status: 'ACTIVE' }).then(setSuppliers) }, [])
  useEffect(() => { void load() }, [load])
  useEffect(() => window.api.inventory.onChanged(() => { void load() }), [load])
  const clear = () => { setSearch(''); setFrom(''); setTo(''); setSupplierId(''); setSource('') }
  return <Modal open onClose={onClose} title="Stock Receiving" maxWidth="max-w-7xl" footer={<button className="btn-ghost" onClick={onClose}>Close</button>}>
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="card p-3"><p className="text-xs text-slate-500">Receiving Records</p><p className="text-2xl font-bold text-white">{total}</p></div>
        <div className="card p-3"><p className="text-xs text-slate-500">Total Receiving Cost</p><p className="text-2xl font-bold text-brand-400">{money(totalCost)}</p></div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void load() }} className="grid gap-2 md:grid-cols-6">
        <input className="input md:col-span-2" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product" />
        <input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} aria-label="Date from" />
        <input className="input" type="date" value={to} onChange={e => setTo(e.target.value)} aria-label="Date to" />
        <select className="input" value={supplierId} onChange={e => setSupplierId(e.target.value)}><option value="">All suppliers</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select className="input" value={source} onChange={e => setSource(e.target.value as StockReceivingSource | '')}><option value="">All sources</option>{['RESTOCK','PURCHASE','CSV OPENING STOCK','INITIAL STOCK','MANUAL RECEIVING'].map(s => <option key={s} value={s}>{s}</option>)}</select>
        <div className="flex gap-2 md:col-span-6"><button className="btn-primary" type="submit">Apply Filters</button><button className="btn-ghost flex items-center gap-1" type="button" onClick={clear}><X className="h-4 w-4"/>Clear Filters</button></div>
      </form>
      <div className="max-h-[55vh] overflow-auto rounded-lg border border-ink-line">
        <table className="table min-w-[1200px]">
          <thead>
            <tr>
              <th className="w-[12%] py-3 px-2 text-center align-middle">Date / Time</th>
              <th className="w-[14%] py-3 px-2 text-center align-middle">Product</th>
              <th className="w-[7%] py-3 px-2 text-center align-middle">Received</th>
              <th className="w-[7%] py-3 px-2 text-center align-middle">Base Qty</th>
              <th className="w-[6%] py-3 px-2 text-center align-middle">Previous</th>
              <th className="w-[6%] py-3 px-2 text-center align-middle">New</th>
              <th className="w-[11%] py-3 px-2 text-center align-middle">Supplier</th>
              <th className="w-[8%] py-3 px-2 text-center align-middle">Unit Cost</th>
              <th className="w-[8%] py-3 px-2 text-center align-middle">Total Cost</th>
              <th className="w-[7%] py-3 px-2 text-center align-middle">Reference</th>
              <th className="w-[7%] py-3 px-2 text-center align-middle">Received By</th>
              <th className="w-[7%] py-3 px-2 text-center align-middle">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onClick={() => setDetail(row)} className="cursor-pointer hover:bg-ink-800">
                <td className="w-[12%] py-2.5 px-2 text-center align-middle text-xs text-slate-400">{new Date(row.created_at.replace(' ', 'T')).toLocaleString()}</td>
                <td className="w-[14%] py-2.5 px-2 text-center align-middle font-medium text-white truncate" title={row.product_name}>{row.product_name}</td>
                <td className="w-[7%] py-2.5 px-2 text-center align-middle text-xs">{row.quantity_received} {row.received_unit}</td>
                <td className="w-[7%] py-2.5 px-2 text-center align-middle text-xs">{row.base_quantity} {row.base_unit}</td>
                <td className="w-[6%] py-2.5 px-2 text-center align-middle text-xs">{row.previous_stock}</td>
                <td className="w-[6%] py-2.5 px-2 text-center align-middle text-xs">{row.new_stock}</td>
                <td className="w-[11%] py-2.5 px-2 text-center align-middle text-xs text-slate-300 truncate" title={row.supplier_name || '—'}>{row.supplier_name || '—'}</td>
                <td className="w-[8%] py-2.5 px-2 text-center align-middle font-mono tabular-nums text-xs">{row.unit_cost_c == null ? '—' : moneyWholePesos(row.unit_cost_c)}</td>
                <td className="w-[8%] py-2.5 px-2 text-center align-middle font-mono tabular-nums text-xs">{row.total_cost_c == null ? '—' : money(row.total_cost_c)}</td>
                <td className="w-[7%] py-2.5 px-2 text-center align-middle text-xs text-slate-400 truncate" title={row.reference || '—'}>{row.reference || '—'}</td>
                <td className="w-[7%] py-2.5 px-2 text-center align-middle text-xs text-slate-300 truncate" title={row.received_by || '—'}>{row.received_by || '—'}</td>
                <td className="w-[7%] py-2.5 px-2 text-center align-middle"><span className="badge inline-flex items-center justify-center text-[10px]">{row.source}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No receiving records match these filters.</p>}
        {loading && <p className="py-10 text-center text-sm text-slate-500">Loading receiving records…</p>}
      </div>
    </div>
    {detail && <Modal open onClose={() => setDetail(null)} title="Receiving Details" maxWidth="max-w-lg" footer={<button className="btn-ghost" onClick={() => setDetail(null)}>Close</button>}><dl className="grid grid-cols-2 gap-3 text-sm">{[
      ['Product', detail.product_name], ['Date / Time', new Date(detail.created_at.replace(' ', 'T')).toLocaleString()], ['Quantity', `${detail.quantity_received} ${detail.received_unit}`], ['Base Quantity', `${detail.base_quantity} ${detail.base_unit}`], ['Previous Stock', detail.previous_stock], ['New Stock', detail.new_stock], ['Supplier', detail.supplier_name || '—'], ['Unit Cost', detail.unit_cost_c == null ? '—' : moneyWholePesos(detail.unit_cost_c)], ['Total Cost', detail.total_cost_c == null ? '—' : money(detail.total_cost_c)], ['Reference', detail.reference || '—'], ['Received By', detail.received_by || '—'], ['Source', detail.source], ['Notes', detail.notes || '—']
    ].map(([label, value]) => <div key={String(label)} className={label === 'Notes' ? 'col-span-2' : ''}><dt className="text-xs text-slate-500">{label}</dt><dd className={`font-medium ${label === 'Unit Cost' || label === 'Total Cost' ? 'font-mono tabular-nums text-white' : 'text-slate-200'}`}>{value}</dd></div>)}</dl></Modal>}
  </Modal>
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
    <div className="max-h-72 overflow-auto card"><table className="table"><thead><tr><th className="w-[12%] text-center align-middle">Row</th><th className="w-[38%] text-center align-middle">Product</th><th className="w-[20%] text-center align-middle">Status</th><th className="w-[30%] text-center align-middle">Reason</th></tr></thead><tbody>{preview.rows.map(r=><tr key={r.row_number}><td className="w-[12%] text-center align-middle">{r.row_number}</td><td className="w-[38%] text-center align-middle truncate">{r.product_name || '—'}</td><td className="w-[20%] text-center align-middle">{!r.valid?'Invalid':r.duplicate?'Duplicate':'Valid'}</td><td className="w-[30%] text-center align-middle text-danger-400">{r.reasons.join('; ') || '—'}</td></tr>)}</tbody></table></div></>}
    {!preview && <p className="text-sm text-slate-400">Download the template, fill it in, then select the CSV to preview and validate every row before importing.</p>}</div>
  </Modal>
}

function RestockModal({ products, initial, onDone, onClose }: { products: Product[]; initial: Product | null; onDone: () => void; onClose: () => void }): React.JSX.Element {
  const [expiry, setExpiry] = useState('')
  const [batchLabel, setBatchLabel] = useState('')
  const [productId,setProductId]=useState(initial?.id ?? products[0]?.id ?? 0); const [quantity,setQuantity]=useState(''); const [unit,setUnit]=useState(initial?.units[0]?.name ?? initial?.base_unit ?? ''); const [supplierId,setSupplierId]=useState<number|null>(initial?.supplier_id ?? null); const [suppliers,setSuppliers]=useState<Supplier[]>([]); const [cost,setCost]=useState('0'); const [reference,setReference]=useState(''); const [notes,setNotes]=useState(''); const [busy,setBusy]=useState(false)
  useEffect(()=>{ void window.api.suppliers.list({status:'ACTIVE'}).then(setSuppliers) },[])
  const product=products.find(p=>p.id===productId); const selectedUnit=product?.units.find(u=>u.name===unit) ?? product?.units[0]; const qty=Number(quantity); const addBase=Number.isFinite(qty) ? qty*(selectedUnit?.conversion_to_base ?? 1):0; const newStock=(product?.stock??0)+addBase
  const costNum = Number(cost)
  const isCostDecimal = cost !== '' && (cost.includes('.') || !Number.isInteger(costNum) || costNum < 0)
  const save=async()=>{if(isCostDecimal) return; setBusy(true);try{await window.api.inventory.restock({product_id:productId,quantity:qty,unit_name:selectedUnit?.name??'',supplier_id:supplierId,cost_c:Math.round(Number(cost)*100),reference,notes,expiration_date:product?.expiration_mode==='BATCH'?expiry:undefined,batch_label:batchLabel});toastSuccess('Restock saved');onDone()}catch(e){toastError('Restock failed',String((e as Error).message||e))}finally{setBusy(false)}}
  return <Modal open onClose={onClose} title="Restock Inventory" maxWidth="max-w-lg" footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy || !product || !(qty>0) || isCostDecimal} onClick={()=>void save()}>Save Restock</button></>}><div className="space-y-3">
    <div><label className="label">Product</label><select className="input w-full" value={productId} onChange={e=>{const id=Number(e.target.value);setProductId(id);const p=products.find(x=>x.id===id);setUnit(p?.units[0]?.name??p?.base_unit??'')}}>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
    {product?.expiration_mode === 'BATCH' && <div className="grid grid-cols-2 gap-3"><div><label className="label">Batch label (optional)</label><input aria-label="Batch label" className="input w-full" value={batchLabel} onChange={(e) => setBatchLabel(e.target.value)} /></div><div><label className="label">Batch expiration *</label><input aria-label="Batch expiration" type="date" className="input w-full" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></div></div>}
    {product?.expiration_mode === 'ITEM' && <p className="text-sm text-amber-300">Per-item expiration: {product.expiration_date}</p>}
    <div className="rounded-lg border border-ink-line p-3 text-sm">Current Stock: <b>{product?.stock ?? 0} {product?.base_unit}</b></div><div className="grid grid-cols-2 gap-3"><div><label className="label">Quantity to Add</label><input className="input w-full" type="number" min="0.01" step="any" value={quantity} onChange={e=>setQuantity(e.target.value)}/></div><div><label className="label">Unit</label><select className="input w-full" value={selectedUnit?.name??''} onChange={e=>setUnit(e.target.value)}>{product?.units.map(u=><option key={u.id} value={u.name}>{u.name}</option>)}</select></div></div>
    <div className="rounded-lg bg-brand-500/10 p-3 text-sm">Conversion: {quantity||0} × {selectedUnit?.conversion_to_base??1} = {addBase||0} {product?.base_unit}<br/><b>New Stock: {newStock||product?.stock||0} {product?.base_unit}</b></div>
    <div><label className="label">Supplier (optional)</label><select className="input w-full" value={supplierId??''} onChange={e=>setSupplierId(e.target.value?Number(e.target.value):null)}><option value="">None</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div><label className="label">Unit Cost (₱)</label><input className={`input w-full ${isCostDecimal ? 'border-danger-500' : ''}`} type="number" min="0" step="1" value={cost} onChange={e=>setCost(e.target.value)}/>{isCostDecimal && <p className="mt-1 text-xs text-danger-400">Unit Cost must be a whole peso amount (e.g. ₱5, ₱10, ₱25 — no centavos).</p>}</div><div><label className="label">Reference (optional)</label><input className="input w-full" value={reference} onChange={e=>setReference(e.target.value)}/></div><div><label className="label">Notes (optional)</label><textarea className="input w-full" value={notes} onChange={e=>setNotes(e.target.value)}/></div>
  </div></Modal>
}

function WithdrawModal({ products, initial, onDone, onClose }: { products: Product[]; initial: Product | null; onDone: () => void; onClose: () => void }): React.JSX.Element {
  const [batchId, setBatchId] = useState<number | undefined>()
  const [productId, setProductId] = useState(initial?.id ?? products[0]?.id ?? 0)
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState(initial?.units[0]?.name ?? initial?.base_unit ?? '')
  const [reason, setReason] = useState<WithdrawalReason>('TAKEN')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const product = products.find((p) => p.id === productId)
  const selectedUnit = product?.units.find((u) => u.name === unit) ?? product?.units[0]
  const qty = Number(quantity)
  const subBase = Number.isFinite(qty) ? qty * (selectedUnit?.conversion_to_base ?? 1) : 0
  const newStock = (product?.stock ?? 0) - subBase
  const reasonLabels: Record<WithdrawalReason, string> = { TAKEN: 'Taken', DAMAGED: 'Damaged', EXPIRED: 'Expired', FORWARD: 'Forward' }
  const save = async () => {
    setBusy(true)
    try {
      await window.api.inventory.withdraw({ product_id: productId, quantity: qty, unit_name: selectedUnit?.name ?? '', reason, notes, batch_id: batchId })
      toastSuccess('Withdrawal saved')
      onDone()
    } catch (e) { toastError('Withdrawal failed', String((e as Error).message || e)) } finally { setBusy(false) }
  }
  return <Modal open onClose={onClose} title="Withdraw Stock" maxWidth="max-w-lg" footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy || !product || !(qty > 0) || newStock < 0} onClick={() => void save()}>Save Withdrawal</button></>}>
    <div className="space-y-3">
      <div><label className="label">Product</label><select className="input w-full" value={productId} onChange={(e) => { const id = Number(e.target.value); setProductId(id); const p = products.find((x) => x.id === id); setUnit(p?.units[0]?.name ?? p?.base_unit ?? '') }}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <div className="rounded-lg border border-ink-line p-3 text-sm">Current Stock: <b>{product?.stock ?? 0} {product?.base_unit}</b></div>
      {product?.expiration_mode === 'BATCH' && <div><label className="label">Batch *</label><select aria-label="Withdrawal batch" className="input w-full" value={batchId ?? ''} onChange={(e) => setBatchId(e.target.value ? Number(e.target.value) : undefined)}><option value="">Select batch</option>{product.batches?.map((b) => <option key={b.id} value={b.id}>#{b.id} {b.label} / {b.expiration_date ?? 'Undated'} / {b.quantity} {product.base_unit}</option>)}</select></div>}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Quantity to Withdraw</label><input className="input w-full" type="number" min="0.01" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
        <div><label className="label">Unit</label><select className="input w-full" value={selectedUnit?.name ?? ''} onChange={(e) => setUnit(e.target.value)}>{product?.units.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
      </div>
      <div><label className="label">Reason</label><select className="input w-full" value={reason} onChange={(e) => setReason(e.target.value as WithdrawalReason)}>{Object.entries(reasonLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className="rounded-lg bg-danger-500/10 p-3 text-sm">Conversion: {quantity || 0} × {selectedUnit?.conversion_to_base ?? 1} = {subBase || 0} {product?.base_unit} removed<br /><b>New Stock: {newStock < 0 ? 0 : newStock} {product?.base_unit}</b></div>
      {newStock < 0 && <p className="text-xs text-danger-400">Cannot withdraw more than current stock.</p>}
      <div><label className="label">Notes (optional)</label><textarea className="input w-full" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
    </div>
  </Modal>
}

function StockHistoryView({ products, onClose }: { products: Product[]; onClose: () => void }): React.JSX.Element {
  const [rows, setRows] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<'' | InventoryMovement['movement_type']>('')
  const [productId, setProductId] = useState<number | ''>('')
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.api.inventory.movements({ product_id: productId === '' ? undefined : productId, movement_type: type, limit: 300 })
      setRows(result.rows)
    } catch (e) { toastError('Stock History failed', String((e as Error).message || e)) } finally { setLoading(false) }
  }, [type, productId])
  useEffect(() => { void load() }, [load])
  useEffect(() => window.api.inventory.onChanged(() => { void load() }), [load])
  const productName = (id: number) => products.find((p) => p.id === id)?.name ?? `#${id}`
  const typeLabels: Partial<Record<InventoryMovement['movement_type'], string>> = { PURCHASE: 'Purchase', SALE: 'Sale', REFUND: 'Refund', RETURN: 'Return', DAMAGE: 'Damage', EXPIRATION: 'Expiration', LOSS: 'Loss', ADJUSTMENT: 'Adjustment', INITIAL_STOCK: 'Initial Stock', WITHDRAWAL: 'Withdrawal' }
  return <Modal open onClose={onClose} title="Stock History" maxWidth="max-w-6xl" footer={<button className="btn-ghost" onClick={onClose}>Close</button>}>
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-2">
        <div><label className="label">Product</label><select className="input w-full" value={productId} onChange={(e) => setProductId(e.target.value === '' ? '' : Number(e.target.value))}><option value="">All products</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div><label className="label">Movement Type</label><select className="input w-full" value={type} onChange={(e) => setType(e.target.value as '' | InventoryMovement['movement_type'])}><option value="">All types</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      </div>
      <div className="max-h-[55vh] overflow-auto rounded-lg border border-ink-line">
        <table className="table">
          <thead>
            <tr>
              <th className="w-[18%] text-center align-middle">Date / Time</th>
              <th className="w-[22%] text-center align-middle">Product</th>
              <th className="w-[12%] text-center align-middle">Type</th>
              <th className="w-[11%] text-center align-middle">Change</th>
              <th className="w-[11%] text-center align-middle">After</th>
              <th className="w-[16%] text-center align-middle">Reason</th>
              <th className="w-[10%] text-center align-middle">By</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="w-[18%] text-center align-middle text-xs text-slate-400">{new Date(row.created_at.replace(' ', 'T')).toLocaleString()}</td>
                <td className="w-[22%] text-center align-middle font-medium text-white truncate" title={productName(row.product_id)}>{productName(row.product_id)}</td>
                <td className="w-[12%] text-center align-middle"><span className={`badge border inline-flex items-center justify-center ${row.movement_type === 'WITHDRAWAL' ? 'border-danger-500/30 bg-danger-500/10 text-danger-300' : 'border-slate-500/30 bg-slate-500/10 text-slate-300'}`}>{typeLabels[row.movement_type] ?? row.movement_type}</span></td>
                <td className={`w-[11%] text-center align-middle font-mono tabular-nums ${row.quantity_change < 0 ? 'text-danger-400' : 'text-emerald-400'}`}>{row.quantity_change > 0 ? '+' : ''}{row.quantity_change} {row.unit}</td>
                <td className="w-[11%] text-center align-middle font-mono tabular-nums">{row.quantity_after} {row.unit}</td>
                <td className="w-[16%] text-center align-middle truncate" title={row.reason ? `${row.reason}${row.reference ? ` — ${row.reference}` : ''}` : undefined}>{row.reason || '—'}{row.reference ? <span className="text-slate-500"> — {row.reference}</span> : null}</td>
                <td className="w-[10%] text-center align-middle truncate text-slate-300">{(row as InventoryMovement & { user_name?: string }).user_name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No stock movements match these filters.</p>}
        {loading && <p className="py-10 text-center text-sm text-slate-500">Loading stock movements…</p>}
      </div>
    </div>
  </Modal>
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

function StockBadge({ status }: { status: string }): React.JSX.Element {
  const map: Record<string, string> = {
    IN_STOCK: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    LOW_STOCK: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    OUT_OF_STOCK: 'bg-red-500/10 text-red-400 border-red-500/30'
  }
  return <span className={`badge shrink-0 border ${map[status] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>{status.replace(/_/g, ' ')}</span>
}

function ProductModal({ form, categories, onSave, onClose }: { form: ProductFormData; categories: Category[]; onSave: (f: ProductFormData) => Promise<void>; onClose: () => void }): React.JSX.Element {
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localCategories, setLocalCategories] = useState(categories)
  const [categoryName, setCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [categoryBusy, setCategoryBusy] = useState(false)
  const [f, setF] = useState<ProductFormData>(form)
  const [rows, setRows] = useState<ProductUnitInput[]>(() => form.units.length > 0
    ? form.units
    : [{ name: form.base_unit, conversion_to_base: 1, barcode: null, selling_price_c: form.default_price_c, is_default: true }])
  const set = (patch: Partial<ProductFormData>) => setF((prev) => ({ ...prev, ...patch }))
  const setRow = (index: number, patch: Partial<ProductUnitInput>) => {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, ...patch } : r))
  }
  const addUnit = () => setRows((prev) => [...prev, { name: '', conversion_to_base: 1, barcode: null, selling_price_c: f.default_price_c, is_default: prev.length === 0 }])
  const removeUnit = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index))

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toastError('Upload failed', 'Please select a valid image file (PNG, JPG, WEBP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError('Upload failed', 'Image size cannot exceed 5MB.')
      return
    }
    setUploadingImage(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string
          const res = await window.api.products.saveImage({ name: file.name, dataUrl })
          set({ image_path: res.filename })
          toastSuccess('Image uploaded')
        } catch (err) {
          toastError('Image upload failed', String((err as Error)?.message || err))
        } finally {
          setUploadingImage(false)
        }
      }
      reader.onerror = () => {
        toastError('Image read failed', 'Could not read selected file.')
        setUploadingImage(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      toastError('Image upload failed', String((err as Error)?.message || err))
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    set({ image_path: null })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const cost = f.purchase_cost_c
  const price = f.default_price_c
  const profit_c = price - cost
  const marginPct = cost > 0 ? ((profit_c / cost) * 100).toFixed(1) : '0.0'

  const applyMarkup = (pct: number) => {
    if (cost <= 0) return
    const calculated = Math.round(cost * (1 + pct / 100))
    set({ default_price_c: calculated })
    if (rows[0]?.conversion_to_base === 1) {
      setRow(0, { selling_price_c: calculated })
    }
  }

  const applySrpAsPrice = () => {
    if (f.srp_c != null && f.srp_c >= 0) {
      set({ default_price_c: f.srp_c })
      if (rows[0]?.conversion_to_base === 1) {
        setRow(0, { selling_price_c: f.srp_c })
      }
    }
  }

  const submit = async () => {
    if (saving) return
    setSaving(true)
    try { await onSave({ ...f, units: rows }) } finally { setSaving(false) }
  }
  const addCategory = async () => {
    setCategoryBusy(true)
    try {
      const category = await window.api.categories.create(categoryName)
      setLocalCategories((prev) => prev.some((c) => c.id === category.id) ? prev : [...prev, category])
      set({ category_id: category.id }); setCategoryName(''); setAddingCategory(false)
    } catch (e) { toastError('Add category failed', String((e as Error).message || e)) }
    finally { setCategoryBusy(false) }
  }
  return (
    <Modal open onClose={onClose} title={form.id ? 'Edit Product' : 'New Product'} maxWidth="max-w-lg" footer={
      <>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button disabled={saving || categoryBusy || uploadingImage} onClick={() => void submit()} className="btn-primary">Save</button>
      </>
    }>
      <form onSubmit={(e) => { e.preventDefault(); void submit() }} className="grid grid-cols-2 gap-3">
        {/* Picture Upload */}
        <div className="col-span-2 flex items-center gap-4 rounded-lg border border-ink-line bg-ink-900/40 p-3">
          <ProductImage src={f.image_path} alt={f.name || 'Product'} className="h-16 w-16 rounded-lg" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-300">Product Picture</p>
            <p className="text-[11px] text-slate-500">PNG, JPG, or WEBP up to 5MB. Shows in POS and inventory.</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1.5"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                {uploadingImage ? 'Uploading…' : f.image_path ? 'Change Picture' : 'Upload Picture'}
              </button>
              {f.image_path && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="btn-ghost text-xs px-2.5 py-1.5 text-danger-400 hover:text-danger-300"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

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
            {localCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="button" className="btn-ghost mt-1 flex items-center gap-1" onClick={() => setAddingCategory((v) => !v)}><Plus className="h-4 w-4" /> Add Category</button>
          {addingCategory && <div className="mt-2 flex gap-1"><input aria-label="New category name" className="input min-w-0 flex-1" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} /><button type="button" title="Save category" className="btn-ghost" disabled={categoryBusy || !categoryName.trim()} onClick={() => void addCategory()}><Check className="h-4 w-4" /></button></div>}
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
          <label className="label flex items-center justify-between">
            <span>Suggested Retail Price (SRP)</span>
            {f.srp_c != null && f.srp_c > 0 && (
              <button
                type="button"
                onClick={applySrpAsPrice}
                className="text-[10px] text-brand-400 hover:text-brand-300 hover:underline font-normal"
                title="Copy SRP to Selling Price"
              >
                Use as Price
              </button>
            )}
          </label>
          <input
            type="number"
            min={0}
            placeholder="Optional SRP"
            value={f.srp_c != null ? f.srp_c / 100 : ''}
            onChange={(e) => set({ srp_c: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null })}
            className="input w-full"
          />
        </div>
        <div>
          <label className="label">Selling Price (₱)</label>
          <input
            type="number"
            min={0}
            value={f.default_price_c / 100}
            onChange={(e) => {
              const val = Math.round(parseFloat(e.target.value || '0') * 100)
              set({ default_price_c: val })
              if (rows[0]?.conversion_to_base === 1) {
                setRow(0, { selling_price_c: val })
              }
            }}
            className="input w-full"
          />
        </div>

        {/* Profit Margin & Auto-Markup Helper */}
        <div className="col-span-2 rounded-lg border border-ink-line bg-ink-900/30 p-2.5 text-xs text-slate-300">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Profit Margin: <b className={profit_c >= 0 ? 'text-emerald-400' : 'text-danger-400'}>{money(profit_c)}</b> ({marginPct}%)
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Sparkles className="h-3 w-3 text-brand-400" />
              <span>Auto-Markup:</span>
              {[10, 15, 20, 25, 30].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => applyMarkup(pct)}
                  className="rounded bg-ink-800 px-1.5 py-0.5 hover:bg-brand-500/20 hover:text-brand-300 transition"
                  title={`Set price to Cost + ${pct}%`}
                >
                  +{pct}%
                </button>
              ))}
            </div>
          </div>
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
        <div className="col-span-2">
          <label className="label" htmlFor="expiration-mode">Expiration Tracking</label>
          <select id="expiration-mode" className="input w-full" value={f.expiration_mode ?? 'NONE'} onChange={(e) => set({ expiration_mode: e.target.value as Product['expiration_mode'], expiration_date: null })}>
            <option value="NONE">None</option><option value="ITEM">Per Item</option><option value="BATCH">Per Batch</option>
          </select>
        </div>
        {(f.expiration_mode === 'ITEM' || (f.expiration_mode === 'BATCH' && (f.initial_stock_base > 0 || (form.expiration_mode !== 'BATCH' && (f.current_stock ?? 0) > 0)))) && <div className="col-span-2">
          <label className="label" htmlFor="product-expiration">{f.expiration_mode === 'ITEM' ? 'Expiration Date *' : 'Existing / opening stock expiration *'}</label>
          <input id="product-expiration" className="input w-full" type="date" value={f.expiration_date ?? ''} onChange={(e) => set({ expiration_date: e.target.value })} />
        </div>}
        <div className="col-span-2">
          <label className="label">Selling Units (Tingi / Multi-unit)</label>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_76px_110px_28px] items-center gap-2">
                <input placeholder={i === 0 ? 'Unit name (e.g. piece)' : 'Selling unit name'} value={r.name} onChange={(e) => setRow(i, { name: e.target.value })} className="input w-full" />
                <input type="number" min={1} step={1} title={`1 ${f.base_unit || 'base unit'} × ${r.conversion_to_base}`} value={r.conversion_to_base} onChange={(e) => setRow(i, { conversion_to_base: Math.max(1, parseInt(e.target.value || '1', 10)) })} className="input w-full" />
                <input placeholder="Barcode" value={r.barcode ?? ''} onChange={(e) => setRow(i, { barcode: e.target.value || null })} className="input w-full" />
                <button type="button" onClick={() => removeUnit(i)} disabled={rows.length <= 1} className="btn-ghost-2 rounded-lg p-2 text-danger-400 disabled:opacity-30" title="Remove selling unit"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            {rows.some((r) => !r.name || !r.name.trim()) && <p className="text-xs text-danger-400">Please enter a name for the selling unit.</p>}
          </div>
          <button type="button" onClick={addUnit} className="btn-ghost mt-2 flex items-center gap-1"><Plus className="h-4 w-4" /> Add selling unit</button>
          <p className="mt-1 text-xs text-slate-500">Conversion is how many base units one selling unit equals. Example: 1 box = 24 sachets.</p>
        </div>
      </form>
    </Modal>
  )
}
