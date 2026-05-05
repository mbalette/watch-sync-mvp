export type AdbMediaKey = 'KEYCODE_MEDIA_PLAY' | 'KEYCODE_MEDIA_PAUSE'

const ALLOWED_ADB_MEDIA_KEYS = new Set<AdbMediaKey>(['KEYCODE_MEDIA_PLAY', 'KEYCODE_MEDIA_PAUSE'])

export function assertAdbMediaKey(key: string): AdbMediaKey {
  if (ALLOWED_ADB_MEDIA_KEYS.has(key as AdbMediaKey)) return key as AdbMediaKey
  throw new Error(`Unsupported ADB media key: ${key}`)
}

export function adbConnectArgs(hostInput: string): string[] {
  const host = sanitizeAdbHost(hostInput)
  return ['connect', host]
}

export function adbMediaKeyArgs(keyInput: string): string[] {
  const key = assertAdbMediaKey(keyInput)
  return ['shell', 'input', 'keyevent', key]
}

export function adbPlayArgs(): string[] {
  return adbMediaKeyArgs('KEYCODE_MEDIA_PLAY')
}

function sanitizeAdbHost(input: string): string {
  const host = input.trim()
  if (!/^[a-zA-Z0-9.:-]+$/.test(host)) throw new Error('ADB host must be a host[:port] value without shell metacharacters.')
  if (host.length === 0) throw new Error('ADB host is required.')
  if (host.length > 253) throw new Error('ADB host is too long.')
  return host
}
