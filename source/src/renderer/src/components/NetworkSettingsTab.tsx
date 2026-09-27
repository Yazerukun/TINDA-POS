import React, { useState, useEffect } from 'react'
import {
  Network,
  Server,
  Laptop,
  Cloud,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Radio,
  Wifi,
  Users,
  HardDrive
} from 'lucide-react'
import type { LanStatus, LanRole } from '@shared/types'

export function NetworkSettingsTab(): React.JSX.Element {
  const [status, setStatus] = useState<LanStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingMode, setSavingMode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pinCopied, setPinCopied] = useState(false)

  // Satellite configuration inputs
  const [masterIp, setMasterIp] = useState('')
  const [pairingPin, setPairingPin] = useState('')
  const [deviceName, setDeviceName] = useState('Counter 2 Cashier')
  const [pairingStatus, setPairingStatus] = useState<{ loading: boolean; error?: string; success?: string }>({
    loading: false
  })

  // VPS configuration inputs
  const [vpsEnabled, setVpsEnabled] = useState(false)
  const [vpsUrl, setVpsUrl] = useState('')
  const [vpsToken, setVpsToken] = useState('')
  const [vpsTesting, setVpsTesting] = useState(false)
  const [vpsSyncing, setVpsSyncing] = useState(false)
  const [vpsMessage, setVpsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadStatus = async (): Promise<void> => {
    try {
      const s = await window.api.lan.getStatus()
      setStatus(s)
      setVpsEnabled(s.vpsStatus.enabled)
      setVpsUrl(s.vpsStatus.url || '')
      if (s.masterUrl) {
        try {
          const u = new URL(s.masterUrl)
          setMasterIp(u.hostname)
        } catch {
          // ignore
        }
      }
    } catch (e) {
      console.error('Failed to load LAN status:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStatus()
    const unsubscribe = window.api.lan.onStatus((newStatus) => {
      setStatus(newStatus)
    })
    return () => unsubscribe()
  }, [])

  const handleSelectRole = async (role: LanRole): Promise<void> => {
    setSavingMode(true)
    try {
      const newStatus = await window.api.lan.setMode(role)
      setStatus(newStatus)
    } catch (err) {
      alert('Failed to change network mode: ' + (err as Error).message)
    } finally {
      setSavingMode(false)
    }
  }

  const handleGeneratePin = async (): Promise<void> => {
    try {
      const pin = await window.api.lan.generatePin()
      if (status) setStatus({ ...status, pairingPin: pin })
    } catch (err) {
      alert('Failed to generate PIN: ' + (err as Error).message)
    }
  }

  const handlePairSatellite = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setPairingStatus({ loading: true })
    try {
      const res = await window.api.lan.pair(masterIp, pairingPin, deviceName)
      if (res.ok) {
        setPairingStatus({
          loading: false,
          success: `Successfully connected to Master Server (${res.storeName || 'Store'})!`
        })
        void loadStatus()
      } else {
        setPairingStatus({ loading: false, error: res.error || 'Connection failed' })
      }
    } catch (err) {
      setPairingStatus({ loading: false, error: (err as Error).message })
    }
  }

  const handleTestVps = async (): Promise<void> => {
    setVpsTesting(true)
    setVpsMessage(null)
    try {
      const res = await window.api.lan.testVps(vpsUrl, vpsToken)
      if (res.ok) {
        setVpsMessage({ type: 'success', text: res.message })
      } else {
        setVpsMessage({ type: 'error', text: res.message })
      }
    } catch (err) {
      setVpsMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setVpsTesting(false)
    }
  }

  const handleTriggerVpsSync = async (): Promise<void> => {
    setVpsSyncing(true)
    setVpsMessage(null)
    try {
      const res = await window.api.lan.triggerVpsSync()
      if (res.ok) {
        setVpsMessage({ type: 'success', text: `Sync complete! Synced ${res.syncedCount} sales records to VPS.` })
        void loadStatus()
      } else {
        setVpsMessage({ type: 'error', text: res.message })
      }
    } catch (err) {
      setVpsMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setVpsSyncing(false)
    }
  }

  const copyToClipboard = (text: string, isPin = false): void => {
    void navigator.clipboard.writeText(text)
    if (isPin) {
      setPinCopied(true)
      setTimeout(() => setPinCopied(false), 2000)
    } else {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading Network configuration...
      </div>
    )
  }

  const currentRole = status?.role || 'standalone'

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400">
            <Network className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Multi-Computer LAN & Cloud Setup</h2>
            <p className="text-sm text-slate-400">
              Run multiple checkout cashiers on one shared database (100% offline) or mirror sales to your personal VPS.
            </p>
          </div>
        </div>
      </div>

      {/* Mode Selector Cards */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Terminal Network Mode
        </label>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Card 1: Standalone */}
          <div
            onClick={() => void handleSelectRole('standalone')}
            className={`cursor-pointer rounded-xl border p-4 transition-all ${
              currentRole === 'standalone'
                ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <HardDrive className={`h-5 w-5 ${currentRole === 'standalone' ? 'text-brand-400' : 'text-slate-400'}`} />
              <input
                type="radio"
                checked={currentRole === 'standalone'}
                onChange={() => void handleSelectRole('standalone')}
                className="text-brand-500 focus:ring-brand-500"
              />
            </div>
            <h3 className="mt-3 font-semibold text-slate-100">Standalone (Single PC)</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Default mode. This computer operates independently using its own local SQLite database.
            </p>
          </div>

          {/* Card 2: Master Server */}
          <div
            onClick={() => void handleSelectRole('master')}
            className={`cursor-pointer rounded-xl border p-4 transition-all ${
              currentRole === 'master'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <Server className={`h-5 w-5 ${currentRole === 'master' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <input
                type="radio"
                checked={currentRole === 'master'}
                onChange={() => void handleSelectRole('master')}
                className="text-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <h3 className="mt-3 font-semibold text-slate-100">Master Server (Host)</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Cashier 1 / Server PC. Holds the main store database and serves other cashier terminals over local Wi-Fi.
            </p>
          </div>

          {/* Card 3: Satellite Client */}
          <div
            onClick={() => void handleSelectRole('satellite')}
            className={`cursor-pointer rounded-xl border p-4 transition-all ${
              currentRole === 'satellite'
                ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <Laptop className={`h-5 w-5 ${currentRole === 'satellite' ? 'text-sky-400' : 'text-slate-400'}`} />
              <input
                type="radio"
                checked={currentRole === 'satellite'}
                onChange={() => void handleSelectRole('satellite')}
                className="text-sky-500 focus:ring-sky-500"
              />
            </div>
            <h3 className="mt-3 font-semibold text-slate-100">Satellite Terminal</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Cashier 2 / Stockroom PC. Connects to the Master Server PC. Rings up sales using the Master's catalog and stock.
            </p>
          </div>
        </div>
      </div>

      {/* Mode Details Section */}
      {currentRole === 'master' && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
              </span>
              Master Server Active & Listening
            </div>
            <span className="text-xs text-slate-400">Port {status?.port || 3111}</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left: Master Connection Info */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Master Server Local IP Address</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={status?.ip || '127.0.0.1'}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-sm text-slate-100"
                  />
                  <button
                    onClick={() => copyToClipboard(status?.ip || '')}
                    className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs"
                    title="Copy IP"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">Type this IP address into the Satellite PCs on your store Wi-Fi.</p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase text-slate-400">Security Pairing PIN</label>
                  <button
                    onClick={() => void handleGeneratePin()}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Generate New PIN
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-4 py-2.5 text-center font-mono text-2xl font-bold tracking-widest text-emerald-300">
                    {status?.pairingPin || '------'}
                  </div>
                  <button
                    onClick={() => copyToClipboard(status?.pairingPin || '', true)}
                    className="btn-ghost flex items-center gap-1.5 px-3 py-2.5 text-xs"
                    title="Copy PIN"
                  >
                    {pinCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  New terminals must enter this 6-digit PIN to authorize connection.
                </p>
              </div>
            </div>

            {/* Right: Connected Devices */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
                  <Users className="h-4 w-4 text-emerald-400" /> Connected Terminals ({status?.connectedClients || 0})
                </span>
                <span className="text-xs text-slate-500">Real-Time Sync Active</span>
              </div>

              {status?.clientDevices && status.clientDevices.length > 0 ? (
                <div className="mt-3 divide-y divide-slate-800">
                  {status.clientDevices.map((dev) => (
                    <div key={dev.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-200">{dev.name}</div>
                        <div className="font-mono text-slate-500">{dev.ip}</div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400 font-medium">
                        <Check className="h-3 w-3" /> Paired
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 text-center text-xs text-slate-500">
                  No satellite terminals connected yet. Pair your Cashier 2 computer using the IP and PIN above.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentRole === 'satellite' && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-400 font-semibold">
              <Wifi className="h-4 w-4" />
              Satellite Terminal Mode
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                status?.satelliteConnected
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  status?.satelliteConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              {status?.satelliteConnected ? 'Connected to Master' : 'Disconnected / Not Paired'}
            </span>
          </div>

          <form onSubmit={(e) => void handlePairSatellite(e)} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Master Server IP</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 192.168.1.50"
                  value={masterIp}
                  onChange={(e) => setMasterIp(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">6-Digit Security PIN</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 849201"
                  value={pairingPin}
                  onChange={(e) => setPairingPin(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-sm tracking-widest text-slate-100 placeholder-slate-500 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Terminal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Counter 2 Cashier"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500"
                />
              </div>
            </div>

            {pairingStatus.error && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                ❌ {pairingStatus.error}
              </div>
            )}
            {pairingStatus.success && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                ✓ {pairingStatus.success}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={pairingStatus.loading}
                className="btn-primary flex items-center gap-2 bg-sky-600 hover:bg-sky-500"
              >
                {pairingStatus.loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Connect & Pair with Master
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cloud Mirroring & Self-Hosted VPS Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-500/10 p-2.5 text-sky-400">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">Self-Hosted VPS Cloud Mirroring</h3>
              <p className="text-xs text-slate-400">
                Connect your store to your own Linux VPS ($4-$5/mo) for remote sales monitoring from your phone.
              </p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={vpsEnabled}
              onChange={(e) => setVpsEnabled(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-500 peer-checked:after:translate-x-full"></div>
          </label>
        </div>

        {vpsEnabled && (
          <div className="mt-5 space-y-4 border-t border-slate-800 pt-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">VPS Endpoint URL</label>
                <input
                  type="text"
                  placeholder="https://pos.mystore.com"
                  value={vpsUrl}
                  onChange={(e) => setVpsUrl(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Secret API Token</label>
                <input
                  type="password"
                  placeholder="Enter secret token from VPS setup"
                  value={vpsToken}
                  onChange={(e) => setVpsToken(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
                />
              </div>
            </div>

            {vpsMessage && (
              <div
                className={`rounded-lg border p-3 text-xs ${
                  vpsMessage.type === 'success'
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                }`}
              >
                {vpsMessage.text}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500">
                {status?.vpsStatus.lastSyncAt ? (
                  <>Last synced: {new Date(status.vpsStatus.lastSyncAt).toLocaleString()}</>
                ) : (
                  <>Offline-First Protection: Store checkout continues even if internet drops.</>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleTestVps()}
                  disabled={vpsTesting}
                  className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs"
                >
                  {vpsTesting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  Test VPS Connection
                </button>
                <button
                  type="button"
                  onClick={() => void handleTriggerVpsSync()}
                  disabled={vpsSyncing}
                  className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs bg-brand-600 hover:bg-brand-500"
                >
                  {vpsSyncing && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  Sync Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
