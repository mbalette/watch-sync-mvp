# Remote Start internal ops runbook

## Live state
Internal Roku beta is the only allowed exposed lane. Public Remote Start remains off. VIZIO, LG, Sony, and Samsung command paths stay flag-off except QA-only local proof.

Known unverified: real device behavior for all platforms, including Roku, has not been certified by this non-hardware readiness pass.

## Runtime config checks
- Read `REMOTE_START_CONFIG` from Cloudflare KV.
- Safe fallback if missing, malformed, or endpoint unavailable: public off, all platform beta flags off, Manual Play available.
- Required non-public Roku beta shape:

```json
{
  "remoteStartPublicEnabled": false,
  "remoteStartRuntimeBetaAudience": "internal",
  "remoteStartKillSwitchEnabled": false,
  "rokuRuntimeBetaEnabled": true,
  "vizioRuntimeBetaEnabled": false,
  "lgRuntimeBetaEnabled": false,
  "samsungRuntimeBetaEnabled": false,
  "sonyRuntimeBetaEnabled": false
}
```

## Kill switch commands
Set `remoteStartKillSwitchEnabled` to `true` in `REMOTE_START_CONFIG`; verify UI hides Remote Start and keeps Manual Play. Reset to `false` only after incident close. Do not leave smoke tests enabled.

## Outcome events checks
`REMOTE_START_OUTCOME_EVENTS` stores sanitized outcome events with retention TTL. Default retention: `REMOTE_START_OUTCOME_RETENTION_DAYS=30`.

## Summary export
Run:

```sh
npm run remote-start:summary
npm run remote-start:events:export
npm run remote-start:events:prune
```

Artifacts: `artifacts/remote-start-runtime-beta/live-summary.json`, `live-summary.md`, and `events-export.json`.

## Rollback / disable Roku beta
Set `rokuRuntimeBetaEnabled=false` or `remoteStartRuntimeBetaAudience=off`. For emergency, use the kill switch.

## Keep non-Roku off
Do not enable VIZIO, LG, Samsung, or Sony public/internal flags. QA-only URL exposure is for local non-hardware UI proof only and cannot affect normal users.

## Forbidden claims
Do not claim that Remote Start is publicly ready, device-certified, or confirmed to work on streaming apps or TV brands. Say: "internal beta" and "Manual Play remains available."

## Escalation tree
1. Privacy/redaction issue: enable kill switch, stop exports, inspect sanitizer tests.
2. Widespread failed Test Play: disable Roku beta or enable kill switch.
3. User confusion: update support copy and keep Manual Play prominent.
4. Runtime config unavailable: safe fallback should hide Remote Start; verify endpoint and KV.
