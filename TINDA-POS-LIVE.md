# TINDA POS LIVE

> Permanent project scratchpad — update this before and after every TINDA POS work session.

## Current release

- Version: **1.0.54 (LOCAL BUILD CANDIDATE)**
- Status: Phase 7 User Management & Multi-Account Login System completed. Flexible case-insensitive login by username/full_name, target-aware PIN login, unique PIN enforcement, admin password reset, public user directory, deactivation guardrails, and 1-tap cashier chips on Login screen.
- Tag: `v1.0.54`
- Application source: `source/`

## Latest completed work (v1.0.54 — Phase 7)

- **Flexible & Case-Insensitive Auth Matching**: Supports login with either username or full display name, case-insensitively (`LOWER(u.username) = LOWER(?) OR LOWER(u.full_name) = LOWER(?)`).
- **Target-Aware PIN & Unique PIN Enforcement**: Added `targetUserId` support to `loginPin()` to verify directly against the selected cashier profile. Added unique PIN validation to prevent duplicate PIN collisions.
- **Admin Password Reset & Public Directory**: Exposed `auth:adminResetPassword` protected by `users:manage` permission, and `auth:publicUsers` safe directory for profile chips.
- **Settings USERS Tab Enhancements**: Added Show/Hide Password (`👁️`) toggles, Confirm Password verification, in-modal password/PIN modification, dedicated Reset Password action, and user deactivation guardrails (protecting self and sole admin).
- **1-Tap Cashier Login**: Added quick-select user chips on `Login.tsx` with auto-switch to PIN mode and instant targeting.
- **Test Suite**: Added `user-management.test.ts` (18 tests). Full suite: 61/61 test files, 401/401 tests passing. Clean production build verified.

## Verification status

- [x] TypeScript typecheck (Node & Web: 0 errors)
- [x] Automated tests — 61/61 suites, 401/401 passed
- [x] Production build (`electron-vite build` passed)

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
- 2026-10-04 — **v1.0.54 Phase 7 Bulletproof User Management & Multi-Account Login System completed.** Implemented case-insensitive auth matching by username OR full_name (`LOWER(...) = LOWER(?)`), target-aware PIN login (`loginPin(pin, targetUserId?)`), active PIN collision prevention (`checkPinUniqueness`), admin password reset (`auth:adminResetPassword`), and public user directory for cashier profile chips (`auth:publicUsers`). Revamped `Settings.tsx` USERS tab with Show/Hide Password (`👁️`), confirm password matching, in-modal password/PIN update, dedicated reset password modal, and self/sole admin deactivation protection. Enhanced `Login.tsx` with 1-tap cashier avatar chips for fast multi-staff switching with auto-PIN focus. Authored `user-management.test.ts` (18 unit/integration tests). All 61 test suites passing (401/401 tests), TypeScript 0 errors, and production build succeeded.
- 2026-10-04 — **Sidebar UX Overhaul & Grouping completed.** Re-structured the application sidebar from an unorganized flat list into 5 intuitive functional categories: `Cashier & Register`, `Stock & Operations`, `Customers & Suki`, `Records & Reports`, and `System & Guide`. Added glowing brand logo with live pulse dot, permission-aware section filtering (no empty section headers for restricted roles), active route gradient with emerald left accent border, compact dual-button tool bar for Sales Monitor & Help Guide, and a polished staff profile card with quick-logout button. Verified 0 type errors, 61/61 test suites (401/401 tests) passing, and production build green.

