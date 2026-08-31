# TINDA POS — Installers

Final shipped installers live here.

| File | Type | Size | Status |
|------|------|------|--------|
| `TindaPOS-Setup-1.0.0.exe` | Windows installer (NSIS) | 110 MB | **BUILT** — ready to post |
| `TindaPOS-1.0.0.AppImage` | Linux package | 133 MB | Built in `../source/builds/`, verified |
| `TindaPOS-User-Guide.pdf` | 8-page guide (install + manual) | 17 KB | **BUILT** — ready to post |

Build outputs also live under `../source/builds/`:
- `win-unpacked/TindaPOS.exe` — unpacked Windows app (portable test)
- `linux-unpacked/…` — unpacked Linux app

## PHCorner release bundle

1. `TindaPOS-Setup-1.0.0.exe` — Windows installer
2. `TindaPOS-1.0.0.AppImage` — Linux package
3. `TindaPOS-User-Guide.pdf` — installation + user guide

Rebuild notes:
- Windows `.exe` is built on Linux via **Wine** (`electron-builder --win nsis`).
- The PDF generator lives in `../tools/gen_user_guide.py` (reportlab).
