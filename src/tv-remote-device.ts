export type LinkedTvPlatform =
  | 'roku'
  | 'lg_webos'
  | 'samsung'
  | 'android_adb'
  | 'sony_bravia'
  | 'philips_jointspace'
  | 'vizio_smartcast'
  | 'home_assistant_webhook'
  | 'apple_tv_manual'

export type PublicClaimLevel = 'supported' | 'beta' | 'advanced' | 'manual-only'
export type PlatformStatusLabel = 'Supported' | 'Beta' | 'Advanced setup' | 'Manual-only'

export interface RemoteStartCapability {
  canTestConnection: boolean
  canSendPlay: boolean
  canSendPause: boolean
  canAutoPlayAtGo: boolean
  requiresLocalHelper: boolean
  requiresPairing: boolean
  requiresAdvancedSetup: boolean
  hardwareValidated: boolean
  publicClaimLevel: PublicClaimLevel
  safeGoCommand?: string
  manualFallbackRequired: true
}

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
  useRemoteStartAtGo: boolean
}

export interface HelperRequestSpec {
  path: string
  method: 'GET' | 'POST'
  body?: Record<string, unknown>
  unsafeReason?: string
}

export const LINKED_TV_DEVICE_KEY = 'watch-sync.linkedTvDevice.v1'

const REMOTE_START_CAPABILITIES: Record<LinkedTvPlatform, RemoteStartCapability> = {
  roku: {
    canTestConnection: true,
    canSendPlay: true,
    canSendPause: false,
    canAutoPlayAtGo: true,
    requiresLocalHelper: true,
    requiresPairing: false,
    requiresAdvancedSetup: false,
    hardwareValidated: false,
    publicClaimLevel: 'supported',
    safeGoCommand: 'Play',
    manualFallbackRequired: true,
  },
  lg_webos: {
    canTestConnection: true,
    canSendPlay: true,
    canSendPause: true,
    canAutoPlayAtGo: true,
    requiresLocalHelper: true,
    requiresPairing: true,
    requiresAdvancedSetup: false,
    hardwareValidated: false,
    publicClaimLevel: 'beta',
    safeGoCommand: 'ssap://media.controls/play',
    manualFallbackRequired: true,
  },
  samsung: {
    canTestConnection: true,
    canSendPlay: true,
    canSendPause: true,
    canAutoPlayAtGo: true,
    requiresLocalHelper: true,
    requiresPairing: true,
    requiresAdvancedSetup: false,
    hardwareValidated: false,
    publicClaimLevel: 'beta',
    safeGoCommand: 'KEY_PLAY',
    manualFallbackRequired: true,
  },
  android_adb: {
    canTestConnection: true,
    canSendPlay: true,
    canSendPause: true,
    canAutoPlayAtGo: true,
    requiresLocalHelper: true,
    requiresPairing: true,
    requiresAdvancedSetup: true,
    hardwareValidated: false,
    publicClaimLevel: 'advanced',
    safeGoCommand: 'KEYCODE_MEDIA_PLAY',
    manualFallbackRequired: true,
  },
  sony_bravia: {
    canTestConnection: true,
    canSendPlay: true,
    canSendPause: false,
    canAutoPlayAtGo: true,
    requiresLocalHelper: true,
    requiresPairing: true,
    requiresAdvancedSetup: false,
    hardwareValidated: false,
    publicClaimLevel: 'beta',
    safeGoCommand: 'IRCC Play code',
    manualFallbackRequired: true,
  },
  philips_jointspace: {
    canTestConnection: true,
    canSendPlay: true,
    canSendPause: false,
    canAutoPlayAtGo: false,
    requiresLocalHelper: true,
    requiresPairing: false,
    requiresAdvancedSetup: false,
    hardwareValidated: false,
    publicClaimLevel: 'beta',
    manualFallbackRequired: true,
  },
  vizio_smartcast: {
    canTestConnection: true,
    canSendPlay: true,
    canSendPause: true,
    canAutoPlayAtGo: true,
    requiresLocalHelper: true,
    requiresPairing: true,
    requiresAdvancedSetup: false,
    hardwareValidated: false,
    publicClaimLevel: 'beta',
    safeGoCommand: 'play',
    manualFallbackRequired: true,
  },
  home_assistant_webhook: {
    canTestConnection: true,
    canSendPlay: true,
    canSendPause: false,
    canAutoPlayAtGo: true,
    requiresLocalHelper: true,
    requiresPairing: false,
    requiresAdvancedSetup: true,
    hardwareValidated: false,
    publicClaimLevel: 'advanced',
    safeGoCommand: 'Home Assistant media_play automation',
    manualFallbackRequired: true,
  },
  apple_tv_manual: {
    canTestConnection: false,
    canSendPlay: false,
    canSendPause: false,
    canAutoPlayAtGo: false,
    requiresLocalHelper: false,
    requiresPairing: false,
    requiresAdvancedSetup: false,
    hardwareValidated: false,
    publicClaimLevel: 'manual-only',
    manualFallbackRequired: true,
  },
}

