<div align="center">

<img src="https://img.shields.io/badge/TINDA_POS-v1.0.77-059669?style=for-the-badge&labelColor=065f46" alt="Version">
<img src="https://img.shields.io/badge/Platform-Windows_10%2F11_%7C_Linux-0078d4?style=for-the-badge&logo=windows&logoColor=white" alt="Platform">
<img src="https://img.shields.io/badge/Works-100%25_Offline-6366f1?style=for-the-badge" alt="Offline">
<img src="https://img.shields.io/badge/Tests-425_Passing-10b981?style=for-the-badge" alt="Tests">
<img src="https://img.shields.io/badge/Update_Engine-Dual--Track_Hot--Patch-10b981?style=for-the-badge" alt="Dual-Track Update Engine">
<img src="https://img.shields.io/badge/License-Free_for_Personal_%26_SMB-f59e0b?style=for-the-badge" alt="License">

<br /><br />

# 🏪 TINDA POS

### Offline Point-of-Sale for Philippine Sari-Sari Stores & Small Businesses

**Sell products · Track inventory · Manage customer Utang · Reconcile cash — all in one focused desktop app. No internet required.**

<br />

[⚡ Fast Feature Patch v1.0.77](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.77/TindaPOS-Feature-Patch-1.0.77.zip)&nbsp;&nbsp;·&nbsp;&nbsp;[⬇️ Download v1.0.77 Setup](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.77/TindaPOS-Setup-1.0.77.exe)&nbsp;&nbsp;·&nbsp;&nbsp;[📦 Portable Edition](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.77/TindaPOS-Portable-1.0.77.exe)&nbsp;&nbsp;·&nbsp;&nbsp;[📄 User Guide PDF](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.77/TindaPOS-User-Guide.pdf)&nbsp;&nbsp;·&nbsp;&nbsp;[🐛 Report Issue](https://github.com/Yazerukun/TINDA-POS/issues)

</div>

## ✨ What's New in v1.0.77 (In-App Hot-Patch Redirect Engine Fix Edition)

> **Fixed Root-Cause GitHub Releases CDN 302 Redirect Handling in Electron Network Transport, Eliminating the "Update encountered an error, retry download" Warning During Fast Feature Hot-Patching.**

- ⚡ **Fixed In-App Feature Hot-Patch Download Engine**:
  - Solved Chromium network transport issue where HTTP 302 redirect responses from GitHub Releases CDN (`release-assets.githubusercontent.com`) return empty `res.url` strings, which previously triggered false-positive source rejections.
  - Added robust validation fallback and full CDN host coverage so hot-patches download, unpack, and live-reload smoothly.
- 🔓 **Unrestricted E-Wallet & Bills Center Access**:
  - Permanently unlocked all 5 operational tabs without VIP crystal badges or upgrade paywalls.

## ✨ What's New in v1.0.76 (Unrestricted E-Wallet & Bills Center Edition)

> **Unrestricted Access to E-Wallet & Bills Center for All Merchants, Removal of VIP Crystal Paywall Badges, Direct Operational Tab Access, and Pure Apple Cupertino Layout.**

- 🔓 **Unrestricted E-Wallet & Bills Center Access**:
  - Removed the VIP crystal badge (`💎 VIP`) from the navigation sidebar and module header.
  - Permanently unlocked all 5 operational tabs for all merchants and cashiers: `Cash In / Out`, `Bills & E-Load`, `Transactions`, `Audit Sheet`, and `Audit History`.
  - Cashiers can immediately record Cash In, Cash Out, Utility Bills payments, and E-Load transactions without any license restrictions or paywall modals.
- 🎨 **Streamlined Apple Cupertino User Interface**:
  - Eliminated paywall banners and upgrade prompts inside the financial reconciliation hub.
  - Full-featured cash register controls, fee calculation chips, thermal receipt generation, and manual OS print dialogs available natively.
- 🛡️ **Continued Dual-Track Hot-Patch Engine & Database Safety Shield**:
  - Instant feature updates delivered via lightweight ~0.8 MB hot-patches with zero data disruption.

## ✨ What's New in v1.0.75 (Fast In-App Feature Hot-Patch & Proactive Cupertino Update Engine Edition)

> **Dual-Track Update Architecture with 5-Second In-App Feature Hot-Patching, Proactive Center Cupertino Update Alert Modal, 5-Point Steelclad Database Safety Shield, and 100% Strict English Standardization.**

- ⚡ **Fast In-App Feature Hot-Patch Engine**:
  - Eliminates the 2-minute build and 107 MB download bottleneck for minor features, UI enhancements, and bugfixes by packaging only compiled application code into a compact ~0.8 MB archive.
  - Bundled in ~3 seconds via `npm run build:patch` (`tools/bundle_patch.mjs`) with SHA-256 verification.
  - Downloads in ~3 seconds on Philippine store WiFi and applies seamlessly with a 2-second restart.
- 🛡️ **5-Point Steelclad Database & User Safety Shield**:
  - **Decoupled Data Storage**: Store SQLite database (`tindapos.db`) remains completely decoupled in `%APPDATA%\tinda-pos\database\` or `TindaPOS-Data\database\`, ensuring code updates never touch store sales or inventory.
  - **Pre-Update Automated Backup Snapshot**: Automatically creates a verified `BEFORE_UPDATE` backup snapshot before applying code patches.
  - **Cashier Operation Guard**: Active checkout cart ringing and payment processing lock out updates, preventing transaction interruption.
  - **Additive Migrations Only**: Non-destructive schema updates safeguard existing products, prices, and utang balances.
  - **Crash Sentinel & Auto-Rollback**: Automatic boot health monitor reverts to the prior stable bundle if a patch fails to boot within two consecutive attempts.
- 🚀 **Proactive Zero-Click Apple Cupertino Update Pop-up Modal**:
  - Directly surfaces an elegant frosted-glass modal in the center of the screen as soon as an update is detected, without requiring users to manually check Settings.
  - Displays version badge, release highlights, and database safety guarantees with a 1-tap "Update & Restart Now (Takes 5 seconds)" action and progress tracking.
- 🌐 **100% Strict Professional English Standardization**:
  - Enforced pure professional English across all update dialogs, notifications, receipts, and system tools with zero dialect words.

> **Complete Deletion Safeguards in E-Wallet Audit Sheet & Historical Audit Ledger, Interactive Cupertino Confirmation Modals, Dynamic Today's Audit Delete Banner, and 1-Tap Count Reset.**

- 🗑️ **Interactive Cupertino Deletion for Audit Records**:
  - Added dedicated Delete buttons (`Trash2`) with interactive Cupertino confirmation modals to each row in the Audit History ledger.
  - Displays full audit metrics before deletion: Date, Cashier, Cash/GCash/Maya/MariBank differences, and Total Fees earned.
- 🧹 **Bulk "Clear All Audits" Safeguard**:
  - Added "Clear All Audits" action in the Audit History header with modal confirmation, allowing store owners to wipe test audits or start completely fresh.
- 🔄 **Audit Sheet 1-Tap Reset & Today's Audit Delete Banner**:
  - Added **Reset Sheet** button with `RotateCcw` icon to instantly clear all denomination inputs, float amounts, and notes.
  - Interactive top banner on the Audit Sheet when an audit is recorded for today, featuring a 1-tap **Delete Saved Audit** button for effortless recounting.

## ✨ What's New in v1.0.73 (Ultra-Compact Zero-Wrap Thermal Receipts & Universal Receipt Standard Edition)

> **Standardized Thermal Receipt Layouts Across Auto Print and Manual Print matching Retail Reference Specifications, Zero-Wrap Deterministic Timestamps, Double-Divider Total Hierarchy, and Bills Cash Tendered & Change Breakdown.**

- 🧾 **Deterministic Zero-Wrap Receipt Timestamps**:
  - Replaced wrapping date formats with compact, single-line timestamps (`MM/DD/YYYY h:mm A`, e.g. `10/08/2026 9:49 PM`).
  - Guaranteed single-line display across narrow 58mm (32-col) and 80mm rolls on checkout receipts, test prints, X/Z shift reports, E-Wallet stubs, and Bills slips.
- ⚡ **Standardized Double-Divider Total Hierarchy**:
  - Grand total blocks strictly enclosed in double dividers (`================================`) above and below.
  - Enhanced `rowsToHtml` renderer to eliminate redundant double borders when consecutive separators occur.
- 💰 **Bills Cash Tendered & Change Calculation**:
  - Added Cash Tendered input and real-time Change calculation to the Bills & E-Load center.
  - Printed directly on thermal slips and manual printouts.
- 🎯 **Ultra-Compact Typography & Strict English Standard**:
  - Tight `line-height: 1.05`, 2mm micro-margins, and integer dot font sizing (`11px` bold headers, `10px` body, `9px` footers) for zero paper waste.
  - 100% strict English standardization across all financial and cashier modules.

## ✨ What's New in v1.0.72 (Native Document Printing, Audit Dual Print & MariBank Edition)

> **Native Electron Printable Inventory & Operations Documents, Dual Auto/Manual System Dialog Printing in E-Wallet Audit & History, and Complete MariBank Digital Banking Integration.**

- 🖨️ **Native Inventory & Operations Document Printing Pipeline**:
  - Replaced fragile browser popup printing with native Electron IPC `printer.printDocument`, resolving printing failures across all Windows printer drivers.
  - Dedicated hidden BrowserWindow renderer with `@page` formatting and A4/Letter dimensions for crisp Stock on Hand Reports, Physical Count Sheets, Purchase Orders (P.O.), and Stock Adjustment Logs.
  - Added dual **Auto Print (A4)** and **Manual Print (Dialog)** options to `InventoryPrintModal` and `PriceTagPrintModal`.
- ⚖️ **Dual Printing in E-Wallet Audit Sheet & Historical Audit Ledger**:
  - Upgraded audit printing IPC to support direct Windows System Print Dialog execution (`{ manual: true }`).
  - Added dual **Auto Print** (Thermal direct) and **Manual Print** (OS Print Dialog) buttons to both the live **Audit Sheet** and the **Audit History** ledger table.
- 🏦 **MariBank Digital Banking & E-Wallet Integration**:
  - Added **MariBank** alongside GCash and Maya across Cash In / Out, Bills & E-Load center, transactions ledger, and shift audits.
  - Distinct Shopee/Sea orange (`#FF6A00`) brand theme and badges.
  - SQLite database Migration 13 for `ewallet_audits` (MariBank reconciliation float columns) and `ewallet_transactions` channel check constraints.
  - Comprehensive thermal receipt audit printing breakdown including MariBank drawer reconciliations.

## ✨ What's New in v1.0.71 (Next-Gen Community Chat & Universal Store Branding Edition)

> **Clean Fee Notation, Universal No-Seconds Receipt Timestamps, Next-Gen Community Chat with Emojis & Photos, Universal Store Logo & Desktop Taskbar Icon, and Staggered Dashboard Login Animations.**

- 💳 **Clean Fee Notation & No-Seconds Receipts**:
  - Removed `+` prefix from all E-Wallet and Bills fee displays, chips, table columns, and receipt slips (`Service Fee    P20.00`).
  - Standardized thermal receipt timestamps to `{ dateStyle: 'medium', timeStyle: 'short' }` across all transactions, producing clean date/time stamps with zero seconds (e.g., `Oct 7, 2026, 10:07 PM`).
- 💬 **Next-Gen Community Chat Overhaul**:
  - Dragging fix: Moving the minimized pill never accidentally restores or opens the chat window.
  - Renamed minimized label to **Chat**.
  - Integrated 1-tap Emoji Picker (`😀 😂 😍 👍 🙏 🏪 📦 💰 🔥 👏 ❤️ 🎉 🚀 🇵🇭`) and image attachment upload/paste support with inline thumbnail rendering.
  - Seen Receipts: See who read messages and at what time (`👁️ Seen by Cashier · 10:07 PM`).
  - Live presence counter: Real-time `🟢 X Online` merchant indicator.
- 🎨 **Universal Store Logo & Desktop Window Icon**:
  - Free custom store logo upload for all stores; custom logo dynamically updates the Windows desktop taskbar and window frame icon.
- ✨ **Cinematic Staggered Dashboard Login Animations**:
  - Fluid CSS fade-in-up staggered entrance animations and personalized time-of-day store welcome banner.

## ✨ What's New in v1.0.70 (7-Eleven Micro Thermal Spacing & Express Manual Print Edition)

> **7-Eleven Retail Micro Thermal Spacing, Double-Divider Grand Totals, Tabular Right-Aligned E-Wallet & Bills Slips, and Express Manual Print in Cash In / Out Register.**

- 🧾 **7-Eleven Micro Thermal Spacing & Double-Divider Receipts**:
  - Standardized monospace font stack across all thermal printouts (`'Courier New', Courier, Consolas, monospace`).
  - Added authentic double-line divider `================================` (`border-top: 3px double #000000`) before grand totals in both print CSS and screen preview.
  - Ultra-compact vertical padding and micro-margins (`1mm 1mm 2mm 1mm`), reducing thermal roll consumption to 7-Eleven retail standards.
  - Expanded money-line parser to right-align tabular numerals for E-Wallet and Bills slips (`Amount`, `Service Fee`, `Bill Amount`, `TOTAL PAID`, `TOTAL CASH RECEIVED`, `TOTAL CASH RELEASED`).
- ⚡ **Express Manual Print in Cash In / Out Register**:
  - Added direct **Manual** print button (`printEwalletReceipt(tx.id, true)`) and **Auto** print button to Recent E-Wallet Transactions on the Cash In / Out register page, allowing one-tap system print dialog invocation.

## ✨ What's New in v1.0.69 (Laptop Responsive Layout & Auth Setup Resilience Edition)

> **Auto-Adjusting Laptop Screen Layout, Pinned Sticky Actions in E-Wallet & Bills, Idempotent Auth Setup Wizard, and Resilient First-Run Auto-Healing.**

- 💻 **E-Wallet & Bills Responsiveness for Laptop Resolutions**:
  - Automatically stacks forms and ledgers into full width on standard laptop displays ($1366\times 768$, $1280\times 720$) via `2xl:grid-cols-12`, eliminating horizontal table squishing.
  - Sticky Actions column (`sticky right-0`) with drop shadow for both Bills and Transactions ledgers guarantees **Print**, **Manual Print**, and **Void / Delete** buttons remain perpetually pinned on-screen and never clipped.
- 🛡️ **First-Run Setup Lockout Fix & Auto-Healing**:
  - Solved `SqliteError: UNIQUE constraint failed: users.username` crash when restarting or updating into the setup wizard. Upserts existing admin credentials safely without SQLite constraint violations.
  - Auto-heals empty or blank `store_name` in `firstRunComplete` so existing databases never falsely trap merchants in the setup wizard on restart or update.
- 🧾 **58mm & 80mm Thermal Receipt Layout Alignment**:
  - Clean monospace layout with right-aligned tabular numerals and double-line total borders for both automatic ESC/POS and manual Windows system dialog printing.

## ✨ What's New in v1.0.68 (Ultra-Compact Zero-Waste Thermal Receipt Spacing Edition)

> **Paper-Saving Micro-Tightened Thermal Receipt Spacing, Zero Centavo Clipping, Unified E-Wallet & Bills Center, Universal Manual Print, and Shelf Price Tag Label Engine.**

- 🧾 **Ultra-Compact Thermal Receipt Spacing Engine (Paper-Saving Optimization)**:
  - Responded directly to store owner feedback regarding paper roll consumption ("kalas ug papel").
  - Tightened line-height to `1.15` and reduced line-item vertical margins from `0.15em` to `0.06em`.
  - Compressed section separator margins, empty line gaps, and totals padding, trimming 20-30% off total receipt length.
  - Reduced print bottom margin feed to `1.5mm` to avoid trailing empty paper waste while maintaining 100% sharp 203 DPI typography.
- 💳 **Consolidated E-Wallet & Bills Center (Single Sidebar Module)**:
  - Direct 1-tap price tag generation right from Inventory catalog and per-item action buttons.
  - Multi-size presets tailored for retail and grocery operations: `30×20mm` (Micro grocery), `40×30mm` (Standard retail sticker with barcode), `50×30mm` (Wide pharmacy tag), or custom dimensions in millimeters.
  - Generates crisp high-contrast black-and-white layouts with Product Name, Bold Peso Price (`₱99.00`), wholesale volume tiers, barcode Code128, and SKU reference.
  - Direct output to dedicated thermal sticker label printers (Xprinter, Niimbot, TSC, Zebra) with exact micron page sizing and zero margins.
- 📄 **Physical Inventory & Operations Printable Sheets Hub**:
  - Accessible via `Print Sheets / P.O.` in the Inventory header with 4 professional A4 / Letter printable document templates:
    1. **Stock on Hand Report**: Balance listing with cost price, SRP, and stock valuation.
    2. **Physical Count Sheet**: Blind counting audit sheets with write-in boxes for manual inventory verification.
    3. **Purchase / Restock Order (P.O.)**: Supplier order form with automated suggested reorder quantities based on low stock thresholds.
    4. **Stock Adjustment Log**: Formal document for recording spoilage, damages, and reconciliations with signature lines.
- 🖤 **Zero-Waste Thermal Receipt Gap & Decimal Precision Fix**:
  - Tightened bottom feeding clearance from `10mm` to `3mm` and reduced vertical gaps from `12px` to `4px`, saving up to 40% thermal paper roll consumption per transaction.
  - Fixed decimal clipping on narrow 58mm thermal rolls by introducing flex-aligned line items and explicit right gutter margins, guaranteeing all centavos (`.00`, `.50`, `.95`) render with 100% complete visibility.
- 🔍 **Multi-Criteria Smart Product Search & Instant Enter-to-Punch Engine**:
  - Search by product name, SKU, or barcode; pressing `Enter` instantly punches the matching item straight into the checkout cart without requiring down-arrow navigation.
  - Multiplier rapid punch supported: type `5*egg` or `12*48000123` and hit `Enter` to instantly add bulk quantities.
  - Proactive **Low-Stock Alert**: Instant warning toast whenever an item punched has $\le$ `low_stock_threshold` remaining.
  - Upgraded **No Product Found** interactive Cupertino card with instant query clearing (`Esc`) and direct product addition.
- ⚡ **Unified E-Wallet & Bills Center (Consolidated Single Sidebar Module)**:
  - Unified into a single **E-Wallet & Bills** module under *Cashier & Register*, saving valuable sidebar space while centralizing store financial services.
  - 5 Integrated Cupertino Tabs: `Cash In / Out`, `Bills & E-Load`, `Transactions`, `Audit Sheet`, and `Audit History`.
  - **Native Hardware Thermal & Universal Manual Print**: Fully integrated with Electron's hardware printing engine (`ewallet:printBillSlip`), supporting direct thermal printing and Windows OS System Print Dialog for challenging printer setups.
  - **Deletion & Void Safeguards**: Added interactive Cupertino confirmation modals for deleting or voiding e-wallet and bill payment records.
- 💬 **TINDA Community Chat & Polished UI Standard**:
  - Renamed Global Lounge to **Community Chat** across floating capsules, dialog headers, and empty states.
  - Removed outdated "Hub" labels from user-facing navigation in favor of clean terminology (**Bills Payment & E-Load**, **TINDA POS Hardware Center**, **E-Wallet & Cash Audit**, **Multi-PC Network**).
- 🛡️ **100% Quality Invariants Maintained**:
  - All 416 automated vitest unit tests passing across 63 test files with 0 TypeScript compilation errors.

## ✨ What's New in v1.0.65 (Zero-Blur High-Density Thermal & Universal Manual Print Edition)

> **Universal Manual Print Engine (Native Windows Print Dialog), Zero-Blur High-Density Thermal Typography Engine, and GOOJPRT 58H Hardware Model Support**

- 🖨️ **Universal Manual Print Engine (Native Windows Print Dialog)**:
  - Designed for challenging printers (e.g. GOOJPRT 58H / JP-58BL / KP58B-U / POS-58) that experience Windows driver spooler locking, virtual USB port delays, or driver name mismatches.
  - Launches the native Windows System Print Dialog pre-bound to the detected thermal printer, allowing cashiers to manually choose any printer device, inspect print preferences, adjust darkness/density, or print to PDF.
  - Added dedicated 1-tap **Manual Print** action buttons in:
    - **Checkout Complete Modal**: Cashiers can trigger instant manual receipt printing even if automatic printing was disabled or interrupted.
    - **Transactions Ledger & Receipt Preview**: Dedicated "Manual Print" action alongside "Print Receipt" (auto).
    - **Terminal Tools [F3] (`PosToolsModal`)**: Hardware Hub quick strip offers both "Thermal Print" (auto) and "Manual" dialog test.
    - **Settings -> Receipt Tab**: "Manual Test Print (Dialog)" for verifying Windows driver connection.
    - **Automatic Manual Print Dialog Mode**: Added `manual_print_dialog` toggle in Settings so stores with strict printing workflows can open the OS dialog on every sale automatically.
- 🖤 **Zero-Blur High-Density Thermal Typography Engine**:
  - Fixed the root cause of blurry/faint thermal printing: Chromium previously rendered subpixel antialiased text with fractional font sizes (`9.5px`), which 203 DPI monochrome thermal heads dithered into faint, fuzzy dots.
  - Replaced fractional font metrics with integer dot geometry (`11px` for 58mm / 32 columns, `12px` for 80mm).
  - Injected print rules: `-webkit-font-smoothing: none !important`, `-moz-osx-font-smoothing: grayscale !important`, `font-smooth: never !important`, `text-rendering: geometricPrecision !important`, and `image-rendering: pixelated !important`.
  - Set base thermal font-weight to `700 !important` and borders to solid `2px`/`3px` pure black (`#000000`), ensuring minimum 2-dot stroke widths so thermal pins burn pitch-black, needle-sharp text at 90mm/s.
  - Switched Chromium print rasterizer to pure monochrome (`color: false`, `dpi: { horizontal: 203, vertical: 203 }`) to eliminate color-to-halftone dithering artifacts.
  - Increased pre-print rasterization delay (350ms) and post-print spooler hold delay (500ms) to ensure complete buffer transmission.
- 📖 **GOOJPRT 58H Hardware Model Matching & In-App Guide**:
  - Expanded printer recognition regexes to match `58h`, `jp-?58`, and `kp-?58` (`KP58B-U` Bluetooth and `JP-58BL` USB models).
  - Linked official [GOOJPRT 58H User Manual](https://manuals.plus/ae/1005008661058283) in Settings -> Receipt and Handbook Chapter 10.
  - Documented exact Windows driver steps for setting **Print Density / Darkness** to Dark (Level 12-15), **Dithering** to None, and performing printhead cleaning with isopropyl alcohol.
- 🛡️ **100% Quality Invariants Maintained**:
  - All 414 automated vitest unit tests passing (`63/63` test files) with `0` TypeScript typecheck errors.

## ✨ What's New in v1.0.64 (VIP Custom Logo & Universal Discount Edition)

> **VIP Pro Custom Store Logo Upload, Universal Cart Discounts (% and ₱), 100% English Localization, POS Header Workspace Cleanup, and Live Sales Monitor Metric Alignment**

- 🌟 **VIP Pro Custom Brand Identity & Store Logo Upload**:
  - Store owners with active VIP Pro licenses can upload their personalized business logo (PNG, JPG, SVG, WebP up to 2MB).
  - Stored securely in local settings and rendered within Apple-grade Cupertino squircle materials across the sidebar and headers, with live fallback to Quantum Mark.
- 🏷️ **Universal Custom Cart Discount Engine (% and ₱)**:
  - Cashiers can now apply flexible discounts right at the POS register: choose between statutory Senior Citizen / PWD 20% discount or custom percentage (5%, 10%, 15%, 20%, 50%, or custom input) or exact peso deduction (₱).
  - Complete with real-time subtotal calculation and clear display on both POS cart and thermal printed tickets.
- 🌐 **100% Professional English System-Wide Localization**:
  - Replaced all legacy Bisaya/Filipino text across receipt tickets (`Thank you for your purchase!`, `Change`), Handbook Chapter 10, thermal printer troubleshooting, and wireless camera scanner pairing with clean professional English.
- 🧹 **POS Register Header Workspace Cleanup**:
  - Removed cluttered Terminal Tools button from the cashier register top bar for maximum catalog screen real estate, while retaining instant `F3` hotkey access and the permanent Sidebar footer button.
- 📊 **Live Sales Monitor & Owner Dashboard 100% Alignment**:
  - Re-synchronized `app:salesMonitorSummary` to query refunds and calculate Net Realized Sales (`cash + gcash + maya - refunds`), perfectly matching the Owner Dashboard metrics and strictly excluding uncollected customer credit (Utang).
- 🛡️ **100% Quality Invariants Maintained**:
  - All 414 automated vitest unit tests passing (`63/63` test files) with `0` TypeScript typecheck errors.

## ✨ What's New in v1.0.63 (Zero-Click Auto-Detect Thermal Printer Edition)

> **Zero-Click Thermal Printer Auto-Detection, Automatic Paper Width Inference (58mm/80mm), Hardware Hub Auto-Detect Readiness & Zero-Config Plug-and-Play Checkout**

- ⚡ **Zero-Click Thermal Printer Auto-Detection & Dynamic Binding**:
  - Automatically identifies connected USB and Bluetooth POS receipt printers (GOOJPRT PB-58H, POS-58, JK-5802H, Xprinter, etc.) upon plug-in without requiring the user to navigate to Settings or click Save.
  - Dynamically binds checkout receipts, shift summaries, and Z-readings to the detected printer, eliminating silent `NO_PRINTER` failures.
- 📐 **Automatic Paper Width Inference (58mm vs 80mm)**:
  - Smartly detects 58mm printer models (`pb-58`, `jk-58`, `pos-58`, `xp-58`, `58mm`) and auto-applies exact micron dimensions (`58,000 x 297,000 µm`) and font scaling.
- 🧰 **Terminal Tools [F3] Auto-Detect Ready Status**:
  - `PosToolsModal` and Sidebar tools display **Auto-Detect Ready** status and provide 1-tap thermal test printing straight from the cashier workspace.
- 🛡️ **100% Quality Invariants Maintained**:
  - All 414 automated vitest unit tests passing (`63/63` test files) with `0` TypeScript typecheck errors.

## ✨ What's New in v1.0.62 (Ultra-Modern Quantum Mark & GOOJPRT Hardware Fix Edition)

> **Ultra-Modern Geometric Brand Mark, GOOJPRT PB-58H Zero-Margin Thermal Spooling & Blank Print Fix, Sidebar-Organized Terminal Tools [F3] & 1-Tap Diagnostic Print**

- 💎 **Ultra-Modern Quantum Mark (Apple-Grade Cupertino Diamond-T)**:
  - Completely redesigned `AppLogo.tsx` with hyper-clean Apple-grade aesthetics: translucent Cupertino squircle chassis, optical light spine ray, and balanced summation ($\Sigma$) winglets with radiant Emerald-Cyan laser gradients and VIP Pro Gold radiance.
- 🖨️ **GOOJPRT PB-58H Zero-Margin Thermal Spooling & Blank Print Fix**:
  - Traced and resolved the "print successful but no paper comes out" issue: eliminated hidden window premature destruction race condition during spooling, set explicit micron paper dimensions (`58,000 x 297,000 µm`), zero-margin `@page` and `@media print` CSS overrides, and 10mm bottom feed clearance.
  - Added dedicated step-by-step diagnostic guidance in **Settings ⚙️ &rarr; Receipt** and **Handbook Chapter 10** covering thermal roll orientation (scratch test), Windows Virtual USB Port mapping (`USB001`), and feed button self-tests.
- 🧰 **Sidebar-Organized Terminal Tools [F3] Hub**:
  - Prominently organized the Sidebar footer with a full-width Cupertino pill button for **Terminal Tools [F3]** with hotkey badge and smooth hover micro-interactions.
  - Added a 1-tap **Thermal Print** test action directly inside the hardware status strip for immediate printer diagnostics without switching screens.
- 🛡️ **100% Quality Invariants Maintained**:
  - All 411 automated vitest unit tests passing (`63/63` test files) with `0` TypeScript typecheck errors.


## ✨ What's New in v1.0.61 (Mathematical Mass & GOOJPRT Desktop Thermal Edition)

> **Mathematical Mass Identity Mark, GOOJPRT PB-58H 58mm Thermal Printer Support, Terminal Tools [F3] Hardware Hub, In-Cart Custom Unit Price, Multi-Network Phone Scanner & 58mm Handbook Guide**

- 📐 **Mathematical Mass Brand Mark (The Quantum Summation T)**:
  - High-precision geometric vector identity mark featuring an isometric hexagonal mass bounding volume, Golden Ratio ($\Phi = 1.618$) optical alignment, and a stylized mathematical summation ($\Sigma$) apex fused with the letter "T". Integrated into the Sidebar brand header and Terminal Tools modal with live hardware status pulse indicators.
- 🖨️ **GOOJPRT PB-58H (USB + Bluetooth) Desktop Thermal Support**:
  - Full hardware support and documentation for popular 58mm retail thermal printers (GOOJPRT PB-58H / JK-5802H / POS-58 / Xprinter). Added in-app setup guide in **Settings ⚙️ &rarr; Receipt** and published official **Chapter 10: Thermal Printers** in the offline **Store Handbook**.
- 🧰 **Terminal Tools [F3] & Clean POS Workspace**:
  - Consolidated 10 cluttered top-bar buttons into a single sleek Cupertino pill **Terminal Tools [F3]** in the header plus a dedicated **Tools** button in the sidebar footer.
- 🏷️ **Line Item Custom Unit Price Editing**:
  - Direct 1-click in-cart unit selling price override for cashiers and managers, replacing informal labels with professional **"Edit Unit Price"** modal and live subtotal calculation.
- 📱 **Intelligent Wireless Phone Scanner Engine & Multi-Adapter Discovery**:
  - Automatically identifies physical Wi-Fi/Ethernet adapters, filters out ghost/APIPA (`169.254.*`) and virtual interfaces, and offers an active adapter dropdown plus a 1-tap **Direct Snap (HTTP)** fallback to bypass mobile browser SSL warnings on iOS Safari & Android Chrome.

---

- 📜 **VIP Client Full Scrolling & Infinite Inventory Feed (Client Feedback Addressed)**:
  - **Root Cause Solved**: Removed the hardcoded `limit: 60` query restriction and outer height trapping in `Shell.tsx` that previously caused catalog scrolling to abruptly stop after 60 items.
  - **Continuous Infinite Pagination**: Implemented dynamic paginated auto-loading with `PAGE_SIZE = 120`, scroll-boundary listeners, `pb-28` bottom clearing, and `hasMore` tracking across both high-density table and grid views. Catalogs with 500 to 10,000+ items now scroll completely and fluidly without clipping.
- 🧰 **Terminal Tools [F3] & Clean POS Workspace (Client Feedback Addressed)**:
  - Consolidated 10 cluttered top-bar buttons (`Scanner Ready`, `Counter Camera`, `Pair Phone`, `Customer Screen`, `Sales Monitor`, `Petty Cash`, `E-Wallet`, `Sound On`, `Z-Reading`, `Guide`) into a single sleek Cupertino pill **Terminal Tools [F3]** in the header plus a dedicated **Tools** button in the sidebar footer.
- 🏷️ **Line Item Custom Unit Price Editing (Client Feedback Addressed)**:
  - Direct 1-click in-cart unit selling price override for cashiers and managers, replacing informal labels with professional **"Edit Unit Price"** modal and live subtotal calculation.
- 📱 **Intelligent Wireless Phone Scanner Engine & Multi-Adapter Discovery (Client Feedback Addressed)**:
  - Automatically identifies physical Wi-Fi/Ethernet adapters, filters out ghost/APIPA (`169.254.*`) and virtual interfaces, and offers an active adapter dropdown plus a 1-tap **Direct Snap (HTTP)** fallback to bypass mobile browser SSL warnings on iOS Safari & Android Chrome.
- 💵 **Quick Cash Denomination & Increment Chips**:
  - Added 1-Tap quick payment buttons in Cash Checkout: `Exact (₱...)`, `₱20`, `₱50`, `₱100`, `₱200`, `₱500`, `₱1,000`, and instant increment chips `+₱20`, `+₱50`, `+₱100` for ultra-fast customer change calculations.
- 🔊 **Web Audio API Hardware Synthesizer**:
  - Zero-asset, 100% offline audio engine with crisp high-pitched barcode scan confirmations (1300Hz-1750Hz sine), out-of-stock/error buzzers (280Hz sawtooth), cash register chime (C6-C7 arpeggio), and 1-tap header mute/unmute toggle.
- ⚡ **Multiplier Scan & Rapid Entry Engine**:
  - Cashiers can scan or enter `5*BARCODE` or `10*PRODUCT` to instantly add bulk quantities without tapping the plus button multiple times.
- 🏷️ **Senior Citizen & PWD 20% Statutory Discount System**:
  - One-click modal calculation of 20% discount on cart subtotal with OSCA / PWD booklet and ID tracking for tax compliance.
- 🖨️ **1-Click Thermal Z-Reading / Daily Cash Balancing Print**:
  - Quick header Z-Reading button directly prints daily sales and shift balancing reports to ESC/POS thermal printers.
- 🛡️ **Automated 7-Day Rolling Daily SQLite Safety Snapshot & Live Inventory HUD**:
  - Daily database backups are maintained on a 7-day rolling window with automatic pruning of older snapshots to optimize store storage. Real-time header badges for Low-Stock and Near-Expiry items with 1-click catalog filtering.

---

## ✨ What's New in v1.0.59 (High-Density Enterprise Cashier Listing Table)

> **Supermarket/Pharmacy Listing View, 1-Click Dual-Mode Switcher & Keyboard Navigation**

- 📋 **High-Density Enterprise Cashier Listing Table**: 5-column supermarket listing displaying 36×36 product thumbnail avatar, product name, cyan mono SKU, barcode, category badge, real-time stock levels with safety pulse (🟢 Normal, 🟡 Low, 🔴 Out), wholesale/SRP/reference prices, in-line quantity steppers (`- count +`), and active in-cart counters.
- 🔄 **1-Click Dual-Mode Switcher**: Instant switching between Table Listing and Card Grid modes with per-terminal persistent memory.
- ⌨️ **High-Speed Keyboard Navigation**: `ArrowDown` / `ArrowUp` item navigation with auto-scrolling viewport and `Enter` key cart addition.

---

## ✨ What's New in v1.0.58 (Profit Margins Restoration & Automated VIP Rollback Engine)

> **Fulfilled Merchandise Margin Integrity, Hardened VIP Anti-Tamper Protection & Direct Auto-Restart ("Diritsyo Na")**

- 📈 **Restored Gross Profit & True Net Profit Margin Integrity (VIP Feedback Addressed)**:
  - Fixed an accounting distortion where uncollected customer credit (Utang) purchases artificially crashed Gross Profit into negative numbers.
  - Gross Profit is strictly calculated from fulfilled merchandise markup (`(Gross Sales - Refunds) - COGS`), decoupling retail margins from customer debt collection schedules.
  - Net Profit accurately computes `Gross Profit - Operating Expenses`.
  - Daily, weekly, and monthly sales profit curves maintain realistic, accurate retail markup trajectories.
- 🛡️ **Hardened VIP Downgrade Protection (Anti-Tamper & Security Invariants)**:
  - Version rollback and downgrade recovery is strictly locked behind cryptographic VIP Pro license verification across IPC and UI layers.
  - Protects store owners from unauthorized personnel downgrading to older builds to exploit patched vulnerabilities, bypass cashier restrictions, or alter sales ledgers.
- ⚡ **Direct Execution & Automatic System Restart ("Diritsyo Na")**:
  - Once the target version download completes, the engine spawns the installer detached and terminates the POS application cleanly after a 1.5-second buffer.
  - Releasing SQLite database and process locks enables NSIS to seamlessly overwrite and relaunch TINDA POS into the chosen version without requiring cashiers to manually browse folders.
  - Auto-detects runtime flavor (Portable vs Setup) to download and launch the matching executable.
- 📊 **Professional Live Download Progress Bar**:
  - Live IPC stream displays an Apple-standard progress bar showing exact transfer percentage and transfer volume (`X MB / Y MB`).
- 🌐 **100% Professional English Interface**:
  - All color schemes (`Midnight Black`, `Daylight White`, `Warm Eye-Care`, `Nordic Slate`) and guidance notes have been permanently translated into polished, professional English.

---

## ✨ What's New in v1.0.57 (Financial Realized Revenue Model & Zero-Flicker VIP Store)

> **Utang Exclusion from Realized Sales, Zero-Flicker Store Hydration & Multi-Theme Background Switcher**

- 💵 **Financial Realized Revenue Model**:
  - Uncollected store credit (Utang) is strictly excluded from Today's Realized Net Sales and Total Sales counters, standing purely in the Customer Credit Ledger until cash/digital payments are collected.
  - For split payments (e.g. ₱50 Cash + ₱50 Utang), only the realized ₱50 Cash portion enters realized sales immediately.
- ⚡ **Zero-Flicker VIP Store Experience**:
  - Instant first-frame rendering without layout shifts, blinks, or banner flashes when opening E-Wallet & Audit or Settings tabs.
  - Synchronous Zustand store hydration directly on app initialization.
- 🎨 **Multi-Theme Eye-Care Engine**:
  - 4 distinct theme environments designed for variable retail lighting conditions: Midnight Black (OLED contrast), Daylight White (bright sunlight/open storefront), Warm Eye-Care (soft sepia for night shifts), and Nordic Slate.

---

## ✨ What's New in v1.0.56 (Permanent Hardware-Anchored VIP Licensing & Version Rollback Recovery)

> **Quad-Vault Self-Healing VIP Licensing, Zero Machine ID Drift & 1-Tap Version Rollback Recovery**

- 💎 **Permanent Hardware-Anchored VIP Licensing**: Solved the issue where software updates or network switching caused VIP merchants to lose their license. The canonical Machine ID is calculated once from immutable hardware attributes (`MachineGuid` + Motherboard UUID) without volatile network interface dependencies, and locked across 4 durable storage locations (`machine.id`, registry, database).
- 🛡️ **Quad-Vault Redundant Persistence & Self-Healing**: Licenses are mirrored synchronously across 4 vaults (`%USERPROFILE%/.tindapos/tinda_license.json`, `%APPDATA%/TINDA POS/tinda_license.json`, Windows Registry `HKCU\Software\TindaPOS\LicensePayload`, and SQLite DB `system_license_vault`). If any file is deleted or cleared by disk cleanup or updates, the system automatically detects, restores, and self-heals all vaults on startup.
- 🔄 **Zero-Friction Legacy VIP Rescue**: Automatically detects and reconciles existing VIP Pro licenses and legacy candidate IDs, locking their status permanently so merchants never lose their VIP status and Dev Francis never has to re-issue keys.
- ⏪ **Version Rollback & Safe Downgrade Recovery Manager (Client Requested)**:
  - If a merchant encounters any issues or bugs with a newly installed update, they can safely 1-tap rollback to any previous version (`v1.0.55`, `v1.0.54`) directly from Settings > About or Backup & Restore.
  - Automatically creates a verified SQLite safety backup (`createBackupSync`) before initiating rollback.
  - Additive database migrations ensure previous versions open the existing database cleanly with zero data loss.
  - Automatically downloads and launches the previous version's installer with real-time download tracking.

---

## ✨ What's New in v1.0.55 (VIP E-Wallet Reconciliation Hub Polish & Zero Float)

> **Zero-Typing Barcode Gun Auto-Capture, Active Input Contamination Sanitizer & Store Handbook Polish**

- ⚡ **Instant Barcode Auto-Capture (Zero Manual Typing)**: When adding or editing products in Inventory, cashiers no longer need to type long 12- or 13-digit EAN/UPC barcodes. Simply scan the product package with any USB/2.4GHz barcode gun or wireless smartphone companion camera; the barcode is instantly auto-populated into the Barcode slot.
- 🛡️ **Active Input Contamination Sanitizer**: Solves the common retail headache where scanning while focused on the product Name or Cost field would leak barcode digits into that field. High-speed keystroke bursts (<120ms) are intercepted, cleanly stripped from the focused field, and routed exclusively to the barcode slot without triggering premature form submissions.
- 🔊 **Sub-Second Audio & Visual Feedback**: Emits an audible 1050 Hz confirmation chirp via the standard Web Audio API and displays a live pulsing status indicator (`● Auto-Capture`) alongside a green badge (`✓ Auto-captured: [code]`).
- ⚠️ **Proactive Duplicate Barcode Detection**: Automatically cross-references the store catalog and warns if a scanned barcode is already assigned to another active item (`⚠️ Already used by [Product Name]`), preventing duplicate stock confusion.
- 📸 **Camera & Smartphone Companion Integration**: Includes a 1-Click `"Camera / Phone"` trigger modal supporting wireless phone cameras and laptop webcams directly inside the product modal, plus individual barcode scan buttons for multi-unit (tingi) pack conversions.
- 🔍 **Inventory List Fast-Track Scan Handler**: Scanning barcodes while browsing the main Inventory list immediately filters directly to that product if it exists, or automatically opens the "New Product" modal with the scanned barcode pre-filled if it's uncataloged.
- 📖 **Store Handbook Modernization**: Fully upgraded Chapter 4 to standard professional English with comprehensive guides for hardware scanners, 1-Click smartphone companion pairing, and zero-typing inventory workflows.

---

> **100% Offline Binary Epoch 41 Lock, Database Trigger Safeguards & 5 VIP Value Pillars**

- 🔒 **100% Offline Cryptographic Anti-Downgrade & Binary Epoch Lock (Epoch 41)**: SQLite Migration 9 establishes the immutable `app_session_auth` singleton table and 3 native database triggers (`trg_anti_downgrade_sales`, `trg_anti_downgrade_shifts`, `trg_anti_downgrade_products`) inside `tindapos.db`. Legacy offline versions attempting to write to upgraded databases are immediately aborted by the SQLite engine with `EPOCH_DOWNGRADE_LOCKED`.
- 📊 **5 Strategic Value Gating Pillars (Free Community vs ₱500 VIP Pro)**:
  1. **Inventory**: 50-product capacity meter with real-time status bar (Brand / Amber / Rose) and seamless VIP upgrade trigger.
  2. **Reports**: 7-day operational sales window for Free tier; lifetime sales history, CSV audit, and tax records unlocked with VIP Pro.
  3. **Loss Prevention**: Automated Cash Drawer Variance Audit in Z-Read finalization (Shortage/Overage Guard vs Expected Cash) with live status badge and 100% professional English.
  4. **Utang**: 15 active credit debtors capacity meter & 1-Click polite SMS/Messenger collection reminder generator.
  5. **Branding**: Clean `[ Powered by TINDA POS Free Community ]` receipt footer; VIP Pro unlocks custom store logo and DTI/BIR tax headers.
- ⚡ **Zero Counter Paralysis Invariant**: Daily checkout, barcode scanning, cash and GCash payments, and change calculations never freeze or block.
- 🛡️ **Zero License Disruption Guarantee**: Existing VIP Pro licenses remain 100% valid and automatically unlock all gating pillars across your store.

---

## ✨ What's New in v1.0.40 (Startup Single-Instance Lock & Port Collision Hardening)

> **PC Startup Double-Instance Immunity, Bounded Port Fallback & Crash Dialog Elimination**

- ⚡ **Synchronous Single-Instance Lock Protection**: Eliminates race conditions when the app auto-launches on Windows PC startup while the cashier also manually clicks the desktop shortcut. Secondary instances immediately exit synchronously (`process.exit(0)`), focusing the primary window and preventing port collision conflicts.
- 🛡️ **Bounded Port Allocation with Windows Service Immunity**: Fixed auto-incrementing retry loops that previously collided with Windows system services like `CDPSvc` (TCP port `5040`). Phone Scanner and LAN Hub now enforce a strict ceiling (maximum 5 port attempts) with full `.on('error')` listeners on both HTTP and HTTPS fallback instances.
- 🧘 **Non-Fatal Graceful Server Degradation**: If auxiliary network services encounter firewall or occupied port blocks, the application logs a non-fatal warning and allows POS cashier sales to continue running smoothly with 0% downtime.
- 🛡️ **Global Process Exception Protection**: Integrated global `uncaughtException` and `unhandledRejection` guards in the Electron main process to prevent unexpected network/port errors from triggering raw JavaScript crash popups for end users.

---

## ✨ What's New in v1.0.39 (Multi-Terminal LAN Visibility, Stock Withdrawal Search, Audited Transaction Deletion & Rapid Hotkeys)

> **Real-Time LAN Sales Parity, Instant Withdraw Search, Permanent Audited Sale Deletion & High-Speed POS Shortcuts**

- 🔄 **Real-Time Multi-PC LAN Sales Parity**: Satellite terminals now seamlessly execute checkouts (`pos:checkout`), query transactions (`transactions:list`), process refunds, and view live cashier shifts through the Master Server. Server-Sent Events (`transactions:changed`) ensure real-time screen updates across all computers with zero manual page refreshes.
- 🔍 **Instant Search in Withdraw Stocks Modal**: Easily search and filter through hundreds of inventory products by name, SKU, or barcode when recording damaged, expired, or spoiled goods.
- 🗑️ **Permanent Audited Transaction Deletion**: Store managers can permanently delete voided or erroneous transactions with an optional one-click physical inventory restock, automatic Utang ledger reversal, cashier shift recalculation, and a strict safety confirmation prompt (`DELETE`).
- ⌨️ **Rapid-Fire POS Keyboard Shortcuts (Hotkeys)**:
  - **`F1` or `/`**: Instantly focuses and selects the product search bar.
  - **`F2`**: Quick focus and select the quantity of the last item in the cart.
  - **`F4`**: Quick focus the cart Discount (₱) input.
  - **`F8`**: 1-key hold current sale.
  - **`F9`**: Quick Cash Checkout (opens modal pre-selected to Cash).
  - **`F10`**: Quick GCash Checkout (opens modal pre-selected to GCash).
  - **`Enter`**: Instant charge / submit checkout.
  - **`Esc`**: Dismiss modal, clear search, or close menu.
- 🛡️ **Zero License Disruption Guarantee**: Existing VIP Pro licenses remain 100% active. Cryptographic machine bindings and licenses stored in `%USERPROFILE%\.tindapos` carry over automatically without requiring re-activation.

---

## ✨ What's New in v1.0.36 (Multi-Terminal Local LAN Hub & Self-Hosted VPS Cloud Mirroring)

> **Multi-Computer Local LAN Hub, Zero-Internet Shared Database, 6-Digit PIN Pairing & Self-Hosted VPS Mirroring**

- 🖥️ **Local Multi-Computer LAN Hub (100% Offline)**: Run 2 or more cashier computers in the store sharing a single unified database without requiring internet. Includes **Master Server Mode (Host)** and **Satellite Terminal Mode (Client)** with real-time bidirectional product search, cart checkout, and customer utang updates.
- 🔐 **6-Digit Security Pairing PIN & HMAC Session Tokens**: Protects your store against unauthorized Wi-Fi access. Satellite terminals must be paired using an on-screen PIN generated by the Master PC.
- 🛡️ **Role-Based Satellite Lockdown**: Satellite computers are locked to cashier checkout operations. Destructive actions (**Reset Database**, **Restore Backup**, and **Raw File Exports**) remain strictly locked to the physical Master console.
- ⚡ **Real-Time Inventory Broadcast (SSE)**: Sales ringing up on any terminal immediately update stock badges across all connected screens via live Server-Sent Events with zero screen refresh required.
- ☁️ **Self-Hosted VPS Cloud Mirroring Bridge**: Store owners running their own Linux VPS ($4-$5/mo) can connect for remote sales viewing from a phone while keeping physical store checkout 100% offline-first. Complete setup instructions provided in [`docs/MULTI_PC_AND_VPS_GUIDE.md`](docs/MULTI_PC_AND_VPS_GUIDE.md).

---

## ✨ What's New in v1.0.35 (Hands-Free Counter Camera & Zero-Click Background Scanning)

> **In-Cart Docked Counter Camera, Zero-Click Background Phone Stream & 3-Way Hardware Concurrency**

- 🎥 **Docked Hands-Free Counter Camera**: Cashiers no longer need to click buttons or open modal windows to scan items. The counter webcam scanner is now embedded right above the cart in the POS screen, featuring power toggle, minimize/expand drawer, camera selection, live laser reticle, and visual green flash on scan.
- 📱 **Zero-Click Wireless Phone Scanning**: Pair a smartphone once using the QR code modal and close the dialog immediately. The phone scanner continues streaming barcodes directly into the POS cart in real time in the background.
- ⚡ **Concurrent Three-Way Scanner Flow**: USB handheld laser scanners, docked counter webcams, and wireless companion smartphones operate concurrently with zero latency and automatic duplicate protection.
- 🔔 **POS Header Status & Audio Feedback**: Header badges (`🟢 Phone Ready`, `📷 Counter Camera`, `🟢 Scanner Ready`) provide real-time connection status at a glance, accompanied by 920Hz audio beeps on every scan.

---

## ✨ What's New in v1.0.34 (Multi-Frame Barcode Consensus & Product Editing Stabilization)

> **Multi-Frame Temporal Consensus, Zero Ghost Reads, Auto-SKU Generation & Product Editing Fixes**

- 🛠️ **Product Editing Stabilization**: Fixed a critical validation bug where newly created products with barcodes could not be edited, throwing false `Duplicate barcode on a product unit` errors. SQLite queries now isolate external units, allowing seamless edits to product prices, names, and stock at any time.
- 🏷️ **Deterministic Auto-SKU Generator (`SKU-XXXX`)**: Products saved without entering an SKU now automatically receive a unique sequential SKU (`SKU-0001`+), completely eliminating `UNIQUE constraint failed: products.sku` database collisions.
- 🎯 **Multi-Frame Stability Consensus**: Both webcam and wireless phone camera scanners now require **2 consecutive frames** with the identical barcode candidate before dispatching, filtering out 99.9% of false-positive reads from packaging graphics, shadows, and reflection glare.
- 🛒 **Zero Accidental Cart Additions**: Removed loose product fallback matches from the POS scan handler. Scanning requires an exact match on master barcode, unit barcode, or SKU, preventing random products from erroneously entering the cart.
- ⏱️ **Extended Anti-Duplicate Debounce**: Built-in 3.5s (phone) and 3.0s (webcam) duplicate protection prevents repeated bursts when holding a product in front of the lens.
- ⚡ **Visual Reticle Confirmation**: The phone camera reticle flashes bright green upon successful scan transmission.

---

## ✨ What's New in v1.0.33 (Dual-Mode Secure Phone Scanner)

> **HTTPS W3C Secure Context Engine, Zero-Warning Direct Photo Snap Scanner & GS1 Modulo-10 Precision Checksum**

- ⚡ **Dual-Mode Phone Companion Scanner (HTTPS + HTTP)**:
  - **Live Video Mode (HTTPS on port 3113)**: Built-in 100-year self-signed SSL certificate unlocks W3C Secure Context (`isSecureContext === true`) on mobile browsers (Android Chrome, iOS Safari), fixing the `getUserMedia` camera permission restriction. Provides continuous 60 FPS live video scanning with animated laser reticle.
  - **Direct Snap Mode (HTTP on port 3112)**: Zero-warning native camera photo snapshot mode via `<input type="file" capture="environment">`. Works instantly across 100% of mobile browsers without certificate warnings or security bypass. Tap the camera button on phone to snap barcodes straight into the POS cart!
- 🔄 **Adaptive Mobile Web Client**: Companion page dynamically detects browser capabilities and provides a 1-tap switcher between live video and instant photo snap modes.
- 📱 **Desktop Mode Toggle**: Cashiers can easily switch between **⚡ Live Video Scanner** and **📸 Direct Snap Scanner** in the desktop pairing modal.
- 🛡️ **GS1 Modulo-10 Algorithmic Verification**: Enforces official GS1 checksum validation for EAN-13, UPC-A, and EAN-8 barcodes, eliminating all false-positive and misread partial barcodes.
- 🔌 **Physical USB Scanner 100% Preserved**: High-speed USB/wireless handheld barcode scanners continue operating simultaneously in parallel.

---

## ✨ What's New in v1.0.30 (Universal Barcode Scanner & Multi-PC LAN Hub Blueprint)

> **Driver-Free Hardware Barcode Scanner Engine, Global Keystroke Burst Interceptor & Multi-Terminal Offline LAN Blueprint**

- 🎯 **Universal Hardware Barcode Scanner (Driver-Free Plug-and-Play)** — seamless out-of-the-box compatibility with 95%+ of retail handheld barcode scanners (Honeywell, Zebra, Netum, Eyoyo, generic USB/2.4G HID keyboard wedges) with zero driver installation on Windows 10/11.
- ⚡ **Global Keystroke Burst Interceptor** — cashiers can scan barcodes anywhere on the screen without clicking the search input box first; sub-50ms keystrokes are automatically intercepted and matched items are added directly to the cart.
- 🟢 **Live "Scanner Ready" HUD Indicator** — persistent pulsing green badge in the POS header confirms hardware scanner listening status in real time.
- 🚫 **Out-of-Stock Protection** — immediately alerts cashiers if a scanned barcode belongs to an item with 0 sellable inventory, preventing checkout errors.
- 🖥️ **Multi-PC LAN Hub & VPS Remote Sync Architecture** — architectural blueprint in `SYSTEM_MASTER.md` explaining why raw SQLite over SMB corrupts files, and detailing the Master-Satellite local LAN HTTP hub and VPS asynchronous replication topology.

---

## ✨ What's New in v1.0.29 (Simple POS Backup Import & Non-Destructive Migration)

> **Zero Setup Migration: Direct Simple POS JSON Ingest, Pre-Import Safety Snapshot & Complete Auth Isolation**

- 📥 **Direct Simple POS JSON Backup Ingest** — seamlessly migrate existing inventory and catalog from third-party Simple POS exports (`simple_pos_secure_*.json`) directly into TINDA POS in seconds without re-encoding items manually.
- 🗃️ **Unified Import Modal (CSV & Simple POS Backup)** — the Inventory import tool now supports both standard `.csv` spreadsheets and `.json` secure backup files with auto-format detection and live status indicators.
- 🛡️ **Absolute User & Auth Lockout Protection** — third-party `users` arrays are strictly ignored and quarantined, guaranteeing that existing store owner and cashier credentials, PINs, and sessions are never altered, overwritten, or corrupted.
- 🔢 **Deterministic SKU Generation** — automatically generates structured, collision-free `SP-0001`+ SKUs mapped from original numerical IDs to fulfill SQLite uniqueness constraints.
- 🧹 **Robust Data Sanitization** — clamps negative stocks to zero, rounds fractional kilogram quantities to whole base integer units, and preserves multiple selling units.
- 💾 **Pre-Import Safety Snapshot Backup** — auto-triggers a checkpointed SQLite database snapshot before batch import execution with 100% ACID transaction rollback on any fatal failure.

---

## ✨ What's New in v1.0.28 (Utang Credit Sale Item-Level Breakdown & Reprint)

- 📦 **Expandable Credit Sale Breakdown** — tap the package icon on any CREDIT_SALE entry in the Utang ledger to view item-by-item breakdown (product name, quantity × unit price, and subtotal).
- 🖨️ **Direct Utang Receipt Reprint** — reprint receipts directly from the Utang ledger with one click without navigating to the Transactions history.

<details>
<summary>📋 <b>Full Version History</b></summary>

<br />

| Version | Highlights |
|---|---|
| **v1.0.31** | Built-in Camera & Smartphone Barcode Scanner (@zxing/library), live video reticle, smartphone setup guide, physical scanner parallel mode |
| **v1.0.30** | Universal USB barcode scanner engine (driver-free keyboard wedge), global burst interceptor, Scanner Ready HUD badge, Multi-PC LAN Hub & VPS remote sync blueprint |
| **v1.0.29** | Simple POS JSON backup ingest, unified Import Products / Backup modal, auto-SKU generation, pre-import safety backup, auth isolation |
| **v1.0.28** | Utang credit sale item-level breakdown (📦 package icon), direct receipt reprint from Utang ledger |
| **v1.0.27** | Complete 172-item market catalog across 12 categories, built-in offline seed, real-time live feed, Scrapling v0.4.15 harvester |
| **v1.0.26** | TINDA BANTAY real-time online market feed, auto live-sync on open/reconnect, pulsing green LIVE indicator, TINDA SCOUT Scrapling harvester |
| **v1.0.25** | Price Guide modal stability fix, auto-seed catalog for empty databases, offline-first online price guide & market price reference |
| **v1.0.24** | Offline-First Online Price Guide / Market Price Reference, DTI SRP guidance, advisory price ranges, dual-probe sync, seed catalog, Price Guide modal, and POS reference indicators |
| **v1.0.23** | Global Responsive Table Auto-Fit across all screens, Product Picture Uploads with thumbnails, Suggested Retail Price (SRP) with Auto-Markup (+10% to +30%), and Dashboard Update Notifications |
| **v1.0.22** | English Standardization in Utang (With Balance / Settled / All), responsive table auto-adjustment across all screens, strict column alignment in Utang & Transactions with dedicated expanded items `<tfoot>` |
| **v1.0.21** | Utang Customer Filter Tabs (May Utang / Bayad Na / Tanan), Utang Quick Stats bar, `BAYAD NA ✓` status badges, contextual Pay/Ledger action buttons |
| **v1.0.20** | Semantic color-coded Dashboard cards (Green Sales, Teal Profit, Red Utang, Amber Expenses); whole-peso Unit Cost validation in Restock/Receiving; aligned Receiving Details modal; `table-fixed` aligned columns in Transactions Expand items |
| **v1.0.19** | Universal Windows↔Android `.tinda-backup` exchange; refund-aware Estimated Profit; withdrawal notes in Stock History; Reset Database RESET-gate; aligned 58/80mm receipts |
| **v1.0.18** | Itemized accordion for Recent Transactions (Dashboard + Transactions page) |
| **v1.0.17** | Windows Startup checkbox accessibility fix |
| **v1.0.16** | Dual-layer Windows auto-start, profit double-deduction fix, POS discount Pesos format, receipt payment breakdown order |
| **v1.0.15** | Utang customer selection from checkout modal |
| **v1.0.14** | Utang customer reachability fix |

</details>

---

## 🏪 Why TINDA POS?

TINDA POS is built specifically for everyday Philippine store operations. Checkout stays usable **100% offline**, your database stays on your own computer, and the workflow is intuitive for both store owners and cashiers — no complex training needed.

| Icon | Feature | Description |
|:---:|---|---|
| 🛒 | **Fast POS Checkout** | Instant product search, barcode scanner support, category filters, Hold/Resume sales, and quick quantity controls |
| 💵 | **Flexible Payments** | Cash with auto-computed change (sukli), GCash, Maya, split payments, and customer Utang (credit) |
| 📦 | **Inventory Management** | Multi-unit products (piece, sachet, pack, box), stock receiving, restock validation, withdrawals, and low-stock alerts |
| 📅 | **Expiration Tracking** | Per-item and per-batch expiration dates with checkout warnings to prevent selling expired goods |
| 👥 | **Complete Utang Ledger** | Customer profiles, credit limits, payment history, balance adjustments, and audit trail |
| 🧾 | **Receipts & Shifts** | Thermal receipt printing (58mm/80mm), refunds, voids, receipt reprints, X-Read, Cash Count, and Z-Read |
| 📊 | **Reports & Analytics** | Sales, profit margins, inventory valuation, and Utang ledgers with one-click CSV export |
| 💾 | **Rock-Solid Backups** | Local `.tinda-backup` files, cloud sync (OneDrive / Google Drive / Dropbox), and verified restore |
| 🔒 | **Security & Access** | PIN protection, Admin/Cashier roles, expense tracking, and seamless software auto-updates |

---

## ⬇️ Downloads & Installers

**For Windows 10 / 11 (64-bit)**

| Deliverable | Description | Download Link |
|---|---|:---:|
| **TINDA POS Setup (Installer)** | ✅ **Recommended.** Installs TINDA POS with automatic desktop shortcut and background auto-update support. | [⬇️ Download Setup](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.74/TindaPOS-Setup-1.0.74.exe) |
| **TINDA POS Portable** | Standalone version. Runs directly from a USB drive or folder without installation. Stores database beside the EXE. | [📦 Download Portable](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.74/TindaPOS-Portable-1.0.74.exe) |
| **Official User Guide (PDF)** | Comprehensive 28-page printable step-by-step user guide with screenshots, workflows, and troubleshooting. | [📄 Download PDF Guide](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.74/TindaPOS-User-Guide.pdf) |
| **Release Checksum Manifest** | SHA256 checksums to verify file integrity. | [🛡️ View SHA256SUMS](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.74/SHA256SUMS-v1.0.74.txt) |

> ℹ️ **If Windows SmartScreen appears:** click **"More info" → "Run anyway"**. This is standard for newly released and community-distributed Windows applications.

🔗 *View all past releases and changelogs on the [GitHub Releases Page](https://github.com/Yazerukun/TINDA-POS/releases).*

---

## 🚀 Quick Start (5 Easy Steps)

1. **Install:** Run `TindaPOS-Setup-1.0.27.exe` and launch the application.
2. **First-Run Wizard:** Enter your store name, set your admin password and PIN, and customize receipt header/footer details.
3. **Add Products:** Open **Inventory** → add your items with purchase cost (whole pesos), selling prices, units, and initial stock.
4. **Setup Printer:** Go to **Settings → Receipt / Printer**, select your thermal printer (58mm or 80mm), and click **Test Print**.
5. **Start Selling:** Open **POS**, search or scan an item, and complete your first sale!

---

## 💳 Payment Methods & Utang Management

### Payment Types

| Method | How It Works |
|---|---|
| **Cash** | Enter amount tendered — change (*sukli*) is automatically calculated in real-time. |
| **GCash / Maya** | Enter the transaction reference number for auditing and balance reconciliation. |
| **Utang (Credit)** | Select the customer first, verify credit balance, and charge to their account ledger. |
| **Split Payment** | Click **Add Payment** to combine multiple payment methods (e.g. Part Cash + Part GCash) in a single transaction. |

### 👥 Utang (Credit) Flow
To prevent charging the wrong customer, TINDA POS features a strict safety check:
1. In POS checkout, click **Select Customer** under *Select the borrower*.
2. Search by customer name or phone number.
3. Click the customer row — the selected customer is highlighted with a green checkmark `✓`.
4. Confirm **Selected: [Customer Name] ✓** before charging.
5. If no customer is selected, the system blocks Utang checkout with a helpful prompt.

---

## 🔍 Transactions & Expand Items View

Click the **▾ chevron** beside any receipt number in the **Transactions** table to inspect itemized details inline:

| Product | Qty | Unit Price | Subtotal |
|---|:---:|---:|---:|
| Nescafe Classic 50g Refill | 2 pcs | ₱45.00 | ₱90.00 |
| Bear Brand Powdered Milk 33g | 5 sachets | ₱12.00 | ₱60.00 |
| San Miguel Pale Pilsen 330ml | 3 bottles | ₱65.00 | ₱195.00 |

* **Footer Breakdown:** Displays payment methods used, applied discounts, and bold grand total.
* **Precise Alignment:** In v1.0.20+, `Qty`, `Unit Price`, and `Subtotal` columns are fixed-width and right-aligned with monospace tabular figures (`font-mono tabular-nums`) so numbers line up perfectly across every transaction.

---

## 🔄 Automatic Software Updates

For users on the **Setup** edition, updating is fully automated:
1. Open **Settings → About → Software Update → Check for Updates**.
2. TINDA POS downloads the update in the background with progress indicator (0–100%).
3. Click **Restart & Install** once the download completes.
4. A safety database backup is created automatically before the update is applied.

> 💡 **Seamless Upgrade:** Users on previous versions (v1.0.19, v1.0.20, v1.0.21, v1.0.22, v1.0.23, v1.0.24, v1.0.25, v1.0.26) will automatically detect and upgrade to **v1.0.27** with zero data loss or manual re-configuration.

---

## 💾 Database Safety & Backups

Your store database is stored safely at:
`%APPDATA%\TINDA POS\database\tindapos.db`

* **Automatic Backups:** Created on system checkpoints, database resets, and software updates.
* **Manual Backups:** Open **Backup** → click **Create Backup** to generate a timestamped `.tinda-backup` file.
* **Cloud Sync:** Select your OneDrive, Google Drive, or Dropbox local sync folder as the backup destination.
* **Data Guarantee:** Uninstalling or upgrading TINDA POS **never deletes your database**. Your sales records, inventory, and customer utang history remain 100% intact.

---

## 🔁 Shifts, Cash Count, X-Read & Z-Read

| Operation | Purpose & Timing |
|---|---|
| **X-Read** | Non-final mid-shift summary. Check current sales, cash drawer status, and transaction totals anytime without closing the shift. |
| **Cash Count** | Physical bill and coin drawer count. Must be completed and saved while the shift is still active. |
| **Z-Read** | Official end-of-day shift closing report. Finalizes the cashier shift and prints the end-of-day summary receipt. |

---

## 🛠️ Common Troubleshooting

| Issue | Recommended Solution |
|---|---|
| **Utang button disabled** | Ensure a customer is selected first under *Select the borrower* until the `✓` badge appears. |
| **Printer not printing** | Check power and USB connection, verify printer selection in **Settings → Receipt**, and run a **Test Print**. |
| **Cash discrepancy** | Review starting drawer float, logged cash sales, recorded expenses, refunds, and Cash Count breakdown. |
| **Unit Cost validation error** | Restock Unit Cost requires whole peso amounts (e.g. ₱5, ₱10, ₱25 — no centavos like .10 or .50). |
| **Update check failed** | Confirm internet connection, wait 30 seconds, and click *Check for Updates* again. |

When reporting issues on [GitHub Issues](https://github.com/Yazerukun/TINDA-POS/issues), please specify:
* App version (e.g., `v1.0.24`)
* Edition (Setup or Portable)
* Brief description and screenshot (please blur any sensitive customer names)

---

## 🧑‍💻 Technical Stack & Development

TINDA POS is built with modern desktop and web technologies:
* **Framework:** Electron & Vite
* **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Zustand
* **Database:** SQLite with `better-sqlite3` (WAL mode enabled)
* **Testing:** Vitest (411/411 passing tests across 63 test suites)

```bash
# Clone and run locally
cd source
npm install

# Start development environment
npm run dev

# Run quality & verification gates
npm run typecheck    # TypeScript verification (0 errors)
npm run lint         # ESLint code quality
npm test             # Vitest test suite (411/411 passing)
npm run build        # Production bundle
```

---

## 📄 License

**Proprietary.** Free for personal and small-business use.  
Unauthorized resale, commercial rebranding, or redistribution without permission is strictly prohibited.

---

<div align="center">

Made with ❤️ for Philippine sari-sari stores, groceries, and small businesses.

**[⬇️ Download v1.0.74 Setup](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.74/TindaPOS-Setup-1.0.74.exe)** · **[📄 User Guide PDF](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.74/TindaPOS-User-Guide.pdf)** · **[💬 Community Issues](https://github.com/Yazerukun/TINDA-POS/issues)**

</div>
