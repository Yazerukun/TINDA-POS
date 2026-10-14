// File: src/shared/receiptHtml.ts
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

function isDoubleSeparator(raw: string): boolean {
  const t = raw.trim()
  return t.length >= 3 && /^=+$/.test(t)
}

function isMoneyLine(raw: string): { label: string; amount: string } | null {
  const m = raw.trim().match(/^(Subtotal|Discounts?|TOTAL|TOTAL PAYMENTS|Total Payments|Cash|Change|SUKLI|Gross Sales|Refunds|Cash Refunds|Voids|NET SALES|GCash|Maya|MariBank|Utang|Expenses|Expected Cash|Actual Cash|Difference|Starting Cash|Starting GCash|Starting Maya|Starting MariBank|Expected GCash|Expected Maya|Expected MariBank|Actual GCash|Actual Maya|Actual MariBank|Cash In|Cash Out|Amount|Bill Amount|Bill \/ Load Amount|Gross Amount|Net Amount|NET LOAD SENT|NET PROCESSED|Service Fee(?:\s*\([^)]*\))?|TOTAL PAID|TOTAL CASH RECEIVED|TOTAL CASH RELEASED|TOTAL FEES EARNED)\s+([+-]?)\s*(?:[P₱]\s*)?(-?\d[\d,]*(?:\.\d+)?)$/i)
  if (!m) return null
  const prefixSign = m[2] || ''
  const amount = prefixSign ? `${prefixSign}${m[3]!}` : m[3]!
  return { label: m[1]!.replace(/^./, (c) => c.toUpperCase()), amount }
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

    if (isDoubleSeparator(raw)) {
      seenSeparator = true
      pushRow('<div class="tp-sep-double"></div>')
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
      const isTotal = /^(TOTAL|TOTAL PAYMENTS|Total Payments|NET SALES|Actual Cash|TOTAL PAID|TOTAL CASH RECEIVED|TOTAL CASH RELEASED|NET LOAD SENT|NET PROCESSED)$/i.test(money.label)
      const cls = /^(SUKLI|Change)$/i.test(money.label) ? 'tp-sukli' : isTotal ? 'tp-total' : 'tp-sum'
      const label = /^(SUKLI|Change)$/i.test(money.label) ? 'Change' : money.label === 'Cash' ? 'Cash' : money.label

      const prevLine = lines[i - 1] ?? ''
      const nextLine = lines[i + 1] ?? ''
      const hasTopSep = isDoubleSeparator(prevLine)
      const hasBottomSep = isDoubleSeparator(nextLine)
      const borderClass = isTotal ? ((hasTopSep ? ' has-adjacent-top-sep' : '') + (hasBottomSep ? ' has-adjacent-bottom-sep' : '')) : ''

      pushRow(
        `<div class="${cls}${borderClass}"><span class="tp-lbl">${escapeHtml(label)}</span><span class="tp-amt">${fmtSigned(money.amount, symbol)}</span></div>`
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

    const countMatch = trimmed.match(/^(Transactions|Items|Total Items)\s*[:\s]\s*(\d+(?:\.\d+)?)$/i)
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

    if (/^(Thank you! Please come again\.|Thank you for your purchase!|OFFICIAL ACKNOWLEDGMENT|Please keep this receipt as proof|of payment\. Thank you!|Please retain this slip for your proof\.|Thank you for choosing us!)$/i.test(trimmed)) {
      pushRow(`<div class="tp-row tp-center tp-footer">${escapeHtml(raw)}</div>`)
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
    let headerCls = 'tp-row tp-center'
    if (i === 0) {
      headerCls += ' tp-heading'
    } else if (/^(Tel:|TIN:|Owner:|Pilit|Cabancalan|Mandaue|Cebu|Manila|Davao|Street|St\.|Brgy|Barangay|City)/i.test(trimmed) || trimmed.length > 28) {
      headerCls += ' tp-small'
    } else {
      headerCls += ' tp-subheader'
    }
    const cls = isCommunityTag ? 'tp-row tp-center tp-community-tag' : (seenSeparator ? 'tp-row' : headerCls)
    pushRow(`<div class="${cls}">${escapeHtml(raw)}</div>`)
  }
  return out.join('\n')
}

const baseCss = `
  .tp-sheet { margin: 0 auto; box-sizing: border-box; background: white; color: black; font-weight: 800; }
  .tp-sheet * { box-sizing: border-box; color: #000000 !important; text-rendering: geometricPrecision !important; }
  .tp-community-tag { font-size: 8.5px; font-weight: 800; letter-spacing: 0.02em; margin-top: 2px; }
  .tp-sheet { font-family: Consolas, 'Lucida Console', Monaco, 'Courier New', monospace; line-height: 1.15; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
  .tp-row { font-size: 10.5px; line-height: 1.15; font-weight: 800; margin: 0; padding: 0; }
  .tp-center { text-align: center; }
  .tp-heading { font-size: 13px; font-weight: 900; line-height: 1.15; margin: 0; letter-spacing: -0.01em; }
  .tp-subheader { font-size: 10px; font-weight: 800; line-height: 1.1; margin: 0; }
  .tp-small { font-size: 9.5px; font-weight: 800; line-height: 1.1; margin: 0; }
  .tp-item, .tp-sum, .tp-total, .tp-sukli, .tp-denomline { break-inside: avoid; }
  .tp-gap { height: 1px; }
  .tp-sep { border-top: 1.5px dashed #000000; margin: 2px 0; height: 0; }
  .tp-sep-double { border-top: 3.5px double #000000; margin: 2px 0; height: 0; }
  .tp-section-head { font-size: 10.5px; font-weight: 900; text-transform: uppercase; margin-top: 1px; letter-spacing: 0.02em; line-height: 1.15; }
  .tp-section-head.tp-sub { font-size: 9.5px; font-weight: 800; margin-top: 0; color: #000; line-height: 1.1; }
  .tp-item { margin: 0; padding: 0.5px 0; line-height: 1.15; }
  .tp-item .tp-name { font-size: 10.5px; font-weight: 800; line-height: 1.15; margin: 0; }
  .tp-itemline { display: flex; justify-content: space-between; align-items: baseline; width: 100%; gap: 2px; overflow: visible; font-size: 10.5px; line-height: 1.15; margin: 0; padding-right: 3px; font-weight: 800; }
  .tp-qty { font-size: 10.5px; white-space: nowrap; font-weight: 800; font-variant-numeric: tabular-nums; flex-shrink: 0; }
  .tp-amt { font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; font-weight: 900; padding-right: 3px; }
  .tp-item .tp-amt, .tp-sum .tp-amt { font-weight: 900; }
  .tp-sum, .tp-total, .tp-sukli { display: flex; justify-content: space-between; align-items: baseline; width: 100%; gap: 2px; overflow: visible; font-size: 10.5px; line-height: 1.15; margin: 0; padding-right: 3px; }
  .tp-lbl { flex: 1; min-width: 0; }
  .tp-sum { font-size: 10.5px; margin: 0; line-height: 1.15; }
  .tp-total { font-size: 12px; font-weight: 900; line-height: 1.2; border-top: 3.5px double #000000; border-bottom: 3.5px double #000000; margin: 2px 0; padding: 1px 3px 1px 0; }
  .tp-total.has-adjacent-top-sep { border-top: none !important; }
  .tp-total.has-adjacent-bottom-sep { border-bottom: none !important; }
  .tp-total .tp-amt { font-weight: 900; font-size: 12.5px; text-align: right; padding-right: 2px; }
  .tp-sukli { font-size: 10.5px; font-weight: 900; line-height: 1.15; margin: 0; padding-right: 3px; }
  .tp-sukli .tp-lbl, .tp-sukli .tp-amt { font-weight: 900; }
  .tp-sukli .tp-amt { text-align: right; padding-right: 3px; }
  .tp-footer { font-size: 9.5px; font-weight: 800; text-align: center; margin-top: 2px; line-height: 1.15; }
  .tp-denomline { display: table; width: 100%; table-layout: fixed; font-size: 10px; line-height: 1.15; }
  .tp-denom { display: table-cell; text-align: left; width: 34%; white-space: nowrap; font-weight: 800; }
  .tp-denomline .tp-qty { display: table-cell; text-align: center; width: 26%; white-space: nowrap; font-variant-numeric: tabular-nums; font-weight: 800; }
  .tp-denomline .tp-amt { display: table-cell; text-align: right; width: 40%; white-space: nowrap; font-variant-numeric: tabular-nums; font-weight: 900; padding-right: 3px; }
  .tp-badge-status { font-weight: 900; letter-spacing: 0.05em; }
  .tp-status-balanced { color: #000; }
  .tp-status-over { color: #000; }
  .tp-status-short { color: #000; }
`
export interface ReceiptLayoutOptions {
  offsetLeftMm?: number
  offsetRightMm?: number
  offsetTopMm?: number
  feedLinesEnd?: number
  fontScale?: number
  lineSpacing?: 'compact' | 'balanced' | 'spacious'
  lineHeightMultiplier?: number
  itemSpacingPx?: number
  separatorSpacingPx?: number
  ultraBlack?: boolean
}

/**
 * Generates thermal receipt CSS stylesheet for print and screen preview.
 *
 * @param width - Thermal paper width ('58mm' | '80mm').
 * @param options - Custom spacing, margins, typography, and density options.
 * @returns Serialized CSS stylesheet string.
 * @throws Never throws error.
 * @complexity O(1) constant time formatting.
 */
export function receiptCss(width: ReceiptWidth, options?: ReceiptLayoutOptions): string {
  const is58 = width !== '80mm'
  const paperWidth = is58 ? '58mm' : '80mm'
  const contentWidth = is58 ? '48mm' : '72mm'
  const printWidth = is58 ? '48mm' : '72mm'
  
  const padLeft = typeof options?.offsetLeftMm === 'number' && !isNaN(options.offsetLeftMm)
    ? `${Number(Math.max(0, options.offsetLeftMm))}mm`
    : (is58 ? '4.5mm' : '5mm')
  const padRight = typeof options?.offsetRightMm === 'number' && !isNaN(options.offsetRightMm)
    ? `${Number(Math.max(0, options.offsetRightMm))}mm`
    : (is58 ? '3.5mm' : '4mm')
  const padTop = typeof options?.offsetTopMm === 'number' && !isNaN(options.offsetTopMm)
    ? `${Number(Math.max(0, options.offsetTopMm))}mm`
    : '2mm'
  
  const scale = typeof options?.fontScale === 'number' && options.fontScale > 0
    ? options.fontScale / 100
    : 1
  const baseSizeNum = is58 ? 11 : 12
  const scaledSize = scale === 1 ? `${baseSizeNum}px` : `${Number((baseSizeNum * scale).toFixed(1))}px`
  const headingSize = scale === 1 ? '13px' : `${Number((13 * scale).toFixed(1))}px`
  const subheaderSize = scale === 1 ? '10px' : `${Number((10 * scale).toFixed(1))}px`
  const smallSize = scale === 1 ? '9.5px' : `${Number((9.5 * scale).toFixed(1))}px`
  const totalSize = scale === 1 ? '12px' : `${Number((12 * scale).toFixed(1))}px`
  const totalAmtSize = scale === 1 ? '12.5px' : `${Number((12.5 * scale).toFixed(1))}px`
  const denomSize = scale === 1 ? '10px' : `${Number((10 * scale).toFixed(1))}px`
  
  const lineHt = typeof options?.lineHeightMultiplier === 'number' && options.lineHeightMultiplier > 0
    ? `${options.lineHeightMultiplier.toFixed(2)}`
    : (options?.lineSpacing === 'compact' ? '1.08' : options?.lineSpacing === 'spacious' ? '1.25' : '1.15')
  const itemPadding = typeof options?.itemSpacingPx === 'number' && !isNaN(options.itemSpacingPx)
    ? `${Number(Math.max(0, options.itemSpacingPx))}px 0`
    : (options?.lineSpacing === 'compact' ? '0.2px 0' : options?.lineSpacing === 'spacious' ? '2.5px 0' : '0.8px 0')
  const sepMargin = typeof options?.separatorSpacingPx === 'number' && !isNaN(options.separatorSpacingPx)
    ? `${Number(Math.max(0, options.separatorSpacingPx))}px 0`
    : (options?.lineSpacing === 'compact' ? '1px 0' : options?.lineSpacing === 'spacious' ? '3px 0' : '2px 0')
  const strokeW = options?.ultraBlack === true ? '0.18px' : '0.05px'

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
        text-rendering: geometricPrecision !important;
      }
      * {
        color: #000000 !important;
        border-color: #000000 !important;
        -webkit-font-smoothing: none !important;
        text-rendering: geometricPrecision !important;
        text-shadow: none !important;
        box-shadow: none !important;
        -webkit-text-stroke: ${strokeW} #000000 !important;
      }
      .tp-sheet {
        width: 100% !important;
        max-width: ${printWidth} !important;
        margin: 0 auto !important;
        padding: ${padTop} ${padRight} 2mm ${padLeft} !important;
        font-size: ${scaledSize} !important;
        font-weight: 800 !important;
        letter-spacing: -0.01em !important;
        line-height: ${lineHt} !important;
        box-sizing: border-box !important;
      }
      .tp-row, .tp-item, .tp-sum, .tp-sukli, .tp-section-head {
        font-size: ${scaledSize} !important;
        line-height: ${lineHt} !important;
        margin: 0 !important;
      }
      .tp-item {
        padding: ${itemPadding} !important;
      }
      .tp-item .tp-name {
        font-size: ${scaledSize} !important;
        line-height: ${lineHt} !important;
        margin: 0 !important;
      }
      .tp-itemline {
        font-size: ${scaledSize} !important;
        line-height: ${lineHt} !important;
        margin: 0 !important;
      }
      .tp-qty {
        font-size: ${scaledSize} !important;
        line-height: ${lineHt} !important;
      }
      .tp-heading {
        font-size: ${headingSize} !important;
        font-weight: 900 !important;
        line-height: ${lineHt} !important;
      }
      .tp-subheader {
        font-size: ${subheaderSize} !important;
        line-height: ${lineHt} !important;
      }
      .tp-small, .tp-footer {
        font-size: ${smallSize} !important;
        line-height: ${lineHt} !important;
      }
      .tp-community-tag {
        font-size: ${scale === 1 ? '8.5px' : `${Number((8.5 * scale).toFixed(1))}px`} !important;
        line-height: ${lineHt} !important;
      }
      .tp-denomline {
        font-size: ${denomSize} !important;
        line-height: ${lineHt} !important;
      }
      .tp-total {
        font-size: ${totalSize} !important;
        font-weight: 900 !important;
        margin: ${sepMargin} !important;
        line-height: 1.2 !important;
      }
      .tp-total .tp-amt {
        font-size: ${totalAmtSize} !important;
        font-weight: 900 !important;
        padding-right: 2px !important;
      }
      .tp-sep {
        border-top: 1.5px dashed #000000 !important;
        margin: ${sepMargin} !important;
        height: 0 !important;
      }
      .tp-sep-double {
        border-top: 3.5px double #000000 !important;
        margin: ${sepMargin} !important;
        height: 0 !important;
      }
      .tp-amt {
        padding-right: 3px !important;
      }
      .tp-feed-spacer {
        display: block !important;
        overflow: hidden !important;
      }
    }
    .tp-sheet { width: ${contentWidth}; padding: ${padTop} ${padRight} 2mm ${padLeft}; font-size: ${scaledSize}; line-height: ${lineHt}; }
    .tp-row, .tp-item, .tp-item .tp-name, .tp-itemline, .tp-qty, .tp-sum, .tp-sukli, .tp-section-head {
      font-size: ${scaledSize};
      line-height: ${lineHt};
    }
    .tp-item { padding: ${itemPadding}; }
    .tp-heading { font-size: ${headingSize}; line-height: ${lineHt}; }
    .tp-subheader { font-size: ${subheaderSize}; line-height: ${lineHt}; }
    .tp-small, .tp-footer { font-size: ${smallSize}; line-height: ${lineHt}; }
    .tp-community-tag { font-size: ${scale === 1 ? '8.5px' : `${Number((8.5 * scale).toFixed(1))}px`}; line-height: ${lineHt}; }
    .tp-denomline { font-size: ${denomSize}; line-height: ${lineHt}; }
    .tp-total { font-size: ${totalSize}; margin: ${sepMargin}; }
    .tp-total .tp-amt { font-size: ${totalAmtSize}; }
    .tp-sep { margin: ${sepMargin}; }
    .tp-sep-double { margin: ${sepMargin}; }
  `
}

export function receiptBodyHtml(lines: string[], width: ReceiptWidth, currency = '', options?: ReceiptLayoutOptions): string {
  const feedLines = typeof options?.feedLinesEnd === 'number' && options.feedLinesEnd > 0
    ? options.feedLinesEnd
    : 5
  const feedHeightMm = feedLines * 3.8
  const feedSpacer = `<div style="height: ${feedHeightMm}mm;" class="tp-feed-spacer"></div>`
  return `<div class="tp-sheet">${rowsToHtml(lines, currency)}${feedSpacer}</div>`
}

export function receiptHtml(lines: string[], width: ReceiptWidth, currency = '', options?: ReceiptLayoutOptions): string {
  const docReset = 'html, body { margin: 0; padding: 0; background: white; color: black; }'
  return `<!doctype html><html><head><meta charset="utf-8"><style>${docReset}${receiptCss(width, options)}</style></head><body>${receiptBodyHtml(lines, width, currency, options)}</body></html>`
}

export function formatReceiptDate(d: string | Date | undefined | null): string {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d.replace(' ', 'T')) : d
  if (Number.isNaN(dt.getTime())) return String(d)
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  const y = dt.getFullYear()
  let h = dt.getHours()
  const min = String(dt.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${m}/${day}/${y} ${h}:${min} ${ampm}`
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
    `Date: ${formatReceiptDate(tx.created_at)}`,
    `Reference: ${tx.reference_no || 'N/A'}`
  ]
  if (tx.customer_name) lines.push(`Customer: ${tx.customer_name}`)
  if (tx.customer_phone) lines.push(`Mobile: ${tx.customer_phone}`)
  if (tx.cashier_name) lines.push(`Cashier: ${tx.cashier_name}`)
  lines.push('--------------------------------')
  lines.push(`Amount         ${money(tx.amount_c)}`)
  if (isCashIn) {
    if (tx.fee_collected_via === 'WALLET' && tx.fee_c > 0) {
      lines.push(`Service Fee    -${money(tx.fee_c)}`)
      lines.push('================================')
      lines.push(`TOTAL CASH RECEIVED  ${money(tx.amount_c)}`)
      lines.push(`NET LOAD SENT        ${money(Math.max(0, tx.amount_c - tx.fee_c))}`)
    } else {
      lines.push(`Service Fee    ${money(tx.fee_c)}`)
      lines.push('================================')
      lines.push(`TOTAL CASH RECEIVED  ${money(tx.amount_c + tx.fee_c)}`)
    }
  } else if (tx.fee_collected_via === 'CASH') {
    lines.push(`Service Fee    ${money(tx.fee_c)}`)
    lines.push('================================')
    lines.push(`TOTAL CASH RELEASED  ${money(tx.amount_c)}`)
  } else {
    const netReleased = Math.max(0, tx.amount_c - tx.fee_c)
    lines.push(`Service Fee    -${money(tx.fee_c)}`)
    lines.push('================================')
    lines.push(`TOTAL CASH RELEASED  ${money(netReleased)}`)
  }
  lines.push('================================')
  lines.push('Thank you! Please come again.')
  return lines
}

