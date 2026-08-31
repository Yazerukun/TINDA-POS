import { useEffect, useState } from 'react'
import { FileDown, BarChart3 } from 'lucide-react'
import type { SalesReportRow, ReportSummary } from '@shared/types'
import { money, shortDate } from '@shared/format'
import { PageHeader } from '../components/ui/PageHeader'
import { toastSuccess, toastError } from '../stores/toast'

interface CompState {
  rows: SalesReportRow[]
  summary: ReportSummary
  chart: { label: string; total_c: number; profit_c: number }[]
}

export function Reports(): React.JSX.Element {
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10))
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [groupBy, setGroupBy] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY')
  const [data, setData] = useState<CompState | null>(null)
  const [tab, setTab] = useState<'SALES' | 'INVENTORY' | 'UTANG'>('SALES')
  const [inv, setInv] = useState<{ rows: { name: string; stock: number; base_unit: string; inventory_value_c: number }[]; summary: { total_units: number; inventory_value_c: number; low_stock: number; out_of_stock: number } } | null>(null)
  const [utang, setUtang] = useState<{ rows: { full_name: string; balance_c: number; credit_limit_c: number }[]; total_outstanding_c: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const loadSales = async () => {
    setLoading(true)
    try {
      const res = await window.api.reports.sales({ from, to, groupBy })
      setData(res)
    } catch (e) { toastError('Failed to load report', String((e as Error)?.message || e)) } finally { setLoading(false) }
  }
  const loadInv = async () => {
    setLoading(true)
    try { setInv(await window.api.reports.inventory()) } catch (e) { toastError('Failed to load', String((e as Error)?.message || e)) } finally { setLoading(false) }
  }
  const loadUtang = async () => {
    setLoading(true)
    try { setUtang(await window.api.reports.utang()) } catch (e) { toastError('Failed to load', String((e as Error)?.message || e)) } finally { setLoading(false) }
  }

  // Loaders are redefined per render; this effect intentionally keys on tab and
  // (re)loads only when the active report changes, not on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'SALES') void loadSales(); else if (tab === 'INVENTORY') void loadInv(); else void loadUtang() }, [tab])

  const exportCsv = async () => {
    try {
      const kind = tab === 'SALES' ? 'SALES' : tab === 'INVENTORY' ? 'INVENTORY' : 'UTANG'
      const res = await window.api.reports.exportCsv(kind, { from, to })
      toastSuccess('Export saved', res.path)
    } catch (e) { toastError('Export failed', String((e as Error)?.message || e)) }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Reports"
        actions={<button onClick={() => void exportCsv()} className="btn-primary flex items-center gap-2"><FileDown className="h-4 w-4" /> Export CSV</button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setTab('SALES')} className={`btn-ghost ${tab === 'SALES' ? '!border-brand-500 !text-brand-400' : ''}`}>Sales</button>
        <button onClick={() => setTab('INVENTORY')} className={`btn-ghost ${tab === 'INVENTORY' ? '!border-brand-500 !text-brand-400' : ''}`}>Inventory</button>
        <button onClick={() => setTab('UTANG')} className={`btn-ghost ${tab === 'UTANG' ? '!border-brand-500 !text-brand-400' : ''}`}>Utang</button>
      </div>

      {tab === 'SALES' && (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <div><label className="label">From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input w-44" /></div>
            <div><label className="label">To</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input w-44" /></div>
            <div><label className="label">Group by</label>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as never)} className="input w-40">
                <option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <button onClick={() => void loadSales()} className="btn-primary">Run</button>
          </div>

          {loading ? <div className="h-40 animate-pulse card" /> : data ? (
            <>
              <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
                <Stat label="Sales" v={money(data.summary.sales_total_c)} />
                <Stat label="Profit" v={money(data.summary.profit_c)} />
                <Stat label="Cost" v={money(data.summary.cost_c)} />
                <Stat label="Discounts" v={money(data.summary.discount_c)} />
                <Stat label="Transactions" v={String(data.summary.transactions)} />
              </div>
              <div className="card mb-4 overflow-hidden">
                <table className="table">
                  <thead><tr><th>Receipt</th><th>Date</th><th>Cashier</th><th>Method</th><th className="text-right">Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.rows.map((r) => (
                      <tr key={r.sale_id}>
                        <td className="font-medium text-brand-400">{r.transaction_no}</td>
                        <td className="text-slate-400">{shortDate(r.created_at)}</td>
                        <td className="text-slate-300">{r.cashier}</td>
                        <td className="text-slate-400">{r.method}</td>
                        <td className="text-right font-bold text-white">{money(r.total_c)}</td>
                        <td><span className="badge bg-ink-700 text-slate-300">{r.status}</span></td>
                      </tr>
                    ))}
                    {data.rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-500">No sales in this period.</td></tr>}
                  </tbody>
                </table>
              </div>
              {data.chart.length > 0 && (
                <div className="card p-4">
                  <h3 className="mb-3 text-sm font-bold uppercase text-slate-300">Chart</h3>
                  <div className="flex h-40 items-end gap-1">
                    {data.chart.map((c, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <div className="flex w-full items-end justify-center bg-brand-600/30" style={{ height: `${Math.max(2, (c.total_c / Math.max(1, Math.max(...data.chart.map((x) => x.total_c)))) * 100)}%` }} title={c.label}>
                        </div>
                        <span className="text-[9px] text-slate-500">{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </>
      )}

      {tab === 'INVENTORY' && (loading ? <div className="h-40 animate-pulse card" /> : inv ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Total Units" v={String(inv.summary.total_units)} />
            <Stat label="Stock Value" v={money(inv.summary.inventory_value_c)} />
            <Stat label="Low Stock" v={String(inv.summary.low_stock)} />
            <Stat label="Out of Stock" v={String(inv.summary.out_of_stock)} />
          </div>
          <div className="card overflow-hidden">
            <table className="table">
              <thead><tr><th>Product</th><th className="text-right">Stock</th><th className="text-right">Unit Value</th><th className="text-right">Total Value</th></tr></thead>
              <tbody>
                {inv.rows.map((p, i) => (
                  <tr key={i}>
                    <td className="text-slate-200">{p.name}</td>
                    <td className="text-right text-slate-300">{p.stock} {p.base_unit}</td>
                    <td colSpan={2}></td>
                  </tr>
                ))}
                {inv.rows.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-500">No products.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      ) : null)}

      {tab === 'UTANG' && (loading ? <div className="h-40 animate-pulse card" /> : utang ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <Stat label="Total Outstanding" v={money(utang.total_outstanding_c)} />
            <Stat label="Customers" v={String(utang.rows.length)} />
          </div>
          <div className="card overflow-hidden">
            <table className="table">
              <thead><tr><th>Customer</th><th className="text-right">Limit</th><th className="text-right">Balance</th></tr></thead>
              <tbody>
                {utang.rows.map((c, i) => (
                  <tr key={i}>
                    <td className="text-slate-200">{c.full_name}</td>
                    <td className="text-right text-slate-400">{money(c.credit_limit_c)}</td>
                    <td className={`text-right font-bold ${c.balance_c > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{money(c.balance_c)}</td>
                  </tr>
                ))}
                {utang.rows.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-slate-500">No outstanding balances.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      ) : null)}
    </div>
  )
}

function Stat({ label, v }: { label: string; v: string }): React.JSX.Element {
  return (
    <div className="card p-3">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{v}</p>
    </div>
  )
}

export function ReportsIcon(): React.JSX.Element {
  return <BarChart3 className="h-4 w-4" />
}