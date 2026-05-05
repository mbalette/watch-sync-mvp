import { afterEach, describe, expect, it } from 'vitest'
import { WebSocketServer } from 'ws'
import { assertSamsungKey, extractSamsungToken, pairSamsungTv, samsungKeyMessage, samsungRemoteUrl, sendSamsungKeypress } from './samsung-tizen-remote'

const servers: WebSocketServer[] = []

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))))
})

describe('Samsung Tizen beta remote adapter', () => {
  it('builds modern Samsung WebSocket URLs with base64 app name and token', () => {
    expect(samsungRemoteUrl('192.168.1.50', { port: 8001, appName: 'Watch Sync' })).toBe('ws://192.168.1.50:8001/api/v2/channels/samsung.remote.control?name=V2F0Y2ggU3luYw%3D%3D')
    expect(samsungRemoteUrl('192.168.1.50', { port: 8002, appName: 'Watch Sync', token: 'abc 123' })).toBe('wss://192.168.1.50:8002/api/v2/channels/samsung.remote.control?name=V2F0Y2ggU3luYw%3D%3D&token=abc%20123')
  })

  it('builds exact ms.remote.control key messages and rejects broad remote keys', () => {
    expect(samsungKeyMessage('KEY_PLAY')).toEqual({
      method: 'ms.remote.control',
      params: {
        Cmd: 'Click',
        DataOfCmd: 'KEY_PLAY',
        Option: 'false',
        TypeOfRemote: 'SendRemoteKey',
      },
    })
    expect(() => assertSamsungKey('KEY_HOME')).toThrow(/Unsupported Samsung key/)
    expect(() => assertSamsungKey('KEY_PLAYPAUSE')).toThrow(/Unsupported Samsung key/)
  })

  it('extracts tokens from known community event shapes', () => {
    expect(extractSamsungToken({ data: { token: 'direct' } })).toBe('direct')
    expect(extractSamsungToken({ data: { clients: [{ attributes: { token: 'attribute' } }] } })).toBe('attribute')
    expect(extractSamsungToken({ data: { clients: [{ token: 'client' }] } })).toBe('client')
    expect(extractSamsungToken({ event: 'ms.channel.ready' })).toBeUndefined()
  })

  it('pairs through a mock WebSocket server without claiming official support', async () => {
    const url = await startMockSamsungServer((socket) => {
      setTimeout(() => socket.send(JSON.stringify({ event: 'ms.channel.ready', data: { token: 'mock-samsung-token' } })), 10)
    })

    const result = await pairSamsungTv('127.0.0.1', { url, timeoutMs: 500 })

    expect(result).toMatchObject({ paired: true, token: 'mock-samsung-token' })
  })

  it('sends KEY_PLAY to a mock WebSocket server', async () => {
    const messages: unknown[] = []
    const url = await startMockSamsungServer((_socket, message) => {
      if (message) messages.push(message)
    })

    await sendSamsungKeypress('127.0.0.1', 'KEY_PLAY', { url, timeoutMs: 500 })

    expect(messages).toContainEqual(samsungKeyMessage('KEY_PLAY'))
  })
})

function startMockSamsungServer(onEvent: (socket: import('ws').WebSocket, message?: unknown) => void): Promise<string> {
  const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 })
  servers.push(wss)
  wss.on('connection', (socket) => {
    onEvent(socket)
    socket.on('message', (data) => onEvent(socket, JSON.parse(data.toString()) as unknown))
  })
  return new Promise((resolve) => {
    wss.on('listening', () => {
      const address = wss.address()
      if (!address || typeof address === 'string') throw new Error('mock Samsung server missing port')
      resolve(`ws://127.0.0.1:${address.port}/api/v2/channels/samsung.remote.control?name=V2F0Y2ggU3luYw%3D%3D`)
    })
  })
}
