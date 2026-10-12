# TINDA POS RELEASE RESUME

CURRENT STABLE:
- v2.1.5 (PRINTABLE INVENTORY SHEETS SEARCH & CLOUD ANALYTICS CALENDAR EDITION)

TARGET:
- v2.1.6 (NEXT RELEASE CYCLE)

CURRENT STAGE:
- Production Release — v2.1.5 Full Windows Setup & Portable Stable Release Published

COMPLETED:
- Stage 01: Supplier Trade / Series Compound Discounts Engine (`supplierDiscount.ts`): supports cascading discounts like `-5%-5%-5%`, `10+5`, `10/5`, `-10%-5%`, and flat currency (`₱50`), computing sequential integer-cent discounts matching distributor ERPs.
- Stage 02: Multi-Packaging Units Support in Purchase Invoices: `PACK`, `BUNDLE`, `ROLL`, `BOX`, `CASE`, `DOZEN`, `SACK`, `CAN`, `BOTTLE`, `KILO`, and `CUSTOM` with configurable base conversion multipliers (`Pcs/Unit`).
- Stage 03: Fast Item Entry Bar live calculation: shows instant preview of base stock addition (`+120 pcs`) and live trade discount breakdown (`Less 5% Less 5% Less 5% = -₱142.63 (-14.26%)`).
- Stage 04: Net Cost per piece catalog update: passing `netUnitCostC` into purchase posting updates catalog cost with true net discounted price.
- Stage 05: Invoices History Immunity & Self-Healing: Resolved SQLite missing table/column crash on existing databases by introducing self-healing `ensurePurchasesTables`, safe index ordering after column verification, resilient null-safe date formatting in `shortDate`, and defensive array fallback in `PurchaseInvoiceModal.tsx`.
- Stage 06: Proportional Refund Discount Invariant: `processRefund` prorates sale-level discounts onto refunded items, completely eliminating cash drawer bleed.
- Stage 07: Net Acquisition Landed Cost: `purchases.ts` records true net unit cost after trade discounts in both movements and catalog cost, restoring accurate Gross Profit and COGS.
- Stage 08: Dashboard 100k Limit: Removed silent 50-item cutoff in `dashboardStats`, ensuring full daily revenue accuracy.
- Stage 09: Cash Drawer Kick & Thermal Printer Feed: Exposed `window.api.printer.kickCashDrawer()` through IPC/preload, increased default tear-bar feed spacer to 5 lines (19mm), and fixed `flex-shrink: 0`.
- Stage 10: Migration 15 & Canonical Tables Update: Added 10 composite foreign key indexes in SQLite, resolved backup restore `product_recipes` foreign key collision.
- Stage 11: Interactive Real-Time Item & Letter Search for Printable Inventory Sheets (`InventoryPrintModal.tsx`): substring filter across names, skus, barcodes, categories, and descriptions (e.g. "elbow"), with live count badges and filtered total valuation.
- Stage 12: Cloud Owner Dashboard Custom Date Picker (`OverviewPage.tsx`, `BranchDetailPage.tsx`): custom `<input type="date">` calendar strip, synchronized date state across overview and branch view.
- Stage 13: Cloudflare D1 Backend `periodFinancials` Query & `LIMIT 100` Truncation Lift (`tinda-sync/src/reports.ts`): exact aggregate financial metrics and raised row limit to 300.
- Stage 14: SQLite 4:00 PM Double-Timezone Roll-Over Fix (`ewallet.ts`): replaced `date(created_at, 'localtime')` with `substr(created_at, 1, 10)` resolving premature day rollover.
- Stage 15: Quality Gates verified: Vitest (506/506 tests passing across 79 test files), Typecheck (0 errors across Node & Web), In-app live hot patch bundled & published to GitHub Releases (`v2.1.5`).
- Stage 16: Full Windows Setup & Portable Stable Release Packaging: electron-builder compiled `TindaPOS-Setup-2.1.5.exe`, `TindaPOS-Portable-2.1.5.exe`, `latest.yml`, and `SHA256SUMS-v2.1.5.txt`; published and verified as Latest Stable Release on GitHub Releases (`Yazerukun/TINDA-POS`).

PENDING APPROVAL:
- None (Approved by Owner).

BLOCKERS:
- None.
