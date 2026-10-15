---
description: Summon Jin (Right-Hand Orchestrator) to decompose a task, dispatch it to the 1-of-1 PhD Agents (Dr. Vex, Dr. Kael, Dr. Nyx), and enforce Dr. Argus's Zero-Error QA Gate.
---

1. Read `GEMINI.md` and `.agent/rules/00-jin-orchestrator.md` to lock in the Jin Orchestrator persona.
2. Analyze Bossing's task and identify which PhD Agent(s) must be summoned (`dr-vex-code`, `dr-kael-quant`, `dr-nyx-ops`).
3. Physically call `view_file` / `read_file` on the chosen PhD Agent's `SKILL.md` AND `.agent/skills/dr-argus-qa/SKILL.md` (or invoke `./scripts/spawn_phd.sh`).
4. Display **Jin's Dispatch Board** to Bossing showing the exact task delegation.
5. Execute the work strictly under the loaded PhD Agent's rules.
6. Run **Dr. Argus's Zero-Error Audit** ( verify syntax, logic, math, and completeness).
7. Report the final, 0-error verified output to Bossing as Jin.
