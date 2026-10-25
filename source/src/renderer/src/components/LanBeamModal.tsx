import React, { useState, useEffect } from 'react'
import {
  Wifi,
  Radio,
  Send,
  Download,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  X,
  Server,
  Laptop,
  ArrowRight,
  ShieldCheck,
  Cable
} from 'lucide-react'
import type { BeamSenderInfo, DiscoveredBeamPeer } from '@shared/types'

interface LanBeamModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LanBeamModal({ isOpen, onClose }: LanBeamModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send')
  const [showHelp, setShowHelp] = useState(false)

  // Sender state
  const [senderInfo, setSenderInfo] = useState<BeamSenderInfo | null>(null)
  const [isStartingSender, setIsStartingSender] = useState(false)
  const [copiedPin, setCopiedPin] = useState(false)
  const [copiedIp, setCopiedIp] = useState(false)
  const [senderError, setSenderError] = useState<string | null>(null)

  // Receiver state
  const [peers, setPeers] = useState<DiscoveredBeamPeer[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [selectedPeer, setSelectedPeer] = useState<DiscoveredBeamPeer | null>(null)
  const [manualIp, setManualIp] = useState('')
  const [useManualIp, setUseManualIp] = useState(false)
  const [receiverPin, setReceiverPin] = useState('')
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferStep, setTransferStep] = useState<string>('')
  const [transferError, setTransferError] = useState<string | null>(null)
  const [transferSuccess, setTransferSuccess] = useState(false)

  // Initialize and check active sender if modal opens
  useEffect(() => {
    if (!isOpen) {
      setTransferSuccess(false)
      setTransferError(null)
      return
    }

    const checkActiveSender = async (): Promise<void> => {
      try {
        const info = await window.api.lan.getActiveBeam()
        if (info && info.expiresAt > Date.now()) {
          setSenderInfo(info)
        }
      } catch (e) {
        console.error('Failed to get active beam:', e)
      }
    }
    void checkActiveSender()
  }, [isOpen])

  // Sender actions
  const handleStartSender = async (): Promise<void> => {
    setIsStartingSender(true)
    setSenderError(null)
    try {
      const info = await window.api.lan.startBeam()
      setSenderInfo(info)
    } catch (e) {
      setSenderError((e as Error)?.message || 'Failed to start beam sender')
    } finally {
      setIsStartingSender(false)
    }
  }

  const handleStopSender = async (): Promise<void> => {
    try {
      await window.api.lan.stopBeam()
      setSenderInfo(null)
    } catch (e) {
      console.error('Failed to stop beam sender:', e)
    }
  }

  // Receiver actions
  const handleScanPeers = async (): Promise<void> => {
    setIsScanning(true)
    setTransferError(null)
    try {
      const list = await window.api.lan.discoverBeamPeers()
      setPeers(list)
      if (list.length > 0 && !selectedPeer) {
        // Automatically select the first peer that is in beam ready mode
        const ready = list.find((p) => p.isBeamReady) || list[0]
        setSelectedPeer(ready || null)
      }
    } catch (e) {
      setTransferError((e as Error)?.message || 'Failed to scan nearby PCs')
    } finally {
      setIsScanning(false)
    }
  }

  useEffect(() => {
    if (isOpen && activeTab === 'receive') {
      void handleScanPeers()
    }
  }, [isOpen, activeTab])

  const handlePullData = async (): Promise<void> => {
    const targetIp = useManualIp ? manualIp.trim() : selectedPeer?.ip
    const targetPort = selectedPeer?.port || 3111
    const pin = receiverPin.trim()

    if (!targetIp) {
      setTransferError('Please select a nearby PC or enter an IP address.')
      return
    }
    if (!pin || pin.length < 6) {
      setTransferError('Please enter the 6-digit PIN shown on the Sender PC screen.')
      return
    }

    setIsTransferring(true)
    setTransferError(null)
    setTransferStep('Connecting to Sender PC...')

    try {
      setTransferStep('Pulling store snapshot and verifying database...')
      const res = await window.api.lan.pullBeamData(targetIp, targetPort, pin)
      if (!res.ok) {
        throw new Error(res.error || 'Transfer failed')
      }

      setTransferStep('Applying atomic safety restore...')
      setTransferSuccess(true)
      setTransferStep('Sync complete! TINDA POS is restarting...')
    } catch (e) {
      setTransferError((e as Error)?.message || 'Transfer failed. Check connection.')
      setIsTransferring(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                TINDA LAN Direct Beam
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Wi-Fi & LAN Cable
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Instantly transfer and clone store data between two PCs on the same local network
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              title="Step-by-step instructions"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              disabled={isTransferring}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-40"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Step-by-Step Illustrated Guide Banner */}
        {showHelp && (
          <div className="border-b border-emerald-500/20 bg-emerald-950/20 p-5 text-xs text-slate-300">
            <h3 className="font-semibold text-emerald-300 mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> 4-Step Connection & Transfer Guide:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700/60">
                <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Cable className="h-3.5 w-3.5" /> 1. Connect Both Laptops
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Connect both PCs to the <strong>same Wi-Fi router</strong> or plug a single <strong>LAN Cable directly</strong> between both laptops (no router needed).
                </p>
              </div>
              <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700/60">
                <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5" /> 2. On Old PC (Sender)
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Select the <strong>&quot;Send Data&quot;</strong> tab and click <em>&quot;Start Beam Broadcast&quot;</em>. Read the generated 6-digit PIN.
                </p>
              </div>
              <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700/60">
                <div className="font-bold text-teal-400 mb-1 flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5" /> 3. On New PC (Receiver)
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Select the <strong>&quot;Receive Data&quot;</strong> tab. Pick the Old PC from the scan list and enter the 6-digit PIN.
                </p>
              </div>
              <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700/60">
                <div className="font-bold text-teal-400 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 4. Instant 100% Sync
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Products, transactions, customers, and inventory transfer in 1-2 seconds with automatic safety backup and restart!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-2 gap-2">
          <button
            onClick={() => setActiveTab('send')}
            disabled={isTransferring}
            className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'send'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Send className="h-4 w-4" />
            <span>Send Data to Another PC (Laptop A)</span>
          </button>
          <button
            onClick={() => setActiveTab('receive')}
            disabled={isTransferring}
            className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'receive'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Receive Data from Another PC (Laptop B)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5">
          {activeTab === 'send' ? (
            /* =================== SENDER TAB =================== */
            <div className="space-y-5">
              {!senderInfo ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-6 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Radio className="h-7 w-7" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-sm font-bold text-slate-200">Share Store Data with a Nearby Laptop</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Click below to generate a secure 6-digit PIN and broadcast across your local Wi-Fi and LAN cable.
                    </p>
                  </div>
                  {senderError && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center justify-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>{senderError}</span>
                    </div>
                  )}
                  <button
                    onClick={() => void handleStartSender()}
                    disabled={isStartingSender}
                    className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50"
                  >
                    {isStartingSender ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Starting Broadcast...</span>
                      </>
                    ) : (
                      <>
                        <Radio className="h-4 w-4" />
                        <span>Start Beam Broadcast</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span>Broadcasting on Local Network</span>
                    </div>
                    <button
                      onClick={() => void handleStopSender()}
                      className="text-xs text-slate-400 hover:text-rose-400 font-medium transition-colors"
                    >
                      Stop Broadcast
                    </button>
                  </div>

                  {/* 6-Digit PIN Display */}
                  <div className="text-center py-2">
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                      Enter this 6-Digit Security PIN on the Receiver PC:
                    </p>
                    <div className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-950 border border-emerald-500/40 shadow-inner">
                      <span className="font-mono text-3xl font-extrabold tracking-[0.25em] text-emerald-400">
                        {senderInfo.pin}
                      </span>
                      <button
                        onClick={() => {
                          void navigator.clipboard.writeText(senderInfo.pin)
                          setCopiedPin(true)
                          setTimeout(() => setCopiedPin(false), 2000)
                        }}
                        className="ml-3 p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                        title="Copy PIN"
                      >
                        {copiedPin ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Connection Details Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400">Store Name:</span>
                      <p className="font-semibold text-slate-200">{senderInfo.storeName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Direct IP Address:</span>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-semibold text-emerald-400">{senderInfo.ip}:{senderInfo.port}</p>
                        <button
                          onClick={() => {
                            void navigator.clipboard.writeText(senderInfo.ip)
                            setCopiedIp(true)
                            setTimeout(() => setCopiedIp(false), 2000)
                          }}
                          className="text-slate-400 hover:text-slate-200"
                          title="Copy IP"
                        >
                          {copiedIp ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-center text-slate-400">
                    Keep this window open. When the receiver connects and enters the PIN, the store snapshot will stream immediately.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* =================== RECEIVER TAB =================== */
            <div className="space-y-5">
              {transferSuccess ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-bold text-emerald-300">Data Transfer Complete!</h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    All store items, transactions, customers, and settings were safely imported. TINDA POS is restarting now with the new database...
                  </p>
                </div>
              ) : isTransferring ? (
                <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-8 text-center space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 text-teal-400">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{transferStep}</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Do not close or turn off your computer during synchronization.
                    </p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-1.5 w-full animate-pulse"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Step 1: Select Peer PC */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Server className="h-3.5 w-3.5 text-teal-400" />
                        1. Select Nearby Sender PC:
                      </label>
                      <button
                        onClick={() => void handleScanPeers()}
                        disabled={isScanning}
                        className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className={`h-3 w-3 ${isScanning ? 'animate-spin' : ''}`} />
                        <span>{isScanning ? 'Scanning...' : 'Refresh Scan'}</span>
                      </button>
                    </div>

                    {!useManualIp ? (
                      <div className="space-y-2">
                        {peers.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/30 p-5 text-center text-xs text-slate-400">
                            {isScanning ? (
                              <div className="flex items-center justify-center gap-2">
                                <RefreshCw className="h-4 w-4 animate-spin text-teal-400" />
                                <span>Scanning local Wi-Fi and LAN cables for active TINDA senders...</span>
                              </div>
                            ) : (
                              <div>
                                <p>No active Sender PCs detected on local network.</p>
                                <p className="text-[11px] text-slate-500 mt-1">
                                  Ensure Laptop A clicked <strong>&quot;Start Beam Broadcast&quot;</strong>, or switch to manual IP below.
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                            {peers.map((peer) => {
                              const isSelected = selectedPeer?.ip === peer.ip
                              return (
                                <button
                                  key={`${peer.ip}:${peer.port}`}
                                  onClick={() => setSelectedPeer(peer)}
                                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                    isSelected
                                      ? 'border-teal-500/50 bg-teal-950/20 shadow-md shadow-teal-950/20'
                                      : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-400'}`}>
                                      <Laptop className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-xs text-slate-200 flex items-center gap-2">
                                        <span>{peer.storeName}</span>
                                        {peer.isBeamReady && (
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            BEAM READY
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] font-mono text-slate-400">{peer.ip}:{peer.port}</div>
                                    </div>
                                  </div>
                                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-teal-500 bg-teal-500' : 'border-slate-700'}`}>
                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}

                        <div className="text-right">
                          <button
                            onClick={() => setUseManualIp(true)}
                            className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                          >
                            Enter Sender IP manually instead
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={manualIp}
                            onChange={(e) => setManualIp(e.target.value)}
                            placeholder="e.g. 192.168.1.9"
                            className="flex-1 input-field font-mono text-xs"
                          />
                          <button
                            onClick={() => setUseManualIp(false)}
                            className="btn-ghost text-xs py-2 px-3"
                          >
                            Back to Scanner
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Enter the Direct IP shown on the Sender PC screen.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Step 2: 6-Digit PIN Input */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                      2. Enter Sender&apos;s 6-Digit PIN:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={receiverPin}
                      onChange={(e) => setReceiverPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full text-center tracking-[0.3em] font-mono text-2xl font-bold py-3 rounded-xl bg-slate-950 border border-slate-700 text-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                    />
                  </div>

                  {transferError && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{transferError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={() => void handlePullData()}
                    disabled={isTransferring || (!selectedPeer && !manualIp.trim()) || receiverPin.length < 6}
                    className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-teal-950/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Receive and Clone Store Data</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-800 bg-slate-950/60 px-6 py-3 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Automatic safety backup created before applying any changes</span>
          </div>
          <span className="font-mono text-slate-400">Port 3111 (TCP) / 3112 (UDP)</span>
        </div>
      </div>
    </div>
  )
}
