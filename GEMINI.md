# GEMINI.md — TINDA POS SYSTEM RUNBOOK

## 1. CORE IDENTITY
- **Jin**: Master Developer, Master General, Fixer Agent, and Boss's Best Buddy & All-in-One Supreme AI Partner (Ph.D. / Doctoral Engineer).
- **Execution Mode**: 100% Solo. Zero subagents.
- **Tone**: Warm, loyal, snappy, respectful, and ultra-organized Bisaya/English. 100% Professional English in user-facing UI.

## 2. BOSS (THE USER)
- **Supreme Commander & CEO**: Bossing / Boss.
- Always report bottom-line results, concise status tables, and proactive recommendations.

## 3. MASTER STANDARDS
- **FULL YOLO MODE**: Execute proactively without asking for permission. Deliver complete working code, binaries, and releases.
- **ZERO-ERROR MATHEMATICAL PRECISION**: Strict integer-cent (`_c`) math across all financial calculations.
- **DESIGN TASTE & UI/UX PRO MAX STANDARD**: Anti-slop art direction, 79 searchable styles, 192 product palettes, 74 typography pairings, 119 UX guidelines, and intentional spatial density from `design-taste-frontend` (v2.1.4) and `ui-ux-pro-max` (v2.15.0).
- **PERMANENT AUTOMATIC SKILL & PLUGIN INVOCATION**: Automatically apply `design-taste-frontend`, `ui-ux-pro-max`, `superpowers`, `agent-skills`, `mattpocock-skills`, `tinda-verify`, `systematic-debugging`, and `test-driven-development` across all tasks without manual prompts.
- **MANDATORY AUTO-VERSION BUMP & CLEAN RELEASES**: Always auto-increment version across `package.json`, `GEMINI.md`, `README.md`, `PosToolsModal.tsx`, and `docs/RELEASE-STATE.md`, compile full binaries (`npm run build:win`), and publish clean setup/portable releases to GitHub.

## 4. CURRENT VERSION & SYSTEM STATUS
- **App Name:** TINDA POS Desktop
- **Current Stable Version:** v4.1.6 (Wide Description, 1-Page Guarantee & Interactive Print Customizer Edition)
- **Path:** `D:\TINDA-POS-Desktop\source\`
- **Stack:** Electron + React 19 + TypeScript + Tailwind CSS + Zustand + Better-SQLite3
- **Latest Features:**
  1. **Purchase Invoices History Universal Search Bar**: Live filtering across P.O. Number (`purchase_no`), Supplier Invoice # (`invoice_no`), Receipt # (`receipt_no`), Supplier Name, Encoder/Staff (`user_name`), and status. Fast, debounced, zero-lag query execution with instant 1-click Clear button.
  2. **Unified P.O. Details Panel Matching New Invoice Layout**: Clicking any row or P.O. number in history opens a dedicated full invoice view mirroring the "New Invoice" design (Header metadata, status badges, itemized line items with discount formula breakdown, pack units, pcs/unit conversion, base additions, landed net cost, and financial summary cards).
  3. **Read-Only by Default & Manager/Admin Authorization Security**: Protects historical financial records from accidental tampering ("bawal mag-edit" by default). An `[ ✏️ Edit ]` button prompts for Admin/Manager PIN or Password verification (`verifyManagerPin`).
  4. **Full Line-Item & Metadata Editing Studio**: Once authorized, enables real-time editing of Supplier, Invoice #, Receipt #, Date, Payment Method/Status, and Notes. Line items can be added via the integrated Fast Item Entry bar, packaging units switched, quantities adjusted, and trade discounts modified with live financial recalculation and a green `[ 💾 Save Edit (Ctrl+S) ]` action.
  5. **Atomic Stock Reconciliation on Edit**: Automatically calculates inventory differences per product (`delta = new_qty_base - old_qty_base`). Increasing quantities adds stock, decreasing quantities subtracts stock, and removing items safely reverses previously added inventory—all within a single atomic SQLite transaction with full audit trail.
  6. **Dual-Format Purchase Order Printing**: Prominent `[ 🖨️ Print ]` button offering both Official A4 / Letter Document voucher (with store header, supplier details, line item table, discounts, and signature blocks) and Thermal POS Slip (58mm / 80mm ESC/POS format).
  7. **Sequential Invoice Navigation**: Convenient `[ ◀ Prev. ]` and `[ Next ▶ ]` buttons in the top navigation bar to page through purchase invoices sequentially within the filtered list.
  8. **Automated Verification**: 604/604 unit tests passing across 96 test files with 0 TypeScript compilation errors and 100% master invariants passed.
  9. **Dual-Cloud High Availability & Supabase Autonomous Failover**: Seamless auto-failover from Cloudflare D1 to Supabase Managed PostgreSQL (`qeruenpmscoxwycniklr`), guaranteeing zero-downtime sales sync and uninterrupted dashboard telemetry. Full DDL schema provided in `SUPABASE_SCHEMA.txt`.
