import { describe, expect, it } from 'vitest'
import { TV_REMOTE_TARGETS, getTvRemoteTarget, helperAdvertisedTargets, safeGoCommand, uiVisibleTargets } from './tv-remote-targets'

describe('TV remote target metadata', () => {
  it('advertises implemented helper targets without marking hardware validation complete', () => {
    expect(helperAdvertisedTargets()).toEqual(['roku-ecp', 'lg-webos-experimental', 'samsung-tizen-beta', 'adb-helper-advanced', 'sony-bravia-beta', 'philips-jointspace-experimental', 'vizio-smartcast-experimental'])
    expect(getTvRemoteTarget('roku-ecp')).toMatchObject({ implementedInHelper: true, hardwareValidated: false })
    expect(getTvRemoteTarget('lg-webos-experimental')).toMatchObject({ implementedInHelper: true, hardwareValidated: false })
    expect(getTvRemoteTarget('samsung-tizen-beta')).toMatchObject({ implementedInHelper: true, hardwareValidated: false })
    expect(getTvRemoteTarget('adb-helper-advanced')).toMatchObject({ implementedInHelper: true, hardwareValidated: false, priority: 'advanced-helper' })
    expect(getTvRemoteTarget('adb-helper-advanced').exactProtocol).toContain('KEYCODE_MEDIA_PLAY (126)')
    expect(getTvRemoteTarget('adb-helper-advanced').exactProtocol).toContain('KEYCODE_MEDIA_PAUSE (127)')
    expect(getTvRemoteTarget('adb-helper-advanced').exactProtocol).toContain('Do not use KEYCODE_MEDIA_PLAY_PAUSE/85 for GO')
    expect(getTvRemoteTarget('sony-bravia-beta')).toMatchObject({ implementedInHelper: true, hardwareValidated: false })
    expect(getTvRemoteTarget('philips-jointspace-experimental')).toMatchObject({ implementedInHelper: true, hardwareValidated: false })
    expect(getTvRemoteTarget('vizio-smartcast-experimental')).toMatchObject({ implementedInHelper: true, hardwareValidated: false })
  })

  it('does not expose risky toggle commands as safe countdown GO commands', () => {
    expect(safeGoCommand('roku-ecp')?.command).toBe('POST /keypress/Play')
    expect(safeGoCommand('philips-jointspace-experimental')).toBeUndefined()
    expect(safeGoCommand('adb-helper-advanced')?.riskyToggle).not.toBe(true)
  })

  it('classifies Samsung and Vizio as unofficial beta/experimental targets', () => {
    expect(getTvRemoteTarget('samsung-tizen-beta')).toMatchObject({ protocolStatus: 'unofficial', priority: 'beta', hardwareValidated: false })
    expect(getTvRemoteTarget('vizio-smartcast-experimental')).toMatchObject({ protocolStatus: 'unofficial', priority: 'beta', hardwareValidated: false })
  })

  it('keeps Apple TV manual-only and not UI-visible as remote support', () => {
    expect(getTvRemoteTarget('apple-tv-manual-only')).toMatchObject({ priority: 'manual-only', implementedInHelper: false })
    expect(uiVisibleTargets().map((target) => target.id)).not.toContain('apple-tv-manual-only')
  })

  it('tracks all major requested platform families', () => {
    expect(TV_REMOTE_TARGETS.map((target) => target.id)).toEqual([
      'roku-ecp',
      'lg-webos-experimental',
      'samsung-tizen-beta',
      'cast-session',
      'adb-helper-advanced',
      'sony-bravia-beta',
      'philips-jointspace-experimental',
      'vizio-smartcast-experimental',
      'vidaa-remotenow-research',
      'apple-tv-manual-only',
    ])
  })
})
