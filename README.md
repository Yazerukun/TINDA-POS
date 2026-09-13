<div align="center">

# TINDA POS

**Free, offline point-of-sale for Philippine sari-sari stores and small businesses.**

### v1.0.11

[Download for Windows](https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.11) · [User Manual](docs/USER-MANUAL.md) · [Report an Issue](https://github.com/Yazerukun/TINDA-POS/issues)

</div>

## Your Store, Ready to Sell

Record sales, manage stock, track customer credit, and reconcile your cash drawer on one computer. Core selling works without an internet connection. Your store database stays on your device.

The free desktop edition supports Windows 10/11, 64-bit. Internet is needed for software downloads and optional third-party cloud-folder syncing, not everyday checkout.

## What's New in v1.0.11

| Change | What it means at the counter |
| --- | --- |
| Refund-aware dashboard | Today's Net Sales deducts refunds: PHP 500 sales minus PHP 100 refunds shows PHP 400. |
| Live dashboard refresh | Sales, refunds, and voids refresh totals automatically. Window focus and a 15-second fallback keep other figures current. |
| Local business date | Today's dashboard follows the computer's local calendar date. Daily totals remain visible after Z-Read. |
| Clearer receipts | Aligned amounts and prominent totals on sales receipts, X-Read, Z-Read, and Cash Count in 58mm and 80mm formats. |
| Final report details | Z-Read printing includes saved actual cash, over/short status, and closing time. |

Software Update uses the same GitHub provider and installer settings. No database schema change is included.

## Download

Choose an asset from the [v1.0.11 release](https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.11):

| File | Purpose |
| --- | --- |
| `TindaPOS-Setup-1.0.11.exe` | Recommended for a regular Windows installation. |
| `TindaPOS-Portable-1.0.11.exe` | Run without installing; retain your existing data location when upgrading. |
| `TindaPOS-User-Guide.pdf` | Printable, step-by-step user guide. |
| `SHA256SUMS.txt` | SHA-256 checksums for verifying downloads. |

The `.blockmap` and `latest.yml` assets support Software Update. Users do not need to open them.

## First Day Setup

1. Install TINDA POS or open the Portable edition.
2. Complete the wizard with your store details and admin account.
3. Add products, prices, selling units, and opening stock in Inventory.
4. Select your receipt printer and paper width, then run Test Print.
5. Open POS, add items, select payment, and complete a sale.
6. Make a backup of your store.

## Everyday Tools

| Area | Included features |
| --- | --- |
| Checkout | Search, barcode input, categories, quantity controls, split payments, saved Hold/Resume carts. |
| Payments | Cash and change; GCash, Maya, and customer credit records. |
| Inventory | Multi-unit products, CSV import, restock, receiving, low-stock alerts, withdrawals, and history. |
| Customers | Credit limits, payments, adjustments, and credit ledger. |
| Transactions | Sale history, receipt reprint, refunds, and permission-controlled voids. |
| Shift reports | X-Read, saved Cash Count before Z-Read, final report history, and reconciliation. |
| Management | Suppliers, purchases, expenses, users, roles, and settings. |
| Data | Local backups, validated restore, optional backup copies to a synced folder. |

GCash and Maya are recorded payment methods, not direct wallet integrations. Confirm the actual wallet payment before recording it.

## Cash Count First, Then Z-Read

1. Finish sales and check refunds or expenses.
2. Open **Reports > Cash Count** while your shift is still open.
3. Enter each bill/coin quantity and review any shortage or excess.
4. Click **Save Cash Count** and wait for confirmation.
5. Open **Reports > Z-Read**, review the final figures, and finalize.

If the shift has no saved count, the reminder sends you to Cash Count. Closing that reminder leaves the shift open.

**Today's Net Sales is a daily total.** It does not reset after each Z-Read on the same day. Z-Read closes a shift and preserves its report; it does not delete transactions.

## Understand the Cash Figures

**Cash in X/Z reports** is cash retained after giving change. **Expected Cash** also reflects the opening float, cash refunds, expenses, and cash movements. **Actual Cash** is the money counted. **Difference** is actual minus expected: positive is OVER, negative is SHORT, zero is BALANCED.

Example: a cash-only PHP 485 sale paid with PHP 662 has PHP 177 change. Cash retained is PHP 485. With a PHP 177 opening float and no other movements, expected drawer cash is PHP 662.

## Receipts and Printing

Under **Settings > Receipt / Printer**, select an installed Windows printer, choose 58mm or 80mm, save, and run **Test Print**. Auto Print and manual reprint share the receipt preview layout.

X-Read is marked **CURRENT SHIFT - NOT FINAL**; Z-Read is marked **FINAL SHIFT REPORT**. Cash Count prints saved denomination counts and reconciliation amounts.

A failed print does not undo a saved sale or Cash Count. Check the printer and reprint the record instead of entering it again. Physical thermal-printer validation remains pending; no printer model is certified by this release.

## Update an Existing Store

For v1.0.6 and newer, open **Settings > About > Software Update > Check for Updates**.

1. Read What's New and select **Download Update**.
2. Let the download finish; retry if the connection is interrupted.
3. Finish active transactions, then select **Restart & Install** in the installed edition.
4. After reopening, verify the version and store records.

The installed edition validates a fresh safety backup before installation. Portable downloads a separate EXE; keep your existing `TindaPOS-Data` folder with the new version when using Portable Data Mode.

**Legacy v1.0.3-v1.0.5 users need a one-time manual Setup upgrade.** Back up, close the app, and install the approved current Setup over the existing installation using the same Windows account. Do not reset or delete data. Earlier versions without Software Update also need a manual upgrade.

## Your Data and Backups

Default Windows database: `%APPDATA%\TINDA POS\database\tindapos.db`. Installer and Portable share this location by default. Moving an EXE does not create a new store.

**Settings > Data** shows the active locations. Portable Data Mode can keep data in `TindaPOS-Data` beside the Portable app. Back up before changing modes, restoring, or updating; keep another copy on a separate drive.

Optional cloud-folder backup uses a separately installed sync client such as OneDrive, Google Drive for desktop, or Dropbox. It is not live multi-device database synchronization.

## Help and Troubleshooting

| Problem | First check |
| --- | --- |
| No open shift | Confirm the signed-in account and whether Z-Read already closed its shift. Save Cash Count before closing. |
| Sales did not reset after Z-Read | Dashboard is a daily total; use shift reports for a specific shift. |
| Cash differs from sales | Check the starting float, payment methods, refunds, expenses, and cash movements. |
| Receipt did not print | Check power/paper, Windows driver, selected printer, width, and Test Print. |
| Update interrupted | Restore the internet connection and retry the download. |

For support, include the version, Setup/Portable edition, exact error, and steps to reproduce in [GitHub Issues](https://github.com/Yazerukun/TINDA-POS/issues). Remove customer details from screenshots.

## Development

Built with Electron, React, TypeScript, SQLite, Tailwind CSS, and Zustand.

```bash
cd source
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

Windows packaging: `npm run build:win`. Follow the [release workflow](docs/RELEASE-WORKFLOW.md) before publishing. The [release state](docs/RELEASE-STATE.md) records verification evidence and outstanding checks.

## License

Proprietary. Free to use for personal and small business purposes. Do not redistribute or sell without permission.
