# TINDA POS Desktop (Master Edition)

## Project Overview
Official Desktop POS Application for TINDA POS built with Electron + React + TypeScript + SQLite.
Features 100% offline-first reliability, weighable decimal quantity checkout, live inventory sync, hardware barcode scanner engine, VIP E-Wallet reconciliation hub, multi-PC LAN hub, and Executive Cloud Dashboard bridge.

## Operating Rules & Automation Standard
- Persona: **Fixer Agent**
- Mode: **FULL YOLO MODE** (Proactive, autonomous execution of commands, edits, refactoring, and fixes without waiting for manual confirmation)
- Execution: **100% AUTOMATIC POWERHOUSE**:
  1. **apple-design**: Fluid animations, natural springs, translucent Cupertino materials, and clean hierarchy.
  2. **ponytail & ponytail-review**: The lazy senior dev — shortest diff, YAGNI, standard library first, native platform features, root-cause bugfixes, and bloat-hunting reviews in `.agents/skills/ponytail-review/`.
  3. **caveman**: Terse high-density voice — zero conversational fluff, answer-first, exact code payload.
  4. **smart-ralph**: Spec-driven multi-step execution with 4-phase quality gates.
  5. **headroom**: Automatic context window and token optimization.
  6. **agentmemory & hindsight**: Continuous learning engine with persistent recall, auto-save of bugfix lessons, and Hindsight v0.10.2 embedded memory (`tinda-pos` profile) for hardware profiling and architectural continuity.
  7. **agency-agents & autoskills**: Curated specialist skills in `.agents/skills/` (14 agency specialists + 13 autoskills v0.3.6 audited stack skills: React 19 best practices, Tailwind patterns, Hook Form, Zod, Vitest, Vite, Node patterns) with integrity locks in `skills-lock.json`.
  8. **graphify**: Offline deterministic AST knowledge graph (v0.9.80) in `graphify-out/graph.json` for instant call-path tracing (`graphify query`, `graphify path`), zero-token architecture navigation, and pre-refactoring impact analysis.
  9. **brigade-tideline**: Brigade v1.39.0 long-term memory MCP server running locally (`tools/brigade_mcp_server.mjs`) with hybrid BM25 + HRR vector recall.
  10. **strict-english-standard**: 100% Professional English across all user-facing UI, modals, settings, guides, handbooks, camera pairings, thermal receipts, and tickets. No Bisaya/Filipino words in client-facing elements.
  11. **mandatory-auto-version-bump**: **STRICT RULE**: Every single time the project is built or released (`build:win`, release publishing), the version MUST ALWAYS auto-increment (`v1.0.66` -> `v1.0.67` -> `v1.0.68` and so forth). NEVER build on the same version twice. Always synchronize version bumps across `source/package.json`, `GEMINI.md`, `README.md`, `PosToolsModal.tsx`, and `docs/RELEASE-STATE.md`.

## Release & Repository Status
- Workspace Directory: `D:\TINDA-POS-Desktop\`
- Source Directory: `D:\TINDA-POS-Desktop\source\`
- Git Remote: `https://github.com/Yazerukun/TINDA-POS-Source.git`
- Releases & Updater Repo: `https://github.com/Yazerukun/TINDA-POS.git`
- Cloud Owner Dashboard: `https://tinda-owner-dashboard.pages.dev/`
- Current Version: **v1.0.78 (Real-Time Sidebar Fast Updates & Proactive Pop-up Hub Edition)**

## Key Features in v1.0.78 (Real-Time Sidebar Fast Updates & Proactive Pop-up Hub Edition)
1. **Dedicated Sidebar Fast Update Center Widget**:
   - Added a persistent Apple-grade Cupertino Update Card directly in the left navigation sidebar above the cashier profile.
   - Real-time dynamic states: `Update Available` (with pulsing `⚡ Fast Update` badge and 1-tap `Update Now` button), `Downloading...` (live animated progress bar and percentage), `Ready to Apply` (`Apply Patch (Live · 0.3s)` action), and `Up to date` with instant manual refresh icon.
   - Cashiers can initiate, monitor, and apply updates directly from the sidebar without leaving checkout.
