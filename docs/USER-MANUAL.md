# TINDA POS v1.0.1 User Manual

## Install and first setup

1. Download and run `TindaPOS-Setup-1.0.1.exe`. For no-install use, run `TindaPOS-Portable-1.0.1.exe`.
2. Complete the first-run wizard: store details, admin account, and receipt settings.
3. Log in, then add products from **Inventory**.

Windows may show SmartScreen because the release is not code-signed. Choose **More info → Run anyway** only after verifying the SHA-256 values in `SHA256SUMS.txt`.

## Daily selling

1. Open **POS**, find a product by name, SKU, barcode, or category, then add it to the cart.
2. Adjust quantity or discount.
3. Choose **Checkout**, select Cash, GCash, Maya, Utang, or split payment, then confirm.
4. For Cash, enter the amount received; TINDA POS calculates sukli automatically.

Inventory changes only after successful checkout or an inventory-related transaction.

## Hold and resume

1. Add items and any discount, then choose **Hold** and note the reference.
2. Open **Held Sales** and choose **Resume** when the customer returns.
3. Confirm before replacing a non-empty cart. An unwanted held sale can be deleted.

Holding, resuming, or deleting does not change inventory. Holds persist after restart, and cashiers see only their own held sales.

## Backup and restore

- Open **Settings → Data** to see the database and backup locations.
- Use **Backup Now** regularly.
- Use **Restore Backup** to return to an earlier state. The backup is validated, the current database receives a safety backup, and the app restarts after success.
- Restoring an older backup intentionally removes changes created after that backup.

## Reset Database

Reset starts a fresh store database; it is not required when installing an update.

1. Sign in as an authorized administrator.
2. Open **Settings → Data → Reset Database**.
3. Read the warning, type the exact word `RESET`, and confirm.
4. A safety backup is created and verified before the active database is removed.
5. The app restarts at the first-run wizard. Existing backups remain available.

If the safety backup fails, reset is cancelled without deleting the active database.

## Data location and updates

The Windows database is `%APPDATA%\TINDA POS\database\tindapos.db`.

Setup and Portable editions use the same application-data directory. Moving or renaming the EXE does not create a new database, and installing an update continues using existing store data.

## Other workflows

- **Customers / Utang:** configure limits, record credit sales, and post payments.
- **Transactions:** view/reprint receipts, refund items, or void eligible sales with permission.
- **Expenses and Shifts:** record expenses and reconcile expected versus actual cash.
- **Reports:** review sales, inventory, and utang, then export CSV.

## Safety and troubleshooting

- Keep regular backup copies on another drive or a synced folder.
- Do not shut down Windows during restore or reset.
- An update showing old data is expected because data follows `%APPDATA%\TINDA POS`, not the EXE directory.
- A rejected restore usually means the selected file is missing, corrupted, or not a compatible TINDA POS SQLite backup.
- A cashier cannot see another cashier's held sales.
