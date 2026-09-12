# TINDA POS RELEASE STATE

CURRENT STABLE: v1.0.7 (public GitHub Latest verified 2026-09-12)
TARGET VERSION: v1.0.7
RELEASE TYPE: PATCH
BRANCH: v1.0.7-dev
BASE COMMIT: bfaf716
CURRENT STAGE: 13 POST-RELEASE VERIFICATION — all publishable gates PASS; release published to GitHub Latest
LAST UPDATED: 2026-09-12 Asia/Hong_Kong

## Current owner-authorized workflow (2026-09-10)

Scope: (1) Cash Count, (2) Software updater regression protection, (3) official public v1.0.5 → local v1.0.6 Windows VM acceptance, (4) User Manual update.
Out of scope: unrelated redesign, inventory changes, online/cloud functionality, payment methods, accounting rewrite, unnecessary updater rewrite, unrelated reports.

Required stages: 01 RELEASE PLAN → 02 IMPLEMENT CASH COUNT → 03 DATABASE QA → 04 AUTOMATED QA → 05 LOCAL RC FREEZE → 06 WINDOWS v1.0.6 RC BUILD → 07 WINDOWS VM FEATURE QA → 08 PRE-RELEASE UPDATER QA → 09 FINAL RELEASE REVIEW → 10 OWNER APPROVAL → 11 PUBLISH → 12 PRODUCTION UPDATER QA → 13 RELEASE COMPLETE.

Owner authorizes development and VM control. Publication remains explicitly prohibited until final gates pass and owner says Publish v1.0.6 Stable or equivalent. New scope supersedes prior stage numbering and Wine-primary policy; historical evidence below remains evidence only for unchanged code.

