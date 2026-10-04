# TINDA POS v1.0.50 — Global Community Lounge & Live Dev Announcements

**Release Date:** October 4, 2026  
**Version:** 1.0.50  
**Build Type:** Stable

---

## What's New

### 1. TINDA Global Community Lounge (VIP Pro Exclusive)

A floating **Global Lounge** button now appears in the bottom-right corner of the POS interface. Clicking it opens a slide-over chat drawer where VIP Pro store owners can send and read real-time messages from the entire TINDA POS community.

**Key features:**
- Real-time messages from all VIP stores powered by **Cloudflare D1** (global edge database)
- **VIP Pro members** can send messages; free-tier users have read-only access with an upgrade prompt
- Amber unread-message badge on the button when there are new messages
- Polling runs only while the drawer is open (every 6 seconds) — stops automatically when closed
- **Zero-freeze architecture**: all network calls are fully non-blocking with 4s GET / 5s POST timeout limits — the POS never stalls waiting for the internet

### 2. Live Developer Announcements

A pinned announcement banner at the top of the Community Lounge always shows the latest official message from the developer. This is used for:
- New update notices
- Downtime warnings
- Feature previews and tips

### 3. Dev/Owner Verified Badge

Messages posted by Ian (the founder) display a special **`👑 Ian (Founder / Dev) [VERIFIED]`** badge in amber styling. This badge is cryptographically verified server-side using a protected Dev Master Key — it cannot be faked by any regular user.

### 4. English Update Notification Modal

The "New Update Available" pop-up dialog is now fully in English:
- Title: **"New Update Available"** (previously "Bag-ong Update!")  
- Dismiss button: **"Later"** (previously "Unya Na")  
- All action buttons consistent in English

### 5. Architecture & Quality

- **59/59 test suites passing** (378/378 tests total)
- **6 new unit tests** for the Community Chat service
- **0 TypeScript errors** — full typecheck clean
- All master invariants: ✅ PASSED

---

## Downloads

| File | Description |
|------|-------------|
| `TindaPOS-Setup-1.0.50.exe` | Windows Installer (recommended) |
| `TindaPOS-Portable-1.0.50.exe` | No-install portable version |
| `TindaPOS-User-Guide.pdf` | User manual |
| `SHA256SUMS-v1.0.50.txt` | Integrity checksums |

---

## Previous Version

- **v1.0.49** — Extended Product Specifications Visibility & Manager Bargain Authorization (Tawad)
- **v1.0.48** — Cloud Dashboard Sync (Cloudflare Worker backend)

---

*TINDA POS — Built for Filipino sari-sari stores and small businesses.*
