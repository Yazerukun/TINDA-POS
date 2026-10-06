# TINDA POS Desktop (Master Edition)

## Project Overview
Official Desktop POS Application for TINDA POS built with Electron + React + TypeScript + SQLite.
Features 100% offline-first reliability, weighable decimal quantity checkout, live inventory sync, hardware barcode scanner engine, VIP E-Wallet reconciliation hub, multi-PC LAN hub, and Executive Cloud Dashboard bridge.

## Operating Rules & Automation Standard
- Persona: **Fixer Agent**
- Mode: **FULL YOLO MODE** (Proactive, autonomous execution of commands, edits, refactoring, and fixes without waiting for manual confirmation)
- Execution: **100% AUTOMATIC POWERHOUSE**:
  1. **apple-design**: Fluid animations, natural springs, translucent Cupertino materials, and clean hierarchy.
  2. **ponytail**: The lazy senior dev — shortest diff, YAGNI, standard library first, root-cause bugfixes.
  3. **caveman**: Terse high-density voice — zero conversational fluff, answer-first, exact code payload.
  4. **smart-ralph**: Spec-driven multi-step execution with 4-phase quality gates.
  5. **headroom**: Automatic context window and token optimization.
  6. **agentmemory**: Continuous learning engine with persistent recall and auto-save of bugfix lessons and release milestones.
  7. **agency-agents**: 14 active curated specialist skills in `.agents/skills/` (Desktop App Engineer, DB Optimizer, Reality Checker, Code Reviewer, etc.) with on-demand sync from `D:\agency-agents`.
  8. **brigade-tideline**: Brigade v1.39.0 long-term memory MCP server running locally (`tools/brigade_mcp_server.mjs`) with hybrid BM25 + HRR vector recall.
  9. **strict-english-standard**: 100% Professional English across all user-facing UI, modals, settings, guides, handbooks, camera pairings, thermal receipts, and tickets. No Bisaya/Filipino words in client-facing elements.

## Release & Repository Status
- Workspace Directory: `D:\TINDA-POS-Desktop\`
- Source Directory: `D:\TINDA-POS-Desktop\source\`
- Git Remote: `https://github.com/Yazerukun/TINDA-POS-Source.git`
- Releases & Updater Repo: `https://github.com/Yazerukun/TINDA-POS.git`
- Cloud Owner Dashboard: `https://tinda-owner-dashboard.pages.dev/`
- Current Version: **v1.0.64 (VIP Custom Logo & Universal Discount Edition)**

## Key Features in v1.0.64 (VIP Custom Logo & Universal Discount Edition)
1. **VIP Pro Custom Brand Identity & Store Logo Upload**:
   - Merchants with active VIP Pro licenses can upload their custom business logo (PNG, JPG, SVG, WebP up to 2MB) stored locally in app settings.
   - AppLogo component seamlessly renders their custom store logo encased in Apple-grade Cupertino squircle materials, with live fallback to Quantum Mark.
   - Non-VIP users are cleanly prompted with a VIP Pro upgrade gate in Settings -> Store Profile.
2. **Universal Custom Cart Discount Engine (% & ₱)**:
   - Cashiers can apply flexible discounts directly from checkout: Statutory Senior Citizen / PWD 20% discount or custom percentage (5%, 10%, 15%, 20%, 50%, or custom %) or exact peso deduction (₱).
   - Real-time subtotal calculation and clear display on both POS cart and thermal printed receipts.
3. **100% Professional English System-Wide Localization**:
   - Replaced all legacy Bisaya/Filipino text across receipt tickets (`Thank you for your purchase!`, `Change`), Handbook Chapter 10, printer troubleshooting guides, and camera companion pairing instructions with professional English.
4. **POS Register Header Clutter Elimination**:
   - Removed Terminal Tools button from POS register header for maximum product catalog visibility, while keeping global hotkey `F3` and permanent Cupertino pill button in the Sidebar footer.
5. **Live Sales Monitor & Owner Dashboard 100% Metric Synchronization**:
   - Re-aligned `app:salesMonitorSummary` to query refunds and calculate Net Realized Sales (`cash + gcash + maya - refunds`), matching Dashboard exactly and excluding uncollected customer credit (Utang).
