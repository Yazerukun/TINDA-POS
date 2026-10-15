import { useState, useMemo, useEffect } from 'react'
import {
  Printer,
  FileText,
  Receipt,
  Search,
  Users,
  Wallet,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react'
import { Modal } from './ui/Modal'
import { money, shortDateTime } from '@shared/format'
import { toastSuccess, toastError } from '../stores/toast'
import { useSettings } from '../stores/settings'
import { useAuth } from '../stores/auth'
import type { Customer, CreditLedgerEntry } from '@shared/types'
import { getMergedCustomerReminder, calculateReminderStatus } from '@shared/customerReminders'
import {
  formatUtangMasterLines,
  formatCustomerStatementLines,
  UtangMasterRow,
  CustomerStatementEntry
} from '@shared/receiptHtml'

export type UtangPrintMode = 'MASTER_LIST' | 'STATEMENT'
export type UtangPrintScope = 'WITH_BALANCE' | 'OVERDUE' | 'ALL'

interface UtangPrintModalProps {
  open: boolean
  onClose: () => void
  customers: Customer[]
  initialCustomer?: Customer | null
  initialMode?: UtangPrintMode
}

export function UtangPrintModal({
  open,
  onClose,
  customers,
  initialCustomer = null,
  initialMode = 'MASTER_LIST'
}: UtangPrintModalProps): React.JSX.Element | null {
  const { settings, load: loadSettings } = useSettings()
  const user = useAuth((s) => s.user)

  useEffect(() => {
    if (open && !settings) {
      void loadSettings()
    }
  }, [open, settings, loadSettings])

  const [mode, setMode] = useState<UtangPrintMode>(initialMode)
  const [scope, setScope] = useState<UtangPrintScope>('WITH_BALANCE')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    initialCustomer ? initialCustomer.id : null
  )
  const [selectedCustomerLedger, setSelectedCustomerLedger] = useState<CreditLedgerEntry[]>([])
  const [loadingLedger, setLoadingLedger] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [useSystemDialog, setUseSystemDialog] = useState(false)
  const [paperFormat, setPaperFormat] = useState<'DOCUMENT' | 'THERMAL'>('DOCUMENT')

  useEffect(() => {
    if (open) {
      setMode(initialMode)
      if (initialCustomer) {
        setSelectedCustomerId(initialCustomer.id)
      } else if (customers.length > 0 && selectedCustomerId === null) {
        const firstWithBalance = customers.find((c) => c.balance_c > 0) || customers[0]
        if (firstWithBalance) {
          setSelectedCustomerId(firstWithBalance.id)
        }
      }
    }
  }, [open, initialMode, initialCustomer, customers])

  // Fetch ledger when selected customer changes in Statement mode
  useEffect(() => {
    if (!open || !selectedCustomerId) return
    let active = true
    setLoadingLedger(true)
    window.api.customers
      .ledger(selectedCustomerId, { limit: 100 })
      .then((entries) => {
        if (active) setSelectedCustomerLedger(entries)
      })
      .catch((err) => {
        if (active) toastError('Ledger Load Failed', String(err))
      })
      .finally(() => {
        if (active) setLoadingLedger(false)
      })
    return () => {
      active = false
    }
  }, [open, selectedCustomerId])

  const effectiveStoreName = settings?.store_name || 'TINDA STORE'
  const storeAddress = settings?.address || ''
  const storePhone = settings?.phone || ''
  const storeTin = settings?.tin || ''
  const cashierName = user?.full_name || 'Store Cashier'

  // Master List Calculations
  const filteredCustomers = useMemo(() => {
    let list = customers
    if (scope === 'WITH_BALANCE') {
      list = list.filter((c) => c.balance_c > 0)
    } else if (scope === 'OVERDUE') {
      list = list.filter((c) => {
        if (c.balance_c <= 0) return false
        const { statusInfo } = getMergedCustomerReminder(c)
        return statusInfo.isAttentionRequired
      })
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((c) =>
        (c.full_name + ' ' + (c.nickname || '') + ' ' + (c.phone || '')).toLowerCase().includes(q)
      )
    }
    // Sort highest utang first
    return [...list].sort((a, b) => b.balance_c - a.balance_c)
  }, [customers, scope, searchQuery])

  // Total KPIs computed accurately in integer centavos
  const totalOutstandingC = useMemo(
    () => filteredCustomers.reduce((acc, c) => acc + (c.balance_c > 0 ? c.balance_c : 0), 0),
    [filteredCustomers]
  )
  const totalCreditLimitC = useMemo(
    () => filteredCustomers.reduce((acc, c) => acc + (c.credit_limit_c || 0), 0),
    [filteredCustomers]
  )
  const debtorsWithBalanceCount = useMemo(
    () => filteredCustomers.filter((c) => c.balance_c > 0).length,
    [filteredCustomers]
  )
  const overdueCount = useMemo(() => {
    return filteredCustomers.filter((c) => {
      if (c.balance_c <= 0) return false
      const { statusInfo } = getMergedCustomerReminder(c)
      return statusInfo.isAttentionRequired
    }).length
  }, [filteredCustomers])

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null
  }, [customers, selectedCustomerId])

  if (!open) return null

  // ── HTML Document Generator for A4 / Letter ──────────────────────────────
  const generateDocumentHtml = (): { title: string; html: string } => {
    const todayStr = new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })
    const timeStr = new Date().toLocaleTimeString('en-PH', { timeStyle: 'short' })

    if (mode === 'MASTER_LIST') {
      const scopeLabel =
        scope === 'WITH_BALANCE'
          ? 'Active Debtors with Balance'
          : scope === 'OVERDUE'
            ? 'Overdue & Due Today Accounts'
            : 'All Registered Credit Accounts'

      const rowsHtml = filteredCustomers
        .map((c, idx) => {
          const { reminder, statusInfo } = getMergedCustomerReminder(c)
          const statusBadge =
            c.balance_c <= 0
              ? '<span style="color:#059669; font-weight:700;">SETTLED</span>'
              : statusInfo.isAttentionRequired
                ? `<span style="color:#dc2626; font-weight:700;">${statusInfo.badgeText.toUpperCase()}</span>`
                : '<span style="color:#d97706; font-weight:700;">CURRENT</span>'

          const contact = [c.phone, c.nickname ? `(${c.nickname})` : null].filter(Boolean).join(' ')
          const dueNote = [
            reminder.due_date ? `Due: ${reminder.due_date}` : null,
            reminder.notes ? `"${reminder.notes}"` : null
          ]
            .filter(Boolean)
            .join(' — ')

          return `
            <tr>
              <td style="text-align:center;">${idx + 1}</td>
              <td>
                <strong>${c.full_name}</strong>
                ${contact ? `<br><small style="color:#555;">${contact}</small>` : ''}
                ${c.address ? `<br><small style="color:#777;">${c.address}</small>` : ''}
              </td>
              <td style="text-align:center;">${statusBadge}</td>
              <td style="text-align:right; font-family:monospace;">₱${(c.credit_limit_c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td style="text-align:right; font-family:monospace; font-weight:900; color:#b91c1c;">₱${(c.balance_c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td style="font-size:9px; color:#444;">${dueNote || '—'}</td>
            </tr>
          `
        })
        .join('')

      const title = 'Accounts Receivable Master Report'
      const html = `
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            @page { size: A4; margin: 12mm 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #111; margin: 0; padding: 0; font-size: 11px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 14px; }
            .store-name { font-size: 18px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; }
            .doc-title { font-size: 13px; font-weight: 800; color: #2563eb; margin-top: 3px; text-transform: uppercase; }
            .meta { text-align: right; font-size: 10px; color: #444; }
            .kpis { display: flex; gap: 10px; margin-bottom: 14px; }
            .kpi-card { flex: 1; border: 1px solid #ddd; background: #fafafa; border-radius: 6px; padding: 8px 10px; text-align: center; }
            .kpi-label { font-size: 9px; text-transform: uppercase; color: #666; font-weight: 700; margin-bottom: 2px; }
            .kpi-value { font-size: 15px; font-weight: 900; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
            th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 8px; text-transform: uppercase; font-size: 9px; font-weight: 800; color: #334155; }
            td { border: 1px solid #e2e8f0; padding: 6px 8px; vertical-align: middle; }
            .sign-area { margin-top: 36px; display: flex; justify-content: space-between; font-size: 10px; page-break-inside: avoid; }
            .sign-box { width: 220px; border-top: 1px solid #000; text-align: center; padding-top: 4px; line-height: 1.4; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="store-name">${effectiveStoreName}</div>
              ${storeAddress ? `<div style="font-size:10px; color:#555; margin-top:2px;">${storeAddress}</div>` : ''}
              ${storePhone || storeTin ? `<div style="font-size:10px; color:#555;">${[storePhone ? `Tel: ${storePhone}` : '', storeTin ? `TIN: ${storeTin}` : ''].filter(Boolean).join(' • ')}</div>` : ''}
              <div class="doc-title">${title}</div>
            </div>
            <div class="meta">
              <div><strong>Date:</strong> ${todayStr} • ${timeStr}</div>
              <div><strong>Generated By:</strong> ${cashierName}</div>
              <div style="font-weight:700; color:#111; margin-top:3px; background:#e2e8f0; padding:2px 6px; border-radius:4px; display:inline-block;">Filter: ${scopeLabel}</div>
            </div>
          </div>

          <div class="kpis">
            <div class="kpi-card" style="border-color:#fca5a5; background:#fff1f2;">
              <div class="kpi-label" style="color:#b91c1c;">Total Outstanding Utang</div>
              <div class="kpi-value" style="color:#b91c1c;">₱${(totalOutstandingC / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Active Debtors</div>
              <div class="kpi-value" style="color:#d97706;">${debtorsWithBalanceCount}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Overdue / Attention</div>
              <div class="kpi-value" style="color:#dc2626;">${overdueCount}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Credit Limit Extended</div>
              <div class="kpi-value" style="color:#334155;">₱${(totalCreditLimitC / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:25px;">#</th>
                <th>Debtor Customer Name & Details</th>
                <th style="width:75px; text-align:center;">Status</th>
                <th style="width:90px; text-align:right;">Credit Limit</th>
                <th style="width:105px; text-align:right;">Outstanding Utang</th>
                <th style="width:140px;">Due Date & Notes</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="6" style="text-align:center; padding:20px; color:#888;">No debtor records found.</td></tr>'}
            </tbody>
          </table>

          <div style="margin-top:14px; text-align:right; font-size:12px; font-weight:900;">
            Grand Total Accounts Receivable: ₱${(totalOutstandingC / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>

          <div class="sign-area">
            <div class="sign-box">Prepared By<br><strong>${cashierName}</strong><br><small style="color:#666;">(Cashier / Staff)</small></div>
            <div class="sign-box">Audited &amp; Approved By<br><br><small style="color:#666;">(Store Owner / Auditor Signature)</small></div>
          </div>
        </body>
        </html>
      `
      return { title, html }
    } else {
      // STATEMENT Mode for Selected Customer
      const cust = selectedCustomer
      if (!cust) return { title: 'Customer Statement', html: '<p>No customer selected</p>' }

      const { reminder } = getMergedCustomerReminder(cust)
      const availCreditC = Math.max(0, cust.credit_limit_c - cust.balance_c)

      const ledgerRowsHtml = selectedCustomerLedger
        .map((e, idx) => {
          const isDeduction = ['PAYMENT', 'REVERSAL', 'REFUND'].includes(e.entry_type) || e.amount_c < 0
          const sign = isDeduction ? '-' : '+'
          const typeColor = isDeduction ? '#059669' : '#b91c1c'
          return `
            <tr>
              <td style="text-align:center;">${idx + 1}</td>
              <td>${shortDateTime(e.created_at)}</td>
              <td style="font-weight:700;">${e.entry_type.replace(/_/g, ' ')}</td>
              <td>${e.notes || (e.reference_id ? `Ref #${e.reference_id}` : '—')}</td>
              <td style="text-align:right; font-family:monospace; font-weight:800; color:${typeColor};">
                ${sign}₱${(Math.abs(e.amount_c) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          `
        })
        .join('')

      const title = `Statement of Account — ${cust.full_name}`
      const html = `
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            @page { size: A4; margin: 12mm 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #111; margin: 0; padding: 0; font-size: 11px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 14px; }
            .store-name { font-size: 18px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; }
            .doc-title { font-size: 13px; font-weight: 800; color: #b91c1c; margin-top: 3px; text-transform: uppercase; }
            .cust-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; background: #f8fafc; display: flex; justify-content: space-between; }
            .kpis { display: flex; gap: 10px; margin-bottom: 14px; }
            .kpi-card { flex: 1; border: 1px solid #ddd; background: #fafafa; border-radius: 6px; padding: 8px 10px; text-align: center; }
            .kpi-label { font-size: 9px; text-transform: uppercase; color: #666; font-weight: 700; margin-bottom: 2px; }
            .kpi-value { font-size: 16px; font-weight: 900; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
            th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 8px; text-transform: uppercase; font-size: 9px; font-weight: 800; color: #334155; }
            td { border: 1px solid #e2e8f0; padding: 6px 8px; vertical-align: middle; }
            .sign-area { margin-top: 36px; display: flex; justify-content: space-between; font-size: 10px; page-break-inside: avoid; }
            .sign-box { width: 220px; border-top: 1px solid #000; text-align: center; padding-top: 4px; line-height: 1.4; }
            .promise-box { margin-top: 14px; border: 1px dashed #d97706; background: #fffbeb; padding: 8px 12px; border-radius: 6px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="store-name">${effectiveStoreName}</div>
              ${storeAddress ? `<div style="font-size:10px; color:#555; margin-top:2px;">${storeAddress}</div>` : ''}
              ${storePhone ? `<div style="font-size:10px; color:#555;">Tel: ${storePhone}</div>` : ''}
              <div class="doc-title">CUSTOMER STATEMENT OF ACCOUNT (UTANG BREAKDOWN)</div>
            </div>
            <div style="text-align:right; font-size:10px; color:#444;">
              <div><strong>Statement Date:</strong> ${todayStr}</div>
              <div><strong>Generated By:</strong> ${cashierName}</div>
            </div>
          </div>

          <div class="cust-card">
            <div>
              <div style="font-size:14px; font-weight:900;">${cust.full_name} ${cust.nickname ? `(${cust.nickname})` : ''}</div>
              ${cust.phone ? `<div><strong>Mobile:</strong> ${cust.phone}</div>` : ''}
              ${cust.address ? `<div><strong>Address:</strong> ${cust.address}</div>` : ''}
            </div>
            <div style="text-align:right;">
              <div><strong>Credit Limit:</strong> ₱${(cust.credit_limit_c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div><strong>Available Credit:</strong> ₱${(availCreditC / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div class="kpis">
            <div class="kpi-card" style="border-color:#fca5a5; background:#fff1f2;">
              <div class="kpi-label" style="color:#b91c1c;">Current Total Outstanding Utang</div>
              <div class="kpi-value" style="color:#b91c1c;">₱${(cust.balance_c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Credit Limit</div>
              <div class="kpi-value">₱${(cust.credit_limit_c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="kpi-card" style="border-color:#86efac; background:#f0fdf4;">
              <div class="kpi-label" style="color:#15803d;">Available Credit Limit</div>
              <div class="kpi-value" style="color:#15803d;">₱${(availCreditC / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          ${
            reminder.due_date || reminder.notes
              ? `<div class="promise-box">
                  <strong>Promised Due Date:</strong> ${reminder.due_date || 'Not specified'}<br>
                  ${reminder.notes ? `<strong>Payment Agreement Note:</strong> "${reminder.notes}"` : ''}
                </div>`
              : ''
          }

          <table>
            <thead>
              <tr>
                <th style="width:25px;">#</th>
                <th style="width:115px;">Date &amp; Time</th>
                <th style="width:95px;">Transaction Type</th>
                <th>Particulars / Notes</th>
                <th style="width:110px; text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${ledgerRowsHtml || '<tr><td colspan="5" style="text-align:center; padding:16px; color:#888;">No transaction history.</td></tr>'}
            </tbody>
          </table>

          <div style="margin-top:14px; text-align:right; font-size:13px; font-weight:900; color:#b91c1c;">
            Total Outstanding Balance Due: ₱${(cust.balance_c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>

          <div class="sign-area">
            <div class="sign-box">
              Customer Acknowledgment<br><br>
              <strong>${cust.full_name}</strong><br>
              <small style="color:#666;">(Signature Over Printed Name)</small>
            </div>
            <div class="sign-box">
              Verified &amp; Issued By<br>
              <strong>${cashierName}</strong><br>
              <small style="color:#666;">(Cashier / Store Representative)</small>
            </div>
          </div>
        </body>
        </html>
      `
      return { title, html }
    }
  }

  // ── Thermal Lines Generator for 58mm / 80mm ─────────────────────────────
  const generateThermalLines = (): string[] => {
    if (mode === 'MASTER_LIST') {
      const scopeLabel =
        scope === 'WITH_BALANCE'
          ? 'With Balance Only'
          : scope === 'OVERDUE'
            ? 'Overdue / Due Today'
            : 'All Accounts'

      const rows: UtangMasterRow[] = filteredCustomers.map((c) => {
        const { reminder, statusInfo } = getMergedCustomerReminder(c)
        return {
          fullName: c.full_name,
          nickname: c.nickname,
          phone: c.phone,
          balanceC: c.balance_c,
          creditLimitC: c.credit_limit_c,
          dueDate: reminder.due_date,
          statusText: statusInfo.isAttentionRequired ? statusInfo.badgeText : undefined,
          notes: reminder.notes
        }
      })

      return formatUtangMasterLines({
        storeName: effectiveStoreName,
        storeAddress,
        storePhone,
        storeTin,
        cashierName,
        filterSubtitle: scopeLabel,
        totalOutstandingC,
        totalDebtorsCount: debtorsWithBalanceCount,
        totalOverdueCount: overdueCount,
        totalCreditLimitC,
        rows
      })
    } else {
      const cust = selectedCustomer
      if (!cust) return ['No customer selected']
      const { reminder } = getMergedCustomerReminder(cust)
      const entries: CustomerStatementEntry[] = selectedCustomerLedger.map((e) => ({
        date: e.created_at,
        entryType: e.entry_type,
        referenceId: e.reference_id,
        amountC: e.amount_c,
        notes: e.notes
      }))

      return formatCustomerStatementLines({
        storeName: effectiveStoreName,
        storeAddress,
        storePhone,
        customerName: cust.full_name,
        nickname: cust.nickname,
        phone: cust.phone,
        address: cust.address,
        creditLimitC: cust.credit_limit_c,
        currentBalanceC: cust.balance_c,
        dueDate: reminder.due_date,
        reminderNotes: reminder.notes,
        entries
      })
    }
  }

  // ── Print Handler Execution ─────────────────────────────────────────────
  const handlePrint = async () => {
    setIsPrinting(true)
    try {
      if (paperFormat === 'DOCUMENT') {
        const { title, html } = generateDocumentHtml()
        if (window.api?.printer?.printDocument) {
          const res = await window.api.printer.printDocument(html, {
            manual: useSystemDialog,
            title,
            pageSize: 'A4'
          })
          if (res.ok) {
            toastSuccess(
              useSystemDialog ? 'Print Dialog Opened' : 'Document Printed',
              res.message || 'Utang report sent to printer.'
            )
            onClose()
          } else if (res.code !== 'DISABLED') {
            toastError('Print Failed', res.message)
          }
        } else {
          // Fallback browser window print
          const printWin = window.open('', '_blank', 'width=850,height=1000')
          if (printWin) {
            printWin.document.write(html)
            printWin.document.close()
            toastSuccess('Document Ready', `Opened ${title} for printing.`)
            onClose()
          } else {
            toastError('Print Blocked', 'Please allow popups to print documents.')
          }
        }
      } else {
        // THERMAL TAPE PRINT (58mm / 80mm)
        const lines = generateThermalLines()
        if (window.api?.printer?.printLines) {
          const res = await window.api.printer.printLines(lines, { manual: useSystemDialog })
          if (res.ok) {
            toastSuccess('Thermal Print Sent', 'Utang breakdown sent to thermal POS printer.')
            onClose()
          } else if (res.code !== 'DISABLED') {
            toastError('Thermal Print Failed', res.message)
          }
        } else {
          toastError('Printer Unavailable', 'Thermal printing interface is not accessible.')
        }
      }
    } catch (err) {
      toastError('Print Error', err instanceof Error ? err.message : String(err))
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Print Utang Report & Total Breakdown"
      maxWidth="max-w-4xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useSystemDialog}
              onChange={(e) => setUseSystemDialog(e.target.checked)}
              className="checkbox h-4 w-4 rounded border-slate-600 bg-ink-900 text-brand-500"
            />
            <span>Show System Print Dialog (Select Printer / Margins)</span>
          </label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handlePrint()}
              disabled={isPrinting || (mode === 'STATEMENT' && !selectedCustomer)}
              className="btn-primary flex items-center gap-2 px-5 py-2 font-bold"
            >
              <Printer className="h-4 w-4" />
              <span>
                {isPrinting
                  ? 'Printing…'
                  : paperFormat === 'DOCUMENT'
                    ? 'Print A4 Document'
                    : 'Print Thermal Tape'}
              </span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Mode Selector & Format Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-line bg-ink-950 p-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMode('MASTER_LIST')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                mode === 'MASTER_LIST'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-ink-800'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Master Utang List ({filteredCustomers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('STATEMENT')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                mode === 'STATEMENT'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-ink-800'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Customer Statement (SOA)</span>
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-ink-line pl-3">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Paper:</span>
            <button
              type="button"
              onClick={() => setPaperFormat('DOCUMENT')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                paperFormat === 'DOCUMENT'
                  ? 'bg-ink-700 text-white border border-brand-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-brand-400" />
              <span>A4 / Letter</span>
            </button>
            <button
              type="button"
              onClick={() => setPaperFormat('THERMAL')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                paperFormat === 'THERMAL'
                  ? 'bg-ink-700 text-white border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="h-3.5 w-3.5 text-amber-400" />
              <span>Thermal POS (58/80mm)</span>
            </button>
          </div>
        </div>

        {/* Master List Controls */}
        {mode === 'MASTER_LIST' ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setScope('WITH_BALANCE')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    scope === 'WITH_BALANCE'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-ink-900 text-slate-400 hover:text-white'
                  }`}
                >
                  With Balance Only ({customers.filter((c) => c.balance_c > 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setScope('OVERDUE')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    scope === 'OVERDUE'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-ink-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Overdue Only ({overdueCount})
                </button>
                <button
                  type="button"
                  onClick={() => setScope('ALL')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    scope === 'ALL'
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                      : 'bg-ink-900 text-slate-400 hover:text-white'
                  }`}
                >
                  All Registered ({customers.length})
                </button>
              </div>

              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name or mobile…"
                  className="input w-full pl-8 py-1 text-xs"
                />
              </div>
            </div>

            {/* Quick KPI Overview */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="card p-2.5 bg-ink-950 border border-rose-500/30">
                <p className="text-[10px] uppercase font-bold text-rose-400">Total Utang</p>
                <p className="mt-0.5 text-lg font-black font-mono text-rose-400">
                  {money(totalOutstandingC)}
                </p>
                <p className="text-[10px] text-slate-500">{debtorsWithBalanceCount} debtor(s)</p>
              </div>
              <div className="card p-2.5 bg-ink-950">
                <p className="text-[10px] uppercase font-bold text-amber-400">Overdue / Attention</p>
                <p className="mt-0.5 text-lg font-black font-mono text-amber-400">{overdueCount}</p>
                <p className="text-[10px] text-slate-500">Scheduled collections</p>
              </div>
              <div className="card p-2.5 bg-ink-950">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Credit Limit</p>
                <p className="mt-0.5 text-lg font-black font-mono text-slate-200">
                  {money(totalCreditLimitC)}
                </p>
                <p className="text-[10px] text-slate-500">Store credit ceiling</p>
              </div>
              <div className="card p-2.5 bg-ink-950">
                <p className="text-[10px] uppercase font-bold text-emerald-400">Settled Debtors</p>
                <p className="mt-0.5 text-lg font-black font-mono text-emerald-400">
                  {customers.filter((c) => c.balance_c === 0).length}
                </p>
                <p className="text-[10px] text-slate-500">Fully paid accounts</p>
              </div>
            </div>

            {/* Interactive Preview Table */}
            <div className="rounded-xl border border-ink-line overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-ink-900 text-slate-400 uppercase text-[10px] font-bold border-b border-ink-line">
                    <tr>
                      <th className="py-2 px-3">Debtor Name</th>
                      <th className="py-2 px-3 text-center">Contact</th>
                      <th className="py-2 px-3 text-right">Credit Limit</th>
                      <th className="py-2 px-3 text-right">Utang Balance</th>
                      <th className="py-2 px-3">Promise / Notes</th>
                      <th className="py-2 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-line bg-ink-950/60 font-medium">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No matching credit records found.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((c) => {
                        const { reminder, statusInfo } = getMergedCustomerReminder(c)
                        return (
                          <tr key={c.id} className="hover:bg-ink-850/60 transition-colors">
                            <td className="py-2 px-3">
                              <span className="font-bold text-white">{c.full_name}</span>
                              {c.nickname && (
                                <span className="ml-1 text-[11px] text-slate-400">({c.nickname})</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center text-slate-400">{c.phone || '—'}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-400">
                              {money(c.credit_limit_c)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-rose-400">
                              {money(c.balance_c)}
                            </td>
                            <td className="py-2 px-3 text-[11px] text-slate-400">
                              {statusInfo.isAttentionRequired ? (
                                <span className="text-rose-400 font-semibold mr-1">
                                  [{statusInfo.badgeText}]
                                </span>
                              ) : null}
                              {reminder.due_date ? `Due ${reminder.due_date} ` : ''}
                              {reminder.notes ? `• ${reminder.notes}` : ''}
                              {!reminder.due_date && !reminder.notes ? '—' : ''}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomerId(c.id)
                                  setMode('STATEMENT')
                                }}
                                className="text-[11px] text-brand-400 hover:text-brand-300 hover:underline"
                              >
                                View SOA
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Statement of Account Mode */
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-300">Select Customer:</label>
                <select
                  value={selectedCustomerId ?? ''}
                  onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                  className="input text-xs py-1 px-2.5 max-w-xs"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} {c.balance_c > 0 ? `(₱${(c.balance_c / 100).toFixed(2)})` : '(₱0.00)'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div className="text-xs text-slate-400">
                  <span>Balance: </span>
                  <span className="font-mono font-bold text-rose-400">
                    {money(selectedCustomer.balance_c)}
                  </span>
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div className="rounded-xl border border-ink-line bg-ink-950 p-3 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="card p-2 bg-ink-900 border border-rose-500/20">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Current Utang</p>
                    <p className="text-base font-black font-mono text-rose-400">
                      {money(selectedCustomer.balance_c)}
                    </p>
                  </div>
                  <div className="card p-2 bg-ink-900">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Credit Limit</p>
                    <p className="text-base font-black font-mono text-slate-200">
                      {money(selectedCustomer.credit_limit_c)}
                    </p>
                  </div>
                  <div className="card p-2 bg-ink-900 border border-emerald-500/20">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Available Credit</p>
                    <p className="text-base font-black font-mono text-emerald-400">
                      {money(Math.max(0, selectedCustomer.credit_limit_c - selectedCustomer.balance_c))}
                    </p>
                  </div>
                </div>

                {/* Ledger preview */}
                <div className="max-h-56 overflow-y-auto rounded-lg border border-ink-line">
                  {loadingLedger ? (
                    <div className="p-6 text-center text-xs text-slate-400">Loading ledger…</div>
                  ) : selectedCustomerLedger.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">No ledger activity found.</div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-ink-900 text-slate-400 uppercase text-[10px] font-bold border-b border-ink-line">
                        <tr>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Transaction</th>
                          <th className="py-2 px-3">Particulars</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-line bg-ink-950 font-medium">
                        {selectedCustomerLedger.map((e) => {
                          const isDeduction =
                            ['PAYMENT', 'REVERSAL', 'REFUND'].includes(e.entry_type) || e.amount_c < 0
                          return (
                            <tr key={e.id} className="hover:bg-ink-850/50">
                              <td className="py-2 px-3 text-slate-400">{shortDateTime(e.created_at)}</td>
                              <td className="py-2 px-3 text-white font-semibold">
                                {e.entry_type.replace(/_/g, ' ')}
                              </td>
                              <td className="py-2 px-3 text-slate-300 text-[11px] max-w-xs truncate">
                                {e.notes || (e.reference_id ? `Receipt #${e.reference_id}` : '—')}
                              </td>
                              <td
                                className={`py-2 px-3 text-right font-mono font-bold ${
                                  isDeduction ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isDeduction ? '-' : '+'}
                                {money(e.amount_c)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
