# PLAN.md — Multi-Terminal Local LAN & Self-Hosted VPS Synchronization

> Task planning artifact. Created at the start of the task; updated as milestones are reached.
> Governed by strict security invariants and zero-data-loss architecture.

## Task

Architect, specify, and implement the **Secure Multi-Terminal Local LAN Hub (Master-Satellite Mode)** and **Self-Hosted VPS Cloud Mirroring Bridge** for TINDA POS to fulfill retail multi-computer and remote owner monitoring feedback.

## Context

Two distinct retail user feedback requests were submitted:
1. **User Feedback 1 (Local Multi-Computer):** Multiple computers in one store (Cashier 1, Cashier 2, Stockroom/Back Office) sharing a single unified database with zero internet dependency (100% offline).
2. **User Feedback 2 (Self-Hosted VPS):** A store owner inquiring about connecting to a personal Linux VPS for remote sales monitoring from home or smartphone.

Security and data safety are the absolute non-negotiable priority:
- Raw SQLite over SMB/Windows file share is strictly prohibited (causes database corruption and `SQLITE_BUSY` locking starvation).
- Local LAN communication must use an authenticated RPC service with 6-digit Security PIN and HMAC session tokens.
- Race conditions on inventory (e.g. two cashiers selling the last item at the same second) must be serialized via `BEGIN IMMEDIATE` atomic transactions.
- Satellite terminals must be locked down with Cashier-only permissions (no Database Reset or Backup Restore privileges).
- Physical store must remain 100% offline-first; retail checkouts must never hang or stall due to network or internet latency.

## Approach

1. **Phase 1: Architecture & Comprehensive User Guide:**
   - Formalize the complete Multi-PC LAN Hub and VPS Cloud Synchronization Blueprint in `SYSTEM_MASTER.md` Section 10.
   - Author `docs/MULTI_PC_AND_VPS_GUIDE.md` detailing step-by-step instructions for store owners, network topologies, pairing procedures, and safety checklists.
2. **Phase 2: Local LAN Hub Service Core (`lanHubService.ts`):**
   - Implement lightweight authenticated HTTP/RPC and WebSocket server in Electron main process.
   - Master Terminal mode exposes authenticated endpoints for POS operations (`products:search`, `checkout:process`, `customers:list`, `utang:payment`, `inventory:movements`).
   - Pairing handshake generates transient 6-digit PIN and issues signed HMAC-SHA256 tokens.
   - WebSocket emits `inventory:changed` broadcasts on every sale to update stock across all terminals in real-time.
3. **Phase 3: Satellite Client IPC Proxy:**
   - When configured in Satellite Mode, the Satellite PC routes `window.api` calls through the LAN RPC client to the Master's IP rather than its local SQLite file.
   - Local fallback cache ensures UI responsiveness even if Wi-Fi packets drop momentarily.
4. **Phase 4: Store Settings & POS HUD Integration:**
   - Add **"Terminal Network Mode"** in TINDA POS Settings: `[●] Standalone (Single PC) | [ ] Master Server (Host) | [ ] Satellite Client (Terminal)`.
   - Master mode displays Local IP Address, Active Port, and "Generate Pairing PIN".
   - Satellite mode provides Host IP input, PIN verification, and "Connect" test button.
   - Header badge shows network connection status (`🟢 LAN Master: 2 Terminals` / `🟢 Connected to Master (192.168.1.15)`).
5. **Phase 5: Self-Hosted VPS Documentation & Sync Bridge Contract:**
   - Provide complete deployment instructions for users operating their own Linux VPS (DigitalOcean / Linode / Hetzner).
   - Document HTTPS reverse proxy configuration, API token authentication, and asynchronous batch sync endpoints.

## Milestones

- [x] **M1: Architecture Blueprint & Master Documentation Sync** — Update `SYSTEM_MASTER.md` Section 10 and author `docs/MULTI_PC_AND_VPS_GUIDE.md`.
- [x] **M2: LAN Service Types & IPC Interface Specification** — Define TypeScript models for Network Mode, Pairing Handshake, RPC Payloads, and Security Tokens.
- [x] **M3: LAN Hub Engine (`lanHubService.ts`) & Atomic Transaction Guard** — Implement Master RPC server, 6-digit PIN handshake, and serialized checkout queue.
- [x] **M4: Satellite Terminal Client Proxy** — Implement network RPC dispatching for satellite terminals with automatic reconnection.
- [x] **M5: Settings UI & Header Connection Badges** — Add Terminal Network Mode settings panel and live connection status indicators.
- [x] **M6: Comprehensive Test Suite & Quality Verification** — Add Vitest suites covering pairing, authorization rejection, and race conditions. Typecheck 100% clean (47/47 suites, 323/323 tests).
- [ ] **Final: Production Packaging & Release** — Build and verify Windows installers and update changelogs.

## Scope boundaries

In scope:
- Local offline Wi-Fi/Ethernet LAN Master-Satellite architecture.
- 6-digit PIN pairing and token authentication.
- Serialized transaction queue for zero race condition stock deductions.
- Role-based lockdown preventing satellite terminals from executing destructive administrative commands.
- Comprehensive self-hosted VPS guide and async sync architecture documentation for users deploying their own cloud VPS.

Out of scope (explicitly excluded):
- Cloud VPS hosting provided or billed by the developer (VPS is strictly self-hosted by the store owner).
- Raw SMB Windows file share mounting of SQLite `.db` (permanently banned to prevent data corruption).

## Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Wi-Fi Packet Jitter / Latency** | Cashier UI delays during checkout | Sub-5ms lightweight JSON-RPC over local LAN; keep payload sizes minimal (<2KB). |
| **Simultaneous Last-Item Checkout** | Negative inventory or data collision | Enforce SQLite `BEGIN IMMEDIATE` atomic transaction locking; first commit wins, second cashier gets prompt stock alert. |
| **Unauthorized LAN Infiltration** | Eavesdropping on store sales | Require 6-digit PIN pairing handshake and cryptographically signed session tokens. |
| **Router Outage / Power Glitch** | Interrupted network connection | Master terminal operates 100% offline locally; Satellites show clear reconnection banner with automatic exponential backoff. |

---
*Created: 2026-09-27*
