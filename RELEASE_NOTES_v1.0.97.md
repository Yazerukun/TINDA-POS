# TINDA POS v1.0.97 Release Notes

**Release Date:** October 9, 2026  
**Build Target:** Windows x64 (NSIS Installer, Portable Executable & Fast Feature Patch)  
**Release Tag:** `v1.0.97`

---

## 🖨️ 1. Zero First-Letter Clipping ("Walay Putol sa Sinugdanan")
- **Driver Printable Area Integration**: Switched Chromium printing pipeline from `marginType: 'none'` to `marginType: 'printableArea'` in `submitPrint()`. Coordinates now dynamically respect the printer's physical hardware margins, completely matching the native Windows print dialog behavior.
- **Defensive Left Gutter Padding**: Symmetrically centered thermal receipts (`margin: 0 auto !important;`) with an enforced `4.5mm` left padding for 58mm paper and `5.0mm` for 80mm paper. Text coordinates strictly begin at $X \ge 4.5\text{mm}$, ensuring leftmost characters (`Biller:`, `Date:`, `Ref #:`, `Customer:`, `TOTAL PAID`) are never placed in the physical thermal heating element blind spot.

---

## 🖤 2. High-Density Solid Black Standard ("Dili Blury, Klaro ug Itom")
- **24-Bit RGB Spooling**: Configured `color: true` on Windows thermal spooling. Windows GDI passes full-fidelity bitmaps to the vendor driver, allowing the printer to trigger native solid dark thermal burn pulses without Chromium's 1-bit Floyd-Steinberg halftoning dithering or speckling.
- **Native Resolution DEVMODE Scaling**: Removed hardcoded `dpi: 203` override, preventing GDI bitmap resampling and interpolation blur on non-standard and 180 DPI printheads.
- **Heavy-Weight Monospace Typography**: Upgraded font stack to `Consolas, 'Lucida Console', Monaco, monospace` with `font-weight: 800` (body) and `font-weight: 900` (totals/headers).
- **Micro-Stroke Emboldening**: Added `-webkit-text-stroke: 0.15px #000000 !important;` and `-webkit-print-color-adjust: exact !important;` for laser-crisp, deep black thermal burns.

---

## 🔄 3. 100% Manual vs Automatic Print Parity
- **Unified Bills & E-Load Hub**: Upgraded `BillsLoadHub.tsx` to route receipts through `window.api.ewallet.printBillSlip`, adding dual 1-click **Thermal Print (Auto)** and **Manual (System Dialog)** buttons matching `EwalletAudit.tsx`.
- **Consistent Output Across All Receipt Types**: Guaranteed visual uniformity across Checkout Receipts, Bills Payment, E-Load slips, E-Wallet Cash In/Out, and 3-Way Audit reports.

---

## 📦 Checksums (SHA-256)
Refer to `SHA256SUMS-v1.0.97.txt` for cryptographic binary verifications.
