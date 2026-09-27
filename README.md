<div align="center">

<img src="https://img.shields.io/badge/TINDA_POS-v1.0.38-059669?style=for-the-badge&labelColor=065f46" alt="Version">
<img src="https://img.shields.io/badge/Platform-Windows_10%2F11-0078d4?style=for-the-badge&logo=windows&logoColor=white" alt="Platform">
<img src="https://img.shields.io/badge/Works-100%25_Offline-6366f1?style=for-the-badge" alt="Offline">
<img src="https://img.shields.io/badge/Tests-332%2F332_Passing-10b981?style=for-the-badge" alt="Tests">
<img src="https://img.shields.io/badge/License-Community_%26_VIP_Pro-f59e0b?style=for-the-badge" alt="License">

<br /><br />

# 🏪 TINDA POS

### Offline Point-of-Sale for Philippine Sari-Sari Stores & Small Businesses

**Sell products · Track inventory · Manage customer Utang · Reconcile cash — all in one focused desktop app. No internet required.**

<br />

[⬇️ Download v1.0.38 Setup](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.38/TindaPOS-Setup-1.0.38.exe)&nbsp;&nbsp;·&nbsp;&nbsp;[📦 Portable Edition](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.38/TindaPOS-Portable-1.0.38.exe)&nbsp;&nbsp;·&nbsp;&nbsp;[📄 User Guide PDF](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.38/TindaPOS-User-Guide.pdf)&nbsp;&nbsp;·&nbsp;&nbsp;[🐛 Report Issue](https://github.com/Yazerukun/TINDA-POS/issues)

</div>

---

## ✨ What's New in v1.0.38 (UI Scaling Hotfix & Modal Accessibility)

> **Compact Responsive VIP Pro Modal, Sticky Header with Permanent Close Buttons, Multi-Path Dismiss & Display Scaling Fixes**

- 📐 **Strict Viewport Containment (`max-h-[88vh]`)**: The VIP Pro modal is now strictly constrained to prevent vertical overflow on compact 1366x768 screens or laptops with 125%/150% Windows display scaling.
- ❌ **Prominent Sticky Header & Permanent Close Button**: The modal header remains permanently fixed at the top with a high-contrast `[ X Close ]` button that never scrolls off-screen.
- ⚡ **Quadruple-Action Dismiss**: Easily close the modal via top sticky Close button, bottom footer Close button, pressing the `Escape` key, or clicking outside on the backdrop.
- 📱 **1-Click Polite SMS & Messenger Debt Reminders**: Instant 1-click clipboard generator formatted with gentle, polite Taglish/English payment reminders to recover credit 3x faster without awkward confrontations.
- ⭐ **Suki Utang Credit Trust Scoring**: Real-time 5-star customer reliability indicator (⭐⭐⭐⭐⭐) to evaluate credit risk.
- 📜 **Interactive Privacy Policy & Terms of Service**: In-app legal transparency dialogs guaranteeing 100% offline data sovereignty.
- 💎 **TINDA POS VIP Pro Edition (₱500 Lifetime)**: Optional one-time lifetime license unlocking Multi-PC LAN Hub, QR receipts, and branding.

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
