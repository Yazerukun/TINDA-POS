# TINDA POS v1.0.22 Stable

Release target: `v1.0.22`
Updater gate: byte-identical firmware of updater machinery (electron-updater + electron-builder + app-update.yml untouched in this release, allowing seamless auto-update from v1.0.19, v1.0.20, and v1.0.21 to v1.0.22).

## What's new

### 1. Utang Module English Standardization
- Standardized all customer credit interface labels, tabs, status badges, and empty states to clean English:
  - **Filter Tabs:** `With Balance` (active credit), `Settled` (₱0.00 balance), and `All` (all accounts).
  - **Status Badges:** `SETTLED ✓` (Emerald Green pill for ₱0.00), `WITH BALANCE` (Amber pill for active credit), and `OVER LIMIT` (Rose Red pill for debt exceeding limit).
  - **Quick Stats:** `Total Outstanding Utang`, `With Balance` (pending collections), and `Settled` (fully paid accounts).
  - **Empty States:** Clear English guidance when there are no active debts, settled customers, or search results.

### 2. Responsive Table Auto-Adjustment Across All Screens
- Added responsive horizontal containment (`overflow-x-auto`) to both **Utang** and **Transactions** tables.
- Guarantees seamless display on any laptop screen (1366×768, 1280×800, 1440×900) and desktop display (1080p, 2K, 4K) without table squishing, clipped cells, or awkward text wrapping.

### 3. Strict Column Alignment (Utang & Transactions)
- **Utang Table:** Explicit proportional column widths (`Customer` flexible auto, `Credit Limit` `w-36 text-right`, `Balance` `w-36 text-right`, `Status` `w-36 text-center`, `Actions` `w-44 text-right pr-4`). Columns remain strictly aligned when switching tabs (`With Balance`, `Settled`, `All`) with no shifting.
- **Transactions Table:** Explicit column widths on parent table (`Receipt` `w-48`, `Date` `w-40`, `Cashier` `w-32`, `Customer` `min-w-[140px]`, `Total` `w-32 text-right font-mono tabular-nums`, `Status` `w-32 text-center`, `Actions` `w-32 text-right pr-4`).
- **Transactions Expanded Items:** Expanding transaction items no longer shifts parent table columns. Subtable now features a dedicated `<tfoot>` where `Discount` and `Total` are strictly aligned directly under the `Subtotal` column, with payment details cleanly placed on the left.

## QA & Verification

- Vitest: **268/268 tests pass** (40 test files).
- TypeScript: `tsc` typecheck **0 errors**.
- Build: `npm run build` production bundle passes cleanly.
- Database & accounting integrity: Zero changes to financial calculations or customer balances.
- Software updater compatibility verified 100%.

## Assets

- `TindaPOS-Setup-1.0.22.exe` (Windows installer + auto-update payload)
- `TindaPOS-Portable-1.0.22.exe` (Portable edition)
- `TindaPOS-User-Guide.pdf` (v1.0.22)
- `SHA256SUMS-v1.0.22.txt`
- `SHA256SUMS-RC.txt`
