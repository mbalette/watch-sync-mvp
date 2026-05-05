import WebSocket from 'ws'
import { sanitizeLanHost } from './tv-remote-utils'

export type SamsungKeypress = 'KEY_PLAY' | 'KEY_PAUSE'

export interface SamsungRemoteOptions {
  url?: string
  port?: 8001 | 8002
  token?: string
  appName?: string
  timeoutMs?: number
}

export interface SamsungPairResult {
  host: string
  port: 8001 | 8002
  token?: string
  paired: boolean
  rawEvent?: unknown
}

const ALLOWED_SAMSUNG_KEYS = new Set<SamsungKeypress>(['KEY_PLAY', 'KEY_PAUSE'])

export function assertSamsungKey(key: string): SamsungKeypress {
  if (ALLOWED_SAMSUNG_KEYS.has(key as SamsungKeypress)) return key as SamsungKeypress
  throw new Error(`Unsupported Samsung key: ${key}`)
}

export function samsungRemoteUrl(hostInput: string, options: SamsungRemoteOptions = {}): string {
  if (options.url) {
    const parsed = new URL(options.url)
    if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') throw new Error('Samsung URL must use ws:// or wss://.')
    return parsed.toString()
  }
  const host = sanitizeLanHost(hostInput)
  const port = options.port ?? 8002
  const protocol = port === 8001 ? 'ws' : 'wss'
  const name = Buffer.from(options.appName ?? 'Watch Sync').toString('base64')
  const tokenPart = options.token ? `&token=${encodeURIComponent(options.token)}` : ''
  return `${protocol}://${host}:${port}/api/v2/channels/samsung.remote.control?name=${encodeURIComponent(name)}${tokenPart}`
}

export function samsungKeyMessage(keyInput: string): Record<string, unknown> {
  const key = assertSamsungKey(keyInput)
  return {
    method: 'ms.remote.control',
    params: {
      Cmd: 'Click',
      DataOfCmd: key,
      Option: 'false',
      TypeOfRemote: 'SendRemoteKey',
    },
  }
}

export function extractSamsungToken(event: unknown): string | undefined {
  if (!isRecord(event)) return undefined
  const data = recordValue(event, 'data')
  if (isRecord(data)) {
    const directToken = recordValue(data, 'token')
    if (typeof directToken === 'string' && directToken.length > 0) return directToken
    const clients = recordValue(data, 'clients')
    if (Array.isArray(clients)) {
      for (const client of clients) {
        if (!isRecord(client)) continue
        const clientToken = recordValue(client, 'token')
        if (typeof clientToken === 'string' && clientToken.length > 0) return clientToken
        const attributes = recordValue(client, 'attributes')
        if (isRecord(attributes)) {
          const attributeToken = recordValue(attributes, 'token')
          if (typeof attributeToken === 'string' && attributeToken.length > 0) return attributeToken
        }
      }
    }
  }
  return undefined
}

export async function pairSamsungTv(hostInput: string, options: SamsungRemoteOptions = {}): Promise<SamsungPairResult> {
  const host = sanitizeLanHost(hostInput)
  const port = options.port ?? 8002
  const event = await withSamsungSocket(host, options, async (socket) => {
    return waitForSamsungEvent(socket, options.timeoutMs)
  })
  return { host, port, token: extractSamsungToken(event), paired: true, rawEvent: event }
}

export async function sendSamsungKeypress(hostInput: string, keyInput: string, options: SamsungRemoteOptions = {}): Promise<void> {
  const message = samsungKeyMessage(keyInput)
  await withSamsungSocket(hostInput, options, async (socket) => {
    await sendSocketJson(socket, message)
    await delay(20)
  })
}

export async function sendSamsungPlay(hostInput: string, options: SamsungRemoteOptions = {}): Promise<void> {
  await sendSamsungKeypress(hostInput, 'KEY_PLAY', options)
}

async function withSamsungSocket<T>(hostInput: string, options: SamsungRemoteOptions, fn: (socket: WebSocket) => Promise<T>): Promise<T> {
  const socket = new WebSocket(samsungRemoteUrl(hostInput, options), { handshakeTimeout: options.timeoutMs ?? 3000, rejectUnauthorized: false })
  try {
    await waitForOpen(socket, options.timeoutMs)
    return await fn(socket)
  } finally {
    socket.close()
  }
}

function waitForOpen(socket: WebSocket, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Samsung TV socket timed out before opening.')), timeoutMs)
    socket.once('open', () => { clearTimeout(timer); resolve() })
    socket.once('error', (error) => { clearTimeout(timer); reject(error) })
  })
}

function waitForSamsungEvent(socket: WebSocket, timeoutMs = 3000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const cleanup = (done: () => void) => {
      clearTimeout(timer)
      socket.off('message', onMessage)
      socket.off('error', onError)
      done()
    }
    const timer = setTimeout(() => cleanup(() => reject(new Error('Samsung TV pairing response timed out.'))), timeoutMs)
    const onMessage = (data: WebSocket.RawData) => {
      try {
        cleanup(() => resolve(JSON.parse(data.toString()) as unknown))
      } catch (error) {
        cleanup(() => reject(error))
      }
    }
    const onError = (error: Error) => cleanup(() => reject(error))
    socket.on('message', onMessage)
    socket.once('error', onError)
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function recordValue(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined
}

function sendSocketJson(socket: WebSocket, payload: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.send(JSON.stringify(payload), (error) => error ? reject(error) : resolve())
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
