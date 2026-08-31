import { useEffect, useState } from 'react'
import { Plus, RotateCcw, FolderOpen, HardDriveDownload } from 'lucide-react'
import type { BackupInfo } from '@shared/types'
import { shortDateTime } from '@shared/format'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { toastSuccess, toastError } from '../stores/toast'

export function Backup(): React.JSX.Element {
  const [rows, setRows] = useState<BackupInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<BackupInfo | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    try { setRows(await window.api.backup.list()) } catch (e) { toastError('Failed to load backups', String((e as Error)?.message || e)) } finally { setLoading(false) }
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
      toastSuccess('Backup restored')
      setConfirm(null)
      void load()
    } catch (e) { toastError('Restore failed', String((e as Error)?.message || e)) } finally { setBusy(false) }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Backup & Restore"
        subtitle="Your data is stored offline on this computer."
        actions={
          <button onClick={() => void create()} disabled={busy} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4" /> Back Up Now</button>
        }
      />

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
            <table className="table">
              <thead><tr><th>Filename</th><th>Date</th><th>Size</th><th>Type</th><th className="w-40">Actions</th></tr></thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.filename}>
                    <td className="font-medium text-slate-200">{b.filename}</td>
                    <td className="text-slate-400">{shortDateTime(b.created_at)}</td>
                    <td className="text-slate-400">{formatBytes(b.size)}</td>
                    <td><span className="badge bg-ink-700 text-slate-300">manual</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => setConfirm(b)} className="btn-ghost-2 flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs"><RotateCcw className="h-3.5 w-3.5" /> Restore</button>
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
          <p className="text-sm text-amber-400">Restoring will overwrite current data with the backup from {shortDateTime(confirm.created_at)}. A safety backup will be made first.</p>
        </Modal>
      )}
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