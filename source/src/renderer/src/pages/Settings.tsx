import { useEffect, useState } from 'react'
import { Save, Store, Receipt, Users, UserPlus, Pencil, KeyRound, Heart, Coffee, Copy, DatabaseZap, FolderOpen, HardDriveDownload, RotateCcw, Printer, Database, RefreshCw, Loader2, Download, Sparkles, Cloud, Key, Globe, Eye, EyeOff, ShieldCheck, BookOpen } from 'lucide-react'
import type { BackupInfo, User } from '@shared/types'
import type { DataLocationStatus, PrinterChoice } from '@shared/ipc'
import { printerPick, printerStatusLabel } from '@shared/printer'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'
import { useSettings } from '../stores/settings'
import { toastSuccess, toastError } from '../stores/toast'
import { useUpdate } from '../stores/update'
import { ReceiptPaper } from '../components/ReceiptPaper'

type Tab = 'HOME' | 'RECEIPT' | 'USERS' | 'DATA' | 'CLOUD' | 'ABOUT'

export function Settings(): React.JSX.Element {
  const { load } = useSettings()
  const [tab, setTab] = useState<Tab>('HOME')

  useEffect(() => { void load() }, [load])

  return (
    <div className="p-6">
      <PageHeader title="Settings" />
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setTab('HOME')} className={`btn-ghost flex items-center gap-2 ${tab === 'HOME' ? '!border-brand-500 !text-brand-400' : ''}`}><Store className="h-4 w-4" /> Store</button>
        <button onClick={() => setTab('RECEIPT')} className={`btn-ghost flex items-center gap-2 ${tab === 'RECEIPT' ? '!border-brand-500 !text-brand-400' : ''}`}><Receipt className="h-4 w-4" /> Receipt</button>
        <button onClick={() => setTab('USERS')} className={`btn-ghost flex items-center gap-2 ${tab === 'USERS' ? '!border-brand-500 !text-brand-400' : ''}`}><Users className="h-4 w-4" /> Users</button>
        <button onClick={() => setTab('DATA')} className={`btn-ghost flex items-center gap-2 ${tab === 'DATA' ? '!border-brand-500 !text-brand-400' : ''}`}><DatabaseZap className="h-4 w-4" /> Data</button>
        <button onClick={() => setTab('CLOUD')} className={`btn-ghost flex items-center gap-2 ${tab === 'CLOUD' ? '!border-amber-500 !text-amber-400 font-bold' : ''}`}><Cloud className="h-4 w-4 text-amber-400" /> Cloud Dashboard (VIP)</button>
        <button onClick={() => setTab('ABOUT')} className={`btn-ghost flex items-center gap-2 ${tab === 'ABOUT' ? '!border-brand-500 !text-brand-400' : ''}`}><Heart className="h-4 w-4" /> About</button>
      </div>
      {tab === 'HOME' && <StoreSettingsTab />}
      {tab === 'RECEIPT' && <ReceiptSettingsTab />}
      {tab === 'USERS' && <UsersTab />}
      {tab === 'DATA' && <DataTab />}
      {tab === 'CLOUD' && <CloudDashboardTab />}
      {tab === 'ABOUT' && <AboutTab />}
    </div>
  )
}

