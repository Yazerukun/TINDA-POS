# TINDA POS RELEASE STATE

## v1.0.27 PUBLISHED & LIVE - 2026-09-20 (Ian GO)

- Branch: `v1.0.19-dev` (tag `v1.0.27`).
- Features & Fixes (TINDA BANTAY: Complete 172-Item Market Catalog):
  * Complete 172-Item Market Price Catalog: Full Philippine grocery & sari-sari store commodity price catalog across all 12 key categories (Noodles, Canned Fish, Canned Meat, Dairy, Coffee & Beverages, Cooking Oil & Condiments, Seasonings, Snacks & Biscuits, Personal Care, Household Cleaning, Rice & Sugar, Liquor & Tobacco) with verified EAN-13 barcodes, DTI SRP / supermarket prices, and package images.
  * Built-in 100% Offline Seed: All 172 commodity records compiled directly into the application (`seedPriceReferences.ts`) for out-of-the-box offline utility with zero internet.
  * TINDA BANTAY Real-Time Market Feed: Automatically connects to the live verified online Philippine grocery commodity feed (`data/price-catalog.json`) via HTTPS whenever internet connectivity is active.
  * Auto Live-Sync on Open & Reconnect: Opening the Price Guide modal while online triggers a silent background sync that immediately refreshes market prices live on screen; reconnecting to WiFi/data automatically triggers sync.
  * Pulsing 🟢 LIVE Indicator Badge: Visual live status indicator (🟢 `LIVE · Bantay Presyo Online`) when connected, with clean neutral ⚪ `OFFLINE · Cached Local Data` fallback when disconnected.
  * TINDA SCOUT Harvester (`tools/tinda-scout/scout.py`): Powered by the latest `d4vinci/Scrapling` (v0.4.15) for stealth, anti-bot-bypassing price harvesting from major Philippine retail supermarket chains and official DTI SRP advisories.
  * Store Owner Authority Guaranteed: Reference prices are strictly advisory; store owner POS selling prices and costs are never automatically overwritten or modified.
- Gates: 42/42 test files (292/292 tests) PASS, typecheck PASS, build PASS.
- Windows RC artifacts (`installers/`, `sha256sum -c SHA256SUMS-v1.0.27.txt` PASS):
  * TindaPOS-Setup-1.0.27.exe          (SHA256 77b234843c7b9cdf91a26fc3a298f72d5bd4e8fb89022bf021e674df3df18b84)
  * TindaPOS-Setup-1.0.27.exe.blockmap (SHA256 d8966c6dad54d6357c666794e45506baf73cec75158470dce3f6cf69368373f7)
  * latest.yml                        (version 1.0.27)
  * TindaPOS-Portable-1.0.27.exe       (SHA256 247cb5c007ee6dfc84c7d0bcfa74f87ebf6da47477e4d423ab60fb95c50f21f3)
  * TindaPOS-User-Guide.pdf           (v1.0.27, 28pp)
  * SHA256SUMS-RC.txt + SHA256SUMS-v1.0.27.txt
- Updater gate: electron-updater + electron-builder + app-update.yml untouched (byte-identical firmware, auto-update from v1.0.19/v1.0.20/v1.0.21/v1.0.22/v1.0.23/v1.0.24/v1.0.25/v1.0.26 to v1.0.27 verified).
- STATUS: **PUBLISHED 2026-09-20 (Ian GO).**
  * Windows release: https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.27

## v1.0.26 PUBLISHED & LIVE - 2026-09-20 (Ian GO)

- Branch: `v1.0.19-dev` (tag `v1.0.26`).
- Features & Fixes (TINDA BANTAY Edition):
  * TINDA BANTAY Real-Time Market Feed: Automatically connects to the live verified online Philippine grocery commodity feed (`data/price-catalog.json`) via HTTPS whenever internet connectivity is active.
  * Auto Live-Sync on Open & Reconnect: Opening the Price Guide modal while online triggers a silent background sync that immediately refreshes market prices live on screen; reconnecting to WiFi/data automatically triggers sync.
  * Pulsing 🟢 LIVE Indicator Badge: Visual live status indicator (🟢 `LIVE · Bantay Presyo Online`) when connected, with clean neutral ⚪ `OFFLINE · Cached Local Data` fallback when disconnected.
  * TINDA SCOUT Harvester (`tools/tinda-scout/scout.py`): Powered by `d4vinci/Scrapling` for stealth, anti-bot-bypassing price harvesting from major Philippine retail supermarket chains (Puregold, Super8, SM Markets) and DTI SRP advisories.
  * Store Owner Authority Guaranteed: Reference prices are strictly advisory; store owner POS selling prices and costs are never automatically overwritten or modified.
- Gates: 42/42 test files (292/292 tests) PASS, typecheck PASS, build PASS.
- Windows RC artifacts (`installers/`, `sha256sum -c SHA256SUMS-v1.0.26.txt` PASS):
  * TindaPOS-Setup-1.0.26.exe          (SHA256 b16fdb92aa216d3340d0bfe6557ef3a3499a2a7f6d07d1e5ffe1446a5fe79cc5)
  * TindaPOS-Setup-1.0.26.exe.blockmap (SHA256 e8e5dd5ebe67e09fd2b70c2bb475e52b2a51ef1bf024cdc561bcb29f58bad16e)
  * latest.yml                        (version 1.0.26)
  * TindaPOS-Portable-1.0.26.exe       (SHA256 43f59695c79017360d4965b5e56960b9318f8062e565309fc6f0e647d0a68369)
  * TindaPOS-User-Guide.pdf           (v1.0.26, 28pp)
  * SHA256SUMS-RC.txt + SHA256SUMS-v1.0.26.txt
- Updater gate: electron-updater + electron-builder + app-update.yml untouched (byte-identical firmware, auto-update from v1.0.19/v1.0.20/v1.0.21/v1.0.22/v1.0.23/v1.0.24/v1.0.25 to v1.0.26 verified).
- STATUS: **PUBLISHED 2026-09-20 (Ian GO).**
  * Windows release: https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.26

## v1.0.25 PUBLISHED & LIVE - 2026-09-20 (Ian GO)

- Branch: `v1.0.19-dev` (tag `v1.0.25`).
- Features & Fixes:
  * Offline-First Online Price Guide / Market Price Reference: Built-in reference market prices and suggested ranges based on DTI SRP and market price guides for Philippine grocery staples.
  * Price Guide Modal Stability & Auto-Seed Fix: Resolved blank screen on launch by aligning rows/references data contract and adding defensive guards; auto-populates 20 staple Philippine commodity items on empty database without requiring initial sync.
  * Dashboard Update Pop-Up Modal & 15-Minute Throttle: Added a prominent update modal on the Dashboard with release highlights, download progress, and 1-click install; reduced background auto-check throttle to 15 minutes for prompt update notifications.
  * Store Owner Authority Guaranteed: Advisory-only guidance; store owner POS selling prices and costs are never automatically overwritten or changed.
  * Migration 8 (`price_references`): Indexed SQLite table with foreign-key safe cascade behavior (`ON DELETE SET NULL`), barcode and name lookup indexes.
  * Preloaded Seed Catalog: Bundled Philippine grocery commodities (Lucky Me Pancit Canton/Mami, Mega Sardines, 555 Sardines, Bear Brand, Nescafe, Kopiko, Great Taste, Coca-Cola, Datu Puti, Silver Swan, Safeguard, Surf, San Miguel, Red Horse).
  * Dual-Probe Connectivity Check & Stale Data Transparency: Safe background synchronization with Google and Microsoft endpoints. Explicitly indicates "Offline — Showing Last Saved Data" when disconnected and warns if reference data is >30 days old.
  * Subtle POS Card Indicator: Clean reference badge (`Ref: ₱10.50`) on POS product cards without cluttering or impacting checkout speed.
- Gates: 42/42 test files (292/292 tests) PASS, typecheck PASS, build PASS.
- Windows RC artifacts (`installers/`, `sha256sum -c SHA256SUMS-v1.0.25.txt` PASS):
  * TindaPOS-Setup-1.0.25.exe          (SHA256 d1bef9adcb4b4bee9b13bd87f59f4f717305918d321d5b9be51d9bb60a9fcfa9)
  * TindaPOS-Setup-1.0.25.exe.blockmap (SHA256 b2804aecb97be47a0249f126763863504528444b058338e97eaed9372bdaa7db)
  * latest.yml                        (version 1.0.25)
  * TindaPOS-Portable-1.0.25.exe       (SHA256 24d66b438221560b5eedff254b05e8cc7e83be73cbff6a04e48f0902f1629a19)
  * TindaPOS-User-Guide.pdf           (v1.0.25, 27pp)
  * SHA256SUMS-RC.txt + SHA256SUMS-v1.0.25.txt
- Updater gate: electron-updater + electron-builder + app-update.yml untouched (byte-identical firmware, auto-update from v1.0.19/v1.0.20/v1.0.21/v1.0.22/v1.0.23/v1.0.24 to v1.0.25 verified).
- STATUS: **PUBLISHED 2026-09-20 (Ian GO).**
  * Windows release: https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.25

## v1.0.24 PUBLISHED & LIVE - 2026-09-20 (Ian GO)

- Branch: `v1.0.19-dev` (tag `v1.0.24`).
- Features:
  * Offline-First Online Price Guide / Market Price Reference: Built-in reference market prices and suggested ranges based on DTI SRP and market price guides.
  * Store Owner Authority Guaranteed: Advisory-only guidance; store owner POS selling prices and costs are never automatically overwritten or changed.
  * Migration 8 (`price_references`): Indexed SQLite table with foreign-key safe cascade behavior (`ON DELETE SET NULL`), barcode and name lookup indexes.
  * Preloaded Seed Catalog: Bundled Philippine grocery commodities (Lucky Me Pancit Canton/Mami, Mega Sardines, 555 Sardines, Bear Brand, Nescafe, Kopiko, Great Taste, Coca-Cola, Datu Puti, Silver Swan, Safeguard, Surf, San Miguel, Red Horse).
  * Dual-Probe Connectivity Check & Stale Data Transparency: Safe background synchronization with Google and Microsoft endpoints. Explicitly indicates "Offline — Showing Last Saved Data" when disconnected and warns if reference data is >30 days old.
  * Price Guide Modal in Inventory: Search, filter by source and linked status, manual sync with progress indicator, and manual product linking/unlinking.
  * Subtle POS Card Indicator: Clean reference badge (`Ref: ₱10.50`) on POS product cards without cluttering or impacting checkout speed.
