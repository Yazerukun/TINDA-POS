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

**Development & Releases:** See [`docs/RELEASE-WORKFLOW.md`](docs/RELEASE-WORKFLOW.md).

**Current stable release: v1.0.10.** This hotfix requires Cash Count before Z-Read and improves POS readability.

### Cash Count muna, saka Z-Read

Kasama sa v1.0.10 hotfix ang required Cash Count bago Z-Read, mas malaking product names/prices at cart quantities,
mas madaling pinduting quantity buttons, at mas malapad na CHECKOUT.
Hindi na lumalaki ang taas ng product boxes kapag kaunti lang ang laman ng category.
Sa Z-Read, ang Cash amount ay perang naiwan pagkatapos ibalik ang sukli; hiwalay ang GCash, Maya, ug Utang.

Sa pagtatapos ng shift:

1. Buksan ang **Reports → Cash Count** gamit ang account na may bukas na shift.
2. Bilangin ang pera sa kaha at ilagay ang dami ng bawat bill at coin.
3. Pindutin ang **Save Cash Count** at hintayin ang **Cash Count saved**.
4. Saka pumunta sa **Reports → Z-Read** para suriin at isara ang shift.

Sa v1.0.10, kapag walang naka-save na Cash Count para sa kasalukuyang shift,
may Tagalog na paalala bago mag-finalize:

- **Pumunta sa Cash Count**: mag-save muna; mananatiling bukas ang shift.
- **Pumunta sa Cash Count**: mag-save muna; hindi maaaring magpatuloy sa Z-Read hanggang hindi ito naka-save.
- **X / Escape**: isara ang paalala; hindi isasara ang shift.

Hindi na lalabas ang paalala kung may saved Cash Count sa shift na iyon.
Kapag **No open shift** ang error, walang bukas na shift sa account na ginagamit.
I-save ang Cash Count bago isara ang shift, hindi pagkatapos.

Kapag published na ang hotfix, buksan ang **Settings → About → Software Update**,
pindutin ang **Check for Updates**, at sundin ang kasalukuyang update flow.
Walang binago sa updater o sa opisyal na GitHub update provider.
Tingnan ang [User Manual](docs/USER-MANUAL.md) para sa buong gabay.

Released September 6, 2026. This is a stable release, not a prerelease.

## Features

### 💰 Point of Sale
- Fast checkout with product grid + search (name, SKU, or barcode)
- Working category dropdown for quickly filtering the POS product grid
- Persistent Hold/Resume queue with reference codes and safe held-sale deletion
- **Cash** with automatic sukli/change calculation
- **GCash & Maya** with reference number tracking
- **Utang (credit)** with customer picker
- **Split payment** — combine Cash + GCash/Maya in one sale
- Hold, resume, or delete pending carts while serving multiple customers; holds survive restart and remain cashier-specific

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
- Reconstruct receipt details anytime; Windows receipt-printer support is implemented — printer discovery, Test Print, Auto Print, and manual Print Receipt (native Windows application/packaging QA passed; physical thermal-printer validation remains pending)

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
- One-click backup to a timestamped local SQLite file
- Restore validates the backup and creates a safety backup before replacement
- Integrity verification, WAL/SHM cleanup, and rollback protection guard restore operations
- Optional daily/on-exit copy to a Windows cloud-synced folder
- Live ONLINE READY/OFFLINE READY indicator with connection notifications
- View or download uploaded backups from the cloud provider's phone/tablet app
- Data stored separately from the app — survives reinstalls

### ⚙️ Settings → Data
- View the active database and backup locations
- Create and restore safety backups
- Protected Database Reset requires ADMIN/settings permission and exact `RESET` confirmation
- Reset restarts into first-run setup while preserving existing backups

### 🔐 Multi-User
- Admin and Cashier roles with permission controls
- Fast PIN login for daily use
- Only admins can void sales

## What's New in v1.0.3

