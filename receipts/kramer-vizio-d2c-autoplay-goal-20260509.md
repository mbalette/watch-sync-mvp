# Kramer CLI goal — 321 Play VIZIO D2C Auto Play setup + saved device flow

## Role / mode

You are Kramer, Kyros product UI/design/build specialist.

MODE: product UI, iterative design. Use Impeccable 3 iterative design mode manually: preserve current realtime default route, improve only the VIZIO Auto Play setup/saved-device experience and user-facing copy/state.

## Target repo

`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`

## Non-negotiable safety / product truth

- Do **not** deploy.
- Do **not** push.
- Do **not** replace the default realtime room app with the visual AppFlow again.
- Default `/` must remain the realtime two-person room app (`LiveRoomApp`) with WebSocket bundle strings intact.
- `?visual=1` can remain visual/photo flow.
- Do **not** wire photo ID, Anthropic, photo storage, real backend camera analysis, or streaming-account behavior.
- Do **not** claim official VIZIO partnership/support or guaranteed hardware validation.
- VIZIO path is only for video opened directly in the VIZIO TV app. Phone-originated Cast/AirPlay/SmartCast playback should route to manual countdown/fallback copy.
- D2C copy should avoid jargon: avoid primary-path words like SmartCast API, local helper, LAN, auth token, key_command, IP address unless hidden under manual/advanced.
- Use language: `VIZIO TV`, `Pair with TV code`, `Find my VIZIO TV`, `Send Test Play`, `Yes — I paused it again`, `Start 3-2-1 Play`, `Use manual countdown tonight`.

## Current evidence / implementation facts to use

Existing relevant source:
- `src/LiveRoomApp.tsx` — default realtime app UI after Jackie hotfix.
- `src/tv-remote-device.ts` — linked device model and VIZIO capability/wizard.
- `src/tv-remote-device.test.ts` — existing tests for VIZIO helper request shape and saved device model.
- `server/vizio-smartcast-remote.ts` — VIZIO adapter: `/pairing/start`, `/pairing/pair`, `/key_command/`.
- `server/vizio-smartcast-remote.test.ts` — adapter tests.

Known saved-device behavior:
- `LINKED_TV_DEVICE_KEY = "watch-sync.linkedTvDevice.v1"`.
- `saveLinkedTvDevice()` persists `platform`, `label`, `host`, `helperUrl`, `authToken`, `lastTestedAt`, `useRemoteStartAtGo` to browser `localStorage`.
- `loadLinkedTvDevice()` restores it on next visit.

## User intent

Matt wants to set up his VIZIO for Auto Play now, and the app should feel like a D2C consumer onboarding flow. After a successful VIZIO setup, the app should make clear the device is saved so he does not need to pair again every movie night.

## Required UX outcome

Add/adjust the VIZIO setup and saved-device path so the app acts like this:

### 1) VIZIO device card / entry

User-facing card/copy:

Title: `VIZIO TV`
Badge/action: `Pair with TV code`
Description: `Pair once with your TV, then 3-2-1 Play can press Play at the countdown.`

Add a small truth/fallback line:
`Works when the movie is playing in the app on your VIZIO TV. If you’re casting from your phone, use manual countdown.`

### 2) Before setup / local-network prompt copy

A consumer-friendly section/sheet copy:

Title: `Keep your VIZIO on and nearby`
Body: `We’ll look for your TV on your Wi‑Fi and ask it to show a short pairing code.`
Privacy/truth: `3-2-1 Play does not access your streaming accounts or choose titles. It only sends a local Play command to your TV.`
Checklist:
- `VIZIO TV is on`
- `This phone/browser is on the same Wi‑Fi`
- `You’ll open the streaming app directly on the TV`
- `You have the VIZIO remote nearby`
CTA: `Find my VIZIO TV`
Fallback: `Use manual countdown tonight`

### 3) Pairing code step copy

Title: `Enter the code from your TV`
Body: `Your VIZIO should show a pairing code. Type it here to connect this device.`
Field label: `TV code`
CTA: `Pair TV`
Helper: `If you don’t see a code, make sure your TV is on the same Wi‑Fi and try again.`
Secondary: `I don’t see a code`

