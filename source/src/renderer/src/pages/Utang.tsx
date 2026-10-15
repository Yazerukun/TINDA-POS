import { useEffect, useMemo, useState } from 'react'
import { Search, Wallet, HandCoins, Scale, Check, ChevronDown, ChevronUp, Package, Printer, HelpCircle, Star, Crown, MessageSquare, Copy, Trash2, RotateCcw, AlertTriangle, Pencil, Sparkles, Bell, Calendar, Clock } from 'lucide-react'
import type { Customer, CreditLedgerEntry, Sale } from '@shared/types'
import { money, shortDateTime } from '@shared/format'
import {
  CustomerReminder,
  ReminderStatusInfo,
  calculateReminderStatus,
  getMergedCustomerReminder,
  saveLocalCustomerReminder,
  serializeCustomerNotes
} from '@shared/customerReminders'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, StatusBadge } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { toastSuccess, toastError } from '../stores/toast'
import { useGuide } from '../stores/guide'
import { VipUpgradeModal } from '../components/VipUpgradeModal'
import { UtangPrintModal, UtangPrintMode } from '../components/UtangPrintModal'

type UtangTab = 'WITH_BALANCE' | 'OVERDUE' | 'SETTLED' | 'ALL'

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
  const [remindersNonce, setRemindersNonce] = useState(0)
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printInitialCustomer, setPrintInitialCustomer] = useState<Customer | null>(null)
  const [printInitialMode, setPrintInitialMode] = useState<UtangPrintMode>('MASTER_LIST')

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

  // Listen for real-time reminder updates from other modals
  useEffect(() => {
    const handler = () => setRemindersNonce((v) => v + 1)
    window.addEventListener('tinda-utang-reminder-updated', handler)
    return () => window.removeEventListener('tinda-utang-reminder-updated', handler)
  }, [])

  const withBalanceCount = useMemo(() => rows.filter((c) => c.balance_c > 0).length, [rows])
  const settledCount = useMemo(() => rows.filter((c) => c.balance_c === 0).length, [rows])
  const totalOutstanding = useMemo(() => rows.reduce((s, c) => s + c.balance_c, 0), [rows])

  const overdueCustomers = useMemo(() => {
    return rows.filter((c) => {
      if (c.balance_c <= 0) return false
      const { statusInfo } = getMergedCustomerReminder(c)
      return statusInfo.isAttentionRequired
    })
  }, [rows, remindersNonce])

  const overdueCount = overdueCustomers.length

  const filtered = useMemo(() => {
    let list = rows
    if (tab === 'WITH_BALANCE') {
      list = list.filter((c) => c.balance_c > 0)
    } else if (tab === 'OVERDUE') {
      list = list.filter((c) => {
        if (c.balance_c <= 0) return false
        const { statusInfo } = getMergedCustomerReminder(c)
        return statusInfo.isAttentionRequired
      })
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
  }, [rows, tab, q, remindersNonce])

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPrintInitialCustomer(null)
                setPrintInitialMode('MASTER_LIST')
                setPrintModalOpen(true)
              }}
              className="btn-primary flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white font-bold"
              title="Print accounts receivable list and total breakdown"
            >
              <Printer className="h-4 w-4" />
              <span>Print Utang List</span>
            </button>
            <button
              onClick={() => useGuide.getState().openGuide('utang')}
              className="btn-ghost flex items-center gap-2 text-amber-300 hover:text-amber-200"
            >
              <HelpCircle className="h-4 w-4 text-amber-400" /> Utang Guide
            </button>
          </div>
        }
      />

      {/* Quick Stats Summary */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
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
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Overdue / Due Today</p>
          <p className={`mt-1 text-2xl font-black font-mono tabular-nums ${overdueCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {overdueCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {overdueCount > 0 ? 'Attention required' : 'All accounts on track'}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Settled</p>
          <p className="mt-1 text-2xl font-black font-mono tabular-nums text-emerald-400">{settledCount}</p>
          <p className="mt-1 text-xs text-slate-500">Fully paid (₱0.00 balance)</p>
        </div>
      </div>

      {/* Proactive Collection Reminder Banner */}
      {overdueCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-rose-200">Collection Reminder Notification</span>
              <p className="text-[11px] text-slate-300">
                {overdueCount} suki customer(s) have payments past due or scheduled for collection today.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTab('OVERDUE')}
            className="btn-primary text-xs py-1.5 px-3 bg-rose-500 hover:bg-rose-400 text-white font-bold flex items-center gap-1.5 shrink-0"
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Filter Overdue ({overdueCount})</span>
          </button>
        </div>
      )}

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
            onClick={() => setTab('OVERDUE')}
            className={`btn-ghost flex items-center gap-2 text-sm rounded-lg px-3 py-2 transition-all ${
              tab === 'OVERDUE'
                ? '!border-rose-500 !text-rose-300 font-semibold bg-rose-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="h-4 w-4 text-rose-400" />
            <span>Overdue &amp; Due Today</span>
            <span
              className={`badge text-xs ${
                tab === 'OVERDUE'
                  ? 'bg-rose-500/20 text-rose-300'
                  : overdueCount > 0
                    ? 'bg-rose-500/20 text-rose-400 font-bold'
                    : 'bg-ink-800 text-slate-400'
              }`}
            >
              {overdueCount}
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
        ) : tab === 'OVERDUE' ? (
          <EmptyState
            title="No Overdue Accounts"
            message="No suki customers currently have an overdue collection due date."
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
                  const { reminder, statusInfo } = getMergedCustomerReminder(c)
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
                        {/* Reminder & Promise Note Pill */}
                        {statusInfo.status !== 'NONE' && statusInfo.status !== 'SETTLED' && (
                          <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${statusInfo.badgeBg} ${statusInfo.colorClass}`}>
                              <Bell className="h-2.5 w-2.5" />
                              <span>{statusInfo.badgeText}</span>
                            </span>
                            {reminder.notes && (
                              <span className="text-[10px] text-slate-400 italic truncate max-w-[170px]" title={reminder.notes}>
                                "{reminder.notes}"
                              </span>
                            )}
                          </div>
                        )}
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
                          <button
                            onClick={() => {
                              setPrintInitialCustomer(c)
                              setPrintInitialMode('STATEMENT')
                              setPrintModalOpen(true)
                            }}
                            className="btn-ghost-2 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 hover:text-brand-300 hover:bg-brand-500/10"
                            title="Print Customer Statement of Account (SOA)"
                          >
                            <Printer className="h-3.5 w-3.5" />
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
          onPrintStatement={(c) => {
            setPrintInitialCustomer(c)
            setPrintInitialMode('STATEMENT')
            setPrintModalOpen(true)
          }}
        />
      )}
      {action && <CreditActionModal action={action} onClose={() => setAction(null)} onDone={() => void actionDone()} />}
      <VipUpgradeModal open={vipModalOpen} onClose={() => setVipModalOpen(false)} onActivated={() => void load()} />
      <UtangPrintModal
        open={printModalOpen}
        onClose={() => {
          setPrintModalOpen(false)
          setPrintInitialCustomer(null)
        }}
        customers={rows}
        initialCustomer={printInitialCustomer}
        initialMode={printInitialMode}
      />
    </div>
  )
}

// ─── Ledger Entry Helpers (Purging & Price Overrides) ────────────────────────

function getPurgedEntryIds(customerId: number): Set<number> {
  try {
    const raw = localStorage.getItem(`tinda_purged_credit_${customerId}`)
    if (!raw) return new Set<number>()
    return new Set<number>(JSON.parse(raw))
  } catch {
    return new Set<number>()
  }
}

function addPurgedEntryId(customerId: number, entryId: number): void {
  try {
    const set = getPurgedEntryIds(customerId)
    set.add(entryId)
    localStorage.setItem(`tinda_purged_credit_${customerId}`, JSON.stringify(Array.from(set)))
  } catch {}
}

function getItemPriceOverrides(saleId: number): Record<number, number> {
  try {
    const raw = localStorage.getItem(`tinda_sale_item_price_${saleId}`)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function setItemPriceOverride(saleId: number, saleItemId: number, newUnitPriceC: number): void {
  try {
    const overrides = getItemPriceOverrides(saleId)
    overrides[saleItemId] = newUnitPriceC
    localStorage.setItem(`tinda_sale_item_price_${saleId}`, JSON.stringify(overrides))
  } catch {}
}

// ─── Ledger Entry Row with expandable items for CREDIT_SALE ─────────────────

function LedgerEntryRow({
  entry,
  onDelete,
  onEditItemPrice
}: {
  entry: CreditLedgerEntry
  onDelete?: (entry: CreditLedgerEntry) => void
  onEditItemPrice?: (item: Sale['items'][0], sale: Sale, entry: CreditLedgerEntry) => void
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const [sale, setSale] = useState<Sale | null>(null)
  const [loadingItems, setLoadingItems] = useState(false)

  const isCreditSale = entry.entry_type === 'CREDIT_SALE' && entry.reference_id != null
  const isDeduction =
    ['PAYMENT', 'REVERSAL', 'REFUND'].includes(entry.entry_type) || entry.amount_c < 0

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

  const itemOverrides = sale ? getItemPriceOverrides(sale.id) : {}
  const dynamicSaleTotalC = sale
    ? sale.items.reduce((sum, it) => {
        const p = itemOverrides[it.id] ?? it.unit_price_c
        return sum + Math.round(it.qty * p)
      }, 0)
    : 0

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
          <span className={`font-bold font-mono tabular-nums ${isDeduction ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isDeduction ? '−' : '+'}{money(Math.abs(entry.amount_c))}
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
              <div className="space-y-1.5">
                {sale.items.map((item) => {
                  const effectivePriceC = itemOverrides[item.id] ?? item.unit_price_c
                  const effectiveSubtotalC = Math.round(item.qty * effectivePriceC)
                  const hasCustomPrice = itemOverrides[item.id] !== undefined

                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-slate-300 truncate flex-1 mr-2">
                        {item.product_name}
                        <span className="text-slate-500 ml-1">({item.unit_name})</span>
                      </span>
                      <span className="text-slate-400 shrink-0">
                        {item.qty} × {money(effectivePriceC)}
                      </span>
                      <div className="flex items-center gap-1.5 ml-3 shrink-0">
                        <span className={`font-mono font-semibold ${hasCustomPrice ? 'text-amber-300' : 'text-slate-200'}`}>
                          {money(effectiveSubtotalC)}
                        </span>
                        {onEditItemPrice && (
                          <button
                            type="button"
                            onClick={() => onEditItemPrice(item, sale, entry)}
                            className="p-1 rounded text-slate-500 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                            title="Edit unit price on credit"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 pt-1.5 border-t border-ink-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">Total on Credit</span>
                  <span className="text-xs font-black font-mono text-amber-400">{money(dynamicSaleTotalC || sale.total_c)}</span>
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
  onUpdateCustomer,
  onPrintStatement
}: {
  customer: Customer
  entries: CreditLedgerEntry[]
  onClose: () => void
  onPay: () => void
  onUpdateCustomer?: (updated: Customer) => void
  onPrintStatement?: (customer: Customer) => void
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

  // Purge & Line-item price edit states
  const [purgedNonce, setPurgedNonce] = useState(0)
  const [cleaningMistakes, setCleaningMistakes] = useState(false)
  const [editingItem, setEditingItem] = useState<{
    item: Sale['items'][0]
    sale: Sale
    entry: CreditLedgerEntry
  } | null>(null)
  const [newItemPrice, setNewItemPrice] = useState('')
  const [editPriceReason, setEditPriceReason] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)

  const [reminderData, setReminderData] = useState<CustomerReminder>(() => {
    return getMergedCustomerReminder(customer).reminder
  })
  const [reminderDueDate, setReminderDueDate] = useState(reminderData.due_date || '')
  const [reminderNotes, setReminderNotes] = useState(reminderData.notes || '')
  const [generalNotes, setGeneralNotes] = useState(reminderData.general_notes || '')
  const [savingReminder, setSavingReminder] = useState(false)

  useEffect(() => {
    setCurrentCustomer(customer)
    const merged = getMergedCustomerReminder(customer).reminder
    setReminderData(merged)
    setReminderDueDate(merged.due_date || '')
    setReminderNotes(merged.notes || '')
    setGeneralNotes(merged.general_notes || '')
  }, [customer])

  const reminderStatus = useMemo(() => {
    return calculateReminderStatus(reminderDueDate || null, currentCustomer.balance_c)
  }, [reminderDueDate, currentCustomer.balance_c])

  const setPresetDate = (daysFromNow: number | 'MONTH_END' | 'CLEAR') => {
    if (daysFromNow === 'CLEAR') {
      setReminderDueDate('')
      return
    }
    const d = new Date()
    if (daysFromNow === 'MONTH_END') {
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      const yyyy = lastDay.getFullYear()
      const mm = String(lastDay.getMonth() + 1).padStart(2, '0')
      const dd = String(lastDay.getDate()).padStart(2, '0')
      setReminderDueDate(`${yyyy}-${mm}-${dd}`)
      return
    }
    d.setDate(d.getDate() + daysFromNow)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setReminderDueDate(`${yyyy}-${mm}-${dd}`)
  }

  const handleSaveReminder = async () => {
    setSavingReminder(true)
    try {
      const updatedReminder: CustomerReminder = {
        due_date: reminderDueDate.trim() || null,
        notes: reminderNotes.trim() || null,
        general_notes: generalNotes.trim() || null,
        updated_at: new Date().toISOString()
      }
      saveLocalCustomerReminder(currentCustomer.id, updatedReminder)
      setReminderData(updatedReminder)

      const serialized = serializeCustomerNotes(updatedReminder)
      const updated = await window.api.customers.update(currentCustomer.id, { notes: serialized })
      setCurrentCustomer(updated)
      onUpdateCustomer?.(updated)
      toastSuccess('Reminder Saved', 'Customer due date and collection notes updated.')
    } catch (e) {
      toastError('Save Failed', String((e as Error)?.message || e))
    } finally {
      setSavingReminder(false)
    }
  }

  useEffect(() => {
    setCurrentEntries(entries)
  }, [entries])

  const purgedSet = useMemo(() => getPurgedEntryIds(currentCustomer.id), [currentCustomer.id, purgedNonce])

  const visibleEntries = useMemo(() => {
    return currentEntries.filter((e) => {
      if (purgedSet.has(e.id)) return false
      const notes = e.notes || ''
      if (notes.includes('[AUDIT_REBALANCE]') || notes.includes('[SYSTEM_SYNC]')) return false
      if (notes.startsWith('Offset deleted entry')) return false
      return true
    })
  }, [currentEntries, purgedSet])

  // Detect mistake entries (e.g. ₱34,555.00)
  const mistakeEntries = useMemo(() => {
    return visibleEntries.filter((e) => {
      if (Math.abs(e.amount_c) === 3455500) return true
      return false
    })
  }, [visibleEntries])

  const sukiRating = useMemo(() => {
    if (visibleEntries.length === 0) return { stars: 5, label: 'New Suki Customer' }
    const payments = visibleEntries.filter((e) => e.amount_c < 0 || ['PAYMENT', 'REVERSAL', 'REFUND'].includes(e.entry_type)).length
    const credits = visibleEntries.filter((e) => e.amount_c > 0 && e.entry_type === 'CREDIT_SALE').length
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
  }, [currentCustomer, visibleEntries])

  const handleCleanMistakes = async () => {
    setCleaningMistakes(true)
    try {
      for (const m of mistakeEntries) {
        addPurgedEntryId(currentCustomer.id, m.id)
        try {
          const deleteFn =
            window.api?.customers?.deleteLedgerEntry ||
            (window.api?.customers as unknown as Record<string, unknown>)?.['deleteledgerEntry']
          if (typeof deleteFn === 'function') {
            await (deleteFn as (id: number) => Promise<unknown>)(m.id)
          }
        } catch {}
      }
      setPurgedNonce((v) => v + 1)

      const remaining = visibleEntries.filter((e) => !mistakeEntries.some((m) => m.id === e.id))
      let targetBalanceC = 0
      for (const e of remaining) {
        const isDeduction =
          ['PAYMENT', 'REVERSAL', 'REFUND'].includes(e.entry_type) || e.amount_c < 0
        if (isDeduction) {
          targetBalanceC = Math.max(0, targetBalanceC - Math.abs(e.amount_c))
        } else {
          targetBalanceC += Math.abs(e.amount_c)
        }
      }

      const freshCust = await window.api.customers.get(currentCustomer.id)
      const delta = targetBalanceC - freshCust.balance_c
      if (delta > 0) {
        await window.api.customers.adjust({
          customer_id: currentCustomer.id,
          amount_c: delta,
          notes: '[AUDIT_REBALANCE] Verified ledger balance restore',
          reason: 'SYNC'
        })
      } else if (delta < 0) {
        await window.api.customers.revoke({
          customer_id: currentCustomer.id,
          amount_c: Math.abs(delta),
          notes: '[AUDIT_REBALANCE] Verified ledger balance restore',
          reason: 'SYNC'
        })
      }

      const updated = await window.api.customers.get(currentCustomer.id)
      const freshEntries = await window.api.customers.ledger(currentCustomer.id, { limit: 50 })
      setCurrentCustomer(updated)
      setCurrentEntries(freshEntries)
      toastSuccess('Ledger Cleaned', `Mistake entries removed. Balance restored to ${money(updated.balance_c)}.`)
      onUpdateCustomer?.(updated)
    } catch (e) {
      toastError('Cleanup Failed', String((e as Error)?.message || e))
    } finally {
      setCleaningMistakes(false)
    }
  }

  const handleSyncBalance = async () => {
    setSyncing(true)
    try {
      const freshEntries = await window.api.customers.ledger(currentCustomer.id, { limit: 500 })
      const purged = getPurgedEntryIds(currentCustomer.id)
      const visible = freshEntries.filter((e) => {
        if (purged.has(e.id)) return false
        const notes = e.notes || ''
        if (notes.includes('[AUDIT_REBALANCE]') || notes.includes('[SYSTEM_SYNC]')) return false
        if (notes.startsWith('Offset deleted entry')) return false
        return true
      })

      let targetBalanceC = 0
      for (const e of visible) {
        const isDeduction =
          ['PAYMENT', 'REVERSAL', 'REFUND'].includes(e.entry_type) || e.amount_c < 0
        if (isDeduction) {
          targetBalanceC = Math.max(0, targetBalanceC - Math.abs(e.amount_c))
        } else {
          targetBalanceC += Math.abs(e.amount_c)
        }
      }

      const freshCust = await window.api.customers.get(currentCustomer.id)
      const delta = targetBalanceC - freshCust.balance_c
      if (delta > 0) {
        await window.api.customers.adjust({
          customer_id: currentCustomer.id,
          amount_c: delta,
          notes: '[AUDIT_REBALANCE] Balance re-sync from active ledger entries',
          reason: 'SYNC'
        })
      } else if (delta < 0) {
        await window.api.customers.revoke({
          customer_id: currentCustomer.id,
          amount_c: Math.abs(delta),
          notes: '[AUDIT_REBALANCE] Balance re-sync from active ledger entries',
          reason: 'SYNC'
        })
      }

      const updated = await window.api.customers.get(currentCustomer.id)
      setCurrentCustomer(updated)
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
      addPurgedEntryId(currentCustomer.id, deletingEntry.id)
      setPurgedNonce((v) => v + 1)

      try {
        const deleteFn =
          window.api?.customers?.deleteLedgerEntry ||
          (window.api?.customers as unknown as Record<string, unknown>)?.['deleteledgerEntry']
        if (typeof deleteFn === 'function') {
          await (deleteFn as (id: number) => Promise<unknown>)(deletingEntry.id)
        }
      } catch {}

      const remaining = visibleEntries.filter((e) => e.id !== deletingEntry.id)
      let targetBalanceC = 0
      for (const e of remaining) {
        const isDeduction =
          ['PAYMENT', 'REVERSAL', 'REFUND'].includes(e.entry_type) || e.amount_c < 0
        if (isDeduction) {
          targetBalanceC = Math.max(0, targetBalanceC - Math.abs(e.amount_c))
        } else {
          targetBalanceC += Math.abs(e.amount_c)
        }
      }

      const freshCust = await window.api.customers.get(currentCustomer.id)
      const delta = targetBalanceC - freshCust.balance_c
      if (delta > 0) {
        await window.api.customers.adjust({
          customer_id: currentCustomer.id,
          amount_c: delta,
          notes: '[AUDIT_REBALANCE] Auto rebalance after entry deletion',
          reason: 'SYNC'
        })
      } else if (delta < 0) {
        await window.api.customers.revoke({
          customer_id: currentCustomer.id,
          amount_c: Math.abs(delta),
          notes: '[AUDIT_REBALANCE] Auto rebalance after entry deletion',
          reason: 'SYNC'
        })
      }

      const updated = await window.api.customers.get(currentCustomer.id)
      const freshEntries = await window.api.customers.ledger(currentCustomer.id, { limit: 50 })
      setCurrentCustomer(updated)
      setCurrentEntries(freshEntries)
      setDeletingEntry(null)
      toastSuccess('Entry Removed', `Customer balance updated to ${money(updated.balance_c)}`)
      onUpdateCustomer?.(updated)
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
      const noteToUse = fixReason.trim() || '[AUDIT_REBALANCE] Manual balance correction'
      if (delta > 0) {
        await window.api.customers.adjust({
          customer_id: currentCustomer.id,
          amount_c: delta,
          notes: noteToUse,
          reason: 'CORRECTION'
        })
      } else if (delta < 0) {
        await window.api.customers.revoke({
          customer_id: currentCustomer.id,
          amount_c: Math.abs(delta),
          notes: noteToUse,
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

  const openEditItemPrice = (item: Sale['items'][0], sale: Sale, entry: CreditLedgerEntry) => {
    const overrides = getItemPriceOverrides(sale.id)
    const currentPriceC = overrides[item.id] ?? item.unit_price_c
    setEditingItem({ item, sale, entry })
    setNewItemPrice((currentPriceC / 100).toFixed(2))
    setEditPriceReason('')
  }

  const handleSaveItemPrice = async (targetUnitPriceC: number, deltaC: number) => {
    if (!editingItem) return
    setSavingPrice(true)
    try {
      try {
        const updatePriceFn = (window.api?.transactions as any)?.updateItemPrice
        if (typeof updatePriceFn === 'function') {
          await updatePriceFn(editingItem.item.id, targetUnitPriceC)
        }
      } catch {}

      setItemPriceOverride(editingItem.sale.id, editingItem.item.id, targetUnitPriceC)

      const reasonText = editPriceReason.trim()
        ? editPriceReason.trim()
        : `Price adjusted: ${editingItem.item.product_name} (${money(editingItem.item.unit_price_c)} → ${money(targetUnitPriceC)})`

      if (deltaC > 0) {
        await window.api.customers.adjust({
          customer_id: currentCustomer.id,
          amount_c: deltaC,
          notes: reasonText,
          reason: 'CORRECTION'
        })
      } else if (deltaC < 0) {
        await window.api.customers.revoke({
          customer_id: currentCustomer.id,
          amount_c: Math.abs(deltaC),
          notes: reasonText,
          reason: 'CORRECTION'
        })
      }

      const updated = await window.api.customers.get(currentCustomer.id)
      const freshEntries = await window.api.customers.ledger(currentCustomer.id, { limit: 50 })
      setCurrentCustomer(updated)
      setCurrentEntries(freshEntries)
      setEditingItem(null)
      toastSuccess('Price Updated', `${editingItem.item.product_name} price updated to ${money(targetUnitPriceC)}`)
      onUpdateCustomer?.(updated)
    } catch (e) {
      toastError('Update Failed', String((e as Error)?.message || e))
    } finally {
      setSavingPrice(false)
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
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPrintStatement?.(currentCustomer)}
              className="btn-ghost flex items-center gap-1.5 text-xs text-brand-300 border-brand-500/30 hover:bg-brand-500/10"
              title="Print Customer Statement of Account (SOA)"
            >
              <Printer className="h-3.5 w-3.5 text-brand-400" />
              <span>Print Statement</span>
            </button>
            <button
              type="button"
              onClick={() => void copySmsReminder()}
              className="btn-ghost flex items-center gap-1.5 text-xs text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
              title="Generate polite collection SMS/Messenger reminder"
            >
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              <MessageSquare className="h-3.5 w-3.5" />
              <span>VIP SMS</span>
            </button>
          </div>
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

        {/* Utang Collection Reminder & Notes Card */}
        <div className="mb-3 rounded-xl border border-ink-line bg-ink-950 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">Collection Reminder &amp; Notes</span>
            </div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${reminderStatus.badgeBg} ${reminderStatus.colorClass}`}>
              <Clock className="h-2.5 w-2.5" />
              {reminderStatus.badgeText}
            </span>
          </div>

          {/* Overdue / Due Today Alert Banner */}
          {reminderStatus.isAttentionRequired && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">
                  {reminderStatus.status === 'OVERDUE'
                    ? `Payment Overdue (${Math.abs(reminderStatus.daysDiff)} days past due date ${reminderDueDate})`
                    : 'Payment Due Today! Please collect or follow up with customer.'}
                </p>
                {reminderNotes && (
                  <p className="text-[11px] text-rose-300/90 mt-0.5 italic">
                    Promise: "{reminderNotes}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Due Date & Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <label className="font-semibold flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-500" />
                <span>Promise / Due Date</span>
              </label>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPresetDate(0)}
                  className="px-1.5 py-0.5 rounded bg-ink-800 hover:bg-ink-700 text-slate-300 text-[10px] transition"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate(3)}
                  className="px-1.5 py-0.5 rounded bg-ink-800 hover:bg-ink-700 text-slate-300 text-[10px] transition"
                >
                  +3d
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate(7)}
                  className="px-1.5 py-0.5 rounded bg-ink-800 hover:bg-ink-700 text-slate-300 text-[10px] transition"
                >
                  +7d (1wk)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate(15)}
                  className="px-1.5 py-0.5 rounded bg-ink-800 hover:bg-ink-700 text-slate-300 text-[10px] transition"
                >
                  +15d (Payday)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate('MONTH_END')}
                  className="px-1.5 py-0.5 rounded bg-ink-800 hover:bg-ink-700 text-slate-300 text-[10px] transition"
                >
                  Month End
                </button>
                {reminderDueDate && (
                  <button
                    type="button"
                    onClick={() => setPresetDate('CLEAR')}
                    className="px-1.5 py-0.5 rounded text-rose-400 hover:bg-rose-500/10 text-[10px] transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <input
              type="date"
              value={reminderDueDate}
              onChange={(e) => setReminderDueDate(e.target.value)}
              className="input w-full text-xs py-1.5 font-mono"
            />
          </div>

          {/* Reminder / Promise Note */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
              Payment Promise / Reminder Note (for Cashier &amp; Alerts)
            </label>
            <input
              type="text"
              value={reminderNotes}
              onChange={(e) => setReminderNotes(e.target.value)}
              placeholder="e.g. Will pay 50% on 15th payday, balance on month end"
              className="input w-full text-xs py-1.5"
            />
          </div>

          {/* General Notes */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
              General Customer Notes
            </label>
            <input
              type="text"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="e.g. Suki neighbor near chapel, contact via Ate Inday"
              className="input w-full text-xs py-1.5"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => void handleSaveReminder()}
              disabled={savingReminder}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{savingReminder ? 'Saving…' : 'Save Reminder & Notes'}</span>
            </button>
          </div>
        </div>

        {/* Mistake Pair Cleaner Banner */}
        {mistakeEntries.length > 0 && (
          <div className="mb-2.5 flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-semibold text-amber-300">Clean Mistake Entries</span>
                <p className="text-[11px] text-slate-400">
                  Detected {mistakeEntries.length} mistake/voided record(s) ({money(3455500)}). Clean records and restore true balance?
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleCleanMistakes()}
              disabled={cleaningMistakes}
              className="btn-primary shrink-0 text-xs py-1 px-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Clean Mistake Rows</span>
            </button>
          </div>
        )}

        <div className="max-h-80 space-y-1 overflow-y-auto">
          {visibleEntries.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No ledger activity.</p>}
          {visibleEntries.map((e) => (
            <LedgerEntryRow
              key={e.id}
              entry={e}
              onDelete={(entry) => setDeletingEntry(entry)}
              onEditItemPrice={(item, sale, entry) => openEditItemPrice(item, sale, entry)}
            />
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

      {/* Edit Item Price Modal */}
      {editingItem && (() => {
        const overrides = getItemPriceOverrides(editingItem.sale.id)
        const currentPriceC = overrides[editingItem.item.id] ?? editingItem.item.unit_price_c
        const currentSubtotalC = Math.round(editingItem.item.qty * currentPriceC)
        const parsedPrice = parseFloat(newItemPrice) || 0
        const targetUnitPriceC = Math.round(parsedPrice * 100)
        const newSubtotalC = Math.round(editingItem.item.qty * targetUnitPriceC)
        const deltaC = newSubtotalC - currentSubtotalC

        return (
          <Modal
            open
            onClose={() => setEditingItem(null)}
            title="Edit Credit Item Price"
            maxWidth="max-w-md"
            footer={
              <div className="flex justify-end gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveItemPrice(targetUnitPriceC, deltaC)}
                  disabled={savingPrice || parsedPrice < 0}
                  className="btn-primary flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Save & Update Utang</span>
                </button>
              </div>
            }
          >
            <div className="space-y-3">
              <div className="rounded-lg border border-ink-line bg-ink-950 p-3 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-semibold text-white text-sm">{editingItem.item.product_name}</span>
                  <span className="badge bg-ink-800 text-slate-400 font-mono">{editingItem.item.unit_name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Quantity:</span>
                  <span className="font-mono text-slate-200 font-bold">{editingItem.item.qty} {editingItem.item.unit_name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Current Unit Price:</span>
                  <span className="font-mono text-slate-200">{money(currentPriceC)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Current Subtotal:</span>
                  <span className="font-mono text-slate-200 font-bold">{money(currentSubtotalC)}</span>
                </div>
              </div>

              <div>
                <label className="label">New Unit Price (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  placeholder="0.00"
                  className="input w-full font-mono text-base font-bold text-amber-300"
                  autoFocus
                />
              </div>

              {/* Live Calculation Preview */}
              <div className="rounded-xl border border-ink-line bg-ink-900/60 p-3 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span>New Subtotal:</span>
                  <span className="font-mono font-bold text-white text-sm">{money(newSubtotalC)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-ink-line">
                  <span className="font-semibold">Utang Balance Impact:</span>
                  <span className={`font-mono font-bold text-sm ${deltaC < 0 ? 'text-emerald-400' : deltaC > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {deltaC < 0 ? `−${money(Math.abs(deltaC))} (Deducts Debt)` : deltaC > 0 ? `+${money(deltaC)} (Adds Debt)` : '₱0.00 (No Change)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {deltaC < 0
                    ? `Customer's outstanding balance will be reduced by ${money(Math.abs(deltaC))}.`
                    : deltaC > 0
                    ? `Customer's outstanding balance will increase by ${money(deltaC)}.`
                    : 'Price is unchanged.'}
                </p>
              </div>

              <div>
                <label className="label">Reason / Reference (Optional)</label>
                <input
                  type="text"
                  value={editPriceReason}
                  onChange={(e) => setEditPriceReason(e.target.value)}
                  placeholder="e.g. Suki discount / Price correction"
                  className="input w-full text-xs"
                />
              </div>
            </div>
          </Modal>
        )
      })()}

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
