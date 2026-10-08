import { TINDA_SYSTEM_PROMPT, matchOfflineKnowledge, AssistantAction } from './tindaAiKnowledge'

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  action?: AssistantAction
  timestamp: string
}

const AI_CONFIG_KEY = 'tinda_ai_assistant_config'

export interface AiAssistantConfig {
  provider: 'offline' | 'gemini' | 'groq' | 'opencode'
  apiKey?: string
  model?: string
  opencodeUrl?: string
}

export function getAiConfig(): AiAssistantConfig {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore error
  }
  return { provider: 'offline' }
}

export function saveAiConfig(cfg: AiAssistantConfig): void {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg))
  } catch {
    // Ignore error
  }
}

export async function askTindaAssistant(
  question: string,
  history: ChatMessage[] = []
): Promise<{ reply: string; action?: AssistantAction }> {
  const config = getAiConfig()

  // 1. Try offline knowledge match first for immediate zero-latency accuracy
  const offlineMatch = matchOfflineKnowledge(question)

  // 2. OpenCode Free Models (Big Pickle / Local OpenCode Server)
  if (config.provider === 'opencode') {
    try {
      const serverUrl = (config.opencodeUrl || 'http://127.0.0.1:4096').replace(/\/$/, '')
      const modelId = config.model || 'big-pickle'

      // Create a fast session
      const sessRes = await fetch(`${serverUrl}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'TindaBot Query' })
      })

      if (sessRes.ok) {
        const sessData = await sessRes.json()
        const sessionId = sessData?.id

        if (sessionId) {
          const promptRes = await fetch(`${serverUrl}/session/${sessionId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: { providerID: 'opencode', modelID: modelId },
              parts: [{ type: 'text', text: `${TINDA_SYSTEM_PROMPT}\n\nUser Question: ${question}` }]
            })
          })

          if (promptRes.ok) {
            const msgData = await promptRes.json()
            const parts = msgData?.parts || []
            const textPart = parts.find((p: { type: string; text?: string }) => p.type === 'text' && p.text)
            if (textPart?.text) {
              return {
                reply: textPart.text.trim(),
                action: offlineMatch?.action
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('OpenCode server call failed, falling back to offline:', e)
    }
  }

  // If in offline mode, return immediate knowledge or fallback
  if (config.provider === 'offline' || !config.apiKey) {
    // Check if secure desktop AI vault is available
    if (window.api?.ai?.ask) {
      try {
        const res = await window.api.ai.ask(question)
        if (res && res.reply) {
          return {
            reply: res.reply,
            action: (res.action as AssistantAction) || offlineMatch?.action
          }
        }
      } catch (err) {
        console.warn('Secure desktop AI error, falling back:', err)
      }
    }

    if (offlineMatch) {
      return offlineMatch
    }

    // Default intelligent offline fallback
    const isBisaya = /unsaon|asa|ngano|kaayo|nako/i.test(question)
    return {
      reply: isBisaya
        ? `Salamat sa imong pangutana, boss! Sa kasamtangan, naka-offline mode ang TindaBot. Mahimo nimong tan-awon ang kumpletong giya sa "Store Handbook" sa menu, o i-encode ang imong pondo sa "E-Wallet & Bills".`
        : `Salamat sa inyong tanong! Sa kasalukuyan ay naka-Offline Mode ang TindaBot. Maaari ninyong buksan ang opisyal na "Store Handbook" sa kaliwang menu o mag-tanong tungkol sa E-Wallet, Utang, o Diskwento.`
    }
  }

  // 2. Online Mode via Gemini (Free Tier)
  if (config.provider === 'gemini' && config.apiKey) {
    try {
      const model = config.model || 'gemini-2.5-flash-lite'
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey.trim()}`

      const payload = {
        systemInstruction: {
          parts: [{ text: TINDA_SYSTEM_PROMPT }]
        },
        contents: [
          ...history.slice(-4).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
          {
            role: 'user',
            parts: [{ text: question }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 600
        }
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        throw new Error(`Gemini API Error: ${res.statusText}`)
      }

      const data = await res.json()
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (candidateText) {
        return {
          reply: candidateText.trim(),
          action: offlineMatch?.action
        }
      }
    } catch (err) {
      console.warn('Gemini request failed, falling back to offline knowledge:', err)
      if (offlineMatch) return offlineMatch
    }
  }

  // 3. Fallback to offline match
  return offlineMatch || {
    reply: 'Nandito po ang TindaBot para tumulong sa inyong tindahan! Maaari po kayong magtanong tungkol sa GCash funds, bills, senior discount, o thermal printer.'
  }
}
