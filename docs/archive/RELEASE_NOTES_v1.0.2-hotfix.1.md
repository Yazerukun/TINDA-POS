# TINDA POS v1.0.2 Hotfix 1

Customer beta / prerelease built from `Yazerukun/TINDA-POS` master at commit
`feat: finalize receipt printer support and hotfix QA`, tagged
`v1.0.2-hotfix.1`. The public v1.0.2 tag and its published stable release are
unchanged.

## What this hotfix fixes and adds

- **Start New Store** — protected flow to create a brand-new store.
- **Clearer Shared AppData behavior** — Settings → Data shows exactly where data
  lives (`%APPDATA%\TINDA POS\database\tindapos.db` by default) and how to switch.
- **Portable Data Mode** — keep the store beside the EXE in `TindaPOS-Data\`.
  - **Copy Current Store** into the portable data folder.
  - **Start Fresh** for a clean portable store.
  - Switch back to **Shared AppData** mode.
- **Receipt printer support (Windows)**
  - **Printer auto-detection** — the installed printer list is loaded on entry.
  - **Saved/default printer handling** — on first setup the Windows default
    printer is suggested; a saved printer that disappears is shown as
    **Unavailable** (never silently rerouted to another printer).
  - **Refresh Printers** — re-discover printers including ones installed while
    the app is open.
  - **80mm is the default** receipt width; **58mm** is supported.
  - **Test Print** — prints a test slip without creating a sale.
  - **Auto Print After Sale** — one silent print job, sent only after the sale
    commits.
  - **Manual Print Receipt** — reprint from Transactions.
  - **Safe printer failure handling** — a missing/offline printer never blocks,
    rolls back, duplicates, or double-charges a sale.
  - **Retry Print without a duplicate sale** — reprinting never creates or
    duplicates a sale; copies are clamped to 1–3.
  - **Custom receipt header/footer** — stored header and footer flow into the
    printed output.
- **Correct cash/SUKLI handling** — Cash Received is entered in pesos (₱50 → "50",
  ₱100 → "100"), not raw cents.
- **Full refund status fix** — a partial refund can be continued until the sale
  is fully **REFUNDED** (previously the sale could stay stuck at
  PARTIALLY_REFUNDED after the final refund).
- **Restore temporary cleanup** — leftover `.restore-*` sidecar files are
  cleaned up after restore; portable restore relaunch/fallback improved.

## Recommended customer printer

- **80mm USB thermal receipt printer** with a Windows driver installed.
- **ESC/POS-compatible** preferred.
- **Auto-cutter** recommended.
- **58mm** printers are supported.

No specific printer model is claimed certified — printer support is built
through the Windows printer subsystem using the exact device name Windows
reports, so any Windows-installed thermal receipt printer works.

## Quality gates (source at the exact commit above)

- Lint: PASS
- Typecheck: PASS
- Automated tests: **71/71 PASS** (12 test files)
- Production build: PASS
- docs:pdf: PASS
- git diff --check: PASS

## WINE QA (isolated Wine profile — no customer data)

- App launches, login works, Dashboard renders.
- SQLite store opens; better-sqlite3 (win32) native module loads.
- Existing QA data persists across relaunch.
- Partial refund → continued refund → sale fully **REFUNDED**: PASS.
- `PRAGMA integrity_check`: ok (live and after clean close).

## CUSTOMER BETA NOTICE

This hotfix includes new Windows receipt-printer support. Core logic and
Wine-based packaged QA have passed. **Native Windows thermal-printer validation
is still in progress.** Users testing receipt printing are encouraged to report
printer model, connection type, paper width, and any print-layout issues.

## Status

**Native Windows and physical thermal-printer validation is still pending.**
No printer is claimed certified. Verify the artifacts with `sha256sum -c
SHA256SUMS.txt` and back up your live store before installing.