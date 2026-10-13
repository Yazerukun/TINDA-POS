# RELEASE PLAN

CURRENT STABLE: v1.0.14 (tag v1.0.14, published 2026-09-14T13:33Z)
TARGET: v1.0.15
RELEASE TYPE: PATCH

FEATURES:
- Windows Setup: start-at-sign-in is now ON by default on first launch
  (registered via the existing login-item mechanism; owner can turn it off in
  Settings > Store). Portable editions unaffected.

BUG FIXES:
- Refund of a UTANG sale after the customer already fully (or partially) paid
  their balance crashed with "Ledger balance cannot go negative." and rolled
  back the entire refund. Fixed: the ledger is only reduced by the portion the
  customer still owes; the excess is returned from the drawer. Same fix for
  voiding an already-settled UTANG sale.

USER FEEDBACK:
- UTANG checkout UI was too Tagalog: "Piliin ang Nangutang" / "bago
  mag-checkout" / "I-click ang customer sa listahan para ma-select." are now
  English ("Select the borrower" / "before checkout" / "Click a customer in the
  list to select them."). README and User Manual updated to match.

UPDATER CHANGES: NO
DATABASE CHANGES: NO
PRINTER CHANGES: NO
DOCUMENTATION CHANGES: YES (README, USER-MANUAL string references)

OUT OF SCOPE:
- Software update mechanism (updater source/config must stay byte-identical)
- POS, inventory, customer, expense, reporting, backup features beyond the
  refund ledger fix
- Tagalog strings outside the UTANG checkout flow (Expiration reminder,
  receipt footer "Salamat po!", Cash Count Tagalog toasts stay as-is)
- No build / tag / publish / asset upload without explicit owner approval