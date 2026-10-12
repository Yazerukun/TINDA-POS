## ✨ What's New in v1.0.44 (Weighable / Decimal Quantity Mode)

│ Kilo & Liter Decimal Precision, Fractional Weight Cart Stepper, Exact Centavo Calculations, 100% VIP Pro License Preservation

• ⚖️ **Weighable Decimal Quantity Mode (Kilos, Grams, Liters, Meters)**: Items with weighable units (`kilo`, `kg`, `kls`, `g`, `gram`, `liter`, `l`, `m`, `meter`) now fully support decimal point quantities (e.g., `2.24 kg`, `2.25 kg`, `0.75 kg`). Point-of-Sale allows cashiers to type exact weights without input locking or integer truncation.
• 🔢 **Smart Fractional Quantity Stepper**: Items under 1 kg smoothly step in `0.25 kg` increments (+/- 0.25), while standard piece items retain strict whole integer stepping (`pc`, `can`, `box`, `bottle`, `sachet`).
• 💰 **Exact Centavo Subtotal & Receipt Precision**: Line subtotals and receipt printouts calculate exact centavos (`Math.round(unit_price_c * qty)`) without floating point drift (e.g., 2.24 kg @ ₱180.00/kg = ₱403.20; 2.25 kg @ ₱180.00/kg = ₱405.00).
• 🧾 **Thermal Receipts & Refund Precision**: 58mm/80mm ESC/POS receipt engine cleanly prints decimal weights (`2.24 x 180.00    403.20`), and refund processing accurately restores fractional quantities back to inventory.
• 🛡️ **100% Cryptographic VIP Pro Preservation & Non-Destructive Storage**: Guaranteed zero data loss across upgrades. Customer databases (`tindapos.db`), credit ledgers, and VIP Pro machine licenses (`tinda_license.json`) remain 100% permanently active and valid.

### Release Checksums (SHA-256)

```text
a6c4231475c1c9e014cf7f7a4a9da0be2c1aade04a42335d94b5a385eff5fa81  TindaPOS-Setup-1.0.44.exe
cda63441451fa79be71ca94f74e6645cdb91970a3a5e6390c4d6659cf41f3647  TindaPOS-Portable-1.0.44.exe
7898a6a65761ba9d1061ee60e673b7d1dd87453a33e23faacddfc3317496acd5  TindaPOS-Setup-1.0.44.exe.blockmap
fac39ce63000e6da5641bd6d67bf9eae937304fa68044f2e379f573035c33fca  latest.yml
91082a816b94535cc0458718f6de1389fb5e909d14690e4cf217133a8997b8fc  TindaPOS-User-Guide.pdf
```
