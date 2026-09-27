# PLAN.md — TINDA POS v1.0.37: Cryptographic Hardware Licensing & VIP Pro Architecture

> Task planning artifact. Governed by strict security invariants and zero-data-loss architecture.
> Target Release: TINDA POS v1.0.37

## Task

Design, implement, test, and release **TINDA POS v1.0.37** featuring:
1. **Offline Hardware-Locked Licensing System:** 100% offline HMAC-SHA256 license verification binding PC Motherboard, CPU, Machine GUID, and network MAC.
2. **₱500 VIP Pro Lifetime Edition:** Unlimited catalog items, Multi-PC LAN Hub host/satellite mode, Suki Utang Trust Rating (⭐⭐⭐⭐⭐), 1-Click SMS Collection Reminder generator, paperless QR receipts, and custom store branding.
3. **Free Community Edition Safeguards:** 50-product catalog limit, single-PC standalone mode, standard receipt watermark.
4. **Developer Keygen Tooling:** Omarchy Linux CLI command (`tinda-keygen`) with Wayland clipboard integration (`wl-copy`) and private repo generator (`tools/keygen.mjs`).
5. **Centered & Animated Settings UI:** Balanced `max-w-4xl mx-auto` Settings tabs, sliding VIP banner, and VIP modal with 1-click Machine ID copy and Maya / Facebook contact info.
6. **Project Workspace Organization:** Pruning obsolete build artifacts, archiving old docs/checksums, and establishing streamlined developer workflows.

---

## Milestones

- [x] **M1: Cryptographic License Engine (`licenseService.ts`)** — Multi-hardware anchor scraping, deterministic obfuscated HMAC-SHA256 verification, tamper-proof file integrity guard.
- [x] **M2: Developer Keygen Tooling** — Created `tools/keygen.mjs` and Omarchy CLI tool `~/.local/bin/tinda-keygen` with `wl-copy` automatic clipboard support.
- [x] **M3: Feature Gates & Community Boundaries** — Enforced 50-item catalog limit for free tier, Multi-PC LAN Hub VIP gate, and thermal receipt watermark.
- [x] **M4: Centered Settings UI & Animated VIP Modal** — Redesigned Settings with centered navigation, sliding upgrade CTA, and 1-click Maya / Facebook launchers.
- [x] **M5: Suki Credit Trust Rating & 1-Click SMS Reminder** — Added 5-star customer trust scoring and instant SMS collection reminder formatter.
- [x] **M6: Verification Testing & Type Safety** — Added `license-service.test.ts` and `settings-vip.test.ts`. 100% pass rate (49/49 test files, 332/332 tests).
- [x] **M7: Workspace Organization & Cleanup** — Pruned 4.4GB of dead build outputs, archived legacy release docs and checksums into `docs/archive/` and `installers/archive/`.
- [ ] **M8: Production Windows Build & Release Packaging** — Compile `TindaPOS-Setup-1.0.37.exe` and `TindaPOS-Portable-1.0.37.exe`, generate checksums, and update documentation.
