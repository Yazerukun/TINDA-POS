# TINDA POS RELEASE STATE

CURRENT STABLE: v1.0.5 (public GitHub Latest verified 2026-09-09)
TARGET VERSION: v1.0.6 — updater incident fix, UNRELEASED
RELEASE TYPE: PATCH
BRANCH: v1.0.6-dev
BASE COMMIT: 5347740
CURRENT STAGE: 05 local source freeze; build next, full installation acceptance still blocked
LAST UPDATED: 2026-09-09 Asia/Hong_Kong

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
