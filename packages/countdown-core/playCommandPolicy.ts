export interface PlayCommandPolicyDevice {
  id: string;
  validated: boolean;
  protocolAllowed: boolean;
}

export interface PlayCommandPolicyInput {
  countdownId: string;
  device: PlayCommandPolicyDevice;
  nowMonotonicMs: number;
  firedKeys?: ReadonlySet<string>;
}

export function playCommandIdempotencyKey(countdownId: string, deviceId: string): string {
  return `${countdownId}:${deviceId}:play`;
}

export function canArmPlayCommand(input: PlayCommandPolicyInput): { ok: true; key: string } | { ok: false; errorCode: string; errorMessage: string } {
  if (!input.countdownId.trim()) {
    return { ok: false, errorCode: 'COUNTDOWN_ID_REQUIRED', errorMessage: 'Countdown id is required before Auto Play can arm.' };
  }
  if (!input.device.id.trim()) {
    return { ok: false, errorCode: 'DEVICE_ID_REQUIRED', errorMessage: 'Device id is required before Auto Play can arm.' };
  }
  if (!input.device.protocolAllowed) {
    return { ok: false, errorCode: 'PROTOCOL_NOT_ALLOWED', errorMessage: 'This TV protocol is not enabled for Auto Play.' };
  }
  if (!input.device.validated) {
    return { ok: false, errorCode: 'DEVICE_NOT_VALIDATED', errorMessage: 'Run Test Play and confirm the video started before arming Auto Play.' };
  }
  const key = playCommandIdempotencyKey(input.countdownId, input.device.id);
  if (input.firedKeys?.has(key)) {
    return { ok: false, errorCode: 'PLAY_ALREADY_SENT', errorMessage: 'Auto Play already sent one Play command for this countdown.' };
  }
  return { ok: true, key };
}
