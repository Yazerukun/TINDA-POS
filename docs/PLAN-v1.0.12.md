# v1.0.12 Implementation Plan

## Task
Implement per-item/per-batch expiration and alerts, preserve Software Update.

## Milestones
- [x] Inspect current GitHub/source state: Latest v1.0.11; local v1.0.12-dev.
- [x] Add migration and stock allocation logic; focused repository/service tests pass.
- [x] Add product/restock/withdraw controls and inline categories; Playwright interactions pass.
- [x] Final source QA: 228 tests; typecheck/lint/build/PDF/diff check passed.
- [ ] Freeze/package/updater acceptance/release review: separate release stage, not claimed here.

## Scope
Expiration modes, batch allocation/restoration, stock alerts, categories, docs.
Existing X-Read changes are preserved. Updater/dependencies/release assets are
out of scope. No push or publication without final review and owner approval.

## Risks and Decisions
Existing stock dates cannot be inferred; default None. Enabling batch tracking
with stock requires a verified date. Legacy returns are undated and blocked
until reviewed. Non-sale batch reductions require explicit batch selection.
Expiry day remains sellable; past dates block sales. Local machine date applies.

Created: 2026-09-14.
