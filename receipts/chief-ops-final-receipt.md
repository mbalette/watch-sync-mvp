# Watch Sync All-Platform Internal Runtime Beta Deploy Report
## Verdict
ALL-PLATFORM INTERNAL RUNTIME BETA LIVE, NOT PUBLIC, REAL DEVICE BEHAVIOR UNVERIFIED
## Canonical Repo
- path: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`
- branch: `main`
- commit: `15d9a86d8e3eafda73fd45eb1bb22bafb9d5118b` (`Add all-platform runtime beta proof artifacts`)
- git status: clean before deploy at `15d9a86d8e3eafda73fd45eb1bb22bafb9d5118b`; final receipt is written after deployment for audit.
- pushed: yes, `main -> origin/main`
## Live State
- domain: `https://app.kyrosdirect.tech`
- deployment id: `6b59a893-cbec-4a1a-a9df-282110f3a866`
- deployed commit: `15d9a86`
- runtime config: `{"remoteStartPublicEnabled":false,"remoteStartRuntimeBetaAudience":"internal","remoteStartKillSwitchEnabled":false,"rokuRuntimeBetaEnabled":true,"vizioRuntimeBetaEnabled":false,"lgRuntimeBetaEnabled":false,"samsungRuntimeBetaEnabled":false,"sonyRuntimeBetaEnabled":false}`
## Live Exposure
- public URL: `https://app.kyrosdirect.tech/` verified no Roku/VIZIO/LG/Sony/Samsung beta rows.
- Roku base internal: `https://app.kyrosdirect.tech/?remoteStartBeta=internal` verified Roku only.
- VIZIO platform URL: `https://app.kyrosdirect.tech/?remoteStartBeta=internal&platformBeta=vizio` verified VIZIO only.
- LG platform URL: `https://app.kyrosdirect.tech/?remoteStartBeta=internal&platformBeta=lg` verified LG only.
- Sony platform URL: `https://app.kyrosdirect.tech/?remoteStartBeta=internal&platformBeta=sony` verified Sony only.
- Samsung platform URL: `https://app.kyrosdirect.tech/?remoteStartBeta=internal&platformBeta=samsung` verified Samsung only.
- beta-off URL: `https://app.kyrosdirect.tech/?remoteStartBeta=off` verified no Roku/VIZIO/LG/Sony/Samsung beta rows.
- unsupported devices: Fire TV, Apple TV, Chromecast, Google TV Streamer, Android TV, consoles, cable boxes, AirPlay, Cast sessions, and phone-started playback remain Manual Play / Other devices, not Remote Start beta rows.
## Platform Table
| Platform | URL | Default public | Internal exposed | Helper path | Test Play command | GO command | Manual Play command | Outcome logging | Kill switch | Real behavior verified |
|---|---|---:|---:|---|---|---|---|---:|---:|---:|
| Roku | `?remoteStartBeta=internal` | false | true | `/roku/keypress` | one `Play` keypress through helper | one `Play` keypress after confirmation | zero | true | true | false |
| VIZIO | `?remoteStartBeta=internal&platformBeta=vizio` | false | true | `/vizio/pair/start`, `/vizio/pair/confirm`, `/vizio/keypress` | one `play` keypress through helper | one `play` keypress after confirmation | zero | true | true | false |
| LG | `?remoteStartBeta=internal&platformBeta=lg` | false | true | `/lg/pair/start`, `/lg/pair/confirm`, `/lg/keypress` | one `play` media command through helper after pairing | one `play` media command after confirmation | zero | true | true | false |
| Sony | `?remoteStartBeta=internal&platformBeta=sony` | false | true | `/sony/connect`, `/sony/keypress` | one Play IRCC command through helper after code discovery | one Play IRCC command after confirmation | zero | true | true | false |
| Samsung | `?remoteStartBeta=internal&platformBeta=samsung` | false | true | `/samsung/pair/start`, `/samsung/pair/confirm`, `/samsung/keypress` | one `KEY_PLAY` through helper | one `KEY_PLAY` after confirmation | zero | true | true | false |
## Actual Command Paths
- Roku: app POSTs local helper `/roku/keypress`; helper sends Roku ECP POST `/keypress/Play`.
- VIZIO: app/helper expose `/vizio/pair/start`, `/vizio/pair/confirm`, `/vizio/keypress`; helper sends VIZIO Play body `{"KEYLIST":[{"CODESET":2,"CODE":3,"ACTION":"KEYPRESS"}]}` over local TV control.
- LG: app/helper expose `/lg/pair/start`, `/lg/pair/confirm`, `/lg/keypress`; helper registers Watch Sync client and sends `ssap://media.controls/play` only for Play.
- Sony: app/helper expose `/sony/connect`, `/sony/keypress`; helper discovers remote controller info and sends SOAP `X_SendIRCC` with Play IRCC code.
- Samsung: app/helper expose `/samsung/pair/start`, `/samsung/pair/confirm`, `/samsung/keypress`; helper connects to Samsung local remote websocket and sends `KEY_PLAY` payload only for Play.
## No-Fake-Success Proof
- Test Play sends one command: covered by `src/tv-remote-device.test.ts` request assertions and helper adapter tests in `server/*remote*.test.ts`.
- pending-only after Test Play: app stores pending device with `lastTestedAt: undefined` and `useRemoteStartAtGo: false` until user confirmation; covered by UI screenshots `08-confirmation-gated.png` and `09-ready-after-confirmation-mock-only.png`.
- ready only after “Yes — I paused it again”: app sets `lastTestedAt` and GO opt-in only in `confirmTestPlayStarted`; screenshot `09-ready-after-confirmation-mock-only.png`.
- GO sends one command: `buildDevicePlayRequest` emits one helper request per platform; covered by `npm run test:remote-start-runtime-beta:all-platforms`.
- Manual Play sends zero commands: live public/beta-off checks show beta rows hidden; Manual Play fallback logs outcome and does not call helper.
## Kill Switch
- tested: yes, unit tests and screenshot `12-kill-switch-on.png`.
- restored false: yes, live runtime config shows `remoteStartKillSwitchEnabled:false`.
- result: kill switch hides runtime beta rows, clears pending/ready state in app path, and routes users to Manual Play copy without user-facing kill switch wording.
## Outcome Logging
- endpoint: `POST /api/remote-start-outcome-log`
- storage: `REMOTE_START_OUTCOME_EVENTS` KV, live POST returned `{"ok":true,"id":"1778217060335-f3ed4851-6912-4aa5-b0f9-3d64be7a6ecd","storage":"kv"}`.
- redaction result: client sanitizer and Pages Function allowlist strip token/network/PII fields; tests passed in `src/tv-remote-device.test.ts` and `src/remote-start-simulator/index.test.ts`.
- sample sanitized event: `{"type":"manual_play_fallback","platform":"vizio_smartcast","manualPlayFallbackUsed":true,"timestamp":"2026-05-08T00:00:00.000Z"}`
## Verification
- typecheck: passed, `npm run typecheck`.
- tests: passed, `npm test`, 16 files, 93 tests.
- lint: passed, `npm run lint -- --quiet`.
- build: passed, `npm run build`.
- runtime beta tests: passed, `npm run test:remote-start-runtime-beta`, 23 tests.
- all-platform beta tests: passed, `npm run test:remote-start-runtime-beta:all-platforms`, 45 tests.
- no-claim grep: passed with no output.
## Screenshots
- directory: `docs/screenshots/all-platform-internal-runtime-beta/`
- list:
  - `01-public-no-beta.png`
  - `02-internal-roku-only.png`
  - `03-platform-vizio-beta.png`
  - `04-platform-lg-beta.png`
  - `05-platform-sony-beta.png`
  - `06-platform-samsung-beta.png`
  - `07-test-play-failed.png`
  - `08-confirmation-gated.png`
  - `09-ready-after-confirmation-mock-only.png`
  - `10-post-go-outcome.png`
  - `11-manual-play.png`
  - `12-kill-switch-on.png`
  - `13-beta-off.png`
## Deployment
- no public launch: confirmed, `remoteStartPublicEnabled:false` and VIZIO/LG/Sony/Samsung runtime flags false by default.
- no real-device validation claim: confirmed; real device behavior remains unverified.
- rollback command: `set -a && . /Users/home/Desktop/kyrosworkspace/runtime/secrets/bigmike/cloudflare.env && set +a && npx wrangler pages deployment rollback fbe7e4e9-823a-4a5d-86af-5d88a4ee27b9 --project-name watch-sync-mvp`
## Remaining Unverified
- real Roku behavior
- real VIZIO behavior
- real LG behavior
- real Sony behavior
- real Samsung behavior
- streaming-app Play behavior
- local network/model variance
- overlays/ads/profile/screensaver behavior
