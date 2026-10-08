# TINDA POS v1.0.74 — Release Notes

**Release Date:** October 8, 2026  
**Build Target:** Windows x64 (NSIS Installer & Portable Executable)  
**Status:** Stable Production Release Candidate (Built & Verified Locally)  

---

## 🌟 What's New in Version 1.0.74

### 1. Interactive Cupertino Deletion for E-Wallet Audit Records
- **Dedicated Row Delete Actions**: Added a dedicated Delete button (`Trash2`) on every audit row in the Audit History ledger table (`EwalletAudit.tsx`).
- **Apple-Grade Cupertino Confirmation Modal**: Protects stores from accidental deletions by displaying complete audit context:
  - Audit Date & Cashier
  - Physical Cash Status & Drawer Variance (`BALANCED`, `OVER`, `SHORT`)
  - 3-Way E-Wallet Variance (GCash, Maya, MariBank)
  - Total Service Fees Earned
- **Backend SQLite Deletion**: Wired to `deleteEwalletAudit(id)` in repository and `ewallet:deleteAudit` IPC channel, cleanly removing records without affecting underlying transactions or shift logs.

### 2. Bulk "Clear All Audits" Safeguard
- **Store-Wide Audit Reset**: Added a top-level "Clear All Audits" action button in the Audit History header.
- **Double-Confirmation Modal**: Allows store owners to wipe test audit runs or reset historical ledgers cleanly via `clearAllEwalletAudits()`.

### 3. Audit Sheet 1-Tap Count Reset & Today's Audit Delete Banner
- **Instant Count Reset**: Added **Reset Sheet** button (`RotateCcw` icon) on the live Audit Sheet action bar to immediately wipe counted denomination quantities, float target presets, and notes back to default zeros.
- **Today's Audit Status Banner**: Displays an interactive alert whenever an audit has already been recorded for today, featuring a 1-tap **Delete Saved Audit** button so cashiers can recount and re-audit immediately without switching tabs.

### 4. 100% Quality Invariants & Automated Test Verification
- **All 63 Test Suites Passing**: 419 unit tests passed with 0 failures (including new automated tests for audit deletion and bulk clearing).
- **TypeScript Compilation**: 0 errors across Node.js backend and React web targets.
- **Master Invariants Verified**: Remote URL, migrations schema, and critical components verified 100%.

---

## 🔒 Verification & Integrity Hashes (SHA-256)

| Artifact | File Name | Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- |
| **Windows Installer** | `TindaPOS-Setup-1.0.74.exe` | 107.17 MB | `da37c9ef8c98e27d9b2aee9d30031f71e86a067655a7a95c018f549369e6442c` |
| **Portable Version** | `TindaPOS-Portable-1.0.74.exe` | 106.96 MB | `6f86fd7cf41e08d3c56fa024aed7905e3a3f1cfa40df2715d646337272d96f1c` |
| **Auto-Update Map** | `TindaPOS-Setup-1.0.74.exe.blockmap` | 117.13 KB | `25ddfdd6c6569455044cc993e371b8aefeccb8a6c8f9762a4dbb50f9363ae794` |
| **Update Manifest** | `latest.yml` | 348 B | `7384e503d4ff119a3d1be409395a9dc97590fbb3ac688688c88c5330e1e09a55` |
