# TINDA POS v1.0.24 Stable

Release target: `v1.0.24`
Updater gate: byte-identical firmware of updater machinery (electron-updater + electron-builder + app-update.yml untouched in this release, allowing seamless auto-update from v1.0.19, v1.0.20, v1.0.21, v1.0.22, and v1.0.23 to v1.0.24).

---

## What's New in v1.0.24

### 1. Offline-First Online Price Guide / Market Price Reference
- **Advisory Market Price Guidance**: Provides store owners with reference market prices and suggested price ranges (e.g. DTI Suggested Retail Price, Market Price Guide) directly within TINDA POS.
- **Store Owner Authority**: The price guide is strictly advisory. Store owner selling prices (`default_price_c`, `purchase_cost_c`) are **never** automatically modified or overwritten. Store owners can explicitly click "Adopt Reference Price" in the product modal if they choose.
- **100% Offline-First**: All price references are cached in local SQLite (`price_references`). The entire POS, cart, checkout, inventory, and reports remain fully operational with zero network dependence.
- **Dual-Probe Connectivity & Transparency**: Safe background synchronization with dual-probe connectivity check. When offline, explicitly displays `"Offline — Showing Last Saved Data"`. Stale data (>30 days) is clearly marked to prevent misleading pricing.
- **Preloaded Seed Catalog**: Bundled with standard Philippine commodity reference prices (Lucky Me Pancit Canton/Mami, Mega Sardines, 555 Sardines, Bear Brand, Nescafe, Kopiko, Great Taste, Coca-Cola, Datu Puti, Silver Swan, Safeguard, Surf, San Miguel, Red Horse).
- **Interactive Price Guide Modal**: Search, filter by source type (Official DTI / Market Reference), filter by linked status, manual sync button, and manual product linking/unlinking.
- **Subtle POS Card Indicator**: Displays reference price (`Ref: ₱10.50`) on product cards without cluttering the screen or impacting scanning speed.

### 2. Database Migration 8 (`price_references`)
- Fully indexed and foreign-key safe (`ON DELETE SET NULL`).
- Preserves all existing store data, sales history, inventory, and settings.

### 3. Stability & Verification
- 100% test pass rate across 42 test suites (292/292 tests).
- 0 TypeScript errors across Node and Web.
- Dashboard auto-notify update banner preserved.

---

## Release Artifacts
- `TindaPOS-Setup-1.0.24.exe` (Windows installer + auto-update payload)
- `TindaPOS-Portable-1.0.24.exe` (Portable edition)
- `TindaPOS-User-Guide.pdf` (v1.0.24)
- `SHA256SUMS-v1.0.24.txt`