function DataTab(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [newStoreOpen, setNewStoreOpen] = useState(false)
  const [portableOpen, setPortableOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [newStoreConfirmation, setNewStoreConfirmation] = useState('')
  const [resetting, setResetting] = useState(false)
  const [databaseFile, setDatabaseFile] = useState('Loading...')
  const [backupDir, setBackupDir] = useState('Loading...')
  const [backups, setBackups] = useState<BackupInfo[] | null>(null)
  const [location, setLocation] = useState<DataLocationStatus | null>(null)

  useEffect(() => {
    void Promise.all([window.api.app.databaseFile(), window.api.backup.dir(), window.api.backup.locationStatus()]).then(([database, backup, status]) => {
      setDatabaseFile(database)
      setBackupDir(backup)
      setLocation(status)
    }).catch((e) => toastError('Could not load data locations', String((e as Error)?.message || e)))
  }, [])

  const backupNow = async () => {
    try { const backup = await window.api.backup.create('Settings Data page'); toastSuccess('Safety backup created', backup.filename) }
    catch (e) { toastError('Backup failed', String((e as Error)?.message || e)) }
  }

  const showRestore = async () => {
    try { setBackups(await window.api.backup.list()) }
    catch (e) { toastError('Could not load backups', String((e as Error)?.message || e)) }
  }

  const restore = async (backup: BackupInfo) => {
    if (!window.confirm(`Restore ${backup.filename}? Current data will be safety-backed up first.`)) return
    try { await window.api.backup.restore(backup.filename); toastSuccess('Backup restored', 'TINDA POS is restarting...') }
    catch (e) { toastError('Restore failed', String((e as Error)?.message || e)) }
  }

  const reset = async () => {
    if (confirmation !== 'RESET') return
    setResetting(true)
    try {
      await window.api.backup.resetDatabase(confirmation)
    } catch (e) {
      toastError('Database reset failed', String((e as Error)?.message || e))
      setResetting(false)
    }
  }

  const startNewStore = async () => {
    if (newStoreConfirmation !== 'NEW STORE') return
    setResetting(true)
    try { await window.api.backup.startNewStore(newStoreConfirmation) }
    catch (e) { toastError('Start New Store failed', String((e as Error)?.message || e)); setResetting(false) }
  }

  const switchToPortable = async (choice: 'FRESH' | 'COPY') => {
    if (!window.confirm(`${choice === 'COPY' ? 'Copy the current store into' : 'Start a fresh store in'} Portable Data? A verified safety backup is created first. The Shared AppData database remains unchanged.`)) return
    setResetting(true)
    try { await window.api.backup.usePortableData(choice) }
    catch (e) { toastError('Portable Data activation failed', String((e as Error)?.message || e)); setResetting(false) }
  }

  const switchToShared = async () => {
    if (!window.confirm(`Switch to the existing Shared AppData database at ${location?.sharedRoot}? Neither database will be overwritten.`)) return
    setResetting(true)
    try { await window.api.backup.useSharedAppData() }
    catch (e) { toastError('Data mode switch failed', String((e as Error)?.message || e)); setResetting(false) }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-100">Database & backups</h2>
        <div className="mt-3 space-y-3 text-sm">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Data Mode</p><p className="mt-1 font-semibold text-brand-300">{location?.label ?? 'Loading...'}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Database Location</p><p className="mt-1 break-all font-mono text-slate-300">{databaseFile}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Backup Location</p><p className="mt-1 break-all font-mono text-slate-300">{backupDir}</p></div>
          <p className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-3 text-xs text-sky-300">Moving the TINDA POS executable does not move or reset your store database. Your store data is stored separately for safety.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => void window.api.app.openDataDir()} className="btn-ghost flex items-center gap-2"><FolderOpen className="h-4 w-4" /> Open Data Folder</button>
          <button onClick={() => void backupNow()} className="btn-primary flex items-center gap-2"><HardDriveDownload className="h-4 w-4" /> Backup Now</button>
          <button onClick={() => void showRestore()} className="btn-ghost flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Restore Backup</button>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-100">Data mode</h2>
        <p className="mt-2 text-sm text-slate-400">Shared AppData keeps one safe store database regardless of where the EXE is moved. Portable Data intentionally keeps a separate TindaPOS-Data folder beside the Portable EXE.</p>
        {location?.mode === 'SHARED' ? <button onClick={() => setPortableOpen(true)} disabled={!location?.portableAvailable || resetting} className="btn-ghost mt-4 flex items-center gap-2"><Database className="h-4 w-4" /> Use Portable Data</button> : <button onClick={() => void switchToShared()} disabled={resetting} className="btn-ghost mt-4 flex items-center gap-2"><Database className="h-4 w-4" /> Use Shared AppData</button>}
        {location && !location.portableAvailable && location.mode === 'SHARED' && <p className="mt-2 text-xs text-slate-500">Portable Data can be enabled only when running the Portable edition.</p>}
        {location?.mode === 'PORTABLE' && location.sharedHasData && <p className="mt-2 text-xs text-amber-400">Shared AppData also contains a store. Switching selects it; neither database is overwritten.</p>}
      </div>

      <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-5">
        <h2 className="text-base font-bold text-amber-300">Start New Store</h2>
        <p className="mt-2 text-sm text-slate-300">Creates a fresh store setup while protecting the previous store with a verified safety backup. Existing backup files remain.</p>
        <button onClick={() => setNewStoreOpen(true)} className="btn-ghost mt-4">Start New Store</button>
      </div>

      <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-5">
        <h2 className="text-base font-bold text-red-300">Danger zone — active store database</h2>
        <p className="mt-2 text-sm font-semibold text-red-200">THIS WILL RESET THE ACTIVE STORE DATABASE.</p>
        <p className="mt-1 text-sm text-slate-400">Administrative destructive reset for troubleshooting/reinitialization. Products, sales, users, shifts, and settings will be removed from the active database. A verified safety backup will be created first; if backup creation fails, reset is aborted.</p>
        <button onClick={() => setOpen(true)} className="btn-danger mt-4 flex items-center gap-2"><DatabaseZap className="h-4 w-4" /> Reset Database</button>
      </div>

      {open && <Modal open onClose={() => { if (!resetting) { setOpen(false); setConfirmation('') } }} title="Reset Database" maxWidth="max-w-md" footer={
        <>
          <button onClick={() => { setOpen(false); setConfirmation('') }} disabled={resetting} className="btn-ghost">Cancel</button>
          <button onClick={() => void reset()} disabled={resetting || confirmation !== 'RESET'} className="btn-danger">{resetting ? 'Resetting...' : 'Reset and Restart'}</button>
        </>
      }>
        <p className="text-sm font-semibold text-red-300">THIS WILL RESET THE ACTIVE STORE DATABASE.</p>
        <p className="mt-2 text-sm text-amber-400">A verified safety backup will be created first. The app will restart and show first-time setup.</p>
        <div className="mt-4"><label className="label">Type RESET to confirm</label><input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="input w-full" autoFocus /></div>
      </Modal>}

      {newStoreOpen && <Modal open onClose={() => { if (!resetting) { setNewStoreOpen(false); setNewStoreConfirmation('') } }} title="Start New Store" maxWidth="max-w-md" footer={<><button onClick={() => setNewStoreOpen(false)} disabled={resetting} className="btn-ghost">Cancel</button><button onClick={() => void startNewStore()} disabled={resetting || newStoreConfirmation !== 'NEW STORE'} className="btn-danger">{resetting ? 'Preparing...' : 'Start Fresh and Restart'}</button></>}>
        <p className="text-sm font-semibold text-amber-300">The current store database will be replaced with a fresh database.</p><p className="mt-2 text-sm text-slate-400">A verified safety backup is created first. If backup creation or verification fails, this operation aborts. Existing backup files remain.</p><div className="mt-4"><label className="label">Type NEW STORE to confirm</label><input value={newStoreConfirmation} onChange={(e) => setNewStoreConfirmation(e.target.value)} className="input w-full" autoFocus /></div>
      </Modal>}

      {portableOpen && <Modal open onClose={() => setPortableOpen(false)} title="Use Portable Data" maxWidth="max-w-md" footer={<button onClick={() => setPortableOpen(false)} className="btn-ghost">Cancel</button>}>
        <p className="mb-3 text-sm text-slate-400">Portable data will be stored beside this Portable EXE at:</p><p className="mb-4 break-all font-mono text-xs text-brand-300">{location?.portableRoot}</p><div className="grid gap-3"><button onClick={() => void switchToPortable('FRESH')} className="rounded-lg border border-ink-line p-3 text-left hover:border-brand-500"><span className="block font-semibold text-white">Start Fresh</span><span className="text-xs text-slate-400">Keep Shared AppData unchanged and open first-run setup in a new portable database.</span></button><button onClick={() => void switchToPortable('COPY')} className="rounded-lg border border-ink-line p-3 text-left hover:border-brand-500"><span className="block font-semibold text-white">Copy Current Store</span><span className="text-xs text-slate-400">Checkpoint, safety-back up, copy, integrity-check, and preserve the original Shared AppData database.</span></button></div>
      </Modal>}

      {backups && <Modal open onClose={() => setBackups(null)} title="Restore Backup" maxWidth="max-w-lg" footer={<button onClick={() => setBackups(null)} className="btn-ghost">Cancel</button>}>
        <p className="mb-3 text-sm text-amber-400">Restoring replaces the active database, creates a safety backup, verifies integrity, and restarts TINDA POS.</p>
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {backups.length === 0 && <p className="py-5 text-center text-sm text-slate-500">No backups available.</p>}
          {backups.map((backup) => <button key={backup.filename} onClick={() => void restore(backup)} className="flex w-full items-center justify-between rounded-lg border border-ink-line p-3 text-left hover:border-brand-500/50"><span className="font-mono text-xs text-slate-300">{backup.filename}</span><RotateCcw className="h-4 w-4 text-brand-400" /></button>)}
        </div>
      </Modal>}
    </div>
  )
}

function AboutTab(): React.JSX.Element {
  const copyMaya = async () => {
    try {
      await navigator.clipboard.writeText('09912255156')
      toastSuccess('Maya number copied')
    } catch { toastError('Could not copy number') }
  }
  return (
    <div className="max-w-xl space-y-4">
      <SoftwareUpdatePanel />
      <div className="card overflow-hidden">
        <div className="developer-card p-8 text-center">
          <div className="coffee-float relative z-10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-pop ring-1 ring-white/10"><Coffee className="h-7 w-7" /></div>
          <p className="dev-signature signature-reveal relative z-10 text-3xl italic text-white">Crafted with care</p>
          <p className="mt-1 text-sm text-slate-400">by</p>
          <p className="dev-signature signature-reveal relative z-10 text-2xl font-bold text-brand-300">Dev Francis</p>
          <div className="mx-auto my-5 h-px max-w-xs bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
          <p className="text-sm text-slate-300">TINDA POS is free. If it helps your store, you may support the developer with a small coffee donation.</p>
          <button onClick={() => void copyMaya()} className="donation-card mx-auto mt-4 flex items-center gap-3 rounded-xl px-5 py-3 text-left">
            <div className="maya-logo-shell flex h-11 w-20 shrink-0 items-center justify-center rounded-xl bg-white shadow-card"><MayaMark /></div>
            <span><span className="dev-signature block text-base font-bold text-brand-300">Buy me a coffee</span><span className="font-mono text-lg font-bold tracking-wider text-white">0991 225 5156</span><span className="block text-[9px] uppercase tracking-[0.18em] text-slate-500">Maya · tap to copy</span></span>
            <Copy className="ml-2 h-4 w-4 text-slate-400" />
          </button>
          <p className="mt-3 text-[10px] text-slate-600">Donations are optional and do not unlock any features.</p>
        </div>
      </div>
    </div>
  )
}

function SoftwareUpdatePanel(): React.JSX.Element | null {
  const { event, check, download, dismiss } = useUpdate()
  const [busy, setBusy] = useState(false)
  const [showNotes, setShowNotes] = useState(true)
  if (!event) return null

  const installed = event.installedVersion
  const label = statusLabel(event.status)
  const note = event.message
  const available = event.available?.version ?? ''

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Download className="h-4 w-4 text-brand-400" /> Software Update</h3>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${event.status === 'ERROR' || event.status === 'OFFLINE' || event.status === 'UNABLE_TO_CHECK' ? 'bg-red-500/15 text-red-300' : event.status === 'CHECKING' || event.status === 'DOWNLOADING' ? 'bg-brand-500/15 text-brand-300' : 'bg-emerald-500/15 text-emerald-300'}`}>{label}</span>
      </div>
      <div className="space-y-1 text-sm text-slate-300">
        <p>Installed version: <span className="font-mono text-white">v{installed}</span></p>
        {available && <p>Available version: <span className="font-mono text-white">v{available}</span></p>}
        {event.lastCheckedAt && <p className="text-xs text-slate-500">Last checked: {new Date(event.lastCheckedAt).toLocaleString()}</p>}
        {note && <p className="pt-1 text-xs text-slate-400">{note}</p>}
        {event.status === 'DOWNLOADING' && event.progress && (
          <div className="pt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${event.progress.percent}%` }} />
            </div>
            <p className="pt-1 text-xs text-slate-500">{event.progress.percent}%</p>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => { setBusy(true); void check(true).finally(() => setBusy(false)) }}
          disabled={busy || event.status === 'CHECKING' || event.status === 'DOWNLOADING'}
          className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs"
        >
          {event.status === 'CHECKING' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Check for Updates
        </button>
        {event.status === 'UPDATE_AVAILABLE' && event.available && (
          <button onClick={() => { setBusy(true); void download().finally(() => setBusy(false)) }} disabled={busy} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Download Update
          </button>
        )}
        {event.status === 'ERROR' && event.available && (
          <button onClick={() => { setBusy(true); void download().finally(() => setBusy(false)) }} disabled={busy} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Retry Download
          </button>
        )}
        {event.status === 'UPDATE_AVAILABLE' && (
          <button onClick={() => void dismiss()} className="btn-ghost px-3 py-1.5 text-xs">Later</button>
        )}
        {event.available && (
          <button onClick={() => setShowNotes((v) => !v)} className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs"><Sparkles className="h-3.5 w-3.5" /> {showNotes ? 'Hide What\'s New' : 'What\'s New'}</button>
        )}
      </div>
      {showNotes && event.available && (
        <div className="mt-3 max-h-44 overflow-y-auto rounded-lg bg-ink-900/70 p-3 text-xs leading-relaxed text-slate-300">
          <p className="mb-1 font-semibold text-white">What&apos;s New in v{event.available.version}</p>
          <pre className="whitespace-pre-wrap font-sans">{event.available.releaseNotes}</pre>
        </div>
      )}
    </div>
  )
}

