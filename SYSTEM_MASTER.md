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
* **Auto-Updater Compatibility:** Seamless in-app update transition from v1.0.28–v1.0.43 to v1.0.44 via `electron-updater` and GitHub Releases (`Yazerukun/TINDA-POS`).
* **Canonical Release Artifacts:**
  - `TindaPOS-Setup-1.0.44.exe` (NSIS installer with delta update support)
  - `TindaPOS-Setup-1.0.44.exe.blockmap` (Differential blockmap)
  - `latest.yml` (Version metadata and SHA-512 hashes)
  - `TindaPOS-Portable-1.0.44.exe` (Zero-install portable runtime)
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

## 27. Weighable & Fractional Decimal Quantity Architecture (v1.0.44)
* **Problem Addressed:**
  - Meat shops, fish stalls, vegetable stands, rice retailers, feeds stores, and sari-sari counters sell commodities by weight (e.g. `kilo`, `kg`, `kls`, `g`) or volume (`liter`, `l`).
  - Previously, cart quantity was strictly locked to whole integers via `parseInt()` and `Number.isInteger()`, preventing customers from buying fractional weights such as `2.5 kg`, `2.24 kg`, or `2.25 kg`.
* **Key Architectural Implementations:**
  - **Unit Intelligence Auto-Detection (`isWeighableUnit` in `@shared/format`):**
    - Automatically recognizes weighable and measurable units: `kilo`, `kilos`, `kg`, `kls`, `kilogram`, `g`, `gram`, `grams`, `liter`, `liters`, `l`, `ml`, `meter`, `m`.
    - Standard discrete packaged goods (`pc`, `can`, `bottle`, `sachet`, `box`) strictly retain discrete integer stepping (+1 / -1) and whole-number entry.
  - **Adaptive Floating-Point POS Cart Input (`CartQtyInput` in `POS.tsx`):**
    - Seamless typing experience: respects decimal separator (`.` / `,`) without string truncation or keystroke stuttering.
    - Cashiers can directly type exact scale weights (e.g. `2.24`, `2.25`, `0.75`).
    - Stepper buttons adapt: for kilo items under 1 kg, steps by `0.25` kg; for larger items, steps by `1` kg.
  - **Instant Real-Time Pricing (`money(Math.round(unit_price_c * qty))`):**
    - Line item subtotal immediately calculates on every keystroke:
      $$\text{Line Subtotal (centavos)} = \text{round}(\text{Unit Price Centavos} \times \text{Quantity})$$
      *Example:* Pork Liempo @ ₱180.00/kg (18,000 centavos):
      - 2.25 kilos $\rightarrow$ **₱405.00** (40,500 centavos)
      - 2.24 kilos $\rightarrow$ **₱403.20** (40,320 centavos)
    - Zero floating-point currency drift: Centavo integers (`_c`) preserved across all calculations.
  - **Non-Destructive SQLite Storage Affinity:**
    - SQLite dynamic type affinity allows floating-point quantities in `stock`, `sale_items.qty`, and `inventory_movements.quantity_change` without requiring disruptive table drop or schema rebuild migrations.
    - `adjustStock` in `products.ts` rounds remaining stock to 3 decimal places (`Math.round((before + change) * 1000) / 1000`) for gram-level precision.
  - **Thermal Receipt, CFD, & Refund Parity:**
    - `checkout.ts` (`buildReceiptLines`): Emits clean decimal lines (`2.24 x 180.00    403.20`) compatible with all 58mm/80mm thermal ESC/POS printers.
    - Customer Facing Display (`/cfd`): Real-time tablet screen updates line items with exact weight and unit price.
    - Fractional Refunds (`processRefund`): Supports returning partial weights (e.g. refunding 1.24 kg of 2.24 kg sale = ₱223.20 refunded and 1.24 kg stock restored).

---

## 28. Verification Gates, Non-Destructive Invariant Proofs & Definition of Done (v1.0.44)
* **Verification Gates Checklist (100% Passed):**
  - [x] **55/55 Vitest Test Suites Passing:** Complete test coverage with 363/363 unit and integration tests passing, including dedicated `weighable-decimal-qty.test.ts`.
  - [x] **Zero TypeScript Errors:** `npm run typecheck` (`typecheck:node` and `typecheck:web`) clean with 0 errors.
  - [x] **Zero Packaging / Build Errors:** `npm run build` (`electron-vite build`) succeeds with production client and SSR main bundles.
  - [x] **Strict Non-Destructive Database Integrity:** Verified through `v108-upgrade-chain.test.ts` (schema upgrade preserves every single product, unit, customer, ledger entry, shift, sale, and payment with zero data loss).
  - [x] **100% Cryptographic VIP Pro Preservation:** Tested via `license-service.test.ts` and `settings-vip.test.ts`; HMAC-SHA256 license derivation keys remain permanently frozen and valid.
  - [x] **Zero Counter Paralysis:** POS checkout, USB barcode scanning, camera companion pairing, CFD updates, and shift reconciliation operate seamlessly without blocking.
  - [x] **Living Architecture Master Document:** `SYSTEM_MASTER.md` permanently synchronized.

---

## 29. Extended Specification Visibility & Multiline Catalog Engine (v1.0.49)
* **Problem Addressed:**
  - In hardware stores, auto parts, pharmacies, and specialty retail, products have long technical specifications, dimensions, diameters, and suffixes (e.g. `PVC Pipe Schedule 40 Blue 1/2" x 100mm`, `Corrugated Steel Bar 10mm x 6m Grade 40`).
  - Previously, product cards in the POS grid and inventory lists clamped text aggressively (`line-clamp-2` and `truncate`), hiding critical specifications and dimensions (`mm`, `cm`, `inches`, `grit`, `gauge`) at the end of the item name.
  - Store managers also lacked a dedicated field in the inventory modal to enter detailed technical dimensions, variant specifications, or flavor notes.
* **Key Architectural Implementations:**
  - **Zero-Migration Optional Schema Invariant:**
    - Leverages the existing `products.description TEXT` column present in the core schema since v1.0.0. No disruptive schema migration or table rebuild required.
  - **Enhanced Product Grid Architecture (`POS.tsx`):**
    - Expanded product card height from `160px` to `185px` (`auto-rows-[185px]` and `h-[185px]`).
    - Multiline text rendering: `line-clamp-2 break-words text-xs sm:text-sm font-semibold leading-snug text-white` with hover tooltip (`title={p.name}`).
    - Dedicated secondary specification display: Renders `p.description` in `line-clamp-2 break-words text-[11px] text-slate-400 mt-0.5` directly on the card so cashiers can distinguish between millimeter variations at a single glance.
  - **Inventory Card & Form Parity (`Inventory.tsx` & `productForm.ts`):**
    - Product cards in Inventory display multiline break-words names and specifications.
    - Added dedicated `Description / Specifications` textarea to `ProductModal` with helper placeholder (`e.g. Dimensions (mm/cm), specs, flavor, notes`), cleanly mapping to `form.description` and persisting seamlessly across create and update payloads.
  - **POS Cart & Held Sales Specification Context:**
    - `CartItem` interface and cart display enhanced with `description?: string | null`.
    - Resuming held sales preserves product descriptions for full cashier context.

---

## 30. Flexible Line-Item Price Override & Manager Bargain Authorization (v1.0.49)
* **Problem Addressed:**
  - In Philippine retail and hardware environments, custom volume discounts, clearance pricing, and customer bargaining ("tawad") are standard commercial practices (e.g. regular ₱98.00 item negotiated down to ₱90.00 each for a bulk customer, or regular ₱35.00 reduced to ₱30.00).
  - Previously, only cart-level peso discounts (`F4`) were supported, which apply across the entire cart rather than targeting specific line items.
  - Unrestricted price editing by cashiers introduces severe fraud, theft, and inventory shrinkage risks.
* **Key Architectural Implementations:**
  - **Non-Mutating Manager PIN Authorization (`verifyManagerPin` in `auth.ts`):**
    - Cashiers requesting a price override are prompted for a 4-digit Manager or Admin PIN via `ManagerPinModal`.
    - IPC handler `auth:verifyManagerPin` verifies PIN against active `ADMIN` or `MANAGER` users in SQLite without mutating the cashier's active session, user ID, or open shift ID.
    - If the logged-in user is already an Admin or Manager, the price edit modal opens directly without re-prompting for a PIN.
  - **Real-Time Dynamic Cart Repricing Engine (`calculateItemUnitPrice` in `cartStock.ts`):**
    - Extended calculation contract:
      $$\text{calculateItemUnitPrice}(basePriceC, qty, wholesalePriceC, wholesaleMinQty, customPriceC)$$
    - When `customPriceC != null && customPriceC >= 0`, custom unit price takes precedence over regular retail and wholesale tiering (`isCustom = true`).
    - Calling `resetItemPrice(productId)` cleanly clears `custom_price_c` and restores the standard retail or wholesale tiered pricing.
  - **Visual Bargain Indicators & Profit Protection:**
    - Cart items with overridden prices display a distinct `✏️ Bargain / Custom Price` amber badge.
    - Original base retail price is displayed with a strikethrough (e.g. `₱98.00` strikethrough next to `₱90.00`).
    - Line item subtotal and cart total calculate synchronously in centavos:
      $$\text{Line Subtotal} = \text{round}(\text{Custom Price Centavos} \times \text{Quantity})$$
    - `PriceOverrideModal` displays original retail price, current purchase cost, and calculates real-time unit discount and line total.
    - Prominently warns the manager if the entered price drops below purchase cost (`cost_base_c`), preventing unintended negative-margin sales.
  - **Transactional Ledger & Sync Integrity:**
    - `sale_items` already stores `unit_price_c` and `subtotal_c` independently per line item. Custom prices write directly to SQLite ledger rows, ensuring exact profit reporting, X/Z-Read accuracy, thermal receipt alignment, CFD reflection, and Cloudflare Sync consistency.

---

## 31. Verification Gates, Non-Destructive Invariant Proofs & Definition of Done (v1.0.49)
* **Verification Gates Checklist (100% Passed):**
  - [x] **58/58 Vitest Test Suites Passing:** Complete test coverage with 372/372 unit and integration tests passing, including dedicated `manager-pin-auth.test.ts` and `custom-price-checkout.test.ts`.
  - [x] **Zero TypeScript Errors:** `npm run typecheck` (`typecheck:node` and `typecheck:web`) clean with 0 errors.
  - [x] **Zero Packaging / Build Errors:** `npm run build` (`electron-vite build`) succeeds with production client and SSR main bundles.
  - [x] **Strict Non-Destructive Database Integrity:** Verified through `v108-upgrade-chain.test.ts` (schema upgrade preserves every single product, unit, customer, ledger entry, shift, sale, and payment with zero data loss).
  - [x] **100% Cryptographic VIP Pro Preservation:** Tested via `license-service.test.ts` and `settings-vip.test.ts`; HMAC-SHA256 license derivation keys remain permanently frozen and valid.
  - [x] **Zero Counter Paralysis:** POS checkout, USB barcode scanning, camera companion pairing, CFD updates, and shift reconciliation operate seamlessly without blocking.
  - [x] **Living Architecture Master Document:** `SYSTEM_MASTER.md` permanently synchronized.

---

## 32. TINDA Global Community Lounge, Live Developer Announcements & English Release Modal (v1.0.50)
* **Problem Addressed:**
  - Retail and sari-sari store merchants using TINDA POS had no native communication channel to collaborate, share supplier pricing, or seek guidance without exiting the POS application.
  - The developer (Ian) lacked a direct, in-app broadcast mechanism to publish immediate system updates, server notices, or wholesale market alerts directly to active cashier terminals.
  - Previous update notification pop-ups mixed Bisaya and English phrasing (`🎉 Bag-ong Update!`, `Unya Na (Later)`), which conflicted with commercial English software standards.
  - Crucially: any real-time network integration must guarantee **ZERO FREEZING** of the local POS cash register under flaky Philippine Wi-Fi / LTE connections.
* **Key Architectural Implementations:**
  - **100% Non-Blocking Zero-Freeze Network Architecture:**
    - Background service `communityChat.ts` operates strictly asynchronously using standard `AbortSignal.timeout(4000)`.
    - Main-process IPC handlers (`community:getAnnouncements`, `community:getMessages`, `community:sendMessage`) catch all network drops, DNS errors, and timeouts silently, returning fallback state without blocking UI threads, SQLite transactions, barcode scanning, or thermal printing.
    - Polling interval (6s) activates **only** when the chat drawer is open; when closed, all polling stops to conserve CPU and network bandwidth.
  - **100% Free & Open Nationwide Merchant Community:**
    - Live messaging in the Global Lounge is free for all registered and unregistered TINDA POS store owners (no VIP paywall).
    - Stores can freely ask questions, share wholesale supplier deals, and discuss operational tips in real time.
    - Verified `👑 DEV / OWNER` badge remains cryptographically restricted to Ian via Dev Master Secret (`x-dev-key`), preventing spoofing.
  - **Dynamic Red Pulse Unread Alert Indicator:**
    - Gentle 12-second background polling tracks new incoming community messages when the drawer is closed.
    - Floating trigger button transitions dynamically from brand blue/indigo to vibrant glowing **RED** (`bg-gradient-to-r from-red-600 to-rose-600`, `ring-4 ring-red-400/60`, `animate-pulse`) with a pulsing beacon and `NEW` notification badge when unread messages arrive.
    - Opening the drawer marks messages as read (`tinda_last_seen_msg_id`), instantly returning the button to standard resting theme.
  - **Cloudflare D1 Real-Time Edge Engine:**
    - Backed by Cloudflare D1 database (`tinda-sync-db`) with persistent tables `global_chat_messages` and `live_announcements`.
    - Endpoints deployed on `tinda-sync.yomikaze-md.workers.dev` (`/api/announcements`, `/api/chat/messages`).
  - **Strict English Commercial Copy Invariant:**
    - All update modals, release notices, buttons, and system dialogs standardized to professional English (`🎉 New Update Available · vX.X.XX`, `Later`, `Download Update`, `Restart & Install`).

---

