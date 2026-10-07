# TINDA POS Agent Instructions

Before any TINDA POS release-related work, read these files completely:

- `docs/RELEASE-WORKFLOW.md`
- `docs/RELEASE-STATE.md`

Treat `docs/RELEASE-STATE.md` as release memory, resume from the next incomplete stage, and never repeat a passed stage without an invalidation reason defined in the workflow. Update the state after every completed stage. Never push, tag, publish, upload release assets, or change Latest without explicit owner approval after the final release review passes.

## Agent Coordination

Three engineers share this workspace. The repository owner (human) assigns tasks; agents execute only assigned work.

| Engineer | Lane |
|---|---|
| OpenCode | Front-end design: React/Tailwind UI, components, layout, styling, animations |
| Antigravity CLI (`agy`) | Fixing, code review, testing (vitest, typecheck, master invariants) |
| Kiro | Spec + documentation: specs, requirements/design docs, user manuals, release notes, steering |

### Claim protocol (single source of truth: `C:\Users\mtafl\Desktop\TINDA\.agents\memory\session.md`)

The claim file lives at the **workspace root** (`Desktop\TINDA\.agents\memory\session.md`), NOT inside `TINDA-POS-Source`. Never create another copy under `TINDA-POS-Source\.agents`.

1. Before starting any work, write the claim under `## Active Claim`:
   `IN PROGRESS: <task> | <opencode|agy> | <YYYY-MM-DD HH:MM>`
2. If another agent's claim is live, do not touch files — park the request and tell the owner.
3. A claim older than 2 hours is stale: take over and note the takeover in the claim line.
4. On finish: clear the claim and append a handoff summary (done / next / files touched) to the session memory.

### Git discipline

- `git pull` before starting.
- Commit with `[opencode] ` or `[agy] ` prefix; small, frequent commits.
- No `git push` while the other agent's claim is live.
- Release lock: build, version bump (GEMINI.md rule #10), tag, and publish run as ONE pipeline under a `RELEASE` claim, only after explicit owner approval.

### Realtime handoff (OpenCode → agy)

OpenCode passes finalized front-end work to Antigravity for review/fix/test by spawning headless `agy` from `TINDA-POS-Source/`:

```
agy -p "Finalizing brief: <what changed, files touched, what to verify>. Review the changes, fix any issues found, then run: npm run typecheck, npm test, node tools/check_master_invariants.mjs. Report findings and test status." --output-format json --print-timeout 15m
```

Relay the JSON `response` to the owner and record the outcome in `.agents/memory/session.md`. Headless runs rely on `permissions.allow` in `~/.gemini/antigravity-cli/settings.json` (already wildcarded) — never pass `--dangerously-skip-permissions` unless the owner approves it for a specific run.
