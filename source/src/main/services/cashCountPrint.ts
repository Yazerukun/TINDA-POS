import type { StoreSettings } from '@shared/types'

export interface CashCountPrintData {
  id: number
  shift_id: number
  business_date: string
  cashier_name: string
  starting_cash_c: number
  expected_cash_c: number
  actual_cash_c: number
  difference_c: number
  status: string
  denominations: number[]
  notes: string | null
  created_at: string
}

export const CASH_COUNT_DENOMINATIONS = [100000, 50000, 20000, 10000, 5000, 2000, 2000, 1000, 500, 100, 25]
export const CASH_COUNT_LABELS = ['1,000', '500', '200', '100', '50', '20', '20', '10', '5', '1', '0.25']

function moneyPad(c: number): string {
  return `₱${(c / 100).toFixed(2)}`
}

/**
 * Builds printable lines for a SAVED cash count. Every number comes from the
 * stored record — reprints never recalculate against live shift data.
 */
export function cashCountLines(settings: StoreSettings, r: CashCountPrintData): string[] {
  const notes = r.notes?.trim()
  const denominationLines = r.denominations.map((qty, i) => {
    const label = `₱${CASH_COUNT_LABELS[i] ?? '?'}`
    const amount = qty * (CASH_COUNT_DENOMINATIONS[i] ?? 0)
    return `${label.padEnd(8)}${String(qty).padStart(4)}${moneyPad(amount).padStart(11)}`
  })
  const lines = [
    settings.store_name || 'TINDA POS',
    'CASH COUNT',
    '--------------------------------',
    `Date: ${r.created_at}`,
    `Business Date: ${r.business_date}`,
    `Shift: ${r.shift_id}`,
    `Cashier: ${r.cashier_name}`,
    '--------------------------------',
    'Denomination    Qty   Amount',
    ...denominationLines,
    '--------------------------------',
    `Starting Cash ${moneyPad(r.starting_cash_c)}`,
    `Expected Cash ${moneyPad(r.expected_cash_c)}`,
    `Actual Cash   ${moneyPad(r.actual_cash_c)}`,
    `Difference    ${moneyPad(r.difference_c)}`,
    `STATUS: ${r.status}`,
    '--------------------------------',
    ...(notes ? [`Notes: ${notes}`, ''] : ['']),
    `Prepared by: ${r.cashier_name}`
  ]
  return lines
}