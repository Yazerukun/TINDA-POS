#!/usr/bin/env bash
# TINDA POS development environment. Source this file to get pnpm + caches on Drive D:.
export TINDA_ROOT="/mnt/D/TINDA-POS"
export PATH="$TINDA_ROOT/tools/pnpm/bin:$PATH"
export PNPM_STORE_DIR="$TINDA_ROOT/pnpm-store"
export npm_config_cache="$TINDA_ROOT/npm-cache"
export ELECTRON_CACHE="$TINDA_ROOT/electron-cache/electron"
export ELECTRON_BUILDER_CACHE="$TINDA_ROOT/electron-cache/electron-builder"
export TINDA_DATA_DIR="$TINDA_ROOT/test-data"