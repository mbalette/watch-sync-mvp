# Remote Start / TV Remote Mode feasibility and MVP

Remote Start v1 is local device control at countdown GO, not content/provider availability. Users manually open the selected title in their own streaming app, seek to the agreed sync point, pause, ready up, and use the shared countdown. If a locally linked device supports a safe discrete Play command and the user opts in with `Use Remote Start at GO`, Watch Sync sends exactly one local Play command at GO. Manual countdown remains the universal fallback for every platform and every error state.

Content discovery/provider policy lives separately in `docs/data-provider-strategy.md`; do not couple provider availability claims to Remote Start control architecture.

## Remote Start flow

1. Pick a title in the room. Provider availability/recommendations do not grant device-control capability.
2. Each participant opens the title manually in their own streaming app/device.
3. Each participant pauses at the room sync point.
4. Optional: link a local device/helper in `Remote Start`, test/pair it, and explicitly enable `Use Remote Start at GO`.
5. Everyone taps ready. At GO, the host still emits the normal room `play_now`; only a browser with a locally linked, opted-in, safe-capability device sends a local Play command.
6. If focus, ads, overlays, DRM, app state, buffering, device sleep, network, or model variance causes the app to ignore Play/Pause, users press play manually.

GO uses Play, not Stop or toggle: Play is idempotent-ish when the app is paused at the sync point. Stop loses playback state, and Play/Pause toggles can pause a device that is already playing or double-fired. Android/Fire/Google TV ADB GO must use `KEYCODE_MEDIA_PLAY` / keycode `126`, never `KEYCODE_MEDIA_PLAY_PAUSE` / `85`.

## Honest product claim

Hero copy:

> Movie night starts together. Open the same show on any TV, pause at the sync point, then Watch Sync counts everyone in. On supported local devices, Remote Start can press Play for you at GO.

Settings copy:

> Remote Start is optional. Each person links their own supported local device/helper on their own Wi‑Fi. Watch Sync coordinates the room and countdown; your browser/local helper sends the local Play command only when you opt in.

Compatibility disclaimer:

> Manual sync works with every streaming service because you control the TV yourself. Remote Start is best-effort and only sends generic remote keys on supported devices after you open the show and pause it. It does not choose Netflix/Hulu/Disney/Prime/Max content, seek inside native TV apps, verify provider availability, or guarantee every app will obey Play/Pause.

## Capability matrix

| Platform | UI status | GO Play | Safe Pause button | Setup | Hardware validation | Public claim |
|---|---|---:|---:|---|---|---|
| Roku / Roku TV / local streaming device | Supported | `POST /keypress/Play` after local helper/native path; opt-in required | No pause claim in v1 | Host/IP; Roku network/mobile control must allow ECP | Not yet complete | Supported best-effort Play only |
| LG webOS | Beta | `ssap://media.controls/play` after pairing/client key | Yes, `pause` | Local helper + TV prompt/client key | Not yet complete | Beta; model/app variance |
| Samsung / Tizen | Beta | `KEY_PLAY` | Yes, `KEY_PAUSE` | Local helper + TV approval/token where supported | Not yet complete | Beta/unofficial LAN protocol |
| Fire TV / Android TV / Google TV ADB helper | Advanced setup | `adb -s <host[:port]> shell input keyevent KEYCODE_MEDIA_PLAY` (`126`) | Yes, `KEYCODE_MEDIA_PAUSE` (`127`) | Developer options, wireless debugging/ADB auth/pairing, local helper | Not yet complete | Advanced helper only, not consumer-default support |
| Sony / Bravia | Beta | IRCC Play code after `getRemoteControllerInfo` | Not exposed as safe in v1 | Enable IP Control; optional PSK; provide Play IRCC code | Not yet complete | Beta; consumer model variance |
| Philips JointSpace | Beta | Disabled for GO because available Play/Pause path is toggle-risk | Not exposed as safe | JointSpace host/API version; auth varies | Not yet complete | Beta/manual countdown for GO |
| Vizio SmartCast | Beta | Community `play` key envelope | Yes, community `pause` key envelope | PIN/token/local helper | Not yet complete | Beta/unofficial/community path |
| Home Assistant advanced bridge | Advanced setup | Helper posts local webhook; user's HA automation should call `media_player.media_play` or equivalent | No generic pause in Watch Sync v1 | Existing local HA, local-only webhook, user's own automation/script | User-specific | Advanced local bridge; no HA tokens/entities in backend |
| Apple TV | Manual-only | No direct command | No direct command | Manual countdown | N/A | Manual-only; no direct-control claim |

