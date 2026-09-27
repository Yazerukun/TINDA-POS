import { useEffect, useRef, useState, useMemo } from 'react'
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  HTMLCanvasElementLuminanceSource,
  HybridBinarizer,
  GlobalHistogramBinarizer,
  BinaryBitmap
} from '@zxing/library'
import {
  Camera,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  VideoOff,
  FlipHorizontal,
  CornerDownLeft,
  Sparkles
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

export function CameraScannerModal({ open, onClose, onScan }: CameraScannerModalProps): React.JSX.Element | null {
  const [tab, setTab] = useState<'camera' | 'guide'>('camera')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [mirrored, setMirrored] = useState(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')

  const lastScannedRef = useRef<string | null>(null)
  const lastScanTimeRef = useRef<number>(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fullCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const scanLoopRef = useRef<number | null>(null)

  // Configure ZXing reader with TRY_HARDER and explicit retail 1D/2D formats
  const reader = useMemo(() => {
    const hints = new Map()
    hints.set(DecodeHintType.TRY_HARDER, true)
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
      BarcodeFormat.QR_CODE
    ])
    const r = new MultiFormatReader()
    r.setHints(hints)
    return r
  }, [])

  // Load available camera devices
  const loadDevices = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setCameraError('Camera API is not supported on this device.')
        return
      }

      // Request brief initial stream to grant permission so camera names are visible
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
        // Look for phone apps (Iriun, DroidCam) or back camera
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

  // Listen for device plug/unplug (e.g. when Iriun or DroidCam connects)
  useEffect(() => {
    if (!open) return
    void loadDevices()

    const onDeviceChange = () => {
      void loadDevices()
    }

    navigator.mediaDevices?.addEventListener('devicechange', onDeviceChange)
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', onDeviceChange)
    }
  }, [open])

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

  // Start robust camera stream and continuous scan loop
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

        // Initialize offscreen canvas elements
        if (!fullCanvasRef.current) {
          fullCanvasRef.current = document.createElement('canvas')
        }
        if (!cropCanvasRef.current) {
          cropCanvasRef.current = document.createElement('canvas')
        }

        // Continuous Scanning Frame Loop
        const scanTick = () => {
          if (isCancelled) return

          const video = videoRef.current
          if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            const vw = video.videoWidth
            const vh = video.videoHeight

            try {
              let detectedText: string | null = null

              // 1. Try Center Reticle Crop (Focus Box)
              // Retail barcodes on cans, boxes, and pouches are easiest to decode without surrounding clutter
              const cropW = Math.max(100, Math.round(vw * 0.70))
              const cropH = Math.max(80, Math.round(vh * 0.55))
              const cropX = Math.round((vw - cropW) / 2)
              const cropY = Math.round((vh - cropH) / 2)

              const cropCanvas = cropCanvasRef.current!
              cropCanvas.width = cropW
              cropCanvas.height = cropH
              const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true })

              if (cropCtx) {
                cropCtx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
                const cropLum = new HTMLCanvasElementLuminanceSource(cropCanvas, false)
                try {
                  const result = reader.decode(new BinaryBitmap(new HybridBinarizer(cropLum)))
                  detectedText = result.getText()?.trim() || null
                } catch {
                  try {
                    const fallback = reader.decode(new BinaryBitmap(new GlobalHistogramBinarizer(cropLum)))
                    detectedText = fallback.getText()?.trim() || null
                  } catch {
                    // Not in center crop
                  }
                }
              }

              // 2. If center crop didn't find anything, try full video frame
              if (!detectedText) {
                const fullCanvas = fullCanvasRef.current!
                fullCanvas.width = vw
                fullCanvas.height = vh
                const fullCtx = fullCanvas.getContext('2d', { willReadFrequently: true })
                if (fullCtx) {
                  fullCtx.drawImage(video, 0, 0, vw, vh)
                  const fullLum = new HTMLCanvasElementLuminanceSource(fullCanvas, false)
                  try {
                    const result = reader.decode(new BinaryBitmap(new HybridBinarizer(fullLum)))
                    detectedText = result.getText()?.trim() || null
                  } catch {
                    try {
                      const fallback = reader.decode(new BinaryBitmap(new GlobalHistogramBinarizer(fullLum)))
                      detectedText = fallback.getText()?.trim() || null
                    } catch {
                      // No barcode in this frame
                    }
                  }
                }
              }

              // Handle successful scan with smart debounce
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

          // Schedule next frame in 120ms (approx 8-10 scans/second)
          scanLoopRef.current = window.setTimeout(scanTick, 120)
        }

        // Start scanning loop after video is playing
        scanLoopRef.current = window.setTimeout(scanTick, 150)
      } catch (err) {
        if (!isCancelled) {
          setCameraActive(false)
          setCameraError(`Camera connection failed: ${String((err as Error)?.message || err)}. Please verify the camera is not used by another application.`)
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
    <Modal open onClose={onClose} title="Barcode Scanner (Camera & Phone)" maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-ink-line">
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
            Live Camera Scanner
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
            <Smartphone className="h-4 w-4" />
            Connect Your Phone
          </button>
        </div>

        {tab === 'camera' && (
          <div className="space-y-3">
            {/* Camera Toolbar */}
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

            {/* Live Video Viewfinder */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-ink-line bg-black">
              <video
                ref={videoRef}
                className={`h-full w-full object-cover transition-transform ${mirrored ? '-scale-x-100' : ''}`}
                autoPlay
                playsInline
                muted
              />

              {/* Viewfinder Target Reticle */}
              {cameraActive && !cameraError && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                  <div className="relative h-44 w-72 rounded-lg border-2 border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                    {/* Corner Reticle Accents */}
                    <div className="absolute -left-1 -top-1 h-4 w-4 border-l-4 border-t-4 border-emerald-400" />
                    <div className="absolute -right-1 -top-1 h-4 w-4 border-r-4 border-t-4 border-emerald-400" />
                    <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-4 border-l-4 border-emerald-400" />
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-4 border-r-4 border-emerald-400" />
                    {/* Animated Scanning Line */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_8px_#34d399]" />
                  </div>
                </div>
              )}

              {/* Camera Error / Offline Overlay */}
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

              {/* Last Scanned Tag */}
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
              Hold the barcode (EAN-13, UPC, Code 128, QR) steady inside the green reticle box.
            </p>

            {/* Quick Manual Entry for Damaged / Faded Barcodes */}
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

        {tab === 'guide' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="rounded-lg border border-brand-500/20 bg-brand-500/10 p-3.5">
              <h4 className="flex items-center gap-2 font-semibold text-brand-300 text-sm">
                <Smartphone className="h-4 w-4" />
                Use Your Smartphone as a Barcode Scanner (Zero Cost)
              </h4>
              <p className="mt-1 text-slate-300">
                No need to purchase an expensive dedicated barcode scanner. You can use your Android or iPhone camera in two simple, free ways:
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <span className="inline-block rounded bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-300">
                  OPTION A · WIRELESS / USB WEBCAM (RECOMMENDED)
                </span>
                <p className="mt-1.5 font-semibold text-white">Stream Phone Camera Directly to Live Scanner</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-slate-400">
                  <li>Download the free <strong>Iriun Webcam</strong> or <strong>DroidCam</strong> app on your smartphone from Google Play Store or Apple App Store.</li>
                  <li>Install the corresponding free Iriun or DroidCam Windows driver on your computer.</li>
                  <li>Connect your phone and PC to the same Wi-Fi network (or connect via USB cable).</li>
                  <li>Switch back to the <strong>Live Camera Scanner</strong> tab above, and select <em>"Iriun Webcam"</em> or <em>"DroidCam Source"</em> from the dropdown. Your phone's camera feed will appear instantly!</li>
                </ol>
              </div>

              <div className="rounded-lg border border-ink-line bg-ink-900 p-3">
                <span className="inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  OPTION B · WI-FI KEYBOARD SCANNER APP
                </span>
                <p className="mt-1.5 font-semibold text-white">Use "Barcode to PC" Wi-Fi Scanner App</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-slate-400">
                  <li>Download the free <strong>Barcode to PC: Wi-Fi scanner</strong> app on your phone.</li>
                  <li>Pair your phone with your PC over your local Wi-Fi network.</li>
                  <li>Every barcode scanned on your phone is automatically transmitted to TINDA POS via our hardware keystroke burst engine — <strong>items are added to your cart instantly even without opening the camera modal!</strong></li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
