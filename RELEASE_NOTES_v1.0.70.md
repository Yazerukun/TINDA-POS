## ✨ What's New in TINDA POS v1.0.70 (7-Eleven Micro Thermal Spacing & Express Manual Print Edition)

> **7-Eleven Retail Micro Thermal Spacing, Double-Divider Grand Totals, Tabular Right-Aligned E-Wallet & Bills Slips, and Express Manual Print in Cash In / Out Register.**

### 🧾 1. 7-Eleven Micro Thermal Spacing & Double-Divider Receipts
- **Commercial Retail Monospace Typography**: Standardized receipt typography to pure monospace font family (`'Courier New', Courier, Consolas, monospace`) matching 7-Eleven retail slips.
- **Ultra-Compact Vertical Padding**: Reduced page padding and margins to `1mm 1mm 2mm 1mm`, maximizing thermal roll conservation without compromising legibility on 58mm and 80mm rolls.
- **Authentic Double-Divider Totals**: Introduced double-line divider `================================` (`border-top: 3px double #000000; margin: 3px 0;`) before grand totals across both on-screen previews and hardware thermal prints.
- **Standard Retail Footer**: Formatted footer with item count and friendly message: `Thank you! Please come again.`.

### 💳 2. E-Wallet & Bills Tabular Alignment
- **Tabular Decimal Precision**: Expanded money-line detection in receipt generation to right-align `Amount`, `Service Fee`, `Bill Amount`, `TOTAL PAID`, `TOTAL CASH RECEIVED`, and `TOTAL CASH RELEASED` using `font-variant-numeric: tabular-nums`.
- Prevents ragged edges and misaligned amounts across both ESC/POS thermal burns and manual Windows system dialog printouts.

### ⚡ 3. Express Manual Print in Cash In / Out Register
- **Immediate Action Buttons**: Added dedicated Auto Print (`Printer`) and Manual Print (`Manual`) buttons directly on Recent E-Wallet Transactions in the Cash In / Out register tab.
- Store cashiers can instantly invoke the Windows print dialog without switching tabs.

### 🧪 4. 100% Quality Invariants & Automated Test Verification
- All **417** automated vitest unit tests passing across **63** test files (100%).
- TypeScript compilation passing with **0** errors.
- Master codebase invariants fully verified.

---

### 📦 Checksums (SHA-256)
```
9eea4182a3777ee6edea089ee9516c1dbef12396bc8b365b1b361ff180db93ad  TindaPOS-Setup-1.0.70.exe
1dc0f21370fb9430d59f0287154cc8a92c86746ab269fb6818a0c3da0b98981d  TindaPOS-Portable-1.0.70.exe
c8cad10c090220a7f0fcedf5e76eedf14afcc175fe09b6a9d0ad7a02de6973a0  TindaPOS-Setup-1.0.70.exe.blockmap
a37bed80a41f4eb3788e166dd879f6c7850fc28732cf0db5251890c20033d73d  latest.yml
```
