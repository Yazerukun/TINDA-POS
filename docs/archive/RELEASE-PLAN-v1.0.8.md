# RELEASE PLAN — TINDA POS v1.0.8

CURRENT STABLE: v1.0.7 (published, GitHub Latest, verified 2026-09-12)
TARGET: v1.0.8
RELEASE TYPE: PATCH
BRANCH: v1.0.8-dev (create only after owner approves this plan)

## 1. NON-NEGOTIABLE RULE (owner-specified)

v1.0.8 MUST preserve every working feature and behavior from **v1.0.6** and **v1.0.7**
plus the new v1.0.8 fixes/features.

```
FEATURES(v1.0.8) = FEATURES(v1.0.6) + FEATURES(v1.0.7) + v1.0.8 USER FEEDBACK + BUG FIXES
```

NO EXISTING FEATURE MAY DISAPPEAR, BREAK, RESET, OR SILENTLY CHANGE.

## 2. Features / user feedback (v1.0.8 scope)

Add ONLY:

1. **Low Stock threshold fix**
2. **Shift numbering**
3. **Withdrawal / Transfer workflow**

Do NOT rewrite unrelated stable modules.

## 3. Bug fixes

- Low Stock threshold behavior — exact defect must be identified and recorded during
  Stage 02 analysis before any code change (candidates already known:
  `lowStockProducts` threshold-0 handling, Dashboard/Reports/POS threshold
  comparisons, nullable threshold handling; confirm before fixing).

## 4. Declarations

- UPDATER CHANGES: NO (avoid unless strictly necessary; v1.0.7 updater is the proven baseline)
- DATABASE CHANGES: YES — additive, non-destructive migrations only (recorded below)
- PRINTER CHANGES: NO (v1.0.7 Cash Count Print / Preview / History Reprint must stay intact)
- DOCUMENTATION CHANGES: YES — `docs/USER-MANUAL.md`, User Guide PDF, release notes

## 5. Preserve all v1.0.6 features

POS/SALES — product search; cart; add/minus/remove/clear; checkout; discounts; cash;
GCash; Maya; split payment; receipt printing; retry/manual print.
INVENTORY — product management; categories; search/filter; restock; stock receiving;
CSV product import; realtime inventory refresh; low stock; out of stock; tingi/multi-unit.
CUSTOMERS/UTANG — records; credit limits; add utang; partial/full payment; ledger/history.
SUPPLIERS. EXPENSES.
REPORTS — X-Read; Z-Read; Z-Read History.
CASH COUNT — expected cash; actual cash; difference; BALANCED/OVER/SHORT;
denomination breakdown; history.
RECEIPT/PRINTING — custom receipt title; show/hide TINDA POS title; 58mm; 80mm;
printer detection; test print; auto print.
BACKUP/RESTORE. PORTABLE DATA MODE. ROLES/PERMISSIONS. SOFTWARE UPDATE.

## 6. Preserve all v1.0.7 features

Empty Inventory → Add Product; Add Product; Inventory Edit fix; Selling Units
preserved; "Unit name required" false-error fix; friendly blank-unit validation;
Adjust Stock; Stock History; product_name snapshot; realtime POS stock refresh;
reserved vs available stock; Cash Count Print; Print Preview; Cash Count History
Reprint; historical Cash Count uses saved values; friendly no-printer handling;
v1.0.6 → v1.0.7 updater improvements/fixes; all v1.0.7 migrations.

## 7. Regression rules

- **Low Stock fix** must not break Inventory filters or POS stock.
- **Shift numbering** must not break X-Read, Z-Read, Cash Count, sales, login,
  or open-shift resume.
- **Withdrawal/Transfer** must not alter sales revenue, payment totals, Cash Count,
  X/Z totals, or create fake sales.
- **Migration changes** must not lose existing data.
- **Updater changes** — avoid unless strictly necessary.

## 8. Full regression matrix (must verify before packaging v1.0.8)

