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
* **Auto-Updater Compatibility:** Seamless in-app update transition from v1.0.28–v1.0.33 to v1.0.34 via `electron-updater` and GitHub Releases (`Yazerukun/TINDA-POS`).
* **Canonical Release Artifacts:**
  - `TindaPOS-Setup-1.0.34.exe` (NSIS installer with delta update support)
  - `TindaPOS-Setup-1.0.34.exe.blockmap` (Differential blockmap)
  - `latest.yml` (Version metadata and SHA-512 hashes)
  - `TindaPOS-Portable-1.0.34.exe` (Zero-install portable runtime)
  - `TindaPOS-User-Guide.pdf` (31-page official documentation)

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
1. **Automated Test Gate:** 100% pass mandate across all 46 test suites (315/315 Vitest tests) before pushing any release branch or tag.
2. **User Manual Sync:** `USER-MANUAL.md` must be updated with matching release notes; `TindaPOS-User-Guide.pdf` must be compiled via Electron headless renderer (`gen_user_guide.mjs`) ensuring correct page count and EOF validation.
3. **Release Integrity Check:** All 5 canonical assets (`Setup.exe`, `Portable.exe`, `.blockmap`, `latest.yml`, `User-Guide.pdf`) must be uploaded and verified against SHA-512 and SHA-256 manifests on GitHub Releases.

---

## 9. Universal Hardware & Camera Barcode Scanner Architecture (v1.0.30–v1.0.33)
* **1-Click Phone QR Companion Scanner Engine (`phoneScannerService.ts`, v1.0.32–v1.0.33):**
  - **Dual HTTP & HTTPS Simultaneous Local Service:** 
    - **Port 3113 (HTTPS Secure Context):** Embeds a 100-year self-signed RSA-2048 SSL certificate (`IP:127.0.0.1, DNS:localhost`) directly in the Electron main process. Solves modern W3C browser security policy where `navigator.mediaDevices.getUserMedia` is strictly restricted to secure contexts (`isSecureContext === true`). On mobile Chrome/Safari, cashiers tap "Advanced" &rarr; "Proceed" once on first connect to unlock full 60 FPS live video scanning with animated laser reticle and continuous barcode capture.
    - **Port 3112 (Zero-Warning HTTP Fallback):** Runs in parallel on plain HTTP. If users do not want certificate security prompts, the mobile web interface offers an instant **📸 Tap to Snap Barcode Photo** mode powered by `<input type="file" accept="image/*" capture="environment">`. It directly launches the smartphone's native camera with autofocus and flash, captures the barcode image, and decodes it via in-memory ZXing. Works on 100% of mobile browsers with zero warnings and zero configuration.
  - **Adaptive Mobile Interface:** Mobile web client detects `isSecureContext` and `navigator.mediaDevices` availability automatically. If accessed over HTTP, it presents a prominent 1-tap "👉 Switch to HTTPS (Live Video)" action alongside the instant native photo snapshot button.
  - **Zero App Download Requirement:** Cashier scans the QR code directly with their smartphone's native camera (iPhone Camera / Google Lens). The phone instantly loads an offline-capable mobile web app over local Wi-Fi with zero external downloads or drivers.
  - **Mobile Hardware Acceleration:** Leverages smartphone rear camera with autofocus, hardware-accelerated `BarcodeDetector` (or local ZXing fallback), haptic feedback (`navigator.vibrate`), Web Audio beeps, and torch/flashlight toggle.
  - **Real-Time POS Push:** Scanned product barcodes beam via HTTP/HTTPS `POST /api/scan` directly into the Electron main process, which dispatches them into the active checkout cart in under 50ms.
  - **Live Pairing HUD:** The POS header and modal display a real-time connection badge (`🟢 Phone Ready: iPhone / Android`) updated via a 3-second heartbeat ping.
* **Hardware USB Scanner Engine (Preserved & Parallel):**
  - **Driver-Free Plug-and-Play:** 95%+ of retail handheld barcode scanners (Honeywell, Zebra, Netum, Eyoyo, generic USB/2.4G HID keyboard wedges) run with zero driver installation on Windows 10/11.
  - **Global Burst Interceptor (`barcodeScanner.ts`):** 120ms keystroke burst detection window and 350ms trailing window intercepts scans anywhere in the POS window without clicking into the search box.
  - **Wireless Mobile App Scanner Support:** Accommodates network packet jitter from wireless phone scanner apps (e.g. "Barcode to PC", Wi-Fi keyboard wedges), preventing dropped digits or mistaking scans for slow manual keyboard input.
  - **Direct Search Enter Handler (`POS.tsx`):** Scanned barcodes directed into the search input trigger immediate exact matching and cart addition on `Enter`, ensuring seamless operation even when the input field has active focus.
  - **Visual HUD Status:** Continuous `🟢 Scanner Ready` indicator in the POS header.