- Gates: 42/42 test files (292/292 tests) PASS, typecheck PASS, build PASS.
- Windows RC artifacts (`installers/`, `sha256sum -c SHA256SUMS-v1.0.24.txt` PASS):
  * TindaPOS-Setup-1.0.24.exe          (SHA256 00940a2b02ba2a9da8b10e6cedb5572cccbb35c53f5f8d75684ef87b6a640587)
  * TindaPOS-Setup-1.0.24.exe.blockmap (SHA256 1dae3fd4552dca859c66c9a31bcdca732a2313c67ff840959508c9f08fb48f7d)
  * latest.yml                        (version 1.0.24)
  * TindaPOS-Portable-1.0.24.exe       (SHA256 ed987c0ca829121a81e2cddb6b58102f5d48a68665f6ff8685d447bd676cfee5)
  * TindaPOS-User-Guide.pdf           (v1.0.24, 27pp)
  * SHA256SUMS-RC.txt + SHA256SUMS-v1.0.24.txt
- Updater gate: electron-updater + electron-builder + app-update.yml untouched (byte-identical firmware, auto-update from v1.0.19/v1.0.20/v1.0.21/v1.0.22/v1.0.23 to v1.0.24 verified).
- STATUS: **PUBLISHED 2026-09-20 (Ian GO).**
  * Windows release: https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.24

## v1.0.23 PUBLISHED & LIVE - 2026-09-20 (Ian GO)

- Branch: `v1.0.19-dev` (tag `v1.0.23`).
- Features:
  * Global Responsive Table Auto-Fit & Alignment: Enforced `table-layout: fixed`, centered content, and proportional percentage widths across all tables (Utang, Transactions, Customers, Expenses, Backup, Inventory, Settings, Reports). Contained in `.table-container` with `overflow-x-auto` to dynamically scale on small laptops and wide desktop monitors without column shifting.
  * Product Picture Uploads: Support store owners uploading, previewing, and removing product photos with thumbnails in POS checkout cards and Inventory management. Served via `tinda-image://` protocol.
  * Suggested Retail Price (SRP) & Auto-Markup: Added Migration 7 (`srp_c` column). Quick auto-markup buttons (+10% to +30%), real-time margin calculation, 1-click "Use as Price", and POS card SRP reference badge.
  * Dashboard Update Notifications: Automatic background check on Dashboard mount with dismissible notification banner and 1-click Download / Restart & Install.
- Gates: 40/40 test files (268/268 tests) PASS, typecheck PASS, build PASS.
- Windows RC artifacts (`installers/`, `sha256sum -c SHA256SUMS-RC.txt` PASS):
  * TindaPOS-Setup-1.0.23.exe          (SHA256 00db00c76748507a9103e3f59c97fb91861ac92d227b5dc6150134a6bc4bbb77)
  * TindaPOS-Setup-1.0.23.exe.blockmap (SHA256 b35111fb2b336427df89071429eba697ca7f6a96d25923ad9ecb4dce14bba2b9)
  * latest.yml                        (version 1.0.23, SHA256 84a6dbae67751a40c133d6ab3f235f82b2824d2c75bfbbe449c22fba828857f8)
  * TindaPOS-Portable-1.0.23.exe       (SHA256 3305b16f87b92bf00a3f6c7a2b240ece1c6d0c788d3b9b9ca2b3646c951111da)
  * TindaPOS-User-Guide.pdf           (v1.0.23, 26pp, SHA256 4a9608e364ad64674506f350d8d6b5b8cdaeb18dd755c1774d3a1f8a73b1de1b)
  * SHA256SUMS-RC.txt + SHA256SUMS-v1.0.23.txt
- Updater gate: electron-updater + electron-builder + app-update.yml untouched (byte-identical firmware, auto-update from v1.0.19/v1.0.20/v1.0.21/v1.0.22 to v1.0.23 verified).
- STATUS: **PUBLISHED 2026-09-20 (Ian GO).**
  * Windows release: https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.23

## v1.0.22 PUBLISHED & LIVE - 2026-09-20 (Ian GO)

- Branch: `v1.0.19-dev` (tag `v1.0.22`).
- Features:
  * English Standardization in Utang: Standardized tabs (With Balance, Settled, All), stats bar, status badges (SETTLED ✓, WITH BALANCE, OVER LIMIT), and empty states to clean English.
  * Responsive Table Containment: Added `overflow-x-auto` to both Utang and Transactions tables for seamless scaling across all laptop and desktop resolutions.
  * Strict Column Alignment: Explicit matching column widths in Utang (Customer auto, Credit Limit w-36, Balance w-36, Status w-36, Actions w-44) and Transactions (Receipt w-48, Date w-40, Cashier w-32, Customer auto, Total w-32, Status w-32, Actions w-32).
  * Transactions Expanded Items `<tfoot>`: Discount and Total are strictly aligned directly under the Subtotal column without shifting parent columns.
- Gates: 40/40 test files (268/268 tests) PASS, typecheck PASS, build PASS.
- Windows RC artifacts (`installers/`, `sha256sum -c SHA256SUMS-RC.txt` PASS):
  * TindaPOS-Setup-1.0.22.exe          - 109664031 B (SHA256 c4eb32cee591e4c43c1cf2c697f33722dc3a795501aeda108a8e99625527b4f9)
  * TindaPOS-Setup-1.0.22.exe.blockmap - 117173 B (SHA256 1b02bf7689f03c55e218a826ed85e1bf1525461eb675c19169adf436f0625f53)
  * latest.yml                        - 348 B (version 1.0.22, sha512 matches Setup)
  * TindaPOS-Portable-1.0.22.exe       - 109433657 B (SHA256 e46ef62ddcd5b9c7ee7a33d10f99460d360dd59c71086b0a10784470c4c5d283)
  * TindaPOS-User-Guide.pdf           - 197553 B (v1.0.22, 26pp, SHA256 4af1c9d6275528b20f61564ec5d410275a05541c76a823f18ecd5accba14d959)
  * SHA256SUMS-RC.txt + SHA256SUMS-v1.0.22.txt
- Updater gate: electron-updater + electron-builder + app-update.yml untouched (byte-identical firmware, auto-update from v1.0.19/v1.0.20/v1.0.21 to v1.0.22 verified).
- STATUS: **PUBLISHED 2026-09-20 (Ian GO).**
  * Windows release: https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.22

## v1.0.21 PUBLISHED & LIVE - 2026-09-20 (Ian GO)

- Branch: `v1.0.19-dev` (tag `v1.0.21`).
- Features:
  * Customers & Utang: Filter Tabs — **May Utang (With Balance)** [Default], **Bayad Na (Settled)**, and **Tanan (All)** with live customer counter badges.
  * Utang Quick Stats Bar: Top summary cards for Total Outstanding Utang (₱), May Utang count, and Bayad Na count.
  * Customer Status Badges: Distinct visual pills — `BAYAD NA ✓` (Emerald Green for ₱0.00), `MAY UTANG` (Amber for active debt), `OVER LIMIT` (Rose Red).
  * Contextual Actions: `Pay` & `Adj` for active debt; `Ledger` & `Adj` for settled customers.
- Gates: 40/40 test files (268/268 tests) PASS, typecheck PASS, build PASS.
- Windows RC artifacts (`installers/`, `sha256sum -c SHA256SUMS-RC.txt` PASS):
  * TindaPOS-Setup-1.0.21.exe          - 109663660 B (SHA256 2b85f287bf5e94292819647e008a8903364d6c2a12b6724ddcc43b440658c5de)
  * TindaPOS-Setup-1.0.21.exe.blockmap - 117097 B (SHA256 0828826598f0c41a1ed8e1632ec979381376e6213b48151941014c20ea557019)
  * latest.yml                        - 348 B (version 1.0.21, sha512 matches Setup)
  * TindaPOS-Portable-1.0.21.exe       - 109433277 B (SHA256 77c2c0e5c2865d93b97824577813be7a0dbdd54d378b66d1e14635498d8bd1d2)
  * TindaPOS-User-Guide.pdf           - 195855 B (v1.0.21, 25pp, SHA256 e8f093e96febe712e0a05b2637b009cc0ba6e2577792c6b67dc9457936f97963)
  * SHA256SUMS-RC.txt + SHA256SUMS-v1.0.21.txt
- Updater gate: electron-updater + electron-builder + app-update.yml untouched (byte-identical firmware, auto-update from v1.0.19/v1.0.20 to v1.0.21 verified).
- STATUS: **PUBLISHED 2026-09-20 (Ian GO).**
  * Windows release: https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.21

## v1.0.20 PUBLISHED & LIVE - 2026-09-20 (Ian GO)

- Branch: `v1.0.19-dev` (tag `v1.0.20`).
- Features:
  * Dashboard: Semantic color-coding for Net Sales (emerald), Estimated Profit (teal), Utang (rose), Expenses (amber).
  * Inventory/Receiving: Whole-peso unit cost validation (rejects decimals), aligned receiving details modal UI.
  * Transactions: Fixed column alignment (`table-fixed`, `w-28` Qty, `w-32` Unit Price, `w-32` Subtotal, right-aligned, `font-mono tabular-nums`).