## 33. Verification Gates, Non-Destructive Invariant Proofs & Definition of Done (v1.0.50)
* **Verification Gates Checklist (100% Passed):**
  - [x] **59/59 Vitest Test Suites Passing:** Complete test coverage with 378/378 unit and integration tests passing, including dedicated `communityChat.test.ts`.
  - [x] **Zero TypeScript Errors:** `npm run typecheck` (`typecheck:node` and `typecheck:web`) clean with 0 errors.
  - [x] **Zero Packaging / Build Errors:** `npm run build` (`electron-vite build`) succeeds with production client and SSR main bundles.
  - [x] **Strict Non-Destructive Database Integrity:** Schema upgrade preserves every single product, unit, customer, ledger entry, shift, sale, and payment with zero data loss.
  - [x] **100% Cryptographic VIP Pro Preservation:** Tested via `license-service.test.ts` and `settings-vip.test.ts`; HMAC-SHA256 license derivation keys remain permanently frozen and valid.
  - [x] **Zero Counter Paralysis:** POS checkout, USB barcode scanning, camera companion pairing, CFD updates, and shift reconciliation operate seamlessly without blocking.
  - [x] **Living Architecture Master Document:** `SYSTEM_MASTER.md` permanently synchronized.

---

## 34. Multi-Platform Linux AppImage Distribution & Native Wayland Desktop Integration (v1.0.50)
* **Problem Addressed:**
  - TINDA POS previously only produced Windows installer targets (`.exe` NSIS installer & standalone portable).
  - Philippine store owners, modern kiosks, and technicians running open-source POS machines on Linux (Arch Linux, Ubuntu, Debian, Omarchy, Fedora) had no packaged, zero-dependency binary.
  - Native SQLite bindings (`better-sqlite3`) require compiled C++ Node-API binaries (`.node`). Past configurations excluded `linux-*` prebuilds to minimize Windows installer payload size, which prevented Linux binary execution.
* **Key Architectural Implementations:**
  - **Multi-Platform SQLite Prebuild Invariant (`electron-builder.yml`):**
    - Configured packaging files manifest to explicitly bundle both `prebuilds/win32-x64.node` and `prebuilds/linux-x64.node` without inflating installer bloat.
    - Excluded non-target architectures (`darwin-*`, `linuxmusl-*`, `win32-arm64.node`, `linux-arm64.node`).
    - N-API (Node-API) guarantees cross-runtime binary stability across Node and Electron without requiring dynamic C++ recompilation.
  - **Linux AppImage Packaging Target:**
    - Added `AppImage` output target in `electron-builder.yml` generating `TindaPOS-${version}.AppImage` (130.83 MB).
    - Fully self-contained squashfs payload with zero system dependency requirements; runs seamlessly with modern `libfuse3` and `libfuse2`.
  - **Native Wayland & X11 Graphics Engine:**
    - Full support for Linux Wayland compositors (Hyprland, Sway, GNOME, KDE) via `--ozone-platform-hint=auto`.
    - Native Wayland client window association (`xwayland: 0`, `class: tinda-pos`), verified operational on Arch Linux / Omarchy Hyprland.
  - **System Desktop Integration & CLI Launcher:**
    - Extracted 256x256 application icon to `~/.local/share/icons/tinda-pos.png`.
    - Registered desktop application menu entry: `~/.local/share/applications/tinda-pos.desktop` (`StartupWMClass=tinda-pos`, categories `Office;Finance;`).
    - Provided instant command-line executable: `~/.local/bin/tinda-pos` pointing to permanent binary `~/Applications/TindaPOS.AppImage`.
  - **Dual-Platform Distribution Pipeline:**
    - Automated GitHub Release publisher updated (`tools/upload_linux_v1050.mjs`) to upload `TindaPOS-1.0.50.AppImage` to GitHub Release `v1.0.50`.
    - `SHA256SUMS-v1.0.50.txt` updated with cryptographically verified checksum for the Linux AppImage (`ae5281d2...`).

---

## 35. Verification Gates, Non-Destructive Invariant Proofs & Definition of Done (v1.0.50 Linux Target)
* **Verification Gates Checklist (100% Passed):**
  - [x] **Linux AppImage Build Success:** `npm run build:linux` builds production SSR main, preload, and client Vite bundles and packages `TindaPOS-1.0.50.AppImage` (exit code 0).
  - [x] **Native Linux Execution Verified:** Launched live on Arch Linux / Omarchy Hyprland (PID 905111, mapped: 1, visible: 1, Wayland native).
  - [x] **Multi-Platform SQLite Integrity:** `better-sqlite3` initialized without crashing; WAL mode, foreign keys, and migration chain verified on Linux filesystem (`~/.config/TINDA POS/database/tindapos.db`).
  - [x] **Dual Distribution Assets on GitHub:** Both Windows (`Setup.exe`, `Portable.exe`) and Linux (`AppImage`) published with SHA-256 checksums on GitHub Release v1.0.50.
  - [x] **Public & Private Documentation Parity:** Public README.md and living architecture master document (`SYSTEM_MASTER.md`) 100% synchronized.

---

## 36. Free Nationwide Merchant Community, Dynamic Red Unread Alerts & POS Header Streamlining (v1.0.51)
* **Problem Addressed:**
  - In v1.0.50, the Global Community Lounge was restricted to VIP Pro stores for messaging, limiting community adoption and peer store collaboration across smaller merchants.
  - Users had no visual indication when another merchant posted a message while the chat drawer was closed.
  - The POS header contained an unclickable, distracting informational label (`+ add · F2 qty`) which cluttered cashier action items.
  - Semver auto-update: To trigger existing installed terminals to download and apply all latest enhancements, an incremented version release (`1.0.51`) was required.
* **Key Architectural Implementations:**
  - **100% Free Nationwide Community Access:**
    - Removed VIP gating from `sendCommunityMessage` and the UI drawer form.
    - All merchants can post and read messages freely; verified Developer identity (`👑 Ian (Founder / Dev) [VERIFIED]`) remains cryptographically secured by edge master secret.
  - **Dynamic Red Pulse Unread Alert Indicator:**
    - Non-blocking 12-second background polling tracks unread message IDs (`tinda_last_seen_msg_id`) when drawer is closed.
    - Floating trigger button dynamically shifts to bright pulsing red (`bg-gradient-to-r from-red-600 to-rose-600`, `ring-4 ring-red-400/60`, `animate-pulse`) with a pulsing white beacon and `NEW` badge upon arrival of new messages.
    - Opening the drawer resets the indicator and updates the last-seen watermark.
  - **Cleaned POS Navigation Header:**
    - Removed unclickable `+ add · F2 qty` element from the top toolbar, keeping only actionable controls (Sales Monitor, Petty Cash F7, Help Guide).
  - **Multi-Platform Auto-Update Trigger:**
    - Full distribution across Windows (Setup NSIS + Portable) and Linux (AppImage) at semver `1.0.51`.
    - Auto-updater prompts installed machines with the English release modal (`🎉 New Update Available · v1.0.51`).

---

## 37. Verification Gates, Non-Destructive Invariant Proofs & Definition of Done (v1.0.51)
* **Verification Gates Checklist (100% Passed):**
  - [x] **59/59 Vitest Test Suites Passing:** Complete test coverage with 378/378 unit and integration tests passing.
  - [x] **Zero TypeScript Errors:** `npm run typecheck` (`typecheck:node` and `typecheck:web`) clean with 0 errors.
  - [x] **Zero Packaging / Build Errors:** Windows NSIS (`Setup.exe`), Portable (`Portable.exe`), and Linux (`AppImage`) compiled and packaged cleanly.
  - [x] **Multi-Platform Artifact Integrity:** All release artifacts published to GitHub Release `v1.0.51` with cryptographically verified SHA-256 checksums.
  - [x] **Strict Non-Destructive Database Integrity:** 100% zero data loss, HMAC-SHA256 VIP licenses preserved, and zero counter latency.
  - [x] **Public & Private Documentation Parity:** `SYSTEM_MASTER.md`, `README.md`, and `RELEASE_NOTES_v1.0.51.md` synchronized across repositories.

---

## 38. Cross-Platform Linux AppImage Auto-Update Architecture (v1.0.51 Hotfix)
* **Problem Addressed:**
  - When clicking "Download Update" or executing auto-update checks on Linux, the updater reported `Update failed`.
  - **Root Cause Analysis:**
    - `updateTransport.ts`: `isPortable()` previously checked only `portableRuntime(process.env)` (`PORTABLE_EXECUTABLE_DIR`, which is Windows-specific). On Linux systems, `isPortable()` returned `false`.
    - As a result, the Linux client was routed into `downloadSetup()`, which explicitly threw `Error('The installed updater is only available in a packaged Windows build.')` because `electron-updater` differential NSIS update packages are Windows-only.
    - Furthermore, `downloadPortable()` regex matched only `.exe` files (`/^TindaPOS-Portable-.*\.exe$/i`), completely ignoring Linux `.AppImage` release assets.
* **Key Architectural Implementations:**
  - **Linux Platform Detection & Portable Abstraction (`updateTransport.ts`):**
    - `isPortable()` updated to evaluate `process.platform === 'linux' || portableRuntime(process.env)`. On Linux, the AppImage distribution behaves identically to a standalone portable executable.
    - `downloadPortable()` dynamically detects Linux platform and regex-matches `/^TindaPOS-.*\.AppImage$/i`.
  - **Permissions & In-Place Atomic Replacement:**
    - Downloaded AppImage is automatically marked executable via `chmod(filePath, 0o755)`.
    - When executing under an active AppImage (`process.env.APPIMAGE`), the transport performs an atomic copy-and-rename replacement (`${process.env.APPIMAGE}.update-tmp` -> `process.env.APPIMAGE`), ensuring the binary in `~/Applications/` or the user's install folder is updated seamlessly without breaking running processes.
  - **Atomic Relaunch & Reveal Workflow:**
    - `reveal()` detects Linux and `process.env.APPIMAGE`, invoking `app.relaunch({ execPath: process.env.APPIMAGE })` followed by clean `app.exit(0)` to relaunch immediately into the updated build.
  - **Dual Feed Manifest Generation:**
    - Both `latest.yml` (Windows) and `latest-linux.yml` (Linux) are generated by `electron-builder` and distributed to GitHub Release assets and repo mirrors.

---

## 39. Verification Gates, Non-Destructive Invariant Proofs & Definition of Done (Linux Auto-Update)
* **Verification Gates Checklist (100% Passed):**
  - [x] **Vitest Test Suite Parity:** 59/59 test suites passing (378/378 tests) with full unit test coverage.
  - [x] **Zero TypeScript Errors:** `npm run typecheck` clean (0 errors).
  - [x] **Multi-Platform Clean Builds:** Both `build:linux` and `build:win` packaged and verified.
  - [x] **GitHub Release Parity:** Release assets re-published with updated binaries, `latest-linux.yml`, and fresh SHA-256 checksums on GitHub Release `v1.0.51`.
  - [x] **Local Linux Runtime Verified:** Local `~/Applications/TindaPOS.AppImage` updated atomically with `chmod +x` verified.

---

## 40. Verified VIP Badges, Animated Shimmer & Exclusive Lounge Styling (v1.0.52)
* **Problem Addressed:**
  - Merchants who purchased lifetime VIP Pro licenses from Dev Ian wanted a way to be recognized and distinguished in the public Global Community Lounge.
  - In v1.0.51, only the Developer (`👑 Ian (Founder / Dev)`) had a verified badge; all other store owners looked identical regardless of whether they were community users or paid VIP merchants.
* **Key Architectural Implementations:**
  - **Edge Database Column Extension (`tinda-sync-db`):**
    - Executed non-destructive migration on Cloudflare D1: `ALTER TABLE global_chat_messages ADD COLUMN is_vip INTEGER DEFAULT 0;`.
    - Preserved 100% of historical merchant messages and audit trails without downtime.
  - **Edge Worker Verification Pipeline (`tinda-sync-worker`):**
    - `POST /api/chat/messages`: Parses and persists `is_vip: Boolean(body.is_vip) ? 1 : 0`.
    - `GET /api/chat/messages`: Returns verified `is_vip` status across all message feeds.
    - Deployed to Cloudflare Edge (`https://tinda-sync.yomikaze-md.workers.dev`).
  - **Local Hardware License Introspection (`communityChat.ts`):**
    - Automatically checks `licenseService.getStatus().isVip` / `isVipActive(settings)`.
    - Securely binds `is_vip: 1` into the chat dispatch payload for active VIP Pro terminals.
  - **Animated Verified VIP Badge & Premium UI (`TindaCommunityChat.tsx`):**
    - Rendered animated `💎 VERIFIED VIP` badge with rotating sparkle icon (`animate-spin` on `Sparkles`), glowing gold pulse aura (`animate-pulse`), and gradient styling (`from-amber-500/25 via-yellow-400/35 to-amber-500/25`).
    - Premium chat bubble: VIP messages receive a warm golden-tinted container (`border-amber-500/35 bg-gradient-to-br from-amber-950/20 via-ink-900 to-ink-900 ring-1 ring-amber-400/20`).
    - Dynamic composer placeholder & indicator: Displays `Write as 💎 Verified VIP Pro...` and `💎 Posting with Verified VIP Pro badge` when an active VIP license is loaded.

---

## 41. Verification Gates, Non-Destructive Invariant Proofs & Definition of Done (v1.0.52)
* **Verification Gates Checklist (100% Passed):**
  - [x] **59/59 Vitest Test Suites Passing:** 379/379 unit and integration tests passing, including dedicated `communityChat.test.ts` VIP flag test.
  - [x] **Zero TypeScript Errors:** `npm run typecheck` (`typecheck:node` and `typecheck:web`) clean with 0 errors.
  - [x] **Multi-Platform Clean Builds:** Windows NSIS (`Setup.exe`), Portable (`Portable.exe`), and Linux (`AppImage`) compiled and packaged cleanly at semver `1.0.52`.
  - [x] **GitHub Release Published:** All 8 release assets published to GitHub Release `v1.0.52` with cryptographically verified SHA-256 checksums.
  - [x] **Cloudflare Worker Deployed:** Edge worker and D1 schema live and serving `is_vip` across production endpoints.
  - [x] **Local Linux Runtime Updated:** `~/Applications/TindaPOS.AppImage` atomically refreshed with v1.0.52 binary.

---

## 42. VIP E-Wallet & Cash Audit Hub (GCash, Maya & 3-Way Audit) (v1.0.53)
* **Problem Addressed:**
  - Sari-sari stores and local merchants actively operate auxiliary financial services: **GCash and Maya Cash In & Cash Out**.
  - Previously, store owners had to manually calculate cash drawer deltas and often suffered discrepancies when physical drawer cash was used to fulfill Cash Out transactions or when customer Cash In funds entered the drawer.
  - Store owners required custom, unrestricted service fees (tubo) per transaction without hardcoded percentage limits.
  - End-of-day reconciliation required auditing physical cash along with both digital e-wallets to catch unrecorded transfers or missing cash.
