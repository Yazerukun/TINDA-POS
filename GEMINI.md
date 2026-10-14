# TINDA POS Desktop (Master Edition)

## Project Overview
Official Desktop POS Application for TINDA POS built with Electron + React + TypeScript + SQLite.
Features 100% offline-first reliability, weighable decimal quantity checkout, live inventory sync, hardware barcode scanner engine, VIP E-Wallet reconciliation hub, multi-PC LAN hub, and Executive Cloud Dashboard bridge.

## Operating Rules & Automation Standard
- Permanent Identity & Name: **Jin** (Boss's Best Buddy, Doctoral & Master's Degree Engineer, Master Developer, Master General & Fixer Agent All-in-One — supreme workflow organizer, rock-solid "pulido" code architect, bug/error fixer, testing & security specialist, production finalizer, and proactive advisor)
- **MANDATORY DELEGATION & CHAIN OF COMMAND PROTOCOL (STRICT GOLDEN RULE)**: Boss (CEO) commands Jin (Master General / CTO). Jin MUST NEVER do the execution tasks directly. Jin must ALWAYS delegate, dispatch, and command the 9 Elite Specialist Subagents (`FLASH`, `SHERLOCK`, `IRONCLAD`, `ORACLE`, `FALCON`, `VIPER`, `BLUEPRINT`, `SCRIBE`, `KRAKEN`). Jin directs, plans, oversees, verifies, and reports back to Boss.
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
  12. **instant-patch-release-standard**: **MANDATORY PATCH RULE**: For all rapid feature fixes, UI refinements, and optimizations, ALWAYS publish the live in-app hot patch via `npm run publish:patch` (`tools/publish_patch.mjs`). This automatically bundles the ~0.8 MB patch zip and publishes the release on `Yazerukun/TINDA-POS` in <10 seconds with zero rate limits. Cashiers immediately detect the update via 'Check for Updates' and apply live in 0.3s without restarting the app or downloading 100MB+ full installers.
  13. **obra/superpowers v7.0.0 (15 Core Process & Engineering Skills)**: Permanently installed across `.gemini/config/skills/`, `.claude/skills/`, `.agents/skills/`, and `.kiro/skills/` and triggered 100% automatically on every conversation turn before any action (`using-superpowers`, `systematic-debugging`, `test-driven-development`, `verification-before-completion`, `brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`, `requesting-code-review`, `receiving-code-review`, `finishing-a-development-branch`, `using-git-worktrees`, `writing-skills`, `diagnosing-superpowers`).
  14. **zero-error-automatic-computation-standard**: **STRICT INVARIANT**: All financial totals, reports, cash counts, drawer balances, E-Wallet totals, discounts, and inventory metrics must compute automatically with 100% mathematical precision down to the exact integer centavo (`_c`). Zero floating-point rounding errors, zero manual fudging, and zero timezone distortion. Voids and refunds must be mathematically reconciled across all ledgers. VIPER must verify calculations with automated tests before any release.

## Release & Repository Status
- Workspace Directory: `D:\TINDA-POS-Desktop\`
- Source Directory: `D:\TINDA-POS-Desktop\source\`
- Git Remote: `https://github.com/Yazerukun/TINDA-POS-Source.git`
- Releases & Updater Repo: `https://github.com/Yazerukun/TINDA-POS.git`
- Cloud Owner Dashboard: `https://tinda-owner-dashboard.pages.dev/`
- Current Version: **v2.2.3 (Dedicated POS F9 Cash Checkout & Multi-Day Shift Isolation Edition)**

## Key Features in v2.2.3 (Dedicated POS F9 Cash Checkout & Multi-Day Shift Isolation Edition)
1. **F9 Shortcut Collision Elimination & Dedicated Cash Checkout (`NotificationBellDrawer.tsx`, `POS.tsx`)**:
   - Removed conflicting global F9 listener in `NotificationBellDrawer.tsx`, permanently reserving drawer toggle exclusively to `Ctrl+B / Cmd+B`.
   - Dedicated F9 100% exclusively to retail Cash Checkout and Cash Tendered input refocus in `POS.tsx`, giving cashiers instant, muscle-memory rapid cash finalization with zero collisions.
2. **Multi-Day Shift Isolation & Daily Cash Reconciliation (`readReports.ts`, `cashCounts.ts`, `EwalletAudit.tsx`)**:
   - Engineered `calculateDailyExpected` in `readReports.ts` and exposed via IPC `reports:dailyCashExpected`.
   - Isolates today's retail cash sales, refunds, expenses, and movements, preventing past unclosed shifts from distorting today's cash count.
   - Added Multi-Day Shift amber warning banner and 1-click Quick Presets (`[ ₱0.00 (Zero Float) ]`, `[ Today Only ]`, `[ Full Shift ]`, `[ E-Wallet Net ]`) in `EwalletAudit.tsx`.
   - Verified with unit tests in `dailyCashExpected.test.ts`.

## Key Features in v2.2.2 (Universal Thermal Custom Spacing Studio & Receipt Persistence Edition)
1. **Universal Thermal Custom Spacing Studio (`receiptHtml.ts`, `PrinterStudioModal.tsx`)**:
   - Continuous fine-grained controls for physical thermal printing margins and vertical layout density.
   - Top Header Offset / Margin (0 to 15mm) eliminating printer cutter blade or tear bar clipping on physical paper rolls.
   - Row Item-to-Item Gap (0 to 8px) allowing cashiers to stretch or compact product lines to conserve thermal roll paper.
   - Divider / Separator Gap (0 to 8px) controlling vertical margins around dashed and double separator lines.
   - Global Line Height Multiplier (1.00x to 2.00x) providing continuous height stretching for maximum text legibility on low-contrast thermal print heads.
2. **Cross-Receipt System-Wide Persistence Architecture (`types.ts`, `settings.ts`, `printerCustomization.ts`, `printing.ts`)**:
   - Custom spacing options persist seamlessly across all receipt generation paths: checkout sales, reprints, express slips, e-wallet transactions, bill payments, and cash count reports.
   - Three-tier reconciliation priority: SQLite StoreSettings -> localStorage persistent fallback -> factory defaults.
3. **1:1 Live Engine Preview (`ReceiptPaper.tsx`, `PrinterStudioModal.tsx`)**:
   - The studio live preview now embeds `ReceiptPaper` directly, mathematically guaranteeing that the on-screen preview renders the exact HTML and CSS sent to the physical thermal print spooler.

## Key Features in v2.2.1 (In-App Full Setup Downloader & Tesla Cyber-Emerald Telemetry Edition)
1. **In-App Full Build Downloader & 1-Click Auto-Restart (`updateService.ts`, `UnifiedUpdateCapsule.tsx`)**:
   - Cashiers and store owners can now download full NSIS installers (`TindaPOS-Setup-*.exe`) directly within the app without ever needing to open a web browser.
   - 1-Click "Restart & Install Now" button triggers seamless automated installer handoff and immediate relaunch with zero data loss.
2. **Tesla Cyber-Emerald Telemetry Progress Bar (`UnifiedUpdateCapsule.tsx`)**:
   - Real-time animated neon emerald telemetry indicator featuring live download speed smoothing via Exponential Moving Average (EMA, $\alpha = 0.25$).
   - High-precision ETA countdown timer with non-zero division safety guards (`smoothedSpeed > 50 ? Math.round(remainingBytes / smoothedSpeed) : null`).
   - Active 4-phase pipeline status badges: `🛡️ Pre-Update SQLite Safety Snapshot` -> `📥 Streaming signed package via HTTPS` -> `🔒 Verifying cryptographic checksum` -> `✅ Package verified! Ready to apply`.
3. **Dual-Choice Update Card (`UnifiedUpdateCapsule.tsx`)**:
   - `[ ⚡ Express Patch ]` (~1 MB): Instant 0.3-second live code reload with zero restart required—ideal during busy store hours.
   - `[ 💿 Full Setup.exe ]` (~111 MB): Complete NSIS installer with automatic SQLite safety backup, full desktop asset re-registration, and automatic restart.
