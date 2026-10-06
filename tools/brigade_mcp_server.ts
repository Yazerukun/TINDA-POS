import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { Tideline } from "../../brigade/src/tideline/index.js";
import { createMemoryMcpServer, runMemoryMcpStdio } from "../../brigade/src/tideline/transports/mcp/memory-mcp-server.js";

const memoryDir = process.env.BRIGADE_MEMORY_DIR || path.join(os.homedir(), ".brigade", "memory");
if (!fs.existsSync(memoryDir)) {
  fs.mkdirSync(memoryDir, { recursive: true });
}

const tide = Tideline.open(memoryDir);
if (tide.ready) {
  await tide.ready();
}

const server = createMemoryMcpServer(tide, {
  origin: { kind: "owner" },
  serverName: "brigade-tideline",
  serverVersion: "1.39.0"
});

process.stderr.write(`[Brigade v1.39.0] Tideline memory server running over stdio at ${memoryDir}\n`);
await runMemoryMcpStdio(server);
