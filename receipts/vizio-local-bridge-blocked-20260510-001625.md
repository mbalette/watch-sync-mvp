# VIZIO local bridge / pairing audit receipt — 2026-05-10 00:16 CDT

## Verdict

PARTIAL/BLOCKED.

Software-side VIZIO local setup was improved and verified locally, but 321 Play is **not DONE** for VIZIO because no real VIZIO code-entry confirmation and no real VIZIO Test Play succeeded on the physical TV.

## What changed in this pass

- `server/vizio-smartcast-remote.ts`
  - Extracts `CHALLENGE_TYPE` from `/pairing/start` responses.
  - Converts numeric `CHALLENGE_TYPE` and `PAIRING_REQ_TOKEN` back to numbers in confirm payloads, matching the pyvizio/Home Assistant-derived SmartCast pattern.
  - Uses consumer app name `321 Play` for pairing start.
- `server/tv-remote-helper.ts`
  - Returns `challengeType` from `/vizio/pair/start`.
  - Accepts/passes `challengeType` into `/vizio/pair/confirm`.
- `server/vizio-smartcast-remote.test.ts`
  - Regression now covers numeric VIZIO pairing token extraction and numeric confirm payload.
- `src/AppFlow.tsx`
  - Replaced primary VIZIO jargon with consumer copy: `VIZIO TV`, `Find my VIZIO TV`, `Start pairing`, `Enter the code from your TV`, `Send Test Play`, `Yes — I paused it again`.
  - Replaced public HTTPS direct-helper promise with honest local setup beta copy.
  - Blocks Start Pairing from public/non-localhost browser origin and tells the user to open `http://127.0.0.1:5173/` on the Mac running the helper.
  - Test Play no longer marks Remote Start ready immediately. It now routes to a confirmation screen; ready state is only after `Yes — I paused it again`.
  - Manual countdown fallback is visible in the VIZIO setup card.
- Added proof scripts/artifacts:
  - `scripts/vizio-bridge-browser-proof-20260510.mjs`
  - `scripts/create-vizio-local-contact-sheet-20260510.py`
  - `screenshots/vizio-site-local-bridge-20260510/`

## Audit evidence

### Repo / worktree

- Command: `git status --short --branch`
- Result: dirty worktree already contained prior VIZIO/321Play changes plus new proof scripts/screenshots. No commit made.
- Command: `git diff --stat`
- Result includes VIZIO/helper/UI changes across:
  - `server/tv-remote-helper.ts`
  - `server/vizio-smartcast-remote.ts`
  - `server/vizio-smartcast-remote.test.ts`
  - `src/AppFlow.tsx`
  - existing dirty files from prior pass: `src/App.tsx`, `src/LiveRoomApp.tsx`, `src/app-flow.css`, `src/tv-remote-device.ts`

### Helper / TV reachability

- Helper listener: `[local-helper-url-redacted]`
- Health check with localhost origin returned HTTP 200 and CORS headers including `Access-Control-Allow-Private-Network: true`.
- TV reachability: `ping -c 2 -W 1000 [private-tv-ip-redacted]` returned 0% packet loss.
- Direct device info: `curl -sk https://[private-tv-ip-redacted]:7345/state/device/deviceinfo`
  - Model observed: `V505-H9`
  - Cast name observed: `Primary Bedroom`
  - API version observed: `3.3.3-2538.0001`
  - Serial/advertising/device IDs were not repeated in chat.

### VIZIO protocol evidence

- Current helper pair start command:
  - `POST [local-helper-url-redacted]/vizio/pair/start {"host":"[private-tv-ip-redacted]"}`
- Result shape after patch:
  - `{"ok":true,"platform":"vizio-runtime-beta","pairingToken":"[REDACTED-NUMERIC]","challengeType":"1"}`
- Direct SmartCast reads work without auth for device info.
- Direct pair start can still return `STATUS.RESULT=BLOCKED` depending on current TV pairing state; this is correctly treated as failure by the adapter.
- Unverified: whether the physical TV currently displays a pairing code for the returned token. Matt previously reported no visible code.

