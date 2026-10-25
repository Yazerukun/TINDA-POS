import fs from 'node:fs'
import path from 'node:path'

const indexPath = path.resolve('tools/cloudflare-worker/tinda-sync/index.js')
const bakPath = path.resolve('tools/cloudflare-worker/tinda-sync/index.js.bak')

// Restore from clean backup
let code = fs.readFileSync(bakPath, 'utf8')

// 1. Update CORS
const oldCorsTarget = `origin:e=>["https://tinda-owner-dashboard.pages.dev","https://yazerukun.github.io","http://localhost:5174","http://localhost:4173"].some(r=>e?.startsWith(r.replace(/\\/+$/,"")))?e:"https://tinda-owner-dashboard.pages.dev",allowMethods:["GET","POST","OPTIONS"],allowHeaders:["Content-Type","Authorization"]`
const newCorsReplacement = `origin:e=>e||"*",allowMethods:["GET","POST","PUT","DELETE","OPTIONS"],allowHeaders:["Content-Type","Authorization","x-dev-key"]`

if (!code.includes(oldCorsTarget)) {
  console.error('Could not find old CORS target in index.js!')
  process.exit(1)
}

code = code.replace(oldCorsTarget, newCorsReplacement)
console.log('✓ Updated CORS middleware')

// 2. Remove old hardcoded announcement
const oldAnnTarget = `y.get("/api/announcements",async e=>{let t=[{id:"ann_v25",title:"TINDA POS v2.2.17 & Cloudflare R2 Sync Active",message:"Seamless offline/online sync with Cloudflare R2 high-speed snapshot caching is now operational.",author:"TINDA Engineering",version_target:"v2.2.17",is_pinned:1,created_at:new Date().toISOString()}];return e.json({ok:!0,announcements:t})});`

if (!code.includes(oldAnnTarget)) {
  console.error('Could not find old announcement target in index.js!')
  process.exit(1)
}

code = code.replace(oldAnnTarget, '// Old announcement route replaced with resilient chat & announcement module\n')
console.log('✓ Removed old hardcoded announcement route')

// 3. Insert Chat & Announcement Module before `var uu=y;export{uu as default};`
const exportTarget = `var uu=y;export{uu as default};`
if (!code.includes(exportTarget)) {
  console.error('Could not find export target in index.js!')
  process.exit(1)
}

