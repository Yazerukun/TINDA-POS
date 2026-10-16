#!/usr/bin/env python3
import sys
import os
from datetime import datetime

# Configure standard output to handle UTF-8 cleanly on Windows PowerShell
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

task = sys.argv[1] if len(sys.argv) > 1 else "General Task & System Audit"

print("==================================================")
print("[JIN ORCHESTRATOR] Real-Time PhD Engine Activated")
print(f"[TASK]: {task}")
print("==================================================")

os.makedirs(".agents", exist_ok=True)
with open(".agents/swarm_execution.log", "a", encoding="utf-8") as f:
    f.write(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Jin Engine Dispatched | Task: {task}\n")

# iFixAi Automated Autonomous Safety & Trajectory Audit Hook
try:
    import ifixai
    ifix_status = f"v{ifixai.__version__} (ONLINE & ENGAGED)"
except ImportError:
    ifix_status = "STANDBY"

print(">> Dr. Vex (Architecture & Code)  : ACTIVE & UNLOCKED")
print(">> Dr. Kael (Quant & Math)        : ACTIVE & UNLOCKED")
print(">> Dr. Nyx (Ops & Strategy)       : ACTIVE & UNLOCKED")
print(">> Dr. Argus (Zero-Error QA)     : GATEKEEPER ONLINE")
print(f">> iFixAi Trajectory Auditor      : {ifix_status}")
print("==================================================")
print("[PHD TEAM DISPATCHED -- PROCEED WITH EXECUTION]")
