# TINDA POS v1.0.6 User Manual

TINDA POS is an offline POS system for sari-sari stores. The core POS, inventory, customer, utang, expense, and reporting workflows remain usable offline.

This friendly guide is for sari-sari store owners, managers, and cashiers. TINDA POS works offline for everyday selling, inventory, utang, expenses, and reports.

> TINDA POS v1.0.6 is an unreleased updater fix under validation. Current public stable: v1.0.5. Installed v1.0.3–v1.0.5 require a manual Setup upgrade when the fixed release is approved.

## Quick start and first-time setup

**WHERE TO GO:** Open TINDA POS → First-time Setup.

1. Enter the store name and optional address, owner, phone, and TIN.
2. Create the Admin username, password, and PIN. Isulat ito sa ligtas na lugar.
3. Choose basic receipt settings, then finish setup and log in.
4. Open **Inventory → New Product** to add your first item.

Roles are simple: **Admin** controls users, settings, data, and all workflows; **Manager** manages store operations and may finalize Z-Reads; **Cashier** sells, handles their shift, and sees permitted reports. Never share an Admin password with every cashier.

## Login and Dashboard

Enter your username/password or assigned PIN on Login. The Dashboard shows today's sales, transactions, expenses, utang, recent sales, and low/out-of-stock products. Stock alerts update automatically after a successful stock transaction.

## Products, SKU, barcode, and categories

**WHERE TO GO:** Inventory → New Product.

Enter a product name, optional unique SKU/barcode, category, base unit, cost, selling price, low-stock level, and opening stock. Click **Save**. Use the pencil button to edit a product. SKU is your own product code; barcode is the code scanned at POS. Duplicate SKU or barcode values are rejected. Use **Inventory → Categories** to add or organize categories.

Opening stock is saved with an inventory-history entry. Editing ordinary details does not silently rewrite stock.

## Restock (Paano mag restock?)

**WHERE TO GO:** Inventory → **Restock**, or click the Restock button on a product card.

**WHAT TO ENTER:**

1. Piliin ang product.
2. Enter **Quantity to Add**.
3. Choose the unit, such as sachet or box.
4. Optionally choose supplier and enter cost, reference, and notes.
5. Check the conversion and **New Stock** preview.
6. Click **Save Restock**.

**EXAMPLE:** Current Stock: 24 sachets. Restock: 2 boxes. If 1 box = 24 sachets, the preview shows `2 × 24 = 48 sachets`; New Stock: 72 sachets.

Quantity must be greater than zero and cost cannot be negative. Restock creates a PURCHASE/receiving movement with user and timestamp; it never silently overwrites stock.

## Stock Receiving (Ano ang mga stock na dumating?)

**WHERE TO GO:** Inventory → **Stock Receiving**.

Kung gusto ninyong makita kung anong stocks ang dumating ngayong araw, pumunta sa **Inventory → Stock Receiving**. Makikita rito ang received product, quantity at unit, previous/new stock, supplier, date/time, cost, reference, notes, source, at kung sino ang nag-receive.

Gamitin ang Search Product, Date From/To, Supplier, at Source filters para mabilis makita ang kailangan. Click ang row para sa complete read-only details. Ang Restock at legitimate Purchase Receiving ay automatic na lalabas agad—hindi kailangan ng manual Refresh. Ang CSV opening stock ay malinaw na naka-label bilang opening/import stock, at hindi delivery. Damage, loss, sale, at ibang negative movements ay hindi ipinapakitang received stock.

## Stock adjustment and low stock

Use the authorized inventory adjustment/count workflow for damage, loss, expiration, return, or a physical-count correction. Enter the real reason. Low Stock means the quantity reached its configured alert; Out of Stock means zero. Restock is for deliveries, while Adjustment is for corrections.

## CSV Product Import

**WHERE TO GO:** Inventory → **Import CSV**.

1. Click **Download Template**.
2. Fill in `product_name` and `selling_price`. SKU, barcode, category, cost, stock, low-stock level, supplier, and base unit are optional.
3. Save as CSV and click **Select CSV**.
4. Review Total, Valid, Invalid, and Duplicate counts.
5. Fix every invalid row using the exact row number/reason shown.
6. For existing SKU/barcode values, choose **Skip Existing** or **Update Existing**.
7. Click **Import Products**.

Nothing is saved during Preview. The final import is all-or-nothing: if a fatal database error occurs, all changes roll back. Opening stock creates inventory history. Successful imports appear automatically in Inventory and POS.

## Tingi and multi-unit products

The base unit is the smallest stock unit, such as sachet, piece, or bottle. A larger selling/restock unit uses the existing conversion—for example, 1 box = 24 sachets. Stock is always protected and recorded in whole base units.

## X-Read

**WHERE TO GO:** Reports → X-Read.

