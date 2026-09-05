# TINDA POS LIVE

> Permanent project scratchpad — update this before and after every TINDA POS work session.

## Current release

- Version: **1.0.1**
- Status: Release verification complete
- Repository root: this directory
- Application source: `source/`
- Windows installers: `installers/`

## Latest completed work

- Updated the Settings → About donation card to **Maya**.
- Added “Buy me a coffee”, Maya logo, shimmer, green glow, logo motion, hover, and click feedback.
- Added reduced-motion support.
- Updated the User Guide PDF and PHCorner post donation details.
- Rebuilt Setup and Portable v1.0.1 and updated SHA-256 checksums.

## Verification status

- [x] TypeScript typecheck
- [x] Automated tests — 23/23 passed
- [x] Production renderer build
- [x] Windows Setup build
- [x] Windows Portable build
- [x] SHA-256 verification
- [x] User Guide contains `Maya: 0991 225 5156`
- [x] PHCorner post contains `Maya: 0991 225 5156`
- [x] Full packaged-app GUI smoke test of all 11 main screens
- [x] Final packaged database integrity check

## Release files

- `installers/TindaPOS-Setup-1.0.1.exe`
- `installers/TindaPOS-Portable-1.0.1.exe`
- `installers/TindaPOS-User-Guide.pdf`
- `installers/PHCorner-Post.txt`
- `installers/SHA256SUMS.txt`

## Next update ideas

- [ ] Add notes here while planning the next release.
- [ ] Bump the version only after the feature list is final.
- [ ] Re-run typecheck, tests, production build, Windows build, and checksum verification.
- [ ] Update the manual, PHCorner post, README files, and release notes together.

## Session notes

- 2026-09-03 — Reconstructed interrupted v1.0.1 work and created this live scratchpad.
- 2026-09-05 — Completed final installed-build GUI smoke test (Dashboard, POS, Inventory, Customers, Utang, Expenses, Suppliers, Transactions, Reports, Backup, and Settings); verified checkout data and database integrity.
