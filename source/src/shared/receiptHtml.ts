// Pure, dependency-free receipt HTML builder shared by:
//  - src/main/services/printing.ts (silent webContents.print path)
//  - the renderer ReceiptPaper preview (Settings / POS / Transactions)
// Keeping it in one place guarantees the on-screen preview matches the printed
// output exactly. All user text is escaped before it reaches the DOM.
//
// Thermal printing rules enforced here:
//  - pure black-on-white, no backgrounds, no gradients, high contrast
//  - zero page margin + exact paper width, Chromium never adds headers/footers
//  - long product names wrap instead of clipping
//  - totals/SUKLI keep a strong hierarchy without relying on gray text

export type ReceiptWidth = '58mm' | '80mm'

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]!)
}

const CURRENCY_SYMBOLS: Record<string, string> = { PHP: '₱', PESO: '₱' }

export function currencySymbol(currency?: string): string {
  if (!currency) return ''
  const key = currency.trim().toUpperCase()
  return CURRENCY_SYMBOLS[key] ?? `${currency.trim()} `
}

function isSeparator(raw: string): boolean {
  const t = raw.trim()
  return t.length >= 3 && /^-+$/.test(t)
}

function isMoneyLine(raw: string): { label: string; amount: string } | null {
  const m = raw.trim().match(/^(Subtotal|Discounts?|TOTAL|TOTAL PAYMENTS|Total Payments|Cash|Change|SUKLI|Gross Sales|Refunds|Cash Refunds|Voids|NET SALES|GCash|Maya|Utang|Expenses|Expected Cash|Actual Cash|Difference|Starting Cash|Cash In|Cash Out)\s+(-?\d[\d,]*(?:\.\d+)?)$/i)
  if (!m) return null
  return { label: m[1]!.replace(/^./, (c) => c.toUpperCase()), amount: m[2]! }
}


// buildReceiptLines emits one plain name row followed by a detail row:
// "  <qty> x <unit price>        <amount>"
function isItemDetail(raw: string): { qty: string; unitPrice: string; amount: string } | null {
  const m = raw.trim().match(/^(\d+(?:\.\d+)?)\s+x\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/)
  if (!m) return null
  return { qty: m[1]!, unitPrice: m[2]!, amount: m[3]! }
}

const fmt = (raw: string) => {
  const clean = raw.replaceAll(',', '')
  const n = Number(clean) || 0
  return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: raw.includes(',') })
}

function fmtSigned(raw: string, symbol: string): string {
  const clean = raw.replaceAll(',', '')
  const n = Number(clean) || 0
  const formatted = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: raw.includes(',')
  })
  if (n < 0) return `-${symbol}${formatted}`
  return `${symbol}${formatted}`
}

