# TINDA POS RELEASE STATE

CURRENT STABLE:
v1.0.4

TARGET VERSION:
TBD — no new release authorized

RELEASE TYPE:
TBD

BRANCH:
v1.0.4-user-feedback

CURRENT COMMIT:
HEAD — resolve with `git rev-parse HEAD`; baseline before the workflow-policy commit: 7dc2d40

RC COMMIT:
N/A — no target RC is in progress

CURRENT STAGE:
Permanent release workflow installed (documentation policy only); no target release active

LAST UPDATED:
2026-09-08 Asia/Hong_Kong

SCOPE:
- Install the permanent release workflow and checkpoint system.
- Record v1.0.4 as the fixed updater baseline.
- Record the historical v1.0.3 manual-update exception.
- Add mandatory agent and README references.

OUT OF SCOPE:
- Application code or package changes.
- Binary rebuilds or release-asset changes.
- Pushes, tags, GitHub releases, or Latest changes.

STAGE STATUS:

[ ] 01 PLAN
[ ] 02 DEVELOPMENT
[ ] 03 DATABASE QA
[ ] 04 AUTOMATED QA
[ ] 05 RC FREEZE
[ ] 06 WINDOWS RC BUILD
[ ] 07 WINE QA
[ ] 08 SOFTWARE UPDATER QA
[ ] 09 OWNER WINDOWS SPOT-CHECK
[ ] 10 FINAL RELEASE REVIEW
[ ] 11 OWNER APPROVAL
[ ] 12 GITHUB RELEASE
[ ] 13 POST-RELEASE VERIFY

No future target release has been authorized. The unchecked stages are intentionally pending, not failed. For the next release, begin at Stage 01 and do not infer scope.

AUTOMATED QA:
- Typecheck: NOT RUN — documentation-policy installation only
- Lint: NOT RUN — documentation-policy installation only
- Tests: NOT RUN — documentation-policy installation only
- Passed: N/A
- Failed: N/A
- Build: NOT RUN — explicitly out of scope
- PDF: NOT RUN — explicitly out of scope
- git diff --check: PASS (documentation changes)

DATABASE:
- Migration: N/A — no application/database change
- Previous DB tested: N/A
- integrity_check: N/A

WINDOWS RC:
- Setup: N/A
- Portable: N/A
- blockmap: N/A
- latest.yml: N/A
- PDF: N/A
- hashes: N/A

UPDATER:
- From: v1.0.4 fixed baseline
- To: TBD
- autoUpdater initialized: NOT TESTED — no target release
- Detection: NOT TESTED — no target release
- Download: NOT TESTED — no target release
- Long download: NOT TESTED — no target release
- Interruption: NOT TESTED — no target release
- Retry: NOT TESTED — no target release
- Safety backup: NOT TESTED — no target release
- Restart & Install: NOT TESTED — no target release
- Relaunch: NOT TESTED — no target release
- Portable staging: NOT TESTED — no target release

HISTORICAL UPDATER EXCEPTION:
- v1.0.3 detects updates but cannot complete automatic installed updates because of incompatible ESM/CommonJS `electron-updater` interop.
- Supported one-time path: v1.0.3 -> manual Setup install -> v1.0.4.
- Do not alter or silently replace historical v1.0.3 assets.
- v1.0.4 is the fixed updater baseline for all future previous-stable -> target-RC tests.

BLOCKERS:
- None for documentation-policy installation.
- Stable publication remains prohibited until a future target completes all required gates and receives explicit owner approval.

NEXT REQUIRED ACTION:
- When the owner defines a new release, create the Stage 01 release plan from this checkpoint.