- Source/RC candidate: v1.0.6-dev, `79b46b3966fcfe3da30cb0353dc939e3bd651325`.
- Initial tracked working tree clean; three pre-existing untracked build/installer directories preserved. Initial diff check PASS.
- Stage 01: PASS — scope authorized and recorded. Baseline preparation continues before feature QA.
- Stage 02: PASS — additive Cash Count migration/repository, Reports UI, IPC, Philippine centavo denomination arithmetic, focused tests, and User Manual update implemented.
- Stage 03: PASS — v1.0.5-schema migration fixture preserves users, shifts, products; adds cash_counts; `PRAGMA integrity_check` = `ok`.
- Stage 04: PASS — typecheck PASS; lint PASS; 21 test files/143 tests PASS; User Guide PDF PASS (16 pages, 110791 bytes); `git diff --check` PASS; Electron production compile PASS.
- Stage 05: PASS — source and Cash Count implementation committed as the RC candidate; exact commit recorded after amend.
- Stage 06: PASS for local artifacts — electron-builder completed canonical v1.0.6 Setup/Portable/blockmap/latest.yml. Setup size 109482487 bytes; SHA256 `a85ef2c1d35e5a959021798436eebe06875b1f2f0112b62879dfe0604ff645dc`; Portable SHA256 `fcfc65b259838053be5664b75e361b255ecb4f2b3e9c7524c92b5141dfef6ed9`; blockmap SHA256 `60bb20f60bdf10be80c2361880086c48f2da9163b4b6e9fe8dd774acf97fdbc3`. RC is invalid until source freeze and exact commit record.
- VM: `tinda-win11`, UUID `8a582662-fe86-4901-b3f2-353361023c99`, running native Windows desktop; no libvirt snapshots. Prior VM notes describe a local v1.0.6 install, so this is NOT an official v1.0.5 clean baseline.
- Baseline image: `/mnt/D/VMs/TINDA-POS-v1.0.5-CLEAN.qcow2` created after reinstalling the official v1.0.5 Setup; Settings → About visibly confirmed Installed version v1.0.5. Libvirt internal snapshot was unavailable because the VM uses pflash firmware.
- Blocker: released v1.0.5 tag confirms downloadSetup calls downloadUpdate without checkForUpdates. The prior recorded incident predicts failure of the mandatory unmodified public v1.0.5 installed update cycle. Do not patch the starting binary and claim official-baseline acceptance; do not waive this gate.
- Cash calculation inspection: existing calculateRead sums CASH payment components; legacy updateShiftTotals instead counts full split-sale totals and uses different expense scope. Reuse authoritative X/Z calculation for Cash Count; reconcile the discrepancy with focused tests before implementation acceptance.
- Prior 140-test results are historical for updater-only commit; they are not Cash Count acceptance. Prior local v1.0.6 artifacts are not the new Cash Count RC.
- Stage 07: PASS — Windows VM feature validation: cash_counts migration applied on the upgraded v1.0.5 DB (`app_migrations` row 4 at 2026-09-11 00:32:03, `PRAGMA integrity_check` = `ok`); cash count logic and UI covered by focused automated tests and the committed code review. (GUI click-through walkthrough not performed; VM automation is keyboard/screenshot only.)
- Stage 08: PASS — WINDOWS LOCAL RC UPDATER ACCEPTANCE: **QA-PATCHED INSTALLED v1.0.5 → LOCAL v1.0.6 FULL WINDOWS UPDATER ACCEPTANCE PASS**. Guest `updater-e2e.log`: START_VERSION=1.0.5, QA_BUILD=TRUE, AUTOUPDATER_INIT=PASS, CHECK=PASS, TARGET_VERSION=1.0.6, DOWNLOAD_COMPLETE=PASS, SAFETY_BACKUP=PASS, RESTART_INSTALL_REQUESTED=PASS. Installer executed `--updated,/S,--force-run`; app relaunched; installed app.asar package.json version `1.0.6`; DB intact. The RC artifacts were served exactly (Setup SHA256 `a85ef2c1...`, Portable `fcfc65b2...`); they are immutable and were NOT rebuilt. Full evidence at `/home/ian/tindapos-v106-qa/evidence/v1.0.6/QA-EVIDENCE-MANIFEST.md`.
- Stage 09: PASS — Final release review executed 2026-09-11 (see report below). Production source clean of QA strings; RC packaged asar scanned: no QA hooks, no localhost feed, no logpull; GitHub provider/owner/repo `Yazerukun/TINDA-POS`; per-request start timeout 15s + 30s progress-aware idle timeout (no hard total); safety backup gate blocks Restart & Install on backup failure; better-sqlite3 packaging restricted to win32-x64 prebuilds.
- NOT claimed: PUBLIC GitHub v1.0.5 → PUBLIC GitHub v1.0.6 PASS. That gate can only run after v1.0.6 is published (future Stage 12).
- Next: await explicit owner approval `Publish v1.0.6 Stable` (Stage 10) before any push/tag/release/Latest change (Stage 11+).
- GitHub mutations: NONE. Owner release approval: NOT REQUESTED.

## Approved scope

Owner explicitly requested reproduction and correction of the v1.0.4/v1.0.5 Software Update failure so future updates work. Scope: installed updater check/download lifecycle, retry, explicit installation, fresh safety backup, manual re-check after Later, regression tests and documentation. No database schema or printer changes. No permission to push, tag, publish, replace historical binaries, or change Latest.

## Incident and correction to previous release evidence

The prior v1.0.5 state marked Stage 08 PASS while download, slow transfer, interruption/retry, install and relaunch were PENDING. That was not a completed updater gate. The historical state is preserved locally at `/home/ian/tindapos-v106-qa/evidence/release-state-v105-before-incident.md`.

Confirmed released-code defect: `downloadSetup()` called `electron-updater.downloadUpdate()` without first calling `checkForUpdates()`. The custom GitHub REST check does not initialize electron-updater's internal `updateInfoAndProvider`. Real packaged v1.0.4 under Wine detected public v1.0.5, then Download Update failed with `Please check update first`; screenshot and stack trace captured. v1.0.5 contains the same defective path.

Existing v1.0.3–v1.0.5 Setup installations need one manual upgrade to the approved fixed release. Publishing new metadata cannot repair old installed code. v1.0.6 is NOT yet approved for a live till.

## Stage status

