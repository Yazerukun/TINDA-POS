# TINDA POS v1.0.20 Stable

Release target: `v1.0.20`
Updater gate: byte-identical firmware of v1.0.19's updater machinery (electron-updater + electron-builder + app-update.yml untouched in this release, allowing seamless auto-update from v1.0.19 to v1.0.20).

## What's new

### 1. Dashboard Semantic Color-Coding
- Financial figures on the PC Dashboard are now color-coded using semantic colors:
  - **Today's Net Sales:** Emerald Green (`text-emerald-400`, `bg-emerald-500/10`)
  - **Estimated Profit:** Teal / Green (`text-teal-400`, `bg-teal-500/10`)
  - **Outstanding Utang (Credit Due):** Rose Red (`text-rose-400`, `bg-rose-500/10`)
  - **Expenses:** Amber (`text-amber-400`, `bg-amber-500/10`)
- The currency symbol (`₱`) and the amount share the same semantic color.
- Contrast and visual hierarchy are maintained across light and dark themes without overly bright/neon colors.
- Zero changes to calculations or underlying database values.

### 2. Whole-Peso Unit Cost in Restock & Receiving
- Restock input now enforces whole-peso Unit Costs (e.g. ₱5, ₱10, ₱25 — no fractional centavos/bungkig like .10 or .20).
- Input is configured with `step="1"` and `min="0"`.
- Real-time inline validation alerts the user if a decimal is entered:
  *"Unit Cost must be a whole peso amount (e.g. ₱5, ₱10, ₱25 — no centavos)."*
- The "Save Restock" button is disabled when decimal values are present.
- Backend IPC validation enforces `cost_c % 100 === 0`.
- **Accounting & Data Integrity:** Existing historical records with fractional centavos are preserved as-is without silent modification or inventory costing corruption.

### 3. Receiving Details UI Alignment
- In the **Receiving Details** modal and **Stock Receiving** table:
  - Whole-peso unit costs are displayed cleanly (e.g., `₱5` instead of `₱5.00` or `₱5.20`).
  - Historical fractional centavos continue to display accurately with their exact centavos (e.g., `₱5.20`).
  - Numbers and monetary amounts use tabular monospace formatting (`font-mono tabular-nums`), ensuring that `Unit Cost ₱5` and `Total Cost ₱300` are perfectly aligned.

### 4. Transactions Expand Items Alignment
- In the **Transactions** page under **Expand items**:
  - The `Qty`, `Unit Price`, and `Subtotal` columns are now strictly aligned with defined column widths (`w-28`, `w-32`, `w-32`) and `table-fixed` layout.
  - Numbers and currency amounts use right-aligned monospace formatting (`font-mono tabular-nums text-right`), ensuring consistent vertical alignment across all transactions without jumping or overlapping.

## QA & Verification

- Vitest: **268/268 tests pass** (40 test files).
- TypeScript: `tsc` typecheck **0 errors**.
- Build: `npm run build` production bundle passes cleanly.
- Historical data preservation verified.
- Software updater compatibility verified 100%.

## Assets

- `TindaPOS-Setup-1.0.20.exe` (Windows installer + auto-update payload)
- `TindaPOS-Portable-1.0.20.exe` (Portable edition)
- `TindaPOS-User-Guide.pdf` (v1.0.20)
- `SHA256SUMS-RC.txt`
