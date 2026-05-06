import { describe, expect, it } from 'vitest'
import {
  TV_PLATFORM_OPTIONS,
  buildDevicePauseRequest,
  buildDevicePlayRequest,
  buildDeviceTestRequest,
  canUseRemoteStartAtGo,
  getRemoteStartCapability,
  getRemoteStartReadiness,
  getRemoteStartWizard,
  normalizeLinkedTvDevice,
} from './tv-remote-device'

describe('linked TV device helper routing', () => {
  it('normalizes Remote Start opt-in to false and always keeps manual fallback required', () => {
    const device = normalizeLinkedTvDevice({ platform: 'roku', host: '192.168.1.2' })

    expect(device.useRemoteStartAtGo).toBe(false)
    expect(getRemoteStartCapability('roku')).toMatchObject({
      canTestConnection: true,
      canSendPlay: true,
      canSendPause: false,
      canAutoPlayAtGo: true,
      publicClaimLevel: 'primary-beta',
      safeGoCommand: 'Play',
      manualFallbackRequired: true,
    })
  })

  it('exposes requested platform statuses including advanced and manual-only choices', () => {
    expect(TV_PLATFORM_OPTIONS.map((option) => [option.id, option.status])).toEqual([
      ['roku', 'Remote Start beta / primary'],
      ['lg_webos', 'Remote Start beta / primary'],
      ['samsung', 'Remote Start beta'],
      ['android_adb', 'Guided setup beta'],
      ['sony_bravia', 'Remote Start beta for supported Sony TVs'],
      ['philips_jointspace', 'Later beta'],
      ['vizio_smartcast', 'Later beta'],
      ['home_assistant_webhook', 'Not supported yet'],
      ['apple_tv_manual', 'Manual-only'],
    ])
  })


  it('provides device-specific guided setup wizard steps and actions', () => {
    expect(getRemoteStartWizard('roku')).toMatchObject({
      title: 'Roku / Roku TV setup',
      label: 'Remote Start beta / primary',
      primaryAction: 'Test Play',
      steps: expect.arrayContaining([
        expect.stringMatching(/same Wi-Fi/i),
        expect.stringMatching(/Control by mobile apps/i),
        expect.stringMatching(/Test Play/i),
      ]),
      safeGoCommand: 'Play only',
    })
    expect(getRemoteStartWizard('android_adb')).toMatchObject({
      title: 'Fire / Android / Google TV guided setup',
      label: 'Guided setup beta',
      primaryAction: 'Connect ADB + Test Play',
      steps: expect.arrayContaining([
        expect.stringMatching(/Developer Options/i),
        expect.stringMatching(/pairing code/i),
        expect.stringMatching(/Some devices may need reconnect/i),
      ]),
      safeGoCommand: 'KEYCODE_MEDIA_PLAY only',
    })
    expect(getRemoteStartWizard('apple_tv_manual')).toMatchObject({
      title: 'Apple TV',
      label: 'Manual-only',
      primaryAction: 'Use manual countdown',
      safeGoCommand: 'None',
    })
  })

  it('builds Roku and Samsung GO play requests', () => {
    expect(buildDevicePlayRequest(normalizeLinkedTvDevice({ platform: 'roku', host: '192.168.1.2' }))).toEqual({ path: '/roku/keypress', method: 'POST', body: { host: '192.168.1.2', key: 'Play' } })
    expect(buildDevicePlayRequest(normalizeLinkedTvDevice({ platform: 'samsung', host: '192.168.1.3', token: 'tok' }))).toEqual({ path: '/samsung/keypress', method: 'POST', body: { host: '192.168.1.3', token: 'tok', key: 'KEY_PLAY' } })
  })

  it('requires pairing/code for LG and Sony GO commands and blocks Philips toggle GO', () => {
    expect(buildDevicePlayRequest(normalizeLinkedTvDevice({ platform: 'lg_webos', host: '192.168.1.4' })).unsafeReason).toMatch(/client key/)
    expect(buildDevicePlayRequest(normalizeLinkedTvDevice({ platform: 'sony_bravia', host: '192.168.1.5' })).unsafeReason).toMatch(/IRCC/)
    expect(buildDevicePlayRequest(normalizeLinkedTvDevice({ platform: 'philips_jointspace', host: '192.168.1.6' })).unsafeReason).toMatch(/risky toggle/)
    expect(getRemoteStartCapability('philips_jointspace')).toMatchObject({ canAutoPlayAtGo: false })
    expect(getRemoteStartCapability('philips_jointspace').safeGoCommand).toBeUndefined()
  })

  it('keeps Apple TV manual-only with no direct commands', () => {
    const apple = normalizeLinkedTvDevice({ platform: 'apple_tv_manual', host: 'apple-tv.local', useRemoteStartAtGo: true })

    expect(getRemoteStartCapability('apple_tv_manual')).toMatchObject({
      canTestConnection: false,
      canSendPlay: false,
      canSendPause: false,
      canAutoPlayAtGo: false,
      publicClaimLevel: 'manual-only',
      manualFallbackRequired: true,
    })
    expect(buildDeviceTestRequest(apple).unsafeReason).toMatch(/manual-only/i)
    expect(buildDevicePlayRequest(apple).unsafeReason).toMatch(/manual-only/i)
    expect(buildDevicePauseRequest(apple).unsafeReason).toMatch(/manual-only/i)
    expect(canUseRemoteStartAtGo(apple)).toBe(false)
  })

  it('requires Remote Start GO opt-in and safe auto-play capability', () => {
    expect(canUseRemoteStartAtGo(normalizeLinkedTvDevice({ platform: 'roku', host: '192.168.1.2' }))).toBe(false)
    expect(canUseRemoteStartAtGo(normalizeLinkedTvDevice({ platform: 'roku', host: '192.168.1.2', useRemoteStartAtGo: true }))).toBe(true)
    expect(canUseRemoteStartAtGo(normalizeLinkedTvDevice({ platform: 'philips_jointspace', host: '192.168.1.6', useRemoteStartAtGo: true }))).toBe(false)
    expect(canUseRemoteStartAtGo(normalizeLinkedTvDevice({ platform: 'home_assistant_webhook', webhookUrl: 'http://ha.local/api/webhook/id', useRemoteStartAtGo: true }))).toBe(true)
  })

  it('builds platform-specific test requests', () => {
    expect(buildDeviceTestRequest(normalizeLinkedTvDevice({ platform: 'lg_webos', host: 'tv.local', url: 'ws://tv.local:3000' }))).toEqual({ path: '/lg-webos/pair', method: 'POST', body: { host: 'tv.local', url: 'ws://tv.local:3000' } })
    expect(buildDeviceTestRequest(normalizeLinkedTvDevice({ platform: 'sony_bravia', host: 'sony.local', psk: '1234' }))).toEqual({ path: '/sony/remote-controller-info', method: 'POST', body: { host: 'sony.local', psk: '1234' } })
  })

  it('builds safe pause requests only where the capability allows them', () => {
    expect(buildDevicePauseRequest(normalizeLinkedTvDevice({ platform: 'lg_webos', host: '192.168.1.4', clientKey: 'lg-key' }))).toEqual({ path: '/lg-webos/media', method: 'POST', body: { host: '192.168.1.4', clientKey: 'lg-key', command: 'pause' } })
    expect(buildDevicePauseRequest(normalizeLinkedTvDevice({ platform: 'samsung', host: '192.168.1.3' }))).toEqual({ path: '/samsung/keypress', method: 'POST', body: { host: '192.168.1.3', key: 'KEY_PAUSE' } })
    expect(buildDevicePauseRequest(normalizeLinkedTvDevice({ platform: 'roku', host: '192.168.1.2' })).unsafeReason).toMatch(/Pause is not claimed/i)
    expect(buildDevicePauseRequest(normalizeLinkedTvDevice({ platform: 'philips_jointspace', host: '192.168.1.6' })).unsafeReason).toMatch(/toggle-risk/i)
  })

  it('routes Android/Fire/Google TV ADB helper through discrete Play and Pause only', () => {
    const device = normalizeLinkedTvDevice({ platform: 'android_adb', host: '192.168.1.50:5555', useRemoteStartAtGo: true })

    expect(getRemoteStartCapability('android_adb')).toMatchObject({ requiresLocalHelper: true, requiresAdvancedSetup: true, publicClaimLevel: 'guided-setup-beta', safeGoCommand: 'KEYCODE_MEDIA_PLAY' })
    expect(buildDeviceTestRequest(device)).toEqual({ path: '/adb/connect', method: 'POST', body: { host: '192.168.1.50:5555' } })
    expect(buildDevicePlayRequest(device)).toEqual({ path: '/adb/media-key', method: 'POST', body: { host: '192.168.1.50:5555', key: 'KEYCODE_MEDIA_PLAY' } })
    expect(buildDevicePauseRequest(device)).toEqual({ path: '/adb/media-key', method: 'POST', body: { host: '192.168.1.50:5555', key: 'KEYCODE_MEDIA_PAUSE' } })
    expect(JSON.stringify(buildDevicePlayRequest(device))).not.toContain('KEYCODE_MEDIA_PLAY_PAUSE')
  })


  it('classifies Remote Start readiness without upgrading unvalidated hardware to supported', () => {
    expect(getRemoteStartReadiness(normalizeLinkedTvDevice({ platform: 'roku' }))).toMatchObject({
      state: 'not_configured',
      label: 'Needs setup',
    })
    expect(getRemoteStartReadiness(normalizeLinkedTvDevice({ platform: 'roku', host: '192.168.1.2' }))).toMatchObject({
      state: 'reconnect_needed',
      label: 'Reconnect needed',
    })
    expect(getRemoteStartReadiness(normalizeLinkedTvDevice({ platform: 'roku', host: '192.168.1.2', lastTestedAt: '2026-05-05T00:00:00.000Z' }))).toMatchObject({
      state: 'unverified_hardware_behavior',
      label: 'Device behavior not verified yet',
    })
    expect(getRemoteStartReadiness(normalizeLinkedTvDevice({ platform: 'apple_tv_manual' }))).toMatchObject({
      state: 'manual_tonight',
      label: 'Manual countdown tonight',
    })
  })

  it('routes Home Assistant webhook test and play through the local helper without requiring a host', () => {
    const device = normalizeLinkedTvDevice({ platform: 'home_assistant_webhook', webhookUrl: ' http://ha.local:8123/api/webhook/random-id ' })

    expect(device.host).toBe('')
    expect(device.webhookUrl).toBe('http://ha.local:8123/api/webhook/random-id')
    expect(buildDeviceTestRequest(device)).toEqual({
      path: '/home-assistant/webhook',
      method: 'POST',
      body: { webhookUrl: 'http://ha.local:8123/api/webhook/random-id', test: true },
    })
    expect(buildDevicePlayRequest(device)).toEqual({
      path: '/home-assistant/webhook',
      method: 'POST',
      body: { webhookUrl: 'http://ha.local:8123/api/webhook/random-id' },
    })
  })

  it('blocks Home Assistant webhook routing with a local config error when the webhook URL is missing', () => {
    const request = buildDevicePlayRequest(normalizeLinkedTvDevice({ platform: 'home_assistant_webhook' }))

    expect(request).toMatchObject({ path: '', method: 'POST' })
    expect(request.unsafeReason).toMatch(/Home Assistant webhook URL/i)
  })

  it('does not add Home Assistant token or entity fields to helper request bodies', () => {
    const request = buildDevicePlayRequest(normalizeLinkedTvDevice({
      platform: 'home_assistant_webhook',
      webhookUrl: 'https://ha.example/api/webhook/secret-id',
    }))

    expect(request.body).toEqual({ webhookUrl: 'https://ha.example/api/webhook/secret-id' })
    expect(request.body).not.toHaveProperty('token')
    expect(request.body).not.toHaveProperty('entityId')
    expect(request.body).not.toHaveProperty('authToken')
  })
})
