# Watch Sync MVP

Mobile-first React/Vite/TypeScript PWA for couples remote watching. The core product is still a manual countdown/sync room. Laptop auto-sync is now a local-only unpacked Chrome extension MVP for accessible HTML5 videos, not smart-TV automation.

## What it does

- Create a realtime local room with a short room code when the local WebSocket server is running.
- Join the same room from another browser/device on the same development network using the room code or invite link.
- Fall back to localStorage sync for same-browser local development when the WebSocket server is not connected.
- Capture participant display names.
- Set a target timestamp near the top of the room, defaulting to `00:00`.
- Display participant ready states and a shared `3, 2, 1, PLAY` countdown.
- Sync manual resync and simple partner message events across WebSocket clients.
- Show a compact Laptop auto-sync panel with room code, participant id, and WebSocket URL.
- Pair an unpacked local Chrome extension from `extension/` to a room and an active tab.
- Let the extension detect a usable HTML5 `<video>`, publish playback status, and respond to supported room events with play/pause/seek/scheduled play attempts.

## Local realtime development

Terminal 1:

```bash
npm install
npm run dev:realtime
```

Terminal 2:

```bash
npm run dev
```

Open the Vite URL, usually `http://localhost:5173/`. The browser client connects to `ws://127.0.0.1:8787` by default. To point the browser at another local server URL, start Vite with `VITE_REALTIME_URL`, for example:

```bash
VITE_REALTIME_URL=ws://192.168.1.20:8787 npm run dev
```

Create a room on one client, then join from a second browser/device with the room code or copied invite link. Both clients show a small sync status pill: `Realtime WebSocket` when connected, otherwise local fallback.

## Local unpacked Chrome extension auto-sync MVP

1. Start `npm run dev:realtime` so `ws://127.0.0.1:8787` is available.
2. Start/open the PWA, create or join a room, and click `Laptop auto-sync`.
3. Copy the pairing details from the panel: room code, this participant id, and WebSocket URL.
4. In desktop Chrome, open `chrome://extensions`, enable Developer mode, choose Load unpacked, and select this project’s `extension/` folder.
5. Open a laptop tab containing an accessible HTML5 `<video>`.
6. Open the extension popup, paste the pairing details, click `Detect video`, then `Pair this tab`.
7. The room should show extension paired / last playback status as the tab reports play/pause/seek/time updates.

The extension responds where reasonable to room events:

- `countdown_started`: schedules play at `startsAtEpochMs + durationSeconds * 1000`.
- `play_now`: calls `video.play()`.
- `pause_requested` / `buffering_started`: calls `video.pause()`.
- `setup_updated` / `timestamp_submitted`: parses timestamp and seeks.
- `resync_requested`: pauses and seeks if the target timestamp is parseable.

## Local fallback mode

If the WebSocket server is unavailable, the PWA still works in fallback mode using `localStorage` and browser `storage` events. Fallback mode only syncs tabs/windows in the same browser profile on the same device; it is not cross-device realtime and cannot pair the extension through the server.

## Verification

```bash
npm run build
npm run lint
npm test
npm run smoke:realtime
node -e "JSON.parse(require('fs').readFileSync('extension/manifest.json','utf8')); console.log('manifest ok')"
node --check extension/service_worker.js
node --check extension/popup.js
node --check extension/content_script.js
```

`npm run smoke:realtime` starts an ephemeral WebSocket server, connects PWA-like Node WebSocket clients, creates a room, joins a guest, pairs an extension-like client, sends playback status, and verifies propagated snapshots.

## Limitations

- Realtime rooms are ephemeral in-memory development rooms. Restarting the server clears rooms.
- No accounts, auth, persistence, production deployment, or internet relay are included.
- Desktop Chrome only for auto-sync; the extension is unpacked/local and not in the Chrome Web Store.
- Local WebSocket only by default: `ws://127.0.0.1:8787`.
- Works only for pages that expose a usable HTML5 `<video>` to extension content scripts.
- Autoplay policy, DRM, cross-origin iframes, site controls, and permission restrictions may block play/seek/status detection.
- No smart-TV, native TV app, streaming box, Netflix TV app, or mobile native app control is claimed.
- Countdown timing is client-rendered from shared timestamps and is good for local coaching, not a production-grade clock synchronization system.

## Safety / positioning

- No deployment is included.
- No secrets, accounts, paid services, or external APIs are required.
- Do not port-forward, tunnel, or expose local dev ports to the internet.
- Auto-sync means this local unpacked Chrome extension MVP on an accessible laptop/browser video tab, not smart-TV automation.

## Docs

- `docs/product-scope.md` — product scope, honest positioning, included/excluded work.
- `docs/protocol.md` — typed room state, events, extension pairing, and local realtime transport protocol.
- `docs/qa-checklist.md` — deterministic QA commands, local extension checks, and security caveats.
- `extension/README.md` — local unpacked Chrome extension setup and limitations.
- `docs/ios-native-bridge.md` — future native iOS bridge notes.
