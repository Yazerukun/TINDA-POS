# TINDA POS v1.0.26 Stable

Release target: `v1.0.26`
Updater gate: byte-identical firmware of updater machinery (electron-updater + electron-builder + app-update.yml untouched in this release, allowing seamless auto-update from v1.0.19, v1.0.20, v1.0.21, v1.0.22, v1.0.23, v1.0.24, and v1.0.25 to v1.0.26).

---

## What's New in v1.0.26 (TINDA BANTAY Edition)

### 1. TINDA BANTAY: Real-Time Market Price Feed
- **Live Online Price Feed**: Automatically connects to the verified Philippine grocery commodity price feed (`data/price-catalog.json`) via HTTPS whenever internet connectivity is detected.
- **Auto Live-Sync on Open**: Opening the **Price Guide** modal while connected to the internet triggers a silent background sync that immediately updates prices live on the screen without requiring a manual click on "Sync".
- **Auto-Sync on Network Reconnect**: When network connectivity is restored (e.g., WiFi or mobile data reconnected), the app detects the `online` event and immediately synchronizes the latest market reference prices.
- **Pulsing 🟢 LIVE Indicator Badge**: The Price Guide modal features a live animated indicator badge:
  - 🟢 **`LIVE · Bantay Presyo Online`** with a pulsing green LED indicator when online.
  - ⚪ **`OFFLINE · Cached Local Data`** when disconnected, reassuring the cashier that store operations remain 100% functional offline.
- **Store Owner Authority Guaranteed**: Reference prices are strictly advisory. Store owner selling prices and costs are **never** automatically modified or overwritten.

### 2. TINDA SCOUT Harvester (`tools/tinda-scout/scout.py`)
- Powered by **`d4vinci/Scrapling`** for stealthy, anti-bot-bypassing price harvesting from major Philippine retail supermarket chains (Puregold, Super8, SM Markets) and official DTI SRP advisories.
- Outputs sanitized, integer-centavo records with verified EAN-13 barcodes, variants, units, and product images.

### 3. All Previous v1.0.25 & v1.0.24 Capabilities
- Dashboard Update Pop-Up Modal with 15-minute background auto-check throttle.
- Price Guide modal stability and defensive `Array.isArray` guards.
- Auto-seed catalog of 20 staple Philippine grocery commodities on empty databases.
- Full offline-first local SQLite caching.

---

## Deliverables

- `TindaPOS-Setup-1.0.26.exe` (Windows installer + auto-update payload)
- `TindaPOS-Portable-1.0.26.exe` (Portable edition)
- `TindaPOS-User-Guide.pdf` (v1.0.26)
- `SHA256SUMS-v1.0.26.txt`
