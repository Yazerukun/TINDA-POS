## TINDA POS v1.0.17 Stable

RC source commit: `4aebd3d`
Updater gate: byte-identical to v1.0.16 (electron-updater + electron-builder untouched — verified git diff EMPTY + packaged app-update.yml / latest.yml identity).

### What's new

- **Fix Windows Startup Checkbox Accessibility**:
  - Fixed an issue where the "Start TINDA POS when I sign in to Windows" checkbox in Settings > Store was disabled / unclickable.
  - Removed restrictive environment checks (`PORTABLE_EXECUTABLE_*`) that falsely disabled startup on Windows Setup installations.
  - Wrapped registry login-item queries in safe error handling so Windows registry permissions never lock the setting.
  - Added safe fallback in Settings page ensuring the checkbox is always enabled and clickable on Windows.

### QA

- 247 tests / 35 files PASS, full typecheck + lint clean
- Startup setting unit and regression tests PASS
- Windows Setup & Portable RC builds verified; all artifacts SHA-256 verified

### Assets

- `TindaPOS-Setup-1.0.17.exe` (Setup installer + blockmap + latest.yml + Windows updater)
- `TindaPOS-Portable-1.0.17.exe` (Portable edition, no install)
- `TindaPOS-User-Guide.pdf` (v1.0.17)
- `SHA256SUMS-RC.txt` (verify all assets)
