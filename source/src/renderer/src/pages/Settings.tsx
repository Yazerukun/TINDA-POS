import { useEffect, useState } from 'react'
import {
  Save,
  Store,
  Receipt,
  Users,
  UserPlus,
  Pencil,
  KeyRound,
  Heart,
  Coffee,
  Copy,
  DatabaseZap,
  RotateCcw,
  Printer,
  RefreshCw,
  Loader2,
  Download,
  Sparkles,
  Network,
  Crown,
  Check,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  ExternalLink,
  FolderOpen,
  HardDriveDownload,
  Database
} from 'lucide-react'
import type { BackupInfo, User, LicenseStatus } from '@shared/types'
import type { DataLocationStatus, PrinterChoice } from '@shared/ipc'
import { printerPick, printerStatusLabel } from '@shared/printer'
import { Modal } from '../components/ui/Modal'
import { useSettings } from '../stores/settings'
import { toastSuccess, toastError } from '../stores/toast'
import { useUpdate } from '../stores/update'
import { ReceiptPaper } from '../components/ReceiptPaper'
import { NetworkSettingsTab } from '../components/NetworkSettingsTab'
import { VipUpgradeModal } from '../components/VipUpgradeModal'
import { VipUpgradeBanner } from '../components/VipUpgradeBanner'

type Tab = 'HOME' | 'RECEIPT' | 'USERS' | 'DATA' | 'NETWORK' | 'VIP' | 'ABOUT'

