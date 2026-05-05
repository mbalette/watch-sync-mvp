# TV Remote Mode feasibility and MVP

Verdict: Roku-first generic remote control is feasible as the first TV Remote Mode proof path, but **not** universal smart-TV streaming sync.

## Honest product claim

Hero copy:

> Movie night starts together. Open the same show on any TV, pause at the sync point, then Watch Sync counts everyone in. On supported TVs, it can press Play for you over home Wi‑Fi.

Settings copy:

> TV Remote Mode is optional. Each person links their own supported TV/device on their own Wi‑Fi. Watch Sync coordinates the room and countdown; your phone or local helper sends the local Play command.

Compatibility disclaimer:

> Manual sync works with every streaming service because you control the TV yourself. Remote Mode is best-effort and only sends generic remote keys on supported devices after you open the show and pause it. It does not choose Netflix/Hulu/Disney/Prime/Max content, seek inside native TV apps, or guarantee every app will obey Play/Pause.

Avoid:

> Automatically syncs Netflix/Hulu/Disney on every smart TV.

## Implemented MVP path

Files:

- `server/tv-remote.ts` — Roku ECP client for `GET /query/device-info` and `POST /keypress/Play`; production default port `8060`, test-injectable port for mock tests.
- `server/tv-remote-helper.ts` — local HTTP helper exposing `/health`, `/roku/device-info`, and `/roku/keypress` with CORS for local dev; exports a server factory for endpoint tests.
- `src/App.tsx` — `TV Remote Mode` drawer with Roku IP, helper URL, Test Roku, and Send Play.
- `server/tv-remote.test.ts` — mock Roku ECP tests for device-info parsing, Play dispatch, and rejection of unsupported keys such as `Pause` until verified.

Run locally:

```bash
npm run dev:tv-remote
# helper: http://127.0.0.1:8790
```

Then in the app:

1. Open your streaming app on Roku manually.
2. Seek/pause at the shared timestamp.
3. Open `TV Remote Mode`.
4. Enter the Roku IP, e.g. `192.168.1.42`.
5. Test Roku.
6. Tap Send Play, or let countdown GO attempt Play when the host has a Roku configured.

## Why this is helper/native, not pure hosted PWA

Roku ECP is local plain HTTP on port `8060`:

```http
GET  http://<roku-ip>:8060/query/device-info
POST http://<roku-ip>:8060/keypress/Play
```

A hosted HTTPS PWA calling a private LAN `http://192.168.x.x` target can be blocked by browser mixed-content, CORS, Private Network Access, local-network permission, and discovery restrictions. On iPhone, `127.0.0.1` is the phone, not the developer machine. Reliable iOS TV Remote Mode therefore needs one of:

- a native iOS app using Local Network permission and Bonjour/mDNS/SSDP where allowed;
- a same-LAN companion/helper device with a reachable endpoint; or
- device-specific pairing integrations implemented natively.

The current code is a testable Roku-first proof path, not a finished App Store TV remote.

Remote commands are best-effort. Even when a device accepts a generic keypress, an individual streaming app may ignore it depending on focus, buffering, ads, overlays, DRM, or playback state. Do not retry risky toggle commands blindly.

## Compatibility matrix

