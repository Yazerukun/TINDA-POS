# TINDA POS Permanent Development, QA, Software Update, and Release Workflow

This document is the mandatory release policy for TINDA POS. The primary development machine is Omarchy Linux, Windows compatibility QA normally runs under Wine, and the owner may use a separate native Windows laptop for acceptance checks. The production repository is `Yazerukun/TINDA-POS` on GitHub.

The current fixed-updater baseline is **v1.0.4**.

## Release standard

Do not promise mathematically zero failure. Enforce this standard instead:

> **No known release-blocking Software Update defect may be published.**

If any required updater test fails, the stable release is blocked.

The workflow must keep releases organized, preserve evidence, resume from the next incomplete stage, protect customer/store data, preserve correct Setup and Portable behavior, and prevent publication without explicit owner approval. Software Update is a mandatory release feature and hard release gate.

## Mandatory session start and anti-repeat protocol

At the beginning of every release-related session:

1. Read `docs/RELEASE-WORKFLOW.md` completely.
2. Read `docs/RELEASE-STATE.md` completely.
3. Run:

   ```bash
   git status
   git branch --show-current
   git log --oneline -10
   ```

4. Determine the current stable version, target version, current branch, exact commit, completed stages, failed stages, blockers, and next required stage.
5. Resume from the next incomplete stage. Do not automatically repeat completed stages.

Repeat a previously completed stage only when its evidence became invalid because source code, dependencies, configuration, database migrations, build configuration, updater code, or release artifacts changed; the owner explicitly requested a retest; or the previous evidence is no longer valid.

Decision rules:

- Development passed + source unchanged: do not redo development.
- Automated QA passed + relevant source/config unchanged: do not rerun it automatically.
- RC frozen + source unchanged: do not create another RC commit.
- Windows RC exists for the same RC SHA: do not rebuild unless artifacts or packaging config changed.
- Wine QA passed on the same artifacts: do not repeat it.
- Updater QA passed on the same RC artifacts: do not repeat it.
- Owner approved the exact RC: do not ask again.
- Release already published: continue with post-release verification.

`docs/RELEASE-STATE.md` is the source of truth and must be updated after every completed stage.

Begin every release session with:

```text
# TINDA POS RELEASE RESUME

CURRENT STABLE:
-

TARGET:
-

CURRENT STAGE:
-

COMPLETED:
- ...

BLOCKERS:
- ...

NEXT REQUIRED ACTION:
- ...
```

Continue only with the next required action; do not repeat long history unless needed.

## Historical updater exception and version progression

### v1.0.3 special case

v1.0.3 shipped with working update detection but broken installed-updater initialization. It cannot complete automatic installed updates because `electron-updater` was loaded through an incompatible ESM/CommonJS interop path.

The one-time supported path is:

```text
v1.0.3 -> manual Setup install -> v1.0.4
```

Do not rewrite v1.0.3 history or silently replace its old assets. v1.0.4 is the fixed updater baseline. Normal future paths are sequential, for example `v1.0.4 -> v1.0.5 -> v1.0.6 -> v1.1.0`.

## Versioning

- **Patch** (`1.0.4 -> 1.0.5`): fixes, small improvements, minor user feedback, updater hardening, or small UX work.
- **Minor** (`1.0.x -> 1.1.0`): larger modules, major workflow improvements, or significant features.
- **Major** (`1.x.x -> 2.0.0`): breaking, architectural, database/runtime, or large redesign changes.

## Stage 01 — Release plan

Before editing application code, produce and obtain approval for:

```text
# RELEASE PLAN

CURRENT STABLE:
TARGET:
RELEASE TYPE:

FEATURES:
- ...

BUG FIXES:
- ...

USER FEEDBACK:
- ...

UPDATER CHANGES: YES / NO
DATABASE CHANGES: YES / NO
PRINTER CHANGES: YES / NO
DOCUMENTATION CHANGES: YES / NO

OUT OF SCOPE:
- ...
```

Do not silently expand scope. Mark Stage 01 pass only after approval.

## Stage 02 — Development

Use a dedicated `vX.Y.Z-dev` branch. Preserve offline-first behavior, SQLite data, RBAC, Shared AppData, Portable Data Mode, updater provider, and receipt/printer behavior unless explicitly in scope. Reuse the existing architecture, add tests, and update the user manual for user-facing changes.

Never push a release tag, publish a GitHub release, mark a release Latest, or add unrelated features during development. Mark Stage 02 pass only when implementation is complete.

