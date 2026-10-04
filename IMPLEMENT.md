# IMPLEMENT.md — Implementation Log for Multi-Terminal LAN & VPS Setup

> Append-only log of technical decisions, rationale, deviations, and test results.

## 2026-09-27: Architecture Initiation & User Feedback Alignment

- **Trigger:** Two separate client feedback inquiries:
  1. Multiple computers sharing one database in the physical store (Local Multi-PC).
  2. VPS cloud setup for remote store monitoring.
- **Decision 1 (Scope Clarity):** TINDA POS remains 100% offline-first and free of mandatory cloud dependencies. Developer does NOT host or bill for cloud servers. VPS setup is documented and provided as a self-hosted option for store owners who choose to run their own VPS.
- **Decision 2 (Database Safety Invariant):** Rejected Windows SMB network folder sharing of `tindapos.db` due to proven SQLite cache incoherence and index corruption under multi-client write loads. Enforced Master-Satellite architecture with an authenticated RPC service.
- **Decision 3 (Security Model):**
  - Transient 6-digit PIN pairing with HMAC session tokens.
  - Role-based lockdown: Satellite terminals have no access to Database Reset, Backup Restore, or raw file operations.
  - Concurrency guard: Serialized checkout transactions via `BEGIN IMMEDIATE` to prevent race conditions when two terminals sell the same item at the same time.

## 2026-09-27: Implementation & Quality Verification

- **Engine Core Created:** Authored `lanHubService.ts` providing Master RPC server (port 3111), transient 6-digit PIN generation, HMAC-SHA256 device registration, and Server-Sent Events (SSE) real-time event broadcasting (`inventory:changed`).
- **Main IPC Integration:** Updated `source/src/main/ipc/index.ts` to expose `dispatchRpc` and automatically proxy remote data operations from Satellite terminals to the Master PC over local LAN. Forbidden administrative operations (`data:resetDatabase`, `backup:restore`) are strictly blocked on remote satellites.
- **UI Components Delivered:**
  - `NetworkSettingsTab.tsx` in Settings page: Standalone, Master Server, and Satellite Terminal selector cards with local IP display, PIN generator, and connected device list.
  - Self-Hosted VPS Cloud Mirroring configuration panel with test connection and manual sync triggers.
  - POS header badges: Real-time LAN connection status (`🟢 LAN Master (X)` / `🟢 Satellite Linked` / `⚠️ LAN Reconnecting`).
- **Verification Gates:**
  - TypeScript typecheck: 0 errors across `tsconfig.node.json` and `tsconfig.web.json`.
  - Vitest test suite: 47/47 suites passing, **323/323 tests passing** (including all 8 new tests in `lanHubService.test.ts`).

## 2026-09-27: v1.0.37 Cryptographic Anti-Theft Licensing & VIP Pro Architecture

- **Trigger:** Protecting developer intellectual property and implementing a sustainable ₱500 one-time lifetime license model.
- **Decision 1 (Anti-Tamper & Anti-Crack Protection):**
  - Built offline hardware scraping engine in `licenseService.ts` targeting Motherboard UUID, Baseboard Serial, CPU ID, Windows Machine GUID, and network MAC.
  - Deterministic HMAC-SHA256 signature format: `TNDA-XXXX-XXXX-XXXX-XXXX` with obfuscated runtime XOR-masked secret pepper.
  - License files (`tinda_license.json`) are cryptographically guarded; modifying store name, Machine ID, or tier invalidates the HMAC and reverts to Community Edition.
  - Keys generated for one machine mathematically fail on any other machine.
- **Decision 2 (VIP Pro vs Community Edition Separation):**
  - **Free Community Edition:** 50-product catalog limit, single-counter mode, standard watermark on thermal receipts.
  - **VIP Pro Edition (₱500 Lifetime):** Unlimited products, Multi-PC LAN Hub Master/Satellite, Suki Utang Credit Trust Rating (⭐⭐⭐⭐⭐), 1-Click SMS Collection Reminders, custom thermal receipt branding.
- **Decision 3 (Developer Automation & Workflow):**
  - Created standalone developer keygen CLI `tools/keygen.mjs` (private repository only).
  - Created Omarchy Linux system shortcut `~/.local/bin/tinda-keygen` with Wayland clipboard integration (`wl-copy`) for instant copy-pasting into Facebook Messenger.
  - Centered Settings UI with sliding upgrade banner and 1-click Machine ID copy.
