import WebSocket from 'ws'
import { sanitizeLanHost } from './tv-remote-utils'

export type LgWebOsCommand = 'play' | 'pause'

export interface LgWebOsRemoteOptions {
  url?: string
  timeoutMs?: number
  clientKey?: string
  appName?: string
  appId?: string
}

export interface LgWebOsPairResult {
  clientKey: string
  raw: unknown
}

const LG_WEBOS_COMMAND_URIS: Record<LgWebOsCommand, string> = {
  play: 'ssap://media.controls/play',
  pause: 'ssap://media.controls/pause',
}

export function assertLgWebOsCommand(command: string): LgWebOsCommand {
  if (command === 'play' || command === 'pause') return command
  throw new Error(`Unsupported LG webOS command: ${command}`)
}

export function lgWebOsUrl(hostInput: string, options: LgWebOsRemoteOptions = {}): string {
  if (options.url) {
    const parsed = new URL(options.url)
    if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') throw new Error('LG webOS URL must use ws:// or wss://.')
    if (parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error('LG webOS URL must not include credentials, query, or fragment.')
    return parsed.toString()
  }
  const host = sanitizeLanHost(hostInput)
  return `ws://${host}:3000`
}

export async function pairLgWebOs(hostInput: string, options: LgWebOsRemoteOptions = {}): Promise<LgWebOsPairResult> {
  return withLgSocket(hostInput, options, async (socket, nextId) => {
    await sendLgRegister(socket, nextId(), options)
    const registered = await waitForLgMessage(socket, options.timeoutMs, (message) => {
      if (!isRecord(message)) return false
      if (message.type === 'error') throw new Error(`LG webOS pairing failed: ${stringValue(message.error) ?? 'TV returned an error'}`)
      return message.type === 'registered' && typeof recordValue(message.payload, 'client-key') === 'string'
    })
    const payload = recordValue(registered, 'payload')
    const clientKey = isRecord(payload) ? recordValue(payload, 'client-key') : undefined
    if (typeof clientKey !== 'string' || clientKey.length === 0) throw new Error('LG webOS pairing did not return a client-key.')
    return { clientKey, raw: registered }
  })
}

export async function sendLgWebOsMediaCommand(hostInput: string, commandInput: string, options: LgWebOsRemoteOptions & { clientKey: string }): Promise<void> {
  const command = assertLgWebOsCommand(commandInput)
  await withLgSocket(hostInput, options, async (socket, nextId) => {
    await sendLgRegister(socket, nextId(), options)
    await waitForLgRegisteredOrResponse(socket, options.timeoutMs)
    await sendSocketJson(socket, { id: String(nextId()), type: 'request', uri: LG_WEBOS_COMMAND_URIS[command] })
    await delay(20)
  })
}

async function withLgSocket<T>(hostInput: string, options: LgWebOsRemoteOptions, fn: (socket: WebSocket, nextId: () => number) => Promise<T>): Promise<T> {
  const socket = new WebSocket(lgWebOsUrl(hostInput, options), { handshakeTimeout: options.timeoutMs ?? 3000, rejectUnauthorized: false })
  let id = 1
  try {
    await waitForOpen(socket, options.timeoutMs)
    await sendSocketJson(socket, {
      id: id++,
      type: 'hello',
      payload: {
        sdkVersion: 'watch-sync-helper-0.1',
        deviceModel: 'Watch Sync Helper',
        OSVersion: 'node',
        appId: options.appId ?? 'tech.kyros.watch-sync',
        appName: options.appName ?? 'Watch Sync',
      },
    })
    return await fn(socket, () => id++)
  } finally {
    socket.close()
  }
}

async function sendLgRegister(socket: WebSocket, id: number, options: LgWebOsRemoteOptions): Promise<void> {
  await sendSocketJson(socket, {
    id: String(id),
    type: 'register',
    payload: {
      ...(options.clientKey ? { 'client-key': options.clientKey } : {}),
      pairingType: 'PROMPT',
      manifest: {
        manifestVersion: 1,
        appId: options.appId ?? 'tech.kyros.watch-sync',
        localizedAppNames: { '': options.appName ?? 'Watch Sync' },
        permissions: ['CONTROL_INPUT_MEDIA_PLAYBACK'],
      },
    },
  })
}

async function waitForLgRegisteredOrResponse(socket: WebSocket, timeoutMs = 3000): Promise<void> {
  await waitForLgMessage(socket, timeoutMs, (message) => {
    if (!isRecord(message)) return false
    if (message.type === 'error') throw new Error(`LG webOS registration failed: ${stringValue(message.error) ?? 'TV returned an error'}`)
    return message.type === 'registered' || message.type === 'response'
  })
}

function waitForOpen(socket: WebSocket, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('LG webOS socket timed out before opening.')), timeoutMs)
    socket.once('open', () => { clearTimeout(timer); resolve() })
    socket.once('error', (error) => { clearTimeout(timer); reject(error) })
  })
}

function waitForLgMessage(socket: WebSocket, timeoutMs = 3000, predicate: (message: unknown) => boolean): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const cleanup = (done: () => void) => {
      clearTimeout(timer)
      socket.off('message', onMessage)
      socket.off('error', onError)
      done()
    }
    const timer = setTimeout(() => cleanup(() => reject(new Error('LG webOS response timed out.'))), timeoutMs)
    const onMessage = (data: WebSocket.RawData) => {
      try {
        const message = JSON.parse(data.toString()) as unknown
        if (predicate(message)) cleanup(() => resolve(message))
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

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function sendSocketJson(socket: WebSocket, payload: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.send(JSON.stringify(payload), (error) => error ? reject(error) : resolve())
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
