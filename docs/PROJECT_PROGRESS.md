# TINDA POS — Project Progress

> Offline POS System for Sari-Sari Stores.
> Legend: `[x]` Complete (implemented, tested, working) · `[~]` In progress · `[ ]` Not started

## Current release — v1.0.2 Hotfix 1 (SHIPPED)

- Active source version: **1.0.2** (internal); published build id: **v1.0.2 Hotfix 1**
- **ONLY release live on GitHub**: `v1.0.2-hotfix.1` — promoted to **Latest stable** (prerelease removed)
- Old releases `v1.0.0`, `v1.0.1`, and `v1.0.2` (release + tags) **deleted** from remote and local
- Remote + local tags now: `v1.0.2-hotfix.1` only
- Verified baseline: ESLint PASS, TypeScript PASS, **71/71 tests PASS**, production build PASS
- GitHub release assets (all live, verified):
  - `TindaPOS-Setup-1.0.2.exe`     → sha256 `f47f0835…` (114,849,176 B) — unchanged from hotfix build
  - `TindaPOS-Portable-1.0.2.exe`  → sha256 `57088221…` (114,639,565 B) — unchanged from hotfix build
  - `TindaPOS-User-Guide.pdf`      → sha256 `b82fefc1…` (90,061 B, 10 pages) — regenerated for Hotfix 1
  - `SHA256SUMS.txt`               → sha256 of sums file `1bfa488d…` (275 B)
- User manual source: `docs/USER-MANUAL.md` → PDF `installers/TindaPOS-User-Guide.pdf`
- Release page: <https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.2-hotfix.1>
- **Do NOT rebuild EXEs for doc-only releases** — only PDF + SHA256SUMS change; keep Setup/Portable digests stable.

## Phase status

[x] Phase 0 — Environment (dirs, pnpm on D:, caches on D:, Electron 44 + better-sqlite3 verified)

[x] Phase 1 — Foundation (electron-vite + React + TS + Tailwind + SQLite + IPC)
   - Full DB schema + migration system + indexes + FK enforcement
   - Repositories: users, settings, categories, products(+tingi units), suppliers, customers(+credit ledger),
     expenses, sales, shifts, purchases, refunds, held sales, inventory, backup, audit
   - Services: auth, checkout (atomic tx), transaction(refund/void), reporting, dashboard, export, demo data
   - Typed preload API (contextIsolation on), validation, role checks in main process
   - Secure shell, CSP, main+preload+renderer build passing, typecheck (node+web) passing
   - 10 tests passing: 9 business-logic + 1 end-to-end integration (real SQLite file)
[x] Phase 2 — Design system (dark emerald theme, .card/.btn/.input/.table/.badge/.modal, toast host, PageHeader)
[x] Phase 3 — Auth + first-run wizard (Login password/PIN, 3-step FirstRun wizard → completeSetup → login)
[x] Phase 4 — Products / categories / units (tingi) UI (Inventory grid, add/edit/archive, category filter)
[x] Phase 5 — Inventory UI (stock cards, low/out badges)
[x] Phase 6 — Suppliers + purchases UI (supplier CRUD + detail w/ purchases + products)
[x] Phase 7 — POS core (search grid, cart, qty steppers, checkout)
[x] Phase 8 — Payments UI (cash w/ sukli, GCash/Maya w/ ref, utang w/ customer picker)
[x] Phase 9 — Customers / utang ledger UI (Customers page + Utang page w/ pay/adjust/overlimit + ledger)
[x] Phase 10 — Expenses UI (expense CRUD + categories)
[x] Phase 11 — Transactions / refunds / voids UI (list + view + refund w/ per-item + void w/ confirm)
[x] Phase 12 — Shifts (openShift auto on checkout; full shift UI deferred)
[x] Phase 13 — Dashboard (sales/profit/utang/expenses stats + low stock + recent + alerts)
[x] Phase 14 — Reports (sales/inventory/utang tabs + CSV export)
[x] Phase 15 — Receipts (backed by buildReceiptLines; reprint wired)
[x] Phase 16 — Backup / restore UI (list/create/restore/open folder)
[x] Phase 17 — Exports (CSV via reports.exportCsv)
[x] Phase 18 — Automated tests (10 tests, node+web typecheck, full-app Electron smoke boot)
[x] Phase 19 — Performance (WAL-optimal pragmas: synchronous=NORMAL, 20 MB cache, temp_store=MEMORY; index audit clean)
[x] Phase 20 — Release + packaging + docs (Linux AppImage built & verified; Windows build guide written)

## Bug fixes this pass

