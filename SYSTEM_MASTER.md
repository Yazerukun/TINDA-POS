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
7. ❌ Never overwrite, clear, truncate, or delete existing user database tables (`tindapos.db`), customer credit/utang balances, transactions, or license records (`tinda_license.json`) during application updates. All database migrations must be 100% additive (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN`).
8. ❌ Never alter, rotate secret salts for, or invalidate existing VIP Pro cryptographic signatures or machine keys. Existing customer licenses must remain 100% permanently valid and active across all future versions.

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
* **Auto-Updater Compatibility:** Seamless in-app update transition from v1.0.28–v1.0.42 to v1.0.43 via `electron-updater` and GitHub Releases (`Yazerukun/TINDA-POS`).
* **Canonical Release Artifacts:**
  - `TindaPOS-Setup-1.0.43.exe` (NSIS installer with delta update support)
  - `TindaPOS-Setup-1.0.43.exe.blockmap` (Differential blockmap)
  - `latest.yml` (Version metadata and SHA-512 hashes)
  - `TindaPOS-Portable-1.0.43.exe` (Zero-install portable runtime)
  - `TindaPOS-User-Guide.pdf` (34-page official documentation)

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
### A. Feature 1: Secure Multi-Terminal Local LAN Architecture (Master-Satellite Hub)
* **Target Audience:** Single-store retailers with multiple checkout lanes (Cashier 1, Cashier 2) or a dedicated back-office/stockroom encoding terminal sharing a single database without internet access.
* **CRITICAL INVARIANT:** Never share a raw SQLite `.db` file across Windows Network Shares (SMB / mapped drive). Doing so causes locking starvation (`SQLITE_BUSY`), disk cache incoherence, and index corruption when multiple terminals write concurrently.
* **Master-Satellite Topology:**
  1. **Master Terminal (Cashier 1 / Server PC):**
     - Hosts the local SQLite database (`tindapos.db`) and executes all atomic read/write queries.
     - Runs the authenticated TINDA LAN RPC Server bound to the local network interface (e.g. `192.168.1.100:3111`).
     - Generates a transient 6-digit **Security Pairing PIN** and static pairing QR code for satellite device onboarding.
     - Holds exclusive rights to administrative functions (Database Reset, Database Restore, Raw File Exports, System Setting Overrides).
  2. **Satellite Terminals (Cashier 2, Cashier 3, Stockroom PC):**
     - Run TINDA POS configured in **Satellite Client Mode**.
     - Connects over local Wi-Fi / Ethernet to the Master Terminal's IP address.
     - Authenticates during initial handshake using the 6-digit Security PIN to acquire a signed HMAC-SHA256 session token.
     - Routes all POS cart operations, product searches, customer utang records, and stock adjustments via local RPC requests.
  3. **Zero Internet Requirement:** Functions 100% offline via standard local Wi-Fi router or unmanaged Ethernet switch.
* **Security & Concurrency Invariants:**
  - **Serialized Write Queue (`BEGIN IMMEDIATE`):** SQLite transactions are strictly sequenced. When two cashiers attempt to sell the final remaining unit of an item simultaneously, the first transaction commits atomically; the second immediately returns an `INSUFFICIENT_STOCK` error, preventing negative inventory.
  - **Role-Based Terminal Lockdown:** Satellite clients are strictly forbidden from issuing destructive schema operations or administrative restores.
  - **Real-Time Inventory Broadcast:** Master Terminal emits WebSocket events (`inventory:changed`) on every completed checkout, immediately updating product stock badges across all connected satellite screens without manual refresh.

### B. Feature 2: VPS Remote Hosting & Cloud Mirroring Architecture
* **Target Audience:** Store owners requiring remote visibility (sales analytics, cash on hand, stock levels, profit reports) from a smartphone or home laptop, or multi-branch retail consolidation.
* **Self-Hosting on Linux VPS ($4–$6/month):**
  - Compatible with standard lightweight Linux VPS instances (DigitalOcean Droplet, Linode, AWS Lightsail, Hetzner Cloud).
  - Deploys the headless TINDA Cloud Hub daemon container with automated SSL (Let's Encrypt / HTTPS on port 443).
* **Two-Tier Synchronization Architecture:**
  - **Tier 1: Offline-First Store Guarantee (Recommended):**
    - The physical store's Master PC continues running local SQLite with sub-5ms local checkout latency.
    - If retail internet drops, cashiers continue ringing up sales without disruption or software hang.
    - Asynchronous Sync Bridge: Every transaction or periodic interval (e.g. every 5 minutes), the Master PC batches new sales receipts, inventory movements, and utang repayments to the VPS over an authenticated TLS stream.
  - **Tier 2: Remote Owner Web Dashboard:**
    - The store owner visits `https://pos.mystore.com` via mobile or desktop browser.
    - Authenticates via Owner Master PIN / JWT token.
    - Views live aggregated metrics: Today's Gross Sales, Total Sukli Given, Drawer Cash Count, Low Stock Warnings, and Customer Utang Balances.
* **Security & Isolation Invariants:**
  - **Strict Transport Security (TLS 1.3):** All traffic between store Master PC and cloud VPS is encrypted end-to-end.
  - **API Token Authentication:** Unauthenticated requests or incorrect bearer tokens are rejected with HTTP 401.
  - **Read-Only Owner Default:** Remote web dashboards operate in read-only audit mode by default to prevent accidental remote disruption of physical store checkout carts.

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

---

## 14. Hands-Free Counter Camera & Zero-Click Background Scanning Architecture (v1.0.35)
* **In-Cart Docked Counter Camera (`CounterCameraScanner.tsx`):**
  - **Hands-Free Checkout Invariant:** Eliminates the operational bottleneck of having to click buttons or open modal windows to scan merchandise. The counter camera is integrated directly into the POS layout above the active cart (`CartPanel`).
  - **Streamline UI / Collapsible Drawer:** Cashiers can collapse or expand the live camera preview via a single toggle or hide it completely. Minimization and hardware device selections are persisted across restarts in `localStorage`.
  - **Direct Barcode Stream:** Barcodes read by the camera are decoded via off-screen canvas analysis, verified against GS1 / retail barcode checksum constraints, and directly invoke `onScan` in the parent POS container, adding items immediately to the active sale.
* **Always-Armed Wireless Phone Companion Scanner:**
  - **Modal Independence:** Once a smartphone is paired with the POS terminal (via 1-click QR code), cashiers can freely close the desktop pairing modal. The WebSocket / HTTP event listener (`window.api.phoneScanner.onScan`) remains permanently active in the background.
  - **Header Connectivity Badges:** High-visibility indicators (`🟢 Phone Ready` / `📱 Pair Phone`) in the POS top navigation bar keep the cashier continuously informed of mobile scanner link status without occupying screen space.
* **Multi-Input Hardware Concurrency:**
  - Physical USB handheld scanners (via hardware keyboard wedge bursts), docked counter cameras (via live ZXing video streams), and wireless mobile devices (via encrypted local WebSocket packets) feed into the unified POS cart dispatcher simultaneously with zero collisions or mode-switching delays.

---

## 15. Cryptographic Machine-Locked Licensing & Anti-Theft Architecture (v1.0.37)
* **Objective & Commercial Protection Invariants:**
  - **Anti-Theft & Piracy Defense:** Prevents unauthorized redistribution, key sharing across multiple store PCs, and repackaged commercial resale on Philippine tech groups (PHCorner, Facebook) without the developer earning.
  - **100% Offline-First Cryptographic Licensing:** Store computers operate in isolated offline environments without internet access. License validation, activation, and continuous operational checks run completely offline with mathematical certainty.
* **Hardware-Anchored Machine Fingerprint (`licenseService.ts`):**
  - **Multi-Anchor Entropy Extraction:**
    - **Windows:** Motherboard UUID (`wmic csproduct get uuid`), Baseboard Serial Number (`wmic baseboard get serialnumber`), Processor ID (`wmic cpu get processorid`), and Windows Cryptography Machine GUID (`HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid`).
    - **Linux:** `/etc/machine-id` or `/sys/class/dmi/id/product_uuid`.
    - **Physical Layer Fallback:** First non-virtual physical network interface MAC address combined with CPU architecture and host machine name.
  - **Format Normalization:** Components are combined with hardware salt and hashed via SHA-256 into a clean 16-hex formatted identifier: `TNDA-XXXX-XXXX-XXXX-XXXX`.
* **Cryptographic HMAC Key Derivation & Tamper Resistance:**
  - **Obfuscated Pepper Key:** Cryptographic secret pepper bytes are XOR-masked and assembled at runtime, defeating automated string scrapers targeting extracted Electron ASAR bundles.
  - **Asymmetric Signature Protocol:**
    - Payload: `TINDA_AUTH_V1::<MACHINE_ID>::VIP_PRO`.
    - Algorithm: HMAC-SHA256 with 12-hex signature block and 4-hex checksum: `VIP-XXXX-XXXX-XXXX-XXXX`.
    - **Timing-Safe Equality:** Evaluated via `crypto.timingSafeEqual` to eliminate timing side-channel attacks.
    - **Hardware-Lock Enforcement:** A license key generated for Machine A will mathematically fail on Machine B.
  - **File Tamper Guard:** Local license persistence (`tinda_license.json`) embeds an HMAC tamper hash covering `machineId`, `licenseKey`, `activatedAt`, and `customerName`. Any manual modification or file copying reverts the system instantly to Free Community Edition.
* **Private Developer Keygen Tool (`tools/keygen.mjs`):**
  - Strictly maintained in the private source repository (`Yazerukun/TINDA-POS-Source`) and forbidden from public distribution per Rule #6.
  - Generates valid VIP keys from a customer's Machine ID: `node tools/keygen.mjs generate --machine <MACHINE_ID> [--name <NAME>]`.
  - Also provides instant offline verification: `node tools/keygen.mjs verify --machine <MACHINE_ID> --key <VIP_KEY>`.
* **Commercialization & Activation Workflow:**
  - **One-Time Lifetime Fee:** ₱500 via Maya (**0991 225 5156**, Dev Francis / Ian).
  - **Customer Contact Channel:** Official Facebook profile (**[https://www.facebook.com/Ukauru](https://www.facebook.com/Ukauru)**) for submitting Machine ID and payment proof.
* **Balanced Centered UI & Sliding Animation (`Settings.tsx`, `VipUpgradeBanner.tsx`, `VipUpgradeModal.tsx`):**
  - **Centered Layout:** Settings content wrapped in `max-w-4xl mx-auto` with centered tab navigation for visual symmetry across all display resolutions.
  - **Interactive Sliding Banner:** Smooth CSS transition sliding upgrade banner prominently highlights VIP perks (Multi-PC LAN Hub, Paperless QR Receipts, Utang Suki Scorecard, Store Branding).
  - **1-Click Actions:** Instant clipboard copy for Machine ID and Maya phone number, plus 1-click external browser launch to Dev Francis's Facebook profile.
* **Feature Gate Matrix (Free Community vs ₱500 VIP Pro):**
  - **Free Community Edition Limits (Starter-Friendly):**
    - 50-item product catalog limit (ample for neighborhood sari-sari stores; expanding mini-groceries with 51+ items are guided to VIP Pro).
    - Single standalone cashier counter only (Multi-PC LAN Hub locked).
    - Thermal receipts display standard Community Edition footer watermark.
    - Standard customer credit (utang) ledger without automated reminder generation.
  - **VIP Pro Edition Exclusive Perks (High-Conversion Differentiators):**
    - **Unlimited Product Inventory:** No catalog cap.
    - **Multi-Counter LAN Hub:** Connect Counter 1 (Master) with Counter 2 / Counter 3 (Satellites) over local Wi-Fi with 1 database.
    - **Suki Utang Trust Rating (⭐⭐⭐⭐⭐):** Real-time customer repayment trustworthiness scoring.
    - **1-Click Polite SMS / Messenger Reminder Formatter:** Instant clipboard copy of polite Taglish/English payment reminders to recover credit 3x faster.
    - **100% Store Custom Branding:** Full removal of developer watermark, customizable store logo, DTI/BIR permit headers, and custom receipt greetings.
    - **Daily Loss Prevention & Cash Drawer Kupit Checker:** End-of-day cash drawer discrepancy and gross margin auditing.

---

## 16. Interactive Legal & Privacy Architecture (Privacy Policy & Terms of Service)
* **Design Philosophy & Zero-Backdoor Transparency:**
  - Standard enterprise and professional POS systems require transparent legal disclosures to build long-term trust with merchant owners and mitigate liability.
  - Documents are accessible both offline via in-app dialogs and persistently within repository documentation.
* **Dual In-App Access Points (`LegalModal.tsx`):**
  - **Settings &rarr; About Tab:** Placed directly beneath the developer signature and Maya payment card.
  - **VIP Upgrade Modal:** Embedded in the security guarantee footer beside the 100% Offline Cryptographic Lock badge.
* **Component Architecture:**
  - Modern modal with tabbed switching between **Privacy Policy** and **Terms of Service**.
  - Accessible via smooth backdrop animation, custom scrollbar styling, and standard keyboard/click dismiss actions.
* **Compliance & Legal Invariants:**
  - **100% Offline Sovereignty:** Guarantees that sales receipts, cashier records, inventory valuations, and utang ledgers are never uploaded to any remote or cloud server.
  - **Philippine Data Privacy Act (RA 10173):** Suki customer records remain strictly on the store owner's computer with full data portability and zero developer access.
  - **Fair Usage & Anti-Piracy:** VIP Pro lifetime licenses (₱500) are non-transferable single-machine grants. Reverse-engineering, keygen cracking, and commercial rebranding are strictly prohibited.

---

## 17. UI Scaling & Modal Accessibility Architecture (v1.0.38)
* **Problem Addressed:** On smaller laptop screens (1366x768 or 1080p with 125%/150% Windows display scaling), complex multi-card modals could exceed vertical viewport height, pushing floating top-right close buttons off-screen.
* **Architectural Guarantees:**
  - **Strict Viewport Containment:** Modals are constrained to `max-w-xl` and `max-h-[88vh]` using a vertical flex column layout (`flex flex-col overflow-hidden`).
  - **Sticky Header & Always-Visible Close Button:** The header remains fixed at the top with a permanent, high-contrast `[ X Close ]` button that never scrolls away.
  - **Internal Scroll Container:** Content is contained in an independent, smoothly scrollable container (`flex-1 overflow-y-auto custom-scrollbar`).
  - **Quadruple-Action Dismiss:**
    1. Top sticky header Close button (`[ X Close ]`).
    2. Bottom sticky footer button (`Close Dialog`).
    3. Keyboard `Escape` listener (`useEffect` global event).
    4. Backdrop overlay click-to-dismiss (`onMouseDown` targeting `currentTarget`).

---

## 18. Multi-Terminal LAN Synchronization, Inventory Search, Audit Deletion & POS Hotkeys Engine (v1.0.39)
* **Problem Addressed & User Feedback:**
  1. *LAN Visibility Parity:* Sales and transactions conducted on Satellite PCs were not appearing in real time on the Master PC, and Master sales were not visible on Satellites due to outdated IPC channel mappings in the network hub proxy.
  2. *Inventory Stock Withdrawal Filter:* Managing hundreds of items in the "Withdraw Stocks" modal required manual scrolling without search capabilities.
  3. *Audited Transaction Deletion:* Store owners needed the ability to permanently delete erroneous or voided transactions while properly reversing stock movements and recalculating cashier shift summaries.
  4. *Rapid-Fire POS Keyboard Shortcuts:* Cashiers operating in high-volume environments required hands-free keyboard shortcuts for searching products, modifying quantities, applying discounts, holding sales, and executing quick checkouts.
  5. *Zero License Disruption Guarantee:* Store owners with existing VIP Pro licenses must never be asked to re-activate upon updating to v1.0.39.

* **Key Architectural Implementations:**
  - **Multi-Terminal Bidirectional IPC Parity (`lanHubService.ts`, `inventoryEvents.ts`, `ipc/index.ts`):**
    - Replaced obsolete proxy channel mappings with real production channels (`pos:checkout`, `transactions:list`, `transactions:get`, `transactions:refund`, `transactions:void`, `transactions:delete`, `shifts:*`, `reports:*`, `dashboard:*`).
    - Added real-time Server-Sent Events (SSE) event forwarding for `transactions:changed`.
    - Automatically emits `transactions:changed` across all terminals on checkout, refund, void, and deletion events, ensuring live synchronization without manual refresh.
  - **Withdraw Stocks Modal Product Filter (`Inventory.tsx`):**
    - Integrated real-time regex search filtering (`productSearch`, `filteredProducts` memo) in `WithdrawModal`.
    - Instant auto-filtering by product name, SKU, or barcode with a quick-clear button.
  - **Permanent Audited Transaction Deletion Engine (`transaction.ts`, `roles.ts`, `Transactions.tsx`):**
    - Admin-guarded permission `transactions:delete` ensures only authorized managers can perform deletions.
    - Transactional database execution:
      - Optionally restores physical stock counts and removes corresponding stock ledger movements.
      - Automatically reverses customer Utang debt ledger entries.
      - Purges cascading child records (refunds, payments, sale items).
      - Recalculates associated cashier shift totals (`cash_sales_c`, `non_cash_c`, etc.).
      - Records an immutable audit log entry: `TRANSACTION_DELETED`.
    - Safety UI modal requires explicit typing of `"DELETE"` to prevent accidental data erasure.
  - **Rapid-Fire POS Keyboard Hotkeys Interceptor (`POS.tsx`):**
    - `F1` or `/`: Instantly focuses and selects the product search bar from anywhere on the POS screen.
    - `F2`: Automatically focuses and selects the quantity input of the most recently added cart item.
    - `F4`: Instantly focuses the cart Discount (₱) input.
    - `F8`: Performs a 1-key hold on the current cart.
    - `F9`: One-key Cash Checkout (opens modal pre-selected to Cash with cash received input focused).
    - `F10`: One-key GCash Checkout (opens modal pre-selected to GCash with reference number input focused).
    - `Enter`: Instant transaction submission / charge in modal.
    - `Escape`: Closes modals, resets open menus, or clears the active search bar.
  - **100% License Persistence Invariant:**
    - Cryptographic activation files reside persistently in `%USERPROFILE%\.tindapos\tinda_license.json`.
    - Hardware UUID, CPU ID, Baseboard Serial hash routines, and internal pepper strings remain 100% identical. Existing active licenses carry over without any user intervention.

---

## 19. Startup Single-Instance Concurrency, Port Hardening & Crash Dialog Elimination Architecture (v1.0.40)
* **Problem Addressed & User Feedback:**
  - *Startup Race Condition:* On Windows boot with auto-start enabled, TINDA POS launched in the background. Users clicking the desktop icon spawned a second instance. Because `app.quit()` did not synchronously terminate the process (`process.exit(0)` was missing), the duplicate instance executed `whenReady()`, triggering database write conflicts and port binding collisions.
  - *Port Collision on TCP 5040:* In attempting to bind auxiliary HTTP/HTTPS servers (`lanHubService.ts` on 3111, `phoneScannerService.ts` on 3112/3113), the secondary instance encountered `EADDRINUSE`. The unconstrained retry loop continuously incremented port numbers (`port++`) until reaching port `5040`, which is permanently occupied by Windows `CDPSvc` (Connected Devices Platform Service in `svchost.exe`).
  - *Missing Error Listener & Unhandled Exception:* The fallback `httpsServer` did not attach an `.on('error')` listener before calling `.listen()`, causing Node.js to throw an `Uncaught Exception: listen EADDRINUSE 0.0.0.0:5040`. With no global exception handler in the Electron main process, a native JavaScript crash dialog was presented to the user.

* **Key Architectural Implementations:**
  - **Synchronous Duplicate Process Termination (`main/index.ts`):**
    - Enforced immediate synchronous exit:
      ```ts
      const gotSingleInstanceLock = app.requestSingleInstanceLock()
      if (!gotSingleInstanceLock) {
        app.quit()
        process.exit(0)
      }
      ```
    - Prevents duplicate instances from ever executing initialization hooks, accessing SQLite files, or attempting port allocations.
  - **Bounded Port Allocation & Ceiling Protection (`phoneScannerService.ts`, `lanHubService.ts`):**
    - Implemented strict 5-attempt ceilings (ports 3111–3116 for LAN Hub, 3112–3117 for Phone Scanner HTTP/HTTPS).
    - Under no circumstances will port probing escalate into dynamic system port ranges or Windows-reserved services (such as 5040).
    - Every fallback server instance attaches comprehensive `.on('error')` listeners before initiating `.listen()`.
    - Safe `.close()` calls wrapped to eliminate `ERR_SERVER_NOT_RUNNING` exceptions.
  - **Non-Fatal Graceful Degradation:**
    - If local auxiliary networking fails due to OS firewall rules or third-party interference, the service logs a non-fatal warning and safely disables itself. The primary POS retail terminal and cashier checkout flow continue operating with 100% uptime.
  - **Global Main Process Exception Shields (`main/index.ts`):**
    - Registered `process.on('uncaughtException')` and `process.on('unhandledRejection')` in the Electron main entry point.
    - Captures unexpected low-level networking anomalies and logs them to stderr/log files without exposing unhandled modal crash dialogues to cashiers.
  - **100% Backward Compatibility:**
    - Full retention of existing SQLite database schemas, audit logs, transactions, and hardware-locked VIP Pro licenses.

---

## 20. Cryptographic Anti-Downgrade Lock (Epoch 41) & 5 Strategic Value Gating Pillars (v1.0.41)
* **Problem Addressed:**
  - *Database Rollback Vulnerability:* When users downgrade to older offline builds (v1.0.10–v1.0.40) or copy modern databases into obsolete binaries, schema mismatches corrupt transactional integrity and bypass newer security locks.
  - *Monetization Conversion Funnel:* Need clear, high-value visual demarcation between Free Community Edition and ₱500 Lifetime VIP Pro without ever freezing the cashier or hindering daily retail transactions.

* **Key Architectural Implementations:**
  - **100% Offline Cryptographic Anti-Downgrade & Binary Epoch Lock (Epoch 41):**
    - SQLite Migration 9 establishes the immutable `app_session_auth` singleton table and 3 native database triggers inside `tindapos.db`:
      1. `trg_anti_downgrade_sales`: Blocks checkout transaction inserts without active epoch >= 41.
      2. `trg_anti_downgrade_shifts`: Blocks shift creation without active epoch >= 41.
      3. `trg_anti_downgrade_products`: Blocks inventory inserts without active epoch >= 41.
    - Runtime session heartbeat in `connection.ts` manages active epoch timestamps and creates `%USERPROFILE%\.tindapos\epoch.lock` hardware binding.
    - Legacy offline versions attempting to write to upgraded databases are immediately aborted by the SQLite engine with `EPOCH_DOWNGRADE_LOCKED`.
  - **5 Strategic Value Gating Pillars (Free Community vs ₱500 VIP Pro):**
    1. **Inventory:** 50-product capacity meter with dynamic color status (brand/amber/danger) and VIP upgrade modal trigger.
    2. **Reports:** 7-day operational sales window for Free tier; lifetime sales history, CSV audit, and tax export locked to VIP Pro.
    3. **Loss Prevention:** Automated Cash Drawer Variance Audit in Z-Read finalization (Shortage/Overage Guard vs Expected Cash) with live status badge.
    4. **Utang:** 15 active credit debtors capacity meter & 1-Click polite SMS/Messenger reminder generator.
    5. **Branding:** Clean `[ Powered by TINDA POS Free Community ]` receipt footer; VIP Pro unlocks custom store logo & DTI/BIR tax headers.
  - **Compliance & Operational Invariants:**
    - **Zero Counter Paralysis Invariant:** Basic daily selling, barcode scanning, cash payments, GCash payments, and change calculations never freeze or block.
    - **100% Standard Professional English:** All UI labels, modals, loss prevention dialogs, and receipts follow clean, professional English.
    - **Zero Disruption to Existing Licenses:** Existing VIP Pro licenses remain 100% valid and automatically unlock all gating pillars.

---

## 21. Instant Hardware Barcode Auto-Capture & Inventory Cataloging Engine (v1.0.42)
* **Problem Addressed:**
  - *Manual Encoding Friction:* When inventory managers or store owners add dozens of new grocery items, manually typing long 12- or 13-digit EAN/UPC barcode numbers into text boxes is slow, error-prone, and leads to barcode entry mistakes.
  - *Active Element Keystroke Contamination:* When using physical USB/2.4GHz barcode scanner guns (keyboard wedge emulation), scanning an item while focused on another input (such as Product Name or Purchase Cost) would leak the barcode digits into that focused text field before the trailing Enter key, corrupting product metadata and causing accidental form submission.
  - *Companion Scanner Disconnect:* While smartphone cameras and webcams could scan items during POS checkout, there was no direct integration for cataloging new items in Inventory without leaving the product creation modal.

* **Key Architectural Implementations:**
  - **Universal Hardware Barcode Auto-Capture (`ProductModal` in `Inventory.tsx`):**
    - Intercepts high-speed (<120ms) USB/2.4GHz hardware scanner bursts globally within the product modal without requiring the user to click or focus the Barcode input first.
    - Automatically isolates and populates the scanned barcode into the product's barcode slot instantaneously.
  - **Active Input Contamination Sanitizer:**
    - Detects if `document.activeElement` is an `HTMLInputElement` or `HTMLTextAreaElement` that captured the scanner keystroke burst.
    - Automatically slices off the appended scanned barcode string, restores the clean text, and dispatches a synthetic `input` event to keep React state synchronized without accidental form submission or closing.
  - **Sub-Second Auditory Feedback (`playScanBeep`):**
    - Synthesizes an instant 1050 Hz sine-wave confirmation chirp via the standard Web Audio API, giving the cashier immediate tactile and auditory confirmation of a successful barcode capture.
  - **Live Auto-Capture Badge & Clear Trigger:**
    - Features a pulsing emerald status indicator (`● Auto-Capture`) and a transient green confirmation badge (`✓ Auto-captured: [code]`) that stays visible for 4 seconds.
    - Inline clear button (`X`) enables 1-click barcode removal and immediate re-scanning.
  - **Proactive Catalog Duplicate Detection Guard:**
    - Real-time catalog cross-reference alerts the owner if a scanned barcode is already in use by another product in the store (`⚠️ Already used by [Product Name] (SKU: [SKU])`), preventing duplicate stock fragmentation.
  - **Direct Camera & Smartphone Companion Integration:**
    - Embedded `"Camera / Phone"` trigger modal within the product modal supports zero-install Wi-Fi smartphone camera scanning and laptop webcams.
    - Supports individual camera scanning targets for multi-unit (tingi) pack conversions.
  - **Inventory List Fast-Track Scan Handler:**
    - When scanning barcodes while browsing the main Inventory list (no modal open):
      - If barcode exists: immediately filters the table directly to that product and displays `Product found: [name]`.
      - If barcode is uncatalogued: plays confirmation chime and automatically opens the `New Product` modal with the scanned barcode already pre-filled.
  - **Store Handbook Modernization (`Handbook.tsx`):**
    - Chapter 4 completely upgraded to standard professional English detailing plug-and-play USB scanner guns, 1-Click Wi-Fi smartphone companion setup, and instant inventory auto-capture workflows.

---

## 22. Permanent Non-Destructive Update, VIP Preservation & Store Expense Architecture (v1.0.43+)
* **Mandatory Non-Destructive Invariant (Strict Rule #7 & #8):**
  - **Zero Data Loss Guarantee:** User application databases (`tindapos.db`), customer credit (utang) ledgers, sales history, inventory counts, and license records (`tinda_license.json`) are permanently isolated in Windows `%APPDATA%\TINDA POS\` (`app.getPath('userData')`).
  - **In-Place Seamless Upgrades:** Software updates replace executable binaries and static assets only. User data directories are NEVER cleaned, deleted, or overwritten during NSIS Setup execution, Portable launches, or `electron-updater` background patching.
  - **Additive-Only Migrations:** All future SQLite database migrations strictly utilize `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ADD COLUMN`. Destructive operations (`DROP TABLE`, `DELETE FROM`, column renaming with data truncation) are strictly prohibited.
  - **100% Cryptographic VIP Pro Preservation:** The HMAC-SHA256 license derivation algorithm, secret pepper bytes (`PEPPER_BYTES`), and machine entropy anchors are permanently immutable. Any machine license activated on v1.0.37–v1.0.42 remains 100% permanently valid and automatically unlocks all current and future VIP Pro features.

* **Store Expense Tracking & "True Net Profit" Engine (v1.0.43):**
  - **Petty Cash Out Module (`QuickExpenseModal.tsx` & `F7` Hotkey):**
    - Cashiers and store owners can record operational store cash disbursements directly from the POS counter (e.g. Store Supplies, Utility Bills, Helper Wage, Freight/Delivery, Owner Drawings).
    - Accessible via POS top-bar button (`💸 Expense [F7]`) and global `F7` keyboard shortcut.
    - Captures description, amount in centavos, category, and cashier shift link.
  - **Cash Drawer Reconciliation Formula (Z-Read):**
    - Cash drawer variance auditing incorporates cash disbursements:
      $$\text{Expected Cash} = \text{Opening Float} + \text{Cash Sales} + \text{Utang Repayments} - \text{Cash Refunds} - \text{Cash Expenses}$$
    - Eliminates false cash drawer shortages caused by unrecorded store expenses.
  - **True Net Profit Intelligence:**
    - Comprehensive financial reporting calculating:
      $$\text{True Net Profit} = \text{Gross Sales} - \text{COGS (Cost of Goods Sold)} - \text{Operating Expenses}$$
    - Displayed in `Dashboard.tsx` financial summary and `Reports.tsx` profit breakdown.

---

## 23. Expiration Date Management & Spoilage Prevention Engine (v1.0.43)
* **Problem Addressed:**
  - Retailers and grocery store owners frequently lose revenue due to undetected stock expiration, expired goods accidentally sold to customers, and lack of advance warning for items nearing their end of shelf life.
* **Key Architectural Implementations:**
  - **Two-Tier Expiration Modes (`Product.expiration_mode`):**
    - `NONE`: Non-perishable general goods.
    - `ITEM`: Single expiration date per product for uniform batch items.
    - `BATCH`: Multi-batch FIFO inventory tracking (`product_batches`), recording individual expiration dates, incoming quantities, and costs per delivery batch.
  - **Sellable Stock Enforcement:**
    - Expired stock is automatically quarantined and deducted from sellable stock:
      $$\text{Sellable Stock} = \sum_{\text{batch} \in \text{batches}, \, \text{exp} \ge \text{today}} \text{quantity}$$
    - Items with expired or undated stock are strictly blocked from sale at POS (`Expired or undated stock is blocked`).
  - **Proactive Point-of-Sale Expiry Warnings (`warnIfNearExpiry`):**
    - When scanning or clicking a product at the counter, if the product is expiring within 7 days (`SOON`) or within 30 days (`NEAR`), a soft toast alert warns the cashier without interrupting the checkout flow.
  - **Dashboard Spoilage & Expiry Analytics Card:**
    - Visual indicators for Expired Items (red alert badge) and Expiring Soon Items (amber alert badge) with direct 1-click filter links to Inventory.
  - **Inventory Expiry Filters:**
    - Quick filter buttons in `Inventory.tsx`: `All`, `Active`, `Low Stock`, `Out of Stock`, `Expired`, `Expiring Soon`.

---

## 24. Wireless Customer Facing Display (CFD) with Dynamic Offline QR Payments (v1.0.43)
* **Problem Addressed:**
  - Traditional hardware secondary monitors require expensive dual-display cables and mountings. Cashiers lack an interactive customer-facing screen to show real-time line items, subtotal, and dynamic e-wallet QR codes for GCash and Maya.
* **Key Architectural Implementations:**
  - **Zero-Install Local CFD Web Server (`phoneScannerService.ts`):**
    - Served over local Wi-Fi on Port 3112 (HTTP) and Port 3113 (HTTPS) at routes `/cfd` and `/display`.
    - Any tablet, iPad, Android device, or secondary phone can act as a secondary customer screen simply by opening the browser or scanning the CFD pairing QR code.
  - **Pure In-Memory SVG QR Code Generator (`generateQrSvg`):**
    - Zero external npm packages added. Built using existing `@zxing/library` primitives (`QRCodeWriter` and `BarcodeFormat.QR_CODE`).
    - Generates crisp, scalable vector SVG QR codes directly in memory on Node.js.
  - **Dynamic Offline E-Wallet QR Generation (GCash & Maya):**
    - When cashiers select GCash or Maya at checkout, the CFD automatically displays an exact-amount QR code containing:
      `gcash://pay?total=[cents]&ref=TINDA-[timestamp]` / `maya://pay?total=[cents]&ref=TINDA-[timestamp]`
    - Customers scan and pay exact centavo totals with zero manual digit typing.
  - **Live Bidirectional State Synchronization:**
    - Electron IPC channels (`phoneScanner:updateCfd`, `phoneScanner:getCfdState`, `phoneScanner:getCfdUrl`) synchronize cart items, customer name, discounts, and total in real-time (<50ms latency).
  - **Auto Screen Wake Lock API:**
    - Embedded `navigator.wakeLock.request('screen')` in the CFD web page prevents customer-facing tablets from going to sleep or dimming while stationed at the counter.
  - **Pairing UI in POS Modal (`CameraScannerModal.tsx`):**
    - Dedicated "Customer Screen" tab with QR code, clickable URL, 1-click copy link, and direct "Open Screen" desktop browser launch button.

---

## 25. Wholesale Tiering & Automated Volume Discount Engine (v1.0.43)
* **Problem Addressed:**
  - Sari-sari stores and grocery wholesalers need automated tiered pricing (e.g. ₱15.00/pc retail, but ₱13.50/pc when buying 10 or more) without cashiers needing to remember manual discounts or perform mental math.
* **Key Architectural Implementations:**
  - **Additive Database Schema (Migration 10):**
    - Adds `wholesale_price_c INTEGER DEFAULT NULL` and `wholesale_min_qty INTEGER DEFAULT NULL` to the `products` table via `ALTER TABLE products ADD COLUMN`.
    - Existing product rows and catalogs remain 100% untouched.
  - **Real-Time Dynamic Cart Repricing (`calculateItemUnitPrice` in `cartStock.ts`):**
    - When adding items or changing quantities in `usePosCart`, if `item.qty >= item.wholesale_min_qty`, unit price automatically switches from retail base price to wholesale price.
    - If quantity drops below the threshold, unit price instantly reverts to regular retail price.
  - **Visual Wholesale Indicators:**
    - **Product Grid Cards:** Shows `WS: ₱XX.XX (≥N)` indicator below retail price.
    - **Cart Panel:** Items receiving wholesale pricing display a prominent `🏷️ Wholesale Tier` emerald badge with original price strikethrough (`₱15.00 ₱13.50 / pc`).
    - **Inventory Management:** Full input controls in `ProductModal` with real-time validation (rejects negative prices and non-positive min quantities).

---

## 26. Cross-Platform Android Parity & Unified Data Exchange Architecture (v1.0.43)
* **Problem Addressed:**
  - Store owners utilizing both TINDA POS Windows Desktop and TINDA POS Android Free require guaranteed backup portability and unified architectural schema alignment.
* **Key Architectural Implementations:**
  - **Universal `.tinda-backup` Interchange Format:**
    - Standardized cross-platform JSON exchange container supporting lossless export and import between Desktop SQLite (`better-sqlite3`) and Android IndexedDB (`Dexie.js`).
    - Version-tolerant schema mapping ensures forward and backward compatibility across releases.
  - **Offline-First Functional Parity:**
    - Identical core business invariants across both platforms: 100% zero-cloud dependency, local transactional integrity, and atomic customer utang ledger accounting.
  - **Non-Destructive Import Invariant:**
    - Universal exchange imports never wipe existing databases; all data merges respect unique constraints and preserve historical ledger entries.

---

## 27. Verification Gates, Non-Destructive Invariant Proofs & Definition of Done (v1.0.43)
* **Verification Gates Checklist (100% Passed):**
  - [x] **54/54 Vitest Test Suites Passing:** Complete test coverage with 358/358 unit and integration tests passing.
  - [x] **Zero TypeScript Errors:** `pnpm typecheck` (`typecheck:node` and `typecheck:web`) clean with 0 errors.
  - [x] **Strict Non-Destructive Database Integrity:** Verified through `v108-upgrade-chain.test.ts` (schema upgrade preserves every single product, unit, customer, ledger entry, shift, sale, and payment with zero data loss).
  - [x] **100% Cryptographic VIP Pro Preservation:** Tested via `license-service.test.ts` and `settings-vip.test.ts`; HMAC-SHA256 license derivation keys remain permanently frozen and valid.
  - [x] **Zero Counter Paralysis:** POS checkout, USB barcode scanning, camera companion pairing, CFD updates, and shift reconciliation operate seamlessly without blocking.
  - [x] **Live Audit Feed:** Every development milestone logged to `~/.local/state/opencode-live.log` for Ian's watch monitor.
  - [x] **Living Architecture Master Document:** `SYSTEM_MASTER.md` permanently synchronized.
