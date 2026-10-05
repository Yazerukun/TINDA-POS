# TINDA POS v1.0.55 Release Notes

**Release Date:** October 5, 2026  
**Build Target:** Windows x64 (NSIS Setup & Portable .exe) & Linux x64 (.tar.gz)

---

## 🌟 Key Highlights & Enhancements

### 1. VIP E-Wallet Reconciliation Hub Polish (Client Feedback Addressed)
- **Zero Float & Physical Cash Drawer Override**:
  - Cashiers can freely edit or 1-tap reset Expected Cash Drawer (`₱0.00 (Zero Float)`, `Sync POS Shift (₱...)`, `E-Wallet Net Only`).
  - Completely eliminates false cash shortage/variance alerts when stores keep E-Wallet cash in a separate pouch or audit independently from POS register sales.
  - Added 1-tap `Reset All to 0` for quick denomination counter clearing.
- **Dedicated Transactions Ledger Tab**:
  - Full-width 4th navigation tab: `Transactions ({count})` with live real-time search across Reference #, Customer Name, Phone, Cashier, and Notes.
  - Quick channel filter pills (`All`, `GCash`, `Maya`) and type filter pills (`All`, `Cash In`, `Cash Out`).
  - Complete transaction audit columns including Tubo/Fee, Payment Mode, Reference No, Customer Name/Phone, and instant thermal slip reprints.
- **Accessible 1-Tap Void/Delete Management**:
  - Prominent red `Void` buttons with Apple-design frosted glass confirmation modal.
  - Instantly recalculates shift summary metrics, total fees earned, and net cash drawer balance without ghost records.

### 2. Enhanced Global Community Lounge (v1.0.54 Integration)
- **Dual-Tone Web Audio Chime**: Native synthesized D5 → A5 audio chime on new external messages with persistent mute/unmute control.
- **Non-Blocking 1:1 Draggable Window**: Drag the chat anywhere on screen without blocking barcode scanning or POS order entry.
- **Minimizable Floating Capsule Pill**: 1-click collapse into an Apple-style floating pill bar (`w-72 h-11`) showing online pulse dot, unread message count badge, and 1-tap restore.
- **Self-Message Deletion & Master Edge Moderation**: Merchants can delete their own store messages with instant optimistic removal.

---

## 🔒 Verification & Invariants
- **Vitest Suites**: 61/61 passed (405/405 unit & integration tests passing).
- **TypeScript**: 0 errors across Node and Web targets.
- **Database Migrations**: Backward-compatible with automated SQLite schema migrations.

---

## 📦 Distribution Packages & Checksums
- `TindaPOS-Setup-1.0.55.exe`: `69EF686381AF26D3FD5D73573766DE01BF71B3D1DCC6E6864664D8614B7A1EC1`
- `TindaPOS-Portable-1.0.55.exe`: `DC7C9C9A37D6B4699696019A104B0BCF789E5E3278AA87CFE58EDB59D08D7C41`
- `TindaPOS-1.0.55-linux-x64.tar.gz`: `9D17404B53A5B677F391913864BCAC9AC060D05D34441E9E306F7BEEED16792E`