| Target | Generic Play/Pause possible? | Official? | Native iOS feasible? | PWA feasible? | Local helper feasible? | Pairing/auth | Exact command/protocol | Hardware needed | Allowed product claim | MVP priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Roku / Roku TV | Yes, generic remote keys. Current MVP sends `Play` only. | Official ECP. | Yes: LAN HTTP + local-network permission. | Unreliable from hosted HTTPS PWA. | Yes. | Usually no app pairing; Roku network/mobile control setting must allow. | `GET /query/device-info`; `POST /keypress/Play` on port `8060`. | Roku player/Roku TV. | Supported Roku devices can receive a best-effort Play key after user stages content. | Build now / Phase 1. |
| LG webOS | Likely yes for media controls after pairing. | Connect SDK official; raw SSAP/WebSocket details are semi-official/implementation-specific. | Yes, with pairing/token storage. | Weak/unreliable. | Yes. | TV prompt/client key. | Common SSAP commands include `ssap://media.controls/play` and `pause`; hardware validation required. | LG webOS TV. | Some LG webOS TVs may support generic play/pause after pairing. | Next / Phase 2. |
| Samsung Tizen / Smart TV | Possible on many models. | LAN WebSocket remote protocol is unofficial for external apps; official remote docs target TV apps. | Feasible but brittle. | Weak/unreliable. | Yes. | TV approval/token on supported models. | Unofficial WebSocket `ms.remote.control`, keys such as `KEY_PLAY`, `KEY_PAUSE`, `KEY_PLAYPAUSE`. | Samsung TV test matrix. | Experimental Samsung beta may send generic keys after local TV approval. | Beta / Phase 3. |
| Fire TV / Firestick / Fire OS | Possible via ADB media key events. | ADB/key events official developer tooling, not consumer remote product API. | Not practical directly. | No. | Yes, advanced helper only. | Developer options, ADB pairing/RSA auth. | `adb shell input keyevent KEYCODE_MEDIA_PLAY_PAUSE` or keycodes `85`, `126`, `127`. | Fire TV with debugging enabled + helper machine. | Advanced helper mode only; not mainstream consumer setup. | Research/helper / Phase 4. |
| Android TV / Google TV | Possible via ADB; Cast only for Cast sessions. | ADB/Cast official; generic Android TV remote service is not public/stable for this use. | Not generic without private/unpublished protocols. | No generic path. | Yes via ADB; Cast path if app owns session. | ADB pairing or Cast session selection. | ADB keycodes `85/126/127`; Cast sender `play()`/`pause()` only for active Cast media. | Android/Google TV + debug/helper or Cast device. | Support depends on mode: controllable Cast session or advanced ADB helper. | Phase 4 research. |
| Apple TV | Not via public App Store-safe generic LAN remote API. | Unofficial/private protocols exist; avoid for App Store MVP. | Manual-only unless public-safe path is proven. | No. | Possible with unofficial helper, not product claim. | Pairing/PIN varies by unofficial protocol. | Unofficial MRP/Companion/AirPlay libraries such as pyatv. | Apple TV + helper if ever explored. | Manual-only for MVP. | Avoid. |
| Vizio SmartCast | Possible on some models. | Public consumer LAN API unclear; community APIs exist. | Feasible but experimental. | Weak. | Yes. | Pairing PIN/token. | Community HTTPS/REST pairing and `key_command`. | Vizio SmartCast TV. | Some Vizio TVs may support generic keys after pairing; experimental only. | Later beta. |
| Hisense / TCL | Depends on TV OS, not brand. | Roku models use official Roku ECP; Google/Android models use Android limits; VIDAA mostly unofficial/community. | Depends on OS. | Generally weak. | Depends on OS. | Depends on OS. | Route by detected platform: Roku ECP, Android ADB/Cast, VIDAA/community APIs. | Specific OS/model. | Support depends on TV operating system; Roku models follow Roku path. | Roku build now; others research. |
| Sony / Bravia | Possible on many IP-control-capable models. | Official for Bravia Professional Displays; consumer support varies. | Feasible with enabled IP control. | Poor. | Yes. | Enable IP control; PSK/auth may be required. | IRCC-IP / REST remote codes from `getRemoteControllerInfo`. | Sony/Bravia test hardware. | Supported Bravia IP Control displays may receive generic remote keys. | Later beta. |
| Philips | Possible on JointSpace models; Android Philips follows Android path. | JointSpace is legacy/official-ish for supported TVs. | Feasible for matching models. | Poor. | Yes. | Varies: none, pairing, or digest auth by generation. | JointSpace `POST /6/input/key` with model-supported key names such as `PlayPause`. | Philips JointSpace TV. | Some Philips TVs may support generic keys; model-specific. | Later/niche. |
| Chromecast / Google Cast | Yes only for active Cast sessions controlled by the app. | Official Cast SDK. | Feasible for a Cast sender/session. | Browser/platform-dependent. | Usually not needed. | User selects Cast target/session. | Cast media `play()` / `pause()` on active receiver media. | Chromecast/Cast-enabled TV. | Cast sessions can be controlled if Watch Sync owns/joins the Cast session; no arbitrary TV-app control. | Separate product track. |

## Native iOS bridge architecture