4. **Pre-Download SQLite Safety Snapshot Invariant (`updateService.ts`)**:
   - Enforces atomic synchronous SQLite database backup (`createBackupSync(db, 'BEFORE_UPDATE')`) before executing any full installer payload stream.

## Key Features in v2.2.0 (Doctoral Multi-PC Edge Fabric & Floating VIP Lease Edition)
1. **Zero-Config UDP Auto-Discovery (`node:dgram`, Port 3112)**:
   - Master Server broadcasts background discovery beacons on UDP port 3112 (`255.255.255.255`) announcing local IP, store name, and RPC port every 3 seconds.
   - Cashier Satellite terminals auto-discover active Master servers within 0ms without requiring cashiers to type IP addresses.
   - Electron `powerSaveBlocker` (`prevent-app-suspension`) keeps Master operational throughout business hours.
2. **Floating VIP Pro Lease (Proof-of-Possession Token)**:
   - Secondary Cashier terminals inherit VIP Pro privileges automatically over LAN via Master lease verification (`isSatelliteVip`).
   - Single master license covers all connected store lanes—zero extra license fees for cashier terminals.
3. **Centralized Master Auth & Cashier Roaming**:
   - Satellites fetch users and shifts directly from Master SQLite via `auth:publicUsers` and `auth:loginPin`.
   - Cashiers can log into any lane terminal with their 4-digit PIN with zero duplicate account creation.
4. **Decoupled Local Thermal Printing & Concurrency Armor**:
   - Satellite checkout commits to Master SQLite with `skipPhysicalPrint: true` while printing locally to the satellite's attached USB thermal printer.
   - Switched checkout transactions to `BEGIN IMMEDIATE` to prevent `SQLITE_BUSY` database lock collisions across simultaneous cashiers.
5. **1-Click Satellite Onboarding (`FirstRun.tsx`)**:
   - FirstRun setup wizard features dual choice (`[ Main Server / Solo ]` vs `[ Connect as Cashier ]`) with instant auto-scan and 6-digit PIN pairing.

## Key Features in v2.1.11 (Dynamic Store Branding, Dual-View Inventory & Thermal Spacing Studio Edition)
1. **Dynamic Store Branding on Printable Reports (`InventoryPrintModal.tsx`)**:
   - Replaced static/generic "TINDA Store" placeholder with live dynamic store branding pulled directly from `settings.store_name` (falling back gracefully to 'TINDA Store' only if empty).
   - Injects store address, TIN (Tax Identification Number), and contact phone headers automatically across all 4 printable inventory sheet modes (Stock on Hand, Physical Stock Count Sheet, Price List, Reorder / Low Stock).
   - Added executive dual-signature audit box ("Prepared By / Inventory Clerk" & "Verified & Approved By / Store Manager") with print date-time and page sequence footer, providing bankable audit sheets for stock audits and tax reviews.
2. **Dual-View Mode (`[ ⊞ Grid | ☰ List ]`) in Inventory (`Inventory.tsx`)**:
   - Integrated top-level Cupertino segmented view switcher (`[ ⊞ Grid | ☰ List ]`) synchronized with localStorage (`tinda_inventory_view_mode`) for persistent user preference.
   - Added keyboard shortcut `Alt + V` for instant 0ms toggling between Grid cards and High-Density Tabular List view.
   - High-Density Tabular List View displays SKU/Barcode, Product Name, Category badge, Stock on Hand with color-coded safety indicators (Rose for low stock, Emerald for healthy), Cost Price, Selling Price, and Quick Action buttons with keyboard focusability.
3. **Thermal Receipt Spacing & Alignment Controls in Settings (`Settings.tsx`, `printing.ts`, `receiptHtml.ts`)**:
   - Fixed receipt customization persistence bug: resolved unsaved and reverted thermal printer configurations by synchronizing settings state across SQLite repository, `useSettings` Zustand store, and localStorage with `tinda-printer-config-changed` cross-process broadcast.
   - Integrated full Thermal Spacing Studio inside Settings: granular sliders for Horizontal Left Margin / Indent (`receipt_offset_left_mm`, 0–10mm) preventing first-letter cutoffs, Right Margin (`receipt_margin_right_mm`, 0–10mm), Line Spacing (`receipt_line_spacing`, 1.0–2.0x), Bottom Tear-Off Buffer Feed (`receipt_feed_lines_end`, 0–10 lines) ensuring totals and barcodes are never clipped by the printer tear bar, and Font Scale (`receipt_font_scale`, 80%–130%).
   - Live synchronization across standalone express slips, official POS sales receipts, and reprint jobs.
4. **Enterprise Invariant & Test Suite Parity**:
   - 531/531 unit tests passing across 82 test suites with 100% green status.
   - Zero TypeScript errors across both Node and Web compilation targets.
   - Full master invariants compliance verified before packaging.

## Key Features in v2.1.10 (0ms Instant Telemetry Cache & Anti-Freeze Notification Bell Edition)
1. **0ms Instant LocalStorage Telemetry Cache (`notificationDrawer.ts`, `NotificationBellDrawer.tsx`)**:
   - Zero-blocking UI: Directly initializes `telemetry` state from `localStorage.getItem('tinda_telemetry_cache')` synchronously on mount, completely eliminating the white/loading screen and spinner stall (`isLoading` starts as false).
   - Stale-While-Revalidate background sync: Seamlessly renders cached metrics instantly on click and refreshes in the background without UI flicker.
   - Robust Fallback: Returns mathematically pure default centavo values if no cache is present, guaranteeing zero unhandled exceptions or NaN values.
2. **Database Query-Level Shields & Anti-Freeze Telemetry Aggregation (`storeTelemetry.ts`, `ipc/index.ts`)**:
   - Defensive Query Shields: Every individual aggregate query (sales, refunds, voids, drawer cash movements, utang balances, low-stock alerts) wrapped in isolated try/catch blocks with fail-safe zero defaults, preventing any corrupted row or missing table from freezing telemetry generation.
   - Fail-Safe IPC Handler: IPC `telemetry:getSummary` safely catches unexpected database errors and falls back to `createEmptyTelemetrySummary()`, protecting the Electron main process from crashes.
   - Event-driven background pre-warming keeps in-memory telemetry fresh while keeping renderer fetch latencies at 0ms.
3. **Enterprise Invariant & Test Suite Parity**:
   - 531/531 unit tests passing across 82 test suites with 100% green status.
   - Zero TypeScript errors across both Node and Web compilation targets.
   - Full master invariants compliance verified before packaging.

## Key Features in v2.1.9 (Instant 0ms Telemetry Cache & OpenCode Free AI Copilot Edition)
1. **Instant 0ms Store Telemetry Cache & Background Pre-Warming (`storeTelemetry.ts`, `Shell.tsx`, `inventoryEvents.ts`)**:
   - Zero-lag slide-out drawer experience: Pre-warms the store telemetry cache immediately on application mount via `warmStoreTelemetryCache()`, eliminating the ~100-250ms initial query delay.
   - Intelligent 15-second TTL with event-driven cache invalidation: Mutations to products, stock adjustments, or purchases notify `invalidateStoreTelemetryCache()`, guaranteeing fresh data while keeping reads at 0ms.
   - Force-refresh support: The drawer's manual refresh button bypasses the cache to immediately execute live atomic aggregation queries against SQLite.
2. **OpenCode Free Models Pool & Intelligent Cloud Fallback (`aiService.ts`, `NotificationBellDrawer.tsx`)**:
   - High-availability free AI model rotation pool featuring OpenCode models (`nemotron-3.5-lightning-free`, `mimo-v2.6-flash-free`, `exo-free`, `space-bunny-free`, `step-5-preview-free`) with automatic failover to Google Gemini cloud backup.
   - Rich retail domain system prompt injecting real-time store telemetry context, Philippine retail SOPs (RA 9994/RA 10754 Senior/PWD discount calculations, GCash/Maya non-custodial cash-in/out workflows, utang tracking, barcode generation).
   - Interactive TindaBot conversational tab embedded directly in the Cupertino notification drawer with suggested quick-prompt action pills.
