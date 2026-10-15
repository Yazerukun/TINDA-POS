import {
  BookOpen,
  ShoppingCart,
  Barcode,
  Boxes,
  Wallet,
  HardDriveDownload,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Tag,
  Search
} from 'lucide-react'
import { Modal } from './ui/Modal'
import { useNav } from '../stores/nav'
import { useGuide, type GuideTab } from '../stores/guide'

interface TabOption {
  key: GuideTab
  label: string
  icon: React.ReactNode
  badge?: string
}

const TABS: TabOption[] = [
  { key: 'tour', label: 'Cashier Tour', icon: <Sparkles className="h-4 w-4 text-amber-400" />, badge: 'v2.0.2' },
  { key: 'start', label: 'Quick Start', icon: <Zap className="h-4 w-4" /> },
  { key: 'pos', label: 'POS & Cashier', icon: <ShoppingCart className="h-4 w-4" /> },
  { key: 'scanner', label: 'Barcode Scanner', icon: <Barcode className="h-4 w-4" /> },
  { key: 'inventory', label: 'Inventory & Stock', icon: <Boxes className="h-4 w-4" /> },
  { key: 'utang', label: 'Utang & Credit', icon: <Wallet className="h-4 w-4" /> },
  { key: 'backup', label: 'Backup & Safety', icon: <HardDriveDownload className="h-4 w-4" /> },
  { key: 'shortcuts', label: 'Hotkeys', icon: <Keyboard className="h-4 w-4" /> }
]

