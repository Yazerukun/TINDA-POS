import { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Download,
  RotateCcw,
  X,
  Loader2,
  AlertTriangle,
  Crown,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Moon,
  Clock,
  FolderOpen,
  Disc,
  CheckCircle2
} from 'lucide-react'
import type { UpdateStatusEvent } from '@shared/update'
import { useUpdate } from '../../stores/update'
import { useLicense } from '../../stores/license'
import { useAuth } from '../../stores/auth'
import { toastSuccess } from '../../stores/toast'

/**
 * Unified VIP-First Auto-Updater Capsule
 *
 * Consolidates all TINDA POS update notifications into a single, non-disruptive,
 * top-anchored dynamic capsule. Completely eliminates screen-blocking modals
 * and frees the bottom-right corner for Community Chat.
 */
export function UnifiedUpdateCapsule(): React.JSX.Element | null {
  const { event, download, install, dismiss, hubOpen, closeHub } = useUpdate()
  const { isVip } = useLicense()
  const { user } = useAuth()

  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [installError, setInstallError] = useState<string | null>(null)
  const [applyOnShiftClose, setApplyOnShiftClose] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('tinda_apply_on_shift_close') === 'true'
    } catch {
      return false
    }
  })

  const containerRef = useRef<HTMLDivElement>(null)

  // Sync with hubOpen (e.g. triggered via Sidebar "Check for Updates" or Settings)
  useEffect(() => {
    if (hubOpen) {
      if (event?.status === 'UP_TO_DATE' || event?.status === 'IDLE') {
        toastSuccess('TINDA POS is Up to Date', `Running version v${event?.installedVersion || '1.0.95'}`)
        closeHub()
      } else {
        setExpanded(true)
      }
    }
  }, [hubOpen, event?.status, event?.installedVersion, closeHub])

  // Close flyout when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false)
        closeHub()
      }
    }
    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [expanded, closeHub])

  if (!event) return null

  const s = event.status
  const visible: UpdateStatusEvent['status'][] = [
    'UPDATE_AVAILABLE',
    'DOWNLOADING',
    'DOWNLOADED',
    'READY_TO_INSTALL',
    'ERROR'
  ]
  if (!visible.includes(s)) return null

  const version = event.available?.version ?? ''
  const percent = event.progress?.percent ?? 0

  const handleDownload = async (type?: 'PATCH' | 'FULL') => {
    setInstallError(null)
    setBusy(true)
    try {
      await download(type)
    } finally {
      setBusy(false)
    }
  }

  const handleInstall = async () => {
    setInstallError(null)
    setBusy(true)
    try {
      await install()
    } catch {
      setInstallError('Unable to restart now. Please finish active checkout first.')
    } finally {
      setBusy(false)
    }
  }

  const handleToggleShiftClose = () => {
    const next = !applyOnShiftClose
    setApplyOnShiftClose(next)
    try {
      window.localStorage.setItem('tinda_apply_on_shift_close', String(next))
    } catch {}
    setExpanded(false)
    if (next) {
      toastSuccess('Update deferred', 'Update will install automatically when closing shift or logging out.')
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed top-3 right-6 z-40 flex flex-col items-end select-none animate-fadeIn"
    >
      {/* ─── Collapsed Dynamic Island Capsule ─── */}
      <div className="flex items-center gap-2 rounded-full border border-ink-700/80 bg-ink-950/95 px-3 py-1.5 text-xs text-white shadow-2xl backdrop-blur-xl transition-all duration-200 hover:border-brand-500/60 hover:shadow-brand-500/10">
        {/* Status Indicator Icon */}
        {s === 'DOWNLOADING' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-400 shrink-0" />
        ) : s === 'DOWNLOADED' || s === 'READY_TO_INSTALL' ? (
          <RotateCcw className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        ) : s === 'ERROR' ? (
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-brand-400 shrink-0 animate-pulse" />
        )}

        {/* Primary Status Text & Version */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 text-left focus:outline-none"
        >
          <span className="font-semibold text-slate-100 hover:text-brand-300 transition-colors">
            {s === 'UPDATE_AVAILABLE' && `Update Available · v${version}`}
            {s === 'DOWNLOADING' && `Downloading v${version} (${percent}%)`}
            {s === 'DOWNLOADED' && `Update Ready · v${version}`}
            {s === 'READY_TO_INSTALL' && `Update Ready to Apply · v${version}`}
            {s === 'ERROR' && `Update Issue · v${version}`}
          </span>

          {/* Inline mini progress bar during download */}
          {s === 'DOWNLOADING' && (
            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-ink-800">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          )}

          {/* VIP Pro fast-track badge */}
          {isVip && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
              <Crown className="h-2.5 w-2.5" /> VIP
            </span>
          )}

          {/* Deferred badge */}
          {applyOnShiftClose && (s === 'DOWNLOADED' || s === 'READY_TO_INSTALL') && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.2 text-[9px] font-bold text-sky-300">
              <Moon className="h-2.5 w-2.5" /> Shift Close
            </span>
          )}

          {expanded ? (
            <ChevronUp className="h-3 w-3 text-slate-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-slate-400" />
          )}
        </button>

        {/* Quick 1-Click Action Button on the Pill */}
        {s === 'UPDATE_AVAILABLE' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleDownload()}
            className="flex items-center gap-1 rounded-full bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/40 px-2 py-0.5 text-[11px] font-bold text-brand-300 active:scale-95 transition"
            title="Download update in background"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            <span>Get</span>
          </button>
        )}

        {(s === 'DOWNLOADED' || s === 'READY_TO_INSTALL') && !applyOnShiftClose && (
          <button
            type="button"
            disabled={busy}
            onClick={handleInstall}
            className="flex items-center gap-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 active:scale-95 transition"
            title="Restart and apply update"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            <span>Apply</span>
          </button>
        )}

        {/* Dismiss Pill */}
        <button
          type="button"
          onClick={() => {
            void dismiss()
            setExpanded(false)
            closeHub()
          }}
          className="rounded-full p-1 text-slate-400 hover:bg-ink-800 hover:text-white transition"
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* ─── Expanded Flyout Drawer Card ─── */}
      {expanded && (
        <div className="mt-2 w-[24rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-ink-700/80 bg-ink-950/95 p-4 shadow-2xl backdrop-blur-xl animate-fadeIn">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-2 border-b border-ink-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-sm">TINDA POS v{version}</h4>
                {isVip ? (
                  <span className="flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                    <Crown className="h-2.5 w-2.5" /> VIP Priority Channel
                  </span>
                ) : (
                  <span className="rounded bg-brand-500/15 border border-brand-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-brand-300">
                    Official Release
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {event.portable
                  ? 'Portable edition: new build will be placed in your application directory.'
                  : 'Automated database safety backup is performed before installing.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setExpanded(false)
                closeHub()
              }}
              className="rounded p-1 text-slate-400 hover:bg-ink-800 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Safety & VIP Notice */}
          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] text-emerald-300">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Store transactions, inventory, and utang credits are 100% protected.</span>
          </div>

          {/* Single Streamlined Full Setup Card */}
          {s === 'UPDATE_AVAILABLE' && (
            <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 to-ink-900/80 p-3.5 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Disc className="h-4 w-4 text-emerald-400 shrink-0 animate-pulse" />
                    <span className="font-bold text-white text-xs">Official Full Installer · v{version}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Clean, official release with pre-update SQLite backup and automatic 3-second restart.
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-emerald-500/20">
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-300/90 font-mono">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Zero Data Loss Guaranteed</span>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDownload('FULL')}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  <span>Download &amp; Auto-Update</span>
                </button>
              </div>
            </div>
          )}

          {/* Tesla Cyber-Emerald Telemetry Progress Bar */}
          {s === 'DOWNLOADING' && event.progress && (
            <div className="mt-3 space-y-2 rounded-xl border border-emerald-500/25 bg-ink-900/80 p-3 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              {/* Telemetry Header */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold text-slate-100 truncate text-[11px]">
                    TindaPOS-Setup-{version}.exe
                  </span>
                </div>
                <span className="font-mono font-extrabold text-emerald-400 shrink-0">
                  {event.progress.percent}%
                </span>
              </div>

              {/* Phase status text */}
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                {event.phase === 'SNAPSHOT' && '🛡️ Step 1: Pre-Update SQLite Safety Snapshot...'}
                {(!event.phase || event.phase === 'DOWNLOADING') && '📥 Step 2: Streaming signed package via HTTPS...'}
                {event.phase === 'VERIFYING' && '🔒 Step 3: Verifying cryptographic checksum...'}
                {event.phase === 'READY' && '✅ Step 4: Package verified! Ready to apply.'}
              </div>

              {/* Progress Bar Track */}
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-ink-950 border border-ink-800 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_10px_rgba(52,211,153,0.6)] transition-all duration-300 ease-out"
                  style={{ width: `${event.progress.percent}%` }}
                />
              </div>

              {/* Live Metric Triad */}
              <div className="grid grid-cols-3 gap-1 pt-1 border-t border-ink-800/60 text-[10px] font-mono">
                <div>
                  <span className="text-slate-400 block text-[9px] font-sans">Speed</span>
                  <span className="font-bold text-emerald-300 truncate block">
                    ⚡ {event.progress.bytesPerSecond ? `${(event.progress.bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s` : '—'}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-slate-400 block text-[9px] font-sans">ETA</span>
                  <span className="font-bold text-slate-200 truncate block">
                    ⏱️ {event.progress.etaSeconds !== undefined ? `${event.progress.etaSeconds}s left` : 'calculating'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[9px] font-sans">Downloaded</span>
                  <span className="text-slate-300 truncate block">
                    {(event.progress.downloaded / 1024 / 1024).toFixed(1)} / {(event.progress.total / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {s === 'ERROR' && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <p className="font-semibold text-red-200">Update check or download encountered an issue</p>
              <p className="mt-0.5 text-slate-400">{event.message || 'Network timeout or connection interrupted.'}</p>
            </div>
          )}

          {installError && (
            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-300">
              {installError}
            </div>
          )}

          {/* Release Notes / What's New */}
          {event.available?.releaseNotes && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold text-slate-300">What&apos;s New in v{version}:</p>
              <div className="max-h-36 overflow-y-auto rounded-xl border border-ink-800 bg-ink-900/80 p-2.5 text-xs text-slate-300 leading-relaxed font-sans">
                <pre className="whitespace-pre-wrap font-sans text-[11px] text-slate-300">
                  {event.available.releaseNotes}
                </pre>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-ink-800">
            {/* Shift Close Deferral Toggle (Zero Sagabal for VIPs) */}
            {(s === 'DOWNLOADED' || s === 'READY_TO_INSTALL') ? (
              <button
                type="button"
                onClick={handleToggleShiftClose}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                  applyOnShiftClose
                    ? 'border-sky-500/40 bg-sky-500/20 text-sky-300'
                    : 'border-ink-700 bg-ink-800/80 text-slate-300 hover:text-white'
                }`}
                title="Defer restart until cashier logs out or closes register"
              >
                <Moon className="h-3.5 w-3.5" />
                <span>{applyOnShiftClose ? '✓ Deferred on Shift Close' : 'Apply on Shift Close'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setExpanded(false)
                  closeHub()
                }}
                className="btn-ghost px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            )}

            <div className="flex items-center gap-2">
              {s === 'UPDATE_AVAILABLE' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDownload()}
                  className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Download Update
                </button>
              )}

              {s === 'DOWNLOADED' && event.portable && (
                <button
                  type="button"
                  onClick={() => void install()}
                  className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"
                >
                  <FolderOpen className="h-3.5 w-3.5" /> Open Folder
                </button>
              )}

              {(s === 'DOWNLOADED' || s === 'READY_TO_INSTALL') && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] transition active:scale-95"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  <span>Restart &amp; Install Now (3s)</span>
                </button>
              )}

              {s === 'ERROR' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDownload()}
                  className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Retry Download
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