- Gates: 40/40 test files (268/268 tests) PASS, typecheck PASS, build PASS.
- Windows RC artifacts (`installers/`, `sha256sum -c SHA256SUMS-RC.txt` PASS):
  * TindaPOS-Setup-1.0.20.exe    - 109662950 B (SHA256 a0677c6496ba59b99582f4a4b6af48195d96af66266e0791efa83515830a3e42)
  * TindaPOS-Setup-1.0.20.exe.blockmap - 117390 B (SHA256 bd48281ab3292fc3d916b924814955814c1dba48732ec711bbd171f2deea572e)
  * latest.yml                  - 348 B (version 1.0.20, sha512 matches Setup)
  * TindaPOS-Portable-1.0.20.exe - 109432454 B (SHA256 f26073cb6c9a4e0f3f7ef65d936fdc30ddc89d9db2731a1995e46835c9f2ef28)
  * TindaPOS-User-Guide.pdf     - 181652 B (v1.0.20, 24pp, SHA256 00bb3df72dbe7f7dce7dfa51d93d90ab14b8de9e24af987a38d26b9b4a413b32)
  * SHA256SUMS-RC.txt + SHA256SUMS-v1.0.20.txt
- Updater gate: electron-updater + electron-builder + app-update.yml untouched (byte-identical firmware, auto-update from v1.0.19 to v1.0.20 verified).
- STATUS: **PUBLISHED 2026-09-20 (Ian GO).**
  * Windows release: https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.20

## v1.0.19 PUBLISHED & LIVE - 2026-09-19 (Ian GO)

- Branch: `v1.0.19-dev` (from v1.0.18 stable `1e662c8`).
- RC_COMMIT: `b9f438beff2447e1bd678d708a312c693459a525` (`feat: complete v1.0.19 release candidate`). Clean working tree.
- Gates: Windows 260/260 tests PASS, typecheck PASS, lint PASS, build PASS. Android 93/93 tests PASS, release APK build PASS.
- Features: Universal Windows↔Android `.tinda-backup` exchange; refund-aware Estimated Profit (sales/reports/dashboard/cashier); withdrawal notes visible in Stock History; Reset Database reliability (RESET gate + preserved backups + reload to first-run); receipt layout aligned (58mm+80mm, preview==print, receiptHtml byte-identical across apps).
- Windows RC artifacts (builds + installers/, `sha256sum -c SHA256SUMS-RC.txt` PASS):
  * TindaPOS-Setup-1.0.19.exe    - 109661258 B (SHA256 9720b93860187e1d4acad7b5846602add2070af77e0870919f0fbfa89cac3aec)
  * TindaPOS-Setup-1.0.19.exe.blockmap - 116995 B (SHA256 9b451e94d5e2756e7d751881f631b7d27120c0a75f98d8ea5c2addabf0d146ed)
  * latest.yml                      - 348 B (version 1.0.19, sha512 matches Setup)
  * TindaPOS-Portable-1.0.19.exe    - 109430874 B (SHA256 a663cc3f2928714820409722dd27bdd2472155271ab232a85d34cefaf8066f62)
  * TindaPOS-User-Guide.pdf         - 170447 B (v1.0.19, 24pp, SHA256 78890d798f4b90516e6db5a5af43fae9cfd190a9aa9a3a6a555027d1f353294f)
  * SHA256SUMS-RC.txt (release checksum manifest) + RC-SOURCE-COMMIT.txt
- Updater gate: electron-updater + electron-builder + app-update.yml untouched (release = source-only additions, no updater code changes).
- STATUS: **PUBLISHED 2026-09-19 (Ian GO).**
  * Windows release: https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.19 (Latest, tag v1.0.19 → b9f438b, 6 assets, sha256 verified).
  * Android release: https://github.com/Yazerukun/TINDA-POS-Android-Free/releases/tag/v1.0.23 (Latest, tag v1.0.23 → f2f6fce, app-release.apk).
- Android RC counterpart (SUPERSEDED v1.0.22 → **v1.0.23**, see below).
- Android RC v1.0.23 / versionCode 23: TINDA-POS-Android-Free, RC_COMMIT `f2f6fce`, HEAD chain `f2f6fce`(RC) → `751dbc9`(fix) → `c2d0f9c`(v1.0.22 RC). APK `android/app/build/outputs/apk/release/app-release.apk` 3417611 B (SHA256 6a60100e2373e80b660770e3303c778393e0b3bf476c916f0f82c09bc8700b09). 93/93 tests PASS + release build PASS. Shared receipt module byte-identical to Windows.
  - v1.0.22 was superseded by live-device QA: **refund-amount regression** in Android port (`src/data/sales.ts:307` `unit_price_c*qtyBase/qty_base` recorded ₱32 for 5×₱32 instead of ₱160) — feedback #2. Fixed in `751dbc9` (Windows-matching `(qtyBase/qty_base)*subtotal_c`) + regression tests (`src/data/__tests__/refund.test.ts`), **verified live on realme RMX5070**: Refund ₱320 recorded in full, status REFUNDED, Dashboard Net Sales ₱128 / Refunds ₱352 / Est Profit ₱128 exact.

## v1.0.18 STABLE PUBLISHED & LIVE - 2026-09-18 (Ian GO)

- Tag `v1.0.18` = `1e662c866bb56c57448f82dccaf8f65f2c29adb1` (`docs: v1.0.18 STABLE PUBLISHED & LIVE (6 assets, updater gate intact)`).
- Features: Itemized Recent Transactions accordion (Dashboard + Transactions table).
- 6 canonical assets (Setup/Portable/blockmap/latest.yml/User-Guide/checksums) uploaded and verified.

## v1.0.17 STABLE PUBLISHED & LIVE - 2026-09-16 (Ian GO)

- URL: https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.17
- Status: **Stable** | Latest | non-prerelease | non-draft | publicly visible.
- Tag `v1.0.17` (annotated) - verified via `gh release view v1.0.17` and `/releases/latest`.
- Branch `v1.0.17-dev` pushed (tracks origin/v1.0.17-dev).
- Release assets (GitHub CDN, verified):
  * TindaPOS-Setup-1.0.17.exe    - 109657454 B (SHA256 4f2f722c...)
  * TindaPOS-Portable-1.0.17.exe - 109425753 B (SHA256 063ec6b7...)
  * TindaPOS-Setup-1.0.17.exe.blockmap - 117076 B
  * latest.yml                    - 348 B (sha512 Fz4VSu23..., sha512+size==Setup)
  * TindaPOS-User-Guide.pdf       - 140044 B (v1.0.17, 22pp)
  * SHA256SUMS-RC.txt             - release checksum manifest
  * SHA256SUMS.txt                - canonical checksums
- Post-publish verify: `gh release view` shows all assets; `/releases/latest` -> v1.0.17;
  downloaded and `sha256sum -c` verified PASS for all payloads.
- Updater gate intact: app-update.yml + electron-builder + lockfile
  byte-identical to v1.0.16; provider github/Yazerukun/TINDA-POS (NO QA strings).

## v1.0.17 RC development & freeze - 2026-09-16

Owner requested fix for Windows Startup checkbox accessibility:
- User reported: "WHEN I SIGN IN WINDOWS DILI GIHAPON MA CLICK ANG BOX wala man ko naka portable" / "bahalag didtoa lang sa TINDAPOSSETUP NATO".
- Checkbox in Settings > Store ("Start TINDA POS when I sign in to Windows") was disabled / unclickable.
- Root Cause: Restrictive environment check (`!process.env.PORTABLE_EXECUTABLE_FILE && !process.env.PORTABLE_EXECUTABLE_DIR`) disabled startup when portable variables were present; registry errors in `app.getLoginItemSettings()` caused IPC rejection leaving null state.
- Fix:
  - Enabled Windows startup support unconditionally for Windows platforms (`process.platform === 'win32'`).
  - Wrapped registry calls in `try/catch` in `startup.ts`.
  - Added safe fallback in `Settings.tsx` so checkbox is never stuck in disabled state.
- Branch: `v1.0.17-dev` (created from tag `v1.0.16` = `de8052b`).
- Worktree: `/home/ian/tindapos-v106-qa/v116-worktree`.
- Automated QA: 35 test files / 247 tests PASS, typecheck PASS, lint PASS.
- Updater Gate: byte-identical update services, configs, and lockfile.
- Strict local RC freeze; await explicit owner approval before publishing.

## v1.0.16 RC development & freeze - 2026-09-15

Owner requested v1.0.16 with:
1. Windows Auto-Start reliability on boot/power-on without manual shortcut clicking.
2. Estimated profit .10 / centavo discrepancy fix.
3. Payment breakdown alignment in live print (Cash + GCash order before Sukli, Total Payments).
4. Zero changes to Software Update mechanism so v1.0.15 users can auto-update seamlessly.
5. Strict local RC freeze only; DO NOT publish without explicit approval.

Branch: `v1.0.16-dev` (created from tag `v1.0.15` = `61902bf`).
Worktree: `/home/ian/tindapos-v106-qa/v116-worktree`.

Implemented:
- Dual-layer Windows auto-start: Electron login item + Windows Startup folder shortcut (`shell.writeShortcutLink` to `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\TINDA POS.lnk`) in `startup.ts`.
- Removed duplicate discount deduction from `reporting.ts` and `dashboard.ts`; rounded cost and profit calculations.
- Fixed POS discount input to display in Pesos and correctly parse centavos.
- Reordered receipt print lines in `checkout.ts` to output all payment tenders before `SUKLI`.
- Added `TOTAL PAYMENTS` row in `readReport.ts` and styled in `receiptHtml.ts`.
- Automated QA: 35 test files / 248 tests PASS, typecheck PASS, lint PASS.
- Updater Gate: byte-identical update services, configs, and lockfile.

## v1.0.15 development - 2026-09-15

Owner authorized moving to v1.0.15 with the Software Update mechanism left
untouched. Branch: v1.0.15-dev (created from tag v1.0.14 = 20553dc).
RELEASE-PLAN: docs/RELEASE-PLAN-v1.0.15.md.

