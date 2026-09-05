# TINDA POS v1.0.2 Hotfix 1

Release candidate built from `Yazerukun/TINDA-POS` master at commit
`feat: finalize receipt printer support and hotfix QA` (the repository `HEAD`
used to generate these notes). The public v1.0.2 tag and its published release
are unchanged; this document describes the candidate hotfix, not a published
release.

## What this hotfix fixes and adds

- **Start New Store** — protected flow to create a brand-new store.
- **Portable Data Mode** — keep the store beside the EXE in `TindaPOS-Data\`.
  - **Copy Current Store** into the portable data folder.
  - **Start Fresh** for a clean portable store.
  - Switch back to **Shared AppData** mode.
- **Improved Settings → Data** — shows where data lives (Shared AppData vs
  Portable mode) and how to switch.
- **Receipt printer support (Windows)**
  - **Printer auto-detection** — the installed printer list is loaded on entry.
  - **Refresh Printers** — re-discover printers including ones installed while
    the app is open.
  - **Default/saved printer handling** — on first setup the Windows default
    printer is suggested; a saved printer that disappears is shown as
    **Unavailable** (never silently rerouted to another printer).
  - **80mm is now the default** paper width; **58mm** remains supported.
  - **Test Print** — prints a test slip without creating a sale.
  - **Auto Print After Sale** — one silent print job, sent only after the sale
    commits.
  - **Manual Print Receipt** — reprint from Transactions.
  - **Printer failure handling** — a missing/offline printer never blocks,
    rolls back, duplicates, or double-charges a sale.
  - **Retry safety** — print copies clamped to 1–3; one job per sale.
  - **Header/footer** — custom receipt header and footer flow into printed output.
- **Correct cash/SUKLI handling** — Cash Received is entered in pesos (₱50 → "50",
  ₱100 → "100"), not raw cents.
- **Full refund status fix** — a partial refund can be continued until the sale
  is fully **REFUNDED** (previously the sale could stay stuck at
  PARTIALLY_REFUNDED after the final refund).
- **Restore temp cleanup** — temporary `.restore-*` sidecar files are cleaned up
  after restore; portable restore relaunch/fallback improved.

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
- `PRAGMA integrity_check`: ok.

## Status

Physical thermal-printer validation on native Windows hardware is **still
pending** and must be performed on a real Windows environment before the hotfix
binaries are published. No printer is claimed certified.