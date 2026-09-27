import { useEffect, useRef, useState, useMemo } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { Camera, Smartphone, RefreshCw, CheckCircle2, AlertCircle, VideoOff } from 'lucide-react'
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
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.09)
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
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const lastScanTimeRef = useRef<number>(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const reader = useMemo(() => new BrowserMultiFormatReader(), [])

  // Load available camera devices
  const loadDevices = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setCameraError('Camera API is not supported on this device.')
        return
      }
      // Request initial stream to grant permission so device labels are visible
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach((t) => t.stop())
      } catch {
        // Continue to enumerate even if permission was already determined
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput')
      setDevices(videoInputs)
      if (videoInputs.length > 0 && !selectedDeviceId) {
        // Prioritize back camera or external webcam / phone cam if present
        const phoneOrBack = videoInputs.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('iriun') ||
            d.label.toLowerCase().includes('droidcam') ||
            d.label.toLowerCase().includes('phone')
        )
        setSelectedDeviceId(phoneOrBack?.deviceId || videoInputs[0]?.deviceId || '')
      }
    } catch (err) {
      setCameraError(String((err as Error)?.message || err))
    }
  }

  useEffect(() => {
    if (open) {
      void loadDevices()
    } else {
      stopCamera()
    }
  }, [open])

  const stopCamera = () => {
    try {
      reader.reset()
    } catch {
      // Ignore reset errors
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  // Start continuous camera decoding
  useEffect(() => {
    if (!open || tab !== 'camera' || !selectedDeviceId || !videoRef.current) return

    let cancelled = false
    setCameraError(null)

    const startScanning = async () => {
      stopCamera()
      try {
        setCameraActive(true)
        await reader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, err) => {
            if (cancelled || !result) return
            const scannedText = result.getText()?.trim()
            if (!scannedText) return

            const now = Date.now()
            // Debounce identical scans within 1.5 seconds
            if (scannedText === lastScanned && now - lastScanTimeRef.current < 1500) {
              return
            }

            lastScanTimeRef.current = now
            setLastScanned(scannedText)
            playBeep()
            onScan(scannedText)
          }
        )
      } catch (e) {
        if (!cancelled) {
          setCameraActive(false)
          setCameraError(`Camera error: ${String((e as Error)?.message || e)}`)
        }
      }
    }

    void startScanning()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [open, tab, selectedDeviceId])

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
            {/* Camera Selector Toolbar */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-400">Selected Camera Device</label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="input h-9 w-full text-xs"
                  disabled={devices.length === 0}
                >
                  {devices.length === 0 && <option value="">No camera detected</option>}
                  {devices.map((device, idx) => (
                    <option key={device.deviceId || idx} value={device.deviceId}>
                      {device.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
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
                className="h-full w-full object-cover"
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
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-950/80 p-4 text-center">
                  <AlertCircle className="mb-2 h-8 w-8 text-rose-400" />
                  <p className="text-sm font-semibold text-rose-300">Camera Unavailable</p>
                  <p className="mt-1 max-w-sm text-xs text-slate-400">{cameraError}</p>
                </div>
              )}

              {!cameraActive && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-950/80 p-4 text-center">
                  <VideoOff className="mb-2 h-8 w-8 text-slate-500" />
                  <p className="text-xs text-slate-400">Starting camera preview…</p>
                </div>
              )}

              {/* Last Scanned Tag */}
              {lastScanned && (
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-lg bg-emerald-950/90 px-3 py-1.5 text-xs text-emerald-200 border border-emerald-500/40 backdrop-blur-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Scanned: {lastScanned}
                  </span>
                  <span className="text-[10px] text-emerald-400/80">Added to Cart</span>
                </div>
              )}
            </div>

            <p className="text-center text-xs text-slate-400">
              Hold the barcode (EAN-13, UPC, Code 128, QR) steady inside the green frame.
            </p>
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
