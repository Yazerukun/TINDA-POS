# RELEASE PLAN v1.0.16

CURRENT STABLE: v1.0.15 (tag v1.0.15)
TARGET: v1.0.16
RELEASE TYPE: PATCH / BUGFIX

## Scope & User Feedback:

1. Windows Auto-Start Reliability:
   - Problem: In Windows 10/11, registry-based login items can be blocked or silently disabled by Task Manager Startup settings and Windows SmartScreen, requiring users to click desktop shortcuts manually.
   - Solution: Dual-layer startup registration. In addition to `app.setLoginItemSettings`, create/remove a direct Windows Startup folder shortcut (`%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\TINDA POS.lnk`) using Electron's `shell.writeShortcutLink`.
   - Result: TINDA POS reliably starts immediately upon computer power on/boot without manual shortcut clicking. Portable editions remain unaffected.

2. Estimated Profit Calculation & Decimal (.10) Fix:
   - Problem: Users reported strange `.10` or centavo discrepancies in Estimated Profit on reports and dashboard.
   - Root Causes:
     a. `sales.total_c` in SQLite was already calculated as `subtotal - discount`. In `reporting.ts` and `dashboard.ts`, code was doing `summary.sales_total_c - summary.discount_c - summary.cost_c`, which subtracted discounts twice.
     b. POS CartPanel discount input displayed raw centavos rather than Pesos. Users intending to discount ₱10 were confused seeing 1000, and users typing `0.10` ended up setting a 10-centavo discount.
     c. Floating-point aggregation sums in SQLite queries lacked rounding before integer assignment.
   - Solution:
     a. Removed double discount subtraction in `reporting.ts` and `dashboard.ts`: `profit_c = Math.round(sales_total_c - cost_c)`.
     b. Bound POS discount input in Pesos: `discount_pesos / 100` for display, `Math.round(val * 100)` for state.
     c. Applied `Math.round()` on SQLite cost and profit sums.

3. Payment Breakdown Alignment in Live Print / Receipts:
   - Problem: In split payments (e.g. Cash + GCash), receipts printed `Cash`, then `SUKLI`, then `GCash`. This visually separated payment tenders and made Change look disconnected from total payments.
   - Solution: Group all tender payment lines (Cash, GCash, Maya, Utang) together first, then print `SUKLI` at the bottom of payments. Added `TOTAL PAYMENTS` summary line in X/Z-Read reports.

## Non-Negotiable Gates:
- UPDATER CHANGES: STRICTLY NONE. `electron-builder.yml`, `updateService.ts`, `updateStore.ts`, `updateTransport.ts`, `updateDownload.ts`, `updateRuntime.ts`, and `pnpm-lock.yaml` remain byte-identical. Existing v1.0.15 installs can seamlessly update.
- DATABASE CHANGES: NONE.
- LOCAL BUILD ONLY: DO NOT PUBLISH, push tags, or create GitHub releases without Ian's explicit approval.
