import http from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { assertPhilipsJointSpaceKey, philipsJointSpaceBaseUrl, sendPhilipsJointSpaceKey } from './philips-jointspace-remote'

let server: http.Server | undefined

afterEach(async () => {
  if (!server) return
  await new Promise<void>((resolve, reject) => server?.close((error) => error ? reject(error) : resolve()))
  server = undefined
})

describe('Philips JointSpace experimental remote adapter', () => {
  it('sends PlayPause to the selected API version input endpoint', async () => {
    const requests: Array<{ path?: string; body: string }> = []
    const baseUrl = await startServer((req, body, res) => {
      requests.push({ path: req.url, body })
      res.writeHead(200)
      res.end('')
    })

    await sendPhilipsJointSpaceKey('127.0.0.1', 'PlayPause', { url: baseUrl, apiVersion: 6, timeoutMs: 500 })

    expect(requests).toEqual([{ path: '/6/input/key', body: JSON.stringify({ key: 'PlayPause' }) }])
  })

  it('rejects unsupported broad keys and builds default base URL', () => {
    expect(() => assertPhilipsJointSpaceKey('Home')).toThrow(/Unsupported Philips/)
    expect(philipsJointSpaceBaseUrl('192.168.1.20')).toBe('http://192.168.1.20:1925')
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
      if (!address || typeof address === 'string') throw new Error('mock Philips server missing port')
      resolve(`http://127.0.0.1:${address.port}`)
    })
  })
}
