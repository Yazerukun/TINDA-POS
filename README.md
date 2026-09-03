<div align="center">

# 🏪 TINDA POS

### Free & Offline Point-of-Sale for Sari-Sari Stores

**No internet needed. No subscription. Your data stays on your computer.**

[![Release](https://img.shields.io/github/v/release/Yazerukun/TINDA-POS?color=059669&style=for-the-badge)](https://github.com/Yazerukun/TINDA-POS/releases/latest)
[![License](https://img.shields.io/badge/license-proprietary-red?style=for-the-badge)](#license)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue?style=for-the-badge)](#download)

</div>

---

## What is TINDA POS?

TINDA POS is a **free, offline-first point-of-sale app** built for Philippine sari-sari stores and small businesses. Sales work completely offline. Owners may optionally mirror backups to a folder managed by OneDrive, Google Drive for desktop, or Dropbox.

Built with Electron, React, TypeScript, and SQLite for reliability and speed.

## 🆕 What's New in v1.0.1

- Optional cloud-folder backup support for OneDrive, Google Drive for desktop, and Dropbox
- Live ONLINE READY/OFFLINE READY status with connection notifications
- Improved category management, inventory safeguards, customer balances, and backup handling
- Polished **Maya “Buy me a coffee”** card with subtle glow, shimmer, and accessible motion
- Updated user guide, PHCorner release post, and verified Windows installer checksums
- **23 automated tests passing**, including the end-to-end sales workflow

## ✨ Features

### 💰 Point of Sale
- Fast checkout with product grid + search (name, SKU, or barcode)
- **Cash** with automatic sukli/change calculation
- **GCash & Maya** with reference number tracking
- **Utang (credit)** with customer picker
- **Split payment** — combine Cash + GCash/Maya in one sale
- Hold & resume sales for serving multiple customers

### 📦 Inventory
- Products with **tingi units** (sachet, can, stick, piraso)
- Add/delete category manager, suppliers, and SKU/barcode support
- Low-stock & out-of-stock alerts with color-coded badges
- Stock automatically updated on every sale, refund, and void

### 👥 Customers & Utang
- Customer directory with credit limits
- Full utang ledger — track every sale-on-credit and payment
- Payments and manual deductions refresh balances immediately
- Over-limit protection blocks new utang when limit is reached

### 📊 Dashboard & Reports
- Today's sales, profit, utang, and expenses at a glance
- Daily, weekly, and monthly report views
- Export any report to CSV (for Excel)

### 🔄 Transactions
- View full receipt for any sale
- Refund items (stock automatically restored)
- Void mistaken sales (stock restored, utang removed)
- Receipt reprint anytime

### ⏱️ Shifts
- Auto-opens on first sale of the day
- Close shift with expected vs actual cash reconciliation
- Track expenses per shift

### 💸 Expenses
- Record rent, electricity, water, load, etc.
- Categorized for clean reporting
- Factored into profit calculations

### 📋 Suppliers & Purchases
- Supplier directory with contact info
- Track which products come from each supplier

### 🗄️ Backup & Restore
- One-click backup to timestamped file
- Restore from any previous backup
- Optional daily/on-exit copy to a Windows cloud-synced folder
- Live ONLINE READY/OFFLINE READY indicator with connection notifications
- View or download uploaded backups from the cloud provider's phone/tablet app
- Data stored separately from the app — survives reinstalls

### 🔐 Multi-User
- Admin and Cashier roles with permission controls
- Fast PIN login for daily use
- Only admins can void sales

## 📥 Download

| Platform | File | Size |
|----------|------|------|
| **Windows 10/11** | [TindaPOS-Setup-1.0.1.exe](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.1/TindaPOS-Setup-1.0.1.exe) | ~110 MB |
| **Windows (Portable)** | [TindaPOS-Portable-1.0.1.exe](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.1/TindaPOS-Portable-1.0.1.exe) | ~110 MB |
| **User Guide** | [TindaPOS-User-Guide.pdf](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.1/TindaPOS-User-Guide.pdf) | ~21 KB |

> 📖 **First time?** Read the [User Guide PDF](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.1/TindaPOS-User-Guide.pdf) — it covers installation, setup, and how to use every feature.

## 🚀 Quick Start

### Windows
1. Download `TindaPOS-Setup-1.0.1.exe`
2. Double-click to install (click **More info → Run anyway** if SmartScreen appears)
3. Follow the 3-step setup wizard: Store details → Admin account → Receipt settings
4. Start selling!

> 💡 **Portable?** Use `TindaPOS-Portable-1.0.1.exe` instead — no install needed, just run.

### System Requirements
- **OS:** Windows 10/11 (64-bit)
- **RAM:** 4 GB
- **Disk:** ~200 MB free space
- **Display:** 1366×768 or higher
- **Internet:** Not required

## 🏗️ Building from Source

```bash
# Clone the repo
git clone https://github.com/Yazerukun/TINDA-POS.git
cd TINDA-POS/source

# Install dependencies
pnpm install

# Development
pnpm run dev

# Build for Windows
pnpm run build:win

# Build for Linux
pnpm run build:linux

# Run tests
pnpm test

# Lint
pnpm run lint

# Typecheck
pnpm run typecheck
```

### Tech Stack
- **Frontend:** React 19 + TypeScript + Tailwind CSS + Zustand
- **Backend:** Electron 44 + better-sqlite3
- **Build:** electron-vite + electron-builder
- **Testing:** Vitest (23 tests including end-to-end workflow)
- **Code Quality:** ESLint + TypeScript strict mode

## 📁 Project Structure

```
TINDA-POS/
├── TINDA-POS-LIVE.md       # Release status, verification & next-update scratchpad
├── source/                  # Application source code
│   ├── src/
│   │   ├── main/            # Electron main process
│   │   │   ├── database/    # SQLite connection & migrations
│   │   │   ├── repositories/# Data access layer (14 repos)
│   │   │   ├── services/    # Business logic (auth, checkout, etc.)
│   │   │   └── validation/  # Zod schemas
│   │   ├── preload/         # Secure context bridge
│   │   ├── renderer/        # React UI (11 pages)
│   │   └── shared/          # Types, roles, formatting
│   └── build/               # App icons
├── installers/              # Release artifacts & docs
├── tools/                   # PDF generator, env setup
└── docs/                    # Project progress & build guides
```

## ❓ FAQ

**Offline ba talaga?**
Oo. Walang internet na kailangan para magbenta. Optional lang ang cloud-synced backup at owner ang pipili kung ie-enable ito.

**Saan naka-save ang data?**
Windows: `%APPDATA%\TINDA POS` — Hindi nabubura kapag in-uninstall.

**Safe ba ang backup?**
Oo — may local backup at optional automatic copy sa OneDrive, Google Drive for desktop, o Dropbox folder.

**Pwede ba mag-add ng barcode scanner?**
Oo — any USB barcode scanner works. No special drivers needed.

## 🤝 Contributing

This is a personal project, but bug reports and suggestions are welcome via [GitHub Issues](https://github.com/Yazerukun/TINDA-POS/issues).

## 📄 License

Proprietary. Free to use for personal and small business purposes. Do not redistribute or sell without permission.

---

<div align="center">

**Made with ❤️ for Filipino sari-sari store owners**

*Batch ID: TindaPOS-1.0.1*

</div>
