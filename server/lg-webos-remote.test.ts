import { afterEach, describe, expect, it } from 'vitest'
import { WebSocketServer } from 'ws'
import { assertLgWebOsCommand, lgWebOsUrl, pairLgWebOs, sendLgWebOsMediaCommand } from './lg-webos-remote'

const servers: WebSocketServer[] = []

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))))
})

describe('LG webOS experimental remote adapter', () => {
  it('pairs with PROMPT registration and returns a client key', async () => {
    const messages: unknown[] = []
    const url = await startMockLgServer(messages, (server) => {
      server.send(JSON.stringify({ type: 'registered', payload: { 'client-key': 'mock-lg-key' } }))
    })

    const result = await pairLgWebOs('127.0.0.1', { url, timeoutMs: 500 })

    expect(result.clientKey).toBe('mock-lg-key')
    expect(messages).toContainEqual(expect.objectContaining({ type: 'hello' }))
    expect(messages).toContainEqual(expect.objectContaining({
      type: 'register',
      payload: expect.objectContaining({
        pairingType: 'PROMPT',
        manifest: expect.objectContaining({ permissions: ['CONTROL_INPUT_MEDIA_PLAYBACK'] }),
      }),
    }))
  })

  it('sends stored client key and exact play SSAP request', async () => {
    const messages: unknown[] = []
    const url = await startMockLgServer(messages, (server, message) => {
      if (isRecord(message) && message.type === 'register') {
        server.send(JSON.stringify({ type: 'registered', payload: { 'client-key': 'mock-lg-key' } }))
      }
    })

    await sendLgWebOsMediaCommand('127.0.0.1', 'play', { url, clientKey: 'mock-lg-key', timeoutMs: 500 })

    expect(messages).toContainEqual(expect.objectContaining({
      type: 'register',
      payload: expect.objectContaining({ 'client-key': 'mock-lg-key' }),
    }))
    expect(messages).toContainEqual(expect.objectContaining({
      type: 'request',
      uri: 'ssap://media.controls/play',
    }))
  })

  it('sends exact pause SSAP request for manual beta testing', async () => {
    const messages: unknown[] = []
    const url = await startMockLgServer(messages, (server, message) => {
      if (isRecord(message) && message.type === 'register') {
        server.send(JSON.stringify({ type: 'response', payload: { returnValue: true } }))
      }
    })

    await sendLgWebOsMediaCommand('127.0.0.1', 'pause', { url, clientKey: 'mock-lg-key', timeoutMs: 500 })

    expect(messages).toContainEqual(expect.objectContaining({
      type: 'request',
      uri: 'ssap://media.controls/pause',
    }))
  })

  it('rejects unsupported commands and unsafe URLs before network use', () => {
    expect(() => assertLgWebOsCommand('launchNetflix')).toThrow(/Unsupported LG webOS command/)
    expect(() => lgWebOsUrl('127.0.0.1', { url: 'http://127.0.0.1:3000' })).toThrow(/ws:\/\/ or wss:\/\//)
    expect(lgWebOsUrl('192.168.1.50')).toBe('ws://192.168.1.50:3000')
  })
})

function startMockLgServer(messages: unknown[], onMessage: (server: import('ws').WebSocket, message: unknown) => void): Promise<string> {
  const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 })
  servers.push(wss)
  wss.on('connection', (socket) => {
    socket.on('message', (data) => {
      const message = JSON.parse(data.toString()) as unknown
      messages.push(message)
      onMessage(socket, message)
    })
  })
  return new Promise((resolve) => {
    wss.on('listening', () => {
      const address = wss.address()
      if (!address || typeof address === 'string') throw new Error('mock LG server missing port')
      resolve(`ws://127.0.0.1:${address.port}`)
    })
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
