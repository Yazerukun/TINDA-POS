# TINDA POS v1.0.16

- **Reliable Windows Auto-Start on Boot / Power-On**:
  - Implemented dual-layer startup integration combining Electron login item registry settings with a direct Windows Startup shortcut (`shell.writeShortcutLink`).
  - Ensures TINDA POS automatically launches when the computer powers on or signs in without requiring the user to manually click desktop shortcuts.
  - Automatically respects the Store Settings auto-start toggle. Portable editions remain unaffected.

- **Estimated Profit Calculation & Centavo (.10) Discrepancy Fix**:
  - Fixed duplicate discount subtraction in dashboard and sales reporting calculations.
  - Cleaned up decimal and centavo rounding (`Math.round`) across cost and profit calculations.
  - Formatted the POS discount input in standard Pesos with placeholder `0.00` to eliminate confusion between centavos and whole Pesos.

- **Receipt & Live Print Payment Breakdown Layout**:
  - Reordered receipt lines so all payment methods (Cash, GCash, Maya, Utang) are listed consecutively before `SUKLI` (Change).
  - Added a `TOTAL PAYMENTS` breakdown row in X-Read and Z-Read reports to ensure all tender types coincide cleanly with total sales and change.

- **Zero-Regression Guarantee**:
  - Database schema, existing stores, customer accounts, Utang ledgers, and inventory remain 100% intact.
  - Software Update system is untouched and fully compatible for seamless over-the-air updates from v1.0.15.
