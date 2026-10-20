import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Copy,
  Check,
  Wrench,
  RefreshCw,
  Trash2,
  Database,
  Cpu,
  Footprints,
  ExternalLink,
  HelpCircle,
  Activity
} from 'lucide-react'
import { Modal } from './ui/Modal'
import { useSystemDebugger } from '../stores/systemDebugger'
import { toastSuccess, toastError } from '../stores/toast'

export function SystemDebuggerModal(): React.JSX.Element | null {
  const { isOpen, closeDebugger, report, loading, autoFixing, fetchReport, runAutoFix, clearLogs } =
    useSystemDebugger()
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'issues' | 'breadcrumbs' | 'database'>('issues')

  useEffect(() => {
    if (isOpen) {
      void fetchReport()
    }
  }, [isOpen, fetchReport])

  if (!isOpen) return null

  const handleCopyReport = async () => {
    if (!report?.formattedMarkdownReport) return
    try {
      await navigator.clipboard.writeText(report.formattedMarkdownReport)
      setCopied(true)
      toastSuccess(
        'Diagnostic Report Copied!',
        'Ready to send to Jin. Simply press Ctrl + V in chat.'
      )
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toastError('Copy Failed', 'Please manually copy the text from the report.')
    }
  }

  const handleAutoFix = async () => {
    try {
      const res = await runAutoFix()
      if (res.ok) {
        toastSuccess('Auto-Fix Completed', res.message)
      } else {
        toastError('Auto-Fix Notice', res.message)
      }
    } catch (e) {
      toastError('Auto-Fix Error', String((e as Error)?.message || e))
    }
  }

  const handleClear = async () => {
    if (!confirm('Clear all resolved error logs from the flight recorder?')) return
    try {
      await clearLogs()
      toastSuccess('Logs Cleared', 'Flight recorder has been reset.')
    } catch (e) {
      toastError('Clear Failed', String((e as Error)?.message || e))
    }
  }

  const health = report?.healthScore ?? 100
  const isHealthy = health >= 90
  const isWarning = health >= 70 && health < 90
  const isCritical = health < 70

  const statusBg = isHealthy
    ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
    : isWarning
      ? 'border-amber-500/35 bg-amber-500/10 text-amber-300'
      : 'border-danger-500/35 bg-danger-500/10 text-danger-300'

  return (
    <Modal
      open={isOpen}
      onClose={closeDebugger}
      title="TINDA Sentinel — System Health & Diagnostics"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Offline Flight Recorder Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyReport}
              className="btn-primary flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-md shadow-emerald-600/25 active:scale-95 transition-all text-xs py-2 px-3.5"
              title="Copy pre-formatted report to paste directly to Jin in chat"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied to Clipboard!' : '📋 Copy Report for Jin'}</span>
            </button>
            <button
              type="button"
              disabled={autoFixing}
              onClick={handleAutoFix}
              className="btn-secondary flex items-center gap-1.5 border-amber-500/35 text-amber-300 hover:bg-amber-500/15 text-xs py-2 px-3 active:scale-95 transition-all"
              title="Automatically flush SQLite locks and repair database inconsistencies"
            >
              <Wrench className={`h-3.5 w-3.5 ${autoFixing ? 'animate-spin' : ''}`} />
              <span>{autoFixing ? 'Repairing…' : '🛠️ Auto-Fix Issues'}</span>
            </button>
            <button type="button" onClick={closeDebugger} className="btn-ghost text-xs py-2 px-3">
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Top Health Score Banner */}
        <div className={`rounded-2xl border p-4 shadow-sm backdrop-blur-md ${statusBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/20 text-2xl shadow-inner">
                {isHealthy ? (
                  <ShieldCheck className="h-7 w-7 text-emerald-400" />
                ) : isWarning ? (
                  <AlertTriangle className="h-7 w-7 text-amber-400" />
                ) : (
                  <AlertOctagon className="h-7 w-7 text-danger-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white">
                    {isHealthy
                      ? 'System is 100% Healthy & Protected'
                      : isWarning
                        ? `${report?.errorStats.unresolvedCount || 1} System Warnings Detected`
                        : 'System Attention Required'}
                  </h4>
                  <span className="rounded-md bg-black/30 px-2 py-0.5 font-mono text-xs font-black">
                    {health}% SCORE
                  </span>
                </div>
                <p className="mt-0.5 text-xs opacity-85">
                  {isHealthy
                    ? 'All database tables, hardware channels, and transactions are functioning perfectly.'
                    : 'The flight recorder detected active warnings. You can auto-fix or copy the report for Jin.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchReport()}
                disabled={loading}
                className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1 border border-ink-line"
                title="Refresh diagnostics"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Re-Check</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4 border-t border-black/15 pt-3 text-xs">
            <div>
              <span className="text-[11px] opacity-75">SQLite Integrity</span>
              <p className="font-mono font-bold text-white">
                {report?.database.quickCheck === 'ok' ? '✅ Pass (OK)' : '⚠️ Warning'}
              </p>
            </div>
            <div>
              <span className="text-[11px] opacity-75">Database Size</span>
              <p className="font-mono font-bold text-white">
                {((report?.database.diskSizeBytes || 0) / 1024 / 1024).toFixed(1)} MB (WAL)
              </p>
            </div>
            <div>
              <span className="text-[11px] opacity-75">Process Memory</span>
              <p className="font-mono font-bold text-white">{report?.memory.rssMb || 0} MB RSS</p>
            </div>
            <div>
              <span className="text-[11px] opacity-75">Active Errors</span>
              <p className="font-mono font-bold text-white">
                {report?.errorStats.unresolvedCount || 0} incidents
              </p>
            </div>
          </div>
        </div>

        {/* Cupertino Segmented Tabs */}
        <div className="flex items-center justify-between border-b border-ink-line pb-2">
          <div className="inline-flex rounded-xl border border-ink-line bg-ink-900/60 p-0.5 text-xs font-semibold backdrop-blur">
            <button
              type="button"
              onClick={() => setActiveTab('issues')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeTab === 'issues'
                  ? 'bg-brand-500 font-bold text-ink-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Traced Issues ({report?.errorStats.topIssues.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('breadcrumbs')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeTab === 'breadcrumbs'
                  ? 'bg-brand-500 font-bold text-ink-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Footprints className="h-3.5 w-3.5" />
              <span>User Action Trail ({report?.recentBreadcrumbs.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeTab === 'database'
                  ? 'bg-brand-500 font-bold text-ink-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>Database & OS Health</span>
            </button>
          </div>

          {report?.errorStats.totalErrors ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-slate-400 hover:text-danger-400 flex items-center gap-1 transition"
              title="Clear all logs"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear Logs</span>
            </button>
          ) : null}
        </div>

        {/* Tab 1: Traced Issues */}
        {activeTab === 'issues' && (
          <div className="space-y-2.5 max-h-[44vh] overflow-y-auto pr-1 scrollbar-thin">
            {!report?.errorStats.topIssues.length ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-line bg-ink-900/30 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-2">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h5 className="font-bold text-white">Flight Recorder is Clean!</h5>
                <p className="mt-1 text-xs text-slate-400 max-w-sm">
                  Zero active errors or crashes recorded. The system is operating normally without
                  unresolved incidents.
                </p>
              </div>
            ) : (
              report.errorStats.topIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-ink-line bg-ink-900/50 p-3 text-xs space-y-2 hover:border-slate-600 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-brand-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand-300">
                        {issue.subsystem}
                      </span>
                      <p className="font-semibold text-white">{issue.plainSummary}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-danger-500/35 bg-danger-500/15 px-2 py-0.5 font-mono text-[10px] font-black text-danger-300">
                      {issue.count}x OCCURRED
                    </span>
                  </div>

                  <div className="rounded-lg bg-black/40 p-2 font-mono text-[11px] text-slate-300 break-all select-all border border-ink-line/40">
                    {issue.message}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Signature: {issue.signature.slice(0, 45)}…</span>
                    <span>Last: {issue.lastSeen}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: User Action Trail (Breadcrumbs) */}
        {activeTab === 'breadcrumbs' && (
          <div className="space-y-2 max-h-[44vh] overflow-y-auto pr-1 scrollbar-thin">
            <p className="text-xs text-slate-400">
              The flight recorder tracks recent user clicks, barcode scans, and navigation prior to
              any issue.
            </p>
            <div className="divide-y divide-ink-line/50 rounded-xl border border-ink-line bg-ink-900/40">
              {report?.recentBreadcrumbs.length ? (
                report.recentBreadcrumbs.map((b, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[11px] text-slate-500">{b.timestamp}</span>
                      <span className="rounded bg-ink-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-300 uppercase">
                        {b.category}
                      </span>
                      <span className="text-slate-200">{b.message}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  No action breadcrumbs logged yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Database & OS Health */}
        {activeTab === 'database' && (
          <div className="space-y-3 max-h-[44vh] overflow-y-auto pr-1 scrollbar-thin text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-ink-line bg-ink-900/50 p-3 space-y-1">
                <span className="text-slate-400 text-[11px]">SQLite Quick Check</span>
                <p className="font-mono font-bold text-white">{report?.database.quickCheck}</p>
              </div>
              <div className="rounded-xl border border-ink-line bg-ink-900/50 p-3 space-y-1">
                <span className="text-slate-400 text-[11px]">Deep Integrity Check</span>
                <p className="font-mono font-bold text-white">{report?.database.integrityCheck}</p>
              </div>
              <div className="rounded-xl border border-ink-line bg-ink-900/50 p-3 space-y-1">
                <span className="text-slate-400 text-[11px]">Broken Foreign Keys</span>
                <p className="font-mono font-bold text-white">
                  {report?.database.foreignKeyCheck.length
                    ? `${report.database.foreignKeyCheck.length} violations`
                    : '0 (Clean)'}
                </p>
              </div>
              <div className="rounded-xl border border-ink-line bg-ink-900/50 p-3 space-y-1">
                <span className="text-slate-400 text-[11px]">SQLite Journal Mode</span>
                <p className="font-mono font-bold text-white uppercase">
                  {report?.database.journalMode} (Write-Ahead Logging)
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-ink-line bg-ink-900/40 p-3 space-y-2">
              <span className="font-semibold text-slate-300">System Environment Details</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-400 text-[11px]">
                <div>OS Platform: <strong className="text-slate-200">{report?.platform} ({report?.arch})</strong></div>
                <div>System Uptime: <strong className="text-slate-200">{report?.uptimeSeconds}s</strong></div>
                <div>Heap Used: <strong className="text-slate-200">{report?.memory.heapUsedMb} MB</strong></div>
                <div>Heap Total: <strong className="text-slate-200">{report?.memory.heapTotalMb} MB</strong></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