X-Read shows the current open shift: sales, discounts, refunds, voids, net sales, Cash/GCash/Maya/Utang, split payments, expenses, expected cash, and transaction count. Click **Print X-Read** for a paper copy. X-Read is read-only: it does not close the shift, reset totals, change stock, or finalize anything. You may generate it many times.

## Z-Read and Z-Read History

**WHERE TO GO:** Reports → Z-Read.

1. Review the final summary.
2. Enter actual cash for reconciliation.
3. Click **Finalize Z-Read** and read the confirmation.
4. Confirm only when the reporting period is finished.

Z-Read closes/finalizes that shift and saves an immutable snapshot. It never deletes transactions, payments, expenses, inventory history, or customer ledger entries. The same shift cannot be finalized twice. Only Admin/Manager may finalize.

Open **Reports → Z-Read History** to inspect and print an old saved snapshot. Old Z-Reads do not change when later database activity occurs.

## Realtime stock

After a successful sale, refund, void, restock, adjustment, CSV import, or purchase receiving, Inventory, POS, and Dashboard stock views refresh automatically. Hindi kailangang paulit-ulit pindutin ang Refresh. TINDA POS uses committed events, not aggressive internet polling; a failed/rolled-back transaction sends no success event.

### Realtime cart stock sa POS

Kapag nag-add ng product sa cart, bababa agad ang **Available Stock** sa POS. Kapag binawasan, tinanggal, o ni-clear ang item sa cart, babalik agad ang available quantity.

Ang permanenteng stock deduction ay mangyayari lamang pagkatapos ng successful checkout. Walang database stock movement habang nag-aayos pa lamang ng cart, kaya walang double deduction at walang nawawalang stock kapag kinansela o nag-fail ang checkout.

Hindi puwedeng lumampas ang cart sa current database stock. Kung nagbago ang stock habang may item sa cart o habang naka-Hold ang sale, magpapakita ang POS ng stock warning at iba-block ang checkout hanggang ma-adjust ang quantity. Ang multi-unit products ay gumagamit ng existing base-unit conversion; halimbawa, ang 1 box na 24 sachets ay nagre-reserve ng 24 base units.

## Suppliers, purchases, receiving, and expenses

Use **Suppliers** to maintain supplier contact details and review linked products/purchases. Purchase receiving adds stock using the same inventory movement history. Record operating expenses under **Expenses**, choosing the category, amount, date, description/reference, and notes. These expenses are included in shift reports.

## Refund, Void, Shifts, and cash reconciliation

Open **Transactions**, select the saved sale, and choose Refund for returned quantities or Void for an eligible mistaken sale. A reason is required. Stock and related utang records are reversed through their histories. Never create a fake negative sale.

Open a shift with starting cash before selling. At closing/Z-Read, compare expected cash with actual drawer cash and record a useful note for any difference. Cash-in and cash-out movements belong to the open shift.

## Users, roles, audit logs, and Settings

Admin can manage users under **Settings → Users**. Give each person only the role needed. Authorized Admin users can review audit logs where exposed by the application. Under Settings, configure store details, receipt/printer, data modes, users, and About/software updates.

## Common Questions / Madalas Itanong

**Q: Paano mag restock?**

A: Inventory → Restock, choose product/unit, enter the delivered quantity, verify New Stock, then Save Restock.

**Q: Paano tanggalin ang “TINDA POS” sa receipt?**

A: Settings → Receipt → turn OFF **Show TINDA POS App Name**. Leave Receipt Title blank for no heading, or enter your store title.

**Q: Paano mag-import ng CSV products?**

A: Inventory → Import CSV → Download Template → fill it in → Select CSV → fix invalid rows → choose duplicate handling → Import.

**Q: Ano ang X-Read?**

A: Current shift report only. It does not finalize or change data.

**Q: Ano ang Z-Read?**

A: Final, saved snapshot of the shift/reporting period.

**Q: Mawawala ba ang transactions pagkatapos ng Z-Read?**

A: Hindi. Transactions and all histories remain saved.

**Q: Kailangan ba i-refresh ang inventory pagkatapos ng sale/restock?**

A: Hindi normally; relevant screens update automatically after success.

**Q: Gagana ba offline?**

A: Yes. Core POS functions use the local database. Internet is needed only for update checking or third-party folder syncing.

**Q: Saan naka-save ang database?**

A: Settings → Data shows the exact active database. Shared Windows mode normally uses `%APPDATA%\TINDA POS\database\tindapos.db`; Portable Data Mode uses `TindaPOS-Data` beside the Portable app.

**Q: Paano gumawa ng backup?**

A: Settings → Data → Backup Now. Keep another copy on a separate drive or synced folder.

## What's New in v1.0.3

