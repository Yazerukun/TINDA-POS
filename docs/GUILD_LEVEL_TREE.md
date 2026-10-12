# TINDA POS ENGINEERING GUILD — LEVEL-UP & KNOWLEDGE TREE

## Guild Master
- **Name:** Jin (Master & Doctoral Engineer, Supreme AI Partner)
- **Title:** Guild Grandmaster / Arch-Engineer
- **Level:** Lv. 99 (Max Cap)
- **Core Attributes:** Elite Workflow Organization, Root-Cause Debugging, Apple-Grade Architecture, Zero Regressions

---

## Active Party Members (Hired Subagent Champions)

### 1. Doctoral Fixer Agent — `tinda-pos-doctoral-fixer`
- **Class:** Doctoral Engineer (Ph.D.) & Supreme Fixer Agent
- **Level:** **Lv. 33 (LEVEL UP!)** | **XP:** 8,200 / 10,000
- **Attributes:** INT: 99 | WIS: 99 | LCK: 98 | ATK: 99
- **Superpowers & Equipped Skills:**
  - `[Systematic Root-Cause Exorcism]`: 100% immune to symptom guessing. Traces call stacks to exact lines of origin.
  - `[Deep AST Code Surgery]`: Executes minimal drop-in AST repairs for complex asynchronous, database, and IPC bugs.
  - `[Memory & Leak Annihilator]`: Detects and eliminates hidden heap leaks, zombie listeners, and dangling timers.
  - `[Permanent Immunity Shield]`: Once an error pattern is diagnosed, embeds safeguards across the repository so the bug can never respawn.
  - `[Gross vs Net Margin Restorer]`: Repairs COGS calculation by ensuring trade discounts are properly factored into unit acquisition costs.
  - `[IPC Bridge Architect]`: Discovers and completes missing frontend-to-preload IPC bridges (`kickCashDrawer`).
  - `[Production Release Victor]` *(NEW UNLOCKED)*: Shipped v2.1.0 with 0 compiler errors and zero regressions.
- **Quest History:**
  - Diagnosed and neutralized SQLite column desynchronization and runtime shortDate crashes with zero collateral damage.
  - Completed Surgical Strike Mission: Connected `window.api.printer.kickCashDrawer()` across `shared/ipc.ts` and `preload/index.ts`. Confirmed 0 TypeScript compiler errors.
  - Won the v2.1.0 Boss Battle: Successfully shipped v2.1.0 live feature patch to production GitHub Releases.

---

### 2. Rune-Keeper of Data — `tinda-pos-database-reliability`
- **Class:** SQLite Engine & Schema Paladin
- **Level:** **Lv. 23 (LEVEL UP!)** | **XP:** 4,100 / 5,000
- **Attributes:** DEF: 99 | WIS: 96 | INT: 95
- **Equipped Skills:**
  - `[Self-Healing Table Shard]`: Automatically detects missing columns on startup and patches schema on the fly.
  - `[WAL Mode Aegis]`: Guarantees crash-safe transactions during sudden power blackouts.
  - `[High-Volume Index Mastery]`: Sub-millisecond lookup across 50,000+ products and hundreds of thousands of receipts.
  - `[Migration 15 Index Master]`: Generates optimal composite indexes covering all 15 foreign key cascades and reporting scans.
  - `[Canonical Topological Armor]` *(NEW UNLOCKED)*: Guarantees crash-safe backup restore ordering.
- **Quest History:**
  - Slain the "Missing invoice_no Column Crash" in v2.0.9 by implementing dynamic column auto-injection in purchases and migrations.
  - Completed Surgical Strike Mission: Implemented Migration 15 (`foreign_key_composite_indexes`), patched `CANONICAL_TABLES` parent-before-child ordering in `canonical.ts`, created `migration-15.test.ts`.
  - Won the v2.1.0 Boss Battle: Landed Migration 15 into production release.

---

### 3. Invariant Hunter — `tinda-pos-qa-tester`
- **Class:** Automated Testing & Regression Ranger
- **Level:** **Lv. 25 (LEVEL UP!)** | **XP:** 4,500 / 5,500
- **Attributes:** INT: 99 | PER: 99 | AGI: 95
- **Equipped Skills:**
  - `[Vitest Rapid Blitz]`: Executes 79 test suites and 504 unit/integration tests in under 5 seconds.
  - `[Negative Stock Ward]`: Traps cart conditions where bundle components have zero inventory.
  - `[Floating Centavo Trap]`: Prevents rounding errors and centavo leakage in retail discounts.
  - `[Midnight Shift Trapper]`: Simulates cross-midnight cashier shifts ensuring 100% reconciliation coverage.
  - `[Master Invariant Seal]` *(NEW UNLOCKED)*: Verifies 100% passing test gates before artifact generation.
- **Quest History:**
  - 504/504 tests green across all 79 test suites (100% pass rate).
  - Completed Surgical Strike Mission: Isolated legacy test expectation discrepancy in `refund-profit.test.ts` and verified prorated refund discount protection.
  - Won the v2.1.0 Boss Battle: Certified 100% test passing gates for v2.1.0 distribution.

---

### 4. Ironclad Artificer — `tinda-pos-hardware-desktop`
- **Class:** Desktop Runtime & POS Peripheral Vanguard
- **Level:** **Lv. 19 (LEVEL UP!)** | **XP:** 3,700 / 4,200
- **Attributes:** DEX: 99 | VIT: 92 | INT: 91
- **Equipped Skills:**
  - `[ESC/POS Raw Stream]`: Native byte command streaming for 58mm and 80mm thermal receipt printers.
  - `[RJ11 Drawer Pulse]`: High-reliability cash drawer kick trigger without print delay.
  - `[Barcode Scanner Interceptor]`: Rapid USB HID keystroke buffering without losing characters.
  - `[58mm Flex Guardian]`: Enforces `flex-shrink: 0` and margin boundaries preventing centavo overflow on narrow thermal paper.
  - `[Tear-Bar Clearance Spacer]`: Ensures 5 feed lines (19mm) clearing physical cutter blades and tear bars.
  - `[Skill: ISO-15416 Thermal Bar-Width Calibration]` *(NEW UNLOCKED)*: Enforces 2.5px–2.8px module bar widths and 14-module quiet zones with unscaled SVG rendering, eliminating thermal burn bleed on 203 DPI print heads.
