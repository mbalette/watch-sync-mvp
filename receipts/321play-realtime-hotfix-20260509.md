# 321 Play realtime hotfix receipt — 2026-05-09

## Verdict

Hotfix restores the real two-person WebSocket room app as the default `321play.kyrosdirect.tech` experience. The visual 321 Play flow remains available behind `?visual=1`, and reference demo screens remain behind `?demo=<id>`.

## Root cause

The visual/photo-ID implementation replaced `src/App.tsx` default rendering with `AppFlow`, a local visual state machine. That removed the active imports/usages of `createWebSocketRoomTransport`, `create_room`, and `join_room` from the production bundle even though the Cloudflare realtime Worker was healthy.

## Change

- Added `src/LiveRoomApp.tsx` from the previous realtime-capable app implementation.
- Updated `src/App.tsx` routing:
  - default `/` → `LiveRoomApp` realtime room app
  - `?visual=1` → new 321 Play visual/photo-ID flow
  - `?demo=<id>` → reference screen renderer

## Verification

Commands passed:

```text
npm run typecheck
npm run lint -- --quiet
npm run build:prod
REALTIME_URL=wss://api.kyrosdirect.tech npm run smoke:realtime:prod
```

Production smoke result:

```text
created production smoke room DRTBSG
guest joined and both PWA clients received participant snapshot
chat_message propagated to guest
ready event propagated to host
countdown_started propagated to guest
extension paired and snapshots propagated
extension playback_status propagated to both PWA clients
```

Local production bundle proof before deploy:

```text
new WebSocket -> true
create_room -> true
join_room -> true
wss://api.kyrosdirect.tech -> true
3-2-1 Play -> true
Watch Together -> true
```

## Caveats

This restores the real synced room transport. It does not make photo/device-ID Auto Play real: photo recognition, Anthropic/API behavior, photo storage, and hardware TV commands remain unwired/visual-only.