export function Settings(): React.JSX.Element {
  const { load } = useSettings()
  const [tab, setTab] = useState<Tab>('HOME')
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  const loadLicense = async (): Promise<void> => {
    try {
      const s = await window.api.license.getStatus()
      setLicenseStatus(s)
    } catch {
      // Ignored
    }
  }

  useEffect(() => {
    void load()
    void loadLicense()
  }, [load])

  return (
    <div className="p-4 md:p-6 min-h-full">
      {/* Centered Main Settings Container */}
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Settings Header with VIP Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-ink-line">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              Settings
              {licenseStatus?.isVip ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
                  <Crown className="h-3.5 w-3.5" /> VIP Pro
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/15 px-3 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/30">
                  Community Edition
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Store preferences, thermal printers, staff accounts, database, multi-counter hub, and VIP license.
            </p>
          </div>

          {!licenseStatus?.isVip && (
            <button
              onClick={() => setUpgradeModalOpen(true)}
              className="btn-primary self-start sm:self-auto flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-ink-950 border-0 shadow-md transition active:scale-95"
            >
              <Crown className="h-3.5 w-3.5" /> Upgrade to VIP (₱500)
            </button>
          )}
        </div>

        {/* Sliding Banner for Community Edition */}
        {!licenseStatus?.isVip && (
          <VipUpgradeBanner onUpgradeClick={() => setUpgradeModalOpen(true)} isVip={licenseStatus?.isVip} />
        )}

        {/* Centered Navigation Tabs */}
        <div className="flex flex-wrap justify-center items-center gap-2 p-1.5 rounded-2xl bg-ink-900/70 border border-ink-line shadow-inner">
          <button
            onClick={() => setTab('HOME')}
            className={`btn-ghost flex items-center gap-2 text-xs md:text-sm px-3.5 py-2 ${
              tab === 'HOME' ? '!border-brand-500 !text-brand-400 !bg-brand-500/10' : ''
            }`}
          >
            <Store className="h-4 w-4" /> Store
          </button>
          <button
            onClick={() => setTab('RECEIPT')}
            className={`btn-ghost flex items-center gap-2 text-xs md:text-sm px-3.5 py-2 ${
              tab === 'RECEIPT' ? '!border-brand-500 !text-brand-400 !bg-brand-500/10' : ''
            }`}
          >
            <Receipt className="h-4 w-4" /> Receipt
          </button>
          <button
            onClick={() => setTab('USERS')}
            className={`btn-ghost flex items-center gap-2 text-xs md:text-sm px-3.5 py-2 ${
              tab === 'USERS' ? '!border-brand-500 !text-brand-400 !bg-brand-500/10' : ''
            }`}
          >
            <Users className="h-4 w-4" /> Users
          </button>
          <button
            onClick={() => setTab('DATA')}
            className={`btn-ghost flex items-center gap-2 text-xs md:text-sm px-3.5 py-2 ${
              tab === 'DATA' ? '!border-brand-500 !text-brand-400 !bg-brand-500/10' : ''
            }`}
          >
            <DatabaseZap className="h-4 w-4" /> Data
          </button>
          <button
            onClick={() => setTab('NETWORK')}
            className={`btn-ghost flex items-center gap-2 text-xs md:text-sm px-3.5 py-2 ${
              tab === 'NETWORK' ? '!border-brand-500 !text-brand-400 !bg-brand-500/10' : ''
            }`}
          >
            <Network className="h-4 w-4" /> Multi-PC & Cloud
          </button>
          <button
            onClick={() => setTab('VIP')}
            className={`btn-ghost flex items-center gap-2 text-xs md:text-sm px-3.5 py-2 border-amber-500/30 text-amber-400 ${
              tab === 'VIP' ? '!border-amber-400 !text-amber-300 !bg-amber-500/15' : 'hover:border-amber-400/50'
            }`}
          >
            <Crown className="h-4 w-4 text-amber-400" /> VIP Pro License
          </button>
          <button
            onClick={() => setTab('ABOUT')}
            className={`btn-ghost flex items-center gap-2 text-xs md:text-sm px-3.5 py-2 ${
              tab === 'ABOUT' ? '!border-brand-500 !text-brand-400 !bg-brand-500/10' : ''
            }`}
          >
            <Heart className="h-4 w-4" /> About
          </button>
        </div>

        {/* Centered Active Tab Content */}
        <div className="flex justify-center w-full">
          {tab === 'HOME' && (
            <div className="w-full max-w-2xl space-y-4">
              <StartupSetting />
              <StoreSettingsTab />
            </div>
          )}
          {tab === 'RECEIPT' && (
            <div className="w-full max-w-2xl">
              <ReceiptSettingsTab />
            </div>
          )}
          {tab === 'USERS' && (
            <div className="w-full max-w-3xl">
              <UsersTab />
            </div>
          )}
          {tab === 'DATA' && (
            <div className="w-full max-w-2xl">
              <DataTab />
            </div>
          )}
          {tab === 'NETWORK' && (
            <div className="w-full max-w-3xl">
              <NetworkSettingsTab />
            </div>
          )}
          {tab === 'VIP' && (
            <div className="w-full max-w-2xl">
              <VipSettingsTab onActivated={() => void loadLicense()} />
            </div>
          )}
          {tab === 'ABOUT' && (
            <div className="w-full max-w-xl">
              <AboutTab onUpgradeClick={() => setUpgradeModalOpen(true)} isVip={licenseStatus?.isVip} />
            </div>
          )}
        </div>

        {/* Modal for VIP Upgrade */}
        <VipUpgradeModal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          onActivated={() => {
            void loadLicense()
            setUpgradeModalOpen(false)
          }}
        />
      </div>
    </div>
  )
}

function StartupSetting(): React.JSX.Element {
  const [state, setState] = useState<{ supported: boolean; enabled: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    void window.api.app.startup().then(setState).catch(() => {
      setState({ supported: true, enabled: false })
    })
  }, [])
  const change = async (enabled: boolean) => {
    setBusy(true)
    try { setState(await window.api.app.startup(enabled)) }
    catch (e) { toastError('Could not change startup setting', String(e)) }
    finally { setBusy(false) }
  }
  return <div className="border-b border-ink-line pb-4">
    <label className="flex items-center gap-3 text-sm text-slate-200">
      <input type="checkbox" checked={state?.enabled ?? false} disabled={state ? !state.supported || busy : busy} onChange={(e) => void change(e.target.checked)} />
      Start TINDA POS when I sign in to Windows
    </label>
    {state && !state.supported && <p className="mt-2 text-xs text-slate-400">Available on Windows.</p>}
  </div>
}