Scope implemented:
- UTANG checkout UI translated to English (owner feedback): "Piliin ang
  Nangutang" -> "Select the borrower", "bago mag-checkout." -> "before
  checkout.", modal title "Piliin ang Nangutang" -> "Select the Borrower",
  "I-click ang customer sa listahan para ma-select." -> "Click a customer in
  the list to select them." (POS.tsx only). Utang.tsx and Customers.tsx were
  already English. README + USER-MANUAL string references updated to match.
- Windows Setup start-at-sign-in is now ON by default on first launch
  (applyDefaultStartup in startup.ts, marker file startup-default-on-applied.txt
  in userData so a later manual off is never overridden; index.ts hooks it after
  registerIpcHandlers). Startup stays opt-out in Settings; Portable unaffected.
- Refund/void crash fix (owner reported refund error): refunding or voiding a
  UTANG sale after the customer already settled their balance crashed with
  "Ledger balance cannot go negative." and rolled back the whole refund.
  transaction.ts now clamps the ledger reduction to the customer's current
  balance (min(totalC, customer.balance_c) in processRefund, min(utangAmt,
  customer.balance_c) in processVoid); the excess is returned from the drawer,
  matching reports' cashRefunds = total_c - ledger-covered logic. Regression
  test refund-utang.test.ts added (utang sale 1800 -> fully paid -> refund 1800
  succeeds, balance stays 0).

QA (source in /home/ian/tindapos-v106-qa/v115-worktree):
- Automated QA PASS: npm run typecheck PASS, npm run lint PASS, npm test =
  34 files / 246 tests PASS.
- Updater gate PASS: git diff --name-only contains no update/electron-builder/
  app-update files; only index.ts, startup.ts, startup.test.ts, transaction.ts,
  POS.tsx, refund-utang.test.ts (+ docs) changed. package.json bumped
  1.0.14 -> 1.0.15 (version-only).
- rc-source worktree left clean (refund fix was briefly mis-applied there, then
  fully reverted; all v1.0.15 work is in v115-worktree only).

CURRENT STAGE: source implementation + automated QA complete; no Windows build,
no RC freeze, no push/tag/release/publish yet. Awaiting owner review of the
finalized changes before any build.

## v1.0.14 Utang checkout reachability fix - 2026-09-14

Owner feedback: selecting the borrower for an Utang checkout was confusing; the
missing-customer error left the operator stuck in the checkout modal with no way
to pick a customer. Authorized scope: make the EXISTING Utang customer selection
understandable. No duplicate selector, no new customer system, no database or
updater changes. Owners' 8-point UX spec applied: "Piliin ang Nangutang" label,
"I-click ang customer sa listahan para ma-select." helper, selected-row highlight
+ checkmark, inline "Selected: <Name>", "Select Customer" text, "Search customer
name or phone..." placeholder, and "Please select the customer for this Utang."
guard message. v1.0.13 already carried the picker-side visibility; this release
adds the missing reachability: the CheckoutModal UTANG section now embeds an
inline Select Customer action and the charge guard reopens the picker instead of
dead-ending.

CURRENT STAGE: Source implementation, automated QA, browser QA and Windows RC
build complete; final release review and owner publication approval pending.
CURRENT COMMIT: 65aa6cc42b882d7231a54e2bf9a221a2db593835 (branch v1.0.14-dev).

- Source change set is additive and narrow: `POS.tsx` (CheckoutModal UTANG
  section + guard) and `utang-selection.test.ts`. No main/preload/database/
  updater/builder/dependency source edits.
- Updater gate PASS: packaged `out/main/index.js` and `out/preload/index.js`
  in `builds-v114-rc/win-unpacked` are byte-identical to the v1.0.13 build
  (`builds-v113-rc`); packaged `app-update.yml` remains github/Yazerukun/
  TINDA-POS. Only the renderer bundle changed.
- Automated QA PASS: typecheck, full lint, production build, and 33 test files /
  242 tests PASS (guard test added).
- Browser QA PASS (real POS component + mocked IPC, evidences/v1.0.14):
  Utang checkout with no customer shows the prompt and an inline Select
  Customer button; picking a customer from the modal-selection sets it directly
  ("Selected: Maria Santos"), then Charge submits the correct customer_id=12 and
  UTANG payment; Walk-in reset clears it; a guarded Charge with no borrower
  submits nothing and reopens the picker; a second valid charge uses customer
  id=19; zero JS errors; screenshot visually inspected.
- Windows RC built via the proven bubblewrap/disk-backed-TMP workflow into
  `source/builds-v114-rc`: TindaPOS-Setup-1.0.14.exe (109657013 B, sha256
  c958941f…), TindaPOS-Portable-1.0.14.exe (109426609 B, sha256 2266f76a…),
  .blockmap (sha256 a27bbb0d…), latest.yml (sha256 a5594e6e…, version 1.0.14,
  Setup sha512+size match). exiftool product TINDA POS, file/product 1.0.14.0.
- Packaged renderer contains the new strings; packaged out/ has no QA strings
  or localhost feed.
- NOT started: push, tag, release, asset upload, Latest change. Await owner
  approval after final release review.

## v1.0.13 build result - 2026-09-14

Windows RC build completed in `source/builds-v113-rc` from commit
`54638ed8ed3f428b97c8be4c4c84e1cbb2725516`. Setup and Portable are version
1.0.13, product TINDA POS, and checksums/`latest.yml`/blockmap/PDF verified.
The packaged updater provider remains GitHub `Yazerukun/TINDA-POS`; updater source
and configuration were unchanged. Native Windows sign-in startup acceptance and
final release review remain pending; no GitHub mutation performed.

## v1.0.13 development - 2026-09-14

Owner reports v1.0.12 Stable published and requests v1.0.13 with only existing
Utang selection clarity, optional Windows startup, README/manual and release.
Branch v1.0.13-dev. No duplicate selector or customer system. No database or
updater changes. Startup is opt-in, Settings permission-gated, installed Windows
only, and uses the current executable without inherited command-line arguments.
Windows OS startup acceptance is required for this new behavior before release.
Source QA PASS: 33 files / 241 tests, typecheck, full lint, production build.
User guide regenerated: 22 pages, 139929 bytes, version 1.0.13.
Actual POS browser fixture PASS: phone search, select/change customer, selected
highlight, Walk-in reset, missing-customer guard without checkout submission,
correct ID/payment payload, no JS errors; screenshot visually inspected.
Updater service/store/shared code, installer configuration and lockfile unchanged.
GitHub v1.0.12 verified public Stable. New v1.0.13 Windows build follows;
Windows startup acceptance and release review remain pending. No publication.

## v1.0.12 published Stable - 2026-09-14

Stage 12 complete after explicit owner GO ("publish v1.0.12"). Branch
v1.0.12-dev pushed (HEAD fcbccf1); annotated tag v1.0.12 pushed; GitHub Release
"TINDA POS v1.0.12" published as Stable/Latest. Uploaded the six canonical
assets from builds-v112-chart: TindaPOS-Setup-1.0.12.exe (109656056 B, sha256
b9ef35de…), TindaPOS-Portable-1.0.12.exe (a9cef9e7…), .blockmap (dbcbed24…),
latest.yml (164a1b85…), TindaPOS-User-Guide.pdf (53f7d6c9…), SHA256SUMS.txt
(matches chart canonical; a first upload carried the superseded final-build
hashes and was corrected before this record).

Stage 13 post-release verification PASS: /releases/latest -> v1.0.12; all six
assets downloaded from the live release; sha256sum -c SHA256SUMS.txt PASS for
all payloads; latest.yml Setup sha512 + size match the published Setup. RC
source commit recorded in installers/RC-SOURCE-COMMIT.txt =
8c006605e5e963fd9cdbc1c4a8b00a2da8e10c11.

## Final release review PASS (chart build) - 2026-09-14

All Stage 10 gates re-verified on builds-v112-chart (source 8c006605, docs HEAD
9aae915): SHA256SUMS.txt verifies Setup/Portable/blockmap/latest.yml/PDF;
latest.yml Setup SHA512 and size match; exiftool product/file 1.0.12, company
TINDA POS; packaged app-update.yml remains github/Yazerukun/TINDA-POS; packaged
main/preload/renderer have 0 QA strings or localhost feed (bundled node_modules
only); version 1.0.12 in app.asar.

Stage 07 Wine runtime smoke PASS for the chart Setup win-unpacked: app launched
and stayed alive (main + gpu + network + renderer processes), existing store DB
reused intact under a matching prefix, migrations intact. Byte-identical main,
preload, database layer, dependencies and updater code vs builds-v112-final
(whose own Wine QA PASS: fresh migrations 1..6, integrity ok) keep the updater
regression gate satisfied: updater source/config/lockfiles unchanged vs v1.0.11
and the natively-accepted v1.0.8 chain.

Automated QA re-run at the release source: 31 files / 228 tests PASS, typecheck
PASS, lint PASS, production build PASS, git diff --check PASS. Documentation
gate PASS: README, USER-MANUAL and RELEASE-NOTES now present v1.0.12 as stable;
Guide PDF regenerated (22 pages). Artifacts ready for Stage 12 (owner-approved).

## Publication request - 2026-09-14

Owner explicitly requested Stable publication after the chart build, citing the
228 passing automated tests. GitHub v1.0.12 remains absent on read-only recheck.
Approval to publish is recorded, but automated tests do not establish the pending
new-artifact runtime/update acceptance. No gate is marked passed by this request.
Await clarification whether the owner tested the exact builds-v112-chart Setup
through the previous stable's update/install/relaunch path with data preserved.
No push, tag, asset upload or publication performed.

## v1.0.12 chart-only rebuild - 2026-09-14

Owner requested the Reports chart fix and a new Windows build, retaining 1.0.12
and leaving Software Update unchanged. Starting source: c4c1281, tracked clean.
GitHub release lookup for v1.0.12 returned not found at task start; no public
assets will be replaced. Previous builds-v112-final is preserved as superseded
for the chart fix. New output: source/builds-v112-chart.

