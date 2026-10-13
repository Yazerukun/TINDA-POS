# TINDA POS — Release Runbook (quick reference)

> Cheat sheet for the next update. See `PROJECT_PROGRESS.md` for the full history.

## Repo facts
- Repo root: `/mnt/D/TINDA-POS` · branch `master` · remote `origin` = https://github.com/Yazerukun/TINDA-POS
- App internal version stays **1.0.2**; published build id is **v1.0.2 Hotfix 1**
- **Only tag/release that exists now**: `v1.0.2-hotfix.1` (Latest stable). Old `v1.0.0`/`v1.0.1`/`v1.0.2` were deleted on purpose.
- Release page: https://github.com/Yazerukun/TINDA-POS/releases/tag/v1.0.2-hotfix.1

## Gate commands (run in `/mnt/D/TINDA-POS/source`)
```bash
pnpm run lint        # expect 0 errors / 0 warnings
pnpm run typecheck   # expect exit 0
pnpm test            # expect 71/71 passing
pnpm run build       # expect exit 0 (production build)
```

## Doc update recipe (PDF + README)
1. Edit source: `docs/USER-MANUAL.md` (template pins required strings — see `tools/gen_user_guide.mjs`).
2. Regenerate PDF: `npm run docs:pdf` → writes `installers/TindaPOS-User-Guide.pdf`.
3. Sync the PDF to every copy + refresh hashes (they list the old PDF hash otherwise):
   - `installers/TINDA-POS-Windows/TindaPOS-User-Guide.pdf`
   - `installers/TINDA-POS-Windows-v1.0.2/TindaPOS-User-Guide.pdf` (leftover historical dir — update or delete)
   - `installers/TINDA-POS-Windows/SHA256SUMS-1.0.2.txt` and `installers/TINDA-POS-Windows-v1.0.2/SHA256SUMS.txt`
   - update `SHA256SUMS` entries for `TindaPOS-User-Guide.pdf` after computing `sha256sum`
4. Update `README.md` if text changed (download links point at `/releases/latest/download/...`).
5. Commit + push: `git add -A && git commit -m "docs: ..." && git push origin master`.

## Release asset update (doc-only, EXEs unchanged)
- If the next update is **docs/PDF only**, do NOT rebuild the EXEs — keep
  `TindaPOS-Setup-1.0.2.exe` and `TindaPOS-Portable-1.0.2.exe` digests stable:
  - Setup  → sha256 `f47f0835…`
  - Portable → sha256 `57088221…`
- RC staging folder with the current assets (NOT in git):
  `/home/ian/TINDA-POS-v1.0.2-HOTFIX.1-FINAL-RC/` — stage new PDF + SHA256SUMS here, then:
  ```bash
  gh release upload v1.0.2-hotfix.1 --repo Yazerukun/TINDA-POS --clobber \
    TindaPOS-User-Guide.pdf SHA256SUMS.txt
  ```
- Verify asset digests after upload:
  ```bash
  gh release view v1.0.2-hotfix.1 --repo Yazerukun/TINDA-POS --json assets
  ```
- For a brand-new build: rebuild EXEs, bump `SHA256SUMS.txt` for all four files, and upload everything with `--clobber`.

## Known caveats
- `gh release edit` body ≠ repo README. The release page description is the release body (from `docs/RELEASE_NOTES_v1.0.2-hotfix.1.md`), while the repo landing README is `README.md` at repo root — update them separately.
- Deleting a release does NOT delete its tag; always clean the tag too:
  `git push origin --delete <tag>` then `git tag -d <tag>`.
- Native Windows/thermal-printer validation is still pending (needs a real Win10/11 machine).