2. **Real-Time Proactive Pop-Up Detection Engine**:
   - Upgraded update engine with 10-second background polling, window focus trigger, and network reconnect listener.
   - Bypasses GitHub API rate limits using zero-quota `raw.githubusercontent.com` CDN manifest fallback.
   - When a fast feature patch is published, the centered Cupertino `UpdateModal` surfaces immediately across cashier screens.

## Key Features in v1.0.77 (In-App Hot-Patch Redirect Engine Fix Edition)
1. **GitHub Release Redirect & In-App Hot-Patch Engine Fix**:
   - Fixed the root cause of the "Update encountered an error, retry download" alert during fast in-app hot-patch downloads.
   - In Electron's `net.fetch`, Chromium follows 302 redirects to GitHub release storage CDNs (`release-assets.githubusercontent.com`) but leaves `res.url` blank, causing redundant strict origin checks to reject valid downloads.
   - Normalized redirect validation and expanded asset CDN host allowlisting to guarantee seamless patch downloading, extraction, and sub-second live reloads.
2. **Unrestricted E-Wallet & Bills Center (Full Parity)**:
   - Permanently unlocked all 5 operational tabs (`Cash In / Out`, `Bills & E-Load`, `Transactions`, `Audit Sheet`, `Audit History`) without VIP crystal badges or paywalls.

## Key Features in v1.0.76 (Unrestricted E-Wallet & Bills Center Edition)
1. **Unrestricted E-Wallet & Bills Center Access for All Merchants**:
   - Completely removed the VIP crystal badge (`💎 VIP`) from the left sidebar navigation and module header.
   - Permanently unlocked all 5 core operational tabs for all merchants and cashiers: `Cash In / Out`, `Bills & E-Load`, `Transactions`, `Audit Sheet`, and `Audit History`.
   - Cashiers can immediately record cash-ins, cash-outs, utility bills, and e-load without requiring VIP Pro license activation or paywalls.
2. **Clean Apple Cupertino Layout & Zero-Distraction Workflow**:
   - Stripped away license gating banners and paywall locks inside the E-Wallet & Bills module.
   - Provided direct, uninterrupted access to financial registers, transaction history, thermal receipt burning, manual print dialogs, and shift reconciliation.
3. **100% Strict English Standard & Zero-Waste Receipt Integrity**:
   - Fully standardized terminology across all tabs, modals, and print stubs with zero dialect strings.

## Key Features in v1.0.75 (Fast In-App Feature Hot-Patch & Proactive Cupertino Update Engine Edition)
1. **Fast In-App Feature Hot-Patch Engine (Dual-Track Architecture)**:
   - Solved the full build bottleneck by decoupling pure application code (~0.8 MB compressed zip) from the redundant Chromium runtime (103 MB).
   - Introduces `npm run build:patch` via `tools/bundle_patch.mjs` which packages in ~3-5 seconds with SHA-256 integrity verification.
   - 100% universal support for both Installed and Portable builds without requiring elevated Windows UAC permissions.
2. **5-Point Steelclad Database & User Safety Shield**:
   - **Physical Data Isolation**: Store database (`tindapos.db`) remains completely decoupled in `%APPDATA%\tinda-pos\database` or `TindaPOS-Data\database`. Code updates never touch or overwrite user records.
   - **Automated Pre-Update Backup Snapshot**: `createBackupSync(db, 'BEFORE_UPDATE')` creates an integrity-verified snapshot before any code is extracted or applied.
   - **Cashier Operation Guard**: Active checkout rings, payments, and audits lock out updates to prevent transaction interruption.
   - **Additive Non-Destructive Migrations**: Only additive table alters; legacy sales, items, and utang records are never wiped.
   - **Crash Sentinel & Auto-Rollback Engine**: Startup health monitor automatically reverts to the previous working bundle if a patch fails to boot within two consecutive attempts.
