## TINDA POS v1.0.18 Stable

RC source commit: `ca07d93`
Updater gate: byte-identical to v1.0.17 (electron-updater + electron-builder untouched — verified git diff EMPTY + packaged app-update.yml / latest.yml identity).

### What's new

- **Itemized Accordion for Recent Transactions**:
  - **Dashboard – "Recent Transactions" card**: Each transaction row is now expandable. Collapsed view shows a 1-line item preview (e.g. "Sprite ×2, Biscuit ×1"). Clicking the row expands it inline to reveal a full itemized breakdown: product name, quantity × unit, and subtotal per item, plus the payment method(s) used and any discount applied.
  - **Transactions page – table rows**: The Receipt # column now has a chevron (▾/▴) toggle. Clicking it expands a sub-row spanning the full table width, showing a mini-table with columns: Product | Qty | Unit Price | Subtotal. A footer bar displays the payment method(s) with amounts and the transaction total.
  - Only one row is open at a time (click again to collapse).
  - No changes to the existing View Receipt / Print / Refund / Void actions.

### QA

- TypeScript typecheck: 0 errors
- All existing tests PASS
- No backend/database changes — items were already included in the transactions API response

### Assets

- `TindaPOS-Setup-1.0.18.exe` (Setup installer + blockmap + latest.yml + Windows updater)
- `TindaPOS-Portable-1.0.18.exe` (Portable edition, no install)
- `TindaPOS-User-Guide.pdf` (v1.0.18)
- `SHA256SUMS-RC.txt` (verify all assets)