6. **100% Automated Test Gate Passed**:
   - Verified 414/414 unit tests across 63 test suites with 0 TypeScript compilation errors.

## Key Features in v1.0.63 (Zero-Click Auto-Detect Thermal Printer Edition)
1. **Zero-Click Thermal Printer Auto-Detection & Self-Configuration**:
   - Resolved the root cause where newly plugged-in thermal printers (e.g., GOOJPRT PB-58H, POS-58, JK-5802H, Xprinter) failed to print receipts because the user had not manually configured the printer in Settings.
   - Built the `autoDetectThermalPrinter` engine in `printer.ts` and `printing.ts` that automatically scans connected USB/Bluetooth printers via `webContents.getPrintersAsync()`, matches thermal receipt device signatures (`/pos-?58|pos-?80|58mm|80mm|thermal|receipt|goojprt|xprinter|jk|zj|xp|rp/i`), and dynamically binds print jobs on the fly.
   - Instant plug-and-play operation: merchants can plug in their thermal printer, ring up a sale, and receipts immediately print with zero settings configuration.
2. **Automatic Paper Width Inference (58mm vs 80mm)**:
   - Automatically detects 58mm printer models (`pb-58`, `jk-58`, `pos-58`, `xp-58`, `58mm`) and applies exact 58mm micron dimensions (`58000, 297000`) and typography scaling without manual selection.
3. **Hardware Hub & Terminal Tools [F3] Auto-Detect Status**:
   - `PosToolsModal` now dynamically displays **Auto-Detect Ready** when a thermal printer is present, allowing cashiers to trigger 1-tap test prints directly from the cashier register screen.
4. **100% Automated Test Gate Passed**:
   - Verified 414/414 unit tests and 0 TypeScript errors.

## Key Features in v1.0.62 (Ultra-Modern Quantum Mark & GOOJPRT Hardware Fix)
1. **Ultra-Modern Quantum Mark (Apple-Grade Cupertino Diamond-T)**:
   - Upgraded `AppLogo.tsx` to a hyper-modern, clean Apple-grade geometric vector brand identity with Cupertino squircle chassis, optical light spine ray, and balanced summation ($\Sigma$) winglets.
   - Scalable from 16px micro-icon to 512px retina displays with radiant Emerald-Cyan laser gradients and VIP Pro Gold radiance.
2. **GOOJPRT PB-58H Zero-Margin Thermal Spooling & Blank Print Fix**:
   - Fixed the silent printing race condition in `printing.ts` where Chromium destroyed the hidden print window before the Windows Print Spooler completed reading the buffer.
   - Injected explicit custom page dimensions in microns (`width: 58000, height: 297000`), zero-margin `@page` and `@media print` CSS overrides, and 10mm feed clearance to ensure continuous physical paper feed.
   - Added in-depth guidance for thermal roll orientation (scratch test), USB virtual port mapping (`USB001`), and self-test verification in `Handbook.tsx` Chapter 10 and `Settings.tsx`.
3. **Sidebar-Organized Terminal Tools [F3] Hub**:
   - Organized the Sidebar footer with a prominent Cupertino pill button for **Terminal Tools [F3]**, complete with hotkey badge and smooth hover micro-interactions.
   - Added a 1-tap **Thermal Print** test button right inside the `PosToolsModal` hardware status strip for instant diagnostics without leaving the cashier screen.
4. **100% Automated Test Gate Passed**:
   - Verified 411/411 unit tests and 0 TypeScript errors.

## Key Features in v1.0.61 (Mathematical Mass Mark & GOOJPRT Thermal Support)
1. **Mathematical Mass Brand Mark (The Quantum Summation T)**:
   - Designed a high-precision, geometric vector brand identity (`AppLogo.tsx`) featuring an isometric hexagonal mass bounding volume, Golden Ratio ($\Phi = 1.618$) ray alignment, and a stylized mathematical summation ($\Sigma$) apex fused with the letter "T".
   - Integrated into the Sidebar brand header, Hardware Hub, and Terminal Tools modal with active hardware pulse indicators and VIP Pro gold gradients.