- **Decision 4 (Workspace Organization & Pruning):**
  - Pruned over 4.4GB of dead intermediate build artifacts and old .exe files.
  - Consolidated historical release docs into `docs/archive/` and historical blockmaps/checksums into `installers/archive/`.
- **Verification Gates:**
  - TypeScript typecheck: 0 errors across Node and Web.
  - Vitest test suite: 49/49 suites passing, **332/332 tests passing** (including 8 license service tests and Settings VIP test).

## 2026-09-30: v1.0.43 Phase 1 — Non-Destructive Update Protocol, VIP Preservation & Store Expenses
- **Trigger:** Ian's strategic feature roadmap directive: execute strictly phase by phase, update `SYSTEM_MASTER.md` permanently, and guarantee zero data corruption or VIP license loss for existing users upon updating.
- **Decision 1 (Strict Non-Destructive Invariant):**
  - Codified Rule #7 & #8 in `SYSTEM_MASTER.md` and Section 22.
  - User application data in Windows `%APPDATA%\TINDA POS\` (`tindapos.db`, `tinda_license.json`) is never touched, truncated, or overwritten by updates.
  - All future migrations strictly additive (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN`).
  - Cryptographic HMAC key derivation algorithm, hardware entropy, and pepper bytes are frozen permanently to guarantee 100% license validity for all existing and future VIP Pro customers.
## 2026-10-04: v1.0.53 Phase 6 — VIP E-Wallet & Cash Audit Hub (GCash, Maya, Cash-In/Out & 3-Way Audit)
- **Trigger:** Store owner client feedback requested by Ian: adding Cash-In, Cash-Out, and Cash on Hand audit for GCash and Maya, exclusively gated for VIP Pro merchants.
- **Decision 1 (VIP Pro Exclusivity):**
  - Gated at backend IPC (`licenseService.getStatus().isVip`) and frontend UI.
  - Community edition stores receive a non-blocking interactive preview with clear upgrade value propositions and payment instructions.
- **Decision 2 (Freeform Service Fees):**
  - Store owners set their own transaction fee rates without forced hardcoded minimums or rigid percentages. Editable with 1-click quick-fill shortcuts (e.g. ₱10, ₱15, ₱20).
- **Decision 3 (3-Way Reconciliation Model):**
  - Physical Cash on Hand: Integrated denomination breakdown (₱1,000 down to 25¢).
  - GCash Ledger: Starting balance + Inflows - Outflows vs Actual App balance = Variance.
  - Maya Ledger: Starting balance + Inflows - Outflows vs Actual App balance = Variance.
  - Total Tubo / Profit Earned Tracker: Distinct from retail product margins.
- **Decision 4 (Thermal Receipt Proofs):**
  - 58mm/80mm claim slip for customers (Cash-In/Cash-Out reference receipt).
  
## 2026-10-04: v1.0.54 Phase 7 — Bulletproof User Management & Multi-Account Login System
- **Trigger:** Store owner feedback requesting seamless multi-cashier login, error-free PIN unlock, admin password resets, and user management guardrails.
- **Decision 1 (Flexible Case-Insensitive Auth):**
  - Updated `auth.ts` `login()` with `LOWER(u.username) = LOWER(?) OR LOWER(u.full_name) = LOWER(?)`.
  - Cashiers can type their real display name or username in any case without login friction.
- **Decision 2 (Target-Aware PIN & Collision Prevention):**
  - Updated `loginPin(pin, targetUserId?)` to directly test the selected user's PIN hash when a user is selected.
  - Implemented `checkPinUniqueness()` during PIN change and admin reset to block duplicate PINs among active staff.
- **Decision 3 (Admin Password Reset & Safe Public Directory):**
  - Added `auth:adminResetPassword` handler guarded by `users:manage` permission.
  - Added `auth:publicUsers` handler exposing only safe display fields (`id`, `username`, `full_name`, `roles`) with zero hash exposure.
- **Decision 4 (Polished UI & Deactivation Guardrails):**
  - `Settings.tsx`: Show/Hide password toggles (`👁️`), confirm password matching, in-modal password/PIN change, separate Reset Password modal, and safety guards preventing users from deactivating themselves or the store's sole active Admin.
  - `Login.tsx`: 1-tap cashier avatar chips for instant profile selection with automatic PIN mode switch and target-aware authentication.
- **Decision 5 (Comprehensive Verification):**
  - Authored `user-management.test.ts` (18 unit/integration tests).
  - All 61 Vitest suites passing (401/401 tests).
  - Zero TypeScript errors across Node and Web targets.
  - Clean production build verified via `electron-vite build`.