- **In-app Software Update** — check for updates, see What's New, download, and update directly from Settings → About → Software Update, without visiting a website.
- **Automatic update check** — on startup, TINDA POS quietly checks the official GitHub release page (at most once per day). If an update is available, a non-intrusive notification appears.
- **What's New** — released updates show their change notes as plain text inside the update prompt. Nothing from the internet is ever executed.
- **One-click Restart & Install** — installed (Setup) builds download the update and offer **Restart & Install**; the app never restarts on its own.
- **Portable-friendly updates** — the Portable edition never overwrites itself. It downloads the new Portable EXE into the `Downloads\TINDA-POS-Updates` folder, and you run the new version from there.
- **Safety first** — before an update installs, TINDA POS creates and validates a safety backup of your store database. Updates are held if that backup cannot be made, and you are never interrupted in the middle of a checkout, refund, backup, restore, or store reset.
- **Stable-only updates** — only released stable versions are offered; drafts, prereleases, and invalid versions are ignored.
- **Offline-friendly** — with no internet, checks fail quietly and TINDA POS keeps working fully offline.

## Install and first setup

1. Download the latest stable **TINDA POS** package (see the Download section at the end of this guide).
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

Transactions lets authorized users view receipt details, generate/reconstruct receipt lines, refund eligible items, or void eligible sales. Windows receipt-printer support is implemented, including printer discovery, Test Print, Auto Print, and manual Print Receipt. Native Windows/thermal-printer validation is still pending for physical printer hardware; native Windows application and packaging QA passed, and no printer model is claimed certified.

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

## Software Update

The fixed updater is accessed through Settings → About → **Software Update**.

**Existing v1.0.3–v1.0.5 Setup installations:** detection can work while Download Update fails. A new GitHub release cannot repair the old updater inside your installed app. When the fixed Setup release is approved, first use Backup → Back Up Now, close TINDA POS, and install the new Setup over the existing installation using the same Windows account and data location. Do not uninstall, reset the store, or delete AppData. Reopen and confirm the version, products, sales, and balances. v1.0.6 remains under validation; do not deploy this development build to a live till yet.

- **Installed version** — the version you are running is always shown here.
- **Check for Updates** — checks the official GitHub release page now. Use this any time, including after choosing Later; the automatic check runs at most once per day.
- Update states shown include **Checking**, **Up to date**, **Update available**, **Downloading**, **Downloaded**, **Ready to install**, **Offline**, and **Unable to check**.
- When an update is available you will also see a notification in the corner of the screen — it never blocks or interrupts checkout.
- **What's New** — shows the plain-text change notes for the update. TINDA POS never runs or renders remote content.
- **Download Update** — downloads the updates. For installed (Setup) editions, TINDA POS first makes and validates a **safety backup** of your store database. If that backup cannot be created, the update stops and tells you.
- **Restart & Install** — applies the downloaded update by restarting the app. A fresh, validated backup is taken immediately before installation; if it fails, installation stays paused. This only happens when you choose it; closing the app does not silently install the download. Use **Install Later** to keep working if a customer is at the counter.
- During checkout, payment, refund, void, backup, restore, **Start New Store**, or **Reset Database**, the install button is blocked with the message "Please finish the current operation before installing the update."

### Portable edition updates

The Portable EXE cannot replace itself while running:

1. Choose **Download Update** — the new `TindaPOS-Portable-*.exe` is saved to `Downloads\TINDA-POS-Updates`.
2. **Show in folder** — opens the Downloads folder for you.
3. Close the old TINDA POS, then run the downloaded EXE from its own folder.

Your store data is never in the program folder — it stays in your data location (Shared AppData, or `TindaPOS-Data\` beside a portable data folder), so moving to the new version does not touch your data.

### Offline behavior

If TINDA POS cannot reach the internet, the automatic check fails quietly. A manual **Check for Updates** reports "No internet connection. TINDA POS will continue working offline." — the store keeps working normally.

### Updating from v1.0.2 Hotfix 1 to v1.0.3

v1.0.2 Hotfix 1 predates the update system, so that first step to v1.0.3 is a normal manual upgrade: download the v1.0.3 Setup or Portable package from the GitHub release page and install/run it as usual. Installed v1.0.3–v1.0.5 have updater defects and require a manual Setup upgrade to the fixed release once available.

## Download

**Current Stable Release: TINDA POS v1.0.5** — <https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.5>

Files for the current stable release:

- `TindaPOS-Setup-1.0.5.exe` — Windows installer
- `TindaPOS-Portable-1.0.5.exe` — no-install portable edition
- `TindaPOS-User-Guide.pdf` — this guide
- `SHA256SUMS.txt` — checksums for the files above (verify with `sha256sum -c SHA256SUMS.txt`)

The supported target is Windows 10/11 64-bit. Native Windows/thermal-printer validation is still pending for physical printer hardware; native Windows application and packaging QA passed, and no printer model is claimed certified.