function statusLabel(status: string): string {
  switch (status) {
    case 'CHECKING': return 'Checking for updates…'
    case 'UP_TO_DATE': return 'Up to date'
    case 'UPDATE_AVAILABLE': return 'Update available'
    case 'DOWNLOADING': return 'Downloading'
    case 'DOWNLOADED': return 'Downloaded'
    case 'READY_TO_INSTALL': return 'Ready to install'
    case 'OFFLINE': return 'Offline'
    case 'UNABLE_TO_CHECK': return 'Unable to check'
    case 'ERROR': return 'Update failed'
    case 'DISMISSED': return 'Up to date'
    default: return 'Idle'
  }
}

function MayaMark(): React.JSX.Element {
  return (
    <svg viewBox="0 0 76 32" className="h-8 w-[4.5rem]" role="img" aria-label="Maya">
      <g className="maya-spark" fill="#00a86b"><path d="M5 8h7l5 7 5-7h7L17 24Z" /><path d="M17 8h6l-6 8-6-8Z" opacity=".55" /></g>
      <text className="maya-mark" x="30" y="22" fill="#111827" fontFamily="Arial, sans-serif" fontSize="17" fontWeight="800" letterSpacing="-1">maya</text>
    </svg>
  )
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }): React.JSX.Element {
  return (
    <button type="button" onClick={onClick} className={`h-6 w-11 rounded-full transition ${on ? 'bg-brand-600' : 'bg-ink-700'}`}>
      <span className={`block h-5 w-5 rounded-full bg-white transition ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function StoreSettingsTab(): React.JSX.Element {
  const { settings, update } = useSettings()
  const [f, setF] = useState({
    store_name: settings?.store_name ?? '',
    owner_name: settings?.owner_name ?? '',
    address: settings?.address ?? '',
    phone: settings?.phone ?? '',
    tin: settings?.tin ?? '',
    default_low_stock: settings?.default_low_stock ?? 5,
    allow_negative_inventory: settings?.allow_negative_inventory ?? false,
    default_tax_c: settings?.default_tax_c ?? 0
  })
  const [saving, setSaving] = useState(false)
  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }))

  const save = async () => {
    setSaving(true)
    try {
      await update({ store_name: f.store_name, owner_name: f.owner_name, address: f.address, phone: f.phone, tin: f.tin, default_low_stock: f.default_low_stock, allow_negative_inventory: f.allow_negative_inventory, default_tax_c: f.default_tax_c })
      toastSuccess('Settings saved')
    } catch (e) { toastError('Save failed', String((e as Error)?.message || e)) } finally { setSaving(false) }
  }

  return (
    <div className="card max-w-xl p-5">
      <div className="space-y-3">
        <div><label className="label">Store Name *</label><input value={f.store_name} onChange={(e) => set({ store_name: e.target.value })} className="input w-full" /></div>
        <div><label className="label">Owner Name</label><input value={f.owner_name} onChange={(e) => set({ owner_name: e.target.value })} className="input w-full" /></div>
        <div><label className="label">Address</label><input value={f.address} onChange={(e) => set({ address: e.target.value })} className="input w-full" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Phone</label><input value={f.phone} onChange={(e) => set({ phone: e.target.value })} className="input w-full" /></div>
          <div><label className="label">TIN</label><input value={f.tin} onChange={(e) => set({ tin: e.target.value })} className="input w-full" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Default Low Stock Alert</label><input type="number" min={0} value={f.default_low_stock} onChange={(e) => set({ default_low_stock: parseInt(e.target.value || '0', 10) })} className="input w-full" /></div>
          <div><label className="label">Default Tax (₱)</label><input type="number" min={0} value={f.default_tax_c / 100} onChange={(e) => set({ default_tax_c: Math.round(parseFloat(e.target.value || '0') * 100) })} className="input w-full" /></div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-ink-line px-3 py-2">
          <div>
            <p className="text-sm text-slate-200">Allow negative stock</p>
            <p className="text-xs text-slate-500">Let sales go below zero stock</p>
          </div>
          <Toggle on={f.allow_negative_inventory} onClick={() => set({ allow_negative_inventory: !f.allow_negative_inventory })} />
        </div>
        <button onClick={() => void save()} disabled={saving} className="btn-primary flex items-center gap-2"><Save className="h-4 w-4" /> Save Settings</button>
      </div>
    </div>
  )
}

function ReceiptSettingsTab(): React.JSX.Element {
  const { settings, update } = useSettings()
  const [f, setF] = useState({ receipt_header: settings?.receipt_header ?? '', receipt_title: settings?.receipt_title ?? '', receipt_show_app_name: settings?.receipt_show_app_name ?? true, receipt_footer: settings?.receipt_footer ?? '', receipt_printer: settings?.receipt_printer ?? '', auto_print_after_sale: settings?.auto_print_after_sale ?? false, receipt_paper_width: settings?.receipt_paper_width ?? '80mm' as '58mm' | '80mm', receipt_copies: settings?.receipt_copies ?? 1 })
  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }))
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [printers, setPrinters] = useState<PrinterChoice[]>([])

  useEffect(() => {
    if (settings) setF({ receipt_header: settings.receipt_header, receipt_title: settings.receipt_title, receipt_show_app_name: settings.receipt_show_app_name, receipt_footer: settings.receipt_footer, receipt_printer: settings.receipt_printer, auto_print_after_sale: settings.auto_print_after_sale, receipt_paper_width: settings.receipt_paper_width, receipt_copies: settings.receipt_copies })
  }, [settings])

  // Refresh the installed printer list (also used by the Refresh Printers button
  // so a newly connected/installed printer appears without restarting the app).
  const loadPrinters = async (): Promise<void> => {
    setRefreshing(true)
    try {
      const list = await window.api.printer.list()
      setPrinters(list)
    } catch (e) {
      toastError('Could not list printers', String((e as Error)?.message || e))
    } finally {
      setRefreshing(false)
    }
  }
  useEffect(() => { void loadPrinters() }, [])

  // First setup only: when nothing is saved yet and Windows reports a default
  // printer, suggest it in the dropdown. The owner still confirms by pressing
  // Save — TINDA POS never silently prints to a random default printer.
  useEffect(() => {
    if (!settings) return
    const pick = printerPick(printers, settings.receipt_printer)
    if (pick.status === 'NOT_CONFIGURED' && pick.name) {
      setF((prev) => (prev.receipt_printer === settings.receipt_printer ? { ...prev, receipt_printer: pick.name } : prev))
    }
  }, [printers, settings])

  const pick = printerPick(printers, f.receipt_printer)

  const save = async () => {
    setSaving(true)
    try {
      await update({ receipt_header: f.receipt_header, receipt_title: f.receipt_title, receipt_show_app_name: f.receipt_show_app_name, receipt_footer: f.receipt_footer })
      await window.api.printer.save({ name: f.receipt_printer, autoPrint: f.auto_print_after_sale, paperWidth: f.receipt_paper_width, copies: f.receipt_copies })
      toastSuccess('Receipt settings saved')
    } catch (e) { toastError('Save failed', String((e as Error)?.message || e)) } finally { setSaving(false) }
  }

  const testPrint = async () => {
    try {
      await window.api.printer.save({ name: f.receipt_printer, autoPrint: f.auto_print_after_sale, paperWidth: f.receipt_paper_width, copies: f.receipt_copies })
      const result = await window.api.printer.testPrint()
      if (result.ok) toastSuccess('Test print sent', result.message)
      else toastError('Test print failed', result.message)
    } catch (e) { toastError('Test print failed', String((e as Error)?.message || e)) }
  }

  return (
    <div className="card max-w-xl p-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-ink-line px-3 py-2"><div><p className="text-sm text-slate-200">Show TINDA POS App Name</p><p className="text-xs text-slate-500">Turn this off to remove TINDA POS from the receipt heading.</p></div><Toggle on={f.receipt_show_app_name} onClick={() => set({receipt_show_app_name: !f.receipt_show_app_name})}/></div>
        <div><label className="label">Receipt Title</label><input value={f.receipt_title} onChange={e=>set({receipt_title:e.target.value})} placeholder="JUAN STORE" className="input w-full"/></div>
        <div><label className="label">Receipt Header (shown on top)</label><textarea value={f.receipt_header} onChange={(e) => set({ receipt_header: e.target.value })} rows={2} className="input w-full" /></div>
        <div><label className="label">Receipt Footer (message at bottom)</label><textarea value={f.receipt_footer} onChange={(e) => set({ receipt_footer: e.target.value })} rows={2} className="input w-full" /></div>
        <div><label className="label">Printer</label><select value={f.receipt_printer} onChange={(e) => set({ receipt_printer: e.target.value })} className="input w-full"><option value="">No receipt printer configured</option>{printers.map((printer) => <option key={printer.name} value={printer.name}>{printer.displayName}{printer.isDefault ? ' (Default)' : ''}</option>)}{pick.status === 'UNAVAILABLE' && <option value={pick.name}>{pick.name} (unavailable)</option>}</select></div>
        <div className="flex items-center justify-between rounded-lg border border-ink-line px-3 py-2">
          <div>
            <p className="text-sm text-slate-200">Status: <span className={`font-semibold ${pick.status === 'READY' ? 'text-emerald-400' : pick.status === 'UNAVAILABLE' ? 'text-amber-400' : 'text-slate-400'}`}>{printerStatusLabel(pick.status)}</span></p>
            <p className="text-xs text-slate-500">Ready only when the saved printer is actually installed.</p>
          </div>
          <button onClick={() => void loadPrinters()} disabled={refreshing} className="btn-ghost flex items-center gap-1.5 text-xs">{refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh Printers</button>
        </div>
        {pick.status === 'UNAVAILABLE' && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">Selected receipt printer is unavailable: <span className="font-mono">{pick.name}</span>. Refresh Printers or choose another printer before printing — sales are never blocked or rolled back.</p>}
        {pick.status === 'NOT_CONFIGURED' && printers.length === 0 && <p className="rounded-lg border border-ink-line bg-ink-900 px-3 py-2 text-xs text-slate-400">No receipt printer configured. Install a thermal receipt printer in Windows, then press Refresh Printers.</p>}
        <div className="flex items-center justify-between rounded-lg border border-ink-line px-3 py-2"><div><p className="text-sm text-slate-200">Auto Print After Sale</p><p className="text-xs text-slate-500">One silent print job, sent only after the sale commits.</p></div><Toggle on={f.auto_print_after_sale} onClick={() => set({ auto_print_after_sale: !f.auto_print_after_sale })} /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="label">Paper Width</label><select value={f.receipt_paper_width} onChange={(e) => set({ receipt_paper_width: e.target.value as '58mm' | '80mm' })} className="input w-full"><option value="58mm">58mm</option><option value="80mm">80mm (default)</option></select></div><div><label className="label">Copies</label><input type="number" min={1} max={3} value={f.receipt_copies} onChange={(e) => set({ receipt_copies: Math.max(1, Math.min(3, Math.trunc(Number(e.target.value) || 1))) })} className="input w-full" /></div></div>
        <div><p className="label">Live Receipt Preview</p><ReceiptPaper width={f.receipt_paper_width} lines={[...f.receipt_header.trim().split(/\r?\n/).filter(Boolean), ...(f.receipt_title.trim() ? [f.receipt_title.trim()] : []), ...(f.receipt_show_app_name && f.receipt_title.trim().toUpperCase() !== 'TINDA POS' ? ['TINDA POS'] : []), settings?.store_name || 'My Sari-Sari Store','--------------------------------','TPOS-PREVIEW','1 x Sample Item        10.00','TOTAL                  10.00','--------------------------------',f.receipt_footer || 'Salamat po!']}/></div>
        <p className="rounded-lg border border-ink-line bg-ink-900 px-3 py-2 text-xs text-slate-400">Prints through the Windows printer driver using the exact device name Electron reports. For automatic cutting, enable Auto Cut in the Windows driver/preferences of that printer. Sales still complete if the printer is missing or offline.</p>
        <div className="flex gap-2"><button onClick={() => void save()} disabled={saving} className="btn-primary flex items-center gap-2"><Save className="h-4 w-4" /> Save Receipt</button><button onClick={() => void testPrint()} disabled={!f.receipt_printer} className="btn-ghost flex items-center gap-2"><Printer className="h-4 w-4" /> Test Print</button></div>
      </div>
    </div>
  )
}

interface UserForm { id: number | null; username: string; password: string; pin: string; full_name: string; roles: string[] }

function UsersTab(): React.JSX.Element {
  const [users, setUsers] = useState<User[]>([])
  const [editing, setEditing] = useState<UserForm | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [resetPin, setResetPin] = useState<{ id: number; full_name: string } | null>(null)

  const load = async () => {
    try {
      const [u, r] = await Promise.all([window.api.users.list(), window.api.users.roles()])
      setUsers(u)
      setRoles(r)
    } catch (e) { toastError('Failed to load users', String((e as Error)?.message || e)) }
  }
  useEffect(() => { void load() }, [])

  const save = async (f: UserForm) => {
    try {
      if (f.id) {
        await window.api.users.update(f.id, { username: f.username, full_name: f.full_name, roles: f.roles, password: f.password || undefined, pin: f.pin || undefined })
        toastSuccess('User updated')
      } else {
        await window.api.users.create({ username: f.username, password: f.password, pin: f.pin, full_name: f.full_name, roles: f.roles })
        toastSuccess('User created')
      }
      setEditing(null)
      void load()
    } catch (e) { toastError('Save failed', String((e as Error)?.message || e)) }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex justify-between">
        <p className="text-sm text-slate-400">{users.length} users</p>
        <button onClick={() => setEditing({ id: null, username: '', password: '', pin: '', full_name: '', roles: ['CASHIER'] })} className="btn-primary flex items-center gap-2"><UserPlus className="h-4 w-4" /> New User</button>
      </div>
      <div className="card overflow-hidden">
        <table className="table">
          <thead><tr><th>User</th><th>Username</th><th>Roles</th><th>Status</th><th className="w-28">Actions</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium text-slate-200">{u.full_name}</td>
                <td className="text-slate-400">{u.username}</td>
                <td className="text-slate-300">{u.roles.join(', ')}</td>
                <td><span className={`badge ${u.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing({ id: u.id, username: u.username, password: '', pin: '', full_name: u.full_name, roles: u.roles })} className="btn-ghost-2 rounded-lg p-2" title="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setResetPin({ id: u.id, full_name: u.full_name })} className="btn-ghost-2 rounded-lg p-2" title="Reset PIN"><KeyRound className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <UserModal form={editing} roles={roles} onSave={save} onClose={() => setEditing(null)} />}
      {resetPin && <ResetPinModal user={resetPin} onClose={() => setResetPin(null)} />}
    </div>
  )
}

function UserModal({ form, roles, onSave, onClose }: { form: UserForm; roles: string[]; onSave: (f: UserForm) => void; onClose: () => void }): React.JSX.Element {
  const [f, setF] = useState<UserForm>(form)
  const set = (patch: Partial<UserForm>) => setF((p) => ({ ...p, ...patch }))
  const isNew = f.id === null

  return (
    <Modal open onClose={onClose} title={isNew ? 'New User' : `Edit ${f.full_name}`} maxWidth="max-w-md" footer={
      <>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={() => onSave(f)} className="btn-primary">Save</button>
      </>
    }>
      <form onSubmit={(e) => { e.preventDefault(); onSave(f) }} className="space-y-3">
        <div><label className="label">Full Name *</label><input required value={f.full_name} onChange={(e) => set({ full_name: e.target.value })} className="input w-full" /></div>
        <div><label className="label">Username *</label><input required value={f.username} onChange={(e) => set({ username: e.target.value })} className="input w-full" /></div>
        {isNew && (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Password *</label><input type="password" required value={f.password} onChange={(e) => set({ password: e.target.value })} className="input w-full" /></div>
            <div><label className="label">PIN (4 digits) *</label><input required value={f.pin} maxLength={4} onChange={(e) => set({ pin: e.target.value.replace(/\D/g, '') })} className="input w-full" /></div>
          </div>
        )}
        <div><label className="label">Roles</label>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <button key={r} type="button" onClick={() => set({ roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r] })} className={`badge cursor-pointer border ${f.roles.includes(r) ? 'bg-brand-600/20 text-brand-300 border-brand-500/40' : 'bg-ink-800 text-slate-400 border-ink-line'}`}>{r}</button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}

function ResetPinModal({ user, onClose }: { user: { id: number; full_name: string }; onClose: () => void }): React.JSX.Element {
  const [pin, setPin] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    if (pin.length !== 4) { toastError('PIN must be 4 digits'); return }
    setSaving(true)
    try {
      await window.api.auth.adminResetPin(user.id, pin)
      toastSuccess('PIN reset')
      onClose()
    } catch (e) { toastError('Reset failed', String((e as Error)?.message || e)) } finally { setSaving(false) }
  }
  return (
    <Modal open onClose={onClose} title={`Reset PIN — ${user.full_name}`} maxWidth="max-w-xs" footer={
      <>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={() => void submit()} disabled={saving} className="btn-primary">Reset</button>
      </>
    }>
      <label className="label">New 4-digit PIN</label>
      <input value={pin} maxLength={4} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="input w-full text-2xl tracking-widest" autoFocus />
    </Modal>
  )
}

