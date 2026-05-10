import {
  type RemoteStartOutcomeEvent,
  type RemoteStartOutcomeType,
  REMOTE_START_OUTCOME_FORBIDDEN_KEYS,
  REMOTE_START_OUTCOME_SAFE_KEYS,
  sanitizeRemoteStartOutcome,
} from "./remote-start-outcome-sanitizer";

export type { RemoteStartOutcomeEvent, RemoteStartOutcomeType };
export { REMOTE_START_OUTCOME_FORBIDDEN_KEYS, REMOTE_START_OUTCOME_SAFE_KEYS, sanitizeRemoteStartOutcome };

export function logRemoteStartOutcome(input: Partial<RemoteStartOutcomeEvent> & { type: RemoteStartOutcomeType }): void {
  const event = sanitizeRemoteStartOutcome(input as unknown as Record<string, unknown>);
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
