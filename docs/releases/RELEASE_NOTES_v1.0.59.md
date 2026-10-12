# TINDA POS v1.0.59 Release Notes

**Release Date:** October 5, 2026  
**Build Target:** Windows x64 (NSIS Setup & Portable .exe)

---

## 🌟 Key Highlights & Enhancements

### 1. High-Density Enterprise Cashier Listing Table (Client Feedback Addressed)
- **Supermarket/Enterprise Grade Table View**:
  - Replaces traditional loose cards with a high-density, 5-column listing table optimized for fast-paced retail checkouts, wholesale groceries, hardware stores, and pharmacies.
  - Columns:
    1. **Product / SKU / Barcode**: High-contrast 36×36 image avatar, clear bold title, monospace cyan SKU tag, barcode value, and active in-cart counter badge (`🛒 X in cart`).
    2. **Category**: Subtle rounded category badge.
    3. **Stock Level & Safety Indicators**: Real-time quantity with unit, live pulse status indicator (🟢 Normal, 🟡 Low Stock Alert, 🔴 Out of Stock), near-expiry indicators, and blocked stock alerts.
    4. **Price / Tier**: Retail unit price, Wholesale tier badge (`WS: ₱XX.XX (≥10)`), Suggested Retail Price (`SRP`), and market reference pricing.
    5. **Cart Status & Actions**: In-line compact quantity stepper `[ - ] [ count ] [ + ]` for items already in cart (allowing instant quantity adjustments without leaving the table), plus `+ Add` button with out-of-stock guard. Whole-row click adds +1 to cart.

### 2. Dual-Mode POS Layout Switcher with Persistent Memory
- **Instant 1-Click Toggle**:
  - Cashiers can seamlessly switch between Table Listing mode and Card Grid mode using top-bar toggle icons in the POS search header.
  - Persisted in local terminal memory (`tinda_pos_view_mode`), defaulting to Table Listing for maximum operational throughput.

### 3. High-Speed Keyboard Navigation (`ArrowUp` / `ArrowDown` / `Enter`)
- **Hands-Free POS Ring-Up**:
  - Cashiers can browse products directly using `ArrowDown` and `ArrowUp` arrow keys with automatic smooth viewport tracking.
  - Pressing `Enter` adds the selected item directly into the active cart without requiring mouse interaction.

### 4. Zero Feature Regressions & Full Continuity Guarantee
- **100% Unbroken Workflow Compatibility**:
  - Hardware barcode laser scanners, docked hands-free counter webcam scanner, wireless phone companion scanning, CFD customer secondary screen, sales monitor, petty cash out modal (`F7`), e-wallet reconciliation hub, hold/resume sales, hotkeys (`F1`-`F10`), and offline-first LAN sync remain 100% functional without disruption.

---

## 🔒 Verification & Invariants
- **Vitest Suites**: 63/63 test files passed (411/411 unit & integration tests passing).
- **TypeScript**: 0 errors across Node (`tsconfig.node.json`) and Web (`tsconfig.web.json`) targets.
- **Master Invariants**: `tools/check_master_invariants.mjs` passed with 0 errors.

---

## 📦 Distribution Packages & SHA256 Checksums
- `TindaPOS-Setup-1.0.59.exe`: `7845e05a49895a7857962dc553f78fbf12e32d846a0e63f9fcd4aae5662bb698`
- `TindaPOS-Portable-1.0.59.exe`: `3d56bf853afc52e2e5decfce6059c04ed762d246efb013993d851bbd09675e36`
- `TindaPOS-Setup-1.0.59.exe.blockmap`: `41a4e43c120adbe8614f3a54556e462c366fc20fa517dfb8ed9a744f366dfabe`
- `latest.yml`: `277e942ec58e76736441c1d183afd8e500cce48659f7577fedcd35d038ce4004`
- `TindaPOS-User-Guide.pdf`: `91082a816b94535cc0458718f6de1389fb5e909d14690e4cf217133a8997b8fc`
