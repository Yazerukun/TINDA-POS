export const UPDATE_REQUEST_START_TIMEOUT_MS = 15000
export const UPDATE_DOWNLOAD_IDLE_TIMEOUT_MS = 30000

export interface DownloadStreamReader<T> {
  read(): Promise<{ done: boolean; value?: T }>
  cancel?(reason?: unknown): Promise<void>
}

/** Consume a stream with an inactivity timeout that resets after every chunk. */
export async function consumeWithIdleTimeout<T>(
  reader: DownloadStreamReader<T>,
  onChunk: (chunk: T) => void,
  idleTimeoutMs: number = UPDATE_DOWNLOAD_IDLE_TIMEOUT_MS
): Promise<void> {
  while (true) {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Update download stalled.')), idleTimeoutMs)
    })
    let result: { done: boolean; value?: T }
    try {
      result = await Promise.race([reader.read(), timeout])
    } catch (error) {
      await reader.cancel?.(error).catch(() => undefined)
      throw error
    } finally {
      if (timer) clearTimeout(timer)
    }
    if (result.done) return
    if (result.value !== undefined) onChunk(result.value)
  }
}

export function friendlyDownloadError(error: unknown): string {
  const technical = error instanceof Error ? error.message : String(error ?? '')
  if (/stalled|timeout|timed out/i.test(technical)) {
    return 'Update download stalled. Check your connection and try again.'
  }
  if (/net::|network|fetch|aborted|abort|content.?length|socket|ECONN|ENOTFOUND|EAI_|ERR_/i.test(technical)) {
    return 'Update download was interrupted. Check your connection and try again.'
  }
  return 'The update download failed. Please try again.'
}
