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
- Current Stable Version: **v1.0.55**

## Key Features in v1.0.55
1. **VIP E-Wallet & Cash Audit Hub Polish (Client Feedback Addressed)**:
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
