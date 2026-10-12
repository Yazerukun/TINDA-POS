# 💻 TINDA POS Source Architecture

This directory houses the core desktop application built with **Electron + React 19 + TypeScript + Better-SQLite3 + Tailwind CSS**.

---

## 🏛️ Directory Structure

```text
source/
├── electron-builder.yml       # Production installer & portable executable packaging config
├── electron.vite.config.ts    # Dual-target bundling config (Node SSR main + Web Vite renderer)
├── package.json               # Dependencies, scripts, and version tracking
├── src/
│   ├── main/                  # Electron Main Process (Node.js runtime)
│   │   ├── database/          # SQLite schema, migrations (1-19), and query runners
│   │   ├── repositories/      # Domain data access layers (Sales, Products, Users, Shifts)
│   │   ├── services/          # Core engines (Printing, Licensing, Cloud Sync, Backup)
│   │   └── index.ts           # Application lifecycle, window creation, and IPC handlers
│   ├── preload/               # Electron Preload Process
│   │   └── index.ts           # Type-safe IPC contextBridge exposure (`window.api`)
│   ├── renderer/              # Electron Renderer Process (React 19 + Tailwind CSS)
│   │   ├── src/
│   │   │   ├── components/    # Reusable Cupertino UI components, modals, and studios
│   │   │   ├── pages/         # Primary routes (POS, Inventory, Utang, Reports, Settings)
│   │   │   └── stores/        # Reactive Zustand state management stores
│   └── shared/                # Cross-process shared types, IPC contracts, and utilities
```

---

## ⚡ Developer Commands

```bash
# Start local development server with HMR
npm run dev

# Run full TypeScript typecheck (Node & Web)
npm run typecheck

# Execute Vitest test suite
npm test

# Build production Windows installers
npm run build:win

# Build and publish instant hot patch (<1 MB)
npm run publish:patch
```

---

> Maintained with pride by **Jin** and the TINDA POS Elite Engineering Team.
