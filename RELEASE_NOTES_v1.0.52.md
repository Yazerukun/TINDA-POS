# TINDA POS v1.0.52 — Release Notes

## 💎 Verified VIP Badges, Animated Shimmer & Linux Auto-Updater

### 🚀 Highlights & New Features

1. **Animated VERIFIED VIP Badges in Global Community Lounge**:
   - Store owners who purchased and activated lifetime **VIP Pro licenses** now proudly display an exclusive animated glowing badge:
     `💎 VERIFIED VIP`
   - Features:
     - Continuously rotating sparkle star icon (`Sparkles` with smooth animation)
     - Golden pulse aura (`bg-gradient-to-r from-amber-500/25 via-yellow-400/35 to-amber-500/25`)
     - Premium gold-tinted message bubbles (`border-amber-500/35 ring-1 ring-amber-400/20`)
     - Chat composer dynamically signals: `💎 Posting with Verified VIP Pro badge`
   - Honors all loyal merchants who supported TINDA POS by purchasing licenses from Dev Ian.

2. **Cross-Platform Linux AppImage Auto-Updater**:
   - Fixed Linux AppImage updater routing and permissions.
   - Clean background download, automatic `chmod +x` permissions, in-place atomic binary replacement, and instant relaunch.

3. **Cloudflare D1 Edge & Worker Support**:
   - `global_chat_messages` table on Cloudflare D1 upgraded with `is_vip` column.
   - Edge worker (`https://tinda-sync.yomikaze-md.workers.dev`) live and verifying VIP status in real time.

4. **100% Free Nationwide Community Lounge & Dynamic Red Alerts**:
   - Global chat remains completely free and open for all store owners.
   - Red pulse unread notification badge alerts cashiers when drawer is closed.

---

### 📦 Verify Release Checksums (SHA-256)
```text
0367785740bb6ebd5aadd2aaae263bd0b888190c50068aff95358d689112fc86  TindaPOS-Setup-1.0.52.exe
6d12c90bd95a0a95715f88f27f405d66f6b094e2de3a0530eaf17958caa55920  TindaPOS-Setup-1.0.52.exe.blockmap
a5e70463e324b70afe76d35f4b434d7b7a6a71b522a68e757e133aa2b9a74e09  TindaPOS-Portable-1.0.52.exe
4ac1539290f21528ac1bc44e671f2b1bc93ea4be40928f9fefaa77069e2ff7c5  TindaPOS-1.0.52.AppImage
c710a7160dd2813dc2c31ccb9c10dcf28f45523f675049a5c6f6bb6c802ebae4  latest.yml
bd1667bc491d956e8b1d50bfb83edb07b60b2915f906e8ba9dea275d4ff09b5d  latest-linux.yml
c9e9191b3b074812c4bfeef3fe55faf11de37dbb07877d9aa182ea1c76d185d2  TindaPOS-User-Guide.pdf
```