export function formatEwalletAuditLines(
  a: import('./types').EwalletAuditRecord,
  storeName?: string | null
): string[] {
  const money = (cents: number): string => (cents / 100).toFixed(2)
  const lines: string[] = [
    storeName || 'TINDA POS',
    'DAILY E-WALLET & CASH AUDIT REPORT',
    '--------------------------------',
    `Date: ${formatReceiptDate(a.business_date || a.created_at)}`,
    `Shift: ${a.shift_id ?? 'N/A'}`,
    `Cashier: ${a.cashier_name || 'Store Cashier'}`,
    '--------------------------------',
    'PHYSICAL CASH DRAWER (DAILY RECON)',
    `Today Expected Cash ${money(a.expected_cash_c)}`,
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
    'MARIBANK WALLET AUDIT',
    `Starting MariBank ${money(a.starting_maribank_c || 0)}`,
    `Cash In (Sent) ${money(a.maribank_in_c || 0)}`,
    `Cash Out (Rcvd) ${money(a.maribank_out_c || 0)}`,
    `Expected MariBank ${money(a.expected_maribank_c || 0)}`,
    `Actual MariBank   ${money(a.actual_maribank_c || 0)}`,
    `Difference     ${money(a.maribank_difference_c || 0)}`,
    '--------------------------------',
    `TOTAL FEES EARNED  ${money(a.total_fees_c)}`,
    '--------------------------------',
    'TINDA POS AUDIT VERIFIED'
  ]
  return lines
}