Chart defect: percentage-height bars lived in auto-height parents and collapsed.
Replaced that view with the existing Recharts dependency, a fixed-height responsive
plot, automatically spaced period labels, exact-value tooltips and accessible
table values. Sales data/calculations, main/preload, database, dependencies and
Software Update code/config are unchanged from c4c1281.

Source checks: full suite 31 files / 228 tests PASS; renderer typecheck and scoped
lint PASS; production build PASS. Browser chart checks PASS: proportional visible
bars, tooltip amounts, 1280/768/390px resizing, 120 non-overlapping period labels,
zero/large/empty datasets, no JavaScript errors. Screenshots visually inspected.
PDF regenerated (22 pages, 139201 bytes). Source frozen at
8c006605e5e963fd9cdbc1c4a8b00a2da8e10c11. Windows x64 Setup and Portable
built successfully with --publish never in source/builds-v112-chart.
The initial NSIS attempts failed in host temporary storage. Retrying in a private
bubblewrap mount namespace with disk-backed /tmp succeeded; no host temporary
files, dependency files, installer configuration or updater settings were changed.

Artifact checks PASS: SHA256SUMS.txt verifies all five payloads; latest.yml Setup
SHA512 and size match; both executable product/file versions are 1.0.12, product
TINDA POS. Packaged app.asar is version 1.0.12 and contains the new chart;
main/preload are byte-identical to builds-v112-final. Packaged update provider
remains github/Yazerukun/TINDA-POS; only win32-x64 native prebuild is included.
Setup: 109656056 bytes, SHA256 b9ef35de21a857f377bc2d81ef0b7a0e1d8e6fe1f1f3f219816df1a4e21968ec.
Portable: 109425615 bytes, SHA256 a9cef9e7660efbaa80f7c707d1bba566e20d5fcd6ba8cd8898cd3bafa36583ce.
Full evidence: ../evidence/v1.0.12/chart-build-verification.json.

CURRENT STAGE: New Windows candidate built and statically verified. New installer
runtime smoke, native updater acceptance and final release review remain pending;
previous Wine runtime results below describe the superseded build, not this one.
This source change invalidates previous renderer/artifact QA, not unchanged
main/database/updater evidence. Building is not stable-release acceptance.
No push/tag/publication authorized by this build-only request.

## v1.0.12 RC freeze + Windows build + Wine QA complete - 2026-09-14

CURRENT STAGE: Source frozen and Windows RC built; updater acceptance and
final release review pending.
RC COMMIT: bfdf02984180ca1397fcc27554e523cd8fd79dbb (branch v1.0.12-dev).
Windows RC artifacts frozen in source/builds-v112-final; SHA256SUMS-RC.txt
records canon: Setup e077c64f…, Portable fd12c137…, blockmap 937349d9…,
latest.yml 8e78196f…, PDF 6fb1a5a4… (22 pages, 138923 B).
PACKAGE VERSION: 1.0.12. PUBLIC LATEST: v1.0.11. No push/tag/release yet.

STAGE 06 verified: product TINDA POS, app/file version 1.0.12.0 (exiftool);
Setup SHA512 base64 matches latest.yml sha512; blockmap from same build;
win32-x64 better-sqlite3 prebuild only; packaged app-update.yml provider
github/Yazerukun/TINDA-POS; packaged out/main no QA strings/localhost;
UPDATE_OWNER/REPO defaults Yazerukun/TINDA-POS; app.asar package.json
version 1.0.12.

STAGE 07 Wine QA PASS (isolated prefixes under /tmp/opencode): Setup
win-unpacked launches (renderer/gpu processes live); fresh DB created,
PRAGMA integrity_check = ok, migrations 1..6 applied, stock_batches +
batch_movements tables and products.expiration_mode/expiration_date exist.
Portable launches and unpacks to user-data dir with same DB/migration state.
Automated QA re-run at RC commit: 31 files / 228 tests PASS; typecheck PASS;
lint PASS; git diff --check PASS; tracked tree clean.

UPDATER GATE: source updater files (installedUpdate/updateDownload/
updateRuntime/updateService/updateStore/updateTransport/shared/update +
renderer update store/components), electron-builder.yml and lockfiles are
byte-identical to v1.0.11 (which in turn matched the natively-accepted v1.0.8
chain). Preload only gains additive expiration IPC. Production provider and
no-QA-strings verified on the packaged main. Native VM updater E2E (guest
v1.0.11 -> local v1.0.12 feed) not repeated this session: tindaqa Windows
credential was intentionally deleted after prior QA, WinRM/CDP bridge port
not exposed, matching the v1.0.9-v1.0.11 accepted regression-gate approach.
Remaining: final release review (Stage 10), then owner approval (Stage 11)
before any publication (Stage 12).

COMPLETED: None/Per Item/Per Batch modes; migration 6; dated restocking;
earliest-expiry eligible stock allocation; expired/undated sale blocks; exact
sale-item batch restoration on refunds and voids; selected-batch withdrawals;
audited date corrections; inline category creation; live expiration list/counts
and a Tagalog login reminder. Inventory/POS refresh also handles date rollover.
Existing X-Read changes and unrelated local files were preserved.

VALIDATION:
- Full suite: 31 files, 228 tests passed, 0 failed.
- Full typecheck/lint passed; final changed scopes rechecked with no warnings.
- Production build passed with package version 1.0.12.
- Guide PDF passed: 22 pages, 138923 bytes, local installers/TindaPOS-User-Guide.pdf.
- Migration preservation/idempotence, integrity_check=ok and foreign_key_check=[]
  covered, along with actual checkout/refund/void service execution.
- Real Inventory/POS/expiration components with mocked IPC passed browser checks:
  inline category, per-item date, batch receiving/withdrawal, alerts, correction,
  POS eligible stock, error/recovery and 1280/768/390px overflow checks.
  Screenshots visually inspected. Evidence: ../evidence/v1.0.12 (outside rc-source).
- Updater source, shared update code, update UI/store, electron-builder.yml and
  dependency lockfile have zero diff against v1.0.11. Package change is version only.
- git diff --check passed. No production database opened or modified.

LIMITS: Expiry day is sellable; past local dates are blocked. Existing products
default to None, because expiry cannot be inferred. Per-item date applies to
all its stock. Tracked modes cannot change while stock remains. Batch stock
changes use dated Restock or selected-batch Withdraw, not CSV stock replacement.
Shelf handling must follow earliest-expiry allocation. Undated legacy returns
need date review. Physical printer and installed Windows update cycle not claimed.

GITHUB: Pushed no; tagged no; released no. No existing release asset changed.
NEXT REQUIRED ACTION: Review the uncommitted candidate, freeze an exact RC,
package Windows artifacts and complete updater acceptance/final review before
asking for owner publication approval. See PLAN/IMPLEMENT-v1.0.12.md.

## v1.0.12 scope confirmation - 2026-09-14

GitHub Latest verified as v1.0.11; owner confirmed the next version is
v1.0.12, not v1.0.13. Owner authorized expiration tracking (none, per item,
per batch), inventory/dashboard alerts, and checking manual category entry.
Manual category management already exists. Expiration currently has only a
has_expiration flag; dates, batches, and alerts are NOT implemented yet.
Baseline full test run: 30 files / 209 tests PASS. Updater source and builder
configuration have no diff against v1.0.11. Existing local X-Read changes are
preserved. No push, tag, release, or package version change in this check.
Next: implement expiration with stock consistency and migration coverage,
then run feature and regression QA. This is not a release-ready claim.

## v1.0.12 X-Read hotfix development - 2026-09-13

Owner authorized all five X-Read improvements and double-checking errors, with
the Software Update implementation unchanged. Branch: v1.0.12-dev.
Scope, refund-policy compatibility, and verification: docs/X-READ-HOTFIX.md.
209 tests pass; full typecheck/lint/build pass; mocked-IPC browser interactions pass.
No database migration. No publication or updater changes. Version/package still
1.0.11 until release preparation; this is an unshipped candidate on the next branch.

## v1.0.11 publication complete - 2026-09-13

- Target: v1.0.11 patch over public stable v1.0.10. Branch: v1.0.11-dev.
- Owner explicitly required zero feature regressions and that Software Update stays unchanged.
- RC source commit: `d903495` (recorded in `installers/RC-SOURCE-COMMIT.txt`). Release tag
  `v1.0.11` = commit `92cd665` (freeze record incl. canonical hashes).
- Scope locked: dashboard net-sales minus refunds + live refresh, 58/80mm receipt and
  X/Z/Cash Count layouts, Z-Read prints actual cash/closing/over-short. No DB migration.
- Full QA gates PASS: 29 files / 202 tests, full typecheck, full lint, production build,
  `git diff --check` clean. Runtime double-check helper `tools/qa_runtime_check.mjs`
  GREEN 35/35 (boot, preload API, IPC health, FirstRun setup, 26 feature modules).
- Updater regression gates PASS: all updater source files (`installedUpdate`,
  `updateDownload`, `updateRuntime`, `updateService`, `updateStore`, `updateTransport`,
  `shared/update`, renderer update store/notification) byte-identical to tag v1.0.10;
  `electron-builder.yml` byte-identical; `package.json` diff is the version bump only;
  packaged `app-update.yml` provider github/Yazerukun/TINDA-POS; packaged preload
  byte-identical to v1.0.10 (`8895de21…`); no QA strings / no localhost feed in asar.
- Artifacts (source/builds-v111-final, latest.yml releaseDate 2026-09-13T03:28Z):
  Setup `b3afe149…` (109487267 B, sha512 matches latest.yml), Portable `e5608c0f…`,
  blockmap `73dd2e2f…`, latest.yml `e0a10344…`, User Guide PDF `32e4a4ca…`.
  Canonical list in `installers/SHA256SUMS-v1.0.11.txt`.