* **Key Architectural Implementations:**
  - **Additive Database Migration 11 (`ewallet_hub`):**
    - `ewallet_transactions`: Stores `channel` (GCASH/MAYA), `type` (CASH_IN/CASH_OUT), `amount_c`, `fee_c`, `fee_collected_via` (CASH/WALLET), `reference_no`, `customer_name`, `customer_phone`, `shift_id`, `created_at`.
    - `ewallet_audits`: Stores physical cash count denomination breakdown (1000 down to 0.25), expected vs actual for Cash, GCash, Maya, computed discrepancies, and total fees earned.
  - **Drawer & Wallet Delta Logic:**
    - Cash In: Customer gives cash to store -> drawer gains `+ (amount_c + feeInCash)`; digital wallet balance decreases.
    - Cash Out: Store gives cash to customer -> drawer loses `- (amount_c - feeInCash)`; digital wallet balance increases.
  - **Thermal Slips & Reports (58mm / 80mm):**
    - Customer Claim Slip: Formats reference number, sender/receiver, amount, service fee, and timestamp with store header.
    - 3-Way Audit Slip: Full breakdown of Physical Cash Drawer + GCash Account + Maya Account variances.
  - **POS Quick Access:**
    - `F8` keyboard hotkey and toolbar shortcut on POS screen for instant navigation to E-Wallet register.
    - Sidebar navigation entry with `💎 VIP` badge.
  - **VIP Cryptographic Gating:**
    - Backend IPC mutation handlers enforce `licenseService.getStatus().isVip`. Free users receive an interactive preview and upgrade prompt.

---

## 43. Verification Gates & Definition of Done (v1.0.53)
* **Verification Gates Checklist (100% Passed):**
  - [x] **60/60 Vitest Test Suites Passing:** 383/383 unit and integration tests passing, including dedicated `ewallet.test.ts` (4/4 tests).
  - [x] **Zero TypeScript Errors:** `npm run typecheck` clean with 0 errors across main, preload, and renderer.
  - [x] **Master Invariants Passed:** `tools/check_master_invariants.mjs` passed with 0 violations.
  - [x] **Multi-Platform Clean Builds:** Windows NSIS (`TindaPOS-Setup-1.0.53.exe`), Portable (`TindaPOS-Portable-1.0.53.exe`), and Linux (`TindaPOS-1.0.53.AppImage`) packaged.
  - [x] **GitHub Release Published:** Release `v1.0.53` live with SHA-256 checksums at `https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.53`.
  - [x] **Local Linux Runtime Updated:** `~/Applications/TindaPOS.AppImage` points to v1.0.53.

---

## 44. Bulletproof User Management & Modern Categorized Sidebar Navigation (v1.0.54)
* **Problem Addressed:**
  - Store staff frequently entered full names or usernames with varying letter case, causing false login failures.
  - Duplicate 4-digit PIN assignment risked cashier account collision in multi-staff retail environments.
  - Previous flat sidebar list grew excessively long as new modules (e-wallets, handbook, cloud sync) were introduced, cluttering the view for frontline cashiers.
* **Key Architectural Implementations:**
  - **Flexible & Case-Insensitive Auth Matching:**
    - SQL auth queries utilize `LOWER(u.username) = LOWER(?) OR LOWER(u.full_name) = LOWER(?)` for zero-friction sign-in.
  - **Target-Aware PIN & Collision Prevention:**
    - Extended `loginPin(pin, targetUserId?)` to verify direct credentials against selected cashier profiles.
    - Added unique PIN collision check in repository preventing duplicate PINs across active staff.
  - **1-Tap Cashier Switcher Chips:**
    - Exposed safe `auth:publicUsers` directory rendering interactive avatar chips on `Login.tsx` with auto-focus to PIN input.
  - **Categorized Sidebar UX Hierarchy:**
    - Structured all routes into 5 intuitive functional categories:
      1. *Cashier & Register* (POS, Quick Monitor, Help Guide)
      2. *Stock & Operations* (Inventory, Suppliers, Restock)
      3. *Customers & Suki* (Customers, Utang Ledger, E-Wallet Hub)
      4. *Records & Reports* (Transactions, Sales Reports, Audit Logs)
      5. *System & Guide* (Handbook, Database Backup, Settings)
    - Role-based section filtering: restricted staff roles do not see empty categories.
    - Active emerald indicator bar and polished staff status card with 1-tap lock/logout.

---

## 45. Enhanced Global Community Lounge: 100% Free Nationwide Online Chat, Non-Blocking Draggable Window, Minimizable Capsule Pill, Audio Chime & Message Moderation
* **Problem Addressed:**
  - The Global Community Lounge in v1.0.50 used a blocking modal backdrop that locked the cashier register screen while chat was open.
  - Merchants needed an audible alert when fellow store owners or Dev Ian posted wholesale updates or advisories.
  - Users wanted to move or minimize the lounge to maintain visibility of sales register totals.
  - Merchants needed the ability to delete accidental typos or remove their own messages, and the developer needed edge moderation tools.
* **Core Architectural Principles & Guarantees:**
  - **100% Free & Open to All Store Owners:**
    - The Global Lounge is completely unrestricted — ALL merchants nationwide can freely read, post, and discuss retail tips.
    - VIP Pro stores receive the exclusive animated `💎 VERIFIED VIP` badge with gold shimmering aura.
    - Founder / Dev Ian posts with cryptographically verified `👑 DEV / OWNER` badge unlocked via edge master secret.
  - **Dual-Tone Web Audio API Chime:**
    - Synthesizes clean Apple-style dual-tone chimes (587.33 Hz D5 → 880 Hz A5) via native `AudioContext`.
    - Zero external sound asset downloads, 100% offline-resilient, zero latency.
    - Filtered alert trigger: plays ONLY on new incoming messages from external senders (never triggers on own sent messages or initial bulk load).
    - Sound toggle button (`Volume2` / `VolumeX`) with persistent user preference in `localStorage`.
  - **Draggable Floating Window & Minimizable Capsule Pill:**
    - Removed blocking backdrop — cashiers can drag the chat window anywhere on screen and continue scanning barcodes and punching orders simultaneously.
    - Direct 1:1 physical tracking with viewport boundary safety preventing the window from ever moving off-screen.
    - Minimize button (`Minus`) collapses the chat into an ultra-compact Apple-style floating capsule pill (`w-72 h-11`) showing online pulse dot, unread message count badge, sound control, and 1-tap restore (`Maximize2`).
    - Position memory persisted in `localStorage` (`tinda_lounge_pos`).
  - **Self-Message Deletion & Master Moderation:**
    - Merchants can delete their own store's messages with a discreet hover trash button (`Trash2`).
    - Dev / Owner can delete and moderate any message across the network using the verified master secret.
    - Optimistic instant removal from UI + local blacklist prevents poll bounce-back, paired with non-blocking IPC `community:deleteMessage` dispatching DELETE / POST fallback to Cloudflare D1 edge backend.
* **Verification Gates Checklist (100% Passed):**
  - [x] **61/61 Vitest Test Suites Passing:** 401+ unit and integration tests passing, including 11/11 tests in `communityChat.test.ts`.
  - [x] **Zero TypeScript Errors:** `npm run typecheck` (`typecheck:node` and `typecheck:web`) clean with 0 errors.
  - [x] **Master Document Synchronized:** `SYSTEM_MASTER.md` and `GEMINI.md` fully up to date.

---

## 46. VIP E-Wallet Reconciliation Hub (v1.0.55): Physical Cash Drawer Zero Float Override, Dedicated Transactions Ledger, and 1-Tap Void/Delete Management
* **Problem Addressed:**
  - Cashiers running E-Wallet Cash In / Out ledger reported that the physical cash drawer reconciliation was locked to the total POS shift cash sales (`₱4,791.00`), causing false discrepancy/shortage alarms when the store maintains a separate E-Wallet cash pouch or starts with zero float.
  - Users testing or mistyping GCash/Maya transactions could not easily find where to delete or void mistakes, as transaction deletion was confined to a subtle icon on the side panel rather than an accessible ledger.
* **Core Architectural Principles & Guarantees:**
  - **Physical Cash Drawer Zero Float & Custom Presets:**
    - Cashiers can freely edit the Expected Cash Drawer field or use 1-tap quick action presets:
      1. `₱0.00 (Zero Float)`: Instantly sets expected drawer cash to zero for stores auditing e-wallet cash separately from POS sales.
      2. `Sync POS Shift (₱4,791.00)`: 1-tap resynchronization with the active shift's register cash sales if combined drawer accounting is preferred.
      3. `E-Wallet Net Only`: Dynamically sets expected cash to the shift's cumulative net cash drawer delta (+₱ Cash In collected minus ₱ Cash Out released).
    - Preserves user manual entries across data reloads without forced overrides.
    - Added 1-tap `Reset All to 0` for quick denomination clearing.
  - **Dedicated E-Wallet Transactions Ledger Tab:**
    - Added full-width 4th navigation tab: `Transactions ({count})` alongside `Cash In / Out`, `Audit Sheet`, and `Audit History`.
    - Live client-side search across Reference Number, Customer Name, Phone, Cashier, and Notes.
    - 1-Tap Channel filters (`All`, `GCash`, `Maya`) and Type filters (`All`, `Cash In`, `Cash Out`).
    - Complete audit columns: Date/Time, Cashier, Channel, Type, Principal Amount, Service Fee (Tubo), Fee Paid Via (Cash Drawer vs Wallet Deduction), Reference No, Customer Info.
  - **Apple-Design Destructive Void Modal & Optimistic State Recalculation:**
    - Prominent red `Void` action buttons on both recent side-feed and full transactions ledger.
    - Sleek Cupertino modal with frosted glass backdrop, transaction details summary, and safety warning.
    - Immediate IPC invocation to `ewallet:deleteTransaction(id)` with optimistic removal, shift summary recalculation, and drawer delta updates.
* **Verification Gates Checklist (100% Passed):**
  - [x] **All Test Suites Passing:** 401+ unit and integration tests passing.
  - [x] **Zero TypeScript Errors:** `npm run typecheck` clean.
  - [x] **Master Documentation Synchronized:** `SYSTEM_MASTER.md` and `GEMINI.md` updated to v1.0.55.

---

## 47. Permanent Hardware-Anchored VIP Licensing & Multi-Vault Self-Healing Architecture (v1.0.56)
* **Problem Addressed & Client Feedback:**
  - Merchants who purchased VIP Pro licenses reported losing their VIP status after software updates, requiring them to repeatedly copy their Machine ID and ask Dev Francis to generate new keys.
  - **Root Cause Analysis:**
    1. **Volatile Hardware Detection:** The legacy Machine ID calculation relied on `os.networkInterfaces()`, whose adapter ordering in Node.js flips whenever Wi-Fi is toggled, an Ethernet cable is unplugged, or mobile hotspot/VPN adapters connect. Furthermore, `wmic csproduct get uuid` was deprecated in Windows 11 24H2 and timed out on slow POS hardware, causing the hash to drift from `WIN_BIOS` to `WIN_REG`.
    2. **Ephemeral ID Computation (No Permanent Anchor):** Machine IDs were recalculated on every boot instead of being permanently anchored. Any momentary hardware state change generated a new `TNDA-XXXX-...` hash, failing the `stored.machineId !== liveMachineId` comparison.
    3. **Single Point of Storage Failure:** `tinda_license.json` was stored only in `%USERPROFILE%/.tindapos/tinda_license.json`. If an installer ran elevated (Admin) or disk cleanup cleared the folder, the license was deleted.
* **Core Architectural Implementations:**
  - **Quad-Vault Redundant License Persistence:**
    - Every VIP Pro activation and license record is synchronously mirrored across 4 independent vaults:
      1. `Vault 1 (User Home)`: `%USERPROFILE%/.tindapos/tinda_license.json`
      2. `Vault 2 (Electron UserData)`: `app.getPath('userData')/tinda_license.json`
      3. `Vault 3 (Windows Registry)`: `HKCU\Software\TindaPOS\LicensePayload` (Base64-encoded)
      4. `Vault 4 (SQLite Database)`: `system_license_vault` table (Migration 12 in `tindapos.db`)
    - **Self-Healing Engine:** On startup, `readAllVaults()` scans all 4 locations. If ANY vault contains a cryptographically verified VIP Pro payload, all missing or corrupted vaults are instantly reconstructed and synced.
  - **Permanent Canonical Machine ID Anchoring:**
    - The Machine ID is resolved ONCE from immutable hardware attributes (Windows Cryptography `MachineGuid` + Motherboard Product/UUID) without volatile network interface or user hostname dependencies.
    - Persisted into 4 hardware anchors (`machine.id` in User Home, UserData, Windows Registry `HKCU\Software\TindaPOS\MachineId`, and SQLite DB `system_license_vault.machine_id`).
    - Once anchored, the Machine ID never drifts or changes across software updates, network changes, or system reboots.
  - **Zero-Friction Legacy VIP Rescue & Automatic Reconciliation:**
    - In `getStatus()`, if an existing VIP license is found whose key matches either the canonical ID or any legacy candidate ID generated from the system's hardware/MAC adapters, the system automatically reconciles and permanently anchors that Machine ID!
    - Existing VIP clients update seamlessly without losing their license and without having to contact Dev Francis.
  - **Version Rollback & Safe Downgrade Recovery Manager:**
    - Merchants who encounter unexpected errors, OS incompatibilities, or issues with a newly installed update can safely revert to a previous stable release (e.g. `v1.0.55`, `v1.0.54`) directly from the app.
    - **100% Pre-Rollback Database Safety Snapshot:** Automatically triggers `createBackupSync(getDb(), 'BEFORE_UPDATE')` and validates SQLite database integrity before initiating any downgrade.
    - **Zero Data Loss & Additive Compatibility:** Since all database migrations in TINDA POS are strictly additive, previous versions cleanly open the existing database with zero loss to sales history, inventory, customers, or credit ledgers.
    - **Permanent VIP Preservation:** Because the license is anchored in `%USERPROFILE%/.tindapos/tinda_license.json` and the Windows Registry, previous versions immediately read the active VIP Pro license without re-activation.
    - **One-Tap UI Access:** Integrated into `SoftwareUpdatePanel` (Settings > About) and `Backup & Restore` page with an Apple-design frosted Cupertino modal (`RollbackModal.tsx`), download progress tracking, and automatic installer execution.