## Stage 03 — Database QA

If the database changes, migrations must be idempotent, non-destructive, additive where practical, and compatible with a copy of the previous stable database.

Never lose products, stock, movements, transactions, payments, refunds, voids, customers, utang, customer ledger, suppliers, purchases, expenses, users, settings, shifts, or Z-Read history.

Run `PRAGMA integrity_check`; expected result: `ok`. If there is no database change, record `DATABASE CHANGE = N/A`. Then mark Stage 03 pass.

## Stage 04 — Automated QA

Run the project's actual commands for typecheck, lint, automated tests, production build, User Guide PDF, and `git diff --check`. Report exact results:

```text
TYPECHECK: PASS / FAIL
LINT: PASS / FAIL
TEST FILES: n
TOTAL TESTS: n
PASSED: n
FAILED: n
BUILD: PASS / FAIL
PDF: PASS / FAIL
git diff --check: PASS / FAIL
```

Never claim pass for a skipped, stalled, or unexecuted command. Any real failure blocks Stage 04. Update the release state only with truthful evidence.

## Stage 05 — Local RC freeze

Run `git status`, `git diff --stat`, and `git diff --check`; audit all files. Exclude secrets, QA databases, temp files, logs, debug helpers, unintended screenshots, caches, local QA servers, and stale installers.

Create one local RC commit such as `feat: complete v1.0.5 release candidate`, record its exact SHA as `RC_COMMIT`, and require a clean working tree. Do not push. Mark Stage 05 pass.

## Stage 06 — Windows RC build

Build the Windows RC using Omarchy and the verified packaging workflow. Required artifacts:

- `TindaPOS-Setup-X.Y.Z.exe`
- `TindaPOS-Portable-X.Y.Z.exe`
- `TindaPOS-Setup-X.Y.Z.exe.blockmap`
- `latest.yml`
- `TindaPOS-User-Guide.pdf`
- `SHA256SUMS-RC.txt`
- `RC-SOURCE-COMMIT.txt`

Verify product `TINDA POS`, app version `X.Y.Z`, and file version `X.Y.Z.0`.

### better-sqlite3 packaging

Windows x64 requires `better-sqlite3/prebuilds/win32-x64.node`. Do not unnecessarily package Darwin, Linux, musl, or win32-arm64 native binaries. Use the narrow proven Windows-x64 configuration; do not restore broad native rules that previously caused builder stalls.

### Production update provider

Production artifacts must contain:

```yaml
provider: github
owner: Yazerukun
repo: TINDA-POS
```

They must not contain an active localhost, `127.0.0.1`, LAN QA address, mock server, or development updater endpoint. Any QA override must be explicitly environment-gated, disabled by default, and impossible for ordinary users to trigger accidentally.

Mark Stage 06 pass only when all artifacts exist and their metadata is verified.

## Stage 07 — Wine QA

Wine is the normal Windows compatibility QA environment. Test and record:

- Setup installer launches and its packaged application launches.
- Portable launches, opens its database, and opens the renderer.
- `better-sqlite3`, migrations, and `PRAGMA integrity_check = ok` work.
- Login, Dashboard, POS, Inventory, Customers, Utang, Reports, Settings, and Backup smoke tests pass.
- Release-specific features are smoke-tested.

Report **WINE QA PASS**, never “native Windows QA pass.” Mark Stage 07 pass only with evidence.

## Stage 08 — Software Updater QA (hard gate)

From v1.0.4 onward, every release must test **previous stable -> target RC** using local/mock updater infrastructure before publication. Never create fake public GitHub releases just for QA.

### Initialization regression gate

Never repeat the v1.0.3 interop bug. Verify production updater initialization uses the proven CommonJS-compatible `electron-updater` loading mechanism, the module loads, handlers attach, `autoUpdater != null`, installed Setup updating is available, and Portable follows its separate path. Keep regression coverage against `import("electron-updater")` producing an undefined `mod.autoUpdater`. If the updater object is unavailable, the release is blocked.

### Metadata gate

Verify `latest.yml` has the target version, exact Setup filename, matching Setup size and SHA-512, and the blockmap belonging to the same Setup build. Verify production `app-update.yml` points to GitHub / `Yazerukun` / `TINDA-POS`.

Never manually fabricate metadata. Setup, `latest.yml`, and blockmap must come from the same canonical build.

### Local update flow

