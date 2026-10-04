# TINDA POS v1.0.54 — Release Notes

## 🛡️ Bulletproof User Management & Modern Categorized Sidebar UX

### 🚀 Highlights & New Features

1. **Bulletproof User Management & Multi-Account Login (Phase 7)**:
   - **Flexible & Case-Insensitive Auth**: Cashiers and admins can now log in using either their exact **Username** OR their full **Display Name** without case-sensitivity friction (`LOWER(u.username) = LOWER(?) OR LOWER(u.full_name) = LOWER(?)`).
   - **Target-Aware PIN Verification & Collision Guard**: Direct verification against the selected cashier's PIN hash. Unique PIN enforcement ensures no two active staff members share the same 4-digit PIN.
   - **Admin Password Reset**: Authorized managers and admins can reset any staff member's password with minimum 4-character validation directly via `auth:adminResetPassword`.
   - **Public User Directory**: Safe endpoint (`auth:publicUsers`) exposing only safe display fields (`id`, `username`, `full_name`, `roles`) with zero hash exposure.
   - **Settings USERS Tab Overhaul**:
     - Show/Hide Password (`👁️`) toggles across Password, Confirm Password, and PIN fields.
     - Confirm Password verification to eliminate mistyped credentials.
     - Dedicated **Reset Password** and **Reset PIN** modal workflows.
     - Self-deactivation and sole active Admin deactivation guardrails.
   - **1-Tap Cashier Login Screen**: Quick-select cashier profile avatar chips with live presence indicator and automatic switch to targeted PIN unlock mode.

2. **Modern Categorized Sidebar UX Overhaul**:
   - Organized from an unsegmented flat list into 5 intuitive store workflow groups:
     - 🛒 **Cashier & Register**: *POS Cashier* (with active pulse), *Dashboard*, *E-Wallet & Audit* (VIP).
     - 📦 **Stock & Operations**: *Inventory*, *Suppliers*, *Store Expenses*.
     - 👥 **Customers & Suki**: *Customers*, *Utang Ledger*.
     - 📊 **Records & Reports**: *Transactions*, *Reports & Z-Read*.
     - ⚙️ **System & Guide**: *Settings*, *Data & Backup*, *Store Handbook*.
   - **Role-Aware Section Filtering**: Empty section headers are hidden automatically for restricted accounts.
   - **Visual Anchors**: Emerald left accent border (`border-l-2 border-brand-500`) with soft highlight gradient on the active page.
   - **Compact Tool Grid**: 2-button launcher for Live Sales Monitor (`Tv`) and Store Guide (`HelpCircle`).
   - **Staff Identity Card**: Clean bottom card with staff avatar, display name, role pill, and instant logout button.

3. **100% Comprehensive Test Suite & Invariant Protection**:
   - 18 dedicated unit/integration tests in `user-management.test.ts`.
   - All **61 test suites passed (401/401 tests)**.
   - 0 TypeScript errors across Node and Web targets.
   - Production packaging passed across Windows Setup, Windows Portable, and Linux AppImage.

---

### 📦 Verify Release Checksums (SHA-256)
```text
539aa08900699351cb84ee314bb68f82aa051adbf986a0f63e42af18556c388b  TindaPOS-Setup-1.0.54.exe
827cfd821d192b8662e6ffd7eb20f9001271b790b5080d388d829da1b52029bb  TindaPOS-Setup-1.0.54.exe.blockmap
92f5ecd2a38de8684442eadf45e6cf79d939b6e1d15140836d79542121c3f153  TindaPOS-Portable-1.0.54.exe
22506e4a3d92426765ddb4506f35588f44831533955bca324a83e16f968ec3ae  TindaPOS-1.0.54.AppImage
62c3001ec920de420a6e8fa1ccb5e3ca7768e06b72707323256c6fe6cfb0c6f1  latest.yml
6ea7a80b109833a11afc714d852dedc008a5dc44226829aaf65cdf4b0f65e922  latest-linux.yml
```