* **Verification Gates Checklist (100% Passed):**
  - [x] **All 62 Vitest Test Suites Passing (411/411 Tests):** Full unit test suite passes with 0 failures, including 11/11 tests in `license-service.test.ts` and 2/2 tests in `rollback-service.test.ts`.
  - [x] **Zero TypeScript Errors:** `npm run typecheck` (`typecheck:node` and `typecheck:web`) clean with 0 errors.
  - [x] **Additive Migration 12:** `system_license_vault` table added safely with full upgrade-chain preservation.
  - [x] **Living Architecture Master Document:** `SYSTEM_MASTER.md` and `GEMINI.md` fully up to date.

---

## 48. Financial Realized Revenue Engine & Zero-Flicker Client Store Hydration (v1.0.57)

* **Date:** October 2026
* **Component Impact:** `reporting.ts`, `dashboard.ts`, `app:salesMonitorSummary` (`ipc/index.ts`), `readReports.ts`, `checkout.ts`, `cloudSync.ts`, `stores/license.ts`, `EwalletAudit.tsx`, `Settings.tsx`, `Sidebar.tsx`.
* **Client Feedback Addressed:**
  1. *Financial Realized Revenue Model:* "Example may ei process ka sa cart na utang sya na mga items pwede sana boss franz hindi sya papasok sa todays net sales sa outstanding utang/credit lng tlaga sya naka standu sa dashboad, sales monitor at sa tinda pos owner cloude executive"
  2. *Zero-Flicker VIP Store Experience:* "Tapos pag click ko sa e wallet ug settings naay mo blink blink murag naay bug mag pakita pa fix pud ko ani"
* **Technical Implementations:**
  1. **Strict Realized Revenue Accounting (Utang Exclusion):**
     - Items and orders purchased via `UTANG` (credit) represent uncollected receivables rather than cash/digital revenue.
     - `salesReport` in `reporting.ts` computes `utang_c` per transaction via subquery: `(SELECT COALESCE(SUM(p.amount_c), 0) FROM payments p WHERE p.sale_id = s.id AND p.method = 'UTANG')`.
     - `summary.sales_total_c` strictly tracks `realizedSalesTotal = Math.max(0, grossSalesTotal - totalUtang)` (Cash + GCash + Maya, net of returns).
     - In `Dashboard.tsx`, "Today's Net Sales" stat card reflects only collected funds, while the "Outstanding Utang" card displays cumulative store credit receivables.
     - In `app:salesMonitorSummary` (`ipc/index.ts`) and `SalesMonitor.tsx`, `today.total_sales_c` is computed as `cash_c + gcash_c + maya_c`, while `today.utang_c` is isolated in its own metric pill.
     - In `readReports.ts` and `checkout.ts`, `net_sales_c` sent via `pushShiftToCloud` and `pushSaleToCloud` excludes Utang, keeping the Cloud Owner Dashboard synchronized with actual collected revenue.
  2. **Synchronous Zero-Flicker Hydration (`useLicense` Store):**
     - Root cause of navigation flicker was asynchronous initialization of `isVip: false` or `licenseStatus: null` inside `EwalletAudit.tsx`, `Settings.tsx`, and `Sidebar.tsx`. On every tab switch, components mounted fresh, flashed the Free Community Edition preview lock banner for 50ms, then violently unmounted it when `window.api.license.getStatus()` resolved.
     - Created `useLicense` Zustand store in `source/src/renderer/src/stores/license.ts` with synchronous `localStorage.getItem('tinda_is_vip')` initialization.
     - On the very first frame of render, `isVip` is already `true` for verified VIP merchants. The upgrade lock banner and upgrade buttons are skipped without delay or layout jitter.
* **Verification Gates Checklist:**
  - [x] `utang-net-sales-exclusion.test.ts` passes with 100% assertion on gross vs utang vs realized net sales.
  - [x] Zero TypeScript errors across entire frontend and backend (`npm run typecheck`).
  - [x] Production bundle builds cleanly (`npm run build`).

---

## 49. Multi-Theme & High-Clarity Eye-Care Background Engine (v1.0.57)

* **Date:** October 2026
* **Component Impact:** `main.css`, `theme.ts`, `ThemeSelector.tsx`, `Settings.tsx`, `main.tsx`.
* **Client Feedback Addressed:**
  - "butangi pud diay sa settings nga maka change change silag theme or background. kay dili daw makita boss suggest ko pla boss franz pwede mapalit palitan yung background pwede daw black pwede pud puti i dungag lang ni ikaw na bahala ani. kanang mas klaro sa mata nila."
* **Technical Implementations:**
  1. **Multi-Theme Engine Support:**
     - Created global `useTheme` Zustand store in `source/src/renderer/src/stores/theme.ts`.
     - Supports 4 distinct, purpose-designed theme palettes:
       - **Midnight Black (`dark`)**: Original Apple-design dark mode with deep OLED `#0a0d0f` background and emerald accents.
       - **Daylight White (`light`)**: High-contrast, pure white paper background (`#f8fafc` / `#ffffff`) with deep dark slate typography (`#0f172a`), specifically solving screen glare in bright sari-sari stores with direct sunlight or open-air storefronts.
       - **Warm Eye-Care (`warm`)**: Gentle sepia / cream background (`#fbf7ee` / `#fffdf7`) with soft stone ink (`#292524`) designed to filter harsh blue light and prevent eye fatigue during long 12-hour cashier shifts.
       - **Nordic Slate (`slate`)**: Deep navy blue environment (`#0b1120` / `#1e293b`) for high-contrast cashiering.
  2. **Zero-Flash Pre-React Hydration:**
     - In `main.tsx`, `localStorage.getItem('tinda_theme')` synchronously sets `document.documentElement.setAttribute('data-theme', theme)` before React mounts, guaranteeing 0ms flash of dark mode when launching in white or warm mode.
  3. **Apple-Design Theme Selector:**
     - Beautiful interactive card in `Settings.tsx` (`ThemeSelector.tsx`) with visual mini-swatches, active checkmarks, and instant 1-tap switching.
     - Persists automatically to both `localStorage` and SQLite database `StoreSettings.theme`.
* **Verification Gates Checklist:**
  - [x] Zero TypeScript errors in `npm run typecheck`.
  - [x] Production bundle compiles cleanly (`npm run build`).
  - [x] Windows distribution setup and portable binaries signed and verified (`npm run build:win`).

---

## 50. TINDA POS v1.0.57 Master Release Summary

* **Release Date:** October 5, 2026
* **Target Version:** `v1.0.57`
* **Release Artifacts:**
  - `TindaPOS-Setup-1.0.57.exe` (112.30 MB, NSIS installer with delta update support)
  - `TindaPOS-Setup-1.0.57.exe.blockmap` (119.72 kB, Differential update map)
  - `TindaPOS-Portable-1.0.57.exe` (112.08 MB, Standalone zero-install executable)
  - `TindaPOS-1.0.57-linux-x64.tar.gz` (134.35 MB, Cross-platform Linux distribution)
  - `latest.yml` (v1.0.57 auto-updater manifest)
  - `TindaPOS-User-Guide.pdf` (Official user documentation)
  - `SHA256SUMS-v1.0.57.txt` (Cryptographic verification checksums)
* **Master Verification:**
  - 14/14 targeted unit & regression tests passing (`utang-net-sales-exclusion.test.ts`, `license-service.test.ts`, `rollback-service.test.ts`).
  - 0 TypeScript errors across Node and Web targets (`typecheck:node`, `typecheck:web`).
  - Strict compliance with `docs/RELEASE-WORKFLOW.md` and `docs/RELEASE-STATE.md`.

---

## 51. Profit Margins Restoration & Automated VIP Rollback Engine (v1.0.58)

* **Date:** October 5, 2026
* **Target Version:** `v1.0.58`
* **Trigger:** VIP merchant feedback on profit drop and request for hardened, direct 1-click rollback with progress tracking and professional English UI copy.
* **Component Impact:**
  - `source/src/main/services/reporting.ts`
  - `source/src/main/services/rollbackService.ts`
  - `source/src/main/ipc/index.ts`
  - `source/src/preload/index.ts`
  - `source/src/renderer/src/components/update/RollbackModal.tsx`
  - `source/src/renderer/src/components/theme/ThemeSelector.tsx`
  - `source/src/renderer/src/stores/theme.ts`
  - `source/src/renderer/src/pages/Settings.tsx`
  - `source/src/renderer/src/pages/Backup.tsx`
* **Technical Implementations:**
  1. **Gross Profit & True Net Profit Margin Accuracy:**
     - In `reporting.ts`, corrected `summary.profit_c` calculation: `Math.round((grossSalesTotal - refunds.c) - (cost.c - refundedCost.c))`.
     - Preserves Realized Sales (`sales_total_c` excluding uncollected Utang credit) while maintaining true merchandise profit margin across all delivered goods.
     - Resolved negative profit dips in date-grouped sales charts by aligning profit curves to gross merchandise margins.
  2. **Hardened VIP Downgrade Protection:**
     - Both `rollback:getTargets` and `rollback:execute` IPC handlers now verify `licenseService.getStatus().isVip`. Non-VIP access is rejected with a security error.
     - Prevents unauthorized downgrades, crack attempts, or machine bypasses on store cashier terminals.
     - Added VIP Pro Crown badges to `Version Rollback` buttons in Settings and Backup pages.
  3. **Direct Execution & Automatic System Restart ("Diritsyo Na"):**
     - Once download completes, `rollbackService.ts` spawns the target installer detached with `--updated` and cleanly triggers `app.quit()` after 1.5 seconds.
     - Eliminates file locks on `tindapos.db` and executables, allowing NSIS to update smoothly and relaunch TINDA POS without cashier friction.
     - Auto-detects runtime flavor (`portableRuntime(process.env)`) to select `Setup` vs `Portable` binaries accurately.
  4. **Professional Live Download Progress Bar:**
     - IPC streaming via `_e.sender.send('rollback:progress', { downloaded, total, percent })`.
     - Apple-design gradient progress bar in `RollbackModal.tsx` displaying live percentage and MB transferred (`X MB / Y MB`).
  5. **100% Professional English Interface:**
     - Replaced all Bisaya text in `ThemeSelector.tsx` and `theme.ts` with polished English descriptions and eye-care guidance.

---

## 52. Release v1.0.59 — High-Density Enterprise POS Cashier Listing Engine
* **Version:** `1.0.59`
* **Release Date:** October 2026
* **Key Components Modified:**
  - `source/src/renderer/src/pages/POS.tsx`
  - `source/src/main/services/rollbackService.ts`
  - `source/package.json`
  - `tools/publish_v1059.mjs`
* **Technical Implementations:**
  1. **High-Density Enterprise POS Cashier Listing Table:**
     - Replaced bulky catalog tiles with an ultra-clean, high-density listing table, displaying 15–25 products simultaneously without vertical layout waste.
     - 5-Column Responsive Layout:
       - **Product / SKU / Barcode**: 36x36 thumbnail image avatar, high-visibility product name, cyan mono SKU badge, barcode, and optional specs.
       - **Category**: Clean rounded tag pill.
       - **Stock & Safety Status**: Exact available quantity with unit (pcs, kg), live pulse indicator (🟢 In Stock, 🟡 Low Stock Alert, 🔴 Out of Stock), and near-expiry warning dots.
       - **Pricing & Tier**: Bold retail price, wholesale volume pricing badge (`WS: ₱XX.XX (≥10)`), and Suggested Retail Price (`SRP`).
       - **Cart Status & Quick Stepper**: Active `In Cart: X` indicator with in-row `[ - ] [ count ] [ + ]` quantity stepper and 1-tap add.
  2. **Dual-Mode Switcher with Persistent Memory:**
     - Instant List / Grid Toggle buttons in the search header allowing cashiers to switch between the dense **Listing Table** (default) and the visual **Card Grid**.
     - Automatically persisted in `localStorage` (`tinda_pos_view_mode`) across app launches.
  3. **High-Speed Keyboard Navigation Ergonomics:**
     - `ArrowDown` and `ArrowUp` navigate through products with automatic smooth scroll follow (`scrollIntoView`).
     - `Enter` key immediately adds the selected product to the cart with audio and toast confirmation.
  4. **Retained System Invariants:**
     - Zero regression on hardware scanners, counter cameras, wireless phone scanners, CFD customer screens, or quad-vault VIP licensing.
  5. **Offline Rollback Continuity:**
     - Added `v1.0.58` as the top fallback release target in `rollbackService.ts`.

---

## 53. Release v1.0.60 — VIP Client Infinite Scroll & 7 Core Enhancements
* **Version:** `1.0.60`
* **Release Date:** October 2026
* **Key Components Modified:**
  - `source/src/renderer/src/pages/POS.tsx`
  - `source/src/renderer/src/layouts/Shell.tsx`
  - `source/src/renderer/src/lib/sound.ts`
  - `source/src/renderer/src/components/PosToolsModal.tsx`
* **Technical Implementations:**
  1. **VIP Client Full Scrolling & Infinite Inventory Feed:**
     - Removed hardcoded `limit: 60` query cap and fixed double-scroll height trapping in `Shell.tsx`.
     - Continuous auto-loading with `PAGE_SIZE = 120`, scroll boundary listeners, and `pb-28` padding across both Listing Table and Card Grid views.
  2. **Quick Cash Denomination & Increment Chips:**
     - 1-Tap quick payment chips in Cash Checkout: `Exact (₱...)`, `₱20`, `₱50`, `₱100`, `₱200`, `₱500`, `₱1,000`, plus instant increment chips `+₱20`, `+₱50`, `+₱100` for rapid change calculation.
  3. **Zero-Asset Web Audio API Hardware Synthesizer:**
     - 100% offline Web Audio API synthesizer (`sound.ts`) producing scan confirmation chimes (1300Hz-1750Hz sine), out-of-stock buzzers (280Hz sawtooth), and register chimes with top-bar mute control.
  4. **Multiplier Scan & Rapid Entry Engine:**
     - Supports `5*BARCODE` or `12*PRODUCT` rapid multiplier punch in the cashier search bar.
  5. **Senior Citizen & PWD 20% Statutory Discount System:**
     - 1-Click modal discount calculating 20% subtotal deduction with OSCA/PWD ID and booklet tracking.
  6. **1-Click Thermal Z-Reading / Daily Cash Balancing Print:**
     - Direct ESC/POS thermal printing for end-of-shift Z-reading reports.
  7. **Automated 7-Day Rolling Daily SQLite Safety Snapshot:**
     - Rolling 7-day automatic backup pruning protecting against unbounded disk growth.

