/**
 * TINDA POS - Cloudflare Worker Community Chat & Announcements Module
 * Compatible with Cloudflare Workers + D1 Database / KV / Memory Fallback.
 * 
 * Paste this into your `tinda-sync` Cloudflare Worker script.
 */

// --- CORS Headers helper ---
export function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-dev-key',
    'Access-Control-Max-Age': '86400',
  }
}

export function jsonResponse(data, status = 200, request = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(request ? getCorsHeaders(request) : { 'Access-Control-Allow-Origin': '*' })
  }
  return new Response(JSON.stringify(data), { status, headers })
}

// In-memory fallback if D1 or KV not bound
const memoryMessages = [
  {
    id: 'welcome-1',
    store_id: 'system',
    store_name: 'TINDA POS Central',
    sender_name: 'Ian (Dev / Owner)',
    role: 'DEV',
    text: '🎉 Welcome to TINDA POS Global Merchant Lounge! Connect, chat, and share updates nationwide.',
    image_url: null,
    seen_by: [],
    is_dev: 1,
    is_vip: 1,
    created_at: new Date().toISOString()
  }
]

const memoryAnnouncements = [
  {
    id: 'ann-1',
    title: 'TINDA POS v1.0.71 Live Nationwide',
    message: 'Universal store branding, 7-Eleven thermal layout, zero-seconds timestamp standard, and Next-Gen Community Chat are now active!',
    author: 'Ian (Dev / Owner)',
    version_target: 'v1.0.71',
    is_pinned: 1,
    created_at: new Date().toISOString()
  }
]

/**
 * Handle all Community Chat & Live Announcement requests.
 * Returns null if the URL pathname is not a chat route (so existing routes continue).
 */
