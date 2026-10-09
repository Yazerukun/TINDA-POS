# PLAN — Pinned Categories (POS + Dashboard)

**Version target:** v1.0.90 (patch release via `npm run publish:patch`)
**Feature type:** Renderer-only. No DB migration. No main-process change.
**Status:** DRAFT — awaiting owner approval.

---

## What it does

Store admin **pins** favourite product categories. Pinned categories appear as
1-tap buttons in the POS top bar and as a "Quick Categories" row on the
Dashboard. All users see the pins; only the admin/settings screen sets them.

Preview:
```
POS top bar:   [All] [★ Drinks] [★ Snacks] [ Other ▾ ]
Dashboard:     ┌─ Quick Categories ─┐
               │ ★ Drinks  ★ Snacks  │
               └────────────────────┘
```

---

## Why renderer-only (and why that's safe for a patch)

The install-time **feature patch** system (`tools/bundle_patch.mjs` +
`patchService.ts`) ships only the `out/renderer/` bundle, with SHA-256
verification and auto-rollback. Pinning is pure UI state, so it fits inside
that envelope — **no migration, no data risk, instant delivery.**

Storage decision: reuse the existing `settings` key/value table.
Store pinned IDs as a JSON string under one key: `pos_pinned_categories`
(e.g. `"[3,7,12]"`). `getSettings`/`updateSettings` already handle a plain
string value, so **no schema change is needed**.

---

## Phases

### Phase 1 — Data plumbing (main + shared)
| Item | File |
|------|------|
| Add `pos_pinned_categories: number[]` to `StoreSettings`; default `[]` | `src/shared/types.ts` |
| Add `pos_pinned_categories: '[]'` to `defaultSettings`; parse JSON→number[] in `getSettings`, stringify in `updateSettings` | `src/main/repositories/settings.ts` |
| Confirm existing `settings.update` IPC carries it (no new channel) | `src/shared/ipc.ts` |

**Risk:** low. Backward compatible — old rows return `[]`.
**Verify:** node round-trip test on settings repo.

### Phase 2 — POS top bar pins
| Item | File |
|------|------|
| Render pinned category buttons next to "All"; 1-tap calls existing `chooseCategory(id)` | `src/renderer/src/pages/POS.tsx` |
| Read pins from settings store; keep existing `categoryMenuOpen` dropdown for the rest | `src/renderer/src/pages/POS.tsx` |

**Risk:** low — reuses `chooseCategory` and `catFilter` that already work.
**Verify:** manual click-through in dev; typecheck.

### Phase 3 — Dashboard quick row
| Item | File |
|------|------|
| Add "Quick Categories" row using existing `SectionCard`/`StatusBadge` | `src/renderer/src/pages/Dashboard.tsx` |
| Each chip navigates to POS with that category pre-filtered (via `useNav`) | `src/renderer/src/pages/Dashboard.tsx`, `src/renderer/src/stores/nav.ts` |

**Risk:** low.
**Verify:** manual click-through; typecheck.

### Phase 4 — Admin pin control
| Item | File |
|------|------|
| New "Pinned Categories" block in Settings (existing tab, likely HOME) with pin/unpin toggles | `src/renderer/src/pages/Settings.tsx` |
| Gate edit to admin role (existing `useAuth` role check) | `src/renderer/src/pages/Settings.tsx` |

**Risk:** low.
**Verify:** toggle persists after restart; non-admin sees pins but cannot edit.

### Phase 5 — Verification (project standard)
```
cd source
npm run typecheck
npm test
node ../tools/check_master_invariants.mjs
git diff --check
```
All must PASS (the 2 pre-existing `patchService` tar failures are environment
noise on Git Bash — tracked separately, not introduced here).

### Phase 6 — Patch release
```
# after owner approval of final review
cd source && npm run publish:patch        # bumps 1.0.89 -> 1.0.90
```
Publishes `TindaPOS-Feature-Patch-1.0.90.zip` to `Yazerukun/TINDA-POS`.
Update `docs/RELEASE-STATE.md` after each stage.

---

## Guardrails (per docs/RELEASE-WORKFLOW.md)
- Never push/tag/publish without explicit owner approval (Stage 11 stop).
- Preserve offline-first, RBAC, Portable Data Mode unless in scope.
- No scope creep — this is pins only, not bundles.
- One RC commit; clean tree before patch.

---

## Open questions
1. Pos of admin control: Settings → HOME tab, or a new small tab?
2. Dashboard chips should switch to POS with filter, or filter in place?
3. Cap pin count (e.g. max 6) to keep the bar readable?