Launch the previous stable and use Settings -> About -> Software Update -> Check for Updates. Verify previous version display, target detection, What's New, Later, and Download Update.

During download verify a visible progress bar, moving percentage, responsive UI, and 100% completion. Downloaded bytes, total size, and speed are optional; reliable percentage is required.

### Timeout and slow-download rules

Never impose “the entire download must finish within 15 seconds” or another short total timeout. Valid updates may take many minutes. Use connection and/or inactivity/idle timeouts. If bytes are arriving, do not abort.

Throttle the local server so the download lasts at least 30–60 seconds. It must pass 15 seconds, keep progressing, avoid a false timeout, and reach 100%. A healthy slow download failure blocks release.

### Network interruption and retry

Interrupt download around 20–40%. Verify the app stays usable, database remains intact, the partial download does not corrupt the app, and a friendly message plus Retry Download appears. Restore service and verify retry safely restarts/resumes as designed and reaches 100%.

Do not use a raw technical error as the primary message. Prefer:

```text
Update download was interrupted.
Check your internet connection and try again.
```

Technical detail may remain in logs. Provide Retry Download whenever practical.

### Safety backup gate

Before installed **Restart & Install**, create a safety backup of the correct current database. Verify it exists, has non-zero size, and has the correct timestamp. If backup creation fails, do not install; show a friendly message. Store data safety has priority.

### Installed Setup flow

Verify to the required environment level:

```text
Previous Stable -> target detected -> Download -> 100% -> Safety Backup
-> Restart & Install -> old app exits -> installer starts -> target installs
-> app relaunches -> About shows target -> database preserved
```

Wine may smoke-test parts. If updater code, NSIS, process locking, Restart & Install, or Windows install behavior changed, owner Windows spot-check is required.

### Portable flow

Portable must never overwrite its running EXE. Verify the old Portable detects and downloads the target, stages a new Portable EXE, and offers Show in Folder. The running EXE, database, and `TindaPOS-Data` must remain preserved.

### Data-preservation fixture

Before updating, create QA products, stock, a multi-unit item, customer, utang, sales, expense, supplier, user, settings, and shift. After updating, verify Products, Stock, Transactions, Customers, Utang, Ledger, Expenses, Suppliers, Users, Settings, and historical reports. Run `PRAGMA integrity_check`; expected: `ok`.

### Release-blocking updater matrix

Any of these blocks stable publication:

- `autoUpdater` unavailable
- wrong target version or production provider
- incorrect `latest.yml`, Setup SHA-512 mismatch, or mismatched blockmap
- localhost/QA URL in production
- Download Update fails or progress never moves
- healthy slow download falsely times out
- interruption crashes the app or has no safe retry/recovery
- safety backup fails or data corruption occurs
- Portable overwrites itself
- wrong native `better-sqlite3` binary
- `PRAGMA integrity_check` is not `ok`

Never silently waive a gate.

## Stage 09 — Owner Windows spot-check

Native Windows testing is not required before creating an RC. Use the owner's separate Windows laptop mainly when updater, installer, printer, or Windows-specific behavior changed, or when the owner requests final confidence.

The check may run previous stable -> local RC -> Software Update -> Download -> Restart & Install -> target, or a manual RC feature install. If it is not required, record `OWNER WINDOWS SPOT-CHECK: N/A`; do not repeatedly ask for it.

## Stage 10 — Final release review

Before publication verify:

- **Source:** exact RC commit and clean working tree.
- **QA:** typecheck, lint, tests, build, PDF, and Wine QA pass.
- **Database:** migration pass/N/A, previous DB preserved, integrity check `ok`.
- **Updater:** initialization, detection, metadata, download, progress, healthy slow transfer, interruption handling, friendly error, retry, backup, installed path to the required level, Portable staging, and no shipped QA provider.
- **Artifacts:** Setup, Portable, blockmap, `latest.yml`, PDF, and checksums.
- **Security:** no secrets, QA database, QA updater URL, temp, or debug files.
- **Documentation:** current User Guide and release notes; correct version references.

Any required failure blocks final review.

## Stage 11 — Owner approval (mandatory stop)

After Stage 10, the AI must stop and wait for an explicit instruction such as **“Publish v1.0.5 Stable.”** Without explicit approval: no push, tag, release, upload, or Latest change. Do not repeatedly ask during earlier stages; ask once only when Stage 10 is complete.

## Stage 12 — GitHub stable release

Only after explicit owner approval:

