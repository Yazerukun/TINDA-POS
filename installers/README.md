# 💿 TINDA POS Installer & Release Artifacts Hub

Welcome to the official distribution directory for TINDA POS desktop client binaries, auto-updater metadata, and cryptographic integrity manifests.

---

## ⚡ Current Production Release: v2.1.4

| Asset | Type | Target Platform | Description |
|---|---|---|---|
| [`TindaPOS-Setup-2.1.4.exe`](https://github.com/Yazerukun/TINDA-POS/releases/download/v2.1.4/TindaPOS-Setup-2.1.4.exe) | NSIS Setup | Windows 10 / 11 (x64) | Full installation wizard with desktop shortcut and uninstaller |
| [`TindaPOS-Portable-2.1.4.exe`](https://github.com/Yazerukun/TINDA-POS/releases/download/v2.1.4/TindaPOS-Portable-2.1.4.exe) | Portable Binary | Windows 10 / 11 (x64) | Zero-installation standalone executable (run directly from USB / folder) |
| [`TindaPOS-Feature-Patch-2.1.4.zip`](https://github.com/Yazerukun/TINDA-POS/releases/download/v2.1.4/TindaPOS-Feature-Patch-2.1.4.zip) | Live Hot Patch | Any Existing Install | 0.3-second in-app live patch package without full installer download |
| [`latest.yml`](./latest.yml) | Update Manifest | Electron-Updater | Cryptographic SHA-512 manifest for automatic background updates |
| [`SHA256SUMS-v2.1.4.txt`](./SHA256SUMS-v2.1.4.txt) | Verification Hash | Security Audit | Cryptographic SHA-256 integrity checksums for all release binaries |

---

## 🛡️ Cryptographic Verification

To verify the authentic integrity of your downloaded installer binary on Windows PowerShell:

```powershell
# Compute SHA-256 hash
Get-FileHash -Algorithm SHA256 .\TindaPOS-Setup-2.1.4.exe

# Compare against official manifest
Get-Content .\SHA256SUMS-v2.1.4.txt
```

---

## 🔄 Automatic Updater Channel

TINDA POS includes an autonomous updater engine powered by `electron-updater`:
- The client periodically checks `latest.yml` hosted on GitHub Releases (`https://github.com/Yazerukun/TINDA-POS/releases`).
- When a new release or hot patch is published, store terminals receive update notifications or apply hot patches live with zero cashier downtime.

For full technical specifications and user manuals, see the [`docs/`](../docs/README.md) directory.
