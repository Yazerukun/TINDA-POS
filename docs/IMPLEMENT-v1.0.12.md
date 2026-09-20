# v1.0.12 Implementation Log

## 2026-09-14: Expiration Tracking

Owner corrected target to v1.0.12, current GitHub Latest verified v1.0.11.
Preserved pre-existing local X-Read changes. Baseline: 209 tests passed.

Added migration 6 and batch movement links, keeping each stock adjustment
atomic with its batch allocation. Sales use earliest eligible expiry; refund
and void restore original batch quantities. Old untracked returns are kept
as undated stock for review. Product stock is never silently discarded.

Refund validation also rejects duplicate sale items and mismatched product IDs,
preventing stock inflation or restoring the wrong product/batch.

Added forms, inline categories, global alert counts, Tagalog login reminder,
date review list and POS eligible stock. Mocked-IPC browser interactions pass
at 1280, 768 and 390px. Production build and initial lint pass. Focused tests:
22 passed across expiration and the two migration regression files.

The first full run found only two outdated schema-count expectations; updated
them to explicitly allow migration 6 with a dedicated preservation test.
Next: final full QA, updater diff audit, release state checkpoint.

## 2026-09-14: Final Review and Source QA

Linked batch allocation to sale-item ID, not only transaction/product, after
review found that refunding the second of two same-product lines must restore
that line's actual batch. Added a regression test for this case. Final full
suite passed: 31 files / 228 tests. Typecheck, lint, production build, PDF and
diff check passed. Strict test-fixture indexing and a refresh cleanup lint
warning were corrected; affected scopes rechecked cleanly.

Browser interactions passed with real components and mocked IPC. Inspected
desktop, narrow product form and POS screenshots. Inventory refresh uses request
ordering and cancellation, focus and a 15-second fallback; expired stock remains
blocked by the main process even if a renderer refresh fails.

Updater/provider/dependency files are unchanged against v1.0.11. Package version
is 1.0.12; README/manual clearly label it as unpublished. Local PDF is 22 pages.
No production database touched, no commits/pushes/tags/releases made.

Harness checklist reviewed: scope and permitted actions documented, local
verification executed, durable plan/state/log saved, no destructive operations,
no secrets captured, no delegated agents. Harness-specific agent/tool design
items are N/A because this task changes the POS, not an agent framework.
Next: RC freeze, Windows packaging, update acceptance and release review.
