# ATLAS BRAIN MEMORY LEDGER (AUTO-UPDATED)

## [PROJECT IDENTITY & CURRENT STABLE]
- **Project Name:** TINDA POS Desktop (Master Edition)
- **Current Version:** `v2.2.5 (VIP Store Use & Operating Expense Edition)`
- **Platform Stack:** Electron 44 + React 19 + TypeScript 5+ + Tailwind CSS + Better-SQLite3 + Zustand + Vite 8 + Vitest 4
- **Release Repository:** `https://github.com/Yazerukun/TINDA-POS`
- **Source Repository:** `https://github.com/Yazerukun/TINDA-POS-Source`

## [PERMANENT INVARIANTS & LOCKED BOSS PREFERENCES]
1. **Rule #11 (Mandatory Auto Version Bump):** Always increment version across all 6 targets on every release (`source/package.json`, `PosToolsModal.tsx`, `publish_patch.mjs`, `README.md`, `GEMINI.md`, `docs/RELEASE-STATE.md`).
2. **Rule #14 (Zero Floating-Point Error):** All currency strictly computed in integer centavos (`_c`), zero math errors.
3. **Rule #15 / Rule #18 (Mandatory Full Windows Build on Every Update):** Every update cycle (v2.2.4, v2.2.5, etc.) MUST ALWAYS compile and publish the Full Windows Setup and Portable executables (`TindaPOS-Setup-*.exe` and `TindaPOS-Portable-*.exe` ~111 MB) alongside the in-app hot patch. Never release a patch alone.
4. **F9 Exclusivity:** `F9` is 100% dedicated to Cash Checkout & tender refocus in POS; Notification Drawer is toggled exclusively via `Ctrl+B / Cmd+B`.
5. **E-Wallet Daily Reconciliation:** Audit Sheet Expected Cash is permanently locked to Today's Daily Target: Float + POS Net Cash + E-Wallet Net Delta.
6. **Subagent Protocol:** ATLAS must always load `.agents/dr_*.md` files (and specifically `dr_aegis.md` for QA verification) before executing any code changes.

## [CORE DATABASE SCHEMA]
- `products`: id, name, sku, barcode, category, cost_c, price_c, stock, min_stock, unit, allow_decimal, is_active.
- `inventory_movements`: id, product_id, quantity_before, quantity_change, quantity_after, unit, movement_type, reason, reference, user_id, source, supplier_id, unit_cost_c, receiving_notes.
- `expenses`: id, category_id, amount_c, expense_date, description, reference, notes, user_id, created_at.
- `expense_categories`: id, name, is_system, created_at.
- `ewallet_transactions`: id, shift_id, user_id, channel, type, amount_c, fee_c, reference_no, created_at.
- `ewallet_audits`: id, shift_id, user_id, business_date, expected_cash_c, actual_cash_c, denominations_json, starting_gcash_c, expected_gcash_c, actual_gcash_c, starting_maya_c, expected_maya_c, actual_maya_c, total_fees_c, created_at.

## [FEATURE COMPLETED: STORE USE / OPERATING EXPENSE STOCK DEDUCTION]
- **Status:** 100% Implemented & Verified in Typecheck and Vitest.
- **Double-Entry Ledger Architecture (Dr. Vault & Dr. Oracle):**
  - Deducts item quantity from `products.stock` at **Landed Cost Price** (`purchase_cost_c`), NOT retail selling price.
  - Automatically records an atomic entry into `expenses` under system category `Store Use / Internal Consumption`.
  - Transaction integrity: `inventory_movements` logs movement type `STORE_USE` with reference format `SU-YYYYMMDD-XXXX`.
  - If a product has ₱0.00 cost price, UI warns the user and prompts for approximate purchase cost so OPEX calculations are never distorted.
- **Ergonomics & Fast Action UI (Dr. Kronos):**
  - Added `Store Use` action button in `Inventory.tsx` (top bar, table rows, and grid cards) and in `Expenses.tsx` ("Store Use (From Stock)").
  - Component: `StoreUseModal.tsx` with auto-focus barcode scanner, quick purpose chips (`Store Repair & Maintenance`, `Counter & Shelving Build`, etc.), and live OPEX calculation card.
- **Anti-Kupit Security & Retail Auditing (Dr. Aegis):**
  - Mandatory purpose/reason validation.
  - Manager Authorization PIN check if performed by cashier or configured.
- **Thermal Receipt & Audio Confirmation (Dr. Matrix & Dr. Echo):**
  - Formatter `formatStoreUseSlipLines` in `receiptHtml.ts` generating 58mm/80mm store use vouchers with sign-off blanks (`Requested: ___`, `Approved: ___`).
  - Audio chime (`playScanSuccess`) confirms deduction.

## [EXECUTABLE SUBAGENT DISPATCHER]
- **Script:** `phd_swarm.sh` created & executable (+x).
- **Mandatory 3-Step Protocol:** Every turn must run `./phd_swarm.sh <agent> "<task>"`, apply changes, then run `./phd_swarm.sh aegis "verify changes"`.
- **Audit Logging:** Real-time log tracking in `.agents/swarm_execution.log`.
