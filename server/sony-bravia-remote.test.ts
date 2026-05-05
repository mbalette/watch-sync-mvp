import http from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { assertSonyIrccCode, getSonyRemoteControllerInfo, sendSonyIrcc, sonyBraviaBaseUrl } from './sony-bravia-remote'

let server: http.Server | undefined

afterEach(async () => {
  if (!server) return
  await new Promise<void>((resolve, reject) => server?.close((error) => error ? reject(error) : resolve()))
  server = undefined
})

describe('Sony Bravia beta remote adapter', () => {
  it('requests remote controller info with PSK header', async () => {
    const requests: Array<{ path?: string; body: string; psk?: string }> = []
    const baseUrl = await startServer((req, body, res) => {
      requests.push({ path: req.url, body, psk: req.headers['x-auth-psk'] as string | undefined })
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ result: [] }))
    })

    await getSonyRemoteControllerInfo('127.0.0.1', { url: baseUrl, psk: '1234', timeoutMs: 500 })

    expect(requests[0]).toMatchObject({ path: '/sony/system', psk: '1234' })
    expect(JSON.parse(requests[0].body)).toMatchObject({ method: 'getRemoteControllerInfo' })
  })

  it('sends IRCC SOAP envelope and rejects fake codes', async () => {
    const requests: Array<{ path?: string; body: string; soap?: string }> = []
    const baseUrl = await startServer((req, body, res) => {
      requests.push({ path: req.url, body, soap: req.headers.soapaction as string | undefined })
      res.writeHead(200)
      res.end('')
    })

    await sendSonyIrcc('127.0.0.1', 'AAAAAQAAAAEAAAAUAw==', { url: baseUrl, timeoutMs: 500 })

    expect(requests[0]).toMatchObject({ path: '/sony/IRCC', soap: '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"' })
    expect(requests[0].body).toContain('<IRCCCode>AAAAAQAAAAEAAAAUAw==</IRCCCode>')
    expect(() => assertSonyIrccCode('KEY_PLAY')).toThrow(/base64 IRCC/)
    expect(sonyBraviaBaseUrl('192.168.1.10')).toBe('http://192.168.1.10')
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
      if (!address || typeof address === 'string') throw new Error('mock Sony server missing port')
      resolve(`http://127.0.0.1:${address.port}`)
    })
  })
}
