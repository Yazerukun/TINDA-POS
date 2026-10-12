# 🛠️ TINDA POS Automation & Tooling Hub

This directory contains build, test, packaging, release automation, and memory MCP tools for the **TINDA POS Desktop** ecosystem.

---

## ⚡ Core Automation Scripts

| Script | Purpose | Command / Usage |
|---|---|---|
| **`check_master_invariants.mjs`** | Pre-flight quality gate verifying git remotes, critical feature files, and database migrations before builds. | `node tools/check_master_invariants.mjs` |
| **`bundle_patch.mjs`** | Packages hot patch zip (`TindaPOS-Feature-Patch-<version>.zip`) from compiled `out/` bundles. | `node tools/bundle_patch.mjs` |
| **`publish_patch.mjs`** | Instant in-app live hot-patch publisher (<1 MB) to GitHub Releases in <10s. | `npm run publish:patch` |
| **`publish_v214.mjs`** | Full Windows production release publisher (Setup `.exe`, Portable `.exe`, blockmaps, checksums). | `node tools/publish_v214.mjs` |
| **`keygen.mjs`** | Ed25519 VIP cryptographic license token and activation code generator. | `node tools/keygen.mjs` |
| **`gen_user_guide.mjs`** | Headless Chrome automated PDF exporter generating printable cashier handbooks. | `npm run docs:pdf` |
| **`brigade_mcp_server.mjs`** | Local Model Context Protocol (MCP) server for long-term project memory and hybrid BM25 vector search. | Built-in MCP Server |

---

## 🔒 Release & Packaging Invariants
1. **Zero Unverified Builds**: Every production packaging step automatically triggers `check_master_invariants.mjs`.
2. **Deterministic Checksums**: All published executable binaries must have accompanying SHA-256 signatures generated and uploaded to GitHub Releases.
3. **Dual-Track Delivery**: Releases are published as both a full standalone installer and a live in-app hot patch for zero-downtime store updates.

---

> Maintained with pride by **Jin** and the TINDA POS Elite Engineering Team.
