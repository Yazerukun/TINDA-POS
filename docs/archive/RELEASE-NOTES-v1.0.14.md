# TINDA POS v1.0.14

- Fixed the UTANG checkout flow so choosing a borrower no longer hits a dead
  end. When no customer is selected, the checkout modal now shows a clear
  prompt with an inline **Select Customer** action that opens the existing
  customer picker without leaving the checkout.
- The selected customer is shown directly in the UTANG checkout section
  (**Selected: <Name>**) with a **Change** action, reusing the same selected-row
  highlight and checkmark from the picker.
- Trying to submit an Utang checkout with no borrower still blocks submission
  and now reopens the picker instead of leaving an unrecoverable error message.
- No duplicate selector or new customer system: customer IDs, the Utang ledger,
  credit limits, checkout, search, and add-customer flows are unchanged.
- No database schema or Software Update implementation change. Update path and
  provider are the same as v1.0.13.

Windows startup/install acceptance and final release review remain pending.