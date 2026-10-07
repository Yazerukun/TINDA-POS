import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const rawPath = path.resolve('tools/cloudflare-worker/tinda-sync-current.js')
const rawContent = fs.readFileSync(rawPath, 'utf8')
const lines = rawContent.split('\n')

// Extract index.js code lines (start after boundary header, stop before boundary footer)
let startIndex = 0
for (let i = 0; i < 10; i++) {
  if (lines[i].startsWith('var __defProp') || lines[i].includes('Object.defineProperty')) {
    startIndex = i
    break
  }
}

let endIndex = lines.length - 1
for (let i = lines.length - 1; i >= lines.length - 10; i--) {
  if (lines[i].includes('//# sourceMappingURL=')) {
    endIndex = i
    break
  }
}

console.log(`Extracting lines ${startIndex} to ${endIndex}...`)
let codeLines = lines.slice(startIndex, endIndex + 1)
let code = codeLines.join('\n')

// Update CORS in code
const oldCors = `app.use("*", cors({
  origin: (origin) => {
    const allowed = [
      "https://tinda-owner-dashboard.pages.dev",
      "https://yazerukun.github.io",
      "http://localhost:5174",
      "http://localhost:4173"
    ];
    return allowed.some((a) => origin?.startsWith(a.replace(/\\/+$/, ""))) ? origin : "https://tinda-owner-dashboard.pages.dev";
  },
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));`

const newCors = `app.use("*", cors({
  origin: (origin) => origin || "*",
  allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "x-dev-key"],
  credentials: true
}));`

if (code.includes('allowMethods: ["GET", "POST", "OPTIONS"],')) {
  code = code.replace(
    'allowMethods: ["GET", "POST", "OPTIONS"],',
    'allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],'
  )
}
if (code.includes('allowHeaders: ["Content-Type", "Authorization"],')) {
  code = code.replace(
    'allowHeaders: ["Content-Type", "Authorization"],',
    'allowHeaders: ["Content-Type", "Authorization", "x-dev-key"],'
  )
}

