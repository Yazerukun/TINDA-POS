# TINDA POS v1.0.23 Stable

Release target: `v1.0.23`
Updater gate: byte-identical firmware of updater machinery (electron-updater + electron-builder + app-update.yml untouched in this release, allowing seamless auto-update from v1.0.19, v1.0.20, v1.0.21, and v1.0.22 to v1.0.23).

## What's new

### 1. Global Responsive Table Auto-Fit & Alignment
- Standardized all tables across the entire application (Utang, Transactions, Customers, Expenses, Backup, Inventory, Settings, and Reports).
- Enforced `table-layout: fixed`, `text-center`, `align-middle`, and proportional percentage widths summing to 100%.
- Contained tables in `.table-container` with `overflow-x-auto` to dynamically auto-fit across all screen sizes (small laptop screens 1366×768, standard 1080p, 2K, and 4K monitors) without columns shifting or crooked layouts.
- Standardized Utang column headers to clean English: **Customer**, **Credit Limit**, **Balance**, **Status**, and **Actions**.

### 2. Product Picture Uploads
- Added ability for store owners to upload, preview, and remove product images in the Inventory product modal.
- Fast and resilient image serving using custom `tinda-image://` protocol scheme with base64 IPC fallback.
- Added visual thumbnail images to product cards in POS checkout and Inventory product cards.

### 3. Suggested Retail Price (SRP) & Auto-Markup
- Added database Migration 7 (`srp_c` column on `products`).
- Auto-markup helper buttons (`+10%`, `+15%`, `+20%`, `+25%`, `+30%`) based on purchase cost.
- Real-time profit margin indicator (% and ₱) and 1-click **"Use as Price"** button to set selling price to SRP.
- Added SRP reference badge on POS product cards for cashier guidance.

### 4. Dashboard Background Update Notification
- Automatic background update check on Dashboard launch (`useUpdate.check(false)`).
- Prominent, dismissible notification banner displaying the new release version, toggleable release notes, and 1-click **Download** / **Restart & Install** buttons.

## QA & Verification

- Vitest: **268/268 tests pass** (40 test files).
- TypeScript: `tsc` typecheck **0 errors**.
- Build: `npm run build` production bundle passes cleanly.
- Database & accounting integrity: Zero regressions on financial calculations, inventory movements, or customer balances.
- Backward compatibility: Legacy database support preserved without column errors.

## Assets

- `TindaPOS-Setup-1.0.23.exe` (Windows installer + auto-update payload)
- `TindaPOS-Portable-1.0.23.exe` (Portable edition)
- `TindaPOS-User-Guide.pdf` (v1.0.23)
- `SHA256SUMS-v1.0.23.txt`
- `SHA256SUMS-RC.txt`
