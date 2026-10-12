# TINDA POS v1.0.98 Release Notes

**Release Date:** October 10, 2026  
**Build Target:** Windows x64 (NSIS Installer, Portable Executable & Fast Feature Patch)  
**Release Tag:** `v1.0.98`

---

## ⚡ 1. POS Fast Buttons (Speed Keys)
- **Top Quick-Access Carousel**: Direct 1-tap addition for high-velocity sari-sari items: **Yelo (Ice)** ₱5, **Yosi (Cigarette)** ₱10, **Candy** ₱1, and **Sando Bag** ₱2.
- **Full Customization**: Merchants can add custom items, reorder, change color themes, search catalog items, and upload custom product images.
- **Instant Provisioning & Audio Chime**: Automatically provisions catalog products on-the-fly if missing with audio chime feedback.

---

## 🧮 2. Cashier Calculator & Sukli Assistant (`F3`)
- **Dual Mode Calculator**: Standard arithmetic calculator with running equation history and dedicated **Sukli (Change) Assistant**.
- **Quick Cash Tender**: Rapid denomination buttons (₱20, ₱50, ₱100, ₱200, ₱500, ₱1,000) for instant change calculation without manual math errors.
- **Cart Integration**: 1-click "Add as Custom Item to Cart" with custom item description and base cost tracking.

---

## 🍲 3. Composite & Multi-Tier Nested BOM Engine
- **Migration 14 Database Schema**: Introduces `product_recipes` table and item classification: `STANDARD` (physical goods), `COMPOSITE` (recipe assemblies), and `SERVICE` (labor/intangible).
- **Automated Roll-Up COGS**: Real-time ingredient costing with live markup and gross margin tracking.
- **Nested Assemblies & Recursive Deduction**: Supports multi-tier BOMs (e.g. combo meal -> burger -> bun/patty) with depth-first cycle prevention. On checkout, leaf raw components are deducted atomically with audit trails.
- **Visual BOM Builder**: Interactive Recipe Modal in Inventory with live component search and unit breakdown.

---

## 🖨️ 4. Dedicated Printing Business & Document Services Hub
- **Organized Cashier Hub**: Dedicated page in Cashier & Register navigation for print shops and computer centers.
- **8 Core Services**: Automated costing for B/W Printing, Color Printing, Photocopy, ID Picture (1x1, 2x2, Passport), PVC ID, Resume Printing, Nametag, and Document Scanning/Lamination.
- **Granular Cost Model**: Combines paper stock, ink coverage factor, consumable wear, and labor into dynamic cost of goods sold.
- **1-Click POS Push**: Immediately pushes service orders with custom quantities and options into active POS cart.

---

## 🎁 5. Dynamic Promo Bundles Engine
- **Combos & Volume Tiers**: Supports fixed combo packages (e.g. Breakfast Combo) and quantity discount tiers (e.g. 3 for ₱50).
- **Live Cart Evaluation**: Automatically detects qualifying cart items and surfaces non-disruptive savings notification with 1-click discount application.
- **Promo Management**: Interactive modal to browse, activate, or build custom combos with 1-tap cart addition.

---

## 📊 6. Category Inventory Valuation
- **Category Valuation Pills**: Live horizontal metrics bar in Inventory displaying total SKU counts and stock valuation (₱) per category.
- **Item Type Filtering**: 1-click filter chips for Standard Physical items, Composite BOM recipes, and Services.

---

## 📦 Checksums (SHA-256)
Refer to `SHA256SUMS-v1.0.98.txt` for cryptographic binary verifications.
