import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { sanitizeLanHost } from './tv-remote-utils'

export type VizioSmartCastKey = 'play' | 'pause'

export interface VizioSmartCastOptions {
  url?: string
  authToken?: string
  timeoutMs?: number
}

const VIZIO_CODES: Record<VizioSmartCastKey, { CODESET: number; CODE: number; ACTION: 'KEYPRESS' }> = {
  play: { CODESET: 2, CODE: 3, ACTION: 'KEYPRESS' },
  pause: { CODESET: 2, CODE: 2, ACTION: 'KEYPRESS' },
}

export function assertVizioSmartCastKey(key: string): VizioSmartCastKey {
  if (key === 'play' || key === 'pause') return key
  throw new Error(`Unsupported Vizio SmartCast key: ${key}`)
}

export function vizioSmartCastBaseUrl(hostInput: string, options: VizioSmartCastOptions = {}): string {
  if (options.url) {
    const parsed = new URL(options.url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('Vizio SmartCast URL must use http:// or https://.')
    return parsed.toString().replace(/\/$/, '')
  }
  return `https://${sanitizeLanHost(hostInput)}:7345`
}

export function vizioKeyCommandBody(keyInput: string): Record<string, unknown> {
  const key = assertVizioSmartCastKey(keyInput)
  return { KEYLIST: [VIZIO_CODES[key]] }
}

export async function sendVizioSmartCastKey(hostInput: string, keyInput: string, options: VizioSmartCastOptions = {}): Promise<void> {
  await jsonPut(`${vizioSmartCastBaseUrl(hostInput, options)}/key_command/`, vizioKeyCommandBody(keyInput), options)
}

async function jsonPut(urlString: string, body: unknown, options: VizioSmartCastOptions): Promise<void> {
  const url = new URL(urlString)
  const transport = url.protocol === 'https:' ? httpsRequest : httpRequest
  const payload = JSON.stringify(body)
  await new Promise<void>((resolve, reject) => {
    const req = transport({
      hostname: url.hostname,
      port: url.port ? Number(url.port) : undefined,
      path: `${url.pathname}${url.search}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Content-Length': Buffer.byteLength(payload),
        ...(options.authToken ? { AUTH: options.authToken } : {}),
      },
      timeout: options.timeoutMs ?? 3000,
      rejectUnauthorized: false,
    }, (res) => {
      res.resume()
      res.on('end', () => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Vizio SmartCast returned HTTP ${res.statusCode ?? 'unknown'}`))
          return
        }
        resolve()
      })
    })
    req.on('timeout', () => req.destroy(new Error('Vizio SmartCast request timed out.')))
    req.on('error', reject)
    req.end(payload)
  })
}
