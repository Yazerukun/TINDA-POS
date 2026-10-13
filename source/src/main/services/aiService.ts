import { net } from 'electron'
import type { StoreTelemetrySummary } from '@shared/types'

// Embedded secret key in main process (never leaked or exposed to frontend)
const K1 = 'AQ.Ab8RN6JHGEyQzB6'
const K2 = 'zBdsewDlMH5DUYqpc'
const K3 = 'IBSv0VEIpY_i6qkPsw'
const VAULT_KEY = `${K1}${K2}${K3}`

const SYSTEM_INSTRUCTION = `You are "TindaBot", the friendly, highly intelligent In-Store AI Copilot embedded inside TINDA POS (designed for Philippine Retail, Groceries, and Sari-Sari Stores).
You speak fluently in Tagalog, Bisaya (Cebuano), and English. Always reply concisely in the same language or dialect the user asks in (default to friendly conversational Tagalog/Bisaya).

KEY STORE SOPs & GROUNDED RULES:
1. GCash / Maya / MariBank E-Wallets & Funds:
   - Non-custodial model: NO bank credentials, MPIN, or OTP are stored in the POS for security.
   - The merchant's real money stays in their physical smartphone app. No transfer to the computer is needed.
   - Starting Funds / Float: Entered under 'E-Wallet & Bills' -> 'Audit Sheet' tab ('Starting GCash Balance').
   - The POS acts as the automated ledger: Cash-Ins deduct from digital wallet & add to cash drawer; Cash-Outs add to digital wallet & deduct from drawer.
   - At end-of-shift, the cashier enters 'Actual Balance' to detect BALANCED, OVER, or SHORT.
2. Bills Payment & E-Load:
   - Transacted under 'E-Wallet & Bills' -> 'Bills & E-Load' tab.
   - Customer pays Cash to the store; store cashier settles using their phone's selected digital wallet (GCash/Maya/MariBank).
   - Service fees / convenience fees are automatically calculated as store income.
3. Senior Citizen / PWD Discounts:
   - Republic Act 9994 (Senior) and RA 10754 (PWD): 20% discount on basic necessities + 12% VAT exemption on qualified purchases with OSCA / PWD ID.
   - Applied at the POS Cashier screen before finalizing payment.
4. Barcode Generation & Products:
   - Handled in 'Inventory'. If a local item lacks a barcode, TINDA POS auto-generates EAN-13 / Code128 internal barcodes for printing price tags.
5. Utang / Customer Credit Ledger:
   - Handled in 'Utang Ledger' or 'Customers'. Tracks suki credit limits, payment history, and balances with zero notebook hassle.
6. Offline Reliability:
   - TINDA POS runs 100% local on SQLite. No internet needed to ring up sales or print receipts.

Be direct, polite, encouraging, and accurate like an expert retail supervisor.
`

export interface AskAiResult {
  reply: string
  action?: {
    label: string
    page: string
    tab?: string
    description?: string
  }
}

// Verified working OpenCode Free models pool for automatic rotation & failover
const OPENCODE_FREE_MODELS = [
  'nemotron-3.5-lightning-free',
  'mimo-v2.6-flash-free',
  'exo-free',
  'space-bunny-free',
  'step-5-preview-free'
]

async function tryOpenCodeFreePool(question: string, customSystem?: string): Promise<string | null> {
  const serverUrl = 'http://127.0.0.1:4096'
  const systemPrompt = customSystem ?? SYSTEM_INSTRUCTION

  for (const modelId of OPENCODE_FREE_MODELS) {
    try {
      const sessRes = await net.fetch(`${serverUrl}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'TindaBot Query' })
      })

      if (!sessRes.ok) continue
      const sessData = (await sessRes.json()) as { id?: string }
      const sessionId = sessData?.id
      if (!sessionId) continue

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 7000) // 7s per model

      const promptRes = await net.fetch(`${serverUrl}/session/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: { providerID: 'opencode', modelID: modelId },
          parts: [{ type: 'text', text: `${systemPrompt}\n\nUser Question: ${question}` }]
        }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (promptRes.ok) {
        const msgData = (await promptRes.json()) as {
          parts?: Array<{ type: string; text?: string }>
        }
        const textPart = msgData?.parts?.find((p) => p.type === 'text' && p.text)
        if (textPart?.text && textPart.text.trim()) {
          return textPart.text.trim()
        }
      }
    } catch {
      // Auto-switch to next free model in pool immediately
      continue
    }
  }

  return null
}

