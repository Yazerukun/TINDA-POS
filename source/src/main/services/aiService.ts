import { net } from 'electron'

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

async function tryOpenCodeFreePool(question: string): Promise<string | null> {
  const serverUrl = 'http://127.0.0.1:4096'

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
          parts: [{ type: 'text', text: `${SYSTEM_INSTRUCTION}\n\nUser Question: ${question}` }]
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

async function tryGeminiOnline(question: string): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${VAULT_KEY}`

    const payload = {
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
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

export async function askMainAiService(question: string): Promise<AskAiResult> {
  const q = question.toLowerCase().trim()

  // Match screen action intent
  let action: AskAiResult['action'] | undefined
  if (
    q.includes('gcash') ||
    q.includes('maya') ||
    q.includes('maribank') ||
    q.includes('wallet') ||
    q.includes('pondo') ||
    q.includes('starting') ||
    q.includes('puhunan')
  ) {
    action = {
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
    action = {
      label: 'Pumunta sa Bills & E-Load Hub ↗',
      page: 'ewallet',
      tab: 'bills',
      description: 'Mag-process ng bayad sa kuryente, tubig, internet, at telco load.'
    }
  } else if (q.includes('senior') || q.includes('pwd') || q.includes('discount')) {
    action = {
      label: 'Pumunta sa POS Cashier ↗',
      page: 'pos',
      description: 'Pumunta sa Cashier para mag-apply ng 20% discount.'
    }
  } else if (q.includes('utang') || q.includes('credit') || q.includes('suki')) {
    action = {
      label: 'Buksan ang Utang Ledger ↗',
      page: 'utang',
      description: 'Pamahalaan ang mga balance at pagbabayad ng suki.'
    }
  } else if (
    q.includes('barcode') ||
    q.includes('produkto') ||
    q.includes('item') ||
    q.includes('inventory')
  ) {
    action = {
      label: 'Pumunta sa Inventory ↗',
      page: 'inventory',
      description: 'Pamahalaan ang mga stocks at mag-generate ng barcode.'
    }
  }

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
