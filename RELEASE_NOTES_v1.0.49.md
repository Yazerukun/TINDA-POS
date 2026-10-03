# TINDA POS v1.0.49 Release Notes

## 🚀 What's New in v1.0.49

### 1. Extended Product Specifications & Multiline Catalog Engine
- **Expanded POS Catalog Cards**: Grid card height enlarged to 185px with adaptive 3-line title wrap (`break-words`), ensuring detailed hardware dimensions and millimeter specifications (e.g. `1/2" x 100mm`, `3.2mm`, `Grade 40`) are never truncated.
- **Dedicated Secondary Specifications Display**: Product description/specs are directly shown in `text-[11px] text-slate-400` beneath the item title for instant differentiation between size variants.
- **Inventory Specifications Input**: Dedicated multiline description/specs textarea field added to `ProductModal` in Inventory with zero schema changes (persists to core `products.description` column).
- **Cart & Held Sales Retention**: Line items in the cart and resumed held sales retain full technical specifications.

### 2. Line-Item Price Override & Manager Bargain Authorization ("Tawad")
- **Manager / Admin PIN Gate**: Cashiers attempting to modify an item's unit price are prompted for a 4-digit Manager/Admin PIN. Calls `auth:verifyManagerPin` without mutating the cashier's active session, user ID, or open shift.
- **Direct Manager Access**: Store owners and managers logged into an Admin/Manager account can edit line prices directly without redundant PIN prompts.
- **Visual Bargain Badge**: Overridden items feature an amber `✏️ Bargain / Custom Price` tag and struck-through original retail price.
- **Live Margin Protection Warning**: `PriceOverrideModal` alerts the manager if a negotiated price drops below product purchase cost (`cost_base_c`).
- **Seamless Reset**: One-click "Reset to normal" restores standard retail base price or wholesale volume tiering.
- **Database & Sync Integrity**: Custom unit prices and subtotals persist accurately in `sale_items` for correct profit calculations, X/Z-Read reports, and Cloudflare Sync.

### 3. Verification & Stability
- 100% of 58 Vitest test suites passing (372/372 tests).
- 0 TypeScript compiler errors.
- Master invariant checks passed with complete cryptographic VIP Pro license preservation.

---

## 📦 Checksums (SHA-256)
```text
0f6d667d8410ef5378a9cfc7437ebe012ccf840473339f14ef62824c33772750  TindaPOS-Setup-1.0.49.exe
ef8157a74ca6b6633e1a2e91f17c968c3ca9e5efae6042d77eaff43feffcb6b1  TindaPOS-Setup-1.0.49.exe.blockmap
0b4a8faaf190300faa79a54cb5cbf4a68cac459db37e55cef4f329ac28961a5f  TindaPOS-Portable-1.0.49.exe
2defdcef37847a13590e3950c4498ea570b55c3762f715f6b4ef57869c6bfa14  latest.yml
c9e9191b3b074812c4bfeef3fe55faf11de37dbb07877d9aa182ea1c76d185d2  TindaPOS-User-Guide.pdf
```
