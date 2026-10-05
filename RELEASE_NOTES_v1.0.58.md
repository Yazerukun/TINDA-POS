# TINDA POS v1.0.58 Release Notes

**Release Date:** October 5, 2026  
**Build Target:** Windows x64 (NSIS Setup & Portable .exe)

---

## 🌟 Key Highlights & Enhancements

### 1. Restored Gross Profit & True Net Profit Margin Integrity (VIP Feedback Addressed)
- **Delivered Merchandise Margin Integrity**:
  - Restored Gross Profit calculation to merchandise markup (`(Gross Sales - Refunds) - COGS`), decoupling retail margins from customer credit repayment schedules.
  - Credit (Utang) sales no longer artificially depress gross profits or crash retail margins into negative figures on high-credit sales days.
- **Accurate True Net Profit**:
  - Strictly reflects `Gross Profit - Operating Expenses`, giving store owners consistent, trustworthy retail profit analytics.
- **Fixed Chart Profit Line**:
  - Corrected chart profit aggregations across daily, weekly, and monthly views to ensure accurate retail markup curves without negative anomalies.

### 2. Hardened VIP Downgrade Protection (Anti-Tamper & Security Invariants)
- **VIP Pro Gated Rollback**:
  - Version rollback and downgrade recovery is strictly locked behind cryptographic VIP Pro license verification across IPC and UI boundaries.
  - Prevents unauthorized store clerks or bad actors from downgrading versions to exploit older bugs, bypass security controls, or manipulate credit balances on counter terminals.

### 3. Direct Execution & Automatic System Restart ("Diritsyo Na")
- **Seamless 1-Click Automated Rollback**:
  - Once the rollback binary download completes, the system automatically spawns the installer detached and terminates the POS application cleanly after a 1.5-second buffer.
  - Eliminates file lock errors on SQLite databases and application files, allowing NSIS to update files seamlessly without manual folder exploration.
- **Runtime Flavor Auto-Detection**:
  - Automatically identifies whether the running instance is Portable or Setup, downloading and executing the exact matching distribution.

### 4. Professional Live Download Progress Bar
- **Real-Time Data Streaming**:
  - Live IPC stream displays an Apple-standard progress bar showing exact transfer percentage and transfer volume (`X MB / Y MB`).

### 5. 100% Professional English Interface
- **Polished Theme Selector**:
  - Converted all theme labels, descriptions, and eye-care tips to clean, professional English (`Midnight Black`, `Daylight White`, `Warm Eye-Care`, `Nordic Slate`).

---

## 🔒 Verification & Invariants
- **Vitest Suites**: 63/63 test files passed (411/411 unit & integration tests passing).
- **TypeScript**: 0 errors across Node (`tsconfig.node.json`) and Web (`tsconfig.web.json`) targets.
- **Master Invariants**: `tools/check_master_invariants.mjs` passed with 0 errors.

---

## 📦 Distribution Packages & SHA256 Checksums
- `TindaPOS-Setup-1.0.58.exe`: `8613de9ce79489199778cf9c2307d63ccf10d19afeb6a1fbd716d49bbce0f470`
- `TindaPOS-Portable-1.0.58.exe`: `7480e8d34995dadc1eb36f8b5b1be2af7f36e33af7dce2ce7e2055477df975dc`
- `TindaPOS-Setup-1.0.58.exe.blockmap`: `7ddb93f49d4e33815ab417011152f9806ac54f1c8b3c3673ec30ef03a9588b92`
