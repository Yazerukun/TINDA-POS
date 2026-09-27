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
6. ❌ Never push, merge, or track proprietary source code (`source/`, `tools/`) to the public distribution repository (`Yazerukun/TINDA-POS`). All application source code must strictly reside in the private repository (`Yazerukun/TINDA-POS-Source`).

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
* **Auto-Updater Compatibility:** Seamless in-app update transition from v1.0.28/v1.0.29/v1.0.30 to v1.0.31 via `electron-updater` and GitHub Releases (`Yazerukun/TINDA-POS`).
* **Canonical Release Artifacts:**
  - `TindaPOS-Setup-1.0.31.exe` (NSIS installer with delta update support)
  - `TindaPOS-Setup-1.0.31.exe.blockmap` (Differential blockmap)
  - `latest.yml` (Version metadata and SHA-512 hashes)
  - `TindaPOS-Portable-1.0.31.exe` (Zero-install portable runtime)
  - `TindaPOS-User-Guide.pdf` (30-page official documentation)

---

## 7. Complete Backup & Import Matrix (Verified Protocols)
| Mechanism | Source Format | Scope & Tables Affected | Safety / Invariants | Verification Suite |
| :--- | :--- | :--- | :--- | :--- |
| **Simple POS Ingest** | `.json` (`simple_pos_secure_*.json`) | `products`, `product_units`, `categories`, `inventory_movements` | **Zero Auth Impact:** `users` array ignored. Auto-SKU (`SP-XXXX`), negative stocks clamped to 0, fractional kg rounded to base units. | `src/main/services/__tests__/simple-pos-import.test.ts` (5 tests) |
| **Standard CSV Import** | `.csv` (TINDA template) | `products`, `product_units`, `categories`, `inventory_movements` | Required column enforcement, non-negative checks, duplicate SKU/barcode detection, atomic rollback. | `src/main/services/__tests__/v104-feedback.test.ts`, `v108-features.test.ts` |
| **Native SQLite Backup** | `.db` (`tindapos-YYYY-MM-DD-*.db`) | Full Database (All 28 tables) | WAL checkpoint (`TRUNCATE`), SQLite `PRAGMA integrity_check`, cloud-sync mirror support. | `src/main/services/__tests__/stabilization.test.ts`, `integration.test.ts` |
| **Universal Exchange** | `.tinda-backup` (Compressed/JSON) | Cross-Platform Interchange (Windows ↔ Android) | Bidirectional portability between Desktop SQLite and Android Dexie IndexedDB. Version-tolerant schema mapping. | `src/main/services/__tests__/tinda-backup-windows.test.ts`, `src/shared/__tests__/tinda-backup.test.ts` |
| **Pre-Import Auto Snapshot** | `.db` (`tindapos-pre-import.db`) | Snapshot Copy | Automatically triggered before high-volume operations (batch CSV/JSON imports, store resets) to guarantee zero data loss. | `src/main/repositories/backup.ts` (`createBackupSync`) |

---

## 8. Quality Assurance & Distribution Verification Protocols
1. **Automated Test Gate:** 100% pass mandate across all 44 test suites (302/302 Vitest tests) before pushing any release branch or tag.
2. **User Manual Sync:** `USER-MANUAL.md` must be updated with matching release notes; `TindaPOS-User-Guide.pdf` must be compiled via Electron headless renderer (`gen_user_guide.mjs`) ensuring correct page count and EOF validation.
3. **Release Integrity Check:** All 5 canonical assets (`Setup.exe`, `Portable.exe`, `.blockmap`, `latest.yml`, `User-Guide.pdf`) must be uploaded and verified against SHA-512 and SHA-256 manifests on GitHub Releases.

---

## 9. Universal Hardware & Camera Barcode Scanner Architecture (v1.0.30 & v1.0.31)
* **Hardware USB Scanner Engine (Preserved & Parallel):**
  - **Driver-Free Plug-and-Play:** 95%+ of retail handheld barcode scanners (Honeywell, Zebra, Netum, Eyoyo, generic USB/2.4G HID keyboard wedges) run with zero driver installation on Windows 10/11.
  - **Global Burst Interceptor (`barcodeScanner.ts`):** Sub-50ms keystroke burst detection intercepts scans anywhere in the POS window without clicking into the search box.
  - **Visual HUD Status:** Continuous `🟢 Scanner Ready` indicator in the POS header.
