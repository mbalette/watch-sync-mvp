# Watch Sync All-Platform Internal Runtime Beta Deploy Report
## Verdict
ALL-PLATFORM INTERNAL RUNTIME BETA LIVE, NOT PUBLIC, REAL DEVICE BEHAVIOR UNVERIFIED
## Canonical Repo
- path: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`
- branch: `main`
- commit: `56bf0e1ed02af15ad398a265fedb86711c96925d` (`Fix all-platform Test Play command gating`)
- git status: clean before Cloudflare deploy of `56bf0e1`; this receipt commit may postdate the deployed app source because the deployment id is only known after deployment.
- pushed: yes, `main -> origin/main`
## Live State
- domain: `https://app.kyrosdirect.tech`
- deployment id: `23188e23-1a8c-4343-9c62-223bfea2dce8`
- deployed commit: `56bf0e1`
- runtime config: `{"remoteStartPublicEnabled":false,"remoteStartRuntimeBetaAudience":"internal","remoteStartKillSwitchEnabled":false,"rokuRuntimeBetaEnabled":true,"vizioRuntimeBetaEnabled":false,"lgRuntimeBetaEnabled":false,"samsungRuntimeBetaEnabled":false,"sonyRuntimeBetaEnabled":false}`
## Live Exposure
- public URL: `https://app.kyrosdirect.tech/` verified selector/onboarding flow has no Roku/VIZIO/LG/Sony/Samsung beta rows after fresh localStorage clear.
- Roku base internal: `https://app.kyrosdirect.tech/?remoteStartBeta=internal` verified selector/onboarding flow exposes Roku only.
- VIZIO platform URL: `https://app.kyrosdirect.tech/?remoteStartBeta=internal&platformBeta=vizio` verified selector/onboarding flow exposes VIZIO only.
- LG platform URL: `https://app.kyrosdirect.tech/?remoteStartBeta=internal&platformBeta=lg` verified selector/onboarding flow exposes LG only.
- Sony platform URL: `https://app.kyrosdirect.tech/?remoteStartBeta=internal&platformBeta=sony` verified selector/onboarding flow exposes Sony only.
- Samsung platform URL: `https://app.kyrosdirect.tech/?remoteStartBeta=internal&platformBeta=samsung` verified selector/onboarding flow exposes Samsung only.
- beta-off URL: `https://app.kyrosdirect.tech/?remoteStartBeta=off` verified selector/onboarding flow has no Roku/VIZIO/LG/Sony/Samsung beta rows after fresh localStorage clear.
- unsupported devices: not exposed as named Remote Start beta selector rows; they remain under manual/other-device handling.
- caveat: this live exposure proof is selector/onboarding-row proof with fresh localStorage. Static roadmap/helper-target copy and stale user-local linked-device state can still mention or render existing setup details; that is not a public support/validation claim and is not counted as fresh selector-row exposure.
## Platform Table
| Platform | URL | Default public | Internal exposed | Helper path | Test Play command | GO command | Manual Play command | Outcome logging | Kill switch | Real behavior verified |
|---|---|---:|---:|---|---|---|---|---:|---:|---:|
| Roku | `?remoteStartBeta=internal` | false | true | `/roku/keypress` | one `Play` keypress through helper | one `Play` keypress after confirmation | zero | true | true | false |
| VIZIO | `?remoteStartBeta=internal&platformBeta=vizio` | false | true | `/vizio/pair/start`, `/vizio/pair/confirm`, `/vizio/keypress` | one `play` keypress through helper | one `play` keypress after confirmation | zero | true | true | false |
| LG | `?remoteStartBeta=internal&platformBeta=lg` | false | true | `/lg/pair/start`, `/lg/pair/confirm`, `/lg/keypress` | one `/lg/keypress` `play` command through helper, requires saved client key | one `/lg/keypress` `play` command after confirmation | zero | true | true | false |
| Sony | `?remoteStartBeta=internal&platformBeta=sony` | false | true | `/sony/connect`, `/sony/keypress` plus legacy `/sony/ircc` | one `/sony/keypress` Play IRCC command through helper, requires discovered Play IRCC code | one `/sony/keypress` Play IRCC command after confirmation | zero | true | true | false |
| Samsung | `?remoteStartBeta=internal&platformBeta=samsung` | false | true | `/samsung/pair/start`, `/samsung/pair/confirm`, `/samsung/keypress` | one `/samsung/keypress` `KEY_PLAY` command through helper | one `/samsung/keypress` `KEY_PLAY` command after confirmation | zero | true | true | false |
## Actual Command Paths
- Roku: app POSTs local helper `/roku/keypress`; helper sends Roku ECP POST `/keypress/Play`.
- VIZIO: app/helper expose `/vizio/pair/start`, `/vizio/pair/confirm`, `/vizio/keypress`; helper sends VIZIO Play body `{"KEYLIST":[{"CODESET":2,"CODE":3,"ACTION":"KEYPRESS"}]}` over local TV control.
- LG: app/helper expose `/lg/pair/start`, `/lg/pair/confirm`, `/lg/keypress`; Test Play and GO use `/lg/keypress` with `command:"play"` and helper sends `ssap://media.controls/play`.
- Sony: app/helper expose `/sony/connect`, `/sony/keypress`, and legacy `/sony/ircc`; Test Play and GO use `/sony/keypress` with Play IRCC code and helper sends SOAP `X_SendIRCC`.
- Samsung: app/helper expose `/samsung/pair/start`, `/samsung/pair/confirm`, `/samsung/keypress`; Test Play and GO use `/samsung/keypress` with `KEY_PLAY`.
## No-Fake-Success Proof
- Test Play sends one command: fixed and covered by `src/tv-remote-device.test.ts`; LG/Sony Test Play now returns unsafe until the needed pairing/code exists, then emits a Play helper request. Samsung Test Play emits `KEY_PLAY`.
- pending-only after Test Play: app stores pending device with `lastTestedAt: undefined` and `useRemoteStartAtGo: false` until user confirmation.
- ready only after “Yes — I paused it again”: app sets `lastTestedAt` and GO opt-in only in `confirmTestPlayStarted`.
- GO sends one command: `buildDevicePlayRequest` emits one helper request per platform; covered by `npm run test:remote-start-runtime-beta:all-platforms`.
- Manual Play sends zero commands: live public/beta-off selector checks hide beta rows; Manual Play fallback logs outcome and does not call helper.
## Kill Switch
- tested: yes, unit tests and existing screenshot `12-kill-switch-on.png`.
- restored false: yes, live runtime config shows `remoteStartKillSwitchEnabled:false`.
- result: kill switch hides runtime beta rows and routes to Manual Play handling without user-facing kill switch wording.
## Outcome Logging
- endpoint: `POST /api/remote-start-outcome-log`
- storage: `REMOTE_START_OUTCOME_EVENTS` KV; live POST returned `{"ok":true,"id":"1778217930733-41fbffce-2b77-40ee-a917-8b1d304fc09a","storage":"kv"}`.
- redaction result: client sanitizer and Pages Function allowlist strip token/network/PII fields; tests passed.
- sample sanitized event: `{"type":"manual_play_fallback","platform":"sony_bravia","manualPlayFallbackUsed":true,"timestamp":"2026-05-08T00:00:00.000Z"}`
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
- rollback command: UNVERIFIED for Wrangler 4.69.0 because `npx wrangler pages deployment --help` lists only `list/create/tail/delete`, not rollback. Verified fallback rollback method is redeploying a known-good committed build or deleting the bad deployment only after confirming Cloudflare Pages production routing behavior in the dashboard/API.
## Remaining Unverified
- real Roku behavior
- real VIZIO behavior
- real LG behavior
- real Sony behavior
- real Samsung behavior
- streaming-app Play behavior
- local network/model variance
- overlays/ads/profile/screensaver behavior