function rowsToHtml(lines: string[], currency: string): string {
  const symbol = currencySymbol(currency)
  const out: string[] = []
  let seenSeparator = false

  const pushRow = (html: string): void => { out.push(html) }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? ''
    const trimmed = raw.trim()

    const denomination = trimmed.match(/^(₱[\d,.]+)\s+(\d+)\s+x\s+([\d,.]+)\s+=\s+([\d,.]+)$/)
    if (denomination) {
      const denomRaw = denomination[1]!
      const denomNum = Number(denomRaw.replace(/[^\d.]/g, ''))
      const denomLabel = denomRaw.startsWith('₱') && !Number.isNaN(denomNum)
        ? `₱${denomNum.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
        : denomRaw
      pushRow(
        `<div class="tp-denomline">` +
        `<span class="tp-denom">${escapeHtml(denomLabel)}</span>` +
        `<span class="tp-qty">&times;&nbsp;${escapeHtml(denomination[2]!)}</span>` +
        `<span class="tp-amt">${symbol}${fmt(denomination[4]!)}</span>` +
        `</div>`
      )
      continue
    }

    if (isSeparator(raw)) {
      seenSeparator = true
      pushRow('<div class="tp-sep"></div>')
      continue
    }

    // Item rows: product name line + its qty/price/amount detail line.
    const detail = isItemDetail(raw)
    if (detail) continue // handled together with the preceding name row
    const next = lines[i + 1]
    if (next !== undefined && isItemDetail(next)) {
      const d = isItemDetail(next)!
      pushRow(
        `<div class="tp-item"><div class="tp-name">${escapeHtml(raw)}</div>` +
        `<div class="tp-itemline"><span class="tp-qty">${escapeHtml(d.qty)} x ${fmt(d.unitPrice)}</span><span class="tp-amt">${fmt(d.amount)}</span></div></div>`
      )
      i++ // consume the detail line
      continue
    }

    const money = isMoneyLine(raw)
    if (money) {
      const cls = /^(SUKLI|Change)$/i.test(money.label) ? 'tp-sukli' : /^(TOTAL|TOTAL PAYMENTS|Total Payments|NET SALES|Actual Cash)$/i.test(money.label) ? 'tp-total' : 'tp-sum'
      const label = /^(SUKLI|Change)$/i.test(money.label) ? 'Change' : money.label === 'Cash' ? 'Cash' : money.label
      pushRow(
        `<div class="${cls}"><span class="tp-lbl">${escapeHtml(label)}</span><span class="tp-amt">${fmtSigned(money.amount, symbol)}</span></div>`
      )
      continue
    }


    const statusMatch = trimmed.match(/^Status[:\s]+(BALANCED|OVER|SHORT)$/i)
    if (statusMatch) {
      const statusText = statusMatch[1]!.toUpperCase()
      pushRow(
        `<div class="tp-sum tp-status" data-status="${escapeHtml(statusText)}"><!-- ${escapeHtml(raw)} --><span class="tp-lbl">Status</span><span class="tp-amt tp-badge-status tp-status-${statusText.toLowerCase()}">${escapeHtml(statusText)}</span></div>`
      )
      continue
    }

    const countMatch = trimmed.match(/^(Transactions|Items)\s*[:\s]\s*(\d+)$/i)
    if (countMatch) {
      pushRow(
        `<div class="tp-sum"><span class="tp-lbl">${escapeHtml(countMatch[1]!)}</span><span class="tp-amt">${escapeHtml(countMatch[2]!)}</span></div>`
      )
      continue
    }

    if (/^(DENOMINATION BREAKDOWN|BILLS:|COINS:|SALES SUMMARY|PAYMENT BREAKDOWN|CASH RECONCILIATION)$/i.test(trimmed)) {
      const isSub = /^(BILLS:|COINS:)$/i.test(trimmed)
      pushRow(`<div class="tp-section-head${isSub ? ' tp-sub' : ''}">${escapeHtml(trimmed)}</div>`)
      continue
    }

    if (trimmed === '') {
      pushRow('<div class="tp-gap"></div>')
      continue
    }

    // Brand/header block (before the first separator) is centered; transaction
    // info, cashier, customer, payment method lines, footer stay left-aligned.
    // Community branding tag [ Powered by TINDA POS Free Community ] is centered.
    const isCommunityTag = trimmed.startsWith('[') && trimmed.endsWith(']')
    const cls = isCommunityTag ? 'tp-row tp-center tp-community-tag' : (seenSeparator ? 'tp-row' : `tp-row tp-center${i === 0 ? ' tp-heading' : ''}`)
    pushRow(`<div class="${cls}">${escapeHtml(raw)}</div>`)
  }
  return out.join('\n')
}

const baseCss = `
  .tp-sheet { margin: 0 auto; box-sizing: border-box; background: white; color: black; font-weight: 600; }
  .tp-sheet * { box-sizing: border-box; }
  .tp-community-tag { font-size: 0.85em; font-weight: 600; letter-spacing: 0.04em; margin-top: 0.4em; }
  .tp-sheet { font-family: Consolas, "Courier New", "Lucida Console", monospace; line-height: 1.25; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
  .tp-row { font-size: 1em; }
  .tp-center { text-align: center; }
  .tp-heading { font-size: 1.25em; font-weight: 900; }
  .tp-item, .tp-sum, .tp-total, .tp-sukli, .tp-denomline { break-inside: avoid; }
  .tp-gap { height: 0.25em; }
  .tp-sep { border-top: 2px dashed black; margin: 0.2em 0; }
  .tp-section-head { font-size: 0.95em; font-weight: 800; text-transform: uppercase; margin-top: 0.2em; letter-spacing: 0.03em; }
  .tp-section-head.tp-sub { font-size: 0.88em; font-weight: 700; margin-top: 0.15em; color: #000; }
  .tp-item { margin-bottom: 0.15em; }
  .tp-item .tp-name { font-size: 0.95em; font-weight: 700; }
  .tp-itemline { display: flex; justify-content: space-between; align-items: baseline; width: 100%; gap: 4px; overflow: visible; }
  .tp-qty { font-size: 0.9em; white-space: nowrap; font-weight: 600; shrink: 0; }
  .tp-amt { font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; font-weight: 700; padding-right: 1px; }
  .tp-item .tp-amt, .tp-sum .tp-amt { font-weight: 800; }
  .tp-sum, .tp-total, .tp-sukli { display: flex; justify-content: space-between; align-items: baseline; width: 100%; gap: 4px; overflow: visible; }
  .tp-lbl { flex: 1; min-width: 0; }
  .tp-sum { font-size: 0.95em; margin: 0.08em 0; }
  .tp-total { font-size: 1.15em; font-weight: 900; border-top: 3px double black; border-bottom: 3px double black; margin-top: 0.2em; padding: 0.18em 0; }
  .tp-total .tp-amt { font-weight: 900; text-align: right; padding-right: 1px; }
  .tp-sukli { font-size: 1.05em; font-weight: 900; margin-top: 0.1em; padding: 0.08em 0; }
  .tp-sukli .tp-lbl, .tp-sukli .tp-amt { font-weight: 900; }
  .tp-sukli .tp-amt { text-align: right; padding-right: 1px; }
  .tp-denomline { display: table; width: 100%; table-layout: fixed; font-size: 0.9em; line-height: 1.25; }
  .tp-denom { display: table-cell; text-align: left; width: 34%; white-space: nowrap; font-weight: 700; }
  .tp-denomline .tp-qty { display: table-cell; text-align: center; width: 26%; white-space: nowrap; font-variant-numeric: tabular-nums; font-weight: 600; }
  .tp-denomline .tp-amt { display: table-cell; text-align: right; width: 40%; white-space: nowrap; font-variant-numeric: tabular-nums; font-weight: 800; padding-right: 1px; }
  .tp-badge-status { font-weight: 900; letter-spacing: 0.05em; }
  .tp-status-balanced { color: #000; }
  .tp-status-over { color: #000; }
  .tp-status-short { color: #000; }
`
export function receiptCss(width: ReceiptWidth): string {
  const paperWidth = width === '80mm' ? '80mm' : '58mm'
  const contentWidth = width === '80mm' ? '72mm' : '48mm'
  const fontSize = width === '80mm' ? '12px' : '11px'
  return `
    ${baseCss}
    @page { size: ${paperWidth} auto; margin: 0; }
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        -webkit-font-smoothing: none !important;
        -moz-osx-font-smoothing: grayscale !important;
        font-smooth: never !important;
        text-rendering: geometricPrecision !important;
      }
      * {
        color: #000000 !important;
        border-color: #000000 !important;
        -webkit-font-smoothing: none !important;
        text-rendering: geometricPrecision !important;
        text-shadow: none !important;
        box-shadow: none !important;
      }
      .tp-sheet {
        width: ${contentWidth} !important;
        margin: 0 auto !important;
        padding: 0.5mm 0 3mm !important;
        font-weight: 700 !important;
        letter-spacing: 0.01em !important;
      }
      .tp-heading {
        font-size: 1.25em !important;
        font-weight: 900 !important;
      }
      .tp-total {
        border-top: 3px solid #000000 !important;
        border-bottom: 3px solid #000000 !important;
        font-weight: 900 !important;
      }
      .tp-sep {
        border-top: 2px dashed #000000 !important;
      }
    }
    .tp-sheet { width: ${contentWidth}; padding: 1mm 0 4mm; font-size: ${fontSize}; }
  `
}

export function receiptBodyHtml(lines: string[], width: ReceiptWidth, currency = ''): string {
  return `<div class="tp-sheet">${rowsToHtml(lines, currency)}</div>`
}

export function receiptHtml(lines: string[], width: ReceiptWidth, currency = ''): string {
  const docReset = 'html, body { margin: 0; padding: 0; background: white; color: black; }'
  return `<!doctype html><html><head><meta charset="utf-8"><style>${docReset}${receiptCss(width)}</style></head><body>${receiptBodyHtml(lines, width, currency)}</body></html>`
}

export function formatEwalletSlipLines(
  tx: import('./types').EwalletTransactionRecord,
  storeName?: string | null
): string[] {
  const money = (cents: number): string => (cents / 100).toFixed(2)
  const isCashIn = tx.type === 'CASH_IN'
  const lines: string[] = [
    storeName || 'TINDA POS',
    `E-WALLET ${tx.channel} SLIP`,
    '--------------------------------',
    `Transaction: ${isCashIn ? 'CASH IN' : 'CASH OUT'}`,
    `Channel: ${tx.channel}`,
    `Date: ${tx.created_at}`,
    `Reference: ${tx.reference_no || 'N/A'}`
  ]
  if (tx.customer_name) lines.push(`Customer: ${tx.customer_name}`)
  if (tx.customer_phone) lines.push(`Mobile: ${tx.customer_phone}`)
  if (tx.cashier_name) lines.push(`Cashier: ${tx.cashier_name}`)
  lines.push('--------------------------------')
  lines.push(`Amount         ${money(tx.amount_c)}`)
  lines.push(`Service Fee    ${money(tx.fee_c)}`)
  const totalReceivedOrGiven = isCashIn
    ? tx.amount_c + (tx.fee_collected_via === 'CASH' ? tx.fee_c : 0)
    : tx.amount_c - (tx.fee_collected_via === 'CASH' ? tx.fee_c : 0)
  lines.push('--------------------------------')
  lines.push(`TOTAL ${isCashIn ? 'CASH RECEIVED' : 'CASH RELEASED'}  ${money(totalReceivedOrGiven)}`)
  lines.push('--------------------------------')
  lines.push('Thank you for choosing us!')
  lines.push('Please retain this slip for your proof.')
  return lines
}

export function formatEwalletAuditLines(
  a: import('./types').EwalletAuditRecord,
  storeName?: string | null
): string[] {
  const money = (cents: number): string => (cents / 100).toFixed(2)
  const lines: string[] = [
    storeName || 'TINDA POS',
    'E-WALLET & CASH AUDIT REPORT',
    '--------------------------------',
    `Date: ${a.business_date}`,
    `Shift: ${a.shift_id ?? 'N/A'}`,
    `Cashier: ${a.cashier_name || 'Store Cashier'}`,
    '--------------------------------',
    'PHYSICAL CASH DRAWER',
    `Expected Cash  ${money(a.expected_cash_c)}`,
    `Actual Cash    ${money(a.actual_cash_c)}`,
    `Difference     ${money(a.cash_difference_c)}`,
    `Status         ${a.cash_status}`,
    '--------------------------------',
    'GCASH WALLET AUDIT',
    `Starting GCash ${money(a.starting_gcash_c)}`,
    `Cash In (Sent) ${money(a.gcash_in_c)}`,
    `Cash Out (Rcvd) ${money(a.gcash_out_c)}`,
    `Expected GCash ${money(a.expected_gcash_c)}`,
    `Actual GCash   ${money(a.actual_gcash_c)}`,
    `Difference     ${money(a.gcash_difference_c)}`,
    '--------------------------------',
    'MAYA WALLET AUDIT',
    `Starting Maya  ${money(a.starting_maya_c)}`,
    `Cash In (Sent) ${money(a.maya_in_c)}`,
    `Cash Out (Rcvd) ${money(a.maya_out_c)}`,
    `Expected Maya  ${money(a.expected_maya_c)}`,
    `Actual Maya    ${money(a.actual_maya_c)}`,
    `Difference     ${money(a.maya_difference_c)}`,
    '--------------------------------',
    `TOTAL FEES EARNED  ${money(a.total_fees_c)}`,
    '--------------------------------',
    'TINDA POS AUDIT VERIFIED'
  ]
  return lines
}

