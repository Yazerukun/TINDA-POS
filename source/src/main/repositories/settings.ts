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
  receipt_footer: 'Salamat po!',
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
  receipt_paper_width: '58mm',
  receipt_copies: 1,
  theme: 'dark',
  data_dir: ''
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
    else out[key] = v
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
