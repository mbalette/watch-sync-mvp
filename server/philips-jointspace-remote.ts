import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { sanitizeLanHost } from './tv-remote-utils'

export type PhilipsJointSpaceKey = 'PlayPause' | 'Pause'

export interface PhilipsJointSpaceOptions {
  url?: string
  apiVersion?: number
  timeoutMs?: number
}

const ALLOWED_KEYS = new Set<PhilipsJointSpaceKey>(['PlayPause', 'Pause'])

export function assertPhilipsJointSpaceKey(key: string): PhilipsJointSpaceKey {
  if (ALLOWED_KEYS.has(key as PhilipsJointSpaceKey)) return key as PhilipsJointSpaceKey
  throw new Error(`Unsupported Philips JointSpace key: ${key}`)
}

export function philipsJointSpaceBaseUrl(hostInput: string, options: PhilipsJointSpaceOptions = {}): string {
  if (options.url) {
    const parsed = new URL(options.url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('Philips JointSpace URL must use http:// or https://.')
    return parsed.toString().replace(/\/$/, '')
  }
  return `http://${sanitizeLanHost(hostInput)}:1925`
}

export async function sendPhilipsJointSpaceKey(hostInput: string, keyInput: string, options: PhilipsJointSpaceOptions = {}): Promise<void> {
  const key = assertPhilipsJointSpaceKey(keyInput)
  const apiVersion = options.apiVersion ?? 6
  if (!Number.isInteger(apiVersion) || apiVersion < 1 || apiVersion > 99) throw new Error('Philips JointSpace API version must be an integer between 1 and 99.')
  await jsonPost(`${philipsJointSpaceBaseUrl(hostInput, options)}/${apiVersion}/input/key`, { key }, options.timeoutMs)
}

async function jsonPost(urlString: string, body: unknown, timeoutMs = 3000): Promise<void> {
  const url = new URL(urlString)
  const transport = url.protocol === 'https:' ? httpsRequest : httpRequest
  const payload = JSON.stringify(body)
  await new Promise<void>((resolve, reject) => {
    const req = transport({
      hostname: url.hostname,
      port: url.port ? Number(url.port) : undefined,
      path: `${url.pathname}${url.search}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Content-Length': Buffer.byteLength(payload) },
      timeout: timeoutMs,
      rejectUnauthorized: false,
    }, (res) => {
      res.resume()
      res.on('end', () => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Philips JointSpace returned HTTP ${res.statusCode ?? 'unknown'}`))
          return
        }
        resolve()
      })
    })
    req.on('timeout', () => req.destroy(new Error('Philips JointSpace request timed out.')))
    req.on('error', reject)
    req.end(payload)
  })
}
