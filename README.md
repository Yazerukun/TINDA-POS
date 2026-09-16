<div align="center">

<img src="https://img.shields.io/badge/TINDA_POS-v1.0.18-059669?style=for-the-badge&labelColor=065f46" alt="Version">
<img src="https://img.shields.io/badge/Platform-Windows_10%2F11-0078d4?style=for-the-badge&logo=windows&logoColor=white" alt="Platform">
<img src="https://img.shields.io/badge/Works-100%25_Offline-6366f1?style=for-the-badge" alt="Offline">
<img src="https://img.shields.io/badge/License-Free_for_Personal_%26_SMB-f59e0b?style=for-the-badge" alt="License">

<br /><br />

# TINDA POS

### Offline Point-of-Sale for Philippine Sari-Sari Stores & Small Businesses

**Sell products · Track inventory · Manage customer Utang · Reconcile cash — all in one focused desktop app. No internet required.**

<br />

[⬇️ Download v1.0.18 Setup](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.18/TindaPOS-Setup-1.0.18.exe)&nbsp;&nbsp;·&nbsp;&nbsp;[⬇️ Portable Edition](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.18/TindaPOS-Portable-1.0.18.exe)&nbsp;&nbsp;·&nbsp;&nbsp;[📄 User Manual PDF](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.18/TindaPOS-User-Guide.pdf)&nbsp;&nbsp;·&nbsp;&nbsp;[🐛 Report Issue](https://github.com/Yazerukun/TINDA-POS/issues)

</div>

---

## ✨ What's New in v1.0.18

> **Itemized Recent Transactions** — instantly see what was sold in every transaction without opening a separate window.

- **Dashboard card** — each recent transaction row is now expandable. Click any row to reveal a full item-by-item breakdown: product name, quantity × unit, subtotal per item, and payment method used.
- **Transactions page** — click the **▾ chevron** beside any receipt number to expand an inline mini-table: Product · Qty · Unit Price · Subtotal, plus a footer showing payment method(s) and total.
- Only one row is open at a time — click again to collapse. Clean and fast.

<details>
<summary>📋 Full version history</summary>

| Version | Highlights |
|---|---|
| v1.0.18 | Itemized accordion for Recent Transactions (Dashboard + Transactions page) |
| v1.0.17 | Windows Startup checkbox accessibility fix |
| v1.0.16 | Dual-layer Windows auto-start, profit double-deduction fix, POS discount Pesos format, receipt payment breakdown order |
| v1.0.15 | Utang customer selection from checkout modal |
| v1.0.14 | Utang customer reachability fix |

</details>

---

## 🏪 Why TINDA POS?

TINDA POS is built for everyday store work. Checkout stays usable **100% offline**, your database stays on your own computer, and the workflow is clear for both owners and cashiers — no training needed.

| | Feature |
|:---:|---|
| 🛒 | Fast product search, barcode input, categories, Hold/Resume, and quantity controls |
| 💵 | Cash, GCash, Maya, split payments, and customer Utang (credit) recording |
| 📦 | Multi-unit products, stock receiving, restocking, withdrawals, and low-stock alerts |
| 📅 | Per-item and per-batch expiration dates with checkout protection |
| 👥 | Customers, credit limits, payments, adjustments, and a complete Utang ledger |
| 🧾 | Receipt printing, refunds, voids, receipt reprints, X-Read, Cash Count, and Z-Read |
| 📊 | Sales, profit, inventory, and Utang reports with CSV export |
| 💾 | Local backups, cloud-folder sync (OneDrive/GDrive/Dropbox), validated restore |
| 🔒 | Roles & permissions, suppliers, expenses, and software auto-update |

---

## ⬇️ Download

**Windows 10 / 11 (64-bit)**

| File | What it is |
|---|---|
| [TindaPOS-Setup-1.0.18.exe](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.18/TindaPOS-Setup-1.0.18.exe) | ✅ **Recommended.** Installs TINDA POS with software auto-update support. |
| [TindaPOS-Portable-1.0.18.exe](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.18/TindaPOS-Portable-1.0.18.exe) | Run without installing. Keep its `TindaPOS-Data` folder safe. |
| [TindaPOS-User-Guide.pdf](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.18/TindaPOS-User-Guide.pdf) | Printable step-by-step user manual. |
| [SHA256SUMS-RC.txt](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.18/SHA256SUMS-RC.txt) | Verify downloaded files. |

> **If Windows SmartScreen appears:** click **More info → Run anyway**. This is normal for community-distributed apps.

All releases → [github.com/Yazerukun/TINDA-POS/releases](https://github.com/Yazerukun/TINDA-POS/releases)

---

## 🚀 First Setup (5 Steps)

1. Run the Setup installer and launch TINDA POS.
2. Complete the **first-run wizard** — store name, admin account, and receipt settings.
3. Open **Inventory** and add your products, prices, units, and opening stock.
4. Go to **Settings → Receipt** and configure your printer. Use **Test Print** to confirm.
5. Open **POS** and complete a small test sale before serving customers.
6. Create a **Backup** before your first real day.

---

## 💳 Accepting Payments

| Method | How |
|---|---|
| **Cash** | Enter amount received — change (sukli) is computed automatically. |
| **GCash / Maya** | Enter the reference number for tracking. |
| **Utang (credit)** | Select the customer first, then choose Utang at checkout. |
| **Split payment** | Click **Add Payment** and mix any methods in a single sale. |

---

## 🔍 Recent Transactions — Itemized View *(New in v1.0.18)*

### From the Dashboard
Each row in the **Recent Transactions** card is clickable:
- **Collapsed** → shows receipt #, cashier, time, total, and a 1-line item preview (`Sprite ×2, Biscuit ×1`)
- **Expanded** → shows full item breakdown + payment method + discount

### From the Transactions Page
Click the **▾ chevron** beside any receipt number:

| Product | Qty | Unit Price | Subtotal |
|---|---|---|---|
| Sprite | 2 pcs | ₱25.00 | ₱50.00 |
| Biscuit | 1 pc | ₱15.00 | ₱15.00 |

Footer shows payment method(s) and total. Click **▴** again to collapse.

---

## 💳 Utang — Select the Right Customer

The Utang flow is designed to prevent mistakes:

1. In POS, click **Select Customer** under **Select the borrower**.
2. Search by name or phone number.
3. Click the customer row. The selected row is highlighted with a checkmark ✓.
4. Confirm **Selected: Customer Name ✓** before opening Checkout.
5. Choose **Utang** and review the customer again before charging.

> If no customer is selected, TINDA POS blocks Utang checkout and shows a reminder. Use **Walk-in (no utang)** to clear the selection.

---

## 🔄 Software Updates

For **Setup** users: open **Settings → About → Software Update → Check for Updates**.

- Download the update and wait for 100%
- Click **Restart & Install** after active transactions are finished
- TINDA POS creates a safety backup before installation automatically

> Users on v1.0.17 will receive the v1.0.18 update automatically on their next check.  
> Users on very old v1.0.3–v1.0.5 need one manual Setup upgrade first.

---

## 💾 Data & Backups

Your database lives at `%APPDATA%\TINDA POS\database\tindapos.db`.  
Check the exact location in **Settings → Data**.

**Backup schedule:**
- At minimum: once a week
- Busy stores: every day
- Cloud option: OneDrive, Google Drive for Desktop, or Dropbox (via **Backup → Choose Folder**)

> Uninstalling TINDA POS **does not delete your data.** Your sales history is always safe.

---

## 🔁 Shifts, X-Read & Z-Read

| Action | When |
|---|---|
| **X-Read** | Check current totals any time during the shift (non-final). |
| **Cash Count** | Count the drawer and save it while the shift is still open. |
| **Z-Read** | Finalize and close the shift. |

> Always save the Cash Count **before** Z-Read.  
> Dashboard daily totals do not reset after every Z-Read.

---

## 🛠️ Troubleshooting

| Problem | First check |
|---|---|
| Utang customer is unclear | Use **Select the borrower**, confirm the highlighted name shows ✓. |
| No open shift | Open a shift manually, and save Cash Count before Z-Read next time. |
| Cash does not match | Check starting float, cash payments, refunds, expenses, and cash movements. |
| Receipt did not print | Check paper, power, Windows driver, selected printer, width, and Test Print. |
| Update was interrupted | Restore internet and retry — do not delete store data. |
| Software Update says "Unable to check" | Verify the PC has internet. Open a browser and check any website. Wait 30 seconds and try again. |

When reporting a problem, include: version (v1.0.18), Setup or Portable edition, exact error message, and steps to reproduce. Remove customer names from screenshots. → [GitHub Issues](https://github.com/Yazerukun/TINDA-POS/issues)

---

## 🧑‍💻 Development

TINDA POS uses **Electron · React · TypeScript · SQLite · Tailwind CSS · Zustand**.

```bash
cd source
npm install
npm run dev          # development with hot-reload
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm test             # Vitest (247 tests)
npm run build        # production build
```

See [`docs/RELEASE-WORKFLOW.md`](docs/RELEASE-WORKFLOW.md) for the full release and QA process.

---

## 📄 License

**Proprietary.** Free for personal and small-business use.  
Do not redistribute or sell without permission.

---

<div align="center">

Made with ❤️ for Philippine sari-sari stores and small businesses.

**[Download v1.0.18](https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.18)** · **[User Manual](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.18/TindaPOS-User-Guide.pdf)** · **[Issues](https://github.com/Yazerukun/TINDA-POS/issues)**

</div>
