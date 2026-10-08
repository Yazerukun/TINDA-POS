import { Bot, MessageSquare, Minus, Sparkles } from 'lucide-react'
import { useFloatingWidgets } from '../../stores/floatingWidgets'
import { useNav } from '../../stores/nav'

export function FloatingWidgetsDock(): React.JSX.Element | null {
  const { page } = useNav()
  const {
    isAiOpen,
    isChatOpen,
    setAiOpen,
    setChatOpen,
    hasUnreadChat,
    isDockCollapsed,
    toggleDockCollapsed
  } = useFloatingWidgets()

  // When either window is fully open, the dock hides so there is no screen redundancy
  if (isAiOpen || isChatOpen) {
    return null
  }

  // Dynamic positioning:
  // In POS page, Cart sits at right: 0 (width 23rem to 26rem).
  // Placing the dock at right-[24.5rem] xl:right-[27.5rem] keeps the entire Cart and CHECKOUT button 100% clear!
  const posClasses =
    page === 'pos'
      ? 'bottom-3.5 right-[24.5rem] xl:right-[27.5rem]'
      : 'bottom-4 right-4'

  if (isDockCollapsed) {
    return (
      <div className={`fixed z-40 transition-all duration-300 ${posClasses}`}>
        <button
          type="button"
          onClick={toggleDockCollapsed}
          className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-brand-500/50 bg-ink-950/95 text-brand-300 shadow-2xl backdrop-blur-md hover:scale-110 hover:border-brand-400 active:scale-95 transition-all"
          title="Buksan ang TindaBot AI & Community Chat Dock"
        >
          <Sparkles className="h-4 w-4 text-brand-400 group-hover:rotate-12 transition-transform" />
          {hasUnreadChat && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 ring-2 ring-ink-950" />
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className={`fixed z-40 transition-all duration-300 ${posClasses}`}>
      <div className="flex items-center gap-1.5 rounded-full border border-ink-700/80 bg-ink-950/95 p-1 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
        {/* Ask TindaBot AI Copilot Button */}
        <button
          type="button"
          onClick={() => setAiOpen(true)}
          className="group relative flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all border border-brand-400/30"
          title="Magtanong kay TindaBot (Store SOPs, GCash, Discounts, E-Load)"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Bot className="h-3.5 w-3.5 text-white group-hover:rotate-6 transition-transform" />
          <span>Ask AI</span>
        </button>

        {/* Community Chat Button */}
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className={`group relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-200 transition-all hover:scale-105 active:scale-95 ${
            hasUnreadChat
              ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-red-500/30 ring-1 ring-red-400/50 animate-pulse'
              : 'bg-ink-850 hover:bg-ink-800 hover:text-white border border-ink-line/80'
          }`}
          title="Buksan ang TINDA Merchant Community Chat"
        >
          <MessageSquare className="h-3.5 w-3.5 text-brand-400 group-hover:scale-110 transition-transform" />
          <span>Chat</span>
          {hasUnreadChat && (
            <span className="rounded-full bg-red-950/90 px-1.5 py-0.2 text-[9px] font-black text-red-200 border border-red-300/40">
              NEW
            </span>
          )}
        </button>

        {/* Mini Collapse Toggle */}
        <button
          type="button"
          onClick={toggleDockCollapsed}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-ink-800 hover:text-slate-200 transition"
          title="I-minimize ang dock para malinis ang screen"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
