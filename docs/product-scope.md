# Product scope

## Positioning

Watch Sync is a manual countdown/sync room for long-distance movie nights. It works with any TV manually by helping people coordinate the same timestamp, ready state, message, invite, and countdown.

Laptop auto-sync is a local-only unpacked Chrome extension MVP. It can pair a desktop Chrome tab with an accessible HTML5 `<video>` to the local realtime room. It is not smart-TV sync, not a native streaming app integration, and not production hosted realtime.

## MVP mode: TV manual sync coach

Core flow:

1. Both people open the PWA.
2. One creates a room; the other joins with a code/link.
3. The room shows the room code/invite and target timestamp, default `00:00`.
4. Both pause their TV at the target timestamp.
5. Both tap ready.
6. The app runs a high-contrast `3, 2, 1, PLAY` countdown.
7. Both hold play on their own remote and release on GO.
8. During watching, either person can send a message or request a manual resync/new countdown.

## MVP mode: local laptop/browser auto-sync

Optional local extension flow:

1. Start the local realtime server at `ws://127.0.0.1:8787`.
2. Create or join a PWA room.
3. Click `Laptop auto-sync` to show real local pairing details.
4. Load the unpacked MV3 extension from `extension/` in desktop Chrome.
5. On a tab with an accessible HTML5 video, paste the room code, participant id, and WebSocket URL into the popup.
6. Pair the tab. The extension publishes playback status and attempts supported play/pause/seek commands from room events.

## Included in this pass

- Mobile-first dark cinema/date-night UI.
- Room create/join UX.
- Participant display names and ready states.
- Target timestamp setup.
- Shared local countdown.
- Solo demo countdown for one-person public preview.
- Browser vibration attempt where supported.
- Local WebSocket room sync for two local clients/devices during development.
- LocalStorage cross-tab room sync as a fallback when the realtime server is unavailable.
- Extension state in the typed domain model: pairings, playback status, and extension errors.
- Server `pair_extension` message with room/participant validation and extension event restrictions.
- Compact PWA pairing panel for the local unpacked Chrome extension.
- Plain MV3 Chrome extension in `extension/` with popup, service worker, and content script.
- Docs for protocol/scope/QA/extension setup.

## Excluded in this pass

- Public deployment.
- Production hosted realtime infrastructure.
- Accounts, auth, billing, secrets, or paid services.
- Native iOS implementation.
- Chrome Web Store publishing.
- Smart-TV, streaming box, native TV app, Netflix TV app, or DRM service automation.
- Broad host permissions or site-specific streaming integrations.
- Trademarked streaming logos.
- Push notifications.

## Future product paths

### Production realtime

The current pass includes a local in-memory WebSocket server for development and local-network proof. A production version still needs hosted transport, auth/abuse controls, durable persistence decisions, and clock/latency strategy.

### Chrome/laptop auto-sync hardening

The extension MVP proves the local pairing and command path. A production-quality browser path would need UX polish, reconnect hardening, site compatibility testing, user permissions review, and a distribution plan.

### Native iOS

A native app can improve haptics, deep links, notifications, lock-screen reliability, and perceived timing precision while sharing the same room/event protocol.