function CloudDashboardTab(): React.JSX.Element {
  const [loading, setLoading] = useState(true)
  const [isVip, setIsVip] = useState(false)
  const [licenseKeyInput, setLicenseKeyInput] = useState('')
  const [activating, setActivating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [settings, setSettings] = useState<import('@shared/types').StoreSettings | null>(null)

  const loadStatus = async () => {
    try {
      setLoading(true)
      const res = await window.api.cloud.status()
      setIsVip(res.isVip)
      setSettings(res.settings)
    } catch (e) {
      toastError('Failed to load cloud status', String((e as Error)?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!licenseKeyInput.trim()) return
    setActivating(true)
    try {
      const res = await window.api.cloud.activateLicense(licenseKeyInput.trim())
      if (res.ok) {
        toastSuccess('License Activated!', res.message)
        await loadStatus()
      } else {
        toastError('Activation Failed', res.error || 'Invalid key')
      }
    } catch (e) {
      toastError('Error activating license', String((e as Error)?.message || e))
    } finally {
      setActivating(false)
    }
  }

  const handleToggleSync = async (enabled: boolean) => {
    try {
      const updated = await window.api.cloud.updateSettings({ cloud_sync_enabled: enabled })
      setSettings(updated)
      toastSuccess(enabled ? 'Cloud Sync Enabled' : 'Cloud Sync Disabled')
    } catch (e) {
      toastError('Failed to update sync setting', String((e as Error)?.message || e))
    }
  }

  const handleSyncNow = async () => {
    setSyncing(true)
    try {
      const res = await window.api.cloud.syncNow()
      if (res.ok) {
        toastSuccess('Synced', res.message)
        await loadStatus()
      } else {
        toastError('Sync Failed', res.message)
      }
    } catch (e) {
      toastError('Sync Error', String((e as Error)?.message || e))
    } finally {
      setSyncing(false)
    }
  }

  const copyText = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt)
    toastSuccess('Copied', `${label} copied to clipboard`)
  }

  if (loading) {
    return <div className="card p-8 text-center text-slate-400">Loading Cloud & VIP License Status...</div>
  }

  return (
    <div className="space-y-6">
      {/* VIP License Status Card */}
      <div className={`card p-6 border ${isVip ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-ink-900 to-ink-900' : 'border-ink-line'}`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isVip ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/10' : 'bg-ink-800 text-slate-500 border border-ink-line'}`}>
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">VIP Pro License</h3>
                {isVip ? (
                  <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> ACTIVE {settings?.vip_expires_at === 'lifetime' ? '(LIFETIME)' : ''}
                  </span>
                ) : (
                  <span className="badge bg-slate-800 text-slate-400 border border-slate-700">
                    FREE TIER
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                VIP Pro unlocks the <strong>Executive Cloud Owner Dashboard</strong>, allowing store owners to view live sales, stock movements, and cashier shifts from anywhere on phone or PC.
              </p>
            </div>
          </div>
        </div>

        {!isVip ? (
          <form onSubmit={handleActivate} className="mt-5 pt-5 border-t border-ink-line flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[240px]">
              <label className="label">Enter VIP License Key</label>
              <input
                type="text"
                placeholder="TINDA-VIP-PRO-XXXX-XXXX"
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value)}
                className="input w-full uppercase font-mono tracking-wider"
                required
              />
            </div>
            <button type="submit" disabled={activating} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 border-none text-black font-bold">
              <Key className="w-4 h-4" /> {activating ? 'Verifying...' : 'Activate VIP Pro'}
            </button>
          </form>
        ) : (
          <div className="mt-4 pt-4 border-t border-amber-500/20 flex flex-wrap items-center justify-between text-xs text-slate-400">
            <div>License: <code className="text-amber-400 font-mono font-bold">{settings?.vip_license_key}</code></div>
            <div>Status: <span className="text-emerald-400 font-medium">Licensed & Verified</span></div>
          </div>
        )}
      </div>

      {/* Cloud Sync Configuration Card (Only active when VIP is enabled) */}
      {isVip && settings && (
        <div className="card p-6 border border-ink-line space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-ink-line">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-brand-400" /> Cloud Sync Integration
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically pushes sales and stock events to your remote Cloudflare Worker & Owner Dashboard.
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-xs font-semibold text-slate-300">
                {settings.cloud_sync_enabled ? 'Syncing Enabled' : 'Syncing Disabled'}
              </span>
              <input
                type="checkbox"
                checked={settings.cloud_sync_enabled}
                onChange={(e) => handleToggleSync(e.target.checked)}
                className="w-5 h-5 accent-brand-500 rounded"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Store ID (Branch UUID)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={settings.cloud_store_id || 'Not generated yet (enable sync to generate)'}
                  className="input w-full font-mono text-xs bg-ink-950 text-slate-300"
                />
                {settings.cloud_store_id && (
                  <button
                    type="button"
                    onClick={() => copyText(settings.cloud_store_id, 'Store ID')}
                    className="btn-ghost px-3"
                    title="Copy Store ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Enter this Store ID on your Owner Dashboard to connect this PC.
              </p>
            </div>

            <div>
              <label className="label">Branch Sync Key (Secret)</label>
              <div className="flex gap-2">
                <input
                  type={showKey ? 'text' : 'password'}
                  readOnly
                  value={settings.cloud_sync_key || '••••••••••••••••••••••••'}
                  className="input w-full font-mono text-xs bg-ink-950 text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="btn-ghost px-3"
                  title="Show/Hide Key"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {settings.cloud_sync_key && (
                  <button
                    type="button"
                    onClick={() => copyText(settings.cloud_sync_key, 'Sync Key')}
                    className="btn-ghost px-3"
                    title="Copy Sync Key"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Secret authentication token for your owner dashboard. Never share this publicly.
              </p>
            </div>
          </div>

          <div className="bg-ink-950/60 p-4 rounded-xl border border-ink-line/60 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-slate-400">
                Last Successful Sync:{' '}
                <span className="text-slate-200 font-medium">
                  {settings.cloud_last_synced_at
                    ? new Date(settings.cloud_last_synced_at).toLocaleString()
                    : 'Never synced'}
                </span>
              </div>
              {settings.cloud_sync_pending && (
                <div className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                  ⚠️ Offline queue pending — will retry on next transaction
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={syncing || !settings.cloud_sync_enabled}
                className="btn-ghost flex items-center gap-2 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>

              <button
                type="button"
                onClick={() => setShowGuide(true)}
                className="btn-secondary flex items-center gap-1.5 text-xs text-amber-300 border-amber-500/30 hover:border-amber-500/60"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Gabay sa Paggamit
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open('https://tinda-owner-dashboard.pages.dev/', '_blank')
                }}
                className="btn-primary flex items-center gap-2 text-xs"
              >
                <Globe className="w-3.5 h-3.5" /> Open Owner Website
              </button>
            </div>
          </div>
        </div>
      )}

      {showGuide && <VipCloudGuideModal onClose={() => setShowGuide(false)} />}
    </div>
  )
}

function VipCloudGuideModal({ onClose }: { onClose: () => void }): React.JSX.Element {
  return (
    <Modal
      open
      onClose={onClose}
      title="📱 Gabay sa Paggamit ng Owner Cloud Dashboard (VIP Pro)"
      maxWidth="max-w-2xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <span className="text-xs text-slate-500">TINDA POS VIP Exclusive Feature</span>
          <button onClick={onClose} className="btn-primary text-xs">
            Naintindihan Ko / Isara
          </button>
        </div>
      }
    >
      <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-2 text-slate-200 text-xs leading-relaxed">
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200">
          <strong>Para sa mga VIP Store Owners:</strong> Maaari mo nang makita ang live benta, stock history bawat produkto, at cashier shifts ng iyong tindahan sa iyong cellphone kahit saan ka magpunta!
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-slate-100 flex items-center gap-2 text-sm text-brand-400">
            📍 Hakbang 1: Pag-activate sa Tindahan (Computer / POS)
          </h4>
          <ol className="list-decimal pl-5 space-y-1 text-slate-300">
            <li>Pumunta sa <strong>Settings (⚙️) ➔ Cloud Dashboard (VIP)</strong>.</li>
            <li>I-type ang iyong <strong>VIP License Key</strong> at pindutin ang <strong>Activate</strong>.</li>
            <li>Siguraduhing naka-ON ang <strong>Syncing Enabled</strong>.</li>
            <li>Kopyahin ang iyong <strong>Store ID</strong> at <strong>Sync Key</strong> (gamitin ang Copy icon).</li>
          </ol>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-slate-100 flex items-center gap-2 text-sm text-brand-400">
            📍 Hakbang 2: Pagbukas ng Website sa Cellphone
          </h4>
          <ol className="list-decimal pl-5 space-y-1 text-slate-300">
            <li>Buksan ang browser sa iyong cellphone (Chrome / Safari):<br />
              <code className="text-brand-300 select-all font-mono">https://tinda-owner-dashboard.pages.dev/</code>
            </li>
            <li>Pindutin ang <strong>"First time setup? Create Owner Account"</strong>.</li>
            <li>Gumawa ng iyong personal na Username at Password (halimbawa: <em>bossfranz</em> at sariling password).</li>
            <li>Mag-sign in sa website.</li>
          </ol>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-slate-100 flex items-center gap-2 text-sm text-brand-400">
            📍 Hakbang 3: Pag-konekta ng Tindahan sa Cellphone
          </h4>
          <ol className="list-decimal pl-5 space-y-1 text-slate-300">
            <li>Sa loob ng website sa cellphone, pindutin ang <strong>"+ Link PC/Branch"</strong>.</li>
            <li>I-paste ang kinopya mong <strong>Store ID</strong> at <strong>Sync Key</strong> mula sa Hakbang 1.</li>
            <li>Pindutin ang <strong>"Link Branch"</strong>. Tapos na!</li>
          </ol>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-slate-100 flex items-center gap-2 text-sm text-emerald-400">
            📊 Mga Tampok na Makikita Mo Araw-araw:
          </h4>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li><strong>Live Sales:</strong> Bawat benta ng kahera, pumapasok at lumalabas agad sa cellphone.</li>
            <li><strong>Stock History:</strong> Makikita kung anong item ang nabawas at natitirang stock.</li>
            <li><strong>Payment Breakdown:</strong> Malinaw na breakdown kung magkano ang Cash, GCash, Maya, at Pautang.</li>
            <li><strong>Shift Summary:</strong> Makikita ang Z-Read closings at pera sa drawer pagka-close ng shift.</li>
            <li><strong>Kahit Mawalan ng Internet:</strong> Patuloy pa rin ang benta sa tindahan (offline); kusa itong mag-aupload pagbalik ng internet!</li>
          </ul>
        </div>
      </div>
    </Modal>
  )
}
