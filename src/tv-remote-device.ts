export type LinkedTvPlatform = 'roku' | 'lg_webos' | 'samsung' | 'sony_bravia' | 'philips_jointspace' | 'vizio_smartcast' | 'home_assistant_webhook'

export interface LinkedTvDevice {
  platform: LinkedTvPlatform
  label: string
  host: string
  url?: string
  webhookUrl?: string
  helperUrl: string
  clientKey?: string
  token?: string
  psk?: string
  irccCode?: string
  apiVersion?: number
  authToken?: string
  lastTestedAt?: string
}

export interface HelperRequestSpec {
  path: string
  method: 'GET' | 'POST'
  body?: Record<string, unknown>
  unsafeReason?: string
}

export const LINKED_TV_DEVICE_KEY = 'watch-sync.linkedTvDevice.v1'

export const TV_PLATFORM_OPTIONS: Array<{ id: LinkedTvPlatform; label: string; status: string; requiresSecret?: boolean }> = [
  { id: 'roku', label: 'Roku / Roku TV', status: 'Live helper' },
  { id: 'lg_webos', label: 'LG webOS', status: 'Experimental helper', requiresSecret: true },
  { id: 'samsung', label: 'Samsung / Tizen', status: 'Beta helper', requiresSecret: true },
  { id: 'sony_bravia', label: 'Sony / Bravia', status: 'Beta helper', requiresSecret: true },
  { id: 'philips_jointspace', label: 'Philips JointSpace', status: 'Experimental helper' },
  { id: 'vizio_smartcast', label: 'Vizio SmartCast', status: 'Experimental helper', requiresSecret: true },
  { id: 'home_assistant_webhook', label: 'Home Assistant webhook', status: 'Advanced local bridge' },
]

export function loadLinkedTvDevice(storage: Storage = localStorage): LinkedTvDevice | null {
  const raw = storage.getItem(LINKED_TV_DEVICE_KEY)
  if (!raw) return null
  try {
    return normalizeLinkedTvDevice(JSON.parse(raw) as Partial<LinkedTvDevice>)
  } catch {
    return null
  }
}

export function saveLinkedTvDevice(device: LinkedTvDevice, storage: Storage = localStorage): void {
  storage.setItem(LINKED_TV_DEVICE_KEY, JSON.stringify(normalizeLinkedTvDevice(device)))
}

export function normalizeLinkedTvDevice(device: Partial<LinkedTvDevice>): LinkedTvDevice {
  const platform = isLinkedTvPlatform(device.platform) ? device.platform : 'roku'
  return {
    platform,
    label: trimOr(device.label, TV_PLATFORM_OPTIONS.find((option) => option.id === platform)?.label ?? 'Linked TV'),
    host: trimOr(device.host, ''),
    helperUrl: trimOr(device.helperUrl, 'http://127.0.0.1:8790'),
    url: optionalTrim(device.url),
    webhookUrl: optionalTrim(device.webhookUrl),
    clientKey: optionalTrim(device.clientKey),
    token: optionalTrim(device.token),
    psk: optionalTrim(device.psk),
    irccCode: optionalTrim(device.irccCode),
    apiVersion: typeof device.apiVersion === 'number' && Number.isFinite(device.apiVersion) ? device.apiVersion : undefined,
    authToken: optionalTrim(device.authToken),
    lastTestedAt: optionalTrim(device.lastTestedAt),
  }
}

export function buildDeviceTestRequest(deviceInput: LinkedTvDevice): HelperRequestSpec {
  const device = normalizeLinkedTvDevice(deviceInput)
  if (device.platform === 'home_assistant_webhook') return buildHomeAssistantWebhookRequest(device, true)
  requireHost(device)
  switch (device.platform) {
    case 'roku':
      return { path: `/roku/device-info?host=${encodeURIComponent(device.host)}`, method: 'GET' }
    case 'lg_webos':
      return { path: '/lg-webos/pair', method: 'POST', body: compactBody({ host: device.host, url: device.url, clientKey: device.clientKey }) }
    case 'samsung':
      return { path: '/samsung/pair', method: 'POST', body: compactBody({ host: device.host, url: device.url, token: device.token }) }
    case 'sony_bravia':
      return { path: '/sony/remote-controller-info', method: 'POST', body: compactBody({ host: device.host, url: device.url, psk: device.psk }) }
    case 'philips_jointspace':
      return { path: '/philips/key', method: 'POST', body: compactBody({ host: device.host, url: device.url, apiVersion: device.apiVersion, key: 'Pause' }) }
    case 'vizio_smartcast':
      return { path: '/vizio/key', method: 'POST', body: compactBody({ host: device.host, url: device.url, authToken: device.authToken, key: 'pause' }) }
  }
}

export function buildDevicePlayRequest(deviceInput: LinkedTvDevice): HelperRequestSpec {
  const device = normalizeLinkedTvDevice(deviceInput)
  if (device.platform === 'home_assistant_webhook') return buildHomeAssistantWebhookRequest(device, false)
  requireHost(device)
  switch (device.platform) {
    case 'roku':
      return { path: '/roku/keypress', method: 'POST', body: { host: device.host, key: 'Play' } }
    case 'lg_webos':
      if (!device.clientKey) return { path: '', method: 'POST', unsafeReason: 'LG webOS needs a paired client key before GO can send Play.' }
      return { path: '/lg-webos/media', method: 'POST', body: compactBody({ host: device.host, url: device.url, clientKey: device.clientKey, command: 'play' }) }
    case 'samsung':
      return { path: '/samsung/keypress', method: 'POST', body: compactBody({ host: device.host, url: device.url, token: device.token, key: 'KEY_PLAY' }) }
    case 'sony_bravia':
      if (!device.irccCode) return { path: '', method: 'POST', unsafeReason: 'Sony Bravia needs a Play IRCC code from remote-controller-info before GO can send Play.' }
      return { path: '/sony/ircc', method: 'POST', body: compactBody({ host: device.host, url: device.url, psk: device.psk, irccCode: device.irccCode }) }
    case 'philips_jointspace':
      return { path: '', method: 'POST', unsafeReason: 'Philips JointSpace PlayPause is a risky toggle, so GO will not send it automatically. Use manual countdown.' }
    case 'vizio_smartcast':
      return { path: '/vizio/key', method: 'POST', body: compactBody({ host: device.host, url: device.url, authToken: device.authToken, key: 'play' }) }
  }
}

export function platformNeedsPairing(platform: LinkedTvPlatform): boolean {
  return platform === 'lg_webos' || platform === 'samsung' || platform === 'vizio_smartcast'
}

export function platformNeedsSonyIrcc(platform: LinkedTvPlatform): boolean {
  return platform === 'sony_bravia'
}

function isLinkedTvPlatform(value: unknown): value is LinkedTvPlatform {
  return typeof value === 'string' && TV_PLATFORM_OPTIONS.some((option) => option.id === value)
}

function requireHost(device: LinkedTvDevice): void {
  if (!device.host.trim()) throw new Error('Enter a TV IP address or hostname first.')
}

function buildHomeAssistantWebhookRequest(device: LinkedTvDevice, test: boolean): HelperRequestSpec {
  if (!device.webhookUrl) {
    return { path: '', method: 'POST', unsafeReason: 'Enter a Home Assistant webhook URL first. Manual countdown still works.' }
  }
  return {
    path: '/home-assistant/webhook',
    method: 'POST',
    body: compactBody({ webhookUrl: device.webhookUrl, test: test ? true : undefined }),
  }
}

function compactBody(body: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined && value !== ''))
}

function optionalTrim(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function trimOr(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}
