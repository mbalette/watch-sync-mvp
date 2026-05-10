# VIZIO site pairing wiring receipt — 2026-05-10 00:04 CDT

## Verdict

Partial software pass, with a hard browser/runtime caveat.

The production site now includes a real VIZIO pairing panel in the VIZIO setup flow (`Pair from this site`) and the live bundle contains calls for:

- `[local-helper-url-redacted]/vizio/pair/start`
- `/vizio/pair/confirm`
- `/vizio/keypress`

The local helper was also patched to:

- preserve numeric VIZIO pairing tokens;
- reject VIZIO `STATUS.RESULT` failures instead of treating every HTTP 200 as success;
- allow `321play.kyrosdirect.tech` as a browser origin;
- return `Access-Control-Allow-Private-Network: true` on preflight.

However, Chromium still blocks `https://app.kyrosdirect.tech` → `[local-helper-url-redacted]` fetches with:

```text
Permission was denied for this request to access the `loopback` address space.
TypeError: Failed to fetch
```

So the deployed public site has the UI and code, but a normal browser may still block direct localhost helper calls. Command-line/local-helper pairing remains the working path right now.

## Deploy

- Pages project: `watch-sync-mvp`
- Deployment: `https://181d5b1b.watch-sync-mvp.pages.dev`
- Custom domains verified serving same asset:
  - `https://app.kyrosdirect.tech/`
  - `https://321play.kyrosdirect.tech/`
- Live assets:
  - `assets/index-BfosoELn.js`
  - `assets/index-JGTlF3Hf.css`

## Commands passed

```text
npm run typecheck
# exit 0

npm run test:remote-start-runtime-beta:all-platforms
# 6 files passed, 45 tests passed

npm run lint -- --quiet
# exit 0

npm run build:prod
# exit 0
# dist/assets/index-JGTlF3Hf.css   74.46 kB │ gzip: 13.36 kB
# dist/assets/index-BfosoELn.js   351.23 kB │ gzip: 98.95 kB
```

Deploy command:

```text
npx wrangler pages deploy dist --project-name watch-sync-mvp --branch main --commit-dirty=true
# Deployment complete: https://181d5b1b.watch-sync-mvp.pages.dev
```

## Live bundle proof

All three frontend URLs contained:

```text
Pair from this site: true
The browser blocked the local TV helper: true
/vizio/pair/start: true
[local-helper-url-redacted]: true
```

## VIZIO hardware attempt

- TV IP `[private-tv-ip-redacted]` is reachable on LAN.
- Local helper health succeeded at `[local-helper-url-redacted]/health`.
- Latest helper pairing start returned a numeric pairing token:

```text
{"ok":true,"platform":"vizio-runtime-beta","pairingToken":"[pairing-token-redacted]"}
```

Matt reported the TV was not showing a PIN. Earlier confirm attempt with stale PIN `3259` failed after the fresh start because the TV returned `INVALID_PARAMETER`.

## Current caveats / next blocker

1. Deployed public HTTPS site cannot be considered complete for local TV pairing until browser local-network/loopback access is solved with a real local companion/helper strategy.
2. VIZIO TV currently returns a pairing token from `/pairing/start`, but the physical TV is not showing a PIN according to Matt.
3. No real VIZIO Test Play succeeded yet.
4. Work was direct-upload deployed from a dirty worktree; no git commit/push was made.
