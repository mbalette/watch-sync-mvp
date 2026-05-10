export type RemoteStartOutcomeType =
  | "setup_start"
  | "roku_test_play_attempt"
  | "test_play_attempt"
  | "test_play_pass"
  | "test_play_fail"
  | "ready_confirmed"
  | "go_attempted"
  | "go_failed"
  | "go_sent"
  | "manual_play_fallback"
  | "wrong_screen_or_overlay"
  | "helper_unavailable"
  | "network_or_helper_failure"
  | "network_failure"
  | "kill_switch_block";

export interface RemoteStartOutcomeEvent {
  type: RemoteStartOutcomeType;
  platform?: string;
  deviceType?: string;
  deviceModel?: string;
  streamingApp?: string;
  testPlayResult?: "pass" | "fail" | "unknown";
  goResult?: "sent" | "success_self_report" | "failed" | "manual" | "unknown";
  failureCode?: string;
  latencyMs?: number;
  adapterFamily?: string;
  source?: "native" | "mock" | "synthetic" | "web-helper";
  hardwareValidation: false;
  manualPlayFallbackUsed?: boolean;
  wrongScreenOrOverlay?: boolean;
  appVersion?: string;
  timestamp?: string;
}

export const REMOTE_START_OUTCOME_FORBIDDEN_KEYS = [
  "email",
  "phone",
  "ip",
  "ipAddress",
  "host",
  "url",
  "titleName",
  "profileName",
  "streamingAccount",
  "pairingToken",
  "helperToken",
  "authToken",
  "token",
  "rokuSerial",
  "serialNumber",
  "vizioToken",
  "lgClientKey",
  "samsungToken",
  "sonyPsk",
  "psk",
  "password",
] as const;

export const REMOTE_START_OUTCOME_SAFE_KEYS = [
  "type",
  "platform",
  "deviceType",
  "deviceModel",
  "streamingApp",
  "testPlayResult",
  "goResult",
  "failureCode",
  "latencyMs",
  "adapterFamily",
  "source",
  "hardwareValidation",
  "manualPlayFallbackUsed",
  "wrongScreenOrOverlay",
  "timestamp",
  "appVersion",
] as const;

const SAFE_KEYS = new Set<string>(REMOTE_START_OUTCOME_SAFE_KEYS);
const FORBIDDEN_KEYS = new Set<string>(REMOTE_START_OUTCOME_FORBIDDEN_KEYS);
const SENSITIVE_VALUE_PATTERN = /(?:\b(?:10|127|169\.254|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b|https?:\/\/|\.local\b|bearer\s+[a-z0-9._-]+|webhook|token|pin|psk|password|serial)/i;

export function sanitizeRemoteStartOutcome(input: Record<string, unknown>): RemoteStartOutcomeEvent {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input ?? {})) {
    if (FORBIDDEN_KEYS.has(key) || !SAFE_KEYS.has(key)) continue;
    if (typeof value === "string") {
      if (SENSITIVE_VALUE_PATTERN.test(value)) continue;
      clean[key] = value;
    } else if (typeof value === "boolean" || typeof value === "number") {
      clean[key] = value;
    }
  }
  clean.timestamp = typeof clean.timestamp === "string" ? clean.timestamp : new Date().toISOString();
  clean.hardwareValidation = false;
  return clean as unknown as RemoteStartOutcomeEvent;
}
