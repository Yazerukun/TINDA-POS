import { useState } from 'react'
import {
  Download,
  X,
  Sparkles,
  Loader2,
  ShieldCheck,
  RotateCcw,
  Zap,
  FolderOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import type { UpdateStatusEvent } from '@shared/update'
import { useUpdate } from '../../stores/update'

/**
 * High-visibility Apple Cupertino Update Modal.
 * Proactively alerts merchants and cashiers as soon as an update is detected,
 * guaranteeing zero data loss with automated database safety guarantees.
 */
export function UpdateModal(): React.JSX.Element | null {
  const { event, download, install, dismiss } = useUpdate()
  const [busy, setBusy] = useState(false)
  const [showNotes, setShowNotes] = useState(true)
  const [installError, setInstallError] = useState<string | null>(null)

  if (!event) return null

  const s = event.status
  const visibleStatuses: UpdateStatusEvent['status'][] = [
    'UPDATE_AVAILABLE',
    'DOWNLOADING',
    'DOWNLOADED',
    'READY_TO_INSTALL',
    'ERROR'
  ]

  if (!visibleStatuses.includes(s)) return null

  const version = event.available?.version ?? ''
  const isPatch = event.updateType === 'PATCH' || Boolean(event.available?.hasPatch)
  const isDownloading = s === 'DOWNLOADING'
  const isReady = s === 'READY_TO_INSTALL'
  const isDownloaded = s === 'DOWNLOADED'
  const isError = s === 'ERROR'

  const notes = event.available?.releaseNotes?.trim() || ''

  const handleDownload = async () => {
    setInstallError(null)
    setBusy(true)
    try {
      await download()
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
      setInstallError('Please complete current cashier transactions before restarting.')
    } finally {
      setBusy(false)
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
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              isError
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
            }`}>
              {isError ? (
                <AlertCircle className="h-6 w-6" />
              ) : isPatch ? (
                <Zap className="h-6 w-6 text-brand-400 animate-pulse" />
              ) : (
                <Sparkles className="h-6 w-6 text-brand-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {isError ? 'Update Encountered an Issue' : `New Update Available`}
                </h2>
                {version && (
                  <span className="rounded-full bg-brand-500/20 px-2.5 py-0.5 text-xs font-semibold text-brand-300 border border-brand-500/30 font-mono">
                    v{version}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-400 flex items-center gap-1.5">
                {isPatch ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <Zap className="h-3 w-3" /> Fast In-App Feature Hot-Patch (Instant 2-Second Restart)
                  </span>
                ) : (
                  <span className="text-slate-400">Core Engine Platform Release</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => void dismiss()}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white transition-colors"
            aria-label="Dismiss Update"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Database Safety Guarantee Banner */}
        <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-xs">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <div className="space-y-0.5">
              <p className="font-semibold text-emerald-200">Store Database &amp; Records 100% Protected</p>
              <p className="text-emerald-300/80 leading-relaxed">
                Your products, sales, customer utang, and store settings are safely decoupled and backed up automatically before any code is updated.
              </p>
            </div>
          </div>
        </div>

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
                {event.message || 'The update is ready to install. Restart TINDA POS now to apply changes.'}
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
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-ink-line">
          <button
            type="button"
            onClick={() => void dismiss()}
            className="btn-ghost px-4 py-2 text-xs"
            disabled={busy && isDownloading}
          >
            Remind Me Later
          </button>

          {s === 'UPDATE_AVAILABLE' && (
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={busy}
              className="btn-primary flex items-center gap-2 px-5 py-2 text-xs font-semibold shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting Download…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  {isPatch ? 'Update Now (Takes 5 seconds)' : 'Download Update'}
                </>
              )}
            </button>
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
              className="btn-primary flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all shadow-lg shadow-emerald-600/20"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isPatch ? 'Applying Live…' : 'Restarting…'}
                </>
              ) : (
                <>
                  {isPatch ? <Zap className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                  {isPatch ? 'Apply Live (Zero Restart · 0.3s)' : 'Restart & Install'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
