# TINDA POS RELEASE RESUME

CURRENT STABLE:
- v1.0.94 (CHITENG CT221B THERMAL SPOOLER & RESILIENT AUTO-UPDATE EDITION)

TARGET:
- v1.0.95 (NEXT RELEASE CYCLE)

CURRENT STAGE:
- Publishing Live Patch v1.0.94

COMPLETED:
- Stage 01: Chiteng CT221B Direct Thermal Monochrome Spooler (color: false, 203 DPI, 2.5s buffer) in printing.ts.
- Stage 02: Label printer auto-target resolution and smart manual fallback in PriceTagPrintModal.tsx.
- Stage 03: Driver guidance notice with www.claiot.com official PC driver links.
- Stage 04: Resilient Auto-Update Engine with 3-strike retryOperation, 30s/60s timeouts, and Azure Blob CDN allowlist.
- Stage 05: Windows file-lock retry shield (safeRmDirWithRetry, safeRenameWithRetry) in patchService.ts.
- Stage 06: Quality Gates passed: Vitest (449/449 tests), Typecheck (0 errors), check_master_invariants.

PENDING APPROVAL:
- None (Approved by Owner).

BLOCKERS:
- None.