3. **Enterprise Invariant & Test Suite Parity**:
   - 531/531 unit tests passing across 82 test suites with 100% green status.
   - Zero TypeScript errors across both Node and Web compilation targets.
   - Full master invariants compliance verified before packaging.

## Key Features in v2.1.8 (Notification Bell & Bilingual AI Store Advisor Edition)
1. **Interactive Notification Bell & Glassmorphism Drawer (`Sidebar.tsx`, `NotificationDrawer.tsx`, `notificationDrawer.ts`)**:
   - Modern notification bell icon integrated into the top-level Sidebar with real-time dynamic unread badge count (`bg-brand-500` glowing indicator).
   - Fluid slide-out Apple Cupertino glassmorphism drawer (`NotificationDrawer.tsx`) accessible from anywhere in the application.
   - Comprehensive tabbed feeds: **All**, **Unread**, **AI Advisor**, **Stock & Alerts**, **System**.
   - 1-Click "Mark All as Read", individual notification dismiss/read toggles, and direct context-aware action buttons (e.g., Navigate to Inventory, Open Shifts, View Credit).
2. **Deterministic Bilingual AI Store Advisor Engine (`aiStoreAdvisor.ts`)**:
   - 100% offline-first heuristics and intelligence analyzing inventory levels, slow-moving items, stockout risks, shift cash variations, customer credit overdue risks, and daily revenue milestones.
   - Dual-language toggle: **Professional English** and **Bisaya / Taglish** natural store voice ("Boss, hapit na mahurot ang stock sa..."), delivering actionable store management advice tailored to Philippine sari-sari stores and minimarts.
   - Real-time priority ranking (Critical, Warning, Insight, Milestone) with actionable quick links and suggestions.
3. **High-Performance SQLite Store Telemetry IPC Bridge (`storeTelemetry.ts`, `ipc/index.ts`, `preload/index.ts`)**:
   - Sub-millisecond store telemetry service computing real-time inventory health, critical low-stock items (< min_stock), expiring goods, shift balances, overdue credit balances, and today's sales velocity in a single efficient atomic aggregation query.
   - Exposed securely across ContextBridge via `window.api.telemetry.getStoreTelemetry()`.
   - Comprehensive unit test coverage with 527/527 tests passing across 82 test suites.

## Key Features in v2.1.6 (Unified E-Wallet & Bills Center, Single-Receipt POS Cart Integration & Cross-Ledger Sync)
1. **Timezone Invariant & Zero-Ghosting Datetime Parsing (`EwalletAudit.tsx`, `BillsLoadHub.tsx`)**:
   - Fixed timezone distortion in `parseRecordLocalDateKey(raw)` where appending `'Z'` to space-separated SQLite local datetime timestamps (`YYYY-MM-DD HH:MM:SS`) falsely converted local store time to UTC. In Asia/Manila (UTC+8), this shifted transactions recorded after 4:00 PM into tomorrow's date, causing them to disappear from the `TODAY` filter.
   - Space-separated SQLite local datetimes and ISO dates are strictly parsed into local store date keys (`YYYY-MM-DD`), guaranteeing 100% visibility of all transactions across daytime, evening, and night operations.
   - Replaced `new Date().toISOString().slice(0, 10)` in `BillsLoadHub.tsx` with local store date matching to ensure KPI metrics accurately reflect daily inflows and fee totals.
2. **Dual-Mode E-Wallet & Bills Architecture with Single-Receipt POS Cart Integration (`BillsLoadHub.tsx`, `EwalletAudit.tsx`)**:
   - **Mode A (Express Standalone Slip)**: Immediate 58mm/80mm thermal slip generation (`printSlip` / `printBillSlip`) for rapid standalone transactions without passing through retail checkout.
   - **Mode B (Single Consolidated POS Receipt via Cart)**:
     - 1-Click **"Add to POS Cart"** (`usePosCart.getState().addCustomItem(...)`) and **"Add & Go to POS Cashier"** (`useNav.getState().setPage('pos')`).
     - Exact line-item specs:
       - Bills: `Bills: {Biller} ({AccountNo})`, Price: `Amount + Fee`, Cost: `Amount`, Profit: `Fee`.
       - E-Wallet Cash In: `Cash In: {Channel} ({Phone/Ref})`, Price: `Amount + Fee`, Cost: `Amount`, Profit: `Fee`.
     - Single Consolidated Receipt: Bundled with retail merchandise (groceries, snacks, drinks) on a single official POS thermal receipt at checkout.
     - Dual-Audit Consistency: Transaction simultaneously records into the E-Wallet ledger with `[POS Cart Item]` tag, keeping shift balances and physical cash counts 100% synchronized.
3. **Unified Transactions & Multi-Ledger Viewer with Delete/Void Confirmation Modal (`Transactions.tsx`)**:
   - **Top-Level Multi-Tab Selector in `Transactions.tsx`**:
     - **Tab 1: 🛒 POS Sales & Receipts**: Complete sales registry with expandable line items, refunds, voids, and reprint capabilities.
     - **Tab 2: ⚡ E-Wallet & Bills Center**: Cross-channel ledger displaying all standalone and mirrored E-Wallet, Bills Payment, and E-Load records.
   - Real-time filtering across Channels (All, GCash, Maya, MariBank, Bills & Load) and Types (Cash In, Cash Out, Bills Payment).
   - Direct 1-click thermal reprinting and system print dialog access directly from the master Transactions ledger.
   - **Delete / Void Action with Confirmation Modal (`DeleteEwalletModal`)**: Cashiers and store owners can safely delete or void E-Wallet or Bills Payment records with a dedicated confirmation modal detailing Channel & Type, Date & Time, Customer, Phone/Account No, Reference No, Principal Amount, Convenience Fee, and Total Handled. Atomically synchronizes deletion across SQLite `ewallet_transactions` and localStorage `tinda_bills_load_records`.

## Key Features in v2.1.5 (Printable Inventory Sheets Search & Cloud Analytics Calendar Edition)
1. **Interactive Real-Time Item & Letter Search for Printable Inventory Sheets (`InventoryPrintModal.tsx`)**:
   - Integrated real-time search input with glassmorphism styling, `Search` icon, autofocus, and 1-click `✕` clear button across all inventory print types (Stock on Hand, Physical Count Sheet, Price List, Reorder/Low Stock).
   - Real-time case-insensitive substring matching against product `name`, `sku`, `barcode`, `category_name`, and `description` (e.g. typing "elbow" filters specifically for PVC elbow fittings).
   - Reactive match indicator: `Ready to print: X product items (matching "elbow")` and zero-match warning banner.
   - Dynamic document generation: automatically injects `Filter: "elbow" • X Products` in the printed report header and recalculates `totalVal` exclusively for filtered items (`Total Inventory Value (Filtered): ₱...`).
2. **Cloud Owner Dashboard Custom Date Picker & Historical Sales Parity (`OverviewPage.tsx`, `BranchDetailPage.tsx`)**:
   - Upgraded `OverviewPage.tsx` with a 5th Segmented button `📅 Custom` and Apple glassmorphism `custom-date-strip` (`From` and `To` native `<input type="date">` inputs, Apply button, and Active date indicator).
   - Upgraded `BranchDetailPage.tsx` with symmetrical Date Filter Bar (Today, Yesterday, Last 7 Days, This Month, Custom Date) so store owners can drill into any historical date window without returning to Overview.
   - Fixed `LIMIT 100` sales list truncation: added backend `periodFinancials` SQL aggregate query in `tinda-sync` Cloudflare D1 worker for mathematically exact revenue, payment method totals, and counts across arbitrary date ranges.
   - Raised individual sales query limit from 100 to 300 rows and normalized timezone fallback to `Asia/Manila`.
