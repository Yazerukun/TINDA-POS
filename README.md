<div align="center">

<img src="https://img.shields.io/badge/TINDA_POS-v1.0.55-059669?style=for-the-badge&labelColor=065f46" alt="Version">
<img src="https://img.shields.io/badge/Platform-Windows_10%2F11_%7C_Linux-0078d4?style=for-the-badge&logo=windows&logoColor=white" alt="Platform">
<img src="https://img.shields.io/badge/Works-100%25_Offline-6366f1?style=for-the-badge" alt="Offline">
<img src="https://img.shields.io/badge/Tests-Passing-10b981?style=for-the-badge" alt="Tests">
<img src="https://img.shields.io/badge/License-Free_for_Personal_%26_SMB-f59e0b?style=for-the-badge" alt="License">

<br /><br />

# 🏪 TINDA POS

### Offline Point-of-Sale for Philippine Sari-Sari Stores & Small Businesses

**Sell products · Track inventory · Manage customer Utang · VIP E-Wallet Reconciliation — all in one focused desktop app. No internet required.**

<br />

[⬇️ Download v1.0.55 Setup](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.55/TindaPOS-Setup-1.0.55.exe)&nbsp;&nbsp;·&nbsp;&nbsp;[📦 Portable Edition](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.55/TindaPOS-Portable-1.0.55.exe)&nbsp;&nbsp;·&nbsp;&nbsp;[🐧 Linux Package](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.55/TindaPOS-1.0.55-linux-x64.tar.gz)&nbsp;&nbsp;·&nbsp;&nbsp;[📄 User Guide PDF](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.44/TindaPOS-User-Guide.pdf)&nbsp;&nbsp;·&nbsp;&nbsp;[🐛 Report Issue](https://github.com/Yazerukun/TINDA-POS/issues)

</div>

## ✨ What's New in v1.0.55 (VIP E-Wallet Reconciliation Hub Polish & Enhanced Lounge)

> **Zero Float Physical Cash Drawer Override, Dedicated Transactions Ledger, 1-Tap Void/Delete Management & Draggable Lounge**

- 📱 **Zero Float & Physical Cash Drawer Override**: Cashiers can freely edit or 1-tap reset Expected Cash Drawer (`₱0.00 (Zero Float)`, `Sync POS Shift (₱...)`, `E-Wallet Net Only`). Completely eliminates false cash shortages when store keeps E-wallet money in a separate pouch or audits independently.
- 📋 **Dedicated Transactions Ledger Tab**: Full-width tab with real-time search across Reference #, Customer Name, Phone, and Cashier; quick channel (`GCash`/`Maya`) and type (`Cash In`/`Cash Out`) filters; and instant thermal slip reprints.
- 🗑️ **Accessible 1-Tap Void/Delete Management**: Prominent red `Void` buttons with Apple-design frosted confirmation modal and instant shift summary + drawer balance recalculation without ghost records.
- 💬 **Enhanced Global Lounge**: Non-blocking draggable floating window, minimizable floating capsule pill, dual-tone Web Audio API chime with mute/unmute toggle, and self-message deletion.

---

## ✨ What's New in v1.0.51 — Free Community Lounge, Red Unread Alerts & Linux Support

> **100% Free Nationwide Merchant Chat, Red Pulse Unread Alerts, Streamlined Header & Multi-Platform Releases**

- 💬 **100% Free Nationwide Community Lounge**:
  - Real-time merchant messaging is now **completely free and accessible for all store owners** (both Free and VIP Pro tiers).
  - Ask questions, share wholesale supplier deals, and collaborate with peers nationwide without paywalls.
  - Verified **`👑 Ian (Founder / Dev) [VERIFIED]`** identity remains cryptographically secured.
- 🔴 **Dynamic Red Pulse Unread Alert Indicator**:
  - Non-blocking 12-second background heartbeat checks for new incoming merchant messages when the chat drawer is closed.
  - The floating **Global Lounge** trigger button automatically pulses with a **glowing red beacon** and **`NEW`** badge whenever an unread message arrives.
- 🧹 **Clean POS Header Toolbar**:
  - Removed unclickable `+ add · F2 qty` informational clutter from the header navigation bar for a cleaner counter view.
- 🐧 **Official Linux AppImage Distribution**:
  - Official standalone **Linux AppImage** (`TindaPOS-1.0.51.AppImage`) with native Wayland support (`xwayland: 0`) and bundled SQLite binaries (`linux-x64.node`).

---

## ✨ What's New in v1.0.50 — Global Community Lounge & Live Dev Announcements

> **Real-Time VIP Community Chat, Live Developer Announcements, Verified Dev Badge & English Modals — Powered by Cloudflare**

- 💬 **TINDA Global Community Lounge** (VIP Pro Exclusive):
  - A floating **Global Lounge** button in the bottom-right corner opens a real-time community chat drawer.
  - **VIP Pro members** can send messages to all stores worldwide; free-tier users have read-only access.
  - Amber unread-message dot badge when there are new messages while the drawer is closed.
  - Polling is active **only while the drawer is open** (every 6 seconds) — stops automatically to save bandwidth.
  - **Zero-freeze architecture**: all Cloudflare network calls run with `AbortSignal` timeouts (4s GET / 5s POST) and fail silently — the POS never stalls.
- 📢 **Live Developer Announcements**:
  - Pinned announcement banner at the top of the Community Lounge always shows the latest official message from the developer.
  - Used for update notices, downtime warnings, and feature previews.
- 👑 **Dev/Owner Verified Badge**:
  - Founder messages display as **`👑 Ian (Founder / Dev) [VERIFIED]`** in a distinct amber style.
  - Badge is cryptographically verified **server-side** — cannot be spoofed by any regular user.
- 🌐 **English Update Notification Modal**:
  - The update pop-up is now 100% in English: **"New Update Available"**, **"Later"**, **"Download Update"**, **"Restart & Install"**.
- 🏗️ **Quality**: 59/59 test suites passing · 0 TypeScript errors · all master invariants passed.

---

## ✨ What's New in v1.0.49 (Extended Specifications Visibility & Manager Bargain Authorization)

> **Multiline Technical Specs Wrap, Secondary Description Display, Manager-PIN Bargain Overrides & Purchase Cost Protection**

- 📐 **Extended Product Name & Technical Specifications Visibility**:
  - **Expanded POS Catalog Cards**: Grid card height increased from 160px to 185px with adaptive 3-line wrap (`break-words`), guaranteeing long hardware item names and millimeter suffixes (e.g. `1/2" x 100mm`, `3.2mm`, `Grade 40`) are never cut off.
  - **Dedicated Secondary Specifications Display**: Directly shows product descriptions and technical dimensions in `text-[11px] text-slate-400` beneath the title on catalog cards for instant differentiation between millimeter size variants.
  - **Inventory Specifications Input**: Added dedicated multiline description/specs field in `ProductModal` with zero disruptive schema changes (persists to core `products.description` column).
  - **Cart & Held Sales Retention**: Line items in the cart and resumed held sales retain full technical specifications.
- 🏷️ **Line-Item Custom Price Override & Manager Bargain Authorization ("Tawad")**:
  - **Manager / Admin Security PIN Gate**: Cashiers attempting to modify an item's unit price are prompted for a 4-digit Manager or Admin PIN (`auth:verifyManagerPin`) without mutating the cashier's active session, user ID, or open shift.
  - **Direct Manager Access**: Store owners and managers logged into an Admin/Manager account can edit line prices directly without redundant PIN prompts.
  - **Visual Bargain Badge**: Overridden items feature an amber `✏️ Bargain / Custom Price` tag and struck-through original retail price.
  - **Live Margin Protection Warning**: `PriceOverrideModal` alerts the manager if a negotiated price drops below product purchase cost (`cost_base_c`).
  - **Seamless Reset**: One-click "Reset to normal" restores standard retail base price or wholesale volume tiering.
  - **Transactional Ledger & Sync Integrity**: Custom unit prices and subtotals persist accurately in `sale_items` for correct profit calculations, X/Z-Read reports, and Cloudflare Sync.

---

## ✨ What's New in v1.0.48 (Executive Cloud Dashboard Sync & Remote Sales Monitoring)

> **Real-Time Live Sales Cloud Sync, Cloudflare Worker Backend, Multi-Branch Store ID & VIP Cloud Tab**

- ☁️ **Executive Cloud Owner Dashboard Integration**: Store owners can view live sales, gross profit, active cashier shifts, and inventory levels from any smartphone or laptop anywhere in the world via the official Web Dashboard ([https://tinda-owner-dashboard.pages.dev/](https://tinda-owner-dashboard.pages.dev/)).
- 🔄 **Automated Background Push Engine**: Completed transactions, Z-Read shift closures, and stock movements auto-sync to Cloudflare Workers with zero cashier latency. Offline queues ensure zero transaction drops if internet connectivity is intermittent.
- ⚙️ **Dedicated Cloud Dashboard (VIP) Tab**: View connection status, copy Store ID & Sync Key, trigger manual synchronization, and test connection latency with 1-click.

---

## ✨ What's New in v1.0.44 (Weighable & Fractional Decimal Quantity Mode)
=======
[⬇️ Download v1.0.55 Setup](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.55/TindaPOS-Setup-1.0.55.exe)&nbsp;&nbsp;·&nbsp;&nbsp;[📦 Portable Edition](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.55/TindaPOS-Portable-1.0.55.exe)&nbsp;&nbsp;·&nbsp;&nbsp;[🐧 Linux Package](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.55/TindaPOS-1.0.55-linux-x64.tar.gz)&nbsp;&nbsp;·&nbsp;&nbsp;[📄 User Guide PDF](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.44/TindaPOS-User-Guide.pdf)&nbsp;&nbsp;·&nbsp;&nbsp;[🐛 Report Issue](https://github.com/Yazerukun/TINDA-POS/issues)

</div>

## ✨ What's New in v1.0.55 (VIP E-Wallet Reconciliation Hub Polish & Enhanced Lounge)

> **Zero Float Physical Cash Drawer Override, Dedicated Transactions Ledger, 1-Tap Void/Delete Management & Draggable Lounge**

- 📱 **Zero Float & Physical Cash Drawer Override**: Cashiers can freely edit or 1-tap reset Expected Cash Drawer (`₱0.00 (Zero Float)`, `Sync POS Shift (₱...)`, `E-Wallet Net Only`). Completely eliminates false cash shortages when store keeps E-wallet money in a separate pouch or audits independently.
- 📋 **Dedicated Transactions Ledger Tab**: Full-width tab with real-time search across Reference #, Customer Name, Phone, and Cashier; quick channel (`GCash`/`Maya`) and type (`Cash In`/`Cash Out`) filters; and instant thermal slip reprints.
- 🗑️ **Accessible 1-Tap Void/Delete Management**: Prominent red `Void` buttons with Apple-design frosted confirmation modal and instant shift summary + drawer balance recalculation without ghost records.
- 💬 **Enhanced Global Lounge**: Non-blocking draggable floating window, minimizable floating capsule pill, dual-tone Web Audio API chime with mute/unmute toggle, and self-message deletion.
>>>>>>> 8ae85ff (release: v1.0.55 - E-Wallet Reconciliation Hub Polish & Enhanced Lounge)

> **Kilo & Scale Precision, Real-Time Peso Totaling, Fractional Inventory Deductions, Thermal Receipt & CFD Parity**

- 🥩 **Weighable & Fractional Decimal Quantity Engine ("Kilo Mode")**: Tailored specifically for Philippine meat shops, fish vendors, vegetable stands, rice retailers, feeds stores, and sari-sari counters. Cashiers can now enter fractional weights directly into the POS cart (e.g. `2.5 kg`, `2.24 kg`, `2.25 kg`, `0.75 kg`) without integer truncation.
- 🎯 **Intelligent Unit Detection (`isWeighableUnit`)**: Automatically recognizes weighable and measurable commodities (`kilo`, `kg`, `kls`, `kilogram`, `g`, `gram`, `liter`, `l`, `ml`, `m`). Packaged goods (`pc`, `bottle`, `can`, `sachet`, `box`) strictly retain whole-number stepping (+1 / -1) and discrete integer rules.
- 🧮 **Instant Real-Time Peso Totaling**: Line subtotals dynamically compute on every keystroke:
  $$\text{Subtotal} = \text{round}(\text{Unit Price} \times \text{Weight})$$
  *Example:* Fresh Pork Liempo @ ₱180.00/kilo:
  - `2.25 kg` $\rightarrow$ **₱405.00**
  - `2.24 kg` $\rightarrow$ **₱403.20**
  - `0.50 kg` $\rightarrow$ **₱90.00**
  Centavo integer precision (`_c`) guarantees zero floating-point currency drift.
- 🧾 **Thermal ESC/POS Receipt, CFD & Refund Parity**:
  - Receipt printouts format clean lines (`2.24 x 180.00    403.20`) compatible with all 58mm/80mm thermal printers.
  - Wireless Customer Facing Display (`/cfd`) presents live weight breakdown in real time.
  - Partial weight returns supported via atomic inventory stock restoration (e.g. refunding 1.24 kg of 2.24 kg sale returns ₱223.20 to customer and restores 1.24 kg to stock).
- 🛡️ **100% Cryptographic VIP Pro Preservation**: Existing customer VIP Pro licenses (`tinda_license.json`) remain 100% permanently valid and active across the upgrade with zero downtime or re-activation burden.
- 🔄 **Seamless Auto-Update Compatibility**: Direct transition from v1.0.28–v1.0.43 to v1.0.44 via `electron-updater` and GitHub Releases.

> **Petty Cash Out & True Net Profit, Expiry Management, Wireless Customer Screen (CFD) with Dynamic QR, Wholesale Tiering & Cross-Platform Parity**

- 💸 **Store Petty Cash Out & True Net Profit Intelligence (`F7` Hotkey)**: Cashiers can record operational expenses directly at the counter (store supplies, electricity bills, helper wages, delivery fees). Shift expected cash accounts for cash disbursements ($$\text{Expected} = \text{Float} + \text{Sales} + \text{Repayments} - \text{Refunds} - \text{Expenses}$$) eliminating false shortages, and Dashboard calculates True Net Profit ($$\text{Net} = \text{Sales} - \text{COGS} - \text{Expenses}$$).
- 📦 **Expiration & Spoilage Prevention Engine**: Supports single-item and multi-batch FIFO tracking (`product_batches`). Point-of-Sale gives soft toast warnings when scanning items near expiration (`SOON` within 7 days, `NEAR` within 30 days) and automatically quarantines expired stock from sellable inventory.
- 📱 **Wireless Customer Facing Display (CFD) with Dynamic Offline QR**: Turns any spare smartphone, tablet, or iPad into a live counter-top customer screen on local Wi-Fi via Port 3112/3113 (`/cfd` and `/display`). Features zero-install in-memory SVG QR codes for exact-centavo GCash & Maya scanning and automatic screen wake lock.
- 🏷️ **Wholesale Tiering & Automated Volume Discounts**: Migration 10 adds volume tier pricing (`wholesale_price_c`, `wholesale_min_qty`). Cart automatically drops unit price to wholesale upon reaching minimum quantity threshold, complete with visual badges and price strikethroughs.
- 🛡️ **100% Cryptographic VIP Pro Preservation & Non-Destructive Storage**: Guaranteed zero data loss across upgrades. Customer databases (`tindapos.db`), credit ledgers, and VIP Pro machine licenses remain 100% permanently active and valid.

---

## ✨ What's New in v1.0.42 (Instant Hardware Barcode Auto-Capture & Inventory Speed Cataloging)

> **Zero-Typing Barcode Gun Auto-Capture, Active Input Contamination Sanitizer & Store Handbook Polish**

- ⚡ **Instant Barcode Auto-Capture (Zero Manual Typing)**: When adding or editing products in Inventory, cashiers no longer need to type long 12- or 13-digit EAN/UPC barcodes. Simply scan the product package with any USB/2.4GHz barcode gun or wireless smartphone companion camera; the barcode is instantly auto-populated into the Barcode slot.
- 🛡️ **Active Input Contamination Sanitizer**: Solves the common retail headache where scanning while focused on the product Name or Cost field would leak barcode digits into that field. High-speed keystroke bursts (<120ms) are intercepted, cleanly stripped from the focused field, and routed exclusively to the barcode slot without triggering premature form submissions.
- 🔊 **Sub-Second Audio & Visual Feedback**: Emits an audible 1050 Hz confirmation chirp via the standard Web Audio API and displays a live pulsing status indicator (`● Auto-Capture`) alongside a green badge (`✓ Auto-captured: [code]`).
- ⚠️ **Proactive Duplicate Barcode Detection**: Automatically cross-references the store catalog and warns if a scanned barcode is already assigned to another active item (`⚠️ Already used by [Product Name]`), preventing duplicate stock confusion.
- 📸 **Camera & Smartphone Companion Integration**: Includes a 1-Click `"Camera / Phone"` trigger modal supporting wireless phone cameras and laptop webcams directly inside the product modal, plus individual barcode scan buttons for multi-unit (tingi) pack conversions.
- 🔍 **Inventory List Fast-Track Scan Handler**: Scanning barcodes while browsing the main Inventory list immediately filters directly to that product if it exists, or automatically opens the "New Product" modal with the scanned barcode pre-filled if it's uncataloged.
- 📖 **Store Handbook Modernization**: Fully upgraded Chapter 4 to standard professional English with comprehensive guides for hardware scanners, 1-Click smartphone companion pairing, and zero-typing inventory workflows.

---

> **100% Offline Binary Epoch 41 Lock, Database Trigger Safeguards & 5 VIP Value Pillars**

- 🔒 **100% Offline Cryptographic Anti-Downgrade & Binary Epoch Lock (Epoch 41)**: SQLite Migration 9 establishes the immutable `app_session_auth` singleton table and 3 native database triggers (`trg_anti_downgrade_sales`, `trg_anti_downgrade_shifts`, `trg_anti_downgrade_products`) inside `tindapos.db`. Legacy offline versions attempting to write to upgraded databases are immediately aborted by the SQLite engine with `EPOCH_DOWNGRADE_LOCKED`.
- 📊 **5 Strategic Value Gating Pillars (Free Community vs ₱500 VIP Pro)**:
  1. **Inventory**: 50-product capacity meter with real-time status bar (Brand / Amber / Rose) and seamless VIP upgrade trigger.
  2. **Reports**: 7-day operational sales window for Free tier; lifetime sales history, CSV audit, and tax records unlocked with VIP Pro.
  3. **Loss Prevention**: Automated Cash Drawer Variance Audit in Z-Read finalization (Shortage/Overage Guard vs Expected Cash) with live status badge and 100% professional English.
  4. **Utang**: 15 active credit debtors capacity meter & 1-Click polite SMS/Messenger collection reminder generator.
  5. **Branding**: Clean `[ Powered by TINDA POS Free Community ]` receipt footer; VIP Pro unlocks custom store logo and DTI/BIR tax headers.
- ⚡ **Zero Counter Paralysis Invariant**: Daily checkout, barcode scanning, cash and GCash payments, and change calculations never freeze or block.
- 🛡️ **Zero License Disruption Guarantee**: Existing VIP Pro licenses remain 100% valid and automatically unlock all gating pillars across your store.

---

## ✨ What's New in v1.0.40 (Startup Single-Instance Lock & Port Collision Hardening)

> **PC Startup Double-Instance Immunity, Bounded Port Fallback & Crash Dialog Elimination**

- ⚡ **Synchronous Single-Instance Lock Protection**: Eliminates race conditions when the app auto-launches on Windows PC startup while the cashier also manually clicks the desktop shortcut. Secondary instances immediately exit synchronously (`process.exit(0)`), focusing the primary window and preventing port collision conflicts.
- 🛡️ **Bounded Port Allocation with Windows Service Immunity**: Fixed auto-incrementing retry loops that previously collided with Windows system services like `CDPSvc` (TCP port `5040`). Phone Scanner and LAN Hub now enforce a strict ceiling (maximum 5 port attempts) with full `.on('error')` listeners on both HTTP and HTTPS fallback instances.
- 🧘 **Non-Fatal Graceful Server Degradation**: If auxiliary network services encounter firewall or occupied port blocks, the application logs a non-fatal warning and allows POS cashier sales to continue running smoothly with 0% downtime.
- 🛡️ **Global Process Exception Protection**: Integrated global `uncaughtException` and `unhandledRejection` guards in the Electron main process to prevent unexpected network/port errors from triggering raw JavaScript crash popups for end users.

---

## ✨ What's New in v1.0.39 (Multi-Terminal LAN Visibility, Stock Withdrawal Search, Audited Transaction Deletion & Rapid Hotkeys)

> **Real-Time LAN Sales Parity, Instant Withdraw Search, Permanent Audited Sale Deletion & High-Speed POS Shortcuts**

- 🔄 **Real-Time Multi-PC LAN Sales Parity**: Satellite terminals now seamlessly execute checkouts (`pos:checkout`), query transactions (`transactions:list`), process refunds, and view live cashier shifts through the Master Server. Server-Sent Events (`transactions:changed`) ensure real-time screen updates across all computers with zero manual page refreshes.
- 🔍 **Instant Search in Withdraw Stocks Modal**: Easily search and filter through hundreds of inventory products by name, SKU, or barcode when recording damaged, expired, or spoiled goods.
- 🗑️ **Permanent Audited Transaction Deletion**: Store managers can permanently delete voided or erroneous transactions with an optional one-click physical inventory restock, automatic Utang ledger reversal, cashier shift recalculation, and a strict safety confirmation prompt (`DELETE`).
- ⌨️ **Rapid-Fire POS Keyboard Shortcuts (Hotkeys)**:
  - **`F1` or `/`**: Instantly focuses and selects the product search bar.
  - **`F2`**: Quick focus and select the quantity of the last item in the cart.
  - **`F4`**: Quick focus the cart Discount (₱) input.
  - **`F8`**: 1-key hold current sale.
  - **`F9`**: Quick Cash Checkout (opens modal pre-selected to Cash).
  - **`F10`**: Quick GCash Checkout (opens modal pre-selected to GCash).
  - **`Enter`**: Instant charge / submit checkout.
  - **`Esc`**: Dismiss modal, clear search, or close menu.
- 🛡️ **Zero License Disruption Guarantee**: Existing VIP Pro licenses remain 100% active. Cryptographic machine bindings and licenses stored in `%USERPROFILE%\.tindapos` carry over automatically without requiring re-activation.

---

## ✨ What's New in v1.0.36 (Multi-Terminal Local LAN Hub & Self-Hosted VPS Cloud Mirroring)

> **Multi-Computer Local LAN Hub, Zero-Internet Shared Database, 6-Digit PIN Pairing & Self-Hosted VPS Mirroring**

- 🖥️ **Local Multi-Computer LAN Hub (100% Offline)**: Run 2 or more cashier computers in the store sharing a single unified database without requiring internet. Includes **Master Server Mode (Host)** and **Satellite Terminal Mode (Client)** with real-time bidirectional product search, cart checkout, and customer utang updates.
- 🔐 **6-Digit Security Pairing PIN & HMAC Session Tokens**: Protects your store against unauthorized Wi-Fi access. Satellite terminals must be paired using an on-screen PIN generated by the Master PC.
- 🛡️ **Role-Based Satellite Lockdown**: Satellite computers are locked to cashier checkout operations. Destructive actions (**Reset Database**, **Restore Backup**, and **Raw File Exports**) remain strictly locked to the physical Master console.
- ⚡ **Real-Time Inventory Broadcast (SSE)**: Sales ringing up on any terminal immediately update stock badges across all connected screens via live Server-Sent Events with zero screen refresh required.
- ☁️ **Self-Hosted VPS Cloud Mirroring Bridge**: Store owners running their own Linux VPS ($4-$5/mo) can connect for remote sales viewing from a phone while keeping physical store checkout 100% offline-first. Complete setup instructions provided in [`docs/MULTI_PC_AND_VPS_GUIDE.md`](docs/MULTI_PC_AND_VPS_GUIDE.md).

---

## ✨ What's New in v1.0.35 (Hands-Free Counter Camera & Zero-Click Background Scanning)

> **In-Cart Docked Counter Camera, Zero-Click Background Phone Stream & 3-Way Hardware Concurrency**

- 🎥 **Docked Hands-Free Counter Camera**: Cashiers no longer need to click buttons or open modal windows to scan items. The counter webcam scanner is now embedded right above the cart in the POS screen, featuring power toggle, minimize/expand drawer, camera selection, live laser reticle, and visual green flash on scan.
- 📱 **Zero-Click Wireless Phone Scanning**: Pair a smartphone once using the QR code modal and close the dialog immediately. The phone scanner continues streaming barcodes directly into the POS cart in real time in the background.
- ⚡ **Concurrent Three-Way Scanner Flow**: USB handheld laser scanners, docked counter webcams, and wireless companion smartphones operate concurrently with zero latency and automatic duplicate protection.
- 🔔 **POS Header Status & Audio Feedback**: Header badges (`🟢 Phone Ready`, `📷 Counter Camera`, `🟢 Scanner Ready`) provide real-time connection status at a glance, accompanied by 920Hz audio beeps on every scan.

---

## ✨ What's New in v1.0.34 (Multi-Frame Barcode Consensus & Product Editing Stabilization)

> **Multi-Frame Temporal Consensus, Zero Ghost Reads, Auto-SKU Generation & Product Editing Fixes**

- 🛠️ **Product Editing Stabilization**: Fixed a critical validation bug where newly created products with barcodes could not be edited, throwing false `Duplicate barcode on a product unit` errors. SQLite queries now isolate external units, allowing seamless edits to product prices, names, and stock at any time.
- 🏷️ **Deterministic Auto-SKU Generator (`SKU-XXXX`)**: Products saved without entering an SKU now automatically receive a unique sequential SKU (`SKU-0001`+), completely eliminating `UNIQUE constraint failed: products.sku` database collisions.
- 🎯 **Multi-Frame Stability Consensus**: Both webcam and wireless phone camera scanners now require **2 consecutive frames** with the identical barcode candidate before dispatching, filtering out 99.9% of false-positive reads from packaging graphics, shadows, and reflection glare.
- 🛒 **Zero Accidental Cart Additions**: Removed loose product fallback matches from the POS scan handler. Scanning requires an exact match on master barcode, unit barcode, or SKU, preventing random products from erroneously entering the cart.
- ⏱️ **Extended Anti-Duplicate Debounce**: Built-in 3.5s (phone) and 3.0s (webcam) duplicate protection prevents repeated bursts when holding a product in front of the lens.
- ⚡ **Visual Reticle Confirmation**: The phone camera reticle flashes bright green upon successful scan transmission.

---

## ✨ What's New in v1.0.33 (Dual-Mode Secure Phone Scanner)

> **HTTPS W3C Secure Context Engine, Zero-Warning Direct Photo Snap Scanner & GS1 Modulo-10 Precision Checksum**

- ⚡ **Dual-Mode Phone Companion Scanner (HTTPS + HTTP)**:
  - **Live Video Mode (HTTPS on port 3113)**: Built-in 100-year self-signed SSL certificate unlocks W3C Secure Context (`isSecureContext === true`) on mobile browsers (Android Chrome, iOS Safari), fixing the `getUserMedia` camera permission restriction. Provides continuous 60 FPS live video scanning with animated laser reticle.
  - **Direct Snap Mode (HTTP on port 3112)**: Zero-warning native camera photo snapshot mode via `<input type="file" capture="environment">`. Works instantly across 100% of mobile browsers without certificate warnings or security bypass. Tap the camera button on phone to snap barcodes straight into the POS cart!
- 🔄 **Adaptive Mobile Web Client**: Companion page dynamically detects browser capabilities and provides a 1-tap switcher between live video and instant photo snap modes.
- 📱 **Desktop Mode Toggle**: Cashiers can easily switch between **⚡ Live Video Scanner** and **📸 Direct Snap Scanner** in the desktop pairing modal.
- 🛡️ **GS1 Modulo-10 Algorithmic Verification**: Enforces official GS1 checksum validation for EAN-13, UPC-A, and EAN-8 barcodes, eliminating all false-positive and misread partial barcodes.
- 🔌 **Physical USB Scanner 100% Preserved**: High-speed USB/wireless handheld barcode scanners continue operating simultaneously in parallel.

---

## ✨ What's New in v1.0.30 (Universal Barcode Scanner & Multi-PC LAN Hub Blueprint)

> **Driver-Free Hardware Barcode Scanner Engine, Global Keystroke Burst Interceptor & Multi-Terminal Offline LAN Blueprint**

- 🎯 **Universal Hardware Barcode Scanner (Driver-Free Plug-and-Play)** — seamless out-of-the-box compatibility with 95%+ of retail handheld barcode scanners (Honeywell, Zebra, Netum, Eyoyo, generic USB/2.4G HID keyboard wedges) with zero driver installation on Windows 10/11.
- ⚡ **Global Keystroke Burst Interceptor** — cashiers can scan barcodes anywhere on the screen without clicking the search input box first; sub-50ms keystrokes are automatically intercepted and matched items are added directly to the cart.
- 🟢 **Live "Scanner Ready" HUD Indicator** — persistent pulsing green badge in the POS header confirms hardware scanner listening status in real time.
- 🚫 **Out-of-Stock Protection** — immediately alerts cashiers if a scanned barcode belongs to an item with 0 sellable inventory, preventing checkout errors.
- 🖥️ **Multi-PC LAN Hub & VPS Remote Sync Architecture** — architectural blueprint in `SYSTEM_MASTER.md` explaining why raw SQLite over SMB corrupts files, and detailing the Master-Satellite local LAN HTTP hub and VPS asynchronous replication topology.

---

## ✨ What's New in v1.0.29 (Simple POS Backup Import & Non-Destructive Migration)

> **Zero Setup Migration: Direct Simple POS JSON Ingest, Pre-Import Safety Snapshot & Complete Auth Isolation**

- 📥 **Direct Simple POS JSON Backup Ingest** — seamlessly migrate existing inventory and catalog from third-party Simple POS exports (`simple_pos_secure_*.json`) directly into TINDA POS in seconds without re-encoding items manually.
- 🗃️ **Unified Import Modal (CSV & Simple POS Backup)** — the Inventory import tool now supports both standard `.csv` spreadsheets and `.json` secure backup files with auto-format detection and live status indicators.
- 🛡️ **Absolute User & Auth Lockout Protection** — third-party `users` arrays are strictly ignored and quarantined, guaranteeing that existing store owner and cashier credentials, PINs, and sessions are never altered, overwritten, or corrupted.
- 🔢 **Deterministic SKU Generation** — automatically generates structured, collision-free `SP-0001`+ SKUs mapped from original numerical IDs to fulfill SQLite uniqueness constraints.
- 🧹 **Robust Data Sanitization** — clamps negative stocks to zero, rounds fractional kilogram quantities to whole base integer units, and preserves multiple selling units.
- 💾 **Pre-Import Safety Snapshot Backup** — auto-triggers a checkpointed SQLite database snapshot before batch import execution with 100% ACID transaction rollback on any fatal failure.

---

## ✨ What's New in v1.0.28 (Utang Credit Sale Item-Level Breakdown & Reprint)

- 📦 **Expandable Credit Sale Breakdown** — tap the package icon on any CREDIT_SALE entry in the Utang ledger to view item-by-item breakdown (product name, quantity × unit price, and subtotal).
- 🖨️ **Direct Utang Receipt Reprint** — reprint receipts directly from the Utang ledger with one click without navigating to the Transactions history.

<details>
<summary>📋 <b>Full Version History</b></summary>

<br />

| Version | Highlights |
|---|---|
| **v1.0.31** | Built-in Camera & Smartphone Barcode Scanner (@zxing/library), live video reticle, smartphone setup guide, physical scanner parallel mode |
| **v1.0.30** | Universal USB barcode scanner engine (driver-free keyboard wedge), global burst interceptor, Scanner Ready HUD badge, Multi-PC LAN Hub & VPS remote sync blueprint |
| **v1.0.29** | Simple POS JSON backup ingest, unified Import Products / Backup modal, auto-SKU generation, pre-import safety backup, auth isolation |
| **v1.0.28** | Utang credit sale item-level breakdown (📦 package icon), direct receipt reprint from Utang ledger |
| **v1.0.27** | Complete 172-item market catalog across 12 categories, built-in offline seed, real-time live feed, Scrapling v0.4.15 harvester |
| **v1.0.26** | TINDA BANTAY real-time online market feed, auto live-sync on open/reconnect, pulsing green LIVE indicator, TINDA SCOUT Scrapling harvester |
| **v1.0.25** | Price Guide modal stability fix, auto-seed catalog for empty databases, offline-first online price guide & market price reference |
| **v1.0.24** | Offline-First Online Price Guide / Market Price Reference, DTI SRP guidance, advisory price ranges, dual-probe sync, seed catalog, Price Guide modal, and POS reference indicators |
| **v1.0.23** | Global Responsive Table Auto-Fit across all screens, Product Picture Uploads with thumbnails, Suggested Retail Price (SRP) with Auto-Markup (+10% to +30%), and Dashboard Update Notifications |
| **v1.0.22** | English Standardization in Utang (With Balance / Settled / All), responsive table auto-adjustment across all screens, strict column alignment in Utang & Transactions with dedicated expanded items `<tfoot>` |
| **v1.0.21** | Utang Customer Filter Tabs (May Utang / Bayad Na / Tanan), Utang Quick Stats bar, `BAYAD NA ✓` status badges, contextual Pay/Ledger action buttons |
| **v1.0.20** | Semantic color-coded Dashboard cards (Green Sales, Teal Profit, Red Utang, Amber Expenses); whole-peso Unit Cost validation in Restock/Receiving; aligned Receiving Details modal; `table-fixed` aligned columns in Transactions Expand items |
| **v1.0.19** | Universal Windows↔Android `.tinda-backup` exchange; refund-aware Estimated Profit; withdrawal notes in Stock History; Reset Database RESET-gate; aligned 58/80mm receipts |
| **v1.0.18** | Itemized accordion for Recent Transactions (Dashboard + Transactions page) |
| **v1.0.17** | Windows Startup checkbox accessibility fix |
| **v1.0.16** | Dual-layer Windows auto-start, profit double-deduction fix, POS discount Pesos format, receipt payment breakdown order |
| **v1.0.15** | Utang customer selection from checkout modal |
| **v1.0.14** | Utang customer reachability fix |

</details>

---

## 🏪 Why TINDA POS?

TINDA POS is built specifically for everyday Philippine store operations. Checkout stays usable **100% offline**, your database stays on your own computer, and the workflow is intuitive for both store owners and cashiers — no complex training needed.

| Icon | Feature | Description |
|:---:|---|---|
| 🛒 | **Fast POS Checkout** | Instant product search, barcode scanner support, category filters, Hold/Resume sales, and quick quantity controls |
| 💵 | **Flexible Payments** | Cash with auto-computed change (sukli), GCash, Maya, split payments, and customer Utang (credit) |
| 📦 | **Inventory Management** | Multi-unit products (piece, sachet, pack, box), stock receiving, restock validation, withdrawals, and low-stock alerts |
| 📅 | **Expiration Tracking** | Per-item and per-batch expiration dates with checkout warnings to prevent selling expired goods |
| 👥 | **Complete Utang Ledger** | Customer profiles, credit limits, payment history, balance adjustments, and audit trail |
| 🧾 | **Receipts & Shifts** | Thermal receipt printing (58mm/80mm), refunds, voids, receipt reprints, X-Read, Cash Count, and Z-Read |
| 📊 | **Reports & Analytics** | Sales, profit margins, inventory valuation, and Utang ledgers with one-click CSV export |
| 💾 | **Rock-Solid Backups** | Local `.tinda-backup` files, cloud sync (OneDrive / Google Drive / Dropbox), and verified restore |
| 🔒 | **Security & Access** | PIN protection, Admin/Cashier roles, expense tracking, and seamless software auto-updates |

---

## ⬇️ Downloads & Installers

**For Windows 10 / 11 (64-bit)**

| Deliverable | Description | Download Link |
|---|---|:---:|
| **TINDA POS Setup (Installer)** | ✅ **Recommended.** Installs TINDA POS with automatic desktop shortcut and background auto-update support. | [⬇️ Download Setup](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.27/TindaPOS-Setup-1.0.27.exe) |
| **TINDA POS Portable** | Standalone version. Runs directly from a USB drive or folder without installation. Stores database beside the EXE. | [📦 Download Portable](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.27/TindaPOS-Portable-1.0.27.exe) |
| **Official User Guide (PDF)** | Comprehensive 28-page printable step-by-step user guide with screenshots, workflows, and troubleshooting. | [📄 Download PDF Guide](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.27/TindaPOS-User-Guide.pdf) |
| **Release Checksum Manifest** | SHA256 checksums to verify file integrity. | [🛡️ View SHA256SUMS](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.27/SHA256SUMS-v1.0.27.txt) |

> ℹ️ **If Windows SmartScreen appears:** click **"More info" → "Run anyway"**. This is standard for newly released and community-distributed Windows applications.

🔗 *View all past releases and changelogs on the [GitHub Releases Page](https://github.com/Yazerukun/TINDA-POS/releases).*

---

## 🚀 Quick Start (5 Easy Steps)

1. **Install:** Run `TindaPOS-Setup-1.0.27.exe` and launch the application.
2. **First-Run Wizard:** Enter your store name, set your admin password and PIN, and customize receipt header/footer details.
3. **Add Products:** Open **Inventory** → add your items with purchase cost (whole pesos), selling prices, units, and initial stock.
4. **Setup Printer:** Go to **Settings → Receipt / Printer**, select your thermal printer (58mm or 80mm), and click **Test Print**.
5. **Start Selling:** Open **POS**, search or scan an item, and complete your first sale!

---

## 💳 Payment Methods & Utang Management

### Payment Types

| Method | How It Works |
|---|---|
| **Cash** | Enter amount tendered — change (*sukli*) is automatically calculated in real-time. |
| **GCash / Maya** | Enter the transaction reference number for auditing and balance reconciliation. |
| **Utang (Credit)** | Select the customer first, verify credit balance, and charge to their account ledger. |
| **Split Payment** | Click **Add Payment** to combine multiple payment methods (e.g. Part Cash + Part GCash) in a single transaction. |

### 👥 Utang (Credit) Flow
To prevent charging the wrong customer, TINDA POS features a strict safety check:
1. In POS checkout, click **Select Customer** under *Select the borrower*.
2. Search by customer name or phone number.
3. Click the customer row — the selected customer is highlighted with a green checkmark `✓`.
4. Confirm **Selected: [Customer Name] ✓** before charging.
5. If no customer is selected, the system blocks Utang checkout with a helpful prompt.

---

## 🔍 Transactions & Expand Items View

Click the **▾ chevron** beside any receipt number in the **Transactions** table to inspect itemized details inline:

| Product | Qty | Unit Price | Subtotal |
|---|:---:|---:|---:|
| Nescafe Classic 50g Refill | 2 pcs | ₱45.00 | ₱90.00 |
| Bear Brand Powdered Milk 33g | 5 sachets | ₱12.00 | ₱60.00 |
| San Miguel Pale Pilsen 330ml | 3 bottles | ₱65.00 | ₱195.00 |

* **Footer Breakdown:** Displays payment methods used, applied discounts, and bold grand total.
* **Precise Alignment:** In v1.0.20+, `Qty`, `Unit Price`, and `Subtotal` columns are fixed-width and right-aligned with monospace tabular figures (`font-mono tabular-nums`) so numbers line up perfectly across every transaction.

---

## 🔄 Automatic Software Updates

For users on the **Setup** edition, updating is fully automated:
1. Open **Settings → About → Software Update → Check for Updates**.
2. TINDA POS downloads the update in the background with progress indicator (0–100%).
3. Click **Restart & Install** once the download completes.
4. A safety database backup is created automatically before the update is applied.

> 💡 **Seamless Upgrade:** Users on previous versions (v1.0.19, v1.0.20, v1.0.21, v1.0.22, v1.0.23, v1.0.24, v1.0.25, v1.0.26) will automatically detect and upgrade to **v1.0.27** with zero data loss or manual re-configuration.

---

## 💾 Database Safety & Backups

Your store database is stored safely at:
`%APPDATA%\TINDA POS\database\tindapos.db`

* **Automatic Backups:** Created on system checkpoints, database resets, and software updates.
* **Manual Backups:** Open **Backup** → click **Create Backup** to generate a timestamped `.tinda-backup` file.
* **Cloud Sync:** Select your OneDrive, Google Drive, or Dropbox local sync folder as the backup destination.
* **Data Guarantee:** Uninstalling or upgrading TINDA POS **never deletes your database**. Your sales records, inventory, and customer utang history remain 100% intact.

---

## 🔁 Shifts, Cash Count, X-Read & Z-Read

| Operation | Purpose & Timing |
|---|---|
| **X-Read** | Non-final mid-shift summary. Check current sales, cash drawer status, and transaction totals anytime without closing the shift. |
| **Cash Count** | Physical bill and coin drawer count. Must be completed and saved while the shift is still active. |
| **Z-Read** | Official end-of-day shift closing report. Finalizes the cashier shift and prints the end-of-day summary receipt. |

---

## 🛠️ Common Troubleshooting

| Issue | Recommended Solution |
|---|---|
| **Utang button disabled** | Ensure a customer is selected first under *Select the borrower* until the `✓` badge appears. |
| **Printer not printing** | Check power and USB connection, verify printer selection in **Settings → Receipt**, and run a **Test Print**. |
| **Cash discrepancy** | Review starting drawer float, logged cash sales, recorded expenses, refunds, and Cash Count breakdown. |
| **Unit Cost validation error** | Restock Unit Cost requires whole peso amounts (e.g. ₱5, ₱10, ₱25 — no centavos like .10 or .50). |
| **Update check failed** | Confirm internet connection, wait 30 seconds, and click *Check for Updates* again. |

When reporting issues on [GitHub Issues](https://github.com/Yazerukun/TINDA-POS/issues), please specify:
* App version (e.g., `v1.0.24`)
* Edition (Setup or Portable)
* Brief description and screenshot (please blur any sensitive customer names)

---

## 🧑‍💻 Technical Stack & Development

TINDA POS is built with modern desktop and web technologies:
* **Framework:** Electron & Vite
* **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Zustand
* **Database:** SQLite with `better-sqlite3` (WAL mode enabled)
* **Testing:** Vitest (292/292 passing tests across 42 test suites)

```bash
# Clone and run locally
cd source
npm install

# Start development environment
npm run dev

# Run quality & verification gates
npm run typecheck    # TypeScript verification (0 errors)
npm run lint         # ESLint code quality
npm test             # Vitest test suite (292/292 passing)
npm run build        # Production bundle
```

---

## 📄 License

**Proprietary.** Free for personal and small-business use.  
Unauthorized resale, commercial rebranding, or redistribution without permission is strictly prohibited.

---

<div align="center">

Made with ❤️ for Philippine sari-sari stores, groceries, and small businesses.

**[⬇️ Download v1.0.27 Setup](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.27/TindaPOS-Setup-1.0.27.exe)** · **[📄 User Guide PDF](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.27/TindaPOS-User-Guide.pdf)** · **[💬 Community Issues](https://github.com/Yazerukun/TINDA-POS/issues)**

</div>
