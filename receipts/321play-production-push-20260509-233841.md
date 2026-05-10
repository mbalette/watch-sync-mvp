# 321 Play production push receipt — 2026-05-09 23:38 CDT

## Verdict

Pushed the current local 321 Play build to Cloudflare Pages production. Both `https://app.kyrosdirect.tech/` and `https://321play.kyrosdirect.tech/` now serve the same fresh Pages deployment and the same asset bundle as the deployment URL.

## Deploy target

- Repo: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`
- Pages project: `watch-sync-mvp`
- Source commit label used by Pages: `a32dc04`
- New Pages deployment: `https://6fd87eed.watch-sync-mvp.pages.dev`
- Custom domains verified:
  - `https://app.kyrosdirect.tech/`
  - `https://321play.kyrosdirect.tech/`
- Backend health checked: `https://api.kyrosdirect.tech/health`

## Commands run

```text
npm run typecheck
# exit 0

npm run lint -- --quiet
# exit 0

npm run build:prod
# exit 0
# dist/index.html                   1.04 kB │ gzip:  0.49 kB
# dist/assets/index-Udi3GsfT.css   74.16 kB │ gzip: 13.28 kB
# dist/assets/index-BdoYlZ5K.js   347.61 kB │ gzip: 97.96 kB

npx wrangler pages deploy dist --project-name watch-sync-mvp --branch main --commit-dirty=true
# Compiled Worker successfully
# Uploaded 2 files (4 already uploaded)
# Uploading Functions bundle
# Deployment complete: https://6fd87eed.watch-sync-mvp.pages.dev
```

Production realtime smoke:

```text
REALTIME_URL=wss://api.kyrosdirect.tech npm run smoke:realtime:prod
# created production smoke room WLPGU6
# guest joined and both PWA clients received participant snapshot
# chat_message propagated to guest
# ready event propagated to host
# countdown_started propagated to guest
# extension paired and snapshots propagated
# extension playback_status propagated to both PWA clients
```

## Live verification

HTTP checks returned `HTTP/2 200` for:

- `https://6fd87eed.watch-sync-mvp.pages.dev/`
- `https://app.kyrosdirect.tech/`
- `https://321play.kyrosdirect.tech/`
- `https://api.kyrosdirect.tech/health`

Bundle proof for all three frontend URLs:

- Assets: `assets/index-BdoYlZ5K.js`, `assets/index-Udi3GsfT.css`
- JS SHA-256: `0da535a81bc8979a942b01b807d1c8060495cdfb4069a1d6ab3f3d8a2512e9c8`
- Markers present in live bundle:
  - `wss://api.kyrosdirect.tech`
  - `new WebSocket`
  - `create_room`
  - `join_room`
  - `Identify with a photo`
  - `Photo identifies your device only. Not saved.`
  - `What do you watch on?`

## Production screenshots

Directory:

`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/production-321play-deploy-20260509/`

- `app-default.png` — `https://app.kyrosdirect.tech/`, SHA-256 `edfda793d923b49c3e66147699f8c9493958198655812598270a744589c480cf`
- `321play-default.png` — `https://321play.kyrosdirect.tech/`, SHA-256 `edfda793d923b49c3e66147699f8c9493958198655812598270a744589c480cf`
- `app-realtime.png` — `https://app.kyrosdirect.tech/?realtime=1`, SHA-256 `ef53f0ecdf3baeba531337582d9c6c4496362477c8570dae9a27b517dbc32627`
- `contact-sheet.png` — SHA-256 `d4f5a649e6276fe118ad7c8eca2034ac353b5a810ff3fc2d05f6dc2e543a5d33`

Default live body excerpt for both custom domains:

```text
3-2-1 Play
Watch Together
FROM ANYWHERE
YOUR NAME
Create a room
Already invited? Enter a code
Local visual demo. Reset state
```

## Current repo state after push

```text
## main...origin/main
 M src/App.tsx
 M src/LiveRoomApp.tsx
 M src/tv-remote-device.ts
?? receipts/jackie-final-321play-photo-id-visual-20260509.md
?? receipts/kramer-vizio-d2c-autoplay-goal-20260509.md
?? screenshots/production-321play-deploy-20260509/
?? scripts/capture-production-321play-deploy-20260509.mjs
```

## Caveats

- This was a Cloudflare Pages direct upload from a dirty working tree (`--commit-dirty=true`), not a git commit/push.
- The default route now shows the local visual 321 Play flow. The realtime-capable room app remains available at `?realtime=1`, and production WebSocket smoke passed.
- Photo/device-ID recognition and TV hardware control remain visual/unwired unless separately implemented.