3. **Proactive Zero-Click Apple Cupertino Update Pop-up Modal (`UpdateModal.tsx`)**:
   - Automatically surfaces front-and-center across all views upon app launch or background detection, eliminating the need to manually check Settings.
   - Translucent frosted glass backdrop, version badge, release highlights, and prominent database safety guarantee badge.
   - 1-tap "Update & Restart Now (Takes 5 seconds)" action with real-time download progress bar and "Remind Me Later" option.
4. **100% Strict English Standardization**:
   - Pure professional English enforced across all update dialogs, notifications, status alerts, receipts, and system tools with zero dialect words.

## Key Features in v1.0.74 (Audit & History Delete Safeguards Edition)
1. **Interactive Cupertino Deletion for E-Wallet Audit Records**:
   - Added individual row Delete button (`Trash2`) in the Audit History ledger table (`EwalletAudit.tsx`).
   - Launches an Apple-grade Cupertino confirmation modal detailing the audit's date, cashier, drawer cash status, and 3-way variance across Cash, GCash, Maya, and MariBank, preventing accidental loss while providing clean record management.
   - Wired with backend `deleteEwalletAudit(id)` in `ewallet.ts` repository and `ewallet:deleteAudit` IPC channel.
2. **Bulk Audit Ledger Clearing ("Clear All Audits")**:
   - Added a top-level **Clear All Audits** action button in the Audit History header with a confirmation safeguard dialog.
   - Cleans test audits and historical logs cleanly via `clearAllEwalletAudits()` in SQLite.
3. **Live Audit Sheet Reset & Today's Audit Delete Banner**:
   - Added **Reset Sheet** button with `RotateCcw` icon to instantly wipe counted denomination quantities, float target presets, and notes back to defaults.
   - Introduced dynamic top-of-sheet status banner whenever an audit has already been recorded for today, featuring a 1-tap **Delete Saved Audit** button to allow cashiers to recount and re-audit without leaving the screen.

## Key Features in v1.0.73 (Ultra-Compact Zero-Wrap Thermal Receipts & Universal Receipt Standard Edition)
1. **Zero-Wrap Deterministic Receipt Timestamps & Reference Alignment**:
   - Replaced multi-line locale timestamps with deterministic, compact single-line format (`MM/DD/YYYY h:mm A`, e.g., `10/08/2026 9:49 PM`), completely eliminating date wrapping on 32-column 58mm rolls.
   - Synchronized across sales checkout receipts, printer test stubs, X/Z shift reports, E-Wallet Cash In/Out claim slips, Bills payment receipts, and audit reports.
2. **Standardized Double-Divider Total Hierarchy (Exact 1.jfif & 2.jfif Reference Standard)**:
   - Total blocks strictly bordered with crisp double dividers (`================================`) above and below grand totals (`TOTAL`, `TOTAL PAID`, `TOTAL CASH RECEIVED / RELEASED`).
   - Added Cash Tendered and Change calculations and display directly to Bills & E-Load center and thermal slips.
   - Enhanced `rowsToHtml` with adjacent-separator detection to avoid redundant border doubling while ensuring clean 1:1 parity between Auto Print and Manual Print dialogs.
3. **Ultra-Compact Typography & Strict English Standardization**:
   - Standardized monospace font stack with `line-height: 1.05`, 10px body, 11px bold headers, 9px footers, and micro-margins (`2mm`) for crisp, dark, zero-waste thermal printing.
   - 100% strict professional English across all user-facing E-Wallet and Bills UI elements and receipts (clearing all legacy terms).

## Key Features in v1.0.72 (Native Document Printing, Audit Dual Print & MariBank Edition)
1. **Native Operations Sheets & Inventory Document Printing Pipeline**:
   - Replaced fragile browser `window.open` popup printing with native Electron IPC `printing:printDocument`.
   - Spawns a dedicated hidden BrowserWindow with proper `@page` CSS and page sizing (A4 / Letter), executing direct printing or opening native Windows OS Print Dialog without popup blockers.
   - Provides 1-tap **Auto Print** and **Manual Print (Dialog)** in `InventoryPrintModal.tsx` for Physical Count Sheets, Stock on Hand Reports, Purchase Orders, and Stock Adjustment Logs.
