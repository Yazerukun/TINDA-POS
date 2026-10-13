# X-Read Hotfix - v1.0.12 Candidate

## Scope

1. Correct refund effects on drawer cash using recorded credit reversals.
2. Refresh X-Read after sale/refund/void events, on window focus, and every 15 seconds.
3. Show starting cash, cash movements, cash refunds, expenses, and expected cash separately.
4. Add Print Preview and handle print success, returned failures, and thrown errors.
5. Group the screen into sales, payments, reconciliation, and transaction counts; use local print times.

## Cash Refund Rules

All refunds reduce net sales. The part recorded as a credit-ledger REFUND reduces
customer credit instead of the cash drawer. Only the remaining amount reduces cash.
Existing refund records do not store the payout method. Non-credit refunds retain
the existing cash-payout behavior; this patch does not infer an unrecorded GCash/Maya
refund or rewrite payment/credit history. Recording wallet refund payouts separately
requires a distinct transaction workflow and is outside this patch.

Shift closing now uses the same calculation as X-Read, including split-payment cash,
credit-refund exclusions, and cashier/shift-scoped expenses. Existing saved Z-Read
snapshots and Cash Count records remain unchanged. The new cash-refund field is
optional when rendering historical snapshots.

## User Guide

Open **Reports > X-Read** to view the current open shift. The screen updates after
sales, refunds, and voids. The refresh icon requests the latest figures manually.
If the open shift disappears or the request fails, old figures are cleared and
the screen offers a retry rather than displaying an outdated total.

Use **Print Preview** to inspect the current report. **Print Latest X-Read** requests
fresh figures for printing and updates the screen/preview to the report sent to the
printer. A print failure shows its reason and leaves all store records intact.
X-Read does not finalize or close the shift. Save Cash Count before finalizing Z-Read.

## Verification

- 30 test files / 207 tests passed, including cash, credit, mixed reversals,
  split payments, closing reconciliation, immutable Z snapshots, and legacy formatting.
- Full typecheck, lint, and production build passed.
- Real Reports component with mocked IPC: live refresh, preview, print failure/success,
  cleared stale report, retry, and listener cleanup passed without JavaScript errors.
- No updater implementation, update provider, installer configuration, or dependency changes.
- No database migration; existing records are preserved.
- Physical printer output and Windows packaged update cycle are not claimed.
- Candidate remains local; no push, tag, or publication is part of this fix turn.
