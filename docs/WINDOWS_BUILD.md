# TINDA POS — Windows Build Guide

TINDA POS is developed on Linux (Omarchy/Arch) but ships to Windows as a native
NSIS installer. All prerequisites are vendored under `source/node_modules` and
the prebuilds directory, so **no compilation toolchain is required.**

> **Update (2026-08-31):** the `.exe` is now built **directly on this Linux
> machine via Wine** — no separate Windows machine or online service needed.
> See "Build on Linux via Wine" below.

The Windows deliverables (both BUILT): `D:\TINDA-POS\installers\`:

- `TindaPOS-Setup-1.0.0.exe` — NSIS installer (point customer to this)
- `TindaPOS-Portable-1.0.0.exe` — portable, no-install version
- `SHA256SUMS.txt` — checksums
- `TINDA-POS-Windows/` — clean customer folder (installers + README-FIRST.txt)

---

## Build on Linux via Wine (works, no Windows needed)

Install Wine, then electron-builder drives NSIS through it:

```bash
sudo pacman -S --needed wine        # Arch/Omarchy
# Debian/Ubuntu: sudo apt install wine64

source /mnt/D/TINDA-POS/tools/env.sh
cd /mnt/D/TINDA-POS/source
./node_modules/.bin/electron-vite build
./node_modules/.bin/electron-builder --win --config electron-builder.yml
```

The `--win` flag builds every configured Windows target. It produces BOTH the
NSIS installer and the portable exe in one pass:

Output: `source/builds/` →

- `TindaPOS-Setup-1.0.0.exe` — NSIS installer
- `TindaPOS-Portable-1.0.0.exe` — portable build
- `win-unpacked\TindaPOS.exe` — the unpacked app (portable test)

Copy both exes to `D:\TINDA-POS\installers\` to ship, then regenerate
`SHA256SUMS.txt`.

Notes:
- The `win32-x64` better-sqlite3 prebuild is vendored, so no MSVC/compile step.
- Wine is only used for the NSIS packaging pass (signtool/7zip helpers); the app
  itself is unchanged.

---

## Build on an actual Windows machine

1. **Node.js LTS** (20+): https://nodejs.org — installs `npm`.
2. **pnpm** (v9+, matches the Linux pnpm-lock.yaml):
   ```
   npm install -g pnpm@11
   ```
3. Copy the project to Windows, e.g. to `D:\TINDA-POS`.

   Everything needed is already in the repo; the Windows `better-sqlite3`
   prebuild (`win32-x64.node`) is **already included** in `source/node_modules`,
   so no Visual Studio / windows-build-tools is required.

4. Make sure the Linux-built `out/` (compiled JS) is NOT stale — rebuild fresh
   on Windows (step 2 below).

---

## Build steps

From `D:\TINDA-POS\source`:

```powershell
# 1. Install exact deps from lockfile (fast, uses existing prebuilds)
pnpm install --frozen-lockfile

# 2. Compile main/preload/renderer
.\node_modules\.bin\electron-vite build

# 3. Optional sanity checks
.\node_modules\.bin\tsc --noEmit -p tsconfig.node.json
.\node_modules\.bin\tsc --noEmit -p tsconfig.web.json

# 4. Package the Windows installer (NSIS + portable)
.\node_modules\.bin\electron-builder --win --config electron-builder.yml
```

The output lands in `D:\TINDA-POS\builds\`:

- `TindaPOS-Setup-1.0.0.exe` — the NSIS installer (the deliverable)
- `TindaPOS-Portable-1.0.0.exe` — the portable version
- `win-unpacked\TindaPOS.exe` — the unpacked app (portable test)

Copy both exes to `D:\TINDA-POS\installers\` to ship.

---

## Installer options (pre-configured in electron-builder.yml)

- **One-click off** + directory chooser (`allowToChangeInstallationDirectory`)
- Desktop + Start-menu shortcuts, "Run after finish"
- Uninstall keeps user data (`deleteAppDataOnUninstall: false`) — DB/backups/receipts
  live under `%APPDATA%\TINDA POS` and survive uninstall/reinstall
- App metadata / icon (`build\icon.ico`) already present

---

## Data location (matches runtime)

On Windows the offline database + backups + receipts live in
`%APPDATA%\TINDA POS\` (Electron `userData`), with subfolders:
`database\tindapos.db`, `backups\`, `receipts\`, `exports\`, `logs\`.

---

## Troubleshooting

- **"The `pnpm` field ... is no longer read"** — harmless warning from pnpm 11.
- **better-sqlite3 load failure on Windows** — confirm `win32-x64.node` exists in
  `node_modules\better-sqlite3\prebuilds\`. If a rebuild is ever forced, run
  `.\node_modules\.bin\electron-rebuild -f -w better-sqlite3` and re-run step 4.
- **SmartScreen warning** — the exe is unsigned; a "More info → Run anyway"
  notice is expected. Code-signing is a future release step.