2. **Dual Printing in E-Wallet Audit Sheet & Historical Audit Ledger**:
   - Upgraded `ewallet:printAuditReport` to support optional `{ manual?: boolean }` Windows System Print Dialog execution.
   - Added dual **Auto Print** (Thermal direct) and **Manual Print** (OS Print Dialog) buttons to both the live **Audit Sheet** footer and the **Audit History** ledger table.
3. **MariBank Digital Banking & E-Wallet Integration**:
   - Added **MariBank** alongside GCash and Maya across E-Wallet Cash In / Out, Bills & E-Load center, transactions ledger, and shift audits.
   - Distinct vibrant MariBank brand identity (`#FF6A00` Shopee/Sea orange gradient badges and chip selectors).
   - Added Migration 12 for SQLite database schema: `ewallet_audits` (MariBank float reconciliation columns) and updated `ewallet_transactions` channel check constraint.
   - Updated thermal audit receipt printer to include MariBank reconciliation breakdown.

## Key Features in v1.0.71 (Next-Gen Community Chat & Universal Store Branding Edition)
1. **Clean Fee Notation & No-Seconds Receipt Timestamps**:
   - Removed `+` sign from all E-Wallet and Bills fee displays, chips, summaries, and receipt slips (`Service Fee    P20.00`).
   - Standardized all thermal receipt date/time formatters across sales, E-Wallet, and Bills slips to `{ dateStyle: 'medium', timeStyle: 'short' }`, producing clean timestamps with zero seconds (e.g., `Oct 7, 2026, 10:07 PM`).
2. **Next-Gen Community Chat Overhaul**:
   - Fixed hold-and-drag accidental expansion on minimized floating pill via movement threshold checks and dedicated drag handle.
   - Renamed minimized label to **Chat**.
   - Added instant Emoji Picker (`😀 😂 😍 👍 🙏 🏪 📦 💰 🔥 👏 ❤️ 🎉 🚀 🇵🇭`) and image attachment upload/paste support.
   - Added Seen Receipts (`👁️ Seen by Cashier · 10:07 PM`) and live online merchant counter (`🟢 X Online`).
3. **Universal Store Logo Upload & Window Icon**:
   - Unlocked store logo customization for all merchants without VIP restrictions; dynamically updates the Windows desktop taskbar and window frame icon.
4. **Cinematic Staggered Dashboard Login Animations**:
   - Smooth CSS keyframe fade-in-up animations and personalized time-of-day store welcome banner.

## Key Features in v1.0.70 (7-Eleven Micro Thermal Spacing & Express Manual Print Edition)
1. **7-Eleven Micro Thermal Spacing & Double-Divider Receipts**:
   - Monospace font stack standardized to `'Courier New', Courier, Consolas, monospace` across all thermal printouts.
   - Introduced authentic double-line divider `================================` (`border-top: 3px double #000000`) before grand totals in both print CSS and screen preview.
   - Ultra-compact vertical padding and micro-margins (`1mm 1mm 2mm 1mm`), reducing thermal roll consumption to 7-Eleven retail standards.
   - Expanded `isMoneyLine` parser to right-align tabular numerals for E-Wallet and Bills lines (`Amount`, `Service Fee`, `Bill Amount`, `TOTAL PAID`, `TOTAL CASH RECEIVED`, `TOTAL CASH RELEASED`).
2. **Express Manual Print in Cash In / Out Register**:
   - Added direct **Manual** print button (`printEwalletReceipt(tx.id, true)`) and **Auto** print button to Recent E-Wallet Transactions on the Cash In / Out register page, allowing one-tap system print dialog invocation.

