import { useState } from 'react'
import {
  Camera,
  Smartphone,
  Monitor,
  Tv,
  Receipt,
  Landmark,
  Volume2,
  VolumeX,
  Printer,
  HelpCircle,
  Barcode,
  Laptop,
  Server,
  Loader2,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'
import { Modal } from './ui/Modal'
import { useGuide } from '../stores/guide'
import { useNav } from '../stores/nav'
import { useSettings } from '../stores/settings'
import { useUpdate } from '../stores/update'
import { toastSuccess, toastError } from '../stores/toast'
import type { LanStatus } from '@shared/types'
import { AppLogo } from './AppLogo'

interface PosToolsModalProps {
  open: boolean
  onClose: () => void
  counterCameraEnabled: boolean
  onToggleCounterCamera: (enabled: boolean) => void
  phoneConnected: boolean
  onOpenPhonePair: () => void
  onOpenCfd: () => void
  lanStatus: LanStatus | null
  soundMuted: boolean
  onToggleSoundMute: () => void
  onQuickZRead: () => void
  zReadingBusy: boolean
  onOpenQuickExpense: () => void
}

export function PosToolsModal({
  open,
  onClose,
  counterCameraEnabled,
  onToggleCounterCamera,
  phoneConnected,
  onOpenPhonePair,
  onOpenCfd,
  lanStatus,
  soundMuted,
  onToggleSoundMute,
  onQuickZRead,
  zReadingBusy,
  onOpenQuickExpense
}: PosToolsModalProps): React.JSX.Element | null {
  const { setPage } = useNav()
  const { settings } = useSettings()
  const { event, openHub, check } = useUpdate()
  const [printingTest, setPrintingTest] = useState(false)

  if (!open) return null

  const handleTestPrint = async (manual = false) => {
    if (printingTest) return
    setPrintingTest(true)
    try {
      const result = await window.api.printer.testPrint({ manual })
      if (result.ok) {
        toastSuccess(manual ? 'Manual Print Dialog' : 'Test Print Sent', result.message || 'Check your thermal printer output.')
      } else if (result.code !== 'DISABLED') {
        toastError('Printer Not Ready', result.message || 'Ensure thermal printer is turned on and selected in Settings.')
      }
    } catch (err) {
      toastError('Print Error', String((err as Error)?.message || err))
    } finally {
      setPrintingTest(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Terminal Tools" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Terminal Header & Modern Mark Badge */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-brand-500/25 bg-gradient-to-r from-brand-950/60 via-ink-900 to-ink-950">
          <div className="flex items-center gap-3">
            <AppLogo size={36} showBadge={false} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-sm">TINDA POS Hardware Center</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.2 rounded border border-emerald-400/20 font-bold">
                  v{event?.installedVersion || '2.1.7'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Integrated hardware &amp; operations controller</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose()
              setPage('settings')
            }}
            className="btn-ghost text-xs text-brand-300 hover:text-white flex items-center gap-1 py-1.5 px-2.5"
          >
            <span>Printer Settings</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Hardware Status Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* USB Scanner Badge */}
          <div
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300 shadow-sm"
            title="Universal USB Hardware Barcode Scanner Active (Driver-free)"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <Barcode className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold leading-tight truncate">USB Scanner</p>
              <p className="text-[10px] text-emerald-400/80 truncate">Ready & Active</p>
            </div>
          </div>

          {/* Quick Thermal Test Print Button */}
          <div
            className="flex items-center justify-between rounded-xl border border-teal-500/35 bg-teal-500/10 p-2 text-xs text-teal-200 shadow-sm"
            title="Send test receipt directly to configured thermal printer (e.g. GOOJPRT PB-58H). Auto-detects on plug-in!"
          >
            <button
              type="button"
              disabled={printingTest}
              onClick={() => void handleTestPrint(false)}
              className="flex items-center gap-2 text-left hover:text-white transition-colors active:scale-[0.98] disabled:opacity-60 min-w-0 flex-1 py-0.5"
            >
              {printingTest ? (
                <Loader2 className="h-4 w-4 shrink-0 text-teal-300 animate-spin" />
              ) : (
                <Printer className="h-4 w-4 shrink-0 text-teal-300" />
              )}
              <div className="min-w-0">
                <p className="font-bold leading-tight truncate">
                  {printingTest ? 'Printing...' : 'Thermal Print'}
                </p>
                <p className="text-[10px] text-teal-400/80 truncate">
                  {settings?.receipt_printer ? settings.receipt_printer : 'Auto-Detect Ready'}
                </p>
              </div>
            </button>
            <button
              type="button"
              disabled={printingTest}
              onClick={() => void handleTestPrint(true)}
              className="shrink-0 ml-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 hover:bg-teal-500/35 hover:text-white border border-teal-400/30 transition-all active:scale-95"
              title="Open Windows Print Dialog for manual printer selection and darkness adjustment"
            >
              Manual
            </button>
          </div>

          {/* LAN Status */}
          {lanStatus?.role === 'master' && (
            <div
              className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300 shadow-sm"
              title={`Master Server Active (Port ${lanStatus.port}) — ${lanStatus.connectedClients} satellite terminal(s)`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
              <Server className="h-4 w-4 shrink-0 text-sky-400" />
              <div className="min-w-0">
                <p className="font-bold leading-tight truncate">LAN Master</p>
                <p className="text-[10px] text-sky-400/80 truncate">{lanStatus.connectedClients} Linked</p>
              </div>
            </div>
          )}

          {lanStatus?.role === 'satellite' && (
            <div
              className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs shadow-sm ${
                lanStatus.satelliteConnected
                  ? 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${lanStatus.satelliteConnected ? 'bg-sky-400 animate-pulse' : 'bg-amber-400'}`} />
              <Laptop className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold leading-tight truncate">Satellite</p>
                <p className="text-[10px] truncate">{lanStatus.satelliteConnected ? 'Linked to Master' : 'Reconnecting...'}</p>
              </div>
            </div>
          )}

          {/* Sound Mute Status */}
          <button
            type="button"
            onClick={onToggleSoundMute}
            className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs text-left transition-all active:scale-[0.98] ${
              soundMuted
                ? 'border-ink-line bg-ink-850 text-slate-400 hover:text-white hover:border-slate-600'
                : 'border-brand-500/30 bg-brand-500/10 text-brand-300 hover:bg-brand-500/20'
            }`}
          >
            {soundMuted ? <VolumeX className="h-4 w-4 shrink-0 text-slate-400" /> : <Volume2 className="h-4 w-4 shrink-0 text-brand-400" />}
            <div className="min-w-0">
              <p className="font-bold leading-tight truncate">{soundMuted ? 'Audio: Muted' : 'Audio: Active'}</p>
              <p className="text-[10px] text-slate-400 truncate">Tap to {soundMuted ? 'Unmute' : 'Mute'}</p>
            </div>
          </button>
        </div>

        {/* Section 1: Hardware & Displays */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Hardware & Displays
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Hands-Free Counter Camera */}
            <button
              type="button"
              onClick={() => onToggleCounterCamera(!counterCameraEnabled)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                counterCameraEnabled
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30'
                  : 'border-ink-line bg-ink-850 hover:bg-ink-800 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${counterCameraEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-ink-750 text-slate-400'}`}>
                  <Camera className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm leading-tight truncate">Counter Camera</p>
                  <p className="text-[11px] text-slate-400 truncate">Wave items to auto-scan</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                counterCameraEnabled ? 'bg-emerald-500/30 text-emerald-300' : 'bg-ink-750 text-slate-400'
              }`}>
                {counterCameraEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Wireless Phone Scanner */}
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenPhonePair()
              }}
              className="flex items-center justify-between p-3 rounded-xl border border-ink-line bg-ink-850 hover:bg-ink-800 text-slate-200 transition-all text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm leading-tight truncate">Pair Phone Scanner</p>
                  <p className="text-[11px] text-slate-400 truncate">Use phone camera over Wi-Fi</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                phoneConnected ? 'bg-brand-500/30 text-brand-300' : 'bg-ink-750 text-slate-400'
              }`}>
                {phoneConnected ? 'Connected' : 'Pair'}
              </span>
            </button>

            {/* Customer Screen (CFD) */}
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenCfd()
              }}
              className="flex items-center justify-between p-3 rounded-xl border border-ink-line bg-ink-850 hover:bg-ink-800 text-slate-200 transition-all text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Monitor className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm leading-tight truncate">Customer Screen (CFD)</p>
                  <p className="text-[11px] text-slate-400 truncate">Customer display & dynamic QR</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-500 shrink-0 group-hover:text-sky-400 transition-colors" />
            </button>

            {/* Sales Monitor */}
            <button
              type="button"
              onClick={() => {
                onClose()
                void window.api.app.toggleSalesMonitor()
              }}
              className="flex items-center justify-between p-3 rounded-xl border border-ink-line bg-ink-850 hover:bg-ink-800 text-slate-200 transition-all text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Tv className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm leading-tight truncate">Sales Monitor</p>
                  <p className="text-[11px] text-slate-400 truncate">Secondary window display</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-500 shrink-0 group-hover:text-brand-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* Section 2: Shift Operations & Cash */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Shift Operations & Cash
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Petty Cash */}
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenQuickExpense()
              }}
              className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 transition-all text-left group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                <Receipt className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm leading-tight truncate">Petty Cash</p>
                  <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/20 px-1 rounded">[F7]</span>
                </div>
                <p className="text-[11px] text-amber-300/80 truncate">Record store expense</p>
              </div>
            </button>

            {/* E-Wallet */}
            <button
              type="button"
              onClick={() => {
                onClose()
                setPage('ewallet')
              }}
              className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 transition-all text-left group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0 group-hover:scale-105 transition-transform">
                <Landmark className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm leading-tight truncate">E-Wallet</p>
                  <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/20 px-1 rounded">[F8]</span>
                </div>
                <p className="text-[11px] text-emerald-300/80 truncate">GCash, Maya, MariBank & Audit</p>
              </div>
            </button>

            {/* Z-Reading */}
            <button
              type="button"
              disabled={zReadingBusy}
              onClick={() => {
                onQuickZRead()
              }}
              className="flex items-center gap-3 p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 transition-all text-left group disabled:opacity-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 shrink-0 group-hover:scale-105 transition-transform">
                {zReadingBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight truncate">Z-Reading</p>
                <p className="text-[11px] text-purple-300/80 truncate">Print daily balancing</p>
              </div>
            </button>
          </div>
        </div>

        {/* Section 3: Cashier Guide & System Updates */}
        <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onClose()
              useGuide.getState().openGuide('pos')
            }}
            className="flex items-center justify-between p-3 rounded-xl border border-ink-line bg-ink-850 hover:bg-ink-800 text-slate-200 transition-all text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight truncate">Cashier Guide</p>
                <p className="text-[11px] text-slate-400 truncate">Hotkeys & instructions</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-400 group-hover:underline shrink-0">
              Open →
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose()
              openHub()
              void check(true)
            }}
            className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 transition-all text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0 group-hover:scale-105 transition-transform">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight truncate">Check for Updates</p>
                <p className="text-[11px] text-emerald-300/80 truncate">v{event?.installedVersion || '2.1.7'} · Live Check</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-400 group-hover:underline shrink-0">
              Check →
            </span>
          </button>
        </div>
      </div>
    </Modal>
  )
}