### Browser bridge proof

Artifact: `screenshots/vizio-site-local-bridge-20260510/browser-proof.json`

- Production HTTPS origin probe from `https://app.kyrosdirect.tech/` to `[local-helper-url-redacted]/health`:
  - `ok: false`
  - `error: Failed to fetch`
  - matches Chromium loopback/PNA block.
- Local origin probe from `http://127.0.0.1:5173/` to `[local-helper-url-redacted]/health`:
  - `ok: true`
  - `status: 200`
  - `bodyOk: true`
- Local setup DOM metrics:
  - `innerWidth: 390`
  - `docScrollWidth: 390`
  - `bodyScrollWidth: 390`
  - no horizontal clipping in proof viewport.
- Local setup copy probes:
  - `VIZIO TV`: true
  - `Find my VIZIO TV`: true
  - `Start pairing`: true
  - `Enter the code from your TV`: true
  - `Send Test Play`: true
  - `Use manual countdown`: true

### Screenshots / contact sheet

- Mobile screenshot: `screenshots/vizio-site-local-bridge-20260510/01-local-vizio-setup.png`
  - SHA256: `45b8d6ff59e521e45cf1d8172f12dab22caa8dd6095404f1b65c74a19a4aeed1`
- Contact sheet: `screenshots/vizio-site-local-bridge-20260510/contact-sheet.png`
  - Size: `780x2902`
  - SHA256: `2c261c5943f8b137dd5ff46699fb34e0406cc1db7ae3d6fcd7426bbb7715d46d`
- Browser proof JSON:
  - SHA256: `c95d4bed989cdc5d145335f30b06f1082f30923588735fa476e66789070ffc56`

### Required verification commands

All passed locally after the patch:

```text
npm run typecheck
# exit 0

npm run test:remote-start-runtime-beta:all-platforms
# 6 files passed, 45 tests passed

npm run lint -- --quiet
# exit 0

npm run build:prod
# exit 0
# dist/assets/index-DUxBekcZ.js   352.92 kB │ gzip: 99.29 kB
```

## Live production state

No deploy was performed in this pass.

Live `https://app.kyrosdirect.tech/` still serves prior asset:

- `assets/index-BfosoELn.js`
- Contains prior strings:
  - `Pair from this site`: true
  - `Pair from local setup`: false
  - `[local-helper-url-redacted]`: true
  - `/vizio/pair/start`: true

Reason for no deploy: the real VIZIO path is still blocked on physical TV code visibility / confirm / Test Play, and the task says not to claim VIZIO works until real Test Play succeeds.

## Exact local steps Matt can try now

1. On the Mac on the same Wi‑Fi as the VIZIO, run:
   ```bash
   cd /Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp
   npm run dev:tv-remote
   ```
2. In another terminal, run the local app:
   ```bash
   cd /Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp
   npm run dev -- --host 127.0.0.1 --port 5173
   ```
3. Open:
   ```text
   http://127.0.0.1:5173/
   ```
4. Create a room → choose TV app built into my TV → choose VIZIO TV.
5. Enter `[private-tv-ip-redacted]` and click `Find my VIZIO TV` / `Start pairing`.
6. If the TV shows a code, enter that fresh code. Do not reuse old code `3259`.
7. Open the movie directly inside the built-in VIZIO app and pause it.
8. Click `Send Test Play` once.
9. If the movie starts, pause it again and click `Yes — I paused it again`.
10. Only then treat Remote Start as ready for that local session.

## Remaining caveats / blockers

- Real VIZIO Test Play: **not passed**.
- Physical TV code visibility: **unverified / previously failed**.
- Production-site direct helper bridge: **failed** by browser policy (`Failed to fetch` / loopback access blocked).
- Lowest-friction working bridge for now: **local-only Vite setup page + local helper**.
- No auth token was printed in this receipt.
- No photo data involved.
- No deploy performed.
