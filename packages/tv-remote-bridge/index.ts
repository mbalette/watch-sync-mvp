import { Capacitor, registerPlugin } from '@capacitor/core';
import type {
  ArmPlayInput,
  ArmPlayResult,
  CommandResult,
  DeviceCandidate,
  PairedDevice,
  PairingResult,
  TVProtocol,
  TVRemoteBridge,
} from './types';

export * from './types';

const NATIVE_APP_REQUIRED = 'NATIVE_APP_REQUIRED';
const AUTO_PLAY_UNAVAILABLE_ON_WEB = 'AUTO_PLAY_UNAVAILABLE_ON_WEB';

function unavailableCommand(): CommandResult {
  return {
    ok: false,
    protocol: 'manual',
    command: 'play',
    sentAtMonotonicMs: monotonicNow(),
    errorCode: AUTO_PLAY_UNAVAILABLE_ON_WEB,
    errorMessage: 'Auto Play needs the installed 321 Play app. Manual countdown remains available on web.',
  };
}

function monotonicNow(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function normalizeHost(host: string): string {
  const trimmed = host.trim();
  if (!trimmed) throw new Error('TV host/IP is required.');
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) throw new Error('Enter only a host/IP, not a URL.');
  if (trimmed.includes('/') || trimmed.includes('@') || trimmed.includes('?') || trimmed.includes('#')) {
    throw new Error('TV host/IP must not include paths, credentials, or query strings.');
  }
  if (!/^[a-zA-Z0-9._:-]+$/.test(trimmed)) throw new Error('TV host/IP contains unsupported characters.');
  return trimmed;
}

class WebManualOnlyTVRemote implements TVRemoteBridge {
  async getPermissionState() {
    return { localNetwork: 'not_required' as const };
  }

  async requestPermissions() {
    return { localNetwork: 'not_required' as const };
  }

  async discoverDevices(): Promise<DeviceCandidate[]> {
    return [manualCandidate()];
  }

  async addManualDevice(input: { protocol: TVProtocol; host: string; port?: number }): Promise<DeviceCandidate> {
    if (input.protocol === 'manual') return manualCandidate();
    const host = normalizeHost(input.host);
    return {
      id: `${input.protocol}:${host}:${input.port ?? ''}`,
      protocol: input.protocol,
      displayName: `${input.protocol} device (${host})`,
      host,
      port: input.port,
      requiresPairing: input.protocol !== 'roku-ecp',
      capabilities: [],
    };
  }

  async pairDevice(): Promise<PairingResult> {
    return { ok: false, errorCode: NATIVE_APP_REQUIRED, errorMessage: 'Pairing local TVs requires the installed 321 Play app.' };
  }

  async listPairedDevices(): Promise<PairedDevice[]> {
    return [];
  }

  async removePairedDevice(): Promise<{ ok: boolean }> {
    return { ok: true };
  }

  async validateDevice(deviceId: string) {
    return { ok: false, deviceId, capabilities: [], errorCode: NATIVE_APP_REQUIRED, errorMessage: 'Device validation requires the installed 321 Play app.' };
  }

  async testPlay(): Promise<CommandResult> {
    return unavailableCommand();
  }

  async armPlay(input: ArmPlayInput): Promise<ArmPlayResult> {
    return {
      ok: false,
      deviceId: input.deviceId,
      countdownId: input.countdownId,
      armedForMonotonicMs: input.playAtMonotonicMs,
      errorCode: AUTO_PLAY_UNAVAILABLE_ON_WEB,
      errorMessage: 'Auto Play needs the installed 321 Play app. Press Play manually at PLAY on web.',
    };
  }

  async cancelArmedPlay(): Promise<{ ok: boolean }> {
    return { ok: true };
  }

  async sendPlayNow(): Promise<CommandResult> {
    return unavailableCommand();
  }
}

function manualCandidate(): DeviceCandidate {
  return {
    id: 'manual-countdown',
    protocol: 'manual',
    displayName: 'Manual countdown',
    requiresPairing: false,
    capabilities: [],
  };
}

const NativeTVRemote = registerPlugin<TVRemoteBridge>('TVRemote');

export const TVRemote: TVRemoteBridge = Capacitor.isNativePlatform()
  ? NativeTVRemote
  : new WebManualOnlyTVRemote();

export function createWebManualOnlyTVRemote(): TVRemoteBridge {
  return new WebManualOnlyTVRemote();
}