3. **SQLite Double-Timezone Roll-Over Fix (`ewallet.ts`)**:
   - Fixed 4:00 PM (16:00 UTC+8) date rollover bug in SQLite: replaced `date(created_at, 'localtime')` with `substr(created_at, 1, 10)` because `created_at` timestamps were already recorded in local time, preventing double shift into the next day.

## Key Features in v2.1.4 (1-Tap QR Code Auto-Pair & Background Auto-Sync Loop Edition)
1. **1-Tap Mobile Phone Pairing & Auto-Connect Modal (`Settings.tsx`)**:
   - Integrated a dedicated high-contrast QR Code pairing modal rendered with `@zxing/library` (`BrowserQRCodeSvgWriter`).
   - Store owners and cashiers scan the QR code using any iPhone Camera or Android QR Scanner; it automatically opens `https://tinda-owner-dashboard.pages.dev/?sid=...&key=...&name=...` and pairs the store terminal with zero manual typing or credential entry.
   - Added 1-click **"📋 Copy Setup Link for Messenger / SMS"** button to send direct pairing links to store owners.
   - Added **"🌐 Open Pre-Paired on this PC"** button for instant one-click dashboard launch.
2. **Autonomous Background Auto-Sync Engine (`cloudSync.ts`, `main/index.ts`)**:
   - Added startup backfill timer (pushes recent sales after 4s grace period on app launch).
   - Added continuous 3-minute recurring background sync loop so sales and shifts stream live to Cloudflare D1 without requiring cashier intervention or manual "Sync Now" button clicks.
3. **Multi-Owner D1 Branch Resolution (`store_owners` table & `tinda-sync` worker)**:
   - Added `store_owners` linking table supporting multi-account access per branch (e.g. `mary grace flor` and `adamgrace123` for Adamgrace Minimart).
   - Fully resolved zero-branch and zero-sales visibility for Ma'am Grace.

## Key Features in v2.1.3 (CT221B Barcode Instant-Scan & High-Contrast Font Edition)
1. **CT221B Instant-Scan Barcode Geometry Upgrade (`barcodeSvg.ts`, `PriceTagPrintModal.tsx`, `printing.ts`)**:
   - Root cause: Barcode vertical bar height (`barHeight`) was previously only 22px–30px. When rendered within labels, the browser's viewBox scale factor (~0.42x) shrunk bars down to only ~3.3mm physical height. Optical scanners require a wider laser/sensor sweep angle, causing partial decode rejections and slow detection.
   - Fix: `barHeight` increased by **+100% to +126%** (from 22/30px to **42px** on compact tags and **60px** on standard tags; total SVG height increased to 55px/78px). Physical printed bars now reach ~7.5mm–9.0mm, allowing instant 1st-pass omnidirectional laser and CCD scan detection.
   - `quietZone` tuned from 14 modules to **10 modules** (ISO 15416 compliant standard minimum). Trimming 8 modules cuts SVG coordinate width by ~22px, reducing horizontal scale-down compression by ~10% and yielding wider physical modules on paper.
2. **High-Contrast Bold Thermal Font & Anti-Hairline Stroke Shield (`barcodeSvg.ts`, `PriceTagPrintModal.tsx`)**:
   - Root cause: Human-readable text beneath the barcode previously used `Courier` serif monospace at 7.5px–9.0px. After scale-down on a 203 DPI thermal print head (8 dots/mm), this shrunk to ~2.85pt with hairline stems that direct thermal heads dropped to gray/white, causing "nipis" / faint text.
   - Fix: Switched font stack to high-density bold sans/tabular monospace (`Consolas, 'Roboto Mono', 'Courier New', Arial, sans-serif`) with `font-weight: 900` (heavy/black) and `letter-spacing: 1.5px`.
   - Added SVG vector stroke shield: `stroke="#000000" stroke-width="0.5" paint-order="stroke fill"`, guaranteeing solid, dense, jet-black thermal burns with zero hairline dropouts.
   - Increased font size in SVG coordinate space: compact labels raised from 7.5px to **12px**, standard labels raised from 9px to **13px** (default 13px in `barcodeSvg.ts`), yielding crisp, legible ~5.5pt physical text.

## Key Features in v2.1.2 (CT221B Barcode Scanability & Cloud Sync Precision Edition)
1. **CT221B Barcode Scanability Fix (`barcodeSvg.ts`, `PriceTagPrintModal.tsx`, `printing.ts`)**:
   - Root cause: `barWidth` was 1.5–1.8px per module — too thin for CT221B thermal burn head, causing adjacent bars to merge into solid unreadable blocks.
   - Fix: `barWidth` raised to **2.5px** (compact ≤30mm labels) and **2.8px** (standard labels). Global default in `barcodeSvg.ts` raised from 1.8 → 2.5px.
   - `quietZone` raised from 10–12 → **14 modules** (ISO 15416 compliance: ≥10× narrowest bar width as quiet zone).
   - SVG CSS: removed `max-width: 98%` scaling constraint that further compressed bars before printing; now uses `width: auto; overflow: visible`.
   - `printLabelTest` updated to same params (2.8px / 14 modules) for accurate test prints.
2. **Cloud Sync Verified Push & Store ID Case Normalization (`cloudSync.ts`)**:
   - Store auto-registration on Cloudflare D1 with ping health verification.
   - Case-insensitive store ID normalization eliminating multi-store credential mismatches.
   - Verified push backfill counter for up to 50 recent sales on manual `syncNow`.

## Key Features in v2.1.0 (Proportional Refund Immunity, Migration 15, Net COGS & Cash Drawer Kick Edition)
1. **Prorated Refund Discount Invariant (`transaction.ts`)**:
   - Refunding discounted items (e.g., Senior Citizen, PWD, bundle promos) now prorates discounts proportionally based on net revenue paid, stopping cash drawer leakage.
2. **Net Landed Cost COGS Absorption (`purchases.ts`)**:
   - Purchase invoices now factor compounding trade discounts into catalog unit costs, ensuring profit margins and COGS reflect true acquisition costs.
3. **Migration 15 & Foreign Key Indexes (`migrations.ts`, `canonical.ts`)**:
   - Added 10 composite indexes across SQLite tables for sub-millisecond query performance.
   - Added `product_recipes`, `ewallet_transactions`, and `ewallet_audits` to `CANONICAL_TABLES` to eliminate backup restore foreign key collisions.
4. **Cash Drawer Kick & Thermal Printer Feed (`printing.ts`, `receiptHtml.ts`)**:
   - Exposed `window.api.printer.kickCashDrawer()` across IPC/preload.
   - Widened default tear-bar feed spacer to 5 lines (19mm) and fixed `flex-shrink: 0` CSS on narrow 58mm paper.
5. **Dashboard 100k Transaction Limit (`dashboard.ts`)**:
   - Removed the silent 50-item cutoff in `dashboardStats`, ensuring 100% daily sales and profit aggregation accuracy for high-volume stores.


## Key Features in v2.0.9 (Purchase Invoices History Immunity & Self-Healing Migration Fix Edition)
1. **Invoices History Immunity & Self-Healing Database Engine (`purchases.ts`, `migrations.ts`)**:
   - Fixed the `SqliteError: no such column: invoice_no` and missing table error when opening or clicking the Invoices History tab on existing databases.
   - Defer index creation until after `ALTER TABLE` column migrations have successfully executed.
   - Added self-healing `ensurePurchasesTables` that guarantees `purchases`, `purchase_items`, `suppliers`, `users`, and `products` are safely present with all schema columns prior to any query execution.
   - Hardened `shortDate` in `@shared/format.ts` to be 100% resilient against `null`, `undefined`, empty string, and malformed dates.
   - Added defensive array fallback in `PurchaseInvoiceModal.tsx` (`setHistoryList(Array.isArray(res?.rows) ? res.rows : [])`).

