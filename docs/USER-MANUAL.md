# TINDA POS v1.0.2 User Manual

TINDA POS is an offline POS system for sari-sari stores. The core POS, inventory, customer, utang, expense, and reporting workflows remain usable offline.

This guide covers **TINDA POS v1.0.2 Hotfix 1** — the current stable release. The app's internal version stays 1.0.2; "Hotfix 1" identifies the latest published build.

## What's New in v1.0.2 Hotfix 1

- **Start New Store** — create a brand-new, empty store from Settings → Data.
- **Clearer Settings → Data** — the screen now explains the Shared AppData vs Portable data locations and how to switch.
- **Portable Data Mode** — keep the store database beside the Portable EXE in `TindaPOS-Data\`.
  - **Copy Current Store** — carry the existing store into the portable data folder.
  - Switch back to **Shared AppData** anytime.
- **Windows printer discovery** — TINDA POS lists the thermal receipt printers installed in Windows.
- **Refresh Printers** — re-discover printers, including ones installed while TINDA POS is open.
- **Test Print** — prints a test slip without creating a sale.
- **Auto Print After Sale** — silently prints a receipt after each completed sale.
- **Manual Print Receipt** — reprint an existing sale from Transactions.
- **80mm default receipt** — clearer, more readable layout out of the box.
- **58mm support** — for compact receipt printers.
- **Custom receipt header/footer** — store-specific text now appears on printed receipts.
- **Cash/SUKLI correction** — cash received is entered in pesos, not raw cents.
- **Full-refund status fix** — continuing a partial refund now ends with the sale **REFUNDED**.
- **Restore temporary-file cleanup** — leftover `.restore-*` sidecar files are removed after restore.
- **71/71 automated tests PASS**, lint PASS, typecheck PASS, production build PASS.
- Native Windows and physical thermal-printer validation is still pending (see below).

## Install and first setup

1. Download the latest stable **TINDA POS v1.0.2 Hotfix 1** package (see the Download section at the end of this guide).
2. Complete the first-run wizard: store details, administrator account, and receipt settings.
3. Log in, then add products from **Inventory**.

Windows may show SmartScreen because the release is not code-signed. Choose **More info → Run anyway** only after verifying the published SHA-256 values.

## POS and Checkout

1. Open **POS** and find a product by name, SKU, barcode, or category.
2. Add products and adjust quantities or discounts.
3. Select **Checkout**, choose a payment method, and confirm the sale.

### Cash and Sukli

Enter the cash received in pesos — type `50` for ₱50, `100` for ₱100 (never raw centavos). TINDA POS calculates and displays the sukli automatically.

### GCash and Maya recording

GCash and Maya are recording methods, not direct payment-provider API integrations. Enter the payment reference so the method, amount, and reference are stored with the transaction.

### Utang

Select an existing customer for an Utang sale. The amount is added to the customer ledger, subject to the configured credit limit.

### Split Payment

Use multiple payment rows to divide one checkout between supported methods. The recorded payment total must cover the sale total.

Inventory changes only after successful checkout or another completed inventory transaction.

## Hold Sale and Held Sales

1. Add items and any discount, then choose **Hold**. TINDA POS assigns a reference and clears the working cart.
2. Select **Held** to see the current cashier's held sales.
3. Choose **Resume** to resume a held sale. Confirm before replacing a non-empty cart.
4. Choose **Delete** and confirm to delete a held sale the customer no longer needs.

Held sales survive app restart. Holding, resuming, or deleting a held sale does not deduct stock; stock is deducted only after successful checkout. Each cashier can see and manage only their own held sales.

## Inventory and Tingi Units

Inventory supports products, categories, suppliers, SKU/barcode values, low-stock alerts, and stock adjustments. A product can have multiple selling units for tingi handling, such as a stick, piece, sachet, pack, tray, or other conversion to its base unit.

## Customers and Utang

Create customers, configure credit limits, review the full utang ledger, and record payments or authorized adjustments. Refund and void workflows reconcile the related stock and credit records.

## Settings → Data

Open **Settings → Data** to see where the database and backups live and to access Data Mode, Start New Store, Backup, Restore, and Reset Database.

### Shared AppData (default)

The default database location on Windows is:

```text
%APPDATA%\TINDA POS\database\tindapos.db
```

The Installer and Portable editions intentionally share the same AppData database. Moving or renaming the EXE does not create a fresh database; the app simply keeps using the same `%APPDATA%\TINDA POS` data profile. **Moving the Setup or Portable EXE to another folder or drive does NOT automatically move or reset the database.** Installing an update should continue using the existing data profile; do not manually delete the AppData database to update the application.

### Portable Data Mode

To keep a separate database beside the Portable EXE, open **Settings → Data → Use Portable Data**:

- **Start Fresh** — create a new empty portable store in `TindaPOS-Data\` beside the EXE.
- **Copy Current Store** — copy the current store into the portable data folder so the Portable EXE uses its own copy of your data.
- **Use Shared AppData** — switch the app back to the default `%APPDATA%\TINDA POS` database.

While Portable Data Mode is active, the store lives in the `TindaPOS-Data` folder next to the Portable EXE, so moving that folder moves the data with it.

### Start New Store

**Start New Store** creates a brand-new empty store. Requirements:

- You must be signed in with **Admin/settings permission**.
- Type the exact confirmation **NEW STORE**.
- A verified safety backup of the current database is created first.
- Existing backup files remain preserved.
- A fresh database is created and the app restarts automatically into the first-run setup wizard.

> **Warning:** Do not manually delete `tindapos.db` unless instructed for troubleshooting. Use the built-in Data-management actions instead.

## Reset Database

Reset also creates a fresh active store database, but it is a separately guarded action used for troubleshooting; it is not needed for an ordinary application update, and it is not the same as Start New Store. Reset requires:

- **Admin/settings permission**.
- The exact `RESET` confirmation.
- A safety backup created and verified before the active database is removed.
- Existing backup files remain preserved.
- The app restarts automatically and shows the first-run setup wizard.

1. Sign in with an account that has ADMIN/settings permission.
2. Open **Settings → Data → Reset Database**.
3. Read the warning and type `RESET` exactly.
4. TINDA POS creates and verifies a safety backup before removing the active database.
5. Existing backup files remain preserved.
6. The app restarts automatically and shows the first-run wizard.

If the safety backup fails, Reset Database is cancelled without deleting the active database.

## Backup and Restore

- Use **Backup Now** regularly. Existing backups are stored separately from the active database.
- Restore validates the selected backup's SQLite header, expected TINDA POS tables, and database integrity before replacement (backup validation + integrity check).
- TINDA POS creates and validates a safety backup of the current database before restore.
- Restore uses rollback protection if replacement fails, so the active database is not left half-replaced.
- Temporary `.restore-*` sidecar files are cleaned up after a successful restore.
- After a successful Restore, TINDA POS restarts automatically (auto-relaunch) and opens the restored data.
- Restoring an older backup intentionally removes active changes made after that backup.
- All existing backups are preserved; a restore never deletes your backup history.

## ONLINE READY and OFFLINE READY

- **ONLINE READY** means a real connectivity check succeeded and configured cloud-sync software can upload mirrored backup copies.
- **OFFLINE READY** means internet verification failed, but the core local POS remains usable offline.
- TINDA POS does not upload directly to a cloud API. Optional backup mirroring targets a folder managed by OneDrive, Google Drive for desktop, or Dropbox.

## Transactions and Receipt Generation

Transactions lets authorized users view receipt details, generate/reconstruct receipt lines, refund eligible items, or void eligible sales. Windows receipt-printer support is implemented, including printer discovery, Test Print, Auto Print, and manual Print Receipt. Native Windows/thermal-printer validation is still pending.

## Receipt Printer Setup

Windows receipt-printer support is built through the Windows printer subsystem using the exact device name Windows reports (Electron printer discovery). No vendor-specific driver logic is used, so any Windows-installed thermal receipt printer works.

Settings → **Receipt / Printer** provides these options:

- **Printer** — the saved receipt printer (selected from the detected list).
- **Refresh Printers** — re-discover installed printers.
- **Auto Print After Sale** — print automatically after each completed sale.
- **Paper Width** — 80mm (default) or 58mm.
- **Copies** — 1 to 3 copies per print job.
- **Test Print** — prints a test slip without creating a sale.
- **Custom Receipt Header / Custom Receipt Footer** — store-specific text printed at the top and bottom.

### Recommended printer

- **80mm USB Thermal Receipt Printer**.
- Windows-compatible printer driver installed.
- ESC/POS-compatible preferred.
- Auto-cutter recommended.
- No specific printer model is claimed certified until it is physically validated; 58mm printers are also supported.

### Printer Setup Guide (step by step)

1. Connect the receipt printer to the Windows PC.
2. Install the printer manufacturer's Windows driver.
3. Confirm the printer appears in **Windows Settings → Printers**.
4. Open TINDA POS.
5. Go to **Settings → Receipt / Printer**.
6. Click **Refresh Printers**.
7. Select your printer from the list.
8. Select the paper width:
   - **80mm** (recommended), or
   - **58mm**.
9. Set **Copies** (1–3).
10. Click **Save**.
11. Run **Test Print** to confirm the printer, width, and layout.
12. Enable **Auto Print After Sale** if you want automatic printing.

The printer **Status** shown in Settings is honest: **Ready** only when the saved printer is actually installed; **Unavailable** when a previously selected printer disappears (the sale still completes — you are prompted to refresh the list or choose again; TINDA POS never silently routes receipts to another printer); **Not configured** when nothing is selected.

Automatic cutting is performed by the printer driver: enable **Auto Cut** in the thermal printer's Windows driver/preferences if the printer does not cut automatically.

## Auto Print After Sale

- **ON:** a receipt is submitted automatically after the sale is successfully saved (one silent print job; no Windows print dialog).
- **OFF:** the sale completes normally, and the receipt can be printed manually later.

**Important:** A printer failure never cancels or rolls back a completed sale. If printing fails:

1. Open the sale in **Transactions**.
2. Use **View Receipt** to see the receipt.
3. Use **Retry Print** after choosing/configuring a printer in Settings → Receipt / Printer.

Retrying to print does **NOT** duplicate the transaction — the same sale is simply printed again.

## Manual Print

Transactions → **Print Receipt** prints an existing sale only. It does not:

- create another sale,
- deduct stock again, or
- recreate a payment.

**View Receipt** is a separate action: it reconstructs and shows the existing sale's receipt on screen (same 80mm/58mm layout that will be printed) without printing.

Receipt printing never happens before a sale is committed, and a printer failure never blocks, rolls back, duplicates, or double-charges a sale. Copies are clamped to 1–3 per job, and each Auto Print job is sent exactly once per completed sale.

## Receipt Format

A printed receipt includes, in order:

- Custom **Header** text
- **Store Name** and store details
- **Transaction number**
- **Date/time**
- **Cashier**
- **Customer**, if the sale is for a customer
- **Items** with:
  - Quantity
  - Unit price
  - Line total
- **Subtotal**
- **Discount**
- **Total**
- **Payment method** and details:
  - Cash received and **SUKLI** (change)
  - GCash/Maya **reference** number
  - Utang/customer info for credit sales
- Custom **Footer** text

## 80mm and 58mm

- **80mm** — recommended. Clearer receipts with a more readable item/price layout (`~72mm` printable width).
- **58mm** — supported for compact printers (`~48mm` printable width).

Long product names wrap automatically instead of being clipped, on both paper widths. The on-screen **View Receipt** preview always matches the printed layout.

## Refund Status

- **COMPLETED** — no refund has been recorded for the sale.
- **PARTIALLY_REFUNDED** — part of the sale has been refunded.
- **REFUNDED** — all refundable quantities have been refunded.

Stock is restored based on the refunded quantities, and any related utang/credit records are reconciled. A partial refund can be continued until the sale reaches **REFUNDED** (the final refund no longer leaves the sale stuck at PARTIALLY_REFUNDED).

## Other workflows

- **Expenses and Shifts:** record expenses and reconcile expected versus actual cash.
- **Reports:** review sales, inventory, and utang, then export CSV.
- **Suppliers:** maintain supplier details and product relationships.

## Safety and troubleshooting

- Keep regular backup copies on another drive or in a synced folder.
- Do not shut down Windows during Restore or Reset Database.
- Seeing the same store data after moving the Portable EXE is expected because data follows `%APPDATA%\TINDA POS`, not the EXE directory. Use **Settings → Data → Use Portable Data** if you want the database beside the Portable EXE.
- A rejected restore usually means the file is missing, corrupted, or not a compatible TINDA POS SQLite backup.
- If a receipt does not print, check the printer is powered on, installed in Windows, and selected in Settings → Receipt / Printer, then use **Refresh Printers** and **Test Print**.

## Download

**Latest Stable Release: TINDA POS v1.0.2 Hotfix 1**

Download: <https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.2-hotfix.1>

Files:

- `TindaPOS-Setup-1.0.2.exe` — Windows installer
- `TindaPOS-Portable-1.0.2.exe` — no-install portable edition
- `TindaPOS-User-Guide.pdf` — this guide
- `SHA256SUMS.txt` — checksums for the files above (verify with `sha256sum -c SHA256SUMS.txt`)

The supported target is Windows 10/11 64-bit. Native Windows and physical thermal-printer validation is still pending; no printer model is claimed certified.