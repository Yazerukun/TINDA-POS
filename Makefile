# TINDA POS v1.0.37 Developer Makefile
# Fast shortcuts for everyday workflows

.PHONY: help dev test typecheck build-win keygen clean status

help:
	@echo "========================================================"
	@echo "  💎 TINDA POS v1.0.37 — Developer Workflow Engine"
	@echo "========================================================"
	@echo "  make dev        Run local dev environment with Vite HMR"
	@echo "  make test       Run full unit test suite (332 tests)"
	@echo "  make typecheck  Run TypeScript typecheck (Node & Web)"
	@echo "  make keygen     Run VIP Pro license generator (wl-copy)"
	@echo "  make build-win  Build Windows NSIS & Portable executables"
	@echo "  make clean      Clean temporary build caches"
	@echo "  make status     Show Git branch, status, and app version"
	@echo "========================================================"

dev:
	cd source && npm run dev

test:
	cd source && npm run test

typecheck:
	cd source && npm run typecheck

keygen:
	@if [ -x "$$HOME/.local/bin/tinda-keygen" ]; then \
		$$HOME/.local/bin/tinda-keygen; \
	else \
		node tools/keygen.mjs; \
	fi

build-win:
	cd source && npm run build:win

clean:
	rm -rf source/out source/dist
	@echo "Build cache cleaned successfully."

status:
	@echo "--- Project Version ---"
	@node -p "require('./source/package.json').version"
	@echo "--- Git Branch & Status ---"
	@git branch --show-current
	@git status -s