2. **GOOJPRT PB-58H (USB + Bluetooth) Desktop Thermal Printer Support**:
   - Integrated full hardware optimization and documentation for 58mm retail thermal printers (GOOJPRT PB-58H / JK-5802H / POS-58 / Xprinter).
   - Added in-app setup tips in `Settings` -> `Receipt` and published official **Chapter 10: Thermal Printers** in the offline `Handbook.tsx`.
3. **Terminal Tools [F3] Consolidated Hardware Workspace**:
   - Consolidated 10 cluttered header buttons into a single Cupertino glass pill `Terminal Tools [F3]` in the header and a permanent sidebar footer button.
4. **Line Item Custom Unit Price Editing**:
   - Direct in-cart unit selling price override for cashiers/managers with clean professional labels ("Edit Unit Price").
5. **Intelligent Wireless Phone Scanner Engine & Multi-Adapter Discovery**:
   - Traced and resolved network adapter order failures by auto-filtering virtual/APIPA interfaces (`169.254.*`), adding active Wi-Fi adapter dropdown switching, and providing a 1-tap Direct Snap (HTTP) fallback to bypass mobile browser SSL warnings.

## Key Features in v1.0.60 (VIP Client Feedback & 10 Core Enhancements)
1. **VIP Client Full Scrolling & Infinite Inventory Feed (Client Feedback Addressed)**:
   - **Root Cause Fixed**: Eliminated the hardcoded `limit: 60` query restriction and outer height trapping in `Shell.tsx`.
   - **Continuous Infinite Pagination**: Implemented paginated auto-loading with `PAGE_SIZE = 120`, scroll-boundary listeners, `pb-28` bottom clearing, and `hasMore` tracking across both high-density table and grid views. Large catalogs (500-10,000+ items) now scroll completely and fluidly without clipping.
2. **Terminal Tools [F3] & Clean POS Workspace (Client Feedback Addressed)**:
   - **Clutter Elimination**: Replaced the 10 crowded top-bar buttons (`Scanner Ready`, `Counter Camera`, `Pair Phone`, `Customer Screen`, `Sales Monitor`, `Petty Cash`, `E-Wallet`, `Sound On`, `Z-Reading`, `Guide`) with a single Cupertino glass pill **Terminal Tools [F3]** in the POS header and a permanent **Tools** button in the sidebar footer.
   - **Centralized Hardware & Operations Modal**: Consolidates 1-tap toggles for barcode scanner, webcam, companion phone pairing, secondary customer display (CFD), sales monitor, shift cash in/out (`F7`/`F8`), thermal Z-Reading, sound toggle, and cashier shortcut guide.
3. **Line Item Custom Unit Price Editing (Client Feedback Addressed)**:
   - **Cashier & Manager In-Cart Price Override**: Cashiers can directly edit the unit selling price of any item currently in the cart with 1-click on the unit price tag or pencil icon.
   - **Clean Terminology**: Replaced informal "Tawad / Custom price" labeling with professional **"Edit Unit Price"** and **"Custom Unit Price"** modal dialog with live subtotal calculation.
4. **Intelligent Wireless Phone Scanner Engine & Multi-Adapter Discovery (Client Feedback Addressed)**:
   - **Root Cause Fixed**: Traced and fixed pairing failures caused by arbitrary `os.networkInterfaces()` order picking inactive virtual adapters (Bluetooth PAN, WSL, Docker, VMware) or link-local APIPA addresses (`169.254.x.x`).
   - **Smart Prioritized IP Selection**: Automatically excludes `169.254.*` and virtual adapters, prioritizing real Wi-Fi/Ethernet physical interfaces and standard private LAN subnets (`192.168.*`, `10.*`, `172.16-31.*`).
   - **Multi-Adapter Network Dropdown**: When a PC has multiple active networks (e.g., wired Ethernet + store Wi-Fi), the companion QR screen provides an instant dropdown selector to switch the generated pairing link to the Wi-Fi subnet reachable by phones.
   - **Instant Direct Snap (HTTP) Fallback**: Prominent 1-tap fallback that opens immediately in all mobile browsers (iOS Safari & Android Chrome) with 100% zero SSL certificate warnings.
