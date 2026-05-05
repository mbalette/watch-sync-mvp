import http from 'node:http'
import { getRokuDeviceInfo, sendRokuKeypress } from './tv-remote'
import { pairLgWebOs, sendLgWebOsMediaCommand } from './lg-webos-remote'
import { pairSamsungTv, sendSamsungKeypress } from './samsung-tizen-remote'
import { getSonyRemoteControllerInfo, sendSonyIrcc } from './sony-bravia-remote'
import { sendPhilipsJointSpaceKey } from './philips-jointspace-remote'
import { sendVizioSmartCastKey } from './vizio-smartcast-remote'
import { TV_REMOTE_TARGETS, helperAdvertisedTargets, uiVisibleTargets } from './tv-remote-targets'

const port = Number(process.env.TV_REMOTE_HELPER_PORT ?? 8790)

export interface TvRemoteHelperDeps {
  getRokuDeviceInfo?: typeof getRokuDeviceInfo
  sendRokuKeypress?: typeof sendRokuKeypress
  pairLgWebOs?: typeof pairLgWebOs
  sendLgWebOsMediaCommand?: typeof sendLgWebOsMediaCommand
  pairSamsungTv?: typeof pairSamsungTv
  sendSamsungKeypress?: typeof sendSamsungKeypress
  getSonyRemoteControllerInfo?: typeof getSonyRemoteControllerInfo
  sendSonyIrcc?: typeof sendSonyIrcc
  sendPhilipsJointSpaceKey?: typeof sendPhilipsJointSpaceKey
  sendVizioSmartCastKey?: typeof sendVizioSmartCastKey
}