export const TV_PLATFORM_OPTIONS: Array<{ id: LinkedTvPlatform; label: string; status: PlatformStatusLabel; displayLabel?: string; helperLabel?: string; requiresSecret?: boolean }> = [
  { id: 'roku', label: 'Roku / Roku TV / local streaming device', status: 'Supported' },
  { id: 'lg_webos', label: 'LG webOS', status: 'Beta', requiresSecret: true },
  { id: 'samsung', label: 'Samsung / Tizen', status: 'Beta', requiresSecret: true },
  { id: 'android_adb', label: 'Fire TV / Android TV / Google TV ADB helper', displayLabel: 'Fire/Android/Google TV', helperLabel: 'ADB helper', status: 'Advanced setup' },
  { id: 'sony_bravia', label: 'Sony / Bravia', status: 'Beta', requiresSecret: true },
  { id: 'philips_jointspace', label: 'Philips JointSpace', status: 'Beta' },
  { id: 'vizio_smartcast', label: 'Vizio SmartCast', status: 'Beta', requiresSecret: true },
  { id: 'home_assistant_webhook', label: 'Home Assistant advanced bridge', status: 'Advanced setup' },
  { id: 'apple_tv_manual', label: 'Apple TV', status: 'Manual-only' },
]

export function getRemoteStartCapability(platform: LinkedTvPlatform): RemoteStartCapability {
  return REMOTE_START_CAPABILITIES[platform]
}

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
    useRemoteStartAtGo: device.useRemoteStartAtGo === true,
  }
}

export function canUseRemoteStartAtGo(deviceInput: LinkedTvDevice): boolean {
  const device = normalizeLinkedTvDevice(deviceInput)
  const capability = getRemoteStartCapability(device.platform)
  if (!device.useRemoteStartAtGo || !capability.canAutoPlayAtGo || !capability.safeGoCommand) return false
  if (buildDevicePlayRequest(device).unsafeReason) return false
  return true
}

