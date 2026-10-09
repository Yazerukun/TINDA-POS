import { Bot, MessageSquare, Minus, Sparkles } from 'lucide-react'
import { useFloatingWidgets } from '../../stores/floatingWidgets'
import { useNav } from '../../stores/nav'

export function FloatingWidgetsDock(): React.JSX.Element | null {
  const { page } = useNav()
  const {
    isAiOpen,
    isAiMinimized,
    setAiOpen,
    setAiMinimized,
    isChatOpen,
    isChatMinimized,
    setChatOpen,
    setChatMinimized,
    hasUnreadChat,
    isDockCollapsed,
    toggleDockCollapsed
  } = useFloatingWidgets()

  // When any widget is actively fully open (and unminimized), hide the dock to prevent screen clutter
  const isAnyFullyOpen = (isAiOpen && !isAiMinimized) || (isChatOpen && !isChatMinimized)
  if (isAnyFullyOpen) {
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
          title="Open TindaBot AI & Community Chat Dock"
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
          onClick={() => {
            if (isAiOpen && isAiMinimized) {
              setAiMinimized(false)
            } else {
              setAiOpen(true)
            }
          }}
          className={`group relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
            isAiOpen && isAiMinimized
              ? 'bg-indigo-950/90 text-indigo-200 border border-indigo-500/50 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400/40'
              : 'bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white shadow-md hover:shadow-brand-500/30 border border-brand-400/30'
          }`}
          title={
            isAiOpen && isAiMinimized
              ? 'Restore TindaBot AI Copilot (Minimized)'
              : 'Ask TindaBot (Store SOPs, GCash, Discounts, E-Load)'
          }
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Bot className="h-3.5 w-3.5 text-white group-hover:rotate-6 transition-transform" />
          <span>Ask AI</span>
          {isAiOpen && isAiMinimized && (
            <span className="rounded-full bg-indigo-500/30 px-1.5 py-0.2 text-[9px] font-mono text-indigo-300 border border-indigo-400/30">
              Min
            </span>
          )}
        </button>

        {/* Community Chat Button */}
        <button
          type="button"
          onClick={() => {
            if (isChatOpen && isChatMinimized) {
              setChatMinimized(false)
            } else {
              setChatOpen(true)
            }
          }}
          className={`group relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
            hasUnreadChat
              ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-red-500/30 ring-1 ring-red-400/50 animate-pulse'
              : isChatOpen && isChatMinimized
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/40'
              : 'bg-ink-850 hover:bg-ink-800 hover:text-white border border-ink-line/80 text-slate-200'
          }`}
          title={
            isChatOpen && isChatMinimized
              ? 'Restore TINDA Community Chat (Minimized)'
              : 'Open TINDA Community Chat'
          }
        >
          <MessageSquare
            className={`h-3.5 w-3.5 transition-transform group-hover:scale-110 ${
              isChatOpen && isChatMinimized ? 'text-emerald-400' : 'text-brand-400'
            }`}
          />
          <span>Chat</span>
          {isChatOpen && isChatMinimized && !hasUnreadChat && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded-full border border-emerald-400/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Min</span>
            </span>
          )}
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
          title="Collapse dock to clean screen"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
