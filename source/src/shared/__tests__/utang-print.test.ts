import { describe, expect, it } from 'vitest'
import {
  formatUtangMasterLines,
  formatCustomerStatementLines,
  UtangMasterPrintPayload,
  CustomerStatementPrintPayload
} from '../receiptHtml'

describe('Utang Print & Total Breakdown Formatters (VIP Client Feedback)', () => {
  it('formats master utang receivables report lines correctly with mathematical precision', () => {
    const payload: UtangMasterPrintPayload = {
      storeName: 'ALING NENA SARI-SARI STORE',
      storeAddress: '123 Barangay San Isidro',
      storePhone: '0917-123-4567',
      storeTin: '123-456-789-000',
      cashierName: 'Maria Santos',
      filterSubtitle: 'Active Debtors with Balance',
      totalOutstandingC: 1545075, // ₱15,450.75
      totalDebtorsCount: 3,
      totalOverdueCount: 1,
      totalCreditLimitC: 3000000, // ₱30,000.00
      rows: [
        {
          fullName: 'Juan Dela Cruz',
          nickname: 'Mang Juan',
          phone: '0918-111-2222',
          balanceC: 845050, // ₱8,450.50
          creditLimitC: 1000000,
          dueDate: '2026-10-20',
          statusText: 'DUE SOON',
          notes: 'Will pay on payday'
        },
        {
          fullName: 'Pedro Penduko',
          phone: '0919-333-4444',
          balanceC: 500025, // ₱5,000.25
          creditLimitC: 1000000,
          dueDate: '2026-10-10',
          statusText: 'OVERDUE',
          notes: 'Promised last week'
        },
        {
          fullName: 'Maria Makiling',
          balanceC: 200000, // ₱2,000.00
          creditLimitC: 1000000
        }
      ]
    }

    const lines = formatUtangMasterLines(payload)

    expect(lines).toContain('ALING NENA SARI-SARI STORE')
    expect(lines).toContain('ACCOUNTS RECEIVABLE MASTER REPORT')
    expect(lines).toContain('UTANG SUMMARY & BREAKDOWN')
    expect(lines).toContain('TOTAL RECEIVABLES P15450.75')
    expect(lines).toContain('Total Debtors      3 Accounts')
    expect(lines).toContain('Overdue Accounts   1')
    expect(lines).toContain('Credit Extended   P30000.00')

    // Verify debtor rows
    expect(lines.some((l) => l.includes('1. Juan Dela Cruz (Mang Juan)'))).toBe(true)
    expect(lines.some((l) => l.includes('Balance: P8450.50 / P10000.00 [DUE SOON]'))).toBe(true)
    expect(lines.some((l) => l.includes('Due: 2026-10-20'))).toBe(true)
    expect(lines.some((l) => l.includes('Note: Will pay on payday'))).toBe(true)

    expect(lines.some((l) => l.includes('2. Pedro Penduko'))).toBe(true)
    expect(lines.some((l) => l.includes('Balance: P5000.25 / P10000.00 [OVERDUE]'))).toBe(true)

    // Verify grand total and audit footer
    expect(lines).toContain('GRAND TOTAL: P15450.75')
    expect(lines).toContain('Official Accounting Record')
  })

  it('handles empty debtors list gracefully without error', () => {
    const payload: UtangMasterPrintPayload = {
      storeName: 'KAPITBAHAY STORE',
      totalOutstandingC: 0,
      totalDebtorsCount: 0,
      totalOverdueCount: 0,
      totalCreditLimitC: 0,
      rows: []
    }

    const lines = formatUtangMasterLines(payload)
    expect(lines).toContain('No accounts found for selected filter.')
    expect(lines).toContain('GRAND TOTAL: P0.00')
  })

  it('formats customer individual statement of account (SOA) with itemized transactions', () => {
    const payload: CustomerStatementPrintPayload = {
      storeName: 'TINDA STORE BULACAN',
      storeAddress: 'Poblacion, Malolos City',
      storePhone: '0922-999-8888',
      customerName: 'Rosenda Flores',
      nickname: 'Ate Rose',
      phone: '0917-888-7777',
      address: 'Block 4 Lot 12 Villa San Jose',
      creditLimitC: 500000, // ₱5,000.00
      currentBalanceC: 235050, // ₱2,350.50
      dueDate: '2026-10-31',
      reminderNotes: 'Pay after 15th cutoff',
      entries: [
        {
          date: '2026-10-01T10:00:00Z',
          entryType: 'CREDIT_SALE',
          referenceId: 101,
          amountC: 300050,
          runningBalanceC: 300050,
          notes: 'Grocery supplies on utang'
        },
        {
          date: '2026-10-05T14:30:00Z',
          entryType: 'PAYMENT',
          referenceId: null,
          amountC: -65000,
          runningBalanceC: 235050,
          notes: 'Partial cash payment'
        }
      ]
    }

    const lines = formatCustomerStatementLines(payload)

    expect(lines).toContain('TINDA STORE BULACAN')
    expect(lines).toContain('STATEMENT OF ACCOUNT (SOA)')
    expect(lines).toContain('CUSTOMER UTANG LEDGER BREAKDOWN')
    expect(lines).toContain('Customer: Rosenda Flores (Ate Rose)')
    expect(lines).toContain('Mobile:   0917-888-7777')
    expect(lines).toContain('Address:  Block 4 Lot 12 Villa San Jose')
    expect(lines).toContain('Credit Limit:    P5000.00')
    expect(lines).toContain('Current Balance: P2350.50')
    expect(lines).toContain('Available Credit: P2649.50')
    expect(lines).toContain('Promise Due:     2026-10-31')
    expect(lines).toContain('Promise Note:    Pay after 15th cutoff')

    // Verify transaction breakdown
    expect(lines.some((l) => l.includes('CREDIT SALE'))).toBe(true)
    expect(lines.some((l) => l.includes('Amount: +P3000.50'))).toBe(true)
    expect(lines.some((l) => l.includes('PAYMENT'))).toBe(true)
    expect(lines.some((l) => l.includes('Amount: -P-650.00') || l.includes('Amount: P-650.00') || l.includes('Amount: -P650.00'))).toBe(true)

    // Verify Promissory signature line
    expect(lines).toContain('TOTAL OUTSTANDING: P2350.50')
    expect(lines.some((l) => l.includes('Customer Signature:'))).toBe(true)
  })
})