- **Settings → About → Software Update** — check for updates, see What's New, download, and install without visiting a website.
- **Automatic check** — once per day on startup, checking the official GitHub release page for **stable versions only** (drafts/prereleases/invalid versions ignored).
- **Non-intrusive notification** — never blocks checkout.
- **Installed editions:** download the update, then **Restart & Install** only when you choose to. A validated **safety backup** of the store database is created before every update.
- **Portable edition:** never overwrites itself — downloads the new Portable EXE to `Downloads\TINDA-POS-Updates`, and you run it from there. `TindaPOS-Data\` is always preserved.
- **Operation-safe:** updates cannot interrupt a checkout, payment, refund, void, backup, restore, Start New Store, or reset ("Please finish the current operation before installing the update.").
- **Offline-first:** check failures are silent; TINDA POS keeps working fully offline.
- HTTPS only, official repo only (`Yazerukun/TINDA-POS`), nothing remote is ever executed.

## Release QA & Verification

- Source gates: lint, strict typecheck, production build, PDF generation, and `git diff --check` all pass.
- Automated tests: **119/119 passing**, including updater, backup protection, data-location, printing, holds, restore rollback, and end-to-end workflows.
- Native Windows CI run `34034394935`: PASS for Setup and Portable packaging, renderer startup, SQLite database creation, `better-sqlite3` win32-x64 loading, and both launch smokes.
- FINAL WINE SMOKE (Wine 11.16): PASS for fresh Portable and `win-unpacked` builds; first-run setup renderer and SQLite database creation verified.
- Public release verification: all six release assets download successfully, published SHA-256 checksums match, and `/releases/latest` resolves to v1.0.3.
- Accepted limitations: the first complete production updater replacement cycle will be validated when a newer stable release exists; physical thermal-printer QA remains pending.

## Updating Older Versions

**v1.0.2 Hotfix 1 and v1.0.3–v1.0.5 need a ONE-TIME MANUAL UPDATE.** Download the approved stable Setup from the official release page. Do not uninstall or delete your store data.

**Installer users:**
1. Back up your store (`Settings → Data → Create Backup`, or verify at `%APPDATA%\TINDA POS\backups`).
2. Download the latest stable `TindaPOS-Setup-<version>.exe`.
3. Run the installer and install **over the existing TINDA POS installation**.
4. Existing store data in Shared AppData remains preserved.

**Portable users:** download the latest stable Portable EXE.
- If using **Shared AppData**: existing store data remains available — just run the new EXE.
- If using **Portable Data Mode**: keep the existing `TindaPOS-Data` folder safe and use it with the new Portable version.

Users on v1.0.6 and newer can use **Settings → About → Software Update → Check for Updates**. Installed builds use **Download Update**, then **Restart & Install**. Portable builds download a separate EXE; open that file to use the newer version.

## What's New in v1.0.2 Hotfix 1

- Windows receipt-printer support: printer auto-detection, **Refresh Printers**, **Test Print**, **Auto Print After Sale**, and **Manual Print Receipt**
- 80mm default receipt width with 58mm support, custom receipt header/footer
- **Start New Store** and clearer **Settings → Data** (Shared AppData vs Portable Data Mode + Copy Current Store)
- Cash/SUKLI input fix (pesos, not raw cents), full-refund status fix, restore temp-file cleanup

> Historical release notes. See **Updating Older Versions** above for the current upgrade path.

## Download

Open the [latest stable release](https://github.com/Yazerukun/TINDA-POS/releases/latest) and expand **Assets**:

- `TindaPOS-Setup-<version>.exe` — Windows installer
- `TindaPOS-Portable-<version>.exe` — no-install portable edition
- `TindaPOS-User-Guide.pdf` — full user manual (PDF)
- `SHA256SUMS.txt` (or `SHA256SUMS-RC.txt` on older releases) — file verification checksums

> For v1.0.2 Hotfix 1 and v1.0.3–v1.0.5, follow **Updating Older Versions** above.

The supported target is Windows 10/11 64-bit.

## Quick Start

### Windows
1. Download the latest stable Setup or Portable package from the official release page.
2. Run the package (click **More info → Run anyway** if SmartScreen appears on the unsigned build).
3. Follow the 3-step setup wizard: Store details → Admin account → Receipt settings
4. Start selling!

> Setup and Portable intentionally share `%APPDATA%\TINDA POS`; moving the EXE does not create a new database.

### System Requirements
- **OS:** Windows 10/11 (64-bit)
- **RAM:** 4 GB
- **Disk:** ~200 MB free space
- **Display:** 1366×768 or higher
- **Internet:** Not required

## Building from Source

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
- **Testing:** Vitest (119 tests including the update system, data location, receipt printing, category filtering, reset, hold-sale, restore rollback, and end-to-end workflows)
- **Code Quality:** ESLint + TypeScript strict mode

## Project Structure

```
TINDA-POS/
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

## Frequently Asked Questions

**Offline ba talaga?**
Oo. Walang internet na kailangan para magbenta. Optional lang ang cloud-synced backup at owner ang pipili kung ie-enable ito.

**Direktang kumokonekta ba ang GCash/Maya sa provider?**
Hindi. Recording methods ang GCash at Maya; sine-save ng TINDA POS ang payment method, amount, at reference number pero walang direct wallet API integration.

**Saan naka-save ang data?**
Windows: `%APPDATA%\TINDA POS` — Hindi nabubura kapag in-uninstall. The active database is `%APPDATA%\TINDA POS\database\tindapos.db`.

**Safe ba ang backup?**
Oo — may local backup at optional automatic copy sa OneDrive, Google Drive for desktop, o Dropbox folder.

**Pwede ba mag-add ng barcode scanner?**
Oo — any USB barcode scanner works. No special drivers needed.

## Contributing

This is a personal project, but bug reports and suggestions are welcome via [GitHub Issues](https://github.com/Yazerukun/TINDA-POS/issues).

## License

Proprietary. Free to use for personal and small business purposes. Do not redistribute or sell without permission.

---

<div align="center">

**Built for Filipino sari-sari stores and small businesses.**

</div>