[ ] Add Product
[ ] Edit Product
[ ] Selling Units preserved
[ ] Adjust Stock
[ ] Stock History
[ ] Stock Receiving
[ ] CSV Import
[ ] Low Stock
[ ] Out of Stock
[ ] Realtime Inventory/POS refresh
[ ] Cart reserve/available logic
[ ] Checkout single deduction
[ ] Failed checkout no deduction
[ ] Refund
[ ] Void
[ ] Tingi / Multi-unit
[ ] Customers
[ ] Utang
[ ] Partial Payment
[ ] Full Payment
[ ] Suppliers
[ ] Expenses
[ ] Cash
[ ] GCash
[ ] Maya
[ ] Split Payment
[ ] X-Read
[ ] Z-Read
[ ] Z-Read History
[ ] Cash Count
[ ] Cash Count History
[ ] Cash Count Print
[ ] Cash Count Preview
[ ] Cash Count History Reprint
[ ] Receipt Printing
[ ] 58mm
[ ] 80mm
[ ] Backup
[ ] Restore
[ ] Portable Data Mode
[ ] Roles/Permissions
[ ] Software Update

NEW v1.0.8:

[ ] Low Stock threshold change works
[ ] Shift numbering works
[ ] Open shift resumes correctly
[ ] Withdrawal Taken
[ ] Withdrawal Damaged
[ ] Withdrawal Expired
[ ] Forward/Transfer
[ ] Stock history records withdrawal
[ ] Financial totals unaffected

## 9. Database upgrade test

Test the real upgrade chain:

- v1.0.6 DB → v1.0.7 → v1.0.8
- v1.0.7 DB → v1.0.8

Verify preserved: products; product units; stock; movements; sales; customers;
utang; cash counts; shifts; settings; reports.
Run `PRAGMA integrity_check;` — expected: `ok`.

Migration plan (additive):
- Shift numbering: add sequential human-readable shift number (e.g. `shift_no`,
  backfilled in open/id order on migration); displayed in POS/Cash Count/X-Z without
  changing existing shift identity.
- Withdrawal/Transfer: record via `inventory_movements` (new `movement_type` values:
  e.g. WITHDRAWAL (taken) / DAMAGE / EXPIRATION / FORWARD) + reason/reference; no new
  financial tables, no sales rows. Exact columns confirmed in Stage 02 design.
- Low Stock fix: pure logic/UI fix; if a schema tweak is required it stays additive.

## 10. Automated QA

Run the full suite. Previously passing tests must stay PASS. Any old
v1.0.6/v1.0.7 test that fails is a REGRESSION — do not delete/disable tests to make
CI green.

Required:
- Typecheck = PASS
- Lint = PASS
- Full Tests = PASS
- Migration Tests = PASS
- Production Build = PASS
- `git diff --check` = PASS

## 11. Windows upgrade acceptance

Before release:

PUBLIC/CLEAN v1.0.7 → exact frozen v1.0.8 RC → detect → download → safety backup →
Restart & Install → relaunch → v1.0.8 → data preserved → `PRAGMA integrity_check = ok`.

Also smoke-test old v1.0.7 features after the upgrade.

## 12. Final release rule

Report **`v1.0.8 = FULL v1.0.6 + v1.0.7 FEATURE SUPERSET — PASS`** ONLY if:
- no old feature is missing
- no old workflow is broken
- all new feedback passes
- database preserved
- updater acceptance passes

Otherwise: **BLOCKED — REGRESSION: <exact feature>**
NO PUSH. NO TAG. NO RELEASE.

## 13. Out of scope

Unrelated redesign; inventory redesign; online/cloud functionality; new payment
methods; accounting rewrite; unnecessary updater rewrite; unrelated reports;
any change to a stable v1.0.6/v1.0.7 behavior not listed above.

## 14. Required stages (standard TINDA POS workflow)

01 PLAN (this document, awaiting owner approval) → 02 DEVELOPMENT → 03 DATABASE QA →
04 AUTOMATED QA → 05 LOCAL RC FREEZE → 06 WINDOWS RC BUILD → 07 WINDOWS VM FEATURE QA
→ 08 PRE-RELEASE UPDATER QA → 09 FINAL RELEASE REVIEW → 10 OWNER APPROVAL →
11 PUBLISH → 12 PRODUCTION UPDATER QA → 13 RELEASE COMPLETE.

Publication (push/tag/release/Latest) stays PROHIBITED until the owner explicitly
approves after the final review.