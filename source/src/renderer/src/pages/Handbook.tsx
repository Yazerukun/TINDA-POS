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
  HelpCircle
} from 'lucide-react'
import { useNav, type PageKey } from '../stores/nav'

interface Chapter {
  id: string
  number: number
  title: string
  subtitle: string
  icon: React.ReactNode
  readTime: string
  relatedPage?: PageKey
  relatedPageLabel?: string
  content: React.ReactNode
}

export function Handbook(): React.JSX.Element {
  const { setPage } = useNav()
  const [selectedId, setSelectedId] = useState<string>('intro')
  const [searchQuery, setSearchQuery] = useState('')

  const chapters: Chapter[] = useMemo(() => [
    {
      id: 'intro',
      number: 1,
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
          </div>
        </div>
      )
    },
    {
      id: 'shift',
      number: 2,
      title: 'Daily Workflow & Shift Management',
      subtitle: 'Opening float, cashier balancing, and Z-Reading shift reports',
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
                <h4 className="font-semibold text-white">Morning: Opening Shift & Float Cash</h4>
                <p className="mt-1 text-xs text-slate-400">
                  When starting your shift in the morning, the system prompts for your <strong>Starting Cash Float</strong>. This is the change fund you put into the drawer (e.g., ₱500 or ₱1,000 in coins and small bills). Entering an accurate float prevents cash count discrepancies at the end of the day.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-500/20 bg-ink-900 p-4 flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">2</span>
              <div>
                <h4 className="font-semibold text-white">All Day: Processing Transactions</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Ring up every customer through the POS screen. Whenever a sale is finished, the system calculates exact change, logs the payment method (Cash, GCash, or Utang), and instantly deducts stock from inventory.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-ink-900 p-4 flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">3</span>
              <div>
                <h4 className="font-semibold text-white">Evening: Cash Count & Shift Z-Reading</h4>
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
                Finding Products
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                Press <kbd className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-brand-300">F1</kbd> or <kbd className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-brand-300">/</kbd> to focus the search bar. You can search by brand, full name, SKU, or scan the barcode. You can also filter by category dropdown on the right.
              </p>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Tag className="h-4 w-4 text-brand-400" />
                Adjusting Quantity & Discounts
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                Click <strong>+</strong> or <strong>-</strong> in the cart. To enter a large number directly, click the quantity number or press <kbd className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-brand-300">F2</kbd>. Click <strong>Add Discount</strong> (<kbd className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-brand-300">F4</kbd>) to deduct custom pesos.
              </p>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-400" />
                Payment Options (Cash & GCash)
              </h4>
              <ul className="mt-1 text-xs text-slate-400 space-y-1 list-disc pl-4">
                <li><strong>Cash (<kbd className="font-mono text-emerald-300">F9</kbd>):</strong> Type amount tendered. The system calculates exact change.</li>
                <li><strong>GCash (<kbd className="font-mono text-sky-300">F10</kbd>):</strong> Customer scans store QR. Enter the reference number.</li>
              </ul>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                Hold & Resume Sales (<kbd className="font-mono text-amber-300">F8</kbd>)
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                If a customer forgets their wallet or steps away to pick up more items, tap <strong>Hold Sale</strong>. The cart clears to serve the next customer. When the first customer returns, tap <strong>Held Sales</strong> to restore their cart in 1 click!
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
            {/* FEATURE 1: Instant Auto-Capture in Inventory */}
            <div className="rounded-lg border border-brand-500/30 bg-ink-900 p-4">
              <span className="rounded bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-300">
                NEW IN v1.0.42 · INVENTORY SPEED ENCODING
              </span>
              <h4 className="mt-1.5 font-semibold text-white">Instant Barcode Auto-Capture (Zero Manual Typing)</h4>
              <p className="mt-1 text-xs text-slate-400">
                Encoding products with long 12- or 13-digit EAN/UPC barcodes is now completely effortless:
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                <li>
                  <strong>Inside Product Form:</strong> Simply scan the physical product with your USB barcode gun or smartphone companion camera. The barcode number is immediately populated into the Barcode field with an audible confirmation tone and a green auto-capture indicator.
                </li>
                <li>
                  <strong>Active Input Contamination Sanitizer:</strong> You do not need to click into the Barcode field before scanning. Even if your cursor is focused inside the product Name or Cost field, the high-speed scanner burst is intercepted, stripped from the active input, and routed cleanly into the Barcode slot without accidental form submissions.
                </li>
                <li>
                  <strong>Multi-Unit (Tingi) Barcodes:</strong> Add distinct barcodes for individual retail pieces and wholesale cartons by clicking the camera icon or focusing the unit barcode field.
                </li>
                <li>
                  <strong>Proactive Duplicate Alert:</strong> The system automatically verifies that the scanned barcode is not already assigned to another product in your catalog, preventing cashier checkout confusion.
                </li>
                <li>
                  <strong>Direct Inventory Fast-Track:</strong> When browsing the Inventory list, scanning any uncataloged barcode immediately opens the New Product creation window with that barcode pre-filled, ready for you to enter the name and price!
                </li>
              </ul>
            </div>

            {/* HARDWARE SCANNERS */}
            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                HARDWARE · PLUG &amp; PLAY
              </span>
              <h4 className="mt-1.5 font-semibold text-white">Physical USB &amp; 2.4GHz Wireless Barcode Scanners</h4>
              <p className="mt-1 text-xs text-slate-400">
                Any standard USB or 2.4GHz wireless retail barcode scanner gun (Honeywell, Zebra, Netum, Eyoyo, Datalogic, generic USB) connects with <strong>zero driver installation</strong>.
              </p>
              <div className="mt-2.5 rounded bg-ink-950 p-2.5 text-xs text-emerald-300 border border-emerald-500/20">
                <strong>💡 Global Burst Interceptor in POS:</strong> Cashiers can scan items from anywhere in the POS checkout screen. High-speed keystrokes are automatically recognized and items are immediately added to the customer's cart.
              </div>
            </div>

            {/* SMARTPHONE COMPANION */}
            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                WIRELESS · ZERO APP INSTALL
              </span>
              <h4 className="mt-1.5 font-semibold text-white">1-Click Smartphone Companion QR Scanner</h4>
              <p className="mt-1 text-xs text-slate-400">
                Transform any Android phone or iPhone into a high-speed wireless barcode scanner over your local Wi-Fi:
              </p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs text-slate-400">
                <li>Click <strong>"📷 Camera / Phone"</strong> in the POS header or inside the Product Inventory modal.</li>
                <li>Connect your smartphone to the same Wi-Fi router as your computer.</li>
                <li>Scan the displayed QR code with your phone camera to launch the web scanner interface.</li>
                <li>Point your phone camera at product barcodes — scanned barcodes are beamed directly to your desktop POS or Inventory form in real time!</li>
              </ol>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'inventory',
      number: 5,
      title: 'Inventory, Products & Multi-Units',
      subtitle: 'Adding items, piece vs case conversions, and stock alerts',
      icon: <Boxes className="h-4 w-4" />,
      readTime: '4 min read',
      relatedPage: 'inventory',
      relatedPageLabel: 'Open Inventory',
      content: (
        <div className="space-y-6 text-slate-300 leading-relaxed">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white">Managing Products Like a Pro</h3>
            <p className="text-xs text-slate-400">
              Keep your inventory accurate and your profit margins healthy by structuring your products properly.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Tag className="h-4 w-4 text-brand-400" />
                Multi-Unit Conversions (Pack vs Piece)
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                Do you sell instant noodles by the piece and also by the box? In product settings, set the <strong>Base Unit</strong> to <em>Piece</em>, then add a <strong>Secondary Unit</strong>: <em>1 Box = 72 Pieces</em> with its own box price and barcode. Selling a box will automatically deduct 72 pieces from inventory!
              </p>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Low Stock Thresholds & Badges
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                Every product has a <strong>Low Stock Threshold</strong> (default is 5 units). When remaining stock drops below this number, the product tile displays a yellow warning badge in the POS so you know to reorder before running out.
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
      subtitle: 'Credit tracking, itemized breakdown with package icon, and receipts',
      icon: <Wallet className="h-4 w-4" />,
      readTime: '4 min read',
      relatedPage: 'utang',
      relatedPageLabel: 'Open Utang Ledger',
      content: (
        <div className="space-y-6 text-slate-300 leading-relaxed">
          <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
            <h3 className="text-base font-bold text-white">Zero Debt Confusion</h3>
            <p className="text-xs text-slate-400 mt-1">
              Never argue with customers about what they borrowed. TINDA POS tracks every transaction down to the exact item name, quantity, and timestamp.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-ink-line bg-ink-900 p-3.5">
              <h4 className="font-semibold text-white">1. Ringing up an Utang Sale</h4>
              <p className="mt-1 text-xs text-slate-400">
                In POS, click <strong>Customer</strong> and assign the customer's name (or add a new customer). Add their items to the cart, click <strong>Checkout</strong>, and select <strong>Utang / Credit</strong>. The sale finishes with ₱0 cash received and increases the customer's ledger balance.
              </p>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-3.5">
              <h4 className="font-semibold text-white">2. Itemized Debt Breakdown (📦 Package Icon)</h4>
              <p className="mt-1 text-xs text-slate-400">
                Go to the <strong>Utang</strong> page in the sidebar. Click the 📦 package icon on any credit entry. The entry expands to show the full list of products the customer took on credit!
              </p>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900 p-3.5">
              <h4 className="font-semibold text-white">3. Recording Partial Payments</h4>
              <p className="mt-1 text-xs text-slate-400">
                When a customer pays (e.g. ₱300 towards a ₱750 debt), click <strong>Record Payment</strong>. Type ₱300, and their remaining balance updates instantly to ₱450. Click <strong>Print Receipt</strong> to hand them proof of payment.
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
              The Store Owner's Golden Rule
            </h3>
            <p className="mt-1 text-xs text-slate-300">
              Because TINDA POS is 100% offline, your entire store history lives on your computer. If your computer hardware fails or your laptop gets damaged, you must have a backup on a USB flash drive!
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
              <h4 className="font-semibold text-white">1-Click Local Backup</h4>
              <p className="mt-1 text-xs text-slate-400">
                Go to <strong>Backup</strong> in the sidebar and click <strong>Back Up Now</strong>. A checkpointed database snapshot (`tindapos-YYYY-MM-DD.db`) is saved instantly.
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
            Cashiers can complete transactions without touching the mouse by using keyboard hotkeys:
          </p>

          <div className="overflow-hidden rounded-xl border border-ink-line bg-ink-900">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink-line bg-ink-950 font-semibold uppercase text-slate-400 text-[11px]">
                <tr>
                  <th className="px-4 py-3">Shortcut Key</th>
                  <th className="px-4 py-3">Function</th>
                  <th className="px-4 py-3">When to Use</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line text-slate-300">
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold text-brand-300">F1 or /</td>
                  <td className="px-4 py-2.5 font-semibold text-white">Search Products</td>
                  <td className="px-4 py-2.5 text-slate-400">Jump cursor straight to search box</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold text-brand-300">F2</td>
                  <td className="px-4 py-2.5 font-semibold text-white">Edit Quantity</td>
                  <td className="px-4 py-2.5 text-slate-400">Type exact quantity for current cart item</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold text-brand-300">F4</td>
                  <td className="px-4 py-2.5 font-semibold text-white">Discount</td>
                  <td className="px-4 py-2.5 text-slate-400">Apply peso discount to current cart</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold text-brand-300">F8</td>
                  <td className="px-4 py-2.5 font-semibold text-white">Hold Sale</td>
                  <td className="px-4 py-2.5 text-slate-400">Suspend order to serve next customer</td>
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
              3. Ensure your handheld scanner is set to send a trailing <em>"Enter"</em> key (standard factory default for all retail scanners).
            </p>
          </div>

          <div className="rounded-lg border border-ink-line bg-ink-900 p-4">
            <h4 className="font-semibold text-white text-sm">Can I move my store database to a new laptop?</h4>
            <p className="mt-1 text-slate-400">
              Yes! Simply go to <strong>Backup</strong>, click <strong>Back Up Now</strong>, copy the file to a USB stick, install TINDA POS on the new laptop, and click <strong>Restore Backup</strong>.
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
            <h3 className="mt-1 text-xl font-bold text-white">Setting up GOOJPRT PB-58H &amp; POS-58 Printers</h3>
            <p className="mt-2 text-slate-300">
              TINDA POS has built-in support for standard 58mm and 80mm thermal receipt printers, including popular models like <strong>GOOJPRT PB-58H (USB + Bluetooth)</strong>, Xprinter XP-58, and generic POS-58 printers.
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
                <li><strong>Zero-Click Auto-Detect:</strong> No manual configuration needed! Once plugged in, TINDA POS automatically detects and binds your printer for receipts, shift audits, and Z-readings.</li>
                <li>To customize receipt headers or footers, navigate to <strong>Settings</strong> &rarr; <strong>Receipt tab</strong>.</li>
                <li>Toggle <strong>Auto Print After Sale</strong> if you want receipts to print immediately upon checkout completion.</li>
              </ol>
            </div>

            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-sky-400" />
              Method 2: Bluetooth Connection (Wireless Setup)
            </h4>
            <div className="rounded-lg border border-ink-line bg-ink-900 p-4 space-y-2">
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
                <li>Turn on Bluetooth on your Windows PC or laptop.</li>
                <li>Search for the printer Bluetooth device (usually named <em>PB-58H</em>, <em>MTP-2</em>, or <em>RPP02N</em>).</li>
                <li>Pair using the standard PIN: <strong>0000</strong> or <strong>1234</strong>.</li>
                <li>In Windows <em>Control Panel &rarr; Devices &amp; Printers</em>, verify the printer's <strong>Outgoing COM Port</strong> (e.g., COM3 or COM4).</li>
                <li>Assign the printer driver to this COM port.</li>
                <li>In TINDA POS Settings, click <strong>Refresh Printers</strong> and select your Bluetooth device.</li>
              </ol>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2 text-amber-200">
              <div className="font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Troubleshooting: Print completes successfully but paper is blank or does not feed?</span>
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-300 text-[11px]">
                <li><strong>1. Thermal Paper Roll Orientation (Most Common Cause):</strong> Thermal paper only has one chemically-treated heat-sensitive side. Scratch the paper with your fingernail; if a black line appears, that is the <em>thermal side</em>. That side <strong>must face the heated printhead</strong>. If the roll is inserted backwards, the printer feeds blank paper with no print visible.</li>
                <li><strong>2. Windows USB Virtual Port Mapping:</strong> In Windows <em>Printers &amp; Scanners &rarr; Your Thermal Printer &rarr; Printer Properties &rarr; Ports tab</em>, ensure that the active <code>USB001</code> or <code>USB002</code> Virtual Printer Port is selected. If set to an inactive <code>LPT1</code> or <code>COM1</code>, Windows will report "Printing complete" but the data never reaches the USB hardware.</li>
                <li><strong>3. Windows Driver Page Size Setting:</strong> In Windows Printing Preferences, set the default Paper Size to <strong>58mm x 297mm</strong> or <strong>58 x Continuous</strong> rather than A4 or Letter.</li>
                <li><strong>4. Hardware Self-Test Verification:</strong> To test physical printer hardware: turn off the printer, hold the <strong>FEED button</strong>, and turn on power while holding FEED. Release after 2 seconds. The printer should print an internal diagnostic self-test slip confirming the printhead is working.</li>
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

            {currentChapter.relatedPage && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setPage(currentChapter.relatedPage!)}
                  className="btn-secondary inline-flex items-center gap-1.5 text-xs py-1.5 px-3 text-brand-300 border-brand-500/30 hover:border-brand-500"
                >
                  <span>{currentChapter.relatedPageLabel || 'Open Page'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
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
