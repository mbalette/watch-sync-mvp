import http from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { createTvRemoteHelperServer } from './tv-remote-helper'

let server: http.Server | undefined

afterEach(async () => {
  if (!server) return
  await new Promise<void>((resolve, reject) => server?.close((error) => error ? reject(error) : resolve()))
  server = undefined
})

describe('TV remote helper endpoints', () => {
  it('reports implemented helper targets and full target roadmap', async () => {
    const baseUrl = await startHelper()
    const health = await fetchJson(`${baseUrl}/health`)
    const targets = await fetchJson(`${baseUrl}/targets`)

    expect(health.targets).toEqual(['roku-ecp', 'lg-webos-experimental', 'samsung-tizen-beta', 'sony-bravia-beta', 'philips-jointspace-experimental', 'vizio-smartcast-experimental'])
    expect(targets.targets).toHaveLength(10)
    expect(targets.targets.map((target: { id: string }) => target.id)).toContain('apple-tv-manual-only')
  })

  it('routes LG and Samsung helper endpoints through injectable adapters', async () => {
    const calls: string[] = []
    const baseUrl = await startHelper({
      pairLgWebOs: async () => {
        calls.push('lg-pair')
        return { clientKey: 'lg-key', raw: {} }
      },
      sendLgWebOsMediaCommand: async (_host, command) => {
        calls.push(`lg-${command}`)
      },
      pairSamsungTv: async () => {
        calls.push('samsung-pair')
        return { host: 'mock', port: 8002, token: 'samsung-token', paired: true }
      },
      sendSamsungKeypress: async (_host, key) => {
        calls.push(`samsung-${key}`)
      },
      getSonyRemoteControllerInfo: async () => {
        calls.push('sony-info')
        return { result: [] }
      },
      sendSonyIrcc: async () => {
        calls.push('sony-ircc')
      },
      sendPhilipsJointSpaceKey: async (_host, key) => {
        calls.push(`philips-${key}`)
      },
      sendVizioSmartCastKey: async (_host, key) => {
        calls.push(`vizio-${key}`)
      },
    })

    await expect(postJson(`${baseUrl}/lg-webos/pair`, { host: '127.0.0.1' })).resolves.toMatchObject({ ok: true, clientKey: 'lg-key' })
    await expect(postJson(`${baseUrl}/lg-webos/media`, { host: '127.0.0.1', clientKey: 'lg-key', command: 'play' })).resolves.toMatchObject({ ok: true })
    await expect(postJson(`${baseUrl}/samsung/pair`, { host: '127.0.0.1' })).resolves.toMatchObject({ ok: true, token: 'samsung-token' })
    await expect(postJson(`${baseUrl}/samsung/keypress`, { host: '127.0.0.1', key: 'KEY_PLAY' })).resolves.toMatchObject({ ok: true })
    await expect(postJson(`${baseUrl}/sony/remote-controller-info`, { host: '127.0.0.1' })).resolves.toMatchObject({ ok: true })
    await expect(postJson(`${baseUrl}/sony/ircc`, { host: '127.0.0.1', irccCode: 'AAAAAQAAAAEAAAAUAw==' })).resolves.toMatchObject({ ok: true })
    await expect(postJson(`${baseUrl}/philips/key`, { host: '127.0.0.1', key: 'PlayPause' })).resolves.toMatchObject({ ok: true })
    await expect(postJson(`${baseUrl}/vizio/key`, { host: '127.0.0.1', key: 'play' })).resolves.toMatchObject({ ok: true })
    expect(calls).toEqual(['lg-pair', 'lg-play', 'samsung-pair', 'samsung-KEY_PLAY', 'sony-info', 'sony-ircc', 'philips-PlayPause', 'vizio-play'])
  })
})

async function startHelper(deps?: Parameters<typeof createTvRemoteHelperServer>[0]): Promise<string> {
  server = createTvRemoteHelperServer(deps)
  await new Promise<void>((resolve) => server?.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('helper server did not expose a TCP port')
  return `http://127.0.0.1:${address.port}`
}

async function fetchJson(url: string): Promise<Record<string, unknown>> {
  const response = await fetch(url)
  return response.json() as Promise<Record<string, unknown>>
}

async function postJson(url: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return response.json() as Promise<Record<string, unknown>>
}
