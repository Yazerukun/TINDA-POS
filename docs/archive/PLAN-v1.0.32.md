# PLAN-v1.0.32.md — TINDA POS v1.0.32 Development & Release Plan

> **Task Reference:** Address user feedback regarding camera scanner false positives/sensitivity, English update pop-up notifications, 1-Click Instant QR Phone Companion Scanner, and release v1.0.32 stable update.  
> **Status:** PLANNING COMPLETE | READY FOR IMPLEMENTATION

---

## 1. Context & User Requirements

### User Feedback Summary:
1. **Barcode Scanner Inaccuracy & Sensitivity:**
   - *Problem:* The scanner gives a different/wrong item, and scanning the same item repeatedly yields inconsistent barcodes. The scan sensitivity is also slow ("dugay").
   - *Root Cause Analysis:*
     - ZXing's `MultiFormatReader` was configured with `BarcodeFormat.ITF` (Interleaved 2 of 5) and `BarcodeFormat.CODE_39` without checksum enforcement. ITF decodes any two parallel bars and frequently triggers false-positive partial matches (e.g. 4-6 digits) from grocery packaging or EAN-13 barcodes.
     - When a false-positive partial code is emitted, the POS searches the database and either matches a different item or returns a non-matching code.
     - Video frames were being processed at full 1280x720 canvas dimensions in JavaScript, taking 180ms–250ms per frame and causing slow frame rates and sluggish recognition.
     - Missing `reader.reset()` between failed decode attempts allowed internal decoder residue to corrupt subsequent frames.
2. **Update Pop-up English Language Standardization:**
   - *Problem:* Update pop-up modal on the Dashboard contained Bisaya strings (`Adunay bag-ong bersyon...`, `Unsay Bago sa Bersyon...`, `Nag-download sa update…`).
   - *Requirement:* All update notifications and pop-ups must be strictly in 100% English.
3. **1-Click Phone QR Companion Scanner ("Scan-to-Connect"):**
   - *Problem:* Relying on third-party webcam software (Iriun, DroidCam) or cables is cumbersome for store owners.
   - *Requirement:* A 1-click connection where TINDA POS displays a pairing QR code on screen. The store owner scans the QR code with their mobile phone camera (iPhone or Android), immediately opening an offline-capable web scanner. The phone's camera auto-scans products and instantly pushes them into the desktop POS cart!
4. **Stable Release v1.0.32:**
   - *Requirement:* Prepare and distribute **v1.0.32** so existing users receive the update seamlessly via `electron-updater` and GitHub Releases.

---

## 2. Technical Approach & Architecture

### Component 1: Barcode Scanner Engine Overhaul (Eliminating False Positives & Lag)
- **Retail-Specific Format Filter:**
  - Remove `BarcodeFormat.ITF` and unconstrained `CODE_39`.
  - Strictly support retail formats: `EAN_13`, `EAN_8`, `UPC_A`, `UPC_E`, `CODE_128`, and `QR_CODE`.
- **EAN-13 / UPC Algorithmic Modulo-10 Checksum Validation:**
  - Enforce mathematical check-digit verification on all 13-digit and 12-digit barcodes prior to emitting a match.
- **Resolution Scaling & Processing Acceleration:**
  - Scale decoding canvas to max 640px width. This reduces pixel operations by ~70%, cutting per-frame CPU decode latency from 200ms down to ~15ms.
  - Decrease polling interval from 120ms to 40ms (~20-25 FPS), yielding instant detection.
- **Decoder Hygiene:**
  - Explicitly invoke `reader.reset()` after every attempt.

### Component 2: 100% English Dashboard Update Pop-up
- Replace all remaining Bisaya text in `Dashboard.tsx`:
  - `Adunay bag-ong bersyon sa TINDA POS nga magamit!` → `A new version of TINDA POS is available!`
  - `Naka-portable mode ang imong TINDA POS...` → `TINDA POS is running in portable mode. Download the latest portable release to enjoy new features and improvements.`
  - `Ang imong mga data (sales, inventory, utang) luwas...` → `Your store sales, inventory, and customer credit ledger data are safe and will be backed up automatically before updating.`
  - `Nag-download sa update…` → `Downloading update…`
  - `Unsay Bago sa Bersyon v{...}:` → `What's New in Version v{...}:`

