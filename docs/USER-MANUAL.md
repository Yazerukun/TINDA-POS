# TINDA POS v1.0.2 User Manual

TINDA POS is an offline POS system for sari-sari stores. The core POS, inventory, customer, utang, expense, and reporting workflows remain usable offline.

## Install and first setup

1. After final packaging, download the official v1.0.2 Setup or Portable package. Release links are not published yet.
2. Complete the first-run wizard: store details, administrator account, and receipt settings.
3. Log in, then add products from **Inventory**.

Windows may show SmartScreen because the release is not code-signed. Choose **More info → Run anyway** only after verifying the published SHA-256 values.

## POS and Checkout

1. Open **POS** and find a product by name, SKU, barcode, or category.
2. Add products and adjust quantities or discounts.
3. Select **Checkout**, choose a payment method, and confirm the sale.

### Cash and Sukli

Enter the cash received. TINDA POS calculates and displays the sukli automatically.

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

Open **Settings → Data** to view the current database and backup locations and access Backup, Restore, and Reset Database actions.

The default Windows database location is:

```text
%APPDATA%\TINDA POS\database\tindapos.db
```

The Installer and Portable editions intentionally share the same AppData database. Moving or renaming the EXE does not create a fresh database. Installing an update should continue using the existing data profile; do not manually delete the AppData database to update the application.

## Backup and Restore

- Use **Backup Now** regularly. Existing backups are stored separately from the active database.
- Restore validates the selected backup's SQLite header, expected TINDA POS tables, and database integrity before replacement.
- TINDA POS creates and validates a safety backup of the current database before restore.
- Restore cleans stale WAL/SHM sidecar files and uses rollback protection if replacement fails.
- After a successful Restore, TINDA POS restarts automatically and opens the restored data.
- Restoring an older backup intentionally removes active changes made after that backup.

## Reset Database

Reset creates a fresh active store database; it is not needed for an ordinary application update.

1. Sign in with an account that has ADMIN/settings permission.
2. Open **Settings → Data → Reset Database**.
3. Read the warning and type `RESET` exactly.
4. TINDA POS creates and verifies a safety backup before removing the active database.
5. Existing backup files remain preserved.
6. The app restarts automatically and shows the first-run wizard.

If the safety backup fails, Reset Database is cancelled without deleting the active database.

## ONLINE READY and OFFLINE READY

- **ONLINE READY** means a real connectivity check succeeded and configured cloud-sync software can upload mirrored backup copies.
- **OFFLINE READY** means internet verification failed, but the core local POS remains usable offline.
- TINDA POS does not upload directly to a cloud API. Optional backup mirroring targets a folder managed by OneDrive, Google Drive for desktop, or Dropbox.

## Transactions and Receipt Generation

Transactions lets authorized users view receipt details, generate/reconstruct receipt lines, refund eligible items, or void eligible sales. Direct physical Windows printer output is **not integrated in v1.0.2**.

## Other workflows

- **Expenses and Shifts:** record expenses and reconcile expected versus actual cash.
- **Reports:** review sales, inventory, and utang, then export CSV.
- **Suppliers:** maintain supplier details and product relationships.

## Safety and troubleshooting

- Keep regular backup copies on another drive or in a synced folder.
- Do not shut down Windows during Restore or Reset Database.
- Seeing the same store data after moving the Portable EXE is expected because data follows `%APPDATA%\TINDA POS`, not the EXE directory.
- A rejected restore usually means the file is missing, corrupted, or not a compatible TINDA POS SQLite backup.
