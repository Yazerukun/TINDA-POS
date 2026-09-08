# TINDA POS RELEASE STATE

CURRENT STABLE:
v1.0.4

TARGET VERSION:
v1.0.5

RELEASE TYPE:
PATCH

BRANCH:
v1.0.5-dev

CURRENT COMMIT:
089a570 (v1.0.5 source RC)

RC COMMIT:
089a570ed8606840399d94ffa5d5af45ab820021

CURRENT STAGE:
11 OWNER APPROVAL — waiting for explicit "Publish v1.0.5 Stable"

LAST UPDATED:
2026-09-09 Asia/Hong_Kong

SCOPE:
- Inventory Stock Receiving history/view over legitimate existing receiving movements.
- Realtime available stock in POS derived from database stock minus current cart quantity.
- Automated tests and beginner-friendly User Manual updates.
- Database migration only if genuinely required.
- Release/update metadata only when the RC stage is reached.

OUT OF SCOPE:
- Unrelated UI redesign, accounting changes, or pricing changes.
- New payment methods or unrelated reports.
- Unrelated inventory features.
- Pushes, tags, GitHub releases, uploads, or Latest changes without explicit owner approval after Stage 10.

RELEASE PLAN:
- Features: Stock Receiving; realtime cart stock availability.
- Bug fixes: Prevent misleading stock display and oversell while maintaining single post-checkout DB deduction.
- User feedback: Inventory receiving visibility and instant cart-aware POS availability.
- Updater changes: NO
- Database changes: TBD after architecture inspection; avoid if existing movement data is sufficient.
- Printer changes: NO
- Documentation changes: YES

STAGE STATUS:

[x] 01 PLAN
[x] 02 DEVELOPMENT
[x] 03 DATABASE QA
[x] 04 AUTOMATED QA
[x] 05 RC FREEZE
[x] 06 WINDOWS RC BUILD
[x] 07 WINE QA
[x] 08 SOFTWARE UPDATER QA
[x] 09 OWNER WINDOWS SPOT-CHECK (N/A — updater/installer unchanged)
[x] 10 FINAL RELEASE REVIEW
[ ] 11 OWNER APPROVAL
[ ] 12 GITHUB RELEASE
[ ] 13 POST-RELEASE VERIFY

AUTOMATED QA:
- Typecheck: PASS
- Lint: PASS (0 errors, 0 warnings)
- Tests: 18 test files / 134 total
- Passed: 134
- Failed: 0
- Build: PASS
- PDF: PASS — v1.0.5, 15 pages, 108097 bytes
- git diff --check: PASS

DATABASE:
- Migration: PASS — additive schema v3 structured receiving metadata; no stock rewrite
- Previous DB tested: PASS — copied v1.0.4 acceptance database migrated from schema 2 to 3
- integrity_check: ok

WINDOWS RC:
- Setup: PASS — TindaPOS-Setup-1.0.5.exe, 109480871 bytes
- Portable: PASS — TindaPOS-Portable-1.0.5.exe, 109250406 bytes
- blockmap: PASS — TindaPOS-Setup-1.0.5.exe.blockmap, same canonical build
- latest.yml: PASS — version/path/size/SHA-512 match Setup
- PDF: PASS — v1.0.5, 15 pages
- hashes: PASS — SHA256SUMS-RC.txt verified
- Source: 089a570ed8606840399d94ffa5d5af45ab820021
- Product/App/File versions: TINDA POS / 1.0.5 / 1.0.5.0
- Native module: only better-sqlite3 win32-x64 prebuild packaged
- Provider: github / Yazerukun / TINDA-POS; no QA URL shipped

WINE QA (Stage 07):
- Overall: PASS — fresh isolated prefix, portable EXE ran with --remote-debugging-port=9470
- DB: migrations 1-3 applied, integrity_check ok, 18 sample products loaded
- Stock Receiving: PASS — restock -> receiving history realtime (no refresh): 3 RESTOCK + 17 INITIAL_STOCK = 20 rows; columns, summary, filters (source/search/clear), details modal verified
- Suppliers: PASS — ABC Trading created
- Cart stock availability: PASS — add (31/32), multi-add (29/32), max clamp 999->32, out-of-stock block, minus, remove, clear all restored
- Checkout single deduction: PASS — 3 Coke + 2 Royal; Coke 32->29, Royal 13->11 exactly once; TPOS-000001 total 36500
- Discounted checkout: PASS — TPOS-000002 subtotal 15000 discount 10000 total 5000
- Failed checkout (short payment): PASS — rejected "Payment is less than the total due."; DB unchanged, modal + cart retained
- Refund: PASS — REF-000001 of TPOS-000001; Coke 29->32, Royal 11->13 restored; status REFUNDED
- Void: PASS — TPOS-000002 marked VOIDED (reason stored); RETURN +2 restores Coke 30->32
- Multi-unit / stock-conflict: covered by automated tests (cartStock.test.ts); not reachable from card UI (cards add in default base unit)
- Caveat: live restock `reference` typed via CDP did not persist (React controlled-input automation artifact); repository-level test asserts reference round-trip (DR-00123); hand-verify once on Windows