export interface BillSlipPayload {
  biller: string
  referenceNo: string
  accountNo: string
  customerName: string
  customerPhone?: string
  amount: number
  serviceFee: number
  feeMode?: 'ADD' | 'DEDUCT'
  sourceWallet: string
  createdAt: string
  cashReceived?: number
  change?: number
}

export function formatBillSlipLines(
  b: BillSlipPayload,
  storeName?: string | null
): string[] {
  const moneyStr = (val: number): string => (val || 0).toFixed(2)
  const lines: string[] = [
    storeName || 'TINDA POS',
    'BILLS & E-LOAD RECEIPT',
    '--------------------------------',
    `Date:   ${formatReceiptDate(b.createdAt)}`,
    `Ref #:  ${b.referenceNo || 'N/A'}`,
    '--------------------------------',
    `Biller:     ${b.biller}`,
    `Acct / No:  ${b.accountNo}`
  ]
  if (b.customerName) lines.push(`Customer:   ${b.customerName}`)
  if (b.customerPhone) lines.push(`Mobile:     ${b.customerPhone}`)
  lines.push('Paid Via:   Customer Cash')
  lines.push(`Processed:  ${b.sourceWallet} Business`)
  lines.push('--------------------------------')
  lines.push(`Bill Amount    P${moneyStr(b.amount)}`)
  if (b.feeMode === 'DEDUCT') {
    const totalPaid = Math.max(0, b.amount - b.serviceFee)
    lines.push(`Service Fee    -P${moneyStr(b.serviceFee)}`)
    lines.push('================================')
    lines.push(`TOTAL PAID     P${moneyStr(totalPaid)}`)
    lines.push('================================')
    if (b.cashReceived !== undefined && b.cashReceived > 0) {
      const sukli = b.change !== undefined ? b.change : Math.max(0, b.cashReceived - totalPaid)
      lines.push(`CASH           P${moneyStr(b.cashReceived)}`)
      lines.push(`CHANGE         P${moneyStr(sukli)}`)
      lines.push('--------------------------------')
    }
  } else {
    const totalPaid = b.amount + b.serviceFee
    lines.push(`Service Fee    P${moneyStr(b.serviceFee)}`)
    lines.push('================================')
    lines.push(`TOTAL PAID     P${moneyStr(totalPaid)}`)
    lines.push('================================')
    if (b.cashReceived !== undefined && b.cashReceived > 0) {
      const sukli = b.change !== undefined ? b.change : Math.max(0, b.cashReceived - totalPaid)
      lines.push(`CASH           P${moneyStr(b.cashReceived)}`)
      lines.push(`CHANGE         P${moneyStr(sukli)}`)
      lines.push('--------------------------------')
    }
  }
  lines.push('Thank you! Please come again.')
  return lines
}