export function createTvRemoteHelperServer(deps: TvRemoteHelperDeps = {}) {
  const getDeviceInfo = deps.getRokuDeviceInfo ?? getRokuDeviceInfo
  const sendKeypress = deps.sendRokuKeypress ?? sendRokuKeypress
  const pairLg = deps.pairLgWebOs ?? pairLgWebOs
  const sendLgMedia = deps.sendLgWebOsMediaCommand ?? sendLgWebOsMediaCommand
  const pairSamsung = deps.pairSamsungTv ?? pairSamsungTv
  const sendSamsung = deps.sendSamsungKeypress ?? sendSamsungKeypress
  const getSonyInfo = deps.getSonyRemoteControllerInfo ?? getSonyRemoteControllerInfo
  const sendSony = deps.sendSonyIrcc ?? sendSonyIrcc
  const sendPhilips = deps.sendPhilipsJointSpaceKey ?? sendPhilipsJointSpaceKey
  const sendVizio = deps.sendVizioSmartCastKey ?? sendVizioSmartCastKey

  return http.createServer(async (req, res) => {
  setCors(res)
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`)

    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, {
        ok: true,
        service: 'watch-sync-tv-remote-helper',
        targets: helperAdvertisedTargets(),
        availableTargets: uiVisibleTargets().map(({ id, label, priority, protocolStatus, hardwareValidated, safeClaim }) => ({
          id,
          label,
          priority,
          protocolStatus,
          hardwareValidated,
          safeClaim,
        })),
      })
      return
    }

    if (req.method === 'GET' && url.pathname === '/targets') {
      sendJson(res, 200, { ok: true, targets: TV_REMOTE_TARGETS })
      return
    }

    if (req.method === 'GET' && url.pathname === '/roku/device-info') {
      const host = url.searchParams.get('host') ?? ''
      const device = await getDeviceInfo(host)
      sendJson(res, 200, { ok: true, device })
      return
    }

    if (req.method === 'POST' && url.pathname === '/roku/keypress') {
      const body = await readJson(req)
      await sendKeypress(String(body.host ?? ''), String(body.key ?? ''))
      sendJson(res, 200, { ok: true })
      return
    }

    if (req.method === 'POST' && url.pathname === '/lg-webos/pair') {
      const body = await readJson(req)
      const result = await pairLg(String(body.host ?? ''), {
        url: optionalBodyString(body.url),
        timeoutMs: optionalBodyNumber(body.timeoutMs),
        appName: optionalBodyString(body.appName),
        appId: optionalBodyString(body.appId),
      })
      sendJson(res, 200, { ok: true, platform: 'lg-webos-experimental', clientKey: result.clientKey })
      return
    }

    if (req.method === 'POST' && url.pathname === '/lg-webos/media') {
      const body = await readJson(req)
      await sendLgMedia(String(body.host ?? ''), String(body.command ?? ''), {
        url: optionalBodyString(body.url),
        timeoutMs: optionalBodyNumber(body.timeoutMs),
        appName: optionalBodyString(body.appName),
        appId: optionalBodyString(body.appId),
        clientKey: String(body.clientKey ?? ''),
      })
      sendJson(res, 200, { ok: true, platform: 'lg-webos-experimental' })
      return
    }

    if (req.method === 'POST' && url.pathname === '/samsung/pair') {
      const body = await readJson(req)
      const result = await pairSamsung(String(body.host ?? ''), {
        url: optionalBodyString(body.url),
        port: optionalSamsungPort(body.port),
        token: optionalBodyString(body.token),
        appName: optionalBodyString(body.appName),
        timeoutMs: optionalBodyNumber(body.timeoutMs),
      })
      sendJson(res, 200, { ok: true, platform: 'samsung-tizen-beta', ...result })
      return
    }

    if (req.method === 'POST' && url.pathname === '/samsung/keypress') {
      const body = await readJson(req)
      await sendSamsung(String(body.host ?? ''), String(body.key ?? ''), {
        url: optionalBodyString(body.url),
        port: optionalSamsungPort(body.port),
        token: optionalBodyString(body.token),
        appName: optionalBodyString(body.appName),
        timeoutMs: optionalBodyNumber(body.timeoutMs),
      })
      sendJson(res, 200, { ok: true, platform: 'samsung-tizen-beta' })
      return
    }

    if (req.method === 'POST' && url.pathname === '/sony/remote-controller-info') {
      const body = await readJson(req)
      const result = await getSonyInfo(String(body.host ?? ''), {
        url: optionalBodyString(body.url),
        psk: optionalBodyString(body.psk),
        timeoutMs: optionalBodyNumber(body.timeoutMs),
      })
      sendJson(res, 200, { ok: true, platform: 'sony-bravia-beta', result })
      return
    }

    if (req.method === 'POST' && url.pathname === '/sony/ircc') {
      const body = await readJson(req)
      await sendSony(String(body.host ?? ''), String(body.irccCode ?? ''), {
        url: optionalBodyString(body.url),
        psk: optionalBodyString(body.psk),
        timeoutMs: optionalBodyNumber(body.timeoutMs),
      })
      sendJson(res, 200, { ok: true, platform: 'sony-bravia-beta' })
      return
    }

    if (req.method === 'POST' && url.pathname === '/philips/key') {
      const body = await readJson(req)
      await sendPhilips(String(body.host ?? ''), String(body.key ?? ''), {
        url: optionalBodyString(body.url),
        apiVersion: optionalBodyNumber(body.apiVersion),
        timeoutMs: optionalBodyNumber(body.timeoutMs),
      })
      sendJson(res, 200, { ok: true, platform: 'philips-jointspace-experimental' })
      return
    }

    if (req.method === 'POST' && url.pathname === '/vizio/key') {
      const body = await readJson(req)
      await sendVizio(String(body.host ?? ''), String(body.key ?? ''), {
        url: optionalBodyString(body.url),
        authToken: optionalBodyString(body.authToken),
        timeoutMs: optionalBodyNumber(body.timeoutMs),
      })
      sendJson(res, 200, { ok: true, platform: 'vizio-smartcast-experimental' })
      return
    }

    sendJson(res, 404, { ok: false, error: 'Not found' })
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : 'TV remote helper error' })
  }
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createTvRemoteHelperServer()
  server.listen(port, '127.0.0.1', () => {
    console.log(`Watch Sync TV Remote helper listening on http://127.0.0.1:${port}`)
  })
}

function setCors(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function sendJson(res: http.ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

function readJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      if (!body.trim()) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(body) as Record<string, unknown>)
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function optionalBodyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

function optionalBodyNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function optionalSamsungPort(value: unknown): 8001 | 8002 | undefined {
  if (value === 8001 || value === 8002) return value
  return undefined
}
