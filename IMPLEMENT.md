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

