# RELEASE PLAN v1.0.17

CURRENT STABLE: v1.0.16 (tag v1.0.16)
TARGET: v1.0.17
RELEASE TYPE: PATCH / BUGFIX

## Scope & Fixes:

1. Enable Windows Startup Checkbox for Setup Installations:
   - Root Cause:
     In `startup.ts`, `supported` was defined as:
     `const supported = process.platform === 'win32' && app.isPackaged && !process.env.PORTABLE_EXECUTABLE_FILE && !process.env.PORTABLE_EXECUTABLE_DIR`
     When running on Windows, if `PORTABLE_EXECUTABLE_DIR` or `PORTABLE_EXECUTABLE_FILE` was present in the environment (or left behind from prior runs or launchers), TINDA POS Setup falsely treated the installation as unsupported and disabled the checkbox in Settings.
     Furthermore, unhandled registry errors in `app.getLoginItemSettings()` caused the IPC handler to reject, leaving `state` null in the renderer, which permanently disabled the checkbox.
   - Solution:
     - On Windows, `supported = process.platform === 'win32'` is always true for the app.
     - All `app.setLoginItemSettings` and `app.getLoginItemSettings` calls are safely wrapped in `try/catch`.
     - `Settings.tsx` gracefully falls back so the checkbox is never locked in an unclickable disabled state.
     - Text changed from "Available with the Windows Setup installation." to "Available on Windows."

## Gates:
- UPDATER GATE: STRICTLY NONE. `electron-builder.yml`, `updateService.ts`, `updateStore.ts`, `updateTransport.ts`, `updateDownload.ts`, `updateRuntime.ts`, and `pnpm-lock.yaml` remain byte-identical.
- FULL AUTOMATED QA: 35/35 test files PASS, typecheck PASS, lint PASS.
