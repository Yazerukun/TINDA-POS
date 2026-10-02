# TINDA POS LIVE

> Permanent project scratchpad — update this before and after every TINDA POS work session.

---

## 🚀 Current Release

- **Published Latest:** v1.0.46 — Utang Customer Workflow Fix, Decimal Checkout Validation & Ledger Stabilization
- **GitHub:** https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.46
- **Local Dev Source:** `D:\TINDA-POS-v1.0.7-dev\source\source\`
- **Status:** Stable Release. Built, Packaged, Verified & Published to GitHub.

---

## 🗺️ Roadmap

### ✅ v1.0.46 — COMPLETED (Utang & Decimal Checkout Fix):
- 🔍 **Root Cause of Checkout Failure ("dili maka checkout")**:
  - In `src/main/validation/schemas.ts`, `validateCheckout` was invoking `isPositiveInt(x.qty, 'Quantity')` and `isPositiveInt(x.qty_base, 'Quantity (base)')`.
  - When weighing fractional items (e.g. `1.5 kg`, `0.75 kg`, `2.24 kg`), `isPositiveInt` threw `Error: Quantity must be a whole number.`, terminating the IPC checkout transaction before saving.
  - **Fix**: Created `isPositiveNumber(v, label)` supporting float numbers, updating both `qty` and `qty_base`.
- 🔍 **Root Cause of Utang Disappearance ("nawala daw ang utang")**:
  - 1. In `CartPanel` (`POS.tsx`), the customer row only rendered a generic `<User /> Select (utang)` placeholder even after picking a customer, making it appear as though the customer selection was lost.
  - 2. In `CheckoutModal`, choosing `UTANG` without an active customer previously resulted in a blocked flow with `A customer is required for utang.` error and no button to pick one.
  - 3. Because earlier checkout attempts crashed on decimal weights, transactions were never written to SQLite `sales` or `credit_ledger`, leaving customer balances at `₱0.00` and the Utang screen looking empty.
  - **Fix**:
    - Updated `usePosCart` Zustand store with `customer_name` state alongside `customer_id`.
    - Added selected customer badge with clear button (`✕`) in `CartPanel`.
    - Added dedicated Customer selection prompt & inline picker trigger inside `CheckoutModal` when `UTANG` payment is chosen.
    - Updated `Utang.tsx` with top-priority sorting for customers with active balances (`balance_c > 0`) and quick filter tabs ("All Customers" vs "With Utang Only").
- 🧪 **Verification**:
  - 147/147 passing tests across 22 suites in Vitest.
  - Added dedicated unit tests in `src/tests/weighable-kilo-checkout.test.ts` for decimal validation and utang credit ledger updates.
- 🛡️ **Zero Data Loss Guarantee**: Local SQLite database (`tindapos.db`), existing customers (Juan, Maria, Pedro), and VIP licenses remain 100% intact.

### Release Checksums (v1.0.46)
- `TindaPOS-Setup-1.0.46.exe`: `0dcfb333eff44843ca5ee3c1bbb2d45f20a62f2aee004d823052dea65b33d55a`
- `TindaPOS-Portable-1.0.46.exe`: `1e022cccd0a4a9acc5d2f5ca781998c006cb464bd609b0006b9855ab939e10fb`
- `TindaPOS-Setup-1.0.46.exe.blockmap`: `1ee43c3c4acfc7114a3bb398a1f6fa0dd11a3d7a87219730a87c3cea02e308d7`
- `latest.yml`: `3bc2455434ff9364ae19dfc046626f4d13d79ecc98c59bebd057f0b4dd3a1503`
- `TindaPOS-User-Guide.pdf`: `ec34a815be6ae539ce2dc4517a93d0955b57d598d2c4107cc56b526c25ccabac`

### ✅ v1.0.45 — Sales Monitor Display, Weighable Kilo Checkout Fix & VIP Cloud Dashboard:
- Dedicated Sales Monitor & Customer Display (Secondary Screen)
- Initial weighable kilo inventory adjustment
- Executive Owner Cloud Dashboard (VIP Pro Feature)

### 🔲 Backlog
- Multi-branch / franchise management
- Weighable product cloud tracking
- Receipt image sharing improvements

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Desktop App | Electron + React + TypeScript |
| Database | SQLite (better-sqlite3) |
| Sync Backend | Cloudflare Workers + Hono + D1 |
| Dashboard | React + Vite → GitHub Pages |
| Build | pnpm + electron-builder |
| Testing | Vitest |

---

## 📁 Key Paths

| What | Where |
|---|---|
| Source code | `D:\TINDA-POS-v1.0.7-dev\source\source\` |
| DB schema | `src/main/database/migrations.ts` |
| Shared types | `src/shared/types.ts` |
| Settings repo | `src/main/repositories/settings.ts` |
| IPC handlers | `src/main/ipc/index.ts` |
| Renderer pages | `src/renderer/src/pages/` |
| Android variant | `D:\TINDA-POS-Android-Free\` |

---

## 📓 Session Notes

- **2026-10-02** — Planned v1.0.45 Owner Cloud Dashboard (VIP Pro feature). Full spec written. Separate repo `tinda-sync`. Phase 1 (Cloudflare Worker) → Phase 2 (TINDA-POS sync + VIP license) → Phase 3 (GitHub Pages dashboard). Approved by Boss. Awaiting execution start.
- **2026-09-30** — v1.0.40 Fix: resolved startup race condition and EADDRINUSE port collision bug.
- **2026-09-22** — v1.0.36 released: Partial Refund, PWD/Senior 20% discount, 2-level Subcategory.
- **2026-09-25** — v1.0.28 auto-update fix (latest.yml + SHA-512), CI/CD pipeline implemented.


## Latest completed work

- Updated the Settings → About donation card to **Maya**.
- Added “Buy me a coffee”, Maya logo, shimmer, green glow, logo motion, hover, and click feedback.
- Added reduced-motion support.
- Updated the User Guide PDF and PHCorner post donation details.
- Rebuilt Setup and Portable v1.0.1 and updated SHA-256 checksums.

## Verification status

- [x] TypeScript typecheck
- [x] Automated tests — 33/33 passed
- [x] Production renderer build
- [x] Windows Setup build
- [x] Windows Portable build
- [x] SHA-256 verification
- [x] User Guide contains `Maya: 0991 225 5156`
- [x] PHCorner post contains `Maya: 0991 225 5156`
- [x] Full packaged-app GUI smoke test of all 11 main screens
- [x] Final packaged database integrity check

## Existing published v1.0.1 release files

- `installers/TindaPOS-Setup-1.0.1.exe`
- `installers/TindaPOS-Portable-1.0.1.exe`
- `installers/TindaPOS-User-Guide.pdf`
- `installers/PHCorner-Post.txt`
- `installers/SHA256SUMS.txt`

## v1.0.2 release plan

Scope finalized from the fixes already completed after the `v1.0.1` tag:

- [x] Verify real internet connectivity instead of relying only on browser online state.
- [x] Fix category dropdown creation and refresh behavior.
- [x] Add persistent POS hold, resume, and held-sale deletion.
- [x] Stabilize database backup restore and protected reset flows.
- [x] Complete installed-build GUI smoke testing and database integrity verification.
- [x] Resolve the Vite native-config warning.
- [x] Bump application and documentation versions to `1.0.2`.
- [x] Write v1.0.2 release notes and update README/manual/PHCorner copy.
- [x] Re-run lint, typecheck, tests, and production build.
- [x] Build fresh Windows Setup and Portable installers.
- [x] Perform clean-install, upgrade-data, backup/restore, hold/resume, and reset GUI checks (Phase 4 Windows QA).
- [x] Regenerate and verify SHA-256 checksums.
- [ ] Commit, tag `v1.0.2`, push, and publish matching GitHub release assets (Phase 5 — after report review).

## Session notes

- 2026-09-03 — Reconstructed interrupted v1.0.1 work and created this live scratchpad.
- 2026-09-05 — Completed final installed-build GUI smoke test (Dashboard, POS, Inventory, Customers, Utang, Expenses, Suppliers, Transactions, Reports, Backup, and Settings); verified checkout data and database integrity.
- 2026-09-05 — Audited the v1.0.2 baseline: clean repository, no open GitHub issues or application TODO/FIXME markers, lint/typecheck passed, 7 test files and 33 tests passed, and production build passed. Finalized the v1.0.2 release scope and checklist.
- 2026-09-05 — Phase 4 Windows QA completed: v1.0.1 baseline (TINDA UPGRADE TEST profile) upgraded to v1.0.2 with full data preservation; held-sale created under v1.0.1 resumed/checked out under v1.0.2 (stock deducted exactly once); delete-held leaves stock untouched; backup/restore A→B→A verified with safety backup + auto-relaunch on installed build; invalid/corrupt backups rejected with active DB intact; Database Reset permission/confirmation/safety-backup/restore verified; offline simulation (dead proxy) — all core flows pass with OFFLINE READY indicator; core POS regression incl. sukli, GCash/Maya/split, credit limit, refund/void stock restoration, PIN login, reprint; Setup/Portable shared-data confirmed; uninstall preserves data, reinstall reopens it. Lint/typecheck/34 tests/build/PDF/git diff --check all PASS. Final folder installers/TINDA-POS-Windows-v1.0.2/ with SHA-256 verified. No commit/tag/push/release (deferred to Phase 5). Known minor: restore auto-relaunch does not survive the portable launcher (installed build relaunches fine; restore itself always completes safely); leftover empty .restore-*-db(-wal/-shm) sidecar files after restore; full-refund marks sale PARTIALLY_REFUNDED (stale snapshot check, pre-existing since v1.0.1); custom receipt header setting is stored/preserved but not printed on receipts (pre-existing v1.0.1 behavior).
- 2026-09-05 — Hotfix QA resume pass on Omarchy: found the real source repo (this root) and ran all source gates on the uncommitted hotfix working tree — lint PASS, typecheck PASS, 53/53 tests PASS (10 files), build PASS, docs:pdf PASS (byte drift is PDF metadata only; tracked PDF left unchanged), git diff --check PASS. Retried the Wine portable launch on the final-rebuild EXE (sha 581f06…) with an isolated prefix and detached `setsid` launch + CDP 9340: the earlier "NO RESPONSE" was the Wine process being killed with its parent shell, not a binary defect. Wine portable now verified: launch, render (Sign In → Dashboard), auth against the persisted QA store, SHARED data-mode persistence  (store HOTFIX SHARED QA), REFUNDED state (TPOS-000002) and REF-000001/REF-000002 rows persisted after relaunch, QA-50 stock = 9, DB integrity ok live and after clean close. Evidence and screenshots stored with the QA workspace outside this repo; reports updated to VERIFIED-ON-OMARCHY / RELEASE-GATED-ON-TARGET-ENV. Remaining before release: native Windows + printer + portable-mode-switch acceptance on a target environment.
- 2026-09-07 — **v1.0.4 feedback implementation resume (plan recovered from interrupted ChatGPT-5.6 session).** All 6 feedback items implemented in the uncommitted working tree on `v1.0.4-user-feedback`: (1) CSV product import (template/preview/validate/skip-update/rollback/opening-stock), (2) receipt heading — "Show TINDA POS App Name" toggle + Receipt Title (incl. Cases A–D + live preview), (3) X-Read (read-only) + Z-Read (immutable snapshot, duplicate-protected, history, print) with RBAC (Admin/Manager only finalize), (4) Restock modal with new-stock preview + multi-unit conversion + supplier/cost + movement history, (5) complete friendly Taglish User Manual (15-page PDF), (6) realtime stock via `inventory:changed` events → Inventory/POS/Dashboard auto-refresh (no polling). Migration v2 adds `z_reads`. **Gates: lint PASS, typecheck PASS, 15 files / 124 tests PASS, build PASS, docs:pdf PASS (15 pages), git diff --check PASS.**
- 2026-09-07 — **v1.0.4 local functional QA (Omarchy, CDP port 9333):** setup wizard → login → dashboard on QA STORE. Verified live: Restock modal (Current Stock → Quantity → Unit → **New Stock preview** `20 × 1 = 20` → `34 can`, saved, DB movement + stock 14→34, **inventory auto-refreshed with NO manual Refresh**); CSV import (invalid CSV correctly **blocked** with 3 valid/1 invalid preview; clean CSV → Total 3/Valid 3/Invalid 0 → imported, 3 products created with INITIAL_STOCK movements 50/100/12 + category/supplier auto-create, realtime appeared, count 18→21, integrity ok); Receipt settings (toggle Show TINDA POS OFF + Receipt Title `JUAN STORE` → live preview Case C no TINDA POS, save toast OK); X-Read renders full read-only report (Gross/Discounts/Refunds/Voids/Net/Cash/GCash/Maya/Utang/Expenses/Expected Cash/Transactions); Z-Read finalize (confirm overridden) → ZR-2026-000001 persisted, shift CLOSED, no data deleted (18 products/18 movements preserved), integrity ok. **Wine RC launch smoke:** packaged `win-unpacked/TindaPOS.exe` under Wine boots and renders Setup wizard (asar renderer + win32-x64 better-sqlite3 load). **Windows RC built via Wine:** `installers/TINDA-POS-Windows-v1.0.4/` = Setup 1.0.4 (sha f4404706…), Portable 1.0.4 (d4a5d846…), Setup blockmap, latest.yml(v1.0.4), User Guide PDF 15pp, SHA256SUMS, PHCorner post. EXE metadata verified File/Product Version 1.0.4. Better-sqlite3 win32-x64 prebuild in `app.asar.unpacked`. Icons use default Electron (pre-existing, `source/build/` is gitignored — same as v1.0.3).
- 2026-09-07 — **v1.0.4 deliberate non-actions:** NO git push, NO tag, NO GitHub release, NO uploads, NO updater/state changes. v1.0.3 remains public Latest. Changes remain uncommitted in the working tree (local commit allowed but deliberately not done — awaiting Ian's review). Native Windows + thermal-printer acceptance NOT yet tested (label in report). Next manual test steps for Ian: verify CSV/restock/XZ on a real Windows box + printer, then commit locally + CI-trigger native Windows QA before any release decision.
