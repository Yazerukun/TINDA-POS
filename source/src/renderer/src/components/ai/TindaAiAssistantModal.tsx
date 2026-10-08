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
  Maximize2,
  GripHorizontal
} from 'lucide-react'
import { useNav, type PageKey } from '../../stores/nav'
import {
  askTindaAssistant,
  getAiConfig,
  saveAiConfig,
  type ChatMessage,
  type AiAssistantConfig
} from '../../services/tindaAiAssistant'
import { AssistantAction } from '../../services/tindaAiKnowledge'

export function TindaAiAssistantModal(): React.JSX.Element {
  const { setPage } = useNav()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
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
      text: 'Kumusta! Ako si TindaBot, ang inyong AI Assistant sa tindahan. Pwede kang magtanong sa Tagalog, Bisaya, o English kung paano mag-input ng GCash funds, mag-process ng Bills, Senior discount, o mag-ayos ng printer!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && !isMinimized) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isMinimized])

  // Drag logic
  const handleDragStart = (e: React.MouseEvent): void => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) {
      return
    }
    e.preventDefault()
    hasDraggedRef.current = false
    const currentX =
      position?.x ?? Math.max(16, window.innerWidth - (isMinimized ? 300 : 440) - 240) // Default offset away from Community Chat
    const currentY =
      position?.y ?? Math.max(40, window.innerHeight - (isMinimized ? 60 : 620))

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

      const panelWidth = isMinimized ? 300 : 420
      const panelHeight = isMinimized ? 52 : 580

      const maxX = Math.max(10, window.innerWidth - panelWidth - 10)
      const maxY = Math.max(10, window.innerHeight - panelHeight - 10)

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
  }, [isDragging, isMinimized])

  // Listen to custom trigger event
  useEffect(() => {
    const handleOpenEvent = () => {
      setIsOpen(true)
      setIsMinimized(false)
    }
    window.addEventListener('tinda-open-ai-assistant', handleOpenEvent)
    return () => window.removeEventListener('tinda-open-ai-assistant', handleOpenEvent)
  }, [])

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
          text: 'Paumanhin, nagkaroon ng saglit na aberya. Pakisubukan muli o buksan ang Store Handbook.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleActionClick = (action: AssistantAction) => {
    setPage(action.page)
    setIsOpen(false)
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

  // 1. CLOSED LAUNCHER BUTTON: placed to the LEFT of Community Chat (right-52) so they NEVER overlap!
  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true)
          setIsMinimized(false)
        }}
        className="fixed bottom-5 right-56 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-xl hover:shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all border border-brand-400/40"
        title="Open TindaBot AI Copilot"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <Bot className="h-4 w-4 text-white" />
        <span>Ask TindaBot</span>
      </button>
    )
  }

  const panelWidth = isMinimized ? 300 : 420
  const panelHeight = isMinimized ? 52 : 580

  const stylePosition: React.CSSProperties = position
    ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed'
      }
    : {
        right: '250px', // Placed side-by-side with Community Chat by default
        bottom: '20px',
        position: 'fixed'
      }

  return (
    <div
      style={{
        ...stylePosition,
        width: `${panelWidth}px`,
        height: isMinimized ? 'auto' : `${panelHeight}px`,
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
      className={`z-50 flex flex-col rounded-2xl border border-ink-line/80 bg-ink-900/95 backdrop-blur-xl shadow-2xl overflow-hidden transition-[height,width] duration-150 ${
        isDragging ? 'select-none ring-2 ring-brand-500/50' : ''
      }`}
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleDragStart}
        className="flex items-center justify-between border-b border-ink-line/60 bg-gradient-to-r from-ink-950 via-ink-900 to-brand-950/40 px-3.5 py-2.5 cursor-grab active:cursor-grabbing select-none"
        title="I-drag para ilipat kahit saan sa screen"
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-sm">
            <Bot className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-100 truncate">TindaBot AI</h3>
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                Online Auto-Pool
              </span>
            </div>
            {!isMinimized && (
              <p className="text-[10px] text-slate-400 truncate">Kasangga sa Tindahan at Cashier</p>
            )}
          </div>
        </div>

        {/* Header Controls: Minimize / Maximize & Close */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {!isMinimized && (
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="rounded-lg p-1 text-slate-400 hover:bg-ink-800 hover:text-slate-200 transition"
              title="AI Settings & Models"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded-lg p-1 text-slate-400 hover:bg-ink-800 hover:text-slate-200 transition"
            title={isMinimized ? 'I-expand ang chat' : 'I-minimize'}
          >
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-danger-500/20 hover:text-danger-400 transition"
            title="Isara si TindaBot"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* When minimized, hide body */}
      {!isMinimized && (
        <>
          {/* Settings Overlay View */}
          {isConfigOpen ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-ink-950/60">
              <div className="flex items-center justify-between pb-2 border-b border-ink-line">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-brand-400" /> AI Engine Configuration
                </h4>
                <button
                  onClick={() => setIsConfigOpen(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-200"
                >
                  Back to Chat
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-300">AI Provider:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setProviderSelect('offline')}
                    className={`p-2 rounded-xl border text-left text-xs transition ${
                      providerSelect === 'offline'
                        ? 'border-brand-500 bg-brand-500/15 text-brand-300 font-bold'
                        : 'border-ink-line bg-ink-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Offline</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1">Handbook only.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProviderSelect('opencode')}
                    className={`p-2 rounded-xl border text-left text-xs transition ${
                      providerSelect === 'opencode'
                        ? 'border-brand-500 bg-brand-500/15 text-brand-300 font-bold'
                        : 'border-ink-line bg-ink-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Bot className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Auto-Pool</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1">Multi-Model Free.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProviderSelect('gemini')}
                    className={`p-2 rounded-xl border text-left text-xs transition ${
                      providerSelect === 'gemini'
                        ? 'border-brand-500 bg-brand-500/15 text-brand-300 font-bold'
                        : 'border-ink-line bg-ink-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span>Gemini</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1">Flash Lite Free.</p>
                  </button>
                </div>
              </div>

              {providerSelect === 'opencode' && (
                <div className="space-y-1.5 rounded-xl bg-ink-900/60 p-2.5 border border-ink-line/60">
                  <label className="text-[11px] font-semibold text-slate-300">
                    OpenCode Free Failover Pool:
                  </label>
                  <div className="space-y-1 text-[10px] text-indigo-300 font-mono bg-ink-950 p-2 rounded-lg border border-ink-line">
                    <p>✓ nemotron-3.5-lightning-free</p>
                    <p>✓ mimo-v2.6-flash-free</p>
                    <p>✓ exo-free & space-bunny-free</p>
                    <p>✓ Google Gemini 2.5 Flash Lite failover</p>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    ⚡ Awtomatikong nag-sasalitan kapag busy ang isa para laging may mabilis na sagot!
                  </p>
                </div>
              )}

              {providerSelect === 'gemini' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Custom Gemini Key (Optional):
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Naka-vault na sa backend pero pwede maglagay ng sarili..."
                    className="w-full rounded-xl border border-ink-line bg-ink-900 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-brand-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500">
                    Protektado ang system key sa loob ng main backend at hindi nakikita sa screen.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleSaveConfig}
                  className="w-full rounded-xl bg-brand-600 hover:bg-brand-500 py-2 text-xs font-bold text-white shadow-md transition"
                >
                  I-Save ang Configuration
                </button>
              </div>
            </div>
          ) : (
            /* Chat History */
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {/* Quick Starter Chips */}
              <div className="space-y-1.5 pb-2 border-b border-ink-line/50">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Mga Karaniwang Tanong:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => void handleSend('san po ilalagay yung pera ng gcash ko?')}
                    className="rounded-lg bg-ink-800/80 hover:bg-ink-750 px-2 py-1 text-[10px] text-slate-300 border border-ink-line/60 transition active:scale-95 text-left"
                  >
                    💰 Saan ilalagay ang GCash funds?
                  </button>
                  <button
                    onClick={() => void handleSend('paano mag bayad ng bills at kuryente?')}
                    className="rounded-lg bg-ink-800/80 hover:bg-ink-750 px-2 py-1 text-[10px] text-slate-300 border border-ink-line/60 transition active:scale-95 text-left"
                  >
                    ⚡ Paano mag-bayad ng Bills?
                  </button>
                  <button
                    onClick={() => void handleSend('paano mag senior citizen discount?')}
                    className="rounded-lg bg-ink-800/80 hover:bg-ink-750 px-2 py-1 text-[10px] text-slate-300 border border-ink-line/60 transition active:scale-95 text-left"
                  >
                    🏷️ Senior / PWD Discount
                  </button>
                  <button
                    onClick={() => void handleSend('paano mag add ng produkto na walang barcode?')}
                    className="rounded-lg bg-ink-800/80 hover:bg-ink-750 px-2 py-1 text-[10px] text-slate-300 border border-ink-line/60 transition active:scale-95 text-left"
                  >
                    📦 Add Item & Barcode
                  </button>
                </div>
              </div>

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                      m.sender === 'user'
                        ? 'bg-brand-600 text-white rounded-tr-none'
                        : 'bg-ink-800 text-slate-200 border border-ink-line/60 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>

                    {m.action && (
                      <div className="mt-2.5 pt-2 border-t border-ink-line/40">
                        <button
                          onClick={() => handleActionClick(m.action!)}
                          className="group flex items-center gap-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 px-2.5 py-1.5 text-[11px] font-bold text-brand-300 border border-brand-500/40 transition active:scale-95"
                        >
                          <span>{m.action.label}</span>
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        {m.action.description && (
                          <p className="text-[10px] text-slate-400 mt-1">{m.action.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                  <Bot className="h-4 w-4 animate-spin text-brand-400" />
                  <span>Nag-iisip si TindaBot...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input Footer */}
          {!isConfigOpen && (
            <div className="border-t border-ink-line/60 bg-ink-950/80 p-2.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleSend()
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Magtanong sa Tagalog, Bisaya, o English..."
                  className="flex-1 rounded-xl border border-ink-line bg-ink-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white transition active:scale-95 shadow-md"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  )
}
