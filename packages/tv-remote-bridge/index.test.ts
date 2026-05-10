import { describe, expect, it, vi } from 'vitest';
import { canArmPlayCommand, playCommandIdempotencyKey } from '../countdown-core/playCommandPolicy';
import { createWebManualOnlyTVRemote } from './index';

describe('TVRemote bridge web fallback', () => {
  it('never calls fetch or LAN endpoints on web fallback', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const remote = createWebManualOnlyTVRemote();

    expect(await remote.getPermissionState()).toEqual({ localNetwork: 'not_required' });
    expect(await remote.discoverDevices()).toEqual([
      { id: 'manual-countdown', protocol: 'manual', displayName: 'Manual countdown', requiresPairing: false, capabilities: [] },
    ]);
    expect(await remote.testPlay('roku-lab')).toMatchObject({
      ok: false,
      protocol: 'manual',
      command: 'play',
      errorCode: 'AUTO_PLAY_UNAVAILABLE_ON_WEB',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sanitizes manual host input and rejects URLs/credentials', async () => {
    const remote = createWebManualOnlyTVRemote();
    await expect(remote.addManualDevice({ protocol: 'roku-ecp', host: '192.168.1.23', port: 8060 })).resolves.toMatchObject({
      id: 'roku-ecp:192.168.1.23:8060',
      host: '192.168.1.23',
      port: 8060,
    });
    await expect(remote.addManualDevice({ protocol: 'roku-ecp', host: 'http://192.168.1.23:8060/keypress/Play' })).rejects.toThrow(/not a URL/);
    await expect(remote.addManualDevice({ protocol: 'roku-ecp', host: 'user:pass@192.168.1.23' })).rejects.toThrow(/credentials/);
  });
});

describe('countdown play command policy', () => {
  it('requires validated devices and protocol flags before arming', () => {
    expect(canArmPlayCommand({ countdownId: 'c1', device: { id: 'd1', validated: false, protocolAllowed: true }, nowMonotonicMs: 1 })).toMatchObject({ ok: false, errorCode: 'DEVICE_NOT_VALIDATED' });
    expect(canArmPlayCommand({ countdownId: 'c1', device: { id: 'd1', validated: true, protocolAllowed: false }, nowMonotonicMs: 1 })).toMatchObject({ ok: false, errorCode: 'PROTOCOL_NOT_ALLOWED' });
  });

  it('blocks duplicate Play commands for the same countdown/device', () => {
    const key = playCommandIdempotencyKey('countdown-1', 'roku-1');
    expect(key).toBe('countdown-1:roku-1:play');
    expect(canArmPlayCommand({ countdownId: 'countdown-1', device: { id: 'roku-1', validated: true, protocolAllowed: true }, nowMonotonicMs: 1, firedKeys: new Set([key]) })).toMatchObject({ ok: false, errorCode: 'PLAY_ALREADY_SENT' });
    expect(canArmPlayCommand({ countdownId: 'countdown-1', device: { id: 'roku-1', validated: true, protocolAllowed: true }, nowMonotonicMs: 1 })).toEqual({ ok: true, key });
  });
});
