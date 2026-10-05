import { useEffect, useState } from 'react'
import {
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Download,
  ExternalLink,
  Loader2,
  CheckCircle2,
  X,
  History
} from 'lucide-react'
import { Modal } from '../ui/Modal'
import { toastSuccess, toastError } from '../../stores/toast'

interface RollbackTarget {
  version: string
  tag: string
  title: string
  publishedAt: string
  releaseNotes: string
  assetName: string
  assetUrl: string
  assetSize: number
}

interface RollbackModalProps {
  open: boolean
  onClose: () => void
  currentVersion: string
}

export function RollbackModal({ open, onClose, currentVersion }: RollbackModalProps): React.JSX.Element | null {
  const [targets, setTargets] = useState<RollbackTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTarget, setSelectedTarget] = useState<RollbackTarget | null>(null)
  const [executing, setExecuting] = useState(false)
  const [progressMsg, setProgressMsg] = useState<string | null>(null)
  const [completed, setCompleted] = useState<{ backupPath: string; installerPath: string } | null>(null)

  useEffect(() => {
    if (!open) {
      setSelectedTarget(null)
      setExecuting(false)
      setProgressMsg(null)
      setCompleted(null)
      return
    }

    setLoading(true)
    window.api.rollback
      .getTargets()
      .then((res) => {
        setTargets(res)
      })
      .catch((err) => {
        toastError('Failed to fetch rollback targets', String(err?.message || err))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [open])

  if (!open) return null

  const handleStartRollback = async (target: RollbackTarget) => {
    setSelectedTarget(target)
  }

  const handleConfirmExecute = async () => {
    if (!selectedTarget) return
    setExecuting(true)
    setProgressMsg(`Creating database safety backup & preparing v${selectedTarget.version} installer...`)

    try {
      const res = await window.api.rollback.execute(selectedTarget.version)
      setCompleted({
        backupPath: res.backupPath,
        installerPath: res.installerPath
      })
      toastSuccess('Rollback installer ready!', res.message)
    } catch (err) {
      toastError('Rollback failed', String((err as Error)?.message || err))
    } finally {
      setExecuting(false)
      setProgressMsg(null)
    }
  }

  return (
    <Modal
      open={open}
      onClose={executing ? () => {} : onClose}
      title="Version Rollback & Safe Downgrade"
      maxWidth="max-w-2xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <span className="text-xs text-slate-500">TINDA POS Safe Recovery Engine</span>
          <button
            onClick={onClose}
            disabled={executing}
            className="btn-ghost text-xs"
          >
            {completed ? 'Done' : 'Close'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Apple-design Safeguard Notice Banner */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div className="space-y-1 text-xs leading-relaxed text-amber-200/90">
              <p className="font-semibold text-white">
                100% Safe Downgrade Guarantee (Zero Data Loss)
              </p>
              <p>
                If an update causes unexpected behavior or errors on your computer, you can safely return to any previous stable version. An automatic verified database backup is saved before proceeding, and your VIP Pro lifetime license remains completely intact.
              </p>
            </div>
          </div>
        </div>

        {/* Current Version Indicator */}
        <div className="flex items-center justify-between rounded-lg border border-ink-line bg-ink-900/50 px-4 py-2.5 text-xs">
          <span className="text-slate-400">Currently Installed Version:</span>
          <span className="rounded-full bg-brand-500/20 px-2.5 py-0.5 font-mono font-bold text-brand-300 border border-brand-500/30">
            v{currentVersion}
          </span>
        </div>

        {/* Execution In-Progress Screen */}
        {executing && (
          <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-6 text-center space-y-3">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-400" />
            <p className="font-semibold text-white text-sm">Processing Safe Rollback</p>
            <p className="text-xs text-slate-300">{progressMsg}</p>
          </div>
        )}

        {/* Rollback Success Screen */}
        {completed && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3 text-xs text-emerald-200">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Rollback Installer Launched!
            </div>
            <p>
              A verified database safety backup was saved to:
            </p>
            <p className="font-mono bg-ink-950/60 p-2 rounded text-[11px] text-slate-300 break-all select-all">
              {completed.backupPath}
            </p>
            <p>
              The previous installer has been launched. Complete the installer prompt or run the downloaded file to finish rolling back to your chosen version.
            </p>
          </div>
        )}

        {/* Confirmation Modal overlay when a target version is clicked */}
        {selectedTarget && !executing && !completed && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
              <AlertTriangle className="h-4 w-4" /> Confirm Rollback to v{selectedTarget.version}
            </div>
            <p className="text-slate-200">
              You are about to downgrade from <strong>v{currentVersion}</strong> to <strong>v{selectedTarget.version}</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>An automatic backup of your sales, products, and inventory will be created first.</li>
              <li>Your VIP Pro license will self-heal and stay unlocked.</li>
              <li>The v{selectedTarget.version} installer will be downloaded and executed.</li>
            </ul>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => void handleConfirmExecute()}
                className="btn-danger flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Confirm &amp; Rollback Now
              </button>
              <button
                onClick={() => setSelectedTarget(null)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Target Releases List */}
        {!executing && !completed && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <History className="h-3.5 w-3.5" /> Available Previous Stable Releases
            </h4>

            {loading ? (
              <div className="space-y-2 py-4">
                <div className="h-16 w-full animate-pulse rounded-xl bg-ink-800" />
                <div className="h-16 w-full animate-pulse rounded-xl bg-ink-800" />
              </div>
            ) : targets.length === 0 ? (
              <div className="rounded-xl border border-ink-line p-6 text-center text-xs text-slate-500">
                No previous releases found to rollback to.
              </div>
            ) : (
              <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
                {targets.map((t) => (
                  <div
                    key={t.version}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-ink-line bg-ink-900/60 p-3.5 hover:border-slate-700 transition"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">
                          v{t.version}
                        </span>
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                          Stable
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(t.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-300" title={t.title}>
                        {t.title}
                      </p>
                      {t.releaseNotes && (
                        <p className="line-clamp-1 text-[11px] text-slate-500">
                          {t.releaseNotes}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => void handleStartRollback(t)}
                        className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                        Rollback to v{t.version}
                      </button>

                      <button
                        onClick={() => void window.api.app.openExternal(`https://github.com/Yazerukun/TINDA-POS/releases/tag/v${t.version}`)}
                        className="btn-ghost p-1.5 text-slate-400 hover:text-white"
                        title="View release on GitHub"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
