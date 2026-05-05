# Cloudflare production realtime backend

Production realtime for Watch Sync is implemented as a Cloudflare Worker plus one Durable Object WebSocket room host.

## URLs

- Production frontend: `https://app.kyrosdirect.tech`
- WebSocket endpoint: `wss://api.kyrosdirect.tech`
- Health endpoint: `https://api.kyrosdirect.tech/health`
- Backend Worker name: `watch-sync-realtime`
- Backend workers.dev fallback: enabled by `workers_dev = true` in `wrangler.realtime.toml`
- Pages project: `watch-sync-mvp`

## Deploy

Do not put tokens in this repo or in command output. Authenticate Wrangler outside the repo, then run:

```sh
npm run deploy:realtime:cloudflare
```

The deploy config is `wrangler.realtime.toml`. It binds Durable Object namespace `ROOMS` to class `WatchSyncRoomDurableObject` and deploys Worker `watch-sync-realtime` with `workers_dev = true`, so the backend is reachable through the workers.dev fallback as well as through the production custom domain `https://api.kyrosdirect.tech`.

`api.kyrosdirect.tech` was attached with the Cloudflare Workers custom domains API (`PUT /accounts/.../workers/domains`), not with a Wrangler `route = { ... }` entry. Wrangler route attachment failed earlier against `/zones/.../workers/routes` because the available credentials hit a zone route permission boundary.

The frontend is served from Cloudflare Pages at `https://app.kyrosdirect.tech`. The Pages project is `watch-sync-mvp`, and DNS has `app` CNAMEd to `watch-sync-mvp.pages.dev`.

## Smoke test

After deploy and DNS/custom-domain routing are live:

```sh
REALTIME_URL=wss://api.kyrosdirect.tech npm run smoke:realtime:prod
```

The smoke opens three WebSocket clients: host PWA, guest PWA, and paired extension. It validates room creation, guest join, chat/ready/countdown propagation, extension pairing, and extension playback status propagation.

## Frontend production build

```sh
npm run build:prod
```

This sets `VITE_REALTIME_URL=wss://api.kyrosdirect.tech` for the Vite build.

## Protocol/security parity

The Worker/Durable Object implements the same MVP protocol as `server/realtime.ts`:

- client to server: `create_room`, `join_room`, `pair_extension`, `room_event`, `ping`
- server to client: `status`, `room_snapshot`, `pong`, `error`

It preserves the local backend's room-event guards:

- invalid participants are rejected
- `pair_extension` requires an existing room and participant
- direct `extension_paired` room events are rejected; clients must use `pair_extension`
- a socket must be joined to the target room before sending `room_event`
- `room_event` actor IDs must match the joined participant
- extension sockets may only send `playback_status`, `extension_error`, or `extension_command`
- extension actor IDs and extension IDs must match the paired extension session

## Honest limitations

- MVP uses one globally named Durable Object instance: `watch-sync-global-room-v1`.
- Rooms are in memory and ephemeral. They are not a durable audit log or recovery store.
- The single global Durable Object is simple and keeps all rooms mutually discoverable, but it can become a scaling bottleneck. If usage grows, shard by normalized room ID or another stable room key.
- Room cleanup mirrors the local backend's TTL behavior and removes inactive/empty rooms opportunistically on incoming messages.
- This backend does not provide smart-TV/native-app control. Extension automation is limited to browser/HTML5-video contexts already represented by the product.
