-- Cloudflare D1 Database Schema for TINDA POS Global Community Lounge & Live Announcements
-- Run this in Cloudflare Dashboard -> Workers & Pages -> D1 -> tinda-sync-db -> Console

CREATE TABLE IF NOT EXISTS global_chat_messages (
  id TEXT PRIMARY KEY,
  store_id TEXT,
  store_name TEXT,
  sender_name TEXT,
  role TEXT DEFAULT 'MERCHANT',
  text TEXT,
  image_url TEXT,
  seen_by TEXT DEFAULT '[]',
  is_dev INTEGER DEFAULT 0,
  is_vip INTEGER DEFAULT 0,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS live_announcements (
  id TEXT PRIMARY KEY,
  title TEXT,
  message TEXT,
  author TEXT,
  version_target TEXT,
  is_pinned INTEGER DEFAULT 1,
  created_at TEXT
);

-- Initial pinned announcement
INSERT OR IGNORE INTO live_announcements (id, title, message, author, version_target, is_pinned, created_at)
VALUES (
  'ann_v1071',
  'TINDA POS v1.0.71 Live Nationwide',
  'Welcome to the TINDA Global Lounge! Connect with fellow merchants nationwide. Universal branding, 7-Eleven thermal receipts, and real-time chat are active.',
  'Ian (Dev / Owner)',
  'v1.0.71',
  1,
  datetime('now')
);
