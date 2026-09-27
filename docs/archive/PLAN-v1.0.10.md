# Cash Count gate hotfix

Require a saved Cash Count for the current shift before Z-Read can finalize.
Keep v1.0.9 immutable and preserve the existing updater/provider path.

- [x] Block Z-Read when current shift has no saved Cash Count.
- [x] Update Tagalog manual and README.
- [x] Run tests, typecheck, lint, build and PDF generation.
- [ ] Build canonical Windows artifacts and verify metadata.
- [ ] Publish v1.0.10 and verify public assets.
