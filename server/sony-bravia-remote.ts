import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { sanitizeLanHost } from './tv-remote-utils'

export interface SonyBraviaOptions {
  url?: string
  psk?: string
  timeoutMs?: number
}

export function sonyBraviaBaseUrl(hostInput: string, options: SonyBraviaOptions = {}): string {
  if (options.url) {
    const parsed = new URL(options.url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('Sony Bravia URL must use http:// or https://.')
    return parsed.toString().replace(/\/$/, '')
  }
  return `http://${sanitizeLanHost(hostInput)}`
}

export function assertSonyIrccCode(irccCode: string): string {
  if (!/^AAAA[A-Za-z0-9+/=]{8,}$/.test(irccCode)) throw new Error('Sony IRCC code must be a base64 IRCC command from getRemoteControllerInfo.')
  return irccCode
}

export async function getSonyRemoteControllerInfo(hostInput: string, options: SonyBraviaOptions = {}): Promise<unknown> {
  const baseUrl = sonyBraviaBaseUrl(hostInput, options)
  return jsonRequest(`${baseUrl}/sony/system`, {
    method: 'POST',
    timeoutMs: options.timeoutMs,
    headers: sonyHeaders(options),
    body: {
      method: 'getRemoteControllerInfo',
      params: [],
      id: 1,
      version: '1.0',
    },
  })
}

export async function sendSonyIrcc(hostInput: string, irccCodeInput: string, options: SonyBraviaOptions = {}): Promise<void> {
  const irccCode = assertSonyIrccCode(irccCodeInput)
  const baseUrl = sonyBraviaBaseUrl(hostInput, options)
  await textRequest(`${baseUrl}/sony/IRCC`, {
    method: 'POST',
    timeoutMs: options.timeoutMs,
    headers: {
      ...sonyHeaders(options),
      'Content-Type': 'text/xml; charset=UTF-8',
      SOAPAction: '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"',
    },
    body: `<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1"><IRCCCode>${irccCode}</IRCCCode></u:X_SendIRCC></s:Body></s:Envelope>`,
  })
}

function sonyHeaders(options: SonyBraviaOptions): Record<string, string> {
  return options.psk ? { 'X-Auth-PSK': options.psk } : {}
}

async function jsonRequest(url: string, options: { method: 'POST'; headers?: Record<string, string>; body: unknown; timeoutMs?: number }): Promise<unknown> {
  const text = await textRequest(url, { ...options, body: JSON.stringify(options.body), headers: { 'Content-Type': 'application/json; charset=UTF-8', ...(options.headers ?? {}) } })
  return JSON.parse(text) as unknown
}

async function textRequest(urlString: string, options: { method: 'POST'; headers?: Record<string, string>; body: string; timeoutMs?: number }): Promise<string> {
  const url = new URL(urlString)
  const transport = url.protocol === 'https:' ? httpsRequest : httpRequest
  return new Promise((resolve, reject) => {
    const req = transport({
      hostname: url.hostname,
      port: url.port ? Number(url.port) : undefined,
      path: `${url.pathname}${url.search}`,
      method: options.method,
      headers: options.headers,
      timeout: options.timeoutMs ?? 3000,
      rejectUnauthorized: false,
    }, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Sony Bravia returned HTTP ${res.statusCode ?? 'unknown'}`))
          return
        }
        resolve(body)
      })
    })
    req.on('timeout', () => req.destroy(new Error('Sony Bravia request timed out.')))
    req.on('error', reject)
    req.end(options.body)
  })
}
