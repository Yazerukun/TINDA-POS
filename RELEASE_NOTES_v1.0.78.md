# TINDA POS v1.0.78 — Real-Time Sidebar Fast Updates & Proactive Pop-up Hub Edition

TINDA POS v1.0.78 introduces a persistent **Real-Time Sidebar Fast Update Center Widget**, high-frequency **10-Second Proactive Update Pop-up Detection**, and rate-limit-free **GitHub CDN Raw Manifest Fallback** for instant 1-tap live patching.

---

### 🌟 Key Highlights & Engineering Advancements

#### 1. Persistent Real-Time Sidebar Update Center Widget (`Sidebar.tsx`)
- Permanently mounted in the lower navigation sidebar directly above the cashier identity card with translucent Cupertino materials and glowing state indicators.
- Seamlessly transitions across 4 interactive states:
  - **`Update Available`**: Pulsing cyan status indicator, `⚡ Fast Update` badge, new version pill, and 1-tap `Update Now` button.
  - **`Downloading...`**: Live download percentage ticker (`X%`) with animated gradient progress bar.
  - **`Ready to Apply`**: Vibrant emerald glow card with 1-tap `Apply Patch (Live · 0.3s)` button.
  - **`Up to date`**: Minimalist status pill with current version and instant manual check button (`RotateCcw`).

#### 2. High-Frequency Proactive Update Pop-up Engine (`Shell.tsx` & `UpdateModal.tsx`)
- Automatically displays the Cupertino Update Modal front-and-center across all screens when a new update is released.
- Cashiers never have to dig into Settings or click "Check for Updates" manually.
- Background polling reduced to 10 seconds, with immediate automatic triggers on app launch (1.5s post-boot), window focus (`focus`), and internet reconnect (`online`).

#### 3. Rate-Limit-Free CDN Fallback Engine (`updateTransport.ts`)
- Added direct manifest fetching fallback to `raw.githubusercontent.com/.../latest.yml`, completely bypassing GitHub unauthenticated REST API 60 req/hr rate limits during rapid polling.

#### 4. Fast Feature Hot-Patch Pipeline First
- UI and logic updates bundle in ~1.3 seconds via `npm run build:patch` (~0.8 MB) and download in seconds on retail store connections without requiring full 107 MB installer packages or Windows UAC prompts.
