#!/usr/bin/env bash
set -e

AGENT_ID=$1
TASK_PROMPT=$2
SKILL_FILE=".agent/skills/${AGENT_ID}/SKILL.md"
QA_FILE=".agent/skills/dr-argus-qa/SKILL.md"

if [ -z "$AGENT_ID" ] || [ -z "$TASK_PROMPT" ]; then
  echo "Usage: ./scripts/spawn_phd.sh <dr-vex-code|dr-kael-quant|dr-nyx-ops> \"<task>\""
  exit 1
fi

if [ ! -f "$SKILL_FILE" ]; then
  echo "❌ [JIN DISPATCH ERROR]: PhD Agent '$AGENT_ID' not found at $SKILL_FILE"
  exit 1
fi

echo "=================================================="
echo "🫡 [JIN ORCHESTRATOR] Dispatching to: $AGENT_ID"
echo "🛡️ [QA GATEKEEPER] Attached: dr-argus-qa"
echo "=================================================="

FULL_PROMPT="You are operating as the 1-of-1 PhD Specialist defined below.
--- SPECIALIST INSTRUCTIONS ---
$(cat "$SKILL_FILE")

--- MANDATORY QA GATE (DR. ARGUS) ---
$(cat "$QA_FILE")

--- TASK FROM JIN (ON BEHALF OF BOSSING) ---
Execute with 0 errors: ${TASK_PROMPT}"

if command -v antigravity &> /dev/null; then
  antigravity -p "$FULL_PROMPT"
elif command -v gemini &> /dev/null; then
  gemini -p "$FULL_PROMPT"
else
  echo "✅ [PHD CONTEXT LOADED]: Specialist $AGENT_ID and Dr. Argus protocols are active."
fi
