export type ConsoleLogLevel = 'error' | 'warn' | 'info' | 'log'

export interface ConsoleLogEntry {
  id: string
  timestamp: number
  timeFormatted: string
  level: ConsoleLogLevel
  message: string
  stack?: string
  args: string[]
}

const MAX_CONSOLE_LOGS = 500
const capturedLogs: ConsoleLogEntry[] = []
const listeners = new Set<(entry: ConsoleLogEntry) => void>()
let isInitialized = false
let idCounter = 0

function safeFormatArg(arg: unknown): string {
  if (arg === null) return 'null'
  if (arg === undefined) return 'undefined'
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}${arg.stack ? '\n' + arg.stack : ''}`
  }
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg, null, 2)
    } catch {
      return String(arg)
    }
  }
  return String(arg)
}

function recordConsoleEntry(level: ConsoleLogLevel, rawArgs: unknown[]): void {
  const now = new Date()
  idCounter += 1
  const id = `console-${now.getTime()}-${idCounter}`
  const formattedArgs = rawArgs.map(safeFormatArg)
  const message = formattedArgs.join(' ')

  let stack: string | undefined
  for (const a of rawArgs) {
    if (a instanceof Error && a.stack) {
      stack = a.stack
      break
    }
  }

  const entry: ConsoleLogEntry = {
    id,
    timestamp: now.getTime(),
    timeFormatted: now.toLocaleTimeString('en-US', { hour12: false }),
    level,
    message,
    stack,
    args: formattedArgs
  }

  capturedLogs.push(entry)
  if (capturedLogs.length > MAX_CONSOLE_LOGS) {
    capturedLogs.shift()
  }

  // Notify active UI listeners
  listeners.forEach((listener) => {
    try {
      listener(entry)
    } catch {}
  })
}

/**
 * Intercept frontend console methods while preserving original native browser behavior.
 */
export function initConsoleInterceptor(): void {
  if (isInitialized) return
  isInitialized = true

  const origError = console.error.bind(console)
  const origWarn = console.warn.bind(console)
  const origInfo = console.info.bind(console)
  const origLog = console.log.bind(console)

  console.error = (...args: unknown[]) => {
    origError(...args)
    recordConsoleEntry('error', args)
  }

  console.warn = (...args: unknown[]) => {
    origWarn(...args)
    recordConsoleEntry('warn', args)
  }

  console.info = (...args: unknown[]) => {
    origInfo(...args)
    recordConsoleEntry('info', args)
  }

  console.log = (...args: unknown[]) => {
    origLog(...args)
    recordConsoleEntry('log', args)
  }
}

export function getCapturedConsoleLogs(): ConsoleLogEntry[] {
  return [...capturedLogs]
}

export function clearCapturedConsoleLogs(): void {
  capturedLogs.length = 0
}

export function subscribeToConsoleLogs(listener: (entry: ConsoleLogEntry) => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function formatConsoleLogsAsMarkdown(entries?: ConsoleLogEntry[]): string {
  const target = entries || capturedLogs
  if (!target || target.length === 0) {
    return '*(No console logs recorded)*'
  }

  const lines = [
    `# TINDA POS Live Console Log Export (${target.length} events)`,
    `Generated: ${new Date().toLocaleString('en-US')}`,
    '',
    '| Time | Level | Message |',
    '| :--- | :--- | :--- |'
  ]

  for (const log of target.slice(-150)) {
    const cleanMsg = log.message.replace(/[\r\n]+/g, ' ').slice(0, 140)
    lines.push(`| \`${log.timeFormatted}\` | **${log.level.toUpperCase()}** | \`${cleanMsg}\` |`)
  }

  return lines.join('\n')
}
