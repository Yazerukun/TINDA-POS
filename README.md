<div align="center">

# TINDA POS

**Free, offline point-of-sale for Philippine sari-sari stores and small businesses.**

### v1.0.13

[Download for Windows](https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.13) · [User Manual](docs/USER-MANUAL.md) · [Report an Issue](https://github.com/Yazerukun/TINDA-POS/issues)

</div>

---

## What is TINDA POS?

TINDA POS is a free, offline point-of-sale (POS) made for Philippine sari-sari
stores and small businesses. It runs on a single Windows 10/11 (64-bit) computer
— no internet connection is required for everyday selling.

Your store's data stays on your device. An internet connection is only needed to
**download the software**, or to optionally save backups to a cloud-folder sync
client (such as OneDrive or Google Drive for desktop).

## Why use TINDA POS?

- **Works offline** — selling, inventory, utang, expenses, and reports keep working with no internet.
- **Simple to learn** — designed for owners, managers, and cashiers, with a step-by-step user guide.
- **Secured by roles** — control who can void sales, view reports, or reset the database.
- **Free** — no subscription, no licensing fee, no data lock-in.

## What's New in v1.0.13

| Change | What it means at the counter |
| --- | --- |
| Clearer utang customer picker | Tagalog heading and hint, selected-row highlight and checkmark, persistent customer name, and easier search. |
| Missing-customer reminder | A reminder appears if a utang checkout is about to be submitted without a chosen customer. |
| Optional Windows sign-in startup | Installed (Setup) users can start TINDA POS automatically when Windows opens — not enabled by default, and POS login is still required. |

### Recent highlights

- **v1.0.12: Inventory expiration tracking.** Track expiry per product — None, Per Item, or Per Batch. Expired or undated tracked stock is blocked at checkout; batches are used earliest-expiry first. Includes a searchable expiration list with colored warnings and a Tagalog login reminder.
- **v1.0.11: Clearer cash reports.** Refund-aware dashboard, live totals, and cleaner X-Read / Z-Read / Cash Count receipts in 58mm and 80mm formats.

See the full [release notes](docs/RELEASE-NOTES-v1.0.13.md) and the [user manual](docs/USER-MANUAL.md).

## Download

Choose an asset from the [v1.0.13 release](https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.13):

| File | Purpose |
| --- | --- |
| `TindaPOS-Setup-1.0.13.exe` | Recommended — installs TINDA POS on Windows. |
| `TindaPOS-Portable-1.0.13.exe` | Run without installing; keep your existing `TindaPOS-Data` folder when upgrading. |
| `TindaPOS-User-Guide.pdf` | Printable, step-by-step user guide. |
| `SHA256SUMS.txt` | SHA-256 checksums for verifying the files above. |

> The `.blockmap` and `latest.yml` files support in-app Software Update — you do not need to open them.

### Verify your download (optional)

After downloading, confirm the files are intact in the same folder where `SHA256SUMS.txt` is saved:

```bash
sha256sum -c SHA256SUMS.txt
```

## First Day Setup

1. Install TINDA POS (or open the Portable edition).
2. Complete the wizard with your store details and admin account.
3. Add products, prices, selling units, and opening stock in Inventory.
4. Select your receipt printer and paper width, then run **Test Print**.
5. Open POS, add items, select payment, and complete a sale.
6. Make a backup of your store.

## Everyday Tools

| Area | Features |
| --- | --- |
| **Checkout** | Search, barcode input, categories, quantity controls, split payments, and saved Hold/Resume carts. |
| **Payments** | Cash and change; GCash, Maya, and customer credit (utang) records. |
| **Inventory** | Multi-unit products, CSV import, restock, receiving, low-stock alerts, withdrawals, and history. |
| **Customers** | Credit limits, payments, adjustments, and credit ledger. |
| **Transactions** | Sale history, receipt reprint, refunds, and permission-controlled voids. |
| **Shift reports** | X-Read, saved Cash Count before Z-Read, report history, and reconciliation. |
| **Management** | Suppliers, purchases, expenses, users, roles, and settings. |
| **Data** | Local backups, validated restore, and optional backup copies to a cloud-folder. |

> GCash and Maya are **recorded payment methods**, not direct wallet integrations. Always confirm the actual wallet payment before recording it.

## Managing Daily Reports

1. Finish sales and check refunds or expenses.
2. Open **Reports > Cash Count** while your shift is still open.
3. Enter each bill/coin quantity and review any shortage or excess.
4. Click **Save Cash Count** and wait for confirmation.
5. Open **Reports > Z-Read**, review the final figures, and finalize.

**Important:** *Today's Net Sales is a daily total.* It does not reset after each Z-Read on the same day. Z-Read closes a shift and preserves its report; it does not delete transactions.

### Understanding the cash figures

- **Cash (in X/Z reports)** — cash retained after giving change.
- **Expected Cash** — reflects the opening float, cash refunds, expenses, and cash movements.
- **Actual Cash** — the money you counted.
- **Difference** — actual minus expected: positive is **OVER**, negative is **SHORT**, zero is **BALANCED**.

## Receipts and Printing

Under **Settings > Receipt / Printer**, select an installed Windows printer, choose 58mm or 80mm, save, and run **Test Print**. Auto Print and manual reprint share the receipt preview layout.

X-Read is marked **CURRENT SHIFT - NOT FINAL**; Z-Read is marked **FINAL SHIFT REPORT**. Cash Count prints saved denomination counts and reconciliation amounts.

> A failed print does not undo a saved sale or Cash Count. Check the printer and reprint the record instead of entering it again.

## Updating an Existing Store

For **v1.0.6 and newer**, open **Settings > About > Software Update > Check for Updates**.

1. Read the What's New information and select **Download Update**.
2. Let the download finish; retry if the connection is interrupted.
3. Finish active transactions, then select **Restart & Install** in the installed edition.
4. After reopening, verify the version and your store records.

The installed edition validates a fresh safety backup before installation. The Portable edition downloads a separate EXE — keep your existing `TindaPOS-Data` folder with the new version when using Portable Data Mode.

> **Legacy v1.0.3–v1.0.5 users need a one-time manual update.** Back up, close the app, and install the approved current Setup over the existing installation using the same Windows account. Do not reset or delete data.

## Your Data and Backups

Default Windows database: `%APPDATA%\TINDA POS\database\tindapos.db`. The Installer and Portable editions share this location by default — moving an EXE does not create a new store.

**Settings > Data** shows the active locations. Portable Data Mode can keep data in `TindaPOS-Data` beside the Portable app. Back up before changing modes, restoring, or updating; keep another copy on a separate drive.

Optional cloud-folder backup uses a separately installed sync client such as OneDrive, Google Drive for desktop, or Dropbox. It is **not** live multi-device database synchronization.

## Help and Troubleshooting

| Problem | First check |
| --- | --- |
| No open shift | Confirm the signed-in account and whether Z-Read already closed its shift. Save Cash Count before closing. |
| Sales did not reset after Z-Read | Dashboard is a daily total; use shift reports for a specific shift. |
| Cash differs from sales | Check the starting float, payment methods, refunds, expenses, and cash movements. |
| Receipt did not print | Check power/paper, Windows driver, selected printer, width, and Test Print. |
| Update interrupted | Restore the internet connection and retry the download. |

For support, include the version, Setup/Portable edition, the exact error, and steps to reproduce in [GitHub Issues](https://github.com/Yazerukun/TINDA-POS/issues). Remove customer details from screenshots.

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