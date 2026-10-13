import type {
  StoreTelemetrySummary,
  TelemetryTopProduct,
  TelemetryLowStockItem,
  TelemetryExpiringItem
} from '@shared/types'
import { money, shortDate } from '@shared/format'

export type AdvisorLanguage = 'en' | 'tl'

export interface AdvisorSection {
  title: string
  icon: string
  summary: string
  bulletPoints: string[]
}

export interface StoreExecutiveBriefing {
  language: AdvisorLanguage
  storeDate: string
  generatedAt: string
  overallStatus: 'HEALTHY' | 'MODERATE' | 'ACTION_REQUIRED'
  statusHeadline: string
  statusBadge: string
  salesPerformance: AdvisorSection
  inventoryAlerts: AdvisorSection
  cashSecurity: AdvisorSection
  actionItems: AdvisorSection
  speechScript: string
}

export interface AdvisorQAResponse {
  intent: string
  matchedQuestion: string
  language: AdvisorLanguage
  headline: string
  answer: string
  bullets: string[]
  action?: {
    label: string
    page: string
    tab?: string
    description?: string
  }
  speechText: string
  source?: 'opencode' | 'gemini' | 'local_rules'
}

export interface SpeechOptions {
  lang?: AdvisorLanguage | string
  rate?: number
  pitch?: number
  volume?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: unknown) => void
}

/**
 * Normalizes currency strings for clear, natural speech synthesis.
 * Converts "₱1,250.50" into "1,250 pesos and 50 cents" (en) or "1,250 piso at 50 sentimos" (tl).
 */
export function formatCurrencyForSpeech(centavos: number, lang: AdvisorLanguage): string {
  const pesos = Math.floor(Math.abs(centavos) / 100)
  const cents = Math.abs(centavos) % 100
  const sign = centavos < 0 ? (lang === 'tl' ? 'negatibong ' : 'negative ') : ''

  if (lang === 'tl') {
    if (cents > 0) {
      return `${sign}${pesos.toLocaleString('en-US')} piso at ${cents} sentimos`
    }
    return `${sign}${pesos.toLocaleString('en-US')} piso`
  } else {
    if (cents > 0) {
      return `${sign}${pesos.toLocaleString('en-US')} pesos and ${cents} cents`
    }
    return `${sign}${pesos.toLocaleString('en-US')} pesos`
  }
}

/**
 * Cleans text intended for SpeechSynthesis (strips markdown asterisks, hashes, bullets, and converts peso symbols).
 */
