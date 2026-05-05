import http from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { createTvRemoteHelperServer } from './tv-remote-helper'

const servers: http.Server[] = []

afterEach(async () => {
  const closing = servers.splice(0).map((server) => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())))
  await Promise.all(closing)
})

describe('TV remote helper endpoints', () => {
  it('reports implemented helper targets and full target roadmap', async () => {
    const baseUrl = await startHelper()
    const health = await fetchJson(`${baseUrl}/health`)
    const targets = await fetchJson(`${baseUrl}/targets`)

    expect(health.targets).toEqual(['roku-ecp', 'lg-webos-experimental', 'samsung-tizen-beta', 'adb-helper-advanced', 'sony-bravia-beta', 'philips-jointspace-experimental', 'vizio-smartcast-experimental'])
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

  it('routes ADB connect and discrete media keys through injectable runner without shell strings', async () => {
    const calls: string[][] = []
    const baseUrl = await startHelper({
      runAdb: async (args) => {
        calls.push(args)
        return { stdout: 'ok', stderr: '' }
      },
    })

    await expect(postJson(`${baseUrl}/adb/connect`, { host: '192.168.1.50:5555' })).resolves.toMatchObject({ ok: true, platform: 'adb-helper-advanced' })
    await expect(postJson(`${baseUrl}/adb/media-key`, { host: '192.168.1.50:5555', key: 'KEYCODE_MEDIA_PLAY' })).resolves.toMatchObject({ ok: true, platform: 'adb-helper-advanced', key: 'KEYCODE_MEDIA_PLAY' })
    await expect(postJson(`${baseUrl}/adb/media-key`, { host: '192.168.1.50:5555', key: 'KEYCODE_MEDIA_PAUSE' })).resolves.toMatchObject({ ok: true, platform: 'adb-helper-advanced', key: 'KEYCODE_MEDIA_PAUSE' })

    expect(calls).toEqual([
      ['connect', '192.168.1.50:5555'],
      ['-s', '192.168.1.50:5555', 'shell', 'input', 'keyevent', 'KEYCODE_MEDIA_PLAY'],
      ['-s', '192.168.1.50:5555', 'shell', 'input', 'keyevent', 'KEYCODE_MEDIA_PAUSE'],
    ])
    expect(JSON.stringify(calls)).not.toContain('KEYCODE_MEDIA_PLAY_PAUSE')
  })

  it('rejects ADB toggle key without echoing shell-shaped host input', async () => {
    const calls: string[][] = []
    const baseUrl = await startHelper({
      runAdb: async (args) => {
        calls.push(args)
        return { stdout: 'ok', stderr: '' }
      },
    })

    const toggle = await postJson(`${baseUrl}/adb/media-key`, { host: '192.168.1.50:5555', key: 'KEYCODE_MEDIA_PLAY_PAUSE' })
    const injection = await postJson(`${baseUrl}/adb/connect`, { host: '192.168.1.50; rm -rf /' })

    expect(toggle).toMatchObject({ ok: false })
    expect(String(toggle.error)).toMatch(/Unsupported ADB media key/)
    expect(injection).toMatchObject({ ok: false })
    expect(JSON.stringify(injection)).not.toContain('rm -rf')
    expect(calls).toEqual([])
  })

  it('posts Home Assistant webhook test and play payloads once through the local helper', async () => {
    const webhookCalls: Array<{ body: Record<string, unknown>; headers: http.IncomingHttpHeaders }> = []
    const webhook = await startWebhookReceiver(async (req, res) => {
      webhookCalls.push({ body: await readRequestJson(req), headers: req.headers })
      res.writeHead(204)
      res.end()
    })
    const baseUrl = await startHelper()

    await expect(postJson(`${baseUrl}/home-assistant/webhook`, {
      webhookUrl: `${webhook}/api/webhook/secret-id`,
      roomId: 'ROOM1',
      countdownId: 'countdown-1',
      issuedAt: '2026-05-05T12:00:00.000Z',
      test: true,
    })).resolves.toMatchObject({ ok: true, platform: 'home-assistant-webhook', status: 204 })
    await expect(postJson(`${baseUrl}/home-assistant/webhook`, {
      webhookUrl: `${webhook}/api/webhook/secret-id`,
      roomId: 'ROOM1',
      countdownId: 'countdown-2',
      issuedAt: '2026-05-05T12:00:01.000Z',
    })).resolves.toMatchObject({ ok: true, platform: 'home-assistant-webhook', status: 204 })

    expect(webhookCalls).toHaveLength(2)
    expect(webhookCalls[0].body).toMatchObject({ type: 'watch_sync_test', room_id: 'ROOM1', countdown_id: 'countdown-1', issued_at: '2026-05-05T12:00:00.000Z' })
    expect(webhookCalls[1].body).toMatchObject({ type: 'watch_sync_go', room_id: 'ROOM1', countdown_id: 'countdown-2', issued_at: '2026-05-05T12:00:01.000Z' })
    expect(webhookCalls[0].headers.authorization).toBeUndefined()
  })

  it('rejects non-http Home Assistant webhook URLs without echoing secret URLs', async () => {
    const baseUrl = await startHelper()
    const secretUrl = 'file:///tmp/secret-webhook-id'

    const response = await postJson(`${baseUrl}/home-assistant/webhook`, { webhookUrl: secretUrl })

    expect(response).toMatchObject({ ok: false })
    expect(String(response.error)).toMatch(/http/i)
    expect(JSON.stringify(response)).not.toContain(secretUrl)
  })

  it('returns a safe Home Assistant webhook failure without echoing the secret URL', async () => {
    const webhook = await startWebhookReceiver(async (_req, res) => {
      res.writeHead(500)
      res.end('boom secret body')
    })
    const baseUrl = await startHelper()
    const secretUrl = `${webhook}/api/webhook/super-secret-id`

    const response = await postJson(`${baseUrl}/home-assistant/webhook`, { webhookUrl: secretUrl })

    expect(response).toMatchObject({ ok: false })
    expect(String(response.error)).toMatch(/Home Assistant webhook returned 500/)
    expect(JSON.stringify(response)).not.toContain(secretUrl)
    expect(JSON.stringify(response)).not.toContain('super-secret-id')
  })
})

async function startHelper(deps?: Parameters<typeof createTvRemoteHelperServer>[0]): Promise<string> {
  const server = createTvRemoteHelperServer(deps)
  servers.push(server)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('helper server did not expose a TCP port')
  return `http://127.0.0.1:${address.port}`
}

async function startWebhookReceiver(listener: http.RequestListener): Promise<string> {
  const server = http.createServer(listener)
  servers.push(server)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('webhook server did not expose a TCP port')
  return `http://127.0.0.1:${address.port}`
}

function readRequestJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        resolve(body.trim() ? JSON.parse(body) as Record<string, unknown> : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
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
