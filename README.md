<div align="center">

# TINDA POS

**Simple, offline POS for Philippine sari-sari stores and small businesses.**

Sell products, track inventory, manage customer Utang, and reconcile the cash drawer in one focused desktop app.

[Download v1.0.13](https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.13) · [User Manual](docs/USER-MANUAL.md) · [Report an Issue](https://github.com/Yazerukun/TINDA-POS/issues)

</div>

## Why TINDA POS?

TINDA POS is built for everyday store work. Checkout stays usable offline, your database stays on the device, and the workflow is clear for both owners and cashiers.

- Fast product search, barcode input, categories, Hold/Resume, and quantity controls
- Cash, GCash, Maya, and customer Utang recording
- Multi-unit products, stock receiving, restocking, withdrawals, and low-stock alerts
- Per-item or per-batch expiration dates with checkout protection
- Customers, credit limits, payments, adjustments, and a complete Utang ledger
- Refunds, voids, receipt reprints, X-Read, Cash Count, and Z-Read
- Local backups, validated restore, roles, permissions, suppliers, expenses, and reports

## Download v1.0.13

For Windows 10/11 64-bit, choose one:

| Download | Best for |
| --- | --- |
| [Setup installer](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.13/TindaPOS-Setup-1.0.13.exe) | Recommended. Installs TINDA POS and supports Software Update. |
| [Portable edition](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.13/TindaPOS-Portable-1.0.13.exe) | Use without a regular installation. Keep its data folder safe. |
| [User Manual PDF](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.13/TindaPOS-User-Guide.pdf) | Printable step-by-step guide. |
| [SHA256SUMS](https://github.com/Yazerukun/TINDA-POS/releases/download/v1.0.13/SHA256SUMS.txt) | Verify downloaded files. |

Internet is needed for downloading updates and optional synced-folder backups, not for normal checkout.

## First Setup

1. Install the Setup edition or open Portable.
2. Create the owner account and complete store settings.
3. Add products, prices, selling units, and opening stock.
4. Select the receipt printer and paper width, then use Test Print.
5. Open POS and complete a small test sale.
6. Create a backup before serving customers.

## Utang: Select the Right Customer

The existing Utang customer flow is designed to prevent mistakes:

1. In POS, click **Select Customer** under **Select the borrower**.
2. Search using the customer name or phone number.
3. Click the customer row. The selected row is highlighted and shows a checkmark.
4. Confirm **Selected: Customer Name ✓** before opening Checkout.
5. Choose **Utang** and review the customer again before charging.

If no customer is selected, TINDA POS blocks the Utang checkout and shows a reminder. Customer IDs, credit limits, ledger entries, and checkout calculations remain protected. Use **Walk-in (no utang)** to clear the selection.

## Cash Count Before Z-Read

Always save the cash count while the shift is still open:

1. Open **Reports > Cash Count**.
2. Enter and review the bill and coin quantities.
3. Click **Save Cash Count**.
4. Open **Reports > Z-Read** and finalize the shift.

X-Read is current and non-final. Z-Read closes the shift. Dashboard sales are daily totals and do not reset after every Z-Read.

## Windows Sign-in Startup

In the installed Setup edition, open **Settings > Store** and enable **Start TINDA POS when I sign in to Windows**. It is optional and off by default. Normal POS login is still required. Portable does not register a temporary startup path.

## Software Updates

For installed Setup users, open **Settings > About > Software Update > Check for Updates**. Download the update, wait for 100%, then use **Restart & Install** after active transactions are finished. TINDA POS creates a safety backup before installation.

The Software Update provider remains GitHub. Do not delete the database or `TindaPOS-Data` when updating. Users on very old v1.0.3-v1.0.5 installations need one manual Setup upgrade first.

## Data and Backups

The default database is stored at `%APPDATA%\TINDA POS\database\tindapos.db`. Check the exact active location under **Settings > Data**. Back up before restoring, changing data mode, or installing an update. Cloud-folder backup is file backup, not live multi-device database synchronization.

## Troubleshooting

| Problem | First check |
| --- | --- |
| Utang customer is unclear | Use **Select the borrower**, select the highlighted customer, and confirm the name with ✓. |
| No open shift | Open a shift, and save Cash Count before Z-Read next time. |
| Cash does not match | Check starting float, cash payments, refunds, expenses, and cash movements. |
| Receipt did not print | Check paper, power, Windows driver, selected printer, width, and Test Print. |
| Update was interrupted | Restore internet and retry; do not delete store data. |

When reporting a problem, include the version, Setup or Portable edition, exact message, and steps to reproduce. Remove customer details from screenshots. Use [GitHub Issues](https://github.com/Yazerukun/TINDA-POS/issues).

## Development

TINDA POS uses Electron, React, TypeScript, SQLite, Tailwind CSS, and Zustand.

```bash
cd source
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

See the [User Manual](docs/USER-MANUAL.md), [release notes](docs/RELEASE-NOTES-v1.0.13.md), and [release workflow](docs/RELEASE-WORKFLOW.md) for more detail.

## License

Proprietary. Free for personal and small-business use. Do not redistribute or sell without permission.
