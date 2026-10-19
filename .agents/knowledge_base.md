<!-- File: .agents/knowledge_base.md -->
# TINDA POS Swarm Knowledge Base & Anti-Repetition Ledger

_Last Updated: 2026-10-13 | Authority: Supreme Executive (Sir) | Lead Orchestrator: Yujin (Jin)_

---

## 1. Executive Preferences & Project Invariants (Sir's Golden Rules)
- **Hierarchy & Chain of Command**: Sir is the Supreme Executive and sole sign-off authority. Yujin translates directives, leads the PhD swarm, and orchestrates zero-defect deliverables. Subagents report only to Yujin.
- **Tone & Dialogue**: Yujin speaks in a respectful, sharp, doctoral mix of Cebuano and English. Dialogues must be adaptive, context-rich, and strictly devoid of robotic, canned repetitions across conversational turns.
- **Zero-Defect Standard**: Exactly 0 TypeScript errors, 100% unit tests passing, zero placeholders (`// TODO` banned), and 0 invariant violations prior to presenting code.
- **Offline-First Resilience**: All core operations (inventory, cart, receipts, utang ledger, shift tracking) must function 100% locally with zero cloud latency.
- **Mandatory Version Tracking**: Continuous auto-incrementing SemVer tracking across every deployment or patch.
- **Destructive Action Lock**: Mandatory halt and `[⚠️ DESTRUCTIVE ACTION WARNING]` before executing any destructive operations.

---

## 2. Historical Bug Resolutions & Anti-Repetition Ledger (Lessons Learned)

| Incident ID | Root Cause | Faulty Pattern | Invariant Fix & Lesson |
|---|---|---|---|
| **BUG-001: 4:00 PM Timezone Date Rollover** | `date(created_at, 'localtime')` on timestamps already stored in local `Asia/Manila` time caused premature date advances at 16:00 UTC+8. | Dual-conversion of local timestamps. | Replaced with `substr(created_at, 1, 10)`. Never re-apply `'localtime'` to SQLite timestamps already recorded in local store time. |
| **BUG-002: SQLite Concurrency Lock Collision** | Simultaneous checkouts across Multi-PC cashier terminals caused `SQLITE_BUSY` database lock errors under default `BEGIN` transactions. | Deferred transactions acquiring write locks late. | Enforced `BEGIN IMMEDIATE` on all checkout transactions in Master SQLite to serialize write queues deterministically. |
| **BUG-003: UI Telemetry Spinner Freezes** | Asynchronous initial fetch of store telemetry stalled component mounting during initial shell render. | Blocking UI with async state loading. | Implemented synchronous `localStorage` pre-warming (`warmStoreTelemetryCache()`) with Stale-While-Revalidate background hydration. |
| **BUG-004: Event Parameter Type Mismatch in onClick** | Passing `onClick={handleDownload}` directly passed the React `MouseEvent` as the first argument to `(type?: 'PATCH' | 'FULL')`. | Passing multi-argument handlers directly into DOM event props. | Always wrap in arrow functions: `onClick={() => void handleDownload()}` to prevent DOM events from contaminating domain parameters. |
| **BUG-005: Zero-Division ETA Fluctuation** | Raw byte socket streams over volatile Wi-Fi caused download speed to momentarily drop to 0, resulting in `remaining / 0 = Infinity`. | Unguarded division by raw instantaneous speed. | Enforced Exponential Moving Average (EMA, $\alpha=0.25$) speed smoothing and non-zero division safety guard: `smoothedSpeed > 50 ? Math.round(remaining / smoothedSpeed) : null`. |
| **BUG-006: Thermal Receipt Header Clipping & Discrete Spacing Bottleneck** | Physical thermal printers (58mm/80mm) clipped the store header due to hardcoded 2mm top margins and lacked continuous line-height adjustments. | Hardcoded CSS top/item/separator padding without persistent store synchronization. | Exposed `receipt_offset_top_mm` (0-15mm), `receipt_line_height_multiplier` (1.00-2.00x), `receipt_item_spacing_px` (0-8px), and `receipt_separator_spacing_px` (0-8px) synchronized seamlessly between SQLite `settings`, localStorage fallback, and Chromium `@media print` spooler. |

---

## 3. Evolutionary Best Practices & Golden Rules
1. **Rule of Spatial Grounding**: Always declare the target relative/absolute file path on Line 1 of every generated code block.
2. **Rule of Academic Documentation**: All functions, methods, and classes must carry JSDoc/docstrings declaring `@param`, `@returns`, `@throws`, and `@complexity` Big-O bounds.
3. **Rule of Single Responsibility (SRP)**: Any function exceeding 50 lines of logic must be decomposed into isolated, testable atomic helpers.
4. **Rule of Dynamic Skill Synthesis**: If Sir commands a domain outside existing capabilities (e.g. Rust systems, Web3, PyTorch/ML), dynamically spawn a specialized "Visiting Professor" subagent and announce capability upgrades.
5. **Rule of Executive Evolution Reporting**: Keep routine updates terse and high-density; present comprehensive Evolution Reports on major architectural milestones.