- iOS app connects to the existing Watch Sync realtime backend (`wss://api.kyrosdirect.tech`) using the same room protocol as the PWA.
- Each participant links only their own local device. Device records stay local-first: platform, IP/hostname, pairing token/client key where required, last test result, and capability flags.
- Backend coordinates room, ready state, countdown, server time, and `play_now` events. It does **not** contact TVs or store LAN credentials.
- At countdown GO, each participant app checks its local linked-device state and sends one local command (`Play` or platform-specific equivalent) to its own TV.
- Idempotency: store a `lastCommandKey = roomId + countdownStartedAt + participantId + deviceId + command`. If already sent, do not send again. Never blindly retry toggle commands; show an error and keep manual fallback.

## Error states

- Device unreachable: "TV not reachable. Check that your phone and TV are on the same Wi‑Fi."
- Local Network denied: "Local Network access is off. Enable it in iOS Settings to link this TV."
- Wrong Wi‑Fi/VPN: "This phone cannot see that TV from the current network."
- Pairing denied/expired: "TV pairing was denied or expired. Try linking again while near the TV."
- Command sent but app ignored it: "Play was sent, but the TV app may have ignored it. Use the countdown manually."
- Unsupported device: "Manual countdown still works. Remote control is not supported for this device yet."

Manual countdown remains available in every error state.

## Build roadmap

1. **Phase 1 — Roku native iOS + helper hardening**: manual IP entry, optional SSDP discovery, Local Network permission copy, `device-info` probe, one-shot `Play` at GO, no risky retry, mock helper tests plus one real Roku hardware matrix.
2. **Phase 2 — LG webOS**: pairing prompt, client-key storage, `play`/`pause` media controls behind hardware validation, app-by-app caveat.
3. **Phase 3 — Samsung beta**: clearly labeled unofficial/beta WebSocket adapter, approval/token persistence, limited hardware matrix, no official Samsung claim.
4. **Phase 4 — Cast/Fire/Android research/helper**: Cast only for sessions Watch Sync controls; ADB helper for Fire/Android as advanced/dev-mode path, not consumer default.
5. **Apple TV**: manual-only unless a public, App-Store-safe generic remote path is proven.

## Verification sources

Accessed 2026-05-05:

- Roku ECP: https://developer.roku.com/en-ca/docs/developer-program/dev-tools/external-control-api.md
- LG Connect SDK: https://webostv.developer.lge.com/develop/guides/connect-sdk-guide
- Samsung Remote Control guide: https://developer.samsung.com/smarttv/develop/guides/user-interaction/remote-control.html
- Amazon Fire TV Remote Input: https://developer.amazon.com/docs/fire-tv/remote-input.html
- Android ADB: https://developer.android.com/tools/adb
- Android KeyEvent: https://developer.android.com/reference/android/view/KeyEvent
- Google Cast media API: https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.Media
- Sony Bravia Professional Displays remote control: https://pro-bravia.sony.net/remote-display-control/
- Sony Bravia IRCC-IP: https://pro-bravia.sony.net/remote-display-control/ircc-ip/
- Philips JointSpace legacy docs: https://jointspace.sourceforge.net/download.html
- Vizio developer portal: https://api.developer.external.plat.vizio.com/
- Community Vizio SmartCast API lead: https://github.com/exiva/Vizio_SmartCast_API
- Apple TV unofficial integration lead only: https://github.com/postlund/pyatv






## Find next watch / Tonight's queue

The PWA now includes a Phase 1 recommendation drawer and visible room queue:

- `Find watch` opens service filters, TMDB browse/search, and a safe mock catalog fallback.
- Filters include Netflix, Prime Video, Disney+, Paramount+, Max, Hulu, Peacock, and Apple TV+.
- Result cards show poster/fallback art, title, year, movie/series type, providers, overview, and rating label when available.
- `Add to queue` posts a `recommendation_sent` room event; duplicate cards are disabled/marked as already queued.
- `Tonight's queue` is always visible in the room, including the empty state: “Search by your services, add a few picks, then let the room vote on what to watch tonight.”
- Queue derivation is deterministic: dedupe by source/media id where possible and by normalized title/year/providers for mock/local cards.
- Vote totals are derived client-side from the latest `recommendation_voted` event per participant, so a participant can change their yes/no vote.
- `Set tonight` posts `recommendation_selected`, updates the room title/service, resets ready/countdown state, and reminds everyone to open the selected title in their own streaming app before using manual countdown or TV Remote Mode.
- This phase intentionally does **not** scrape Rotten Tomatoes or JustWatch.