export function sanitizeTextForSpeech(rawText: string, lang: AdvisorLanguage = 'en'): string {
  let cleaned = rawText
    .replace(/[#*_`~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const pesoUnit = lang === 'tl' ? 'piso' : 'pesos'
  cleaned = cleaned.replace(/₱\s*([\d,]+(?:\.\d{1,2})?)/g, (_match, amount) => {
    return `${amount} ${pesoUnit}`
  })

  return cleaned
}

/**
 * Determines overall store operational status based strictly on telemetry indicators.
 */
function evaluateStoreStatus(
  t: StoreTelemetrySummary
): 'HEALTHY' | 'MODERATE' | 'ACTION_REQUIRED' {
  if (
    t.void_count >= 3 ||
    t.critically_low_stock.length >= 6 ||
    t.expiring_products.some((p) => p.days_until_expiration <= 0) ||
    t.unpaid_utang_due.over_limit_count > 0
  ) {
    return 'ACTION_REQUIRED'
  }

  if (
    t.void_count > 0 ||
    t.critically_low_stock.length > 0 ||
    t.expiring_products.length > 0
  ) {
    return 'MODERATE'
  }

  return 'HEALTHY'
}

/**
 * Generates an executive briefing in English.
 */
function buildEnglishBriefing(t: StoreTelemetrySummary): StoreExecutiveBriefing {
  const status = evaluateStoreStatus(t)

  let statusBadge = '🟢 Operational'
  let statusHeadline = 'Store operations are healthy with no critical bottlenecks.'
  if (status === 'ACTION_REQUIRED') {
    statusBadge = '🔴 Attention Needed'
    statusHeadline = 'Urgent action required: check voided sales, critical low stocks, or overdue receivables.'
  } else if (status === 'MODERATE') {
    statusBadge = '🟡 Moderate'
    statusHeadline = 'Operations proceeding normally with routine inventory replenishment and audit alerts.'
  }

  // 1. Sales Performance
  const salesBullets: string[] = [
    `Net Sales: ${money(t.net_sales_c)} across ${t.transaction_count} transaction${t.transaction_count === 1 ? '' : 's'}.`,
    `Gross Sales: ${money(t.gross_sales_c)} with ${money(t.discount_c)} total promotional & senior discounts granted.`,
    `Refunds: ${money(t.refund_total_c)} total refunded revenue today.`,
    `Settlement Breakdown: Cash ${money(t.cash_c)}, GCash ${money(t.gcash_c)}, Maya ${money(t.maya_c)}, Utang/Credit ${money(t.utang_c)}.`
  ]

  if (t.top_products.length > 0) {
    const topList = t.top_products
      .map((p, idx) => `${idx + 1}. ${p.name} (${p.qty_sold} sold, ${money(p.revenue_c)})`)
      .join('; ')
    salesBullets.push(`Top Sellers: ${topList}`)
  } else {
    salesBullets.push('Top Sellers: No product items sold yet today.')
  }

  const salesSection: AdvisorSection = {
    title: 'Sales Performance',
    icon: '📊',
    summary: `${money(t.net_sales_c)} net sales across ${t.transaction_count} transactions.`,
    bulletPoints: salesBullets
  }

  // 2. Inventory Alerts
  const inventoryBullets: string[] = []
  if (t.critically_low_stock.length > 0) {
    const lowList = t.critically_low_stock
      .slice(0, 5)
      .map((item) => `${item.name} (${item.stock} ${item.unit} remaining, reorder at ${item.reorder_level})`)
      .join('; ')
    inventoryBullets.push(
      `Critically Low Stock (${t.critically_low_stock.length} item${t.critically_low_stock.length === 1 ? '' : 's'}): ${lowList}`
    )
  } else {
    inventoryBullets.push('Stock Health: All inventory levels are above reorder thresholds.')
  }

  if (t.expiring_products.length > 0) {
    const expList = t.expiring_products
      .slice(0, 5)
      .map((item) => {
        const timeDesc =
          item.days_until_expiration < 0
            ? `Expired ${Math.abs(item.days_until_expiration)}d ago`
            : item.days_until_expiration === 0
              ? 'Expires today'
              : `Expires in ${item.days_until_expiration}d`
        return `${item.name} (${timeDesc}, ${item.quantity} ${item.unit})`
      })
      .join('; ')
    inventoryBullets.push(`Expiration Watchlist (${t.expiring_products.length} item${t.expiring_products.length === 1 ? '' : 's'} within 7 days): ${expList}`)
  } else {
    inventoryBullets.push('Expiration Monitoring: Zero items expiring within the next 7 days.')
  }

  const inventorySection: AdvisorSection = {
    title: 'Inventory & Expiration Alerts',
    icon: '📦',
    summary: `${t.critically_low_stock.length} low-stock item(s) and ${t.expiring_products.length} expiring item(s) flagged.`,
    bulletPoints: inventoryBullets
  }

  // 3. Cash Security & Drawer Balance
  const cashBullets: string[] = [
    `Expected Cash in Drawer: ${money(t.expected_drawer_cash_c)}.`,
    `Drawer Flow: Starting float ${money(t.opening_float_c)} + Cash sales ${money(t.cash_c)} + Cash-in ${money(t.cash_in_c)} - Cash-out ${money(t.cash_out_c)} - Cash expenses ${money(t.cash_expenses_c)} - Cash refunds ${money(t.cash_refunds_c)}.`,
    t.void_count > 0
      ? `Void Security: ${t.void_count} voided transaction${t.void_count === 1 ? '' : 's'} totaling ${money(t.void_total_c)} recorded today (supervisor verification recommended).`
      : 'Void Security: Zero voided transactions recorded today.',
    `Receivables (Utang): ${money(t.unpaid_utang_due.total_outstanding_c)} outstanding credit across ${t.unpaid_utang_due.customer_count} customer${t.unpaid_utang_due.customer_count === 1 ? '' : 's'}${t.unpaid_utang_due.over_limit_count > 0 ? ` (${t.unpaid_utang_due.over_limit_count} over limit)` : ''}.`
  ]

  if (t.unpaid_utang_due.top_debtors.length > 0) {
    const debtorList = t.unpaid_utang_due.top_debtors
      .slice(0, 3)
      .map((d) => `${d.name} (${money(d.balance_c)}${d.is_over_limit ? ' ⚠️ over limit' : ''})`)
      .join(', ')
    cashBullets.push(`Top Receivables: ${debtorList}.`)
  }

  const cashSection: AdvisorSection = {
    title: 'Cash Security & Drawer Audit',
    icon: '🔒',
    summary: `Expected drawer cash is ${money(t.expected_drawer_cash_c)} with ${t.void_count} voids and ${money(t.unpaid_utang_due.total_outstanding_c)} outstanding utang.`,
    bulletPoints: cashBullets
  }

  // 4. Action Items
  const actionBullets: string[] = []
  if (t.critically_low_stock.length > 0) {
    actionBullets.push(`Prepare supplier purchase order for ${t.critically_low_stock.length} low-stock item(s).`)
  }
  if (t.expiring_products.length > 0) {
    actionBullets.push(`Apply promo discounts or front-display ${t.expiring_products.length} product(s) expiring within 7 days.`)
  }
  if (t.void_count > 0) {
    actionBullets.push(`Review void audit log with shift cashier for ${t.void_count} canceled transaction(s).`)
  }
  if (t.unpaid_utang_due.over_limit_count > 0) {
    actionBullets.push(`Contact ${t.unpaid_utang_due.over_limit_count} suki customer(s) whose utang exceeds approved credit limit.`)
  }
  if (t.last_sync_at) {
    actionBullets.push(`Cloud backup verified (last synced at ${shortDate(t.last_sync_at)}).`)
  } else {
    actionBullets.push('Trigger cloud sync under Settings to back up latest store ledger.')
  }
  if (actionBullets.length === 0) {
    actionBullets.push('All store operations optimal. Continue standard cashier shift workflows.')
  }

  const actionSection: AdvisorSection = {
    title: 'Executive Recommendations',
    icon: '⚡',
    summary: `${actionBullets.length} actionable recommendation(s) for store management.`,
    bulletPoints: actionBullets
  }

  // Audio speech script
  const netSalesSpeech = formatCurrencyForSpeech(t.net_sales_c, 'en')
  const drawerSpeech = formatCurrencyForSpeech(t.expected_drawer_cash_c, 'en')
  const speechScript = `Executive Store Briefing for ${t.business_date}. Net sales reached ${netSalesSpeech} across ${t.transaction_count} transactions. Expected cash in drawer is ${drawerSpeech}. There are ${t.critically_low_stock.length} low-stock items and ${t.expiring_products.length} items nearing expiration. Overall operational status is ${status === 'HEALTHY' ? 'healthy' : status === 'MODERATE' ? 'moderate' : 'requiring attention'}.`

  return {
    language: 'en',
    storeDate: t.business_date,
    generatedAt: t.generated_at,
    overallStatus: status,
    statusHeadline,
    statusBadge,
    salesPerformance: salesSection,
    inventoryAlerts: inventorySection,
    cashSecurity: cashSection,
    actionItems: actionSection,
    speechScript
  }
}

/**
 * Generates an executive briefing in Tagalog (Filipino).
 * Polite, respectful, clear, and easily understood by store owners and cashiers.
 */
function buildTagalogBriefing(t: StoreTelemetrySummary): StoreExecutiveBriefing {
  const status = evaluateStoreStatus(t)

  let statusBadge = '🟢 Maayos ang Operasyon'
  let statusHeadline = 'Maayos at ligtas po ang daloy ng inyong tindahan ngayong araw.'
  if (status === 'ACTION_REQUIRED') {
    statusBadge = '🔴 Kailangan ng Aksyon'
    statusHeadline = 'May mga kailangang tutukan po: suriin ang na-void na benta, mauubos na stocks, o lumagpas na utang.'
  } else if (status === 'MODERATE') {
    statusBadge = '🟡 Katamtaman'
    statusHeadline = 'Pumapasok ang benta nang normal; may ilang paalala sa stocks at kaha.'
  }

  // 1. Sales Performance
  const salesBullets: string[] = [
    `Kabuuang Net Sales: ${money(t.net_sales_c)} mula sa ${t.transaction_count} na transaksyon.`,
    `Gross Sales: ${money(t.gross_sales_c)} na may kabuuang ${money(t.discount_c)} na diskwento (promo at senior/PWD).`,
    `Pina-refund / Binalik: ${money(t.refund_total_c)} ang kabuuang naibalik na pera ngayong araw.`,
    `Koleksyon ayon sa Pagbabayad: Cash ${money(t.cash_c)}, GCash ${money(t.gcash_c)}, Maya ${money(t.maya_c)}, at Pautang (Utang) ${money(t.utang_c)}.`
  ]

  if (t.top_products.length > 0) {
    const topList = t.top_products
      .map((p, idx) => `${idx + 1}. ${p.name} (${p.qty_sold} piraso, ${money(p.revenue_c)})`)
      .join('; ')
    salesBullets.push(`Pinakamabentang Paninda (Top Sellers): ${topList}`)
  } else {
    salesBullets.push('Pinakamabentang Paninda: Wala pa pong naitalang benta sa mga produkto ngayong araw.')
  }

  const salesSection: AdvisorSection = {
    title: 'Benta at Transaksyon',
    icon: '📊',
    summary: `${money(t.net_sales_c)} ang kabuuang net sales mula sa ${t.transaction_count} na customer.`,
    bulletPoints: salesBullets
  }

  // 2. Inventory Alerts
  const inventoryBullets: string[] = []
  if (t.critically_low_stock.length > 0) {
    const lowList = t.critically_low_stock
      .slice(0, 5)
      .map((item) => `${item.name} (${item.stock} ${item.unit} na lang, reorder kapag ${item.reorder_level})`)
      .join('; ')
    inventoryBullets.push(
      `Mauubos na Stocks (${t.critically_low_stock.length} produkto): ${lowList}`
    )
  } else {
    inventoryBullets.push('Kalagayan ng Stocks: Sapat ang lahat ng paninda at lampas sa reorder limit.')
  }

  if (t.expiring_products.length > 0) {
    const expList = t.expiring_products
      .slice(0, 5)
      .map((item) => {
        const timeDesc =
          item.days_until_expiration < 0
            ? `Expired na ${Math.abs(item.days_until_expiration)} araw na ang nakalipas`
            : item.days_until_expiration === 0
              ? 'Mag-eexpire ngayong araw'
              : `Mag-eexpire sa loob ng ${item.days_until_expiration} araw`
        return `${item.name} (${timeDesc}, ${item.quantity} ${item.unit})`
      })
      .join('; ')
    inventoryBullets.push(`Bantay-Expiration (${t.expiring_products.length} produkto sa loob ng 7 araw): ${expList}`)
  } else {
    inventoryBullets.push('Bantay-Expiration: Walang produktong mag-eexpire sa susunod na pitong (7) araw.')
  }

  const inventorySection: AdvisorSection = {
    title: 'Imbentaryo at Babala sa Stocks',
    icon: '📦',
    summary: `${t.critically_low_stock.length} paninda ang mauubos na at ${t.expiring_products.length} ang malapit nang mag-expire.`,
    bulletPoints: inventoryBullets
  }

  // 3. Cash Security & Drawer Audit
  const cashBullets: string[] = [
    `Inaasahang Cash sa Kaha (Drawer Cash): ${money(t.expected_drawer_cash_c)}.`,
    `Kuwenta ng Kaha: Panimulang pondo (Float) ${money(t.opening_float_c)} + Cash na benta ${money(t.cash_c)} + Cash-in ${money(t.cash_in_c)} - Cash-out ${money(t.cash_out_c)} - Gastos ${money(t.cash_expenses_c)} - Binalik na cash ${money(t.cash_refunds_c)}.`,
    t.void_count > 0
      ? `Seguridad sa Void: May ${t.void_count} na-void na resibo na may kabuuang ${money(t.void_total_c)} (iminumungkahi pong suriin ng may-ari).`
      : 'Seguridad sa Void: Walang na-void na resibo ngayong araw.',
    `Pautang sa Suki: ${money(t.unpaid_utang_due.total_outstanding_c)} kabuuang pautang mula sa ${t.unpaid_utang_due.customer_count} na suki${t.unpaid_utang_due.over_limit_count > 0 ? ` (${t.unpaid_utang_due.over_limit_count} ang lagpas sa limit)` : ''}.`
  ]

  if (t.unpaid_utang_due.top_debtors.length > 0) {
    const debtorList = t.unpaid_utang_due.top_debtors
      .slice(0, 3)
      .map((d) => `${d.name} (${money(d.balance_c)}${d.is_over_limit ? ' ⚠️ over-limit' : ''})`)
      .join(', ')
    cashBullets.push(`Nangungunang Pautang: ${debtorList}.`)
  }

  const cashSection: AdvisorSection = {
    title: 'Seguridad sa Kaha at Pondo',
    icon: '🔒',
    summary: `Inaasahang cash sa kaha ay ${money(t.expected_drawer_cash_c)} na may ${t.void_count} voids at ${money(t.unpaid_utang_due.total_outstanding_c)} pautang.`,
    bulletPoints: cashBullets
  }

  // 4. Action Items
  const actionBullets: string[] = []
  if (t.critically_low_stock.length > 0) {
    actionBullets.push(`Maghanda ng purchase order para sa ${t.critically_low_stock.length} na mauubos nang paninda.`)
  }
  if (t.expiring_products.length > 0) {
    actionBullets.push(`Maglagay ng promo o i-display sa unahan ang ${t.expiring_products.length} paninda na mag-eexpire sa loob ng 7 araw.`)
  }
  if (t.void_count > 0) {
    actionBullets.push(`Tanungin ang kahero ukol sa dahilan ng ${t.void_count} na kanseladong resibo.`)
  }
  if (t.unpaid_utang_due.over_limit_count > 0) {
    actionBullets.push(`Paalalahanan ang ${t.unpaid_utang_due.over_limit_count} suki na lumagpas na sa kanilang credit limit.`)
  }
  if (t.last_sync_at) {
    actionBullets.push(`Ligtas ang cloud backup (huling na-sync noong ${shortDate(t.last_sync_at)}).`)
  } else {
    actionBullets.push('Pindutin ang Sync Now sa Settings para mai-save ang pinakabagong ulat sa cloud.')
  }
  if (actionBullets.length === 0) {
    actionBullets.push('Napakaganda po ng lagay ng tindahan. Ipagpatuloy ang maayos na serbisyo!')
  }

  const actionSection: AdvisorSection = {
    title: 'Mga Dapat Gawin at Rekomendasyon',
    icon: '⚡',
    summary: `${actionBullets.length} mahahalagang paalala para sa may-ari at kahero.`,
    bulletPoints: actionBullets
  }

  // Audio speech script
  const netSalesSpeech = formatCurrencyForSpeech(t.net_sales_c, 'tl')
  const drawerSpeech = formatCurrencyForSpeech(t.expected_drawer_cash_c, 'tl')
  const speechScript = `Magandang araw po! Narito ang ulat ng tindahan para sa ${t.business_date}. Umabot po sa ${netSalesSpeech} ang kabuuang net sales mula sa ${t.transaction_count} na transaksyon. Ang inaasahang pera sa inyong kaha ay ${drawerSpeech}. May ${t.critically_low_stock.length} produkto na mauubos na at ${t.expiring_products.length} paninda na malapit nang mag-expire. Ligtas at maayos po ang inyong tindahan.`

  return {
    language: 'tl',
    storeDate: t.business_date,
    generatedAt: t.generated_at,
    overallStatus: status,
    statusHeadline,
    statusBadge,
    salesPerformance: salesSection,
    inventoryAlerts: inventorySection,
    cashSecurity: cashSection,
    actionItems: actionSection,
    speechScript
  }
}

/**
 * Main briefing entrypoint: generates structured briefing in English or Tagalog.
 */
export function generateStoreBriefing(
  telemetry: StoreTelemetrySummary,
  lang: AdvisorLanguage = 'en'
): StoreExecutiveBriefing {
  return lang === 'tl' ? buildTagalogBriefing(telemetry) : buildEnglishBriefing(telemetry)
}

/**
 * Detects whether a free-form question is phrased in Tagalog.
 */
function isTagalogQuestion(question: string): boolean {
  const q = question.toLowerCase()
  return /\b(ano|magkano|ilan|sino|kaha|benta|utang|paninda|mauubos|panis|pera|bakit|paano|meron|mayroon|ba|sa|ng|na|mga|po|opo)\b/i.test(
    q
  )
}

/**
 * Quick Q&A responder grounded strictly in the telemetry data.
 * Answers with zero hallucinations in the matched or preferred language.
 */
export function answerStoreQuestion(
  telemetry: StoreTelemetrySummary,
  question: string,
  preferredLang?: AdvisorLanguage
): AdvisorQAResponse {
  const lang: AdvisorLanguage = preferredLang ?? (isTagalogQuestion(question) ? 'tl' : 'en')
  const q = question.toLowerCase().trim()

  // Intent 1: Top selling products / Pinakamabenta
  if (
    q.includes('top') ||
    q.includes('best seller') ||
    q.includes('mabenta') ||
    q.includes('pinakamabenta') ||
    q.includes('best selling') ||
    q.includes('patok')
  ) {
    const topItem = telemetry.top_products[0]
    if (lang === 'tl') {
      return {
        intent: 'TOP_PRODUCTS',
        matchedQuestion: question,
        language: 'tl',
        headline: 'Pinakamabentang Produkto Ngayong Araw',
        answer:
          topItem
            ? `Ang nangungunang produkto ay ${topItem.name} na may ${topItem.qty_sold} benta.`
            : 'Wala pa pong naitalang transaksyon ngayong araw.',
        bullets: telemetry.top_products.map(
          (p, i) => `${i + 1}. ${p.name}: ${p.qty_sold} piraso (${money(p.revenue_c)})`
        ),
        action: { label: 'Tingnan ang Reports ↗', page: 'reports', tab: 'items' },
        speechText: sanitizeTextForSpeech(
          `Ang nangungunang produkto ngayong araw ay ${topItem?.name || 'wala pa'}.`,
          'tl'
        )
      }
    } else {
      return {
        intent: 'TOP_PRODUCTS',
        matchedQuestion: question,
        language: 'en',
        headline: "Today's Best-Selling Products",
        answer:
          topItem
            ? `The #1 best-selling product today is ${topItem.name} with ${topItem.qty_sold} units sold.`
            : 'No products sold yet today.',
        bullets: telemetry.top_products.map(
          (p, i) => `${i + 1}. ${p.name}: ${p.qty_sold} sold (${money(p.revenue_c)})`
        ),
        action: { label: 'View Item Sales Reports ↗', page: 'reports', tab: 'items' },
        speechText: sanitizeTextForSpeech(
          `The top selling product today is ${topItem?.name || 'none yet'}.`,
          'en'
        )
      }
    }
  }

  // Intent 2: Low stock / Mauubos na
  if (
    q.includes('low stock') ||
    q.includes('mauubos') ||
    q.includes('ubos') ||
    q.includes('kulang') ||
    q.includes('reorder') ||
    q.includes('stocks')
  ) {
    if (lang === 'tl') {
      return {
        intent: 'LOW_STOCK',
        matchedQuestion: question,
        language: 'tl',
        headline: 'Ulat sa Mauubos nang Paninda',
        answer:
          telemetry.critically_low_stock.length > 0
            ? `May ${telemetry.critically_low_stock.length} na produkto na dapat nang i-restock o i-order sa supplier.`
            : 'Lahat po ng produkto ay may sapat na stock at ligtas sa reorder limit.',
        bullets: telemetry.critically_low_stock
          .slice(0, 8)
          .map((item) => `${item.name}: ${item.stock} ${item.unit} na lang (reorder sa ${item.reorder_level})`),
        action: { label: 'Buksan ang Inventory ↗', page: 'inventory' },
        speechText: sanitizeTextForSpeech(
          telemetry.critically_low_stock.length > 0
            ? `May ${telemetry.critically_low_stock.length} produkto na kailangan nang i-restock.`
            : 'Sapat po ang lahat ng stocks sa inyong tindahan.',
          'tl'
        )
      }
    } else {
      return {
        intent: 'LOW_STOCK',
        matchedQuestion: question,
        language: 'en',
        headline: 'Critical Low Stock Alert',
        answer:
          telemetry.critically_low_stock.length > 0
            ? `There are ${telemetry.critically_low_stock.length} product(s) at or below their low-stock reorder thresholds.`
            : 'All inventory stock levels are healthy and above reorder thresholds.',
        bullets: telemetry.critically_low_stock
          .slice(0, 8)
          .map((item) => `${item.name}: ${item.stock} ${item.unit} remaining (threshold: ${item.reorder_level})`),
        action: { label: 'Open Inventory Management ↗', page: 'inventory' },
        speechText: sanitizeTextForSpeech(
          telemetry.critically_low_stock.length > 0
            ? `There are ${telemetry.critically_low_stock.length} items requiring restocking.`
            : 'All inventory stock levels are healthy.',
          'en'
        )
      }
    }
  }

  // Intent 3: Expiration / Malapit nang mag-expire
  if (
    q.includes('expir') ||
    q.includes('panis') ||
    q.includes('sira') ||
    q.includes('petsa') ||
    q.includes('expired')
  ) {
    if (lang === 'tl') {
      return {
        intent: 'EXPIRING_PRODUCTS',
        matchedQuestion: question,
        language: 'tl',
        headline: 'Bantay-Expiration (7 Araw)',
        answer:
          telemetry.expiring_products.length > 0
            ? `May ${telemetry.expiring_products.length} produkto na mag-eexpire o nag-expire na sa loob ng 7 araw.`
            : 'Ligtas po ang inyong imbentaryo; walang mag-eexpire sa susunod na 7 araw.',
        bullets: telemetry.expiring_products.map((item) => {
          const badge =
            item.days_until_expiration < 0
              ? 'Expired na'
              : item.days_until_expiration === 0
                ? 'Mag-eexpire ngayon'
                : `${item.days_until_expiration} araw na lang`
          return `${item.name}: ${badge} (${item.quantity} ${item.unit}, petsa: ${item.expiration_date})`
        }),
        action: { label: 'Tingnan ang Expiration sa Inventory ↗', page: 'inventory' },
        speechText: sanitizeTextForSpeech(
          telemetry.expiring_products.length > 0
            ? `May ${telemetry.expiring_products.length} produkto na malapit nang mag-expire.`
            : 'Walang mag-eexpire na paninda sa darating na pitong araw.',
          'tl'
        )
      }
    } else {
      return {
        intent: 'EXPIRING_PRODUCTS',
        matchedQuestion: question,
        language: 'en',
        headline: 'Product Expiration Watchlist',
        answer:
          telemetry.expiring_products.length > 0
            ? `There are ${telemetry.expiring_products.length} product(s) expiring within the next 7 days.`
            : 'No inventory items are nearing expiration within the next 7 days.',
        bullets: telemetry.expiring_products.map((item) => {
          const badge =
            item.days_until_expiration < 0
              ? 'Expired'
              : item.days_until_expiration === 0
                ? 'Expires today'
                : `Expires in ${item.days_until_expiration}d`
          return `${item.name}: ${badge} (${item.quantity} ${item.unit}, date: ${item.expiration_date})`
        }),
        action: { label: 'Review Products in Inventory ↗', page: 'inventory' },
        speechText: sanitizeTextForSpeech(
          telemetry.expiring_products.length > 0
            ? `There are ${telemetry.expiring_products.length} products expiring soon.`
            : 'No products are nearing expiration.',
          'en'
        )
      }
    }
  }

  // Intent 4: Cash Drawer / Kaha
  if (
    q.includes('kaha') ||
    q.includes('drawer') ||
    q.includes('cash in drawer') ||
    q.includes('pera sa kaha') ||
    q.includes('expected cash') ||
    q.includes('starting cash') ||
    q.includes('pondo')
  ) {
    if (lang === 'tl') {
      return {
        intent: 'CASH_DRAWER',
        matchedQuestion: question,
        language: 'tl',
        headline: 'Kuwenta ng Pera sa Kaha (Cash Drawer)',
        answer: `Ang inaasahang pera sa kaha ay ${money(telemetry.expected_drawer_cash_c)}.`,
        bullets: [
          `Panimulang Pondo: ${money(telemetry.opening_float_c)}`,
          `Cash na Benta: +${money(telemetry.cash_c)}`,
          `Cash In (Dagdag Pondo): +${money(telemetry.cash_in_c)}`,
          `Cash Out (Bawas Pondo): -${money(telemetry.cash_out_c)}`,
          `Gastos sa Kaha: -${money(telemetry.cash_expenses_c)}`,
          `Pasauli sa Customer (Refunds): -${money(telemetry.cash_refunds_c)}`,
          `Kabuuang Inaasahan sa Kaha: ${money(telemetry.expected_drawer_cash_c)}`
        ],
        action: { label: 'Pumunta sa Shifts & Cash Count ↗', page: 'shifts' },
        speechText: sanitizeTextForSpeech(
          `Ang inaasahang pera sa inyong kaha ay ${formatCurrencyForSpeech(telemetry.expected_drawer_cash_c, 'tl')}.`,
          'tl'
        )
      }
    } else {
      return {
        intent: 'CASH_DRAWER',
        matchedQuestion: question,
        language: 'en',
        headline: 'Cash Drawer Expected Balance',
        answer: `Expected physical drawer cash is ${money(telemetry.expected_drawer_cash_c)}.`,
        bullets: [
          `Opening Float: ${money(telemetry.opening_float_c)}`,
          `Cash Sales: +${money(telemetry.cash_c)}`,
          `Cash In Movements: +${money(telemetry.cash_in_c)}`,
          `Cash Out Movements: -${money(telemetry.cash_out_c)}`,
          `Paid Cash Expenses: -${money(telemetry.cash_expenses_c)}`,
          `Cash Refunds Paid: -${money(telemetry.cash_refunds_c)}`,
          `Total Expected Drawer Cash: ${money(telemetry.expected_drawer_cash_c)}`
        ],
        action: { label: 'Open Shifts & Drawer Reconciliation ↗', page: 'shifts' },
        speechText: sanitizeTextForSpeech(
          `Expected cash in drawer is ${formatCurrencyForSpeech(telemetry.expected_drawer_cash_c, 'en')}.`,
          'en'
        )
      }
    }
  }

  // Intent 5: Voids / Na-void na benta
  if (
    q.includes('void') ||
    q.includes('kansela') ||
    q.includes('na-void') ||
    q.includes('canceled') ||
    q.includes('cancelled')
  ) {
    if (lang === 'tl') {
      return {
        intent: 'VOIDS',
        matchedQuestion: question,
        language: 'tl',
        headline: 'Ulat sa Na-void na Transaksyon',
        answer:
          telemetry.void_count > 0
            ? `May ${telemetry.void_count} na na-void na resibo ngayong araw na may kabuuang ${money(telemetry.void_total_c)}.`
            : 'Wala pong naitalang na-void na benta ngayong araw.',
        bullets: [
          `Bilang ng Voided Sales: ${telemetry.void_count}`,
          `Kabuuang Halaga ng Void: ${money(telemetry.void_total_c)}`
        ],
        action: { label: 'Tingnan ang Transactions Ledger ↗', page: 'transactions' },
        speechText: sanitizeTextForSpeech(
          telemetry.void_count > 0
            ? `May ${telemetry.void_count} na-void na transaksyon na nagkakahalaga ng ${formatCurrencyForSpeech(telemetry.void_total_c, 'tl')}.`
            : 'Walang na-void na transaksyon ngayong araw.',
          'tl'
        )
      }
    } else {
      return {
        intent: 'VOIDS',
        matchedQuestion: question,
        language: 'en',
        headline: 'Voided Transactions Report',
        answer:
          telemetry.void_count > 0
            ? `There are ${telemetry.void_count} voided transaction(s) totaling ${money(telemetry.void_total_c)} today.`
            : 'Zero voided transactions recorded today.',
        bullets: [
          `Total Voids Count: ${telemetry.void_count}`,
          `Total Voided Amount: ${money(telemetry.void_total_c)}`
        ],
        action: { label: 'Open Transactions Ledger ↗', page: 'transactions' },
        speechText: sanitizeTextForSpeech(
          telemetry.void_count > 0
            ? `There are ${telemetry.void_count} voided transactions totaling ${formatCurrencyForSpeech(telemetry.void_total_c, 'en')}.`
            : 'Zero voided transactions recorded today.',
          'en'
        )
      }
    }
  }

  // Intent 6: Total Sales / Kita / Benta
  if (
    q.includes('sales') ||
    q.includes('benta') ||
    q.includes('kita') ||
    q.includes('net sales') ||
    q.includes('gross') ||
    q.includes('magkano benta')
  ) {
    if (lang === 'tl') {
      return {
        intent: 'SALES_SUMMARY',
        matchedQuestion: question,
        language: 'tl',
        headline: 'Kabuuang Benta Ngayong Araw',
        answer: `Ang Net Sales ngayong araw ay ${money(telemetry.net_sales_c)} mula sa ${telemetry.transaction_count} na benta.`,
        bullets: [
          `Net Sales: ${money(telemetry.net_sales_c)}`,
          `Gross Sales: ${money(telemetry.gross_sales_c)}`,
          `Naibigay na Diskwento: ${money(telemetry.discount_c)}`,
          `Pina-refund: ${money(telemetry.refund_total_c)}`,
          `Bilang ng Transaksyon: ${telemetry.transaction_count}`
        ],
        action: { label: 'Tingnan ang Sales Analytics ↗', page: 'reports' },
        speechText: sanitizeTextForSpeech(
          `Ang kabuuang net sales ngayong araw ay ${formatCurrencyForSpeech(telemetry.net_sales_c, 'tl')}.`,
          'tl'
        )
      }
    } else {
      return {
        intent: 'SALES_SUMMARY',
        matchedQuestion: question,
        language: 'en',
        headline: "Today's Sales Summary",
        answer: `Net sales today is ${money(telemetry.net_sales_c)} across ${telemetry.transaction_count} completed transactions.`,
        bullets: [
          `Net Sales: ${money(telemetry.net_sales_c)}`,
          `Gross Sales: ${money(telemetry.gross_sales_c)}`,
          `Discounts: ${money(telemetry.discount_c)}`,
          `Refunds: ${money(telemetry.refund_total_c)}`,
          `Total Transactions: ${telemetry.transaction_count}`
        ],
        action: { label: 'Open Sales Reports ↗', page: 'reports' },
        speechText: sanitizeTextForSpeech(
          `Today's net sales is ${formatCurrencyForSpeech(telemetry.net_sales_c, 'en')}.`,
          'en'
        )
      }
    }
  }

  // Intent 7: Utang / Customer Receivables
  if (
    q.includes('utang') ||
    q.includes('credit') ||
    q.includes('suki') ||
    q.includes('singil') ||
    q.includes('receivable')
  ) {
    if (lang === 'tl') {
      return {
        intent: 'UTANG',
        matchedQuestion: question,
        language: 'tl',
        headline: 'Katayuan ng Pautang sa Suki',
        answer: `May kabuuang ${money(telemetry.unpaid_utang_due.total_outstanding_c)} na pautang mula sa ${telemetry.unpaid_utang_due.customer_count} na suki.`,
        bullets: [
          `Kabuuang Utang: ${money(telemetry.unpaid_utang_due.total_outstanding_c)}`,
          `Bilang ng May Utang: ${telemetry.unpaid_utang_due.customer_count}`,
          `Lumagpas sa Credit Limit: ${telemetry.unpaid_utang_due.over_limit_count} suki`,
          ...telemetry.unpaid_utang_due.top_debtors.map(
            (d) => `${d.name}: ${money(d.balance_c)}${d.is_over_limit ? ' ⚠️ over limit' : ''}`
          )
        ],
        action: { label: 'Buksan ang Utang Ledger ↗', page: 'utang' },
        speechText: sanitizeTextForSpeech(
          `Ang kabuuang pautang sa suki ay ${formatCurrencyForSpeech(telemetry.unpaid_utang_due.total_outstanding_c, 'tl')}.`,
          'tl'
        )
      }
    } else {
      return {
        intent: 'UTANG',
        matchedQuestion: question,
        language: 'en',
        headline: 'Customer Credit & Utang Summary',
        answer: `Outstanding customer credit is ${money(telemetry.unpaid_utang_due.total_outstanding_c)} across ${telemetry.unpaid_utang_due.customer_count} customer(s).`,
        bullets: [
          `Total Outstanding Balance: ${money(telemetry.unpaid_utang_due.total_outstanding_c)}`,
          `Debtor Count: ${telemetry.unpaid_utang_due.customer_count}`,
          `Over-Limit Accounts: ${telemetry.unpaid_utang_due.over_limit_count}`,
          ...telemetry.unpaid_utang_due.top_debtors.map(
            (d) => `${d.name}: ${money(d.balance_c)}${d.is_over_limit ? ' ⚠️ over limit' : ''}`
          )
        ],
        action: { label: 'Open Utang Ledger ↗', page: 'utang' },
        speechText: sanitizeTextForSpeech(
          `Outstanding customer credit is ${formatCurrencyForSpeech(telemetry.unpaid_utang_due.total_outstanding_c, 'en')}.`,
          'en'
        )
      }
    }
  }

  // Intent 8: E-Wallet / GCash / Maya
  if (
    q.includes('gcash') ||
    q.includes('maya') ||
    q.includes('wallet') ||
    q.includes('maribank')
  ) {
    if (lang === 'tl') {
      return {
        intent: 'EWALLET',
        matchedQuestion: question,
        language: 'tl',
        headline: 'Koleksyon sa GCash at Maya',
        answer: `Nakatanggap po ang tindahan ng ${money(telemetry.gcash_c)} sa GCash at ${money(telemetry.maya_c)} sa Maya ngayong araw.`,
        bullets: [
          `GCash Collections: ${money(telemetry.gcash_c)}`,
          `Maya Collections: ${money(telemetry.maya_c)}`,
          `MariBank Collections: ${money(telemetry.maribank_c)}`,
          `Kabuuang Digital Payments: ${money(telemetry.gcash_c + telemetry.maya_c + telemetry.maribank_c)}`
        ],
        action: { label: 'Buksan ang E-Wallet Audit ↗', page: 'ewallet', tab: 'audit' },
        speechText: sanitizeTextForSpeech(
          `Ang GCash collection ay ${formatCurrencyForSpeech(telemetry.gcash_c, 'tl')} at ang Maya ay ${formatCurrencyForSpeech(telemetry.maya_c, 'tl')}.`,
          'tl'
        )
      }
    } else {
      return {
        intent: 'EWALLET',
        matchedQuestion: question,
        language: 'en',
        headline: 'Digital E-Wallet Collections',
        answer: `Digital collections today: ${money(telemetry.gcash_c)} via GCash and ${money(telemetry.maya_c)} via Maya.`,
        bullets: [
          `GCash Collections: ${money(telemetry.gcash_c)}`,
          `Maya Collections: ${money(telemetry.maya_c)}`,
          `MariBank Collections: ${money(telemetry.maribank_c)}`,
          `Combined Digital Settlements: ${money(telemetry.gcash_c + telemetry.maya_c + telemetry.maribank_c)}`
        ],
        action: { label: 'Open E-Wallet Audit Hub ↗', page: 'ewallet', tab: 'audit' },
        speechText: sanitizeTextForSpeech(
          `GCash collection is ${formatCurrencyForSpeech(telemetry.gcash_c, 'en')} and Maya is ${formatCurrencyForSpeech(telemetry.maya_c, 'en')}.`,
          'en'
        )
      }
    }
  }

  // Default Fallback: Full briefing summary
  const briefing = generateStoreBriefing(telemetry, lang)
  return {
    intent: 'GENERAL_SUMMARY',
    matchedQuestion: question,
    language: lang,
    headline: briefing.statusHeadline,
    answer:
      lang === 'tl'
        ? `Kabuuang Net Sales ay ${money(telemetry.net_sales_c)} at ang pera sa kaha ay ${money(telemetry.expected_drawer_cash_c)}.`
        : `Net sales is ${money(telemetry.net_sales_c)} with ${money(telemetry.expected_drawer_cash_c)} expected in drawer.`,
    bullets: [
      ...briefing.salesPerformance.bulletPoints.slice(0, 2),
      ...briefing.cashSecurity.bulletPoints.slice(0, 2),
      ...briefing.inventoryAlerts.bulletPoints.slice(0, 2)
    ],
    action: { label: 'Tingnan ang Dashboard ↗', page: 'dashboard' },
    speechText: briefing.speechScript
  }
}

/**
 * Global speech synthesizer controller.
 */
let activeUtterance: SpeechSynthesisUtterance | null = null

/**
 * Speaks the text using browser window.speechSynthesis.
 */
export function speakAdvisorBriefing(
  text: string,
  options?: SpeechOptions
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('[AI Store Advisor] speechSynthesis is not supported in this environment.')
      resolve()
      return
    }

    try {
      window.speechSynthesis.cancel()
    } catch {}

    const lang = options?.lang || 'en'
    const cleanText = sanitizeTextForSpeech(text, lang === 'tl' ? 'tl' : 'en')

    if (!cleanText.trim()) {
      resolve()
      return
    }

    const utterance = new SpeechSynthesisUtterance(cleanText)
    activeUtterance = utterance

    utterance.rate = options?.rate ?? 1.0
    utterance.pitch = options?.pitch ?? 1.0
    utterance.volume = options?.volume ?? 1.0

    // Match best available voice
    try {
      const voices = window.speechSynthesis.getVoices()
      if (voices && voices.length > 0) {
        if (lang === 'tl') {
          const phVoice = voices.find(
            (v) =>
              v.lang.toLowerCase().includes('fil') ||
              v.lang.toLowerCase().includes('tl') ||
              v.lang.toLowerCase() === 'en-ph'
          )
          if (phVoice) utterance.voice = phVoice
        } else {
          const enVoice = voices.find(
            (v) =>
              v.lang.toLowerCase() === 'en-ph' ||
              v.lang.toLowerCase() === 'en-us' ||
              v.lang.toLowerCase().startsWith('en')
          )
          if (enVoice) utterance.voice = enVoice
        }
      }
    } catch {}

    utterance.onstart = () => {
      options?.onStart?.()
    }

    utterance.onend = () => {
      activeUtterance = null
      options?.onEnd?.()
      resolve()
    }

    utterance.onerror = (err) => {
      activeUtterance = null
      options?.onError?.(err)
      resolve()
    }

    window.speechSynthesis.speak(utterance)
  })
}