5. **Quick Cash Denomination & Increment Chips**:
   - 1-Tap quick change buttons in Checkout Modal: `Exact (₱...)`, `₱20`, `₱50`, `₱100`, `₱200`, `₱500`, `₱1,000`, and instant increment chips `+₱20`, `+₱50`, `+₱100`.
6. **Web Audio API Hardware Synthesizer**:
   - Zero-asset, 100% offline audio engine with crisp high-pitched barcode scan confirmations (1300Hz-1750Hz sine), out-of-stock/error buzzers (280Hz sawtooth), cash register chime (C6-C7 arpeggio), and 1-tap header mute/unmute toggle.
7. **Multiplier Scan & Rapid Entry Engine**:
   - Cashiers can scan or enter `5*BARCODE` or `10*PRODUCT` to instantly add bulk quantities without tapping the plus button multiple times.
8. **Senior Citizen & PWD 20% Statutory Discount System**:
   - One-click modal calculation of 20% discount on cart subtotal with OSCA / PWD booklet and ID tracking.
9. **1-Click Thermal Z-Reading / Daily Cash Balancing Print**:
   - Quick header Z-Reading button directly prints daily sales and shift balancing reports to ESC/POS thermal printers.
10. **Automated 7-Day Rolling Daily SQLite Safety Snapshot & Live Inventory HUD Badges**:
    - Daily database backups are maintained on a 7-day rolling window with automatic pruning of older snapshots to optimize store storage. Real-time header badges for Low-Stock and Near-Expiry items with 1-click catalog filtering.

## Key Features in v1.0.59
1. **High-Density Enterprise Cashier Listing Table & Dual-Mode POS View (Client Feedback Addressed)**:
   - **Compact Supermarket/Pharmacy Listing View**: 5-column high-density listing displaying 36×36 product thumbnail avatar, product name, cyan mono SKU, barcode, category badge, real-time stock levels with safety pulse (🟢 Normal, 🟡 Low, 🔴 Out), wholesale/SRP/reference prices, in-line quantity steppers (`- count +`), and active in-cart counters.
   - **1-Click Dual-Mode Switcher**: Instant switching between Table Listing and Card Grid modes with per-terminal persistent memory.
   - **High-Speed Keyboard Navigation**: `ArrowDown` / `ArrowUp` item navigation with auto-scrolling viewport and `Enter` key cart addition.
   - **Zero Feature Regressions**: Full compatibility with USB laser scanners, docked counter webcam, wireless companion smartphone scanning, CFD customer secondary display, sales monitor, and hotkeys.

## Key Features in v1.0.58
1. **Permanent Hardware-Anchored VIP Licensing & Multi-Vault Self-Healing Architecture (Client Feedback Addressed)**:
   - **Quad-Vault Redundant Persistence**: License is synchronously stored and self-healed across 4 vaults: `%USERPROFILE%/.tindapos/tinda_license.json`, `%APPDATA%/TINDA POS/tinda_license.json`, Windows Registry `HKCU\Software\TindaPOS\LicensePayload` (Base64), and SQLite DB `system_license_vault` (Migration 12 in `tindapos.db`).
   - **Canonical Machine ID Anchoring**: Machine ID is generated ONCE from immutable hardware attributes (Windows Cryptography `MachineGuid` + Motherboard Product/UUID) without volatile network interface or user hostname dependencies, and anchored into 4 durable storage locations (`machine.id`, registry, database).
   - **Zero Drift Across Updates & Network Changes**: Machine ID never changes when cashiers switch Wi-Fi, unplug Ethernet, reboot offline, or install app updates.
   - **Zero-Friction Legacy VIP Rescue**: Automatically detects and reconciles existing VIP Pro licenses and legacy candidate IDs, locking their status permanently so merchants never lose their VIP status and Dev Francis never has to re-issue keys.
