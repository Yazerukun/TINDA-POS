import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  Crown,
  Key,
  Wifi,
  WifiOff,
  Store,
  RefreshCw,
  Megaphone,
  Minus,
  Maximize2,
  Volume2,
  VolumeX,
  Trash2,
  GripHorizontal
} from 'lucide-react'
import type { LiveAnnouncement, CommunityChatMessage } from '@shared/types'
import { useSettings } from '../../stores/settings'

function playNotificationChime(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }
    const now = ctx.currentTime

    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now) // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12) // A5

    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(880, now + 0.05)

    gainNode.gain.setValueAtTime(0.001, now)
    gainNode.gain.linearRampToValueAtTime(0.22, now + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now + 0.05)
    osc1.stop(now + 0.35)
    osc2.stop(now + 0.35)

    setTimeout(() => {
      void ctx.close()
    }, 500)
  } catch {
    // AudioContext blocked or unsupported
  }
}

export function TindaCommunityChat(): React.JSX.Element {
  const { settings } = useSettings()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<CommunityChatMessage[]>([])
  const [announcements, setAnnouncements] = useState<LiveAnnouncement[]>([])
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  // Sound chime state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('tinda_lounge_sound') !== 'false'
  })

  // Deleted messages filter
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('tinda_deleted_msg_ids')
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>()
    } catch {
      return new Set<string>()
    }
  })
  const deletedIdsRef = useRef<Set<string>>(deletedIds)
  deletedIdsRef.current = deletedIds

  // Floating draggable position
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const stored = localStorage.getItem('tinda_lounge_pos')
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

  const [devKey, setDevKey] = useState<string>(() => {
    return localStorage.getItem('tinda_dev_key') || ''
  })
  const [showDevPrompt, setShowDevPrompt] = useState(false)
  const [devInput, setDevInput] = useState('')
  const [unreadAnnouncement, setUnreadAnnouncement] = useState(false)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const [isLocalVip, setIsLocalVip] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isInitialFetchRef = useRef(true)
  const prevMsgIdsRef = useRef<Set<string>>(new Set())

  const scrollToBottom = useCallback((): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Toggle sound alert
  const toggleSound = (): void => {
    setSoundEnabled((prev) => {
      const next = !prev
      localStorage.setItem('tinda_lounge_sound', String(next))
      if (next) playNotificationChime()
      return next
    })
  }

  // Fetch announcements
  const fetchAnnouncements = useCallback(async (): Promise<void> => {
    try {
      const res = await window.api?.community?.getAnnouncements()
      if (res && res.ok && Array.isArray(res.announcements)) {
        setAnnouncements(res.announcements)
        const lastSeen = localStorage.getItem('tinda_last_seen_announcement')
        const first = res.announcements[0]
        if (first && first.id !== lastSeen) {
          setUnreadAnnouncement(true)
        }
      }
    } catch {
      // Non-blocking catch
    }
  }, [])

  // Fetch messages
  const fetchMessages = useCallback(async (): Promise<void> => {
    try {
      const res = await window.api?.community?.getMessages(50)
      if (res && res.ok && Array.isArray(res.messages)) {
        // Filter out locally deleted messages
        const validMessages = res.messages.filter((m) => !deletedIdsRef.current.has(m.id))
        setMessages(validMessages)
        setIsOnline(true)

        // Audio chime alert on new incoming message from someone else
        if (!isInitialFetchRef.current && validMessages.length > 0) {
          const currentStoreId = settings?.cloud_store_id || 'unregistered'
          const newIncoming = validMessages.filter((m) => !prevMsgIdsRef.current.has(m.id))

          if (newIncoming.length > 0) {
            const hasFromOther = newIncoming.some(
              (m) => m.store_id !== currentStoreId && !m.is_dev
            ) || newIncoming.some((m) => m.is_dev && !devKey)

            if (hasFromOther && soundEnabled) {
              playNotificationChime()
            }
          }
        }

        // Update tracking set
        prevMsgIdsRef.current = new Set(validMessages.map((m) => m.id))
        isInitialFetchRef.current = false

        // Check for unread messages badge when closed or minimized
        if (validMessages.length > 0) {
          const lastMsg = validMessages[validMessages.length - 1]
          const lastSeenId = localStorage.getItem('tinda_last_seen_msg_id')
          if ((!isOpen || isMinimized) && lastSeenId && lastMsg && lastMsg.id !== lastSeenId) {
            setHasUnreadMessages(true)
          } else if (isOpen && !isMinimized && lastMsg) {
            localStorage.setItem('tinda_last_seen_msg_id', lastMsg.id)
          } else if (!lastSeenId && lastMsg) {
            localStorage.setItem('tinda_last_seen_msg_id', lastMsg.id)
          }
        }
      } else if (!res?.ok) {
        setIsOnline(false)
      }
    } catch {
      setIsOnline(false)
    }
  }, [isOpen, isMinimized, soundEnabled, settings?.cloud_store_id, devKey])

  // Initial fetch on mount
  useEffect(() => {
    void fetchAnnouncements()
    void fetchMessages()
    window.api?.license
      ?.getStatus?.()
      .then((s) => {
        if (s && typeof s.isVip === 'boolean') {
          setIsLocalVip(s.isVip)
        }
      })
      .catch(() => {})
  }, [fetchAnnouncements, fetchMessages])

  // Polling:
  // When open and active: 5s
  // When closed/minimized: 12s
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setIsLoading(true)
      void Promise.all([fetchAnnouncements(), fetchMessages()]).finally(() => {
        setIsLoading(false)
        scrollToBottom()
      })
      const interval = setInterval(() => {
        void fetchMessages()
      }, 5000)
      return () => clearInterval(interval)
    } else {
      const bgInterval = setInterval(() => {
        void fetchMessages()
      }, 12000)
      return () => clearInterval(bgInterval)
    }
  }, [isOpen, isMinimized, fetchAnnouncements, fetchMessages, scrollToBottom])

  // Open & restore handler
  const handleOpen = (): void => {
    setIsOpen(true)
    setIsMinimized(false)
    setHasUnreadMessages(false)
    setUnreadAnnouncement(false)
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg) {
        localStorage.setItem('tinda_last_seen_msg_id', lastMsg.id)
      }
    }
    const first = announcements[0]
    if (first) {
      localStorage.setItem('tinda_last_seen_announcement', first.id)
    }
  }

  // Send message
  const handleSendMessage = async (e?: React.FormEvent): Promise<void> => {
    if (e) e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed || isSending) return

    setIsSending(true)
    try {
      const res = await window.api?.community?.sendMessage(trimmed, devKey || undefined)
      if (res && res.ok && res.message) {
        setMessages((prev) => [...prev, res.message!])
        prevMsgIdsRef.current.add(res.message.id)
        setInputText('')
        setTimeout(scrollToBottom, 100)
      } else {
        alert(res?.error || 'Failed to send message. Please check connection.')
      }
    } catch (err: unknown) {
      alert('Error sending message: ' + ((err as Error)?.message || 'Network error'))
    } finally {
      setIsSending(false)
    }
  }

  // Delete message
  const handleDeleteMessage = async (msgId: string): Promise<void> => {
    if (!window.confirm('Delete this message from TINDA Global Lounge?')) {
      return
    }

    // Optimistic removal
    setDeletedIds((prev) => {
      const next = new Set(prev)
      next.add(msgId)
      try {
        localStorage.setItem('tinda_deleted_msg_ids', JSON.stringify(Array.from(next)))
      } catch {}
      return next
    })
    setMessages((prev) => prev.filter((m) => m.id !== msgId))

    try {
      const res = await window.api?.community?.deleteMessage(msgId, devKey || undefined)
      if (res && !res.ok) {
        console.warn('Server message delete response:', res.error)
      }
    } catch (err) {
      console.warn('Failed to dispatch message deletion:', err)
    }
  }

  // Developer authorization key
  const handleSaveDevKey = (): void => {
    const trimmed = devInput.trim()
    setDevKey(trimmed)
    if (trimmed) {
      localStorage.setItem('tinda_dev_key', trimmed)
    } else {
      localStorage.removeItem('tinda_dev_key')
    }
    setShowDevPrompt(false)
  }

  const isDevActive = Boolean(devKey && devKey.length > 5)

  // Drag logic
  const handleDragStart = (e: React.MouseEvent): void => {
    // Avoid dragging when clicking buttons, inputs, or interactive controls
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) {
      return
    }

    e.preventDefault()
    const currentX =
      position?.x ?? Math.max(16, window.innerWidth - (isMinimized ? 300 : 440))
    const currentY =
      position?.y ?? Math.max(40, window.innerHeight - (isMinimized ? 80 : 620))

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
              localStorage.setItem('tinda_lounge_pos', JSON.stringify(pos))
            } catch {}
          }
          return pos
        })
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

  // Can delete message check:
  const currentStoreId = settings?.cloud_store_id || 'unregistered'
  const currentStoreName = settings?.store_name?.trim() || ''

  const canDelete = (m: CommunityChatMessage): boolean => {
    if (isDevActive) return true // Founder / Dev can delete/moderate any message
    if (currentStoreId !== 'unregistered' && m.store_id === currentStoreId) return true
    if (currentStoreName && m.store_name?.includes(currentStoreName)) return true
    return false
  }

  return (
    <>
      {/* 1. CLOSED LAUNCHER BUTTON (Bottom-Right) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-40">
          <button
            type="button"
            onClick={handleOpen}
            className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
              hasUnreadMessages
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 shadow-red-500/50 ring-4 ring-red-400/60 animate-pulse'
                : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:shadow-brand-500/25'
            }`}
            title="Open TINDA Global Community Lounge"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Global Lounge</span>
            {hasUnreadMessages ? (
              <span className="flex items-center gap-1.5 ml-1">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                </span>
                <span className="rounded-full bg-red-950/80 px-1.5 py-0.2 text-[10px] font-bold text-red-100 border border-red-300/30">
                  NEW
                </span>
              </span>
            ) : unreadAnnouncement ? (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
            ) : null}
          </button>
        </div>
      )}

      {/* 2. MINIMIZED FLOATING PILL BAR (Draggable) */}
      {isOpen && isMinimized && (
        <div
          style={{
            left:
              position?.x ??
              Math.max(16, window.innerWidth - 320),
            top:
              position?.y ??
              Math.max(40, window.innerHeight - 80)
          }}
          onMouseDown={handleDragStart}
          className={`fixed z-50 flex items-center justify-between gap-2.5 rounded-full border border-ink-700/80 bg-ink-950/95 px-3 py-1.5 text-xs text-white shadow-2xl backdrop-blur-xl transition-shadow select-none ${
            isDragging ? 'cursor-grabbing ring-2 ring-brand-500/60 shadow-brand-500/20' : 'cursor-grab hover:border-ink-600'
          }`}
          title="Click to restore or drag anywhere"
        >
          <div
            className="flex items-center gap-2 cursor-pointer py-1 pl-1"
            onClick={() => {
              setIsMinimized(false)
              setHasUnreadMessages(false)
            }}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
              <MessageSquare className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <span>Lounge</span>
              {isOnline ? (
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-amber-500" />
              )}
            </div>
            {hasUnreadMessages && (
              <span className="rounded-full bg-red-600 px-1.5 py-0.2 text-[9px] font-black text-white animate-pulse">
                NEW
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleSound}
              title={soundEnabled ? 'Mute new message chime' : 'Enable new message chime'}
              className="rounded-full p-1 text-slate-400 hover:bg-ink-800 hover:text-white transition"
            >
              {soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-slate-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMinimized(false)
                setHasUnreadMessages(false)
              }}
              title="Expand Lounge"
              className="rounded-full p-1 text-slate-400 hover:bg-ink-800 hover:text-white transition"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="Close"
              className="rounded-full p-1 text-slate-400 hover:bg-ink-800 hover:text-white transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. EXPANDED DRAGGABLE FLOATING WINDOW (Non-Blocking) */}
      {isOpen && !isMinimized && (
        <div
          style={{
            left:
              position?.x ??
              Math.max(16, window.innerWidth - 440),
            top:
              position?.y ??
              Math.max(40, window.innerHeight - 620)
          }}
          className={`fixed z-50 flex w-[420px] max-w-[calc(100vw-32px)] h-[580px] max-h-[calc(100vh-60px)] flex-col rounded-2xl border border-ink-800 bg-ink-950 shadow-2xl overflow-hidden transition-shadow ${
            isDragging ? 'ring-2 ring-brand-500/60 shadow-brand-500/25' : ''
          }`}
        >
          {/* Draggable Header */}
          <div
            onMouseDown={handleDragStart}
            className={`flex items-center justify-between border-b border-ink-800 bg-ink-900/90 px-3.5 py-2.5 backdrop-blur select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="h-4 w-4 text-slate-500" />
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-white text-xs">TINDA Global Lounge</h3>
                  {isDevActive && (
                    <span className="flex items-center gap-0.5 rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                      <Crown className="h-2.5 w-2.5" /> DEV
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  {isOnline ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Wifi className="h-2.5 w-2.5" /> Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400">
                      <WifiOff className="h-2.5 w-2.5" /> Offline
                    </span>
                  )}
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400 truncate max-w-[120px]">
                    {settings?.store_name || 'My Store'}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleSound}
                title={soundEnabled ? 'Mute message chime' : 'Enable message chime'}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white transition"
              >
                {soundEnabled ? (
                  <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5 text-slate-500" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDevInput(devKey)
                  setShowDevPrompt((v) => !v)
                }}
                title="Dev Verification Key"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white transition"
              >
                <Key className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  void fetchMessages()
                  void fetchAnnouncements()
                }}
                title="Refresh messages"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                title="Minimize Lounge"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white transition"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Dev Key Modal / Prompt */}
          {showDevPrompt && (
            <div className="border-b border-ink-800 bg-ink-900 p-2.5 text-xs">
              <p className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                Developer / Founder Authorization
              </p>
              <p className="text-slate-400 mb-2 text-[10px]">
                Enter master dev secret to unlock verified 👑 DEV / OWNER badge and message moderation.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={devInput}
                  onChange={(e) => setDevInput(e.target.value)}
                  placeholder="Enter Dev Master Secret..."
                  className="flex-1 rounded border border-ink-700 bg-ink-950 px-2.5 py-1 text-white text-xs outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={handleSaveDevKey}
                  className="btn-primary px-3 py-1 text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Pinned Announcements */}
          {announcements.length > 0 && announcements[0] && (
            <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-ink-900/60 to-ink-900/40 p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 mb-0.5">
                <Megaphone className="h-3 w-3" />
                <span>LIVE DEVELOPER ANNOUNCEMENT</span>
                {announcements[0]?.version_target && (
                  <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] text-amber-300">
                    {announcements[0].version_target}
                  </span>
                )}
              </div>
              <h4 className="text-xs font-semibold text-white">{announcements[0]?.title}</h4>
              <p className="mt-0.5 text-[11px] text-slate-300 leading-snug">
                {announcements[0]?.message}
              </p>
              <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400">
                <span className="flex items-center gap-1 text-amber-300/80">
                  <Crown className="h-2.5 w-2.5" /> {announcements[0]?.author}
                </span>
                <span>
                  {announcements[0]?.created_at
                    ? new Date(announcements[0].created_at).toLocaleDateString()
                    : ''}
                </span>
              </div>
            </div>
          )}

          {/* Free Community Banner */}
          <div className="m-2 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-ink-900 p-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-[11px] mb-0.5">
              <Sparkles className="h-3 w-3" />
              <span>TINDA Nationwide Merchant Community</span>
            </div>
            <p className="text-slate-300 text-[10px] leading-relaxed">
              Real-time merchant lounge with sound chime, draggable floating window, and instant message deletion.
            </p>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                <MessageSquare className="h-8 w-8 text-slate-700 mb-2" />
                <p className="font-semibold text-slate-400">No messages yet</p>
                <p className="mt-1 text-[11px]">Be the first merchant to post in the Global Lounge!</p>
              </div>
            ) : (
              messages.map((m) => {
                const isDev = Boolean(m.is_dev)
                const userCanDelete = canDelete(m)

                return (
                  <div
                    key={m.id}
                    className="group relative flex flex-col items-start transition-all"
                  >
                    {/* Sender Metadata Header */}
                    <div className="flex items-center gap-1.5 text-[10px] mb-0.5 px-1 w-full justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        {isDev ? (
                          <span className="flex items-center gap-1 font-bold text-amber-400">
                            <Crown className="h-2.5 w-2.5" />
                            Ian (Founder / Dev)
                            <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[8px] text-amber-300 border border-amber-500/30">
                              VERIFIED
                            </span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-medium text-slate-300 truncate">
                            <Store className="h-2.5 w-2.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-[140px]">{m.store_name}</span>
                            {Boolean(m.is_vip) && (
                              <span className="relative inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/25 via-yellow-400/35 to-amber-500/25 px-1.5 py-0.2 text-[8px] font-black tracking-wider text-amber-300 border border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                                <Sparkles className="h-2 w-2 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
                                <span>VIP</span>
                              </span>
                            )}
                            <span className="text-[9px] text-slate-500">
                              ({m.sender_name})
                            </span>
                          </span>
                        )}
                        <span className="text-slate-600">·</span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Delete Message Button */}
                      {userCanDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(m.id)}
                          title="Delete this message"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`rounded-xl px-3 py-1.5 text-xs leading-relaxed max-w-[92%] break-words ${
                        isDev
                          ? 'border border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-ink-900 text-amber-100 shadow-md'
                          : Boolean(m.is_vip)
                          ? 'border border-amber-500/35 bg-gradient-to-br from-amber-950/20 via-ink-900 to-ink-900 text-amber-50 shadow-[0_2px_12px_rgba(245,158,11,0.12)] ring-1 ring-amber-400/20'
                          : 'border border-ink-800 bg-ink-900 text-slate-200'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-ink-800 bg-ink-900/90 p-2.5"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={500}
                placeholder={
                  isDevActive
                    ? 'Write as 👑 Dev / Owner...'
                    : isLocalVip
                    ? 'Write as 💎 Verified VIP Pro...'
                    : 'Share a tip or ask fellow store owners...'
                }
                className="flex-1 rounded-xl border border-ink-700 bg-ink-950 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between px-1 text-[9px] text-slate-500">
              <span>
                {isDevActive
                  ? '👑 Posting with verified Developer identity'
                  : isLocalVip
                  ? '💎 Posting with Verified VIP Pro badge'
                  : 'Posting as store merchant'}
              </span>
              <span>{inputText.length} / 500</span>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