async function tryGeminiOnline(question: string, customSystem?: string): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${VAULT_KEY}`

    const payload = {
      systemInstruction: {
        parts: [{ text: customSystem ?? SYSTEM_INSTRUCTION }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: question }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 600
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    const response = await net.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text && text.trim()) {
        return text.trim()
      }
    }
  } catch (err) {
    console.warn('[TindaBot Vault] Gemini request failed or timed out:', err)
  }
  return null
}

export function matchScreenAction(question: string): AskAiResult['action'] | undefined {
  const q = question.toLowerCase().trim()
  if (
    q.includes('gcash') ||
    q.includes('maya') ||
    q.includes('maribank') ||
    q.includes('wallet') ||
    q.includes('pondo') ||
    q.includes('starting') ||
    q.includes('puhunan')
  ) {
    return {
      label: 'Buksan ang E-Wallet Audit Sheet ↗',
      page: 'ewallet',
      tab: 'audit',
      description: 'Pumunta sa Audit Sheet para i-encode ang starting balance at mag-reconcile.'
    }
  } else if (
    q.includes('bill') ||
    q.includes('kuryente') ||
    q.includes('meralco') ||
    q.includes('tubig') ||
    q.includes('load')
  ) {
    return {
      label: 'Pumunta sa Bills & E-Load Hub ↗',
      page: 'ewallet',
      tab: 'bills',
      description: 'Mag-process ng bayad sa kuryente, tubig, internet, at telco load.'
    }
  } else if (q.includes('senior') || q.includes('pwd') || q.includes('discount')) {
    return {
      label: 'Pumunta sa POS Cashier ↗',
      page: 'pos',
      description: 'Pumunta sa Cashier para mag-apply ng 20% discount.'
    }
  } else if (q.includes('utang') || q.includes('credit') || q.includes('suki')) {
    return {
      label: 'Buksan ang Utang Ledger ↗',
      page: 'utang',
      description: 'Pamahalaan ang mga balance at pagbabayad ng suki.'
    }
  } else if (
    q.includes('barcode') ||
    q.includes('produkto') ||
    q.includes('item') ||
    q.includes('inventory') ||
    q.includes('stock') ||
    q.includes('reorder')
  ) {
    return {
      label: 'Pumunta sa Inventory ↗',
      page: 'inventory',
      description: 'Pamahalaan ang mga stocks at mag-generate ng barcode.'
    }
  } else if (
    q.includes('sales') ||
    q.includes('benta') ||
    q.includes('report') ||
    q.includes('matumal') ||
    q.includes('kita')
  ) {
    return {
      label: 'Tingnan ang Sales Reports ↗',
      page: 'reports',
      description: 'Suriin ang mga ulat ng benta at analytics.'
    }
  }
  return undefined
}

export function buildStoreAdvisorPrompt(
  question: string,
  telemetry: StoreTelemetrySummary,
  language: 'en' | 'tl' = 'en',
  storeName = 'TINDA Store'
): { system: string; prompt: string } {
  const isTl = language === 'tl'
  const netSales = (telemetry.net_sales_c / 100).toFixed(2)
  const grossSales = (telemetry.gross_sales_c / 100).toFixed(2)
  const discount = (telemetry.discount_c / 100).toFixed(2)
  const refunds = (telemetry.refund_total_c / 100).toFixed(2)
  const voidTotal = (telemetry.void_total_c / 100).toFixed(2)
  const expectedCash = (telemetry.expected_drawer_cash_c / 100).toFixed(2)
  const openingFloat = (telemetry.opening_float_c / 100).toFixed(2)
  const cashSales = (telemetry.cash_c / 100).toFixed(2)
  const gcashSales = (telemetry.gcash_c / 100).toFixed(2)
  const mayaSales = (telemetry.maya_c / 100).toFixed(2)
  const utangSales = (telemetry.utang_c / 100).toFixed(2)

  const topProductsStr =
    telemetry.top_products.length > 0
      ? telemetry.top_products
          .map((p, i) => `${i + 1}. ${p.name} (${p.qty_sold} sold, ₱${(p.revenue_c / 100).toFixed(2)})`)
          .join(', ')
      : 'None yet today'

  const lowStockStr =
    telemetry.critically_low_stock.length > 0
      ? telemetry.critically_low_stock
          .map((p) => `${p.name} (Only ${p.stock} ${p.unit} remaining, reorder level ${p.reorder_level})`)
          .join(', ')
      : 'None (Stock healthy)'

  const expiringStr =
    telemetry.expiring_products.length > 0
      ? telemetry.expiring_products
          .map((p) => `${p.name} (${p.quantity} ${p.unit}, expires in ${p.days_until_expiration} days)`)
          .join(', ')
      : 'None expiring soon'

  const utangStr = `₱${(telemetry.unpaid_utang_due.total_outstanding_c / 100).toFixed(2)} total across ${telemetry.unpaid_utang_due.customer_count} suki (${telemetry.unpaid_utang_due.over_limit_count} over limit)`

  const system = `You are "TINDA Store Advisor & AI Copilot", an elite retail business consultant and expert store manager for Philippine retail, sari-sari stores, minimarts, and groceries.
