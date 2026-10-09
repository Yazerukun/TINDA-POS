import { useState, useEffect } from 'react'
import {
  Zap,
  Smartphone,
  Building2,
  Droplet,
  Tv,
  CreditCard,
  Printer,
  History,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  RefreshCw,
  Crown
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { money } from '@shared/format'
import { toastSuccess, toastError } from '../stores/toast'
import { useLicense } from '../stores/license'
import { VipUpgradeModal } from '../components/VipUpgradeModal'

interface BillTransaction {
  id: string
  category: 'UTILITIES' | 'WATER' | 'LOANS' | 'TELCO' | 'INTERNET'
  biller: string
  accountNo: string
  customerName: string
  customerPhone?: string
  amount: number
  serviceFee: number
  paidVia: 'CASH'
  sourceWallet: 'GCASH' | 'MAYA'
  status: 'COMPLETED'
  createdAt: string
  referenceNo: string
}

const BILLER_PRESETS = [
  { name: 'Meralco', category: 'UTILITIES', defaultFee: 15, icon: '⚡' },
  { name: 'Electric Cooperative', category: 'UTILITIES', defaultFee: 15, icon: '⚡' },
  { name: 'VECO / Visayan Electric', category: 'UTILITIES', defaultFee: 15, icon: '⚡' },
  { name: 'Maynilad / Manila Water', category: 'WATER', defaultFee: 15, icon: '💧' },
  { name: 'Local Water District', category: 'WATER', defaultFee: 15, icon: '💧' },
  { name: 'Home Credit', category: 'LOANS', defaultFee: 20, icon: '💳' },
  { name: 'Cashalo / Tala', category: 'LOANS', defaultFee: 20, icon: '💳' },
  { name: 'ShopeePay / SPayLater', category: 'LOANS', defaultFee: 15, icon: '🛍️' },
  { name: 'Globe / TM Regular / Promo', category: 'TELCO', defaultFee: 5, icon: '📶' },
  { name: 'Smart / TNT Regular / Promo', category: 'TELCO', defaultFee: 5, icon: '📶' },
  { name: 'DITO Telecommunity', category: 'TELCO', defaultFee: 5, icon: '📶' },
  { name: 'Converge ICT', category: 'INTERNET', defaultFee: 20, icon: '🌐' },
  { name: 'PLDT Home / Smart Bro', category: 'INTERNET', defaultFee: 20, icon: '🌐' }
]

const STORAGE_KEY = 'tinda_bills_load_records'

export function BillsLoadHub(): React.JSX.Element {
  const { isVip } = useLicense()
  const [vipModalOpen, setVipModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'register' | 'history'>('register')

  // Form state
  const [selectedBiller, setSelectedBiller] = useState(BILLER_PRESETS[0]!.name)
  const [customBiller, setCustomBiller] = useState('')
  const [accountNo, setAccountNo] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [serviceFeeStr, setServiceFeeStr] = useState('15')
  const [sourceWallet, setSourceWallet] = useState<'GCASH' | 'MAYA'>('GCASH')
  const [referenceNo, setReferenceNo] = useState('')

  // Records state
  const [records, setRecords] = useState<BillTransaction[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setRecords(JSON.parse(saved))
      }
    } catch {}
  }, [])

  const saveRecords = (newRecords: BillTransaction[]) => {
    setRecords(newRecords)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords))
    } catch {}
  }

  const handleBillerSelect = (b: typeof BILLER_PRESETS[0]) => {
    setSelectedBiller(b.name)
    setServiceFeeStr(String(b.defaultFee))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isVip) {
      setVipModalOpen(true)
      return
    }

    const billerName = selectedBiller === 'Other' ? customBiller.trim() : selectedBiller
    if (!billerName) {
      toastError('Missing Biller', 'Please select or enter the biller/telco name.')
      return
    }
    if (!accountNo.trim()) {
      toastError('Missing Account / Mobile #', 'Please enter customer account or mobile number.')
      return
    }
    const amt = parseFloat(amountStr) || 0
    if (amt <= 0) {
      toastError('Invalid Amount', 'Please enter a valid bill / load amount.')
      return
    }
    const fee = parseFloat(serviceFeeStr) || 0

    const newTx: BillTransaction = {
      id: 'BL-' + Date.now().toString(36).toUpperCase(),
      category: BILLER_PRESETS.find((b) => b.name === billerName)?.category as any || 'UTILITIES',
      biller: billerName,
      accountNo: accountNo.trim(),
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim(),
      amount: amt,
      serviceFee: fee,
      paidVia: 'CASH',
      sourceWallet,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      referenceNo: referenceNo.trim() || 'REF-' + Math.floor(100000 + Math.random() * 900000)
    }

    // Auto-record E-Wallet transaction into database if available
    try {
      if (window.api?.ewallet?.createTransaction) {
        await window.api.ewallet.createTransaction({
          channel: sourceWallet,
          type: 'CASH_IN',
          amount_c: Math.round(amt * 100),
          fee_c: Math.round(fee * 100),
          fee_collected_via: 'CASH',
          reference_no: newTx.referenceNo,
          customer_name: newTx.customerName,
          customer_phone: newTx.customerPhone || undefined,
          notes: `Bills/Load: ${billerName} (Acct: ${accountNo.trim()})`
        })
      }
    } catch (err) {
      console.warn('Could not mirror to ewallet table:', err)
    }

    const next = [newTx, ...records]
    saveRecords(next)
    toastSuccess('Transaction Recorded', `${billerName} payment of ₱${amt.toFixed(2)} logged!`)

    // Reset Form
    setAccountNo('')
    setCustomerName('')
    setCustomerPhone('')
    setAmountStr('')
    setReferenceNo('')
  }

  const printReceipt = async (tx: BillTransaction, manual = false) => {
    try {
      if (window.api?.ewallet?.printBillSlip) {
        const res = await window.api.ewallet.printBillSlip(
          {
            biller: tx.biller,
            referenceNo: tx.referenceNo,
            accountNo: tx.accountNo,
            customerName: tx.customerName,
            customerPhone: tx.customerPhone,
            amount: tx.amount,
            serviceFee: tx.serviceFee,
            sourceWallet: tx.sourceWallet,
            createdAt: tx.createdAt
          },
          { manual }
        )
        if (res.ok) {
          toastSuccess(manual ? 'Manual Print Dialog' : 'Receipt Printed', manual ? 'System print dialog opened.' : 'Bills & E-Load slip printed successfully.')
        } else {
          toastError('Printing Notice', res.message)
        }
      }
    } catch (e) {
      toastError('Print Error', String(e))
    }
  }

  const filteredRecords = records.filter(
    (r) =>
      r.biller.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.accountNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referenceNo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalCollectedToday = records
    .filter((r) => r.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((s, r) => s + r.amount + r.serviceFee, 0)

  const totalFeesEarnedToday = records
    .filter((r) => r.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((s, r) => s + r.serviceFee, 0)

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Bills Payment & E-Load"
        subtitle="Process Home Credit, Utilities, Water & Mobile E-Load via GCash & Maya"
        actions={
          <div className="flex items-center gap-2">
            {!isVip && (
              <button
                type="button"
                onClick={() => setVipModalOpen(true)}
                className="btn-ghost flex items-center gap-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/10"
              >
                <Crown className="h-4 w-4 text-amber-400" />
                Unlock VIP Feature
              </button>
            )}
            <div className="flex rounded-lg border border-ink-line bg-ink-850 p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'register' ? 'bg-brand-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                ⚡ New Payment
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'history' ? 'bg-brand-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                📋 Transaction History ({records.length})
              </button>
            </div>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 border border-ink-line bg-ink-900/90 rounded-2xl">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Today's Total Cash Inflow</p>
          <p className="text-2xl font-bold text-white mt-1 tabular-nums">₱{totalCollectedToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-slate-400 mt-1">Amount received from customers</p>
        </div>
        <div className="card p-4 border border-emerald-500/30 bg-emerald-500/10 rounded-2xl">
          <p className="text-xs font-medium text-emerald-300 uppercase tracking-wider">Today's Net Service Fees Earned</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">₱{totalFeesEarnedToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-emerald-300/80 mt-1">Pure store income from convenience fees</p>
        </div>
        <div className="card p-4 border border-sky-500/30 bg-sky-500/10 rounded-2xl">
          <p className="text-xs font-medium text-sky-300 uppercase tracking-wider">Total Bills & Load Transactions</p>
          <p className="text-2xl font-bold text-sky-400 mt-1 tabular-nums">{records.length}</p>
          <p className="text-[11px] text-sky-300/80 mt-1">Processed across GCash & Maya</p>
        </div>
      </div>

      {activeTab === 'register' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Preset Buttons */}
          <div className="lg:col-span-5 space-y-4">
            <div className="card p-4 border border-ink-line bg-ink-900/90 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Popular Billers & Services</h3>
              <div className="grid grid-cols-2 gap-2">
                {BILLER_PRESETS.map((b) => (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => handleBillerSelect(b)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition ${
                      selectedBiller === b.name
                        ? 'border-brand-500 bg-brand-500/15 text-white font-bold ring-1 ring-brand-500/30'
                        : 'border-ink-line bg-ink-950 text-slate-300 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <span className="text-base shrink-0">{b.icon}</span>
                    <span className="truncate">{b.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="card p-5 border border-ink-line bg-ink-900/90 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                Process Payment / E-Load
              </h3>

              {/* Source Wallet Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Processed Via Store Wallet</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSourceWallet('GCASH')}
                    className={`py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                      sourceWallet === 'GCASH'
                        ? 'border-sky-500 bg-sky-500/20 text-sky-300 ring-2 ring-sky-500/30'
                        : 'border-ink-line bg-ink-950 text-slate-400'
                    }`}
                  >
                    <Smartphone className="h-4 w-4" /> GCash Business
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceWallet('MAYA')}
                    className={`py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                      sourceWallet === 'MAYA'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/30'
                        : 'border-ink-line bg-ink-950 text-slate-400'
                    }`}
                  >
                    <Smartphone className="h-4 w-4" /> Maya Business
                  </button>
                </div>
              </div>

              {/* Biller Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Biller / Telco</label>
                  <input
                    type="text"
                    value={selectedBiller}
                    onChange={(e) => setSelectedBiller(e.target.value)}
                    className="input w-full"
                    placeholder="e.g. Home Credit, Meralco"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Account No. / Mobile #</label>
                  <input
                    type="text"
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    className="input w-full font-mono"
                    placeholder="e.g. 09171234567 or Loan #"
                    required
                  />
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Customer Name (Optional)</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input w-full"
                    placeholder="Walk-in Customer"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Customer Phone (Optional)</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="input w-full font-mono"
                    placeholder="09..."
                  />
                </div>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Bill / Load Amount (₱)</label>
                  <input
                    type="number"
                    step="any"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="input w-full font-bold text-white text-base"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Convenience Fee (₱)</label>
                  <input
                    type="number"
                    step="any"
                    value={serviceFeeStr}
                    onChange={(e) => setServiceFeeStr(e.target.value)}
                    className="input w-full font-semibold text-emerald-400"
                    placeholder="15.00"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Total to Collect (₱)</label>
                  <div className="input w-full font-extrabold text-brand-300 text-lg flex items-center bg-ink-800">
                    ₱{((parseFloat(amountStr) || 0) + (parseFloat(serviceFeeStr) || 0)).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">App Reference # / Transaction Trace (Optional)</label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="input w-full font-mono"
                  placeholder="e.g. 1002345892 (from GCash/Maya confirmation screen)"
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <CheckCircle2 className="h-4 w-4" />
                Record & Collect Payment (₱{((parseFloat(amountStr) || 0) + (parseFloat(serviceFeeStr) || 0)).toFixed(2)})
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card p-4 border border-ink-line bg-ink-900/90 rounded-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search biller, account, or customer..."
                className="input w-full pl-8 text-xs"
              />
              <Search className="h-4 w-4 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
            <p className="text-xs text-slate-400">{filteredRecords.length} transactions found</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink-line text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Biller & Service</th>
                  <th className="py-2.5 px-3">Account / Mobile #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Processed Via</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Fee</th>
                  <th className="py-2.5 px-3 text-right">Total Cash</th>
                  <th className="py-2.5 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line/50">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No bills payment or E-load transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-ink-800/50">
                      <td className="py-2.5 px-3 text-slate-400 font-mono whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                        {r.biller}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-brand-300 whitespace-nowrap">
                        {r.accountNo}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {r.customerName}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.sourceWallet === 'GCASH' ? 'bg-sky-500/20 text-sky-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          {r.sourceWallet}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-200">
                        ₱{r.amount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-emerald-400 font-semibold">
                        +₱{r.serviceFee.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-white">
                        ₱{(r.amount + r.serviceFee).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void printReceipt(r, false)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-ink-800 transition"
                            title="Thermal Print Receipt (Auto)"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void printReceipt(r, true)}
                            className="px-1.5 py-1 text-[10px] font-bold text-slate-400 hover:text-white rounded-lg hover:bg-ink-800 border border-ink-line transition"
                            title="Manual Print (System Dialog)"
                          >
                            Manual
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vipModalOpen && <VipUpgradeModal open={vipModalOpen} onClose={() => setVipModalOpen(false)} />}
    </div>
  )
}