export function formatStoreUseSlipLines(
  data: import('./types').StoreUseRecord,
  storeName?: string | null
): string[] {
  const money = (cents: number): string => (cents / 100).toFixed(2)
  const lines: string[] = [
    storeName || 'TINDA POS',
    'STORE USE EXPENSE VOUCHER',
    'INTERNAL CONSUMPTION',
    '--------------------------------',
    `Voucher Ref: ${data.reference}`,
    `Date: ${formatReceiptDate(data.created_at || new Date().toISOString())}`,
    `Staff: ${data.cashier_name || 'Staff'}`
  ]
  lines.push('--------------------------------')
  lines.push(`Item: ${data.product_name}`)
  lines.push(`Qty: ${data.quantity} ${data.unit}`)
  lines.push(`Unit Cost: P${money(data.unit_cost_c)}`)
  lines.push('================================')
  lines.push(`TOTAL OPEX: P${money(data.total_amount_c)}`)
  lines.push('================================')
  lines.push(`Purpose: ${data.reason}`)
  if (data.notes) lines.push(`Notes: ${data.notes}`)
  lines.push('--------------------------------')
  lines.push('AUDIT & TAX SIGN-OFF')
  lines.push('')
  lines.push('Requested: _____________________')
  lines.push('')
  lines.push('Approved:  _____________________')
  lines.push('--------------------------------')
  lines.push('File in Daily Expense Receipts')
  return lines
}