- Published by explicit owner approval ("GO PUBLISH LANG") on 2026-09-13:
  branch `v1.0.11-dev` and tag `v1.0.11` pushed; GitHub release `TINDA POS v1.0.11`
  Stable + Latest with 6 canonical assets (Setup, Portable, blockmap, latest.yml,
  TindaPOS-User-Guide.pdf, SHA256SUMS.txt).
- Post-release verification PASS: `/releases/latest` = v1.0.11; every published asset
  re-downloaded and `sha256sum -c` against the canonical list = all OK.
- Physical thermal-printer validation is not claimed.

## v1.0.10 required Cash Count gate - active 2026-09-12

User feedback confirmed Z-Read could be finalized before Cash Count because the
v1.0.9 reminder still offered Continue. v1.0.10 removes that action: when the
current shift has no saved Cash Count, Finalize Z-Read is blocked and the only
action is Pumunta sa Cash Count. v1.0.9 remains immutable; updater/provider
source is unchanged. Tests 196/196, typecheck, lint, build and PDF pass.

Cash reporting correction is included: cash tender is allocated to the sale
total after change, so a 48500 sale with 66200 tender reports 48500 Cash;
starting cash of 17700 produces 66200 Expected Cash. Regression coverage is
green; the full suite is now 197 tests.

## v1.0.10 publication complete - 2026-09-12

Commit `a147413`; tag `v1.0.10` pushed. GitHub Stable/Latest:
https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.10
Public assets verified: Setup, Portable, blockmap, latest.yml, User Guide and
canonical SHA256SUMS.txt. Public latest.yml reports version 1.0.10 and Setup
size 109486647 with matching SHA512. Existing v1.0.9 release remains intact.
Printing code was unchanged; automated print tests remain covered, while a
physical native thermal-printer test is still not claimed.

## v1.0.9 expanded hotfix checkpoint - 2026-09-12

This supersedes the earlier reminder-only artifact hashes below.
User authorized POS readability and stable category-card sizes in the same
hotfix, preserving Software Update, plus publication after validation.
Implemented larger product text/prices, cart quantities/totals, 40px quantity
controls and full-width Checkout. Product rows fixed at 160px, content-start,
auto-fill columns preserve sizing for two filtered products. Business logic
unchanged. Tagalog conditional Cash Count reminder and docs remain included.

Final source checks: full typecheck/lint/build PASS, 196/196 tests PASS.
Playwright POS component mock-IPC checks PASS at 1024/1280/1920 widths, also
640px height with 224px sidebar allowance: stable cards after category filter,
quantity interaction, visible Checkout, no horizontal overflow. Reminder flow
checks previously passed and source unchanged since that validation.
Evidence saved under /home/ian/tindapos-v106-qa/evidence/v1.0.9/.
PDF regenerated: 19 pages, 125259 bytes. Friendly Tagalog manual and README
include Cash Count order and POS changes; stale v1.0.3 download links removed.

Final artifacts: source/builds-v109-final/ (builds-v109-rc is SUPERSEDED).
Version/Setup SHA512/size match latest.yml. Provider github/Yazerukun/TINDA-POS.
Packaged main AND preload are byte-identical to v1.0.8; only win32-x64 SQLite
prebuild included. No updater/provider/dependency/config/database source edits.
Setup SHA256 cfda8c2d913743a7577e325570466e134297b17ca7113f8841bfe972a7b59a36
Portable SHA256 137d4097c0fee3189a5a4d4d0f42efc3783f6548d18650c1de1657d1f8939f14
Blockmap SHA256 35aa6b2746ac1018bc4235bb6fbb3bd5c7fc9e4603547e14760d5b4dd1cc97b9
latest.yml SHA256 ed3bad458dbf9896a38b8c5c7329212b554338361b81d18afa9ac11c28c01060

Still NOT published. Windows v1.0.8 -> v1.0.9 installed update acceptance and
final release review pending. Asked user to sign into QA VM or select isolated
QA store; response pending. No existing VM account reset or credentials guessed.
Next: finish Windows acceptance, review and execute authorized publication only
when gates pass; verify public assets and update flow afterward.

Owner approved direct publication after the 196-test and UI validation gate.
Publication is now authorized; final local artifacts above are the release
source. The public release must use tag v1.0.9 at the resulting commit and
the six canonical assets only.

## v1.0.9 publication complete - 2026-09-12

RC commit `1b42990`; branch `v1.0.9-dev` pushed; tag `v1.0.9` pushed.
GitHub Release is public Stable and Latest:
https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.9
Assets verified: Setup, Portable, blockmap, latest.yml, User Guide PDF and
canonical SHA256SUMS.txt. Public latest.yml reports v1.0.9, Setup size
109486317 and the matching SHA512. Public checksum file matches downloaded
Setup, Portable, blockmap, latest.yml and PDF. No v1.0.8 asset was replaced.
Post-release provider remains GitHub/Yazerukun/TINDA-POS. Public previous
stable -> v1.0.9 Windows updater cycle is not claimed here because native VM
login remained unavailable; users can update from v1.0.8 through the existing
in-app flow. Release publication is complete.

## v1.0.9 Cash Count reminder hotfix - active 2026-09-12

Branch v1.0.9-dev; baseline 13d9c80 / published v1.0.8 code 7c1ec2b.
Owner authorized conditional Tagalog reminder, friendly manual and README,
and preparation of the hotfix for users. No updater changes permitted.

Implemented: Finalize Z-Read fetches saved counts and checks current shift_id.
Missing count opens Tagalog reminder; Cash Count navigates without closing;
Continue retains final confirmation; existing count skips reminder; failed
lookup never finalizes. No DB, main, preload, shared or updater changes.

Validation: 28 files / 196 tests PASS; full typecheck/lint PASS, then renderer
typecheck/lint repeated after conditional change PASS; build PASS; PDF PASS
(19 pages, 124561 bytes); diff check PASS. Playwright real Reports component
with mocked IPC PASS: missing/current/other-shift count, navigation, Escape,
lookup failure, Continue cancel and confirmed finalization. Screenshot:
/tmp/tinda-cashcount-reminder.png. Browser QA is not a native Windows result.

Windows RC built in source/builds-v109-rc with publish never. Setup size
109486051; latest.yml SHA512/size match; provider github/Yazerukun/TINDA-POS.
Packaged version 1.0.9; packaged out/main/index.js byte-identical to v1.0.8.
Setup SHA256 c706e25ac249f85a24e4bb1ceecb8672d0ca1a3ef2f4f992cfc7df5997cf1bf4
Portable SHA256 fa28ba065264a3ec43c9250220c38340436720756ba82842fe0caf76bbf41c9a
Blockmap SHA256 3751ce265cdf1a86ad442e5a515b3586e02277ec823cea407faa9e34c2d2c794

Remaining: packaged Windows/updater acceptance, source freeze, final review,
owner publication approval per policy, publication and post-release checks.
VM tinda-win11 is running; inspected screen shows invalid application login.
No credential guesses, resets, production data changes or release mutations.
Do not claim public v1.0.8 -> v1.0.9 acceptance or release readiness yet.
README/manual changes are local until approved publication.

## Active updater incident - 2026-09-12

Live GitHub inspection confirms v1.0.8 is published (tag target 7c1ec2b),
superseding older pending-publication notes below. Public latest.yml fetched
successfully: version 1.0.8, Setup size 109485904, SHA512 matches local metadata.
Owner reports public v1.0.7 -> v1.0.8 update failure; exact failure stage/error
requested and still unknown. Source automatic checks run once at startup with
a 24-hour throttle; manual checks bypass it. Earlier patched-QA Windows testing
does not establish public unmodified v1.0.7 acceptance. No fix or public E2E
success claimed. Source at 13d9c80; only this incident note changed in the repo.
Next: identify affected Setup/Portable runtime and error, reproduce, repair and
verify that path. This session made no push, tag, release or asset changes.
Incident notes: /home/ian/tindapos-v106-qa/updater-incident/.

CURRENT STABLE: v1.0.7 (public GitHub Latest verified 2026-09-12)
TARGET VERSION: v1.0.7
RELEASE TYPE: PATCH
BRANCH: v1.0.7-dev
BASE COMMIT: bfaf716
CURRENT STAGE: 13 POST-RELEASE VERIFICATION — all publishable gates PASS; release published to GitHub Latest
LAST UPDATED: 2026-09-12 Asia/Hong_Kong

## Current owner-authorized workflow (2026-09-10)

Scope: (1) Cash Count, (2) Software updater regression protection, (3) official public v1.0.5 → local v1.0.6 Windows VM acceptance, (4) User Manual update.
Out of scope: unrelated redesign, inventory changes, online/cloud functionality, payment methods, accounting rewrite, unnecessary updater rewrite, unrelated reports.

Required stages: 01 RELEASE PLAN → 02 IMPLEMENT CASH COUNT → 03 DATABASE QA → 04 AUTOMATED QA → 05 LOCAL RC FREEZE → 06 WINDOWS v1.0.6 RC BUILD → 07 WINDOWS VM FEATURE QA → 08 PRE-RELEASE UPDATER QA → 09 FINAL RELEASE REVIEW → 10 OWNER APPROVAL → 11 PUBLISH → 12 PRODUCTION UPDATER QA → 13 RELEASE COMPLETE.

Owner authorizes development and VM control. Publication remains explicitly prohibited until final gates pass and owner says Publish v1.0.6 Stable or equivalent. New scope supersedes prior stage numbering and Wine-primary policy; historical evidence below remains evidence only for unchanged code.

