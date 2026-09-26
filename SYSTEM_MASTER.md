# SYSTEM_MASTER.md — TINDA POS Desktop Suite Architecture
> **STATUS**: LIVING MASTER DOCUMENT | **STRICT ARCHITECTURE BLUEPRINT**
> GitHub: `Yazerukun/TINDA-POS` | Windows Desktop Installers & Master Distribution

---

## 1. System Identity & North Star
* **Core Purpose:** The flagship offline desktop point-of-sale for Windows (10/11). Includes Setup installer, Portable edition, 172-item pre-seeded market catalog, and complete shift/cash drawer reconciliation.
* **Non-Negotiable Invariants:**
  - **Zero Setup Burden:** Works out of the box with zero runtime prerequisites.
  - **Local SQLite Engine:** Strict ACID guarantees, zero cloud dependencies.
  - **Bulletproof Thermal Printing:** ESC/POS direct USB & serial printer driver support.

---

## 2. Tech Stack & Environment Locks
| Layer | Technology | Rule |
| :--- | :--- | :--- |
| **Desktop Shell** | Electron / Native Desktop Runner | Stable packaging for Windows 10/11 |
| **Local Database** | Embedded SQLite3 | Local storage with automatic backup triggers |
| **Packaging** | NSIS / Portable Executable | Signed binaries, zero-install portable option |

---

## 3. Core Operational Modules
1. **Sales Terminal:** Fast keyboard navigation, barcode scanner support, cash drawer kick.
2. **Catalog & Inventory:** Pre-seeded Philippine sari-sari items, low stock warnings.
3. **Utang (Credit Ledger):** Detailed customer tracking, partial payments, receipts.
4. **Shift & Cash Reconciliation:** End-of-day Z-reading, float cash, variance reporting.

---

## 4. Forbidden Actions
1. ❌ Never distribute builds without running the complete validation suite (all unit & integration tests passing).
2. ❌ Never alter pre-seeded catalog formats without backwards compatibility migrations.
3. ❌ Never introduce telemetry or cloud phoning home without explicit user opt-in.
4. ❌ Never mutate, overwrite, or drop existing user credentials, authentication hashes, or active sessions during third-party data imports.
5. ❌ Never execute multi-record external imports outside of an atomic SQLite transaction (`db.transaction`).

---

## 5. Third-Party Data Import Architecture (v1.0.29+)
* **Simple POS JSON Ingest Engine (`simplePosImport`):**
  - **Catalog & Inventory Scoped:** Ingests `categories`, `products`, `units`, and initial opening stocks.
  - **Auth Isolation:** External `users` arrays are strictly ignored to prevent account hijack or password hash corruption.
  - **Deterministic SKU Mapping:** Auto-generates structured `SP-XXXX` SKUs matching original numerical IDs to satisfy SQLite `UNIQUE` constraints.
  - **Data Sanitization:** Clamps negative stocks to `0`, rounds fractional kilogram metrics to whole base units, and ensures positive prices.
  - **Pre-Import Safety Snapshot:** Auto-triggers a checkpointed SQLite backup before processing import payloads.
  - **Audit Logging:** Every imported stock balance generates an `inventory_movements` record tagged as `SIMPLE_POS_IMPORT`.

---

## 6. Software Update & Release Guarantees
* **Auto-Updater Compatibility:** Seamless in-app update transition from v1.0.28 to v1.0.29 via `electron-updater` and GitHub Releases (`Yazerukun/TINDA-POS`).
* **Canonical Release Artifacts:**
  - `TindaPOS-Setup-1.0.29.exe` (NSIS installer with delta update support)
  - `TindaPOS-Setup-1.0.29.exe.blockmap` (Differential blockmap)
  - `latest.yml` (Version metadata and SHA-512 hashes)
  - `TindaPOS-Portable-1.0.29.exe` (Zero-install portable runtime)