1. Verify the exact release commit.
2. Push verified source.
3. Create `vX.Y.Z` at the exact verified commit and push the tag.
4. Create GitHub Release `TINDA POS vX.Y.Z` as Stable, not prerelease, and Latest.
5. Upload only:
   - `TindaPOS-Setup-X.Y.Z.exe`
   - `TindaPOS-Portable-X.Y.Z.exe`
   - `TindaPOS-Setup-X.Y.Z.exe.blockmap`
   - `latest.yml`
   - `TindaPOS-User-Guide.pdf`
   - `SHA256SUMS.txt`

Never upload QA databases, logs, a local updater server, stale RCs, debug files, or source bundles unless explicitly intended.

### Release immutability

After stable publication, never silently replace binaries under the same version. If a serious defect is found, publish a new patch version. Historical assets remain historically accurate.

## Stage 13 — Post-release verification

Verify the release page and Latest pointer, download every published asset, and confirm hashes. Then use the previous stable's Software Update UI to confirm public target detection, What's New, download start, and moving percentage. For important updater releases, perform one production Windows updater cycle when practical.

## Release incidents

For a user-reported updater failure, do not immediately replace stable assets. Diagnose installed and target versions, Setup versus Portable, exact error and logs, `latest.yml`, hashes, `app-update.yml`, updater initialization, network behavior, and Windows-specific behavior. If code or binaries must change, create a new patch release.

## Master release checklist

```text
PLAN                 scope; version; out-of-scope
DEVELOPMENT          implementation; tests; docs
DATABASE             migration/N/A; preservation; integrity
AUTOMATED QA         typecheck; lint; tests; build; PDF; diff check
RC                   local commit; clean tree; SHA
WINDOWS BUILD        Setup; Portable; blockmap; latest.yml; PDF; checksums
WINE                 launch; DB; core smoke; feature smoke
UPDATER              initialization; detection; metadata; download; progress;
                     >15 sec; interruption; friendly error; retry; backup;
                     installed path; Portable staging; data integrity
OWNER WINDOWS        required/N/A; result
RELEASE REVIEW       artifacts; hashes; provider; no QA config; notes
OWNER                explicit approval
GITHUB               source push; tag; Stable; Latest; assets
POST-RELEASE         downloads; hashes; public updater
```

## Mandatory session checkpoint

At the end of every work session, update `docs/RELEASE-STATE.md`, then report:

```text
# TINDA POS SESSION CHECKPOINT

CURRENT STAGE:
-

COMPLETED THIS SESSION:
- ...

VALIDATION:
- ...

CURRENT COMMIT:
-

WORKING TREE:
-

BLOCKERS:
- ...

NEXT REQUIRED ACTION:
-

GITHUB:
- Pushed:
- Tagged:
- Released:
```

## Final release report template

```text
# TINDA POS vX.Y.Z RELEASE REPORT

CURRENT STAGE:
-

VERSION
- Previous:
- Target:
- Type:

SOURCE
- Branch:
- RC Commit:
- Release Commit:
- Working Tree:

SCOPE
- Features:
- Fixes:
- User Feedback:
- Out of Scope:

DATABASE
- Migration:
- Previous DB:
- Data Preserved:
- integrity_check:

AUTOMATED QA
- Typecheck:
- Lint:
- Test Files:
- Total Tests:
- Passed:
- Failed:
- Build:
- PDF:
- diff check:

WINDOWS RC
- Setup:
- Portable:
- blockmap:
- latest.yml:
- PDF:
- checksums:

WINE QA
- Setup:
- Portable:
- Database:
- Renderer:
- Features:

SOFTWARE UPDATER
- From:
- To:
- autoUpdater:
- Detection:
- What's New:
- Download:
- Progress:
- Slow Download:
- Interruption:
- Friendly Error:
- Retry:
- Safety Backup:
- Restart & Install:
- Relaunch:
- Portable Staging:
- Data Preserved:
- integrity_check:

OWNER WINDOWS
- Required:
- Completed:
- Result:

RELEASE REVIEW
- Provider:
- No QA URL:
- Metadata:
- Hashes:
- Notes:

GITHUB
- Owner Approved:
- Pushed:
- Tag:
- Stable:
- Latest:

POST-RELEASE
- Setup:
- Portable:
- latest.yml:
- blockmap:
- PDF:
- Checksums:
- Public Updater:

BLOCKERS:
-

NEXT REQUIRED ACTION:
-

FINAL STATUS:
-
```