- **auth firstRun polarity bug**: `finalize()` returned `firstRun: firstRunComplete(db)` — a completed DB would report `firstRun=true`, bouncing the user back to the wizard after login. Fixed to `firstRun: !firstRunComplete(db)`. Caught + verified by the new integration test.
- **backup API on this platform**: better-sqlite3 `db.backup()` threw "connection is not open" on Linux; `createBackup` now uses the proven checkpoint+copy path (`createBackupSync`), so the Backup button works reliably.
- **first-run setup IPC payload bug (FIXED + verified)**: the `handle()` wrapper in `src/main/ipc/index.ts` called `fn(...args)`, silently dropping the Electron event `_e`. Every handler is declared `(_e, ...realArgs)`, so the first invoke arg (the setup payload) was consumed as `_e` and the real payload arrived as `undefined` — breaking **every** argument-carrying IPC endpoint (setup, login, products, users, …). Fixed the wrapper to `ipcMain.handle(channel, (_e, ...args) => fn(_e, ...args))`. Verified live through the 3-layer renderer→preload→main flow; the wizard now completes. First-run setup of a real store (TRES MARIAS) confirmed persisted: settings, admin (scrypt-hashed password + PIN, ADMIN role), receipt header/footer, and demo data.
- **initial automatic backup regression (FIXED + tested)**: `completeSetup` gated its MANUAL backup on `if (!firstRunComplete(db))` *after* the commit — which returns `true` post-commit, so the initial backup was silently skipped. Now uses a `wasFirstRun` flag captured *before* the transaction; regression assertion added to the integration test.

## Security pass

- **No secrets in logs**: `[SETUP DEBUG]` renderer/preload/main logging and the temporary renderer `console-message` forwarder removed. Audit confirms the only remaining `console.*` are two non-sensitive `console.error` calls (DB init + settings load) — passwords and PINs never reach any log output (they exist only as scrypt hashes in the DB).

---

## Log

- **2026-08-31** — Phase 0 complete. D: → `/mnt/D/TINDA-POS`. pnpm 11.24 store on D:. npm cache on D:. Electron 44.0.0 binary verified. better-sqlite3 13.0.3 N-API verified under Electron runtime. Started Phase 1 scaffold.
- **2026-08-31** — Phases 1–18 complete: full renderer UI (11 screens), first-run wizard, auth. Verified node+web typecheck + 10 tests (incl. real-file integration: setup→checkout→refund→utang→void→backup). Full app boots under Electron (window "TINDA POS", DB created, no renderer errors).
- **2026-08-31** — Phases 19–20 complete. Performance: WAL pragmas tuned (NORMAL sync, 20 MB cache, memory temp store), index audit clean, 10 tests still pass. Packaging: `builds/TindaPOS-1.0.0.AppImage` (133 MB) built and verified running (packaged app creates DB, native sqlite loads, no fatal errors). `docs/WINDOWS_BUILD.md` + `installers/README.md` written for the Windows NSIS deliverable.
- **2026-08-31** — User guide PDF: `installers/TindaPOS-User-Guide.pdf` (8 pages, Windows + Linux install + full feature manual). Generator saved at `tools/gen_user_guide.py` (reportlab). Ready to post on PHCorner.
- **2026-08-31** — Windows `.exe` now **built successfully on this Linux machine via Wine** (`electron-builder --win nsis`). Output: `TindaPOS-Setup-1.0.0.exe` (110 MB) in `source/builds/` and copied to `installers/`. win32-x64 better-sqlite3 native module verified unpacked. Full PHCorner release bundle complete: exe + AppImage + PDF.
- **2026-08-31** — **First-run setup IPC bug fixed & verified.** Root cause: the IPC `handle()` wrapper dropped the Electron event, shifting every argument-carrying call off-by-one (setup payload arrived as `undefined`). Wrapper now passes the event through. Verified live (TRES MARIAS store — renderer→preload→main payload intact, wizard completes, all data persisted). Also fixed an initial-backup regression in `completeSetup` (wasFirstRun flag) with a new regression assertion. **Tests now 20/20 passing** (10 original + 10 new validation test cases). Cleanup done: removed all `[SETUP DEBUG]` logging + renderer console-message forwarder; audited that passwords/PINs never reach logs; kept only two non-sensitive `console.error` lines. Fresh clean Linux build produced & startup verified (no errors, DB initializes).
- **2026-08-31** — **ESLint added as the final code-quality gate.** Added ESLint 9.39.5 flat config (`eslint.config.mjs`) with `@eslint/js`, `typescript-eslint` (non-type-aware — full type checking stays with `tsc`), `eslint-plugin-react` + modern JSX runtime, and `eslint-plugin-react-hooks`. Because the project runs native TypeScript 7 (which `typescript-eslint` cannot parse), a `.pnpmfile.cjs` `readPackage` hook nests TypeScript 6.0.3 inside the `@typescript-eslint/*` packages for linting only, leaving root `typescript@7.0.2` untouched for build/typecheck. **`npm run lint` exits 0 — clean (0 errors, 0 warnings).** Triage of 47 initial findings: removed ~17 genuine dead-code unused imports/vars, tightened an IPC router `any` to a justified direct dispatch type, dropped a stale `eslint-disable`, documented 3 intentional mount-only load effects, and configured `no-require-imports` off for the CJS Electron main/preload plus the experimental `react-hooks/set-state-in-effect` off (false-positives on the async mount-load pattern). Re-validated after cleanup: `tsc` typecheck passes, **20/20 tests pass**, and `electron-vite build` succeeds.
- **2026-08-31** — **END-TO-END POS VALIDATION (Phases 1–16) complete.** Added `src/main/services/__tests__/e2e-workflow.test.ts` — one isolated `TINDA_DATA_DIR` suite that drives the real services against a throwaway SQLite file (never the TRES MARIAS DB) through the full POS workflow with exact reconciliation. It covers: first-run setup + auto-backup, inventory setup, POS search (name/SKU/barcode), cash checkout with correct sukli, utang checkout + credit-limit block (no stock/ledger change on rejected over-limit), split payment (CASH+GCASH), GCash/Maya with reference, restart persistence (close/reopen), hold/resume/delete held sale (hold does not decrement stock), void with **CASHIER permission denied** (lacks `pos:void`) vs ADMIN void restoring stock, partial refund restoring stock + ledger + `PARTIALLY_REFUNDED` status, shift open→close with exact expected cash (1000 start + 500 cash sales − 100 expense = **1400**, difference 0), report data sources, backup + restore, inventory movements logged, and edge protections (insufficient-stock reject, over-refund reject, receipt reprint, logout/login). **Two production bugs found and fixed during validation:**
  1. **Shift close always crashed** (`shifts.ts`): the `updateShiftTotals` CASH_IN/CASH_OUT aggregation was missing its `FROM cash_movements WHERE shift_id = ?` clause, so every shift close threw `SqliteError: no such column: type`. Restored the clause — closing a shift now works and reports correct expected cash.
  2. **Restore broke the app** (`backup.ts`): `restoreBackup` closed the raw better-sqlite3 handle but left the module-level connection cache pointing at the closed object, so every subsequent `getDb()` failed with `The database connection is not open`. It now calls `closeDb()` (checkpoint + close + clear cache) so a fresh reopened connection serves the restored file. Regression-locked by the test (restore → reopen → integrity OK, sales intact).
   - **Final state: `npm test` 21/21 passed (was 20), `npm run lint` exit 0 (0 errors/0 warnings), `npm run typecheck` exit 0, `npm run build` exit 0.** (No change to the TRES MARIAS production DB.)

