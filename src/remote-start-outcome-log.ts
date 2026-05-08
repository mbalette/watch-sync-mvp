export type RemoteStartOutcomeType =
  | "setup_start"
  | "roku_test_play_attempt"
  | "test_play_pass"
  | "test_play_fail"
  | "ready_confirmed"
  | "go_attempted"
  | "go_failed"
  | "go_sent"
  | "manual_play_fallback"
  | "wrong_screen_or_overlay"
  | "network_or_helper_failure";

export interface RemoteStartOutcomeEvent {
  type: RemoteStartOutcomeType;
  platform?: string;
  deviceType?: string;
  deviceModel?: string;
  streamingApp?: string;
  testPlayResult?: "pass" | "fail" | "unknown";
  goResult?: "sent" | "failed" | "manual" | "unknown";
  failureCode?: string;
  manualPlayFallbackUsed?: boolean;
  wrongScreenOrOverlay?: boolean;
  appVersion?: string;
  timestamp?: string;
}

const FORBIDDEN_KEYS = new Set([
  "streamingAccount",
  "profileName",
  "titleName",
  "email",
  "phone",
  "ip",
  "ipAddress",
  "pairingToken",
  "rokuSerial",
  "serialNumber",
  "helperToken",
  "rawLocalAddress",
  "host",
  "url",
  "token",
  "authToken",
]);

export function sanitizeRemoteStartOutcome(
  input: Record<string, unknown>,
): RemoteStartOutcomeEvent {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    if (
      typeof value === "string" ||
      typeof value === "boolean" ||
      typeof value === "number"
    )
      clean[key] = value;
  }
  clean.timestamp =
    typeof clean.timestamp === "string"
      ? clean.timestamp
      : new Date().toISOString();
  return clean as unknown as RemoteStartOutcomeEvent;
}

export function logRemoteStartOutcome(input: RemoteStartOutcomeEvent): void {
  const event = sanitizeRemoteStartOutcome(
    input as unknown as Record<string, unknown>,
  );
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(event)], {
      type: "application/json",
    });
    if (navigator.sendBeacon("/api/remote-start-outcome-log", blob)) return;
  }
  void fetch("/api/remote-start-outcome-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    keepalive: true,
  }).catch(() => undefined);
}
