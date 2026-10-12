# TINDA POS v1.0.77 — In-App Hot-Patch Redirect Engine Fix Edition

TINDA POS v1.0.77 resolves the network transport redirect issue in the **Fast In-App Feature Hot-Patch Engine**, eliminating the "Update encountered an error, retry download" notice during patch acquisition, while maintaining 100% unrestricted access to the **E-Wallet & Bills Center**.

---

### 🌟 Key Highlights & Engineering Advancements

#### 1. In-App Hot-Patch Redirect Engine Fix
- **Root Cause Identified & Fixed**: When downloading GitHub Release assets, GitHub issues an HTTP 302 redirect to storage CDNs (`release-assets.githubusercontent.com`). In Electron's `net.fetch`, `res.url` is empty upon following redirects. Strict response origin checks evaluated empty URLs as untrusted, triggering a false-positive rejection.
- **Robust Transport Validation**:
  - Relaxed redirect response validation to safely permit internal Chromium redirect following from verified release asset targets.
  - Added full allowlisting for GitHub release asset CDN domains (`release-assets.githubusercontent.com`, `objects.githubusercontent.com`, `github-releases.githubusercontent.com`, and Azure/AWS cloud storage endpoints).
- **Smooth 1-Tap Experience**: Cashiers and store owners can now update via the proactive Cupertino modal in ~3 seconds with zero download stalls or interruptions.

#### 2. Unrestricted E-Wallet & Bills Center (Full Parity)
- Fully maintains the permanent unlock across all 5 operational tabs: `Cash In / Out`, `Bills & E-Load`, `Transactions`, `Audit Sheet`, and `Audit History`.
- Free for all users without VIP crystal badges or upgrade paywalls.

---

### 📦 Release Verification & Hashes

```text
c77f8e5e5c9b0d458b8e3b3ad1a87ae3721f84d1a319ea1d9429404dee6e10aa  TindaPOS-Setup-1.0.77.exe
c696576903b1e66838a1e6ffffdd884e68691088c9816cc75b09fddfd1d2d956  TindaPOS-Portable-1.0.77.exe
d7d9210f483319e0332215d08cb34e3d590f20e149a3603da92052b9c137ce82  TindaPOS-Setup-1.0.77.exe.blockmap
73c86b13749f1a2e2caf0937870d085ed57a3c3ab7a056e0fb094771831eef59  TindaPOS-Feature-Patch-1.0.77.zip
1e5346910b3606a3bea86bb019d27e4e6d0d54a972cab95322f5db1cda903c03  latest.yml
```
