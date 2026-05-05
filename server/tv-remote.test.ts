import http from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { assertRokuKey, getRokuDeviceInfo, sendRokuKeypress } from './tv-remote'

const requests: string[] = []
let mockServer: http.Server
let mockPort = 0

beforeAll(async () => {
  mockServer = await startMockRoku()
  const address = mockServer.address()
  if (!address || typeof address === 'string') throw new Error('Mock Roku did not expose a TCP port')
  mockPort = address.port
})

afterAll(async () => {
  await new Promise<void>((resolve, reject) => mockServer.close((error) => error ? reject(error) : resolve()))
})

describe('Roku ECP remote helper', () => {
  it('fetches Roku device info and parses friendly fields', async () => {
    const device = await getRokuDeviceInfo('127.0.0.1', { port: mockPort })

    expect(requests).toContain('GET /query/device-info')
    expect(device.friendlyName).toBe('Living Room Roku')
    expect(device.modelName).toBe('Roku Ultra')
  })

  it('sends allowed keypress commands only', async () => {
    await sendRokuKeypress('http://127.0.0.1/some/path', 'Play', { port: mockPort })

    expect(requests).toContain('POST /keypress/Play')
    expect(() => assertRokuKey('LaunchNetflix')).toThrow(/Unsupported Roku key/)
    expect(() => assertRokuKey('Pause')).toThrow(/Unsupported Roku key/)
  })
})

function startMockRoku(): Promise<http.Server> {
  const server = http.createServer((req, res) => {
    requests.push(`${req.method} ${req.url}`)
    if (req.method === 'GET' && req.url === '/query/device-info') {
      res.writeHead(200, { 'Content-Type': 'text/xml' })
      res.end('<device-info><friendly-device-name>Living Room Roku</friendly-device-name><model-name>Roku Ultra</model-name></device-info>')
      return
    }
    if (req.method === 'POST' && req.url === '/keypress/Play') {
      res.writeHead(200)
      res.end('')
      return
    }
    res.writeHead(404)
    res.end('missing')
  })
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}
