import { Fragment, useEffect, useState, useMemo, useCallback } from 'react'
import {
  Search,
  Eye,
  RotateCcw,
  Ban,
  Trash2,
  ListOrdered,
  ReceiptText,
  Printer,
  ChevronDown,
  ChevronUp,
  Zap,
  Smartphone,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react'
import type { Sale, EwalletTransactionRecord } from '@shared/types'
import { money, shortDateTime } from '@shared/format'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, StatusBadge } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { ReceiptPaper } from '../components/ReceiptPaper'
import { toastSuccess, toastError } from '../stores/toast'
import type { BillRecord } from './EwalletAudit'

export interface EwalletBillLedgerItem {
  key: string
  kind: 'EWALLET' | 'BILL'
  date: string
  channel: string
  type: 'CASH_IN' | 'CASH_OUT' | 'BILLS'
  amount_c: number
  fee_c: number
  total_c: number
  fee_collected_via: 'CASH' | 'WALLET'
  reference_no: string
  customer_name: string
  customer_phone: string
  biller?: string
  account_no?: string
  notes?: string
  rawTx?: EwalletTransactionRecord
  rawBill?: BillRecord
}

export function Transactions(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'pos' | 'ewallet'>('pos')

  // POS Sales State
  const [rows, setRows] = useState<Sale[]>([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<Sale | null>(null)
  const [refund, setRefund] = useState<Sale | null>(null)
  const [voider, setVoider] = useState<Sale | null>(null)
  const [deleter, setDeleter] = useState<Sale | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // E-Wallet & Bills Center State
  const [ewalletTxs, setEwalletTxs] = useState<EwalletTransactionRecord[]>([])
  const [billRecords, setBillRecords] = useState<BillRecord[]>([])
  const [loadingEwallet, setLoadingEwallet] = useState(false)
  const [ewalletSearch, setEwalletSearch] = useState('')
  const [ewalletFilterChannel, setEwalletFilterChannel] = useState<string>('ALL')
  const [ewalletFilterType, setEwalletFilterType] = useState<string>('ALL')
  const [ewalletFrom, setEwalletFrom] = useState('')
  const [ewalletTo, setEwalletTo] = useState('')
  const [ewalletToDelete, setEwalletToDelete] = useState<EwalletBillLedgerItem | null>(null)
  const [isDeletingEwallet, setIsDeletingEwallet] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await window.api.transactions.list({
        search: q || undefined,
        status: status || undefined,
        from: from ? `${from} 00:00:00` : undefined,
        to: to ? `${to} 23:59:59` : undefined,
        limit: 200
      })
      setRows(res.rows)
    } catch (e) {
      toastError('Failed to load transactions', String((e as Error)?.message || e))
    } finally {
      setLoading(false)
    }
  }

  const loadEwalletAndBills = useCallback(async () => {
    setLoadingEwallet(true)
    try {
      if (window.api?.ewallet?.listTransactions) {
        const txList = await window.api.ewallet.listTransactions({ limit: 500 })
        setEwalletTxs(txList || [])
      }
    } catch (e) {
      console.warn('Could not load ewallet txs:', e)
    }
    try {
      const savedBills = localStorage.getItem('tinda_bills_load_records')
      if (savedBills) {
        setBillRecords(JSON.parse(savedBills))
      } else {
        setBillRecords([])
      }
    } catch (e) {
      console.warn('Could not load bills from localStorage:', e)
    } finally {
      setLoadingEwallet(false)
    }
  }, [])

  // Mount-only load; auto-refreshes when transactions or inventory change on any terminal.
  useEffect(() => {
    void load()
    void loadEwalletAndBills()
    const cleanTx = window.api.transactions?.onChanged?.(() => { void load() })
    const cleanInv = window.api.inventory?.onChanged?.(() => { void load() })
    return () => {
      cleanTx?.()
      cleanInv?.()
    }
  }, [loadEwalletAndBills])

  const total = rows.filter((s) => s.status !== 'VOIDED').reduce((s, x) => s + x.total_c, 0)

  const combinedEwalletItems = useMemo<EwalletBillLedgerItem[]>(() => {
    const list: EwalletBillLedgerItem[] = []

    const billRefs = new Set(billRecords.map((b) => b.referenceNo?.trim()).filter(Boolean))

    for (const b of billRecords) {
      const amt_c = Math.round(b.amount * 100)
      const fee_c = Math.round(b.serviceFee * 100)
      const total_c = b.feeMode === 'DEDUCT' ? Math.max(0, amt_c - fee_c) : amt_c + fee_c
      list.push({
        key: `bill-${b.id || b.referenceNo || Math.random()}`,
        kind: 'BILL',
        date: b.createdAt,
        channel: b.sourceWallet || 'GCASH',
        type: 'BILLS',
        amount_c: amt_c,
        fee_c: fee_c,
        total_c,
        fee_collected_via: 'CASH',
        reference_no: b.referenceNo || '',
        customer_name: b.customerName || '',
        customer_phone: b.customerPhone || '',
        biller: b.biller,
        account_no: b.accountNo,
        rawBill: b
      })
    }

    for (const tx of ewalletTxs) {
      if (tx.reference_no && billRefs.has(tx.reference_no.trim())) {
        continue
      }
      const total_c =
        tx.type === 'CASH_IN'
          ? tx.fee_collected_via === 'CASH'
            ? tx.amount_c + tx.fee_c
            : tx.amount_c
          : Math.max(0, tx.amount_c - tx.fee_c)

      list.push({
        key: `ewallet-${tx.id}`,
        kind: 'EWALLET',
        date: tx.created_at,
        channel: tx.channel,
        type: tx.type,
        amount_c: tx.amount_c,
        fee_c: tx.fee_c,
        total_c,
        fee_collected_via: tx.fee_collected_via,
        reference_no: tx.reference_no || '',
        customer_name: tx.customer_name || '',
        customer_phone: tx.customer_phone || '',
        notes: tx.notes || '',
        rawTx: tx
      })
    }

    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return list
  }, [ewalletTxs, billRecords])

  const filteredEwalletItems = useMemo(() => {
    return combinedEwalletItems.filter((item) => {
      if (ewalletFilterChannel !== 'ALL') {
        if (ewalletFilterChannel === 'BILLS') {
          if (item.kind !== 'BILL') return false
        } else if (item.channel !== ewalletFilterChannel) {
          return false
        }
      }

      if (ewalletFilterType !== 'ALL') {
        if (ewalletFilterType === 'CASH_IN' && item.type !== 'CASH_IN') return false
        if (ewalletFilterType === 'CASH_OUT' && item.type !== 'CASH_OUT') return false
        if (ewalletFilterType === 'BILLS' && item.type !== 'BILLS') return false
      }

      const itemDateStr = item.date.slice(0, 10)
      if (ewalletFrom && itemDateStr < ewalletFrom) return false
      if (ewalletTo && itemDateStr > ewalletTo) return false

      if (ewalletSearch.trim()) {
        const q = ewalletSearch.toLowerCase()
        const matchRef = item.reference_no.toLowerCase().includes(q)
        const matchCust = item.customer_name.toLowerCase().includes(q)
        const matchPhone = item.customer_phone.toLowerCase().includes(q)
        const matchBiller = item.biller?.toLowerCase().includes(q)
        const matchAcct = item.account_no?.toLowerCase().includes(q)
        const matchNotes = item.notes?.toLowerCase().includes(q)
        const matchChannel = item.channel.toLowerCase().includes(q)
        if (!matchRef && !matchCust && !matchPhone && !matchBiller && !matchAcct && !matchNotes && !matchChannel) {
          return false
        }
      }

      return true
    })
  }, [combinedEwalletItems, ewalletFilterChannel, ewalletFilterType, ewalletFrom, ewalletTo, ewalletSearch])

  const totalEwalletPrincipalC = filteredEwalletItems.reduce((s, x) => s + x.amount_c, 0)
  const totalEwalletFeesC = filteredEwalletItems.reduce((s, x) => s + x.fee_c, 0)
  const totalEwalletCashC = filteredEwalletItems.reduce((s, x) => s + x.total_c, 0)

  const handlePrintItemSlip = async (item: EwalletBillLedgerItem, manual = false) => {
    if (item.kind === 'EWALLET' && item.rawTx?.id) {
      try {
        const res = await window.api.ewallet.printSlip(item.rawTx.id, { manual })
        if (res.ok) {
          toastSuccess(manual ? 'Manual Print Dialog' : 'Thermal Slip Printed', 'E-Wallet slip printed successfully.')
        } else {
          toastError('Printing Notice', res.message)
        }
      } catch (e) {
        toastError('Print Error', String((e as Error)?.message || e))
      }
    } else if (item.kind === 'BILL' && item.rawBill) {
      const b = item.rawBill
      try {
        const res = await window.api.ewallet.printBillSlip(
          {
            biller: b.biller,
            referenceNo: b.referenceNo,
            accountNo: b.accountNo,
            customerName: b.customerName,
            customerPhone: b.customerPhone,
            amount: b.amount,
            serviceFee: b.serviceFee,
            feeMode: b.feeMode,
            sourceWallet: b.sourceWallet,
            createdAt: b.createdAt,
            cashReceived: b.cashReceived,
            change: b.change
          },
          { manual }
        )
        if (res.ok) {
          toastSuccess(manual ? 'Manual Print Dialog' : 'Receipt Printed', 'Bills & E-Load slip printed successfully.')
        } else {
          toastError('Printing Notice', res.message)
        }
      } catch (e) {
        toastError('Print Error', String((e as Error)?.message || e))
      }
    }
  }

  const handleConfirmDeleteEwallet = async () => {
    if (!ewalletToDelete) return
    setIsDeletingEwallet(true)
    try {
      if (ewalletToDelete.kind === 'EWALLET' && ewalletToDelete.rawTx?.id) {
        if (window.api?.ewallet?.deleteTransaction) {
          await window.api.ewallet.deleteTransaction(ewalletToDelete.rawTx.id)
        }
        if (ewalletToDelete.reference_no?.trim()) {
          const ref = ewalletToDelete.reference_no.trim()
          try {
            const savedBills = localStorage.getItem('tinda_bills_load_records')
            if (savedBills) {
              const list: BillRecord[] = JSON.parse(savedBills)
              const next = list.filter((b) => b.referenceNo?.trim() !== ref)
              if (next.length !== list.length) {
                localStorage.setItem('tinda_bills_load_records', JSON.stringify(next))
                setBillRecords(next)
              }
            }
          } catch (e) {
            console.warn('Could not remove mirrored bill from localStorage:', e)
          }
        }
      } else if (ewalletToDelete.kind === 'BILL' && ewalletToDelete.rawBill) {
        const b = ewalletToDelete.rawBill
        // 1. Remove bill record from localStorage
        try {
          const savedBills = localStorage.getItem('tinda_bills_load_records')
          if (savedBills) {
            const list: BillRecord[] = JSON.parse(savedBills)
            const next = list.filter((item) => {
              if (b.id && item.id) return item.id !== b.id
              if (b.referenceNo && item.referenceNo) return item.referenceNo !== b.referenceNo
              return item.createdAt !== b.createdAt
            })
            localStorage.setItem('tinda_bills_load_records', JSON.stringify(next))
            setBillRecords(next)
          }
        } catch (e) {
          console.warn('Could not remove bill from localStorage:', e)
        }

        // 2. If mirrored in SQLite ewallet_transactions (by reference number or notes), delete from SQLite if matching ID exists
        const ref = (b.referenceNo || ewalletToDelete.reference_no || '').trim()
        if (window.api?.ewallet?.deleteTransaction) {
          const matchingTxs = ewalletTxs.filter((tx) => {
            if (ref && tx.reference_no?.trim() === ref) return true
            if (ref && tx.notes && tx.notes.includes(ref)) return true
            if (b.accountNo?.trim() && tx.notes && tx.notes.includes(b.accountNo.trim())) return true
            return false
          })
          for (const m of matchingTxs) {
            try {
              await window.api.ewallet.deleteTransaction(m.id)
            } catch (err) {
              console.warn('Could not delete mirrored ewallet tx:', err)
            }
          }
        }
      }

      await loadEwalletAndBills()
      toastSuccess('Transaction Deleted', 'E-Wallet / Bill transaction removed.')
      setEwalletToDelete(null)
    } catch (err) {
      toastError('Delete Failed', (err as Error)?.message || 'Failed to delete transaction.')
    } finally {
      setIsDeletingEwallet(false)
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Transactions Ledger"
        subtitle={
          activeTab === 'pos'
            ? `${rows.length} sales shown · net ${money(total)}`
            : `${filteredEwalletItems.length} records shown · net volume ${money(totalEwalletPrincipalC)} · fee profit ${money(totalEwalletFeesC)}`
        }
        actions={
          <div className="flex rounded-xl border border-ink-line bg-ink-900 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'pos'
                  ? 'bg-brand-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛒 POS Sales &amp; Receipts
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ewallet')
                void loadEwalletAndBills()
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'ewallet'
                  ? 'bg-brand-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ E-Wallet &amp; Bills Center
            </button>
          </div>
        }
      />

      {activeTab === 'pos' ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-48">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void load()}
                placeholder="Receipt #, product…"
                className="input w-full pl-9"
              />
            </div>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setTimeout(() => void load(), 0) }} className="input w-40">
              <option value="">All status</option>
              <option value="COMPLETED">Completed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="PARTIALLY_REFUNDED">Partially refunded</option>
              <option value="VOIDED">Voided</option>
            </select>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input w-40" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input w-40" />
            <button onClick={() => void load()} className="btn-primary">Apply</button>
          </div>

          {loading ? (
            <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="card h-12 animate-pulse" />)}</div>
          ) : rows.length === 0 ? (
            <EmptyState title="No transactions" message="Sales will appear here." icon={<ListOrdered className="h-7 w-7" />} />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="w-[22%] py-3 px-2 text-center align-middle">Receipt</th>
                      <th className="w-[15%] py-3 px-2 text-center align-middle whitespace-nowrap">Date</th>
                      <th className="w-[13%] py-3 px-2 text-center align-middle">Cashier</th>
                      <th className="w-[16%] py-3 px-2 text-center align-middle">Customer</th>
                      <th className="w-[12%] py-3 px-2 text-center align-middle">Total</th>
                      <th className="w-[11%] py-3 px-2 text-center align-middle">Status</th>
                      <th className="w-[11%] py-3 px-2 text-center align-middle">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s) => {
                      const isOpen = expandedId === s.id
                      const toggle = () => setExpandedId(isOpen ? null : s.id)
                      return (
                        <Fragment key={s.id}>
                          <tr className={`transition-colors hover:bg-ink-800/40 ${isOpen ? 'bg-ink-800/70' : ''}`}>
                            <td className="w-[22%] py-3 px-2 text-center align-middle">
                              <button
                                onClick={toggle}
                                className="inline-flex items-center justify-center gap-1.5 font-medium text-brand-400 hover:text-brand-300 font-mono text-xs max-w-full"
                                title={isOpen ? 'Collapse items' : 'Expand items'}
                              >
                                {isOpen
                                  ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                  : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />}
                                <span className="truncate">{s.transaction_no}</span>
                              </button>
                            </td>
                            <td className="w-[15%] py-3 px-2 text-center align-middle whitespace-nowrap text-xs text-slate-400">
                              {shortDateTime(s.created_at)}
                            </td>
                            <td className="w-[13%] py-3 px-2 text-center align-middle text-xs text-slate-300 truncate" title={s.cashier_name}>
                              {s.cashier_name}
                            </td>
                            <td className="w-[16%] py-3 px-2 text-center align-middle text-xs text-slate-400 truncate" title={s.customer_name || '—'}>
                              {s.customer_name || '—'}
                            </td>
                            <td className="w-[12%] py-3 px-2 text-center align-middle font-mono tabular-nums font-bold text-white text-sm">
                              {money(s.total_c)}
                            </td>
                            <td className="w-[11%] py-3 px-2 text-center align-middle">
                              <StatusBadge status={s.status} />
                            </td>
                            <td className="w-[11%] py-3 px-2 text-center align-middle">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => setView(s)} className="btn-ghost-2 rounded-lg p-1.5" title="View"><Eye className="h-4 w-4" /></button>
                                {(s.status === 'COMPLETED' || s.status === 'PARTIALLY_REFUNDED') && (
                                  <button onClick={() => setRefund(s)} className="btn-ghost-2 rounded-lg p-1.5" title="Refund"><RotateCcw className="h-4 w-4" /></button>
                                )}
                                {s.status === 'COMPLETED' && (
                                  <button onClick={() => setVoider(s)} className="btn-ghost-2 rounded-lg p-1.5 text-danger-400" title="Void"><Ban className="h-4 w-4" /></button>
                                )}
                                <button
                                  onClick={() => setDeleter(s)}
                                  className="btn-ghost-2 rounded-lg p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                  title="Delete Transaction"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isOpen && (
                            <tr key={`${s.id}-items`} className="bg-ink-800/70 border-b border-ink-line">
                              <td colSpan={7} className="px-4 pb-3 pt-0">
                                <div className="rounded-lg border border-ink-line overflow-hidden bg-ink-900/50">
                                  {/* Item rows */}
                                  <table className="w-full table-fixed text-xs">
                                    <thead>
                                      <tr className="border-b border-ink-line bg-ink-950/70">
                                        <th className="w-[46%] py-2.5 px-3 text-center align-middle font-semibold text-slate-400">Product</th>
                                        <th className="w-[18%] py-2.5 px-3 text-center align-middle font-semibold text-slate-400">Qty</th>
                                        <th className="w-[18%] py-2.5 px-3 text-center align-middle font-semibold text-slate-400">Unit Price</th>
                                        <th className="w-[18%] py-2.5 px-3 text-center align-middle font-semibold text-slate-400">Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {s.items.map((i) => (
                                        <tr key={i.id} className="border-b border-ink-line/50 last:border-0 hover:bg-ink-800/40">
                                          <td className="w-[46%] py-2 px-3 text-center align-middle text-slate-200 truncate" title={i.product_name}>
                                            <span className="font-medium">{i.product_name}</span>
                                            {i.refunded_qty_base > 0 && (
                                              <span className="ml-1.5 text-amber-400 text-[11px] font-normal">(ref {i.refunded_qty_base})</span>
                                            )}
                                          </td>
                                          <td className="w-[18%] py-2 px-3 text-center align-middle font-mono tabular-nums text-slate-300">
                                            {i.qty} <span className="font-sans text-[11px] text-slate-500">{i.unit_name}</span>
                                          </td>
                                          <td className="w-[18%] py-2 px-3 text-center align-middle font-mono tabular-nums text-slate-300">
                                            {money(i.unit_price_c)}
                                          </td>
                                          <td className="w-[18%] py-2 px-3 text-center align-middle font-mono tabular-nums font-semibold text-slate-100">
                                            {money(i.subtotal_c)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      {s.discount_c > 0 && (
                                        <tr className="border-t border-ink-line bg-ink-950/40 text-xs">
                                          <td colSpan={3} className="py-1.5 px-3 text-center align-middle text-slate-400">
                                            Discount
                                          </td>
                                          <td className="w-[18%] py-1.5 px-3 text-center align-middle font-mono tabular-nums text-amber-400">
                                            −{money(s.discount_c)}
                                          </td>
                                        </tr>
                                      )}
                                      <tr className="border-t border-ink-line bg-ink-950/60 text-xs font-semibold">
                                        <td colSpan={3} className="py-2 px-3 text-center align-middle">
                                          <div className="flex items-center justify-center gap-2 text-slate-500 font-normal">
                                            <span className="text-[11px] uppercase tracking-wider text-slate-500">Payment:</span>
                                            <span className="text-slate-300">
                                              {s.payments.map((p) => `${p.method} ${money(p.amount_c)}`).join(' · ')}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="w-[18%] py-2 px-3 text-center align-middle font-mono tabular-nums font-bold text-white">
                                          {money(s.total_c)}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* E-Wallet & Bills Center Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-48">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={ewalletSearch}
                onChange={(e) => setEwalletSearch(e.target.value)}
                placeholder="Search ref #, customer, phone, biller, notes…"
                className="input w-full pl-9"
              />
            </div>
            <select
              value={ewalletFilterChannel}
              onChange={(e) => setEwalletFilterChannel(e.target.value)}
              className="input w-40"
            >
              <option value="ALL">All Channels</option>
              <option value="GCASH">GCash</option>
              <option value="MAYA">Maya</option>
              <option value="MARIBANK">MariBank</option>
              <option value="BILLS">Bills &amp; Load Only</option>
            </select>
            <select
              value={ewalletFilterType}
              onChange={(e) => setEwalletFilterType(e.target.value)}
              className="input w-40"
            >
              <option value="ALL">All Types</option>
              <option value="CASH_IN">Cash In</option>
              <option value="CASH_OUT">Cash Out</option>
              <option value="BILLS">Bills Payment</option>
            </select>
            <input
              type="date"
              value={ewalletFrom}
              onChange={(e) => setEwalletFrom(e.target.value)}
              className="input w-36"
              title="From date"
            />
            <input
              type="date"
              value={ewalletTo}
              onChange={(e) => setEwalletTo(e.target.value)}
              className="input w-36"
              title="To date"
            />
            <button
              type="button"
              onClick={() => void loadEwalletAndBills()}
              className="btn-ghost-2 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
              title="Refresh records"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-3 border border-ink-line bg-ink-900/60 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Records Shown</span>
              <span className="text-base font-black text-white font-mono mt-0.5">{filteredEwalletItems.length}</span>
            </div>
            <div className="card p-3 border border-ink-line bg-ink-900/60 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-300">Principal Volume</span>
              <span className="text-base font-black text-brand-400 font-mono mt-0.5">{money(totalEwalletPrincipalC)}</span>
            </div>
            <div className="card p-3 border border-ink-line bg-ink-900/60 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Store Fee Profit</span>
              <span className="text-base font-black text-emerald-400 font-mono mt-0.5">+{money(totalEwalletFeesC)}</span>
            </div>
            <div className="card p-3 border border-ink-line bg-ink-900/60 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Total Cash Handled</span>
              <span className="text-base font-black text-white font-mono mt-0.5">{money(totalEwalletCashC)}</span>
            </div>
          </div>

          {/* E-Wallet & Bills Table */}
          {loadingEwallet ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card h-12 animate-pulse" />
              ))}
            </div>
          ) : filteredEwalletItems.length === 0 ? (
            <EmptyState
              title="No E-Wallet or Bills records"
              message="Processed GCash, Maya, MariBank, and utility bill stubs will appear here."
              icon={<Zap className="h-7 w-7 text-brand-400" />}
            />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="w-[18%] py-3 px-2 text-center align-middle whitespace-nowrap">Date &amp; Time</th>
                      <th className="w-[14%] py-3 px-2 text-center align-middle">Provider</th>
                      <th className="w-[14%] py-3 px-2 text-center align-middle">Type</th>
                      <th className="w-[20%] py-3 px-2 text-center align-middle">Customer / Account</th>
                      <th className="w-[12%] py-3 px-2 text-center align-middle">Principal</th>
                      <th className="w-[10%] py-3 px-2 text-center align-middle">Fee</th>
                      <th className="w-[12%] py-3 px-2 text-center align-middle">Total Cash</th>
                      <th className="w-[10%] py-3 px-2 text-center align-middle">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEwalletItems.map((item) => {
                      const channelColor =
                        item.channel === 'GCASH'
                          ? 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                          : item.channel === 'MAYA'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : item.channel === 'MARIBANK'
                          ? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
                          : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'

                      return (
                        <tr key={item.key} className="transition-colors hover:bg-ink-800/40">
                          <td className="w-[18%] py-3 px-2 text-center align-middle whitespace-nowrap text-xs text-slate-400 font-mono">
                            {item.date.replace('T', ' ').slice(0, 19)}
                          </td>
                          <td className="w-[14%] py-3 px-2 text-center align-middle">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${channelColor}`}>
                              <Smartphone className="h-3 w-3" />
                              {item.channel}
                            </span>
                          </td>
                          <td className="w-[14%] py-3 px-2 text-center align-middle">
                            {item.type === 'CASH_IN' && (
                              <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold">
                                <ArrowDownLeft className="h-3.5 w-3.5" /> Cash In
                              </span>
                            )}
                            {item.type === 'CASH_OUT' && (
                              <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-bold">
                                <ArrowUpRight className="h-3.5 w-3.5" /> Cash Out
                              </span>
                            )}
                            {item.type === 'BILLS' && (
                              <span className="inline-flex items-center gap-1 text-indigo-400 text-xs font-bold">
                                <Zap className="h-3.5 w-3.5" /> {item.biller || 'Bills'}
                              </span>
                            )}
                          </td>
                          <td className="w-[20%] py-3 px-2 text-center align-middle text-xs">
                            <div className="truncate font-medium text-slate-200">
                              {item.customer_name || 'Walk-in Customer'}
                            </div>
                            {(item.customer_phone || item.account_no) && (
                              <div className="text-[11px] font-mono text-slate-400 truncate">
                                {item.account_no ? `Acct: ${item.account_no}` : item.customer_phone}
                              </div>
                            )}
                            {item.reference_no && (
                              <div className="text-[10px] font-mono text-slate-500 truncate" title={item.reference_no}>
                                Ref: {item.reference_no}
                              </div>
                            )}
                          </td>
                          <td className="w-[12%] py-3 px-2 text-center align-middle font-mono tabular-nums font-bold text-slate-200 text-xs">
                            {money(item.amount_c)}
                          </td>
                          <td className="w-[10%] py-3 px-2 text-center align-middle font-mono tabular-nums text-xs font-semibold text-emerald-400">
                            +{money(item.fee_c)}
                          </td>
                          <td className="w-[12%] py-3 px-2 text-center align-middle font-mono tabular-nums font-bold text-white text-sm">
                            {money(item.total_c)}
                          </td>
                          <td className="w-[10%] py-3 px-2 text-center align-middle">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => void handlePrintItemSlip(item, false)}
                                onContextMenu={(e) => {
                                  e.preventDefault()
                                  void handlePrintItemSlip(item, true)
                                }}
                                className="btn-ghost-2 rounded-lg p-1.5 text-brand-400 hover:text-brand-300"
                                title="Print Thermal Slip (Right-click for manual dialog)"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEwalletToDelete(item)}
                                className="btn-ghost-2 rounded-lg p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                                title="Void / Delete Transaction"
                              >
                                <Trash2 className="h-4 w-4" />
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
        </>
      )}

      {view && <ViewSale sale={view} onClose={() => setView(null)} />}
      {refund && <RefundModal sale={refund} onClose={() => setRefund(null)} onDone={() => { setRefund(null); void load() }} />}
      {voider && <VoidModal sale={voider} onClose={() => setVoider(null)} onDone={() => { setVoider(null); void load() }} />}
      {deleter && <DeleteTransactionModal sale={deleter} onClose={() => setDeleter(null)} onDone={() => { setDeleter(null); void load() }} />}
      {ewalletToDelete && (
        <DeleteEwalletModal
          item={ewalletToDelete}
          isDeleting={isDeletingEwallet}
          onClose={() => setEwalletToDelete(null)}
          onConfirm={handleConfirmDeleteEwallet}
        />
      )}
    </div>
  )
}

function ViewSale({ sale, onClose }: { sale: Sale; onClose: () => void }): React.JSX.Element {
  const [receiptLines, setReceiptLines] = useState<string[] | null>(null)
  const print = async (manual = false) => {
    try {
      const result = await window.api.printer.printReceipt(sale.id, { manual })
      if (result.ok) toastSuccess(manual ? 'Print job submitted via dialog' : 'Receipt printed successfully')
      else if (result.code !== 'DISABLED') toastError('Receipt printing failed', result.message)
    } catch (e) { toastError('Receipt printing failed', String((e as Error)?.message || e)) }
  }
  const openReceiptPreview = async () => {
    try {
      // Reconstruct the EXISTING transaction only — no checkout, no stock change.
      const lines = await window.api.pos.reprint(sale.id)
      setReceiptLines(lines)
    } catch (e) { toastError('Could not generate receipt', String((e as Error)?.message || e)) }
  }
  return (
    <>
      <Modal open onClose={onClose} title={sale.transaction_no} maxWidth="max-w-md" footer={
        <>
          <button onClick={() => void openReceiptPreview()} className="btn-ghost flex items-center gap-2">
            <ReceiptText className="h-4 w-4" /> View Receipt
          </button>
          <button
            onClick={() => void print(true)}
            className="btn-ghost flex items-center gap-1.5 text-xs text-sky-300 hover:text-white border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20"
            title="Open native Windows Print Dialog for manual printer selection and darkness adjustment"
          >
            <Printer className="h-4 w-4" /> Manual Print
          </button>
          <button onClick={() => void print(false)} className="btn-primary flex items-center gap-2">
            <Printer className="h-4 w-4" /> Print Receipt
          </button>
        </>
      }>
      <div className="mb-3 flex justify-between text-sm text-slate-400">
        <span>{shortDateTime(sale.created_at)}</span><span>{sale.cashier_name}</span>
      </div>
      {sale.customer_name && <p className="mb-2 text-sm text-slate-400">Customer: <span className="text-slate-200">{sale.customer_name}</span></p>}
      <div className="max-h-56 space-y-1 overflow-y-auto">
        {sale.items.map((i) => (
          <div key={i.id} className="flex justify-between rounded-lg border border-ink-line px-3 py-1.5 text-sm">
            <span className="text-slate-300">{i.product_name} <span className="text-slate-500">×{i.qty} {i.unit_name}</span>{i.refunded_qty_base > 0 && <span className="ml-1 text-amber-400">(ref {i.refunded_qty_base})</span>}</span>
            <span className="font-bold text-slate-200">{money(i.subtotal_c)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1 border-t border-ink-line pt-2 text-sm">
        <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{money(sale.subtotal_c)}</span></div>
        {sale.discount_c > 0 && <div className="flex justify-between text-slate-400"><span>Discount</span><span>-{money(sale.discount_c)}</span></div>}
        <div className="flex justify-between font-bold text-white"><span>Total</span><span>{money(sale.total_c)}</span></div>
        <div className="space-y-0.5 pt-1">
          {sale.payments.map((p, i) => (
            <div key={i} className="flex justify-between text-xs text-slate-500"><span>{p.method}</span><span>{money(p.amount_c)}</span></div>
          ))}
        </div>
      </div>
      </Modal>
      {receiptLines && (
        <Modal open onClose={() => setReceiptLines(null)} title={`Receipt — ${sale.transaction_no}`} maxWidth="max-w-lg" footer={
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => void print(true)}
              className="btn-ghost flex items-center gap-1.5 text-xs text-sky-300 hover:text-white border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20"
              title="Open Windows System Print Dialog for manual printer selection and darkness adjustment"
            >
              <Printer className="h-4 w-4" /> Manual Print
            </button>
            <div className="flex gap-2">
              <button onClick={() => void print(false)} className="btn-primary flex items-center gap-1.5">
                <Printer className="h-4 w-4" /> Print
              </button>
              <button onClick={() => setReceiptLines(null)} className="btn-ghost">Close</button>
            </div>
          </div>
        }>
          <ReceiptPaper lines={receiptLines} />
        </Modal>
      )}
    </>
  )
}

function RefundModal({ sale, onClose, onDone }: { sale: Sale; onClose: () => void; onDone: () => void }): React.JSX.Element {
  const [selected, setSelected] = useState<Record<number, number>>({})
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const items = sale.items.filter((i) => i.qty_base - i.refunded_qty_base > 0)
  const totalRefund = Object.entries(selected).reduce((s, [id, qty]) => {
    const item = sale.items.find((i) => i.id === Number(id))
    return s + (item ? (item.subtotal_c / item.qty_base) * qty : 0)
  }, 0)

  const submit = async () => {
    if (totalRefund <= 0) { toastError('Select items to refund'); return }
    if (!reason.trim()) { toastError('Enter a refund reason'); return }
    setSubmitting(true)
    try {
      const refundItems = items
        .map((i) => ({ sale_item_id: i.id, product_id: i.product_id as number, qty_base: selected[i.id] ?? 0, unit_name: i.unit_name }))
        .filter((i) => i.qty_base > 0)
      await window.api.transactions.refund({
        sale_id: sale.id,
        reason,
        items: refundItems
      })
      toastSuccess('Refund processed')
      onDone()
    } catch (e) {
      toastError('Refund failed', String((e as Error)?.message || e))
    } finally {
      setSubmitting(false)
    }
  }

  const toggle = (itemId: number, qtyBase: number, maxQty: number) => {
    setSelected((prev) => ({ ...prev, [itemId]: prev[itemId] ? 0 : Math.max(1, Math.min(maxQty, qtyBase)) }))
  }

  return (
    <Modal open onClose={onClose} title={`Refund — ${sale.transaction_no}`} maxWidth="max-w-md" footer={
      <button onClick={() => void submit()} disabled={submitting} className="btn-primary">Refund {money(totalRefund)}</button>
    }>
      <div className="space-y-2">
        {items.map((i) => {
          const maxQty = i.qty_base - i.refunded_qty_base
          return (
            <div key={i.id} className="flex items-center justify-between rounded-lg border border-ink-line px-3 py-2">
              <div>
                <p className="text-sm text-slate-200">{i.product_name}</p>
                <p className="text-xs text-slate-500">{money(i.subtotal_c / i.qty_base)} × {i.qty} {i.unit_name}</p>
              </div>
              <button
                onClick={() => toggle(i.id, i.qty_base, maxQty)}
                className={`btn-ghost rounded-lg px-3 py-1 text-xs ${selected[i.id] ? '!border-brand-500 !text-brand-400' : ''}`}
              >
                {selected[i.id] ? `Refund ${selected[i.id]}` : 'Refund'}
              </button>
            </div>
          )
        })}
        <div><label className="label">Reason *</label><input value={reason} onChange={(e) => setReason(e.target.value)} className="input w-full" /></div>
      </div>
    </Modal>
  )
}

function VoidModal({ sale, onClose, onDone }: { sale: Sale; onClose: () => void; onDone: () => void }): React.JSX.Element {
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const disabled = confirmText.trim().toLowerCase() !== 'void' || !reason.trim()

  const submit = async () => {
    setSubmitting(true)
    try {
      await window.api.transactions.void({ sale_id: sale.id, reason })
      toastSuccess('Sale voided')
      onDone()
    } catch (e) {
      toastError('Void failed', String((e as Error)?.message || e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={`Void — ${sale.transaction_no}`} maxWidth="max-w-sm" footer={
      <button onClick={() => void submit()} disabled={disabled || submitting} className="btn-danger">Void Sale</button>
    }>
      <p className="mb-3 text-sm text-danger-400">This will void the entire sale of {money(sale.total_c)} and restore stock. This cannot be undone.</p>
      <div className="space-y-3">
        <div><label className="label">Reason *</label><input value={reason} onChange={(e) => setReason(e.target.value)} className="input w-full" /></div>
        <div><label className="label">Type VOID to confirm</label><input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="input w-full" /></div>
      </div>
    </Modal>
  )
}

function DeleteTransactionModal({ sale, onClose, onDone }: { sale: Sale; onClose: () => void; onDone: () => void }): React.JSX.Element {
  const [restoreStock, setRestoreStock] = useState(sale.status !== 'VOIDED')
  const [confirmText, setConfirmText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isConfirmed = confirmText.trim().toLowerCase() === 'delete'

  const submit = async () => {
    if (!isConfirmed) return
    setSubmitting(true)
    try {
      await window.api.transactions.delete(sale.id, { restoreStock })
      toastSuccess('Transaction deleted', `${sale.transaction_no} has been permanently deleted.`)
      onDone()
    } catch (e) {
      toastError('Delete failed', String((e as Error)?.message || e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Delete Transaction — ${sale.transaction_no}`}
      maxWidth="max-w-md"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            onClick={() => void submit()}
            disabled={!isConfirmed || submitting}
            className="btn-danger"
          >
            {submitting ? 'Deleting…' : 'Permanently Delete'}
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-slate-300">
        <p className="text-rose-400 font-semibold text-xs">
          ⚠️ Warning: This will permanently delete this transaction record from the database. This action is irreversible.
        </p>

        <div className="rounded-lg border border-ink-line bg-ink-950 p-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Receipt No:</span>
            <span className="font-mono font-bold text-white">{sale.transaction_no}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total Amount:</span>
            <span className="font-mono text-brand-400 font-bold">{money(sale.total_c)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Status:</span>
            <span className="font-semibold text-slate-200">{sale.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Date:</span>
            <span className="text-slate-300">{shortDateTime(sale.created_at)}</span>
          </div>
          {sale.customer_name && (
            <div className="flex justify-between">
              <span className="text-slate-400">Customer:</span>
              <span className="text-slate-200">{sale.customer_name}</span>
            </div>
          )}
        </div>

        {sale.status !== 'VOIDED' && (
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={restoreStock}
              onChange={(e) => setRestoreStock(e.target.checked)}
              className="rounded border-ink-line bg-ink-900 text-brand-500"
            />
            <span>Return sold items back into inventory stock</span>
          </label>
        )}

        <div className="pt-1">
          <label className="label text-xs">Type DELETE to confirm</label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="input w-full font-mono text-xs"
            autoFocus
          />
        </div>
      </div>
    </Modal>
  )
}

function DeleteEwalletModal({
  item,
  isDeleting,
  onClose,
  onConfirm
}: {
  item: EwalletBillLedgerItem
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}): React.JSX.Element {
  return (
    <Modal
      open
      onClose={onClose}
      title={item.kind === 'BILL' ? 'Delete Bills Payment Record' : 'Void E-Wallet Transaction'}
      maxWidth="max-w-md"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={isDeleting}>
            Cancel
          </button>
          <button
            onClick={() => void onConfirm()}
            disabled={isDeleting}
            className="btn-danger flex items-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Deleting…' : 'Delete Record'}
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-slate-300">
        <p className="text-rose-400 font-semibold text-xs">
          ⚠️ Warning: This will permanently remove this {item.kind === 'BILL' ? 'bills payment' : 'e-wallet'} record. This action cannot be undone.
        </p>

        <div className="rounded-lg border border-ink-line bg-ink-950 p-3.5 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Channel &amp; Type:</span>
            <span className="font-semibold text-white">
              {item.channel} · {item.type === 'CASH_IN' ? 'Cash In' : item.type === 'CASH_OUT' ? 'Cash Out' : item.biller || 'Bills Payment'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Date &amp; Time:</span>
            <span className="text-slate-300">{shortDateTime(item.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Customer:</span>
            <span className="text-slate-200">{item.customer_name || 'Walk-in Customer'}</span>
          </div>
          {(item.customer_phone || item.account_no) && (
            <div className="flex justify-between">
              <span className="text-slate-400">{item.account_no ? 'Account No:' : 'Phone Number:'}</span>
              <span className="font-mono text-brand-300">{item.account_no || item.customer_phone}</span>
            </div>
          )}
          {item.reference_no && (
            <div className="flex justify-between">
              <span className="text-slate-400">Reference No:</span>
              <span className="font-mono text-slate-300">{item.reference_no}</span>
            </div>
          )}
          <div className="border-t border-ink-line/60 pt-2 flex justify-between">
            <span className="text-slate-400">Principal Amount:</span>
            <span className="font-bold text-slate-200 font-mono">{money(item.amount_c)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Convenience Fee:</span>
            <span className="font-bold text-emerald-400 font-mono">+{money(item.fee_c)}</span>
          </div>
          <div className="border-t border-ink-line/60 pt-2 flex justify-between">
            <span className="text-slate-300 font-semibold">Total Handled:</span>
            <span className="font-bold text-white font-mono text-sm">{money(item.total_c)}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

