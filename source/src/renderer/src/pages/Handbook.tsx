import { useState, useMemo } from 'react'
import {
  BookOpen,
  Search,
  Sparkles,
  Zap,
  ShoppingCart,
  Barcode,
  Boxes,
  Tag,
  Wallet,
  HardDriveDownload,
  Printer,
  Keyboard,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  ArrowRight,
  HelpCircle,
  RefreshCw,
  Tv,
  Layers,
  FileText,
  Cloud,
  Calculator as CalcIcon
} from 'lucide-react'
import { useNav, type PageKey } from '../stores/nav'
import { useUpdate } from '../stores/update'

interface Chapter {
  id: string
  number: number
  title: string
  subtitle: string
  icon: React.ReactNode
  readTime: string
  relatedPage?: PageKey
  relatedPageLabel?: string
  action?: () => void
  actionLabel?: string
  content: React.ReactNode
}

export function Handbook(): React.JSX.Element {
  const { setPage } = useNav()
  const [selectedId, setSelectedId] = useState<string>('walkthrough')
  const [searchQuery, setSearchQuery] = useState('')

  const chapters: Chapter[] = useMemo(() => [
    {
      id: 'walkthrough',
      number: 1,
      title: 'Cashier Tour & Quick SOPs',
      subtitle: 'The 4-step daily cashier flow: scan, credit, checkout, and balancing',
      icon: <Sparkles className="h-4 w-4 text-amber-400" />,
      readTime: '2 min read',
      relatedPage: 'pos',
      relatedPageLabel: 'Open POS Register',
      content: (
        <div className="space-y-6 text-slate-300 leading-relaxed">
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-ink-900 to-ink-900 p-5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> v2.0.2 Cashier Superpower Tour
            </div>
            <h2 className="mt-1 text-2xl font-black text-white">4-Step Daily Cashier Standard (SOP)</h2>
            <p className="mt-2 text-slate-300 text-sm">
              Gidisenyo ang TINDA POS aron paspas ug dili makalibog ang pagpamaligya. Bisan kinsang bag-ong cashier o tindera, sunda lang kining 4 ka yano nga pamaagi:
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-ink-line bg-ink-900 p-5 space-y-3 hover:border-brand-500/40 transition-colors">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/20 text-sm font-black text-brand-400">1</span>
                <div>
                  <h4 className="font-bold text-white text-base">Paspas Pag-Scan & Search</h4>
                  <span className="text-[11px] text-brand-300 font-mono">Barcode Gun / F1 / Quick Keys</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                • I-tutok dayon ang barcode scanner gun sa produkto. Automatic kining mosulod sa Cart.<br />
                • Walay barcode? Pindota ang <strong>⚡ Quick Keys</strong> para sa Yelo (₱5), Yosi (₱8), Candy (₱1), o Rush ID (₱75).<br />
                • Gamita ang keyboard shortcut <strong>F1 o /</strong> para mangita gamit ang ngalan.
              </p>
            </div>

            <div className="rounded-xl border border-ink-line bg-ink-900 p-5 space-y-3 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-sm font-black text-emerald-400">2</span>
                <div>
                  <h4 className="font-bold text-white text-base">Suki & Utang Recording</h4>
                  <span className="text-[11px] text-emerald-300 font-mono">1-Click Customer Select & Ledger</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                • Kung mangutang ang suki, i-click ang <strong>Customer</strong> sa ibabaw sa Cart.<br />
                • Makit-an nimo dayon ang ilang balance history ug credit limit.<br />
                • I-pili ang <strong>Charge to Utang</strong> inig checkout — automatic ma-update ang ilang record nga walay manual lista sa notebook!
              </p>
            </div>

            <div className="rounded-xl border border-ink-line bg-ink-900 p-5 space-y-3 hover:border-teal-500/40 transition-colors">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/20 text-sm font-black text-teal-400">3</span>
                <div>
                  <h4 className="font-bold text-white text-base">Multi-Payment Checkout</h4>
                  <span className="text-[11px] text-teal-300 font-mono">Cash · GCash · Maya · Split Payment</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                • Pindota ang <strong>F12 / Checkout</strong>.<br />
                • Dawata ang <strong>Cash</strong> (automatic ang kwenta sa sukli), <strong>GCash QR</strong>, o <strong>Split Payment</strong> (tunga Cash, tunga Utang).<br />
                • <em>Bulletproof Checkout Immunity:</em> Walay crash bisan unsay mahitabo sa produkto.
              </p>
            </div>

            <div className="rounded-xl border border-ink-line bg-ink-900 p-5 space-y-3 hover:border-purple-500/40 transition-colors">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-sm font-black text-purple-400">4</span>
                <div>
                  <h4 className="font-bold text-white text-base">Thermal Receipt & Shift Balancing</h4>
                  <span className="text-[11px] text-purple-300 font-mono">Chiteng CT221B · 58/80mm · Z-Read</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                • 1-tap thermal receipt print gamit ang standard POS printer o Chiteng CT221B.<br />
                • Inig sira sa tindahan, pindota ang <strong>Z-Reading (End Shift)</strong> aron ma-ihap ang physical drawer cash.<br />
                • Sigurado ang ginansya ug walay alkanse!
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'intro',
      number: 2,
      title: 'Welcome to TINDA POS',
      subtitle: 'System identity, offline philosophy, and basic concepts',
      icon: <BookOpen className="h-4 w-4" />,
      readTime: '3 min read',
      content: (
        <div className="space-y-6 text-slate-300 leading-relaxed">
          <div className="rounded-xl border border-brand-500/30 bg-gradient-to-br from-brand-950/60 to-ink-900 p-5">
            <div className="flex items-center gap-2 text-brand-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> Official In-System Handbook
            </div>
            <h2 className="mt-1 text-2xl font-black text-white">Your Complete Store Manual</h2>
            <p className="mt-2 text-slate-300 text-sm">
              Welcome to <strong>TINDA POS</strong> — the reliable, 100% offline desktop Point of Sale built specifically for Philippine sari-sari stores, groceries, minimarts, and retail shops. Everything you need to know is documented right here inside your system. No internet and no downloads required.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Core System Principles
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
                <h4 className="font-semibold text-white">100% Offline by Design</h4>
                <p className="mt-1 text-xs text-slate-400">
                  You do not need an active internet connection to ring up sales, manage stocks, or record utang. All records are stored locally and securely on your PC using SQLite with ACID guarantees.
                </p>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
                <h4 className="font-semibold text-white">Zero Cloud Lockout</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Your store is yours. Even during internet outages, typhoons, or ISP brownouts, your cash register never stops ringing.
                </p>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
                <h4 className="font-semibold text-white">Hardware Agnostic</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Works with standard PC keyboards, numeric keypads, touchscreens, standard USB barcode scanners, smartphone cameras, and thermal receipt printers.
                </p>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
                <h4 className="font-semibold text-white">Pre-Loaded Market Knowledge</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Comes pre-seeded with 172 staple sari-sari store products and DTI suggested retail prices so you can start selling immediately without encoding hundreds of items from scratch.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-4">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                <Cloud className="h-4 w-4" /> Real-Time Cloudflare D1 Store Sync
              </div>
              <h4 className="mt-1 font-semibold text-white text-sm">Remote Owner Dashboard Connectivity</h4>
              <p className="mt-1 text-xs text-slate-300">
                While cashiers ring up sales completely offline, store owners with internet can view live gross sales, net realized revenue, inventory alerts, and customer utang balances anywhere in the world via the official <strong>TINDA Cloud Dashboard</strong>.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'shift',
      number: 2,
      title: 'Daily Workflow & Shift Management',
      subtitle: 'Opening float, cashier balancing, void handling, and Z-Reading reports',
      icon: <Zap className="h-4 w-4" />,
      readTime: '4 min read',
      relatedPage: 'pos',
      relatedPageLabel: 'Open POS Screen',
      content: (
        <div className="space-y-6 text-slate-300 leading-relaxed">
          <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
            <h3 className="text-base font-bold text-white">The Three Daily Rituals</h3>
            <p className="text-xs text-slate-400 mt-1">
              Follow these three simple steps every day to guarantee that your physical cash drawer matches your system sales to the exact centavo.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-brand-500/20 bg-ink-900 p-4 flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-300">1</span>
              <div>
                <h4 className="font-semibold text-white">Morning: Opening Shift &amp; Float Cash</h4>
                <p className="mt-1 text-xs text-slate-400">
                  When starting your shift in the morning, the system prompts for your <strong>Starting Cash Float</strong>. This is the change fund you put into the drawer (e.g., ₱500 or ₱1,000 in coins and small bills). Entering an accurate float prevents cash count discrepancies at the end of the day.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-500/20 bg-ink-900 p-4 flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">2</span>
              <div>
                <h4 className="font-semibold text-white">All Day: Processing Transactions &amp; Real-Time Net Sales</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Ring up every customer through the POS screen. Whenever a sale is finished, the system calculates exact change, logs the payment method (Cash, GCash, Maya, MariBank, or Utang), and instantly deducts stock from inventory.
                </p>
                <div className="mt-2 rounded bg-ink-950 p-2.5 border border-emerald-500/30 text-[11px] text-emerald-300">
                  <strong>Accurate Net Sales Engine:</strong> Voided transactions are automatically excluded from realized net sales and drawer cash counts. If a manager voids a transaction, the stock is returned to inventory and the cash drawer target is updated instantly.
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-ink-900 p-4 flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">3</span>
              <div>
                <h4 className="font-semibold text-white">Evening: Cash Count &amp; Shift Z-Reading</h4>
                <p className="mt-1 text-xs text-slate-400">
                  At the end of the shift or closing time, click <strong>End Shift</strong>. Count the physical paper bills and coins in your cash drawer and enter the total. The system prints or displays the <strong>Z-Reading Report</strong> showing:
                </p>
                <ul className="mt-2 list-disc pl-5 text-xs text-slate-400 space-y-1">
                  <li>Starting Cash Float</li>
                  <li>Total Cash Sales + Expected Drawer Cash</li>
                  <li>Total GCash Transactions</li>
                  <li>Total Utang (Credit) Issued</li>
                  <li><strong>Over / Short Variance:</strong> Tells you immediately if drawer cash is short or over.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'pos',
      number: 3,
      title: 'POS Terminal & Cashier Masterclass',
      subtitle: 'Searching, cart editing, discounts, GCash, and holding sales',
      icon: <ShoppingCart className="h-4 w-4" />,
      readTime: '5 min read',
      relatedPage: 'pos',
      relatedPageLabel: 'Open POS Terminal',
      content: (
        <div className="space-y-6 text-slate-300 leading-relaxed">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Search className="h-4 w-4 text-brand-400" />
                Finding Products (<kbd className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-brand-300">F1</kbd>)
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                Press <kbd className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-brand-300">F1</kbd> or <kbd className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-brand-300">/</kbd> to focus the search bar. You can search by brand, full name, SKU, or scan the barcode directly. You can also filter by category dropdown on the right.
              </p>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Tag className="h-4 w-4 text-brand-400" />
                Adjusting Quantity (<kbd className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-brand-300">F2</kbd>)
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                Click <strong>+</strong> or <strong>-</strong> in the cart. To enter a large number directly, click the quantity number or press <kbd className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-brand-300">F2</kbd>. Click <strong>Add Discount</strong> (<kbd className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-brand-300">F4</kbd>) to deduct custom peso discounts.
              </p>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-400" />
                Payment Options (Cash &amp; GCash)
              </h4>
              <ul className="mt-1 text-xs text-slate-400 space-y-1 list-disc pl-4">
                <li><strong>Cash (<kbd className="font-mono text-emerald-300">F9</kbd>):</strong> Type amount tendered. The system calculates exact change with zero mental math.</li>
                <li><strong>GCash (<kbd className="font-mono text-sky-300">F10</kbd>):</strong> Customer scans store QR. Enter the reference number.</li>
                <li><strong>Utang Credit (<kbd className="font-mono text-amber-300">F11</kbd>):</strong> Charge transaction directly to a customer&apos;s verified credit ledger.</li>
              </ul>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                Hold &amp; Resume Sales (<kbd className="font-mono text-amber-300">F8</kbd>)
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                If a customer forgets their wallet or steps away to pick up more items, tap <strong>Hold Sale</strong>. The cart clears to serve the next customer. When the first customer returns, tap <strong>Held Sales</strong> to restore their cart in 1 click!
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-cyan-500/30 bg-ink-900 p-4">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <CalcIcon className="h-4 w-4 text-emerald-400" />
                Quick Calculator &amp; Sukli (<kbd className="font-mono text-emerald-300">F3</kbd>)
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                Press <kbd className="font-mono text-emerald-300">F3</kbd> to launch the Cashier Quick Calculator &amp; Sukli Assistant. Cashiers can do quick arithmetic, apply percentages, compute exact customer change, or push custom service items straight to the cart.
              </p>
            </div>

            <div className="rounded-lg border border-purple-500/30 bg-ink-900 p-4">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Tv className="h-4 w-4 text-purple-400" />
                Dual-Screen Customer Display
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                Connect a second monitor or TV facing the customer. Click the <strong>Live Monitor</strong> button in the sidebar to open a dedicated full-screen customer display showing itemized prices, running totals, and store branding in real time.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'scanner',
      number: 4,
      title: 'Barcode Scanning: Hardware, Smartphones & Auto-Capture',
      subtitle: 'Instant hardware barcode auto-capture, zero-install phone companion, and POS checkout',
      icon: <Barcode className="h-4 w-4" />,
      readTime: '4 min read',
      relatedPage: 'pos',
      relatedPageLabel: 'Test Scanner in POS',
      content: (
        <div className="space-y-6 text-slate-300 leading-relaxed">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
              <Barcode className="h-5 w-5" />
              Universal Dual Barcode Engine &amp; Instant Auto-Capture
            </h3>
            <p className="mt-1 text-xs text-slate-300">
              TINDA POS provides a zero-configuration barcode architecture supporting dedicated physical USB / wireless handheld scanners, built-in wireless smartphone companion cameras, and PC webcams working simultaneously.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-brand-500/30 bg-ink-900 p-4">
              <span className="rounded bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-300">
                INVENTORY SPEED ENCODING
              </span>
              <h4 className="mt-1.5 font-semibold text-white">Instant Barcode Auto-Capture (Zero Manual Typing)</h4>
              <p className="mt-1 text-xs text-slate-400">
                Encoding products with long 12- or 13-digit EAN/UPC barcodes is completely effortless:
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                <li>
                  <strong>Inside Product Form:</strong> Simply scan the physical product with your USB barcode gun or smartphone companion camera. The barcode number is immediately populated into the Barcode field with an audible confirmation tone and a green auto-capture indicator.
                </li>
                <li>
                  <strong>Collision Prevention:</strong> The system verifies that barcodes are unique across products, but allows multi-unit overrides (e.g. piece vs case packaging).
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-sky-500/30 bg-ink-900 p-4">
              <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                ZERO INSTALL COMPANION
              </span>
              <h4 className="mt-1.5 font-semibold text-white">Wireless Smartphone Companion (Dual-Canvas Center Reticle)</h4>
              <p className="mt-1 text-xs text-slate-400">
                No expensive handheld scanner? Turn any Android or iPhone into a high-speed laser-like barcode reader:
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                <li>
                  Click the <strong>Phone Camera</strong> button in the POS header.
                </li>
                <li>
                  Scan the on-screen QR code with your mobile phone camera while connected to the same Wi-Fi.
                </li>
                <li>
                  Point your phone at product barcodes. The built-in <strong>Dual-Canvas Center-Reticle</strong> crop and 120ms Wi-Fi burst engine streams scanned items instantly to the checkout screen without lag.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'inventory',
      number: 5,
      title: 'Inventory, Products & Multi-Units',
      subtitle: 'Adding items, piece vs case conversions, stock alerts, and expiration management',
      icon: <Boxes className="h-4 w-4" />,
      readTime: '4 min read',
      relatedPage: 'inventory',
      relatedPageLabel: 'Open Inventory',
      content: (
        <div className="space-y-6 text-slate-300 leading-relaxed">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white">Piece vs Case Conversions</h4>
              <p className="mt-1 text-xs text-slate-400">
                Sari-sari stores buy in cases and sell in pieces. When adding a product, define units (e.g., 1 Box = 24 Pieces). When you sell 1 piece in POS, the inventory automatically deducts 1/24th of a box, keeping stock counts exact.
              </p>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white">Low Stock Warning &amp; Quick Restock Drawer</h4>
              <p className="mt-1 text-xs text-slate-400">
                Set a <strong>Reorder Threshold</strong> (e.g., 5 items). When stock falls below that number, a badge appears on the Dashboard. Clicking the item opens the <strong>1-Tap Quick Restock Drawer</strong> to immediately add incoming delivery inventory without opening full product edit forms.
              </p>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white">Pre-Loaded DTI Price Reference</h4>
              <p className="mt-1 text-xs text-slate-400">
                Unsure how much to price canned goods, instant noodles, or coffee sachets? Click <strong>DTI SRP Guide</strong> to view official suggested retail prices for common household brands.
              </p>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white">Expiration Date Tracking</h4>
              <p className="mt-1 text-xs text-slate-400">
                Enter expiry dates on perishable items. The system warns cashiers with yellow (near expiry within 30 days) or red (expired) badges, preventing accidental sale of expired dairy or snacks.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'utang',
      number: 6,
      title: 'Customer & Utang (Credit) Management',
      subtitle: 'Credit tracking, itemized breakdown with package icon, and settlement receipts',
      icon: <Wallet className="h-4 w-4" />,
      readTime: '3 min read',
      relatedPage: 'utang',
      relatedPageLabel: 'Open Utang Ledger',
      content: (
        <div className="space-y-6 text-slate-300 leading-relaxed">
          <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
            <h3 className="text-base font-bold text-white">The Filipino Suki Ledger</h3>
            <p className="text-xs text-slate-400 mt-1">
              Replace messy paper notebooks (&ldquo;kuaderno&rdquo;) with an organized digital ledger that cannot be torn, spilled on, or lost.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white">Recording Utang in Checkout</h4>
              <p className="mt-1 text-xs text-slate-400">
                At checkout, select <strong>Utang (<kbd className="font-mono text-amber-300">F11</kbd>)</strong> and choose the customer. If they are a new customer, enter their name and mobile number. The transaction saves with ₱0 cash received and logs into their balance.
              </p>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white">Itemized Breakdown with Package Icon</h4>
              <p className="mt-1 text-xs text-slate-400">
                When a customer asks, <em>&ldquo;Unsa man ning akong gi-utang sa miaging adlaw?&rdquo;</em>, click the <strong>Package Icon</strong> next to the ledger entry. An itemized drawer opens showing every specific product, unit, price, and timestamp purchased.
              </p>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white">Partial &amp; Full Debt Settlements</h4>
              <p className="mt-1 text-xs text-slate-400">
                When a customer makes a partial payment (e.g. ₱200 out of ₱500 balance), enter ₱200. The remaining balance automatically updates to ₱300 and prints a thermal payment receipt showing remaining debt.
              </p>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white">Credit Limits &amp; Alerts</h4>
              <p className="mt-1 text-xs text-slate-400">
                Set a Maximum Credit Limit per customer. The POS warns cashiers if a customer tries to purchase more than their allowed credit threshold.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'backup',
      number: 7,
      title: 'Database Backups & Zero Data Loss',
      subtitle: '1-click local snapshots, flash drive safety rules, and migrations',
      icon: <HardDriveDownload className="h-4 w-4" />,
      readTime: '3 min read',
      relatedPage: 'backup',
      relatedPageLabel: 'Open Backup Page',
      content: (
        <div className="space-y-6 text-slate-300 leading-relaxed">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <HardDriveDownload className="h-5 w-5" />
              The Store Owner&apos;s Golden Rule
            </h3>
            <p className="mt-1 text-xs text-slate-300">
              Because TINDA POS is 100% offline, your entire store history lives on your computer. If your computer hardware fails or your laptop gets damaged, you must have a backup on a USB flash drive!
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white">1-Click Local Backup</h4>
              <p className="mt-1 text-xs text-slate-400">
                Go to <strong>Backup</strong> in the sidebar and click <strong>Back Up Now</strong>. A checkpointed database snapshot (<code>tindapos-YYYY-MM-DD.db</code>) is saved instantly.
              </p>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white">Copy to USB Flash Drive</h4>
              <p className="mt-1 text-xs text-slate-400">
                Click <strong>Open Backup Folder</strong>. Copy the backup file onto a USB thumb drive once a week. If you ever switch to a new PC, click <strong>Restore Backup</strong> to resume in seconds.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'hotkeys',
      number: 8,
      title: 'Keyboard Shortcuts Cheat Sheet',
      subtitle: 'High-speed keyboard navigation and cashier shortcuts',
      icon: <Keyboard className="h-4 w-4" />,
      readTime: '2 min read',
      content: (
        <div className="space-y-6 text-slate-300 leading-relaxed">
          <p className="text-xs text-slate-400">
            Cashiers can complete entire transactions without touching the mouse by using high-speed keyboard hotkeys:
          </p>

          <div className="overflow-hidden rounded-xl border border-ink-line bg-ink-900">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink-line bg-ink-950 font-semibold uppercase text-slate-400 text-[11px]">
                <tr>
                  <th className="px-4 py-3">Shortcut Key</th>
                  <th className="px-4 py-3">Function</th>
                  <th className="px-4 py-3">Action Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line text-slate-300">
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold text-brand-300">F1 or /</td>
                  <td className="px-4 py-2.5 font-semibold text-white">Search Products</td>
                  <td className="px-4 py-2.5 text-slate-400">Jump cursor straight to product search bar</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold text-brand-300">F2</td>
                  <td className="px-4 py-2.5 font-semibold text-white">Edit Quantity / Barcode Focus</td>
                  <td className="px-4 py-2.5 text-slate-400">Focus quantity input for highlighted cart item</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold text-emerald-400">F3</td>
                  <td className="px-4 py-2.5 font-semibold text-white">Quick Calculator &amp; Sukli</td>
                  <td className="px-4 py-2.5 text-slate-400">Open cashier calculator, percentage tool, and customer change assistant</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold text-brand-300">F4</td>
                  <td className="px-4 py-2.5 font-semibold text-white">Custom Discount</td>
                  <td className="px-4 py-2.5 text-slate-400">Apply custom peso discount to current cart</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold text-amber-300">F8</td>
                  <td className="px-4 py-2.5 font-semibold text-white">Hold / Resume Order</td>
                  <td className="px-4 py-2.5 text-slate-400">Suspend order to serve next customer in queue</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold text-emerald-400">F9</td>
                  <td className="px-4 py-2.5 font-semibold text-white">Cash Checkout</td>
                  <td className="px-4 py-2.5 text-slate-400">Focuses amount tendered for quick cash entry</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold text-sky-400">F10</td>
                  <td className="px-4 py-2.5 font-semibold text-white">GCash Checkout</td>
                  <td className="px-4 py-2.5 text-slate-400">Focuses GCash reference number input</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold text-teal-400">F11</td>
                  <td className="px-4 py-2.5 font-semibold text-white">Maya Checkout</td>
                  <td className="px-4 py-2.5 text-slate-400">Focuses Maya reference number input</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold text-[#FF8533]">F12</td>
                  <td className="px-4 py-2.5 font-semibold text-white">MariBank Checkout</td>
                  <td className="px-4 py-2.5 text-slate-400">Focuses MariBank / Shopee reference number input</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold text-emerald-300">Enter</td>
                  <td className="px-4 py-2.5 font-semibold text-white">Complete Transaction</td>
                  <td className="px-4 py-2.5 text-slate-400">Finalizes sale, prints receipt, and clears cart</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold text-rose-400">Esc</td>
                  <td className="px-4 py-2.5 font-semibold text-white">Cancel / Close</td>
                  <td className="px-4 py-2.5 text-slate-400">Closes modal dialogs or returns focus to search</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshoot',
      number: 9,
      title: 'Troubleshooting & FAQ',
      subtitle: 'Answers to common questions, brownouts, and hardware issues',
      icon: <HelpCircle className="h-4 w-4" />,
      readTime: '3 min read',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
            <h4 className="font-semibold text-white text-sm">What happens during a sudden brownout or PC crash?</h4>
            <p className="mt-1 text-slate-400">
              TINDA POS uses SQLite Write-Ahead Logging (WAL mode). Every completed sale is written to disk atomically. If your PC loses power abruptly, zero data is corrupted. When you turn your PC back on, all completed sales and balances are intact.
            </p>
          </div>

          <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
            <h4 className="font-semibold text-white text-sm">Why is my barcode scanner not adding items to the cart?</h4>
            <p className="mt-1 text-slate-400">
              1. Check if the product has that exact barcode saved in Inventory.<br />
              2. Make sure the <strong>🟢 Scanner Ready</strong> indicator in the POS header is green.<br />
              3. Ensure your handheld scanner is set to send a trailing <em>&ldquo;Enter&rdquo;</em> key (standard factory default for all retail scanners).
            </p>
          </div>

          <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
            <h4 className="font-semibold text-white text-sm">Can I move my store database to a new laptop?</h4>
            <p className="mt-1 text-slate-400">
              Yes! Simply go to <strong>Backup</strong>, click <strong>Back Up Now</strong>, copy the file to a USB stick, install TINDA POS on the new laptop, and click <strong>Restore Backup</strong>.
            </p>
          </div>

          <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
            <h4 className="font-semibold text-white text-sm">How do I connect multiple cashier PCs in one store?</h4>
            <p className="mt-1 text-slate-400">
              TINDA POS supports Multi-PC local network sharing via SQLite WAL network modes or local LAN bridges. Refer to the official <code>docs/MULTI_PC_AND_VPS_GUIDE.md</code> for LAN IP configuration.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'printer',
      number: 10,
      title: 'Thermal Printers (GOOJPRT PB-58H & 58mm/80mm)',
      subtitle: 'Setup guide for USB and Bluetooth desktop thermal receipt printers',
      icon: <Printer className="h-4 w-4" />,
      readTime: '4 min read',
      relatedPage: 'settings',
      relatedPageLabel: 'Open Printer Settings',
      content: (
        <div className="space-y-6 text-slate-300 leading-relaxed text-xs">
          <div className="rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-950/60 to-ink-900 p-5">
            <div className="flex items-center gap-2 text-teal-400 font-bold uppercase tracking-wider">
              <Printer className="h-4 w-4" /> Thermal Printing Guide
            </div>
            <h3 className="mt-1 text-xl font-bold text-white">Setting up GOOJPRT 58H (JP-58BL / PB-58H) &amp; 58mm/80mm Printers</h3>
            <p className="mt-2 text-slate-300">
              TINDA POS has built-in support for standard 58mm and 80mm thermal receipt printers, including popular models like <strong>GOOJPRT 58H (JP-58BL / PB-58H)</strong>, Xprinter XP-58, and POS-58 printers. Official manual reference: <a href="https://manuals.plus/ae/1005008661058283" target="_blank" rel="noreferrer" className="text-teal-300 underline font-semibold">GOOJPRT 58H User Manual</a>.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Method 1: USB Connection (Recommended &amp; Most Reliable)
            </h4>
            <div className="rounded-lg border border-ink-line bg-ink-900 p-4 space-y-2">
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
                <li>Plug the USB cable into your PC or laptop, then turn on the printer power switch.</li>
                <li>Install the official <strong>POS-58 Driver</strong> or <strong>Xprinter 58mm Driver</strong> in Windows.</li>
                <li><strong>Zero-Click Auto-Detect:</strong> Once plugged in, TINDA POS automatically detects and binds your printer for receipts, shift audits, and Z-readings.</li>
                <li><strong>Universal Manual Print Fallback:</strong> If your printer does not print automatically due to Windows spooler port locking, tap <strong>Manual Print</strong> in Checkout or Terminal Tools to send the receipt directly through the native Windows Print Dialog.</li>
              </ol>
            </div>

            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-sky-400" />
              Method 2: Bluetooth Connection (Wireless Setup)
            </h4>
            <div className="rounded-lg border border-ink-line bg-ink-900 p-4 space-y-2">
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
                <li>Turn on Bluetooth on your Windows PC or laptop.</li>
                <li>Search for the printer Bluetooth device (usually named <em>KP58B-U</em>, <em>PB-58H</em>, or <em>MTP-2</em>).</li>
                <li>Pair using the standard PIN: <strong>0000</strong> or <strong>1234</strong>.</li>
                <li>In Windows <em>Control Panel &rarr; Devices &amp; Printers</em>, verify the printer&apos;s <strong>Outgoing COM Port</strong> (e.g., COM3 or COM4).</li>
                <li>Assign the printer driver to this COM port, then click <strong>Refresh Printers</strong> in TINDA POS Settings.</li>
              </ol>
            </div>

            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-2 text-emerald-200">
              <div className="font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Zero-Blur Guide: How to Fix Blurry or Faint Print Output</span>
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-300 text-[11px]">
                <li><strong>1. Zero-Blur Typography Engine:</strong> TINDA POS automatically applies integer font geometry and disables subpixel grayscale anti-aliasing so monochrome thermal pins only burn pure black dots without fuzzy edges.</li>
                <li><strong>2. Windows Driver Darkness &amp; Halftone:</strong> In Windows <em>Settings &rarr; Bluetooth &amp; devices &rarr; Printers &amp; scanners &rarr; Your Printer &rarr; Printing preferences &rarr; Advanced</em>, set <strong>Print Density / Darkness</strong> to <strong>Dark (Level 12-15)</strong> and set <strong>Dithering / Halftone</strong> to <strong>None</strong>.</li>
                <li><strong>3. Print Head Maintenance:</strong> Turn off the printer and use a cotton swab lightly dampened with isopropyl alcohol to gently wipe the thermal print head surface (Section 7.1 of manual). Let dry before printing.</li>
              </ul>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2 text-amber-200">
              <div className="font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Troubleshooting: Print completes successfully but paper is blank or does not feed?</span>
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-300 text-[11px]">
                <li><strong>1. Thermal Paper Roll Orientation (Scratch Test):</strong> Thermal paper only has one chemically-treated heat-sensitive side. Scratch the paper with your fingernail; if a black line appears, that is the <em>thermal side</em>. That side <strong>must face the heated printhead</strong>. If reversed, the paper feeds blank.</li>
                <li><strong>2. Windows USB Virtual Port Mapping:</strong> In Windows <em>Printer Properties &rarr; Ports tab</em>, ensure that the active <code>USB001</code> Virtual Printer Port is selected instead of LPT1 or COM1.</li>
                <li><strong>3. Windows Driver Page Size Setting:</strong> In Windows Printing Preferences, set the default Paper Size to <strong>58mm x 297mm</strong> or <strong>58 x Continuous</strong> rather than A4 or Letter.</li>
                <li><strong>4. Hardware Self-Test Verification:</strong> Turn off the printer, hold the <strong>FEED button</strong>, and turn on power while holding FEED. Release after 2 seconds. The printer should print an internal diagnostic self-test slip confirming the printhead is working.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'updates',
      number: 11,
      title: 'Software Updates & Zero-Restart Live Patches',
      subtitle: 'Dual-mode updates, 0.3s hot-reload feature patches, full installers, and data safety',
      icon: <RefreshCw className="h-4 w-4" />,
      readTime: '3 min read',
      action: () => useUpdate.getState().openHub(),
      actionLabel: 'Open Software Update Hub',
      content: (
        <div className="space-y-6 text-slate-300 leading-relaxed text-xs">
          <div className="rounded-xl border border-brand-500/30 bg-gradient-to-br from-brand-950/60 to-ink-900 p-5">
            <div className="flex items-center gap-2 text-brand-400 font-bold uppercase tracking-wider">
              <RefreshCw className="h-4 w-4" /> Next-Generation In-App Updater
            </div>
            <h3 className="mt-1 text-xl font-bold text-white">Dual-Mode Update Architecture</h3>
            <p className="mt-2 text-slate-300">
              TINDA POS features a proprietary dual-mode update engine designed so cashiers can receive critical improvements, bug fixes, and feature upgrades with <strong>zero downtime</strong> and zero risk to active transactions.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-brand-500/30 bg-ink-900 p-4 space-y-2">
              <div className="flex items-center gap-2 text-brand-400 font-bold text-sm">
                <Zap className="h-4 w-4" />
                <span>Option A: Fast Feature Patch (0.82 MB · Zero Restart ⚡)</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                The default and recommended update method for all routine software updates:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                <li><strong>Ultra-Lightweight:</strong> Downloads in 2 to 5 seconds over ordinary mobile data or weak sari-sari store Wi-Fi (under 1 MB).</li>
                <li><strong>0.3s Live Hot-Reload:</strong> Unpacks and mounts the new renderer runtime instantly in less than 300 milliseconds.</li>
                <li><strong>Zero Cashier Downtime:</strong> The desktop app does not close or reboot. Active carts, SQLite database connections, and open cash shifts remain completely uninterrupted.</li>
              </ul>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                <Layers className="h-4 w-4" />
                <span>Option B: Full Platform Build (~110–130 MB)</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Reserved for major Electron runtime upgrades, native driver changes, or new PC setups:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                <li><strong>Complete Standalone Installer:</strong> Provides <code>Setup.exe</code> on Windows or <code>AppImage</code> on Linux.</li>
                <li><strong>Automated Safety Backup:</strong> Before replacing core binaries, the system automatically creates an encrypted database snapshot to guarantee zero data loss.</li>
                <li><strong>Clean Portability:</strong> Portable users can also download standalone single-file executables without touching system registry.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Sidebar Update Hub &amp; Non-Intrusive Notifications
            </h4>
            <div className="rounded-lg border border-ink-line bg-ink-900 p-4 space-y-2 text-slate-300 text-[11px]">
              <p>
                To protect frontline store operations from annoying pop-up interruptions:
              </p>
              <ul className="list-disc pl-4 space-y-1.5">
                <li>
                  <strong>Minimize to Sidebar:</strong> When an update arrives during a busy checkout rush, simply click <em>&ldquo;— Minimize to Sidebar&rdquo;</em> or <em>&ldquo;Remind Me Later&rdquo;</em>. The notification minimizes into a neat badge in the sidebar under <strong>System &amp; Guide &rarr; Software Update</strong>.
                </li>
                <li>
                  <strong>Real-Time Version Sync:</strong> When you click <em>Apply Live</em>, the system updates its internal version indicator immediately in real time across the modal, header, and sidebar without waiting for a manual app relaunch.
                </li>
                <li>
                  <strong>24-Hour Smart Throttle:</strong> Automatic background checks run unobtrusively once every 24 hours, completely eliminating network traffic spam and popup flicker.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

  ], [])

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters
    const q = searchQuery.toLowerCase()
    return chapters.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    )
  }, [chapters, searchQuery])

  const currentIndex = chapters.findIndex((c) => c.id === selectedId)
  const currentChapter: Chapter = chapters[currentIndex] ?? chapters[0]!

  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row overflow-hidden bg-ink-950">
      {/* Left Column: Book Navigation & Chapters (Table of Contents) */}
      <aside className="flex w-full md:w-80 shrink-0 flex-col border-b md:border-b-0 md:border-r border-ink-line bg-ink-900/90 backdrop-blur-sm">
        <div className="p-4 border-b border-ink-line">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Store Handbook</h1>
              <p className="text-[11px] text-slate-400">TINDA POS In-System Book</p>
            </div>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search handbook topics…"
              className="input h-8 w-full pl-8 text-xs"
            />
          </div>
        </div>

        {/* Chapters List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChapters.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedId(ch.id)}
              className={`flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors ${
                selectedId === ch.id
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:bg-ink-800 hover:text-slate-200'
              }`}
            >
              <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-bold ${
                  selectedId === ch.id
                    ? 'bg-brand-500/30 text-brand-300'
                    : 'bg-ink-800 text-slate-400'
                }`}
              >
                {ch.number}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-200">{ch.title}</p>
                <p className="truncate text-[10px] text-slate-500">{ch.subtitle}</p>
              </div>
            </button>
          ))}

          {filteredChapters.length === 0 && (
            <p className="p-4 text-center text-xs text-slate-500">No chapters match your search.</p>
          )}
        </div>

        <div className="p-3 border-t border-ink-line text-[11px] text-slate-500 text-center">
          📖 100% Offline Reference Book
        </div>
      </aside>

      {/* Right Column: Book Reading Surface */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-ink-950 p-6 md:p-8">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          {/* Chapter Header */}
          <div className="border-b border-ink-line pb-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-400">
                Chapter {currentChapter.number}
              </span>
              <span>{currentChapter.readTime}</span>
            </div>
            <h2 className="mt-1 text-2xl font-black text-white">{currentChapter.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{currentChapter.subtitle}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {currentChapter.relatedPage && (
                <button
                  type="button"
                  onClick={() => setPage(currentChapter.relatedPage!)}
                  className="btn-secondary inline-flex items-center gap-1.5 text-xs py-1.5 px-3 text-brand-300 border-brand-500/30 hover:border-brand-500"
                >
                  <span>{currentChapter.relatedPageLabel || 'Open Page'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}

              {currentChapter.action && (
                <button
                  type="button"
                  onClick={currentChapter.action}
                  className="btn-primary inline-flex items-center gap-1.5 text-xs py-1.5 px-3"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{currentChapter.actionLabel || 'Run Action'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Chapter Content */}
          <div className="min-h-[300px]">
            {currentChapter.content}
          </div>

          {/* Book Page Turner (Previous / Next Chapter) */}
          <div className="mt-8 flex items-center justify-between border-t border-ink-line pt-6">
            {prevChapter ? (
              <button
                type="button"
                onClick={() => setSelectedId(prevChapter.id)}
                className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 text-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
                <div className="text-left">
                  <span className="block text-[10px] uppercase text-slate-500">Previous</span>
                  <span className="font-semibold">{prevChapter.title}</span>
                </div>
              </button>
            ) : <div />}

            {nextChapter ? (
              <button
                type="button"
                onClick={() => setSelectedId(nextChapter.id)}
                className="btn-primary flex items-center gap-2 text-xs py-2 px-3"
              >
                <div className="text-right">
                  <span className="block text-[10px] uppercase text-brand-200">Next Chapter</span>
                  <span className="font-semibold">{nextChapter.title}</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : <div />}
          </div>
        </div>
      </main>
    </div>
  )
}

function TerminalToolsIcon(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}
