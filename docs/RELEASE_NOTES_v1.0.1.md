# TINDA POS v1.0.1 — Final Stabilization Release

This release focuses on database safety and completing previously unavailable workflows.

## Changes

- Protected Database Reset with admin permission, exact confirmation, verified safety backup, clean restart, and preserved backups.
- Persistent Hold Sale with unique references, discount/quantity restoration, cashier isolation, and duplicate submission protection.
- Safer Backup Restore with header/database validation, `PRAGMA integrity_check`, safety backup, WAL/SHM cleanup, verification, and rollback on failure.
- Settings → Data page showing database/backup locations and backup, restore, folder, and reset actions.
- Documented that Windows Setup and Portable share `%APPDATA%\TINDA POS`.
- Preserved the category dropdown and real connectivity improvements already on `master`.

## Verification

- Lint, typecheck, production build: PASS
- Automated tests: 33/33 PASS
- Windows Setup and Portable build/launch: PASS
- Packaged POS workflow using isolated test data: PASS
- SQLite integrity and foreign keys: PASS

No real customer or TRES MARIAS database was modified during QA.

## SHA-256

```text
39fc978e744c98663b3a95f5d7cec568526fab7b54d40ea75f7c8e8442b1492f  TindaPOS-Setup-1.0.1.exe
5519ec3bca5c29ed2de0292fa662dd8334466511156f815b87b8916cac76759a  TindaPOS-Portable-1.0.1.exe
```
