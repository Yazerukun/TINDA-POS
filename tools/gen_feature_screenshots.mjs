import { app, BrowserWindow } from 'electron'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtempSync } from 'node:fs'

const OUT_DIR = 'C:\\Users\\Technical\\Desktop\\TINDA POS v1.0.56 Features'
const electronDataDir = mkdtempSync(join(tmpdir(), 'tinda-pos-shots-'))
app.setPath('userData', electronDataDir)
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('no-sandbox')

const FEATURES = [
  {
    file: '01-Overview.png',
    title: 'TINDA POS v1.0.56',
    subtitle: 'Offline POS System para sa Sari-Sari Store, Benta-Benta & Tindahan',
    emoji: '🏪',
    accent: '#10b981',
    items: [
      '✅ 100% Offline-First — Walang internet, okay lang!',
      '✅ Multi-Cashier Login — PIN at Password support',
      '✅ Barcode Scanner Compatible',
      '✅ Weighable / Tingi Decimal Checkout',
      '✅ GCash & Maya E-Wallet Recording',
      '✅ Utang / Suki Credit Ledger',
      '✅ Inventory & Stock Management',
      '✅ Sales Reports & Z-Read Closing',
      '✅ Auto Backup & Data Safety',
      '✅ Windows & Linux Support',
    ],
    tag: 'OVERVIEW',
    tagColor: '#10b981',
    version: 'v1.0.56',
  },
  {
    file: '02-POS-Cashier.png',
    title: '🛒 POS Cashier & Checkout',
    subtitle: 'Mabilis, madali, at walang error na pagbili',
    emoji: '🛒',
    accent: '#6366f1',
    items: [
      '⚡ Hardware Barcode Scanner — Scan agad, dagdag sa cart',
      '🔢 Decimal / Tingi Quantity — Para sa bigas, asukal, etc.',
      '💵 Cash + GCash + Maya — Multi-payment sa iisang order',
      '🤝 Split Payment — Hati ang bayad sa dalawang paraan',
      '⏸️ Hold Sale — I-hold, mag-assist sa iba, bumalik',
      '💳 Utang / Credit — I-record ang utang ng suki',
      '🏷️ Real-time Discount — Per item o buong order',
      '🖨️ Auto Receipt Print — Thermal printer ready',
      '📺 Sales Monitor Display — Live customer display screen',
    ],
    tag: 'CASHIER & REGISTER',
    tagColor: '#6366f1',
    version: 'v1.0.56',
  },
  {
    file: '03-Inventory.png',
    title: '📦 Inventory Management',
    subtitle: 'Kontrola ang stocks mo nang walang kahirap-hirap',
    emoji: '📦',
    accent: '#f59e0b',
    items: [
      '📊 Real-time Stock Count — Updated agad pagkatapos ng benta',
      '⚠️ Low Stock Alerts — Awtomatikong babala kung mababa na',
      '🔄 Stock Receiving — I-record ang bagong delivery',
      '📅 Expiration Date Tracking — Alerts bago mag-expire',
      '🏷️ Multi-Unit Support — Bilog, Dusin, Kahon, Tingi',
      '📷 Product Photo — May larawan ang bawat produkto',
      '📋 Category Management — Maayos na pag-organisa',
      '📤 CSV Bulk Import — Mag-upload ng listahan ng produkto',
      '🔍 Fast Search & Filter — Hanapin agad ang kahit anong item',
    ],
    tag: 'STOCK & OPERATIONS',
    tagColor: '#f59e0b',
    version: 'v1.0.56',
  },
  {
    file: '04-EWallet-Audit.png',
    title: '💳 VIP E-Wallet & Audit Hub',
    subtitle: 'Kumpleto na cash at e-wallet reconciliation — para sa VIP users',
    emoji: '💳',
    accent: '#22c55e',
    items: [
      '📊 GCash & Maya Balance Tracking — Real-time e-wallet ledger',
      '💰 Zero Float Override — I-reset ang expected cash nang madali',
      '🔄 E-Wallet Net Only Mode — Para sa hiwalay na pouch',
      '📋 Full Transactions Ledger Tab — Search, filter, at reprint',
      '🔎 Search by Ref#, Name, Phone, Cashier',
      '❌ 1-Tap Void Management — Red void button + frosted confirm',
      '🧾 Thermal Slip Reprint — I-reprint ang anumang resibo',
      '📈 Shift Summary Auto-Recalc — Live pagkatapos ng void',
    ],
    tag: 'VIP E-WALLET',
    tagColor: '#22c55e',
    version: 'v1.0.56',
  },
  {
    file: '05-VIP-Licensing.png',
    title: '💎 Permanent VIP Licensing',
    subtitle: 'NEW in v1.0.56 — Hindi na mawawala ang VIP license kahit mag-update!',
    emoji: '💎',
    accent: '#f59e0b',
    items: [
      '🔐 Quad-Vault Persistence — 4 na lugar naka-save ang license',
      '🖥️ Hardware-Anchored — Nakabase sa BIOS + MachineGuid (dili mausab)',
      '🔄 Zero Drift — Kahit palitan ng Wi-Fi, offline, o i-update ang app',
      '♻️ Legacy VIP Rescue — Auto-rescue sa mga daan pang VIP keys',
      '🛡️ Registry Backup — Naka-save sa Windows Registry (Base64)',
      '🗃️ SQLite Vault — Naka-store sa database ng system',
      '⚡ 10ms Machine ID — Ultra-mabilis na hardware detection',
      '✅ One-Time Key — Hinde na kailangan mag-reissue ng keys',
    ],
    tag: 'VIP LICENSE — NEW v1.0.56',
    tagColor: '#f59e0b',
    version: 'v1.0.56',
  },
  {
    file: '06-Version-Rollback.png',
    title: '🛡️ Version Rollback & Recovery',
    subtitle: 'NEW in v1.0.56 — Client Request: Maka-balik sa daan na version kung may error',
    emoji: '🛡️',
    accent: '#3b82f6',
    items: [
      '⏮️ 1-Tap Rollback — I-click lang, automatic ang downgrade',
      '💾 Pre-Rollback DB Snapshot — Awtomatikong backup bago mag-rollback',
      '🗄️ Zero Data Loss — Lahat ng sales records, utang, inventory safe',
      '📥 Live Download Tracking — Live progress bar habang nagda-download',
      '🚀 Auto Installer Launch — Buksan nang kusa ang installer',
      '💎 VIP Indestructible — License nananatiling active pagkatapos ng rollback',
      '📍 Accessible from Settings — Software Update & Recovery section',
      '🔒 Safe for All Users — Hindi mapipigilan ang past sales data',
    ],
    tag: 'ROLLBACK RECOVERY — NEW v1.0.56',
    tagColor: '#3b82f6',
    version: 'v1.0.56',
  },
  {
    file: '07-Global-Lounge.png',
    title: '💬 TINDA Global Lounge',
    subtitle: 'Libre! Makiisa sa komunidad ng mga tindahan sa buong bansa',
    emoji: '💬',
    accent: '#8b5cf6',
    items: [
      '🔔 Dual-Tone Audio Chime — Tutunog kung may bagong mensahe',
      '🔇 Mute / Unmute Toggle — I-control ang notification sound',
      '🖱️ Draggable Window — I-drag kahit saan habang nag-cashier',
      '💊 Minimizable Pill — Gamayng floating bar kapag naka-minimize',
      '🌐 100% Free & Online — Bukas sa lahat ng tindahan, real-time',
      '🗑️ Self-Message Delete — I-delete ang sariling mensahe',
      '👑 Owner Moderation — Full moderation para sa Dev/Owner',
      '💎 VIP Badge — Lumalagay ang gold badge sa VIP merchants',
    ],
    tag: 'GLOBAL COMMUNITY',
    tagColor: '#8b5cf6',
    version: 'v1.0.56',
  },
  {
    file: '08-Customers-Utang.png',
    title: '👥 Customers & Utang Ledger',
    subtitle: 'I-track ang lahat ng suki at utang nang madali',
    emoji: '👥',
    accent: '#ec4899',
    items: [
      '📋 Customer Profiles — Name, phone, at purchase history',
      '📒 Utang Ledger — Record ng lahat ng credit ng suki',
      '💰 Partial Payment — Pwedeng bayaran nang bahagi-bahagi',
      '🔔 Debt Reminders — Makikita agad kung sino may malaking utang',
      '📈 Purchase History — Lahat ng benta sa isang suki',
      '🔍 Smart Search — Hanapin ang suki by name o phone',
      '📊 Total Outstanding — Grand total ng lahat ng utang',
      '✅ Mark as Paid — I-clear agad kapag nabayaran na',
    ],
    tag: 'CUSTOMERS & SUKI',
    tagColor: '#ec4899',
    version: 'v1.0.56',
  },
  {
    file: '09-Reports-ZRead.png',
    title: '📊 Reports & Z-Read Closing',
    subtitle: 'Kumpleto na financial reports para sa iyong tindahan',
    emoji: '📊',
    accent: '#06b6d4',
    items: [
      '📈 Dashboard — Today\'s sales, top products, at revenue chart',
      '🧾 X-Read — Mid-shift sales summary (hindi nag-reset)',
      '🔒 Z-Read — End-of-day closing report at shift close',
      '💵 Sales by Payment Method — Cash, GCash, Maya breakdown',
      '📦 Top Selling Products — Pinaka-best seller ngayon',
      '📅 Date Range Reports — Pwedeng i-filter by date',
      '📤 CSV Export — I-export ang report para sa Excel',
      '🖨️ Printable Reports — I-print ang Z-Read report',
    ],
    tag: 'RECORDS & REPORTS',
    tagColor: '#06b6d4',
    version: 'v1.0.56',
  },
  {
    file: '10-Download.png',
    title: '⬇️ I-Download Na!',
    subtitle: 'TINDA POS v1.0.56 — Available na! Windows at Linux',
    emoji: '⬇️',
    accent: '#10b981',
    items: [
      '🪟  Windows Installer: TindaPOS-Setup-1.0.56.exe (107 MB)',
      '⚡  Windows Portable: TindaPOS-Portable-1.0.56.exe (107 MB)',
      '🐧  Linux Package: TindaPOS-1.0.56-linux-x64.tar.gz',
      '📖  User Manual: TindaPOS-User-Guide.pdf',
      '',
      '🔗  Download: github.com/Yazerukun/TINDA-POS/releases',
      '',
      '💡  Para sa activation key, i-contact ang Dev Francis',
      '📲  VIP Pro Lifetime: ₱500 lang — isang bayad, habambuhay!',
    ],
    tag: 'FREE DOWNLOAD',
    tagColor: '#10b981',
    version: 'v1.0.56',
  },
]

