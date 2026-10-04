## ✨ What's New in v1.0.43 (Full 5-Phase Expansion Suite)

│ Petty Cash Out & True Net Profit, Expiry Management, Wireless Customer Screen (CFD) with Dynamic QR, Wholesale Tiering & Cross-Platform Parity

• 💸 **Store Petty Cash Out & True Net Profit Intelligence (`F7` Hotkey)**: Cashiers can record operational expenses directly at the counter (store supplies, utility bills, helper wages, delivery fees). Cash drawer variance auditing incorporates cash disbursements ($$\text{Expected Cash} = \text{Opening Float} + \text{Cash Sales} + \text{Utang Repayments} - \text{Cash Refunds} - \text{Cash Expenses}$$) eliminating false shortages, and Dashboard calculates True Net Profit ($$\text{True Net Profit} = \text{Gross Sales} - \text{COGS} - \text{Operating Expenses}$$).
• 📦 **Expiration & Spoilage Prevention Engine**: Supports single-item and multi-batch FIFO tracking (`product_batches`). Point-of-Sale gives soft toast warnings when scanning items near expiration (`SOON` within 7 days, `NEAR` within 30 days) and automatically quarantines expired stock from sellable inventory.
• 📱 **Wireless Customer Facing Display (CFD) with Dynamic Offline QR**: Turns any spare smartphone, tablet, or iPad into a live counter-top customer screen on local Wi-Fi via Port 3112/3113 (`/cfd` and `/display`). Features zero-install in-memory SVG QR codes for exact-centavo GCash & Maya scanning and automatic screen wake lock (`navigator.wakeLock`).
• 🏷️ **Wholesale Tiering & Automated Volume Discounts**: Migration 10 adds volume tier pricing (`wholesale_price_c`, `wholesale_min_qty`). Cart automatically drops unit price to wholesale upon reaching minimum quantity threshold, complete with visual badges and price strikethroughs.
• 🛡️ **100% Cryptographic VIP Pro Preservation & Non-Destructive Storage**: Guaranteed zero data loss across upgrades. Customer databases (`tindapos.db`), credit ledgers, and VIP Pro machine licenses remain 100% permanently active and valid.

### Release Checksums (SHA-256)

```text
ee41d76f83ca973b3b86051a88197addf70e010a62c5f23615434b92ad0b5e8f  TindaPOS-Setup-1.0.43.exe
0b13d779bc927bd6a1ce25589c94c460a57b295f7163af9bbc6fcc2d6bd8e830  TindaPOS-Portable-1.0.43.exe
91082a816b94535cc0458718f6de1389fb5e909d14690e4cf217133a8997b8fc  TindaPOS-User-Guide.pdf
```
