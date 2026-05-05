import { request } from 'node:http'

export const ROKU_PORT = 8060

export type RokuKeypress = 'Play' | 'Select' | 'Back' | 'Home'

export interface RokuDeviceInfo {
  friendlyName?: string
  modelName?: string
  modelNumber?: string
  serialNumber?: string
  softwareVersion?: string
  raw: string
}

export interface RokuRequestOptions {
  port?: number
}

const ALLOWED_KEYS = new Set<RokuKeypress>(['Play', 'Select', 'Back', 'Home'])

export function sanitizeRokuHost(input: string): string {
  const host = input.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
  if (!/^[a-zA-Z0-9.-]+$/.test(host)) throw new Error('Roku host must be a hostname or IP address.')
  if (host.length > 253) throw new Error('Roku host is too long.')
  return host
}

export function assertRokuKey(key: string): RokuKeypress {
  if (!ALLOWED_KEYS.has(key as RokuKeypress)) throw new Error(`Unsupported Roku key: ${key}`)
  return key as RokuKeypress
}

export async function getRokuDeviceInfo(hostInput: string, options: RokuRequestOptions = {}): Promise<RokuDeviceInfo> {
  const host = sanitizeRokuHost(hostInput)
  const raw = await rokuRequest(host, 'GET', '/query/device-info', options)
  return {
    friendlyName: xmlText(raw, 'friendly-device-name') ?? xmlText(raw, 'user-device-name'),
    modelName: xmlText(raw, 'model-name'),
    modelNumber: xmlText(raw, 'model-number'),
    serialNumber: xmlText(raw, 'serial-number'),
    softwareVersion: xmlText(raw, 'software-version'),
    raw,
  }
}

export async function sendRokuKeypress(hostInput: string, keyInput: string, options: RokuRequestOptions = {}): Promise<void> {
  const host = sanitizeRokuHost(hostInput)
  const key = assertRokuKey(keyInput)
  await rokuRequest(host, 'POST', `/keypress/${encodeURIComponent(key)}`, options)
}

async function rokuRequest(host: string, method: 'GET' | 'POST', path: string, options: RokuRequestOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = request({ host, port: options.port ?? ROKU_PORT, path, method, timeout: 2500 }, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Roku returned HTTP ${res.statusCode ?? 'unknown'}`))
          return
        }
        resolve(body)
      })
    })
    req.on('timeout', () => req.destroy(new Error('Roku request timed out. Check IP address and same Wi-Fi/LAN.')))
    req.on('error', reject)
    req.end()
  })
}

function xmlText(xml: string, tag: string): string | undefined {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = xml.match(new RegExp(`<${escapedTag}>([^<]*)</${escapedTag}>`, 'i'))
  return match?.[1]?.trim()
}
