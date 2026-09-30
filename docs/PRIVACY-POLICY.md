# TINDA POS — Privacy Policy

**Effective Date:** September 27, 2026  
**Developer:** Dev Francis (Ian) · [Facebook](https://www.facebook.com/Ukauru) · Maya: `0991 225 5156`  
**Application:** TINDA POS (Community & VIP Pro Editions)

---

## 1. 100% Offline & Zero Data Collection

TINDA POS is built from the ground up as an **offline-first** Point of Sale and Inventory Management application. 

- **No Remote Telemetry:** TINDA POS does **not** track, record, upload, or analyze your store transactions, inventory catalogs, product barcodes, daily profits, or customer debt (*utang*) records.
- **No Cloud Tracking:** We operate no remote analytic trackers, cookies, or hidden background telemetry servers.
- **Local Data Sovereignty:** Your store data is stored exclusively in your local SQLite database (`tindapos.db`) located on your physical computer. You own 100% of your data at all times.

---

## 2. Hardware ID & License Verification

When you request a **VIP Pro Lifetime License**, the application generates an anonymous, one-way hashed **Machine ID** (format: `TNDA-XXXX-XXXX-XXXX-XXXX`):

- **Data Used:** The Machine ID is calculated from local motherboard, processor, and operating system identifiers using a cryptographic SHA-256 hash.
- **Sole Purpose:** This identifier is used exclusively to generate your hardware-locked offline license key and prevent unauthorized license resale or duplication.
- **Non-Reversible:** Your hardware specifications or personal identity cannot be reversed or extracted from the Machine ID hash.
- **Zero Network Transmission:** Hardware verification occurs entirely offline on your computer using constant-time mathematical validation. No network request is sent during verification.

---

## 3. Philippine Data Privacy Act Compliance (RA 10173)

In full compliance with the **Philippine Data Privacy Act of 2012 (Republic Act No. 10173)**:
- Customer records stored in the *Suki & Utang* ledger (names, contact numbers, and balances) remain strictly on the store owner's local computer.
- Store owners have full rights to export, backup, modify, or permanently purge customer data at any time via the Database & Backup settings.
- The developer has zero access to your store database or customer information.

---

## 4. Updates & External Links

- **GitHub Release Checks:** When you manually check for updates or click release links, the application queries the official, public GitHub API (`github.com/Yazerukun/TINDA-POS`) to verify the latest version number. No store data is transmitted during update checks.
- **External Links:** Clicking the Facebook contact button or payment link opens your default web browser to the official developer account (`facebook.com/Ukauru`).

---

## 5. Contact & Inquiries

For privacy concerns, technical assistance, or license activation inquiries:
- **Developer:** Dev Francis (Ian)
- **Facebook:** [https://www.facebook.com/Ukauru](https://www.facebook.com/Ukauru)
- **Maya Official:** `0991 225 5156`
