# Pinned Categories Dual-Store & Real-Time Visibility Repair Architecture (v1.0.92)

## 1. Problem Diagnosis: "Dili Makita ang Gi Pin"

### Root Causes Identified:
1. **Backend SQLite String/Number Serialization & Array Check Failure**:
   - In SQLite `settings` table, `pos_pinned_categories` was stored as `'8'` (single string or comma-separated numbers) rather than an array.
   - When `getSettings()` ran in `settings.ts`:
     ```ts
     const parsed = JSON.parse(v) // JSON.parse('8') = 8 (number)
     out[key] = Array.isArray(parsed) ? parsed : [] // Array.isArray(8) is FALSE!
     ```
     `Array.isArray(8)` returned `false`, wiping out the setting to `[]`. Every pinned category was reset to empty array on load.
   - If multiple categories were saved without array brackets (`"8,9"`), `JSON.parse` threw a `SyntaxError`, which also wiped it out to `[]`.
2. **Missing Client-Side Dual-Store Persistence for In-App Hot-Patches**:
   - When applying live hot patches (`npm run publish:patch`), the renderer is hot-reloaded in ~0.3s without restarting the underlying Electron main process.
   - If state relies purely on main process IPC and the main process drops or misses a newly added setting key, client updates are discarded.
3. **Strict Equality Type Mismatch**:
   - `c.id === id` failed when one was a number (`8`) and the other was a string (`"8"`), causing pinned categories to be filtered out from chips and cards.
4. **Active Search Term Collision**:
   - In `POS.tsx`, clicking a category chip previously called `search(q, categoryId)`. If text remained in search (`q`), products in the selected category that didn't match `q` were hidden, giving the impression that the category was empty.

---

## 2. Engineered Solution Architecture

### Pillar 1: Universal Settings Array Parser (`parsePinnedCategoryIds`)
Located in `source/src/main/repositories/settings.ts`:
- Robustly parses:
  - Valid arrays: `[1, 2, 8]` -> `[1, 2, 8]`
  - String arrays: `'[1, 2, 8]'` -> `[1, 2, 8]`
  - Single numeric strings: `'8'` -> `[8]`
  - Comma-delimited strings: `'1,2,8'` -> `[1, 2, 8]`
  - Single numbers: `8` -> `[8]`
- Automatically deduplicates and filters out non-positive/NaN values.
- In `updateSettings`: Enforces JSON serialization `JSON.stringify(parsePinnedCategoryIds(v))` so stored rows are always well-formed.

### Pillar 2: Client-Side Dual-Store Persistence Engine (`categoryCustomization.ts`)
Located in `source/src/renderer/src/utils/categoryCustomization.ts`:
- **Storage Key**: `tinda_pinned_categories_v1` in `localStorage`.
- **Event Bus**: `tinda-pinned-categories-changed` dispatched on `window` whenever pins update.
- **Reconciliation (`reconcilePinnedCategoryIds`)**: Merges IDs from `localStorage` and `settings.pos_pinned_categories`. Guarantees 0ms local state persistence across restarts, hot patches, and reloads.
- **Save / Toggle (`savePinnedCategoryIds`, `togglePinnedCategoryId`)**:
  1. Synchronously updates `localStorage` (0ms latency).
  2. Dispatches `tinda-pinned-categories-changed` custom event to immediately re-render all mounted components in the exact same frame.
  3. Dispatches backend `updateSettings` in the background for database persistence.

### Pillar 3: Resilient Number Comparison & Reactive Event Sync Across UI
- **`PinnedCategoriesBar.tsx`**:
  - Listens to `tinda-pinned-categories-changed` for instant updates.
  - Matches category objects via `Number(c.id) === Number(id)`.
  - Supports click-to-toggle: Clicking an active category chip toggles back to 'ALL Items'.
- **`POS.tsx`**:
  - Category dropdown pin button uses `togglePinnedCategoryId` with 0ms reactive feedback.
  - `selectedCategory` label matches using `Number(category.id) === Number(catFilter)`.
  - `chooseCategory` resets `q` (`setQ('')`) so filtered products are immediately visible on screen.
- **`CustomizeCategoriesModal.tsx`**:
  - Uses reactive `pinnedIds` synced via `reconcilePinnedCategoryIds` and event listener.
  - Category list checks `isPinned` via `Number(id) === Number(category.id)`.
  - Creation auto-pin and bundle auto-pin persist through `savePinnedCategoryIds`.
- **`Dashboard.tsx`**:
  - Safely reads `reconcilePinnedCategoryIds(settings?.pos_pinned_categories)`.
  - Refreshes tiles on `tinda-pinned-categories-changed` without altering React hook order.

---

## 3. Verification & Quality Gates
1. Unit tests added in `source/src/shared/__tests__/pinned-categories.test.ts` (6/6 passing).
2. All shared tests passing (81/81 passing).
3. Dashboard refund tests passing (4/4 passing).
4. TypeScript typecheck clean (0 errors across node and web).
5. Master invariants verified safe to build (`check_master_invariants.mjs`).