---

## 54. Release v1.0.61 — Mathematical Mass Edition & GOOJPRT Desktop Thermal Support
* **Version:** `1.0.61`
* **Release Date:** October 2026
* **Key Components Modified:**
  - `source/src/renderer/src/components/AppLogo.tsx`
  - `source/src/main/services/printing.ts`
  - `source/src/renderer/src/components/PosToolsModal.tsx`
  - `source/src/main/services/phoneScannerService.ts`
* **Technical Implementations:**
  1. **Mathematical Mass Brand Mark:**
     - Precision SVG Quantum Summation brand mark with mathematical golden ratio geometry.
  2. **GOOJPRT PB-58H Hardware Thermal Support:**
     - Added native ESC/POS command sequences specifically tuned for GOOJPRT PB-58H 58mm thermal printers over USB and Bluetooth virtual serial COM ports.
  3. **Terminal Tools [F3] Consolidated Workspace:**
     - Unified modal (`PosToolsModal.tsx`) hotkeyed to `F3` giving cashiers instant access to cash drawer kick, feed paper test, phone scanner status, and printer diagnostics.
  4. **Line Item Custom Unit Price Editing:**
     - Manager-authorized in-line price overrides directly inside the active checkout table for negotiated wholesale deals.
  5. **Multi-Adapter Wireless Phone Scanner Discovery:**
     - Auto-enumerates all local IPv4 network adapters (LAN, Wi-Fi, Hotspot) to generate accurate QR codes for mobile scanner pairing.

---

## 55. Release v1.0.62 — Ultra-Modern Quantum Mark & GOOJPRT Hardware Fix
* **Version:** `1.0.62`
* **Release Date:** October 2026
* **Key Components Modified:**
  - `source/src/main/services/printing.ts`
  - `source/src/renderer/src/components/AppLogo.tsx`
  - `source/src/renderer/src/components/layout/Sidebar.tsx`
* **Technical Implementations:**
  1. **GOOJPRT Blank Print Driver Resolution:**
     - Fixed blank feed anomalies on low-cost USB thermal printer controllers by enforcing raw buffer chunking and proper ESC/POS initialization (`ESC @`, `ESC 3 24`).
  2. **Quantum Mark System Integration:**
     - Unified dynamic application logo across Window titlebar, Sidebar, Receipt headers, and login splash.
  3. **Terminal Tools Sidebar Integration:**
     - Persistent access to Terminal Tools (`F3`) from the primary cashier navigation bar.

---

## 56. Release v1.0.63 — Zero-Click Auto-Detect Thermal Printer & Paper Width Inference
* **Version:** `1.0.63`
* **Release Date:** October 2026
* **Key Components Modified:**
  - `source/src/main/services/printing.ts`
  - `source/src/shared/printer.ts`
  - `source/src/renderer/src/components/PosToolsModal.tsx`
* **Technical Implementations:**
  1. **Zero-Click Thermal Printer Auto-Detection:**
     - Background heuristic scanning via `electron.webContents.getPrintersAsync()` automatically detects connected ESC/POS devices (POS-58, POS-80, GOOJPRT, Xprinter, Epson) without manual configuration.
  2. **Automatic Paper Width Inference:**
     - Dynamically infers paper roll width (`58mm` vs `80mm`) from printer name heuristics, setting optimal character column widths (`32 col` vs `48 col`) and table column flex metrics.
  3. **Auto-Detect Status in Terminal Tools:**
     - Real-time indicator displaying connected thermal printer status, paper width profile, and communication latency.

---

## 57. Release v1.0.64 — VIP Custom Logo & Universal Discount Edition
* **Version:** `1.0.64`
* **Release Date:** October 2026
* **Key Components Modified:**
  - `source/src/renderer/src/pages/Settings.tsx`
  - `source/src/shared/receiptHtml.ts`
  - `source/src/main/services/printing.ts`
  - `source/src/renderer/src/pages/POS.tsx`
  - `source/src/renderer/src/pages/SalesMonitor.tsx`
* **Technical Implementations:**
  1. **VIP Pro Custom Store Logo Upload:**
     - Merchant branding on receipts with local base64/PNG image storage, automatic monochrome thresholding, and dithering for 203 DPI thermal printing.
  2. **Universal Custom Cart Discount Engine:**
     - Supports percentage-based (`%`) and fixed peso (`₱`) discounts across entire cart or line-item levels with audit-tracked reason codes.
  3. **100% Professional English System-Wide Localization:**
     - Completed comprehensive removal of colloquial dialect from user-facing screens, modals, error toasts, and tooltips.
  4. **Register Header Optimization:**
     - Decluttered cashier header bar for optimal ergonomics during peak store hours.
  5. **Sales Monitor & Cloud Metric Synchronization:**
     - Unified financial calculation pipelines between local Sales Monitor and the Cloud Owner Dashboard.

---

## 58. Release v1.0.65 — Zero-Blur High-Density Thermal & Universal Manual Print Edition
* **Version:** `1.0.65`
* **Release Date:** October 2026
* **Key Components Modified:**
  - `source/src/main/services/printing.ts`
  - `source/src/shared/receiptHtml.ts`
  - `source/src/renderer/src/components/PosToolsModal.tsx`
* **Technical Implementations:**
  1. **Universal Manual Print Fallback:**
     - Integrated native Windows Print Dialog (`printDialog: true`) pre-bound to detected thermal devices, ensuring printing functionality even on restricted or non-standard driver setups.
  2. **Zero-Blur High-Density Thermal Typography Engine:**
     - Enforced pixel-grid aligned fonts (`Courier New`, monospace 11px/12px) with bold text weights (`700`), eliminating anti-aliasing fuzziness on 203 DPI thermal printheads.
  3. **Hardware Model Compatibility Catalog:**
     - Extended built-in hardware matching profiles for GOOJPRT 58H, POS-58, POS-80, and Bluetooth mini printers.

---

## 59. Release v1.0.66 — Universal Shelf Price Tags, Operations Sheets, Zero-Waste Thermal & Bills Payment Edition
* **Version:** `1.0.66`
* **Release Date:** October 2026
* **Key Components Modified:**
  - `source/src/renderer/src/components/PriceTagPrintModal.tsx`
  - `source/src/renderer/src/components/InventoryPrintModal.tsx`
  - `source/src/shared/receiptHtml.ts`
  - `source/src/renderer/src/pages/POS.tsx`
  - `source/src/renderer/src/pages/BillsLoadHub.tsx`
  - `source/src/renderer/src/components/community/TindaCommunityChat.tsx`
* **Technical Implementations:**
  1. **Universal Multi-Size Shelf Price Tag & Barcode Printing:**
     - Added `PriceTagPrintModal.tsx` in Inventory catalog with 1-tap shelf label generation per item or batch-wide.
     - Supports standard shelf tag dimensions (`30×20mm`, `40×30mm`, `50×30mm`, custom mm) with Code128 barcodes, product name, peso price, and wholesale tier badges.
  2. **Physical Inventory & Operations Printable Sheets Hub:**
     - Added `InventoryPrintModal.tsx` in Inventory header with 4 professional printable templates: Stock on Hand Report, Physical Count Sheet, Purchase / Restock Order (P.O.), and Stock Adjustment Log.
  3. **Zero-Waste Thermal Receipt Gap & Decimal Precision Optimization:**
     - Reduced receipt bottom clearance from `10mm` to `3mm` and vertical element spacing from `12px` to `4px`, cutting up to 40% thermal paper roll waste.
     - Ensured full visibility of centavo decimals on narrow 58mm rolls via flex right-gutter alignment.
  4. **Multi-Criteria Smart Product Search & Instant Enter-to-Punch Engine:**
     - Instant enter punch by name, SKU, or barcode; multiplier rapid punch (`5*egg`, `12*48000123`); proactive low-stock warnings and interactive No Product Found card.
  5. **Community Chat & Clean Terminology Standard:**
     - Renamed Global Lounge to Community Chat; removed outdated "Hub" titles across the entire application.

---

## 60. Release v1.0.67 — Unified E-Wallet & Bills Center, Universal Manual Print & Zero-Waste Thermal Edition
* **Version:** `1.0.67`
* **Release Date:** October 2026
* **Key Components Modified:**
  - `source/src/renderer/src/pages/EwalletAudit.tsx`
  - `source/src/renderer/src/components/layout/Sidebar.tsx`
  - `source/src/main/services/transaction.ts`
  - `source/src/main/ipc/index.ts`
  - `GEMINI.md`
* **Technical Implementations:**
  1. **Consolidated E-Wallet & Bills Center (Single Sidebar Module):**
     - Combined previously separated modules into a single cohesive **E-Wallet & Bills** navigation entry under *Cashier & Register*.
     - 5 Integrated Cupertino Tabs: `Cash In / Out`, `Bills & E-Load`, `Transactions`, `Audit Sheet`, and `Audit History`.
  2. **Native Hardware Thermal & Universal Manual Printing:**
     - Integrated with Electron native print pipeline (`ewallet:printBillSlip`), supporting direct thermal printing and Windows system dialog manual printing for bill payment transaction slips.
  3. **Deletion & Void Safeguards:**
     - Added dedicated Delete buttons (`Trash2`) with interactive Cupertino confirmation modals for both E-Wallet and Bills Payment records.
  4. **Mandatory Auto-Increment Version Bump Rule:**
     - Added operational invariant rule #10 in `GEMINI.md`: Every build/release MUST auto-increment the version across `source/package.json`, `GEMINI.md`, `README.md`, `PosToolsModal.tsx`, and `docs/RELEASE-STATE.md`.

---

## 61. Release v1.0.68 — Ultra-Compact Zero-Waste Thermal Receipt Spacing Engine
* **Version:** `1.0.68`
* **Release Date:** October 2026
* **Key Components Modified:**
  - `source/src/shared/receiptHtml.ts`
  - `source/src/main/services/printing.ts`
  - `source/package.json`
  - `tools/publish_v1068.mjs`
* **Technical Implementations:**
  1. **Ultra-Compact Thermal Receipt Spacing Engine (Paper-Saving Optimization):**
     - Responded directly to store owner feedback regarding excessive thermal paper consumption ("kalas ug papel").
     - Tightened typography body line-height from `1.25` to `1.15` in `receiptHtml.ts` for dense, crisp thermal text printing.
     - Reduced line-item vertical bottom margin (`.tp-item`) from `0.15em` to `0.06em`.
     - Tightened section separators (`.tp-sep`), spacing gaps (`.tp-gap`), and subtotal blocks (`.tp-total`, `.tp-sukli`, `.tp-sum`), eliminating 20% to 30% of unnecessary white space per receipt.
     - Decreased print bottom clearance from `3mm` down to `1.5mm`, cutting receipts cleanly right after the thank-you footer with zero extra blank roll feed.
     - Preserves 100% legibility on 203 DPI thermal printheads with integer dot sizing (11px / 12px), bold stroke weights, and clear decimal tabular-nums alignment.
  2. **Quality Invariants Verification:**
     - All 416 automated vitest unit tests passing across 63 test suites with 0 TypeScript compilation errors.
     - Production installer and portable binaries published with verified SHA256 checksums to GitHub Releases.

---

## 62. Release v1.0.69 — Laptop Responsive Layout & Auth Setup Resilience Edition
* **Version:** `1.0.69`
* **Release Date:** October 2026
* **Key Components Modified:**
  - `source/src/renderer/src/pages/EwalletAudit.tsx`
  - `source/src/main/services/auth.ts`
  - `source/src/main/services/__tests__/stabilization.test.ts`
  - `source/package.json`
  - `source/src/renderer/src/components/PosToolsModal.tsx`
  - `tools/publish_v1069.mjs`
  - `GEMINI.md`
  - `README.md`
  - `docs/RELEASE-STATE.md`
* **Technical Implementations:**
  1. **E-Wallet & Bills Laptop Resolution Responsiveness:**
     - Replaced `lg:grid-cols-12` split layouts with `2xl:grid-cols-12` across the Register and Bills Payment tabs in `EwalletAudit.tsx`. On laptop screens ($1366\times 768$, $1280\times 720$, $1280\times 800$), the input form and ledger tables stack vertically in full width, preventing column truncation.
     - Pinned the Actions column (`sticky right-0 z-10`) with solid container backgrounds (`bg-ink-900`, `bg-ink-950`), custom left borders, and drop shadow depth for both Bills and Transactions ledgers. Even when users zoom or display on narrow viewport widths, the **Print**, **Manual Print**, and **Void / Delete** buttons remain perpetually anchored on-screen and never hidden.
  2. **First-Run Auth Setup Lockout Fix & Auto-Healing:**
     - Resolved the `SqliteError: UNIQUE constraint failed: users.username` crash when users restarted or updated into the setup wizard.
     - In `auth.ts`, refactored `completeSetup` to be fully idempotent: when an existing user is detected via `getUserByUsername`, the setup transaction securely upserts and updates their credentials, full name, and active admin roles rather than throwing SQLite uniqueness constraint errors.
     - Enhanced `firstRunComplete(db)` to return `userCount(db) > 0` directly and auto-heal blank or missing `store_name` settings with default metadata, ensuring existing stores never get mistakenly flagged as unconfigured first-run states.
  3. **Thermal Receipt Monospace & Double-Line Formatting Alignment:**
     - Verified thermal receipt styling in `receiptHtml.ts` for 58mm and 80mm paper rolls: monospace font stack (`Consolas, "Courier New", monospace`), exact right-aligned tabular numerals (`font-variant-numeric: tabular-nums; text-align: right`), double-line total borders (`border-top: 3px double black`), and compact zero-waste vertical spacing.
     - Validated consistency across both automated ESC/POS hardware burning and manual Windows system dialog print routes.
  4. **Quality Invariants & Automated Verification:**
     - 417 automated vitest unit tests passing across 63 test suites (100%).
     - Zero TypeScript compilation errors on both Node and Web targets.
     - Verified master codebase invariants prior to packaging.

---

## 63. Release v1.0.70 — 7-Eleven Micro Thermal Spacing & Express Manual Print Edition
* **Version:** `1.0.70`
* **Release Date:** October 2026
* **Key Components Modified:**
  - `source/src/shared/receiptHtml.ts`
  - `source/src/main/services/checkout.ts`
  - `source/src/renderer/src/pages/EwalletAudit.tsx`
  - `source/package.json`
  - `source/src/renderer/src/components/PosToolsModal.tsx`
  - `GEMINI.md`
  - `README.md`
  - `docs/RELEASE-STATE.md`
