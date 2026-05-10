# Jackie receipt — 3-2-1 Play copy, empty room, and device-specific setup corrections

**Date:** 2026-05-09  
**Repo:** `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`  
**Local URL:** `http://127.0.0.1:5173/`

## Verdict

**Pass.** Implemented Matt's requested copy/state corrections and verified device-specific setup screens. The landing now says `3-2-1 Play` and `Watch Together`; `From Anywhere` renders non-italic; the name field starts blank; hardcoded `Alex`/`Meredith` are removed from active source; countdown proof shows an empty-room state instead of fake participants. Setup screens now differ by platform instead of all using generic Wi‑Fi/IP instructions.

## Files changed

- `src/AppFlow.tsx`
  - Landing copy: `3-2-1 Play`, `Watch Together`, blank name state.
  - Removed hardcoded `Alex`/`Meredith` from active flow.
  - Countdown now shows `No one has joined yet. Share the room code when you're ready.` instead of fake ready chips.
  - Added `SETUP_GUIDES` registry for per-device setup steps/actions/failure hints.
  - Device setup screen now renders per-platform instructions.
- `src/app-flow.css`
  - Added `.flow-empty-room` styling for the empty-room participant state.
- `src/reference-screens.css`
  - Removed italic style from `.ref-app-tagline-sub`.
- `src/reference-screens.tsx`
  - Mirrored landing copy/name-field/reference chip cleanup for demo route parity.
- `src/App.css`
  - Removed italic from legacy `.welcome-header .tagline-sub` fallback styling.
- `scripts/capture-copy-setup-corrections-20260509.ts`
  - New Playwright proof script for these corrections.

## Verification commands

```text
npm run typecheck
# exit 0

npm run lint -- --quiet
# exit 0

npm run build
# exit 0
# dist/index.html                   1.04 kB │ gzip:  0.49 kB
# dist/assets/index-Udi3GsfT.css   74.16 kB │ gzip: 13.28 kB
# dist/assets/index-BGkOiNgI.js   251.70 kB │ gzip: 72.52 kB
# ✓ built in 81ms

npx tsx scripts/capture-copy-setup-corrections-20260509.ts
# exit 0

curl -I http://127.0.0.1:5173/
# HTTP/1.1 200 OK
```

Additional source grep:

```text
grep -R "Alex\|Meredith\|3 2 1 Play\|Press Play Together" -n src/AppFlow.tsx src/reference-screens.tsx src/reference-screens.css src/app-flow.css
# no matches
```

## Visual proof

Folder: `screenshots/copy-setup-corrections-20260509/`

| File | State / proof | Dimensions | Bytes | SHA-256 |
|---|---|---:|---:|---|
| `01-landing-blank-name-new-copy.png` | Landing copy + blank name | 780x1688 | 77931 | `edfda793d923b49c3e66147699f8c9493958198655812598270a744589c480cf` |
| `02-console-manual-no-apple.png` | Console/cable/other manual-only, not Apple detected | 780x1688 | 86731 | `6c376cdbe9ff5092a1c3fd45cf82ceeb640436fc70e8183177269379109442ac` |
| `03-setup-roku.png` | Roku setup | 780x1832 | 135702 | `d79716ac51778d176f366baf2a7c8e2a6a74e04c1d2d0a7388e96635bf1e9da2` |
| `04-setup-fire-adb.png` | Fire TV ADB setup | 780x1726 | 132154 | `184ddbb3db6d23f176efba04bbe6ee5739c7e84392252679ad22b8a5873d3383` |
| `05-setup-google-adb.png` | Google/Android TV ADB setup | 780x1762 | 143587 | `9769359be0ceb655286e4e97816d3a4dfaa576e08f59c84c88ce69e795e319bd` |
| `06-setup-lg-webos.png` | LG webOS pairing/client key | 780x1832 | 135275 | `dd38ca81286b6ee382509dcd349aa0069a892f138926c08801fdc495f634e379` |
| `07-setup-samsung-token.png` | Samsung approval/token | 780x1832 | 140831 | `28148838a21795fc53eecf585f37bc899468ce2247fc4f6dc6dd3a0f9c7b019e` |
| `08-setup-vizio-pin.png` | VIZIO SmartCast PIN/token | 780x1762 | 119600 | `f713245a469d7be1d2abc794ee4f6c2850cb7f1c6d1655b06f8023d8bd8b8576` |
| `09-setup-sony-bravia.png` | Sony Bravia IP Control / PSK / IRCC | 780x1762 | 135731 | `7852da9058dab33ebb9d9a44062a139987f55160295b0534a5d496fe9c5923ba` |
| `10-countdown-empty-room.png` | Countdown with no fake participants | 780x1688 | 50310 | `ca2bfb667ac4ad326d0af61fc3c89d88896e58072046c2c872f1c89e4fd7e0e6` |
| `_contact-sheet.png` | All proof frames | 654x3858 | 524265 | `7d451b003f62e2ca3137163b07957285bc02d6b2f414ad5a57b48d519a5c0d61` |

State proof text:

- `screenshots/copy-setup-corrections-20260509/_state-proof.txt`

## Device setup truth now represented

Based on existing repo docs/tests (`docs/tv-remote-mode.md`, `src/tv-remote-device.test.ts`) and implemented into `SETUP_GUIDES`:

- **Roku:** same network + Roku mobile control/ECP enabled + Roku IP/helper test.
- **Fire TV:** Developer Options + ADB/Wireless Debugging + helper pairing/auth.
- **Google / Android TV:** Developer Options + Wireless Debugging/ADB pairing code + `KEYCODE_MEDIA_PLAY` test.
- **LG webOS:** local network + TV pairing prompt + saved webOS client key.
- **Samsung:** local network + TV approval/token + Samsung `KEY_PLAY` path.
- **VIZIO:** SmartCast PIN pairing + local auth token + play key envelope.
- **Sony Bravia:** enable IP Control / Remote Start + optional PSK/auth + Play IRCC code.

## Visual spot checks

- Landing screenshot: title is `3-2-1 Play`; tagline is `Watch Together`; `FROM ANYWHERE` is upright/non-italic; name field is empty.
- Countdown screenshot: no `Alex` or `Meredith`; it shows `No one has joined yet.` and `Share the room code when you're ready.`
- Contact sheet: setup screens are differentiated by platform, not generic Wi‑Fi/IP only.

## Scope / safety

- No deploy.
- No commit/push.
- No backend/API/Anthropic/vision/photo storage wiring.
- No real device pairing or hardware calls.
- Work remains local visual/state copy only.

## Caveats

- The room still has an internal `Host` participant object when a room is created because `createRoom()` requires a host, but active UI no longer displays a fake `Alex`/`Meredith` room participant. If product semantics require literally zero participants in domain state after room creation, that is a domain-model change, not just visual copy.
- Setup screens describe the correct setup shape, but the app still does not perform real hardware validation in this visual flow.