## Implemented v1 paths

Files:

- `src/tv-remote-device.ts` — capability model, linked-device persistence, `useRemoteStartAtGo` default false, safe GO gate, test/play/pause helper request builders, Android ADB discrete media-key requests, Apple TV manual-only blocking.
- `src/App.tsx` — `Remote Start` drawer, status platform picker, helper/device fields only where relevant, `Test connection` / `Pair/Test`, manual `Send Play`, safe-only `Send Pause`, and `Use Remote Start at GO` opt-in.
- `server/tv-remote-helper.ts` — local helper endpoints for Roku/LG/Samsung/Sony/Philips/Vizio/Home Assistant and ADB `/adb/connect` + `/adb/media-key` using injected or `execFile` argv-array execution.
- `server/adb-helper-remote.ts` — ADB argv builders allow only `KEYCODE_MEDIA_PLAY` and `KEYCODE_MEDIA_PAUSE`; toggle is rejected.
- `server/tv-remote-targets.ts` — target metadata labels ADB as implemented advanced helper, Apple TV manual-only, and hardware validation false where unproven.

Run locally:

```bash
npm run dev:tv-remote
# helper: http://127.0.0.1:8790
```

Then in the app:

1. Open the title manually in the streaming app.
2. Seek/pause at the shared timestamp.
3. Open `Remote Start`.
4. Choose a platform and enter only the fields needed for that platform.
5. `Test connection` or `Pair/Test`.
6. Optional manual test: `Send Play`; `Send Pause` appears only when the capability says pause is safe.
7. Enable `Use Remote Start at GO` only if you want Watch Sync to send one local Play at GO. Without the opt-in, the manual countdown remains unchanged.

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
| Roku / Roku TV | Yes, generic remote keys. Current MVP sends `Play` only. Do not claim `Pause` or `PlayPause`. | Official docs conflict on third-party mobile ECP use; public launch is policy-blocked until clarified. | Yes: known-IP LAN HTTP + Local Network permission, foreground-only. | Unreliable from hosted HTTPS PWA. | Yes. | Usually no app pairing; Roku network/mobile control setting must allow. | `GET /query/device-info`; exactly one `POST /keypress/Play` on port `8060` at GO. | Roku player/Roku TV plus real-device iOS ATS/local-network matrix. | Supported Roku devices may receive a best-effort Play key after user stages content; no app launch, timestamp read, background execution, or universal TV claim. | Build later for public launch; internal/TestFlight beta only if policy risk accepted. |
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

1. **Phase 1 — Roku native iOS/helper hardening, beta-only until Roku policy clears**: manual IP entry first, no SSDP, foreground-only, Local Network permission copy, narrow ATS/local-IP HTTP exceptions, `device-info` probe, local-only Roku metadata, exactly one `Play` at GO, no risky retry, no app launch/media-state/timestamp reads/background claims, manual countdown fallback, mock helper tests plus real Roku/iOS hardware matrix.
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

The PWA now includes a local linked-device manager inside `Remote Start`:

- Platform picker: Roku/local streaming device, LG webOS, Samsung/Tizen, Fire TV / Android TV / Google TV ADB helper, Sony/Bravia, Philips JointSpace, Vizio SmartCast, Home Assistant advanced bridge, and Apple TV manual-only.
- Helper URL appears only for helper-backed platforms and defaults to `http://127.0.0.1:8790`.
- Platform-specific fields stay local in browser storage:
  - host/IP or ADB `host[:port]` where needed
  - LG `clientKey`
  - Samsung `token`
  - Sony `psk` and Play `irccCode`
  - Philips JointSpace API version
  - Vizio auth token
  - Home Assistant webhook URL