## Key Features in v1.0.69 (Laptop Responsive Layout & Auth Setup Resilience Edition)
1. **E-Wallet & Bills Responsiveness for Laptop Resolutions**:
   - Layout automatically stacks on standard laptop displays ($1366\times 768$, $1280\times 720$) via `2xl:grid-cols-12`, providing full table width without horizontal squishing.
   - Pinned sticky Actions column (`sticky right-0`) with drop shadow for both Bills and Transactions ledgers, ensuring Print, Manual Print, and Void/Delete buttons remain visible at all times.
2. **First-Run Setup Lockout Fix & Auto-Healing**:
   - Resolved `SqliteError: UNIQUE constraint failed: users.username` by making `completeSetup` idempotent (upserting existing admin user).
   - Auto-heals blank or missing `store_name` in `firstRunComplete` so existing installations never falsely trap users in the setup wizard on restart or update.
3. **Receipt 58mm & 80mm Alignment**:
   - Monospace font, right-aligned tabular numerals, double-line total borders, and ultra-compact zero-waste thermal spacing verified for automatic and manual printing paths.

## Key Features in v1.0.68 (Ultra-Compact Zero-Waste Thermal Receipt Spacing Edition)
1. **Ultra-Compact Thermal Receipt Spacing Engine (Paper-Saving Optimization)**:
   - Responded immediately to merchant feedback on thermal paper usage ("kalas ug papel").
   - Tightened typography line-height from `1.25` to `1.15` in `receiptHtml.ts` for dense, crisp thermal printing.
   - Reduced line item vertical margin (`.tp-item`) from `0.15em` to `0.06em`.
   - Tightened section separators (`.tp-sep`), spacing gaps (`.tp-gap`), and subtotal blocks (`.tp-total`, `.tp-sukli`, `.tp-sum`), reducing unnecessary white space by over 20-30% per receipt.
   - Decreased print bottom clearance from `3mm` down to `1.5mm`, ensuring receipts finish right after the footer message with zero wasted paper feed.
   - Preserves 100% legibility, integer dot metrics (11px / 12px), bold 700+ stroke weights, and clear tabular-nums centavo decimal alignment.
2. **Consolidated E-Wallet & Bills Center (Single Sidebar Module)**:
   - Combined previously split modules into a unified **E-Wallet & Bills** module under *Cashier & Register*, saving sidebar space and giving cashiers an integrated financial hub.
   - 5 Integrated Cupertino Tabs: `Cash In / Out`, `Bills & E-Load`, `Transactions`, `Audit Sheet`, and `Audit History`.
   - **Native Hardware Thermal & Universal Manual Print**: Integrated with native Electron print service (`ewallet:printBillSlip`), supporting direct thermal printing and Windows system dialog manual printing for challenging printer setups.
   - **Deletion & Void Safeguards**: Added dedicated Delete buttons (`Trash2`) with interactive Cupertino confirmation modals for both E-Wallet and Bills Payment records.
2. **Universal Multi-Size Shelf Price Tag & Barcode Sticker Printing**:
   - Integrated `PriceTagPrintModal.tsx` in Inventory catalog with 1-tap shelf label generation per item or catalog-wide (`30×20mm`, `40×30mm`, `50×30mm`, and custom mm sizes).
3. **Physical Inventory & Operations Printable Sheets Hub**:
   - `InventoryPrintModal.tsx` in Inventory header with 4 professional A4 / Letter printable document templates: Stock on Hand Report, Physical Count Sheet, Purchase / Restock Order (P.O.), and Stock Adjustment Log.
4. **Zero-Waste Thermal Receipt Gap & Decimal Precision Fix**:
   - Reduced bottom clearance from `10mm` to `3mm` and vertical spacing from `12px` to `4px`, saving up to 40% thermal paper roll consumption.
   - 100% visible centavos on 58mm narrow rolls with flex-alignment and right gutter margins.
5. **Multi-Criteria Smart Product Search & Instant Enter-to-Punch Engine**:
   - Instant enter punch by name, SKU, or barcode; multiplier rapid punch (`5*egg`, `12*48000123`); proactive low-stock warnings.
