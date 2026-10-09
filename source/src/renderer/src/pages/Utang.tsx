import { useEffect, useMemo, useState } from 'react'
import { Search, Wallet, HandCoins, Scale, Check, ChevronDown, ChevronUp, Package, Printer, HelpCircle, Star, Crown, MessageSquare, Copy, Trash2, RotateCcw, AlertTriangle, Pencil } from 'lucide-react'
import type { Customer, CreditLedgerEntry, Sale } from '@shared/types'
import { money, shortDateTime } from '@shared/format'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, StatusBadge } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { toastSuccess, toastError } from '../stores/toast'
import { useGuide } from '../stores/guide'
import { VipUpgradeModal } from '../components/VipUpgradeModal'

type UtangTab = 'WITH_BALANCE' | 'SETTLED' | 'ALL'

export function Utang(): React.JSX.Element {
  const [rows, setRows] = useState<Customer[]>([])
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<UtangTab>('WITH_BALANCE')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Customer | null>(null)
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([])
  const [action, setAction] = useState<null | { type: 'PAY' | 'ADJUST' | 'OVERLIMIT'; customer: Customer }>(null)
  const [isVip, setIsVip] = useState(true)
  const [vipModalOpen, setVipModalOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [res, lic] = await Promise.all([
        window.api.customers.list({ status: 'ACTIVE', limit: 1000 }),
        window.api.license?.getStatus?.().catch(() => ({ isVip: true }))
      ])
      setRows(res.rows)
      if (lic) setIsVip(lic.isVip)
    } catch (e) {
      toastError('Failed to load utang', String((e as Error)?.message || e))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void load() }, [])

  const withBalanceCount = useMemo(() => rows.filter((c) => c.balance_c > 0).length, [rows])
  const settledCount = useMemo(() => rows.filter((c) => c.balance_c === 0).length, [rows])
  const totalOutstanding = useMemo(() => rows.reduce((s, c) => s + c.balance_c, 0), [rows])

  const filtered = useMemo(() => {
    let list = rows
    if (tab === 'WITH_BALANCE') {
      list = list.filter((c) => c.balance_c > 0)
    } else if (tab === 'SETTLED') {
      list = list.filter((c) => c.balance_c === 0)
    }
    if (q.trim()) {
      const query = q.toLowerCase()
      list = list.filter((c) =>
        (c.full_name + ' ' + (c.nickname || '') + ' ' + (c.phone || '')).toLowerCase().includes(query)
      )
    }
    return list
  }, [rows, tab, q])

  const openLedger = async (c: Customer) => {
    setSelected(c)
    const l = await window.api.customers.ledger(c.id, { limit: 50 })
    setLedger(l)
  }

  const actionDone = async () => {
    const customerId = action?.customer.id
    setAction(null)
    await load()
    if (customerId && selected?.id === customerId) {
      const [customer, entries] = await Promise.all([
        window.api.customers.get(customerId),
        window.api.customers.ledger(customerId, { limit: 50 })
      ])
      setSelected(customer)
      setLedger(entries)
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Utang"
        subtitle={`Customer credit management · Total outstanding: ${money(totalOutstanding)}`}
        actions={
          <button
            onClick={() => useGuide.getState().openGuide('utang')}
            className="btn-ghost flex items-center gap-2 text-amber-300 hover:text-amber-200"
          >
            <HelpCircle className="h-4 w-4 text-amber-400" /> Utang Guide
          </button>
        }
      />

      {/* Quick Stats Summary */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Outstanding Utang</p>
          <p className="mt-1 text-2xl font-black font-mono tabular-nums text-rose-400">{money(totalOutstanding)}</p>
          <p className="mt-1 text-xs text-slate-500">{withBalanceCount} customer(s) with balance</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">With Balance</p>
          <p className="mt-1 text-2xl font-black font-mono tabular-nums text-amber-400">{withBalanceCount}</p>
          <p className="mt-1 text-xs text-slate-500">Pending collections</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Settled</p>
          <p className="mt-1 text-2xl font-black font-mono tabular-nums text-emerald-400">{settledCount}</p>
          <p className="mt-1 text-xs text-slate-500">Fully paid (₱0.00 balance)</p>
        </div>
      </div>

      {!isVip && (
        <div className="mb-4 rounded-xl border border-ink-line bg-ink-850/80 p-3.5 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${withBalanceCount >= 15 ? 'bg-danger-500/20 text-danger-400' : withBalanceCount >= 12 ? 'bg-amber-500/20 text-amber-400' : 'bg-brand-500/20 text-brand-400'}`}>
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">Free Community Edition: Suki Debtors Capacity</span>
                  <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${withBalanceCount >= 15 ? 'bg-danger-500/20 text-danger-300' : withBalanceCount >= 12 ? 'bg-amber-500/20 text-amber-300' : 'bg-ink-700 text-slate-300'}`}>
                    {withBalanceCount} / 15 Suki Debtors
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {withBalanceCount >= 15 ? 'Active debtor limit reached. Upgrade to VIP Pro to extend credit to unlimited customers.' : `${15 - withBalanceCount} credit debtor slot(s) remaining on Free Edition.`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setVipModalOpen(true)}
              className="btn-ghost flex items-center gap-1.5 text-xs font-semibold text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
            >
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              Upgrade to VIP Pro (₱500 Lifetime)
            </button>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
            <div
              className={`h-full transition-all duration-300 ${withBalanceCount >= 15 ? 'bg-danger-500' : withBalanceCount >= 12 ? 'bg-amber-500' : 'bg-brand-500'}`}
              style={{ width: `${Math.min(100, (withBalanceCount / 15) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTab('WITH_BALANCE')}
            className={`btn-ghost flex items-center gap-2 text-sm rounded-lg px-3 py-2 transition-all ${
              tab === 'WITH_BALANCE'
                ? '!border-brand-500 !text-brand-300 font-semibold bg-brand-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="h-4 w-4 text-amber-400" />
            <span>With Balance</span>
            <span
              className={`badge text-xs ${
                tab === 'WITH_BALANCE' ? 'bg-amber-500/20 text-amber-300' : 'bg-ink-800 text-slate-400'
              }`}
            >
              {withBalanceCount}
            </span>
          </button>
          <button
            onClick={() => setTab('SETTLED')}
            className={`btn-ghost flex items-center gap-2 text-sm rounded-lg px-3 py-2 transition-all ${
              tab === 'SETTLED'
                ? '!border-brand-500 !text-brand-300 font-semibold bg-brand-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Check className="h-4 w-4 text-emerald-400" />
            <span>Settled</span>
            <span
              className={`badge text-xs ${
                tab === 'SETTLED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-ink-800 text-slate-400'
              }`}
            >
              {settledCount}
            </span>
          </button>
          <button
            onClick={() => setTab('ALL')}
            className={`btn-ghost flex items-center gap-2 text-sm rounded-lg px-3 py-2 transition-all ${
              tab === 'ALL'
                ? '!border-brand-500 !text-brand-300 font-semibold bg-brand-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>All</span>
            <span className="badge bg-ink-800 text-xs text-slate-400">{rows.length}</span>
          </button>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or phone…"
            className="input w-full pl-9 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-14 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        tab === 'WITH_BALANCE' ? (
          <EmptyState
            title="No Outstanding Balance"
            message="Great! No customers currently have an unpaid credit balance."
            icon={<Check className="h-7 w-7 text-emerald-400" />}
          />
        ) : tab === 'SETTLED' ? (
          <EmptyState
            title="No Settled Accounts"
            message="Customers who have fully paid off their credit balance (₱0.00) will appear here."
            icon={<HandCoins className="h-7 w-7 text-slate-400" />}
          />
        ) : (
          <EmptyState
            title="No Customers Found"
            message={q ? `No customers matched "${q}".` : 'No customers recorded yet.'}
            icon={<Wallet className="h-7 w-7 text-slate-400" />}
          />
        )
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="w-[32%] py-3 px-3 text-center align-middle">Customer</th>
                  <th className="w-[17%] py-3 px-3 text-center align-middle">Credit Limit</th>
                  <th className="w-[17%] py-3 px-3 text-center align-middle">Balance</th>
                  <th className="w-[17%] py-3 px-3 text-center align-middle">Status</th>
                  <th className="w-[17%] py-3 px-3 text-center align-middle">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const isOverLimit = c.balance_c > c.credit_limit_c
                  const isSettled = c.balance_c === 0
                  return (
                    <tr key={c.id} className="hover:bg-ink-800/50 transition-colors">
                      <td className="w-[32%] py-3 px-3 text-center align-middle">
                        <button
                          onClick={() => void openLedger(c)}
                          className="font-medium text-brand-400 hover:text-brand-300 hover:underline text-center inline-block max-w-full truncate"
                          title={c.full_name}
                        >
                          {c.full_name}
                        </button>
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 truncate">
                          {c.nickname && <span>{c.nickname}</span>}
                          {c.nickname && c.phone && <span>·</span>}
                          {c.phone && <span>{c.phone}</span>}
                        </div>
                      </td>
                      <td className="w-[17%] py-3 px-3 text-center align-middle font-mono tabular-nums text-slate-300">
                        {money(c.credit_limit_c)}
                      </td>
                      <td
                        className={`w-[17%] py-3 px-3 text-center align-middle font-mono tabular-nums font-bold ${
                          isSettled ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {money(c.balance_c)}
                      </td>
                      <td className="w-[17%] py-3 px-3 text-center align-middle">
                        {isSettled ? (
                          <span className="badge border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 inline-flex items-center justify-center gap-1 font-semibold">
                            <Check className="h-3 w-3" /> Settled
                          </span>
                        ) : isOverLimit ? (
                          <span className="badge border border-rose-500/30 bg-rose-500/10 text-rose-400 font-semibold inline-flex items-center justify-center">
                            Over Limit
                          </span>
                        ) : (
                          <span className="badge border border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold inline-flex items-center justify-center">
                            With Balance
                          </span>
                        )}
                      </td>
                      <td className="w-[17%] py-3 px-3 text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isSettled ? (
                            <button
                              onClick={() => setAction({ type: 'PAY', customer: c })}
                              className="btn-primary flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs"
                              title="Collect payment"
                            >
                              <HandCoins className="h-3.5 w-3.5" /> Pay
                            </button>
                          ) : (
                            <button
                              onClick={() => void openLedger(c)}
                              className="btn-ghost-2 flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                              title="View ledger history"
                            >
                              <Wallet className="h-3.5 w-3.5" /> Ledger
                            </button>
                          )}
                          <button
                            onClick={() => setAction({ type: 'ADJUST', customer: c })}
                            className="btn-ghost-2 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400"
                            title="Adjust balance"
                          >
                            <Scale className="h-3.5 w-3.5" /> Adj
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <LedgerModal
          customer={selected}
          entries={ledger}
          onClose={() => setSelected(null)}
          onPay={() => setAction({ type: 'PAY', customer: selected })}
          onUpdateCustomer={(updated) => {
            setSelected(updated)
            setRows((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
          }}
        />
      )}
      {action && <CreditActionModal action={action} onClose={() => setAction(null)} onDone={() => void actionDone()} />}
      <VipUpgradeModal open={vipModalOpen} onClose={() => setVipModalOpen(false)} onActivated={() => void load()} />
    </div>
  )
}

// ─── Ledger Entry Row with expandable items for CREDIT_SALE ─────────────────

function LedgerEntryRow({
  entry,
  onDelete
}: {
  entry: CreditLedgerEntry
  onDelete?: (entry: CreditLedgerEntry) => void
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const [sale, setSale] = useState<Sale | null>(null)
  const [loadingItems, setLoadingItems] = useState(false)

  const isCreditSale = entry.entry_type === 'CREDIT_SALE' && entry.reference_id != null

  const toggleItems = async () => {
    if (!isCreditSale) return
    if (!expanded && !sale) {
      setLoadingItems(true)
      try {
        const s = await window.api.transactions.get(entry.reference_id!)
        setSale(s)
      } catch {
        toastError('Failed to load items')
      } finally {
        setLoadingItems(false)
      }
    }
    setExpanded((v) => !v)
  }

  const handlePrint = async () => {
    if (!entry.reference_id) return
    try {
      await window.api.printer.printReceipt(entry.reference_id)
      toastSuccess('Receipt sent to printer')
    } catch (e) {
      toastError('Print failed', String((e as Error)?.message || e))
    }
  }

  return (
    <div className="rounded-lg border border-ink-line text-sm overflow-hidden">
      {/* Main row */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium capitalize text-slate-200">
            {entry.entry_type.replace(/_/g, ' ').toLowerCase()}
          </p>
          <p className="text-xs text-slate-500">{shortDateTime(entry.created_at)}</p>
          {entry.notes && !isCreditSale && (
            <p className="text-xs text-slate-500 truncate mt-0.5">{entry.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <span className={`font-bold ${entry.amount_c >= 0 ? 'text-danger-400' : 'text-emerald-400'}`}>
            {entry.amount_c >= 0 ? '+' : ''}{money(entry.amount_c)}
          </span>
          {isCreditSale && (
            <button
              onClick={() => void toggleItems()}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 transition-colors"
              title="View items taken on credit"
            >
              <Package className="h-3 w-3" />
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(entry)}
              className="flex items-center justify-center rounded p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete ledger entry & re-sync balance"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded items panel */}
      {isCreditSale && expanded && (
        <div className="border-t border-ink-line bg-ink-950 px-3 py-2">
          {loadingItems ? (
            <p className="text-xs text-slate-500 py-1">Loading items…</p>
          ) : sale ? (
            <>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Items Taken on Credit</p>
              <div className="space-y-1">
                {sale.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate flex-1 mr-2">
                      {item.product_name}
                      <span className="text-slate-500 ml-1">({item.unit_name})</span>
                    </span>
                    <span className="text-slate-400 shrink-0">
                      {item.qty} × {money(item.unit_price_c)}
                    </span>
                    <span className="text-slate-200 font-mono font-semibold ml-3 shrink-0">
                      {money(item.subtotal_c)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-1.5 border-t border-ink-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">Total on Credit</span>
                  <span className="text-xs font-black font-mono text-amber-400">{money(sale.total_c)}</span>
                </div>
                <button
                  onClick={() => void handlePrint()}
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-ink-800 transition-colors"
                  title="Print receipt"
                >
                  <Printer className="h-3 w-3" /> Print Receipt
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 py-1">No item data available.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Ledger Modal ────────────────────────────────────────────────────────────

function LedgerModal({
  customer,
  entries,
  onClose,
  onPay,
  onUpdateCustomer
}: {
  customer: Customer
  entries: CreditLedgerEntry[]
  onClose: () => void
  onPay: () => void
  onUpdateCustomer?: (updated: Customer) => void
}): React.JSX.Element {
  const [currentCustomer, setCurrentCustomer] = useState<Customer>(customer)
  const [currentEntries, setCurrentEntries] = useState<CreditLedgerEntry[]>(entries)
  const [deletingEntry, setDeletingEntry] = useState<CreditLedgerEntry | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [vipModalOpen, setVipModalOpen] = useState(false)
  const [fixBalanceOpen, setFixBalanceOpen] = useState(false)
  const [fixAmount, setFixAmount] = useState('')
  const [fixReason, setFixReason] = useState('')
  const [fixing, setFixing] = useState(false)

  useEffect(() => {
    setCurrentCustomer(customer)
  }, [customer])

  useEffect(() => {
    setCurrentEntries(entries)
  }, [entries])

  const sukiRating = useMemo(() => {
    if (currentEntries.length === 0) return { stars: 5, label: 'New Suki Customer' }
    const payments = currentEntries.filter((e) => e.amount_c < 0).length
    const credits = currentEntries.filter((e) => e.amount_c > 0).length
    if (currentCustomer.balance_c > currentCustomer.credit_limit_c && currentCustomer.credit_limit_c > 0) {
      return { stars: 2, label: 'Over Limit — High Risk' }
    }
    if (payments >= credits || currentCustomer.balance_c === 0) {
      return { stars: 5, label: 'Trusted Suki — Prompt Repayment' }
    }
    if (payments > 0) {
      return { stars: 4, label: 'Reliable Suki — Regular Payer' }
    }
    return { stars: 3, label: 'Pending Initial Payment' }
  }, [currentCustomer, currentEntries])

  const handleSyncBalance = async () => {
    setSyncing(true)
    try {
      const recalcFn = window.api?.customers?.recalculateBalance
      let updated: Customer | null = null

      if (typeof recalcFn === 'function') {
        try {
          updated = await recalcFn(currentCustomer.id)
        } catch {
          updated = null
        }
      }

      if (!updated) {
        // Resilient fallback: calculate running balance from chronological ledger entries
        const freshEntries = await window.api.customers.ledger(currentCustomer.id, { limit: 500 })
        const sorted = [...freshEntries].sort((a, b) => a.id - b.id)
        let runningBalance = 0
        for (const entry of sorted) {
          if (entry.entry_type === 'CREDIT_SALE' || entry.entry_type === 'ADJUSTMENT') {
            runningBalance += entry.amount_c
          } else {
            runningBalance = Math.max(0, runningBalance - entry.amount_c)
          }
        }
        const delta = runningBalance - currentCustomer.balance_c
        if (delta > 0) {
          await window.api.customers.adjust({
            customer_id: currentCustomer.id,
            amount_c: delta,
            notes: 'Ledger history balance re-sync',
            reason: 'SYNC'
          })
        } else if (delta < 0) {
          await window.api.customers.revoke({
            customer_id: currentCustomer.id,
            amount_c: Math.abs(delta),
            notes: 'Ledger history balance re-sync',
            reason: 'SYNC'
          })
        }
        updated = await window.api.customers.get(currentCustomer.id)
      }

      setCurrentCustomer(updated)
      const freshEntries = await window.api.customers.ledger(updated.id, { limit: 50 })
      setCurrentEntries(freshEntries)
      toastSuccess('Balance Recalculated', `${updated.full_name}'s balance synced to ${money(updated.balance_c)}`)
      onUpdateCustomer?.(updated)
    } catch (e) {
      toastError('Sync Failed', String((e as Error)?.message || e))
    } finally {
      setSyncing(false)
    }
  }

  const confirmDeleteEntry = async () => {
    if (!deletingEntry) return
    try {
      const deleteFn =
        window.api?.customers?.deleteLedgerEntry ||
        (window.api?.customers as unknown as Record<string, unknown>)?.['deleteledgerEntry']
      let resCustomer: Customer | null = null

      if (typeof deleteFn === 'function') {
        try {
          const res = await (deleteFn as (id: number) => Promise<{ ok: boolean; customer: Customer }>)(deletingEntry.id)
          if (res?.customer) {
            resCustomer = res.customer
          }
        } catch {
          // If native backend handler is not registered in running Electron process, fall through to offset
          resCustomer = null
        }
      }

      if (!resCustomer) {
        // Universal ledger offset fallback: works across all versions without requiring native backend IPC!
        // If entry reduced balance (PAYMENT, REVERSAL, REFUND) or amount_c < 0, offset by adjusting (+) back.
        // If entry increased balance (CREDIT_SALE, ADJUSTMENT) or amount_c > 0, offset by revoking (-) back.
        const isDeduction =
          ['PAYMENT', 'REVERSAL', 'REFUND'].includes(deletingEntry.entry_type) || deletingEntry.amount_c < 0
        const absAmount = Math.abs(deletingEntry.amount_c)
        if (isDeduction) {
          await window.api.customers.adjust({
            customer_id: deletingEntry.customer_id,
            amount_c: absAmount,
            notes: `Offset deleted entry #${deletingEntry.id} (${deletingEntry.entry_type})`,
            reason: 'CORRECTION'
          })
        } else {
          await window.api.customers.revoke({
            customer_id: deletingEntry.customer_id,
            amount_c: absAmount,
            notes: `Offset deleted entry #${deletingEntry.id} (${deletingEntry.entry_type})`,
            reason: 'CORRECTION'
          })
        }
        resCustomer = await window.api.customers.get(currentCustomer.id)
      }

      toastSuccess('Entry Removed', `Customer balance updated to ${money(resCustomer.balance_c)}`)
      setCurrentCustomer(resCustomer)
      const freshEntries = await window.api.customers.ledger(resCustomer.id, { limit: 50 })
      setCurrentEntries(freshEntries)
      setDeletingEntry(null)
      onUpdateCustomer?.(resCustomer)
    } catch (e) {
      toastError('Delete Failed', String((e as Error)?.message || e))
    }
  }

  const handleFixBalance = async () => {
    const rawVal = parseFloat(fixAmount)
    if (isNaN(rawVal) || rawVal < 0) {
      toastError('Invalid Amount', 'Please enter a valid balance in Pesos (e.g. 325.06 or 325065).')
      return
    }
    const targetC = Math.round(rawVal * 100)
    const delta = targetC - currentCustomer.balance_c
    setFixing(true)
    try {
      if (delta > 0) {
        await window.api.customers.adjust({
          customer_id: currentCustomer.id,
          amount_c: delta,
          notes: fixReason.trim() || 'Manual balance correction',
          reason: 'CORRECTION'
        })
      } else if (delta < 0) {
        await window.api.customers.revoke({
          customer_id: currentCustomer.id,
          amount_c: Math.abs(delta),
          notes: fixReason.trim() || 'Manual balance correction',
          reason: 'CORRECTION'
        })
      }
      const updated = await window.api.customers.get(currentCustomer.id)
      setCurrentCustomer(updated)
      const freshEntries = await window.api.customers.ledger(updated.id, { limit: 50 })
      setCurrentEntries(freshEntries)
      setFixBalanceOpen(false)
      setFixAmount('')
      setFixReason('')
      toastSuccess('Balance Updated', `${updated.full_name}'s balance set to ${money(updated.balance_c)}`)
      onUpdateCustomer?.(updated)
    } catch (e) {
      toastError('Update Failed', String((e as Error)?.message || e))
    } finally {
      setFixing(false)
    }
  }

  const copySmsReminder = async () => {
    try {
      const status = await window.api.license.getStatus()
      if (!status.isVip) {
        setVipModalOpen(true)
        return
      }
      const settings = await window.api.settings.get()
      const storeName = settings.store_name || 'Our Store'
      const amountStr = money(currentCustomer.balance_c)
      const msg = `Good day ${currentCustomer.full_name}, gentle reminder from ${storeName} regarding your outstanding credit balance of ${amountStr}. Thank you for your continued patronage!`
      await navigator.clipboard.writeText(msg)
      toastSuccess('Polite reminder copied to clipboard! Ready to paste into SMS or Messenger.')
    } catch (e) {
      toastError('Failed to format reminder', String(e))
    }
  }

  return (
    <>
      <Modal open onClose={onClose} title={currentCustomer.full_name} maxWidth="max-w-lg" footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => void copySmsReminder()}
            className="btn-ghost flex items-center gap-1.5 text-xs text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
            title="Generate polite collection SMS/Messenger reminder"
          >
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            <MessageSquare className="h-3.5 w-3.5" />
            <span>VIP SMS Reminder</span>
          </button>
          <button onClick={onPay} className="btn-primary flex items-center gap-2"><HandCoins className="h-4 w-4" /> Collect Payment</button>
        </div>
      }>
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="card p-2 text-center relative group">
            <p className="text-[10px] uppercase text-slate-500">Balance</p>
            <p className="text-sm font-black text-amber-400">{money(currentCustomer.balance_c)}</p>
            <div className="absolute top-1 right-1 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setFixAmount((currentCustomer.balance_c / 100).toFixed(2))
                  setFixBalanceOpen(true)
                }}
                title="Edit / Set exact balance directly"
                className="p-1 rounded-md text-slate-500 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => void handleSyncBalance()}
                disabled={syncing}
                title="Recalculate balance from all ledger entries"
                className="p-1 rounded-md text-slate-500 hover:text-brand-300 hover:bg-brand-500/10 transition-colors"
              >
                <RotateCcw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <div className="card p-2 text-center"><p className="text-[10px] uppercase text-slate-500">Limit</p><p className="text-sm font-black text-slate-200">{money(currentCustomer.credit_limit_c)}</p></div>
          <div className="card p-2 text-center"><p className="text-[10px] uppercase text-slate-500">Available</p><p className="text-sm font-black text-emerald-400">{money(Math.max(0, currentCustomer.credit_limit_c - currentCustomer.balance_c))}</p></div>
        </div>

        {/* VIP Suki Trust Scorecard */}
        <div className="mb-3 flex items-center justify-between p-2.5 rounded-xl bg-ink-950 border border-amber-500/20 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${i < sukiRating.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                />
              ))}
            </div>
            <span className="font-semibold text-slate-200">{sukiRating.label}</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider">
            Suki Score
          </span>
        </div>

        <div className="max-h-80 space-y-1 overflow-y-auto">
          {currentEntries.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No ledger activity.</p>}
          {currentEntries.map((e) => (
            <LedgerEntryRow key={e.id} entry={e} onDelete={(entry) => setDeletingEntry(entry)} />
          ))}
        </div>
      </Modal>

      {deletingEntry && (
        <Modal
          open
          onClose={() => setDeletingEntry(null)}
          title="Delete Ledger Entry"
          maxWidth="max-w-md"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setDeletingEntry(null)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteEntry()}
                className="btn-danger flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete & Recalculate</span>
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <div className="flex items-center gap-2 font-semibold text-rose-200">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>Delete this entry and recalculate balance?</span>
              </div>
              <p className="mt-1 text-slate-400">
                This will permanently remove the record and automatically recalculate {currentCustomer.full_name}'s total balance.
              </p>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-950 p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Entry Type:</span>
                <span className="font-semibold text-white capitalize">{deletingEntry.entry_type.replace(/_/g, ' ').toLowerCase()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Amount:</span>
                <span className={`font-mono font-bold ${deletingEntry.amount_c >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {deletingEntry.amount_c >= 0 ? '+' : ''}{money(deletingEntry.amount_c)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Date:</span>
                <span className="text-slate-300">{shortDateTime(deletingEntry.created_at)}</span>
              </div>
              {deletingEntry.notes && (
                <div className="flex justify-between text-slate-400">
                  <span>Notes:</span>
                  <span className="text-slate-300 break-words text-right max-w-[200px]">{deletingEntry.notes}</span>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {fixBalanceOpen && (
        <Modal
          open
          onClose={() => setFixBalanceOpen(false)}
          title={`Set Exact Balance — ${currentCustomer.full_name}`}
          maxWidth="max-w-md"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setFixBalanceOpen(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleFixBalance()}
                disabled={fixing}
                className="btn-primary flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Save Balance</span>
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="rounded-lg border border-ink-line bg-ink-950 p-3 text-center">
              <p className="text-xs text-slate-500">Current Outstanding Balance</p>
              <p className="text-xl font-black text-amber-400">{money(currentCustomer.balance_c)}</p>
            </div>
            <div>
              <label className="label">Target Balance (₱) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={fixAmount}
                onChange={(e) => setFixAmount(e.target.value)}
                placeholder="e.g. 325.06 or 325065"
                className="input w-full font-mono text-base font-bold text-amber-300"
                autoFocus
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Directly sets this customer's total outstanding balance. Any difference will be logged as an audit correction.
              </p>
            </div>
            <div>
              <label className="label">Reason / Reference (Optional)</label>
              <input
                type="text"
                value={fixReason}
                onChange={(e) => setFixReason(e.target.value)}
                placeholder="e.g. Verified customer credit balance"
                className="input w-full text-xs"
              />
            </div>
          </div>
        </Modal>
      )}

      <VipUpgradeModal open={vipModalOpen} onClose={() => setVipModalOpen(false)} />
    </>
  )
}

// ─── Credit Action Modal ─────────────────────────────────────────────────────

function CreditActionModal({ action, onClose, onDone }: { action: { type: 'PAY' | 'ADJUST' | 'OVERLIMIT'; customer: Customer }; onClose: () => void; onDone: () => void }): React.JSX.Element {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const amountC = Math.round((parseFloat(amount) || 0) * 100)

  const submit = async () => {
    if (action.type === 'ADJUST' ? amountC === 0 : amountC <= 0) { toastError('Enter a valid amount'); return }
    setSubmitting(true)
    try {
      if (action.type === 'PAY') {
        await window.api.customers.pay({ customer_id: action.customer.id, amount_c: amountC, method: 'CASH', notes })
        toastSuccess('Payment recorded')
      } else if (action.type === 'ADJUST') {
        await window.api.customers.adjust({ customer_id: action.customer.id, amount_c: amountC, notes, reason })
        toastSuccess('Balance adjusted')
      } else {
        await window.api.customers.approveOverlimit({ customer_id: action.customer.id, amount_c: amountC, notes, approved_by: 'admin', reason })
        toastSuccess('Overlimit approved')
      }
      onDone()
    } catch (e) {
      toastError('Operation failed', String((e as Error)?.message || e))
    } finally {
      setSubmitting(false)
    }
  }

  const isPay = action.type === 'PAY'
  return (
    <Modal open onClose={onClose} title={`${isPay ? 'Collect Payment' : action.type === 'ADJUST' ? 'Adjust Balance' : 'Approve Overlimit'} — ${action.customer.full_name}`} maxWidth="max-w-md" footer={
      <>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={() => void submit()} disabled={submitting} className="btn-primary flex items-center gap-2"><Check className="h-4 w-4" /> Confirm</button>
      </>
    }>
      <div className="mb-3 rounded-lg border border-ink-line bg-ink-950 p-3 text-center">
        <p className="text-xs text-slate-500">Current Balance</p>
        <p className="text-xl font-black text-amber-400">{money(action.customer.balance_c)}</p>
      </div>
      <div className="space-y-3">
        <div><label className="label">Amount (₱) {isPay ? '' : action.type === 'ADJUST' ? '(positive = add debt, negative = deduct)' : ''}</label><input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input w-full" autoFocus /></div>
        {action.type === 'ADJUST' && <div><label className="label">Reason *</label><input value={reason} onChange={(e) => setReason(e.target.value)} className="input w-full" /></div>}
        <div><label className="label">Notes</label><input value={notes} onChange={(e) => setNotes(e.target.value)} className="input w-full" /></div>
      </div>
    </Modal>
  )
}
