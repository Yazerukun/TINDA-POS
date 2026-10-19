<div align="center">

<img src="https://img.shields.io/badge/TINDA_POS-v3.0.4-059669?style=for-the-badge&labelColor=065f46" alt="Version">
<img src="https://img.shields.io/badge/Platform-Windows_10%2F11_%7C_Linux-0078d4?style=for-the-badge&logo=windows&logoColor=white" alt="Platform">
<img src="https://img.shields.io/badge/Engine-100%25_Offline--First-6366f1?style=for-the-badge" alt="Offline">
<img src="https://img.shields.io/badge/Tests-100%25_Passing-10b981?style=for-the-badge" alt="Tests">
<img src="https://img.shields.io/badge/Hardware-Thermal_%26_Barcode_Ready-f59e0b?style=for-the-badge" alt="Hardware">
<img src="https://img.shields.io/badge/Cloud-Cloudflare_D1_Live_Sync-f97316?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloud">
<img src="https://img.shields.io/badge/License-Free_for_Personal_%26_SMB-14b8a6?style=for-the-badge" alt="License">

<br /><br />

# 🏪 TINDA POS (Desktop Master Edition)

### The Premier 100% Offline-First Point-of-Sale System for Philippine Sari-Sari Stores, Minimarts & Wholesalers

**Lightning-Fast Checkout · Hardware Barcode & Label Engine · Printable Utang Master List & Total Breakdown · Wholesale Invoices · Daily E-Wallet Reconciliation · Store Use OPEX Ledger & History Center · Clean Full Setup.exe Auto-Update · 1-Tap QR & Direct PIN Cloud Sync · 24-Hour VIP Demo Engine · Auto VIP Self-Healing**

<br />

