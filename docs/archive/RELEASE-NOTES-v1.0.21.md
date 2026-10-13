# TINDA POS v1.0.21 Stable

Release target: `v1.0.21`
Updater gate: byte-identical firmware of v1.0.19/v1.0.20's updater machinery (electron-updater + electron-builder + app-update.yml untouched in this release, allowing seamless auto-update from v1.0.19/v1.0.20 to v1.0.21).

## What's new

### 1. Utang Customer Filter Tabs (May Utang, Bayad Na, Tanan)
- In the **Utang** management page, store owners and cashiers can now easily filter customers with dedicated tabs:
  - **May Utang (With Balance) [Default]:** Shows only customers who currently have an active credit balance (`balance > 0`). Prevents clutter and helps staff focus on pending collections.
  - **Bayad Na (Settled):** One-click view of all customers who have fully paid off their accounts (`₱0.00` balance).
  - **Tanan (All):** Displays all customer accounts regardless of balance.
- Each tab features a live counter badge (e.g. *May Utang (12)*, *Bayad Na (45)*).

### 2. Utang Quick Stats Summary Bar
- Three high-visibility summary cards at the top of the Utang page:
  - **Total Outstanding Utang:** Real-time total credit balance across all customers (`text-rose-400 font-mono`).
  - **May Utang (Active):** Total count of customers with unpaid credit.
  - **Bayad Na (Settled):** Total count of fully settled accounts (`text-emerald-400`).

### 3. Clear Visual Status Badges
- Upgraded customer status badges in the Utang table:
  - **`BAYAD NA ✓` (Green badge):** For customers with `₱0.00` balance.
  - **`MAY UTANG` (Amber badge):** For customers with an active balance within their limit.
  - **`OVER LIMIT` (Red badge):** For customers exceeding their credit limit.

### 4. Contextual Action Buttons
- Customers with outstanding utang show a direct **`Pay`** button for quick collection, alongside **`Adj`**.
- Fully settled customers replace the Pay button with a **`Ledger`** button, allowing quick review of past payment history without accidentally opening a payment prompt on a zero balance.

## QA & Verification

- Vitest: **268/268 tests pass** (40 test files).
- TypeScript: `tsc` typecheck **0 errors**.
- Build: `npm run build` production bundle passes cleanly.
- Accounting & database integrity verified: zero changes to customer balance calculations or ledger storage.
- Software updater compatibility verified 100%.

## Assets

- `TindaPOS-Setup-1.0.21.exe` (Windows installer + auto-update payload)
- `TindaPOS-Portable-1.0.21.exe` (Portable edition)
- `TindaPOS-User-Guide.pdf` (v1.0.21)
- `SHA256SUMS-v1.0.21.txt`
- `SHA256SUMS-RC.txt`