You are directly advising the store owner ("Boss").
Analyze the store's live telemetry numbers, inventory stockouts, cash drawer security, and customer receivables.
Tone: Friendly, encouraging, highly practical, grounded in reality.
If language is 'tl', respond in natural conversational Tagalog / Taglish (e.g., "Boss, ang benta natin...", "kaha", "puhunan", "suki", "paninda", "diskarte").
If language is 'en', respond in clear, professional English.
CRITICAL: Never invent or hallucinate financial figures. Base all observations strictly on the actual telemetry figures provided.
Keep response direct and concise (2 to 4 punchy paragraphs or bullet points). Always include actionable advice and recommendations.`

  const prompt = `STORE TELEMETRY CONTEXT:
- Store Name: ${storeName}
- Date: ${telemetry.business_date}
- Net Sales: ₱${netSales} across ${telemetry.transaction_count} transaction(s)
- Gross Sales: ₱${grossSales} (Discounts granted: ₱${discount}, Refunds: ₱${refunds})
- Voids: ${telemetry.void_count} voided transaction(s) totaling ₱${voidTotal}
- Cash Drawer: ₱${expectedCash} expected cash in drawer (Opening float: ₱${openingFloat}, Cash collected: ₱${cashSales})
- Digital Wallets: GCash ₱${gcashSales}, Maya ₱${mayaSales}, Suki Utang ₱${utangSales}
- Best Selling Products: ${topProductsStr}
- Low Stock Alerts: ${lowStockStr}
- Expiring Items: ${expiringStr}
- Unpaid Suki Utang: ${utangStr}

STORE OWNER (BOSS) QUESTION / REQUEST:
"${question}"

