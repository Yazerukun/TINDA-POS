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