// Routes to append
const chatRoutes = `
// ==========================================
// VIP PRO COMMUNITY CHAT & LIVE ANNOUNCEMENTS
// ==========================================

app.get("/api/announcements", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM live_announcements ORDER BY is_pinned DESC, created_at DESC LIMIT 20"
    ).all();
    return c.json({ ok: true, announcements: results || [] });
  } catch (err) {
    return c.json({ ok: true, announcements: [] });
  }
});

app.post("/api/announcements", async (c) => {
  const devKey = c.req.header("x-dev-key");
  let body = {};
  try { body = await c.req.json(); } catch {}
  if (!devKey && !body.dev_key) {
    return c.json({ ok: false, error: "Unauthorized: Dev Secret Key required" }, 401);
  }
  const ann = {
    id: "ann_" + Date.now(),
    title: body.title || "Announcement",
    message: body.message || "",
    author: body.author || "Ian (Dev / Owner)",
    version_target: body.version_target || "v1.0.71",
    is_pinned: 1,
    created_at: new Date().toISOString()
  };
  try {
    await c.env.DB.prepare(
      "INSERT INTO live_announcements (id, title, message, author, version_target, is_pinned, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(ann.id, ann.title, ann.message, ann.author, ann.version_target, ann.is_pinned, ann.created_at).run();
  } catch (err) {}
  return c.json({ ok: true, announcement: ann });
});

app.get("/api/chat/messages", async (c) => {
  const limit = Math.min(100, parseInt(c.req.query("limit") || "50", 10));
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM global_chat_messages ORDER BY created_at DESC LIMIT ?"
    ).bind(limit).all();
    const formatted = (results || []).reverse().map((m) => {
      let seen = [];
      try { seen = m.seen_by ? JSON.parse(m.seen_by) : []; } catch {}
      return {
        ...m,
        seen_by: seen
      };
    });
    return c.json({ ok: true, messages: formatted });
  } catch (err) {
    return c.json({ ok: true, messages: [] });
  }
});

app.post("/api/chat/messages", async (c) => {
  let body = {};
  try { body = await c.req.json(); } catch {}
  const text = String(body.text || "").trim();
  const imageUrl = body.image_url || null;
  if (!text && !imageUrl) {
    return c.json({ ok: false, error: "Message cannot be empty." }, 400);
  }
  const isDev = body.role === "DEV" || body.dev_key ? 1 : 0;
  const msg = {
    id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    store_id: body.store_id || "unregistered",
    store_name: body.store_name || "TINDA Merchant",
    sender_name: isDev ? "Ian (Dev / Owner)" : (body.sender_name || "Store Cashier"),
    role: isDev ? "DEV" : (body.role || "MERCHANT"),
    text,
    image_url: imageUrl,
    seen_by: [],
    is_dev: isDev,
    is_vip: body.is_vip ? 1 : 0,
    created_at: new Date().toISOString()
  };
  try {
    await c.env.DB.prepare(
      "INSERT INTO global_chat_messages (id, store_id, store_name, sender_name, role, text, image_url, seen_by, is_dev, is_vip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      msg.id,
      msg.store_id,
      msg.store_name,
      msg.sender_name,
      msg.role,
      msg.text,
      msg.image_url,
      JSON.stringify(msg.seen_by),
      msg.is_dev,
      msg.is_vip,
      msg.created_at
    ).run();
  } catch (err) {
    return c.json({ ok: false, error: "Failed to persist chat message: " + err.message }, 500);
  }
  return c.json({ ok: true, message: msg });
});

app.post("/api/chat/messages/seen", async (c) => {
  let body = {};
  try { body = await c.req.json(); } catch {}
  const messageId = String(body.message_id || "").trim();
  const seenBy = String(body.seen_by || "Cashier").trim();
  const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  if (messageId) {
    try {
      const row = await c.env.DB.prepare("SELECT seen_by FROM global_chat_messages WHERE id = ?").bind(messageId).first();
      if (row) {
        let list = [];
        try { list = JSON.parse(row.seen_by || "[]"); } catch {}
        if (!list.some((s) => s.name === seenBy)) {
          list.push({ name: seenBy, time });
          await c.env.DB.prepare("UPDATE global_chat_messages SET seen_by = ? WHERE id = ?").bind(JSON.stringify(list), messageId).run();
        }
      }
    } catch (err) {}
  }
  return c.json({ ok: true });
});

app.delete("/api/chat/messages/:id", async (c) => {
  const msgId = c.req.param("id");
  if (msgId) {
    try {
      await c.env.DB.prepare("DELETE FROM global_chat_messages WHERE id = ?").bind(msgId).run();
    } catch (err) {}
  }
  return c.json({ ok: true });
});

app.post("/api/chat/messages/delete", async (c) => {
  let body = {};
  try { body = await c.req.json(); } catch {}
  const msgId = body.id;
  if (msgId) {
    try {
      await c.env.DB.prepare("DELETE FROM global_chat_messages WHERE id = ?").bind(msgId).run();
    } catch (err) {}
  }
  return c.json({ ok: true });
});
`

const insertionMarker = 'var src_default = app;'
if (!code.includes(insertionMarker)) {
  throw new Error(`Marker "${insertionMarker}" not found in extracted code!`)
}

code = code.replace(insertionMarker, `${chatRoutes}\n${insertionMarker}`)

// Ensure target dir
const outDir = path.resolve('tools/cloudflare-worker/tinda-sync')
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

fs.writeFileSync(path.join(outDir, 'index.js'), code, 'utf8')
console.log('Written:', path.join(outDir, 'index.js'))

const wranglerToml = `name = "tinda-sync"
main = "index.js"
compatibility_date = "2024-10-22"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "tinda-sync-db"
database_id = "74f850c3-d414-4ae6-9cd9-23a1448a887b"

[vars]
ENVIRONMENT = "development"
SESSION_SECRET = "change-this-in-production-use-wrangler-secret"
`

fs.writeFileSync(path.join(outDir, 'wrangler.toml'), wranglerToml, 'utf8')
console.log('Written:', path.join(outDir, 'wrangler.toml'))
console.log('Ready for wrangler deploy!')
