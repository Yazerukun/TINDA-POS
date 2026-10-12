# TINDA POS RELEASE RESUME

CURRENT STABLE:
- v2.0.9 (PURCHASE INVOICES HISTORY IMMUNITY & SELF-HEALING MIGRATION FIX EDITION)

TARGET:
- v2.1.0 (NEXT RELEASE CYCLE)

CURRENT STAGE:
- Live Feature Patch & Source Release Publishing

COMPLETED:
- Stage 01: Supplier Trade / Series Compound Discounts Engine (`supplierDiscount.ts`): supports cascading discounts like `*-5%-5%-5%`, `10+5`, `10/5`, `-10%-5%`, and flat currency (`₱50`), computing sequential integer-cent discounts matching distributor ERPs.
- Stage 02: Multi-Packaging Units Support in Purchase Invoices: `PACK`, `BUNDLE`, `ROLL`, `BOX`, `CASE`, `DOZEN`, `SACK`, `CAN`, `BOTTLE`, `KILO`, and `CUSTOM` with configurable base conversion multipliers (`Pcs/Unit`).
- Stage 03: Fast Item Entry Bar live calculation: shows instant preview of base stock addition (`+120 pcs`) and live trade discount breakdown (`🏷️ Less 5% Less 5% Less 5% = -₱142.63 (-14.26%)`).
- Stage 04: Net Cost per piece catalog update: passing `netUnitCostC` into purchase posting updates catalog cost with true net discounted price.
- Stage 05: Invoices History Immunity & Self-Healing: Resolved SQLite missing table/column crash on existing databases by introducing self-healing `ensurePurchasesTables`, safe index ordering after column verification, resilient null-safe date formatting in `shortDate`, and defensive array fallback in `PurchaseInvoiceModal.tsx`.
- Stage 06: Quality Gates verified: Vitest (502/502 tests passing across 78 test files), Typecheck (0 errors across Node & Web).

PENDING APPROVAL:
- None (Approved by Owner).

BLOCKERS:
- None.


