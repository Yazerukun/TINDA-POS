# TINDA POS LIVE

> Permanent project scratchpad — update this before and after every TINDA POS work session.

## Current release

- Version: **1.0.2**
- Status: Phase 4 Windows QA complete — ready for Phase 5 (commit/tag/release)
- Repository root: this directory
- Application source: `source/`
- Windows installers: `installers/`

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