- Buttons:
  - `Save local`
  - `Test connection` or `Pair/Test`
  - `Send Play` only when the capability supports a play command
  - `Send Pause` only when the capability says pause is safe
- `Use Remote Start at GO` persists as `useRemoteStartAtGo`, defaults false, and is required before countdown GO sends anything.
- Countdown GO calls the selected linked device once through the safe platform-specific helper endpoint only when opted in:
  - Roku: `/roku/keypress` with `Play`
  - LG: `/lg-webos/media` with `play` after `clientKey`
  - Samsung: `/samsung/keypress` with `KEY_PLAY`
  - Android/Fire/Google TV ADB: `/adb/media-key` with `KEYCODE_MEDIA_PLAY` / keycode `126`; never `KEYCODE_MEDIA_PLAY_PAUSE`
  - Sony: `/sony/ircc` after a Play IRCC code is provided
  - Vizio: `/vizio/key` with `play`
  - Home Assistant webhook: `/home-assistant/webhook` posts one local `watch_sync_go` event to the user-provided HA webhook URL.
  - Philips: automatic GO is blocked because `PlayPause` is a risky toggle; manual countdown remains the fallback.
  - Apple TV: manual-only, no direct commands.

The room backend still only coordinates room/countdown/state. Device hostnames, pairing tokens, PSKs, IRCC codes, auth tokens, and Home Assistant webhook URLs are not sent to the realtime backend.

## Home Assistant advanced local bridge

Home Assistant webhook mode is an advanced bridge for users already running Home Assistant locally. It is not a universal TV-control claim: compatibility depends on the user's HA integration, media device, active app, focus state, account/app behavior, and network. Manual countdown remains the reliable fallback.

Recommended shape:

1. Run the Watch Sync local helper on the same LAN.
2. Create a Home Assistant webhook automation with `local_only: true` and a random webhook id.
3. In Watch Sync TV Remote Mode, choose `Home Assistant webhook — Advanced local bridge` and enter the full local webhook URL, for example `http://homeassistant.local:8123/api/webhook/REPLACE_WITH_RANDOM_ID`.
4. At GO, Watch Sync sends one POST to the local helper, and the helper sends one POST to Home Assistant. There is a short timeout and no blind retry.

Sample Home Assistant YAML:

```yaml
script:
  watch_sync_play:
    alias: Watch Sync Play
    sequence:
      - action: media_player.media_play
        target:
          entity_id: media_player.living_room_tv

automation:
  - alias: Watch Sync GO webhook
    triggers:
      - trigger: webhook
        webhook_id: REPLACE_WITH_RANDOM_ID
        allowed_methods:
          - POST
        local_only: true
    actions:
      - action: script.watch_sync_play
```

Payloads sent to Home Assistant are narrow JSON events such as:

```json
{
  "type": "watch_sync_go",
  "room_id": "ROOM1",
  "countdown_id": "countdown-1",
  "issued_at": "2026-05-05T12:00:00.000Z",
  "client_ts": "2026-05-05T12:00:00.100Z"
}
```

Security and truth constraints:

- Do not put Home Assistant long-lived access tokens in the PWA.
- Do not put HA URLs, tokens, or entity IDs in realtime/backend room state.
- The helper does not accept arbitrary headers or bearer tokens for this bridge.
- The helper validates only `http://` and `https://` webhook URLs and returns safe errors without echoing the secret webhook URL.
- Prefer local-only webhooks. Users customize HA scripts/actions on their own HA instance.
- No Apple TV direct control, private APIs, native streaming-app title selection, or timestamp seek is implied by this bridge.

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
- Implemented helper: `server/adb-helper-remote.ts` + `server/adb-helper-remote.test.ts` for argv construction, plus `server/tv-remote-helper.ts` endpoints `/adb/connect` and `/adb/media-key` with dependency injection for tests.
- Strict command allowlist, argv arrays only, no shell string concatenation.
- GO uses only `KEYCODE_MEDIA_PLAY` (`126`); pause uses only `KEYCODE_MEDIA_PAUSE` (`127`). `KEYCODE_MEDIA_PLAY_PAUSE` (`85`) is rejected for GO/toggle safety.
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
