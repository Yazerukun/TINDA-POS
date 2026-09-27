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
  ChevronDown,
  ChevronUp,
  Power,
  RotateCw,
  VideoOff,
  Sparkles
} from 'lucide-react'
import { isValidBarcode } from '../lib/barcodeScanner'

interface CounterCameraScannerProps {
  enabled: boolean
  onToggleEnabled: (enabled: boolean) => void
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
    // Non-blocking
  }
}

export function CounterCameraScanner({
  enabled,
  onToggleEnabled,
  onScan
}: CounterCameraScannerProps): React.JSX.Element | null {
  const [minimized, setMinimized] = useState(() => {
    return localStorage.getItem('tinda_counter_camera_minimized') === 'true'
  })
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() => {
    return localStorage.getItem('tinda_counter_camera_id') || ''
  })
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const [justScanned, setJustScanned] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanLoopRef = useRef<number | null>(null)
  const fullCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const lastScannedRef = useRef<string | null>(null)
  const lastScanTimeRef = useRef<number>(0)
  const candidateRef = useRef<string | null>(null)
  const candidateHitsRef = useRef<number>(0)

  // Configure ZXing reader strictly for retail linear formats
  const reader = useMemo(() => {
    const hints = new Map()
    hints.set(DecodeHintType.TRY_HARDER, true)
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128
    ])
    const r = new MultiFormatReader()
    r.setHints(hints)
    return r
  }, [])

  // Persist minimize state
  const toggleMinimized = () => {
    setMinimized((prev) => {
      const next = !prev
      localStorage.setItem('tinda_counter_camera_minimized', String(next))
      return next
    })
  }

  // Device discovery
  useEffect(() => {
    if (!enabled) return

    let isMounted = true
    const enumerateCameras = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices()
        const videoInputs = allDevices.filter((d) => d.kind === 'videoinput')
        if (isMounted) {
          setDevices(videoInputs)
          if (!selectedDeviceId && videoInputs.length > 0 && videoInputs[0]?.deviceId) {
            setSelectedDeviceId(videoInputs[0].deviceId)
          }
        }
      } catch {
        // Non-blocking
      }
    }

    void enumerateCameras()
    navigator.mediaDevices?.addEventListener?.('devicechange', enumerateCameras)
    return () => {
      isMounted = false
      navigator.mediaDevices?.removeEventListener?.('devicechange', enumerateCameras)
    }
  }, [enabled, selectedDeviceId])

  // Start / stop active camera stream
  useEffect(() => {
    if (!enabled) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (scanLoopRef.current) {
        clearTimeout(scanLoopRef.current)
        scanLoopRef.current = null
      }
      setCameraActive(false)
      return
    }

    let isCancelled = false

    const stopActiveStream = () => {
      if (scanLoopRef.current) {
        clearTimeout(scanLoopRef.current)
        scanLoopRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setCameraActive(false)
    }

    const startCamera = async () => {
      stopActiveStream()
      setCameraError(null)

      try {
        const constraints: MediaStreamConstraints = {
          video: selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId } }
            : { facingMode: { ideal: 'environment' } }
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
        }
        setCameraActive(true)

        // Initialize offscreen processing canvases
        if (!fullCanvasRef.current) fullCanvasRef.current = document.createElement('canvas')
        if (!cropCanvasRef.current) cropCanvasRef.current = document.createElement('canvas')

        // Continuous barcode decode loop
        const scanTick = () => {
          if (isCancelled || !streamRef.current) return

          const video = videoRef.current
          if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            try {
              const vw = video.videoWidth
              const vh = video.videoHeight
              let detectedText: string | null = null

              // Pass 1: Center 70% reticle crop (primary scan target for high sensitivity)
              const cropW = Math.round(vw * 0.7)
              const cropH = Math.round(vh * 0.55)
              const cropX = Math.round((vw - cropW) / 2)
              const cropY = Math.round((vh - cropH) / 2)

              const cropScale = Math.min(1, 480 / cropW)
              const targetCropW = Math.round(cropW * cropScale)
              const targetCropH = Math.round(cropH * cropScale)

              const cropCanvas = cropCanvasRef.current!
              cropCanvas.width = targetCropW
              cropCanvas.height = targetCropH
              const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true })

              if (cropCtx) {
                cropCtx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, targetCropW, targetCropH)
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
                    // No barcode in crop region
                  }
                }
                reader.reset()
              }

              // Pass 2: Full-frame fallback if no barcode was detected in crop area
              if (!detectedText) {
                const fullScale = Math.min(1, 540 / vw)
                const targetFullW = Math.round(vw * fullScale)
                const targetFullH = Math.round(vh * fullScale)

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
                      // No barcode in frame
                    }
                  }
                  reader.reset()
                }
              }

              // Require 2 consecutive frames to confirm barcode (temporal consensus)
              if (detectedText) {
                if (detectedText === candidateRef.current) {
                  candidateHitsRef.current += 1
                } else {
                  candidateRef.current = detectedText
                  candidateHitsRef.current = 1
                }

                if (candidateHitsRef.current >= 2) {
                  const now = Date.now()
                  if (detectedText !== lastScannedRef.current || now - lastScanTimeRef.current > 3000) {
                    lastScannedRef.current = detectedText
                    lastScanTimeRef.current = now
                    setLastScannedCode(detectedText)
                    setJustScanned(true)
                    setTimeout(() => setJustScanned(false), 800)
                    playBeep()
                    onScan(detectedText)
                  }
                }
              } else {
                candidateHitsRef.current = 0
                candidateRef.current = null
              }
            } catch {
              // Frame decoding error, continue loop
            }
          }

          // Sample at 40ms (~25 FPS for rapid response)
          scanLoopRef.current = window.setTimeout(scanTick, 40)
        }

        scanLoopRef.current = window.setTimeout(scanTick, 80)
      } catch (err) {
        if (!isCancelled) {
          setCameraActive(false)
          setCameraError(String((err as Error)?.message || err))
        }
      }
    }

    void startCamera()

    return () => {
      isCancelled = true
      stopActiveStream()
    }
  }, [enabled, selectedDeviceId, reader, onScan])

  if (!enabled) return null

  return (
    <div className="border-b border-ink-line bg-ink-950 p-2 transition-all">
      <div className="flex items-center justify-between pb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <Camera className="h-3.5 w-3.5 text-emerald-400" />
          <span>Hands-Free Counter Camera</span>
          {cameraActive && (
            <span className="rounded bg-emerald-500/20 px-1 py-0.5 text-[10px] text-emerald-300 font-mono">
              Auto-Scan Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {devices.length > 1 && !minimized && (
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value)
                localStorage.setItem('tinda_counter_camera_id', e.target.value)
              }}
              className="h-6 rounded border border-ink-line bg-ink-850 px-1 text-[11px] text-slate-300 outline-none"
              title="Select camera device"
            >
              {devices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={toggleMinimized}
            className="rounded p-1 text-slate-400 hover:bg-ink-800 hover:text-white transition-colors"
            title={minimized ? 'Expand camera preview' : 'Minimize camera preview'}
          >
            {minimized ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onToggleEnabled(false)}
            className="rounded p-1 text-slate-500 hover:bg-ink-800 hover:text-danger-400 transition-colors"
            title="Turn off counter camera scanner"
          >
            <Power className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="relative mt-1 aspect-video w-full overflow-hidden rounded-lg border border-ink-line bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />

          {/* Green Laser Reticle overlay */}
          {cameraActive && (
            <div
              className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-all ${
                justScanned ? 'bg-emerald-500/20' : ''
              }`}
            >
              <div
                className={`relative h-[65%] w-[75%] rounded-lg border-2 transition-all ${
                  justScanned ? 'border-emerald-400 shadow-[0_0_15px_#10b981]' : 'border-emerald-500/50'
                }`}
              >
                {/* Center laser sweep */}
                <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-emerald-400/80 shadow-[0_0_8px_#10b981] animate-pulse" />
              </div>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-ink-950/90 text-xs text-rose-300">
              <VideoOff className="h-6 w-6 mb-1 text-rose-400" />
              <p className="font-semibold">Camera Unavailable</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{cameraError}</p>
            </div>
          )}

          {lastScannedCode && (
            <div className="absolute bottom-1 inset-x-2 rounded bg-black/70 px-2 py-0.5 text-center font-mono text-[11px] text-emerald-400 truncate">
              Scanned: {lastScannedCode}
            </div>
          )}
        </div>
      )}

      {minimized && lastScannedCode && (
        <div className="text-[11px] font-mono text-emerald-400 truncate mt-0.5">
          Last scanned: {lastScannedCode}
        </div>
      )}
    </div>
  )
}
