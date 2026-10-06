// Lightweight, zero-dependency Web Audio API sound synthesizer for TINDA POS
// Works 100% offline with zero external audio assets

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        audioCtx = new AudioContextClass()
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      void audioCtx.resume()
    }
    return audioCtx
  } catch {
    return null
  }
}

export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('tinda_sound_muted') === 'true'
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('tinda_sound_muted', muted ? 'true' : 'false')
}

/**
 * Pleasant high-pitched scan confirmation chime (1200Hz - 1600Hz, 70ms)
 */
export function playScanSuccess(): void {
  if (isSoundMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(1300, now)
    osc.frequency.exponentialRampToValueAtTime(1750, now + 0.06)

    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.08)
  } catch {
    // Audio context may be blocked by browser policy before first user interaction
  }
}

/**
 * Distinct dual-tone warning buzz for out of stock, errors, or barcode not found (300Hz, 160ms)
 */
export function playScanError(): void {
  if (isSoundMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(280, now)
    osc.frequency.setValueAtTime(220, now + 0.08)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.linearRampToValueAtTime(0.001, now + 0.16)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.16)
  } catch {
    // Ignore error if audio device is unavailable
  }
}

/**
 * Satisfying crisp cash register chime for checkout completion
 */
export function playCheckoutChime(): void {
  if (isSoundMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const freqs = [1046.5, 1318.5, 1567.98, 2093.0] // C6, E6, G6, C7 arpeggio
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const start = now + idx * 0.04

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(f, start)

      gain.gain.setValueAtTime(0.15, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + 0.18)
    })
  } catch {
    // Ignore audio error
  }
}
