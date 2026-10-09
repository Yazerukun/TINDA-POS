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
  Database,
  Cloud,
  Eye,
  EyeOff,
  Globe,
  BookOpen,
  Zap,
  Tag
} from 'lucide-react'
import type { BackupInfo, User, LicenseStatus } from '@shared/types'
import type { DataLocationStatus, PrinterChoice } from '@shared/ipc'
import { printerPick, printerStatusLabel, autoDetectLabelPrinter } from '@shared/printer'
import { Modal } from '../components/ui/Modal'
import { AppLogo } from '../components/AppLogo'
import { useSettings } from '../stores/settings'

import { toastSuccess, toastError } from '../stores/toast'
import { ReceiptPaper } from '../components/ReceiptPaper'
import { NetworkSettingsTab } from '../components/NetworkSettingsTab'
import { VipUpgradeModal } from '../components/VipUpgradeModal'
import { VipUpgradeBanner } from '../components/VipUpgradeBanner'
import { LegalModal, type LegalTab } from '../components/LegalModal'
import { useLicense } from '../stores/license'
import { ThemeSelector } from '../components/theme/ThemeSelector'
import { useUpdate } from '../stores/update'
import { RollbackModal } from '../components/update/RollbackModal'

type Tab = 'HOME' | 'RECEIPT' | 'USERS' | 'DATA' | 'NETWORK' | 'CLOUD' | 'VIP' | 'ABOUT'

