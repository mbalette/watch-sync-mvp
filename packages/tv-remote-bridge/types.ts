export type TVProtocol =
  | 'manual'
  | 'roku-ecp'
  | 'vizio-smartcast'
  | 'lg-webos'
  | 'samsung-tizen'
  | 'sony-bravia'
  | 'android-tv'
  | 'google-cast';

export type DeviceSetupState =
  | 'manual_only'
  | 'permission_required'
  | 'discovered'
  | 'pairing_required'
  | 'paired'
  | 'validated'
  | 'armed'
  | 'failed';

export type TVCapability =
  | 'discover'
  | 'pair'
  | 'play'
  | 'pause'
  | 'playPause'
  | 'testCommand'
  | 'wakeup';

export interface DeviceCandidate {
  id: string;
  protocol: TVProtocol;
  displayName: string;
  host?: string;
  port?: number;
  model?: string;
  manufacturer?: string;
  firmwareVersion?: string;
  requiresPairing: boolean;
  capabilities: TVCapability[];
}

export interface PairedDevice {
  id: string;
  protocol: TVProtocol;
  displayName: string;
  host?: string;
  port?: number;
  model?: string;
  manufacturer?: string;
  firmwareVersion?: string;
  pairedAt: number;
  lastValidatedAt?: number;
  capabilities: TVCapability[];
}

export interface PairingInput {
  pin?: string;
  psk?: string;
  approvalToken?: string;
}

export interface PairingResult {
  ok: boolean;
  device?: PairedDevice;
  requiresPin?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface CommandResult {
  ok: boolean;
  protocol: TVProtocol;
  command: 'play';
  sentAtMonotonicMs: number;
  completedAtMonotonicMs?: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface ArmPlayInput {
  countdownId: string;
  deviceId: string;
  playAtServerMs: number;
  playAtMonotonicMs: number;
}

export interface ArmPlayResult {
  ok: boolean;
  deviceId: string;
  countdownId: string;
  armedForMonotonicMs: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface TVRemoteBridge {
  getPermissionState(): Promise<{ localNetwork: 'unknown' | 'granted' | 'denied' | 'not_required' }>;
  requestPermissions(): Promise<{ localNetwork: 'granted' | 'denied' | 'not_required' }>;
  discoverDevices(input?: { protocols?: TVProtocol[]; timeoutMs?: number; includeManualIp?: boolean }): Promise<DeviceCandidate[]>;
  addManualDevice(input: { protocol: TVProtocol; host: string; port?: number }): Promise<DeviceCandidate>;
  pairDevice(deviceId: string, input?: PairingInput): Promise<PairingResult>;
  listPairedDevices(): Promise<PairedDevice[]>;
  removePairedDevice(deviceId: string): Promise<{ ok: boolean }>;
  validateDevice(deviceId: string): Promise<{ ok: boolean; deviceId: string; capabilities: TVCapability[]; errorCode?: string; errorMessage?: string }>;
  testPlay(deviceId: string): Promise<CommandResult>;
  armPlay(input: ArmPlayInput): Promise<ArmPlayResult>;
  cancelArmedPlay(input: { countdownId: string; deviceId: string }): Promise<{ ok: boolean }>;
  sendPlayNow(input: { countdownId: string; deviceId: string }): Promise<CommandResult>;
}
