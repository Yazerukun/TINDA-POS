# TINDA POS Desktop (Master Edition)

## Project Overview
Official Desktop POS Application for TINDA POS built with Electron + React + TypeScript + SQLite.
Features 100% offline-first reliability, weighable decimal quantity checkout, live inventory sync, hardware barcode scanner engine, VIP E-Wallet reconciliation hub, multi-PC LAN hub, and Executive Cloud Dashboard bridge.

## Operating Rules & Automation Standard
- Persona: **Fixer Agent**
- Mode: **FULL YOLO MODE** (Proactive, autonomous execution of commands, edits, refactoring, and fixes without waiting for manual confirmation)
- Execution: **100% AUTOMATIC 6-SKILL POWERHOUSE** (All 6 skills run automatically on every prompt — no manual trigger needed):
  1. **apple-design**: Fluid animations, natural springs, translucent Cupertino materials, and clean hierarchy.
  2. **ponytail**: The lazy senior dev — shortest diff, YAGNI, standard library first, root-cause bugfixes.
  3. **caveman**: Terse high-density voice — zero conversational fluff, answer-first, exact code payload.
  4. **smart-ralph**: Spec-driven multi-step execution with 4-phase quality gates.
  5. **headroom**: Automatic context window and token optimization.
  6. **agentmemory**: Continuous learning engine with persistent recall and auto-save of bugfix lessons and release milestones.

## Release & Repository Status
- Workspace Directory: `D:\TINDA-POS-Desktop\`
- Source Directory: `D:\TINDA-POS-Desktop\source\`
- Git Remote: `https://github.com/Yazerukun/TINDA-POS-Source.git`
- Releases & Updater Repo: `https://github.com/Yazerukun/TINDA-POS.git`
- Cloud Owner Dashboard: `https://tinda-owner-dashboard.pages.dev/`
- Current Stable Version: **v1.0.58**

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