2. **Version Rollback & Safe Downgrade Recovery Manager (Client Feedback Addressed)**:
   - **Pre-Rollback Database Safety Snapshot**: Automatically creates a verified SQLite database backup (`createBackupSync(getDb(), 'BEFORE_UPDATE')`) before any downgrade starts.
   - **Zero Data Loss Guarantee**: All migrations are additive; rolling back to v1.0.55 or earlier never corrupts sales records, credit ledgers, or inventory stock.
   - **Indestructible VIP Persistence**: License remains 100% active in `%USERPROFILE%/.tindapos/tinda_license.json` and registry, automatically recognized by older versions.
   - **1-Tap Rollback UI**: Accessible from `Software Update & Recovery` in Settings and `Backup & Restore` page, with live download tracking and automatic installer launch.
3. **Financial Realized Revenue Model — Utang Exclusion from Net Sales (Client Feedback Addressed)**:
   - **Strict Realized Sales Separation**: Items and orders processed via UTANG (credit) are strictly excluded from Today's Net Sales and Total Sales across the Dashboard, Sales Monitor, and TINDA POS Owner Cloud Executive Sync.
   - **Clean Credit Standby**: Utang credit amounts stand purely in the "Outstanding Utang" / Customer Credit card and customer ledger until collected.
   - **Split Payment Accuracy**: If a transaction is split (e.g. ₱50 Cash + ₱50 Utang), only the realized ₱50 Cash enters Today's Net Sales.
4. **Zero-Flicker VIP Store Experience & Synchronous Hydration (Client Feedback Addressed)**:
   - **Elimination of Navigation Blinks**: Unified `useLicense` Zustand store with synchronous `localStorage` hydration completely eliminates first-frame layout shifts, banner flashes, and blinking when navigating to E-Wallet & Audit and Settings.
   - **Instant First-Frame Rendering**: VIP Pro status is immediately available upon component mount, ensuring zero jitter or glitching for paying merchants.
5. **Multi-Theme & High-Clarity Eye-Care Backgrounds (Client Feedback Addressed)**:
   - **4 Visual Modes**: Includes **Midnight Black** (Itom - OLED battery-saving), **Daylight White** (Puti - Pure White Paper for sun glare/bright open stores), **Warm Eye-Care** (Sepia/Kahoy - soft cream for long night shifts), and **Nordic Slate** (Navy/Asul).
   - **Instant 1-Tap Swatch Selector**: Accessible in `Settings` -> `Store` tab (`ThemeSelector.tsx`).
   - **Pre-React Zero-Flash Hydration**: Instantly applies theme from `localStorage` on boot before the first frame mounts.
6. **VIP E-Wallet & Cash Audit Hub Polish (v1.0.55)**:
   - **Zero Float & Physical Cash Drawer Override**: Cashiers can freely edit or 1-tap reset Expected Cash Drawer (`₱0.00 (Zero Float)`, `Sync POS Shift (₱...)`, `E-Wallet Net Only`), preventing false shortages when store keeps E-wallet money in a separate pouch.
   - **Dedicated Transactions Ledger Tab**: Full-width tab with real-time search across Reference #, Customer Name, Phone, and Cashier; quick channel (`GCash`/`Maya`) and type (`Cash In`/`Cash Out`) filters; and instant thermal slip reprints.
   - **Accessible 1-Tap Void/Delete Management**: Prominent red `Void` buttons with Apple-design frosted confirmation modal and instant shift summary + drawer balance recalculation.
2. **Enhanced Global Lounge (v1.0.54)**:
   - Web Audio API dual-tone chime on new incoming messages with mute/unmute toggle.
   - Non-blocking draggable floating window with Apple-design depth and boundary safety.
   - Minimizable floating capsule pill with live online badge and 1-tap restore.
   - Self-message deletion for merchants + full moderation for developer/owner with optimistic UI & cloud sync.
3. **Bulletproof User Management**:
   - Case-insensitive login via Username or Full Display Name.
   - Unique 4-digit PIN collision guard.
   - Manager/Admin password & PIN reset modals with show/hide password toggles.
   - 1-Tap cashier login profile chips with live presence indicator.
4. **Modern Categorized Sidebar UX**:
   - 5 workflow sections: Cashier & Register, Stock & Operations, Customers & Suki, Records & Reports, System & Guide.
   - Emerald active state accent line and role-based section filtering.
5. **Multi-Platform Packages**:
   - Automated builds for Windows (Setup & Portable .exe) and Linux x64 distribution packages.
