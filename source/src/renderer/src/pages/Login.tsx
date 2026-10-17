import { useState, useEffect } from 'react'
import { useAuth } from '../stores/auth'
import { ConnectionStatus } from '../components/ConnectionStatus'

interface PublicUser {
  id: number
  username: string
  full_name: string
  roles: string[]
}

export function Login(): React.JSX.Element {
  const { login, loginPin } = useAuth()
  const [mode, setMode] = useState<'password' | 'pin'>('password')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([])
  // For 1-tap chip selection
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null)

  useEffect(() => {
    // Load public user directory for login chips
    window.api.auth.publicUsers().then(setPublicUsers).catch(() => setPublicUsers([]))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const f = e.currentTarget as HTMLFormElement
    const data = new FormData(f)
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'password') {
        // If a chip user is selected, pre-fill username from chip; otherwise use input
        const usernameVal = selectedUser?.username || String(data.get('username') ?? '')
        await login(usernameVal, String(data.get('password') ?? ''))
      } else {
        const pin = String(data.get('pin') ?? '')
        // M7.3 — target-aware: if chip selected, only verify that user's PIN
        await loginPin(pin, selectedUser?.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChipClick = (u: PublicUser) => {
    setSelectedUser((prev) => (prev?.id === u.id ? null : u))
    setError(null)
    // Auto-switch to PIN mode if a cashier chip is tapped
    if (mode !== 'pin') setMode('pin')
  }

  return (
    <div className="flex min-h-[100svh] w-screen items-center justify-center bg-ink-950 p-6 supports-[height:100dvh]:min-h-[100dvh]">
      <div className="card w-full max-w-sm p-8">
        {/* Header */}
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-lg font-black text-white">
            TP
          </div>
          <h1 className="text-xl font-bold text-white">TINDA POS</h1>
          <p className="text-xs text-slate-400">Offline POS System</p>
          <ConnectionStatus className="mt-3" />
        </div>

        {/* 1-Tap Cashier Chips — M7.6 */}
        {publicUsers.length > 1 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Quick Select</p>
            <div className="flex flex-wrap gap-2">
              {publicUsers.map((u) => {
                const initials = u.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                const isSelected = selectedUser?.id === u.id
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleChipClick(u)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-brand-600/20 border-brand-500/60 text-brand-300 shadow-sm shadow-brand-500/20'
                        : 'bg-ink-900 border-ink-line text-slate-300 hover:bg-ink-800 hover:border-slate-600'
                    }`}
                    title={`Login as ${u.full_name}`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isSelected ? 'bg-brand-500 text-white' : 'bg-ink-750 text-slate-400'}`}>
                      {initials}
                    </span>
                    <span className="max-w-[80px] truncate">{u.full_name.split(' ')[0]}</span>
                    {isSelected && <span className="ml-auto text-brand-400">✓</span>}
                  </button>
                )
              })}
            </div>
            {selectedUser && (
              <p className="mt-2 text-xs text-slate-400">
                Signing in as <span className="font-semibold text-slate-200">{selectedUser.full_name}</span>
                {' '}· <button type="button" onClick={() => { setSelectedUser(null); setError(null) }} className="text-slate-500 hover:text-slate-300 underline">Clear</button>
              </p>
            )}
          </div>
        )}

        {/* Mode Tabs */}
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-ink-900 p-1">
          {(['password', 'pin'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null) }}
              className={`rounded-md py-1.5 text-sm font-semibold transition ${
                mode === m ? 'bg-ink-750 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m === 'password' ? 'Password' : 'Quick PIN'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === 'password' ? (
            <>
              {/* If no chip selected, show username field */}
              {!selectedUser && (
                <input
                  className="input"
                  name="username"
                  placeholder="Username or Full Name"
                  autoFocus
                  autoComplete="off"
                />
              )}
              {selectedUser && (
                <div className="input flex items-center gap-2 text-slate-300 bg-ink-900/50">
                  <span className="text-slate-500 text-xs">User:</span>
                  <span className="font-medium">{selectedUser.full_name}</span>
                </div>
              )}
              <div className="relative">
                <input
                  className="input pr-1"
                  name="password"
                  type="password"
                  placeholder="Password"
                  autoFocus={!!selectedUser}
                  autoComplete="off"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {selectedUser && (
                <p className="text-xs text-slate-400">
                  PIN for <span className="font-semibold text-slate-200">{selectedUser.full_name}</span>
                </p>
              )}
              <input
                className="input w-full text-center text-2xl tracking-[0.5em]"
                name="pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                autoFocus
                autoComplete="off"
              />
            </div>
          )}
          {error && <p className="text-sm text-danger-400">{error}</p>}
          <button className="btn-primary mt-1 w-full" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : mode === 'password' ? 'Sign In' : 'Unlock'}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-slate-500">
          TINDA POS works fully offline. Your data stays on this device.
        </p>
        <p className="dev-signature signature-reveal mt-2 text-center text-sm italic text-slate-600">by Dev Francis</p>
      </div>
    </div>
  )
}