## Key Features in v2.0.8 (Multi-Packaging Units & Supplier Cascading Trade Discounts "Less 5 Less 5" Edition)
1. **Multi-Packaging Wholesale Units Support (`PurchaseInvoiceModal.tsx`, `STANDARD_PACKAGING_UNITS`)**:
   - Expanded Purchase Invoice Unit selector to support standard wholesale packaging: `PCS` (x1), `PACK` (x10), `BUNDLE` (x10), `ROLL` (x1), `BOX` (x24), `CASE` (x24), `DOZEN` (x12), `SACK` (x50), `CAN` (x1), `BOTTLE` (x1), `KILO` (x1), and custom units with configurable conversion rates.
   - Added dedicated `Pcs/Unit` multiplier input: lets merchants customize the exact conversion rate per delivery (e.g. 1 bundle = 10 pcs, 1 box = 24 pcs, 1 sack = 50 kg).
   - Live visual stock increment strip: displays `5 BOX × 24 = +120 pcs (automatically added to inventory stock on post)`.
2. **Supplier Cascading / Series Trade Discounts Engine ("Less 5 Less 5") (`supplierDiscount.ts`, `PurchaseInvoiceModal.tsx`)**:
   - Implemented real-world compounded Philippine FMCG/distributor trade discount calculations matching SAP/NetSuite/distributor ERP systems.
   - Supports any distributor billing string format: `*-5%-5%-5%`, `5+5+5`, `10+5`, `10/5`, `-10%-5%`, single percent `5%`, and flat pesos `₱50`.
   - Computes deterministic integer-cent discounts sequentially: $\text{Gross} \times (1 - d_1) \times (1 - d_2) \dots (1 - d_n)$ (e.g. ₱1,000 with `5+5+5` yields ₱142.63 discount, Net ₱857.37).
   - Live discount breakdown strip in Fast Item Entry: shows gross, discount amount, net amount, and effective percentage.
   - Line items table displays Gross Cost, Trade Discount formula with amount, Net Cost, and Net Subtotal.
   - Bottom summary discount accepts cascading formulas and displays real-time calculated deductions.
   - Automatically computes true Net Unit Cost per piece and updates catalog purchase cost when posting.

## Key Features in v2.0.7 (Daily E-Wallet Totals Hub, Loyverse-Style Promo Bundles & Composite Inventory Combiner Edition)
1. **Daily E-Wallet & Bills Reconciliation Totals (`EwalletAudit.tsx`, `ewallet.ts`)**:
   - Resolved multi-day continuous accumulation issue: E-Wallet Cash In / Out and Bills Payment shift summaries now strictly default to **Daily (Today)** starting at 12:00 AM local time.
   - Integrated an Apple Cupertino Date Period Bar (`Today (Daily)`, `Yesterday`, `Last 7 Days`, `This Month`, `Custom Date`, `All Time`) with real-time reactive summaries across Cash In/Out, Bills & E-Load, Transactions, and 3-Way Audit sheets.
2. **Loyverse-Style Promo Bundles & Composite Inventory Combiner (`PromoBundlesModal.tsx`, `RecipeModal.tsx`, `products.ts`, `promoBundles.ts`, `Inventory.tsx`, `POS.tsx`)**:
   - Input individual items into Inventory first, then combine them directly into Promo Bundles or Composite BOM recipes.
   - Dynamic real-time bundle stock monitoring: Available bundle stock is dynamically derived from limiting component inventory (`min(floor(component_stock / required_qty))`).
   - Integrated live Inventory product picker, component stock preview, combined regular price, roll-up cost, and customer savings calculation.
   - Added direct **Promo Bundles** launcher button right inside the Inventory header and Quick Filter bar.
   - Automatic recursive component stock deduction upon checkout with seamless POS cart promo discount application.

## Key Features in v2.0.6 (Supplier Purchase Invoice Receiving Hub, Item-by-Item Sales Analytics, Attendance/Payroll & Obra Superpowers v7.0.0 Edition)
1. **Supplier Purchase Invoice & Batch Stock-In Receiving Hub (`PurchaseInvoiceModal.tsx`, `purchases.ts`, Migration 19)**:
   - Full wholesale/retail Supplier Purchase Invoice window matching classic receiving workflows (`Receipt No.`, `Invoice No. / Trans #`, `Supplier` & `Address`, `Invoice Date`, `Paid` checkbox, `Terms (Days)`, and `Memo / Delivery Notes`).
   - Ergonomic Fast Item Entry Bar with `F1` search/barcode scan, unit selector (Box/Case/Pcs with automatic `conversionToBase` multiplier), supplier unit cost, and `F2` / `Enter` in the Quantity box to immediately commit items into the invoice grid.
   - Multi-item receiving grid (`# | Item Code | Description | Unit | Qty | Base Stock | Price/Cost | Amount`) with `F3` remove last item, `Update Product Catalog Cost` toggle, `Gross Total`, `Discount (₱)`, `Net Payable`, and `Ctrl+S` one-tap posting that atomically increments inventory stock, updates purchase costs, and records full audit logs (`STOCK_MOVEMENTS` & `PURCHASES`).
2. **Item-by-Item Sales Breakdown & Profit Analytics (`Reports.tsx`, `reporting.ts`)**:
   - Dedicated **Item Sales** tab in Reports & Analytics showing per-product quantity sold, transaction count, gross sales, cost of goods sold (COGS), net profit, and profit margin % across any date range.
   - Search filter, category filter, top-column sorting, and 1-tap CSV export for store owners and accountants.
3. **Cashier Time-In / Time-Out Attendance & Automated Payroll Engine (`Shifts.tsx`, `attendance.ts`, Migration 18)**:
   - Integrated Attendance & Payroll hub in Shifts & Cash with 1-tap Time-In / Time-Out clock, hourly rate configuration, overtime/deduction adjustments, and printable payroll summary slips.
4. **Customer Credit Limits, Expiry Date Tracking & Physical Stock Take Hub (`StockTakeModal.tsx`)**:
   - Customer credit limit enforcement (`credit_limit_c`) in Customers & Utang and POS Checkout.
   - Product expiration date (`expiry_date`) badges and alerts in Inventory & Catalog.
   - Interactive Physical Stock Take (`StockTakeModal.tsx`) for batch variance reconciliation.

## Key Features in v2.0.1 (Major Release: Resilient POS Immunity, Rush ID Studio, & Cupertino Showcase Carousel Edition)
1. **Interactive Apple Cupertino Feature Showcase Carousel Banner (`FeatureCarouselBanner.tsx`)**:
   - Integrated a fluid sliding announcement banner on the Dashboard with Apple design standards (fluid horizontal slides, tactile pagination dots, left/right navigation controls, and subtle glow gradients).
   - Auto-rotates smoothly every 6 seconds, automatically pauses on mouse hover, and features 1-tap direct action buttons (POS, Rush ID, Print Studio, Utang Ledger, CFD Hub, F3 Calculator).
   - Discreet collapse/expand toggle storing preference in `localStorage` (`tinda_feature_banner_collapsed_v2`), ensuring cashiers are never distracted during rapid checkouts.
2. **Bulletproof POS Checkout Immunity against "Product Not Found" Crashes**:
   - Completely resolved remote checkout crashes (`Error invoking remote method 'pos:checkout': Product not found`).
   - Items with missing, deleted, or un-synced inventory records are gracefully converted into custom line items so transactions are never blocked at the cashier counter.
   - Guarded composite bundle stock reductions with try-catch blocks to prevent recipe desyncs from halting checkout.
   - Sanitized input parameters so `product_id` is strictly positive integers or `null`.
3. **Dedicated Rush ID Studio Packages & Fast POS Speed Key**:
   - Added official **Rush ID Package (4x 1x1 + 2x 2x2 + 2x Passport)** (₱75.00) in `PrintingHub.tsx` with high-gloss photo cut specs and rush turnaround badge.
   - Added **Rush ID + Lamination Combo (8x 1x1 + 4x 2x2 + Pouch)** (₱95.00) for all-in-one rush photo and badge jobs.
   - Added 1-tap **Rush ID Package** (`📸 ₱75.00`) to POS Quick Speed Keys for instantaneous cart addition.
