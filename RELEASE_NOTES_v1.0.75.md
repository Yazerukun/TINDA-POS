# TINDA POS v1.0.75 — Fast In-App Feature Hot-Patch & Proactive Cupertino Update Engine Edition

TINDA POS v1.0.75 introduces the **Dual-Track Fast Update Engine** with **Zero-Restart Live Hot-Reload**, an automated **5-Point Steelclad Database Safety Shield**, and a proactive, centered **Apple Cupertino Update Pop-up Modal**.

---

### 🌟 Key Highlights & Engineering Advancements

#### 1. Dual-Track Update Engine (Fast Feature Hot-Patching)
- **Eliminated the 107 MB Bottleneck**: Decoupled pure application code (~0.81 MB compressed) from the redundant Chromium browser runtime (103 MB), slashing package size by **99.2%**.
- **5-Second Packaging Pipeline**: Introduced `npm run build:patch` via `tools/bundle_patch.mjs` for instantaneous bundling with SHA-256 integrity verification.
- **Universal Portability**: 100% supported on both Installed and Portable Windows editions without requiring elevated administrator (UAC) permissions.

#### 2. Zero-Restart In-Place Live Reload (0.3s Apply)
- **Seamless UI Refresh**: When applying feature patches, the desktop window dynamically reloads the updated React 19 UI in under 300ms without terminating the main Electron process or dropping SQLite handles.
- **Active Cashier Session Kept Alive**: Cashiers are never logged out and never encounter OS relaunch delays.

#### 3. 5-Point Steelclad Database & User Safety Shield
- **Physical Storage Decoupling**: Store SQLite database (`tindapos.db`) remains completely decoupled in `%APPDATA%\tinda-pos\database\` or `TindaPOS-Data\database\`. Code updates never touch store sales or inventory.
- **Pre-Update Automated Backup Snapshot**: Automatically creates a verified `BEFORE_UPDATE` backup snapshot before applying code patches.
- **Cashier Operation Guard**: Active checkout cart ringing and payment processing lock out updates, preventing transaction interruption.
- **Additive Migrations Only**: Non-destructive schema updates safeguard existing products, prices, and utang balances.
- **Crash Sentinel & Auto-Rollback**: Automatic boot health monitor reverts to the prior stable bundle if a patch fails to boot within two consecutive attempts.

#### 4. Proactive Zero-Click Apple Cupertino Update Pop-up Modal (`UpdateModal.tsx`)
- Directly surfaces an elegant frosted-glass modal in the center of the screen as soon as an update is detected, without requiring users to manually check Settings.
- Displays version badge, release highlights, and database safety guarantees with a 1-tap "Update & Restart Now (Takes 5 seconds)" action and progress tracking.

#### 5. 100% Strict Professional English Standardization
- Enforced pure professional English across all update dialogs, notifications, receipts, and system tools with zero dialect words.

---

### 📦 Release Verification & Hashes

```text
ab400b15f336292b8dafa53e76a6e4304a47dac895901af7217496e4d03bb702  TindaPOS-Setup-1.0.75.exe
4cef8eaf4a305e80b6a13ed55c969b366407d03adc239543e179d27f24b8fd90  TindaPOS-Portable-1.0.75.exe
6a0c0a3aa6a280c3d27784986c3683d9542819d62308c829a1d63f83bffbaa12  TindaPOS-Setup-1.0.75.exe.blockmap
e3fc38519eef2f2f2c72569c02d7ee2d942b0c21155aec26ccc3afd3872f2c08  TindaPOS-Feature-Patch-1.0.75.zip
d4e2b75506f5f6530ee76023b94fd03a267b34ffee2fd31ef88848a5724c85fb  latest.yml
```