export async function handleCommunityChatRoutes(request, env) {
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/+$/, '')

  // 1. CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(request)
    })
  }

  // 2. GET /api/announcements
  if (path === '/api/announcements' && request.method === 'GET') {
    if (env && env.DB) {
      try {
        const { results } = await env.DB.prepare(
          'SELECT * FROM live_announcements ORDER BY is_pinned DESC, created_at DESC LIMIT 20'
        ).all()
        return jsonResponse({ ok: true, announcements: results || [] }, 200, request)
      } catch (err) {
        // Fallback if table not initialized yet
      }
    }
    return jsonResponse({ ok: true, announcements: memoryAnnouncements }, 200, request)
  }

  // 3. POST /api/announcements
  if (path === '/api/announcements' && request.method === 'POST') {
    const devKey = request.headers.get('x-dev-key')
    const body = await request.json().catch(() => ({}))
    const effectiveKey = devKey || body.dev_key

    if (!effectiveKey) {
      return jsonResponse({ ok: false, error: 'Unauthorized: Dev Secret Key required' }, 401, request)
    }

    const newAnn = {
      id: 'ann_' + Date.now(),
      title: body.title || 'Announcement',
      message: body.message || '',
      author: body.author || 'Ian (Dev / Owner)',
      version_target: body.version_target || 'v1.0.71',
      is_pinned: 1,
      created_at: new Date().toISOString()
    }

    if (env && env.DB) {
      try {
        await env.DB.prepare(
          'INSERT INTO live_announcements (id, title, message, author, version_target, is_pinned, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(newAnn.id, newAnn.title, newAnn.message, newAnn.author, newAnn.version_target, newAnn.is_pinned, newAnn.created_at).run()
      } catch (err) {
        memoryAnnouncements.unshift(newAnn)
      }
    } else {
      memoryAnnouncements.unshift(newAnn)
    }

    return jsonResponse({ ok: true, announcement: newAnn }, 200, request)
  }

  // 4. GET /api/chat/messages
  if (path === '/api/chat/messages' && request.method === 'GET') {
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '50', 10))

    if (env && env.DB) {
      try {
        const { results } = await env.DB.prepare(
          'SELECT * FROM global_chat_messages ORDER BY created_at DESC LIMIT ?'
        ).bind(limit).all()

        const formatted = (results || []).reverse().map((m) => ({
          ...m,
          seen_by: m.seen_by ? JSON.parse(m.seen_by) : []
        }))
        return jsonResponse({ ok: true, messages: formatted }, 200, request)
      } catch (err) {
        // Fallback
      }
    }
    return jsonResponse({ ok: true, messages: memoryMessages.slice(-limit) }, 200, request)
  }

  // 5. POST /api/chat/messages
  if (path === '/api/chat/messages' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const text = String(body.text || '').trim()
    const imageUrl = body.image_url || null

    if (!text && !imageUrl) {
      return jsonResponse({ ok: false, error: 'Message cannot be empty.' }, 400, request)
    }

    const isDev = body.role === 'DEV' || body.dev_key ? 1 : 0
    const newMsg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      store_id: body.store_id || 'unregistered',
      store_name: body.store_name || 'TINDA Merchant',
      sender_name: isDev ? 'Ian (Dev / Owner)' : (body.sender_name || 'Store Cashier'),
      role: isDev ? 'DEV' : (body.role || 'MERCHANT'),
      text,
      image_url: imageUrl,
      seen_by: [],
      is_dev: isDev,
      is_vip: body.is_vip ? 1 : 0,
      created_at: new Date().toISOString()
    }

    if (env && env.DB) {
      try {
        await env.DB.prepare(
          'INSERT INTO global_chat_messages (id, store_id, store_name, sender_name, role, text, image_url, seen_by, is_dev, is_vip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          newMsg.id,
          newMsg.store_id,
          newMsg.store_name,
          newMsg.sender_name,
          newMsg.role,
          newMsg.text,
          newMsg.image_url,
          JSON.stringify(newMsg.seen_by),
          newMsg.is_dev,
          newMsg.is_vip,
          newMsg.created_at
        ).run()
      } catch (err) {
        memoryMessages.push(newMsg)
      }
    } else {
      memoryMessages.push(newMsg)
    }

    return jsonResponse({ ok: true, message: newMsg }, 200, request)
  }

  // 6. POST /api/chat/messages/seen
  if (path === '/api/chat/messages/seen' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const messageId = String(body.message_id || '').trim()
    const seenBy = String(body.seen_by || 'Cashier').trim()
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

    if (messageId) {
      if (env && env.DB) {
        try {
          const row = await env.DB.prepare('SELECT seen_by FROM global_chat_messages WHERE id = ?').bind(messageId).first()
          if (row) {
            let list = []
            try { list = JSON.parse(row.seen_by || '[]') } catch {}
            if (!list.some((s) => s.name === seenBy)) {
              list.push({ name: seenBy, time })
              await env.DB.prepare('UPDATE global_chat_messages SET seen_by = ? WHERE id = ?').bind(JSON.stringify(list), messageId).run()
            }
          }
        } catch {}
      } else {
        const found = memoryMessages.find((m) => m.id === messageId)
        if (found) {
          if (!found.seen_by) found.seen_by = []
          if (!found.seen_by.some((s) => s.name === seenBy)) {
            found.seen_by.push({ name: seenBy, time })
          }
        }
      }
    }

    return jsonResponse({ ok: true }, 200, request)
  }

  // 7. DELETE /api/chat/messages/:id or POST /api/chat/messages/delete
  if (
    (path.startsWith('/api/chat/messages/') && request.method === 'DELETE') ||
    (path === '/api/chat/messages/delete' && request.method === 'POST')
  ) {
    let msgId = path.split('/api/chat/messages/')[1]
    if (!msgId && request.method === 'POST') {
      const body = await request.json().catch(() => ({}))
      msgId = body.id
    }

    if (msgId && env && env.DB) {
      try {
        await env.DB.prepare('DELETE FROM global_chat_messages WHERE id = ?').bind(msgId).run()
      } catch {}
    } else if (msgId) {
      const idx = memoryMessages.findIndex((m) => m.id === msgId)
      if (idx !== -1) memoryMessages.splice(idx, 1)
    }

    return jsonResponse({ ok: true }, 200, request)
  }

  // Not a chat route - let the main worker router handle it
  return null
}