* **Built-in Camera & Smartphone Barcode Scanner (`CameraScannerModal.tsx`, v1.0.31+):**
  - **Pure-Client Decoding (`@zxing/library`):** Offline video frame decoding for EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, and QR Code with zero network calls.
  - **Multi-Device Support:** Dynamic camera selector supports laptop webcams, external USB cameras, and smartphones connected via wireless webcam drivers (Iriun Webcam, DroidCam, or Android 14 USB Webcam).
  - **Web Audio Feedback:** Generates synthesized 920Hz audio beeps on successful scan without external asset dependencies.
  - **Smart Debounce:** 1.5s duplicate protection prevents runaway cart insertions while holding products steady.
  - **Integrated Phone Guide:** Built-in modal instructions in Bisaya/English guide store owners through zero-cost smartphone camera setup.

---

## 10. Multi-Terminal LAN Architecture & VPS Remote Database Blueprint
### A. The Multi-PC Shared Database Reality (Offline LAN Master/Satellite)
* **CRITICAL INVARIANT:** Never share a raw SQLite `.db` file across Windows Network Shares (SMB / mapped drive). Doing so causes locking starvation (`SQLITE_BUSY`), disk cache incoherence, and index corruption when multiple terminals write concurrently.
* **Master-Satellite LAN Topology:**
  1. **Master Terminal (Cashier 1 / Server PC):** Hosts the local SQLite database and runs the local TINDA POS REST/IPC service bound to the store's Local Area Network IP (e.g. `192.168.1.100:3111`).
  2. **Satellite Terminals (Cashier 2, Cashier 3, Stockroom PC):** Run TINDA POS in Satellite Client mode configured with the Master's IP. All transactions, cart checkouts, and inventory adjustments route over high-speed local HTTP/WebSocket calls.
  3. **Zero Internet Requirement:** Functions 100% offline via local Wi-Fi router or unmanaged Ethernet switch.

### B. VPS Remote Hosting & Cloud Mirroring Architecture
* **Self-Hosting on VPS:** Store owners who want remote owner dashboards or multi-branch consolidation can deploy TINDA POS Cloud Hub on any Linux/Windows VPS ($5/mo digitalocean, linode, etc.):
  - **Option 1: Headless TINDA Node Daemon on VPS:** Exposes authenticated endpoints over TLS/HTTPS with a PostgreSQL or checkpointed SQLite backend.
  - **Option 2: Offline-First Async Replication (Recommended):** Each retail branch runs a local Master Terminal with zero-latency local checkouts. Transactions stream asynchronously to the VPS via Litestream SQLite replication or JSON event logs. If internet fails, store sales never stall.

---

## 11. Dual-Repository Security & Intellectual Property Protection Architecture
* **Proprietary Source Isolation (`Yazerukun/TINDA-POS-Source`):**
  - **Visibility:** STRICTLY PRIVATE.
  - **Scope:** Complete repository containing 100% of the application source code (`source/`), build automation & packaging scripts (`tools/`), raw databases, development branches (`*-dev`), and full git history.
  - **Access Rule:** Restricted strictly to the project owner/admin. Never made public.
* **Public Distribution & Release Hub (`Yazerukun/TINDA-POS`):**
  - **Visibility:** PUBLIC.
  - **Scope:** Sanitized binary distribution hub containing exclusively:
    - User documentation (`README.md`, `docs/USER-MANUAL.md`, official PDF user guides).
    - Architecture & Release manifests (`latest.yml`, `.blockmap`, SHA-256 checksums).
    - Public GitHub Releases delivering compiled Windows NSIS installers and portable executables.
  - **Security Invariant:** The public repository MUST NEVER track or host the `source/` or `tools/` directories. All development, commits, and tests occur strictly within the private repository and local private tracking branches.
  - **Auto-Updater Continuity:** Preserves the public GitHub Releases endpoint so `electron-updater` operates smoothly for all retail store clients without requiring private tokens.




