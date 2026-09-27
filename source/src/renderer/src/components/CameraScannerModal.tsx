import { useEffect, useRef, useState, useMemo } from 'react'
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  HTMLCanvasElementLuminanceSource,
  HybridBinarizer,
  GlobalHistogramBinarizer,
  BinaryBitmap,
  BrowserQRCodeSvgWriter
} from '@zxing/library'
import {
  Camera,
  Smartphone,
  QrCode,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  VideoOff,
  FlipHorizontal,
  CornerDownLeft,
  Wifi,
  Sparkles,
  ExternalLink
} from 'lucide-react'
import { Modal } from './ui/Modal'

interface CameraScannerModalProps {
  open: boolean
  onClose: () => void
  onScan: (barcode: string) => void
}

function playBeep(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(920, ctx.currentTime)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  } catch {
    // Non-blocking audio
  }
}

import { isValidBarcode } from '../lib/barcodeScanner'

export function CameraScannerModal({ open, onClose, onScan }: CameraScannerModalProps): React.JSX.Element | null {
  const [tab, setTab] = useState<'phone' | 'camera' | 'guide'>('phone')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [mirrored, setMirrored] = useState(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')

  // Phone QR Scanner State
  const [phoneMode, setPhoneMode] = useState<'https' | 'http'>('https')
  const [phoneStatus, setPhoneStatus] = useState<{
    running: boolean
    port: number
    httpsPort: number
    ip: string
    url: string
    httpsUrl: string
    connected: boolean
    device?: string
  }>({
    running: false,
    port: 3112,
    httpsPort: 3113,
    ip: '127.0.0.1',
    url: '',
    httpsUrl: '',
    connected: false
  })

  const qrContainerRef = useRef<HTMLDivElement>(null)
  const lastScannedRef = useRef<string | null>(null)
  const lastScanTimeRef = useRef<number>(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fullCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const scanLoopRef = useRef<number | null>(null)

  // Configure ZXing reader strictly for retail formats (NO raw ITF or unconstrained Code 39)
  const reader = useMemo(() => {
    const hints = new Map()
    hints.set(DecodeHintType.TRY_HARDER, true)
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.QR_CODE
    ])
    const r = new MultiFormatReader()
    r.setHints(hints)
    return r
  }, [])

  // Sync Phone Companion Scanner State from Electron Main Service
  useEffect(() => {
    if (!open) return

    void window.api.phoneScanner?.getStatus().then((status) => {
      if (status) setPhoneStatus(status)
    })

    const cleanupStatus = window.api.phoneScanner?.onStatus((status) => {
      setPhoneStatus((prev) => ({
        ...prev,
        connected: status.connected,
        device: status.device
      }))
    })

    const cleanupScan = window.api.phoneScanner?.onScan((barcode) => {
      playBeep()
      setLastScanned(barcode)
      onScan(barcode)
    })

    return () => {
      cleanupStatus?.()
      cleanupScan?.()
    }
  }, [open, onScan])

  const activePhoneUrl = phoneMode === 'https' ? (phoneStatus.httpsUrl || phoneStatus.url) : phoneStatus.url

  // Render QR Code SVG whenever phone scanner URL is available
  useEffect(() => {
    if (tab === 'phone' && activePhoneUrl && qrContainerRef.current) {
      try {
        const writer = new BrowserQRCodeSvgWriter()
        const svg = writer.write(activePhoneUrl, 240, 240)
        svg.setAttribute('style', 'display:block;border-radius:12px;background:#ffffff;padding:12px;')
        qrContainerRef.current.replaceChildren(svg)
      } catch (err) {
        console.error('Failed to generate companion QR code:', err)
      }
    }
  }, [tab, activePhoneUrl])

  // Load available camera devices for local webcam tab
  const loadDevices = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setCameraError('Camera API is not supported on this device.')
        return
      }

      try {
        const testStream = await navigator.mediaDevices.getUserMedia({ video: true })
        testStream.getTracks().forEach((t) => t.stop())
      } catch {
        // Continue even if already permitted
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput')
      setDevices(videoInputs)

      if (videoInputs.length > 0) {
        const preferred = videoInputs.find(
          (d) =>
            d.label.toLowerCase().includes('iriun') ||
            d.label.toLowerCase().includes('droidcam') ||
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('phone')
        )
        if (!selectedDeviceId || !videoInputs.some((d) => d.deviceId === selectedDeviceId)) {
          setSelectedDeviceId(preferred?.deviceId || videoInputs[0]?.deviceId || '')
        }
      }
    } catch (err) {
      setCameraError(String((err as Error)?.message || err))
    }
  }

  // Listen for camera hardware plug/unplug events
  useEffect(() => {
    if (!open || tab !== 'camera') return
    void loadDevices()

    const onDeviceChange = () => {
      void loadDevices()
    }

    navigator.mediaDevices?.addEventListener('devicechange', onDeviceChange)
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', onDeviceChange)
    }
  }, [open, tab])

  const stopActiveStream = () => {
    if (scanLoopRef.current) {
      window.clearTimeout(scanLoopRef.current)
      scanLoopRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  // Start robust camera stream and continuous scan loop for local webcam
  useEffect(() => {
    if (!open || tab !== 'camera') {
      stopActiveStream()
      return
    }

    let isCancelled = false
    setCameraError(null)

    const startCamera = async () => {
      stopActiveStream()

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: selectedDeviceId ? undefined : { ideal: 'environment' }
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setCameraActive(true)
        }

        if (!fullCanvasRef.current) fullCanvasRef.current = document.createElement('canvas')
        if (!cropCanvasRef.current) cropCanvasRef.current = document.createElement('canvas')

        // Continuous High-Speed Scanning Frame Loop
        const scanTick = () => {
          if (isCancelled) return

          const video = videoRef.current
          if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            const vw = video.videoWidth
            const vh = video.videoHeight

            try {
              let detectedText: string | null = null

              // 1. Center Reticle Crop (Focus Box) scaled to max 480px width for ~10ms decode
              const rawCropW = Math.max(100, Math.round(vw * 0.70))
              const rawCropH = Math.max(80, Math.round(vh * 0.55))
              const cropX = Math.round((vw - rawCropW) / 2)
              const cropY = Math.round((vh - rawCropH) / 2)

              const scaleCrop = Math.min(1, 480 / rawCropW)
              const targetCropW = Math.round(rawCropW * scaleCrop)
              const targetCropH = Math.round(rawCropH * scaleCrop)

              const cropCanvas = cropCanvasRef.current!
              cropCanvas.width = targetCropW
              cropCanvas.height = targetCropH
              const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true })

              if (cropCtx) {
                cropCtx.drawImage(video, cropX, cropY, rawCropW, rawCropH, 0, 0, targetCropW, targetCropH)
                const cropLum = new HTMLCanvasElementLuminanceSource(cropCanvas, false)
                try {
                  const result = reader.decode(new BinaryBitmap(new HybridBinarizer(cropLum)))
                  const txt = result.getText()?.trim() || null
                  if (txt && isValidBarcode(txt)) detectedText = txt
                } catch {
                  try {
                    const fallback = reader.decode(new BinaryBitmap(new GlobalHistogramBinarizer(cropLum)))
                    const txt = fallback.getText()?.trim() || null
                    if (txt && isValidBarcode(txt)) detectedText = txt
                  } catch {
                    // Not in center crop
                  }
                }
              }
              reader.reset()

              // 2. Full video frame fallback (scaled to max 640px width)
              if (!detectedText) {
                const scaleFull = Math.min(1, 640 / vw)
                const targetFullW = Math.round(vw * scaleFull)
                const targetFullH = Math.round(vh * scaleFull)

                const fullCanvas = fullCanvasRef.current!
                fullCanvas.width = targetFullW
                fullCanvas.height = targetFullH
                const fullCtx = fullCanvas.getContext('2d', { willReadFrequently: true })
                if (fullCtx) {
                  fullCtx.drawImage(video, 0, 0, vw, vh, 0, 0, targetFullW, targetFullH)
                  const fullLum = new HTMLCanvasElementLuminanceSource(fullCanvas, false)
                  try {
                    const result = reader.decode(new BinaryBitmap(new HybridBinarizer(fullLum)))
                    const txt = result.getText()?.trim() || null
                    if (txt && isValidBarcode(txt)) detectedText = txt
                  } catch {
                    try {
                      const fallback = reader.decode(new BinaryBitmap(new GlobalHistogramBinarizer(fullLum)))
                      const txt = fallback.getText()?.trim() || null
                      if (txt && isValidBarcode(txt)) detectedText = txt
                    } catch {
                      // No barcode in this frame
                    }
                  }
                }
                reader.reset()
              }

              // Handle successful scan with 1.8s duplicate debounce
              if (detectedText) {
                const now = Date.now()
                if (detectedText !== lastScannedRef.current || now - lastScanTimeRef.current > 1800) {
                  lastScannedRef.current = detectedText
                  lastScanTimeRef.current = now
                  setLastScanned(detectedText)
                  playBeep()
                  onScan(detectedText)
                }
              }
            } catch {
              // Frame decoding error, continue loop
            }
          }

          // Schedule next frame in 40ms (~25 scans/second for instantaneous detection)
          scanLoopRef.current = window.setTimeout(scanTick, 40)
        }

        scanLoopRef.current = window.setTimeout(scanTick, 80)
      } catch (err) {
        if (!isCancelled) {
          setCameraActive(false)
          setCameraError(`Camera connection failed: ${String((err as Error)?.message || err)}. Please verify the camera is not in use by another program.`)
        }
      }
    }

    void startCamera()

    return () => {
      isCancelled = true
      stopActiveStream()
    }
  }, [open, tab, selectedDeviceId])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = manualCode.trim()
    if (!trimmed) return
    playBeep()
    setLastScanned(trimmed)
    onScan(trimmed)
    setManualCode('')
  }

  if (!open) return null

  return (
    <Modal open onClose={onClose} title="Universal Barcode Scanner (Phone & Camera)" maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-ink-line">
          <button
            type="button"
            onClick={() => setTab('phone')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'phone'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            1-Click Phone QR Scanner
          </button>
          <button
            type="button"
            onClick={() => setTab('camera')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'camera'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="h-4 w-4" />
            PC / Laptop Webcam
          </button>
          <button
            type="button"
            onClick={() => setTab('guide')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'guide'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Setup Guide &amp; Tips
          </button>
        </div>

        {/* TAB 1: 1-Click Phone QR Scanner (Instant, Zero App Install) */}
        {tab === 'phone' && (
          <div className="space-y-4">
            {/* Mode Selector Toggle */}
            <div className="flex items-center gap-2 p-1 bg-ink-950 rounded-lg border border-ink-line">
              <button
                type="button"
                onClick={() => setPhoneMode('https')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                  phoneMode === 'https'
                    ? 'bg-brand-500 text-ink-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚡ Live Video Scanner (Recommended)
              </button>
              <button
                type="button"
                onClick={() => setPhoneMode('http')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                  phoneMode === 'http'
                    ? 'bg-brand-500 text-ink-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📸 Direct Snap Scanner (Zero Setup)
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 rounded-xl border border-brand-500/30 bg-ink-900/90 p-4">
              <div className="flex flex-col items-center shrink-0">
                <div ref={qrContainerRef} className="rounded-xl overflow-hidden shadow-pop bg-white p-2 border border-slate-200" />
                <span className="mt-2 text-[10px] uppercase font-bold tracking-wider text-brand-300">
                  {phoneMode === 'https' ? 'Scan for Live Video' : 'Scan for Instant Snap'}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      phoneStatus.connected
                        ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                        : 'border border-ink-line bg-ink-800 text-slate-400'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${phoneStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    {phoneStatus.connected
                      ? `🟢 Connected: ${phoneStatus.device || 'Phone'}`
                      : '⚪ Waiting for phone to scan…'}
                  </div>
                </div>

                <h4 className="font-bold text-white text-sm">
                  {phoneMode === 'https' ? 'Continuous Live Video Scanner' : 'Direct Photo Snapshot Scanner'}
                </h4>

                {phoneMode === 'https' ? (
                  <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-300">
                    <li>Connect phone to the same Wi-Fi as this PC.</li>
                    <li>Scan the QR code with phone camera and open the link.</li>
                    <li><strong className="text-amber-300">First time connect:</strong> When the browser shows a security notice, tap <em>Advanced</em> &rarr; <em>Proceed to site</em> to allow camera.</li>
                    <li>Continuous 60 FPS live video scanning activates automatically!</li>
                  </ol>
                ) : (
                  <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-300">
                    <li>Connect phone to the same Wi-Fi as this PC.</li>
                    <li>Scan the QR code — opens instantly with zero browser warnings!</li>
                    <li>Tap the big green <strong>"📸 Tap to Snap Barcode Photo"</strong> button.</li>
                    <li>Snap a photo of the product barcode — items are added to your POS cart!</li>
                  </ol>
                )}

                <div className="rounded-lg bg-ink-950 p-2.5 text-[11px] text-slate-400 border border-ink-line flex items-center justify-between">
                  <span className="truncate">URL: <code className="text-brand-300 font-mono">{activePhoneUrl || 'Generating…'}</code></span>
                  <button
                    type="button"
                    onClick={() => void window.api.phoneScanner?.restart().then(() => window.api.phoneScanner.getStatus().then(setPhoneStatus))}
                    className="text-xs text-slate-400 hover:text-brand-300 ml-2"
                    title="Restart local companion server"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Last Scanned Barcode Alert */}
            {lastScanned && (
              <div className="flex items-center justify-between rounded-lg bg-emerald-950/95 px-3 py-2 text-xs text-emerald-200 border border-emerald-500/50 shadow-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="truncate">Scanned from Phone: <strong>{lastScanned}</strong></span>
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-300 shrink-0">Added to Cart</span>
              </div>
            )}

            {/* Quick Manual Entry for Damaged Barcodes */}
            <form onSubmit={handleManualSubmit} className="flex items-center gap-2 pt-2 border-t border-ink-line">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Can't scan? Type barcode number manually…"
                className="input h-9 flex-1 text-xs font-mono"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="btn-primary h-9 px-3 text-xs flex items-center gap-1 font-semibold"
              >
                <span>Add</span>
                <CornerDownLeft className="h-3 w-3" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: PC / Laptop Webcam */}
        {tab === 'camera' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-400">Selected Camera Device</label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="input h-9 w-full text-xs"
                  disabled={devices.length === 0}
                >
                  {devices.length === 0 && <option value="">No camera detected (connect webcam or phone)</option>}
                  {devices.map((device, idx) => (
                    <option key={device.deviceId || idx} value={device.deviceId}>
                      {device.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setMirrored((m) => !m)}
                className={`btn-secondary mt-5 h-9 px-3 text-xs ${mirrored ? 'border-brand-500 text-brand-300' : ''}`}
                title="Mirror / Flip Video (Useful for front webcams)"
              >
                <FlipHorizontal className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => void loadDevices()}
                className="btn-secondary mt-5 h-9 px-3 text-xs"
                title="Refresh Camera Devices"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-ink-line bg-black">
              <video
                ref={videoRef}
                className={`h-full w-full object-cover transition-transform ${mirrored ? '-scale-x-100' : ''}`}
                autoPlay
                playsInline
                muted
              />

              {cameraActive && !cameraError && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                  <div className="relative h-44 w-72 rounded-lg border-2 border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                    <div className="absolute -left-1 -top-1 h-4 w-4 border-l-4 border-t-4 border-emerald-400" />
                    <div className="absolute -right-1 -top-1 h-4 w-4 border-r-4 border-t-4 border-emerald-400" />
                    <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-4 border-l-4 border-emerald-400" />
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-4 border-r-4 border-emerald-400" />
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_8px_#34d399]" />
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-950/90 p-4 text-center">
                  <AlertCircle className="mb-2 h-8 w-8 text-rose-400" />
                  <p className="text-sm font-semibold text-rose-300">Camera Unavailable</p>
                  <p className="mt-1 max-w-sm text-xs text-slate-400">{cameraError}</p>
                </div>
              )}

              {!cameraActive && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-950/80 p-4 text-center">
                  <VideoOff className="mb-2 h-8 w-8 text-slate-500" />
                  <p className="text-xs text-slate-400">Connecting to camera feed…</p>
                </div>
              )}

              {lastScanned && (
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-lg bg-emerald-950/95 px-3 py-1.5 text-xs text-emerald-200 border border-emerald-500/50 backdrop-blur-sm shadow-lg">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Scanned: {lastScanned}</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-300 shrink-0">Added to Cart</span>
                </div>
              )}
            </div>

            <p className="text-center text-xs text-slate-400">
              Align retail barcode (EAN-13, UPC, Code 128, QR) inside the green reticle.
            </p>

            <form onSubmit={handleManualSubmit} className="flex items-center gap-2 pt-1 border-t border-ink-line">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Can't scan? Type barcode number here…"
                className="input h-9 flex-1 text-xs font-mono"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="btn-primary h-9 px-3 text-xs flex items-center gap-1 font-semibold"
              >
                <span>Add</span>
                <CornerDownLeft className="h-3 w-3" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Setup Guide & Tips */}
        {tab === 'guide' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="rounded-lg border border-brand-500/20 bg-brand-500/10 p-3.5">
              <h4 className="flex items-center gap-2 font-semibold text-brand-300 text-sm">
                <Smartphone className="h-4 w-4" />
                Frequently Asked Questions &amp; Troubleshooting
              </h4>
              <p className="mt-1 text-slate-300">
                TINDA POS supports physical handheld USB scanners, laptop webcams, and wireless smartphone cameras simultaneously.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <span className="inline-block rounded bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-300">
                  METHOD 1 · 1-CLICK INSTANT QR SCANNER (ZERO INSTALL)
                </span>
                <p className="mt-1.5 font-semibold text-white">How does the 1-Click Phone QR Scanner work?</p>
                <p className="mt-1 text-slate-400">
                  TINDA POS runs an internal lightweight companion service on your computer. When you scan the QR code on your phone, your phone opens a web scanner over your local Wi-Fi. It uses your phone's native camera with hardware autofocus to scan barcodes at high speed and beams them directly into your desktop checkout cart.
                </p>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <span className="inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  METHOD 2 · WI-FI TROUBLESHOOTING
                </span>
                <p className="mt-1.5 font-semibold text-white">Phone cannot connect or load the QR code?</p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-slate-400">
                  <li>Ensure your smartphone and computer are connected to the <strong>exact same Wi-Fi router</strong>.</li>
                  <li>If your store router has "Guest Isolation" or "AP Isolation" enabled, turn on your Windows PC's <strong>Mobile Hotspot</strong> and connect your phone to it.</li>
                  <li>Check Windows Firewall to allow port 3112 on Private networks.</li>
                </ol>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <span className="inline-block rounded bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                  METHOD 3 · PHYSICAL HANDHELD USB SCANNERS
                </span>
                <p className="mt-1.5 font-semibold text-white">Standard Handheld Scanners Always Active</p>
                <p className="mt-1 text-slate-400">
                  You can plug in any standard USB or 2.4GHz wireless barcode scanner gun at any time. It operates in parallel with zero configuration needed.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
