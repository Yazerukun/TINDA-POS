import { afterEach, describe, expect, it, vi } from 'vitest'
import { consumeWithIdleTimeout, friendlyDownloadError } from '../updateDownload'

afterEach(() => vi.useRealTimers())

describe('updater download inactivity handling', () => {
  it('allows a continuously progressing transfer whose total duration exceeds 15 seconds', async () => {
    vi.useFakeTimers()
    const chunks = [1, 2, 3, 4]
    const reader = {
      read: vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 6000))
        const value = chunks.shift()
        return value === undefined ? { done: true } : { done: false, value }
      })
    }
    const received: number[] = []
    const consuming = consumeWithIdleTimeout(reader, (chunk) => received.push(chunk), 10000)
    await vi.advanceTimersByTimeAsync(30000)
    await expect(consuming).resolves.toBeUndefined()
    expect(received).toEqual([1, 2, 3, 4])
  })

  it('times out and cancels a genuinely inactive stream', async () => {
    vi.useFakeTimers()
    const cancel = vi.fn(async () => undefined)
    const reader = { read: vi.fn(() => new Promise<never>(() => undefined)), cancel }
    const consuming = consumeWithIdleTimeout(reader, () => undefined, 10000)
    const rejected = expect(consuming).rejects.toThrow('download stalled')
    await vi.advanceTimersByTimeAsync(10001)
    await rejected
    expect(cancel).toHaveBeenCalledOnce()
  })

  it('maps expected transport failures to friendly user text', () => {
    expect(friendlyDownloadError(new Error('net::ERR_CONTENT_LENGTH_MISMATCH'))).toBe(
      'Update download was interrupted. Check your connection and try again.'
    )
    expect(friendlyDownloadError(new Error('Update download stalled.'))).toBe(
      'Update download stalled. Check your connection and try again.'
    )
  })
})