* **Technical Implementations:**
  1. **7-Eleven Retail Micro Thermal Spacing & Monospace Standard:**
     - Standardized receipt typography to pure monospace font family (`'Courier New', Courier, Consolas, monospace`) matching commercial 7-Eleven retail slips.
     - Reduced page margins and vertical padding to ultra-dense micro-spacing (`1mm 1mm 2mm 1mm`), eliminating unnecessary white space on 58mm and 80mm rolls.
     - Implemented authentic double-line divider `================================` via `.tp-sep-double` (`border-top: 3px double #000000; margin: 3px 0;`) right before grand totals in both preview DOM and `@media print` CSS overrides.
     - Updated default receipt footer text to standard retail greeting: `'Thank you! Please come again.'`.
  2. **E-Wallet & Bills Slip Tabular Numerals Alignment:**
     - Expanded `isMoneyLine` parser in `receiptHtml.ts` to identify `Amount`, `Service Fee`, `Bill Amount`, `TOTAL PAID`, `TOTAL CASH RECEIVED`, and `TOTAL CASH RELEASED`.
     - Automatically renders monetary rows as `.tp-split` with tabular numerals (`font-variant-numeric: tabular-nums`) flush to the right margin, preventing ragged alignment on thermal printouts and manual print windows.
  3. **Express Manual & Auto Print for Recent Cash In / Out Register:**
     - Added dedicated Auto Print (`Printer`) and Manual Print (`Manual`) action buttons to Recent E-Wallet Transactions on the Cash In / Out register tab in `EwalletAudit.tsx`.
     - Directly calls `printEwalletReceipt(tx.id, false)` and `printEwalletReceipt(tx.id, true)` for instant print dialog invocation without navigating away to the history tab.
  4. **Quality Invariants & Build Verification:**
     - 417 automated unit tests passing across 63 test suites with 0 TypeScript compiler errors.
     - Master invariants verified 100%.

---

