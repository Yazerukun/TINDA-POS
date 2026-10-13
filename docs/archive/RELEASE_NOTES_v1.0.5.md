# TINDA POS v1.0.5

## Stock Receiving

- Added a clear Inventory → Stock Receiving history for legitimate Restock, Purchase, and opening-stock events.
- Review the received product, quantity/unit, base quantity, previous/new stock, supplier, cost, reference, notes, receiver, date, and source.
- Search and filter receiving history without treating sales, damage, loss, or other negative movements as received stock.
- New receiving records appear automatically after committed inventory changes.

## Realtime cart stock

- POS product cards now show cart-aware Available Stock immediately as items are added, reduced, removed, or cleared.
- Cart actions do not alter permanent inventory; stock is deducted exactly once after successful checkout.
- Quantity limits and stock-conflict warnings prevent overselling when database stock changes while a cart or held sale is open.
- Existing base-unit conversion remains authoritative for multi-unit quantities.

## Data and update safety

- Added an additive, non-destructive migration for structured receiving metadata.
- The production updater provider and the v1.0.4 fixed-updater baseline remain unchanged.
