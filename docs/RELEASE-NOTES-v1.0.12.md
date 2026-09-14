# v1.0.12 Local Candidate

Not published. Public Latest remains v1.0.11.

## Inventory Expiration

- Product tracking modes: None, Per Item, Per Batch.
- Batch expiry and optional label during Restock; base-unit quantities preserved.
- Earliest eligible expiry allocation at checkout; expired/undated stock blocked.
- Batch-specific withdrawals and audited date corrections.
- Original batch restored on refunds/voids; untracked legacy returns need date review.
- Searchable expiration list, red/orange/yellow statuses, global live alert counts,
  and a once-per-login Tagalog reminder when attention is needed.
- Inline Add Category on New/Edit Product; duplicate names reuse the existing category.

## Compatibility

Migration 6 adds product tracking fields and batch tables. Existing product
records, quantities, transactions, reports, and backups are not rewritten;
tracking defaults to None. Per-item expiry applies to all stock of that product.
Tracked modes cannot be switched while stock remains. CSV does not carry batch
metadata; batch stock changes use Restock/Withdraw instead.

Dates are local calendar days: stock expires after its marked date, not at the
start of that date. Shelf handling must match earliest-expiry stock allocation.

Previously prepared X-Read changes remain in the local candidate; see
[X-Read notes](X-READ-HOTFIX.md). No changes to Software Update implementation,
provider, installer configuration, or dependencies.

## Release Status

Source implementation and automated/browser QA are separate from publication.
Windows packaging, installed-update acceptance, final release review and owner
publication approval remain required before shipping this candidate.
