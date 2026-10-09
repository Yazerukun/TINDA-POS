# TINDA POS v1.0.73 — Release Notes

**Release Date:** October 8, 2026  
**Build Target:** Windows x64 (NSIS Installer & Portable Executable)  
**Status:** Stable Production Release Candidate (Built & Verified Locally)  

---

## 🌟 What's New in Version 1.0.73

### 1. Deterministic Zero-Wrap Receipt Timestamps (Reference Standard)
- **Eliminated Date Wrapping on 58mm**: Replaced multi-line locale timestamps (`Oct 8, 2026, 9:49 \n AM`) with a clean, deterministic single-line format (`MM/DD/YYYY h:mm A`, e.g., `10/08/2026 9:49 PM`), completely eliminating date wrapping on 32-column 58mm rolls.
- **System-Wide Receipt Consistency**: Synchronized across POS sales checkout receipts, printer test stubs, X/Z shift balancing reports, E-Wallet Cash In/Out claim slips, Bills payment receipts, and audit history stubs.

### 2. Standardized Double-Divider Total Hierarchy (1.jfif & 2.jfif References)
- **Distinct Total Borders**: Grand total blocks strictly bordered with crisp double dividers (`================================`) above and below grand totals (`TOTAL`, `TOTAL PAID`, `TOTAL CASH RECEIVED / RELEASED`).
- **Adjacent Separator Collapse**: Enhanced `rowsToHtml()` parser to automatically detect adjacent dividers on total blocks, preventing redundant 4-line double borders while preserving authentic retail receipt appearance.
- **1:1 Parity**: Guaranteed identical visual structure across Auto Print (thermal heads) and Manual Print (Windows OS Print Dialog).

### 3. Bills Cash Tendered & Change Calculation
- **Interactive Tender Input**: Added Cash Tendered input and real-time Change calculation directly inside the Bills & E-Load center.
- **Thermal Slip Breakdown**: Records and prints `CASH` received and `CHANGE` return lines right below `TOTAL PAID` on customer payment receipts (matching reference `1.jfif`).

### 4. Ultra-Compact Zero-Waste Thermal Spacing & Strict English Standard
- **Paper-Saving Typography**: Standardized monospace font stack with `line-height: 1.05`, integer 10px body, 11px bold headers, 9px footers, and micro-margins (`2mm`) for crisp, high-density, zero-waste thermal printing.
- **100% Professional English**: Cleaned up all user-facing interfaces and receipts (clearing legacy terms like "Tubo" in favor of "Fee", "Total Fees Earned", and "Service Fee").

### 5. 100% Quality Invariants & Automated Test Verification
- **All 63 Test Suites Passing**: 418 unit tests passed with 0 failures.
- **TypeScript Compilation**: 0 errors across Node.js backend and React web targets.
- **Master Invariants Verified**: Remote URL, migrations schema, and critical components verified 100%.

---

## 🔒 Verification & Integrity Hashes (SHA-256)

| Artifact | File Name | Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- |
| **Windows Installer** | `TindaPOS-Setup-1.0.73.exe` | 107.17 MB | `112af896b9ef6413673579f388f4ecedf47621bce1e5fbbf2ead7791e78be53d` |
| **Portable Version** | `TindaPOS-Portable-1.0.73.exe` | 106.95 MB | `0436840c3b62e3f089f4aef226e468f064937ea21f95ef9727b3ea875afa7e0b` |
| **Auto-Update Map** | `TindaPOS-Setup-1.0.73.exe.blockmap` | 119.80 KB | `bce2f877843a8f659b16fc88bcf4c550c59af216f08200fe787f1e1d45267f04` |
| **Update Manifest** | `latest.yml` | 348 B | `535491db1e8857f2b17e80be2898bcd6eab3527c9eb866ed428c0d1b75f8e0aa` |
