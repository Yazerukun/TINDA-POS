# TINDA POS v1.0.72 — Release Notes

**Release Date:** October 8, 2026  
**Build Target:** Windows x64 (NSIS Installer & Portable Executable)  
**Status:** Stable Production Release Candidate (Built & Verified Locally)  

---

## 🌟 What's New in Version 1.0.72

### 1. Native Document Printing Engine (Inventory Sheets & Operations Reports)
- **Eliminated Browser Popup Failures**: Replaced fragile `window.open` popup printing with native Electron IPC `printer.printDocument`, resolving issues where popups were blocked or failed across various Windows printer drivers.
- **Dedicated Document Printing Pipeline**: Spawns a dedicated hidden BrowserWindow with `@page` CSS formatting and A4/Letter dimensions for crisp Stock on Hand Reports, Physical Count Sheets (blind audits), Purchase Orders (P.O.), and Stock Adjustment Logs.
- **Dual Document Action Buttons**: Added dual **Auto Print (A4)** (direct printing) and **Manual Print (Dialog)** (Windows native system print dialog with printer, copies, and PDF options) to both `InventoryPrintModal` and `PriceTagPrintModal`.

### 2. Dual Printing in E-Wallet Audit Sheet & Historical Audit Ledger
- **Manual OS Print Dialog Support**: Upgraded `ewallet:printAuditReport` to support optional `{ manual?: boolean }` execution via the Windows System Print Dialog.
- **Instant Dual Buttons**:
  - Live **Audit Sheet** footer offers: `Save Only`, `Save & Manual Print (Dialog)`, and `Save & Print (Thermal)`.
  - **Audit History** ledger equips every historical audit record with dual **Auto Print** (printer icon) and **Manual** (OS dialog pill) buttons for direct re-printing.

### 3. MariBank Digital Banking & E-Wallet Ecosystem Integration
- **Full Digital Banking Support**: Integrated **MariBank** (Shopee/SeaMoney digital bank in the Philippines) alongside GCash and Maya across E-Wallet Cash In / Out, Bills & E-Load center, transactions ledger, and shift audits.
- **Branded Visual Identity**: Distinct Sea/Shopee vibrant orange identity (`#FF6A00` gradient badges and chip selectors).
- **SQLite Database Migration 13**: Created Migration 13 updating the `ewallet_transactions` channel check constraint to `('GCASH', 'MAYA', 'MARIBANK')`, added 6 MariBank reconciliation columns to `ewallet_audits` (starting balance, cash in, cash out, expected, actual, variance), and added automatic startup column healing.
- **Receipt & Shift Balancing Breakdown**: Thermal receipt audit slips cleanly parse and print MariBank reconciliation sections alongside GCash and Maya.

### 4. 100% Quality Invariants & Automated Test Verification
- **All 63 Test Suites Passing**: 418 unit tests passed with 0 failures.
- **TypeScript Compilation**: 0 errors across Node.js backend and React web targets.
- **Master Invariants Verified**: Remote URL, migrations schema, and critical components verified 100%.

---

## 🔒 Verification & Integrity Hashes (SHA-256)

| Artifact | File Name | Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- |
| **Windows Installer** | `TindaPOS-Setup-1.0.72.exe` | 107.17 MB | `52b40bf9306485642de346bcce73bcd8f4a96bd2ebf40f09d0132b3afa56ed4f` |
| **Portable Version** | `TindaPOS-Portable-1.0.72.exe` | 106.95 MB | `87e66cafe5c5eb53ae6c1b49b8f0bceb0b5a48f613ef103d584016fd016f6bff` |
| **Auto-Update Map** | `TindaPOS-Setup-1.0.72.exe.blockmap` | 119.78 KB | `a07141c3ccf414e3e101255a8e08be4fdc4cc32f34c9d853a31c9e1953ba3017` |
| **Update Manifest** | `latest.yml` | 348 B | `bdf4719c1b84ec002baf94733ad7dd47afda77feafb51d3d15faa42b01bd4343` |