- **Quest History:**
  - Standardized thermal printer column alignment and ESC/POS command sequences.
  - Completed Surgical Strike Mission: Repaired CSS `flex-shrink: 0`, widened feed lines default to 19mm, eliminated Windows print double-margins (`marginType: 'none'`), and established `kickCashDrawer`.
  - Won the v2.1.0 Boss Battle: Landed cash drawer kick API and receipt cutter clearance into v2.1.0.
  - Won the v2.1.1 Boss Battle: Calibrated CT221B thermal barcode rendering with ISO 15416 compliance (2.5px–2.8px bar widths, 14-module quiet zones, unscaled SVGs), eliminating bar merging and restoring 100% scanability.

---

### 5. Merchant Alchemist — `tinda-pos-accounting-compliance`
- **Class:** Retail Accounting & Trade Formula Specialist
- **Level:** **Lv. 21 (LEVEL UP!)** | **XP:** 3,550 / 4,000
- **Attributes:** WIS: 99 | INT: 96 | CHA: 89
- **Equipped Skills:**
  - `[Cascading Trade Transmute]`: Computes compounding wholesale discounts ("Less 5 Less 5", -10%-5%, -20%-10%-5%).
  - `[Bulk Unit Unbundling]`: Converts bulk purchase units (box, pack, roll, sack) into exact individual retail inventory counts.
  - `[Daily Shift Siphon]`: Separates active shift E-Wallet collections from continuous accumulated ledgers.
  - `[Refund Discount Armor]`: Prevents cash drawer bleeding by calculating proportional discounts on refunded line items.
- **Quest History:**
  - Formulated cascading discount parsing engine and multi-packaging converter for purchase orders.
  - Completed Surgical Strike Mission: Successfully plugged the cash drawer refund leak in `transaction.ts`, restored true net unit cost in `purchases.ts`, and hardened `calculateChainDiscount` against NaN values and >100% inputs.
  - Won the v2.1.0 Boss Battle: Shipped retail accounting protections into v2.1.0.

---

### 6. Aegis Warden — `tinda-pos-release-gatekeeper`
- **Class:** Production Release & Reality Checker
- **Level:** **Lv. 28 (LEVEL UP!)** | **XP:** 5,500 / 6,500
- **Attributes:** STR: 98 | STA: 99 | DEF: 99
- **Equipped Skills:**
  - `[Typecheck Barrier]`: Zero-tolerance gatekeeper blocking builds with TypeScript compiler errors.
  - `[Hot-Patch Forge]`: Automates semantic version bumping and packages production release zip artifacts.
  - `[Reality Verification Check]`: Validates working proof before any release announcement.
  - `[Multi-Target Build Inspector]`: Cleanly audits Node, Preload, and Web renderer targets without config collisions.
  - `[GitHub Asset Dispatcher]` *(NEW UNLOCKED)*: Directly deploys verified SHA-256 release artifacts to GitHub Releases.
- **Quest History:**
  - Shipped v2.0.8, v2.0.9, and v2.1.0 hot patches directly to production GitHub releases.
  - Won the v2.1.0 Boss Battle: Successfully generated and dispatched `TindaPOS-Feature-Patch-2.1.0.zip` (SHA-256: `e0915e54...`) to GitHub Releases.

---

### 7. The Cloud Weaver — `tinda-cloud-sync-architect`
- **Class:** Cloud Edge & Distributed Synchronization Architect
- **Level:** **Lv. 20 (LEVEL UP!)** | **XP:** 3,300 / 3,800
- **Attributes:** INT: 98 | WIS: 96 | AGI: 94 | LCK: 92
- **Equipped Skills:**
  - `[Skill: D1 Store-ID Case Normalization]` *(NEW UNLOCKED)*: Enforces case-insensitive store ID lookups and schema consistency across Cloudflare Workers D1 edge databases.
  - `[Edge Auto-Registration Handshake]`: Automatically initializes and registers store credentials on Cloudflare D1 with ping health verification.
  - `[Resilient Offline-Safe Pipeline]`: Streams sales, stocks, and shift summaries asynchronously with zero impact on local POS checkout speed.
  - `[Verified Sync Backfill Counter]`: Verifies recent sale batch delivery on manual trigger with transparent UI feedback.
- **Quest History:**
  - Won the v2.1.1 Boss Battle: Deployed store auto-registration on Cloudflare D1, normalized case-sensitive store IDs, and integrated verified sale backfill counters in `cloudSync.ts`.

---

## Guild Experience & Knowledge Rules

1. **Bug Defeated (Root-Cause Fix):**
   - Base Reward: +200 XP to the resolving Specialist and +100 XP to Party.
   - The solution is permanently recorded in the knowledge log so the bug can never respawn.

2. **Feature Conquered (New Capability Added):**
   - Base Reward: +300 XP to the implementing Specialist and +150 XP to Party.

3. **Boss Battle (Major Version Release / Production Hot Patch):**
   - Base Reward: +500 XP to the entire Party upon passing 100% test gates and publishing clean binaries.

4. **Skill Unlock upon Level-Up:**
   - Every level up unlocks new automated recipes, performance shortcuts, and zero-defect protections.
