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
- **Level:** **Lv. 32 (LEVEL UP!)** | **XP:** 7,700 / 10,000
- **Attributes:** INT: 99 | WIS: 99 | LCK: 97 | ATK: 99
- **Superpowers & Equipped Skills:**
  - `[Systematic Root-Cause Exorcism]`: 100% immune to symptom guessing. Traces call stacks to exact lines of origin.
  - `[Deep AST Code Surgery]`: Executes minimal drop-in AST repairs for complex asynchronous, database, and IPC bugs.
  - `[Memory & Leak Annihilator]`: Detects and eliminates hidden heap leaks, zombie listeners, and dangling timers.
  - `[Permanent Immunity Shield]`: Once an error pattern is diagnosed, embeds safeguards across the repository so the bug can never respawn.
  - `[Gross vs Net Margin Restorer]`: Repairs COGS calculation by ensuring trade discounts are properly factored into unit acquisition costs.
  - `[IPC Bridge Architect]` *(NEW UNLOCKED)*: Discovers and completes missing frontend-to-preload IPC bridges (`kickCashDrawer`).
- **Quest History:**
  - Diagnosed and neutralized SQLite column desynchronization and runtime shortDate crashes with zero collateral damage.
  - Completed Surgical Strike Mission: Connected `window.api.printer.kickCashDrawer()` across `shared/ipc.ts` and `preload/index.ts`. Confirmed 0 TypeScript compiler errors.

---

### 2. Rune-Keeper of Data — `tinda-pos-database-reliability`
- **Class:** SQLite Engine & Schema Paladin
- **Level:** **Lv. 22 (LEVEL UP!)** | **XP:** 3,600 / 4,000
- **Attributes:** DEF: 99 | WIS: 95 | INT: 94
- **Equipped Skills:**
  - `[Self-Healing Table Shard]`: Automatically detects missing columns on startup and patches schema on the fly.
  - `[WAL Mode Aegis]`: Guarantees crash-safe transactions during sudden power blackouts.
  - `[High-Volume Index Mastery]`: Sub-millisecond lookup across 50,000+ products and hundreds of thousands of receipts.
  - `[Migration 15 Index Master]`: Generates optimal composite indexes covering all 15 foreign key cascades and reporting scans.
- **Quest History:**
  - Slain the "Missing invoice_no Column Crash" in v2.0.9 by implementing dynamic column auto-injection in purchases and migrations.
  - Completed Surgical Strike Mission: Implemented Migration 15 (`foreign_key_composite_indexes`), patched `CANONICAL_TABLES` parent-before-child ordering in `canonical.ts`, created `migration-15.test.ts`.

---

### 3. Invariant Hunter — `tinda-pos-qa-tester`
- **Class:** Automated Testing & Regression Ranger
- **Level:** **Lv. 24 (LEVEL UP!)** | **XP:** 4,000 / 4,500
- **Attributes:** INT: 98 | PER: 99 | AGI: 94
- **Equipped Skills:**
  - `[Vitest Rapid Blitz]`: Executes 79 test suites and 504 unit/integration tests in under 5 seconds.
  - `[Negative Stock Ward]`: Traps cart conditions where bundle components have zero inventory.
  - `[Floating Centavo Trap]`: Prevents rounding errors and centavo leakage in retail discounts.
  - `[Midnight Shift Trapper]`: Simulates cross-midnight cashier shifts ensuring 100% reconciliation coverage.
- **Quest History:**
  - 504/504 tests green across all 79 test suites (100% pass rate).
  - Completed Surgical Strike Mission: Isolated legacy test expectation discrepancy in `refund-profit.test.ts` and verified prorated refund discount protection.

---

### 4. Ironclad Artificer — `tinda-pos-hardware-desktop`
- **Class:** Desktop Runtime & POS Peripheral Vanguard
- **Level:** **Lv. 17 (LEVEL UP!)** | **XP:** 2,400 / 3,000
- **Attributes:** DEX: 96 | VIT: 90 | INT: 87
- **Equipped Skills:**
  - `[ESC/POS Raw Stream]`: Native byte command streaming for 58mm and 80mm thermal receipt printers.
  - `[RJ11 Drawer Pulse]`: High-reliability cash drawer kick trigger without print delay.
  - `[Barcode Scanner Interceptor]`: Rapid USB HID keystroke buffering without losing characters.
  - `[58mm Flex Guardian]`: Enforces `flex-shrink: 0` and margin boundaries preventing centavo overflow on narrow thermal paper.
  - `[Tear-Bar Clearance Spacer]` *(NEW UNLOCKED)*: Ensures 5 feed lines (19mm) clearing physical cutter blades and tear bars.
- **Quest History:**
  - Standardized thermal printer column alignment and ESC/POS command sequences.
  - Completed Surgical Strike Mission: Repaired CSS `flex-shrink: 0`, widened feed lines default to 19mm, eliminated Windows print double-margins (`marginType: 'none'`), and established `kickCashDrawer`.

---

### 5. Merchant Alchemist — `tinda-pos-accounting-compliance`
- **Class:** Retail Accounting & Trade Formula Specialist
- **Level:** **Lv. 20 (LEVEL UP!)** | **XP:** 3,050 / 3,500
- **Attributes:** WIS: 99 | INT: 95 | CHA: 88
- **Equipped Skills:**
  - `[Cascading Trade Transmute]`: Computes compounding wholesale discounts ("Less 5 Less 5", -10%-5%, -20%-10%-5%).
  - `[Bulk Unit Unbundling]`: Converts bulk purchase units (box, pack, roll, sack) into exact individual retail inventory counts.
  - `[Daily Shift Siphon]`: Separates active shift E-Wallet collections from continuous accumulated ledgers.
  - `[Refund Discount Armor]`: Prevents cash drawer bleeding by calculating proportional discounts on refunded line items.
- **Quest History:**
  - Formulated cascading discount parsing engine and multi-packaging converter for purchase orders.
  - Completed Surgical Strike Mission: Successfully plugged the cash drawer refund leak in `transaction.ts`, restored true net unit cost in `purchases.ts`, and hardened `calculateChainDiscount` against NaN values and >100% inputs.

---

### 6. Aegis Warden — `tinda-pos-release-gatekeeper`
- **Class:** Production Release & Reality Checker
- **Level:** **Lv. 27 (LEVEL UP!)** | **XP:** 5,000 / 6,000
- **Attributes:** STR: 97 | STA: 99 | DEF: 99
- **Equipped Skills:**
  - `[Typecheck Barrier]`: Zero-tolerance gatekeeper blocking builds with TypeScript compiler errors.
  - `[Hot-Patch Forge]`: Automates semantic version bumping and packages production release zip artifacts.
  - `[Reality Verification Check]`: Validates working proof before any release announcement.
  - `[Multi-Target Build Inspector]`: Cleanly audits Node, Preload, and Web renderer targets without config collisions.
- **Quest History:**
  - Shipped v2.0.8 and v2.0.9 hot patches directly to production GitHub releases.
  - Completed Surgical Strike Mission: Verified 0 TypeScript compiler errors across all targets, verified 79 test files passing, confirmed zero regressions.

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
