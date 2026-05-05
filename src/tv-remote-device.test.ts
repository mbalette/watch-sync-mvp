import { describe, expect, it } from 'vitest'
import { buildDevicePlayRequest, buildDeviceTestRequest, normalizeLinkedTvDevice } from './tv-remote-device'

describe('linked TV device helper routing', () => {
  it('builds Roku and Samsung GO play requests', () => {
    expect(buildDevicePlayRequest(normalizeLinkedTvDevice({ platform: 'roku', host: '192.168.1.2' }))).toEqual({ path: '/roku/keypress', method: 'POST', body: { host: '192.168.1.2', key: 'Play' } })
    expect(buildDevicePlayRequest(normalizeLinkedTvDevice({ platform: 'samsung', host: '192.168.1.3', token: 'tok' }))).toEqual({ path: '/samsung/keypress', method: 'POST', body: { host: '192.168.1.3', token: 'tok', key: 'KEY_PLAY' } })
  })

  it('requires pairing/code for LG and Sony GO commands', () => {
    expect(buildDevicePlayRequest(normalizeLinkedTvDevice({ platform: 'lg_webos', host: '192.168.1.4' })).unsafeReason).toMatch(/client key/)
    expect(buildDevicePlayRequest(normalizeLinkedTvDevice({ platform: 'sony_bravia', host: '192.168.1.5' })).unsafeReason).toMatch(/IRCC/)
    expect(buildDevicePlayRequest(normalizeLinkedTvDevice({ platform: 'philips_jointspace', host: '192.168.1.6' })).unsafeReason).toMatch(/risky toggle/)
  })

  it('builds platform-specific test requests', () => {
    expect(buildDeviceTestRequest(normalizeLinkedTvDevice({ platform: 'lg_webos', host: 'tv.local', url: 'ws://tv.local:3000' }))).toEqual({ path: '/lg-webos/pair', method: 'POST', body: { host: 'tv.local', url: 'ws://tv.local:3000' } })
    expect(buildDeviceTestRequest(normalizeLinkedTvDevice({ platform: 'sony_bravia', host: 'sony.local', psk: '1234' }))).toEqual({ path: '/sony/remote-controller-info', method: 'POST', body: { host: 'sony.local', psk: '1234' } })
  })
})
