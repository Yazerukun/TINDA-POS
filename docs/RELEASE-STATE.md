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
089a570ae5e0a2e56511066579fdf18888e98087

CURRENT STAGE:
07 WINE QA — pending

LAST UPDATED:
2026-09-08 Asia/Hong_Kong

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
[ ] 07 WINE QA
[ ] 08 SOFTWARE UPDATER QA
[ ] 09 OWNER WINDOWS SPOT-CHECK
[ ] 10 FINAL RELEASE REVIEW
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
- Source: 089a570ae5e0a2e56511066579fdf18888e98087
- Product/App/File versions: TINDA POS / 1.0.5 / 1.0.5.0
- Native module: only better-sqlite3 win32-x64 prebuild packaged
- Provider: github / Yazerukun / TINDA-POS; no QA URL shipped

UPDATER:
- From: v1.0.4
- To: local v1.0.5 RC
- autoUpdater initialized: PENDING
- Detection: PENDING
- Download: PENDING
- Long download: PENDING
- Interruption: PENDING
- Retry: PENDING
- Safety backup: PENDING
- Restart & Install: PENDING
- Relaunch: PENDING
- Portable staging: PENDING

OWNER WINDOWS SPOT-CHECK:
- Required: NO under current scope because updater/installer behavior is unchanged; revise to REQUIRED if that changes.
- Result: N/A unless scope changes or owner requests it.

BLOCKERS:
- None through Stage 06.

NEXT REQUIRED ACTION:
- Run Setup and Portable Wine QA against the canonical v1.0.5 RC artifacts.

HISTORICAL UPDATER EXCEPTION:
- v1.0.3 detects updates but cannot complete automatic installed updates because of incompatible ESM/CommonJS `electron-updater` interop.
- Supported one-time path: v1.0.3 -> manual Setup install -> v1.0.4.
- Do not alter or silently replace historical v1.0.3 assets.
- v1.0.4 remains the fixed updater baseline.