6. **Community Chat & Clean Terminology Standard**:
   - Global Lounge renamed to Community Chat; removed outdated "Hub" titles across the entire app.
7. **100% Quality Invariants & Automated Test Gate Passed**:
   - All 416 automated vitest unit tests passing across 63 test files with 0 TypeScript compilation errors.

## Key Features in v1.0.66 (Universal Shelf Price Tags, Operations Sheets, Zero-Waste Thermal & Bills Hub)
1. **Universal Multi-Size Shelf Price Tag & Barcode Sticker Printing**:
   - Integrated `PriceTagPrintModal.tsx` in Inventory catalog with 1-tap shelf label generation per item or catalog-wide.
   - Preset dimensions: `30×20mm` (Micro grocery), `40×30mm` (Standard retail sticker with barcode), `50×30mm` (Wide pharmacy tag), and custom mm sizes.
   - High-contrast pure black vector layout with Product Name, Bold Peso Price (`₱99.00`), wholesale volume tiers, barcode Code128, and SKU reference.
2. **Physical Inventory & Operations Printable Sheets Hub**:
   - Added `InventoryPrintModal.tsx` in Inventory header with 4 professional A4 / Letter printable document templates: Stock on Hand Report, Physical Count Sheet (blind counting audit), Purchase / Restock Order (P.O.), and Stock Adjustment Log.
3. **Zero-Waste Thermal Receipt Gap & Decimal Precision Fix**:
   - Reduced bottom clearance from `10mm` to `3mm` and vertical spacing from `12px` to `4px`, saving up to 40% thermal paper roll consumption.
   - Fixed decimal clipping on narrow 58mm thermal rolls by introducing flex-aligned line items and explicit right gutter margins, guaranteeing all centavos (`.00`, `.50`, `.95`) render with 100% complete visibility.
4. **Multi-Criteria Smart Product Search & Instant Enter-to-Punch Engine**:
   - Search by product name, SKU, or barcode; pressing `Enter` instantly punches the matching item straight into the checkout cart without requiring down-arrow navigation.
   - Multiplier rapid punch supported: type `5*egg` or `12*48000123` and hit `Enter` to instantly add bulk quantities.
   - Proactive **Low-Stock Alert**: Instant warning toast whenever an item punched has $\le$ `low_stock_threshold` remaining.
   - Upgraded **No Product Found** interactive Cupertino card with instant query clearing (`Esc`).
5. **Unified E-Wallet & Bills Center (Consolidated Single Sidebar Module)**:
   - Combined previously split modules into a unified **E-Wallet & Bills** module under *Cashier & Register*, saving sidebar space and giving cashiers an integrated financial hub.
   - 5 Integrated Cupertino Tabs: `Cash In / Out`, `Bills & E-Load`, `Transactions`, `Audit Sheet`, and `Audit History`.
   - **Native Hardware Thermal & Universal Manual Print**: Replaced popup `window.open` with native Electron print service (`ewallet:printBillSlip`), supporting both direct thermal burning and Windows system dialog manual printing for challenging printer setups.
   - **Deletion & Void Safeguards**: Added dedicated Delete buttons (`Trash2`) with interactive Cupertino confirmation modals for both E-Wallet and Bills Payment records.
6. **100% Quality Invariants & Automated Test Gate Passed**:
   - All 416 automated vitest unit tests passing across 63 test files with 0 TypeScript compilation errors.

