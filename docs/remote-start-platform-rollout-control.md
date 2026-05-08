# Remote Start Platform Rollout Control

Watch Sync Remote Start remains an internal runtime beta. Code/helper/mocks/UI can be prepared together, but user exposure is staged one platform at a time. Public support remains off until real-device evidence exists.

## Current intended flags

| Flag | Value | Purpose |
|---|---:|---|
| `remoteStartPublicEnabled` | `false` | No public Remote Start support claims. |
| `remoteStartRuntimeBetaAudience` | `internal` | Internal opt-in only via `?remoteStartBeta=internal`. |
| `remoteStartKillSwitchEnabled` | `false` | Operational pause gate; when true all beta rows and helper sends are blocked. |
| `rokuRuntimeBetaEnabled` | `true` | First internal runtime beta lane. |
| `vizioRuntimeBetaEnabled` | `false` | Code-ready only; staged off. |
| `lgRuntimeBetaEnabled` | `false` | Code-ready only; staged off. |
| `sonyRuntimeBetaEnabled` | `false` | Code-ready only; staged off. |
| `samsungRuntimeBetaEnabled` | `false` | Code-ready only; staged off. |

## Platform status

| Platform | Adapter done | Mock test done | UI beta copy done | Outcome logging done | Kill switch tested | Default flag | Ready to enable by flag | Real behavior verified |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Roku TV | yes | yes | yes | yes | yes | on internal | yes | no |
| Roku streaming | yes | yes | yes | yes | yes | on internal | yes | no |
| VIZIO | yes | yes | yes | yes | yes | off | yes, internal only | no |
| LG | yes | yes | yes | yes | yes | off | yes, internal only | no |
| Sony | yes | yes | yes | yes | yes | off | yes, internal only | no |
| Samsung | yes | yes | yes | yes | yes | off | yes, internal only | no |

## No-fake-success rules

- Test Play sends exactly one helper command.
- Test Play success stores only pending setup state.
- Remote Start GO is enabled only after `Yes — I paused it again`.
- GO sends exactly one Play command.
- Manual Play sends zero helper/device commands.
- Failed helper/device setup routes to Manual Play.
- Real behavior remains unverified until actual users/testers/lab devices run Test Play and GO.

## Enablement checklist per platform

Before turning on any non-Roku runtime beta flag:

1. Keep `remoteStartPublicEnabled=false`.
2. Turn on exactly one platform flag.
3. Verify `?remoteStartBeta=internal` shows only that platform and Roku state intended for the test.
4. Run `npm run test:remote-start-runtime-beta:all-platforms`.
5. Capture a fresh mobile screenshot.
6. Collect real-device event evidence from Test Play + GO.
7. Do not say working/validated until the evidence exists.

## Operational pause

Set `REMOTE_START_KILL_SWITCH_ENABLED=true` in Cloudflare Pages env/secret or KV runtime config. This must hide beta rows, clear pending/ready device state, block Test Play/GO helper commands, and show Manual Play without user-facing kill-switch wording.
