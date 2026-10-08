import { useState } from 'react'
import {
  Download,
  X,
  Minus,
  Sparkles,
  Loader2,
  ShieldCheck,
  RotateCcw,
  Zap,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Crown
} from 'lucide-react'
import type { UpdateStatusEvent } from '@shared/update'
import { useUpdate } from '../../stores/update'
import { RollbackModal } from './RollbackModal'

/**
 * High-visibility Apple Cupertino Update Modal & Fast Update Hub.
 * Proactively alerts merchants and cashiers as soon as an update is detected,
 * and allows instant on-demand checking, rollback, and live zero-restart patching directly.
 */
export function UpdateModal(): React.JSX.Element | null {
  const { event, download, install, dismiss, minimize, check, checking, modalDismissed, hubOpen, closeHub } = useUpdate()
  const [busy, setBusy] = useState(false)
  const [showNotes, setShowNotes] = useState(true)
  const [installError, setInstallError] = useState<string | null>(null)
  const [rollbackOpen, setRollbackOpen] = useState(false)

  if (!event) return null
  if (modalDismissed && !hubOpen) return null

  const s = event.status
  const visibleStatuses: UpdateStatusEvent['status'][] = [
    'UPDATE_AVAILABLE',
    'DOWNLOADING',
    'DOWNLOADED',
    'READY_TO_INSTALL',
    'ERROR'
  ]

  // If not manually opened as hub, only show when there is an active update or error
  if (!hubOpen && !visibleStatuses.includes(s)) return null

  const version = event.available?.version ?? ''
  const installedVersion = event.installedVersion
  const isPatch = event.updateType === 'PATCH' || Boolean(event.available?.hasPatch)
  const isDownloading = s === 'DOWNLOADING'
  const isReady = s === 'READY_TO_INSTALL'
  const isDownloaded = s === 'DOWNLOADED'
  const isError = s === 'ERROR'
  const isUpToDate = s === 'UP_TO_DATE' || s === 'DISMISSED' || s === 'IDLE'
  const isChecking = s === 'CHECKING' || checking

  const notes = event.available?.releaseNotes?.trim() || ''

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
      setInstallError('Please complete current cashier transactions before updating.')
    } finally {
      setBusy(false)
    }
  }

  const handleClose = () => {
    if (hubOpen) {
      closeHub()
    } else {
      void dismiss()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-xl transition-all"
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-ink-line">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                isError
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : isUpToDate
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
              }`}
            >
              {isError ? (
                <AlertCircle className="h-6 w-6" />
              ) : isChecking ? (
                <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
              ) : isUpToDate ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              ) : isPatch ? (
                <Zap className="h-6 w-6 text-brand-400 animate-pulse" />
              ) : (
                <Sparkles className="h-6 w-6 text-brand-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {isError
                    ? 'Update Encountered an Issue'
                    : isChecking
                    ? 'Checking for Updates…'
                    : isUpToDate
                    ? 'TINDA POS is Up to Date'
                    : 'New Fast Update Available'}
                </h2>
                {!isUpToDate && version ? (
                  <span className="rounded-full bg-brand-500/20 px-2.5 py-0.5 text-xs font-semibold text-brand-300 border border-brand-500/30 font-mono">
                    v{version}
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30 font-mono">
                    v{installedVersion}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-400 flex items-center gap-1.5">
                {isUpToDate ? (
                  <span className="text-emerald-400 font-medium">
                    You have the latest stable system release installed.
                  </span>
                ) : isPatch ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <Zap className="h-3 w-3" /> Fast In-App Feature Hot-Patch (Live 0.3s · Zero System Restart)
                  </span>
                ) : (
                  <span className="text-slate-400">Core Engine Platform Release</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void check(true)}
              disabled={isChecking}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-ink-800 hover:text-white transition-colors border border-white/5 hover:border-white/10"
              title="Check for updates on GitHub now"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-[11px] font-semibold">{isChecking ? 'Checking…' : 'Check Updates'}</span>
            </button>
            <button
              type="button"
              onClick={minimize}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-ink-800 hover:text-white transition-colors border border-white/5 hover:border-white/10"
              title="Minimize to Sidebar"
              aria-label="Minimize Update Dialog"
            >
              <Minus className="h-4 w-4 text-slate-400" />
              <span className="text-[11px] font-semibold">Minimize</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white transition-colors"
              title="Close"
              aria-label="Close Update Dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Database Safety Guarantee Banner */}
        <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-xs">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <div className="space-y-0.5">
              <p className="font-semibold text-emerald-200">Store Database &amp; Records 100% Protected</p>
              <p className="text-emerald-300/80 leading-relaxed">
                Your products, sales, customer utang, and store settings are safely decoupled and backed up automatically before any code is updated. Zero system restart required.
              </p>
            </div>
          </div>
        </div>

        {/* Choice Comparison: Live Patch vs Full Build */}
        {s === 'UPDATE_AVAILABLE' && (
          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Live Patch Option */}
            {isPatch && (
              <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-300 text-xs">
                      <Zap className="h-4 w-4 text-emerald-400" />
                      Option A: Fast Live Patch
                    </span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-black text-emerald-300 uppercase tracking-wide border border-emerald-500/40">
                      Zero Restart ⚡
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-emerald-200/85 leading-relaxed">
                    Ultra-lightweight hot patch (~0.8 MB). Updates live in 0.3s without restarting the desktop application or closing ongoing sales.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-400">~840 KB</span>
                  <span className="font-semibold text-emerald-300">Fastest &amp; Safest</span>
                </div>
              </div>
            )}

            {/* Full Platform Build Option */}
            <div className={`rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5 flex flex-col justify-between ${!isPatch ? 'sm:col-span-2' : ''}`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-sky-300 text-xs">
                    <FolderOpen className="h-4 w-4 text-sky-400" />
                    Option B: Full Platform Build
                  </span>
                  <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-300 uppercase tracking-wide border border-sky-500/30">
                    Complete App
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-300 leading-relaxed">
                  Complete offline standalone installer / AppImage (~130 MB). Downloaded directly to your Downloads folder for fresh installations or archival.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-sky-500/20 flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-400">
                  {event.available?.fullAsset?.size
                    ? `${(event.available.fullAsset.size / (1024 * 1024)).toFixed(0)} MB · AppImage`
                    : '~130 MB · AppImage'}
                </span>
                <span className="font-medium text-sky-300">Offline Package</span>
              </div>
            </div>
          </div>
        )}

        {/* Up to Date Content Card */}
        {isUpToDate && !isDownloading && !isReady && (
          <div className="mt-4 space-y-3 rounded-xl bg-ink-800/60 p-4 border border-ink-line">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Active System Version:</span>
              <span className="font-mono font-bold text-white">v{installedVersion}</span>
            </div>
            {event.lastCheckedAt && (
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Last Checked:</span>
                <span className="font-mono text-slate-300">{new Date(event.lastCheckedAt).toLocaleTimeString()}</span>
              </div>
            )}
            <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-ink-line/50">
              <button
                type="button"
                onClick={() => void check(true)}
                disabled={isChecking}
                className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-200 hover:text-white"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin text-emerald-400' : ''}`} />
                {isChecking ? 'Checking GitHub…' : 'Check for Updates Now'}
              </button>
              <button
                type="button"
                onClick={() => setRollbackOpen(true)}
                className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-300 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10"
                title="Safely restore previous stable version"
              >
                <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                Version Rollback
                <Crown className="h-3 w-3 text-amber-400" />
              </button>
            </div>
          </div>
        )}

        {/* Download Progress Bar */}
        {isDownloading && event.progress && (
          <div className="mt-4 space-y-2 rounded-xl bg-ink-800/80 p-4 border border-ink-line">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-200">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-400" />
                Downloading update package…
              </span>
              <span className="font-mono font-bold text-white">{event.progress.percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink-950">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${Math.max(5, event.progress.percent)}%` }}
              />
            </div>
            {event.progress.total > 0 && (
              <p className="text-[11px] text-slate-400 text-right">
                {(event.progress.downloaded / (1024 * 1024)).toFixed(1)} MB / {(event.progress.total / (1024 * 1024)).toFixed(1)} MB
              </p>
            )}
          </div>
        )}

        {/* Ready to Install / Success State */}
        {isReady && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-3.5 text-xs text-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <div>
              <p className="font-semibold text-white">Update Downloaded &amp; Verified</p>
              <p className="mt-0.5 text-emerald-300/90 leading-relaxed">
                {event.message || 'The update is ready to apply. Click below to apply live in 0.3s without restarting the system.'}
              </p>
            </div>
          </div>
        )}

        {/* Downloaded State (Portable) */}
        {isDownloaded && (
          <div className="mt-4 rounded-xl border border-brand-500/30 bg-brand-500/10 p-3.5 text-xs text-brand-200 flex items-start gap-2.5">
            <FolderOpen className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
            <div>
              <p className="font-semibold text-white">Portable Update Ready in Downloads</p>
              <p className="mt-0.5 text-slate-300 leading-relaxed">
                {event.message || 'The update package has been saved to your Downloads folder. Open the file to complete.'}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold text-red-200">Update Encountered an Error</p>
              <p className="mt-0.5 text-red-300/90 leading-relaxed">{event.message}</p>
            </div>
          </div>
        )}

        {installError && (
          <p className="mt-2 text-xs text-amber-300 font-medium">{installError}</p>
        )}

        {/* Release Notes Highlights */}
        {notes && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Release Highlights
              </span>
              <button
                type="button"
                onClick={() => setShowNotes((v) => !v)}
                className="text-[11px] text-brand-400 hover:text-brand-300"
              >
                {showNotes ? 'Collapse' : 'Expand notes'}
              </button>
            </div>
            {showNotes && (
              <div className="max-h-40 overflow-y-auto rounded-xl bg-ink-950/70 p-3 text-xs leading-relaxed text-slate-300 border border-ink-line scrollbar-thin">
                <pre className="whitespace-pre-wrap font-sans text-xs">{notes}</pre>
              </div>
            )}
          </div>
        )}

        {/* Action Button Footer */}
        <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-ink-line">
          <button
            type="button"
            onClick={minimize}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-ink-800 border border-white/5 transition"
            title="Keep update active in sidebar"
          >
            <Minus className="h-3.5 w-3.5 text-slate-400" />
            <span>Minimize to Sidebar</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="btn-ghost px-4 py-2 text-xs"
              disabled={busy && isDownloading}
            >
              {isUpToDate ? 'Close' : 'Remind Me Later'}
            </button>

          {s === 'UPDATE_AVAILABLE' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleDownload('FULL')}
                disabled={busy}
                className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-sky-200 hover:text-white border-sky-500/30 hover:border-sky-500/60 hover:bg-sky-500/10 active:scale-[0.98] transition-all"
                title="Download full standalone installer / AppImage package"
              >
                <FolderOpen className="h-4 w-4 text-sky-400" />
                <span>Download Full Build</span>
              </button>

              {isPatch && (
                <button
                  type="button"
                  onClick={() => void handleDownload('PATCH')}
                  disabled={busy}
                  className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-semibold shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all bg-emerald-600 hover:bg-emerald-500 text-white"
                  title="Instant live hot-patch without restarting the application"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting Patch…
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-emerald-200" />
                      <span>Update via Patch (Live · 0.3s)</span>
                    </>
                  )}
                </button>
              )}

              {!isPatch && (
                <button
                  type="button"
                  onClick={() => void handleDownload('FULL')}
                  disabled={busy}
                  className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Update</span>
                </button>
              )}
            </div>
          )}

          {isError && (
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={busy}
              className="btn-primary flex items-center gap-2 px-5 py-2 text-xs font-semibold"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Retry Download
            </button>
          )}

          {isDownloaded && (
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="btn-primary flex items-center gap-2 px-5 py-2 text-xs font-semibold"
            >
              <FolderOpen className="h-4 w-4" />
              Show in Downloads
            </button>
          )}

          {isReady && (
            <button
              type="button"
              onClick={() => void handleInstall()}
              disabled={busy}
              className="btn-primary flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all shadow-lg shadow-emerald-600/20 text-white"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isPatch ? 'Applying Live…' : 'Applying…'}
                </>
              ) : (
                <>
                  {isPatch ? <Zap className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                  {isPatch ? 'Apply Live (0.3s · Zero Restart)' : 'Apply & Reload'}
                </>
              )}
            </button>
          )}
          </div>
        </div>
      </div>

      <RollbackModal
        open={rollbackOpen}
        onClose={() => setRollbackOpen(false)}
        currentVersion={installedVersion}
      />
    </div>
  )
}