export function buildDeviceTestRequest(deviceInput: LinkedTvDevice): HelperRequestSpec {
  const device = normalizeLinkedTvDevice(deviceInput)
  if (!getRemoteStartCapability(device.platform).canTestConnection) return unsafe(`${device.label} is manual-only. Use the manual countdown fallback.`)
  if (device.platform === 'home_assistant_webhook') return buildHomeAssistantWebhookRequest(device, true)
  if (device.platform === 'apple_tv_manual') return unsafe('Apple TV is manual-only. Watch Sync does not claim direct Apple TV remote control.')
  requireHost(device)
  switch (device.platform) {
    case 'roku':
      return { path: `/roku/device-info?host=${encodeURIComponent(device.host)}`, method: 'GET' }
    case 'lg_webos':
      return { path: '/lg-webos/pair', method: 'POST', body: compactBody({ host: device.host, url: device.url, clientKey: device.clientKey }) }
    case 'samsung':
      return { path: '/samsung/pair', method: 'POST', body: compactBody({ host: device.host, url: device.url, token: device.token }) }
    case 'android_adb':
      return { path: '/adb/connect', method: 'POST', body: { host: device.host } }
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
  const capability = getRemoteStartCapability(device.platform)
  if (!capability.canSendPlay) return unsafe(`${device.label} is manual-only. Watch Sync will not send remote commands.`)
  if (device.platform === 'home_assistant_webhook') return buildHomeAssistantWebhookRequest(device, false)
  if (device.platform === 'apple_tv_manual') return unsafe('Apple TV is manual-only. Watch Sync does not claim direct Apple TV remote control.')
  requireHost(device)
  switch (device.platform) {
    case 'roku':
      return { path: '/roku/keypress', method: 'POST', body: { host: device.host, key: 'Play' } }
    case 'lg_webos':
      if (!device.clientKey) return unsafe('LG webOS needs a paired client key before GO can send Play.')
      return { path: '/lg-webos/media', method: 'POST', body: compactBody({ host: device.host, url: device.url, clientKey: device.clientKey, command: 'play' }) }
    case 'samsung':
      return { path: '/samsung/keypress', method: 'POST', body: compactBody({ host: device.host, url: device.url, token: device.token, key: 'KEY_PLAY' }) }
    case 'android_adb':
      return { path: '/adb/media-key', method: 'POST', body: { host: device.host, key: 'KEYCODE_MEDIA_PLAY' } }
    case 'sony_bravia':
      if (!device.irccCode) return unsafe('Sony Bravia needs a Play IRCC code from remote-controller-info before GO can send Play.')
      return { path: '/sony/ircc', method: 'POST', body: compactBody({ host: device.host, url: device.url, psk: device.psk, irccCode: device.irccCode }) }
    case 'philips_jointspace':
      return unsafe('Philips JointSpace PlayPause is a risky toggle, so GO will not send it automatically. Use manual countdown.')
    case 'vizio_smartcast':
      return { path: '/vizio/key', method: 'POST', body: compactBody({ host: device.host, url: device.url, authToken: device.authToken, key: 'play' }) }
  }
}

export function buildDevicePauseRequest(deviceInput: LinkedTvDevice): HelperRequestSpec {
  const device = normalizeLinkedTvDevice(deviceInput)
  const capability = getRemoteStartCapability(device.platform)
  if (!capability.canSendPause) {
    if (device.platform === 'roku') return unsafe('Roku Pause is not claimed safe for this Remote Start panel. Pause manually at the sync point.')
    if (device.platform === 'philips_jointspace') return unsafe('Philips pause uses a PlayPause toggle-risk path, so Watch Sync does not expose it as safe pause.')
    return unsafe(`${device.label} is manual-only or does not have a safe Pause command. Pause manually at the sync point.`)
  }
  requireHost(device)
  switch (device.platform) {
    case 'lg_webos':
      if (!device.clientKey) return unsafe('LG webOS needs a paired client key before sending Pause.')
      return { path: '/lg-webos/media', method: 'POST', body: compactBody({ host: device.host, url: device.url, clientKey: device.clientKey, command: 'pause' }) }
    case 'samsung':
      return { path: '/samsung/keypress', method: 'POST', body: compactBody({ host: device.host, url: device.url, token: device.token, key: 'KEY_PAUSE' }) }
    case 'android_adb':
      return { path: '/adb/media-key', method: 'POST', body: { host: device.host, key: 'KEYCODE_MEDIA_PAUSE' } }
    case 'vizio_smartcast':
      return { path: '/vizio/key', method: 'POST', body: compactBody({ host: device.host, url: device.url, authToken: device.authToken, key: 'pause' }) }
    case 'roku':
    case 'sony_bravia':
    case 'philips_jointspace':
    case 'home_assistant_webhook':
    case 'apple_tv_manual':
      return unsafe('No safe Pause command is available for this platform.')
  }
}

export function platformNeedsPairing(platform: LinkedTvPlatform): boolean {
  return getRemoteStartCapability(platform).requiresPairing && platform !== 'android_adb'
}

export function platformNeedsSonyIrcc(platform: LinkedTvPlatform): boolean {
  return platform === 'sony_bravia'
}

export function platformNeedsHost(platform: LinkedTvPlatform): boolean {
  return platform !== 'home_assistant_webhook' && platform !== 'apple_tv_manual'
}

function isLinkedTvPlatform(value: unknown): value is LinkedTvPlatform {
  return typeof value === 'string' && TV_PLATFORM_OPTIONS.some((option) => option.id === value)
}

function requireHost(device: LinkedTvDevice): void {
  if (!device.host.trim()) throw new Error('Enter a TV IP address or hostname first.')
}

function buildHomeAssistantWebhookRequest(device: LinkedTvDevice, test: boolean): HelperRequestSpec {
  if (!device.webhookUrl) {
    return unsafe('Enter a Home Assistant webhook URL first. Manual countdown still works.')
  }
  return {
    path: '/home-assistant/webhook',
    method: 'POST',
    body: compactBody({ webhookUrl: device.webhookUrl, test: test ? true : undefined }),
  }
}

function unsafe(unsafeReason: string): HelperRequestSpec {
  return { path: '', method: 'POST', unsafeReason }
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
