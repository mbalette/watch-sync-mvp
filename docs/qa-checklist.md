# QA checklist

Deterministic checks that do not require visual inspection:

```bash
npm install
npm run build
npm run lint
npm test
npm run smoke:realtime
node -e "JSON.parse(require('fs').readFileSync('extension/manifest.json','utf8')); console.log('manifest ok')"
node --check extension/service_worker.js
node --check extension/popup.js
node --check extension/content_script.js
```

Realtime health check when a local realtime server is running:

```bash
curl http://127.0.0.1:8787/health
```

Expected automated coverage:

- Unit/domain tests cover room creation, participant readiness, manual sync events, extension pairing, playback status, extension errors, and malformed extension event rejection.
- Realtime WebSocket tests cover two-client propagation and malformed message rejection.
- Realtime hardening tests cover these local bad-message cases:
  - `room_event` from a socket that has not joined the target room is rejected.
  - `room_event` with an `actorId` different from the socket participant is rejected.
  - Invalid participant payloads for `create_room` and `join_room` are rejected.
  - `pair_extension` for unknown rooms or participants is rejected.
  - Extension sockets cannot spoof PWA/user events or another extension id.
- `smoke:realtime` starts an ephemeral WebSocket server, connects two PWA-like Node WebSocket clients plus one extension-like client, creates and joins a room, sends a buffering event, pairs the extension, sends `playback_status`, and verifies snapshots propagate.
- Extension static checks parse `manifest.json` and run `node --check` against service worker, popup, and content script JavaScript.

Manual local extension check:

1. Run `npm run dev:realtime`.
2. Run `npm run dev`.
3. Open the PWA, create a room, click `Laptop auto-sync`, and copy pairing details.
4. Open `chrome://extensions`, enable Developer mode, Load unpacked, and choose `extension/`.
5. Open a normal desktop Chrome tab with an accessible HTML5 `<video>`.
6. Open the Watch Sync popup, paste the details, click `Detect video`, then `Pair this tab`.
7. Confirm the PWA panel changes from no extension paired to extension paired / last playback status.
8. Exercise play/pause/seek/countdown/resync events where the target site permits script control.

Local phone test steps for manual PWA room sync:

1. Put the computer and phones on the same trusted Wi-Fi/LAN.
2. Run `npm run lan:help` and choose one detected LAN address.
3. Terminal 1: run the printed `REALTIME_HOST=0.0.0.0 ... npm run dev:realtime` command.
4. Terminal 2: run the printed `VITE_REALTIME_URL=ws://<LAN-IP>:8787 npm run dev -- --host 0.0.0.0 --port 5173` command.
5. On phone A, open the printed `http://<LAN-IP>:5173/` URL, create a room, and verify the status pill says `Realtime WebSocket`.
6. On phone B, open the same URL and join with the room code or invite link.
7. Exercise ready/countdown plus resync/message behavior.

Security caveats:

- The realtime server is unauthenticated and in-memory; it is suitable for trusted local development only.
- Binding `REALTIME_HOST=0.0.0.0` and Vite `--host 0.0.0.0` exposes dev servers to the local network. Use trusted Wi-Fi only.
- Do not port-forward, tunnel, or expose ports `5173` or `8787` to the internet.
- The Chrome extension is local/unpacked only and should be loaded only from this project folder.
- Desktop Chrome auto-sync works only for accessible HTML5 video tabs; autoplay policy, DRM, cross-origin frames, and site controls may block play/pause/seek.
- No secrets, accounts, paid services, persistence, production auth, deployment, smart-TV automation, Chrome Web Store publishing, or native iOS bridge are included.
