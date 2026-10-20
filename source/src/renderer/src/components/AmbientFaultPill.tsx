import { useEffect, useState } from 'react'
import { AlertTriangle, ChevronRight, X } from 'lucide-react'
import { useSystemDebugger } from '../stores/systemDebugger'

export function AmbientFaultPill(): React.JSX.Element | null {
  const { report, openDebugger } = useSystemDebugger()
  const [visible, setVisible] = useState(false)
  const [latestSummary, setLatestSummary] = useState<string>('')
  const [lastSeenErrorId, setLastSeenErrorId] = useState<string>('')

  useEffect(() => {
    // Listen to real-time sentinel changes
    const unsub = window.api?.diagnostics?.onChanged?.(() => {
      void useSystemDebugger.getState().fetchReport()
    })
    return () => unsub?.()
  }, [])

  useEffect(() => {
    const topIssue = report?.errorStats.topIssues[0]
    if (topIssue && topIssue.signature !== lastSeenErrorId) {
      setLastSeenErrorId(topIssue.signature)
      setLatestSummary(topIssue.plainSummary || topIssue.message.slice(0, 50))
      setVisible(true)

      // Auto dismiss after 7 seconds
      const timer = setTimeout(() => {
        setVisible(false)
      }, 7000)

      return () => clearTimeout(timer)
    }
  }, [report, lastSeenErrorId])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-ink-950/90 py-2.5 px-3.5 shadow-2xl backdrop-blur-xl text-xs max-w-md border-l-4 border-l-amber-500">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
          <AlertTriangle className="h-4 w-4 animate-pulse" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-white leading-tight truncate">
            Glitch Captured & Auto-Logged
          </p>
          <p className="text-[11px] text-amber-300/80 truncate">
            {latestSummary || 'Operational failure recorded safely.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setVisible(false)
            openDebugger()
          }}
          className="btn-ghost flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 transition shrink-0"
        >
          <span>View</span>
          <ChevronRight className="h-3 w-3" />
        </button>

        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-slate-400 hover:text-white p-1 transition shrink-0"
          title="Dismiss notice"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
