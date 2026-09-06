# TINDA POS v1.0.3 Release Notes (DRAFT — NOT RELEASED)

> This is the working draft for the next release. v1.0.3 is **not published**.
> The current stable release remains **v1.0.2 Hotfix 1**.

## What's New

### In-App Update System

- **Software Update screen** — Settings → About → Software Update shows the installed version, update status, What's New, and a **Check for Updates** button.
- **Automatic daily check** — on startup TINDA POS quietly checks the official GitHub release page at most once per day for **stable versions only** (drafts, prereleases, and invalid tags are ignored; comparison is true semver, not string).
- **Non-intrusive notification** — an update-ready banner appears in the corner; it never blocks or interrupts checkout.
- **Restart & Install** — installed (Setup) editions download the update, then apply it only when the user chooses **Restart & Install** or **Install Later**. The app never restarts on its own.
- **Portable flow** — the Portable edition cannot replace itself: it downloads the new `TindaPOS-Portable-*.exe` to `Downloads\TINDA-POS-Updates`, opens the folder, and the user runs the new version from there. `TindaPOS-Data\` and Shared AppData are never touched.
- **Pre-update safety backup** — a store-database backup is created and validated before every installed update; if it cannot be made, the update pauses with a clear message.
- **Operation guard** — install/restart is blocked during checkout, payment, refund, void, backup, restore, Start New Store, or reset.
- **Offline-first** — check failures are silent for the automatic check; TINDA POS keeps working fully offline.
- **Security** — HTTPS, official repository only (`Yazerukun/TINDA-POS`); What's New is rendered as plain text; no remote content is executed.

### Updating from v1.0.2 Hotfix 1

v1.0.2 Hotfix 1 predates the update system, so the step to v1.0.3 is a **normal manual upgrade** — download the v1.0.3 Setup or Portable package from the GitHub releases page and run it. Once on v1.0.3, all later versions update in place.

## Data Safety

- Business data lives in Shared AppData (`%APPDATA%\TINDA POS\database\tindapos.db`) or a portable `TindaPOS-Data\` folder — never in the install directory.
- Updater bookkeeping (`update-state.json`) is app-internal metadata and never travels with backups or restores.
- Update storage, last-check timestamps, and dismissals are remembered across restarts.

## Testing

- **119/119 automated tests PASS** (71 existing + 48 new update-system tests) covering:
  - semver comparison (numeric, prerelease ordering, stability),
  - GitHub release parsing and stable-only filtering,
  - official-URL security guard,
  - 24h auto-check throttle and manual bypass,
  - offline / timeout / HTTP / rate-limit / invalid-metadata failures,
  - update available (newer patch/minor/major, older remote, dismissed),
  - download progress, safety-backup success and failure,
  - install-later dismissal, restart-and-install, critical-operation blocking,
  - portable detection, portable download, no self-overwrite.
- Lint, typecheck, production build, and PDF generation all PASS on Omarchy Linux.

## Windows Packaging (built under Wine on Omarchy — NOT native QA)

- Setup `TindaPOS-Setup-1.0.3.exe` and Portable `TindaPOS-Portable-1.0.3.exe` built via the existing Wine/electron-builder workflow.
- electron-updater metadata generated: `latest.yml`, blockmaps.
- **WINE PACKAGED QA** only. Native-Windows restart-and-install behavior is **PENDING** until validated on real Windows.
- Physical thermal-printer validation remains pending (existing limitation, unchanged).

## Remaining Limitations

- Installed-edition restart-and-install has not yet been validated on native Windows.
- No code-signing; SmartScreen may warn on first run.