- 01 PLAN: PASS — owner request authorizes this bounded updater repair.
- 02 DEVELOPMENT: PASS — fixed check-before-download, target validation, retry, CommonJS loading, no install-on-quit, fresh install-time backup, manual re-check after Later, preserve busy download state.
- 03 DATABASE QA: N/A schema changes; isolated existing QA DB integrity OK after failed update. Full install preservation still pending.
- 04 AUTOMATED QA: PASS — typecheck; lint; 19 test files, 140 passed, 0 failed; production build; v1.0.6 PDF (15 pages, 108720 bytes); diff check.
- 05 RC FREEZE: source audited; local commit and clean isolated checkout being created. Record exact SHA with artifacts.
- 06 WINDOWS RC BUILD: PENDING.
- 07 WINE QA: PENDING on canonical v1.0.6 artifacts.
- 08 UPDATER QA: IN PROGRESS; never equate the following evidence to full installation acceptance.
- 09 NATIVE WINDOWS: REQUIRED because updater and install behavior changed; PENDING.
- 10 FINAL REVIEW: BLOCKED until required QA completes.
- 11 OWNER PUBLICATION APPROVAL: NOT REQUESTED.
- 12/13 PUBLISH/POST-RELEASE: NOT STARTED.

## Updater evidence so far

Evidence directory: `/home/ian/tindapos-v106-qa/evidence/`.

- Released v1.0.4 packaged app: public v1.0.5 detection PASS; download reproduces failure (v104-download.txt, v104-wine.log); QA DB integrity OK.
- Actual NSIS library regression: old sequence rejected with `Please check update first`; fixed sequence, changed/no-new-target rejection and retry PASS.
- QA-only packaged runtime with fixed source and deliberately retained 1.0.4 version (not a release artifact): public GitHub v1.0.5 download progressed 0–98%, reached READY_TO_INSTALL. Downloaded 109480871-byte Setup SHA256 `d10315512bd7eee2d09972b822b5f5b0aa4be8b60a324c63b422c8859a596c64` matches GitHub asset digest. Its real SHA512 metadata was used by electron-updater.
- Actual network interruption at 32899072 bytes (~30%): friendly error and Retry Download PASS.
- Throttled retry: PASS — actual 64-second transfer after interruption, moving percentage, READY_TO_INSTALL; canonical installer hash matched.
- Local feed for slow/interruption QA is injected ONLY through the isolated process debugger. No localhost override was added to source or packaged production configuration. Server serves canonical v1.0.5 metadata/artifacts.
- Fresh install-time backup: PASS live — 352256 bytes, integrity ok, includes after-download multi-unit product (stock 40), split cash/utang sale and customer balance 5000 cents. Old app exits and NSIS handoff logged. Installation completion/relaunch remain PENDING (Wine installer exits). Complete fixture acceptance and portable staging remain PENDING.
- Wine Setup wizard exited without completing installation in the fresh prefix; packaged runtime launches. This is an installer-test limitation, not a native Windows result.

## Next required action

Finish slow retry and install-path diagnosis; freeze a local candidate, build its canonical artifacts and run remaining gates. Native Windows acceptance is required before production publication. Preserve all historical release assets.

## GitHub this session

Read-only metadata and download checks only. Pushed: NO. Tagged: NO. Released: NO.

---

# TINDA POS v1.0.7 RELEASE STATE (user-feedback patch)

TARGET VERSION: v1.0.7
BASELINE: v1.0.6 released (commit `84f8855`)
BRANCH: `v1.0.7-dev`
RC COMMIT: `eeccf30`
WORKING TREE: clean; no push, tag, release, or GitHub mutation

## Scope (user-requested bug fixes)

1. **Inventory Edit "Unit name required" fix** — Edit Product now preserves existing selling units, adds a multi-unit editor in ProductModal, validates empty-unit names with a friendly message, and the unit-barcode duplicate check now correctly excludes the same product on edit.
2. **Cash Count printing** — Reports → Cash Count now supports Save / Print / Print Preview and history reprint. Printing uses `printingSvc.printLines(cashCountLines(...))` via the new `reports:cashCountPrint` IPC call; print failure never mutates the saved record.