const chatModule = `
// ==========================================
// RESILIENT COMMUNITY CHAT & ANNOUNCEMENTS
// (Triple Tier: Cloudflare D1 + Cloudflare KV + Edge Memory Fallback)
// ==========================================

let memoryMessages = [
  {
    id: "msg_welcome",
    store_id: "system",
    store_name: "TINDA POS Central",
    sender_name: "Ian (Founder & Dev)",
    role: "DEV",
    text: "🎉 Welcome to TINDA POS Global Merchant Lounge! Community Chat and Realtime Sync are active nationwide.",
    image_url: null,
    seen_by: [],
    is_dev: 1,
    is_vip: 1,
    created_at: new Date().toISOString()
  }
];

let memoryAnnouncements = [
  {
    id: "ann_v4112",
    title: "TINDA POS v4.1.12 Stable Release Active",
    message: "Pure full build mandate is now standard nationwide. Community Chat and real-time merchant announcements are 100% online.",
    author: "Ian (Founder & Dev)",
    version_target: "v4.1.12",
    is_pinned: 1,
    created_at: new Date().toISOString()
  }
];

async function getChatMessagesFromKV(kv) {
  if (!kv) return null;
  try {
    const data = await kv.get("messages", "json");
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn("KV get chat error:", err);
  }
  return null;
}

async function saveChatMessagesToKV(kv, messages) {
  if (!kv) return;
  try {
    await kv.put("messages", JSON.stringify(messages));
  } catch (err) {
    console.warn("KV put chat error:", err);
  }
}

async function getAnnouncementsFromKV(kv) {
  if (!kv) return null;
  try {
    const data = await kv.get("announcements", "json");
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn("KV get announcements error:", err);
  }
  return null;
}

async function saveAnnouncementsToKV(kv, ann) {
  if (!kv) return;
  try {
    await kv.put("announcements", JSON.stringify(ann));
  } catch (err) {
    console.warn("KV put announcements error:", err);
  }
}

// 1. Announcements
y.get("/api/announcements", async (c) => {
  if (c.env.DB) {
    try {
      const { results } = await c.env.DB.prepare(
        "SELECT * FROM live_announcements ORDER BY is_pinned DESC, created_at DESC LIMIT 20"
      ).all();
      if (results && results.length > 0) {
        return c.json({ ok: true, announcements: results });
      }
    } catch (err) {}
  }
  if (c.env.TINDA_CHAT) {
    try {
      const data = await getAnnouncementsFromKV(c.env.TINDA_CHAT);
      if (Array.isArray(data) && data.length > 0) {
        return c.json({ ok: true, announcements: data });
      }
    } catch {}
  }
  return c.json({ ok: true, announcements: memoryAnnouncements });
});

y.post("/api/announcements", async (c) => {
  const devKey = c.req.header("x-dev-key");
  let body = {};
  try { body = await c.req.json(); } catch {}
  const effectiveKey = devKey || body.dev_key;
  if (!effectiveKey) {
    return c.json({ ok: false, error: "Unauthorized: Dev Secret Key required" }, 401);
  }

  const ann = {
    id: "ann_" + Date.now(),
    title: body.title || "Announcement",
    message: body.message || "",
    author: body.author || "Ian (Founder & Dev)",
    version_target: body.version_target || "v4.1.12",
    is_pinned: 1,
    created_at: new Date().toISOString()
  };

  memoryAnnouncements.unshift(ann);

  if (c.env.DB) {
    try {
      await c.env.DB.prepare(
        "INSERT INTO live_announcements (id, title, message, author, version_target, is_pinned, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(ann.id, ann.title, ann.message, ann.author, ann.version_target, ann.is_pinned, ann.created_at).run();
    } catch (err) {}
  }

  if (c.env.TINDA_CHAT) {
    c.executionCtx.waitUntil(saveAnnouncementsToKV(c.env.TINDA_CHAT, memoryAnnouncements));
  }

  return c.json({ ok: true, announcement: ann });
});

// 2. Chat Messages List
y.get("/api/chat/messages", async (c) => {
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "50", 10)));
  
  // Try D1 first
  if (c.env.DB) {
    try {
      const { results } = await c.env.DB.prepare(
        "SELECT * FROM global_chat_messages ORDER BY created_at DESC LIMIT ?"
      ).bind(limit).all();

      if (results && results.length > 0) {
        const formatted = results.reverse().map((m) => {
          let seen = [];
          try { seen = m.seen_by ? JSON.parse(m.seen_by) : []; } catch {}
          return {
            ...m,
            seen_by: seen
          };
        });

        if (c.env.TINDA_CHAT) {
          c.executionCtx.waitUntil(saveChatMessagesToKV(c.env.TINDA_CHAT, formatted));
        }

        return c.json({ ok: true, messages: formatted });
      }
    } catch (err) {}
  }

  // Try KV persistence
  if (c.env.TINDA_CHAT) {
    try {
      const kvMessages = await getChatMessagesFromKV(c.env.TINDA_CHAT);
      if (Array.isArray(kvMessages) && kvMessages.length > 0) {
        return c.json({ ok: true, messages: kvMessages.slice(-limit) });
      }
    } catch (err) {}
  }

  // Edge memory fallback (never offline)
  return c.json({ ok: true, messages: memoryMessages.slice(-limit) });
});

// 3. Post Chat Message
y.post("/api/chat/messages", async (c) => {
  let body = {};
  try { body = await c.req.json(); } catch {}
  const text = String(body.text || "").trim();
  const imageUrl = body.image_url || null;

  if (!text && !imageUrl) {
    return c.json({ ok: false, error: "Message cannot be empty." }, 400);
  }

  const isDev = (body.role === "DEV" || body.dev_key) ? 1 : 0;
  const msg = {
    id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    store_id: body.store_id || "unregistered",
    store_name: body.store_name || "TINDA Merchant",
    sender_name: isDev ? "Ian (Founder & Dev)" : (body.sender_name || "Store Cashier"),
    role: isDev ? "DEV" : (body.role || "MERCHANT"),
    text,
    image_url: imageUrl,
    seen_by: [],
    is_dev: isDev,
    is_vip: body.is_vip ? 1 : 0,
    created_at: new Date().toISOString()
  };

  memoryMessages.push(msg);
  if (memoryMessages.length > 200) {
    memoryMessages = memoryMessages.slice(-200);
  }

  if (c.env.DB) {
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
    } catch (err) {}
  }

  if (c.env.TINDA_CHAT) {
    c.executionCtx.waitUntil((async () => {
      try {
        let current = await getChatMessagesFromKV(c.env.TINDA_CHAT);
        if (!Array.isArray(current)) {
          current = memoryMessages.slice();
        } else {
          current.push(msg);
          if (current.length > 200) current = current.slice(-200);
        }
        await saveChatMessagesToKV(c.env.TINDA_CHAT, current);
      } catch (err) {}
    })());
  }

  return c.json({ ok: true, message: msg });
});

// 4. Mark Message Seen
y.post("/api/chat/messages/seen", async (c) => {
  let body = {};
  try { body = await c.req.json(); } catch {}
  const messageId = String(body.message_id || "").trim();
  const seenBy = String(body.seen_by || "Cashier").trim();
  const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  if (messageId) {
    const memMsg = memoryMessages.find((m) => m.id === messageId);
    if (memMsg) {
      if (!Array.isArray(memMsg.seen_by)) memMsg.seen_by = [];
      if (!memMsg.seen_by.some((s) => s.name === seenBy)) {
        memMsg.seen_by.push({ name: seenBy, time });
      }
    }

    if (c.env.DB) {
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

    if (c.env.TINDA_CHAT) {
      c.executionCtx.waitUntil((async () => {
        try {
          const current = await getChatMessagesFromKV(c.env.TINDA_CHAT);
          if (Array.isArray(current)) {
            const target = current.find((m) => m.id === messageId);
            if (target) {
              if (!Array.isArray(target.seen_by)) target.seen_by = [];
              if (!target.seen_by.some((s) => s.name === seenBy)) {
                target.seen_by.push({ name: seenBy, time });
                await saveChatMessagesToKV(c.env.TINDA_CHAT, current);
              }
            }
          }
        } catch {}
      })());
    }
  }

  return c.json({ ok: true });
});

// 5. Delete Message
async function handleDeleteMessage(c, msgId) {
  if (msgId) {
    memoryMessages = memoryMessages.filter((m) => m.id !== msgId);

    if (c.env.DB) {
      try {
        await c.env.DB.prepare("DELETE FROM global_chat_messages WHERE id = ?").bind(msgId).run();
      } catch (err) {}
    }

    if (c.env.TINDA_CHAT) {
      c.executionCtx.waitUntil((async () => {
        try {
          const current = await getChatMessagesFromKV(c.env.TINDA_CHAT);
          if (Array.isArray(current)) {
            const filtered = current.filter((m) => m.id !== msgId);
            await saveChatMessagesToKV(c.env.TINDA_CHAT, filtered);
          }
        } catch {}
      })());
    }
  }
  return c.json({ ok: true });
}

y.delete("/api/chat/messages/:id", async (c) => {
  return handleDeleteMessage(c, c.req.param("id"));
});

y.post("/api/chat/messages/delete", async (c) => {
  let body = {};
  try { body = await c.req.json(); } catch {}
  return handleDeleteMessage(c, body.id);
});

`

code = code.replace(exportTarget, `${chatModule}\n${exportTarget}`)
fs.writeFileSync(indexPath, code, 'utf8')
console.log('✓ Successfully patched tinda-sync/index.js with KV + Memory + D1 Community Chat & Announcements!')
