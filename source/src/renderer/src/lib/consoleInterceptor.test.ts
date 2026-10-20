import { describe, it, expect, beforeEach } from 'vitest'
import {
  initConsoleInterceptor,
  getCapturedConsoleLogs,
  clearCapturedConsoleLogs,
  subscribeToConsoleLogs,
  formatConsoleLogsAsMarkdown
} from './consoleInterceptor'

describe('consoleInterceptor', () => {
  beforeEach(() => {
    clearCapturedConsoleLogs()
  })

  it('captures logs, warnings, errors, and info', () => {
    initConsoleInterceptor()

    console.log('Test standard log message')
    console.warn('Test warning message')
    console.error('Test error message', new Error('Something broke'))
    console.info('Test info message')

    const logs = getCapturedConsoleLogs()
    expect(logs.length).toBe(4)

    expect(logs[0]?.level).toBe('log')
    expect(logs[0]?.message).toContain('Test standard log message')

    expect(logs[1]?.level).toBe('warn')
    expect(logs[1]?.message).toContain('Test warning message')

    expect(logs[2]?.level).toBe('error')
    expect(logs[2]?.message).toContain('Test error message')
    expect(logs[2]?.message).toContain('Something broke')
    expect(logs[2]?.stack).toBeDefined()

    expect(logs[3]?.level).toBe('info')
    expect(logs[3]?.message).toContain('Test info message')
  })

  it('notifies subscribers in real-time when new logs arrive', () => {
    initConsoleInterceptor()
    const received: string[] = []

    const unsubscribe = subscribeToConsoleLogs((entry) => {
      received.push(`${entry.level}:${entry.message}`)
    })

    console.error('Realtime alert!')
    expect(received.length).toBe(1)
    expect(received[0]).toContain('error:Realtime alert!')

    unsubscribe()
    console.error('Should not be received by unsubscribed listener')
    expect(received.length).toBe(1)
  })

  it('formats console logs as clean Markdown table for copy/paste', () => {
    initConsoleInterceptor()
    console.log('Initial setup')
    console.error('Critical database timeout')

    const markdown = formatConsoleLogsAsMarkdown()
    expect(markdown).toContain('# TINDA POS Live Console Log Export')
    expect(markdown).toContain('| Time | Level | Message |')
    expect(markdown).toContain('Critical database timeout')
  })

  it('clears console logs when requested', () => {
    initConsoleInterceptor()
    console.log('Log 1')
    console.log('Log 2')
    expect(getCapturedConsoleLogs().length).toBe(2)

    clearCapturedConsoleLogs()
    expect(getCapturedConsoleLogs().length).toBe(0)
  })
})
