import { useEffect, useState, useRef } from 'react'
import {
  Tv,
  Clock,
  TrendingUp,
  Receipt,
  Banknote,
  Smartphone,
  Wallet,
  CheckCircle2,
  RefreshCw,
  Maximize2,
  Minimize2,
  ShoppingBag,
  ArrowUpRight
} from 'lucide-react'
import type { Sale } from '@shared/types'
import { money, shortDateTime } from '@shared/format'

function playSuccessChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12) // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.36)
  } catch {
    /* silent fallback if audio is blocked */
  }
}

interface MonitorData {
  store_name: string
  currency: string
  today: {
    total_sales_c: number
    total_transactions: number
    cash_c: number
    gcash_c: number
    maya_c: number
    utang_c: number
  }
  recent_sales: Sale[]
}

export function SalesMonitorScreen(): React.JSX.Element {
  const [data, setData] = useState<MonitorData | null>(null)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newlyArrivedId, setNewlyArrivedId] = useState<number | null>(null)
  const timerRef = useRef<number | null>(null)

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Load summary data
  const loadData = async (silent = false): Promise<void> => {
    if (!silent) setIsRefreshing(true)
    try {
      const res = await window.api.app.salesMonitorSummary()
      setData(res)
      setSelectedSale((prev) => {
        if (prev) {
          const updated = res.recent_sales.find((s) => s.id === prev.id)
          return updated || prev
        }
        return res.recent_sales[0] || null
      })
    } catch (e) {
      console.error('Failed to load sales monitor summary:', e)
    } finally {
      if (!silent) setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    // Poll every 20 seconds as background fallback
    const interval = setInterval(() => loadData(true), 20000)
    return () => clearInterval(interval)
  }, [])

  // Live IPC listener for new sales
  useEffect(() => {
    const unsub = window.api.app.onSaleCompleted((sale) => {
      playSuccessChime()
      setNewlyArrivedId(sale.id)

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setNewlyArrivedId(null), 4000)

      setSelectedSale(sale)

      setData((prev) => {
        if (!prev) return prev
        const filteredRecent = prev.recent_sales.filter((s) => s.id !== sale.id)
        const updatedRecent = [sale, ...filteredRecent].slice(0, 50)

        // Calculate cash / gcash / maya / utang additions
        let addCash = 0
        let addGcash = 0
        let addMaya = 0
        let addUtang = 0

        for (const p of sale.payments) {
          if (p.method === 'CASH') addCash += p.amount_c
          else if (p.method === 'GCASH') addGcash += p.amount_c
          else if (p.method === 'MAYA') addMaya += p.amount_c
          else if (p.method === 'UTANG') addUtang += p.amount_c
        }

        return {
          ...prev,
          today: {
            total_sales_c: prev.today.total_sales_c + sale.total_c,
            total_transactions: prev.today.total_transactions + 1,
            cash_c: prev.today.cash_c + addCash,
            gcash_c: prev.today.gcash_c + addGcash,
            maya_c: prev.today.maya_c + addMaya,
            utang_c: prev.today.utang_c + addUtang
          },
          recent_sales: updatedRecent
        }
      })
    })

    return () => {
      unsub()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const toggleFullscreen = (): void => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const timeFormatted = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateFormatted = currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#090b0e] text-slate-100 font-sans select-none">
      {/* Top Navigation Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.08] bg-black/40 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white shadow-lg shadow-brand-500/20">
            <Tv className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-extrabold tracking-tight text-white">
                {data?.store_name ?? 'TINDA POS'}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE MONITOR
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wide">
              Customer Display & Real-time Sales Summary
            </p>
          </div>
        </div>

        {/* Right Info: Live Clock & Actions */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 font-mono text-sm font-bold text-slate-200">
              <Clock className="h-3.5 w-3.5 text-brand-400" />
              <span>{timeFormatted}</span>
            </div>
            <div className="text-[11px] text-slate-400">{dateFormatted}</div>
          </div>

          <div className="flex items-center gap-1.5 border-l border-white/[0.08] pl-4">
            <button
              onClick={() => loadData()}
              disabled={isRefreshing}
              title="Refresh Sales"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
            </button>
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white active:scale-95"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* KPI Overview Summary Bar */}
      <section className="grid shrink-0 grid-cols-2 gap-3 border-b border-white/[0.06] bg-black/20 p-4 md:grid-cols-5">
        {/* Total Today */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Today's Sales</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-1 font-mono text-2xl font-black text-emerald-400">
            {money(data?.today.total_sales_c ?? 0)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            {data?.today.total_transactions ?? 0} transaction{(data?.today.total_transactions ?? 0) === 1 ? '' : 's'}
          </div>
        </div>

        {/* Transactions */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Transactions</span>
            <Receipt className="h-4 w-4 text-brand-400" />
          </div>
          <div className="mt-1 font-mono text-2xl font-black text-white">
            {data?.today.total_transactions ?? 0}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Recorded today</div>
        </div>

        {/* Cash Sales */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cash</span>
            <Banknote className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-1 font-mono text-xl font-black text-slate-200">
            {money(data?.today.cash_c ?? 0)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Cash in drawer</div>
        </div>

        {/* E-Wallets (GCash / Maya) */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">GCash / Maya</span>
            <Smartphone className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-1 font-mono text-xl font-black text-sky-400">
            {money((data?.today.gcash_c ?? 0) + (data?.today.maya_c ?? 0))}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Digital payments</div>
        </div>

        {/* Utang / Credit */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Utang (Credit)</span>
            <Wallet className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-1 font-mono text-xl font-black text-amber-400">
            {money(data?.today.utang_c ?? 0)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Store credit</div>
        </div>
      </section>

      {/* Main Split Body: Left = Active Sale Inspector, Right = Real-Time Sales Summary Feed */}
      <main className="flex flex-1 min-h-0 overflow-hidden p-4 gap-4">
        {/* Left: Active / Latest Sale Inspector & Customer Receipt View */}
        <div className="flex w-[42%] flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5 bg-black/20">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-brand-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Latest Transaction Breakdown
              </h2>
            </div>
            {selectedSale && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                {selectedSale.status}
              </span>
            )}
          </div>

          {selectedSale ? (
            <div className="flex flex-1 flex-col overflow-hidden p-5">
              {/* Receipt Header Info */}
              <div className="rounded-xl border border-white/[0.06] bg-black/40 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-lg font-black text-white">{selectedSale.transaction_no}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Cashier: <span className="font-medium text-slate-200">{selectedSale.cashier_name || 'Cashier'}</span>
                    </p>
                    {selectedSale.customer_name && (
                      <p className="text-xs text-amber-400">
                        Customer: <span className="font-medium">{selectedSale.customer_name}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs text-slate-400">
                      {shortDateTime(selectedSale.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="my-3 flex-1 overflow-y-auto rounded-xl border border-white/[0.06] bg-black/20">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 border-b border-white/[0.08] bg-black/60 text-slate-400">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Item</th>
                      <th className="px-2 py-2.5 text-center font-semibold">Qty</th>
                      <th className="px-2 py-2.5 text-right font-semibold">Price</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {selectedSale.items.map((item, idx) => (
                      <tr key={item.id ?? idx} className="hover:bg-white/[0.02]">
                        <td className="px-3 py-2.5 font-medium text-slate-200">
                          {item.product_name}
                          <span className="ml-1 text-[10px] text-slate-400">({item.unit_name})</span>
                        </td>
                        <td className="px-2 py-2.5 text-center font-mono font-semibold text-slate-300">
                          {item.qty}
                        </td>
                        <td className="px-2 py-2.5 text-right font-mono text-slate-400">
                          {money(item.unit_price_c)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-200">
                          {money(item.subtotal_c)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Payments Summary */}
              <div className="shrink-0 space-y-2 rounded-xl border border-white/[0.08] bg-black/40 p-4">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-300">{money(selectedSale.subtotal_c)}</span>
                </div>
                {selectedSale.discount_c > 0 && (
                  <div className="flex justify-between text-xs text-amber-400">
                    <span>Discount</span>
                    <span className="font-mono">-{money(selectedSale.discount_c)}</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t border-white/[0.08] pt-2">
                  <span className="text-sm font-extrabold uppercase text-white">Grand Total</span>
                  <span className="font-mono text-2xl font-black text-emerald-400">
                    {money(selectedSale.total_c)}
                  </span>
                </div>

                {/* Payments */}
                <div className="border-t border-white/[0.06] pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Payment Method
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSale.payments.map((p, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs"
                      >
                        <span className="font-bold text-slate-300">{p.method}</span>
                        <span className="font-mono font-semibold text-emerald-400">{money(p.amount_c)}</span>
                        {p.reference && <span className="text-[10px] text-slate-400">Ref: {p.reference}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-500">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06] text-slate-400 mb-3">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">Awaiting Sales</p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                When a cashier completes a transaction, full item details and breakdown will appear here instantly.
              </p>
            </div>
          )}
        </div>

        {/* Right: Live Sales Feed & Record of Every Sale ("Bawat Sales Summary") */}
        <div className="flex flex-1 flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5 bg-black/20">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Live Sales Summary Feed
              </h2>
              <p className="text-[11px] text-slate-400">
                Continuous real-time ledger of completed transactions
              </p>
            </div>
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-400 border border-brand-500/20 font-mono">
              {data?.recent_sales.length ?? 0} Recorded
            </span>
          </div>

          {/* Feed List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {data?.recent_sales && data.recent_sales.length > 0 ? (
              data.recent_sales.map((sale) => {
                const isSelected = selectedSale?.id === sale.id
                const isNewlyArrived = newlyArrivedId === sale.id
                const itemsCount = sale.items.reduce((s, it) => s + (Number(it.qty) || 1), 0)
                const itemsSummary = sale.items
                  .map((it) => `${it.product_name} (${it.qty} ${it.unit_name})`)
                  .slice(0, 3)
                  .join(', ') + (sale.items.length > 3 ? ` +${sale.items.length - 3} more` : '')

                return (
                  <div
                    key={sale.id}
                    onClick={() => setSelectedSale(sale)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition duration-200 ${
                      isSelected
                        ? 'border-brand-500/50 bg-brand-500/10 shadow-lg'
                        : isNewlyArrived
                        ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 shadow-lg'
                        : 'border-white/[0.06] bg-black/30 hover:border-white/[0.12] hover:bg-black/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-extrabold text-white">
                          {sale.transaction_no}
                        </span>
                        {isNewlyArrived && (
                          <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-black animate-bounce">
                            NEW
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          by <strong className="text-slate-300 font-semibold">{sale.cashier_name || 'Cashier'}</strong>
                        </span>
                        {sale.customer_name && (
                          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-amber-300">
                            {sale.customer_name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">
                          {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="font-mono text-base font-black text-emerald-400">
                          {money(sale.total_c)}
                        </div>
                      </div>
                    </div>

                    {/* Condensed Item Summary */}
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                      <p className="truncate max-w-[65%] text-[11px] text-slate-400">
                        <span className="font-medium text-slate-300">{itemsCount} item{itemsCount === 1 ? '' : 's'}:</span> {itemsSummary}
                      </p>

                      {/* Payment Badges */}
                      <div className="flex items-center gap-1.5">
                        {sale.payments.map((p, idx) => (
                          <span
                            key={idx}
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              p.method === 'CASH'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : p.method === 'UTANG'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            }`}
                          >
                            {p.method}
                          </span>
                        ))}
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex h-48 flex-col items-center justify-center text-center text-slate-500">
                <Receipt className="h-8 w-8 text-slate-600 mb-2" />
                <p className="text-xs">No transactions recorded yet today.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