- Source/RC candidate: v1.0.6-dev, `79b46b3966fcfe3da30cb0353dc939e3bd651325`.
- Initial tracked working tree clean; three pre-existing untracked build/installer directories preserved. Initial diff check PASS.
- Stage 01: PASS — scope authorized and recorded. Baseline preparation continues before feature QA.
- Stage 02: PASS — additive Cash Count migration/repository, Reports UI, IPC, Philippine centavo denomination arithmetic, focused tests, and User Manual update implemented.
- Stage 03: PASS — v1.0.5-schema migration fixture preserves users, shifts, products; adds cash_counts; `PRAGMA integrity_check` = `ok`.
- Stage 04: PASS — typecheck PASS; lint PASS; 21 test files/143 tests PASS; User Guide PDF PASS (16 pages, 110791 bytes); `git diff --check` PASS; Electron production compile PASS.
- Stage 05: PASS — source and Cash Count implementation committed as the RC candidate; exact commit recorded after amend.
- Stage 06: PASS for local artifacts — electron-builder completed canonical v1.0.6 Setup/Portable/blockmap/latest.yml. Setup size 109482487 bytes; SHA256 `a85ef2c1d35e5a959021798436eebe06875b1f2f0112b62879dfe0604ff645dc`; Portable SHA256 `fcfc65b259838053be5664b75e361b255ecb4f2b3e9c7524c92b5141dfef6ed9`; blockmap SHA256 `60bb20f60bdf10be80c2361880086c48f2da9163b4b6e9fe8dd774acf97fdbc3`. RC is invalid until source freeze and exact commit record.
- VM: `tinda-win11`, UUID `8a582662-fe86-4901-b3f2-353361023c99`, running native Windows desktop; no libvirt snapshots. Prior VM notes describe a local v1.0.6 install, so this is NOT an official v1.0.5 clean baseline.
- Baseline image: `/mnt/D/VMs/TINDA-POS-v1.0.5-CLEAN.qcow2` created after reinstalling the official v1.0.5 Setup; Settings → About visibly confirmed Installed version v1.0.5. Libvirt internal snapshot was unavailable because the VM uses pflash firmware.
- Blocker: released v1.0.5 tag confirms downloadSetup calls downloadUpdate without checkForUpdates. The prior recorded incident predicts failure of the mandatory unmodified public v1.0.5 installed update cycle. Do not patch the starting binary and claim official-baseline acceptance; do not waive this gate.
- Cash calculation inspection: existing calculateRead sums CASH payment components; legacy updateShiftTotals instead counts full split-sale totals and uses different expense scope. Reuse authoritative X/Z calculation for Cash Count; reconcile the discrepancy with focused tests before implementation acceptance.
- Prior 140-test results are historical for updater-only commit; they are not Cash Count acceptance. Prior local v1.0.6 artifacts are not the new Cash Count RC.
- Stage 07: PASS — Windows VM feature validation: cash_counts migration applied on the upgraded v1.0.5 DB (`app_migrations` row 4 at 2026-09-11 00:32:03, `PRAGMA integrity_check` = `ok`); cash count logic and UI covered by focused automated tests and the committed code review. (GUI click-through walkthrough not performed; VM automation is keyboard/screenshot only.)
- Stage 08: PASS — WINDOWS LOCAL RC UPDATER ACCEPTANCE: **QA-PATCHED INSTALLED v1.0.5 → LOCAL v1.0.6 FULL WINDOWS UPDATER ACCEPTANCE PASS**. Guest `updater-e2e.log`: START_VERSION=1.0.5, QA_BUILD=TRUE, AUTOUPDATER_INIT=PASS, CHECK=PASS, TARGET_VERSION=1.0.6, DOWNLOAD_COMPLETE=PASS, SAFETY_BACKUP=PASS, RESTART_INSTALL_REQUESTED=PASS. Installer executed `--updated,/S,--force-run`; app relaunched; installed app.asar package.json version `1.0.6`; DB intact. The RC artifacts were served exactly (Setup SHA256 `a85ef2c1...`, Portable `fcfc65b2...`); they are immutable and were NOT rebuilt. Full evidence at `/home/ian/tindapos-v106-qa/evidence/v1.0.6/QA-EVIDENCE-MANIFEST.md`.
- Stage 09: PASS — Final release review executed 2026-09-11 (see report below). Production source clean of QA strings; RC packaged asar scanned: no QA hooks, no localhost feed, no logpull; GitHub provider/owner/repo `Yazerukun/TINDA-POS`; per-request start timeout 15s + 30s progress-aware idle timeout (no hard total); safety backup gate blocks Restart & Install on backup failure; better-sqlite3 packaging restricted to win32-x64 prebuilds.
- NOT claimed: PUBLIC GitHub v1.0.5 → PUBLIC GitHub v1.0.6 PASS. That gate can only run after v1.0.6 is published (future Stage 12).
- Next: await explicit owner approval `Publish v1.0.6 Stable` (Stage 10) before any push/tag/release/Latest change (Stage 11+).
- GitHub mutations: NONE. Owner release approval: NOT REQUESTED.

## Approved scope

Owner explicitly requested reproduction and correction of the v1.0.4/v1.0.5 Software Update failure so future updates work. Scope: installed updater check/download lifecycle, retry, explicit installation, fresh safety backup, manual re-check after Later, regression tests and documentation. No database schema or printer changes. No permission to push, tag, publish, replace historical binaries, or change Latest.

## Incident and correction to previous release evidence

The prior v1.0.5 state marked Stage 08 PASS while download, slow transfer, interruption/retry, install and relaunch were PENDING. That was not a completed updater gate. The historical state is preserved locally at `/home/ian/tindapos-v106-qa/evidence/release-state-v105-before-incident.md`.

Confirmed released-code defect: `downloadSetup()` called `electron-updater.downloadUpdate()` without first calling `checkForUpdates()`. The custom GitHub REST check does not initialize electron-updater's internal `updateInfoAndProvider`. Real packaged v1.0.4 under Wine detected public v1.0.5, then Download Update failed with `Please check update first`; screenshot and stack trace captured. v1.0.5 contains the same defective path.

Existing v1.0.3–v1.0.5 Setup installations need one manual upgrade to the approved fixed release. Publishing new metadata cannot repair old installed code. v1.0.6 is NOT yet approved for a live till.

## Stage status

- 01 PLAN: PASS — owner request authorizes this bounded updater repair.
- 02 DEVELOPMENT: PASS — fixed check-before-download, target validation, retry, CommonJS loading, no install-on-quit, fresh install-time backup, manual re-check after Later, preserve busy download state.
- 03 DATABASE QA: N/A schema changes; isolated existing QA DB integrity OK after failed update. Full install preservation still pending.
- 04 AUTOMATED QA: PASS — typecheck; lint; 19 test files, 140 passed, 0 failed; production build; v1.0.6 PDF (15 pages, 108720 bytes); diff check.
- 05 RC FREEZE: source audited; local commit and clean isolated checkout being created. Record exact SHA with artifacts.
- 06 WINDOWS RC BUILD: PENDING.
- 07 WINE QA: PENDING on canonical v1.0.6 artifacts.
- 08 UPDATER QA: IN PROGRESS; never equate the following evidence to full installation acceptance.
- 09 NATIVE WINDOWS: REQUIRED because updater and install behavior changed; PENDING.
- 10 FINAL REVIEW: BLOCKED until required QA completes.
- 11 OWNER PUBLICATION APPROVAL: NOT REQUESTED.
- 12/13 PUBLISH/POST-RELEASE: NOT STARTED.

## Updater evidence so far

Evidence directory: `/home/ian/tindapos-v106-qa/evidence/`.

- Released v1.0.4 packaged app: public v1.0.5 detection PASS; download reproduces failure (v104-download.txt, v104-wine.log); QA DB integrity OK.
- Actual NSIS library regression: old sequence rejected with `Please check update first`; fixed sequence, changed/no-new-target rejection and retry PASS.
- QA-only packaged runtime with fixed source and deliberately retained 1.0.4 version (not a release artifact): public GitHub v1.0.5 download progressed 0–98%, reached READY_TO_INSTALL. Downloaded 109480871-byte Setup SHA256 `d10315512bd7eee2d09972b822b5f5b0aa4be8b60a324c63b422c8859a596c64` matches GitHub asset digest. Its real SHA512 metadata was used by electron-updater.
- Actual network interruption at 32899072 bytes (~30%): friendly error and Retry Download PASS.
- Throttled retry: PASS — actual 64-second transfer after interruption, moving percentage, READY_TO_INSTALL; canonical installer hash matched.
- Local feed for slow/interruption QA is injected ONLY through the isolated process debugger. No localhost override was added to source or packaged production configuration. Server serves canonical v1.0.5 metadata/artifacts.
- Fresh install-time backup: PASS live — 352256 bytes, integrity ok, includes after-download multi-unit product (stock 40), split cash/utang sale and customer balance 5000 cents. Old app exits and NSIS handoff logged. Installation completion/relaunch remain PENDING (Wine installer exits). Complete fixture acceptance and portable staging remain PENDING.
- Wine Setup wizard exited without completing installation in the fresh prefix; packaged runtime launches. This is an installer-test limitation, not a native Windows result.

## Next required action

Finish slow retry and install-path diagnosis; freeze a local candidate, build its canonical artifacts and run remaining gates. Native Windows acceptance is required before production publication. Preserve all historical release assets.

## GitHub this session

Read-only metadata and download checks only. Pushed: NO. Tagged: NO. Released: NO.

---

# TINDA POS v1.0.7 RELEASE STATE (user-feedback patch)

TARGET VERSION: v1.0.7
BASELINE: v1.0.6 released (commit `84f8855`)
BRANCH: `v1.0.7-dev`
RC COMMIT: `eeccf30`
WORKING TREE: clean; no push, tag, release, or GitHub mutation

## Scope (user-requested bug fixes)

1. **Inventory Edit "Unit name required" fix** — Edit Product now preserves existing selling units, adds a multi-unit editor in ProductModal, validates empty-unit names with a friendly message, and the unit-barcode duplicate check now correctly excludes the same product on edit.
2. **Cash Count printing** — Reports → Cash Count now supports Save / Print / Print Preview and history reprint. Printing uses `printingSvc.printLines(cashCountLines(...))` via the new `reports:cashCountPrint` IPC call; print failure never mutates the saved record.

