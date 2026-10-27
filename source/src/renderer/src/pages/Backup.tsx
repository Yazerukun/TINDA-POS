import { useEffect, useState } from 'react'
import { Plus, RotateCcw, FolderOpen, HardDriveDownload, Cloud, Save, HelpCircle, Crown, FileSpreadsheet } from 'lucide-react'
import type { BackupInfo, StoreSettings } from '@shared/types'
import { shortDateTime } from '@shared/format'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { toastSuccess, toastError } from '../stores/toast'
import { useGuide } from '../stores/guide'
import { RollbackModal } from '../components/update/RollbackModal'

export function Backup(): React.JSX.Element {
  const [rows, setRows] = useState<BackupInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<BackupInfo | null>(null)
  const [rollbackOpen, setRollbackOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)

  const handleExportExcel = async () => {
    setExportingExcel(true)
    try {
      const res = await window.api.products.exportExcel()
      toastSuccess('Excel Export Ready', `${res.rows} items exported. Opening spreadsheet...`)
      try {
        await window.api.app.openPath(res.path)
      } catch {
        await window.api.app.revealPath(res.path)
      }
    } catch (e) {
      toastError('Export failed', String((e as Error)?.message || e))
    } finally {
      setExportingExcel(false)
    }
  }
  const [settings, setSettings] = useState<StoreSettings | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [backups, currentSettings] = await Promise.all([window.api.backup.list(), window.api.settings.get()])
      setRows(backups)
      setSettings(currentSettings)
    } catch (e) { toastError('Failed to load backups', String((e as Error)?.message || e)) } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const create = async () => {
    setBusy(true)
    try {
      const b = await window.api.backup.create('manual')
      toastSuccess('Backup created', b.filename)
      void load()
    } catch (e) { toastError('Backup failed', String((e as Error)?.message || e)) } finally { setBusy(false) }
  }

  const restore = async (b: BackupInfo) => {
    setBusy(true)
    try {
      await window.api.backup.restore(b.filename)
      toastSuccess('Backup restored', 'TINDA POS is restarting...')
      setConfirm(null)
    } catch (e) { toastError('Restore failed', String((e as Error)?.message || e)) } finally { setBusy(false) }
  }

  const chooseSyncFolder = async () => {
    const folder = await window.api.backup.selectSyncFolder()
    if (folder) setSettings((current) => current ? { ...current, backup_location: folder } : current)
  }

  const saveSyncSettings = async () => {
    if (!settings) return
    setBusy(true)
    try {
      const updated = await window.api.settings.update({
        backup_location: settings.backup_location,
        auto_backup_enabled: settings.auto_backup_enabled,
        auto_backup_daily: settings.auto_backup_daily,
        auto_backup_on_exit: settings.auto_backup_on_exit
      })
      setSettings(updated)
      toastSuccess('Backup settings saved')
    } catch (e) { toastError('Save failed', String((e as Error)?.message || e)) } finally { setBusy(false) }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Backup & Restore"
        subtitle="Your data is stored offline on this computer."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => useGuide.getState().openGuide('backup')} className="btn-ghost flex items-center gap-2 text-amber-300 hover:text-amber-200">
              <HelpCircle className="h-4 w-4 text-amber-400" /> Backup Guide
            </button>
            <button onClick={() => setRollbackOpen(true)} className="btn-ghost flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 border border-amber-500/20" title="Safely downgrade or restore a previous version of TINDA POS (VIP Pro Protected)">
              <RotateCcw className="h-3.5 w-3.5 text-amber-400" /> Version Rollback <Crown className="h-3 w-3 text-amber-400" />
            </button>
            <button
              onClick={() => void handleExportExcel()}
              disabled={exportingExcel}
              className="btn-ghost flex items-center gap-2 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30"
              title="Export complete inventory and backup data to Microsoft Excel (.csv)"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> {exportingExcel ? 'Exporting...' : 'Export to Excel'}
            </button>
            <button onClick={() => void create()} disabled={busy} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4" /> Back Up Now</button>
          </div>
        }
      />

      <div className="card mb-4 max-w-3xl p-4 bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-transparent border-emerald-500/30 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-100">Microsoft Excel Export & Live Sync</p>
                <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-bold tracking-wider">Excel Ready</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Export your store inventory, bodega stock, costs, selling prices, and multi-unit packaging into a formatted Excel spreadsheet (.csv). Open directly in Microsoft Excel or link with Excel Power Query for automatic live sync.
              </p>
            </div>
          </div>
          <button
            onClick={() => void handleExportExcel()}
            disabled={exportingExcel}
            className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 whitespace-nowrap self-start sm:self-center shadow-md font-semibold"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exportingExcel ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      </div>

      {settings && (
        <div className="card mb-4 max-w-3xl p-4">
          <div className="mb-3 flex items-start gap-3">
            <Cloud className="mt-0.5 h-5 w-5 text-brand-400" />
            <div>
              <p className="font-semibold text-slate-100">Automatic online backup</p>
              <p className="text-xs text-slate-500">Choose a folder inside OneDrive, Google Drive for desktop, or Dropbox. TINDA POS copies backups there and the Windows sync app uploads them whenever internet is available.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input readOnly value={settings.backup_location} placeholder="No synced folder selected" className="input min-w-72 flex-1" />
            <button onClick={() => void chooseSyncFolder()} disabled={busy} className="btn-ghost"><FolderOpen className="mr-1 inline h-4 w-4" /> Choose Folder</button>
            {settings.backup_location && <button onClick={() => void window.api.backup.openSyncFolder()} className="btn-ghost">Open</button>}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.auto_backup_enabled} onChange={(e) => setSettings({ ...settings, auto_backup_enabled: e.target.checked })} /> Enable synced backups</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.auto_backup_daily} onChange={(e) => setSettings({ ...settings, auto_backup_daily: e.target.checked })} /> Daily on app start</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.auto_backup_on_exit} onChange={(e) => setSettings({ ...settings, auto_backup_on_exit: e.target.checked })} /> On app exit</label>
          </div>
          <button onClick={() => void saveSyncSettings()} disabled={busy} className="btn-primary mt-3 flex items-center gap-2"><Save className="h-4 w-4" /> Save Backup Settings</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-14 animate-pulse" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState title="No backups yet" message="Create your first backup to protect your data." action={<button onClick={() => void create()} className="btn-primary"><Plus className="mr-1 inline h-4 w-4" /> Back Up Now</button>} icon={<HardDriveDownload className="h-7 w-7" />} />
      ) : (
        <>
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            <span className="font-semibold">{rows.length} backups</span>{rows[0] && <> · latest {shortDateTime(rows[0].created_at)}</>}
          </div>
          <div className="card overflow-hidden">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="w-[38%] py-3 px-3 text-center align-middle">Filename</th>
                  <th className="w-[22%] py-3 px-3 text-center align-middle">Date</th>
                  <th className="w-[14%] py-3 px-3 text-center align-middle">Size</th>
                  <th className="w-[12%] py-3 px-3 text-center align-middle">Type</th>
                  <th className="w-[14%] py-3 px-3 text-center align-middle">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.filename}>
                    <td className="w-[38%] py-3 px-3 text-center align-middle font-medium text-slate-200 truncate" title={b.filename}>{b.filename}</td>
                    <td className="w-[22%] py-3 px-3 text-center align-middle text-slate-400 text-xs">{shortDateTime(b.created_at)}</td>
                    <td className="w-[14%] py-3 px-3 text-center align-middle text-slate-400 text-xs">{formatBytes(b.size)}</td>
                    <td className="w-[12%] py-3 px-3 text-center align-middle">
                      <span className="badge bg-ink-700 text-slate-300 inline-flex items-center justify-center">manual</span>
                    </td>
                    <td className="w-[14%] py-3 px-3 text-center align-middle">
                      <div className="flex items-center justify-center">
                        <button onClick={() => setConfirm(b)} className="btn-ghost-2 inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs"><RotateCcw className="h-3.5 w-3.5" /> Restore</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => void window.api.backup.openFolder()} className="btn-ghost mt-3 flex items-center gap-2 text-xs"><FolderOpen className="h-4 w-4" /> Open backup folder</button>
        </>
      )}

      {confirm && (
        <Modal open onClose={() => setConfirm(null)} title="Restore Backup" maxWidth="max-w-sm" footer={
          <>
            <button onClick={() => setConfirm(null)} className="btn-ghost">Cancel</button>
            <button onClick={() => void restore(confirm)} disabled={busy} className="btn-danger">Restore</button>
          </>
        }>
          <p className="text-sm text-amber-400">Restoring will overwrite current data with the backup from {shortDateTime(confirm.created_at)}. A safety backup will be made first, then TINDA POS will restart automatically.</p>
        </Modal>
      )}

      <RollbackModal
        open={rollbackOpen}
        onClose={() => setRollbackOpen(false)}
        currentVersion="1.0.56"
      />
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let n = bytes
  let i = 0
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(1)} ${units[i]}`
}
