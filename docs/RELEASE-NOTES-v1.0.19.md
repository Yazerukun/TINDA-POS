# TINDA POS v1.0.19 Stable

RC source commit: `PENDING — filled after Stage 05 freeze`
Updater gate: byte-identical firmware of v1.0.18's updater machinery (electron-updater + electron-builder + app-update.yml untouched in this release).

## What's new

### 1. Universal Windows ↔ Android backup (`.tinda-backup`)
- Export a single portable `*.tinda-backup` file (Settings → Database & backups) that carries the **entire store**: products, units, stock/batches, purchases, sales, payments, refunds, held sales, customers, credit ledger, expenses, shifts, cash movements/counts, Z-reads, audit, users, and settings.
- Import the same file on Windows or Android (even a store that started on the other platform), with checksum verification, unsupported-field reporting, and a safety backup created automatically before any restore.
- Pure shared module: identical format logic on both apps.

### 2. Refund-aware Estimated Profit
- Profit now accounts for refunds everywhere (Dashboard, Sales Report, cashier report):
  `profit = (sales − refunds) − (cost − refunded cost)`.
- A fully refunded sale shows **zero** profit instead of keeping the refunded amount counted; partial refunds reduce profit proportionally; sale-level discounts are netted exactly once (no double deduction).

### 3. Withdrawal notes visible in Stock History
- Notes entered on a withdrawal/restock now appear in the Stock History list (Reason row), e.g. `TAKEN — catering for Friday`.

### 4. Reset Database reliability (Android)
- Reset now actually requires typing **RESET** (was silently mismatched with the confirmation UI).
- The verified safety backup and all previously saved backups are **preserved** after a reset or Start New Store.
- The app reloads into first-time setup after a reset instead of leaving a stale screen.

### 5. Receipt footer & layout alignment (58mm and 80mm)
- Receipt layout logic centralized in the shared receipt module — identical output across Windows and Android.
- Fixes misaligned receipt footer ("THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX" + "Thanks for Shopping with Us!") and column drift on 58mm and 80mm.
- Denominator breakdown, negative amounts (-₱), status badges, and section headers render consistently. **Preview == print** on both widths.

## QA

- Windows: 260/260 tests pass, `tsc` typecheck 0 errors, ESLint clean, production build passes.
- Android: 91/91 tests pass, production (release-signed) APK builds.
- Shared receipt module is byte-identical across both apps (diff = empty).

## Assets

- `TindaPOS-Setup-1.0.19.exe` (Setup installer + blockmap + latest.yml + Windows updater)
- `TindaPOS-Portable-1.0.19.exe` (Portable edition, no install)
- `TindaPOS-User-Guide.pdf` (v1.0.19)
- `SHA256SUMS-RC.txt` (verify all assets)