### Component 3: 1-Click QR Phone Companion Scanner Architecture
- **Embedded Local HTTP/WebSocket Service (`source/src/main/services/phoneScannerService.ts`):**
  - Runs in Electron Main Process using Node.js built-in `node:http`.
  - Discovers the local Wi-Fi IP address via `os.networkInterfaces()` (e.g. `http://192.168.1.X:3112`).
  - Serves a lightweight, zero-dependency mobile web app at `/scanner`.
  - Serves API endpoints:
    - `GET /scanner` — Mobile scanner HTML/JS interface with back-camera autofocus and haptic feedback.
    - `POST /api/scan` — Receives `{ barcode, session }` from the phone.
    - `GET /api/status` — Reports phone connection status to the desktop.
- **Desktop UI Integration (`POS.tsx` & `CameraScannerModal.tsx`):**
  - Displays pairing QR code generated via `@zxing/library` (`BrowserQRCodeSvgWriter`) or inline SVG.
  - Shows live connection badge: `⚪ Waiting for Phone...` → `🟢 Phone Connected: iPhone / Android`.
  - Scanned barcodes received from the phone trigger the desktop POS cart insertion directly with sound feedback.

### Component 4: Release v1.0.32 & Auto-Updater Verification
- Version bump in `source/package.json` to `1.0.32`.
- Run full 44-suite Vitest test suite (maintaining 100% pass rate).
- Build production Windows NSIS installer and Portable executable.
- Regenerate 30-page `TindaPOS-User-Guide.pdf` with v1.0.32 release notes.
- Verify `latest.yml`, `.blockmap`, and SHA-256 checksums.
- Dual-repository sync: push source code to private repo, push binaries/docs to public repo with tag `v1.0.32`.

---

## 3. Milestones & Verification Gates

- [ ] **M1: English Standardization of Dashboard Update Pop-up**
  - Verify: No Bisaya/Tagalog strings remain in `Dashboard.tsx`.
- [ ] **M2: Camera Scanner False-Positive Elimination & Speed Optimization**
  - Verify: ITF/Code39 removed; EAN-13 checksum validation added; downscaled processing achieves <20ms decode time.
- [ ] **M3: Embedded Phone Scanner Service & QR Code Pairing Interface**
  - Verify: Node HTTP server launches on local port; QR code displays local IP; mobile endpoint decodes and posts barcodes to desktop POS cart.
- [ ] **M4: Automated Test Gate & Typecheck**
  - Verify: `npm run typecheck` and `npm test` (all test suites passing).
- [ ] **M5: Binaries Packaging, User Guide PDF & Dual-Repo Distribution**
  - Verify: Windows installers built, SHA256SUMS generated, public release updated without source leakage.

---

## 4. Scope Boundaries

- **In Scope:**
  - Scanner accuracy, checksum validation, sensitivity, and false-positive fixes.
  - Complete English translation of update pop-ups.
  - Native Node.js HTTP companion server for zero-install smartphone scanning over local Wi-Fi.
  - v1.0.32 release creation and distribution.
- **Out of Scope:**
  - External cloud database syncing (retains offline-first LAN architecture).
  - Native mobile app stores (uses zero-install progressive mobile browser interface).

---

## 5. Risks & Mitigation

| Risk | Mitigation |
| :--- | :--- |
| Phone and PC on different subnets or AP isolation enabled | Display clear troubleshooting notice: "Ensure phone and PC are connected to the same Wi-Fi or PC mobile hotspot." Provide manual IP configuration fallback. |
| Mobile browser camera permission denied | Provide clear on-screen prompt on the phone explaining how to allow camera access. |
| Port collision on port 3112 | Dynamically find an available port if 3112 is occupied. |