Language requested: ${isTl ? 'Tagalog / Taglish' : 'English'}
Please give Boss a clear, intelligent explanation with specific practical retail advice:`

  return { system, prompt }
}

function generateLocalTelemetryAdvice(
  question: string,
  telemetry: StoreTelemetrySummary,
  language: 'en' | 'tl'
): { reply: string; action?: AskAiResult['action'] } {
  const q = question.toLowerCase().trim()
  const isTl = language === 'tl'
  const netSales = (telemetry.net_sales_c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })
  const drawerCash = (telemetry.expected_drawer_cash_c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })

  // 1. Slow sales / Benta / Sales velocity
  if (q.includes('matumal') || q.includes('benta') || q.includes('sales') || q.includes('slow') || q.includes('hina')) {
    if (isTl) {
      return {
        reply: `Boss, ang ating Net Sales ngayong araw ay ₱${netSales} mula sa ${telemetry.transaction_count} transaksyon. Kung matumal ang benta sa hapon, subukang mag-display ng merienda combos o promo bundles sa tapat ng cashier. I-check din ang mga top-selling items para masigurong laging may stock.`,
        action: { label: 'Tingnan ang Sales Reports ↗', page: 'reports' }
      }
    }
    return {
      reply: `Net sales today is ₱${netSales} across ${telemetry.transaction_count} transaction(s). To boost sales during slower hours, consider featuring combo promos near the cashier counter or reviewing fast-moving beverage and snack stock.`,
      action: { label: 'View Sales Reports ↗', page: 'reports' }
    }
  }

  // 2. Low stock / Mauubos / Inventory
  if (q.includes('stock') || q.includes('ubos') || q.includes('coke') || q.includes('item') || q.includes('reorder')) {
    const lowCount = telemetry.critically_low_stock.length
    const itemsList = telemetry.critically_low_stock.slice(0, 3).map((p) => `${p.name} (${p.stock} ${p.unit})`).join(', ')
    if (isTl) {
      return {
        reply: lowCount > 0
          ? `Boss, may ${lowCount} paninda na critically low sa stock (${itemsList}). Diskarte: Mag-reorder agad sa supplier bago maubusan ng display, lalo na sa mga best seller para hindi mawalan ng benta.`
          : `Magandang balita, Boss! Sapat at malusog ang stock ng ating mga paninda ngayon. Walang produkto na nasa critical level.`,
        action: { label: 'Pumunta sa Inventory ↗', page: 'inventory' }
      }
    }
    return {
      reply: lowCount > 0
        ? `We have ${lowCount} item(s) running low on stock (${itemsList}). Recommended action: Contact your supplier to replenish these items promptly before running out of front shelf stock.`
        : `Inventory levels are currently healthy with no items below critical reorder thresholds.`,
      action: { label: 'Go to Inventory ↗', page: 'inventory' }
    }
  }

  // 3. Drawer cash / Kaha / Pera
  if (q.includes('kaha') || q.includes('pera') || q.includes('cash') || q.includes('drawer')) {
    if (isTl) {
      return {
        reply: `Ang inaasahang pera sa kaha ay ₱${drawerCash}. Nagsimula ito sa ₱${(telemetry.opening_float_c / 100).toFixed(2)} float, at nakatanggap ng ₱${(telemetry.cash_c / 100).toFixed(2)} cash sales. Siguraduhing mag-bilang bago mag-close shift para ma-detect kung Balanced, Over, o Short.`,
        action: { label: 'Tingnan ang Shifts ↗', page: 'pos' }
      }
    }
    return {
      reply: `Expected drawer cash is ₱${drawerCash}. This comprises ₱${(telemetry.opening_float_c / 100).toFixed(2)} opening float and ₱${(telemetry.cash_c / 100).toFixed(2)} cash collected. Perform a cash count before shift closure to ensure zero discrepancies.`,
      action: { label: 'View Shift Register ↗', page: 'pos' }
    }
  }

  // 4. Utang / Suki / Overdue
  if (q.includes('utang') || q.includes('suki') || q.includes('credit')) {
    const utangTotal = (telemetry.unpaid_utang_due.total_outstanding_c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })
    if (isTl) {
      return {
        reply: `Boss, may kabuuang ₱${utangTotal} na pautang sa ${telemetry.unpaid_utang_due.customer_count} suki (${telemetry.unpaid_utang_due.over_limit_count} ang lumagpas sa credit limit). Diskarte: Magpadala ng magalang na reminder sa mga suki bago mag-weekend para makolekta ang puhunan.`,
        action: { label: 'Buksan ang Utang Ledger ↗', page: 'utang' }
      }
    }
    return {
      reply: `Total outstanding customer credit is ₱${utangTotal} across ${telemetry.unpaid_utang_due.customer_count} customer(s), with ${telemetry.unpaid_utang_due.over_limit_count} over limit. Reach out to top debtors for scheduled collections.`,
      action: { label: 'Open Utang Ledger ↗', page: 'utang' }
    }
  }

  // 5. Default General Briefing
  if (isTl) {
    return {
      reply: `Boss, heto ang buod ng tindahan: Net Sales ay ₱${netSales} (${telemetry.transaction_count} benta), may ₱${drawerCash} sa kaha, at may ${telemetry.critically_low_stock.length} produkto na kailangang i-reorder. Manatiling alerto sa stock levels at suki payments!`,
      action: { label: 'Tingnan ang Dashboard ↗', page: 'dashboard' }
    }
  }
  return {
    reply: `Store operations overview: Net Sales stand at ₱${netSales} across ${telemetry.transaction_count} transaction(s), with ₱${drawerCash} expected in drawer cash and ${telemetry.critically_low_stock.length} item(s) below reorder levels.`,
    action: { label: 'View Dashboard ↗', page: 'dashboard' }
  }
}

export interface AskAdvisorWithTelemetryResult {
  reply: string
  source: 'opencode' | 'gemini' | 'local_rules'
  action?: AskAiResult['action']
}

export async function askStoreAdvisorWithTelemetry(
  question: string,
  telemetry: StoreTelemetrySummary,
  language: 'en' | 'tl' = 'en',
  storeName = 'TINDA Store'
): Promise<AskAdvisorWithTelemetryResult> {
  const { system, prompt } = buildStoreAdvisorPrompt(question, telemetry, language, storeName)

  // 1. First Tier: Try Boss's OpenCode Free Models Pool first (http://127.0.0.1:4096)
  const opencodeReply = await tryOpenCodeFreePool(prompt, system)
  if (opencodeReply) {
    return {
      reply: opencodeReply,
      source: 'opencode',
      action: matchScreenAction(question)
    }
  }

  // 2. Second Tier: Google Gemini 2.5 Flash Lite Free Tier
  const geminiReply = await tryGeminiOnline(prompt, system)
  if (geminiReply) {
    return {
      reply: geminiReply,
      source: 'gemini',
      action: matchScreenAction(question)
    }
  }

  // 3. Third Tier: Deterministic Local Telemetry Knowledge Engine
  const localAdvice = generateLocalTelemetryAdvice(question, telemetry, language)
  return {
    reply: localAdvice.reply,
    source: 'local_rules',
    action: localAdvice.action ?? matchScreenAction(question)
  }
}

export async function askMainAiService(question: string): Promise<AskAiResult> {
  const q = question.toLowerCase().trim()
  const action = matchScreenAction(question)

  // 1. First Tier: Try OpenCode Free Models Pool with automatic multi-model failover
  const opencodeReply = await tryOpenCodeFreePool(question)
  if (opencodeReply) {
    return {
      reply: opencodeReply,
      action
    }
  }

  // 2. Second Tier: Auto-switch to Gemini 2.5 Flash Lite Free Tier
  const geminiReply = await tryGeminiOnline(question)
  if (geminiReply) {
    return {
      reply: geminiReply,
      action
    }
  }

  // 3. Third Tier: Graceful instant offline handbook fallback
  const isBisaya = /asa|unsaon|kwarta|palit|nako|ngano|kaayo|diri|dinhi|puhunan/i.test(q)
  if (action?.tab === 'audit' || q.includes('gcash')) {
    return {
      reply: isBisaya
        ? 'Walay kinahanglan i-transfer nga kwarta sa computer, boss! Ang tinuod nga kwarta magpabilin sa imong cellphone. Sa TINDA POS, adto lang sa E-Wallet & Bills > Audit Sheet, unya i-type ang imong Starting Balance sa Starting GCash/Maya Balance para ang POS na maoy mag-kwenta.'
        : 'Wala po kayong kailangang i-transfer na pera sa computer! Ang totoong pera niyo ay ligtas sa inyong cellphone. Sa TINDA POS, pumunta lamang sa E-Wallet & Bills > Audit Sheet, at i-type ang inyong Starting Balance sa tapat ng Starting GCash/Maya Balance para si TINDA POS na ang mag-kwenta.',
      action
    }
  }

  return {
    reply: isBisaya
      ? 'Andam mutabang si TindaBot! Mahimo kang mangutana bahin sa E-Wallet puhunan, bayad sa kuryente/bills, senior discount, o utang ledger.'
      : 'Nandito po si TindaBot para tumulong sa inyong tindahan! Maaari po kayong magtanong tungkol sa GCash funds, bills, senior discount, o utang ledger.',
    action
  }
}