## Key Features in v1.0.65 (Zero-Blur High-Density Thermal & Universal Manual Print Edition)
1. **Universal Manual Print Engine (Native Windows Print Dialog)**:
   - Designed for challenging printers (e.g. GOOJPRT 58H / JP-58BL / KP58B-U / POS-58) that experience Windows driver spooler locking, virtual USB port delays, or driver name mismatches.
   - When **Manual Print** is triggered, Electron launches the native Windows System Print Dialog pre-bound to the detected thermal printer, allowing cashiers to manually choose any printer device, inspect print preferences, adjust darkness/density, or print to PDF.
   - Provides 1-tap **Manual Print** buttons in:
     - **Checkout Complete Modal**: Cashiers can trigger instant manual receipt printing even if automatic printing was disabled or interrupted.
     - **Transactions Ledger & Receipt Preview**: Dedicated "Manual Print" action alongside "Print Receipt" (auto).
     - **Terminal Tools [F3] (`PosToolsModal`)**: Hardware Hub quick strip offers both "Thermal Print" (auto) and "Manual" dialog test.
     - **Settings -> Receipt Tab**: "Manual Test Print (Dialog)" for verifying Windows driver connection.
     - **Automatic Manual Print Dialog Mode**: Added `manual_print_dialog` toggle in Settings so stores with strict printing workflows can open the OS dialog on every sale automatically.
2. **Zero-Blur High-Density Thermal Typography Engine**:
   - Fixed the root cause of blurry/faint thermal printing: Chromium previously rendered subpixel antialiased text with fractional font sizes (`9.5px`), which 203 DPI monochrome thermal heads dithered into faint, fuzzy dots.
   - Replaced fractional font metrics with integer dot geometry (`11px` for 58mm / 32 columns, `12px` for 80mm).
   - Injected `@media print` rules: `-webkit-font-smoothing: none !important`, `-moz-osx-font-smoothing: grayscale !important`, `font-smooth: never !important`, `text-rendering: geometricPrecision !important`, and `image-rendering: pixelated !important`.
   - Set base thermal font-weight to `700 !important` and borders to solid `2px`/`3px` pure black (`#000000`), ensuring minimum 2-dot stroke widths so thermal pins burn pitch-black, needle-sharp text at 90mm/s.
   - Switched Chromium print rasterizer to pure monochrome (`color: false`, `dpi: { horizontal: 203, vertical: 203 }`) to eliminate color-to-halftone dithering artifacts.
   - Increased pre-print rasterization delay (350ms) and post-print spooler hold delay (500ms) to ensure complete buffer transmission.
3. **GOOJPRT 58H Hardware Model Matching & In-App Guide**:
   - Expanded printer recognition regexes to match `58h`, `jp-?58`, and `kp-?58` (`KP58B-U` Bluetooth and `JP-58BL` USB models).
   - Linked official [GOOJPRT 58H User Manual](https://manuals.plus/ae/1005008661058283) in Settings -> Receipt and Handbook Chapter 10.
   - Documented exact Windows driver steps for setting **Print Density / Darkness** to Dark (Level 12-15), **Dithering** to None, and performing printhead cleaning with isopropyl alcohol.
4. **Cloud Owner Dashboard & True Realized Sales Void-Safe Architecture**:
   - Fixed the financial discrepancy where voided transactions previously inflated Period Revenue (e.g., ₱6,000 displayed instead of ₱5,995 after voiding a ₱5 item).
   - Desktop POS transaction voiding (`processVoid`) and transaction deletions (`deleteTransaction`) now automatically broadcast a `status: 'VOIDED'` and `net_sales_c: 0` payload to the Cloudflare Worker sync queue alongside the updated X/Z shift balancing snapshot.
   - Cloudflare D1 Worker upsert query permanently persists `status = excluded.status` and zeroes out sales components upon void sync.
   - Cloud Owner Dashboard (`https://tinda-owner-dashboard.pages.dev` / `BranchDetailPage.tsx`) filters sales strictly by `status !== 'VOIDED'` for all Period Revenue and tender breakdowns (Cash, GCash, Maya, Utang).
   - Voided sales in the Sales Feed table are explicitly rendered with a red `VOIDED` status badge, strikethrough text formatting, and muted opacity for complete audit transparency.
5. **100% Automated Test Gate & Master Invariants Passed**:
   - Automated unit tests in `stabilization.test.ts` verify transaction voiding, shift totals recalculation, inventory replenishment, and cloud sync payload integrity.
   - Verified 414/414 unit tests across 63 test suites with 0 TypeScript compilation errors.

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
