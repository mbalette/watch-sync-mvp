# 321 Play production deploy receipt — 2026-05-09

## Verdict

Deployed current `main` to Cloudflare Pages and attached `321play.kyrosdirect.tech` to the existing `watch-sync-mvp` Pages project.

## Git

- Implementation commit: `afbcc12f3916140302282a3a458a3df5ca5c22af`
- Deploy receipt commit: `917fd63` before final amend
- Branch: `main`
- Remote push: `origin/main` updated through the deploy receipt commit

## Deploy

- Pages project: `watch-sync-mvp`
- First deployment URL: `https://d86c3df9.watch-sync-mvp.pages.dev`
- Final redeployment URL after adding this receipt: `https://1feca94b.watch-sync-mvp.pages.dev`
- Requested production custom domain: `https://321play.kyrosdirect.tech/`
- Existing alias also updated by same Pages project: `https://app.kyrosdirect.tech/`

Command:

```bash
npm run build:prod
npx wrangler pages deploy dist \
  --project-name watch-sync-mvp \
  --branch main \
  --commit-hash afbcc12f3916140302282a3a458a3df5ca5c22af \
  --commit-message "feat: add 321 Play photo ID visual flow"
```

Wrangler result:

```text
Compiled Worker successfully
Uploaded 0 files (6 already uploaded) on final redeploy
Uploading Functions bundle
Deployment complete: https://1feca94b.watch-sync-mvp.pages.dev
```

## DNS / custom domain changes

- Added Cloudflare Pages custom domain: `321play.kyrosdirect.tech` → status observed as `pending` immediately after creation.
- Added DNS record in the `kyrosdirect.tech` zone:
  - `CNAME 321play.kyrosdirect.tech -> watch-sync-mvp.pages.dev`, proxied.
- Accidental initial CNAME in the `kyrosdirect.com` zone was immediately removed after detecting the env default zone was `.com`, not `.tech`.

## Verification

Build/test commands passed before deploy:

```text
npm run typecheck
npm run lint -- --quiet
npm run build
npm run build:prod
```

Live deploy checks:

```text
https://d86c3df9.watch-sync-mvp.pages.dev/ -> HTTP 200
https://app.kyrosdirect.tech/ -> HTTP 200
https://321play.kyrosdirect.tech/ with --resolve to Cloudflare edge IP -> HTTP 200
https://api.kyrosdirect.tech/health -> {"ok":true,...}
```

Bundle proof from `321play.kyrosdirect.tech` via Cloudflare edge resolve:

```text
assets/index-BGkOiNgI.js present
"3-2-1 Play" present
"Watch Together" present
"No one has joined yet" present
"Alex" absent
"Meredith" absent
"new WebSocket" absent
"create_room" absent
"join_room" absent
```

## Readiness caveat

The deployed app is the visual/local 321 Play flow. It does **not** currently contain the old WebSocket room transport in the active bundle, and the new photo/device-ID flow was explicitly built as visuals only: no backend/API/Anthropic/photo storage/real device wiring.

Practical implication: it is OK to open and walk through on one phone/browser, but it is not verified as a real two-person synced girlfriend flow on separate devices.