4. **Complete Standalone Desktop Installer & Live Feature Patch Delivery**:
   - Full production NSIS installer (`TindaPOS-Setup-2.0.1.exe`) and portable standalone executable (`TindaPOS-Portable-2.0.1.exe`).
   - Instant in-app live hot patch (`TindaPOS-Feature-Patch-2.0.1.zip`).

## Key Features in v1.0.101 (Resilient POS Checkout Immunity & Rush ID Package Edition)
1. **Bulletproof POS Checkout Immunity against "Product Not Found" Crashes**:
   - Resolved the remote checkout error (`Error invoking remote method 'pos:checkout': Product not found.`) by adding safe product resolution fallbacks in `buildLines` and `checkout`.
   - Items with missing, deleted, or un-synced inventory records are gracefully converted into custom line items so transactions are never blocked at the cashier counter.
   - Component stock reduction loops for `COMPOSITE` bundles/recipes are guarded with try-catch blocks to prevent recipe desyncs from halting checkout.
   - Input schema validation now sanitizes `product_id` to strictly positive integers or `null`, neutralizing invalid string/NaN parameters.
2. **Dedicated Rush ID Studio Packages & Fast POS Speed Key**:
   - Added official **Rush ID Package (4x 1x1 + 2x 2x2 + 2x Passport)** (₱75.00) in `PrintingHub.tsx` with high-gloss photo cut specs and rush turnaround badge.
   - Added **Rush ID + Lamination Combo (8x 1x1 + 4x 2x2 + Pouch)** (₱95.00) for all-in-one rush photo and badge jobs.
   - Added 1-tap **Rush ID Package** (`📸 ₱75.00`) to POS Quick Speed Keys for instantaneous cart addition.

## Key Features in v1.0.100 (Printer Studio Dual-Store Persistence & Resilient Settings Edition)
1. **Printer & Receipt Customization Dual-Store Persistence (`localStorage` + SQLite Settings)**:
   - Fixed configuration reverting to defaults by implementing the proven dual-store engine (`tinda_printer_customization_v1`) across `useSettings` Zustand store and `PrinterStudioModal`.
   - SQLite `getSettings` now preserves and dynamically type-casts all database keys, ensuring custom parameters (`receipt_offset_left_mm`, `receipt_feed_lines_end`, `label_offset_x_mm`, etc.) are never stripped even on un-restarted Electron main processes.
2. **Instant Cross-Component Live Sync (`tinda-printer-config-changed`)**:
   - 0ms reactive synchronization between `PrinterStudioModal`, `PriceTagPrintModal`, `ReceiptPaper`, and `Settings.tsx`.
   - On-screen receipt previews in `ReceiptPaper.tsx` immediately reflect customized margins, typography scale, line spacing, and cutter spacers.
3. **Receipt Builder & Thermal Print Engine Parity**:
   - `buildReceiptLines` and `printSale` now fully honor `receipt_custom_header`, `receipt_custom_footer`, `receipt_show_cashier`, `receipt_show_customer`, and `receipt_show_change_breakdown`.
4. **Self-Healing State & Robust Factory Reset**:
   - `reconcilePrinterCustomization` seamlessly prioritizes explicit settings, recovers missing fields from local storage, self-heals local cache, and provides safe factory reset presets.

## Key Features in v1.0.99 (Chiteng & Receipt Studio, Dual CFD Hub, Utang Reminders & Resilient Calculator Edition)
1. **TINDA Print Master Studio & Chiteng CT221B Manual Alignment Customizer**:
   - Universal dual-tab calibration studio for Receipts (58mm/80mm) and Barcode Labels (Chiteng CT221B).
   - Real-time 1:1 canvas previews, tactile stepper sliders, left offset indentation (`receipt_offset_left_mm`, fixes first-letter clipping), cutter feed spacer (`receipt_feed_lines_end`), line spacing, and ultraBlack burn mode.
   - 1-tap manual Windows print dialog fallback bypassing stuck spooler ports.
2. **Customer Facing Display (CFD) Mirroring for Bills Payment & E-Wallet Hubs**:
   - Real-time secondary display for Bills Payment (biller icon/name, customer details, payment breakdown).
   - Real-time secondary display for E-Wallet Cash In / Out (GCash, Maya, MariBank badges, dynamic amount, dynamic scannable QR code SVG, and live transaction completion state).
3. **Utang Notes, Collection Due Date Reminders & Proactive Cashier Notifications**:
   - Dual-store persistent reminder notes engine (`localStorage` + SQLite `notes` metadata).
   - Overdue and Due Today statistics, banner alerts, filter tab in Utang ledger, calendar picker presets (`Today`, `+3d`, `+7d`, `+15d`, `Month End`), promise note recording, and automatic alert in POS Checkout and Customer Picker.
4. **Resilient Cashier Quick Calculator & F3 Shortcut Harmony**:
   - Zero-eval Shunting-Yard arithmetic engine (100% immune to JS octal syntax errors, trailing operator crashes, and division by zero).
   - Input focus isolation, `resetOnNext` clean number entry, `%` (Percent) calculation button, polished change / sukli calculation.
   - Hotkey shield in `POS.tsx` blocking background `Enter` ("Out of stock" error toast eliminated!), `/`, and arrow keys while calculator is open.
   - Global `F3` shortcut handler across all app screens with Chromium Find bar prevention.

## Key Features in v1.0.94 (Chiteng CT221B Thermal Spooler & Resilient Auto-Update Edition)
1. **Chiteng CT221B Thermal Hardware Spooler & Direct Monochrome Standard**:
   - Switched label print jobs to strict direct thermal monochrome (`color: false`) and 203 DPI native rasterization (`dpi: { horizontal: 203, vertical: 203 }`), eliminating color conversions that cause thermal printer drivers to reject print jobs.
   - Extended Windows Print Spooler delay buffer before window destruction from 600ms to 2,500ms, ensuring Windows finishes streaming raw EMF/GDI commands to the USB printer port before the temporary webContents is torn down.
   - Auto-target resolution: Automatically detects connected label printers and routes jobs specifically to the label device instead of falling back to default office/inkjet printers.
   - Intelligent driver detection guidance & manual print fallback: When no dedicated label printer driver is configured in Windows, the studio displays a clear Cupertino notice with official PC driver links (`www.claiot.com`) and automatically routes to the Windows System Print Dialog so merchants can pick their printer directly without silent failures.
   - Expanded keyword match engine in `LABEL_PRINTER_KEYWORD_REGEX` supporting Chinese and English driver variants (`ct221b`, `clabel`, `chiteng`, `驰腾`, `dudian`, `度点`, `pos-label`, etc.).
2. **Resilient Auto-Update Engine (Zero Network Drops & Anti-Lock Windows Shield)**:
   - Extended request timeout thresholds (30s connect timeout, 60s idle chunk timeout) with a 3-attempt exponential backoff retry loop (`retryOperation`) for slow or jittery mobile/prepaid store connections.
   - Expanded CDN origin allowlist to include official Azure Blob storage (`*.blob.core.windows.net`) and Fastly CDN edges used by GitHub Releases, eliminating "unexpected update source" errors on asset redirects.
   - Integrated Windows file-lock retry shield (`safeRmDirWithRetry` and `safeRenameWithRetry` with 5 attempts and 200ms delay) to prevent `EBUSY` / `EPERM` crashes when Windows Defender or search indexing scans freshly extracted patches.
   - Gentle Cupertino update error state with direct manual download links to GitHub Releases.

## Key Features in v1.0.93 (Comprehensive Master Full Desktop Release Edition)
1. **Full Windows Desktop Application Compilation (`Setup.exe` & `Portable.exe`)**:
   - Complete standalone production compilation bundling Electron runtime, native Better-SQLite3 binary bindings, and optimized client bundle into standard NSIS installer and zero-install portable executable.
   - Built with high-security NSIS installer (`allowToChangeInstallationDirectory`, Desktop & Start Menu shortcuts, zero AppData data deletion on uninstall).