* **Built-in Camera Barcode Scanner Overhaul (`CameraScannerModal.tsx`, v1.0.32+):**
  - **Elimination of False-Positive Reads:** Removed unconstrained `ITF` (Interleaved 2 of 5) and `CODE_39` decoders that previously misread grocery barcode stripes as random 4-to-6-digit numbers.
  - **GS1 Modulo-10 Checksum Engine (`isValidBarcode`):** Implemented the official GS1 right-to-left alternating 3x/1x Modulo-10 algorithm for EAN-13, UPC-A, and EAN-8. Any corrupted frame or misread check digit is discarded immediately.
  - **High-Sensitivity Rapid Decoding (<15ms per frame):** Canvas frame downscaling (max 480px crop, 640px full-frame) reduces JavaScript CPU decoding time from 200ms to ~15ms, boosting frame sampling to **25 FPS** for snappy recognition.
  - **Decoder State Hygiene:** Explicitly invokes `reader.reset()` on every frame cycle to eliminate internal state residue.
  - **Hotplug Discovery:** Listens to `devicechange` events to auto-detect newly plugged cameras without restarting the app.
  - **Unit Barcode Matching (`products.ts`):** Database queries match both primary product barcodes and unit-level barcodes (`product_units.barcode`), allowing scanning variant packages (e.g., box vs single piece) directly into the cart.
  - **Manual Fallback Input:** Integrated manual barcode entry input inside the scanner modal allows immediate entry for worn, torn, or unreadable retail labels.

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

---

## 12. In-System Knowledge Architecture & Digital Book System (`Handbook.tsx`, v1.0.31+)
* **Zero-Download Offline Philosophy:**
  - Retail staff and cashiers frequently operate in offline environments without internet access or PDF viewers. Forcing users to download external manual PDFs creates severe operational friction.
  - Documentation is compiled directly into the application bundle as a first-class, interactive **Store Handbook** page (`/handbook`).
* **Digital Book Architecture ("Mura Ganig Libro"):**
  - **9 Comprehensive Operational Chapters:**
    1. System Overview & Daily Routine
    2. Cashier Terminal & POS Operations
    3. Barcode Scanners (USB & Smartphone Camera)
    4. Products, Units, Pricing & SRP Guide
    5. Customer Credit Ledger (Utang Tracking)
    6. Inventory Management & Stock Replenishment
    7. Shift Reconciliation, Cash Count & Z-Reading
    8. Database Backup, Safety & Data Recovery
    9. System Settings, Thermal Printers & Devices
  - **Book-Like Navigation UX:** Side drawer chapter selector, page-turn Next / Previous Chapter buttons, top chapter badge indicators, full search filtering across titles and subtopics, and quick-jump table of contents.
* **Contextual In-App Quick Help Modals (`HelpGuideModal.tsx`):**
  - Instant on-screen assistance embedded directly into high-traffic operational headers (**POS**, **Inventory**, **Utang**, **Backup & Data Safety**).
  - Cashiers click the floating **"Guide"** button to view modal operational checklists and hotkeys without losing their active checkout cart or screen state.
* **Printable Cashier Counter Cheat Sheet (`docs/CASHIER-QUICK-GUIDE.md`):**
  - Single-page, high-density reference sheet designed to be printed and laminated directly onto the cashier checkout counter.
  - Contains daily opening/closing procedures, keyboard shortcut matrix, payment handling steps, and emergency troubleshooting protocols.
* **100% English Language Standard:**
  - All user-facing documentation, manuals, tooltips, modals, and handbook chapters are strictly authored and maintained in standard professional English to eliminate linguistic ambiguity across multi-regional deployments.

---

## 13. Multi-Frame Barcode Consensus & Product Editing Stabilization (v1.0.34)
* **Product Editing & Unit Barcode Isolation (`products.ts`):**
  - **Root Cause & Fix:** In previous releases, updating a product with an existing barcode threw `Error: Duplicate barcode on a product unit.` because `validateProductInput` queried `product_units` without excluding the product's own ID (`excludeId`). The query now strictly checks `WHERE barcode = ? AND product_id != ?`, enabling store owners to edit product prices, names, and stock at any time without collision.
* **Deterministic Auto-SKU Generation (`generateSku`):**
  - **Zero Blank Collision:** SQLite enforces a strict `UNIQUE` constraint on `products.sku`. When a product is created or updated with a blank SKU (common in fast sari-sari store onboarding), the repository automatically assigns a sequential `SKU-XXXX` identifier (e.g. `SKU-0001`), completely eliminating `UNIQUE constraint failed: products.sku` errors.
* **Temporal Multi-Frame Stability Consensus:**
  - **False-Positive Elimination:** Camera glares, package wrinkles, and optical noise can occasionally produce single-frame false decodes. Both `CameraScannerModal.tsx` and `phoneScannerService.ts` now require **2 consecutive frames** with the identical barcode candidate before accepting the code (`candidateHits >= 2`).
  - **Decay Filter:** If a subsequent frame does not detect the candidate barcode, the hit counter immediately resets to zero, eliminating ghost reads.
* **Cart Strict Exact-Match Invariant (`POS.tsx`):**
  - **Zero Accidental Cart Fallbacks:** Removed `?? (res.rows.length > 0 ? res.rows[0] : null)` fallback logic from the POS cart scan handler. Scanned barcodes MUST match an exact primary barcode, unit barcode, or SKU. Optical noise or unrecognized text will never add arbitrary products to the cart.
* **Tiered Anti-Duplicate Debouncing:**
  - Implemented smart debounce timers across the entire scanner stack:
    - **Phone Scanner Loop:** 3500ms identical-barcode debounce.
    - **Webcam Modal Loop:** 3000ms identical-barcode debounce.
    - **POS Checkout Cart:** 2500ms identical-barcode debounce.
* **Phone Scanner Visual Confirmation Flash:**
  - The phone camera reticle triggers a prominent green border and laser pulse (`.reticle.scanned`) upon confirmed transmission, providing instant visual feedback alongside haptic vibration and Web Audio beeps.