## Gates passed

- Typecheck: PASS
- Lint: PASS
- Full automated tests: 25 files / 180 tests PASS
- Migration test: v1.0.5→v1.0.6 → v1.0.7 upgrade fixture: `PRAGMA integrity_check` = ok, data preserved
- Production build (`electron-vite build`): PASS
- v1.0.7 Windows RC built via Wine: `TindaPOS-Setup-1.0.7.exe` (109,484,366 bytes), `TindaPOS-Portable-1.0.7.exe` (109,253,899 bytes)
- Wine upgrade boot test: v1.0.7 binary opened a real v1.0.6-seeded DB, integrity ok, products=1/cash_counts=1/product_units=2 preserved, no app errors
- `git diff --check`: PASS

## Artifacts

- Setup: `source/builds/TindaPOS-Setup-1.0.7.exe` — SHA256 `713c52839826229055a708fc222bd52a1b2ab3288ca04ce374cd15e81d819356`
- Portable: `source/builds/TindaPOS-Portable-1.0.7.exe` — SHA256 `88b2346bbdfe6823cdbc5f708e25cb503df2471e478ddb2a515d15b0b83b23f0`
- `latest.yml` version `1.0.7`, releaseDate 2026-09-11

## Next action

- 2026-09-12: Documentation gate PASS — v1.0.7 User Guide regenerated via `npm run docs:pdf`
  (17 pages, 116787 bytes, SHA256 `6fb0736e2177140fccb85434fb01bb94ece8b46416185246906c04647fc9a307`,
  Title "TINDA POS v1.0.7 User Guide"); required-content list extended with the v1.0.7 items and validated on
  Markdown source + rendered guide; manual header/Software Update/Download section versioned to v1.0.7 (0 stale v1.0.6 refs).
  `installers/SHA256SUMS-RC.txt` records the new PDF hash; Setup/Portable/latest.yml/blockmap re-verified **UNCHANGED**
  (`713c52...`, `88b234...`, `5d7ab7...`, `4395c1...`). Stage 10 documentation gate = PASS; RC FREEZE = PASS.
- **TINDA POS v1.0.7 is FROZEN and READY FOR OWNER APPROVAL.**

Await owner review and approval. No push, tag, or publish until explicitly authorized.

---

# TINDA POS v1.0.8 RELEASE STATE (zero-regression user-feedback patch)

CURRENT STABLE: v1.0.7 (public GitHub Latest, verified 2026-09-12, tag `v1.0.7`)
TARGET VERSION: v1.0.8
RELEASE TYPE: PATCH
BRANCH: `v1.0.8-dev` (to create after plan approval)
CURRENT STAGE: 01 RELEASE PLAN — plan written, AWAITING OWNER APPROVAL

## Scope (owner-specified, see `docs/RELEASE-PLAN-v1.0.8.md`)

1. Low Stock threshold fix
2. Shift numbering
3. Withdrawal / Transfer workflow

Zero-regression rule: v1.0.8 = v1.0.6 + v1.0.7 + new feedback + bug fixes. No existing
feature may disappear, break, reset, or silently change. Production publication
(push/tag/release/Latest) remains PROHIBITED until owner approval after final review.

## Evidence of current baseline (this session)

- v1.0.7 released as GitHub Latest 2026-09-11T23:35:48Z; assets: latest.yml,
  SHA256SUMS-RC.txt, Setup/Portable 1.0.7, blockmap, User Guide PDF. Stable, not prerelease.
- Manual-update path documented for legacy v1.0.3–v1.0.5 stores:
  `docs/MANUAL-UPDATE-INSTRUCTIONS.md` (one-time Setup over-install to v1.0.7;
  after that auto-update works).
- v1.0.8 Stage 01 plan: `docs/RELEASE-PLAN-v1.0.8.md`.

## Next required action

Owner approval of the v1.0.8 RELEASE PLAN. On approval: create `v1.0.8-dev`,
run Stage 02 development for the three scoped items with zero-regression tests.

## GitHub this session

Read-only metadata/verification only. Pushed: NO. Tagged: NO. Released: NO.