2. **All Latest Innovations Bundled into Native Base Executable**:
   - Includes v1.0.92 resilient pinned categories dual-store engine (`localStorage` + SQLite settings sync, universal `parsePinnedCategoryIds` parser, 0ms cross-component event sync, search auto-clear).
   - Includes v1.0.91 Chiteng CT221B portable thermal barcode & label printer plug-and-play auto-detection, pure vector Code 128 (Subset B) barcode engine, Cupertino label studio, and dual-printer separation.
   - Includes v1.0.90 Pinned Package & Bundle category chips on POS, visual category customization hub (custom emojis & Cupertino color themes), and dashboard bundle shortcuts.
   - Includes v1.0.89 Line-item price editing for credit sales, permanent utang ledger mistake purger, and sign/color standards.
   - Includes v1.0.87 Split/Mixed payment POS engine across Cash, GCash, Maya, MariBank, and Utang.
3. **Multi-Track Delivery & Zero Downtime**:
   - Available as full Windows NSIS installer (`TindaPOS-Setup-1.0.93.exe`), standalone single-file portable (`TindaPOS-Portable-1.0.93.exe`), and live instant feature patch (`TindaPOS-Feature-Patch-1.0.93.zip`).

## Key Features in v1.0.92 (Resilient Pinned Categories Dual-Store & Live Visibility Repair Edition)
1. **Root-Cause Pinned Categories Visibility & Array Parser Repair**:
   - Resolved the issue where pinned categories were invisible ("dili makita ang gi pin") caused by SQLite storing numeric or comma-delimited values (e.g. `'8'`) that were dropped by strict `Array.isArray` checks.
   - Built a universal `parsePinnedCategoryIds` engine that handles JSON arrays, raw numeric strings, single numbers, and comma-delimited sequences safely.
2. **Client-Side Dual-Store Persistence Engine (`localStorage` + SQLite Settings)**:
   - Synchronous, zero-latency persistence in `localStorage` (`tinda_pinned_categories_v1`) coupled with background SQLite synchronization.
   - Eliminates state loss during in-app hot-patch updates on un-restarted Electron base apps.
3. **Cross-Component Real-Time Event Sync (`tinda-pinned-categories-changed`)**:
   - Instant 0ms broadcast across `PinnedCategoriesBar`, `POS.tsx` dropdown, `CustomizeCategoriesModal`, and `Dashboard.tsx`.
   - Category chips, dropdown pin icons, and dashboard cards update concurrently within the exact same frame.
4. **Resilient Type-Coerced Number Comparison**:
   - Replaced fragile strict equality checks (`c.id === id`) with universal numeric matching (`Number(c.id) === Number(id)`), ensuring items are never filtered out due to string/number serialization mismatches.
5. **Ergonomic Category Filtering & Search Auto-Clear**:
   - Clicking a category chip now resets the search bar (`setQ('')`), ensuring products in the selected category are immediately displayed rather than colliding with lingering search text.
   - Clicking an active pinned category chip toggles back to 'All Items' for fluid navigation.

## Key Features in v1.0.91 (Chiteng CT221B Barcode & Thermal Label Printer Edition)
1. **Chiteng / Clabel CT221B Auto-Detection (Plug & Play)**:
   - Intelligent hardware detection for `CT221B`, `Chiteng`, `Clabel`, and `Dudian` devices via USB/Bluetooth.
   - Distinct green status badge `🟢 Chiteng CT221B Ready` in print studio and hardware settings.
2. **True Scannable 1D Barcode Vector Engine (Code 128 SVG)**:
   - Built-in zero-dependency Code 128 (Subset B) vector SVG generator replacing static monospace text with true black-and-white scannable bars.
   - Guaranteed 0.05-second laser scanner gun and mobile companion camera auto-capture on printed labels.
3. **Apple Cupertino Label & Barcode Studio (`PriceTagPrintModal.tsx`)**:
   - Real-time interactive sticker preview accurately reflecting aspect ratio and layout.
   - Presets for popular CT221B thermal sticker roll sizes: `40×30 mm` (Standard Retail), `50×30 mm` (Wide Shelf), `30×20 mm` (Micro Grocery), `40×20 mm` (Slim Tag), and Custom mm.
   - 1-tap "Match Stock Quantity" batch accelerator (e.g. print 15 stickers for 15 in stock).
   - Dual-print actions: "Print on CT221B (Direct Silent USB)" and "Print Dialog (Manual)".
4. **Dual Printer Separation in Settings (`Settings.tsx`)**:
   - Independent configuration for Receipt Printer (58mm/80mm) vs. Barcode & Label Printer (CT221B), preventing cross-printing between checkout slips and sticker tags.
   - 1-tap "Test Print CT221B Sticker" alignment test button.
5. **Zero-Database Risk & Instant Live Patch Standard**:
   - Uses non-breaking settings key-value additions (`label_printer`, `label_paper_size`).
   - Delivered as live hot-patch (`npm run publish:patch`).

## Key Features in v1.0.90 (Pinned Package & Bundle Category Hub Edition)
1. **Pinned Package & Bundle Categories on POS Screen**:
   - Integrated a fluid horizontal Apple Cupertino pinned categories bar above the product grid.
   - 1-tap filtering for rapid checkout of fast-moving packages, value combos, and promo bundles.
   - Dynamic real-time product counters per pinned chip and pulsing bundle indicators.
2. **Dashboard Quick Bundles & Pinned Categories Hub**:
   - Added dedicated "Quick Bundles & Pinned Categories" Cupertino Card on the Dashboard showing active pinned categories with live catalog item counts.
   - 1-tap "Sell in POS →" direct navigation automatically switches to POS mode and pre-selects the filtered category.
3. **Full Category Customization Hub (`CustomizeCategoriesModal.tsx`)**:
   - Merchants can fully customize category visuals with custom emojis (📦, 🎁, 🛍️, 🍔, 🥤, 🍿, 🥫, ⚡, 🔥, 🏷️, etc.) and Cupertino badge accent themes (Indigo, Emerald, Amber, Rose, Cyan, Violet, Slate).
   - Seamless 1-tap Pin/Unpin toggles directly inside category list and POS dropdown.
   - In-app category creation with instant icon/color assignment.
4. **Zero-Database Risk & Instant Live Patch Standard**:
   - Leverages existing `pos_pinned_categories` setting and persistent local storage for visuals.
   - Zero migrations, zero schema changes, and 100% hot-patch compatible (`npm run publish:patch`).

## Key Features in v1.0.89 (Line-Item Price Editing & Permanent Utang Mistake Cleaner Edition)
1. **Line-Item Price Editing for Credit Sales (Items Taken on Credit)**:
   - Added an interactive Cupertino **Edit Item Price** (`Pencil`) button beside every item in the expanded credit sale items list.
   - Cashiers and store owners can directly adjust the unit price of items taken on credit (e.g. suki discounts, price corrections).
   - Real-time Cupertino calculation HUD displays the new line subtotal and the exact customer utang balance impact (green deduction or red addition).
   - Automatically synchronizes customer debt and updates sale line items with persistent local backup.
2. **Permanent Client-Side Purge & Intelligent Mistake Cleaner**:
   - Resolved the issue where deleting a mistake row resulted in an `ADJUSTMENT` row in the ledger.
   - Deleting an entry now marks it in a persistent purge set (`localStorage`), immediately and permanently removing it from the customer's ledger view.
   - Internal rebalance events (`[AUDIT_REBALANCE]`, `[SYSTEM_SYNC]`, and offset rows) are automatically filtered from the customer statement view, keeping records 100% clean and professional.
   - Top-of-modal **Clean Mistake Rows** banner detects voided mistake pairs (e.g. ₱34,555.00) and purges them with 1 tap, automatically restoring the customer's true verified balance (₱325,065.00).
