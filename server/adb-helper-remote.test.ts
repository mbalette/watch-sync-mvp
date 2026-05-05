import { describe, expect, it } from 'vitest'
import { adbConnectArgs, adbMediaKeyArgs, adbMediaKeyForDeviceArgs, adbPauseArgs, adbPlayArgs, assertAdbMediaKey } from './adb-helper-remote'

describe('ADB helper command builder', () => {
  it('builds argv arrays instead of shell strings', () => {
    expect(adbConnectArgs('192.168.1.55:5555')).toEqual(['connect', '192.168.1.55:5555'])
    expect(adbPlayArgs()).toEqual(['shell', 'input', 'keyevent', 'KEYCODE_MEDIA_PLAY'])
    expect(adbPauseArgs()).toEqual(['shell', 'input', 'keyevent', 'KEYCODE_MEDIA_PAUSE'])
    expect(adbMediaKeyArgs('KEYCODE_MEDIA_PAUSE')).toEqual(['shell', 'input', 'keyevent', 'KEYCODE_MEDIA_PAUSE'])
    expect(adbMediaKeyForDeviceArgs('192.168.1.55:5555', 'KEYCODE_MEDIA_PLAY')).toEqual(['-s', '192.168.1.55:5555', 'shell', 'input', 'keyevent', 'KEYCODE_MEDIA_PLAY'])
  })

  it('rejects toggle and shell injection inputs', () => {
    expect(() => assertAdbMediaKey('KEYCODE_MEDIA_PLAY_PAUSE')).toThrow(/Unsupported ADB media key/)
    expect(() => adbConnectArgs('192.168.1.55; rm -rf /')).toThrow(/without shell metacharacters/)
  })
})
