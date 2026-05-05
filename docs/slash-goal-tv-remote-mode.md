# /goal — Watch Sync TV Remote Mode Product Track

Read this entire document, then execute it.

## Goal

Build Watch Sync TV Remote Mode into a real product track.

## Context

Watch Sync is a long-distance couples/group watch-together app.

Current product:

- Production PWA: <https://app.kyrosdirect.tech>
- Realtime backend: `wss://api.kyrosdirect.tech`
- Repo: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`
- Current app supports manual TV countdown rooms, chat, ready state, production realtime, and local Chrome extension auto-sync for accessible HTML5 browser videos.
- Experimental Roku-first helper exists:
  - `server/tv-remote.ts`
  - `server/tv-remote-helper.ts`
  - `npm run dev:tv-remote`
  - `docs/tv-remote-mode.md`
- Recent research/synthesis docs:
  - `docs/deep-research-tv-remote-targets.md`
  - `docs/tv-remote-mode-subagent-synthesis.md`

## Product vision

TV Remote Mode should be a major selling point:

1. Users manually open the same streaming app/show/movie on their own TV.
2. Everyone pauses at `00:00` or chosen timestamp.
3. Everyone joins the Watch Sync room.
4. Everyone links their supported TV/device.
5. Everyone taps Ready.
6. Watch Sync does the countdown.
7. At GO, each participant’s own phone/local helper sends a generic Play/Play-toggle command to their own linked device.
8. If a participant has no linked/supported device, they use the existing manual countdown fallback.

## Important truth constraints

- Do **not** claim Watch Sync controls Netflix/Hulu/Disney/Prime/Max content or timestamps inside native TV apps.
- Do **not** claim universal Apple TV support unless a public, App-Store-safe path is proven.
- Do **not** claim universal Bluetooth remote support unless proven.
- Safe claim: “Works with every streaming service manually. On supported TVs, Watch Sync can press Play/Pause for you over Wi‑Fi after you open the show and pause at the sync point.”
- Backend coordinates room/countdown/state only. Each participant’s local device/phone/helper sends commands to their own TV on their own LAN.

## Mission

Research, verify, design, and implement the next best TV Remote Mode path.

## Scope

### 1. Audit current repo/state first

- Check git status.
- Read:
  - `package.json`
  - `src/App.tsx`
  - `src/domain.ts`
  - `server/tv-remote.ts`
  - `server/tv-remote-helper.ts`
  - `docs/tv-remote-mode.md`
  - `docs/tv-remote-mode-subagent-synthesis.md`
- Do not overwrite unrelated dirty work.

### 2. Correct current Roku implementation if needed

- Verify Roku official ECP key support.
- Prefer documented `Play` toggle for GO.
- Treat separate `Pause` as unverified unless proven by docs/hardware.
- Update UI/docs/copy to avoid overclaiming discrete Pause if needed.
- Keep Roku helper testable locally.

### 3. Research/verify device targets again, but only implementation-relevant details

Research:

- Roku / Roku TV
- LG webOS
- Samsung Tizen / Samsung Smart TV
- Fire TV / Firestick / Fire OS
- Android TV / Google TV
- Apple TV
- Major TV brands/platforms worth knowing: Vizio, Hisense, TCL, Sony/Bravia, Philips, Chromecast/Google Cast

For each, determine:

- Is generic Play/Pause remote control possible?
- Is it official or unofficial?
- Native iOS feasible?
- PWA feasible?
- Local helper feasible?
- Pairing/auth required?
- Exact command/protocol if known.
- Hardware needed.
- Product claim allowed.
- MVP priority: build now / next / beta / avoid.

### 4. Design product/platform architecture

Native iOS app is likely required for real LAN remote mode.

Define how native iOS bridges to the existing Watch Sync realtime backend.

Define participant device linking:

- each participant links their own TV
- backend only coordinates countdown
- each participant’s app sends its own local Play command

Define command idempotency:

- avoid duplicate Play/Play-toggle sends
- never retry risky toggle commands blindly

Define error states:

- device unreachable
- local network denied
- wrong Wi‑Fi
- pairing denied
- command sent but app ignored it
- unsupported device

Define UX fallback:

- manual countdown always remains available.

### 5. Implement what is safe in the current repo now

This repo is React/Vite PWA + Node helper + Cloudflare realtime.

Do **not** pretend to build a native iOS app inside this repo unless creating a documented scaffold/spec is appropriate.

Safe implementation targets:

- Update PWA TV Remote Mode UI/copy to match truthful product vision.
- Improve Roku helper and tests.
- Add adapter interfaces for TV remote targets if useful.
- Add LG webOS helper adapter only if exact command flow is verified enough to test with mock server.
- Add Samsung experimental adapter only if safe and clearly labeled beta.
- Add docs for native iOS build plan.
- Add compatibility matrix visible in docs and/or UI.

Do **not** deploy native claims or fake support for untested TVs.

### 6. Testing/verification

Run:

```bash
npm run build
npm run lint
npm test
npm run smoke:realtime
npm run smoke:realtime:prod
```

Also run helper health checks where applicable.

Run mock adapter tests for Roku/LG/Samsung if implemented.

If deploying frontend changes:

- Build with `VITE_REALTIME_URL=wss://api.kyrosdirect.tech`.
- Deploy to Cloudflare Pages project `watch-sync-mvp` only if tests pass.
- Verify live bundle contains new truthful strings and production WebSocket URL.

### 7. Deliverables

Produce:

- Updated code/docs as appropriate.
- Compatibility matrix:
  - Roku
  - LG webOS
  - Samsung
  - Fire TV / Firestick
  - Android TV / Google TV
  - Apple TV
  - Vizio
  - Hisense/TCL/Sony/Bravia/Chromecast where relevant
- Build roadmap:
  - Phase 1 Roku native iOS
  - Phase 2 LG
  - Phase 3 Samsung beta
  - Phase 4 Cast/Fire/Android research or helper
  - Apple TV manual-only unless proven otherwise
- Exact product copy:
  - hero copy
  - settings copy
  - compatibility disclaimer
- Done receipt with paths, commands, test results, deployment URL if deployed, and caveats.

## Safety

- Do not use or print secrets.
- Do not delete data.
- Do not buy domains or create paid services.
- Do not claim support that is not implemented or verified.
- Do not use private Apple APIs.
- Do not present unofficial Samsung/Apple/Android protocols as official.
- Keep manual mode as universal fallback.