3. **Accurate Color & Sign Standards in Utang Ledger**:
   - Deductions from customer debt (Payments, Reversals, Refunds) strictly render with minus sign (`−`) in emerald green (`text-emerald-400`).
   - Additions to customer debt (Credit Sales) strictly render with plus sign (`+`) in rose red (`text-rose-400`).
4. **Resilient Dual-Track Operation Guarantee**:
   - Works seamlessly across live in-app hot patches (`npm run publish:patch`) on existing client installs with zero database alterations and zero regressions.

## Key Features in v1.0.88 (Resilient Utang Ledger Repair & Direct Balance Correction Edition)
1. **Resilient Ledger Offset Fallback & Zero-Error Hot-Patch Guarantee**:
   - Fixed `window.api.customers.deleteledgerEntry is not a function` error during live hot-patch updates on older base app installations.
   - Implemented an automatic universal ledger offset fallback: if native IPC is missing from an un-restarted Electron base app, deleting an entry automatically offsets the financial impact using universal `customers.adjust` and `customers.revoke` without crashing.
   - Added `deleteledgerEntry` lowercase alias to `shared/ipc.ts` and `preload/index.ts` to prevent any casing discrepancies.
2. **Interactive 1-Tap "Set Exact Balance" Tool in Utang Modal**:
   - Added a dedicated Cupertino **Set / Fix Balance** (`Pencil`) button in the customer Balance status card.
   - Allows store owners and cashiers to directly set the customer's total outstanding credit to their exact verified figure (e.g. ₱325,065.00), automatically logging the difference as an audited balance correction.
3. **Resilient Frontend Balance Recalculation Engine**:
   - `Sync Balance` (`RotateCcw`) automatically replays all chronological ledger entries in the frontend if native IPC is not exposed, calculating running debt and synchronizing `customers.balance_c` seamlessly.
4. **Maintained Split Mixed Payment POS Engine & Root-Cause Double Reversal Fix**:
   - Preserved full Apple-grade Split / Mixed Payment checkout engine across Cash, GCash, Maya, MariBank, and Utang.
   - Preserved transaction void-check guard preventing duplicate utang deductions on transaction deletion.

## Key Features in v1.0.87 (Split Mixed Payment & Utang Ledger Repair Edition)
1. **Root-Cause Utang Double-Reversal Fix**:
   - Fixed `deleteTransaction` in `transaction.ts` to strictly check `sale.status !== 'VOIDED'` before reversing customer utang credit ledger.
   - Completely prevents deleting an already-voided credit transaction from applying a duplicate reversal, resolving the customer balance corruption reported by merchants.
2. **Interactive Utang Ledger Entry Deletion & One-Tap Balance Re-Sync Engine**:
   - Added individual row delete button (`Trash2`) on every ledger activity row in the Utang modal (`LedgerEntryRow`) with an Apple-grade Cupertino confirmation modal.
   - Backend `deleteCreditLedgerEntry` purges the ledger row and replays remaining chronological credit events (`recalculateCustomerBalance`), resetting running audit balances and restoring the accurate customer balance.
   - Added a 1-tap **Sync Balance** (`RotateCcw`) button directly on the Balance status card in `LedgerModal` to recalculate customer balance instantly from historical ledger records.
3. **Apple-Grade Split / Mixed Payment POS Checkout Engine**:
   - Integrated a fluid Cupertino mode switcher in `CheckoutModal`: `[ Single Payment ] [ 🔀 Split / Mixed Payment ]`.
   - Allows cashiers to seamlessly allocate multi-method payment distributions across 💵 Cash, 📱 GCash, 📱 Maya, 🏛️ MariBank, and 👛 Utang (Credit).
   - Real-time reconciliation HUD displaying Total Due, Total Allocated, Remaining Due / Over-allocation, and live Cash Sukli (Change) calculation when larger bills are tendered.
   - 1-tap **Fill Remaining** accelerators per payment method for ultra-rapid split transactions.
   - 100% full parity across thermal receipts, dual-screen CFD displays, shift X/Z read reports, and real-time Sales Monitor.
4. **Zero-Database Risk & Instant In-App Live Patch Standard**:
   - Zero database table alterations required (`payments` table already natively stores multi-method entries per sale).
   - Released as live feature patch (`npm run publish:patch`) in <10 seconds.

## Key Features in v1.0.86 (MariBank Checkout Integration & Fast Feature Patch Edition)
1. **5-Payment Method Apple Cupertino Grid in Checkout Modal**:
   - Expanded Checkout Modal from `max-w-md` (448px) to `max-w-lg` (512px) with 5-column button grid (`grid-cols-5 gap-1.5`).
   - Integrated **MariBank** with distinct Shopee/SeaBank vibrant orange identity (`#FF6A00` border, `#FF8533` text, `Landmark` icon, and glow shadow), alongside Cash, GCash, Maya, and Utang.
2. **Ergonomic Hotkeys & 1-Tap Workflow Accelerators**:
   - Cart Screen: `F12` hotkey immediately opens Checkout with MariBank pre-selected and autofocuses reference number input (`F9` Cash, `F10` GCash, `F11` Maya, `F12` MariBank).
   - Modal Screen: `F12` switches active method to MariBank and focuses the reference field.
   - Enter key executes instant charge (`Charge ₱... (Enter)`).
3. **Dedicated MariBank Reference Input & Customer Facing Display (CFD)**:
   - Dynamic label `MariBank Reference No. / Transaction ID` with sub-badge `Shopee / SeaBank Transfer` and placeholder `e.g. MB-9823471 or Shopee Ref`.
   - Dual-Screen Customer Facing Display (CFD) displays `.badge-maribank` (`linear-gradient(135deg, #FF6A00, #EE4D2D)`), dynamic QR payload `maribank://pay?amount=...`, and prompt `"Scan with your MariBank App"`.
4. **Thermal Receipts, Shift X/Z Reconciliation & Sales Monitor Parity**:
   - Compact thermal receipts format `MARIBANK ₱XX.XX` with tabular numerals and reference number.
   - Shift X-Read and Z-Read reports aggregate `maribank_c` in payment breakdown and ledger totals.
   - Real-time Sales Monitor displays vibrant orange `MARIBANK` badge and includes digital bank payments in daily totals.
5. **Zero-Database Risk & Instant In-App Live Patch Standard**:
   - Zero database table alterations required (`payments.method TEXT NOT NULL` has no check constraint).
   - Released as live feature patch (`npm run publish:patch`) in <10 seconds.

## Key Features in v1.0.85 (Unified Cupertino Community Chat Minimize-to-Dock Edition)


## Key Features in v1.0.79 (Sidebar Fast Updates & Zero-Restart Live Engine Edition)
1. **Full Update Migration from Settings > About into Sidebar Hub**:
   - Completely removed `SoftwareUpdatePanel` from `Settings -> About`, streamlining the About page exclusively for store info, developer details, support, and legal links.
   - Added a dedicated **Fast Updates** navigation entry in the Sidebar under *System & Guide* with dynamic `⚡ NEW` notification badge when an update is detected.
2. **True Zero-Restart In-Place Live Patch Engine**:
   - Upgraded patch extraction and reload pipeline to preserve patches matching or exceeding the installed base version (`compareSemver > 0`), fixing false-positive deletion during patch swaps.
   - In-app hot-patch applying reloads BrowserWindow webContents in ~0.3s without terminating background Node/Electron processes, maintaining SQLite database handles, and never restarting the Windows system or closing cashier shifts.
3. **Interactive Sidebar Fast Update Center Card**:
   - 1-tap "Download Now (No Restart · 2s)" action with live percentage bar.
   - 1-tap "Apply Live (0.3s · Zero Restart)" action.
   - Clicking the version status card (`v1.0.79 · Up to date`) opens the full Cupertino Update Hub modal with manual GitHub checks, Release Notes, and Version Rollback safeguards.

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