function buildHTML(f) {
  const bulletRows = f.items.map(item => {
    if (!item) return `<div style="height:6px"></div>`
    return `<div style="
      display:flex;
      align-items:flex-start;
      gap:8px;
      padding:7px 14px 7px 14px;
      border-radius:10px;
      background:rgba(255,255,255,0.04);
      margin-bottom:5px;
      font-size:15px;
      color:#e2e8f0;
      line-height:1.4;
    ">${item}</div>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body {
      width:900px; min-height:600px;
      background: linear-gradient(135deg, #0a0d14 0%, #0d1117 50%, #0a0d14 100%);
      font-family: -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif;
      padding: 0;
    }
    .card {
      width:900px;
      padding: 44px 52px 44px 52px;
      position:relative;
      overflow:hidden;
    }
    .card::before {
      content:'';
      position:absolute;
      top:-120px; right:-80px;
      width:400px; height:400px;
      border-radius:50%;
      background: radial-gradient(circle, ${f.accent}22 0%, transparent 70%);
      pointer-events:none;
    }
    .card::after {
      content:'';
      position:absolute;
      bottom:-100px; left:-60px;
      width:300px; height:300px;
      border-radius:50%;
      background: radial-gradient(circle, ${f.accent}15 0%, transparent 70%);
      pointer-events:none;
    }
    .top-bar {
      display:flex;
      align-items:center;
      justify-content:space-between;
      margin-bottom:28px;
    }
    .brand {
      display:flex;
      align-items:center;
      gap:10px;
    }
    .brand-logo {
      width:36px; height:36px;
      border-radius:10px;
      background:${f.accent};
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:900;
      color:#fff;
      font-size:13px;
      letter-spacing:-0.5px;
    }
    .brand-name {
      font-weight:800;
      font-size:17px;
      color:#fff;
      letter-spacing:-0.3px;
    }
    .tag {
      background:${f.tagColor}22;
      color:${f.tagColor};
      border:1px solid ${f.tagColor}55;
      border-radius:8px;
      padding:4px 12px;
      font-size:11px;
      font-weight:800;
      letter-spacing:1px;
      text-transform:uppercase;
    }
    .hero {
      margin-bottom:22px;
    }
    .hero-title {
      font-size:30px;
      font-weight:900;
      color:#ffffff;
      letter-spacing:-0.8px;
      line-height:1.15;
      margin-bottom:8px;
    }
    .hero-sub {
      font-size:15px;
      color:#94a3b8;
      line-height:1.5;
      font-weight:500;
    }
    .divider {
      height:1px;
      background:linear-gradient(90deg, ${f.accent}60, transparent);
      margin:18px 0;
    }
    .footer {
      display:flex;
      align-items:center;
      justify-content:space-between;
      margin-top:20px;
      padding-top:14px;
      border-top:1px solid rgba(255,255,255,0.07);
    }
    .footer-by {
      font-size:12px;
      color:#475569;
      font-style:italic;
    }
    .footer-version {
      font-size:12px;
      font-weight:700;
      color:${f.accent};
      background:${f.accent}18;
      border:1px solid ${f.accent}40;
      border-radius:6px;
      padding:3px 10px;
    }
    .footer-free {
      font-size:12px;
      font-weight:700;
      color:#10b981;
      background:#10b98115;
      border:1px solid #10b98140;
      border-radius:6px;
      padding:3px 10px;
    }
  </style>
  </head><body>
  <div class="card">
    <div class="top-bar">
      <div class="brand">
        <div class="brand-logo">TP</div>
        <div class="brand-name">TINDA POS</div>
      </div>
      <div class="tag">${f.tag}</div>
    </div>
    <div class="hero">
      <div class="hero-title">${f.title}</div>
      <div class="hero-sub">${f.subtitle}</div>
    </div>
    <div class="divider"></div>
    <div class="features">
      ${bulletRows}
    </div>
    <div class="footer">
      <div class="footer-by">by Dev Francis — TINDA POS Philippines</div>
      <div style="display:flex;gap:8px;align-items:center">
        <div class="footer-free">100% FREE</div>
        <div class="footer-version">${f.version}</div>
      </div>
    </div>
  </div>
  </body></html>`
}

async function captureFeature(f, index, total) {
  const html = buildHTML(f)
  const win = new BrowserWindow({
    width: 900,
    height: 800,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  })
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  await new Promise(r => setTimeout(r, 600))
  // Get actual content height
  const height = await win.webContents.executeJavaScript('document.body.scrollHeight')
  win.setSize(900, Math.min(height + 40, 1200))
  await new Promise(r => setTimeout(r, 200))
  const img = await win.webContents.capturePage()
  const outPath = join(OUT_DIR, f.file)
  writeFileSync(outPath, img.toPNG())
  console.log(`[${index}/${total}] ✅ Saved: ${f.file}`)
  win.close()
}

app.whenReady().then(async () => {
  console.log(`\n🎨 Generating ${FEATURES.length} feature screenshots...\n`)
  mkdirSync(OUT_DIR, { recursive: true })
  for (let i = 0; i < FEATURES.length; i++) {
    await captureFeature(FEATURES[i], i + 1, FEATURES.length)
  }
  console.log(`\n🎉 Done! All screenshots saved to:\n   ${OUT_DIR}\n`)
  app.quit()
})