UPDATER (Stage 08):
- From: v1.0.4
- To: local v1.0.5 RC
- Updater code unchanged since RC: PASS (empty git diff 089a570..HEAD for src/main/services; v1.0.4 interop fixes 7dc2d40/c666db6 in RC)
- Initialization regression gate: PASS — packaged main bundle uses require("electron-updater").autoUpdater (CJS) in getUpdater + restartAndInstall; vitest update suites included in 134/134
- autoUpdater initialized: PASS (bundle-level + unit)
- Detection: PASS (unit; live check path verified against real GitHub)
- Live check path (real): PASS — Settings > About > Software Update > Check for Updates: "Checking for updates…" -> Installed version v1.0.5 -> "Up to date" (last-checked persisted)
- Metadata gate: PASS — latest.yml version 1.0.5, path TindaPOS-Setup-1.0.5.exe, size 109480871, sha512 verified byte-for-byte against the Setup EXE; app-update.yml = provider github / Yazerukun / TINDA-POS; no localhost or QA URL in packaged app
- Download: PENDING (mocked transports in unit tests; full live cycle needs a public target — see limitation)
- Long download: PENDING (unit-simulated)
- Interruption: PENDING (unit-simulated)
- Retry: PENDING (unit-simulated)
- Safety backup: PASS live — Backup > Back Up Now -> "Backup created", file tindapos-2026-09-09-013517-990.db 352256 bytes, correct timestamp (same createBackupSync engine as updater BEFORE_UPDATE)
- Restart & Install: PENDING until target is public (post-approval)
- Relaunch: PENDING
- Portable staging: PENDING (unit-tested; PORTABLE_EXECUTABLE_DIR not propagated under Wine — v1.0.4 documented limitation, unchanged)
- Accepted limitation (same as v1.0.4): a complete production updater replacement cycle cannot run until v1.0.5 is a public stable release; the app's strict official-URL guards intentionally block localhost mocks. NOT silently waived — recorded here.
- CORRECTED: RC commit full-hash was mistyped as 089a570ae...880987; real is 089a570ed...820021 (fixed in RELEASE-STATE.md and RC-SOURCE-COMMIT.txt)

OWNER WINDOWS SPOT-CHECK:
- Required: NO under current scope because updater/installer behavior is unchanged; revise to REQUIRED if that changes.
- Result: N/A unless scope changes or owner requests it.

FINAL RELEASE REVIEW (Stage 10):
- Source: RC commit 089a570ed8606840399d94ffa5d5af45ab820021 (app code; HEAD docs commits do not touch app source); working tree has only intentionally-uncommitted release artifacts
- QA: typecheck/lint/tests/build/PDF PASS (134/134, Stage 04); Wine QA PASS (Stage 07)
- Database: migration v3 additive PASS; previous DB preserved; integrity_check ok
- Updater: gates PASS (init CJS, metadata, live check, safety backup); full replacement cycle deferred to post-publication (recorded)
- Artifacts: Setup, Portable, blockmap, latest.yml, PDF present; SHA256SUMS-RC.txt verifies OK (6 files incl. RC-SOURCE-COMMIT.txt)
- Security: no secrets, QA DB, QA updater URL, temp, or debug files in packaged app (scanned)
- Documentation: USER-MANUAL + RELEASE_NOTES_v1.0.5 + User Guide PDF v1.0.5 current
- Result: PASS

BLOCKERS:
- None through Stage 08. Note: complete production updater replacement cycle is deferred until v1.0.5 is public (post-approval), exactly as recorded for v1.0.4.

NEXT REQUIRED ACTION:
- STOP — awaiting owner approval: "Publish v1.0.5 Stable"

HISTORICAL UPDATER EXCEPTION:
- v1.0.3 detects updates but cannot complete automatic installed updates because of incompatible ESM/CommonJS `electron-updater` interop.
- Supported one-time path: v1.0.3 -> manual Setup install -> v1.0.4.
- Do not alter or silently replace historical v1.0.3 assets.
- v1.0.4 remains the fixed updater baseline.
