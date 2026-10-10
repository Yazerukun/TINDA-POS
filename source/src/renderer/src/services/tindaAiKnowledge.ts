import { PageKey } from '../stores/nav'

export interface AssistantAction {
  label: string
  page: PageKey
  tab?: string
  description?: string
}

export interface AssistantTopic {
  id: string
  title: string
  keywords: string[]
  questionPatterns: string[]
  tagalogReply: string
  bisayaReply: string
  englishReply: string
  action?: AssistantAction
}

export const TINDA_SYSTEM_PROMPT = `You are "TindaBot", the friendly, highly intelligent In-Store AI Copilot and Operations Mentor embedded inside TINDA POS (designed for Philippine Retail, Groceries, Minimarts, and Sari-Sari Stores).
You speak fluently in Tagalog, Bisaya (Cebuano), and English. Always reply in the same language or dialect the user asks in (default to friendly conversational Tagalog/Bisaya).

KEY STORE SOPs & RULES:
1. GCash / Maya / MariBank E-Wallets & Funds:
   - Non-custodial model: NO bank credentials, MPIN, or OTP are stored in the POS for security.
   - The merchant's real money stays in their physical smartphone app.
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

When providing guidance, be direct, encouraging, practical, and polite like an experienced senior store supervisor.
`

export const BUILTIN_KNOWLEDGE_BASE: AssistantTopic[] = [
  {
    id: 'ewallet-funds',
    title: 'Saan ilalagay ang GCash / Maya Puhunan (Starting Funds)',
    keywords: ['gcash', 'maya', 'maribank', 'pondo', 'funds', 'puhunan', 'starting', 'balance', 'san ilalagay', 'asa ibutang', 'pera', 'float'],
    questionPatterns: [
      'san po ilalagay yung pera ng gcash ko',
      'saan ilalagay ang gcash funds',
      'asa ibutang ang puhunan sa gcash',
      'how to input gcash balance',
      'starting gcash balance'
    ],
    tagalogReply: 'Wala po kayong kailangang i-transfer na pera sa computer! Ang totoong pera niyo ay ligtas sa inyong cellphone. Sa TINDA POS, pumunta lamang sa E-Wallet & Bills > Audit Sheet, at i-type ang inyong Starting Balance (hal. ₱5,000) sa tapat ng Starting GCash/Maya Balance para si TINDA POS na ang awtomatikong mag-kwenta ng bawat Cash In, Cash Out, at Bills payment.',
    bisayaReply: 'Walay kinahanglan i-transfer nga kwarta sa computer, boss! Ang tinuod nga kwarta magpabilin sa imong cellphone para safe. Sa TINDA POS, adto lang sa E-Wallet & Bills > Audit Sheet, unya i-type ang imong Starting Balance sa Starting GCash/Maya Balance para ang POS na maoy mag-kwenta sa tanang Cash In, Cash Out, ug bayad sa Bills.',
    englishReply: 'No money transfer to the PC is required! Your funds remain secure in your mobile phone app. In TINDA POS, simply go to E-Wallet & Bills > Audit Sheet, and input your beginning float under Starting Balance. The system tracks all Cash Ins, Cash Outs, and Bills transactions automatically.',
    action: {
      label: 'Buksan ang E-Wallet Audit Sheet ↗',
      page: 'ewallet',
      tab: 'audit',
      description: 'Pumunta sa Audit Sheet para i-encode ang starting balance at mag-reconcile.'
    }
  },
  {
    id: 'bills-payment',
    title: 'Paano mag-transact ng Bills Payment at E-Load',
    keywords: ['bills', 'kuryente', 'meralco', 'veco', 'tubig', 'water', 'maynilad', 'load', 'eload', 'internet', 'pldt', 'converge', 'bayad'],
    questionPatterns: [
      'paano mag bayad ng bills',
      'unsaon pag bayad sa kuryente',
      'how to pay utility bills',
      'paano mag load'
    ],
    tagalogReply: 'Pumunta sa E-Wallet & Bills > Bills & E-Load tab. Piliin ang Biller (hal. Meralco, Maynilad, Home Credit, Globe/Smart Load), ilagay ang Account Number at Bill Amount. Awtomatikong dadagdag ang service fee bilang kita ng tindahan. I-aabot ng customer ang Cash sa kaha, habang ibabawas ng POS ang pambayad sa pinili mong digital wallet.',
    bisayaReply: 'Adto sa E-Wallet & Bills > Bills & E-Load tab. Pili-a ang Biller (pananglitan Meralco, VECO, Maynilad, o Telco Load), i-input ang Account Number ug Kantidad. Awtomatiko kining mag-add og service fee nga kita sa tindahan. Ihatag sa customer ang Cash sa kaha, samtang ang POS maoy mag-bawas sa napili nimong digital wallet.',
    englishReply: 'Head to E-Wallet & Bills > Bills & E-Load. Select the biller or telco promo, enter account details and bill amount. The convenience fee is automatically calculated as store profit. Cash is received in drawer while POS deducts from your chosen source wallet.',
    action: {
      label: 'Pumunta sa Bills & E-Load Hub ↗',
      page: 'ewallet',
      tab: 'bills',
      description: 'Mag-process ng Meralco, Tubig, Internet, at Telco E-Load.'
    }
  },
  {
    id: 'senior-pwd-discount',
    title: 'Senior Citizen & PWD Discount (RA 9994 / RA 10754)',
    keywords: ['senior', 'pwd', 'discount', 'diskwento', 'bawas', 'osca', '20%', 'vat exempt'],
    questionPatterns: [
      'paano mag senior discount',
      'unsaon pag apply og senior discount',
      'how to apply senior or pwd discount'
    ],
    tagalogReply: 'Sa POS Cashier screen, habang nasa cart ang mga bilihin ng customer bago mag-bayad, i-click lamang ang Discount button o pindutin ang F4/Shortcut. Piliin ang "Senior / PWD (20% + VAT Exempt)", at ilagay ang OSCA o PWD ID number ng customer alinsunod sa batas.',
    bisayaReply: 'Sa POS Cashier screen samtang naa sa cart ang mga palitonon sa kustomer, i-click ang Discount button. Pili-a ang "Senior / PWD (20% + VAT Exempt)", ug i-type ang ilang OSCA o PWD ID number subay sa balaod.',
    englishReply: 'On the POS Cashier screen before tender, click Discount and select "Senior / PWD (20% + VAT Exempt)". Enter the customer OSCA/PWD ID for compliance and audit trail.',
    action: {
      label: 'Pumunta sa POS Cashier ↗',
      page: 'pos',
      description: 'Bumalik sa Cashier register para mag-transact.'
    }
  },
  {
    id: 'utang-credit',
    title: 'Pautang at Suki Credit Ledger',
    keywords: ['utang', 'credit', 'suki', 'ledger', 'singil', 'bayad utang', 'customer balance'],
    questionPatterns: [
      'paano mag lista ng utang',
      'unsaon pag lista sa utang',
      'how to record customer credit'
    ],
    tagalogReply: 'Sa POS Cashier screen, kapag magbabayad ang suki, piliin ang "Charge to Utang / Suki Credit" bilang Payment Method. Maaari ding bisitahin ang Utang Ledger sa kaliwang menu upang makita ang buong listahan ng may utang, mag-record ng bayad, at mag-set ng credit limit.',
    bisayaReply: 'Sa POS Cashier screen inig bayad sa suki, pili-a ang "Charge to Utang" isip payment method. Pwede sab nimong ablihan ang Utang Ledger sa menu sa wala aron makita ang tanang balance, mag-dawat og bayad, ug mag-set og credit limit.',
    englishReply: 'Select "Charge to Utang" during checkout in POS Cashier, or navigate to Utang Ledger to view outstanding customer balances and post partial payments.',
    action: {
      label: 'Buksan ang Utang Ledger ↗',
      page: 'utang',
      description: 'Tingnan ang listahan ng pautang at mag-record ng bayad.'
    }
  },
  {
    id: 'add-product-barcode',
    title: 'Pag-dagdag ng Produkto at Barcode Printing',
    keywords: ['barcode', 'produkto', 'item', 'inventory', 'magdagdag', 'add product', 'print barcode', 'price tag'],
    questionPatterns: [
      'paano mag add ng produkto',
      'unsaon pag dugang og produkto',
      'how to add new product and barcode'
    ],
    tagalogReply: 'Pumunta sa Inventory menu at i-click ang "+ Add Product". Kung may barcode na ang balot, i-scan ito gamit ang barcode scanner. Kung sari-sari repacked item o walang barcode, i-click ang "Auto-Generate Barcode" upang lumikha ang system ng sariling EAN/Code128 code na pwede mong i-print bilang price tag.',
    bisayaReply: 'Adto sa Inventory menu unya i-click ang "+ Add Product". Kung naay barcode ang pakete, i-scan diretso sa scanner. Kung repacked item o walay barcode, i-click ang "Auto-Generate Barcode" aron mohimo ang system og barcode nga pwede nimo i-print.',
    englishReply: 'Go to Inventory and click "+ Add Product". Scan the manufacturer barcode or click "Auto-Generate Barcode" for repacked items, then print sticker price tags.',
    action: {
      label: 'Pumunta sa Inventory ↗',
      page: 'inventory',
      description: 'Pamahalaan ang mga produkto, presyo, at stocks.'
    }
  },
  {
    id: 'printer-troubleshoot',
    title: 'Thermal Receipt Printer Setup & Troubleshooting',
    keywords: ['printer', 'resibo', 'thermal', 'dili mo print', 'ayaw mag print', '58mm', '80mm', 'paper'],
    questionPatterns: [
      'bakit ayaw mag print ng resibo',
      'nganong dili mo print ang printer',
      'how to setup thermal receipt printer'
    ],
    tagalogReply: 'Pumunta sa Settings > Receipt tab o i-click ang "Terminal Tools" sa sidebar. Siguraduhing napili ang tamang printer sa dropdown list, nakasindi ang USB connection, at tama ang sukat ng papel (58mm o 80mm). I-click ang "Test Print" upang masubukan kung lumalabas ang papel.',
    bisayaReply: 'Adto sa Settings > Receipt tab o i-click ang "Terminal Tools" sa sidebar. Siguroha nga napili ang saktong printer sa dropdown, nakasaksak ang USB, ug sakto ang sukod sa papel (58mm o 80mm). I-click ang "Test Print" para masulayan.',
    englishReply: 'Navigate to Settings > Receipt tab or click "Terminal Tools" in the sidebar. Select your thermal printer from the dropdown, verify paper size (58mm or 80mm), and perform a Test Print.',
    action: {
      label: 'Pumunta sa Receipt Settings ↗',
      page: 'settings',
      description: 'Ayusin ang printer, logo, header, at footer ng resibo.'
    }
  },
  {
    id: 'backup-data',
    title: 'Backup at Proteksyon ng Database',
    keywords: ['backup', 'save', 'database', 'kopya', 'data', 'flash drive', 'usb', 'restore'],
    questionPatterns: [
      'paano mag backup',
      'unsaon pag backup sa database',
      'how to backup store database'
    ],
    tagalogReply: 'Pumunta sa Data & Backup menu. I-click ang "Create Instant Backup" upang mai-save ang buong benta, utang, at produkto sa isang secure backup file. Maari mo itong kopyahin sa USB flash drive para laging protektado ang inyong tindahan sakaling masira ang computer.',
    bisayaReply: 'Adto sa Data & Backup menu. I-click ang "Create Instant Backup" aron ma-save ang tanang halin, utang, ug produkto sa usa ka secure file. Maayo nga kopyahon kini sa USB flash drive para protektado kanunay ang negosyo.',
    englishReply: 'Go to Data & Backup and click "Create Instant Backup" to export a complete copy of your sales, products, and customer balances to a USB drive.',
    action: {
      label: 'Pumunta sa Data & Backup ↗',
      page: 'backup',
      description: 'Gumawa ng backup file o i-restore ang nakaraang kopya.'
    }
  }
]