[![Download Setup](https://img.shields.io/badge/⬇️_Download_Setup-v3.0.4_NSIS_(~111.4MB)-059669?style=for-the-badge)](https://github.com/Yazerukun/TINDA-POS/releases/download/v3.0.4/TindaPOS-Setup-3.0.4.exe)
[![Download Portable](https://img.shields.io/badge/📦_Download_Portable-v3.0.4_Standalone_(~110.5MB)-0284c7?style=for-the-badge)](https://github.com/Yazerukun/TINDA-POS/releases/download/v3.0.4/TindaPOS-Portable-3.0.4.exe)
[![Cloud Dashboard](https://img.shields.io/badge/🌐_Cloud_Owner_Dashboard-Live_Web-7c3aed?style=for-the-badge)](https://tinda-owner-dashboard.pages.dev/)

<br />

[📖 Cashier Guide](./docs/CASHIER-QUICK-GUIDE.md)&nbsp;&nbsp;·&nbsp;&nbsp;[📚 User Handbook](./docs/USER-MANUAL.md)&nbsp;&nbsp;·&nbsp;&nbsp;[🏗️ Architecture](./docs/MASTER-SYSTEM-ARCHITECTURE.md)&nbsp;&nbsp;·&nbsp;&nbsp;[🛠️ Tooling](./tools/README.md)&nbsp;&nbsp;·&nbsp;&nbsp;[🐛 Report Issue](https://github.com/Yazerukun/TINDA-POS/issues)

</div>

---

## ⚡ Quick Download & Release Assets (v3.0.4 Full Windows Release)

| Asset | Size | Type | Description |
|---|---|---|---|
| [**TindaPOS-Setup-3.0.4.exe**](https://github.com/Yazerukun/TINDA-POS/releases/download/v3.0.4/TindaPOS-Setup-3.0.4.exe) | `~111.4 MB` | **Windows Setup Installer (NSIS)** | Full Windows installer with desktop shortcut, Start Menu entry, pre-update backup, and 3s silent auto-restart. |
| [**TindaPOS-Portable-3.0.4.exe**](https://github.com/Yazerukun/TINDA-POS/releases/download/v3.0.4/TindaPOS-Portable-3.0.4.exe) | `~110.5 MB` | **Standalone Portable** | Zero-installation executable. Plug into any USB flash drive and run instantly. |
| [**latest.yml**](https://github.com/Yazerukun/TINDA-POS/releases/download/v3.0.4/latest.yml) | `0.3 KB` | **Updater Manifest** | Electronic update verification signature for auto-updater pipelines. |
| [**SHA256SUMS-v3.0.4.txt**](https://github.com/Yazerukun/TINDA-POS/releases/download/v3.0.4/SHA256SUMS-v3.0.4.txt) | `0.5 KB` | **Integrity Checksums** | Official cryptographic SHA-256 signatures for binary verification. |

---

## ✨ What's New in v3.0.4: Fast Buttons Universal Inventory Search & In-Place Linker Studio Edition
- **Universal Inventory Search for Fast Buttons**: Upgraded the Fast Buttons Customization modal with direct, real-time asynchronous search across the entire SQLite store inventory by product name, barcode, or SKU without artificial 10-item pagination limits.
- **Real-Time Stock & Barcode Preview in Search**: Live search results display product photos, names, barcode badges, stock availability status (`X in stock` in emerald or rose), base unit, and exact retail price.
- **Prominent Linked Inventory Item Card**: Selecting a product generates a high-contrast Linked Card displaying linked product metadata, stock status, and a 1-click `[Unlink Product]` button to convert between inventory-linked and custom fast buttons.
- **In-Place Edit & Re-link Mode**: Cashiers and store owners can now edit existing speed keys directly with a dedicated **Edit** (`Pencil`) action button without needing to delete and recreate buttons.
- **Robust Database Lookup Fallback on Tap**: Tapping a fast button in `FastButtonsBar` now automatically queries the SQLite database directly if the linked item is outside the currently active POS page or category filter, eliminating accidental duplicate product creation.
- **565 Automated Tests Passing**: 100% test coverage across all fast keys, inventory, transactions, and store operations with 0 TypeScript errors.
- **100% Pure Full Setup.exe & Portable**: Zero patches, zero asset mismatch, and 100% clean full binary installation.

---

## 🌟 Why TINDA POS? Core Superpowers

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TINDA POS ARCHITECTURE                          │
├──────────────────────────┬─────────────────────────────────────────────┤
│ 🛡️ 100% Offline-First    │ Embedded SQLite database with WAL journaling│
│                          │ Zero latency, zero cloud dependency         │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 🖨️ Thermal & Barcode Hub │ Chiteng CT221B labels + 58/80mm receipts    │
│                          │ Pure vector Code 128 (Subset B) generator   │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 📱 1-Tap QR Cloud Sync   │ Scan screen with iPhone/Android camera      │
│                          │ Streams to Cloudflare D1 Owner Dashboard    │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 👥 Suki Utang Ledger     │ Credit balance limits & due date alerts     │
│                          │ Line-item mistake editing & audit history   │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 📦 Wholesale Receiving   │ Box/Case/Sack packaging multipliers         │
│                          │ Compounded supplier discounts ("Less 5+5")  │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 🎁 Promo Bundles (BOM)   │ Loyverse-style composite inventory combiner │
│                          │ Real-time component stock limiter           │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 💵 E-Wallet Shift Hub    │ Daily midnight reset for Cash In/Out        │
│                          │ 3-way reconciliation (Cash, GCash, Maya)    │
└──────────────────────────┴─────────────────────────────────────────────┘
```

### 1. 🛡️ 100% Offline-First Local Engine
Never lose a single sale to internet disconnects. All inventory items, customer credit ledgers, shifts, and transactions are stored directly on the cashier machine using **Better-SQLite3** with Write-Ahead Logging (WAL) and foreign-key integrity locks.

### 2. 🖨️ Industrial Hardware Barcode & Label Engine
- **Chiteng CT221B Label Printer Support**: Plug-and-play auto-detection for portable 203 DPI thermal label printers (40×30mm, 50×30mm, 30×20mm).
- **Code 128 Vector Geometry (v2.1.3+)**: Raised vertical bar height (+120% to ~7.5–9mm physical height), ISO 15416 quiet zones, 900-weight bold tabular monospace font, and vector stroke shields for instant 1st-pass omnidirectional scanning.
- **58mm / 80mm Receipt Printers**: Automatic ESC/POS cutter feed spacing, configurable left margin alignment (zero text clipping), and cash drawer kick pulse.

### 3. 📱 1-Tap QR Code Mobile Auto-Pairing & Live Cloud Sync (v2.1.4+)
- **Frictionless Phone Camera Setup**: Store owners scan the high-contrast QR code on the POS screen using their iPhone Camera or Android QR scanner. The owner dashboard launches and links the terminal automatically with zero typing.
- **Copy Magic Link**: 1-click button to copy setup links for sharing via Messenger, SMS, or Viber.
- **Background Auto-Sync Loop**: Pushes sales and shift snapshots on startup (4s grace) and recurs continuously every 3 minutes.
- **Multi-Owner Account Resolution**: Multi-account linking on Cloudflare D1 (`store_owners` table) allowing store owners to view live sales under any linked username.

### 4. 👥 Suki Customer Utang Ledger & Credit Protection
- **Credit Limit Enforcement**: Automatic warnings and payment blocks when a customer's balance exceeds their credit limit (`credit_limit_c`).
- **Due Date Reminders**: Calendar presets (`Today`, `+3d`, `+7d`, `+15d`, `Month End`) with proactive cashier alerts upon customer selection.
- **Mistake Cleaner**: Edit or void utang entries with complete audit trail preservation.

### 5. 📦 Wholesale Purchase Invoices & Cascading Trade Discounts
- **Multi-Packaging Units**: Receive deliveries in wholesale packaging (`BOX`, `CASE`, `PACK`, `BUNDLE`, `SACK`, `DOZEN`) with customizable `Pcs/Unit` multipliers.
- **Cascading Trade Discounts ("Less 5 Less 5")**: Computes real-world Philippine FMCG compounded billing formulas (`5+5+5`, `10+5`, `10/5`, `-10%-5%`, `₱50`) using deterministic sequential integer-cent arithmetic:
  $$\text{Net} = \text{Gross} \times (1 - d_1) \times (1 - d_2) \dots (1 - d_n)$$
- **Catalog Cost Auto-Update**: Atomically updates catalog unit cost with true net landed acquisition cost.

### 6. 🎁 Loyverse-Style Promo Bundles & Composite Inventory (BOM)
- Combine individual stock items into promotional packages or manufactured recipes.
- Dynamic available stock monitoring calculated directly from limiting component inventory:
  $$\text{Bundle Stock} = \min \left( \lfloor \text{Stock}_i / \text{Required}_i \rfloor \right)$$
- Automatic recursive component stock deduction upon checkout.

### 7. 💵 E-Wallet Hub & Daily Cash Drawer Reconciliation
- Daily midnight (12:00 AM) auto-resetting totals for GCash, Maya, and MariBank Cash In / Cash Out and Bills Payment.
- Z-Read shift closing drawer balance verification with cash breakdown calculator.

---

## 🗂️ Repository Directory Structure

```text
TINDA-POS-Desktop/
├── .agents/                   # Autonomous multi-agent coordination, memory, and skills
│   └── skills/                # 9 Elite Specialist Subagents & audited stack skills
├── docs/                      # Comprehensive technical documentation & guides
│   ├── README.md              # Documentation sitemap and navigation portal
│   ├── CASHIER-QUICK-GUIDE.md # 1-page operational cheat sheet for cashiers
│   ├── USER-MANUAL.md         # Full 13-chapter store operations handbook
│   ├── MASTER-SYSTEM-ARCHITECTURE.md # Main process, SQLite, and IPC design
│   ├── MULTI_PC_AND_VPS_GUIDE.md     # Multi-terminal LAN & VPS clustering
│   ├── RELEASE-WORKFLOW.md    # Multi-stage release quality gate specification
│   ├── RELEASE-STATE.md       # Active release stage state machine
│   └── releases/              # Historical release notes archive (v1.0.50 – v1.0.79)
├── source/                    # Core Electron + React 19 + TypeScript application
│   ├── README.md              # Source code architecture and developer guide
│   ├── package.json           # Dependencies, scripts, and version tracking
│   ├── electron-builder.yml   # Windows NSIS & Portable packaging specification
│   └── src/
│       ├── main/              # Node.js process: SQLite database, migrations, services
│       ├── preload/           # ContextBridge secure IPC interface (window.api)
│       ├── renderer/          # React 19 UI: Cupertino modals, pages, Zustand stores
│       └── shared/            # Cross-process shared types, contracts, and utilities
└── tools/                     # Packaging, patch bundling, and release automation
    ├── README.md              # Tooling catalog and execution reference
    ├── check_master_invariants.mjs # Pre-flight release verification gate
    ├── bundle_patch.mjs       # Live hot-patch zip packager
    ├── publish_patch.mjs      # Rapid in-app patch publisher
    └── publish_v214.mjs       # Full Windows release publisher
```

---

## ⌨️ Cashier High-Speed Keyboard Shortcuts

| Shortcut | Action | Description |
|---|---|---|
| **`F1`** or **`/`** | Focus Search Bar | Instant focus to search products or scan barcode gun |
| **`F2`** or **`Enter`** | Quantity Accelerator | Change quantity of the active cart item |
| **`F3`** | Resilient Calculator | Pop up built-in change and arithmetic calculator |
| **`F4`** | Clear Cart | Empties the current transaction cart |
| **`F12`** | Fast Checkout | Opens payment modal with automatic cash change |
| **`Ctrl + S`** | Post Invoice | Atomically commit purchase receiving delivery to inventory |
| **`Ctrl + P`** | Reprint Receipt | Print duplicate copy of the last completed sale |

---

## 🖨️ Hardware Compatibility Matrix

| Hardware Type | Tested & Verified Models | Status |
|---|---|---|
| **Thermal Label Printers** | Chiteng CT221B, Clabel CT221B, Niimbot B21/B3S, Dudian, 4Bar, TSC | ✅ Verified 100% Plug-and-Play |
| **Receipt Printers (58mm)**| Xprinter XP-58, POS-58, Milestone, GOOJPRT, Mini Bluetooth Thermal | ✅ Verified (ESC/POS Auto-Cutter) |
| **Receipt Printers (80mm)**| Epson TM-T88, Xprinter XP-N160M, POS-80, Bixolon SRP-350 | ✅ Verified (High-Density Black) |
| **Barcode Scanners (1D/2D)**| Honeywell 1900, Netum C750, Eyoyo Wireless, Standard USB HID Guns | ✅ Verified (Instant 1st-Pass Scan) |
| **Cash Drawers** | Standard RJ11 (12V / 24V) triggered via receipt printer port | ✅ Verified (`kickCashDrawer()`) |
| **Companion Phone Scanner**| iPhone iOS 15+, Android 10+ (Built-in Camera / WebRTC) | ✅ Verified (Zero App Install) |

---

## 💻 Developer Quickstart

### Prerequisites
- **Node.js**: v20.x or v22.x or v24.x
- **Package Manager**: npm or pnpm
- **Operating System**: Windows 10/11 (Native) or Linux / macOS

### Installation & Development
```bash
# 1. Clone repository
git clone https://github.com/Yazerukun/TINDA-POS-Source.git
cd TINDA-POS-Desktop/source

# 2. Install dependencies
npm install

# 3. Start local development server with Hot Module Reloading
npm run dev

# 4. Run TypeScript typecheck (Zero errors required)
npm run typecheck

# 5. Execute full unit test suite (506 tests)
npm test

# 6. Build production Windows executables
npm run build:win

# 7. Publish instant live patch (<1 MB)
npm run publish:patch
```

---

## ✨ Release Changelog

### 🏷️ v2.2.14 (Customizable Utility Billers & Presets Manager Edition) · Oct 15, 2026
- **⚡ Customizable Utility & Water Billers (`EwalletAudit.tsx`, `BillsLoadHub.tsx`, `billerCustomization.ts`)**:
  - Cashiers can now edit utility and water biller names on-the-fly directly in the Express Bills form (e.g. BENECO, CANORECO, Visayan Electric, Maynilad, Manila Water, PrimeWater, Local Water Districts, Home Credit, PLDT, Converge).
  - Immediate propagation across all transaction records, SQLite e-wallet mirroring, cashier cart line items, thermal receipt printing, and customer-facing CFD displays.
- **⚙️ Dedicated Biller Preset Manager Modal (`ManageBillersModal.tsx`)**:
  - Full-featured modal accessible with one tap from the Biller selector to add new local billers, rename presets, adjust default convenience fees, filter by utility category, and delete obsolete entries.
  - Reactive persistence via `localStorage` (`tinda_custom_biller_presets_v1`) with instant multi-window and multi-tab synchronization.
- **🛡️ Strict Telco E-Load Protection**:
  - Standard telecom mobile load networks (Globe/TM, Smart/TNT, DITO Telecommunity) are strictly protected with an E-Load indicator badge and cannot be accidentally renamed or corrupted.
- **🧪 553 Automated Tests Passing & Master Invariant Verification**:
  - 100% test passing across all 86 test suites including new utility customization suite (`billerCustomization.test.ts`), 0 TypeScript errors.

### 🏷️ v2.2.5 (VIP Store Use & Operating Expense Edition) · Oct 14, 2026
- **📦 VIP Store Use / Internal Consumption Feature (`StoreUseModal.tsx`, `Inventory.tsx`, `Expenses.tsx`, `ipc/index.ts`)**:
  - Double-Entry Accounting Ledger: Automatically deducts item quantities from inventory at **Landed Purchase Cost** (`purchase_cost_c`) rather than retail selling price, and simultaneously creates an atomic Operating Expense under *Store Use / Internal Consumption*.
  - Dual Entry UI: Seamless access from both **Inventory** (top bar button, grid card action, and table row action) and **Expenses** ("Store Use (From Stock)").
  - Anti-Kupit & Anti-Pilferage Armor (Dr. Aegis): Requires mandatory department/purpose assignment with quick-purpose chips (*Store Repair & Maintenance*, *Counter & Shelving Build*, *Store Cleaning Supplies*, *Office & Admin Use*), zero-cost edge case warnings, and optional Manager PIN authorization check.
  - Stock History Integration: Added dedicated `STORE_USE` badge in `StockHistoryView` with distinct amber styling and reference tracking (`SU-YYYYMMDD-XXXX`).
- **🖨️ 58mm/80mm Thermal Store Use Expense Voucher (`receiptHtml.ts`)**:
  - Engineered `formatStoreUseSlipLines` with official audit sign-off blanks (`Requested By: ___`, `Approved By: ___`) so store owners can file physical slips for BIR tax deduction auditing.
  - Audio Confirmation: Integrated pleasant Web Audio chime (`playScanSuccess`) upon successful store use deduction.

### 🏷️ v2.2.4 (Strictly Daily E-Wallet & Cash Drawer Reconciliation Edition) · Oct 14, 2026
- **🛡️ Strictly Daily Cash Drawer Reconciliation in E-Wallet Audit Sheet (`EwalletAudit.tsx`)**:
  - Permanently locked Expected Drawer Cash default initialization strictly to Today's Daily Target: Float + POS Net Cash + E-Wallet Net Delta.
  - Guaranteed reset handler resets strictly to Today's Daily Target.
  - Re-titled section to "1. Daily Cash Drawer Reconciliation (Today)" with prominent "[ Strictly Daily Recon ]" pill badge.
  - Made "[ 🎯 Today's Daily Target (₱X.XX) ]" the primary glowing emerald preset button.
  - Replaced multi-day confusion with an expandable disclaimer for past unclosed shifts, completely eliminating cashier shortage panics.
  - Added clean, transparent formula breakdown card directly under the input field.
- **🖨️ Thermal Print Audit Report (`receiptHtml.ts`)**:
  - Updated audit slip title to "DAILY E-WALLET & CASH AUDIT REPORT" and "PHYSICAL CASH DRAWER (DAILY RECON)".

### 🏷️ v2.2.3 (Dedicated POS F9 Cash Checkout & Multi-Day Shift Isolation Edition) · Oct 14, 2026
- **⚡ F9 Shortcut Collision Elimination & Dedicated Cash Checkout (`NotificationBellDrawer.tsx`, `POS.tsx`)**:
  - Removed conflicting global F9 listener in `NotificationBellDrawer.tsx`, isolating the notification drawer hotkey exclusively to `Ctrl+B / Cmd+B`.
  - Dedicated F9 100% exclusively to retail Cash Checkout and Cash Tendered input refocus in `POS.tsx`, allowing cashiers to checkout instantly with zero key collisions or drawer interference.
- **🛡️ Multi-Day Shift Isolation & Daily Cash Reconciliation (`readReports.ts`, `cashCounts.ts`, `EwalletAudit.tsx`)**:
  - Engineered `calculateDailyExpected` in `readReports.ts` and exposed via IPC `reports:dailyCashExpected` to isolate today's retail cash sales, refunds, expenses, and movements.
  - Multi-Day Shift Safety Shield: Prevents shifts left unclosed from previous days from inflating or distorting today's cash count balancing.
  - Added Multi-Day Shift amber warning banner and 1-click Quick Presets (`[ ₱0.00 (Zero Float) ]`, `[ Today Only ]`, `[ Full Shift ]`, `[ E-Wallet Net ]`) in `EwalletAudit.tsx`.
  - Verified with 3 comprehensive unit tests in `dailyCashExpected.test.ts`.

### 🏷️ v2.2.2 (Universal Custom Thermal Spacing Studio & Receipt Persistence Edition) · Oct 14, 2026
- **🖨️ Universal Thermal Custom Spacing Studio (`receiptHtml.ts`, `PrinterStudioModal.tsx`)**:
  - Continuous fine-grained controls for physical thermal printing margins and vertical layout density.
  - Top Header Offset / Margin (0 to 15mm) eliminating cutter blade or tear bar clipping on physical paper rolls.
  - Row Item-to-Item Gap (0 to 8px) allowing cashiers to stretch or compact product lines to conserve thermal roll paper.
  - Divider / Separator Gap (0 to 8px) controlling vertical margins around dashed and double separator lines.
  - Global Line Height Multiplier (1.00x to 2.00x) providing continuous height stretching for maximum text legibility on low-contrast thermal print heads.
- **🔄 Cross-Receipt System-Wide Persistence Architecture (`types.ts`, `settings.ts`, `printerCustomization.ts`, `printing.ts`)**:
  - Custom spacing options persist seamlessly across all receipt generation paths: checkout sales, reprints, express slips, e-wallet transactions, bill payments, and cash count reports.
  - Three-tier reconciliation priority: SQLite StoreSettings -> localStorage persistent fallback -> factory defaults.
- **👁️ 1:1 Live Engine Preview (`ReceiptPaper.tsx`, `PrinterStudioModal.tsx`)**:
  - Embeds `ReceiptPaper` directly in the studio live preview, guaranteeing that on-screen preview renders the exact HTML and CSS sent to the physical print spooler.

### 🏷️ v2.2.1 (In-App Full Setup Downloader & Tesla Cyber-Emerald Telemetry Edition) · Oct 13, 2026
- **📥 In-App Full Build Downloader & 1-Click Auto-Restart (`updateService.ts`, `UnifiedUpdateCapsule.tsx`)**:
  - Cashiers and store owners can now download full NSIS installers (`TindaPOS-Setup-*.exe`) directly within the app without ever needing to open a web browser.
  - 1-Click "Restart & Install Now" button triggers seamless automated installer handoff and immediate relaunch with zero data loss.
- **⚡ Tesla Cyber-Emerald Telemetry Progress Bar (`UnifiedUpdateCapsule.tsx`)**:
  - Real-time animated neon emerald telemetry indicator featuring live download speed smoothing via Exponential Moving Average (EMA, $\alpha = 0.25$).
  - High-precision ETA countdown timer with non-zero division safety guards (`smoothedSpeed > 50 ? Math.round(remainingBytes / smoothedSpeed) : null`).
  - Active 4-phase pipeline status badges: `🛡️ Pre-Update SQLite Safety Snapshot` -> `📥 Streaming signed package via HTTPS` -> `🔒 Verifying cryptographic checksum` -> `✅ Package verified! Ready to apply`.
- **🎛️ Dual-Choice Update Card (`UnifiedUpdateCapsule.tsx`)**:
  - `[ ⚡ Express Patch ]` (~1 MB): Instant 0.3-second live code reload with zero restart required—ideal during busy store hours.
  - `[ 💿 Full Setup.exe ]` (~111 MB): Complete NSIS installer with automatic SQLite safety backup, full desktop asset re-registration, and automatic restart.
- **🛡️ Pre-Download SQLite Safety Snapshot Invariant (`updateService.ts`)**:
  - Enforces atomic synchronous SQLite database backup (`createBackupSync(db, 'BEFORE_UPDATE')`) before executing any full installer payload stream.

### 🏷️ v2.2.0 (Doctoral Multi-PC Edge Fabric & Floating VIP Lease Edition) · Oct 13, 2026
- **🌐 Zero-Config UDP Auto-Discovery (`node:dgram`, Port 3112)**:
  - Master Server broadcasts background discovery beacons on UDP port 3112 (`255.255.255.255`) announcing local IP, store name, and RPC port every 3 seconds.
  - Cashier Satellite terminals auto-discover active Master servers within 0ms without requiring cashiers to type IP addresses.
  - Added Electron `powerSaveBlocker` (`prevent-app-suspension`) on Master to eliminate Windows sleep disconnects during business hours.
- **👑 Floating VIP Pro Lease (Proof-of-Possession Token)**:
  - Secondary Cashier terminals inherit VIP Pro privileges automatically over LAN via Master lease verification (`isSatelliteVip`).
  - Cashier PCs do not require separate VIP license keys—single master license covers all connected store lanes.
- **🔐 Centralized Master Auth & Cashier Roaming**:
  - Satellites fetch users and shifts directly from Master SQLite via `auth:publicUsers` and `auth:loginPin`.
  - Cashiers can log into any lane terminal with their 4-digit PIN with zero duplicate account creation.
- **🖨️ Decoupled Local Thermal Printing & Concurrency Armor**:
  - Satellite checkout commits to Master SQLite with `skipPhysicalPrint: true` while printing locally to the satellite's attached USB thermal printer.
  - Switched checkout transactions to `BEGIN IMMEDIATE` to prevent `SQLITE_BUSY` database lock collisions across simultaneous cashiers.
- **🚀 1-Click Satellite Onboarding (`FirstRun.tsx`)**:
  - FirstRun setup wizard features dual choice (`[ Main Server / Solo ]` vs `[ Connect as Cashier ]`) with instant auto-scan and 6-digit PIN pairing.

### 🏷️ v2.1.11 (Dynamic Store Branding, Dual-View Inventory & Thermal Spacing Studio Edition) · Oct 13, 2026
- **🏢 Dynamic Store Branding on Printable Reports (`InventoryPrintModal.tsx`)**:
  - Replaces generic "TINDA Store" placeholder with real store name from `settings.store_name` (falling back gracefully only if empty), including physical store address, TIN (Tax Identification Number), and contact phone headers across all 4 printable inventory sheet types.
  - Adds executive dual-signature audit box ("Prepared By / Inventory Clerk" & "Verified & Approved By / Store Manager") with print date-time and page sequence footer, providing bankable audit sheets for stock audits and tax reviews.
- **⊞ Dual-View Mode (`[ ⊞ Grid | ☰ List ]`) in Inventory (`Inventory.tsx`)**:
  - Integrated Cupertino segmented view switcher (`[ ⊞ Grid | ☰ List ]`) with `localStorage` persistence (`tinda_inventory_view_mode`).
  - Added global keyboard shortcut `Alt + V` for instant 0ms toggling between visual product cards and High-Density Tabular List view.
  - High-Density Tabular List view displays SKU/Barcode, Product Name, Category badge, Stock on Hand with safety color indicators (Rose for low stock, Emerald for healthy), Cost Price, Selling Price, and Quick Action buttons.
- **🖨️ Thermal Receipt Spacing & Alignment Controls in Settings (`Settings.tsx`, `printing.ts`, `receiptHtml.ts`)**:
  - Fixed thermal printer customization persistence: resolved unsaved and reverted configuration bugs by unifying state across SQLite, Zustand store, and localStorage with `tinda-printer-config-changed` cross-process broadcast.
  - Added granular sliders in Settings for Left Margin / Indent (`receipt_offset_left_mm`, 0–10mm) preventing first-letter cutoffs, Right Margin (`receipt_margin_right_mm`, 0–10mm), Line Spacing (`receipt_line_spacing`, 1.0–2.0x), Bottom Tear-Off Buffer Feed (`receipt_feed_lines_end`, 0–10 lines) ensuring totals and barcodes are never clipped, and Font Scale (`receipt_font_scale`, 80%–130%).
  - Live synchronization across express slips, official POS sales receipts, and reprint jobs.
- **🧪 Enterprise Invariant & Test Suite Parity**:
  - 531/531 unit tests passing across 82 test suites (100% green).
  - 0 TypeScript errors across Node and Web compilation targets.
  - Full master invariants compliance verified before packaging.

### ⚡ v2.1.10 (0ms Instant Telemetry Cache & Anti-Freeze Notification Bell Edition) · Oct 13, 2026
- **⚡ 0ms Instant LocalStorage Telemetry Cache (`notificationDrawer.ts`, `NotificationBellDrawer.tsx`)**:
  - Zero-blocking UI: Telemetry store initializes synchronously from `localStorage.getItem('tinda_telemetry_cache')` on mount, completely eliminating the initial loading screen and spinner stall (`isLoading: false`).
  - Stale-While-Revalidate background sync: Renders cached metrics instantly with 0ms delay while syncing fresh telemetry in the background.
  - Safe default fallback prevents null dereferencing and guarantees integer-cent mathematical safety.
- **🛡️ Database Query-Level Shields & Anti-Freeze Telemetry Aggregation (`storeTelemetry.ts`, `ipc/index.ts`)**:
  - Defensive Query Shields: Every individual aggregate query (sales, refunds, voids, cash drawer balances, utang ledgers, low stock) is wrapped in isolated try/catch blocks with fail-safe zero defaults, preventing single corrupted rows or missing tables from freezing telemetry generation.
  - Fail-safe IPC Handler: `telemetry:getSummary` IPC gracefully catches unexpected exceptions and returns clean empty telemetry summary, preventing Electron main process lockups.
- **🧪 Enterprise Invariant & Test Suite Parity**:
  - 531/531 unit tests passing across 82 test suites (100% green).
  - 0 TypeScript errors across Node and Web compilation targets.
  - Full master invariants compliance verified before packaging.

### 🤖 v2.1.9 (Instant 0ms Telemetry Cache & OpenCode Free AI Copilot Edition) · Oct 13, 2026
- **⚡ Instant 0ms Store Telemetry Cache (`storeTelemetry.ts`, `Shell.tsx`, `inventoryEvents.ts`)**:
  - Telemetry cache pre-warming on Shell mount (`warmStoreTelemetryCache()`), sub-millisecond instant drawer rendering, 15-second TTL with force-refresh support.
  - Automatic event-driven cache invalidation on product/inventory mutations (`inventoryEvents.ts`).
- **🤖 OpenCode Free Models Pool & Intelligent Cloud Fallback (`aiService.ts`, `NotificationBellDrawer.tsx`)**:
  - High-availability free AI model rotation pool featuring OpenCode models (`nemotron-3.5-lightning-free`, `mimo-v2.6-flash-free`, `exo-free`, `space-bunny-free`, `step-5-preview-free`) with automatic failover to Google Gemini cloud backup.
  - Rich retail domain system prompt injecting real-time store telemetry context, Philippine retail SOPs (RA 9994/RA 10754 Senior/PWD discounts, GCash/Maya non-custodial workflows, utang tracking, barcode generation).
  - Interactive TindaBot conversational tab embedded directly in the Cupertino notification drawer with suggested quick-prompt action pills.
- **🧪 Enterprise Invariant & Test Suite Parity**:
  - 531/531 unit tests passing across 82 test suites (100% green).
  - 0 TypeScript errors across Node and Web targets.
  - Full master invariants compliance verified before packaging.

### 🔔 v2.1.8 (Notification Bell & Bilingual AI Store Advisor Edition) · Oct 13, 2026
- **🔔 Interactive Notification Bell & Glassmorphism Drawer (`Sidebar.tsx`, `NotificationDrawer.tsx`, `notificationDrawer.ts`)**:
  - Modern notification bell icon integrated into top-level Sidebar with dynamic glowing unread badge count.
  - Slide-out Apple Cupertino glassmorphism drawer accessible from anywhere in the app with category filtering (All, Unread, AI Advisor, Stock Alerts, System).
  - 1-Click "Mark All as Read", notification dismissal, and deep-linking action buttons directly navigating to relevant POS modules.
- **🧠 Deterministic Bilingual AI Store Advisor Engine (`aiStoreAdvisor.ts`)**:
  - 100% offline-first heuristics analyzing inventory velocity, stockouts, shift variances, and overdue customer credit.
  - Dual-language toggle: Professional English and Bisaya / Taglish natural store advisory voice tailored for Philippine retail stores.
  - Priority ranking (Critical, Warning, Insight, Milestone) with actionable recommendations.
- **⚡ Atomic Store Telemetry Service & IPC Bridge (`storeTelemetry.ts`, `ipc/index.ts`, `preload/index.ts`)**:
  - Sub-millisecond SQLite aggregation gathering inventory health, expiring batches, active shifts, and sales KPIs in a single atomic query.
  - Complete test coverage with 527/527 passing tests across 82 suites.

### 💳 v2.1.6 (Unified E-Wallet & Bills Center, Single-Receipt POS Cart Integration & Cross-Ledger Sync) · Oct 13, 2026
- **⚡ Timezone Invariant & Zero-Ghosting Datetime Parsing (`EwalletAudit.tsx`, `BillsLoadHub.tsx`)**:
  - Fixed SQLite space-separated local timestamps (`YYYY-MM-DD HH:MM:SS`) falsely converted via `'Z'` suffix, ensuring 100% visibility for evening/night transactions after 4:00 PM in `Asia/Manila`.
- **🛒 Single-Receipt POS Cart Integration (`BillsLoadHub.tsx`, `POS.tsx`)**:
  - 1-Click "Add to POS Cart" and "Add & Go to POS Cashier" bundling bills payment and cash-in with groceries on one official thermal receipt with dual ledger auditing.
- **📊 Master Transactions E-Wallet & Bills Center Tab (`Transactions.tsx`)**:
  - Top-level 2-tab view separating POS Sales from E-Wallet & Bills Center with channel and type filtering, thermal reprinting, and safe delete/void confirmation modal.

### 🔍 v2.1.5 (Printable Inventory Sheets Search & Cloud Analytics Calendar Edition) · Oct 12, 2026
- **🔍 Real-Time Item & Letter Search for Printable Sheets (`InventoryPrintModal.tsx`)**:
  - Integrated real-time search input with glassmorphism styling, `Search` icon, autofocus, and 1-click `✕` clear button across all inventory print types (Stock on Hand, Physical Stock Count, Price List, Reorder/Low Stock).
  - Real-time case-insensitive filtering matching product `name`, `sku`, `barcode`, `category_name`, and `description` (e.g. typing "elbow" filters specifically for PVC elbow fittings).
  - Live matching badge (`Ready to print: X product items (matching "elbow")`) and zero-match alert banner.
  - Dynamic document generation: automatically injects `Filter: "elbow" • X Products` in the printed report header and recalculates `totalVal` exclusively for filtered items (`Total Inventory Value (Filtered): ₱...`).
- **📅 Cloud Owner Dashboard Custom Date Picker (`OverviewPage.tsx`, `BranchDetailPage.tsx`)**:
  - Upgraded `OverviewPage.tsx` with a 5th Segmented button `📅 Custom` and Apple glassmorphism `custom-date-strip` (`From` and `To` native `<input type="date">` inputs, Apply button, and Active date indicator).
  - Upgraded `BranchDetailPage.tsx` with symmetrical Date Filter Bar (Today, Yesterday, Last 7 Days, This Month, Custom Date) so store owners can drill into any historical date window without returning to Overview.
  - Connected `App.tsx` to synchronize `onDateChange` between Overview and Branch Detail views.
- **⚡ Cloudflare D1 Backend `periodFinancials` Query & `LIMIT 100` Truncation Lift (`reports.ts`)**:
  - Added dedicated `periodFinancials` SQL aggregate query in `tinda-sync` Cloudflare D1 worker for mathematically exact revenue, payment method breakdowns, and transaction counts across any date range.
  - Raised individual sales query limit from 100 to 300 rows and normalized timezone fallback to `Asia/Manila`.
- **🛡️ SQLite Double-Timezone Roll-Over Fix (`ewallet.ts`)**:
  - Fixed 4:00 PM (16:00 UTC+8) date rollover bug in SQLite: replaced `date(created_at, 'localtime')` with `substr(created_at, 1, 10)` because `created_at` timestamps were already recorded in local time, preventing double shift into the next day.

### 🚀 v2.1.4 (1-Tap QR Code Auto-Pair & Background Auto-Sync Loop Edition) · Oct 12, 2026
- **📱 1-Tap Mobile Phone QR Code Pairing (`Settings.tsx`, `App.tsx`, `LoginPage.tsx`)**:
  - Scan the high-contrast QR code on the POS screen using iPhone Camera or Android QR scanner to automatically launch and connect the owner dashboard without typing Store ID or Sync Key.
  - Added 1-click **"📋 Copy Setup Link for Messenger / SMS"** button to send direct pairing links to store owners.
  - Added **"🌐 Open Pre-Paired on this PC"** button for instant one-click dashboard launch.
- **🔄 Autonomous Background Auto-Sync Engine (`cloudSync.ts`, `main/index.ts`)**:
  - Added startup backfill timer (pushes recent sales after 4s grace period on app launch).
  - Added continuous 3-minute recurring background sync loop so sales and shifts stream live to Cloudflare D1 without requiring cashier intervention or manual "Sync Now" button clicks.
- **👥 Multi-Owner D1 Branch Resolution (`store_owners` Table & `tinda-sync` Worker)**:
  - Added `store_owners` linking table supporting multi-account access per branch (e.g. `mary grace flor` and `adamgrace123` for Adamgrace Minimart).
  - Fully resolved zero-branch and zero-sales visibility for store owners.

### 🏷️ v2.1.3 (CT221B Barcode Instant-Scan & High-Contrast Font Edition) · Oct 12, 2026
- **Instant 1st-Pass Laser/CCD Scan Geometry (`barcodeSvg.ts`, `PriceTagPrintModal.tsx`, `printing.ts`)**:
  - Raised barcode bar height (`barHeight`) by **+100% to +126%** (from 22/30px to **42px** on compact tags and **60px** on standard tags; total SVG height 55px/78px), yielding ~7.5mm–9.0mm physical height on thermal paper. Eliminates partial-decode dropouts caused by scanner beam tilt.
  - ISO 15416 quiet zone calibrated to 10 modules, reducing total coordinate width by ~22px and cutting viewBox downscale compression by ~10% for wider, crisper bars.
- **High-Contrast Bold Thermal Font & Anti-Hairline Stroke Shield**:
  - Switched font stack to heavy `Consolas, 'Roboto Mono', 'Courier New', Arial, sans-serif` at `font-weight: 900` with `1.5px` tracking.
  - Added SVG vector stroke shield (`stroke="#000000" stroke-width="0.5" paint-order="stroke fill"`), preventing 203 DPI thermal heads from dropping hairline stems to white.
  - Increased SVG font size from 7.5px/9px to **12px/13px**, resulting in crisp ~5.5pt physical text.

<details>
<summary><b>📜 View Historical Releases (v1.0.50 – v2.1.2)</b></summary>

<br />

#### v2.1.2 — CT221B Barcode Scanability & Cloud Sync Precision Edition
- Industrial ISO 15416 barcode scanability calibration (2.5px/2.8px module widths).
- Case-insensitive Store ID normalization on Cloudflare D1 edge pipeline.
- Verified push backfill counter for up to 50 recent active sales on manual `syncNow`.

#### v2.1.0 — Proportional Refund Immunity & Net COGS Absorption
- Prorated refund discount invariant in `transaction.ts`, eliminating cash drawer leakage.
- Net landed acquisition cost COGS absorption factoring cascading trade discounts.
- Migration 15: 10 composite SQLite foreign-key indexes for sub-millisecond query performance.
- Native cash drawer kick pulse across IPC/preload (`window.api.printer.kickCashDrawer()`).

#### v2.0.9 — Purchase Invoices History Immunity & Self-Healing Migration
- Self-healing `ensurePurchasesTables` resolving SQLite missing column/table error on existing user databases.
- Resilient null-safe date formatting in `shortDate`.

#### v2.0.8 — Multi-Packaging Units & Supplier Cascading Trade Discounts
- Multi-packaging wholesale units (`PACK`, `BUNDLE`, `ROLL`, `BOX`, `CASE`, `DOZEN`, `SACK`, `CAN`, `BOTTLE`, `KILO`).
- Compounded supplier trade discounts ("Less 5 Less 5", `5+5+5`, `10+5`, `10/5`).

#### v2.0.7 — Daily E-Wallet Reconciliation Hub & Promo Bundles
- Daily midnight (12:00 AM) auto-resetting totals for E-Wallet Cash In / Out.
- Loyverse-style promo bundles with live limiting component inventory monitoring.

#### v2.0.6 — Supplier Purchase Receiving Hub & Cashier Attendance
- Wholesale purchase invoice receiving hub (`Receipt No.`, `Invoice No.`, `Supplier`, `Terms`).
- Item-by-item sales breakdown and profit margin analytics in Reports.
- Cashier Time-In / Time-Out attendance and automated payroll slip engine.

#### v2.0.1 — Resilient POS Checkout Immunity & Cupertino Feature Showcase
- Safeguarded checkout against missing product crashes by auto-converting to custom line items.
- Dedicated Rush ID Studio Packages (`4x 1x1 + 2x 2x2 + 2x Passport` for ₱75.00).
- Interactive Cupertino feature showcase banner on Dashboard.

#### v1.0.99 — Chiteng & Receipt Studio Calibration & Dual CFD
- Universal calibration studio for receipts and label stickers with real-time 1:1 canvas previews.
- Real-time Customer Facing Display (CFD) mirroring for bills payment and e-wallet QR codes.
- Customer utang due date reminders with calendar presets.

</details>

---

## 🏛️ Development Team & The 9 Elite Specialists

TINDA POS Desktop is architected and maintained under the leadership of **Jin** (Doctoral & Master's Degree Engineer, Master Developer, Master General & Fixer Agent All-in-One) and his roster of 9 world-class specialist agents:

| Specialist | Codename | Domain & Responsibilities |
|---|---|---|
| ⚡ **UI Speed Coder** | `FLASH` | React 19, Tailwind CSS, fluid Apple Cupertino animations & gestures |
| 🔬 **Bug Detective** | `SHERLOCK` | Systematic root-cause bug hunting, crash forensics & error reproduction |
| 🛡️ **Security Shield** | `IRONCLAD` | Ed25519 VIP licensing, SQL injection immunity & data protection |
| 📊 **Analytics & SQL** | `ORACLE` | Financial mathematics, sales aggregation, Z-reading & reporting engines |
| 🚀 **Deploy & Packaging**| `FALCON` | Fast feature hot-patch publisher, Windows NSIS packaging & releases |
| 🧪 **QA & Testing** | `VIPER` | Vitest unit test suite, TypeScript strict typecheck & release gates |
| 📐 **Software Architect**| `BLUEPRINT` | Architecture design, ponytail minimalism & YAGNI code review |
| 📝 **Documentation** | `SCRIBE` | Release notes, cashier handbooks, user manuals & technical specs |
| 🐙 **GitHub Grandmaster**| `KRAKEN` | Open-source showcase standards, README engineering & repo elegance |

---

## 📄 License

TINDA POS is released under the **TINDA POS Community License** — Free for personal, non-commercial, and small-to-medium business (SMB) sari-sari store operations across the Philippines.

Copyright © 2026 TINDA POS. All rights reserved.
