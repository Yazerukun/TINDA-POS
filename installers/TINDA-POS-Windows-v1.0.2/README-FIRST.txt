==============================================
 TINDA POS - Windows v1.0.2 Hotfix Bundle
==============================================

HOTFIX CANDIDATE — client-feedback fixes baked in
(Source still uncommitted locally; GitHub release not updated yet)

Included files:
- TindaPOS-Setup-1.0.2.exe - Windows installer
- TindaPOS-Portable-1.0.2.exe - no-install edition
- TindaPOS-User-Guide.pdf - v1.0.2 user guide
- SHA256SUMS.txt - checksums for the three files above

WHAT THIS HOTFIX ADDS (on top of public v1.0.2 tag)
- Settings → Data: clear Shared AppData / Portable mode controls
- Start New Store (protected) + safer Reset Database
- Portable Data Mode: Copy Current Store / Start Fresh / switch back
- Real Electron printer discovery, Test Print, Auto Print, Manual Print
- Custom receipt header/footer
- Cash / SUKLI input fix (pesos, not raw cents)
- Partial refund can continue until sale is fully REFUNDED
- Restore temp cleanup + portable restore relaunch fixes

DATA LOCATION
Default mode is Shared AppData:
  %APPDATA%\TINDA POS\database\tindapos.db
Moving the Portable EXE does NOT move or reset the store database.
Optional Portable Data Mode keeps data beside the EXE in TindaPOS-Data\.

PACKAGED QA (isolated Wine profile only — no customer data)
- Cash Received defaults to pesos (₱50 → "50", ₱100 → "100") — PASS
- Partial refund → continued refund → fully REFUNDED — PASS
- DB integrity_check: ok

VERIFY BEFORE INSTALL
  sha256sum -c SHA256SUMS.txt

Back up the live store before updating. Do not delete AppData manually.
==============================================
