import { useEffect, useState } from 'react'
import {
  TrendingUp,
  Banknote,
  Wallet,
  Receipt,
  ShoppingCart,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { SectionCard, StatusBadge, EmptyState } from '../components/ui/EmptyState'
import type { Product, Sale, ReportSummary } from '@shared/types'
import { money, moneyShort, shortDateTime } from '@shared/format'
import { productExpirationStatus } from '@shared/expiration'
import { useAuth } from '../stores/auth'
import { useSettings } from '../stores/settings'
import { AppLogo } from '../components/AppLogo'

function StatCard({
  label,
  value,
  sub,
  icon,
  valueColor = 'text-white',
  iconClass = 'bg-ink-700 text-brand-400',
  className = ''
}: {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  valueColor?: string
  iconClass?: string
  className?: string
}): React.JSX.Element {
  return (
    <div className={`card p-4 transition-all duration-300 hover:border-brand-500/30 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className={`mt-1 text-2xl font-black ${valueColor}`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>{icon}</div>
      </div>
    </div>
  )
}

export function Dashboard(): React.JSX.Element | null {
  const { user, shiftOpen } = useAuth()
  const { settings } = useSettings()
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [recent, setRecent] = useState<Sale[]>([])
  const [alertProducts, setAlertProducts] = useState<Product[]>([])
  const [utang, setUtang] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [expiryAlerts, setExpiryAlerts] = useState<{ expired: Product[]; soon: Product[] }>({ expired: [], soon: [] })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const cashierName = user?.full_name || user?.username || settings?.owner_name || 'Cashier'

  useEffect(() => {
    let alive = true
    let generation = 0
    const load = async () => {
      const request = ++generation
      try {
        const now = new Date()
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        const [sales, prods, u, tx] = await Promise.all([
          window.api.reports.sales({ from: today, to: today }),
          window.api.products.search('', { status: 'ACTIVE', limit: 1000 }),
          window.api.reports.utang(),
          window.api.transactions.list({ from: `${today} 00:00:00`, to: `${today} 23:59:59`, limit: 8 })
        ])
        if (!alive || request !== generation) return
        setError(null)
        setSummary(sales.summary)
        setRecent(tx.rows)
        const alerts = prods.rows.filter((p) => p.stock <= p.low_stock_threshold).slice(0, 10)
        setAlertProducts(alerts)
        const expired = prods.rows.filter((p) => productExpirationStatus(p) === 'EXPIRED')
        const soon = prods.rows.filter((p) => {
          const st = productExpirationStatus(p)
          return st === 'SOON' || st === 'NEAR'
        })
        setExpiryAlerts({ expired, soon })
        setUtang(u.total_outstanding_c)
      } catch (e) {
        if (alive && request === generation) setError(String((e as Error)?.message || e))
      }
    }
    const refresh = () => { void load() }
    refresh()
    const unsubscribe = window.api.inventory.onChanged(refresh)
    window.addEventListener('focus', refresh)
    const timer = window.setInterval(refresh, 15000)
    return () => {
      alive = false
      unsubscribe()
      window.removeEventListener('focus', refresh)
      window.clearInterval(timer)
    }
  }, [])

  if (error) {
    return (
      <div className="p-6">
        <PageHeader title="Dashboard" subtitle="Sales Overview" />
        <div className="card p-6 text-center">
          <p className="text-sm text-danger-400">Failed to load dashboard: {error}</p>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="p-6">
        <PageHeader title="Dashboard" subtitle="Sales Overview" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const out = alertProducts.filter((p) => p.stock <= 0)
  const low = alertProducts.filter((p) => p.stock > 0)

  return (
    <div className="p-6 space-y-4">
      <PageHeader title="Dashboard" subtitle="Sales Overview" />

      {/* Executive Welcome & Shift Status Banner */}
      <div className="animate-fadeInUp rounded-2xl border border-ink-line bg-gradient-to-r from-ink-900 via-ink-850 to-ink-900 p-4 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <AppLogo size={42} showBadge={false} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-black text-white tracking-tight">
                {greeting}, <span className="text-brand-400">{cashierName}</span>!
              </h2>
              <span className={`badge text-[10px] uppercase font-bold tracking-wider ${
                shiftOpen
                  ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border border-amber-500/40 bg-amber-500/10 text-amber-400'
              }`}>
                {shiftOpen ? '🟢 Shift Active' : '🟡 Shift Closed'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {settings?.store_name || 'TINDA Store'} · POS Terminal Active · Ready for transactions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="rounded-lg bg-ink-800/80 px-3 py-1.5 border border-ink-line text-slate-300 font-medium">
            📅 {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Today's Net Sales"
          value={money(summary.sales_total_c - summary.refunds_c)}
          sub={`${summary.transactions} transactions · Refunds: ${money(summary.refunds_c)}`}
          icon={<TrendingUp className="h-5 w-5" />}
          valueColor="text-emerald-400"
          iconClass="bg-emerald-500/10 text-emerald-400"
          className="animate-fadeInUp stagger-1"
        />
        <StatCard
          label="True Net Profit"
          value={money(summary.net_profit_c ?? (summary.profit_c - summary.expenses_c))}
          sub={`Gross: ${money(summary.profit_c)} · Exp: ${money(summary.expenses_c)}`}
          icon={<Banknote className="h-5 w-5" />}
          valueColor="text-teal-400"
          iconClass="bg-teal-500/10 text-teal-400"
          className="animate-fadeInUp stagger-2"
        />
        <StatCard
          label="Outstanding Utang"
          value={money(utang)}
          sub="customer credit"
          icon={<Wallet className="h-5 w-5" />}
          valueColor="text-rose-400"
          iconClass="bg-rose-500/10 text-rose-400"
          className="animate-fadeInUp stagger-3"
        />
        <StatCard
          label="Operating Expenses"
          value={money(summary.expenses_c)}
          sub="disbursed from store"
          icon={<Receipt className="h-5 w-5" />}
          valueColor="text-amber-400"
          iconClass="bg-amber-500/10 text-amber-400"
          className="animate-fadeInUp stagger-4"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 animate-fadeInUp stagger-5">
        <div className="space-y-4">
          <SectionCard title="LOW / OUT OF STOCK" action={<span className="text-xs text-slate-500">{out.length} out · {low.length} low</span>}>
            {alertProducts.length === 0 ? (
              <p className="text-sm text-slate-400">All products in stock.</p>
            ) : (
              <div className="space-y-2">
                {alertProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${p.stock <= 0 ? 'text-red-400' : 'text-amber-400'}`} />
                      <span className="truncate text-sm text-slate-200">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{p.stock} {p.base_unit}</span>
                      <StatusBadge status={p.stock <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {((expiryAlerts?.expired?.length ?? 0) > 0 || (expiryAlerts?.soon?.length ?? 0) > 0) && (
            <SectionCard
              title="EXPIRATION & SPOILAGE ALERTS"
              action={
                <span className="text-xs">
                  {(expiryAlerts?.expired?.length ?? 0) > 0 && (
                    <span className="text-red-400 font-bold mr-2">{expiryAlerts?.expired?.length} expired</span>
                  )}
                  {(expiryAlerts?.soon?.length ?? 0) > 0 && (
                    <span className="text-amber-400 font-bold">{expiryAlerts?.soon?.length} expiring soon</span>
                  )}
                </span>
              }
            >
              <div className="space-y-2">
                {[...(expiryAlerts?.expired ?? []), ...(expiryAlerts?.soon ?? [])].slice(0, 8).map((p) => {
                  const st = productExpirationStatus(p)
                  const isExp = st === 'EXPIRED'
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${isExp ? 'text-red-400' : 'text-amber-400'}`} />
                        <span className="truncate text-sm text-slate-200">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {p.expiration_mode === 'BATCH'
                            ? `${p.batches?.length ?? 0} batches`
                            : p.expiration_date || 'No date'}
                        </span>
                        <StatusBadge status={isExp ? 'EXPIRED' : 'EXPIRING_SOON'} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          )}
        </div>

        <SectionCard title="RECENT TRANSACTIONS" action={<span className="text-xs text-slate-500">{recent.length} shown</span>}>
          {recent.length === 0 ? (
            <EmptyState title="No transactions yet" message="Sales you make today will appear here." icon={<ShoppingCart className="h-7 w-7" />} />
          ) : (
            <div className="space-y-1">
              {recent.map((s) => {
                const isOpen = expandedId === s.id
                const toggle = () => setExpandedId(isOpen ? null : s.id)
                const itemSummary = s.items.map((i) => `${i.product_name} ×${i.qty}`).join(', ')
                return (
                  <div key={s.id} className="rounded-lg border border-ink-line overflow-hidden">
                    {/* Header row — clickable */}
                    <button
                      onClick={toggle}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-ink-700 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-200">{s.transaction_no}</p>
                        <p className="truncate text-xs text-slate-500">
                          {s.cashier_name} · {shortDateTime(s.created_at)}
                          {!isOpen && <span className="text-slate-600"> — {itemSummary}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-white">{moneyShort(s.total_c)}</span>
                        <StatusBadge status={s.status} />
                        {isOpen
                          ? <ChevronUp className="h-4 w-4 text-slate-500" />
                          : <ChevronDown className="h-4 w-4 text-slate-500" />}
                      </div>
                    </button>
                    {/* Expanded item list */}
                    {isOpen && (
                      <div className="border-t border-ink-line bg-ink-800 px-3 py-2 space-y-1">
                        {s.items.map((i) => (
                          <div key={i.id} className="flex justify-between text-xs">
                            <span className="text-slate-300">
                              {i.product_name}{' '}
                              <span className="text-slate-500">×{i.qty} {i.unit_name}</span>
                              {i.refunded_qty_base > 0 && (
                                <span className="ml-1 text-amber-400">(ref {i.refunded_qty_base})</span>
                              )}
                            </span>
                            <span className="font-medium text-slate-200">{money(i.subtotal_c)}</span>
                          </div>
                        ))}
                        <div className="mt-1 pt-1 border-t border-ink-line flex justify-between text-xs">
                          {s.discount_c > 0 && (
                            <span className="text-slate-500">Discount: -{money(s.discount_c)}</span>
                          )}
                          <span className="ml-auto text-slate-400">
                            {s.payments.map((p) => p.method).join(' + ')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
