# TINDA POS v1.0.2

*Stability, Data Safety, and POS Workflow Update*

## Highlights

- Persistent Hold / Resume / Delete workflow; held sales survive app restart and are visible only to the cashier who created them.
- Duplicate hold submission protection.
- Improved category creation and immediate category-list refresh.
- Real online/offline connectivity verification for the ONLINE READY / OFFLINE READY indicator.
- Hardened Backup / Restore with backup validation, SQLite integrity checking, a safety backup before replacement, rollback protection, and WAL/SHM cleanup.
- Protected Database Reset with exact confirmation and a verified safety backup.
- Settings → Data page with database and backup location visibility and data-management actions.
- Deterministic, unique demo-data SKUs.
- ESLint, TypeScript, and production build passing; 34/34 automated tests passing.
- Vite future native-config-loading warning resolved.
- v1.0.1 → v1.0.2 upgrade QA passed: existing store, users, inventory, utang, transactions, expenses, shifts, receipt settings, held sales, and backups all preserved after upgrade.
- Offline Windows QA passed: all core POS workflows (login, PIN login, search, barcode, cash, sukli, GCash, Maya, utang, split payment, hold/resume/delete, expenses, reports, shifts, receipts, backup, restore, reset) verified fully offline with the OFFLINE READY indicator.

## Data Safety

TINDA POS keeps the main database locally on the store computer. The default Windows database path is:

```text
%APPDATA%\TINDA POS\database\tindapos.db
```

The Windows Installer and Portable editions intentionally use the same AppData database. Moving or renaming the Portable EXE does not create a fresh database.

Database Reset requires an account with the `settings:manage` permission (ADMIN by default), requires the user to type `RESET` exactly, and creates and verifies a safety backup before deleting the active database. Restore validates the selected backup before replacement, creates a safety backup of the current database, verifies the restored database, and recovers the original database if replacement fails. Existing backup files are preserved during reset.

## Known Issues

- **Portable edition after Restore:** the restore completes safely and validates the restored database, but the Portable launcher may not keep the app running through the automatic restart — reopen the Portable EXE manually if it does not come back.
- **Restore sidecar files:** a harmless temporary `.restore-*.db-wal` / `.restore-*.db-shm` sidecar pair may remain in the database folder after a restore; they do not affect data and can be deleted.
- **Refund status label:** a fully refunded sale may still display as `PARTIALLY_REFUNDED` instead of `REFUNDED` (stock restoration and double-refund protection still work).
- **Receipt header:** the custom receipt header setting is stored and preserved, but is not printed in the reconstructed receipt (the footer is printed).

## Upgrade Recommendation

For users upgrading from v1.0.1:

1. Create a backup before updating.
2. Install or run v1.0.2 using the existing Windows user and data profile.
3. Existing store data should remain available because application data is stored separately from the program files.
4. Do not manually delete `%APPDATA%\TINDA POS\database\tindapos.db`.

The full v1.0.1 → v1.0.2 upgrade test was completed during the v1.0.2 Windows QA phase and passed.