function VipSettingsTab({ onActivated }: { onActivated?: () => void }): React.JSX.Element {
  const [status, setStatus] = useState<LicenseStatus | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedMid, setCopiedMid] = useState(false)
  const [copiedMaya, setCopiedMaya] = useState(false)

  const load = async (): Promise<void> => {
    try {
      const s = await window.api.license.getStatus()
      setStatus(s)
    } catch (e) {
      toastError('Could not load license status', String((e as Error)?.message || e))
    }
  }

  useEffect(() => { void load() }, [])

  const copyMachineId = async (): Promise<void> => {
    if (!status?.machineId) return
    try {
      await navigator.clipboard.writeText(status.machineId)
      setCopiedMid(true)
      toastSuccess('Machine ID copied to clipboard!')
      setTimeout(() => setCopiedMid(false), 2500)
    } catch {
      toastError('Failed to copy Machine ID')
    }
  }

  const copyMayaNumber = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText('09912255156')
      setCopiedMaya(true)
      toastSuccess('Maya number copied: 09912255156')
      setTimeout(() => setCopiedMaya(false), 2500)
    } catch {
      toastError('Failed to copy Maya number')
    }
  }

  const openFacebook = (): void => {
    void window.api.app.openExternal('https://www.facebook.com/Ukauru')
  }

  const activate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!keyInput.trim()) {
      toastError('Please enter your VIP License Key')
      return
    }

    setLoading(true)
    try {
      const result = await window.api.license.activate(keyInput.trim(), customerName.trim() || undefined)
      if (result.ok) {
        toastSuccess('VIP Pro Activated!', result.message)
        setStatus(result.status)
        setKeyInput('')
        if (onActivated) onActivated()
      } else {
        toastError('Activation Failed', result.message)
      }
    } catch (err) {
      toastError('Activation Error', (err as Error)?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  const deactivate = async (): Promise<void> => {
    if (!window.confirm('Are you sure you want to deactivate VIP Pro on this computer? The system will revert to Community Edition.')) return
    try {
      const res = await window.api.license.deactivate()
      if (res.ok) {
        toastSuccess('License deactivated')
        void load()
        if (onActivated) onActivated()
      }
    } catch (err) {
      toastError('Deactivation failed', String((err as Error)?.message || err))
    }
  }

  const isVip = status?.isVip ?? false

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isVip ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30' : 'bg-slate-500/20 text-slate-400'}`}>
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">License & System Tier</h2>
              <p className="text-xs text-slate-400">
                {isVip ? 'Lifetime VIP Pro License (Hardware Bound)' : 'Free Community Edition (Active)'}
              </p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold border ${isVip ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
            {isVip ? '💎 VIP PRO ACTIVE' : 'FREE COMMUNITY'}
          </span>
        </div>

        {/* Machine ID Box */}
        <div className="rounded-xl bg-ink-950 p-4 border border-ink-line space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Hardware Machine ID (Locked to this Motherboard/CPU):</span>
            <button
              onClick={() => void copyMachineId()}
              className="btn-ghost flex items-center gap-1.5 py-1 px-2.5 text-xs text-amber-300"
            >
              {copiedMid ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copiedMid ? 'Copied' : 'Copy Machine ID'}
            </button>
          </div>
          <div className="font-mono text-sm font-bold tracking-wider text-amber-300 break-all select-all">
            {status?.machineId || 'Generating Machine ID...'}
          </div>
        </div>

        {isVip ? (
          <div className="space-y-3 pt-2">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                <CheckCircle2 className="h-5 w-5" /> All VIP Pro Features Unlocked
              </div>
              <p className="text-xs text-slate-300">
                Owner / Store Name: <strong className="text-white">{status?.customerName || 'Valued Store Owner'}</strong>
              </p>
              {status?.activatedAt && (
                <p className="text-[11px] text-slate-400">
                  Activated on: {new Date(status.activatedAt).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => void deactivate()}
                className="btn-ghost text-xs text-rose-400 hover:text-rose-300"
              >
                Deactivate License on this PC
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Activation Instructions */}
            <div className="rounded-xl bg-ink-950/70 p-4 border border-ink-line space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Upgrade to VIP Pro for ₱500 Lifetime (No Subscriptions)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Maya Card */}
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-300 font-medium block">Send ₱500 via Maya:</span>
                    <span className="font-mono font-bold text-white text-base">0991 225 5156</span>
                    <span className="text-[10px] text-emerald-400/70 block">Ian / Dev Francis</span>
                  </div>
                  <button
                    onClick={() => void copyMayaNumber()}
                    className="btn-ghost border-emerald-500/40 text-emerald-300 p-2 text-xs"
                    title="Copy Maya Number"
                  >
                    {copiedMaya ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                {/* Facebook Contact Card */}
                <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-blue-300 font-medium block">Message on Facebook:</span>
                    <span className="font-semibold text-white text-xs block">fb.com/Ukauru</span>
                    <span className="text-[10px] text-blue-400/70 block">Send Machine ID & Receipt</span>
                  </div>
                  <button
                    onClick={openFacebook}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium p-2 rounded-lg flex items-center gap-1 text-xs transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={(e) => void activate(e)} className="space-y-3 pt-2">
                <div className="text-xs font-semibold text-slate-300">
                  Enter your VIP License Key:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Store Name (Optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input text-xs sm:col-span-1"
                  />
                  <input
                    type="text"
                    required
                    placeholder="VIP-XXXX-XXXX-XXXX-XXXX"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
                    className="input font-mono text-sm tracking-wider uppercase sm:col-span-2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !keyInput.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-ink-950 border-0 shadow-md"
                >
                  <KeyRound className="h-4 w-4" />
                  {loading ? 'Verifying Hardware Signature...' : 'Activate VIP Pro Lifetime'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
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
  const exportUniversal = async () => {
    try {
      const path = await window.api.backup.exportTinda()
      if (path) toastSuccess('Universal backup exported', path)
    } catch (e) { toastError('Export failed', String((e as Error)?.message || e)) }
  }
  const importUniversal = async () => {
    if (!window.confirm('Import a .tinda-backup file? The current database is safety-backed up, replaced, verified, and TINDA POS restarts.')) return
    try {
      const path = await window.api.backup.importTinda()
      if (path) toastSuccess('Universal backup imported', 'TINDA POS is restarting...')
    } catch (e) { toastError('Import failed', String((e as Error)?.message || e)) }
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
    <div className="space-y-4">
      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-100">Database & backups</h2>
        <p className="mt-1 text-xs text-slate-400">Database: <span className="font-mono text-slate-300">{databaseFile}</span></p>
        <p className="mt-0.5 text-xs text-slate-400">Backups: <span className="font-mono text-slate-300">{backupDir}</span></p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => void backupNow()} className="btn-primary flex items-center gap-2 text-xs"><Save className="h-3.5 w-3.5" /> Back Up Now</button>
          <button onClick={() => void showRestore()} className="btn-ghost flex items-center gap-2 text-xs"><RotateCcw className="h-3.5 w-3.5" /> Restore from Backup</button>
          <button onClick={() => void window.api.backup.openFolder()} className="btn-ghost flex items-center gap-2 text-xs"><FolderOpen className="h-3.5 w-3.5" /> Open Backup Folder</button>
          <button onClick={() => void exportUniversal()} className="btn-ghost flex items-center gap-2 text-xs"><HardDriveDownload className="h-3.5 w-3.5" /> Export Universal Backup</button>
          <button onClick={() => void importUniversal()} className="btn-ghost flex items-center gap-2 text-xs"><Download className="h-3.5 w-3.5" /> Import Universal Backup</button>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-100">Storage Location</h2>
        <p className="mt-1 text-xs text-slate-400">Active mode: <span className="font-semibold text-slate-200">{location?.label || 'Shared AppData'}</span></p>
        <p className="mt-0.5 text-xs text-slate-400">Active directory: <span className="font-mono text-slate-300">{location?.root || 'Loading...'}</span></p>
        <div className="mt-4 flex flex-wrap gap-2">
          {location?.mode === 'SHARED' && location.portableAvailable && (
            <button onClick={() => setPortableOpen(true)} className="btn-ghost flex items-center gap-2 text-xs"><Database className="h-3.5 w-3.5" /> Use Portable Data Beside EXE</button>
          )}
          {location?.mode === 'PORTABLE' && (
            <button onClick={() => void switchToShared()} className="btn-ghost flex items-center gap-2 text-xs"><Database className="h-3.5 w-3.5" /> Switch Back to Shared AppData</button>
          )}
        </div>
      </div>

      <div className="card border-rose-500/20 p-5">
        <h2 className="text-base font-semibold text-rose-300">Danger Zone</h2>
        <p className="mt-1 text-xs text-slate-400">Irreversible actions. Backups are strongly recommended before proceeding.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setNewStoreOpen(true)} className="btn-ghost border-rose-500/30 text-xs text-rose-300 hover:bg-rose-500/10">Start New Store</button>
          <button onClick={() => setOpen(true)} className="btn-ghost border-rose-500/30 text-xs text-rose-300 hover:bg-rose-500/10">Reset Database</button>
        </div>
      </div>

      {open && <Modal open onClose={() => setOpen(false)} title="Reset Database" maxWidth="max-w-md" footer={<><button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button><button onClick={() => void reset()} disabled={confirmation !== 'RESET' || resetting} className="btn-danger">Confirm Reset</button></>}>
        <p className="text-sm font-semibold text-rose-400">Warning: All sales, products, and user accounts will be permanently erased.</p><p className="mt-2 text-sm text-slate-400">A verified safety backup will be created before resetting. Type RESET below to confirm.</p><div className="mt-4"><label className="label">Type RESET to confirm</label><input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="input w-full" autoFocus /></div>
      </Modal>}

      {newStoreOpen && <Modal open onClose={() => setNewStoreOpen(false)} title="Start New Store" maxWidth="max-w-md" footer={<><button onClick={() => setNewStoreOpen(false)} className="btn-ghost">Cancel</button><button onClick={() => void startNewStore()} disabled={newStoreConfirmation !== 'NEW STORE' || resetting} className="btn-danger">Confirm New Store</button></>}>
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

function AboutTab({ isVip, onUpgradeClick }: { isVip?: boolean; onUpgradeClick?: () => void }): React.JSX.Element {
  const copyMaya = async () => {
    try {
      await navigator.clipboard.writeText('09912255156')
      toastSuccess('Maya number copied: 09912255156')
    } catch { toastError('Could not copy number') }
  }

  const openFacebook = () => {
    void window.api.app.openExternal('https://www.facebook.com/Ukauru')
  }

  return (
    <div className="space-y-4">
      <SoftwareUpdatePanel />
      <div className="card overflow-hidden">
        <div className="developer-card p-8 text-center">
          <div className="coffee-float relative z-10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-pop ring-1 ring-white/10"><Coffee className="h-7 w-7" /></div>
          <p className="dev-signature signature-reveal relative z-10 text-3xl italic text-white">Crafted with care</p>
          <p className="mt-1 text-sm text-slate-400">by</p>
          <p className="dev-signature signature-reveal relative z-10 text-2xl font-bold text-brand-300">Dev Francis</p>
          <div className="mx-auto my-5 h-px max-w-xs bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
          
          <p className="text-sm text-slate-300">
            {isVip
              ? 'Thank you for supporting TINDA POS VIP Pro! Your support powers continuous updates and offline retail tools.'
              : 'TINDA POS Community Edition is 100% free. Upgrade to VIP Pro for ₱500 one-time to unlock multi-counter and advanced features.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5">
            {/* Maya Donation Card */}
            <button onClick={() => void copyMaya()} className="donation-card flex items-center gap-3 rounded-xl px-4 py-3 text-left w-full sm:w-auto">
              <div className="maya-logo-shell flex h-10 w-16 shrink-0 items-center justify-center rounded-xl bg-white shadow-card"><MayaMark /></div>
              <span>
                <span className="dev-signature block text-xs font-bold text-brand-300">Maya Payment / Coffee</span>
                <span className="font-mono text-base font-bold tracking-wider text-white">0991 225 5156</span>
                <span className="block text-[8px] uppercase tracking-[0.18em] text-slate-500">Tap to copy</span>
              </span>
              <Copy className="ml-1 h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Facebook Card */}
            <button onClick={openFacebook} className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-3 rounded-xl px-4 py-3 text-left w-full sm:w-auto transition shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <MessageCircle className="h-5 w-5" />
              </div>
              <span>
                <span className="block text-xs font-medium text-blue-200">Official Facebook</span>
                <span className="font-bold text-sm text-white">Dev Francis</span>
                <span className="block text-[8px] uppercase tracking-[0.18em] text-blue-300">fb.com/Ukauru</span>
              </span>
              <ExternalLink className="ml-1 h-3.5 w-3.5 text-blue-200" />
            </button>
          </div>

          {!isVip && onUpgradeClick && (
            <div className="pt-5">
              <button
                type="button"
                onClick={onUpgradeClick}
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-ink-950 border-0 shadow-lg"
              >
                <Crown className="h-4 w-4" /> Upgrade to VIP Pro (₱500 Lifetime)
              </button>
            </div>
          )}
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
    <svg viewBox="0 0 76 32" className="h-7 w-16" role="img" aria-label="Maya">
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
    <div className="card p-5">
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
    <div className="card p-5">
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
    } catch (e) { toastError('Could not load users', String((e as Error)?.message || e)) }
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
    <div>
      <div className="mb-4 flex justify-between">
        <p className="text-sm text-slate-400">{users.length} users</p>
        <button onClick={() => setEditing({ id: null, username: '', password: '', pin: '', full_name: '', roles: ['CASHIER'] })} className="btn-primary flex items-center gap-2"><UserPlus className="h-4 w-4" /> New User</button>
      </div>
      <div className="card table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="w-[28%]">User</th>
              <th className="w-[22%]">Username</th>
              <th className="w-[20%]">Roles</th>
              <th className="w-[14%]">Status</th>
              <th className="w-[16%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="w-[28%] font-medium text-slate-200">{u.full_name}</td>
                <td className="w-[22%] text-slate-400">{u.username}</td>
                <td className="w-[20%] text-slate-300">{u.roles.join(', ')}</td>
                <td className="w-[14%]"><span className={`badge ${u.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="w-[16%]">
                  <div className="flex justify-center gap-1">
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