export function matchOfflineKnowledge(query: string): { reply: string; action?: AssistantAction } | null {
  const q = query.toLowerCase().trim()
  if (!q) return null

  // Check exact pattern match or high keyword overlap
  let bestTopic: AssistantTopic | null = null
  let maxScore = 0

  for (const topic of BUILTIN_KNOWLEDGE_BASE) {
    let score = 0

    // Direct pattern check
    for (const pat of topic.questionPatterns) {
      if (q.includes(pat) || pat.includes(q)) {
        score += 10
      }
    }

    // Keyword tokens
    for (const kw of topic.keywords) {
      if (q.includes(kw)) {
        score += 2
      }
    }

    if (score > maxScore) {
      maxScore = score
      bestTopic = topic
    }
  }

  if (bestTopic && maxScore >= 4) {
    // Detect language tone
    const isBisaya = /asa|unsaon|kwarta|palit|nako|ngano|kaayo|diri|dinhi|puhunan/i.test(q)
    const isEnglish = /how to|where to|what is|cannot|why/i.test(q) && !/paano|saan|ano|bakit/i.test(q)

    const reply = isBisaya
      ? bestTopic.bisayaReply
      : isEnglish
        ? bestTopic.englishReply
        : bestTopic.tagalogReply

    return { reply, action: bestTopic.action }
  }

  return null
}
