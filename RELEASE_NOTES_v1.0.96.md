# TINDA POS v1.0.96 Release Notes

**Release Date:** October 9, 2026  
**Build Target:** Windows x64 (NSIS Installer & Portable Executable)  
**Release Tag:** `v1.0.96`

---

## 🏷️ 1. Chiteng CT221B Direct Thermal Spooler Engine ("Mo Gana Pero Blank Paper Na-Fix")
- **RGB Color Spooling Fix**: Changed Chromium printing pipeline to pass 24-bit color graphics instead of 1-bit monochrome DIB format. On Windows, the Clabel/Chiteng minidriver expects RGB bitmaps to threshold dark pixels into thermal burn heat pulses; sending 1-bit raw monochrome was causing the printhead to interpret every pixel as white (`0xFF`), ejecting a blank label despite receiving the print job.
- **Native DEVMODE Resolution Alignment**: Removed conflicting forced 203 DPI override in Electron print options, allowing Windows and the vendor driver to negotiate precise coordinate scaling without clipping.
- **DOM Layout Synchronization**: Enforced double-frame animation buffer and DOM layout completion check before triggering `webContents.print()`, preventing premature rasterization of unrendered barcodes.
- **Trailing Blank Label Elimination**: Paged CSS media rule updated with `.label-tag:not(:last-child) { page-break-after: always; break-after: page; }`, completely eliminating spurious trailing blank sticker feeds.
- **High-Density Solid Black CSS**: Forced `-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color: #000000 !important;` on all text and barcode vectors.

---

## 💿 2. Bundled Official Drivers & Visual Setup Guide
- **Bundled Label Printer Driver V1.5**: Integrated official Clabel/Chiteng USB driver installer directly into app distribution assets (`resources/drivers/Label-Printer-Driver-V1.5.exe`).
- **Bundled Windows Setup Tutorial**: Included official PDF documentation (`resources/drivers/Chiteng-CT221B-Tutorial.pdf`).
- **1-Click Driver Installation**: Added direct "Install CT221B Driver (V1.5)" and "Driver Guide (PDF)" action buttons inside both the **Price Tag Print Modal** and **Hardware / Label Printer Settings**.
- **Cross-Distribution Packaging**: Configured `extraResources` in `electron-builder.yml` to automatically bundle driver binaries in both Windows NSIS Setup and Portable builds.

---

## 👑 3. Unified VIP-First Auto-Updater & Zero-Interruption Core
- **Single Dynamic Capsule**: High-polish non-blocking update capsule docked neatly in the top right header (`fixed top-3 right-6 z-40`).
- **Shift Close Deferral**: Postpone updates during busy customer rushes; silently applied upon cashier shift close.
- **Community Chat Clearance**: Top-right placement leaves the nationwide Community Chat button at `bottom-5 right-5` unobstructed.

---

## 📦 Checksums (SHA-256)
Refer to `SHA256SUMS-v1.0.96.txt` for cryptographic binary verifications.