/**
 * Stops any active speech playback immediately.
 */
export function stopAdvisorSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
      activeUtterance = null
    } catch {}
  }
}

/**
 * Returns true if speech synthesis is currently speaking.
 */
export function isAdvisorSpeaking(): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking
  }
  return false
}

/**
 * Convenient alias for answerStoreQuestion accepting (question, telemetry, preferredLang).
 */
export function askAdvisorQuestion(
  question: string,
  telemetry: StoreTelemetrySummary,
  preferredLang?: AdvisorLanguage
): AdvisorQAResponse {
  return answerStoreQuestion(telemetry, question, preferredLang)
}

/**
 * Asks the AI Advisor using Boss's OpenCode Free Models pool & Gemini engine,
 * falling back automatically to the offline deterministic rules engine.
 */
export async function askAdvisorWithAi(
  question: string,
  telemetry: StoreTelemetrySummary,
  lang: AdvisorLanguage = 'en'
): Promise<AdvisorQAResponse> {
  if (typeof window !== 'undefined' && window.api?.ai?.askAdvisor) {
    try {
      const res = await window.api.ai.askAdvisor(question, telemetry, lang)
      if (res && res.reply) {
        return {
          intent: 'AI_COPILOT',
          matchedQuestion: question,
          language: lang,
          headline:
            lang === 'tl'
              ? 'TINDA AI Advisor Pagsusuri'
              : 'TINDA AI Store Analysis',
          answer: res.reply,
          bullets: [],
          action: res.action,
          speechText: res.reply,
          source: res.source
        }
      }
    } catch (err) {
      console.warn('[AI Store Advisor] AI IPC askAdvisor error, falling back to local heuristics:', err)
    }
  }

  // Instant deterministic local engine fallback
  const localRes = answerStoreQuestion(telemetry, question, lang)
  return {
    ...localRes,
    source: 'local_rules'
  }
}

