import type Database from 'better-sqlite3'
import type { StoreSettings } from '@shared/types'

export const defaultSettings: StoreSettings = {
  store_name: 'My Sari-Sari Store',
  owner_name: '',
  address: '',
  phone: '',
  tin: '',
  currency: 'PHP',
  receipt_header: '',
  receipt_title: '',
  receipt_show_app_name: true,
  receipt_footer: 'Thank you for your purchase!',
  logo_path: null,

  default_low_stock: 5,
  default_tax_c: 0,
  allow_negative_inventory: false,
  backup_location: '',
  auto_backup_enabled: true,
  auto_backup_daily: true,
  auto_backup_on_exit: true,
  receipt_printer: '',
  auto_print_after_sale: false,
  receipt_paper_width: '80mm',
  receipt_copies: 1,
  manual_print_dialog: false,
  theme: 'dark',
  data_dir: '',
  lan_network_mode: 'standalone',
  lan_master_ip: '',
  lan_master_port: 3111,
  lan_pairing_pin: '',
  vps_sync_enabled: false,
  vps_server_url: '',
  vps_api_token: '',
  vps_sync_interval_mins: 5,
  cloud_sync_enabled: false,
  cloud_api_url: 'https://tinda-sync.yomikaze-md.workers.dev',
  cloud_store_id: '',
  cloud_sync_key: '',
  cloud_last_synced_at: null,
  cloud_sync_pending: false,
  pos_pinned_categories: [],
  label_printer: '',
  label_paper_size: '40x30',
  // Printer Alignment & Studio Customization Defaults
  receipt_offset_left_mm: 3.5,
  receipt_offset_right_mm: 2.0,
  receipt_feed_lines_end: 3,
  receipt_font_scale: 100,
  receipt_line_spacing: 'balanced',
  receipt_ultra_black: true,
  receipt_custom_header: '',
  receipt_custom_footer: '',
  receipt_show_cashier: true,
  receipt_show_customer: true,
  receipt_show_change_breakdown: true,
  receipt_show_footer_qr: false,
  label_custom_width_mm: 40,
  label_custom_height_mm: 30,
  label_offset_x_mm: 0.0,
  label_offset_y_mm: 0.0,
  label_safe_margin_mm: 1.2,
  label_barcode_height_mm: 26,
  label_barcode_bar_width: 1.3,
  label_price_font_size: 'large',
  label_name_wrap_lines: 1,
  label_show_store_name: true,
  label_show_barcode: true,
  label_show_sku: true,
  label_show_wholesale: false
}

export function parsePinnedCategoryIds(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return Array.from(new Set(raw.map((n) => Number(n)).filter((n) => !isNaN(n) && n > 0)))
  }
  if (typeof raw === 'number' && !isNaN(raw) && raw > 0) {
    return [raw]
  }
  if (typeof raw !== 'string') return []
  const trimmed = raw.trim()
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) {
      return Array.from(new Set(parsed.map((n) => Number(n)).filter((n) => !isNaN(n) && n > 0)))
    }
    if (typeof parsed === 'number' && !isNaN(parsed) && parsed > 0) {
      return [parsed]
    }
  } catch {}

  const cleaned = trimmed.replace(/^\[|\]$/g, '')
  return Array.from(
    new Set(
      cleaned
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0)
    )
  )
}

export function getSettings(db: Database.Database): StoreSettings {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  const out: Record<string, unknown> = { ...defaultSettings }
  for (const key of Object.keys(defaultSettings)) {
    const v = map[key]
    if (v === undefined) continue
    const cur = (out as Record<string, unknown>)[key]
    if (typeof cur === 'number') out[key] = Number(v)
    else if (typeof cur === 'boolean') out[key] = v === '1' || v === 'true'
    else if (key === 'pos_pinned_categories') {
      out[key] = parsePinnedCategoryIds(v)
    } else out[key] = v
  }
  return out as unknown as StoreSettings
}

export function updateSettings(db: Database.Database, patch: Partial<StoreSettings>): StoreSettings {
  const upsert = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  )
  const txn = db.transaction((p: Partial<StoreSettings>) => {
    for (const [k, v] of Object.entries(p ?? {})) {
      let val = ''
      if (typeof v === 'boolean') val = v ? '1' : '0'
      else if (k === 'pos_pinned_categories') {
        val = JSON.stringify(parsePinnedCategoryIds(v))
      } else if (Array.isArray(v)) val = JSON.stringify(v)
      else if (v === null || v === undefined) continue
      else val = String(v)
      upsert.run(k, val)
    }
  })
  txn(patch)
  return getSettings(db)
}

export function setSetting(db: Database.Database, key: string, value: string | number | boolean): void {
  updateSettings(db, { [key]: value } as Partial<StoreSettings>)
}
