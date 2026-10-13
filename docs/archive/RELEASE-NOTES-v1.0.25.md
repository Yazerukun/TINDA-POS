# TINDA POS v1.0.25 Stable

Release target: `v1.0.25`
Updater gate: byte-identical firmware of updater machinery (electron-updater + electron-builder + app-update.yml untouched in this release, allowing seamless auto-update from v1.0.19, v1.0.20, v1.0.21, v1.0.22, v1.0.23, and v1.0.24 to v1.0.25).

---

## What's New in v1.0.25

### 1. Offline-First Online Price Guide / Market Price Reference
- Built-in market reference prices and suggested retail price ranges for Philippine sari-sari store staple commodities based on official DTI Suggested Retail Price (SRP) publications and market price guides.
- **Store Owner Authority Guaranteed**: Reference prices are strictly advisory. Your store selling prices are **never** automatically modified or overwritten. You can optionally click **"Adopt Reference Price"** in the product modal to copy it.
- **Dual-Probe Connectivity Check & Stale Data Transparency**: Safe background synchronization with dual connectivity checks (`gstatic` + `msftconnecttest`). In offline mode, clearly displays *"Offline — Showing Last Saved Data"*. Stale data (>30 days) is marked with an amber warning badge.
- **Preloaded Seed Catalog**: Includes pre-seeded reference prices for 20 staple Philippine products (Lucky Me Pancit Canton & Mami, Mega Sardines, 555 Sardines, Bear Brand, Nescafe, Kopiko, Great Taste, Coca-Cola, Datu Puti, Silver Swan, Safeguard, Surf, San Miguel, Red Horse).

### 2. Price Guide Modal Stability & Auto-Seed Fix
- **Resolved Blank Screen on Launch**: Fixed an issue where the Price Guide modal rendered blank on click due to a data contract mismatch between backend and frontend.
- **Defensive Safeguards**: Added `Array.isArray` guards to prevent any potential rendering crashes.
- **Automatic Seed on Fresh Databases**: Automatically populates the 20 staple commodity items if the database has not yet synced or is empty.

### 3. Dashboard Update Pop-Up Modal & Enhanced Responsiveness
- **Prominent Update Modal**: Added a dedicated update modal dialog that automatically surfaces when a new version is detected, providing clear release highlights, download progress, and 1-click update installation.
- **15-Minute Auto-Check Throttle**: Reduced the background update check throttle from 24 hours to 15 minutes, allowing newly published releases to be detected promptly upon visiting the Dashboard while safely respecting GitHub API rate limits.
- **Zero Interruption**: Cashiers can dismiss the modal with "Later" to continue transactions, while the prominent top banner remains accessible on the Dashboard.

---

## Deliverables

- `TindaPOS-Setup-1.0.25.exe` (Windows installer + auto-update payload)
- `TindaPOS-Portable-1.0.25.exe` (Portable edition)
- `TindaPOS-User-Guide.pdf` (v1.0.25)
- `SHA256SUMS-v1.0.25.txt`
