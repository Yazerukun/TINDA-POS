# TINDA POS v1.0.12

- Inventory expiration tracking with three product modes: **None**, **Per Item**, and **Per Batch**.
- Dated restocking with optional batch label; base-unit quantities are preserved.
- Earliest-eligible-expiry stock allocation at checkout; expired and undated tracked stock is blocked from sale.
- Batch-specific withdrawals and audited date corrections.
- Original batch allocation restored on refunds and voids; untracked legacy returns go through date review.
- Searchable expiration list with red/orange/yellow statuses, global live alert counts, and a once-per-login Tagalog reminder.
- Inline Add Category on New/Edit Product; duplicate names reuse the existing category.
- Refined X-Read/Z-Read report layout.
- Fixed the Sales chart's collapsed bars, with responsive axes, readable period labels and exact-value tooltips. Report calculations are unchanged.

Migration 6 adds product tracking fields and batch tables. Existing product
records, quantities, transactions, reports, and backups are not rewritten;
tracking defaults to None. Per-item expiry applies to all stock of that product.
Tracked modes cannot be switched while stock remains. CSV does not carry batch
metadata; batch stock changes use Restock/Withdraw instead.

Dates are local calendar days: stock expires after its marked date, not at the
start of that date. Shelf handling must match earliest-expiry stock allocation.

Software Update uses the same GitHub provider and installer settings as v1.0.11;
no updater or dependency changes are included.
Install using Settings > About > Software Update > Check for Updates.

Physical thermal-printer validation remains pending; automated printing and browser layout checks passed.