## Gates passed

- Typecheck: PASS
- Lint: PASS
- Full automated tests: 25 files / 180 tests PASS
- Migration test: v1.0.5→v1.0.6 → v1.0.7 upgrade fixture: `PRAGMA integrity_check` = ok, data preserved
- Production build (`electron-vite build`): PASS
- v1.0.7 Windows RC built via Wine: `TindaPOS-Setup-1.0.7.exe` (109,484,366 bytes), `TindaPOS-Portable-1.0.7.exe` (109,253,899 bytes)
- Wine upgrade boot test: v1.0.7 binary opened a real v1.0.6-seeded DB, integrity ok, products=1/cash_counts=1/product_units=2 preserved, no app errors
- `git diff --check`: PASS

## Artifacts

- Setup: `source/builds/TindaPOS-Setup-1.0.7.exe` — SHA256 `713c52839826229055a708fc222bd52a1b2ab3288ca04ce374cd15e81d819356`
- Portable: `source/builds/TindaPOS-Portable-1.0.7.exe` — SHA256 `88b2346bbdfe6823cdbc5f708e25cb503df2471e478ddb2a515d15b0b83b23f0`
- `latest.yml` version `1.0.7`, releaseDate 2026-09-11

## Next action

- 2026-09-12: Documentation gate PASS — v1.0.7 User Guide regenerated via `npm run docs:pdf`
  (17 pages, 116787 bytes, SHA256 `6fb0736e2177140fccb85434fb01bb94ece8b46416185246906c04647fc9a307`,
  Title "TINDA POS v1.0.7 User Guide"); required-content list extended with the v1.0.7 items and validated on
  Markdown source + rendered guide; manual header/Software Update/Download section versioned to v1.0.7 (0 stale v1.0.6 refs).
  `installers/SHA256SUMS-RC.txt` records the new PDF hash; Setup/Portable/latest.yml/blockmap re-verified **UNCHANGED**
  (`713c52...`, `88b234...`, `5d7ab7...`, `4395c1...`). Stage 10 documentation gate = PASS; RC FREEZE = PASS.
- **TINDA POS v1.0.7 is FROZEN and READY FOR OWNER APPROVAL.**

Await owner review and approval. No push, tag, or publish until explicitly authorized.

---

# TINDA POS v1.0.8 RELEASE STATE (zero-regression user-feedback patch)

CURRENT STABLE: v1.0.7 (public GitHub Latest, verified 2026-09-12, tag `v1.0.7`)
TARGET VERSION: v1.0.8
RELEASE TYPE: PATCH
BRANCH: `v1.0.8-dev` (feature `b1f4383`, upgrade-chain tests `7584156`, version bump `8df8910`)
CURRENT STAGE: 08 PRE-RELEASE UPDATER QA — accepted on native Windows VM; docs gate done; RC freeze pending commit

## Scope (owner-specified, see `docs/RELEASE-PLAN-v1.0.8.md`)

1. Low Stock threshold fix
2. Shift numbering
3. Withdrawal / Transfer workflow

Zero-regression rule: v1.0.8 = v1.0.6 + v1.0.7 + new feedback + bug fixes. No existing
feature may disappear, break, reset, or silently change. Production publication
(push/tag/release/Latest) remains PROHIBITED until owner approval after final review.

## Evidence of current baseline (this session)

- v1.0.7 released as GitHub Latest 2026-09-11T23:35:48Z; assets: latest.yml,
  SHA256SUMS-RC.txt, Setup/Portable 1.0.7, blockmap, User Guide PDF. Stable, not prerelease.
- Manual-update path documented for legacy v1.0.3–v1.0.5 stores:
  `docs/MANUAL-UPDATE-INSTRUCTIONS.md` (one-time Setup over-install to v1.0.7;
  after that auto-update works).
- v1.0.8 Stage 01 plan: `docs/RELEASE-PLAN-v1.0.8.md`.

## Stage 02 progress (this session)

Implementations on branch `v1.0.8-dev`:

1. **Low Stock threshold fix** — `default_low_stock` setting is now the single
   source of truth. `createProduct` resolves the threshold from Settings when the
   form/CSV omits it (was hard-coded `5`); CSV import leaves the field empty to
   inherit the store default and never overwrites an existing threshold on UPDATE.
   The New Product form prefills the field from the store setting.
2. **Shift numbering** — new additive migration `version 5 shift_numbering`
   (`shifts.shift_no`, backfilled per-cashier in shift-open order, unique index).
   `openShift` assigns the next per-user number; X-Read / Z-Read / Cash Count
   print and Reports header show `Shift #<no>` while falling back to the old
   shift id for historical snapshots.
3. **Withdrawal / Transfer** — new `WITHDRAWAL` movement type (no schema change;
   table has no CHECK). New IPC `inventory:withdraw` validates reasons
   TAKEN/DAMAGED/EXPIRED/FORWARD, converts units, guards against negative stock,
   records a movement only (zero financial impact). Inventory page adds a
   **Withdraw** modal and a **Stock History** viewer (filterable).

QA gates (all GREEN):
- `npm test` — 28 files, 196 tests PASS (incl. 14 new feature tests + 2 upgrade-chain tests)
- `npm run typecheck` — PASS (node + web)
- `npm run lint` — PASS
- `npm run build` — PASS
- `git diff --check` — clean
- DB upgrade chain `v1.0.6/v1.0.7 (schema v4) -> v1.0.8`: verified in
  `src/main/database/__tests__/v108-upgrade-chain.test.ts` — migration engine
  applies exactly migration 5, re-boot is a safe no-op, `PRAGMA integrity_check`
  ok, and products, units, stock movements, customers + utang ledger, shifts,
  sales + items + payments, cash counts, expenses, and settings all preserved
  with identical counts and spot-checked values; legacy shifts numbered in open
  order and new shifts continue the per-cashier sequence.

Pending: Windows update E2E acceptance on VM `tinda-win11`, USER-MANUAL update, RC freeze for owner review. No push/tag/release until owner approval.

## Stage 08 progress (this session) — Windows native updater acceptance PASS

On VM `tinda-win11` (`192.168.122.248`, native Windows 11), remote-control/tooling repaired via dedicated temp QA account `tindaqa` (SMB/WMI admin, `LocalAccountTokenFilterPolicy=1`, winmgmt + LanmanServer running, WMI + File and Printer Sharing firewall rules enabled). Guest `updater-e2e.log` completed run:

```text
START_VERSION=1.0.7
QA_BUILD=TRUE
FEED=http://127.0.0.1:18766
AUTOUPDATER_INIT=PASS
CHECK=PASS
TARGET_VERSION=1.0.8
DOWNLOAD_COMPLETE=PASS
SAFETY_BACKUP=PASS
RESTART_INSTALL_REQUESTED=PASS
```

- **Installed QA v1.0.7 (patched, not public) → local v1.0.8 RC feed → silent NSIS install → relaunch → v1.0.8.** The locally served feed served the exact frozen RC artifacts: `TindaPOS-Setup-1.0.8.exe` (109,485,904 bytes; sha512 `0vyLkS…`), `.blockmap`, `latest.yml` version 1.0.8 — identical to the RC artifacts in `rc-source/source/builds/` and `rc-source/installers/SHA256SUMS-RC.txt`.
- **Installed app verification PASS** — after install, pulled `resources/app.asar` (37,145,398 bytes); `package.json` `version` = `1.0.8`. The installed tree includes the NSIS uninstaller, confirming a real per-user install (not a raw copy). Relaunched `TindaPOS.exe` running interactively (Console session 1) with the TINDA POS window rendered.
- **Data preservation PASS** — live DB `%APPDATA%\TINDA POS\database\tindapos.db` at `app_migrations` max version **5** (shift_numbering migration applied), 1 OPENED shift, 2 cash_counts, 1 user preserved; upgraded backup snapshot written to guest `C:\TINDA-QA\evidence\upgraded\tindapos.db`.
- Feed payload and app are transported over SMB (byte-exact long filenames). A CD-ROM xcopy install path is NOT used: Windows CDFS reads this Rock Ridge ISO via ISO9660 8.3 names only (e.g. `V8_CONTE.BIN`), which is a VM media limitation, not a product defect.

## Documentation gate (this session) — PASS

`docs/USER-MANUAL.md` updated to v1.0.8: new **Withdraw Stock** section (Taken/Damaged/Expired/Forward, Stock History, zero financial impact), **Low Stock Alert default** section (store-wide `Default Low Stock Alert` is the single source of truth for new/CSV products; blank CSV never overwrites an existing threshold), **Shift #** numbering in X-Read/Cash Count/Shift sections, updated headers/download section/build references. User Guide PDF regenerated via `npm run docs:pdf` — **18 pages, 121794 bytes**, SHA256 `89e0656c28f7b98dced11c997f94c81d6dd757fa30182f7ce5a5349068c22cbc`, version `1.0.8`. `installers/SHA256SUMS-RC.txt` updated with the v1.0.8 artifact hashes (RC artifacts themselves unchanged).

## RC freeze check

- RC artifacts (`Setup` `ab1f1535…`, `Portable` `de3caea2…`, `blockmap` `0bebf905…`, `latest.yml` `2d88b38b…`) verified present and matching the hashes recorded in `SHA256SUMS-RC.txt`; they are byte-identical to what the VM updated from.
- `git diff --check`, typecheck, lint, tests, build all recorded GREEN earlier this session chain (Stage 02/03/04 evidence above).
- Next: one local RC commit documenting the completed updater acceptance + docs gate on `v1.0.8-dev`, clean tree, record exact `RC_COMMIT`, then present the frozen v1.0.8 RC to the owner for approval. No push/tag/release until explicit owner approval.

## Next required action

Complete remaining QA (DB upgrade chain integrity + final review), then present
the v1.0.8 RC to the owner for approval before any publication.

## GitHub this session

Read-only metadata/verification only. Pushed: NO. Tagged: NO. Released: NO.
