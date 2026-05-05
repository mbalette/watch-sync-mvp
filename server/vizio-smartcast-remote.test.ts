import http from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { assertVizioSmartCastKey, sendVizioSmartCastKey, vizioKeyCommandBody, vizioSmartCastBaseUrl } from './vizio-smartcast-remote'

let server: http.Server | undefined

afterEach(async () => {
  if (!server) return
  await new Promise<void>((resolve, reject) => server?.close((error) => error ? reject(error) : resolve()))
  server = undefined
})

describe('Vizio SmartCast experimental remote adapter', () => {
  it('builds community key command envelopes for play and pause', () => {
    expect(vizioKeyCommandBody('play')).toEqual({ KEYLIST: [{ CODESET: 2, CODE: 3, ACTION: 'KEYPRESS' }] })
    expect(vizioKeyCommandBody('pause')).toEqual({ KEYLIST: [{ CODESET: 2, CODE: 2, ACTION: 'KEYPRESS' }] })
    expect(() => assertVizioSmartCastKey('launchNetflix')).toThrow(/Unsupported Vizio/)
  })

  it('sends key command with local auth token when provided', async () => {
    const requests: Array<{ path?: string; method?: string; body: string; auth?: string }> = []
    const baseUrl = await startServer((req, body, res) => {
      requests.push({ path: req.url, method: req.method, body, auth: req.headers.auth as string | undefined })
      res.writeHead(200)
      res.end('')
    })

    await sendVizioSmartCastKey('127.0.0.1', 'play', { url: baseUrl, authToken: 'local-token', timeoutMs: 500 })

    expect(requests).toEqual([{ path: '/key_command/', method: 'PUT', body: JSON.stringify(vizioKeyCommandBody('play')), auth: 'local-token' }])
    expect(vizioSmartCastBaseUrl('192.168.1.30')).toBe('https://192.168.1.30:7345')
  })
})

function startServer(handler: (req: http.IncomingMessage, body: string, res: http.ServerResponse) => void): Promise<string> {
  server = http.createServer((req, res) => {
    let body = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => handler(req, body, res))
  })
  return new Promise((resolve) => {
    server?.listen(0, '127.0.0.1', () => {
      const address = server?.address()
      if (!address || typeof address === 'string') throw new Error('mock Vizio server missing port')
      resolve(`http://127.0.0.1:${address.port}`)
    })
  })
}