export function HelpGuideModal(): React.JSX.Element | null {
  const { open, tab, closeGuide, setTab } = useGuide()
  const { setPage } = useNav()

  if (!open) return null

  return (
    <Modal
      open
      onClose={closeGuide}
      title="TINDA POS — User Guide & Cashier Instructions"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex w-full flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              100% Offline
            </span>
            <button
              type="button"
              onClick={() => {
                closeGuide()
                setPage('handbook')
              }}
              className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-2"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Open Full Store Handbook (13 Chapters) →
            </button>
          </div>
          <button
            type="button"
            onClick={closeGuide}
            className="btn-primary px-4 py-1.5 text-xs font-semibold"
          >
            Got it, Let's Sell!
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-ink-line pb-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t.key
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:bg-ink-800 hover:text-slate-200'
              }`}
            >
              {t.icon}
              {t.label}
              {t.badge && (
                <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab 0: Interactive Cashier Walkthrough */}
        {tab === 'tour' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-ink-900 to-ink-900 p-4">
              <div className="flex items-center justify-between">
                <span className="badge border border-amber-400/40 bg-amber-500/10 text-amber-300 text-[10px] font-bold">
                  ✨ Interactive Walkthrough
                </span>
                <span className="text-[10px] text-slate-400">Estimated read: 2 mins</span>
              </div>
              <h3 className="mt-2 text-base font-black text-white">
                4-Step Cashier Superpower Guide (v2.0.2)
              </h3>
              <p className="mt-1 text-slate-300 leading-relaxed text-xs">
                This is the fastest way to operate TINDA POS. Follow these 4 steps so the cashier never gets confused:
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-ink-line bg-ink-900/90 p-4 space-y-2 hover:border-brand-500/40 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500/20 text-xs font-bold text-brand-400">1</span>
                  <h4 className="font-bold text-white text-sm">Fast Scanning & Search</h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  • Point the barcode scanner at the item or press <strong>F1 / Search</strong>.<br />
                  • Tap <strong>⚡ Quick Keys</strong> for items without a barcode (Ice ₱5, Cigarettes ₱8, Candy ₱1).<br />
                  • Products drop into the Cart automatically.
                </p>
              </div>

              <div className="rounded-xl border border-ink-line bg-ink-900/90 p-4 space-y-2 hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-bold text-emerald-400">2</span>
                  <h4 className="font-bold text-white text-sm">Regular Customer & Credit Recording</h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  • When a regular customer buys on credit, click <strong>Customer</strong> in the Cart.<br />
                  • You instantly see their past balance and credit limit.<br />
                  • Choose <strong>Charge to Credit</strong> at checkout — it posts to the ledger automatically!
                </p>
              </div>

              <div className="rounded-xl border border-ink-line bg-ink-900/90 p-4 space-y-2 hover:border-teal-500/40 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-500/20 text-xs font-bold text-teal-400">3</span>
                  <h4 className="font-bold text-white text-sm">Multi-Payment Checkout</h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  • Press <strong>F12 / Checkout</strong>.<br />
                  • Accept <strong>Cash</strong> (change calculated automatically), <strong>GCash / Maya</strong>, or <strong>Split Payment</strong> (half Cash, half Credit).<br />
                  • Safe against missing products — zero crash guarantee!
                </p>
              </div>

              <div className="rounded-xl border border-ink-line bg-ink-900/90 p-4 space-y-2 hover:border-purple-500/40 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/20 text-xs font-bold text-purple-400">4</span>
                  <h4 className="font-bold text-white text-sm">Receipt & Shift Balancing</h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  • 1-tap thermal receipt printing with 58mm/80mm or Chiteng CT221B.<br />
                  • At the end of the day, press <strong>Z-Reading</strong> to balance the physical cash in the drawer.<br />
                  • Accurate to the centavo, no lost income!
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-ink-850 p-3 border border-ink-line">
              <span className="text-xs text-slate-300">
                Want a deeper explanation of every button and feature?
              </span>
              <button
                type="button"
                onClick={() => {
                  closeGuide()
                  setPage('handbook')
                }}
                className="btn-secondary px-3 py-1.5 text-xs font-bold text-brand-300"
              >
                View the Store Handbook →
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Quick Start & Daily Workflow */}
        {tab === 'start' && (
          <div className="space-y-3 text-xs text-slate-300">
            <div className="rounded-xl border border-brand-500/30 bg-gradient-to-r from-brand-950/60 to-ink-900 p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-brand-300">
                <Zap className="h-4 w-4 text-brand-400" />
                The Simple 3-Step Daily Routine
              </h3>
              <p className="mt-1 text-slate-300 leading-relaxed">
                Follow this simple workflow every day to ensure your cash drawer balances accurately and your inventory stays 100% correct.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-ink-line bg-ink-900 p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-300">STEP 1</span>
                    <span className="text-[10px] text-slate-500">Morning</span>
                  </div>
                  <h4 className="mt-2 font-semibold text-white">Open Cashier Shift</h4>
                  <p className="mt-1 text-[11px] text-slate-400">
                    When you open the store, start your shift by entering your <strong>Starting Cash Float</strong> (e.g. ₱500–₱1,000 for customer change).
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Ready for sales
                </div>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">STEP 2</span>
                    <span className="text-[10px] text-slate-500">All Day</span>
                  </div>
                  <h4 className="mt-2 font-semibold text-white">Ring Up Customers</h4>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Scan barcodes with your USB scanner or phone camera, or search by name. Accept <strong>Cash</strong>, <strong>GCash</strong>, or <strong>Utang</strong>.
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-brand-400 font-medium">
                  <ShoppingCart className="h-3 w-3" /> Auto stock deduct
                </div>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">STEP 3</span>
                    <span className="text-[10px] text-slate-500">Closing</span>
                  </div>
                  <h4 className="mt-2 font-semibold text-white">Shift Z-Reading</h4>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Count the physical cash in your drawer, end the shift, and review your daily gross sales and net variance in Reports.
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                  <ShieldCheck className="h-3 w-3" /> Zero cash leak
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-ink-line bg-ink-900/60 p-3 text-slate-400">
              <p className="font-semibold text-slate-200">💡 Important Golden Rule for Store Owners:</p>
              <p className="mt-0.5">
                Always make sure cashiers ring up <strong>every single sale</strong> in the POS. When a sale is completed, stocks are automatically deducted and profits are calculated in real time.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: POS & Cashier Guide */}
        {tab === 'pos' && (
          <div className="space-y-3 text-xs text-slate-300">
            <div className="rounded-lg border border-ink-line bg-ink-900 p-3.5 space-y-2">
              <h4 className="font-semibold text-brand-300 text-sm flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                How to Handle Sales & Cart Checkout
              </h4>
              <p className="text-slate-400">
                The POS screen is designed for high-speed operation. Cashiers can complete a transaction in under 5 seconds.
              </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-brand-400" /> 1. Finding & Adding Items
                </span>
                <p className="mt-1 text-slate-400">
                  Type any part of the product name, SKU, or barcode in the top search bar. Or click any category tile to browse items. Simply tap the item to add it to the cart.
                </p>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-brand-400" /> 2. Changing Quantity & Discounts
                </span>
                <p className="mt-1 text-slate-400">
                  Click the <strong>+</strong> or <strong>-</strong> buttons on cart items. To enter high numbers quickly, click the quantity number or press <strong>F2</strong>. Click <strong>Add Discount</strong> to deduct custom pesos.
                </p>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-brand-400" /> 3. Payment Methods
                </span>
                <ul className="mt-1 space-y-1 text-slate-400 list-disc pl-4">
                  <li><strong>Cash (F9):</strong> Enter the amount given by the customer. The system displays exact change.</li>
                  <li><strong>GCash (F10):</strong> Enter the 4-digit or full GCash reference number.</li>
                  <li><strong>Utang:</strong> Assign customer name and charge to credit ledger.</li>
                </ul>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" /> 4. Hold & Recall Sales
                </span>
                <p className="mt-1 text-slate-400">
                  If a customer forgets an item, click <strong>Hold Sale</strong>. The cart clears so you can serve the next customer. When the first customer returns, tap <strong>Held Sales</strong> to restore their cart instantly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Barcode Scanning */}
        {tab === 'scanner' && (
          <div className="space-y-3 text-xs text-slate-300">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3.5">
              <h4 className="font-semibold text-emerald-300 text-sm flex items-center gap-2">
                <Barcode className="h-4 w-4" />
                Two Ways to Scan Barcodes (Hardware & Smartphone)
              </h4>
              <p className="mt-1 text-slate-300">
                TINDA POS supports both physical USB handheld scanners and your smartphone camera simultaneously!
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Barcode className="h-4 w-4 text-emerald-400" />
                    Option 1: Physical USB Hardware Scanner
                  </span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    🟢 Scanner Ready
                  </span>
                </div>
                <p className="mt-1.5 text-slate-400">
                  Plug any USB or 2.4GHz wireless barcode scanner (Zebra, Honeywell, Netum, generic USB) into your computer. It requires <strong>zero drivers</strong>!
                </p>
                <div className="mt-2 rounded bg-ink-950 p-2 text-[11px] text-slate-300">
                  <strong>✨ Pro Tip:</strong> You don't need to click inside the search bar before scanning. The system captures barcode bursts automatically from anywhere on the screen!
                </div>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-brand-400" />
                    Option 2: Use Your Smartphone Camera (Zero Cost)
                  </span>
                  <span className="rounded bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-300">
                    📷 Camera / Phone
                  </span>
                </div>
                <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-slate-400">
                  <li>Download free <strong>Iriun Webcam</strong> or <strong>DroidCam</strong> on your Android/iPhone.</li>
                  <li>Install the matching free Windows driver on your computer.</li>
                  <li>Connect both phone and PC to the same Wi-Fi or plug in via USB cable.</li>
                  <li>Click <strong>"📷 Camera / Phone"</strong> in the top header and select your phone camera in the dropdown. Point at barcodes to scan!</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Inventory & Stock */}
        {tab === 'inventory' && (
          <div className="space-y-3 text-xs text-slate-300">
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Boxes className="h-4 w-4 text-brand-400" /> Adding New Products
                </h4>
                <p className="mt-1 text-slate-400">
                  Navigate to <strong>Inventory</strong> and click <strong>New Product</strong>. Enter the product name, category, cost price, selling price, and scan the barcode.
                </p>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-400" /> Pre-Seeded 172 Price Guide
                </h4>
                <p className="mt-1 text-slate-400">
                  TINDA POS comes pre-loaded with 172 staple Philippine sari-sari store commodities! Click <strong>Price Guide</strong> in Inventory to check official DTI SRP and supermarket benchmarks.
                </p>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-brand-400" /> Multi-Units (Pack vs Piece)
                </h4>
                <p className="mt-1 text-slate-400">
                  Sell items individually or by the case! For example, set <em>Base Unit: Piece</em> and add a unit for <em>1 Box = 12 Pieces</em>. Selling a box automatically deducts 12 pieces from inventory.
                </p>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <HardDriveDownload className="h-4 w-4 text-amber-400" /> Import CSV or Simple POS
                </h4>
                <p className="mt-1 text-slate-400">
                  Moving from another POS? Click <strong>Import Products / Backup</strong> to import spreadsheets or direct <em>Simple POS</em> backup files (`.json`) with automatic SKU generation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Utang & Credit */}
        {tab === 'utang' && (
          <div className="space-y-3 text-xs text-slate-300">
            <div className="rounded-lg border border-ink-line bg-ink-900 p-3.5 space-y-2">
              <h4 className="font-semibold text-brand-300 text-sm flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Managing Customer Credit (Utang Ledger)
              </h4>
              <p className="text-slate-400">
                Never lose track of who borrowed what. TINDA POS tracks itemized debts down to each piece of candy or can of sardines.
              </p>
            </div>

            <div className="space-y-2">
              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <span className="font-bold text-white">1. Ringing up an Utang Sale</span>
                <p className="mt-1 text-slate-400">
                  In POS, click <strong>Customer</strong> and pick the customer name (or create a new customer). Add items to the cart, click <strong>Checkout</strong>, and select <strong>Utang / Credit</strong>.
                </p>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <span className="font-bold text-white">2. Itemized Debt Breakdown (📦 Package Icon)</span>
                <p className="mt-1 text-slate-400">
                  In the <strong>Utang</strong> page, every credit transaction displays a 📦 package icon. Tap it to expand and view the exact items, quantities, and prices the customer purchased.
                </p>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <span className="font-bold text-white">3. Recording Partial Payments & Receipts</span>
                <p className="mt-1 text-slate-400">
                  When a customer pays (e.g. ₱200 out of ₱500 balance), tap <strong>Record Payment</strong>. The balance updates instantly, and you can click <strong>Print Receipt</strong> for their official payment slip.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Backup & Safety */}
        {tab === 'backup' && (
          <div className="space-y-3 text-xs text-slate-300">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3.5">
              <h4 className="font-semibold text-amber-300 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Protect Your Store's Data with Offline Backups
              </h4>
              <p className="mt-1 text-slate-300">
                All store records are stored locally and safely on your computer. Keep your data safe from PC hardware failure with weekly backups.
              </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <HardDriveDownload className="h-4 w-4 text-emerald-400" />
                  1-Click Backup
                </span>
                <p className="mt-1 text-slate-400">
                  Go to <strong>Backup</strong> in the sidebar and click <strong>Create Backup</strong>. A snapshot file (`tindapos-YYYY-MM-DD.db`) is generated instantly with zero downtime.
                </p>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-brand-400" />
                  USB Flash Drive Storage
                </span>
                <p className="mt-1 text-slate-400">
                  Click <strong>Open Backup Folder</strong> and copy the latest backup file to a USB flash drive or memory card. If your computer ever breaks, your store data remains 100% safe!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Hotkeys */}
        {tab === 'shortcuts' && (
          <div className="space-y-3 text-xs text-slate-300">
            <p className="text-slate-400">
              Speed up checkout by using keyboard shortcuts on any Windows keyboard or numeric keypad:
            </p>
            <div className="overflow-hidden rounded-lg border border-ink-line bg-ink-900">
              <table className="w-full text-left">
                <thead className="border-b border-ink-line bg-ink-950 text-[11px] uppercase text-slate-400 font-semibold">
                  <tr>
                    <th className="px-4 py-2">Shortcut</th>
                    <th className="px-4 py-2">Action</th>
                    <th className="px-4 py-2">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-line text-slate-300">
                  <tr>
                    <td className="px-4 py-2 font-mono font-bold text-brand-300">F1 or /</td>
                    <td className="px-4 py-2 font-semibold">Search Product</td>
                    <td className="px-4 py-2 text-slate-400">Focuses the product search input instantly</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono font-bold text-brand-300">F2</td>
                    <td className="px-4 py-2 font-semibold">Change Quantity</td>
                    <td className="px-4 py-2 text-slate-400">Opens quick quantity editor for the selected item</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono font-bold text-brand-300">F4</td>
                    <td className="px-4 py-2 font-semibold">Apply Discount</td>
                    <td className="px-4 py-2 text-slate-400">Adds custom peso discount to current cart</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono font-bold text-brand-300">F8</td>
                    <td className="px-4 py-2 font-semibold">Hold Current Sale</td>
                    <td className="px-4 py-2 text-slate-400">Suspends current transaction to serve the next customer</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono font-bold text-emerald-400">F9</td>
                    <td className="px-4 py-2 font-semibold">Pay Cash</td>
                    <td className="px-4 py-2 text-slate-400">Opens Cash checkout and focuses amount tendered</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono font-bold text-sky-400">F10</td>
                    <td className="px-4 py-2 font-semibold">Pay GCash</td>
                    <td className="px-4 py-2 text-slate-400">Opens GCash checkout and focuses reference number</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono font-bold text-rose-400">Esc</td>
                    <td className="px-4 py-2 font-semibold">Cancel / Close</td>
                    <td className="px-4 py-2 text-slate-400">Closes dialog or modal window</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