Production data plan:

- Use TMDB search/details/watch-provider endpoints for title metadata, descriptions, posters, and provider availability.
- Add TMDB attribution where required.
- Use OMDb only as optional rating enrichment if license/limits are acceptable.
- Treat true Rotten Tomatoes score display as licensed-only; otherwise use an external details link and non-RT rating labels.

## Linked-device manager and GO command routing

The PWA now includes a local linked-device manager inside `TV Remote Mode`:

- Platform picker: Roku, LG webOS, Samsung/Tizen, Sony/Bravia, Philips JointSpace, Vizio SmartCast.
- Helper URL field defaults to `http://127.0.0.1:8790`.
- Platform-specific fields stay local in browser storage:
  - LG `clientKey`
  - Samsung `token`
  - Sony `psk` and Play `irccCode`
  - Philips JointSpace API version
  - Vizio auth token
- Buttons:
  - `Save local`
  - `Pair/Test`
  - `Send Play`
- Countdown GO calls the selected linked device once through the safe platform-specific helper endpoint:
  - Roku: `/roku/keypress` with `Play`
  - LG: `/lg-webos/media` with `play` after `clientKey`
  - Samsung: `/samsung/keypress` with `KEY_PLAY`
  - Sony: `/sony/ircc` after a Play IRCC code is provided
  - Vizio: `/vizio/key` with `play`
  - Philips: automatic GO is blocked because `PlayPause` is a risky toggle; manual countdown remains the fallback.

The room backend still only coordinates room/countdown/state. Device hostnames, pairing tokens, PSKs, IRCC codes, and auth tokens are not sent to the realtime backend.

## Expanded adapter build plan beyond Roku

This is the concrete non-Roku backlog. It is intentionally protocol/platform-based, not brand-hype-based.

### Build/test now in code

- Shared target metadata and safe-claim contract: `server/tv-remote-targets.ts`.
- Helper `/targets` endpoint: exposes all researched targets and clearly marks which are actually implemented in the helper.
- LG webOS experimental helper adapter: `server/lg-webos-remote.ts` with `/lg-webos/pair` and `/lg-webos/media`.
- Samsung beta helper adapter: `server/samsung-tizen-remote.ts` with `/samsung/pair` and `/samsung/keypress`.
- Mock protocol tests: `server/lg-webos-remote.test.ts`, `server/samsung-tizen-remote.test.ts`, and `server/tv-remote-targets.test.ts` ensure adapters send only narrow generic keys and keep hardware validation false.
- Cast session scaffold: `src/cast-session-remote.ts` controls only injected/active Cast media sessions, never arbitrary native TV apps.
- ADB helper scaffold: `server/adb-helper-remote.ts` builds safe argv arrays for discrete media play/pause only; no shell strings and no risky play/pause toggle for GO.
- Sony/Bravia beta helper adapter: `server/sony-bravia-remote.ts` with `/sony/remote-controller-info` and `/sony/ircc`.
- Philips JointSpace experimental helper adapter: `server/philips-jointspace-remote.ts` with `/philips/key`.
- Vizio SmartCast experimental helper adapter: `server/vizio-smartcast-remote.ts` with `/vizio/key`.

### Phase 2: LG webOS experimental adapter

Evidence supports mock implementation now:

- Discovery service from Connect SDK: `urn:lge-com:service:webos-second-screen:1`.
- WebSocket pairing/register flow with `PROMPT` and locally stored `client-key`.
- Media commands: `ssap://media.controls/play` and `ssap://media.controls/pause`.

Implemented helper scope:

- `server/lg-webos-remote.ts` with explicit `url`/host, PROMPT pairing, local client-key return, and `play`/`pause` command requests.
- `server/lg-webos-remote.test.ts` with a mock WebSocket TV.
- `POST /lg-webos/pair` and `POST /lg-webos/media` in `server/tv-remote-helper.ts`.
- UI label: `LG webOS — Helper adapter / hardware validation required`. Hardware validation required before “supported LG” copy.

### Phase 3: Samsung beta adapter

Evidence supports mock implementation, but not official product support:

