<div align="center">

<img src="https://img.shields.io/badge/TINDA_POS-v1.0.25-059669?style=for-the-badge&labelColor=065f46" alt="Version">
<img src="https://img.shields.io/badge/Platform-Windows_10%2F11-0078d4?style=for-the-badge&logo=windows&logoColor=white" alt="Platform">
<img src="https://img.shields.io/badge/Works-100%25_Offline-6366f1?style=for-the-badge" alt="Offline">
<img src="https://img.shields.io/badge/Tests-292%2F292_Passing-10b981?style=for-the-badge" alt="Tests">
<img src="https://img.shields.io/badge/License-Free_for_Personal_%26_SMB-f59e0b?style=for-the-badge" alt="License">

<br /><br />

# 🏪 TINDA POS

### Offline Point-of-Sale for Philippine Sari-Sari Stores & Small Businesses

**Sell products · Track inventory · Manage customer Utang · Reconcile cash — all in one focused desktop app. No internet required.**

<br />

[⬇️ Download v1.0.25 Setup](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.25/TindaPOS-Setup-1.0.25.exe)&nbsp;&nbsp;·&nbsp;&nbsp;[📦 Portable Edition](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.25/TindaPOS-Portable-1.0.25.exe)&nbsp;&nbsp;·&nbsp;&nbsp;[📄 User Guide PDF](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.25/TindaPOS-User-Guide.pdf)&nbsp;&nbsp;·&nbsp;&nbsp;[🐛 Report Issue](https://github.com/Yazerukun/TINDA-POS/issues)

</div>

---

## ✨ What's New in v1.0.25

> **Offline-First Online Price Guide / Market Price Reference, DTI SRP Guidance & Modal Stability Fix**

- 🏷️ **Offline-First Market Price Reference** — consult market prices and suggested price ranges (e.g. DTI SRP, Market Price Guide) for Philippine commodities directly inside TINDA POS. Fully offline-first with local SQLite caching.
- 🛡️ **Store Owner Authority Guaranteed** — the price guide is strictly advisory. Store owner selling prices are **never** automatically changed or overwritten. Store owners can explicitly click *"Adopt Reference Price"* in the product modal to use it.
- 🔧 **Price Guide Modal Stability & Auto-Seed Fix** — resolved the blank screen issue when opening the Price Guide modal; preloads 20 Philippine staple commodities automatically on fresh/empty databases without requiring an initial sync.
- 📡 **Dual-Probe Sync & Stale Data Transparency** — safe background sync with dual-probe connectivity check. When offline, explicitly displays *"Offline — Showing Last Saved Data"*. Stale data (>30 days) is clearly marked.
- 📦 **Preloaded Philippine Commodity Seed Catalog** — preloaded with official reference prices for staple items (Lucky Me Pancit Canton/Mami, Mega Sardines, 555 Sardines, Bear Brand, Nescafe, Kopiko, Great Taste, Coca-Cola, Datu Puti, Silver Swan, Safeguard, Surf, San Miguel, Red Horse).
- 🔍 **Interactive Price Guide Modal** — accessible from Inventory header (*"Price Guide"*), allows searching, filtering by source/linked status, manual sync with progress indicator, and manual product linking/unlinking.
- 💳 **Subtle POS Card Indicator** — displays reference price (`Ref: ₱10.50`) on product cards without cluttering the screen or impacting scanning speed.

<details>
<summary>📋 <b>Full Version History</b></summary>

<br />

| Version | Highlights |
|---|---|
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
| **TINDA POS Setup (Installer)** | ✅ **Recommended.** Installs TINDA POS with automatic desktop shortcut and background auto-update support. | [⬇️ Download Setup](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.24/TindaPOS-Setup-1.0.24.exe) |
| **TINDA POS Portable** | Standalone version. Runs directly from a USB drive or folder without installation. Stores database beside the EXE. | [📦 Download Portable](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.24/TindaPOS-Portable-1.0.24.exe) |
| **Official User Guide (PDF)** | Comprehensive 26-page printable step-by-step user guide with screenshots, workflows, and troubleshooting. | [📄 Download PDF Guide](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.24/TindaPOS-User-Guide.pdf) |
| **Release Checksum Manifest** | SHA256 checksums to verify file integrity. | [🛡️ View SHA256SUMS](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.24/SHA256SUMS-v1.0.24.txt) |

> ℹ️ **If Windows SmartScreen appears:** click **"More info" → "Run anyway"**. This is standard for newly released and community-distributed Windows applications.

🔗 *View all past releases and changelogs on the [GitHub Releases Page](https://github.com/Yazerukun/TINDA-POS/releases).*

---

## 🚀 Quick Start (5 Easy Steps)

1. **Install:** Run `TindaPOS-Setup-1.0.24.exe` and launch the application.
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

> 💡 **Seamless Upgrade:** Users on previous versions (v1.0.19, v1.0.20, v1.0.21, v1.0.22, v1.0.23) will automatically detect and upgrade to **v1.0.24** with zero data loss or manual re-configuration.

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

**[⬇️ Download v1.0.24 Setup](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.24/TindaPOS-Setup-1.0.24.exe)** · **[📄 User Guide PDF](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.24/TindaPOS-User-Guide.pdf)** · **[💬 Community Issues](https://github.com/Yazerukun/TINDA-POS/issues)**

</div>
