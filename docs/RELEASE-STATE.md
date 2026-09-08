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
c8a1a4c (Stage 02 starting baseline)

RC COMMIT:
N/A — RC not frozen

CURRENT STAGE:
05 RC FREEZE — final audit and local commit in progress

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
[ ] 05 RC FREEZE — IN PROGRESS
[ ] 06 WINDOWS RC BUILD
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
- Setup: PENDING
- Portable: PENDING
- blockmap: PENDING
- latest.yml: PENDING
- PDF: PENDING
- hashes: PENDING

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
- None through Stage 04.

NEXT REQUIRED ACTION:
- Audit the exact source/docs/PDF diff, exclude local QA/release folders, and create the local RC commit.

HISTORICAL UPDATER EXCEPTION:
- v1.0.3 detects updates but cannot complete automatic installed updates because of incompatible ESM/CommonJS `electron-updater` interop.
- Supported one-time path: v1.0.3 -> manual Setup install -> v1.0.4.
- Do not alter or silently replace historical v1.0.3 assets.
- v1.0.4 remains the fixed updater baseline.
