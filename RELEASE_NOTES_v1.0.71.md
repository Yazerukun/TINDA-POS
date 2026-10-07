# TINDA POS v1.0.71 — Release Notes

**Release Date:** October 7, 2026  
**Build Target:** Windows x64 (NSIS Installer & Portable Executable)  
**Status:** Stable Production Release  

---

## 🌟 What's New in Version 1.0.71

### 1. Clean Fee Notation (No `+` Prefix)
- **Unified Clean Display**: Removed redundant `+` symbols across all E-Wallet and Bills UI elements. Fees are now formatted cleanly as `₱10.00`, `Fee: ₱15.00`, and `Tubo: ₱20.00` in quick fee chips, audit tables, and transaction ledgers.
- **Thermal Receipt Precision**: Service fees on 58mm receipts print cleanly as `Service Fee    P20.00` with 100% tabular right-alignment.

### 2. Standardized Thermal Receipt Timestamps (Zero Seconds)
- **Time Format Without Seconds**: Formatted all receipt dates to medium date with short time (e.g., `Oct 7, 2026, 10:07 PM`), completely eliminating cluttering seconds across sales slips, E-wallet transaction vouchers, and bills payment records.

### 3. Next-Generation Community Chat Overhaul
- **Hold-and-Drag Protection**: Minimized floating pill now tracks mouse drag movement with threshold suppression ($>5\text{px}$), ensuring that dragging the chat around your screen never accidentally opens or restores the window.
- **Renamed Minimized Pill**: Minimized bar updated from `Lounge` to `Chat` for immediate clarity.
- **Emoji Picker Bar**: Built-in quick emoji reaction strip with 14 expressive icons (`😀 😂 😍 👍 🙏 🏪 📦 💰 🔥 👏 ❤️ 🎉 🚀 🇵🇭`) for instant replies.
- **Photo Attachments & Clipboard Paste**: Send photo receipts, invoices, and product queries directly in chat via file selector or direct `Ctrl+V` paste from your clipboard.
- **Seen Status with Timestamp**: Messages display live seen indicators (`👁️ Seen by Cashier · 10:07 PM`).
- **Live Online Merchant Presence**: Real-time counter showing active nationwide merchants (`🟢 X Online`).
- **Edge Resilience**: Resilient non-blocking fallback prevents chat from getting stuck in an offline error state.

### 4. Universal Store Logo & Dynamic Desktop Window Icon
- **Unlocked for All Merchants**: Store logo upload in Settings is now open for all standard stores without VIP tier gating.
- **Dynamic Taskbar & Window Icon**: Changing or uploading your store logo automatically updates the Electron desktop window and taskbar icon in real time.

### 5. Executive Dashboard Animations & Welcome Banner
- **Time-Aware Greeting**: Executive welcome banner greeting cashiers based on time of day ("Good morning / afternoon / evening, [Cashier Name]!").
- **Real-Time Shift Badge**: Clear visual badge showing active shift status and store identity.
- **Smooth Cinematic Animations**: Clean CSS fade-in-up animations with micro-staggered delays for stat cards and tables upon login.

### 6. Enterprise N-Tier Architecture Standard
- **Formal Architectural Specification**: Formalized 3-Tier and N-Tier Architecture (PAL $\rightarrow$ BLL $\rightarrow$ DAL) in `SYSTEM_MASTER.md` Section 65 to ensure high maintainability, strict separation of concerns, and robust workflow for future development.

---

## 🔒 Verification & Integrity Hashes (SHA-256)

| Artifact | File Name | Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- |
| **Windows Installer** | `TindaPOS-Setup-1.0.71.exe` | 107.32 MB | `3fa95b689d391c6cd7a90ca988a19cc9281d92e3171040a853657fd9ae8dbc7b` |
| **Portable Version** | `TindaPOS-Portable-1.0.71.exe` | 107.09 MB | `10085f6a6e1b01b44dc928f7564a14451a93c90cda05ecd4c9a0f83cfbe0d431` |
| **Auto-Update Map** | `TindaPOS-Setup-1.0.71.exe.blockmap` | 116.9 KB | `1d5089bea2ac771a8e2a2dbae8dfe60240c961e913160d02758f8bfe8fc465324` |
| **Update Manifest** | `latest.yml` | 348 B | `ef92107960dd172282fce32903a1a66c9894ad46132358b981a394132f8a21f7` |
