import { useState, useRef, useEffect } from 'react'
import {
  Bot,
  X,
  Send,
  Sparkles,
  ArrowRight,
  Settings,
  HelpCircle,
  Key,
  ShieldCheck,
  Minus,
  Columns2,
  Maximize2,
  Minimize2,
  GripHorizontal
} from 'lucide-react'
import { useNav } from '../../stores/nav'
import { useFloatingWidgets } from '../../stores/floatingWidgets'
import {
  askTindaAssistant,
  getAiConfig,
  saveAiConfig,
  type ChatMessage,
  type AiAssistantConfig
} from '../../services/tindaAiAssistant'
import { AssistantAction } from '../../services/tindaAiKnowledge'

export function TindaAiAssistantModal(): React.JSX.Element | null {
  const { page, setPage } = useNav()
  const {
    isAiOpen,
    setAiOpen,
    isAiMinimized,
    setAiMinimized,
    isAiWide,
    setAiWide,
    isChatOpen
  } = useFloatingWidgets()

  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<AiAssistantConfig>(getAiConfig())
  const [apiKeyInput, setApiKeyInput] = useState(config.apiKey || '')
  const [providerSelect, setProviderSelect] = useState(config.provider)

  // Floating draggable position saved in localStorage
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const stored = localStorage.getItem('tinda_aibot_pos')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          return parsed
        }
      }
    } catch {}
    return null
  })

  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{
    startX: number
    startY: number
    initPosX: number
    initPosY: number
  } | null>(null)
  const hasDraggedRef = useRef(false)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Kumusta! Ako si TindaBot, ang inyong AI Assistant. Pwede kang magtanong sa Tagalog, Bisaya, o English ukol sa GCash funds, Bills payment, Senior discount, o barcode!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isAiOpen && !isAiMinimized) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isAiOpen, isAiMinimized])

  // Drag logic
  const handleDragStart = (e: React.MouseEvent): void => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) {
      return
    }
    e.preventDefault()
    hasDraggedRef.current = false

    const panelW = isAiWide ? 390 : 330
    const panelH = 460

    const currentX =
      position?.x ?? Math.max(16, window.innerWidth - panelW - (page === 'pos' ? 390 : 16))
    const currentY =
      position?.y ?? Math.max(40, window.innerHeight - panelH - 16)

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initPosX: currentX,
      initPosY: currentY
    }
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY

      if (Math.hypot(dx, dy) > 5) {
        hasDraggedRef.current = true
      }

      const panelW = isAiWide ? 390 : 330
      const panelH = 460

      const maxX = Math.max(10, window.innerWidth - panelW - 10)
      const maxY = Math.max(10, window.innerHeight - panelH - 10)

      const nextX = Math.max(10, Math.min(maxX, dragRef.current.initPosX + dx))
      const nextY = Math.max(10, Math.min(maxY, dragRef.current.initPosY + dy))

      setPosition({ x: nextX, y: nextY })
    }

    const handleMouseUp = (): void => {
      if (dragRef.current) {
        dragRef.current = null
        setIsDragging(false)
        setPosition((pos) => {
          if (pos) {
            try {
              localStorage.setItem('tinda_aibot_pos', JSON.stringify(pos))
            } catch {}
          }
          return pos
        })
        setTimeout(() => {
          hasDraggedRef.current = false
        }, 120)
      }
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isAiMinimized, isAiWide])

  // Listen to custom trigger event from Sidebar or Shortcuts
  useEffect(() => {
    const handleOpenEvent = () => {
      setAiOpen(true)
      setAiMinimized(false)
    }
    window.addEventListener('tinda-open-ai-assistant', handleOpenEvent)
    return () => window.removeEventListener('tinda-open-ai-assistant', handleOpenEvent)
  }, [setAiOpen, setAiMinimized])

  const handleSend = async (userQuestion?: string) => {
    const q = (userQuestion || input).trim()
    if (!q || loading) return

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await askTindaAssistant(q, messages)
      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: res.reply,
        action: res.action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages((prev) => [...prev, botMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: 'Paumanhin, nagkaroon ng sandaling aberya. Pakisubukan muli o tingnan ang handbook.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleActionClick = (action: AssistantAction) => {
    setPage(action.page)
    setAiOpen(false)
  }

  const handleSaveConfig = () => {
    const nextCfg: AiAssistantConfig = {
      provider: providerSelect,
      apiKey: apiKeyInput.trim(),
      model: providerSelect === 'gemini' ? 'gemini-2.5-flash-lite' : undefined
    }
    saveAiConfig(nextCfg)
    setConfig(nextCfg)
    setIsConfigOpen(false)
  }

  // If closed, FloatingWidgetsDock handles the launcher button
  if (!isAiOpen) {
    return null
  }

  const panelWidth = isAiWide ? 390 : 330
  const panelHeight = 460

  // Coordinated default positioning:
  // In POS page, Cart takes right: 0 to ~370-416px.
  // Default AI position is placed to the LEFT of the Cart (right: 390px).
  // If Chat is also open, snap AI beside it (right: 730px).
  const defaultRight =
    page === 'pos'
      ? isChatOpen
        ? 730
        : 390
      : isChatOpen
        ? 356
        : 16

  const stylePosition: React.CSSProperties = position
    ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed'
      }
    : {
        right: `${defaultRight}px`,
        bottom: '16px',
        position: 'fixed'
      }

  return (
    <div
      style={{
        ...stylePosition,
        width: `${panelWidth}px`,
        height: `${panelHeight}px`,
        display: isAiMinimized ? 'none' : 'flex',
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
      className={`z-50 flex flex-col rounded-2xl border border-ink-line/80 bg-ink-950/95 backdrop-blur-xl shadow-2xl overflow-hidden transition-[height,width] duration-150 ${
        isDragging ? 'select-none ring-2 ring-brand-500/50' : ''
      }`}
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleDragStart}
        className="flex items-center justify-between border-b border-ink-line/60 bg-gradient-to-r from-ink-950 via-ink-900 to-brand-950/40 px-3 py-2 cursor-grab active:cursor-grabbing select-none"
        title="Drag to reposition anywhere on screen"
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="h-3 w-3 text-slate-500 shrink-0" />
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-sm">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-100 truncate">TindaBot</h3>
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[8px] font-bold text-emerald-400 border border-emerald-500/30">
                Online
              </span>
            </div>
          </div>
        </div>

        {/* Header Controls: Width toggle, Settings, Minimize, Close */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <button
            type="button"
            onClick={() => setAiWide(!isAiWide)}
            className="rounded-lg p-1 text-slate-400 hover:bg-ink-800 hover:text-slate-200 transition"
            title={isAiWide ? 'Compact width (330px)' : 'Expand width (390px)'}
          >
            <Columns2 className="h-3 w-3 text-slate-300" />
          </button>

          <button
            type="button"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="rounded-lg p-1 text-slate-400 hover:bg-ink-800 hover:text-slate-200 transition"
            title="AI Settings & Models"
          >
            <Settings className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={() => setAiMinimized(true)}
            className="rounded-lg p-1 text-slate-400 hover:bg-ink-800 hover:text-amber-300 transition"
            title="Minimize to Dock"
          >
            <Minus className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={() => {
              setAiOpen(false)
              setAiMinimized(false)
            }}
            className="rounded-lg p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
            title="Close TindaBot"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

          {/* Settings Overlay View */}
          {isConfigOpen ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-ink-950/80 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-ink-line">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-brand-400" /> AI Engine Setup
                </h4>
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-200"
                >
                  Back to Chat
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">Provider:</label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setProviderSelect('offline')}
                    className={`p-1.5 rounded-lg border text-left transition ${
                      providerSelect === 'offline'
                        ? 'border-brand-500 bg-brand-500/15 text-brand-300 font-bold'
                        : 'border-ink-line bg-ink-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px]">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                      <span>Offline</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProviderSelect('opencode')}
                    className={`p-1.5 rounded-lg border text-left transition ${
                      providerSelect === 'opencode'
                        ? 'border-brand-500 bg-brand-500/15 text-brand-300 font-bold'
                        : 'border-ink-line bg-ink-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px]">
                      <Bot className="h-3 w-3 text-indigo-400" />
                      <span>Auto-Pool</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProviderSelect('gemini')}
                    className={`p-1.5 rounded-lg border text-left transition ${
                      providerSelect === 'gemini'
                        ? 'border-brand-500 bg-brand-500/15 text-brand-300 font-bold'
                        : 'border-ink-line bg-ink-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px]">
                      <Sparkles className="h-3 w-3 text-amber-400" />
                      <span>Gemini</span>
                    </div>
                  </button>
                </div>
              </div>

              {providerSelect === 'opencode' && (
                <div className="space-y-1 rounded-lg bg-ink-900/60 p-2 border border-ink-line/60 text-[10px] text-slate-300">
                  <p className="font-semibold text-indigo-300">OpenCode Multi-Model Failover:</p>
                  <p className="text-slate-400">
                    Awtomatikong mag-switch sa nemotron, mimo, exo, o cloud kapag busy ang isa.
                  </p>
                </div>
              )}

              {providerSelect === 'gemini' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-300">
                    Custom Gemini Key (Optional):
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Naka-vault sa backend..."
                    className="w-full rounded-lg border border-ink-line bg-ink-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="w-full rounded-lg bg-brand-600 hover:bg-brand-500 py-1.5 text-xs font-bold text-white shadow transition"
                >
                  I-Save Settings
                </button>
              </div>
            </div>
          ) : (
            /* Compact Chat Body */
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 text-xs">
              {/* Quick Starter Chips */}
              <div className="space-y-1 pb-1.5 border-b border-ink-line/40">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Topics:
                </p>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => void handleSend('san po ilalagay yung pera ng gcash ko?')}
                    className="rounded-md bg-ink-850 hover:bg-ink-800 px-2 py-1 text-[10px] text-slate-300 border border-ink-line/60 transition active:scale-95 text-left truncate"
                    title="Saan ilalagay ang GCash funds?"
                  >
                    💰 GCash Float & Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSend('paano mag bayad ng bills at kuryente?')}
                    className="rounded-md bg-ink-850 hover:bg-ink-800 px-2 py-1 text-[10px] text-slate-300 border border-ink-line/60 transition active:scale-95 text-left truncate"
                    title="Paano mag-bayad ng Bills?"
                  >
                    ⚡ Bills & E-Load Hub
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSend('paano mag senior citizen discount?')}
                    className="rounded-md bg-ink-850 hover:bg-ink-800 px-2 py-1 text-[10px] text-slate-300 border border-ink-line/60 transition active:scale-95 text-left truncate"
                    title="Senior / PWD 20% Discount"
                  >
                    🏷️ Senior/PWD Discount
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSend('paano mag add ng produkto na walang barcode?')}
                    className="rounded-md bg-ink-850 hover:bg-ink-800 px-2 py-1 text-[10px] text-slate-300 border border-ink-line/60 transition active:scale-95 text-left truncate"
                    title="Add Item & Barcode Generation"
                  >
                    📦 Barcode Generation
                  </button>
                </div>
              </div>

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[92%] rounded-xl px-2.5 py-2 text-xs leading-relaxed shadow-sm ${
                      m.sender === 'user'
                        ? 'bg-brand-600 text-white rounded-tr-none'
                        : 'bg-ink-900 text-slate-200 border border-ink-line/60 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>

                    {m.action && (
                      <div className="mt-2 pt-1.5 border-t border-ink-line/40">
                        <button
                          type="button"
                          onClick={() => handleActionClick(m.action!)}
                          className="group flex items-center gap-1 rounded-md bg-brand-500/20 hover:bg-brand-500/30 px-2 py-1 text-[10px] font-bold text-brand-300 border border-brand-500/40 transition active:scale-95"
                        >
                          <span>{m.action.label}</span>
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        {m.action.description && (
                          <p className="text-[9px] text-slate-400 mt-0.5">{m.action.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] text-slate-500 mt-0.5 px-1">{m.timestamp}</span>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] py-1">
                  <Bot className="h-3.5 w-3.5 animate-spin text-brand-400" />
                  <span>Nag-iisip si TindaBot...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Compact Input Footer */}
          {!isConfigOpen && (
            <div className="border-t border-ink-line/60 bg-ink-950/90 p-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleSend()
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Magtanong sa Tagalog / Bisaya..."
                  className="flex-1 rounded-lg border border-ink-line bg-ink-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white transition active:scale-95 shadow"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}
    </div>
  )
}