If existing UI cannot actually auto-discover or pair in-browser today, keep the behavior honest but shape the text/buttons toward this D2C flow. Hide technical fields under an advanced/manual reveal if you need to preserve host/IP input for current implementation.

### 4) Open movie step

Title: `Open the movie on your VIZIO`
Body: `Use your normal VIZIO remote. Open the streaming app on the TV and start the movie.`
Then: `Pause it exactly where you both want to begin.`
Warning/truth: `Don’t cast from your phone for this setup. The video needs to be playing on the VIZIO TV app itself.`
CTA: `I paused the movie`

### 5) Test Play

Title: `Test Auto Play`
Body: `We’ll send one Play command to your VIZIO. Your movie should start.`
After-test instruction: `After it starts, pause it again so it’s ready for the real countdown.`
CTA: `Send Test Play`
Fallback: `Use manual countdown instead`

### 6) Confirm result / save readiness

Title: `Did the movie start?`
Buttons:
- `Yes — I paused it again`
- `No — use manual countdown`

On yes, app should persist saved device/readiness using existing `saveLinkedTvDevice()` / `lastTestedAt` / `useRemoteStartAtGo` pattern.

Success/saved copy:
Title: `VIZIO ready`
Body: `3-2-1 Play can press Play on this TV after you open the movie and pause it.`
Saved-state note: `Your VIZIO is paired on this device. Next movie night, you won’t need to enter the code again.`
CTA: `Start 3-2-1 Play`
Secondary: `Test Play again`
Link: `Pair a different TV`

### 7) Returning user saved-device state

If `loadLinkedTvDevice()` returns VIZIO with a saved `authToken`/host and `lastTestedAt`/`useRemoteStartAtGo`, show a clearly saved state instead of making user repeat pairing:

Title: `Saved VIZIO TV`
Body: `Your VIZIO is paired on this device.`
Action: `Use this VIZIO`
Secondary: `Test Play again`
Tertiary: `Pair a different TV`
Small caveat: `You may need to pair again if you use a different browser, clear browser data, reset the TV, or change Wi‑Fi.`

If saved but missing `lastTestedAt` or confirmation, show `Test Play before movie night` rather than `ready`.

## Implementation guidance

- Prefer targeted edits in `src/LiveRoomApp.tsx` and `src/tv-remote-device.ts`.
- Do not make a giant redesign. Add/refine copy and state affordances in the existing remote setup panel/sheet.
- Keep VIZIO setup D2C friendly and linear.
- Hide `host`, `helperUrl`, `authToken`, `IP address`, or equivalent technical fields behind an `Advanced / enter address manually` style affordance if they must remain visible for current dev setup.
- Ensure the saved-device note uses local/browser wording: saved on this device/browser, not cloud/account.
- Add/update tests where practical for saved VIZIO persistence/readiness copy or at least ensure existing VIZIO tests still pass.

## Required verification

Run these from repo root and include exact results in receipt:

```bash
npm run typecheck
npm run lint -- --quiet
npm run build:prod
npm run test:remote-start-runtime-beta:all-platforms
REALTIME_URL=wss://api.kyrosdirect.tech npm run smoke:realtime:prod
```

If a command fails due unrelated pre-existing issue, diagnose and either fix if scoped or report clearly.

Also run a bundle/source proof that default realtime route still includes:
- `new WebSocket`
- `create_room`
- `join_room`
- `wss://api.kyrosdirect.tech`

## Visual proof

Generate mobile screenshots/contact sheet from a running local app showing at minimum:
1. VIZIO card/entry point.
2. VIZIO before setup / find TV step.
3. Pair code step.
4. Open movie / pause step.
5. Test Play step.
6. Confirm result step.
7. Saved VIZIO / ready returning-user state.
8. Manual countdown fallback copy for casting/from phone or failed test.

Save under:
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-vizio-d2c-autoplay-20260509/`

## Receipt

Write receipt at:
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/kramer-vizio-d2c-autoplay-20260509.md`

Receipt must include:
- verdict
- changed files
- exact UX states implemented
- screenshot/contact-sheet paths
- verification command results
- bundle proof that default realtime route is intact
- caveats about VIZIO hardware validation / direct TV app only / credentials saved locally only
- no deploy / no push confirmation
