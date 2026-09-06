# TINDA POS v1.0.3 DEVELOPMENT REPORT

**Date:** 2026-09-06
**Base:** v1.0.2 Hotfix 1 (only live GitHub release)
**Status:** IMPLEMENTED — **NOT RELEASED** (no tag, no release, no Latest, no assets uploaded)

---

## 1. Goal

Add a safe, offline-first-friendly in-app update system to TINDA POS:

- **Check for Updates** → compare against official GitHub `Yazerukun/TINDA-POS` releases (stable-only).
- **Download Update** with progress → **Restart & Install** (user-initiated only).
- **What's New** plain-text release notes per version (drafts/prereleases/pre-releases ignored).
- Automatic check (24-hour throttle), silent skip when offline, dismiss per version.
- An automatic pre-update **safety backup** (mode `BEFORE_UPDATE`) before installing through the updater.
- Portable EXE never self-overwrites: it downloads the next `TindaPOS-Portable-*.exe` to `Downloads\TINDA-POS-Updates\` and opens the folder.
- Critical operations (checkout/refund/void/backup/reset…) block an update install until finished.

## 2. What was built

| Area | File(s) | Notes |
| --- | --- | --- |
| Version | `package.json` → 1.0.3 | Electron metadata + docs too |
| Packages | `electron-updater` (6.8.9) in **dependencies**; `pnpm-workspace.yaml` with `onlyBuiltDependencies` (fixes pnpm-11 ignored-builds) | pnpm `pnpm` field removed (pnpm 11 no longer reads it) |
| Builder | `electron-builder.yml` adds `publish: github / Yazerukun / TINDA-POS` | emits `latest.yml` + blockmap, no auto-publish |
| Shared logic | `src/shared/update.ts` | semver parse/compare, GitHub release parse, stable filter, `latestStable` (max, order-independent), official-URL guard (github.com/api.github.com only), 24h `shouldAutoCheck`, `safeReleaseNotes` (control-char-safe) |
| Main service | `src/main/services/updateService.ts` | state machine IDLE/CHECKING/UP_TO_DATE/UPDATE_AVAILABLE/DOWNLOADING/DOWNLOADED/READY_TO_INSTALL/DISMISSED/OFFLINE/UNABLE_TO_CHECK/ERROR; `check({manual})`; `dismiss()` |
| Transport | `src/main/services/updateTransport.ts` | `net.fetch` 15s timeout; streaming portable download with content-length progress; guard on `officialResponseUrl`; lazy electron-updater (packaged + win32 + installed only) |
| Persistence | `src/main/services/updateStore.ts`, `updateRuntime.ts` | `updates/update-state.json` `{lastCheckedAt, dismissedVersion}` (0600, separate from business DB); singleton broadcast (`update:event`) to all windows; `startAutoUpdateCheck()` 4s after window ready |
| Guard | `src/main/services/operationGuard.ts` | critical ops block install: "Please finish the current operation before installing the update." |
| IPC/preload | `src/main/ipc/index.ts`, `src/shared/ipc.ts`, `src/preload/index.ts` | `update:*` handlers + typed API + safe event subscription |
| Renderer | `stores/update.ts`, `components/update/UpdateNotification.tsx`, `pages/Settings.tsx` (Software Update section), `App.tsx`, `Shell.tsx` | bottom-right card, progress bar, What's New, Later, Restart & Install, Show in folder |
| Tests | `src/shared/__tests__/update.test.ts`, `src/main/services/__tests__/update-service.test.ts` | **48 new tests** |

## 3. Gates

| Gate | Result |
| --- | --- |
| `pnpm install` | clean (post pnpm-workspace fix) |
| `pnpm run lint` | 0/0 issues |
| `pnpm run typecheck` | pass (node + web) |
| `pnpm test` | **119/119 across 14 files** (was 71) |
| `pnpm run build` | out/main 160 KB · preload 6 KB · renderer 779 KB |
| `pnpm run docs:pdf` | 11 pages, 94,370 B, version 1.0.3 |
| `git diff --check` | clean |

## 4. Windows artifacts (BUILT ONLY — NOT PUBLISHED)

Located in `source/builds/`:

- `TindaPOS-Setup-1.0.3.exe` — 114,994,846 B
- `TindaPOS-Portable-1.0.3.exe` — 114,785,243 B
- `TindaPOS-Setup-1.0.3.exe.blockmap`
- `latest.yml` — version 1.0.3, sha512 `pJlQkW24YDEQYx+trzq6I3iayMNIGko/JIjQrmDcy91rknNNd5DgWJ1Hq5XKKVsqZBO5oOqp5w2vLU01erOrlA==`, size 114994846
- `win-unpacked/` — contains `resources/app-update.yml` (provider github, owner Yazerukun, repo TINDA-POS, updaterCacheDirName `tinda-pos-updater`); `electron-updater` present inside `app.asar`
- exe metadata (exiftool): File Version **1.0.3.0**, Product **TINDA POS**, Product Version **1.0.3**

## 5. WINE QA (Omarchy, Wine 11.16 / XWayland)

- Packaged app launches under Wine (portable wrapper and `win-unpacked/TindaPOS.exe`), no crash.
- First run auto-created database: 28 tables, WAL/SHM live → **better-sqlite3 win32 native module loads**.
- Auto backup file created on ready (`tindapos-2026-09-06-161909-501.db`).
- Startup auto-update check fires (headless TLS attempt fails fast); app continues normally → the offline-first silent-fail path is exercised.
- **Limits**
  - `PORTABLE_EXECUTABLE_DIR` is not propagated into Electron's process env by the Wine launch path, so the portable update staging + **Show in folder** path was verified via unit tests **only** (not visually under Wine).
  - Native Windows download → install → restart (electron-updater `quitAndInstall`) is **PENDING**: not faithfully testable under Wine; needs a real Win10/11 machine or a GitHub Actions Windows runner.

## 6. Docs

- `docs/USER-MANUAL.md` → v1.0.3 manual (**## Software Update** + portable-edition updates; Download section keeps v1.0.2 Hotfix 1 as Stable).
- `tools/gen_user_guide.mjs` → v1.0.3 (regex checks, required content, title/cover/version).
- `installers/TindaPOS-User-Guide.pdf` → regenerated (11 pages, 94,370 B, v1.0.3).
- `README.md` → "## In-App Update System (v1.0.3 — implemented, not yet released)".
- `docs/RELEASE_NOTES_v1.0.3.md` → DRAFT — NOT RELEASED.
- `docs/PROJECT_PROGRESS.md` → Phase 23 entry added.

## 7. Upgrade path (v1.0.2 Hotfix 1 → v1.0.3)

First release is **manual, one-time**: download the v1.0.3 EXE and run it. After v1.0.3 is live, later releases update in-app automatically.

## 8. Not done / not published

- **NO** GitHub tag/release assets/Latest for v1.0.3.
- `v1.0.2-hotfix.1` untouched (remains the live stable release with its original asset digests).
- No force push, no tag deletion, no `installers/` asset re-upload.
- Source + docs changes on `master` are **uncommitted** and awaiting review.