- Official Samsung docs cover Tizen TV apps receiving remote keys, not external LAN control.
- Community LAN WebSocket protocol commonly uses `/api/v2/channels/samsung.remote.control` on ports `8001/8002`.
- Key message: `method: "ms.remote.control"`, `DataOfCmd: "KEY_PLAY"` / `"KEY_PAUSE"`.

Implemented helper scope:

- `server/samsung-tizen-remote.ts` behind `samsung-tizen-beta` flag.
- Token extraction and storage remain local-only.
- `POST /samsung/pair` and `POST /samsung/keypress` in `server/tv-remote-helper.ts`.
- GO-safe command is only `KEY_PLAY`; no blind toggle retries.
- UI label: `Samsung — Helper beta / unofficial local protocol`.

### Phase 4: Cast and ADB split

Cast:

- Official path only for Cast media sessions Watch Sync starts or joins.
- Implemented scaffold: `src/cast-session-remote.ts` + `src/cast-session-remote.test.ts`.
- Keep as separate `cast-session` mode, not generic TV remote.

Android TV / Google TV / Fire TV:

- ADB is official developer tooling, but consumer-hostile.
- Implemented scaffold: `server/adb-helper-remote.ts` + `server/adb-helper-remote.test.ts`.
- Strict command allowlist, argv arrays only, no shell string concatenation.
- Product copy must say developer/debugging setup required.

### Phase 5: Other brand-specific beta queue

- Sony/Bravia: helper beta adapter implemented for remote-info lookup and IRCC send; official IP Control/IRCC evidence, but consumer model variance and real IRCC code discovery require hardware.
- Philips JointSpace: helper beta adapter implemented for `PlayPause`/`Pause`; niche/model-specific and `PlayPause` is a risky toggle for GO.
- Vizio SmartCast: helper beta adapter implemented for community key-command envelope; unofficial, token local-only, hardware/pairing validation still required.
- Hisense/TCL: route by OS. Roku models use Roku ECP; Google/Android models use Cast/ADB limits; VIDAA/RemoteNow remains research-only.
- Apple TV: manual-only until a public App-Store-safe path is proven.


### TMDB live recommendation browse/search

- `src/recommendations.ts` contains a local/mock starter catalog and provider filters for Netflix, Prime Video, Disney+, Paramount+, Max, Hulu, Peacock, and Apple TV+.
- `src/tmdb-recommendations.ts` contains the TMDB mapping/proxy helper for both title search and provider-filtered Discover.
- `functions/api/recommendations/tmdb.ts` exposes `GET /api/recommendations/tmdb?q=<query>&region=US&providers=Max,Hulu` for title search when a server-side `TMDB_READ_ACCESS_TOKEN`/`TMDB_API_TOKEN` is configured.
- `functions/api/recommendations/discover.ts` exposes `GET /api/recommendations/discover?region=US&providers=Hulu,Max&mediaType=all&category=popular` for the JustWatch-like free browse path. It uses TMDB Discover with `watch_region`, `with_watch_providers`, `with_watch_monetization_types=flatrate`, and movie/show category filters.
- Browse categories are intentionally truthful: `popular`, `new-ish`, and `recently aired`. TMDB does not provide exact provider added dates, so do not call this “new on Hulu today.”
- If no TMDB token is configured, both endpoints return a setup error with `fallback: "mock"`; the PWA keeps showing safe mock cards.
- Live TMDB search/browse uses bearer auth server-side only. Do not put the token in the browser bundle.
- TMDB provider availability is region/account/date dependent. The UI labels TMDB as an optional live source and keeps mock results available.
- `Add to queue` posts a `recommendation_sent` room event into the deduped `Tonight's queue`.
- Optional external ratings can be added later through a licensed/allowed source such as OMDb if acceptable.
- Do not scrape Rotten Tomatoes or JustWatch. Rotten Tomatoes scores require licensing/allowed sources; JustWatch provider data should not be harvested unofficially.
- Attribution copy: “This product uses the TMDB API but is not endorsed or certified by TMDB.”


### Recommendation voting and selected watch

- `recommendation_voted` stores lightweight yes/no votes in room event history. Vote totals are derived client-side by latest vote per participant.
- `recommendation_selected` promotes a card to tonight's watch, resets ready/countdown state, and keeps manual TV fallback unchanged.
