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
  Sparkles,
  Download,
  RotateCcw,
  X,
  Loader2
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { SectionCard, StatusBadge, EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import type { Product, Sale, ReportSummary } from '@shared/types'
import { money, moneyShort, shortDateTime } from '@shared/format'
import { useUpdate } from '../stores/update'

function StatCard({
  label,
  value,
  sub,
  icon,
  valueColor = 'text-white',
  iconClass = 'bg-ink-700 text-brand-400'
}: {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  valueColor?: string
  iconClass?: string
}): React.JSX.Element {
  return (
    <div className="card p-4">
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
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [recent, setRecent] = useState<Sale[]>([])
  const [alertProducts, setAlertProducts] = useState<Product[]>([])
  const [utang, setUtang] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showNotes, setShowNotes] = useState(false)
  const [updateBusy, setUpdateBusy] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalDismissed, setModalDismissed] = useState(false)

  const { event, download, install, dismiss } = useUpdate()

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

  // Automatic background update check on Dashboard mount
  useEffect(() => {
    void useUpdate.getState().init().then(() => {
      void useUpdate.getState().check(false)
    })
  }, [])

  // Show update modal pop-up when update is detected
  useEffect(() => {
    if (
      event &&
      ['UPDATE_AVAILABLE', 'DOWNLOADED', 'READY_TO_INSTALL'].includes(event.status as string) &&
      !modalDismissed
    ) {
      setShowModal(true)
    }
  }, [event?.status, modalDismissed])

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

  const updateStatus = event?.status
  const showBanner =
    event &&
    ['UPDATE_AVAILABLE', 'DOWNLOADING', 'DOWNLOADED', 'READY_TO_INSTALL'].includes(updateStatus as string)
  const version = event?.available?.version ?? ''

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" subtitle="Sales Overview" />

      {/* Dashboard Prominent Update Banner */}
      {showBanner && (
        <div className="mb-6 overflow-hidden rounded-xl border border-brand-500/40 bg-gradient-to-r from-brand-950/40 via-ink-900 to-ink-900 p-4 shadow-pop">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">
                    {updateStatus === 'UPDATE_AVAILABLE' && `New Update Available · v${version}`}
                    {updateStatus === 'DOWNLOADING' && `Downloading Update… v${version}`}
                    {updateStatus === 'DOWNLOADED' && `Update Downloaded · Ready to Install`}
                    {updateStatus === 'READY_TO_INSTALL' && `Update Ready to Install · v${version}`}
                  </h3>
                  <span className="badge border border-brand-500/40 bg-brand-500/10 text-brand-300 text-[10px] font-semibold uppercase tracking-wider">
                    Release
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  {event.portable
                    ? 'TINDA POS is running in portable mode. Download the latest version to get new features and fixes.'
                    : 'Your store data is safe and will be backed up automatically before installing.'}
                </p>

                {updateStatus === 'DOWNLOADING' && event.progress && (
                  <div className="mt-2.5 max-w-md">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-800">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all duration-300"
                        style={{ width: `${event.progress.percent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{event.progress.percent}% downloaded</p>
                  </div>
                )}

                {showNotes && event.available?.releaseNotes && (
                  <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-ink-line bg-ink-950/80 p-3 text-xs text-slate-300">
                    <p className="mb-1 font-semibold text-white">What&apos;s New in v{event.available.version}:</p>
                    <pre className="whitespace-pre-wrap font-sans">{event.available.releaseNotes}</pre>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Open Pop-up
                  </button>
                  {event.available?.releaseNotes && (
                    <button
                      type="button"
                      onClick={() => setShowNotes((v) => !v)}
                      className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs"
                    >
                      {showNotes ? 'Hide Changelog' : "View What's New"}
                    </button>
                  )}
                  {updateStatus === 'UPDATE_AVAILABLE' && (
                    <button
                      type="button"
                      disabled={updateBusy}
                      onClick={() => {
                        setUpdateBusy(true)
                        void download().finally(() => setUpdateBusy(false))
                      }}
                      className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold"
                    >
                      {updateBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      Download Update
                    </button>
                  )}
                  {(updateStatus === 'DOWNLOADED' || updateStatus === 'READY_TO_INSTALL') && (
                    <button
                      type="button"
                      disabled={updateBusy}
                      onClick={() => {
                        setUpdateBusy(true)
                        void install().finally(() => setUpdateBusy(false))
                      }}
                      className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold"
                    >
                      {updateBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                      Restart &amp; Install
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      void dismiss()
                      setShowModal(false)
                      setModalDismissed(true)
                    }}
                    className="btn-ghost px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                void dismiss()
                setShowModal(false)
                setModalDismissed(true)
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white transition"
              title="Dismiss update notice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Update Available Modal Pop-up */}
      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setModalDismissed(true)
        }}
        title={`🎉 Bag-ong Update! · v${version}`}
        maxWidth="max-w-xl"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setShowModal(false)
                setModalDismissed(true)
              }}
              className="btn-ghost px-4 py-2 text-xs text-slate-300 hover:text-white"
            >
              Unya Na (Later)
            </button>

            {updateStatus === 'UPDATE_AVAILABLE' && (
              <button
                type="button"
                disabled={updateBusy}
                onClick={() => {
                  setUpdateBusy(true)
                  void download().finally(() => setUpdateBusy(false))
                }}
                className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
              >
                {updateBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Download Update
              </button>
            )}

            {(updateStatus === 'DOWNLOADED' || updateStatus === 'READY_TO_INSTALL') && (
              <button
                type="button"
                disabled={updateBusy}
                onClick={() => {
                  setUpdateBusy(true)
                  void install().finally(() => setUpdateBusy(false))
                }}
                className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
              >
                {updateBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Restart &amp; Install
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-brand-500/30 bg-brand-950/30 p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/20 text-brand-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">
                Adunay bag-ong bersyon sa TINDA POS nga magamit!
              </p>
              <p className="mt-0.5 text-xs text-slate-300">
                {event?.portable
                  ? 'Naka-portable mode ang imong TINDA POS. I-download ang bag-ong portable EXE aron magamit ang bag-ong mga features.'
                  : 'Ang imong mga data (sales, inventory, utang) luwas ug awtomatikong i-backup sa dili pa mag-update.'}
              </p>
            </div>
          </div>

          {updateStatus === 'DOWNLOADING' && event?.progress && (
            <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
                <span>Nag-download sa update…</span>
                <span>{event.progress.percent}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-950">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${event.progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {event?.available?.releaseNotes && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Unsay Bago sa Bersyon v{event.available.version}:
              </p>
              <div className="max-h-56 overflow-y-auto rounded-lg border border-ink-line bg-ink-950 p-3 text-xs text-slate-300 leading-relaxed">
                <pre className="whitespace-pre-wrap font-sans text-slate-300">
                  {event.available.releaseNotes}
                </pre>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Today's Net Sales"
          value={money(summary.sales_total_c - summary.refunds_c)}
          sub={`${summary.transactions} transactions · Refunds: ${money(summary.refunds_c)}`}
          icon={<TrendingUp className="h-5 w-5" />}
          valueColor="text-emerald-400"
          iconClass="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          label="Estimated Profit"
          value={money(summary.profit_c)}
          sub={`${summary.items_sold} items sold`}
          icon={<Banknote className="h-5 w-5" />}
          valueColor="text-teal-400"
          iconClass="bg-teal-500/10 text-teal-400"
        />
        <StatCard
          label="Outstanding Utang"
          value={money(utang)}
          sub="customer credit"
          icon={<Wallet className="h-5 w-5" />}
          valueColor="text-rose-400"
          iconClass="bg-rose-500/10 text-rose-400"
        />
        <StatCard
          label="Expenses"
          value={money(summary.expenses_c)}
          sub="this period"
          icon={<Receipt className="h-5 w-5" />}
          valueColor="text-amber-400"
          iconClass="bg-amber-500/10 text-amber-400"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