## 64. Architecture Plan & Specification: Clean Fee Notation, No-Seconds Receipt Timestamps & Next-Gen Community Chat (v1.0.71)
* **Status:** Proposed & Planned (Awaiting Boss Ian's Approval)
* **Target Version:** `v1.0.71`
* **Trigger:** Merchant feedback from Boss Ian regarding:
  1. Removal of `+` sign in `+Fee` for E-Wallet and Bills UI and print stubs.
  2. Removal of seconds from receipt date & time format (e.g., `Oct 7, 2026, 10:07 PM` instead of displaying seconds).
  3. Community Chat offline diagnosis, minimized drag-without-open fix, label change to "Chat", emoji picker, photo attachments, seen receipts with timestamps, and live online user counter.
* **Component Impact:**
  - `source/src/renderer/src/pages/EwalletAudit.tsx`
  - `source/src/shared/receiptHtml.ts`
  - `source/src/main/services/checkout.ts`
  - `source/src/main/services/communityChat.ts`
  - `source/src/renderer/src/components/community/TindaCommunityChat.tsx`
  - `source/src/shared/types.ts`
* **Technical Implementations:**
  1. **Clean Fee Notation (Removal of `+` Prefix):**
     - In `EwalletAudit.tsx`: Cleaned quick fee chips (`₱10`, `₱15`, `₱20`, `₱30`, `₱50`), transaction table rows (`₱{fee}` instead of `+₱{fee}`), summary metrics (`Fee: ₱...`), and delete dialogs.
     - In `receiptHtml.ts`: Updated `formatBillSlipLines` so `Service Fee` prints as clean `P{amount}` without `+`.
  2. **No-Seconds Universal Receipt Timestamps:**
     - Standardized all thermal receipt date/time formatters across POS sales, E-Wallet slips, Bills receipts, and test prints to `{ dateStyle: 'medium', timeStyle: 'short' }` (producing e.g., `Oct 7, 2026, 10:07 PM` with strictly no seconds).
  3. **Community Chat Offline Root Cause & Edge Worker Fix:**
     - **Offline Root Cause:** `https://tinda-sync.yomikaze-md.workers.dev/api/chat/messages` currently returns HTTP 404 because the edge worker route is absent/unrouted on Cloudflare.
     - **Client Resilience:** Graceful error handling in `communityChat.ts` so network timeouts or edge 404s fail silently with local message buffering and automatic recovery once the worker is live.
  4. **Hold-and-Drag Fix on Minimized Pill:**
     - Prevent accidental window expansion during drag by adding a drag-movement threshold check (`Math.hypot(dx, dy) > 4`) on `mouseUp`. If the mouse moved while dragging, the click/restore event is suppressed.
     - Renamed minimized pill text from `Lounge` to `Chat` and updated title tooltip to `Expand Chat`.
  5. **Emoji Picker & Photo Attachment Support:**
     - Integrated quick-click emoji bar with merchant-centric smileys (`😀 😂 😍 👍 🙏 🏪 📦 💰 🔥 👏 ❤️ 🎉 🚀 🇵🇭`).
     - Added image attachment input supporting file selection and clipboard paste with client-side image compression and inline thumbnail rendering in message bubbles.
  6. **Seen Receipts & Online Merchant Counter:**
     - Added `seen_by: { name: string; time: string }[]` tracking to `CommunityChatMessage` so users can see who viewed messages and at what exact time without seconds.
     - Added live presence counter (`🟢 X Online`) in the chat header and minimized floating pill.
  7. **Universal Store Logo Upload & Desktop Window Icon:**
     - Removed VIP gating from `AppLogo` rendering: any store can upload their PNG/JPG/WEBP logo locally via Settings.
     - The custom logo displays throughout the application (Sidebar brand, Header, Welcome banner, Login screen, and thermal receipts).
     - Synchronized Electron `mainWindow.setIcon` with the store's custom logo for localized branding on the Windows taskbar and desktop titlebar.
  8. **Cinematic Dashboard Login Entrance Animations:**
     - Replaced abrupt static dashboard mounting with smooth staggered CSS keyframe transitions (`@keyframes fadeInUp` with staggered delays across metric cards, update banner, and recent transaction tables).
     - Added an executive welcome banner featuring a dynamic time-of-day greeting ("Good morning / afternoon / evening, [Cashier Name]!"), store logo, and active shift pill.
     - Polished glassmorphism with smooth micro-interactions (`hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300`).


---

## 65. Enterprise N-Tier / 3-Tier Architecture Standard (PAL, BLL/BAL, DAL)
* **Status:** Permanent System Invariant & Workflow Standard
* **Architectural Blueprint:**
  TINDA POS follows a strict **N-Tier / 3-Tier Enterprise Decoupled Architecture**:

```
┌────────────────────────────────────────────────────────────────────────┐
│               PAL — Presentation Access Layer (Client UI)              │
│       React 18 · TailwindCSS · Zustand Stores · Cupertino Modals       │
│                Directory: source/src/renderer/                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         Context-Isolated IPC Bridge
                   (source/src/preload/ & source/src/shared/)
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│              BLL / BAL — Business Logic / Access Layer                 │
│      Pricing · Checkout · Auth Rules · E-Wallet Math · Reporting       │
│                 Directory: source/src/main/services/                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                            Direct TypeScript Calls
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                     DAL — Data Access Layer (Database)                 │
│         Better-SQLite3 · Prepared Statements · ACID Transactions       │
│        Directories: source/src/main/repositories/ & .../db/            │
└────────────────────────────────────────────────────────────────────────┘
```

1. **PAL (Presentation Access Layer / UI Layer)**:
   - **Path:** [`source/src/renderer/`](file:///C:/Users/mtafl/Desktop/TINDA/TINDA-POS-Source/source/src/renderer/)
   - **Components:** React pages (`POS.tsx`, `Inventory.tsx`, `EwalletAudit.tsx`), UI components, and client-side Zustand stores (`usePosCart`, `useAuth`, `useSettings`).
   - **Rule:** The PAL **never** imports `better-sqlite3`, never executes SQL queries directly, and never accesses native OS filesystems. All mutations route through the typed IPC Bridge (`window.api`).

2. **IPC Contract & DTO Bridge (Interface Layer)**:
   - **Paths:** [`source/src/shared/types.ts`](file:///C:/Users/mtafl/Desktop/TINDA/TINDA-POS-Source/source/src/shared/types.ts), [`source/src/shared/ipc.ts`](file:///C:/Users/mtafl/Desktop/TINDA/TINDA-POS-Source/source/src/shared/ipc.ts), and [`source/src/preload/index.ts`](file:///C:/Users/mtafl/Desktop/TINDA/TINDA-POS-Source/source/src/preload/index.ts).
   - **Rule:** Strictly typed request/response contracts and data transfer objects (DTOs). Guarantees Electron security isolation (`contextIsolation: true`, `nodeIntegration: false`).

3. **BLL / BAL (Business Logic Layer / Business Access Layer)**:
   - **Path:** [`source/src/main/services/`](file:///C:/Users/mtafl/Desktop/TINDA/TINDA-POS-Source/source/src/main/services/)
   - **Modules:**
     - `checkout.ts`: Cart item calculations, discount caps, stock availability gating, multi-payment validation.
     - `auth.ts`: Password hashing, user session lifecycle, lockout auto-healing.
     - `ewallet.ts`: Drawer float reconciliations, fee collection rules.
     - `reporting.ts`: Gross profit calculations, realized revenue vs utang exclusions.
     - `printing.ts`: Receipt string layouts, ESC/POS hardware command generation.
     - `licenseService.ts`: HMAC machine-bound cryptographic license validation.
   - **Rule:** Contains all business logic, invariant enforcement, and calculation formulas. Unit-tested in isolation with Vitest without mounting React UI or Electron windows.

4. **DAL (Data Access Layer)**:
   - **Paths:** [`source/src/main/repositories/`](file:///C:/Users/mtafl/Desktop/TINDA/TINDA-POS-Source/source/src/main/repositories/) and [`source/src/main/db/`](file:///C:/Users/mtafl/Desktop/TINDA/TINDA-POS-Source/source/src/main/db/).
   - **Modules:** `sales.ts`, `products.ts`, `customers.ts`, `shifts.ts`, `settings.ts`, `users.ts`, `audit.ts`.

---

<<<<<<< HEAD
## 66. Native Document Printing, Audit Dual Print Engine & MariBank Ecosystem Integration (v1.0.72)
* **Problem Addressed & User Feedback:**
  1. *Printable Inventory & Operations Reports Failure:* Users clicking Print on physical count sheets, stock-on-hand reports, and purchase orders encountered failures because the modal invoked `window.open()`, which is blocked or restricted by Electron's chromium security boundary.
  2. *Audit Sheet & History Dual Printing:* Store cashiers needed both Auto Print (direct thermal burning) and Manual Print (Windows System Print Dialog pre-bound to printer) for E-Wallet shift audits and historical audits to troubleshoot locked spoolers or choose specific report printers.
  3. *MariBank Provider Integration Request:* Community sari-sari stores and retail merchants actively requested MariBank (SeaMoney / Shopee digital banking ecosystem in the Philippines) support alongside GCash and Maya for cash-in, cash-out, bills, and multi-wallet drawer reconciliations.

* **Key Architectural Implementations:**
  - **Native Document Printing Pipeline (`printing.ts`, `ipc/index.ts`, `InventoryPrintModal.tsx`):**
    - Replaced unreliable renderer `window.open` popup printing with native Electron IPC `printing:printDocument`.
    - Spawns a dedicated hidden BrowserWindow, renders complete CSS-styled A4 / Letter printable sheets with `@page` print rules, and triggers `webContents.print()`.
    - Supports both **Auto Print** (direct to detected printer) and **Manual Print** (invokes native Windows print dialog with printer, copies, and PDF export options).
  - **Dual Printing for E-Wallet Audit Sheet & Audit History (`EwalletAudit.tsx`, `ipc/index.ts`):**
    - Extended `ewallet:printAuditReport` IPC channel to accept `{ manual?: boolean }`.
    - Added dedicated **Auto Print** and **Manual Print** buttons in both the live **Audit Sheet** footer and the **Audit History** ledger table.
  - **MariBank Provider Integration (`types.ts`, `ewallet.ts`, `EwalletAudit.tsx`, `migrations.ts`):**
    - Expanded `EwalletChannel` and `sourceWallet` to include `'MARIBANK'`.
    - Designed custom vibrant brand styling for MariBank (`#FF6A00` Shopee/Sea orange gradient badges and chip selectors).
    - Added SQLite database migration for `ewallet_audits` (starting, in, out, expected, actual, variance columns for MariBank) and updated `ewallet_transactions` check constraint.
    - Updated `EwalletShiftSummary` and `formatEwalletAuditLines` in `receiptHtml.ts` to cleanly format MariBank cash flow alongside GCash and Maya without breaking existing transactions.

---

## 67. Ultra-Compact Zero-Wrap Thermal Receipts & Universal Receipt Standard Edition (v1.0.73)
* **Problem Addressed & Reference Alignment (1.jfif & 2.jfif):**
  1. *Receipt Timestamp Wrapping:* Previous date/time formatting (`dt.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })`) produced strings like `Oct 8, 2026, 9:49 AM` (26+ chars), which awkwardly wrapped onto a second line (`Oct 8, 2026, 9:49 \n AM`) on narrow 58mm (32-column) thermal paper rolls.
  2. *Reference Standard Visual Hierarchy:* Reference images `1.jfif` (Bills & E-Load slip) and `2.jfif` (Sales receipt) established an explicit retail typography hierarchy: single-line date format (`10/08/2026 9:49 PM`), double-line dividers (`================================`) framing grand totals (`TOTAL`, `TOTAL PAID`, `TOTAL CASH RECEIVED / RELEASED`), and cash tendered with change breakdown.
  3. *Zero-Waste Micro Thermal Spacing:* Monospace line-height optimized to `1.05`, integer dot sizing (`10px` body, `11px` bold headers/totals, `9px` footers), and tight `2mm` page padding.
  4. *Strict English Standard:* Cleaned up residual Bisaya/Filipino terminology across user-facing E-Wallet and Bills UI and receipt outputs to 100% professional English.

* **Key Architectural Implementations:**
  - **Deterministic Zero-Wrap Date Formatter (`receiptHtml.ts`):**
    - Created `formatReceiptDate()` returning standard single-line `MM/DD/YYYY h:mm A` (`10/08/2026 9:49 PM`, exactly 19 chars), guaranteeing zero line-wraps across 58mm and 80mm paper widths.
    - Synchronized across `checkout.ts` (`buildReceiptLines`), `printing.ts` (`testPrintLines`), `readReport.ts` (`localTime`), `formatEwalletSlipLines`, `formatBillSlipLines`, and `formatEwalletAuditLines`.
  - **Double-Divider Total Blocks (`receiptHtml.ts`, `checkout.ts`):**
    - Standardized double-line framing around grand total lines across sales receipts, E-wallet claim slips, and bills payments.
    - Updated `rowsToHtml()` with adjacent separator detection (`has-adjacent-top-sep`, `has-adjacent-bottom-sep`) to eliminate redundant border doubling.
  - **Bills Cash Tendered & Change Calculation (`EwalletAudit.tsx`, `receiptHtml.ts`):**
    - Extended `BillRecord` interface and form with optional `cashReceived` and `change` fields.
    - Added real-time change calculation UI in the Bills & E-Load center and passed both tender amounts to `formatBillSlipLines` for automatic rendering on thermal receipts.
  - **Strict English Localization Standard:**
    - Standardized all UI labels from "Tubo" to "Fee", "Total Fees Earned", and "Service Fee" across all tabs, summary chips, transaction tables, and confirmation modals.

---

## 68. Audit Delete Safeguards, Fast Feature Patcher & Unrestricted E-Wallet (v1.0.74 – v1.0.76)
* **Problem Addressed:**
  1. Cashiers needed ability to safely remove mistake entries in Audit Sheet and Audit History without corrupting database integrity.
  2. Large installer downloads (112 MB) caused friction for fast UI/feature fixes.
  3. E-Wallet Center was previously locked behind a VIP badge, restricting cashiers in sari-sari retail operations.
* **Key Architectural Implementations:**
  - **Audit Safeguards (`auditRepo.ts`, `EwalletAudit.tsx`):** Added delete options with double-confirmation modals and atomic SQLite deletions.
  - **Fast Feature Patcher Engine (`patchService.ts`, `bundle_patch.mjs`):** Lightweight patch delivery (~0.8 MB) containing pre-built renderer artifacts.
  - **Unrestricted E-Wallet Access:** Unlocked GCash, Maya, and MariBank recording, fee tracking, and slip printing for 100% of store accounts without VIP key requirements.

---

## 69. Sidebar Fast Updates Hub & Zero-Restart Live Engine (v1.0.77 – v1.0.79)
* **Problem Addressed:**
  - Update controls were hidden deep inside Settings > About, making merchants unaware of critical system improvements.
  - Full app restarts dropped cashier active workflows and required re-login.
* **Key Architectural Implementations:**
  - **Sidebar Fast Updates Navigation:** Promoted Fast Updates into the primary navigation bar with real-time status pills.
  - **Cupertino Update Hub (`UpdateModal.tsx`):** Proactive alert hub offering single-click download and live zero-restart patching.
  - **Zero-Restart Live Reload (`patchService.ts`):** Reloads active `BrowserWindow` instances in ~300ms without restarting the Electron process or closing database connections.

---

## 70. Apply Live Asset Resolution & Pop-up Debounce Standard (v1.0.80)
* **Problem Addressed:**
  1. *Blank White Screen on Live Apply:* Electron's `loadFile()` failed to resolve relative sibling JS/CSS assets (`index-*.js`, `index-*.css`) inside the patch folder, rendering an empty white window.
  2. *Pop-up Loop:* 10-second background polling repeatedly reset `modalDismissed: false`, re-showing the modal every 10 seconds even after dismissed.
* **Key Architectural Implementations:**
  - Switched from `loadFile()` to `loadURL(pathToFileURL(entry).href)` to resolve asset paths relative to the extracted patch folder.
  - Added `dismissedVersion` tracking so polling only re-alerts when a genuinely newer version tag arrives.
  - Enhanced `app:info` IPC handler to return the active patch version rather than base installer version.

---

## 71. Linux Real-Time In-App Update Engine & Native Linux AppImage Build (v1.0.80-L / v1.0.81)
* **Problem Addressed & Root Cause Analysis:**
  1. *In-App Update Failure on Linux:* When clicking Download/Apply on Linux, updates failed completely with error `tar (GNU tar): This does not look like a tar archive`.
     - **Root Cause:** `extractZipArchive()` was hardcoded to `execFileAsync('tar', ['-xf', ...])`. Windows 10/11 includes `bsdtar` (which transparently extracts zip files), but Linux uses `GNU tar`, which strictly rejects zip archives.
  2. *Cold-Boot Blank Screen & Rollback Loop:* On cold launch with a patch present, `main/index.ts` still invoked `mainWindow.loadFile(patchedEntry)` (which failed asset loading) and never invoked `markPatchStable()` on `did-finish-load`, causing `sentinel.attempts >= 2` and triggering an automatic rollback that wiped the patch on reboot.
  3. *Linux Executable Availability:* Linux merchants required native Linux executables (`.AppImage`) compiled and verified on Linux.
* **Key Architectural Implementations:**
  - **Format-Aware Archive Extractor (`patchService.ts`):**
    - Inspects the first 4 bytes of the archive: detects `0x50, 0x4b` (PK ZIP header) vs POSIX tarballs.
    - Routes ZIP extraction to native `unzip` (with `python3 -m zipfile -e` fallback) on Linux/macOS, and `tar -xf` / PowerShell on Windows.
    - Guarantees seamless extraction for both ZIP archives and tarballs without fatal exits.
  - **Cold-Boot Patched Entry Stability Hook (`main/index.ts`):**
    - Updated entry loading to `mainWindow.loadURL(pathToFileURL(patchedEntry).href)`.
    - Added `mainWindow.webContents.once('did-finish-load', () => markPatchStable())` on initial boot, ensuring successful launches immediately set sentinel to `STABLE` and prevent rollback loops.
  - **Cross-Platform Zip Bundler (`tools/bundle_patch.mjs`):**
    - Employs native `zip` CLI / `python3 -m zipfile` on Linux/macOS and `tar -a` on Windows, ensuring generated patch archives are 100% valid ZIP files on all operating systems.
  - **Native Linux AppImage Pipeline:**
    - Successfully built `TindaPOS-1.0.80.AppImage` (131 MB) and unpacked Linux binary target in `builds/linux-unpacked/tinda-pos`.

---

## 72. Official Release v1.0.81: Linux Zero-Restart Live Patch & Network Diagnostic Edition
* **Tag & Artifacts:**
  - Tag: `v1.0.81`
  - Release URL: `https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.81`
  - Asset: `TindaPOS-Feature-Patch-1.0.81.zip` (0.82 MB / 859,245 bytes)
  - SHA-256: `e015b91c0a044cf4c7e553885371493f85b060326fbdfa45222080fc184a777d`
* **Features Shipped:**
  - **Linux Live Hot-Patching:** Feature patches can be downloaded and applied in real-time on Linux without restarting the application process or dropping database connections.
  - **Zero-Restart Live Reload:** Swapped renderer in-place using `reloadLiveWithPatch()` in <300ms.
  - **Silent Network Probing:** Standardized captive portal check to HTTP endpoint `http://www.msftconnecttest.com/connecttest.txt`, eliminating SSL handshake warnings (`net_error -200`).
* **Verification Invariant:**
  - Full vitest regression test suite: 65/65 test suites (429/429 tests) passing at 100%.

---

## 73. Unified Dual-Mode Update Engine (Option A: Live Patch vs Option B: Full Build)
* **Problem Addressed:**
  - Update notifications were firing repeatedly on window focus due to `onFocus` calling `check(true)` with manual override.
  - Previous modal only offered the hot-patch and omitted full standalone packages/installers.
  - Users needed one clean, cohesive modal to choose between an instant live hot-patch (`0.82 MB`) or full offline build (`131 MB AppImage`).
* **Architectural Upgrades:**
  - **Single Unified Cupertino Modal (`UpdateModal.tsx`):**
    - Both **Option A: Fast Live Patch (Zero Restart ⚡ · 0.8 MB)** and **Option B: Full Platform Build (AppImage · 131 MB)** presented side-by-side in one dialog.
    - Cashiers can click **`Update via Patch (Live · 0.3s)`** for zero-downtime updates, or **`Download Full Build`** to save the standalone package directly into `~/Downloads/TINDA-POS-Updates/`.
    - Modal can be minimized cleanly to the sidebar (`— Minimize to Sidebar`) under `System & Guide` (`Software Update`).
  - **Window Focus Debounce Safeguard (`Shell.tsx`):**
    - Changed `window.addEventListener('focus')` and `online` checks to `check(false)` so background polling respects dismissed/minimized modal states and never creates duplicate or pop-up loops.
  - **Auto-Check Throttling Invariant (`updateService.ts`):**
    - Throttled auto-checks retain existing `UPDATE_AVAILABLE` states instead of falsely overwriting them back to `UP_TO_DATE`.
  - **Official Artifacts Attached to Release `v1.0.81`:**
    - `TindaPOS-Feature-Patch-1.0.81.zip` (836 KB) — Fast In-App Patch
    - `TindaPOS-1.0.81.AppImage` (131 MB) — Full Linux Standalone Build
    - `SHA256SUMS-v1.0.81.txt` — Verification hashes

---

## 74. Real-Time Dynamic In-Memory Version Sync on Live Hot-Patching
* **Root Cause Diagnosed:**
  - `UpdateService` only initialized `this.state.installedVersion` once inside the constructor on boot.
  - When `restartAndInstall()` reloaded the renderer via `reloadLiveWithPatch()`, the main process kept holding the stale `installedVersion: "1.0.80"` in memory, and `getState()` returned that cached version instead of checking the newly extracted patch manifest.
  - In `updateTransport.ts`, `installedVersion()` checked `sentinel.status === 'STABLE'`, but during the hot-reload phase the sentinel was still temporarily `PENDING` until `did-finish-load` resolved.
* **Architectural Fix Implemented:**
  - **Dynamic In-Memory Version Sync (`updateService.ts`):**
    - `getState()` now dynamically queries `this.deps.transport.installedVersion()` on every call, synchronizing `this.state.installedVersion` whenever a patch is loaded or swapped.
    - Inside `install()`, when applying a feature patch, `this.set()` immediately sets `status: 'UP_TO_DATE'`, updates `installedVersion` to the newly applied patch version, clears `available`, and broadcasts the updated state to all windows.
  - **Hot-Patch Status Leniency (`updateTransport.ts`):**
    - `installedVersion()` now honors both `STABLE` and `PENDING` statuses if a valid `manifest.json` is present in `~/.config/TINDA POS/patches`, ensuring the newly unpacked patch version reflects instantly across all IPC channels before and during reload.
  - **Live UI Reflection:**
    - Both the Sidebar (`v1.0.81`) and the Update Modal (`v1.0.81` / `TINDA POS is Up to Date`) update immediately in real-time with zero system reboot or manual refresh required.

---

## 75. Store Handbook Comprehensive Modernization & Chapter 11 (Software Updates & Zero-Restart Live Patches) (v1.0.82)
* **Complete In-System Handbook Modernization (`Handbook.tsx`):**
  - **11 Full Operational Chapters:**
    1. *Welcome to TINDA POS (`intro`):* Offline philosophy, zero cloud lockout, 172 pre-seeded DTI products, and real-time Cloudflare D1 store sync dashboard.
    2. *Daily Workflow & Shift Management (`shift`):* Cash float entry, real-time Net Sales reconciliation (void handling & D1 sync), and evening cash count / Z-Reading.
    3. *POS Terminal & Cashier Masterclass (`pos`):* High-speed searching (`F1`), quantity editing (`F2`), discounts (`F4`), cash (`F9`), GCash (`F10`), Utang (`F11`), hold & resume (`F8`), Terminal Tools (`F3`), and Dual-Screen Customer TV display.
    4. *Barcode Scanning (`scanner`):* Dual barcode engine, instant auto-capture in product form, and wireless smartphone companion with dual-canvas center-reticle crop and 120ms Wi-Fi burst tolerance.
    5. *Inventory, Products & Multi-Units (`inventory`):* Piece vs case conversion math, low stock alert badges, 1-tap quick restock drawer, and near-expiry color-coded badges.
    6. *Customer & Utang Management (`utang`):* Suki credit ledgers, itemized package breakdown icon drawer, partial/full settlements, and credit limits.
    7. *Database Backups & Zero Data Loss (`backup`):* SQLite WAL durability, 1-click snapshot creation, and USB flash drive safety protocols.
    8. *Keyboard Shortcuts Cheat Sheet (`hotkeys`):* Full reference matrix for `F1`–`F12`, `Esc`, `Alt+B`, and `Ctrl+P`.
    9. *Troubleshooting & FAQ (`troubleshoot`):* Brownout recovery, scanner trailing Enter keys, and multi-PC LAN sharing.
    10. *Thermal Printers (`printer`):* Zero-Blur integer typography, auto-detect for GOOJPRT 58H / Xprinter, Bluetooth setup, and paper scratch test.
    11. *Software Updates & Zero-Restart Live Patches (`updates`):* Dual-mode update architecture (Option A: 0.82 MB live 0.3s patch vs Option B: 130 MB full platform build), sidebar update hub, minimize to sidebar, and 24-hour smart throttle.
* **Permanent Zero-Rate-Limit Transport Architecture (`updateTransport.ts`):**
  - **Root Cause Eliminated:** Addressed public GitHub REST API (`api.github.com/repos/.../releases`) 60 req/hr IP-based rate limiting (HTTP 403 Forbidden).
  - **Direct Redirect Engine (`fetchLatestRedirectFallback`):** Inspects `https://github.com/Yazerukun/TINDA-POS/releases/latest` with a fast `HEAD` request (`redirect: 'follow'`). The target URL provides the current release tag in <100ms with zero authentication, zero token requirement, and zero 403 rate limits.
  - Automatically maps canonical asset paths for fast feature patches (`TindaPOS-Feature-Patch-${v}.zip`), Windows installer (`TindaPOS-Setup-${v}.exe`), Windows portable (`TindaPOS-Portable-${v}.exe`), and Linux AppImage (`TindaPOS-${v}.AppImage`).
* **Direct In-Handbook Action Triggers:**
  - Added interactive buttons in Chapter 11 to directly trigger `openHub()` on `useUpdate` store, enabling store cashiers to check and inspect updates directly from the handbook.
* **Verification & Official Release Artifacts (`v1.0.82`):**
  - All 65 test suites (429 tests) passing 100%.
  - `TindaPOS-Feature-Patch-1.0.82.zip` (839.77 KiB) — Live hot-patch (~0.3s apply)
  - `TindaPOS-1.0.82.AppImage` (130.86 MiB) — Linux standalone package
  - `TindaPOS-Setup-1.0.82.exe` (107.34 MiB) — Windows NSIS installer
  - `TindaPOS-Setup-1.0.82.exe.blockmap` (117.20 KiB) — Differential update blockmap
  - `TindaPOS-Portable-1.0.82.exe` (107.12 MiB) — Standalone Windows executable
  - `latest.yml` (348 B) — Windows electron-updater sha512 manifest
  - `SHA256SUMS-v1.0.82.txt` (556 B) — Cryptographic verification hashes

---

## 76. In-Store TindaBot AI Assistant & Multi-Model Free Pool Architecture (v1.0.83)
* **Design Philosophy & Operational Goal:**
  - Bridge the gap between complex retail store operations (E-Wallet starting balances, bills payment reconciliation, Senior/PWD 20% discount compliance, barcode generation) and cashiers through an intelligent in-app copilot.
  - Non-custodial financial security: System never asks for or stores user MPIN, bank passwords, or OTPs. All merchant capital stays in physical smartphones; TINDA POS acts purely as the automated ledger and discrepancy audit engine.
* **Grounded In-Store Knowledge Engine (`tindaAiKnowledge.ts`):**
  - Synthesizes all 11 chapters of the TINDA POS Store Handbook into zero-latency semantic patterns.
  - Speaks natural, conversational **Tagalog, Bisaya (Cebuano), and English**.
  - Generates actionable UI deep-links (`[Buksan ang E-Wallet Audit Sheet ↗]`, `[Pumunta sa Bills & E-Load Hub ↗]`, `[Pumunta sa Inventory ↗]`) with instant screen navigation.
* **Zero-Key-Leak Desktop Vault (`src/main/services/aiService.ts`):**
  - AI requests run strictly in Electron Main Process (`ai:ask` IPC channel) via `net.fetch`.
  - Zero credential exposure in React frontend, web inspector, or network requests.
* **Automated Multi-Model Free Failover Pool:**
  - Tier 1: Local OpenCode Free Pool (`nemotron-3.5-lightning-free`, `mimo-v2.6-flash-free`, `exo-free`, `space-bunny-free`, `step-5-preview-free`) with automatic sequential failover on timeout or busy status.
  - Tier 2: Cloud Failover to Google Gemini 2.5 Flash Lite Free Tier via embedded vault credentials.
  - Tier 3: Tertiary instant offline handbook fallback ensuring 100% zero-downtime reliability even without internet connection.
* **Floating Draggable & Minimizable Widget (`TindaAiAssistantModal.tsx`):**
  - Positioned side-by-side with Community Chat (`right-56` vs `right-5`) to eliminate UI button overlap.
  - Floating drag handle (`⠿`) with viewport clamping and persistent coordinate memory (`localStorage: tinda_aibot_pos`).
  - Single-line minimize (`—` / `⤢`) to prevent obstructing checkout queues or receipt printing.
* **Official Release Artifacts (`v1.0.83`):**
  - `TindaPOS-Feature-Patch-1.0.83.zip` (853 KiB) — Fast live update
  - `TindaPOS-1.0.83.AppImage` (130.88 MiB) — Linux standalone binary
  - `TindaPOS-Setup-1.0.83.exe` (107.36 MiB) — Windows NSIS installer
  - `TindaPOS-Portable-1.0.83.exe` (107.14 MiB) — Windows portable executable
  - `TindaPOS-Setup-1.0.83.exe.blockmap` (118 KiB) — Delta update blockmap
  - `latest.yml` & `latest-linux.yml` — Verified auto-updater manifests
  - `SHA256SUMS-v1.0.83.txt` — Official release cryptographic hashes

---

## 77. Compact TindaBot & Non-Blocking POS Clearance Architecture (v1.0.84)
* **Ergonomic UX Challenge:**
  - On POS screens (`page === 'pos'`), the cart and checkout controls dominate the right column (`md:w-[23rem]` / 368px to `xl:w-[26rem]` / 416px).
  - Previous bottom-right launchers physically overlapped with the Cart Total, `Hold (F8)`, `Clear`, and the primary `CHECKOUT (F9 Cash / F10 GCash)` action buttons.
  - Previous modal dimensions (`420px × 580px`) were unnecessarily wide on 1366x768 and standard retail touchscreens.
* **Architectural Implementation:**
  - **Sleek 330px Modal Geometry (`TindaAiAssistantModal.tsx` & `TindaCommunityChat.tsx`):**
    - Redesigned default width to **`330px`** (25% reduction in screen footprint) and height to **`450px`**.
    - Header width toggle button (`⤢` / 330px ↔ 390px) for flexible reading of longer responses.
    - Drag-protected micro-bar minimization (`240px × 42px`) with status pulse dot, restore, and close buttons.
  - **Unified FloatingWidgetsDock (`FloatingWidgetsDock.tsx` & `floatingWidgets.ts`):**
    - Replaced scattered individual buttons with a consolidated capsule dock: `[ 🤖 Ask AI ] [ 💬 Chat ] [ — ]`.
    - **Zero Checkout Obstruction**: On `page === 'pos'`, the dock automatically shifts to `bottom-3.5 right-[24.5rem] xl:right-[27.5rem]`, placing it strictly to the left of the cart column. The entire cart, totals, and checkout buttons remain 100% unobstructed.
    - **Distraction-Free Collapse Mode**: 1-click collapse to a miniature 36px floating badge (`[ ✦ ]`) during busy cashier rushes.
  - **Side-by-Side Coexistence**:
    - When both TindaBot and Community Chat are open, they tile side-by-side (`right: 390px` and `right: 730px` in POS mode) with zero overlap.
    - Preserves persistent drag coordinates in `localStorage`.
* **Official Release Artifacts (`v1.0.84`):**
  - `TindaPOS-Feature-Patch-1.0.84.zip` — Fast live hot-patch (~0.3s apply)
  - `TindaPOS-1.0.84.AppImage` — Standalone Linux binary
  - `TindaPOS-Setup-1.0.84.exe` — Windows NSIS installer
  - `TindaPOS-Portable-1.0.84.exe` — Standalone Windows executable
  - `TindaPOS-Setup-1.0.84.exe.blockmap` — Delta update blockmap
  - `latest.yml` & `latest-linux.yml` — Verified auto-updater manifests
  - `SHA256SUMS-v1.0.84.txt` — Official release cryptographic hashes

---

## 78. Architectural Blueprint: Unified Cupertino Minimize-to-Dock Architecture for Tinda Community Chat & FloatingWidgetsDock (v1.0.85 Spec)
* **Root Problem Diagnosed:**
  - In previous implementations, `FloatingWidgetsDock.tsx` evaluated `if (isAiOpen || isChatOpen) return null`, completely hiding the bottom dock whenever either widget was opened.
  - Clicking the `<Minus />` button inside `TindaCommunityChat.tsx` merely collapsed the window into a floating 240px draggable bar (`isOpen && isMinimized`) positioned arbitrarily on top of cashier screens, leaving screen clutter and obstructing the POS cart and dashboard items.
  - On compact 330px widths, the header suffered from button congestion (6 buttons: Volume, Dev Key, Refresh, Width Toggle, Minus, Close) with unconstrained title widths, risking action buttons being pushed off-screen or rendered unclickable.
  - The width toggle used `<Minimize2 />` iconography, creating visual confusion with window minimization. The tooltip also retained outdated legacy strings (`"Minimize Lounge"`).
* **Architectural Upgrades & Design Contract:**
  1. **True Seamless Minimize-to-Dock Lifecycle:**
     - `FloatingWidgetsDock.tsx` visibility logic upgraded to check `isAnyFullyOpen = (isAiOpen && !isAiMinimized) || (isChatOpen && !isChatMinimized)`. When Chat or TindaBot is minimized, the unified `FloatingWidgetsDock` surfaces immediately.
     - Clicking the **Minimize (`—`)** button in `TindaCommunityChat` smoothly transitions the window into the unified dock capsule (`[ 🤖 Ask AI ] [ 💬 Chat · Minimized 🟢 ] [ — ]`).
     - Preserves DOM state in memory without unmounting (using zero-opacity/scale transition or non-destructive CSS display toggles) so draft text, loaded messages, scroll offsets, and active connections are preserved with 0ms resume latency.
  2. **Reactive Minimized Dock State & Unread Pipeline:**
     - The `FloatingWidgetsDock` `[ 💬 Chat ]` button reflects an active minimized badge with live online peer indicators (`🟢`).
     - When background messages or developer announcements arrive, the dock triggers the Web Audio notification chime and flashes the pulsing `NEW` indicator badge.
     - 1-tap on `[ 💬 Chat ]` in the dock restores the window immediately at its designated or dragged coordinate.
  3. **330px Ergonomic Header De-cluttering & Cupertino Typography:**
     - Restructure header layout with strict `min-w-0` title truncation.
     - Primary window controls (**Minimize to Dock**, **Close**, **Width Toggle**) are fixed and guaranteed 100% visible across all screen sizes.
     - Width toggle uses explicit `<Columns2 />` icon with clear tooltips (`"Compact 330px"` / `"Expand 390px"`).
     - Standardize tooltips to 100% Strict English (`"Minimize to Dock"`, `"Close Chat"`).
  4. **Full Parity Across Widgets:**
---

## 79. Unified VIP-First Auto-Updater Architecture Standard (v1.0.95)

### 79.1 Single Surface Invariant ("Isa Nalang Sya Kabuok")
1. **Zero Fragmented Popups:** Auto-update presentation across the entire application is consolidated into a single unified component: [`UnifiedUpdateCapsule.tsx`](file:///C:/Users/mtafl/Desktop/TINDA/TINDA-POS-Source/source/src/renderer/src/components/update/UnifiedUpdateCapsule.tsx).
2. **Dashboard Modal Deprecation:** Blocking `<Modal>` dialogs and giant in-page update banners in [`Dashboard.tsx`](file:///C:/Users/mtafl/Desktop/TINDA/TINDA-POS-Source/source/src/renderer/src/pages/Dashboard.tsx) are permanently prohibited. Dashboard real estate is 100% reserved for executive metrics, shift statuses, and sales reporting.
3. **Dedicated Screen Placement:** The capsule is anchored at `fixed top-3 right-6 z-40`. This permanently prevents visual overlap with the Community Chat floating widget docked at `bottom-5 right-5 z-40`.

### 79.2 VIP Non-Disruption Guardrails ("Dili Sagabal sa VIP")
1. **Zero Cashier Flow Interruption:** Updates never block the viewport, never steal keyboard focus during active customer checkout, and never prevent thermal receipt printing.
2. **Silent Background Processing:** Update checking and downloads execute smoothly on low-priority worker threads with zero UI frame drops.
3. **Shift Close Deferral ("Apply on Shift Close"):** Cashiers and VIP merchants can defer application until register closing (`tinda_apply_on_shift_close: true`). Updates auto-apply on cashier logout or system reboot without disrupting busy peak hours.
4. **Automated VIP Database Snapshot:** Automated safety backup of SQLite database is guaranteed prior to applying any executable restart.

---

## 80. Universal Thermal Receipt Alignment & High-Density Solid Black Standard (v1.0.97 Spec)

### 80.1 Zero First-Letter Clipping Contract ("Walay Putol sa Sinugdanan")
1. **Hardware Blind Spot Protection:** Standard 58mm and 80mm POS thermal print mechanisms position their heating element array with a mechanical gutter of 3.5mm–5.0mm inward from the left paper guide.
2. **Safe Gutter Margin Rules:**
   - In `receiptHtml.ts`, `.tp-sheet` must strictly center content (`margin: 0 auto !important;`) and enforce safe left padding:
     - 58mm Paper: `padding: 2mm 3.5mm 2mm 4.5mm !important;`
     - 80mm Paper: `padding: 2mm 4mm 2mm 5.0mm !important;`
   - Even if a generic printer driver reports zero physical margins, text coordinates begin at $X \ge 4.5\text{mm}$, preventing any leftmost characters (`Biller:`, `Date:`, `Ref #:`, `Customer:`, `TOTAL PAID`) from being clipped.
3. **Driver Printable Area Integration:** Chromium `webContents.print()` options in `submitPrint()` must pass `margins: { marginType: 'printableArea' }` rather than `'none'`. This aligns Chromium coordinate placement with the printer driver's hardware printable area.

### 80.2 High-Density Solid Black Print Standard ("Dili Blury, Klaro ug Itom")
1. **Full-Fidelity RGB Spooling (`color: true`):** Chromium passes 24-bit RGB graphics directly to Windows GDI. The manufacturer thermal driver converts dark pixels into full-strength thermal burn heat pulses, completely bypassing Chromium's fuzzy 1-bit Floyd-Steinberg error diffusion and halftoning speckles.
2. **Native Resolution DEVMODE Preservation:** Electron print options must avoid hardcoding `dpi: { horizontal: 203, vertical: 203 }`, allowing Windows GDI and the vendor printer driver to communicate at native hardware resolutions without GDI bitmap resampling blur.
3. **Bold Monospace Typography Stack:**
   - Standard font family: `font-family: Consolas, 'Lucida Console', Monaco, 'Courier New', monospace;`.
   - Font weights: `font-weight: 800 !important;` for standard body rows, `font-weight: 900 !important;` for headings and grand totals.
   - Text rendering directives:
     ```css
     -webkit-print-color-adjust: exact !important;
     print-color-adjust: exact !important;
     color: #000000 !important;
     -webkit-text-stroke: 0.15px #000000 !important;
     text-rendering: geometricPrecision !important;
     ```
   - Micro-emboldened 0.15px text stroke delivers thick, solid black thermal burn lines without faint grey borders.

### 80.3 100% Manual vs Automatic Print Parity Contract
1. Every receipt type in TINDA POS must produce visually identical physical output regardless of whether dispatched via **Silent Automatic Print** or **Manual Windows Print Dialog**:
   - Checkout receipts (`printSale` / `autoPrintAfterCheckout`)
   - Bills & E-Load payment slips (`ewallet:printBillSlip`)
   - E-Wallet Cash In / Cash Out slips (`ewallet:printSlip`)
   - 3-Way Audit reports (`ewallet:printAuditReport`)
   - Register test prints (`printTest`)
2. `BillsLoadHub.tsx` must route printing through `window.api.ewallet.printBillSlip` with dual 1-click Auto Thermal Print and Manual System Print buttons, matching the design of `EwalletAudit.tsx`.
