import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Smartphone,
  Zap,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Trash2,
  Sparkles,
  Calculator,
  History,
  CheckCircle2,
  AlertCircle,
  Banknote,
  DollarSign,
  Search,
  Receipt,
  RotateCcw,
  X
} from 'lucide-react'
import type {
  EwalletTransactionRecord,
  EwalletAuditRecord,
  EwalletShiftSummary,
  EwalletChannel,
  EwalletTransactionType
} from '@shared/types'
import { CASH_COUNT_DENOMINATIONS, actualCashCent } from '@shared/cashCount'
import { toastSuccess, toastError } from '../stores/toast'

const toast = {
  success: (title: string, msg?: string) => toastSuccess(title, msg),
  error: (title: string, msg?: string) => toastError(title, msg)
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

const BILLS_STORAGE_KEY = 'tinda_bills_load_records'

export interface BillRecord {
  id: string
  category: 'UTILITIES' | 'WATER' | 'LOANS' | 'TELCO' | 'INTERNET'
  biller: string
  accountNo: string
  customerName: string
  customerPhone?: string
  amount: number
  serviceFee: number
  paidVia: 'CASH'
  sourceWallet: 'GCASH' | 'MAYA' | 'MARIBANK'
  status: 'COMPLETED'
  createdAt: string
  referenceNo: string
  cashReceived?: number
  change?: number
}

export function EwalletAudit(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'register' | 'bills' | 'transactions' | 'audit' | 'history'>('register')

  // Bills & E-Load State
  const [billRecords, setBillRecords] = useState<BillRecord[]>(() => {
    try {
      const saved = localStorage.getItem(BILLS_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [selectedBiller, setSelectedBiller] = useState(BILLER_PRESETS[0]?.name || 'Meralco')
  const [billAccountNo, setBillAccountNo] = useState('')
  const [billCustomerName, setBillCustomerName] = useState('')
  const [billCustomerPhone, setBillCustomerPhone] = useState('')
  const [billAmountStr, setBillAmountStr] = useState('')
  const [billFeeStr, setBillFeeStr] = useState(String(BILLER_PRESETS[0]?.defaultFee || 15))
  const [billCashReceivedStr, setBillCashReceivedStr] = useState('')
  const [billSourceWallet, setBillSourceWallet] = useState<'GCASH' | 'MAYA' | 'MARIBANK'>('GCASH')
  const [billReferenceNo, setBillReferenceNo] = useState('')
  const [billSearchQuery, setBillSearchQuery] = useState('')
  const [billToDelete, setBillToDelete] = useState<BillRecord | null>(null)

  // Register Form State
  const [channel, setChannel] = useState<EwalletChannel>('GCASH')
  const [type, setType] = useState<EwalletTransactionType>('CASH_IN')
  const [amountStr, setAmountStr] = useState('')
  const [feeStr, setFeeStr] = useState('10')
  const [feeCollectedVia, setFeeCollectedVia] = useState<'CASH' | 'WALLET'>('CASH')
  const [referenceNo, setReferenceNo] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Transaction Ledger Filters & Search
  const [txSearch, setTxSearch] = useState('')
  const [txFilterChannel, setTxFilterChannel] = useState<'ALL' | 'GCASH' | 'MAYA' | 'MARIBANK'>('ALL')
  const [txFilterType, setTxFilterType] = useState<'ALL' | 'CASH_IN' | 'CASH_OUT'>('ALL')
  const [txToDelete, setTxToDelete] = useState<EwalletTransactionRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [auditToDelete, setAuditToDelete] = useState<EwalletAuditRecord | null>(null)
  const [isDeletingAudit, setIsDeletingAudit] = useState(false)
  const [isClearAuditsModalOpen, setIsClearAuditsModalOpen] = useState(false)
  const [posShiftExpectedCashStr, setPosShiftExpectedCashStr] = useState('0')

  // Transactions & Summary Data
  const [transactions, setTransactions] = useState<EwalletTransactionRecord[]>([])
  const [summary, setSummary] = useState<EwalletShiftSummary | null>(null)
  const [audits, setAudits] = useState<EwalletAuditRecord[]>([])

  // Audit Form State
  const [denominations, setDenominations] = useState<number[]>(() =>
    new Array(CASH_COUNT_DENOMINATIONS.length).fill(0)
  )
  const [expectedCashDrawerStr, setExpectedCashDrawerStr] = useState('0')
  const [startingGcashStr, setStartingGcashStr] = useState('0')
  const [actualGcashStr, setActualGcashStr] = useState('0')
  const [startingMayaStr, setStartingMayaStr] = useState('0')
  const [actualMayaStr, setActualMayaStr] = useState('0')
  const [startingMaribankStr, setStartingMaribankStr] = useState('0')
  const [actualMaribankStr, setActualMaribankStr] = useState('0')
  const [auditNotes, setAuditNotes] = useState('')

  // Load transactions and summary
  const loadData = useCallback(async () => {
    try {
      const [txList, shiftSummary, auditList] = await Promise.all([
        window.api.ewallet.listTransactions({ limit: 100 }),
        window.api.ewallet.getShiftSummary(),
        window.api.ewallet.listAudits({ limit: 30 })
      ])
      setTransactions(txList)
      setSummary(shiftSummary)
      setAudits(auditList)

      // Also get expected cash in drawer from shift
      try {
        const expected = await window.api.reports.cashCountExpected()
        if (expected && expected.expected_cash_c != null) {
          const valStr = (expected.expected_cash_c / 100).toFixed(2)
          setPosShiftExpectedCashStr(valStr)
          setExpectedCashDrawerStr((prev) => (prev === '0' || prev === '' ? valStr : prev))
        }
      } catch {
        // Ignored if no shift
      }
    } catch {
      // Non-blocking catch
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Denomination calculations
  const actualCashC = useMemo(() => {
    try {
      return actualCashCent(denominations)
    } catch {
      return 0
    }
  }, [denominations])

  // Filtered transactions for the ledger view
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (txFilterChannel !== 'ALL' && tx.channel !== txFilterChannel) return false
      if (txFilterType !== 'ALL' && tx.type !== txFilterType) return false
      if (txSearch.trim()) {
        const q = txSearch.toLowerCase()
        const matchRef = tx.reference_no?.toLowerCase().includes(q)
        const matchCust = tx.customer_name?.toLowerCase().includes(q)
        const matchPhone = tx.customer_phone?.toLowerCase().includes(q)
        const matchCashier = tx.cashier_name?.toLowerCase().includes(q)
        const matchNotes = tx.notes?.toLowerCase().includes(q)
        const matchAmt = (tx.amount_c / 100).toFixed(2).includes(q)
        if (!matchRef && !matchCust && !matchPhone && !matchCashier && !matchNotes && !matchAmt) {
          return false
        }
      }
      return true
    })
  }, [transactions, txFilterChannel, txFilterType, txSearch])

  const expectedCashC = Math.round((parseFloat(expectedCashDrawerStr) || 0) * 100)
  const cashDifferenceC = actualCashC - expectedCashC
  const cashStatus = cashDifferenceC === 0 ? 'BALANCED' : cashDifferenceC > 0 ? 'OVER' : 'SHORT'

  // E-Wallet Calculations
  const startingGcashC = Math.round((parseFloat(startingGcashStr) || 0) * 100)
  const actualGcashC = Math.round((parseFloat(actualGcashStr) || 0) * 100)
  const gcashSentC = summary?.gcash_in_amount_c || 0
  const gcashReceivedC = summary?.gcash_out_amount_c || 0
  const expectedGcashC = startingGcashC - gcashSentC + gcashReceivedC
  const gcashDifferenceC = actualGcashC - expectedGcashC

  const startingMayaC = Math.round((parseFloat(startingMayaStr) || 0) * 100)
  const actualMayaC = Math.round((parseFloat(actualMayaStr) || 0) * 100)
  const mayaSentC = summary?.maya_in_amount_c || 0
  const mayaReceivedC = summary?.maya_out_amount_c || 0
  const expectedMayaC = startingMayaC - mayaSentC + mayaReceivedC
  const mayaDifferenceC = actualMayaC - expectedMayaC

  const startingMaribankC = Math.round((parseFloat(startingMaribankStr) || 0) * 100)
  const actualMaribankC = Math.round((parseFloat(actualMaribankStr) || 0) * 100)
  const maribankSentC = summary?.maribank_in_amount_c || 0
  const maribankReceivedC = summary?.maribank_out_amount_c || 0
  const expectedMaribankC = startingMaribankC - maribankSentC + maribankReceivedC
  const maribankDifferenceC = actualMaribankC - expectedMaribankC

  const handleDenomChange = (index: number, val: string): void => {
    const qty = parseInt(val, 10) || 0
    setDenominations((prev) => {
      const copy = [...prev]
      copy[index] = Math.max(0, qty)
      return copy
    })
  }

  // Handle Create Transaction
  const handleSaveTransaction = async (printSlip = false): Promise<void> => {
    const amountVal = parseFloat(amountStr)
    if (!amountVal || amountVal <= 0) {
      toast.error('Please enter a valid amount.')
      return
    }
    const feeVal = parseFloat(feeStr) || 0
    const amount_c = Math.round(amountVal * 100)
    const fee_c = Math.round(feeVal * 100)

    setIsSubmitting(true)
    try {
      const tx = await window.api.ewallet.createTransaction({
        channel,
        type,
        amount_c,
        fee_c,
        fee_collected_via: feeCollectedVia,
        reference_no: referenceNo || null,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        notes: notes || null
      })

      toast.success(
        `${channel} ${type === 'CASH_IN' ? 'Cash In' : 'Cash Out'} of ₱${amountVal.toFixed(2)} recorded!`
      )

      if (printSlip && tx.id) {
        try {
          await window.api.ewallet.printSlip(tx.id)
        } catch (e) {
          toast.error('Failed to print claim slip: ' + (e as Error).message)
        }
      }

      // Reset form fields
      setAmountStr('')
      setReferenceNo('')
      setCustomerName('')
      setCustomerPhone('')
      setNotes('')
      void loadData()
    } catch (err) {
      toast.error((err as Error)?.message || 'Failed to save transaction.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Bills & E-Load Handlers
  const saveBillRecords = (next: BillRecord[]) => {
    setBillRecords(next)
    try {
      localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(next))
    } catch {}
  }

  const handleProcessBill = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(billAmountStr)
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid bill amount.')
      return
    }
    if (!billAccountNo.trim()) {
      toast.error('Please provide an account number or mobile phone.')
      return
    }
    const fee = parseFloat(billFeeStr) || 0
    const cashRec = parseFloat(billCashReceivedStr) || undefined
    const totalDue = amt + fee
    const changeAmt = cashRec !== undefined && cashRec >= totalDue ? cashRec - totalDue : undefined

    const newTx: BillRecord = {
      id: 'BL-' + Date.now().toString(36).toUpperCase(),
      category: (BILLER_PRESETS.find((b) => b.name === selectedBiller)?.category as any) || 'UTILITIES',
      biller: selectedBiller,
      accountNo: billAccountNo.trim(),
      customerName: billCustomerName.trim() || 'Walk-in Customer',
      customerPhone: billCustomerPhone.trim(),
      amount: amt,
      serviceFee: fee,
      paidVia: 'CASH',
      sourceWallet: billSourceWallet,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      referenceNo: billReferenceNo.trim() || 'REF-' + Math.floor(100000 + Math.random() * 900000),
      cashReceived: cashRec,
      change: changeAmt
    }

    // Auto-record E-Wallet transaction into database
    try {
      if (window.api?.ewallet?.createTransaction) {
        await window.api.ewallet.createTransaction({
          channel: billSourceWallet,
          type: 'CASH_IN',
          amount_c: Math.round(amt * 100),
          fee_c: Math.round(fee * 100),
          fee_collected_via: 'CASH',
          reference_no: newTx.referenceNo,
          customer_name: newTx.customerName,
          customer_phone: newTx.customerPhone || undefined,
          notes: `Bills/Load: ${selectedBiller} (Acct: ${billAccountNo.trim()})`
        })
      }
    } catch (err) {
      console.warn('Could not mirror to ewallet table:', err)
    }

    const next = [newTx, ...billRecords]
    saveBillRecords(next)
    toast.success('Transaction Recorded', `${selectedBiller} payment of ₱${amt.toFixed(2)} logged!`)

    // Reset Form
    setBillAccountNo('')
    setBillCustomerName('')
    setBillCustomerPhone('')
    setBillAmountStr('')
    setBillCashReceivedStr('')
    setBillReferenceNo('')
    void loadData()
  }

  const printBillReceipt = async (tx: BillRecord, manual = false) => {
    try {
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
          createdAt: tx.createdAt,
          cashReceived: tx.cashReceived,
          change: tx.change
        },
        { manual }
      )
      if (res.ok) {
        toast.success(manual ? 'Manual print dialog opened' : 'Receipt printed successfully')
      } else {
        toast.error('Printing failed', res.message)
      }
    } catch (e) {
      toast.error('Printing error', String((e as Error)?.message || e))
    }
  }

  const printEwalletReceipt = async (id: number, manual = false) => {
    try {
      const res = await window.api.ewallet.printSlip(id, { manual })
      if (res.ok) {
        toast.success(manual ? 'Manual print dialog opened' : 'Claim slip printed successfully')
      } else {
        toast.error('Printing failed', res.message)
      }
    } catch (e) {
      toast.error('Printing error', String((e as Error)?.message || e))
    }
  }

  const handleDeleteBill = (tx: BillRecord) => {
    setBillToDelete(tx)
  }

  const confirmDeleteBill = () => {
    if (!billToDelete) return
    const next = billRecords.filter((b) => b.id !== billToDelete.id)
    saveBillRecords(next)
    toast.success('Deleted', 'Bills payment transaction removed.')
    setBillToDelete(null)
  }

  const handleDeleteTransaction = (id: number): void => {
    const tx = transactions.find((t) => t.id === id)
    if (tx) {
      setTxToDelete(tx)
    }
  }

  const confirmDeleteTransaction = async (): Promise<void> => {
    if (!txToDelete) return
    setIsDeleting(true)
    try {
      await window.api.ewallet.deleteTransaction(txToDelete.id)
      toast.success('Transaction voided successfully.', 'Shift metrics and drawer balance updated.')
      setTxToDelete(null)
      void loadData()
    } catch (err) {
      toast.error((err as Error)?.message || 'Failed to delete transaction.')
    } finally {
      setIsDeleting(false)
    }
  }

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0] || '', [])
  const todayAudit = useMemo(() => {
    if (!todayStr) return null
    return audits.find((a) => a.business_date === todayStr || a.business_date.startsWith(todayStr)) || null
  }, [audits, todayStr])

  const handleDeleteAudit = (audit: EwalletAuditRecord): void => {
    setAuditToDelete(audit)
  }

  const confirmDeleteAudit = async (): Promise<void> => {
    if (!auditToDelete) return
    setIsDeletingAudit(true)
    try {
      await window.api.ewallet.deleteAudit(auditToDelete.id)
      toast.success('Audit deleted successfully', `Audit record for ${auditToDelete.business_date} was permanently removed.`)
      setAuditToDelete(null)
      void loadData()
    } catch (err) {
      toast.error('Failed to delete audit', (err as Error)?.message || String(err))
    } finally {
      setIsDeletingAudit(false)
    }
  }

  const handleResetAuditSheet = (): void => {
    setDenominations(new Array(CASH_COUNT_DENOMINATIONS.length).fill(0))
    setExpectedCashDrawerStr(posShiftExpectedCashStr !== '0' ? posShiftExpectedCashStr : '0.00')
    setStartingGcashStr('0')
    setActualGcashStr('0')
    setStartingMayaStr('0')
    setActualMayaStr('0')
    setStartingMaribankStr('0')
    setActualMaribankStr('0')
    setAuditNotes('')
    toast.success('Audit Sheet Reset', 'All counted denominations, expected balances, and notes have been cleared.')
  }

  const printAuditRecord = async (id: number, manual = false) => {
    try {
      const res = await window.api.ewallet.printAuditReport(id, { manual })
      if (res.ok) {
        toast.success(manual ? 'Manual print dialog opened' : 'Audit report printed successfully')
      } else {
        toast.error('Printing failed', res.message)
      }
    } catch (e) {
      toast.error('Printing error', String((e as Error)?.message || e))
    }
  }

  const handleSaveAudit = async (printMode: 'NONE' | 'AUTO' | 'MANUAL' = 'NONE'): Promise<void> => {
    try {
      const audit = await window.api.ewallet.saveAudit({
        expected_cash_c: expectedCashC,
        actual_cash_c: actualCashC,
        denominations,
        starting_gcash_c: startingGcashC,
        actual_gcash_c: actualGcashC,
        starting_maya_c: startingMayaC,
        actual_maya_c: actualMayaC,
        starting_maribank_c: startingMaribankC,
        actual_maribank_c: actualMaribankC,
        notes: auditNotes || null
      })

      toast.success('E-Wallet & Cash Audit saved successfully!')
      if (printMode !== 'NONE' && audit.id) {
        try {
          const res = await window.api.ewallet.printAuditReport(audit.id, { manual: printMode === 'MANUAL' })
          if (res?.ok) {
            toast.success(printMode === 'MANUAL' ? 'Manual print dialog opened' : 'Audit report printed successfully')
          }
        } catch (e) {
          toast.error('Print failed: ' + (e as Error).message)
        }
      }
      void loadData()
      setActiveTab('history')
    } catch (err) {
      toast.error((err as Error)?.message || 'Failed to save audit.')
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-emerald-400" />
              E-Wallet &amp; Bills Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            GCash, Maya &amp; MariBank Cash In / Cash Out, Utilities &amp; Loan Bills Payment, Instant Thermal &amp; Manual Printing, and 3-Way Audit.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-ink-900 p-1 border border-ink-line">
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'register'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Cash In / Out
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bills')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'bills'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Bills &amp; E-Load ({billRecords.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'transactions'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            Transactions ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'audit'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            Audit Sheet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'history'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Audit History
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'register' && (
        <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
          {/* Left Form: Express Cash In / Cash Out Register */}
          <div className="2xl:col-span-7 space-y-6">
            <div className="card p-5 border border-ink-line bg-ink-900/90 rounded-2xl shadow-card space-y-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-400" />
                New E-Wallet Transaction
              </h3>

              {/* Channel Selector: GCash, Maya, MariBank */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setChannel('GCASH')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition ${
                    channel === 'GCASH'
                      ? 'border-sky-500 bg-sky-500/15 text-sky-400 shadow-md ring-2 ring-sky-500/30'
                      : 'border-ink-line bg-ink-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  GCash
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('MAYA')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition ${
                    channel === 'MAYA'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                      : 'border-ink-line bg-ink-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  Maya
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('MARIBANK')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition ${
                    channel === 'MARIBANK'
                      ? 'border-orange-500 bg-orange-500/15 text-orange-400 shadow-md ring-2 ring-orange-500/30'
                      : 'border-ink-line bg-ink-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  MariBank
                </button>
              </div>

              {/* Type Selector: Cash In vs Cash Out */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('CASH_IN')}
                  className={`flex flex-col items-center justify-center py-2.5 rounded-xl border font-bold text-xs transition ${
                    type === 'CASH_IN'
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-md'
                      : 'border-ink-line bg-ink-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1 text-sm">
                    <ArrowDownLeft className="h-4 w-4" /> CASH IN
                  </span>
                  <span className="text-[10px] font-normal text-slate-400">Customer gives Cash, send load</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('CASH_OUT')}
                  className={`flex flex-col items-center justify-center py-2.5 rounded-xl border font-bold text-xs transition ${
                    type === 'CASH_OUT'
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-md'
                      : 'border-ink-line bg-ink-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1 text-sm">
                    <ArrowUpRight className="h-4 w-4" /> CASH OUT
                  </span>
                  <span className="text-[10px] font-normal text-slate-400">Customer sends load, release Cash</span>
                </button>
              </div>

              {/* Amount Input & Quick Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Principal Amount (₱) <span className="text-danger-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-500">₱</span>
                  <input
                    type="number"
                    step="any"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-ink-line bg-ink-950 pl-8 pr-4 py-2.5 text-base font-bold text-white outline-none focus:border-brand-500 transition"
                  />
                </div>
                {/* Quick amount chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[100, 200, 500, 1000, 1500, 2000, 3000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmountStr(String(amt))}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-ink-line bg-ink-950 text-slate-300 hover:border-brand-500 hover:text-brand-300 transition"
                    >
                      ₱{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Fee */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Service Fee (₱)
                  </label>
                  <span className="text-[10px] text-slate-500">Store Profit</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-sm font-bold text-slate-500">₱</span>
                    <input
                      type="number"
                      step="any"
                      value={feeStr}
                      onChange={(e) => setFeeStr(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-ink-line bg-ink-950 pl-7 pr-3 py-2 text-sm font-bold text-emerald-400 outline-none focus:border-brand-500 transition"
                    />
                  </div>
                  {/* Quick fee buttons */}
                  {[10, 15, 20, 30, 50].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFeeStr(String(f))}
                      className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-ink-line bg-ink-950 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition"
                    >
                      ₱{f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee Collection Method */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 font-medium">Service Fee Paid In:</span>
                <div className="flex rounded-lg bg-ink-950 p-1 border border-ink-line">
                  <button
                    type="button"
                    onClick={() => setFeeCollectedVia('CASH')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${
                      feeCollectedVia === 'CASH'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Cash (In Drawer)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeeCollectedVia('WALLET')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${
                      feeCollectedVia === 'WALLET'
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Deducted / In Wallet
                  </button>
                </div>
              </div>

              {/* Customer & Reference Details (Optional) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Reference Number (Optional)</label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. 987654321"
                    className="w-full rounded-xl border border-ink-line bg-ink-950 px-3 py-2 text-xs text-white outline-none focus:border-brand-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Customer Name / Phone</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Aling Marites"
                    className="w-full rounded-xl border border-ink-line bg-ink-950 px-3 py-2 text-xs text-white outline-none focus:border-brand-500 transition"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleSaveTransaction(true)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-brand-500 active:scale-95 transition disabled:opacity-50"
                >
                  <Printer className="h-4 w-4" />
                  Record & Print Slip
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleSaveTransaction(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-ink-line bg-ink-950 px-5 py-3 text-xs font-bold text-slate-300 hover:bg-ink-800 hover:text-white active:scale-95 transition disabled:opacity-50"
                >
                  Save Only
                </button>
              </div>
            </div>
          </div>

          {/* Right Summary & Live Transaction Feed */}
          <div className="2xl:col-span-5 space-y-6">
            {/* Shift Snapshot Card */}
            <div className="card p-5 border border-ink-line bg-ink-900 rounded-2xl shadow-card space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Active Shift E-Wallet Metrics</span>
                <span className="text-emerald-400 font-bold">● Active</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                  <p className="text-[11px] font-semibold text-sky-400">GCash Cash In</p>
                  <p className="text-base font-bold text-white mt-0.5">
                    ₱{((summary?.gcash_in_amount_c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400">{summary?.gcash_in_count || 0} txn · Fee: ₱{((summary?.gcash_in_fees_c || 0) / 100).toFixed(2)}</p>
                </div>

                <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                  <p className="text-[11px] font-semibold text-sky-400">GCash Cash Out</p>
                  <p className="text-base font-bold text-white mt-0.5">
                    ₱{((summary?.gcash_out_amount_c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400">{summary?.gcash_out_count || 0} txn · Fee: ₱{((summary?.gcash_out_fees_c || 0) / 100).toFixed(2)}</p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-[11px] font-semibold text-emerald-400">Maya Cash In</p>
                  <p className="text-base font-bold text-white mt-0.5">
                    ₱{((summary?.maya_in_amount_c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400">{summary?.maya_in_count || 0} txn · Fee: ₱{((summary?.maya_in_fees_c || 0) / 100).toFixed(2)}</p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-[11px] font-semibold text-emerald-400">Maya Cash Out</p>
                  <p className="text-base font-bold text-white mt-0.5">
                    ₱{((summary?.maya_out_amount_c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400">{summary?.maya_out_count || 0} txn · Fee: ₱{((summary?.maya_out_fees_c || 0) / 100).toFixed(2)}</p>
                </div>
              </div>

              {/* Total Service Fees & Cash Impact */}
              <div className="border-t border-ink-line pt-3 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] uppercase text-slate-500 font-semibold">Total Fees Earned</p>
                  <p className="text-lg font-black text-amber-400">
                    ₱{((summary?.total_fees_c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-slate-500 font-semibold">Net Cash Drawer Impact</p>
                  <p className={`text-base font-bold ${
                    (summary?.net_cash_drawer_delta_c || 0) >= 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {(summary?.net_cash_drawer_delta_c || 0) >= 0 ? '+' : ''}
                    ₱{((summary?.net_cash_drawer_delta_c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Transaction Log */}
            <div className="card p-5 border border-ink-line bg-ink-900 rounded-2xl shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recent E-Wallet Transactions
                </h3>
                {transactions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('transactions')}
                    className="text-[11px] font-bold text-brand-400 hover:text-brand-300 transition"
                  >
                    View All ({transactions.length}) →
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No transactions recorded yet today.
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-ink-line bg-ink-950 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold text-[10px] ${
                            tx.channel === 'GCASH'
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                              : tx.channel === 'MAYA'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          }`}
                        >
                          {tx.channel === 'GCASH' ? 'GC' : tx.channel === 'MAYA' ? 'MY' : 'MB'}
                        </span>
                        <div>
                          <p className="font-semibold text-white flex items-center gap-1.5">
                            <span>{tx.type === 'CASH_IN' ? 'Cash In' : 'Cash Out'}</span>
                            <span className="text-[10px] text-slate-400">· ₱{(tx.amount_c / 100).toFixed(2)}</span>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Fee: ₱{(tx.fee_c / 100).toFixed(2)} {tx.customer_name ? `· ${tx.customer_name}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void printEwalletReceipt(tx.id, false)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-ink-800 transition"
                          title="Print Thermal Slip (Auto)"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void printEwalletReceipt(tx.id, true)}
                          className="px-1.5 py-1 text-[10px] font-bold text-slate-400 hover:text-white rounded-lg hover:bg-ink-800 border border-ink-line transition"
                          title="Manual Print (System Dialog)"
                        >
                          Manual
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
                          title="Void / Delete Transaction"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Void</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Bills Payment & E-Load Hub */}
      {activeTab === 'bills' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
            {/* Left: Express Bills Payment Form */}
            <div className="2xl:col-span-5 space-y-4">
              <div className="card p-5 border border-ink-line bg-ink-900/90 rounded-2xl shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-ink-line/60 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    New Bill / E-Load Entry
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Customer Cash
                  </span>
                </div>

                <form onSubmit={(e) => void handleProcessBill(e)} className="space-y-4">
                  {/* Source Wallet (What the merchant pays out with) */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Store Wallet Used to Process:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setBillSourceWallet('GCASH')}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition ${
                          billSourceWallet === 'GCASH'
                            ? 'border-sky-500 bg-sky-500/15 text-sky-400 ring-2 ring-sky-500/20'
                            : 'border-ink-line bg-ink-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="h-3.5 w-3.5" /> GCash
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillSourceWallet('MAYA')}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition ${
                          billSourceWallet === 'MAYA'
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 ring-2 ring-emerald-500/20'
                            : 'border-ink-line bg-ink-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="h-3.5 w-3.5" /> Maya
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillSourceWallet('MARIBANK')}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition ${
                          billSourceWallet === 'MARIBANK'
                            ? 'border-orange-500 bg-orange-500/15 text-orange-400 ring-2 ring-orange-500/20'
                            : 'border-ink-line bg-ink-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="h-3.5 w-3.5" /> MariBank
                      </button>
                    </div>
                  </div>

                  {/* Biller Preset Selector */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Biller / Telecom Network:
                    </label>
                    <select
                      value={selectedBiller}
                      onChange={(e) => {
                        const val = e.target.value
                        setSelectedBiller(val)
                        const preset = BILLER_PRESETS.find((p) => p.name === val)
                        if (preset) setBillFeeStr(String(preset.defaultFee))
                      }}
                      className="w-full rounded-xl border border-ink-line bg-ink-950 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-brand-500 transition"
                    >
                      {BILLER_PRESETS.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.icon} {p.name} ({p.category}) — Default Fee: ₱{p.defaultFee}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account / Mobile Number */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Account # / Loan # / Mobile # <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={billAccountNo}
                      onChange={(e) => setBillAccountNo(e.target.value)}
                      placeholder="e.g. 09171234567 or Account/Contract #"
                      className="w-full rounded-xl border border-ink-line bg-ink-950 px-3 py-2 text-xs font-mono font-bold text-brand-300 outline-none focus:border-brand-500 transition"
                      required
                    />
                  </div>

                  {/* Customer Information */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Customer Name</label>
                      <input
                        type="text"
                        value={billCustomerName}
                        onChange={(e) => setBillCustomerName(e.target.value)}
                        placeholder="Walk-in Customer"
                        className="w-full rounded-xl border border-ink-line bg-ink-950 px-3 py-1.5 text-xs text-white outline-none focus:border-brand-500 transition"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Phone (Optional)</label>
                      <input
                        type="text"
                        value={billCustomerPhone}
                        onChange={(e) => setBillCustomerPhone(e.target.value)}
                        placeholder="09..."
                        className="w-full rounded-xl border border-ink-line bg-ink-950 px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-brand-500 transition"
                      />
                    </div>
                  </div>

                  {/* Bill & Fee Calculation */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Principal Amount (₱) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={billAmountStr}
                        onChange={(e) => setBillAmountStr(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-ink-line bg-ink-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-brand-500 transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Convenience Fee (₱)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={billFeeStr}
                        onChange={(e) => setBillFeeStr(e.target.value)}
                        placeholder="15.00"
                        className="w-full rounded-xl border border-ink-line bg-ink-950 px-3 py-2 text-sm font-bold text-emerald-400 outline-none focus:border-brand-500 transition"
                      />
                    </div>
                  </div>

                  {/* Total to Collect */}
                  <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-brand-300">Total Customer Cash to Collect</p>
                      <p className="text-lg font-black text-white">
                        ₱{((parseFloat(billAmountStr) || 0) + (parseFloat(billFeeStr) || 0)).toFixed(2)}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                      Fee: ₱{(parseFloat(billFeeStr) || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Cash Tendered & Change */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Cash Tendered (₱) <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={billCashReceivedStr}
                        onChange={(e) => setBillCashReceivedStr(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-ink-line bg-ink-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-brand-500 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Change (₱)
                      </label>
                      <div className="w-full rounded-xl border border-ink-line bg-ink-900/60 px-3 py-2 text-sm font-bold text-emerald-400 flex items-center h-[38px]">
                        ₱{Math.max(0, (parseFloat(billCashReceivedStr) || 0) - ((parseFloat(billAmountStr) || 0) + (parseFloat(billFeeStr) || 0))).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Reference Number */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      App Trace / Reference # (Optional)
                    </label>
                    <input
                      type="text"
                      value={billReferenceNo}
                      onChange={(e) => setBillReferenceNo(e.target.value)}
                      placeholder="e.g. 1002345892 (from GCash/Maya screen)"
                      className="w-full rounded-xl border border-ink-line bg-ink-950 px-3 py-1.5 text-xs font-mono text-slate-300 outline-none focus:border-brand-500 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 py-3 text-xs font-bold text-white shadow-lg shadow-brand-600/30 active:scale-95 transition"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Record &amp; Log Payment
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Bills Ledger with Search, Thermal Print, Manual Print & Delete */}
            <div className="2xl:col-span-7 space-y-4">
              <div className="card p-5 border border-ink-line bg-ink-900 rounded-2xl shadow-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-line/60 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-brand-400" />
                      Bills &amp; E-Load Transactions ({billRecords.length})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Print official thermal stubs, trigger manual print dialog, or void entries.
                    </p>
                  </div>
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={billSearchQuery}
                      onChange={(e) => setBillSearchQuery(e.target.value)}
                      placeholder="Search biller, account, ref..."
                      className="w-full rounded-xl border border-ink-line bg-ink-950 pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-brand-500 transition"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-ink-line text-slate-400 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Biller &amp; Account</th>
                        <th className="py-2.5 px-3">Wallet</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-right">Fee</th>
                        <th className="py-2.5 px-3 text-right">Total Cash</th>
                        <th className="py-2.5 px-3 text-center sticky right-0 z-10 bg-ink-900 border-l border-ink-line shadow-[-4px_0_8px_rgba(0,0,0,0.5)]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-line/50">
                      {billRecords.filter((b) =>
                        b.biller.toLowerCase().includes(billSearchQuery.toLowerCase()) ||
                        b.accountNo.toLowerCase().includes(billSearchQuery.toLowerCase()) ||
                        b.customerName.toLowerCase().includes(billSearchQuery.toLowerCase()) ||
                        b.referenceNo.toLowerCase().includes(billSearchQuery.toLowerCase())
                      ).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            No bills payment or E-load transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        billRecords
                          .filter((b) =>
                            b.biller.toLowerCase().includes(billSearchQuery.toLowerCase()) ||
                            b.accountNo.toLowerCase().includes(billSearchQuery.toLowerCase()) ||
                            b.customerName.toLowerCase().includes(billSearchQuery.toLowerCase()) ||
                            b.referenceNo.toLowerCase().includes(billSearchQuery.toLowerCase())
                          )
                          .map((b) => (
                            <tr key={b.id} className="hover:bg-ink-800/50 transition">
                              <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                                {new Date(b.createdAt).toLocaleString('en-PH', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <p className="font-bold text-white">{b.biller}</p>
                                <p className="text-[11px] font-mono text-brand-300">{b.accountNo}</p>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    b.sourceWallet === 'GCASH'
                                      ? 'bg-sky-500/20 text-sky-300'
                                      : b.sourceWallet === 'MAYA'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-orange-500/20 text-orange-300'
                                  }`}
                                >
                                  {b.sourceWallet}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums text-slate-200">
                                ₱{b.amount.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums text-emerald-400 font-semibold">
                                ₱{b.serviceFee.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums font-bold text-white">
                                ₱{(b.amount + b.serviceFee).toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-center sticky right-0 z-10 bg-ink-900 border-l border-ink-line shadow-[-4px_0_8px_rgba(0,0,0,0.3)]">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => void printBillReceipt(b, false)}
                                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-ink-800 transition"
                                    title="Thermal Print Receipt (Auto)"
                                  >
                                    <Printer className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void printBillReceipt(b, true)}
                                    className="px-1.5 py-1 text-[10px] font-bold text-slate-400 hover:text-white rounded-lg hover:bg-ink-800 border border-ink-line transition"
                                    title="Manual Print (System Dialog)"
                                  >
                                    Manual
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBill(b)}
                                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
                                    title="Delete Transaction"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Delete</span>
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
            </div>
          </div>
        </div>
      )}

      {/* Tab: Dedicated Transactions Ledger with Void/Delete & Filter */}
      {activeTab === 'transactions' && (
        <div className="card p-5 border border-ink-line bg-ink-900 rounded-2xl shadow-card space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink-line pb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-400" />
                E-Wallet Transactions Ledger & Management
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review complete Cash In / Out entries, search by reference or customer, reprint thermal slips, or void mistyped records.
              </p>
            </div>

            {/* Total summary chip */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                Total Fees Earned:{' '}
                <strong className="text-amber-400 font-bold">
                  ₱{((summary?.total_fees_c || 0) / 100).toFixed(2)}
                </strong>
              </span>
              <span className="rounded-full bg-ink-950 px-2.5 py-1 text-xs font-semibold text-slate-300 border border-ink-line">
                {filteredTransactions.length} of {transactions.length} records
              </span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder="Search reference #, customer name, phone, cashier..."
                className="w-full rounded-xl border border-ink-line bg-ink-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-brand-500 transition"
              />
              {txSearch && (
                <button
                  type="button"
                  onClick={() => setTxSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Channel Filter */}
              <div className="flex rounded-lg bg-ink-950 p-1 border border-ink-line text-xs font-semibold">
                {(['ALL', 'GCASH', 'MAYA', 'MARIBANK'] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setTxFilterChannel(ch)}
                    className={`px-2.5 py-1 rounded-md transition ${
                      txFilterChannel === ch
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {ch === 'ALL' ? 'All Channels' : ch}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <div className="flex rounded-lg bg-ink-950 p-1 border border-ink-line text-xs font-semibold">
                {(['ALL', 'CASH_IN', 'CASH_OUT'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTxFilterType(t)}
                    className={`px-2.5 py-1 rounded-md transition ${
                      txFilterType === t
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t === 'ALL' ? 'All Types' : t === 'CASH_IN' ? 'Cash In' : 'Cash Out'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto rounded-xl border border-ink-line bg-ink-950/60">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink-line bg-ink-950 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Date / Time</th>
                  <th className="py-2.5 px-3">Cashier</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Principal</th>
                  <th className="py-2.5 px-3 text-right">Fee</th>
                  <th className="py-2.5 px-3">Fee Paid Via</th>
                  <th className="py-2.5 px-3">Reference No</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-center sticky right-0 z-10 bg-ink-950 border-l border-ink-line shadow-[-4px_0_8px_rgba(0,0,0,0.5)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <Smartphone className="h-8 w-8 text-slate-600" />
                        <p className="font-semibold text-slate-400">No matching e-wallet transactions found</p>
                        <p className="text-[11px] text-slate-500">
                          Try adjusting your search query or channel filter above.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-ink-900/60 transition">
                      <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {tx.created_at}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-medium">
                        {tx.cashier_name || 'Cashier'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            tx.channel === 'GCASH'
                              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                              : tx.channel === 'MAYA'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                          }`}
                        >
                          <Smartphone className="h-3 w-3" />
                          {tx.channel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            tx.type === 'CASH_IN'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {tx.type === 'CASH_IN' ? (
                            <>
                              <ArrowDownLeft className="h-3 w-3" /> Cash In
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="h-3 w-3" /> Cash Out
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        ₱{(tx.amount_c / 100).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                        ₱{(tx.fee_c / 100).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {tx.fee_collected_via === 'WALLET' ? (
                          <span className="text-sky-400">Wallet</span>
                        ) : (
                          <span className="text-emerald-400">Cash Drawer</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                        {tx.reference_no ? (
                          <span className="rounded bg-ink-900 px-1.5 py-0.5 border border-ink-line">
                            {tx.reference_no}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {tx.customer_name ? (
                          <div>
                            <p className="font-semibold text-white">{tx.customer_name}</p>
                            {tx.customer_phone && (
                              <p className="text-[10px] text-slate-500 font-mono">{tx.customer_phone}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">Walk-in</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center sticky right-0 z-10 bg-ink-950 border-l border-ink-line shadow-[-4px_0_8px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void printEwalletReceipt(tx.id, false)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-ink-800 transition"
                            title="Print Thermal Slip (Auto)"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void printEwalletReceipt(tx.id, true)}
                            className="px-1.5 py-1 text-[10px] font-bold text-slate-400 hover:text-white rounded-lg hover:bg-ink-800 border border-ink-line transition"
                            title="Manual Print (System Dialog)"
                          >
                            Manual
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
                            title="Void / Delete Transaction"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Void</span>
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

      {/* Tab 2: Audit Sheet (Multi-Wallet & Cash) */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Today's Existing Audit Status Banner */}
          {todayAudit && (
            <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30 shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">
                      Audit Recorded for Today ({todayAudit.business_date})
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        todayAudit.cash_status === 'BALANCED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {todayAudit.cash_status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Cashier: <span className="text-slate-300 font-medium">{todayAudit.cashier_name || 'Cashier'}</span> · Fees Earned:{' '}
                    <span className="text-amber-400 font-bold">₱{(todayAudit.total_fees_c / 100).toFixed(2)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="px-3 py-1.5 rounded-xl border border-ink-line bg-ink-900 text-xs font-semibold text-slate-300 hover:text-white hover:bg-ink-800 transition"
                >
                  View in History
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteAudit(todayAudit)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition"
                  title="Delete today's saved audit to perform a fresh recount"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Saved Audit</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-5">
            {/* Box 1: Physical Cash Drawer Audit */}
            <div className="card p-5 border border-ink-line bg-ink-900 rounded-2xl shadow-card space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-400" />
                1. Physical Cash on Hand
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-slate-300 font-semibold">Expected Drawer Cash (₱)</label>
                    <span className="text-[10px] text-slate-500">Drawer Target</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">₱</span>
                    <input
                      type="number"
                      step="any"
                      value={expectedCashDrawerStr}
                      onChange={(e) => setExpectedCashDrawerStr(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-ink-line bg-ink-950 pl-7 pr-3 py-1.5 text-sm font-bold text-white outline-none focus:border-brand-500 transition"
                    />
                  </div>

                  {/* Quick Action Presets */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setExpectedCashDrawerStr('0.00')}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition"
                      title="Set expected cash to 0 (If store has separate e-wallet cash pouch or no onhand cash)"
                    >
                      ₱0.00 (Zero Float)
                    </button>
                    {posShiftExpectedCashStr !== '0' && (
                      <button
                        type="button"
                        onClick={() => setExpectedCashDrawerStr(posShiftExpectedCashStr)}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 transition"
                        title="Sync with current POS register cash balance"
                      >
                        POS Shift (₱{posShiftExpectedCashStr})
                      </button>
                    )}
                    {summary?.net_cash_drawer_delta_c !== 0 && (
                      <button
                        type="button"
                        onClick={() => setExpectedCashDrawerStr(((summary?.net_cash_drawer_delta_c || 0) / 100).toFixed(2))}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition"
                        title="Set expected cash to net e-wallet impact"
                      >
                        E-Wallet Net ({summary?.net_cash_drawer_delta_c! >= 0 ? '+' : ''}₱{((summary?.net_cash_drawer_delta_c || 0) / 100).toFixed(2)})
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    💡 Missing ₱{posShiftExpectedCashStr} cash on hand? Tap <span className="text-amber-400 font-semibold">&quot;₱0.00 (Zero Float)&quot;</span> or enter your drawer count.
                  </p>
                </div>

                <div className="flex justify-between text-xs pt-1">
                  <span className="text-slate-400">Actual Counted Cash:</span>
                  <span className="font-bold text-emerald-400">₱{(actualCashC / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-ink-line pt-2">
                  <span className="text-slate-400 font-semibold">Variance:</span>
                  <span
                    className={`font-black ${
                      cashDifferenceC === 0
                        ? 'text-emerald-400'
                        : cashDifferenceC > 0
                        ? 'text-sky-400'
                        : 'text-danger-400'
                    }`}
                  >
                    {cashDifferenceC > 0 ? '+' : ''}₱{(cashDifferenceC / 100).toFixed(2)} ({cashStatus})
                  </span>
                </div>
              </div>

              {/* Denomination Counter Collapse / List */}
              <div className="space-y-1.5 pt-2 border-t border-ink-line max-h-60 overflow-y-auto pr-1">
                <div className="flex items-center justify-between pb-1">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Denomination Breakdown</p>
                  <button
                    type="button"
                    onClick={() => setDenominations(new Array(CASH_COUNT_DENOMINATIONS.length).fill(0))}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-400 transition"
                    title="Reset all bills and coins to 0"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset to 0
                  </button>
                </div>
                {CASH_COUNT_DENOMINATIONS.map((d, i) => (
                  <div key={d.label + d.kind} className="flex items-center justify-between text-xs gap-2 py-0.5">
                    <span className="w-16 font-semibold text-slate-300">{d.label}</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations[i] || ''}
                      onChange={(e) => handleDenomChange(i, e.target.value)}
                      placeholder="0"
                      className="w-20 rounded border border-ink-line bg-ink-950 px-2 py-1 text-right text-xs text-white outline-none focus:border-brand-500"
                    />
                    <span className="w-20 text-right text-slate-400 text-[11px]">
                      ₱{(((denominations[i] || 0) * d.cents) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 2: GCash App Wallet Audit */}
            <div className="card p-5 border border-ink-line bg-ink-900 rounded-2xl shadow-card space-y-4">
              <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                2. GCash App Reconciliation
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Starting GCash Balance (₱)</label>
                  <input
                    type="number"
                    step="any"
                    value={startingGcashStr}
                    onChange={(e) => setStartingGcashStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full mt-1 rounded-xl border border-ink-line bg-ink-950 px-3 py-2 text-white font-bold outline-none focus:border-sky-500"
                  />
                </div>

                <div className="rounded-xl bg-ink-950 p-2.5 space-y-1 text-[11px] border border-ink-line">
                  <div className="flex justify-between">
                    <span className="text-slate-400">- Sent for Cash In:</span>
                    <span className="font-semibold text-danger-400">-₱{(gcashSentC / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">+ Received via Cash Out:</span>
                    <span className="font-semibold text-emerald-400">+₱{(gcashReceivedC / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-ink-line pt-1 font-bold">
                    <span className="text-slate-300">Expected GCash App:</span>
                    <span className="text-white">₱{(expectedGcashC / 100).toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Actual GCash App Balance (What phone shows)</label>
                  <input
                    type="number"
                    step="any"
                    value={actualGcashStr}
                    onChange={(e) => setActualGcashStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full mt-1 rounded-xl border border-sky-500/40 bg-ink-950 px-3 py-2 text-sky-300 font-black text-sm outline-none focus:border-sky-400"
                  />
                </div>

                <div className="flex justify-between text-xs border-t border-ink-line pt-2">
                  <span className="text-slate-400 font-semibold">GCash Variance:</span>
                  <span
                    className={`font-black ${
                      gcashDifferenceC === 0
                        ? 'text-emerald-400'
                        : gcashDifferenceC > 0
                        ? 'text-sky-400'
                        : 'text-danger-400'
                    }`}
                  >
                    {gcashDifferenceC > 0 ? '+' : ''}₱{(gcashDifferenceC / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 3: Maya App Wallet Audit */}
            <div className="card p-5 border border-ink-line bg-ink-900 rounded-2xl shadow-card space-y-4">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                3. Maya App Reconciliation
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Starting Maya Balance (₱)</label>
                  <input
                    type="number"
                    step="any"
                    value={startingMayaStr}
                    onChange={(e) => setStartingMayaStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full mt-1 rounded-xl border border-ink-line bg-ink-950 px-3 py-2 text-white font-bold outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="rounded-xl bg-ink-950 p-2.5 space-y-1 text-[11px] border border-ink-line">
                  <div className="flex justify-between">
                    <span className="text-slate-400">- Sent for Cash In:</span>
                    <span className="font-semibold text-danger-400">-₱{(mayaSentC / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">+ Received via Cash Out:</span>
                    <span className="font-semibold text-emerald-400">+₱{(mayaReceivedC / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-ink-line pt-1 font-bold">
                    <span className="text-slate-300">Expected Maya App:</span>
                    <span className="text-white">₱{(expectedMayaC / 100).toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Actual Maya App Balance (What phone shows)</label>
                  <input
                    type="number"
                    step="any"
                    value={actualMayaStr}
                    onChange={(e) => setActualMayaStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full mt-1 rounded-xl border border-emerald-500/40 bg-ink-950 px-3 py-2 text-emerald-300 font-black text-sm outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="flex justify-between text-xs border-t border-ink-line pt-2">
                  <span className="text-slate-400 font-semibold">Maya Variance:</span>
                  <span
                    className={`font-black ${
                      mayaDifferenceC === 0
                        ? 'text-emerald-400'
                        : mayaDifferenceC > 0
                        ? 'text-emerald-400'
                        : 'text-danger-400'
                    }`}
                  >
                    {mayaDifferenceC > 0 ? '+' : ''}₱{(mayaDifferenceC / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 4: MariBank App Wallet Audit */}
            <div className="card p-5 border border-ink-line bg-ink-900 rounded-2xl shadow-card space-y-4">
              <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                4. MariBank Reconciliation
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Starting MariBank Balance (₱)</label>
                  <input
                    type="number"
                    step="any"
                    value={startingMaribankStr}
                    onChange={(e) => setStartingMaribankStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full mt-1 rounded-xl border border-ink-line bg-ink-950 px-3 py-2 text-white font-bold outline-none focus:border-orange-500"
                  />
                </div>

                <div className="rounded-xl bg-ink-950 p-2.5 space-y-1 text-[11px] border border-ink-line">
                  <div className="flex justify-between">
                    <span className="text-slate-400">- Sent for Cash In:</span>
                    <span className="font-semibold text-danger-400">-₱{(maribankSentC / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">+ Received via Cash Out:</span>
                    <span className="font-semibold text-emerald-400">+₱{(maribankReceivedC / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-ink-line pt-1 font-bold">
                    <span className="text-slate-300">Expected MariBank:</span>
                    <span className="text-white">₱{(expectedMaribankC / 100).toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Actual MariBank Balance (Phone shows)</label>
                  <input
                    type="number"
                    step="any"
                    value={actualMaribankStr}
                    onChange={(e) => setActualMaribankStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full mt-1 rounded-xl border border-orange-500/40 bg-ink-950 px-3 py-2 text-orange-300 font-black text-sm outline-none focus:border-orange-400"
                  />
                </div>

                <div className="flex justify-between text-xs border-t border-ink-line pt-2">
                  <span className="text-slate-400 font-semibold">MariBank Variance:</span>
                  <span
                    className={`font-black ${
                      maribankDifferenceC === 0
                        ? 'text-emerald-400'
                        : maribankDifferenceC > 0
                        ? 'text-orange-400'
                        : 'text-danger-400'
                    }`}
                  >
                    {maribankDifferenceC > 0 ? '+' : ''}₱{(maribankDifferenceC / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Audit Actions */}
          <div className="card p-5 border border-ink-line bg-ink-900 rounded-2xl shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-amber-400" />
                Total Service Fees Earned: <span className="text-amber-400 font-black text-base">₱{((summary?.total_fees_c || 0) / 100).toFixed(2)}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Audits are saved to your ledger and can be printed or deleted in Audit History.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={handleResetAuditSheet}
                className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:text-white transition"
                title="Reset denominations and clear all counted amounts"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSaveAudit('NONE')}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 rounded-xl border border-ink-line bg-ink-950 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-ink-800 hover:text-white transition"
              >
                Save Only
              </button>
              <button
                type="button"
                onClick={() => void handleSaveAudit('MANUAL')}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-xs font-bold text-sky-300 hover:bg-sky-500/20 active:scale-95 transition"
                title="Save and open Windows System Print Dialog"
              >
                <Printer className="h-4 w-4" />
                Save &amp; Manual Print (Dialog)
              </button>
              <button
                type="button"
                onClick={() => void handleSaveAudit('AUTO')}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-500 active:scale-95 transition"
                title="Save and print directly to thermal receipt printer"
              >
                <Printer className="h-4 w-4" />
                Save &amp; Print (Thermal)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Audit History */}
      {activeTab === 'history' && (
        <div className="card p-5 border border-ink-line bg-ink-900 rounded-2xl shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="h-4 w-4 text-brand-400" />
              Previous E-Wallet &amp; Cash Audits ({audits.length})
            </h3>
            {audits.length > 0 && (
              <button
                type="button"
                onClick={() => setIsClearAuditsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-bold text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
                title="Clear all saved audit records"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All Audits</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink-line text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Cashier</th>
                  <th className="py-2.5 px-3 text-right">Cash Var</th>
                  <th className="py-2.5 px-3 text-right">GCash Var</th>
                  <th className="py-2.5 px-3 text-right">Maya Var</th>
                  <th className="py-2.5 px-3 text-right">MariBank Var</th>
                  <th className="py-2.5 px-3 text-right">Fees Earned</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line">
                {audits.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No previous audits found.
                    </td>
                  </tr>
                ) : (
                  audits.map((a) => (
                    <tr key={a.id} className="hover:bg-ink-950/50 transition">
                      <td className="py-2.5 px-3 font-medium text-white">{a.business_date}</td>
                      <td className="py-2.5 px-3 text-slate-300">{a.cashier_name || 'Cashier'}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                        ₱{(a.cash_difference_c / 100).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sky-400">
                        ₱{(a.gcash_difference_c / 100).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                        ₱{(a.maya_difference_c / 100).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-orange-400">
                        ₱{((a.maribank_difference_c || 0) / 100).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                        ₱{(a.total_fees_c / 100).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            a.cash_status === 'BALANCED'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-danger-500/15 text-danger-400'
                          }`}
                        >
                          {a.cash_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void printAuditRecord(a.id, false)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-ink-800 transition"
                            title="Auto Print (Thermal Report)"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void printAuditRecord(a.id, true)}
                            className="px-1.5 py-0.5 text-[10px] font-bold text-sky-400 hover:text-sky-300 rounded hover:bg-sky-500/10 border border-sky-500/30 transition"
                            title="Manual Print (System Print Dialog)"
                          >
                            Manual
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAudit(a)}
                            className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition"
                            title="Delete Audit Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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


      {/* Apple Design Void Transaction Confirmation Modal */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-ink-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Void E-Wallet Transaction</h3>
                <p className="text-xs text-slate-400">Permanently delete this entry from shift records</p>
              </div>
            </div>

            <div className="rounded-xl border border-ink-line bg-ink-950 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono text-slate-300">#{txToDelete.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Channel & Type:</span>
                <span className="font-semibold text-white">
                  {txToDelete.channel} · {txToDelete.type === 'CASH_IN' ? 'Cash In' : 'Cash Out'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Principal Amount:</span>
                <span className="font-bold text-white">₱{(txToDelete.amount_c / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Service Fee:</span>
                <span className="font-bold text-amber-400">₱{(txToDelete.fee_c / 100).toFixed(2)}</span>
              </div>
              {txToDelete.reference_no && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference No:</span>
                  <span className="font-mono text-slate-300">{txToDelete.reference_no}</span>
                </div>
              )}
              {txToDelete.customer_name && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="text-slate-300">{txToDelete.customer_name}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-rose-300/80 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
              ⚠️ Warning: This will immediately remove the transaction and update your shift totals and drawer balance.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setTxToDelete(null)}
                className="flex-1 rounded-xl border border-ink-line bg-ink-950 py-2.5 text-xs font-semibold text-slate-300 hover:bg-ink-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void confirmDeleteTransaction()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 active:scale-95 transition disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Voiding...' : 'Yes, Void & Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Void Bill Confirmation Modal */}
      {billToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/30 bg-ink-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="rounded-xl bg-rose-500/10 p-2.5 border border-rose-500/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Bills Payment</h3>
                <p className="text-[11px] text-slate-400">Confirm transaction removal</p>
              </div>
            </div>

            <div className="rounded-xl bg-ink-950 p-3.5 space-y-2 text-xs border border-ink-line">
              <div className="flex justify-between">
                <span className="text-slate-400">Biller & Service:</span>
                <span className="font-bold text-white">{billToDelete.biller}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account / Mobile #:</span>
                <span className="font-mono text-brand-300">{billToDelete.accountNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bill Amount:</span>
                <span className="font-bold text-white">₱{billToDelete.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Convenience Fee:</span>
                <span className="font-bold text-emerald-400">₱{billToDelete.serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Processed Via:</span>
                <span className="font-semibold text-slate-200">{billToDelete.sourceWallet} Business</span>
              </div>
            </div>

            <p className="text-[11px] text-rose-300/80 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
              ⚠️ Warning: This will permanently remove this record from your Bills Payment ledger.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBillToDelete(null)}
                className="flex-1 rounded-xl border border-ink-line bg-ink-950 py-2.5 text-xs font-semibold text-slate-300 hover:bg-ink-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteBill()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 active:scale-95 transition"
              >
                <Trash2 className="h-4 w-4" />
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apple Design Delete Audit Record Confirmation Modal */}
      {auditToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-ink-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Audit Record</h3>
                <p className="text-xs text-slate-400">Permanently delete this audit snapshot from history</p>
              </div>
            </div>

            <div className="rounded-xl border border-ink-line bg-ink-950 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Audit Date:</span>
                <span className="font-semibold text-white">{auditToDelete.business_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cashier:</span>
                <span className="text-slate-300">{auditToDelete.cashier_name || 'Cashier'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Drawer Cash Status:</span>
                <span
                  className={`font-bold ${
                    auditToDelete.cash_status === 'BALANCED' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {auditToDelete.cash_status} (₱{(auditToDelete.cash_difference_c / 100).toFixed(2)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GCash Variance:</span>
                <span className="font-mono text-sky-400">₱{(auditToDelete.gcash_difference_c / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Maya Variance:</span>
                <span className="font-mono text-emerald-400">₱{(auditToDelete.maya_difference_c / 100).toFixed(2)}</span>
              </div>
              {auditToDelete.maribank_difference_c != null && (
                <div className="flex justify-between">
                  <span className="text-slate-400">MariBank Variance:</span>
                  <span className="font-mono text-orange-400">
                    ₱{((auditToDelete.maribank_difference_c || 0) / 100).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-ink-line pt-2">
                <span className="text-slate-400 font-medium">Service Fees Earned:</span>
                <span className="font-bold text-amber-400">₱{(auditToDelete.total_fees_c / 100).toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[11px] text-rose-300/80 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
              ⚠️ Warning: This will permanently remove this audit snapshot from your accounting history. This action cannot be undone.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAuditToDelete(null)}
                disabled={isDeletingAudit}
                className="flex-1 rounded-xl border border-ink-line bg-ink-950 py-2.5 text-xs font-semibold text-slate-300 hover:bg-ink-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteAudit()}
                disabled={isDeletingAudit}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 active:scale-95 transition disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeletingAudit ? 'Deleting…' : 'Yes, Delete Audit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apple Design Clear All Audits Confirmation Modal */}
      {isClearAuditsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-ink-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Clear All Audit Records</h3>
                <p className="text-xs text-slate-400">Permanently delete all {audits.length} saved audit snapshots</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete all historical E-Wallet and cash audit snapshots? This will clear the entire audit ledger.
            </p>

            <p className="text-[11px] text-rose-300/80 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
              ⚠️ Warning: This action is permanent and cannot be reversed.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAuditsModalOpen(false)}
                disabled={isDeletingAudit}
                className="flex-1 rounded-xl border border-ink-line bg-ink-950 py-2.5 text-xs font-semibold text-slate-300 hover:bg-ink-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeletingAudit(true)
                  try {
                    await window.api.ewallet.clearAudits?.()
                    toast.success('Audits Cleared', 'All historical audit snapshots have been removed.')
                    setIsClearAuditsModalOpen(false)
                    void loadData()
                  } catch (err) {
                    toast.error('Failed to clear audits', (err as Error)?.message || String(err))
                  } finally {
                    setIsDeletingAudit(false)
                  }
                }}
                disabled={isDeletingAudit}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 active:scale-95 transition disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeletingAudit ? 'Clearing…' : 'Clear All Audits'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
