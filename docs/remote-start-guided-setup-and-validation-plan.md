# Watch Sync Remote Start — Guided Setup, Readiness, Mock Verification, Hardware Packets

Updated: 2026-05-05

## Guided setup wizard cards

1. **Roku / Roku TV**
   - Label: `Remote Start beta / primary`
   - Setup: connect/discover on LAN; enable Control by mobile apps/network access if required; Test Play.
   - GO: Play only. No automatic Pause claim.

2. **LG webOS**
   - Label: `Remote Start beta / primary`
   - Setup: pair on TV prompt; save client key locally; Test Play/Pause.
   - GO: `play` only.

3. **Samsung Tizen**
   - Label: `Remote Start beta`
   - Setup: TV approval/token if required; save token locally; Test Play/Pause.
   - GO: `KEY_PLAY` only; no `KEY_PLAYPAUSE` automatic GO.

4. **Sony Bravia**
   - Label: `Remote Start beta for supported Sony TVs`
   - Setup: enable IP Control / PSK/PIN if needed; fetch remote-controller-info; save Play IRCC; Test Play.
   - GO: Play IRCC only when discovered.

5. **Fire TV / Android TV / Google TV**
   - Label: `Guided setup beta`
   - Setup: Developer Options/debugging; IP or pairing code; approve prompt; Test Play; Save.
   - Copy: `Guided setup beta. Some devices may need reconnect. Manual countdown remains available as fallback.`
   - Fire TV split: Fire OS/Android-based devices are ADB candidates; Fire TV Vega devices are `Not supported yet` until a safe path is proven.

6. **Apple TV**
   - Default label: `Manual-only`.
   - Optional internal/beta label only if accepted later: `Apple TV beta via reverse-engineered pairing`.
   - Must not be public headline support; no private Apple APIs.

7. **Xbox**
   - Default label: `Manual-only`.
   - Optional beta only if accepted later: `Xbox beta via account/Remote Features setup`.
   - Requires account/security decision before implementation.

8. **Cable / ISP boxes**
   - Label: `Manual-only`.

## Readiness state model

Source code model added in `src/tv-remote-device.ts`:

| State | UI language | When used |
|---|---|---|
| `not_configured` | `Needs setup` | Missing host/helper/webhook/device details |
| `needs_setup` | `Needs setup` | Pairing/token/IRCC prerequisites missing |
| `ready` | `Remote Start ready` | Reserved for future hardware-validated + helper-tested devices |
| `reconnect_needed` | `Reconnect needed` | Local config exists but no current helper test evidence |
| `test_failed` | `Manual countdown tonight` | Reserved for failed test result storage |
| `manual_tonight` | `Manual countdown tonight` | Manual-only surfaces |
| `unsupported` | `Not supported yet` | D2C-excluded / no product path |
| `unverified_hardware_behavior` | `Device behavior not verified yet` | Mock/helper checks exist but real device/app behavior is not validated |

UI now renders the readiness label/reason in the Remote Start panel.

## Mock verification checklist

Covered by current or updated tests:

- Request construction: `src/tv-remote-device.test.ts`.
- Unsafe command blocking: Roku Pause unsafe, Philips PlayPause GO unsafe, Apple TV manual-only unsafe, ADB toggle blocked.
- Play/Pause/toggle policy: ADB uses 126/127 only; toggle 85 rejected; GO uses Play only.
- Local credential handling: Home Assistant token/entity not sent to backend/helper request body; local pairing tokens stay local UI fields.
- Helper safe errors: ADB shell-shaped host rejected without echoing; HA secret webhook URLs not echoed on failures.
- Endpoint routing: `server/tv-remote-helper.test.ts` covers Roku/LG/Samsung/Sony/Philips/Vizio/ADB/HA injectable routes.
- Status labels: `src/tv-remote-device.test.ts` verifies required platform labels.
- Readiness transitions: `src/tv-remote-device.test.ts` verifies not_configured → reconnect_needed → unverified_hardware_behavior plus manual-only.

Mock target coverage:

- Roku ECP mock/injectable path: helper request + helper route covered.
- LG webOS mock WebSocket: adapter injectable route covered; full socket behavior still integration-level.
- Samsung mock WebSocket: adapter injectable route covered; full socket behavior still integration-level.
- Sony mock REST/IRCC: adapter injectable route covered.
- ADB runner injection: covered with argv assertions and injection rejection.
- Apple TV/Xbox: intentionally not helper-implemented unless beta path is accepted.

## Adapters safe to build now without hardware

- Roku / Roku TV — beta Play-only local ECP.
- LG webOS — beta local pairing + Play/Pause.
- Samsung Tizen — beta local keypress after TV approval/token.
- Sony Bravia — beta supported-model IP/IRCC.
- Fire OS / Android TV / Google TV ADB — Guided setup beta.

## Claims blocked on hardware validation

- Any `supported` or `consumer-simple` claim.
- Pairing acceptance on real TVs.
- Pairing persistence after helper restart, TV sleep/wake, TV reboot, and IP change.
- Netflix/Hulu/Disney+/Prime/Max/YouTube behavior while paused at `00:00`.
- Pause safety per model/app.
- Normal-user setup success without support.

## Hardware validation task packet

Assign this to a person/agent/lab with devices; do not ask Matt to personally test.

### Minimum target devices

- Roku streaming player or Roku TV.
- LG webOS TV.
- Samsung Tizen TV.
- Sony Bravia IP Control-capable TV.
- Fire OS Fire TV Stick/Cube.
- Chromecast with Google TV or Google TV Streamer.
- Onn/Nvidia Shield if available.

### Test script per device

1. Record model, OS/firmware, network type, helper version/build hash.
2. First pair/setup from a clean state.
3. Test Play while app is paused at `00:00`.
4. Test Pause only if discrete/safe.
5. Restart helper and verify reconnect.
6. Sleep/wake TV and verify reconnect.
7. Reboot TV and verify reconnect.
8. Change IP/DHCP if feasible and verify rediscovery/reconnect.
9. Test Netflix/Hulu/Disney+/Prime/Max/YouTube where available; record app state and whether Play works.
10. Record failures, prompts, app overlays, screensaver behavior, and latency.

### Required receipt fields

- Device model / OS / firmware.
- Setup steps and time.
- TV-side settings used.
- Pairing persistence result: `Persistent`, `Reconnect required`, `Re-pair required`, or `Full setup required`.
- GO Play result by app/state.
- Pause result only if tested safely.
- Screenshots/video if available.
- Final label recommendation: keep beta, demote manual-only, or escalate for product/security decision.