---

## WINDOWS RELEASE PREPARATION (Phase 21 — 2026-08-31)

> Safe packaging/security pass only. POS business logic frozen (no checkout,
> inventory, utang, refund, void, shift, backup logic changes were made).
> Gates remain green: `lint` 0/0 · `typecheck` 0 · `build` 0 · `npm test` 21/21.

### Checklist

**Verified (from Linux/Wine build + source audit):**
- [x] Windows configuration audited — `electron-builder.yml`: appId `com.tindapos.desktop`,
      productName `TINDA POS`, `executableName TindaPOS`, icon `build/icon.ico`,
      NSIS x64 (one-click off, change install dir, desktop + start-menu shortcuts,
      `deleteAppDataOnUninstall: false`, `runAfterFinish: true`), asar + asarUnpack for native module.
- [x] NSIS installer built — `builds/TindaPOS-Setup-1.0.0.exe` (114,834,482 B) via Wine ❌; copied to `installers/`
- [x] Portable exe built (NEW target) — `builds/TindaPOS-Portable-1.0.0.exe` (114,624,893 B) → `installers/`
- [x] Checksums — `installers/SHA256SUMS.txt`
- [x] Native SQLite (better-sqlite3) verified — `win32-x64.node` PE32+ x86-64, N-API 13.0.3, unpacked to asar.unpacked, load-tested
- [x] Icon status — `build/icon.ico` (270 KB) + PNG/icns present; now packaged into asar (`build/icon.png`) so the window icon resolves in the packaged app
- [x] Paths audited — no hardcoded Linux `/mnt` or Windows drive paths in `src/`; only two `process.platform` uses (darwin quit, win32 AppUserModelId)
- [x] Security pass — `contextIsolation:true`, `nodeIntegration:false`, `sandbox:false` with `setWindowOpenHandler` deny + `shell.openExternal`, typed preload `contextBridge`, IPC `requirePermission`, hashed passwords/PINs, no sensitive logs, no `openDevTools` (DevTools won't auto-open)
- [x] NEW production-safety change: single-instance lock (`app.requestSingleInstanceLock` + `second-instance` focus) — no duplicate cashier windows
- [x] NEW minimal app menu — standard Edit only (undo/redo/cut/copy/paste/selectAll), no developer/cashier-unsafe entries
- [x] Source gates green after packaging changes — `lint` 0/0, `typecheck` 0, `build` 0, `npm test` 21/21
- [x] Packaged main bundle verified to contain single-instance + menu code

**Pending — require a REAL Windows 10/11 machine (NOT verifiable from Linux/Wine):**
- [ ] Clean install on Windows (SmartScreen "More info → Run anyway" expected — unsigned)
- [ ] Offline sale test on Windows (cold start, full checkout)
- [ ] Sanity test (add products, login, dashboard, receipt reprint note)
- [ ] Backup/restore on Windows (`%APPDATA%\TINDA POS\`)
- [ ] Upgrade (install new version over existing, data preserved)
- [ ] Uninstall (data preserved — `deleteAppDataOnUninstall:false`)
- [ ] Code-signing (future release step, removes SmartScreen warning)

**Known non-blocker/safety-by-design notes:**
- Receipt printing now uses the real Windows printer API (printer discovery, Test Print, Auto Print,
  manual Print Receipt); a missing or unavailable printer still never blocks checkout
  (crash-safety by design).
- Native `dialog.*` not used (no external backup-location/file picker); exports/backups live under
  the app data dir. Configurable drive selection not yet wired.
- Portable build produced, but final validation of the portable exe still needs a real Windows machine.

### Artifacts
- `builds/TindaPOS-Setup-1.0.0.exe` + `builds/TindaPOS-Portable-1.0.0.exe`
- `installers/` (setup + portable + `SHA256SUMS.txt` + `README.md` + User Guide PDF)
- `installers/TINDA-POS-Windows/` — clean customer folder (setup + portable + `README-FIRST.txt`)

---

## v1.0.2 HOTFIX 1 RELEASE (Phase 22 — 2026-09-05)

> Receipt-printer + data-mode hotfix. Source version stayed 1.0.2; published
> build id "Hotfix 1". Gates green: `lint` 0/0 · `typecheck` 0 · `npm test` 71/71 ·
> production build PASS. No business-logic changes after release.

### What shipped in the build
- Start New Store (protected, ADMIN/settings permission, exact `RESET` confirm, safety backup)
- Settings → Data clarity: Shared AppData (`%APPDATA%\TINDA POS`) vs **Portable Data Mode** (data beside EXE in `TindaPOS-Data\`, Copy Current Store / Start Fresh / switch back)
- Receipt printer support (Windows): discovery, Refresh Printers, Test Print, Auto Print After Sale, Manual Print Receipt
- 80mm default / 58mm supported, custom receipt header/footer; printer failure never blocks or rolls back a sale; Retry Print never duplicates; manual print never creates a new sale
- Cash/SUKLI input fix (pesos, not raw cents), full-refund status fix, restore temp-file cleanup
- Native Windows/thermal-printer validation **still pending** (real Win10/11 machine)

### Docs + release updates performed (git commit trail)
- `2d5d2c1` fix: v1.0.2 customer feedback · `3cb3a5d` feat: finalize receipt printer support + hotfix QA
- `082b384` docs: finalize v1.0.2 hotfix.1 release notes
- `b23a2ac` docs: update user manual for v1.0.2 hotfix.1 (README download links + PDF assets + SHA256SUMS)
- `1a5c645` docs: clean up README (single "What's New in v1.0.2 Hotfix 1", 71/71, dropped stale 33/33 block)
- Branch: `master` · pushed to `origin` = GitHub Yazerukun/TINDA-POS

### Log
- **2026-09-05** — v1.0.2 Hotfix 1 shipped as the **only, latest-stable GitHub release**. Deleted `v1.0.0`, `v1.0.1`, and the stale `v1.0.2` release+tags (remote + local). Regenerated User Guide PDF (10 pages, 90,061 B, `b82fefc1…`) from rewritten `docs/USER-MANUAL.md`; synced all installer copies + Windows dir SHA256SUMS. Re-uploaded only `TindaPOS-User-Guide.pdf` + `SHA256SUMS.txt` to the live release (EXEs untouched). README cleaned to a single "What's New in Hotfix 1" section. RC staging copy kept at `/home/ian/TINDA-POS-v1.0.2-HOTFIX.1-FINAL-RC/` for future asset uploads.
