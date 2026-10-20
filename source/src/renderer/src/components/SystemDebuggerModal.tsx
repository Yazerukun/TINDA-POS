import { useEffect, useState, useMemo } from 'react'
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
  Footprints,
  Activity,
  Terminal,
  Search,
  ExternalLink
} from 'lucide-react'
import { Modal } from './ui/Modal'
import { useSystemDebugger } from '../stores/systemDebugger'
import { toastSuccess, toastError } from '../stores/toast'
import {
  getCapturedConsoleLogs,
  clearCapturedConsoleLogs,
  subscribeToConsoleLogs,
  formatConsoleLogsAsMarkdown,
  type ConsoleLogEntry
} from '../lib/consoleInterceptor'

export function SystemDebuggerModal(): React.JSX.Element | null {
  const { isOpen, closeDebugger, report, loading, autoFixing, fetchReport, runAutoFix, clearLogs } =
    useSystemDebugger()
  const [copied, setCopied] = useState(false)
  const [consoleCopied, setConsoleCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'issues' | 'console' | 'breadcrumbs' | 'database'>('issues')
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>(() => getCapturedConsoleLogs())
  const [consoleSearch, setConsoleSearch] = useState('')
  const [consoleLevelFilter, setConsoleLevelFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all')

  useEffect(() => {
    if (isOpen) {
      void fetchReport()
      setConsoleLogs(getCapturedConsoleLogs())
    }
  }, [isOpen, fetchReport])

  // Subscribe to live console events in real-time
  useEffect(() => {
    const unsub = subscribeToConsoleLogs((newEntry) => {
      setConsoleLogs((prev) => [...prev.slice(-499), newEntry])
    })
    return () => unsub()
  }, [])

  const filteredConsoleLogs = useMemo(() => {
    return consoleLogs.filter((entry) => {
      if (consoleLevelFilter === 'error' && entry.level !== 'error') return false
      if (consoleLevelFilter === 'warn' && entry.level !== 'warn') return false
      if (consoleLevelFilter === 'info' && entry.level !== 'info' && entry.level !== 'log') return false

      if (consoleSearch.trim()) {
        const q = consoleSearch.toLowerCase()
        return (
          entry.message.toLowerCase().includes(q) ||
          entry.level.toLowerCase().includes(q) ||
          (entry.stack && entry.stack.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [consoleLogs, consoleLevelFilter, consoleSearch])

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

  const handleCopyConsole = async () => {
    try {
      const markdown = formatConsoleLogsAsMarkdown(filteredConsoleLogs)
      await navigator.clipboard.writeText(markdown)
      setConsoleCopied(true)
      toastSuccess(
        'Console Logs Copied!',
        `Exported ${filteredConsoleLogs.length} logs to clipboard for Jin.`
      )
      setTimeout(() => setConsoleCopied(false), 3000)
    } catch {
      toastError('Copy Failed', 'Could not access clipboard.')
    }
  }

  const handleClearConsole = () => {
    clearCapturedConsoleLogs()
    setConsoleLogs([])
    toastSuccess('Console Cleared', 'In-app console feed has been cleared.')
  }

  const handleOpenChromeDevTools = () => {
    void window.api?.diagnostics?.toggleDevTools?.()
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

  const statusBg = isHealthy
    ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
    : isWarning
      ? 'border-amber-500/35 bg-amber-500/10 text-amber-300'
      : 'border-danger-500/35 bg-danger-500/10 text-danger-300'

  const errorCount = consoleLogs.filter((l) => l.level === 'error').length
  const warnCount = consoleLogs.filter((l) => l.level === 'warn').length
  const infoCount = consoleLogs.filter((l) => l.level === 'info' || l.level === 'log').length

  return (
    <Modal
      open={isOpen}
      onClose={closeDebugger}
      title="TINDA Sentinel — System Health, DevTools & Console Studio"
      maxWidth="max-w-4xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Real-Time Flight Recorder & Chrome DevTools Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenChromeDevTools}
              className="btn-secondary flex items-center gap-1.5 border-violet-500/35 text-violet-300 hover:bg-violet-500/15 text-xs py-2 px-3 active:scale-95 transition-all"
              title="Launch official Google Chrome Developer Tools (F12)"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Chrome DevTools (F12)</span>
            </button>
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
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeTab === 'console'
                  ? 'bg-brand-500 font-bold text-ink-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Live Console ({consoleLogs.length})</span>
              {errorCount > 0 && (
                <span className="rounded-full bg-danger-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {errorCount}
                </span>
              )}
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

          <div className="flex items-center gap-2">
            {activeTab === 'console' && (
              <button
                type="button"
                onClick={handleClearConsole}
                className="text-xs text-slate-400 hover:text-danger-400 flex items-center gap-1 transition"
                title="Clear in-app console logs"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear Console</span>
              </button>
            )}

            {activeTab === 'issues' && report?.errorStats.totalErrors ? (
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

        {/* Tab 2: Live Console Terminal Studio */}
        {activeTab === 'console' && (
          <div className="space-y-2.5 max-h-[46vh] flex flex-col">
            {/* Filter and Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={consoleSearch}
                    onChange={(e) => setConsoleSearch(e.target.value)}
                    placeholder="Filter console logs or stack traces…"
                    className="w-full rounded-lg border border-ink-line bg-black/40 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-ink-line bg-ink-900/50 p-0.5">
                <button
                  type="button"
                  onClick={() => setConsoleLevelFilter('all')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                    consoleLevelFilter === 'all'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({consoleLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setConsoleLevelFilter('error')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                    consoleLevelFilter === 'error'
                      ? 'bg-danger-500 text-white font-bold'
                      : 'text-danger-400 hover:bg-danger-500/10'
                  }`}
                >
                  <span>🔴</span> Errors ({errorCount})
                </button>
                <button
                  type="button"
                  onClick={() => setConsoleLevelFilter('warn')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                    consoleLevelFilter === 'warn'
                      ? 'bg-amber-500 text-ink-950 font-bold'
                      : 'text-amber-400 hover:bg-amber-500/10'
                  }`}
                >
                  <span>🟡</span> Warns ({warnCount})
                </button>
                <button
                  type="button"
                  onClick={() => setConsoleLevelFilter('info')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                    consoleLevelFilter === 'info'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'text-sky-400 hover:bg-sky-500/10'
                  }`}
                >
                  <span>🔵</span> Info ({infoCount})
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyConsole}
                className="btn-secondary flex items-center gap-1.5 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/15 text-xs py-1.5 px-3 active:scale-95 transition"
                title="Copy all currently filtered console entries to clipboard"
              >
                {consoleCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{consoleCopied ? 'Copied Logs!' : '📋 Copy Logs for Jin'}</span>
              </button>
            </div>

            {/* Apple Obsidian Terminal Box */}
            <div className="flex-1 overflow-y-auto max-h-[38vh] rounded-xl border border-ink-line/60 bg-[#070a0e] p-3 font-mono text-[11px] scrollbar-thin">
              {filteredConsoleLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Terminal className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No console entries matching your filter.</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Trigger actions or scan barcodes to view live console logs.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredConsoleLogs.map((entry) => {
                    const isErr = entry.level === 'error'
                    const isWrn = entry.level === 'warn'
                    const isInf = entry.level === 'info'

                    const badgeColor = isErr
                      ? 'bg-danger-500/20 text-danger-300 border-danger-500/30'
                      : isWrn
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : isInf
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          : 'bg-slate-700/30 text-slate-400 border-slate-700/40'

                    const textColor = isErr
                      ? 'text-danger-200'
                      : isWrn
                        ? 'text-amber-200'
                        : isInf
                          ? 'text-sky-200'
                          : 'text-slate-300'

                    return (
                      <div
                        key={entry.id}
                        className="group flex flex-col gap-0.5 rounded-lg border border-transparent hover:border-slate-800 hover:bg-white/[0.02] p-1.5 transition"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] text-slate-500 select-none shrink-0 pt-0.5">
                            {entry.timeFormatted}
                          </span>
                          <span
                            className={`rounded border px-1.5 py-0.2 text-[9px] font-bold uppercase shrink-0 select-none ${badgeColor}`}
                          >
                            {entry.level}
                          </span>
                          <span className={`break-all select-all flex-1 ${textColor}`}>
                            {entry.message}
                          </span>
                        </div>

                        {entry.stack && (
                          <div className="mt-1 ml-6 rounded bg-black/60 p-2 text-[10px] text-slate-400 whitespace-pre-wrap font-mono border border-black/40 select-all">
                            {entry.stack}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: User Action Trail (Breadcrumbs) */}
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

        {/* Tab 4: Database & OS Health */}
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
