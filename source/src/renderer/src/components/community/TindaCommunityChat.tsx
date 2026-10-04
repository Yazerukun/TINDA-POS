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
  Megaphone
} from 'lucide-react'
import type { LiveAnnouncement, CommunityChatMessage } from '@shared/types'
import { useSettings } from '../../stores/settings'

export function TindaCommunityChat(): React.JSX.Element {
  const { settings } = useSettings()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<CommunityChatMessage[]>([])
  const [announcements, setAnnouncements] = useState<LiveAnnouncement[]>([])
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [devKey, setDevKey] = useState<string>(() => {
    return localStorage.getItem('tinda_dev_key') || ''
  })
  const [showDevPrompt, setShowDevPrompt] = useState(false)
  const [devInput, setDevInput] = useState('')
  const [unreadAnnouncement, setUnreadAnnouncement] = useState(false)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const [isLocalVip, setIsLocalVip] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

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
        setMessages(res.messages)
        setIsOnline(true)

        // Check for unread messages when drawer is closed
        if (res.messages.length > 0) {
          const lastMsg = res.messages[res.messages.length - 1]
          const lastSeenId = localStorage.getItem('tinda_last_seen_msg_id')
          if (!isOpen && lastSeenId && lastMsg && lastMsg.id !== lastSeenId) {
            setHasUnreadMessages(true)
          } else if (isOpen && lastMsg) {
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
  }, [isOpen])

  // Initial fetch on mount for announcements, messages badge, and VIP status
  useEffect(() => {
    void fetchAnnouncements()
    void fetchMessages()
    window.api?.license?.getStatus?.().then((s) => {
      if (s && typeof s.isVip === 'boolean') {
        setIsLocalVip(s.isVip)
      }
    }).catch(() => {})
  }, [fetchAnnouncements, fetchMessages])

  // Polling:
  // When open: poll every 5s
  // When closed: poll every 12s in background so red notification triggers on new messages
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, fetchAnnouncements, fetchMessages, scrollToBottom])

  const handleOpen = (): void => {
    setIsOpen(true)
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

  const handleSendMessage = async (e?: React.FormEvent): Promise<void> => {
    if (e) e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed || isSending) return

    setIsSending(true)
    try {
      const res = await window.api?.community?.sendMessage(trimmed, devKey || undefined)
      if (res && res.ok && res.message) {
        setMessages((prev) => [...prev, res.message!])
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

  return (
    <>
      {/* Floating Trigger Button */}
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

      {/* Slide-over Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-ink-950 border-l border-ink-800 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-800 bg-ink-900/80 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">TINDA Global Lounge</h3>
                {isDevActive && (
                  <span className="flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                    <Crown className="h-3 w-3" /> DEV
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {isOnline ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Wifi className="h-3 w-3" /> Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400">
                    <WifiOff className="h-3 w-3" /> Offline (Retrying...)
                  </span>
                )}
                <span className="text-slate-600">·</span>
                <span className="text-slate-400 truncate max-w-[150px]">
                  {settings?.store_name || 'My Store'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setDevInput(devKey)
                setShowDevPrompt((v) => !v)
              }}
              title="Dev Verification Key"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white transition"
            >
              <Key className="h-4 w-4" />
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
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Dev Key Modal / Prompt */}
        {showDevPrompt && (
          <div className="border-b border-ink-800 bg-ink-900 p-3 text-xs">
            <p className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              Developer / Founder Authorization
            </p>
            <p className="text-slate-400 mb-2">
              Enter your master dev secret to unlock the verified 👑 DEV / OWNER badge.
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
          <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-ink-900/60 to-ink-900/40 p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
              <Megaphone className="h-3.5 w-3.5" />
              <span>LIVE DEVELOPER ANNOUNCEMENT</span>
              {announcements[0]?.version_target && (
                <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] text-amber-300">
                  {announcements[0].version_target}
                </span>
              )}
            </div>
            <h4 className="text-xs font-semibold text-white">{announcements[0]?.title}</h4>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              {announcements[0]?.message}
            </p>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-amber-300/80">
                <Crown className="h-3 w-3" /> {announcements[0]?.author}
              </span>
              <span>{announcements[0]?.created_at ? new Date(announcements[0].created_at).toLocaleDateString() : ''}</span>
            </div>
          </div>
        )}

        {/* Free Community Banner */}
        <div className="m-3 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-ink-900 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-0.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>TINDA Nationwide Merchant Community</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Free and open for all store owners. Chat, share pricing insights, and receive real-time updates directly from the developer!
          </p>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
              <MessageSquare className="h-10 w-10 text-slate-700 mb-2" />
              <p className="font-semibold text-slate-400">No messages yet</p>
              <p className="mt-1">Be the first merchant to post in the Global Lounge!</p>
            </div>
          ) : (
            messages.map((m) => {
              const isDev = Boolean(m.is_dev)
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isDev ? 'items-start' : 'items-start'}`}
                >
                  {/* Sender Metadata Header */}
                  <div className="flex items-center gap-1.5 text-[11px] mb-1 px-1">
                    {isDev ? (
                      <span className="flex items-center gap-1 font-bold text-amber-400">
                        <Crown className="h-3 w-3" />
                        Ian (Founder / Dev)
                        <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] text-amber-300 border border-amber-500/30">
                          VERIFIED
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 font-medium text-slate-300">
                        <Store className="h-3 w-3 text-slate-400" />
                        <span>{m.store_name}</span>
                        {Boolean(m.is_vip) && (
                          <span className="relative inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/25 via-yellow-400/35 to-amber-500/25 px-2 py-0.5 text-[9px] font-black tracking-wider text-amber-300 border border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse">
                            <Sparkles className="h-2.5 w-2.5 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
                            <span>VERIFIED VIP</span>
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">
                          ({m.sender_name})
                        </span>
                      </span>
                    )}
                    <span className="text-slate-600">·</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed max-w-[90%] break-words ${
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
          className="border-t border-ink-800 bg-ink-900/90 p-3"
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
              className="flex-1 rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-slate-500">
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
    </>
  )
}
