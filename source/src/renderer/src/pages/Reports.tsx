import { useEffect, useState } from 'react'
import { FileDown, BarChart3, Printer, LockKeyhole } from 'lucide-react'
import type { SalesReportRow, ReportSummary, ReadReport, ZRead } from '@shared/types'
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
  const [tab, setTab] = useState<'SALES' | 'INVENTORY' | 'UTANG' | 'X' | 'Z' | 'ZHISTORY'>('SALES')
  const [inv, setInv] = useState<{ rows: { name: string; stock: number; base_unit: string; inventory_value_c: number }[]; summary: { total_units: number; inventory_value_c: number; low_stock: number; out_of_stock: number } } | null>(null)
  const [utang, setUtang] = useState<{ rows: { full_name: string; balance_c: number; credit_limit_c: number }[]; total_outstanding_c: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [read, setRead] = useState<ReadReport | null>(null)
  const [history, setHistory] = useState<ZRead[]>([])

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
  useEffect(() => { if (tab === 'SALES') void loadSales(); else if (tab === 'INVENTORY') void loadInv(); else if (tab === 'UTANG') void loadUtang(); else if (tab === 'X' || tab === 'Z') void window.api.reports.xRead().then(setRead).catch(e=>toastError('No open shift',String((e as Error).message||e))); else void window.api.reports.zHistory().then(setHistory) }, [tab])

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
        actions={(['SALES','INVENTORY','UTANG'] as const).includes(tab as 'SALES'|'INVENTORY'|'UTANG') ? <button onClick={() => void exportCsv()} className="btn-primary flex items-center gap-2"><FileDown className="h-4 w-4" /> Export CSV</button> : undefined}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setTab('SALES')} className={`btn-ghost ${tab === 'SALES' ? '!border-brand-500 !text-brand-400' : ''}`}>Sales</button>
        <button onClick={() => setTab('INVENTORY')} className={`btn-ghost ${tab === 'INVENTORY' ? '!border-brand-500 !text-brand-400' : ''}`}>Inventory</button>
        <button onClick={() => setTab('UTANG')} className={`btn-ghost ${tab === 'UTANG' ? '!border-brand-500 !text-brand-400' : ''}`}>Utang</button>
        <button onClick={() => setTab('X')} className={`btn-ghost ${tab === 'X' ? '!border-brand-500 !text-brand-400' : ''}`}>X-Read</button>
        <button onClick={() => setTab('Z')} className={`btn-ghost ${tab === 'Z' ? '!border-brand-500 !text-brand-400' : ''}`}>Z-Read</button>
        <button onClick={() => setTab('ZHISTORY')} className={`btn-ghost ${tab === 'ZHISTORY' ? '!border-brand-500 !text-brand-400' : ''}`}>Z-Read History</button>
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

      {(tab === 'X' || tab === 'Z') && read && <ReadPanel report={read} finalize={tab === 'Z'} onFinalized={()=>{setRead(null);setTab('ZHISTORY')}}/>}
      {tab === 'ZHISTORY' && <div className="card overflow-hidden"><table className="table"><thead><tr><th>Report</th><th>Finalized</th><th>Cashier</th><th>Net Sales</th><th></th></tr></thead><tbody>{history.map(z=><tr key={z.id}><td>{z.report_no}</td><td>{shortDate(z.finalized_at)}</td><td>{z.snapshot.cashier_name}</td><td>{money(z.snapshot.net_sales_c)}</td><td><button className="btn-ghost flex gap-1" onClick={()=>void window.api.reports.printZRead(z.id)}><Printer className="h-4 w-4"/>Print</button></td></tr>)}{history.length===0&&<tr><td colSpan={5} className="py-8 text-center text-slate-500">No finalized Z-Reads yet.</td></tr>}</tbody></table></div>}

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

function ReadPanel({report,finalize,onFinalized}:{report:ReadReport;finalize:boolean;onFinalized:()=>void}):React.JSX.Element {
  const [actual,setActual]=useState(String(report.expected_cash_c/100)); const [busy,setBusy]=useState(false)
  const finish=async()=>{if(!confirm('Finalize Z-Read? This will finalize the current reporting period. Transactions and history will remain saved.'))return;setBusy(true);try{await window.api.reports.finalizeZ({actual_cash_c:Math.round(Number(actual)*100)});toastSuccess('Z-Read finalized');onFinalized()}catch(e){toastError('Z-Read failed',String((e as Error).message||e))}finally{setBusy(false)}}
  const stats:[string,number|string][]=[['Gross Sales',report.gross_sales_c],['Discounts',report.discount_c],['Refunds',report.refunds_c],['Voids',report.voids_c],['Net Sales',report.net_sales_c],['Cash',report.cash_c],['GCash',report.gcash_c],['Maya',report.maya_c],['Utang',report.utang_c],['Expenses',report.expenses_c],['Expected Cash',report.expected_cash_c],['Transactions',String(report.transaction_count)]]
  return <div><div className="mb-4 rounded-lg border border-ink-line p-4"><p className="font-bold">{finalize?'Z-Read Final Summary':'Current Shift — Read Only'}</p><p className="text-sm text-slate-400">Cashier: {report.cashier_name} · Shift #{report.shift_id} · Generated {new Date(report.report_at).toLocaleString()}</p></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([l,v])=><Stat key={l} label={l} v={typeof v==='number'?money(v):v}/>)}</div><div className="mt-4 flex gap-2">{finalize?<><div><label className="label">Actual Cash (₱)</label><input className="input" type="number" min="0" value={actual} onChange={e=>setActual(e.target.value)}/></div><button className="btn-primary self-end flex gap-2" disabled={busy} onClick={()=>void finish()}><LockKeyhole className="h-4 w-4"/>Finalize Z-Read</button></>:<button className="btn-primary flex gap-2" onClick={()=>void window.api.reports.printXRead()}><Printer className="h-4 w-4"/>Print X-Read</button>}</div>{finalize&&<p className="mt-3 text-sm text-amber-300">Finalization closes this shift. Transactions, payments, stock history, expenses, and customer ledgers remain saved.</p>}</div>
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