export function Settings(): React.JSX.Element {
  const { load } = useSettings()
  const { status: licenseStatus, isVip, loadLicense } = useLicense()
  const [tab, setTab] = useState<Tab>('HOME')
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  useEffect(() => {
    void load()
    void loadLicense()
  }, [load, loadLicense])

  return (
    <div className="p-4 md:p-6 min-h-full">
      {/* Centered Main Settings Container */}
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Settings Header with VIP Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-ink-line">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              Settings
              {isVip ? (
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
              Store preferences, thermal printers, staff accounts, database, multi-counter network, and VIP license.
            </p>
          </div>

          {!isVip && (
            <button
              onClick={() => setUpgradeModalOpen(true)}
              className="btn-primary self-start sm:self-auto flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-ink-950 border-0 shadow-md transition active:scale-95"
            >
              <Crown className="h-3.5 w-3.5" /> Upgrade to VIP (₱500)
            </button>
          )}
        </div>

        {/* Sliding Banner for Community Edition */}
        {!isVip && (
          <VipUpgradeBanner onUpgradeClick={() => setUpgradeModalOpen(true)} isVip={isVip} />
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
            <Network className="h-4 w-4" /> Multi-PC Network
          </button>
          <button
            onClick={() => setTab('CLOUD')}
            className={`btn-ghost flex items-center gap-2 text-xs md:text-sm px-3.5 py-2 ${
              tab === 'CLOUD' ? '!border-sky-500 !text-sky-400 !bg-sky-500/10' : ''
            }`}
          >
            <Cloud className="h-4 w-4 text-sky-400" /> Cloud Dashboard (VIP)
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
              <ThemeSelector />
              <StartupSetting />
              <StoreSettingsTab isVip={isVip} onUpgradeClick={() => setUpgradeModalOpen(true)} />
            </div>
          )}

          {tab === 'RECEIPT' && (
            <div className="w-full max-w-2xl">
              <ReceiptSettingsTab isVip={isVip} onUpgradeClick={() => setUpgradeModalOpen(true)} />
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
          {tab === 'CLOUD' && (
            <div className="w-full max-w-3xl">
              <CloudSettingsTab isVip={isVip} onUpgradeClick={() => setUpgradeModalOpen(true)} />
            </div>
          )}
          {tab === 'VIP' && (
            <div className="w-full max-w-2xl">
              <VipSettingsTab onActivated={() => void loadLicense()} />
            </div>
          )}
          {tab === 'ABOUT' && (
            <div className="w-full max-w-xl">
              <AboutTab onUpgradeClick={() => setUpgradeModalOpen(true)} isVip={isVip} />
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
    case 'ERROR': return 'Update check failed'
    case 'DISMISSED': return 'Up to date'
    default: return 'Up to date'
  }
}

function SoftwareUpdatePanel(): React.JSX.Element {
  const { event, check, checking, openHub } = useUpdate()
  const [busy, setBusy] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [rollbackOpen, setRollbackOpen] = useState(false)

  const installed = event?.installedVersion || '1.0.89'
  const available = event?.available?.version ?? ''
  const status = event?.status || 'IDLE'
  const isChecking = status === 'CHECKING' || checking
  const isUpdateAvailable = status === 'UPDATE_AVAILABLE'

  const handleCheck = async () => {
    setBusy(true)
    try {
      await check(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-5 border border-ink-line/80 bg-ink-900 shadow-md rounded-2xl">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <RefreshCw className={`h-4 w-4 text-emerald-400 ${isChecking ? 'animate-spin' : ''}`} />
          Software Update &amp; Maintenance
        </h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            status === 'ERROR'
              ? 'bg-red-500/15 text-red-300 border border-red-500/30'
              : isUpdateAvailable
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
              : isChecking || status === 'DOWNLOADING'
              ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {statusLabel(status)}
        </span>
      </div>

      <div className="space-y-2 rounded-xl bg-ink-950/70 p-3.5 border border-ink-line/60 text-xs text-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Installed Version:</span>
          <span className="font-mono font-bold text-white">v{installed}</span>
        </div>
        {available && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Latest Available:</span>
            <span className="font-mono font-bold text-emerald-400">v{available}</span>
          </div>
        )}
        {event?.lastCheckedAt && (
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Last Checked:</span>
            <span className="font-mono">{new Date(event.lastCheckedAt).toLocaleTimeString()}</span>
          </div>
        )}
        {event?.message && <p className="pt-1 text-[11px] text-slate-400">{event.message}</p>}

        {status === 'DOWNLOADING' && event?.progress && (
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="flex items-center gap-1 font-medium text-slate-200">
                <Loader2 className="h-3 w-3 animate-spin text-brand-400" />
                Downloading update package…
              </span>
              <span className="font-mono font-bold text-white">{event.progress.percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${Math.max(5, event.progress.percent)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleCheck()}
          disabled={busy || isChecking || status === 'DOWNLOADING'}
          className="btn-primary flex items-center gap-2 px-3.5 py-2 text-xs font-bold shadow-sm"
        >
          {isChecking ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Checking GitHub…</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Check for Updates Now</span>
            </>
          )}
        </button>

        {isUpdateAvailable && (
          <button
            type="button"
            onClick={openHub}
            className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/10 shadow-sm"
          >
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span>Open Update Hub (v{available})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setRollbackOpen(true)}
          className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs text-amber-300 hover:text-amber-200 hover:bg-amber-500/10"
          title="Safely restore previous stable version"
        >
          <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
          <span>Version Rollback</span>
        </button>

        {event?.available && (
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className="btn-ghost flex items-center gap-1.5 px-2.5 py-2 text-xs text-slate-300 hover:text-white"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>{showNotes ? "Hide What's New" : "What's New"}</span>
          </button>
        )}
      </div>

      {showNotes && event?.available?.releaseNotes && (
        <div className="mt-3.5 max-h-48 overflow-y-auto rounded-xl bg-ink-950/80 p-3.5 text-xs leading-relaxed text-slate-300 border border-ink-line scrollbar-thin">
          <p className="mb-1 font-semibold text-white">What&apos;s New in v{event.available.version}</p>
          <pre className="whitespace-pre-wrap font-sans text-xs">{event.available.releaseNotes}</pre>
        </div>
      )}

      <RollbackModal open={rollbackOpen} onClose={() => setRollbackOpen(false)} currentVersion={installed} />
    </div>
  )
}

function AboutTab({ isVip, onUpgradeClick }: { isVip?: boolean; onUpgradeClick?: () => void }): React.JSX.Element {
  const [legalOpen, setLegalOpen] = useState(false)
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy')

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

          {/* Privacy Policy & Terms of Service Links */}
          <div className="pt-6 mt-6 border-t border-ink-line/60 flex items-center justify-center gap-3 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => { setLegalTab('privacy'); setLegalOpen(true); }}
              className="hover:text-emerald-400 hover:underline transition"
            >
              Privacy Policy
            </button>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={() => { setLegalTab('terms'); setLegalOpen(true); }}
              className="hover:text-amber-400 hover:underline transition"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>

      <LegalModal
        open={legalOpen}
        initialTab={legalTab}
        onClose={() => setLegalOpen(false)}
      />
    </div>
  )
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

function StoreSettingsTab({ isVip, onUpgradeClick }: { isVip?: boolean; onUpgradeClick?: () => void }): React.JSX.Element {
  const { settings, update } = useSettings()
  const [f, setF] = useState({
    store_name: settings?.store_name ?? '',
    owner_name: settings?.owner_name ?? '',
    address: settings?.address ?? '',
    phone: settings?.phone ?? '',
    tin: settings?.tin ?? '',
    default_low_stock: settings?.default_low_stock ?? 5,
    allow_negative_inventory: settings?.allow_negative_inventory ?? false,
    default_tax_c: settings?.default_tax_c ?? 0,
    logo_path: settings?.logo_path ?? null as string | null
  })
  const [saving, setSaving] = useState(false)
  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }))

  useEffect(() => {
    if (settings) {
      setF({
        store_name: settings.store_name ?? '',
        owner_name: settings.owner_name ?? '',
        address: settings.address ?? '',
        phone: settings.phone ?? '',
        tin: settings.tin ?? '',
        default_low_stock: settings.default_low_stock ?? 5,
        allow_negative_inventory: settings.allow_negative_inventory ?? false,
        default_tax_c: settings.default_tax_c ?? 0,
        logo_path: settings.logo_path ?? null
      })
    }
  }, [settings])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 2MB for fast offline storage
    if (file.size > 2 * 1024 * 1024) {
      toastError('File Too Large', 'Please select a logo under 2MB (PNG, JPG, or SVG).')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      set({ logo_path: base64 })
      toastSuccess('Logo Selected', 'Click "Save Settings" below to apply your store logo across TINDA POS.')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    set({ logo_path: null })
    toastSuccess('Logo Removed', 'Click "Save Settings" to revert to the default mark.')
  }

  const save = async () => {
    setSaving(true)
    try {
      await update({
        store_name: f.store_name,
        owner_name: f.owner_name,
        address: f.address,
        phone: f.phone,
        tin: f.tin,
        default_low_stock: f.default_low_stock,
        allow_negative_inventory: f.allow_negative_inventory,
        default_tax_c: f.default_tax_c,
        logo_path: f.logo_path
      })
      toastSuccess('Settings saved')
    } catch (e) {
      toastError('Save failed', String((e as Error)?.message || e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="space-y-4">
        {/* Custom Logo Upload Section */}
        <div className="rounded-xl border border-ink-line bg-ink-950 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Store Identity Logo</span>
                {isVip && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/25">
                    VIP PRO
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-400">
                Displays in the sidebar header, hardware tools, and cashier terminal.
              </p>
            </div>
            {!isVip && (
              <button
                type="button"
                onClick={onUpgradeClick}
                className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300"
              >
                <Crown className="h-3.5 w-3.5" /> Unlock with VIP Pro
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 mt-3">
            {/* Logo Preview Square */}
            <div className="h-16 w-16 rounded-xl border border-ink-line bg-ink-900 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {f.logo_path ? (
                <img src={f.logo_path} alt="Custom Store Logo" className="h-full w-full object-contain p-1" />
              ) : (
                <AppLogo size={42} showBadge={false} isVip={isVip} />
              )}
            </div>

            <div className="flex-1 space-y-2">
              {isVip ? (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="btn-secondary text-xs px-3 py-1.5 cursor-pointer flex items-center gap-1.5">
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>
                  {f.logo_path && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="btn-ghost text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1.5"
                    >
                      Remove Logo
                    </button>
                  )}
                  <span className="text-[11px] text-slate-500">Max 2MB (PNG, JPG, SVG)</span>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Custom branding is exclusive to VIP Pro merchants. Upgrade once to upload your own official brand mark!
                </p>
              )}
            </div>
          </div>
        </div>

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


function ReceiptSettingsTab({ isVip, onUpgradeClick }: { isVip?: boolean; onUpgradeClick?: () => void }): React.JSX.Element {
  const { settings, update } = useSettings()
  const [f, setF] = useState({
    receipt_header: settings?.receipt_header ?? '',
    receipt_title: settings?.receipt_title ?? '',
    receipt_show_app_name: settings?.receipt_show_app_name ?? true,
    receipt_footer: settings?.receipt_footer ?? '',
    receipt_printer: settings?.receipt_printer ?? '',
    auto_print_after_sale: settings?.auto_print_after_sale ?? false,
    receipt_paper_width: settings?.receipt_paper_width ?? ('80mm' as '58mm' | '80mm'),
    receipt_copies: settings?.receipt_copies ?? 1,
    manual_print_dialog: settings?.manual_print_dialog ?? false,
    label_printer: settings?.label_printer ?? '',
    label_paper_size: settings?.label_paper_size ?? '40x30'
  })
  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }))
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [printers, setPrinters] = useState<PrinterChoice[]>([])

  useEffect(() => {
    if (settings) {
      setF({
        receipt_header: settings.receipt_header,
        receipt_title: settings.receipt_title,
        receipt_show_app_name: settings.receipt_show_app_name,
        receipt_footer: settings.receipt_footer,
        receipt_printer: settings.receipt_printer,
        auto_print_after_sale: settings.auto_print_after_sale,
        receipt_paper_width: settings.receipt_paper_width,
        receipt_copies: settings.receipt_copies,
        manual_print_dialog: settings.manual_print_dialog ?? false,
        label_printer: settings.label_printer || '',
        label_paper_size: settings.label_paper_size || '40x30'
      })
    }
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
      const is58 = /(58|pb-?58|jk-?58|pos-?58|xp-?58|58h|jp-?58|kp-?58)/i.test(pick.name)
      setF((prev) => (prev.receipt_printer === settings.receipt_printer ? {
        ...prev,
        receipt_printer: pick.name,
        receipt_paper_width: is58 ? '58mm' : prev.receipt_paper_width
      } : prev))
    }
  }, [printers, settings])

  const pick = printerPick(printers, f.receipt_printer)
  const detectedLabel = autoDetectLabelPrinter(printers, f.label_printer)

  const save = async () => {
    setSaving(true)
    try {
      await update({
        receipt_header: f.receipt_header,
        receipt_title: f.receipt_title,
        receipt_show_app_name: f.receipt_show_app_name,
        receipt_footer: f.receipt_footer,
        manual_print_dialog: f.manual_print_dialog,
        label_printer: f.label_printer,
        label_paper_size: f.label_paper_size
      })
      await window.api.printer.save({
        name: f.receipt_printer,
        autoPrint: f.auto_print_after_sale,
        paperWidth: f.receipt_paper_width,
        copies: f.receipt_copies,
        manualPrintDialog: f.manual_print_dialog
      })
      if (window.api?.printer?.saveLabel) {
        await window.api.printer.saveLabel({
          name: f.label_printer,
          paperSize: f.label_paper_size
        })
      }
      toastSuccess('Printer settings saved')
    } catch (e) { toastError('Save failed', String((e as Error)?.message || e)) } finally { setSaving(false) }
  }

  const testPrint = async (manual = false) => {
    try {
      await window.api.printer.save({
        name: f.receipt_printer,
        autoPrint: f.auto_print_after_sale,
        paperWidth: f.receipt_paper_width,
        copies: f.receipt_copies,
        manualPrintDialog: f.manual_print_dialog
      })
      const result = await window.api.printer.testPrint({ manual })
      if (result.ok) toastSuccess(manual ? 'Manual print dialog opened' : 'Test print sent', result.message)
      else if (result.code !== 'DISABLED') toastError('Test print failed', result.message)
    } catch (e) { toastError('Test print failed', String((e as Error)?.message || e)) }
  }

  const testPrintLabel = async (manual = false) => {
    try {
      if (window.api?.printer?.saveLabel) {
        await window.api.printer.saveLabel({
          name: f.label_printer,
          paperSize: f.label_paper_size
        })
      }
      const targetDevice = f.label_printer || detectedLabel?.name || undefined
      const res = await window.api.printer.testPrintLabel({ manual, deviceName: targetDevice })
      if (res.ok) toastSuccess(manual ? 'System dialog ready' : 'CT221B Test Sticker Printed', res.message)
      else toastError('CT221B Test Failed', res.message)
    } catch (e) {
      toastError('Test print failed', String((e as Error)?.message || e))
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-ink-line px-3 py-2"><div><p className="text-sm text-slate-200">Show TINDA POS App Name</p><p className="text-xs text-slate-500">Turn this off to remove TINDA POS from the receipt heading.</p></div><Toggle on={f.receipt_show_app_name} onClick={() => set({receipt_show_app_name: !f.receipt_show_app_name})}/></div>
        <div><label className="label">Receipt Title</label><input value={f.receipt_title} onChange={e=>set({receipt_title:e.target.value})} placeholder="JUAN STORE" className="input w-full"/></div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">Receipt Header (shown on top)</label>
            {!isVip && (
              <button
                type="button"
                onClick={onUpgradeClick}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300"
              >
                <Crown className="h-3 w-3" /> VIP Pro Feature
              </button>
            )}
          </div>
          <textarea
            value={f.receipt_header}
            onChange={(e) => set({ receipt_header: e.target.value })}
            rows={2}
            className="input w-full"
            placeholder={!isVip ? 'Custom store logo, DTI, BIR & VAT headers (Unlocked with VIP Pro)' : 'DTI/BIR header, store motto, etc.'}
          />
        </div>
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
        <div className="flex items-center justify-between rounded-lg border border-ink-line px-3 py-2"><div><p className="text-sm text-slate-200">Auto Print After Sale</p><p className="text-xs text-slate-500">One silent print job, sent automatically after checkout commits.</p></div><Toggle on={f.auto_print_after_sale} onClick={() => set({ auto_print_after_sale: !f.auto_print_after_sale })} /></div>
        <div className="flex items-center justify-between rounded-lg border border-ink-line px-3 py-2"><div><p className="text-sm text-slate-200">Always Open Manual Print Dialog</p><p className="text-xs text-slate-500">Opens the Windows System Print Dialog on checkout so you can manually select the printer and verify settings.</p></div><Toggle on={f.manual_print_dialog} onClick={() => set({ manual_print_dialog: !f.manual_print_dialog })} /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="label">Paper Width</label><select value={f.receipt_paper_width} onChange={(e) => set({ receipt_paper_width: e.target.value as '58mm' | '80mm' })} className="input w-full"><option value="58mm">58mm</option><option value="80mm">80mm (default)</option></select></div><div><label className="label">Copies</label><input type="number" min={1} max={3} value={f.receipt_copies} onChange={(e) => set({ receipt_copies: Math.max(1, Math.min(3, Math.trunc(Number(e.target.value) || 1))) })} className="input w-full" /></div></div>
        <div>
          <p className="label">Live Receipt Preview</p>
          <ReceiptPaper
            width={f.receipt_paper_width}
            lines={[
              ...(isVip ? f.receipt_header.trim().split(/\r?\n/).filter(Boolean) : []),
              ...(f.receipt_title.trim() ? [f.receipt_title.trim()] : []),
              ...(f.receipt_show_app_name && f.receipt_title.trim().toUpperCase() !== 'TINDA POS' ? ['TINDA POS'] : []),
              settings?.store_name || 'My Sari-Sari Store',
              '--------------------------------',
              'TPOS-PREVIEW',
              '1 x Sample Item        10.00',
              'TOTAL                  10.00',
              '--------------------------------',
              f.receipt_footer || 'Thank you for your purchase!',
              ...(!isVip ? ['[ Powered by TINDA POS Free Community ]'] : [])
            ]}
          />

        </div>
        <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-3.5 text-xs text-teal-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-teal-300">
              <Printer className="h-4 w-4 text-teal-400" />
              <span>GOOJPRT 58H (JP-58BL / POS-58) Zero-Blur Hardware Guide:</span>
            </div>
            <span className="text-[10px] text-teal-400/80 font-mono">203 DPI / 90mm/s</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px] leading-relaxed">
            <li><strong>Official User Manual:</strong> Refer to the official <a href="https://manuals.plus/ae/1005008661058283" target="_blank" rel="noreferrer" className="text-teal-300 underline font-semibold">GOOJPRT 58H User Manual</a> for complete specifications and port diagrams.</li>
            <li><strong>How to Eliminate Blurry or Faint Text:</strong>
              <ul className="list-circle pl-4 mt-0.5 space-y-0.5 text-emerald-200">
                <li>TINDA POS automatically applies <strong>Zero-Blur 203 DPI Monochrome Typography</strong> (disables subpixel antialiasing and dithering so dots burn solid pitch black).</li>
                <li>In Windows: Go to <em>Printers &amp; Scanners &rarr; Your Printer &rarr; Printing Preferences &rarr; Advanced / Options</em>. Set <strong>Print Density / Darkness</strong> to <strong>Dark (Level 12-15)</strong> and <strong>Dithering / Halftone</strong> to <strong>None</strong>.</li>
                <li>Clean the thermal printhead periodically with a cotton swab lightly dampened with isopropyl alcohol (Section 7.1).</li>
              </ul>
            </li>
            <li><strong>Blank Receipt or Paper Does Not Feed? (Troubleshooting):</strong>
              <ul className="list-circle pl-4 mt-0.5 space-y-0.5 text-amber-200">
                <li><strong>Thermal Paper Scratch Test:</strong> Thermal paper only reacts on one chemically-treated side. Scratch the paper with your fingernail; if a dark mark appears, that side must <em>face the thermal printhead heater</em>. If reversed, the paper feeds blank.</li>
                <li><strong>Windows USB Port Mapping:</strong> In Windows <em>Printer Properties &rarr; Ports</em>, ensure the active Virtual USB Port (e.g., <code>USB001</code>) is checked.</li>
                <li><strong>Hardware Self-Test:</strong> Power off printer, hold the <strong>FEED button</strong>, and turn on power while holding FEED. Release after 2 seconds to print an internal test slip confirming printhead health.</li>
              </ul>
            </li>
            <li><strong>Manual Print Mode:</strong> If your thermal printer experiences driver communication lag, click <strong>Manual Test Print (Dialog)</strong> below or use <strong>Manual Print</strong> in Checkout to send receipts directly through the Windows Print Spooler.</li>
          </ul>
        </div>

        <p className="rounded-lg border border-ink-line bg-ink-900 px-3 py-2 text-xs text-slate-400">Prints through the Windows printer driver using the exact device name Electron reports. Zero-margin spooling and automatic paper-height tracking are calibrated for seamless thermal feed. Sales still complete safely if the printer is missing or offline.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void save()} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="h-4 w-4" /> Save Receipt
          </button>
          <button onClick={() => void testPrint(false)} disabled={!f.receipt_printer} className="btn-ghost flex items-center gap-2">
            <Printer className="h-4 w-4" /> Auto Test Print
          </button>
          <button
            type="button"
            onClick={() => void testPrint(true)}
            className="btn-ghost flex items-center gap-2 text-sky-300 hover:text-white border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20"
            title="Open Windows Print Dialog to test printer selection and darkness settings"
          >
            <Printer className="h-4 w-4" /> Manual Test Print (Dialog)
          </button>
        </div>
      </div>
    </div>

    {/* Chiteng CT221B Barcode & Thermal Label Printer Hub */}
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3 border-b border-ink-line pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/40 bg-indigo-500/10 text-indigo-400">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Chiteng CT221B Barcode &amp; Label Printer
              {detectedLabel?.isCt221b && (
                <span className="badge border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  CT221B Detected
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">Dedicated portable thermal sticker printer for shelf price tags, barcodes, and expiry labels.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadPrinters()}
          disabled={refreshing}
          className="btn-ghost flex items-center gap-1.5 text-xs"
        >
          {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="label">Target Label Printer</label>
          <select
            value={f.label_printer}
            onChange={(e) => set({ label_printer: e.target.value })}
            className="input w-full"
          >
            <option value="">
              {detectedLabel ? `Auto-Detected: ${detectedLabel.name}` : 'No label printer selected (Uses System Default)'}
            </option>
            {printers.map((printer) => {
              const isCt = /(ct-?221b?|ct221|clabel|chiteng|驰腾|dudian)/i.test(printer.name)
              return (
                <option key={printer.name} value={printer.name}>
                  {printer.displayName || printer.name} {isCt ? '· (Chiteng CT221B)' : ''} {printer.isDefault ? '(Default)' : ''}
                </option>
              )
            })}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Default Thermal Roll Size</label>
            <select
              value={f.label_paper_size}
              onChange={(e) => set({ label_paper_size: e.target.value })}
              className="input w-full"
            >
              <option value="40x30">40 × 30 mm (CT221B Standard Retail)</option>
              <option value="50x30">50 × 30 mm (Wide Shelf &amp; Pharmacy)</option>
              <option value="30x20">30 × 20 mm (Micro Grocery Sticker)</option>
              <option value="40x20">40 × 20 mm (Slim Barcode Pouch Tag)</option>
            </select>
          </div>
          <div>
            <label className="label">Auto-Detection Status</label>
            <div className="input flex items-center justify-between bg-ink-900 border-ink-line text-xs">
              <span className={detectedLabel ? 'text-emerald-400 font-semibold flex items-center gap-1' : 'text-slate-400'}>
                {detectedLabel ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    {detectedLabel.name}
                  </>
                ) : (
                  'Searching for USB / Bluetooth…'
                )}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">USB / BT</span>
            </div>
          </div>
        </div>

        {/* Quick Hardware Guide Callout */}
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 text-xs text-indigo-200 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-indigo-300">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Chiteng CT221B Setup &amp; Alignment Instructions:</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px] leading-relaxed">
            <li><strong>PC USB Driver:</strong> When plugged in for the first time, Windows installs the driver automatically. If needed, download the official PC driver from <a href="http://www.ctaiot.com" target="_blank" rel="noreferrer" className="text-indigo-300 underline font-semibold">www.ctaiot.com</a>.</li>
            <li><strong>Paper Roll Loading:</strong> Slide the paper guide to <code>OPEN</code>, insert the thermal label roll against the left guide, push the clamp to hug the roll snugly, and slide latch back to <code>CLOSE</code>.</li>
            <li><strong>No Ink Needed:</strong> Uses direct thermal barcode paper. High-density Code 128 barcodes print in ~0.5 seconds per label.</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button onClick={() => void save()} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="h-4 w-4" /> Save Label Settings
          </button>
          <button
            type="button"
            onClick={() => void testPrintLabel(false)}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-2 text-indigo-300 border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20"
          >
            <Sparkles className="h-4 w-4" /> Test Print CT221B Sticker
          </button>
          <button
            type="button"
            onClick={() => void testPrintLabel(true)}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-2 text-sky-300 border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20"
          >
            <Printer className="h-4 w-4" /> Manual Dialog Test
          </button>
        </div>
      </div>
    </div>
  </div>
  )
}

interface UserForm {
  id: number | null
  username: string
  password: string
  confirmPassword: string
  pin: string
  full_name: string
  roles: string[]
  is_active: boolean
}

function UsersTab(): React.JSX.Element {
  const [users, setUsers] = useState<User[]>([])
  const [editing, setEditing] = useState<UserForm | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [resetPin, setResetPin] = useState<{ id: number; full_name: string } | null>(null)
  const [resetPw, setResetPw] = useState<{ id: number; full_name: string } | null>(null)

  // Track logged-in user for guardrails
  const loggedInId = (window as unknown as { __session?: { id: number } }).__session?.id

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
        await window.api.users.update(f.id, {
          username: f.username,
          full_name: f.full_name,
          roles: f.roles,
          is_active: f.is_active,
          password: f.password || undefined,
          pin: f.pin || undefined
        })
        toastSuccess('User updated')
      } else {
        await window.api.users.create({
          username: f.username,
          password: f.password,
          pin: f.pin,
          full_name: f.full_name,
          roles: f.roles
        })
        toastSuccess('User created')
      }
      setEditing(null)
      void load()
    } catch (e) { toastError('Save failed', String((e as Error)?.message || e)) }
  }

  // Deactivation guardrail: count active admins
  const activeAdmins = users.filter((u) => u.is_active && u.roles.includes('ADMIN')).length

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{users.length} users</p>
        <button
          onClick={() => setEditing({ id: null, username: '', password: '', confirmPassword: '', pin: '', full_name: '', roles: ['CASHIER'], is_active: true })}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" /> New User
        </button>
      </div>
      <div className="card table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="w-[26%]">User</th>
              <th className="w-[20%]">Username</th>
              <th className="w-[18%]">Roles</th>
              <th className="w-[12%]">Status</th>
              <th className="w-[24%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="w-[26%] font-medium text-slate-200">{u.full_name}</td>
                <td className="w-[20%] text-slate-400">{u.username}</td>
                <td className="w-[18%] text-slate-300">{u.roles.join(', ')}</td>
                <td className="w-[12%]">
                  <span className={`badge ${u.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="w-[24%]">
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => setEditing({ id: u.id, username: u.username, password: '', confirmPassword: '', pin: '', full_name: u.full_name, roles: u.roles, is_active: u.is_active })}
                      className="btn-ghost-2 rounded-lg p-2"
                      title="Edit user"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setResetPw({ id: u.id, full_name: u.full_name })}
                      className="btn-ghost-2 rounded-lg p-2"
                      title="Reset password"
                    >
                      <KeyRound className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setResetPin({ id: u.id, full_name: u.full_name })}
                      className="btn-ghost-2 rounded-lg p-2"
                      title="Reset PIN"
                    >
                      <span className="text-xs font-bold text-slate-400">PIN</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <UserModal form={editing} roles={roles} activeAdmins={activeAdmins} loggedInId={loggedInId} onSave={save} onClose={() => setEditing(null)} />}
      {resetPin && <ResetPinModal user={resetPin} onClose={() => { setResetPin(null); void load() }} />}
      {resetPw && <ResetPasswordModal user={resetPw} onClose={() => { setResetPw(null); void load() }} />}
    </div>
  )
}

function UserModal({ form, roles, activeAdmins, loggedInId, onSave, onClose }: {
  form: UserForm
  roles: string[]
  activeAdmins: number
  loggedInId?: number
  onSave: (f: UserForm) => void
  onClose: () => void
}): React.JSX.Element {
  const [f, setF] = useState<UserForm>(form)
  const set = (patch: Partial<UserForm>) => setF((p) => ({ ...p, ...patch }))
  const isNew = f.id === null
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPin, setShowPin] = useState(false)

  // Deactivation guardrail: block if this user is the sole admin or is logged in
  const isSelf = loggedInId != null && f.id === loggedInId
  const isSoleAdmin = f.roles.includes('ADMIN') && activeAdmins <= 1 && f.is_active
  const cantDeactivate = isSelf || isSoleAdmin

  const handleSave = () => {
    if (isNew) {
      if (!f.password || f.password.length < 4) { toastError('Password too short', 'At least 4 characters required'); return }
      if (f.password !== f.confirmPassword) { toastError('Passwords do not match'); return }
      if (!/^\d{4}$/.test(f.pin)) { toastError('Invalid PIN', '4 digits required'); return }
    } else {
      if (f.password && f.password !== f.confirmPassword) { toastError('Passwords do not match'); return }
      if (f.pin && !/^\d{4}$/.test(f.pin)) { toastError('Invalid PIN', '4 digits required'); return }
    }
    onSave(f)
  }

  return (
    <Modal open onClose={onClose} title={isNew ? 'New User' : `Edit — ${f.full_name}`} maxWidth="max-w-md" footer={
      <>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={handleSave} className="btn-primary">Save</button>
      </>
    }>
      <div className="space-y-3">
        <div>
          <label className="label">Full Name *</label>
          <input required value={f.full_name} onChange={(e) => set({ full_name: e.target.value })} className="input w-full" placeholder="e.g. Maria Santos" />
        </div>
        <div>
          <label className="label">Username *</label>
          <input required value={f.username} onChange={(e) => set({ username: e.target.value })} className="input w-full" placeholder="e.g. maria" autoComplete="off" />
        </div>

        {/* Password */}
        <div>
          <label className="label">{isNew ? 'Password *' : 'New Password (leave blank to keep)'}</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              required={isNew}
              value={f.password}
              onChange={(e) => set({ password: e.target.value })}
              className="input w-full pr-10"
              placeholder={isNew ? 'Min. 4 characters' : '(unchanged)'}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {(isNew || f.password) && (
          <div>
            <label className="label">Confirm Password *</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required={isNew || !!f.password}
                value={f.confirmPassword}
                onChange={(e) => set({ confirmPassword: e.target.value })}
                className="input w-full pr-10"
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {/* PIN */}
        <div>
          <label className="label">{isNew ? 'PIN (4 digits) *' : 'New PIN (leave blank to keep)'}</label>
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              required={isNew}
              value={f.pin}
              maxLength={4}
              inputMode="numeric"
              onChange={(e) => set({ pin: e.target.value.replace(/\D/g, '') })}
              className="input w-full pr-10 tracking-widest"
              placeholder={isNew ? '••••' : '(unchanged)'}
            />
            <button type="button" onClick={() => setShowPin((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Roles */}
        <div>
          <label className="label">Roles</label>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <button key={r} type="button"
                onClick={() => set({ roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r] })}
                className={`badge cursor-pointer border ${f.roles.includes(r) ? 'bg-brand-600/20 text-brand-300 border-brand-500/40' : 'bg-ink-800 text-slate-400 border-ink-line'}`}
              >{r}</button>
            ))}
          </div>
        </div>

        {/* Active toggle — with guardrails */}
        {!isNew && (
          <div className="flex items-center gap-3">
            <label className="label mb-0">Active</label>
            <button
              type="button"
              disabled={cantDeactivate}
              onClick={() => { if (!cantDeactivate) set({ is_active: !f.is_active }) }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${f.is_active ? 'bg-brand-600' : 'bg-ink-700'} ${cantDeactivate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${f.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            {cantDeactivate && (
              <span className="text-xs text-amber-400">
                {isSelf ? 'Cannot deactivate your own account' : 'Cannot deactivate the sole Admin'}
              </span>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

function ResetPinModal({ user, onClose }: { user: { id: number; full_name: string }; onClose: () => void }): React.JSX.Element {
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    if (pin.length !== 4) { toastError('PIN must be 4 digits'); return }
    setSaving(true)
    try {
      await window.api.auth.adminResetPin(user.id, pin)
      toastSuccess(`PIN reset for ${user.full_name}`)
      onClose()
    } catch (e) { toastError('Reset failed', String((e as Error)?.message || e)) } finally { setSaving(false) }
  }
  return (
    <Modal open onClose={onClose} title={`Reset PIN — ${user.full_name}`} maxWidth="max-w-xs" footer={
      <>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={() => void submit()} disabled={saving} className="btn-primary">Reset PIN</button>
      </>
    }>
      <label className="label">New 4-digit PIN</label>
      <div className="relative">
        <input
          value={pin}
          maxLength={4}
          inputMode="numeric"
          type={showPin ? 'text' : 'password'}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className="input w-full pr-10 text-2xl tracking-widest"
          autoFocus
          placeholder="••••"
        />
        <button type="button" onClick={() => setShowPin((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
          {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Modal>
  )
}

function ResetPasswordModal({ user, onClose }: { user: { id: number; full_name: string }; onClose: () => void }): React.JSX.Element {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    if (pw.length < 4) { toastError('Password too short', 'Minimum 4 characters'); return }
    if (pw !== confirm) { toastError('Passwords do not match'); return }
    setSaving(true)
    try {
      await window.api.auth.adminResetPassword(user.id, pw)
      toastSuccess(`Password reset for ${user.full_name}`)
      onClose()
    } catch (e) { toastError('Reset failed', String((e as Error)?.message || e)) } finally { setSaving(false) }
  }
  return (
    <Modal open onClose={onClose} title={`Reset Password — ${user.full_name}`} maxWidth="max-w-xs" footer={
      <>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={() => void submit()} disabled={saving} className="btn-primary">Reset Password</button>
      </>
    }>
      <div className="space-y-3">
        <div>
          <label className="label">New Password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="input w-full pr-10"
              placeholder="Min. 4 characters"
              autoFocus
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="label">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input w-full pr-10"
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function CloudSettingsTab({ isVip, onUpgradeClick }: { isVip?: boolean; onUpgradeClick: () => void }): React.JSX.Element {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [settings, setSettings] = useState<import('@shared/types').StoreSettings | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const loadStatus = async (): Promise<void> => {
    try {
      const res = await window.api.cloud.status()
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

  const handleToggleSync = async (enabled: boolean): Promise<void> => {
    if (!isVip && enabled) {
      onUpgradeClick()
      return
    }
    try {
      const updated = await window.api.cloud.updateSettings({ cloud_sync_enabled: enabled })
      setSettings(updated)
      toastSuccess(enabled ? 'Cloud sync enabled' : 'Cloud sync disabled')
    } catch (e) {
      toastError('Failed to update sync setting', String((e as Error)?.message || e))
    }
  }

  const handleSyncNow = async (): Promise<void> => {
    setSyncing(true)
    try {
      const res = await window.api.cloud.syncNow()
      if (res.ok) {
        toastSuccess('Cloud Connected', res.message)
      } else {
        toastError('Sync Failed', res.message)
      }
      await loadStatus()
    } catch (e) {
      toastError('Connection error', String((e as Error)?.message || e))
    } finally {
      setSyncing(false)
    }
  }

  const copyText = (val: string, label: string): void => {
    navigator.clipboard.writeText(val)
    toastSuccess('Copied to Clipboard', `${label} copied`)
  }

  const openOwnerWebsite = (): void => {
    void window.api.app.openExternal('https://tinda-owner-dashboard.pages.dev/')
  }

  if (loading) {
    return <div className="card p-8 text-center text-slate-400">Loading Cloud Dashboard Status...</div>
  }

  return (
    <div className="space-y-6">
      {/* VIP Status Card */}
      <div className={`card p-6 border ${isVip ? 'border-sky-500/30 bg-gradient-to-br from-sky-500/5 via-ink-900 to-ink-900' : 'border-ink-line'}`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isVip ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-lg shadow-sky-500/10' : 'bg-ink-800 text-slate-500 border border-ink-line'}`}>
              <Cloud className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">Executive Cloud Owner Dashboard</h3>
                {isVip ? (
                  <span className="badge bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> VIP UNLOCKED
                  </span>
                ) : (
                  <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    VIP PRO REQUIRED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Real-time remote store monitoring for business owners. Check daily sales revenue, stock levels, cashier shifts, and Z-read reports from your smartphone anywhere in the world.
              </p>
            </div>
          </div>

          {!isVip && (
            <button
              onClick={onUpgradeClick}
              className="btn-primary flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-ink-950 border-0 shadow-md"
            >
              <Crown className="h-3.5 w-3.5" /> Unlock VIP Pro
            </button>
          )}
        </div>
      </div>

      {/* Cloud Sync Configuration Card */}
      {settings && (
        <div className="card p-6 border border-ink-line space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-ink-line">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-sky-400" /> Live Cloud Sync Integration
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically pushes sales and stock events to your Cloudflare Worker & Web Dashboard.
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-xs font-semibold text-slate-300">
                {settings.cloud_sync_enabled ? 'Syncing Enabled' : 'Syncing Disabled'}
              </span>
              <input
                type="checkbox"
                checked={Boolean(settings.cloud_sync_enabled)}
                onChange={(e) => void handleToggleSync(e.target.checked)}
                className="w-5 h-5 accent-sky-500 rounded cursor-pointer"
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
                  value={settings.cloud_store_id || 'Generating...'}
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
                Enter this Store ID on your Owner Dashboard to pair this terminal.
              </p>
            </div>

            <div>
              <label className="label">Branch Sync Key (Secret Token)</label>
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
                Secret authentication token for your owner account. Never share publicly.
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
                    : 'Never synced yet'}
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
                onClick={() => void handleSyncNow()}
                disabled={syncing || !settings.cloud_sync_enabled}
                className="btn-ghost flex items-center gap-2 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Connecting...' : 'Sync Now'}
              </button>

              <button
                type="button"
                onClick={() => setShowGuide(true)}
                className="btn-secondary flex items-center gap-1.5 text-xs text-sky-300 border-sky-500/30 hover:border-sky-500/60"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-400" /> Setup Guide
              </button>

              <button
                type="button"
                onClick={openOwnerWebsite}
                className="btn-primary flex items-center gap-2 text-xs bg-sky-600 hover:bg-sky-500 border-0 text-white"
              >
                <Globe className="w-3.5 h-3.5" /> Open Web Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {showGuide && <CloudGuideModal onClose={() => setShowGuide(false)} />}
    </div>
  )
}

function CloudGuideModal({ onClose }: { onClose: () => void }): React.JSX.Element {
  return (
    <Modal
      open
      onClose={onClose}
      title="Guide: Connecting to Owner Cloud Dashboard"
      maxWidth="max-w-2xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <span className="text-xs text-slate-500">TINDA POS VIP Exclusive Feature</span>
          <button onClick={onClose} className="btn-primary text-xs">
            Got it, Close
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-xs text-slate-300">
        <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl space-y-1">
          <p className="font-semibold text-brand-300">
            Monitor your store sales, cashiers, and stock anywhere in the world in real time from your mobile phone or laptop.
          </p>
          <p className="text-[11px] text-slate-400">
            Web Dashboard URL:{' '}
            <button
              onClick={() => void window.api.app.openExternal('https://tinda-owner-dashboard.pages.dev/')}
              className="text-sky-400 underline font-mono hover:text-sky-300"
            >
              https://tinda-owner-dashboard.pages.dev/
            </button>
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-white text-sm">Step 1: Activate Cloud Sync on this POS Terminal</h4>
          <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
            <li>Ensure your VIP Pro license is active on this POS terminal.</li>
            <li>Toggle <strong>Syncing Enabled</strong> to ON.</li>
            <li>Your unique <strong>Store ID</strong> and secret <strong>Sync Key</strong> are automatically generated.</li>
            <li>Click the copy icon to copy your <strong>Store ID</strong> and <strong>Sync Key</strong>.</li>
          </ol>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-white text-sm">Step 2: Access Owner Dashboard</h4>
          <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
            <li>Open the website on your phone, tablet, or browser: <strong className="text-white">https://tinda-owner-dashboard.pages.dev</strong></li>
            <li>If you are a new user, click <strong>Create Owner Account</strong> to create your username and password.</li>
            <li>Log in with your owner credentials.</li>
          </ol>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-white text-sm">Step 3: Connect this Store Branch</h4>
          <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
            <li>In the dashboard, navigate to <strong>Branches / Settings</strong> and click <strong>Add Branch</strong>.</li>
            <li>Paste the <strong>Store ID</strong> and <strong>Sync Key</strong> from this POS terminal.</li>
            <li>Enter your store branch name (e.g., Main Branch).</li>
            <li>Click <strong>Connect Branch</strong>. All completed sales, stock movements, and shift Z-reads will automatically stream live to your phone dashboard!</li>
          </ol>
        </div>
      </div>
    </Modal>
  )
}
