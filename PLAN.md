# PLAN.md — TINDA POS Full Expansion Roadmap (Phases 1–5)

> Master implementation roadmap. Governed by strict non-destructive upgrade invariants and zero-data-loss architecture.
> Target Release: TINDA POS v1.0.43 (Full Comprehensive Suite)

## Non-Negotiable Invariants
1. **Zero Data Corruption (Rule #7):** Never touch, truncate, or overwrite existing user SQLite databases (`tindapos.db`), customer utang records, products, or transactions.
2. **100% Cryptographic VIP Pro Preservation (Rule #8):** Never break existing `tinda_license.json` or machine bindings. All existing VIP Pro customers continue with 100% unlocked access across all releases.
3. **Additive-Only Database Migrations:** All schema changes strictly use `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ADD COLUMN`.
4. **Zero Counter Paralysis:** Checkout, selling, barcode scanning, and payments never block or freeze.

---

## Phase Breakdown

### ✅ Phase 1: Store Petty Cash Out, Z-Read Reconciliation & True Net Profit (COMPLETED)
- [x] **M1.1:** Backend IPC & Permissions — Allow cashiers with active shifts to record store petty cash without permissions blocking.
- [x] **M1.2:** Z-Read Cash Balancing — Recalculates expected cash by subtracting recorded cash expenses.
- [x] **M1.3:** POS Petty Cash Modal (`F7` Hotkey) — Dedicated quick cash-out dialog with categories, audio chirp, and toast feedback.
- [x] **M1.4:** True Net Profit Dashboard & Reports — Displays `Gross Profit - Operating Expenses`.
- [x] **M1.5:** Automated Test Suite — `petty-cash-profit.test.ts` passing (51/51 suites, 340/340 tests).

---

### ✅ Phase 2: Expiration / Spoilage Date Tracker & Near-Expiry Alerts (COMPLETED)
- [x] **M2.1:** Backend Expiry Query & Filter Engine — Surface products by expiration status (`EXPIRED`, `SOON` 7d, `NEAR` 30d).
- [x] **M2.2:** Inventory Expiry Watch UI — Expiration filter tabs (`Expired`, `Expiring Soon`) and color-coded shelf badges in `Inventory.tsx`.
- [x] **M2.3:** Cashier Scan Alert for Near-Expiry Items — Soft toast warning prompt when scanning items near expiration during POS checkout.
- [x] **M2.4:** Dashboard Spoilage & Expiry Card — Direct visual breakdown of expired and expiring items with quick 1-click filter links.
- [x] **M2.5:** Phase 2 Unit Tests & Verification — `expiration-status.test.ts` passing (52/52 suites, 347/347 tests).

---

### ✅ Phase 3: Wireless Customer-Facing Display (CFD) & Dynamic E-Wallet QR Screen (COMPLETED)
- [x] **M3.1:** Local CFD HTTP/HTTPS Endpoint — Served `/cfd` and `/display` in `phoneScannerService.ts` for dual-screen customer view over local Wi-Fi.
- [x] **M3.2:** Real-Time Cart Mirroring — Broadcast current checkout items, quantities, subtotal, and discounts to connected customer screens with sub-50ms latency.
- [x] **M3.3:** Dynamic GCash / Maya QR Code Generation — Pure in-memory SVG QR code generator (zero new npm dependencies via `@zxing/library`) with exact centavo totals.
- [x] **M3.4:** Screen Wake Lock API — Embedded `navigator.wakeLock` keeps customer tablet/phone screen awake at the counter.
- [x] **M3.5:** Phase 3 Unit Tests & Verification — `cfd-dynamic-qr.test.ts` passing (53/53 suites, 353/353 tests).

---

### ✅ Phase 4: Wholesale Tiering & Automated Volume Discount Engine (COMPLETED)
- [x] **M4.1:** Additive Wholesale Schema (Migration 10) — Added `wholesale_price_c` and `wholesale_min_qty` to `products` table via `ALTER TABLE`.
- [x] **M4.2:** Cart Auto-Tiering Engine — POS automatically applies wholesale price when quantity threshold is reached in checkout cart. Reverts if qty drops.
- [x] **M4.3:** Visual Wholesale Indicators — Cart item `🏷️ Wholesale Tier` badge with base price strikethrough, product grid card wholesale indicators, and inventory list badges.
- [x] **M4.4:** Inventory Product Form UI — Manage wholesale price and minimum quantity with validation.
- [x] **M4.5:** Phase 4 Unit Tests & Verification — `wholesale-pricing.test.ts` passing (54/54 suites, 358/358 tests).

---

### ✅ Phase 5: Android Free App Parity, Master Documentation & Release Verification (COMPLETED)
- [x] **M5.1:** Android Schema Synchronization — Verified Dexie schema and models in `TINDA-POS-Android-Free` for desktop parity.
- [x] **M5.2:** Universal `.tinda-backup` Verification — Verified bidirectional backup/restore exchange between Android Dexie and Desktop SQLite.
- [x] **M5.3:** Final Master Documentation Sync — Updated `SYSTEM_MASTER.md` Sections 22–27 with complete architecture documentation.
- [x] **M5.4:** Full Verification Gates Passed — 54/54 Vitest test suites (358 tests) passing, clean TypeScript types, clean production build.

---

### 💎 Phase 6: VIP E-Wallet & Cash Audit Hub — GCash, Maya, Cash-In/Out & 3-Way Audit (IN PROGRESS)
- [ ] **M6.1: Additive Database Schema (Migration 11)** — Create `ewallet_transactions` and `ewallet_audits` tables with non-destructive index creation.
- [ ] **M6.2: Shared Types & Accounting Calculations** — Define `EwalletTransactionRecord`, `EwalletAuditRecord`, fee computation, and drawer impact helpers.
- [ ] **M6.3: Backend Repository, IPC Handlers & VIP Cryptographic Gating** — Secure operations behind `licenseService.getStatus().isVip` with hardware verification.
- [ ] **M6.4: Thermal Claim Stub & Audit Sheet Formatting** — 58mm/80mm printable slips for customer proof of transfer and end-of-day audit reports.
- [ ] **M6.5: Interactive UI Module & VIP Gating Experience** —
  - Cash In / Cash Out express register with customizable service fees.
  - 3-Way Audit Sheet: Physical Cash on Hand (Denomination Counter) + GCash App Balance + Maya App Balance = Over/Short/Balanced variance.
  - Dedicated VIP Upgrade Banner and demo preview for Community Edition users.
- [ ] **M6.6: Automated Vitest Test Suite & Master Verification** — Comprehensive unit and integration test coverage (`ewallet-audit.test.ts`), typecheck green, and master invariants verified.

