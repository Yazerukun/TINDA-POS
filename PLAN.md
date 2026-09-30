# PLAN.md — TINDA POS v1.0.43: Store Petty Cash Out, Z-Read Reconciliation & True Net Profit

> Task planning artifact. Governed by strict non-destructive upgrade invariants and zero-data-loss architecture.
> Target Release: TINDA POS v1.0.43 (Phase 1 Expansion)

## Non-Negotiable Invariants
1. **Zero Data Corruption:** Never touch, truncate, or overwrite existing user SQLite databases (`tindapos.db`), customer utang records, products, or transactions.
2. **100% Cryptographic VIP Pro Preservation:** Never break existing `tinda_license.json` or machine bindings. All existing VIP Pro customers continue with 100% unlocked access.
3. **Additive-Only Database Migration:** SQLite Migration 10 uses only `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ADD COLUMN`.
4. **Zero Counter Paralysis:** Checkout, selling, barcode scanning, and payments never block or freeze.

---

## Scope of Work (Phase 1)

1. **Database Schema & Storage (Migration 10):**
   - Verify/Ensure `store_expenses` table exists with category, amount in centavos, note, shift_id, user_id, timestamp.
   - Leverage existing `shifts.cash_expenses_c` and `cash_movements` table.
2. **Cash Drawer Balancing (Z-Read):**
   - Ensure expected cash formula accounts for recorded cash expenses:
     `expected_cash_c = starting_cash_c + cash_sales_c + utang_payments_cash_c - refund_cash_c - cash_expenses_c`.
3. **POS Quick Cash Out Action:**
   - Dedicated UI modal / button on POS screen for recording Petty Cash Out (e.g., Ice, Plastic Bags, Helper Wage, Kuryente, Freight).
   - Instant auditory and visual feedback.
4. **Reports & Net Profit Analytics:**
   - Add "Store Expenses" and "True Net Profit" (`Gross Profit - Store Expenses`) to Reports and Z-Read printouts/summaries.
5. **Quality Assurance & Master Document Sync:**
   - Comprehensive Vitest unit tests covering expense logging, Z-Read variance calculation, and migration safety.
   - Sync `SYSTEM_MASTER.md` Section 22.

---

## Milestones
- [x] **M1: Backend Repository & Migration Verification** — Verified SQLite schema and additive data safety for store expenses and shift cash movement tracking.
- [x] **M2: Cashier Shift Z-Read Reconciliation Engine** — Updated Z-Read expected cash formula and IPC handler to automatically balance against cashier expenses without permissions blocking.
- [x] **M3: POS Cash Out / Expense UI & Hotkey** — Implemented clean, compact `QuickExpenseModal` with category presets, peso amount input, audio feedback, and `F7` hotkey in `POS.tsx`.
- [x] **M4: Reports & True Net Profit Dashboard** — Added operating expenses and True Net Profit (`Gross Profit - Expenses`) metric to Dashboard and Reports.
- [x] **M5: Automated Vitest Test Suite** — Added `petty-cash-profit.test.ts`. 100% pass across all 51 test suites (340/340 tests).
- [x] **M6: Verification & Master Document Finalization** — Codified strict Non-Destructive Update Invariants (Rule #7 & #8) and Section 22 in `SYSTEM_MASTER.md`, updated `USER-MANUAL.md`.
