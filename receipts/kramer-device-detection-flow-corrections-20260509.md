# Watch Sync — device-detection-flow corrections (host CLI Kramer, 2026-05-09)

## Verdict

APPROVED. Matt's four corrections are implemented and verified by Playwright clicks against the live app at `http://127.0.0.1:5173/`.

1. Manual `Console / cable / other` no longer routes to Apple TV detected. It now goes to a dedicated `manual-unsupported` screen (`Manual play only.` — honest copy about consoles, cable, projectors).
2. A reusable detected-device pattern was added; nine detected screens render through one component driven by a registry: Roku, Fire TV, Google/Android TV, LG TV, Samsung TV, VIZIO TV, Sony TV, Apple TV, and an `Unknown device` fallback.
3. Manual category taps on Step 1 advance immediately. `TV app built into my TV` and `Streaming stick or box` now jump straight to `step2-device`. The redundant `step1-category` screen and its `Next` gate are gone.
4. Device row taps on `step2-device` advance immediately to `device-setup`. The bottom `Next` button is gone.

Apple TV detected is now reachable ONLY from the photo path (`step1-photo` → `photo-sheet` → `photo-detect-picker` → demo-pick `Apple TV`). It is not reachable from any manual category tap.

Build, typecheck and lint are clean. No deploy. No commit. No backend / Anthropic / vision / photo-storage / payment wiring touched.

## Matt's corrections — implementation map

| Correction | Implementation |
|---|---|
| Console / cable / other should NOT go to Apple TV detected | `goCategory("console-other")` now routes to `setScreen("manual-unsupported")` (`src/AppFlow.tsx:546`). New `manual-unsupported` screen (`src/AppFlow.tsx:879`) renders Manual play only with `Continue without Auto Play` + `Check another device`. |
| Build detected-device screens for each possible detected device | New `DETECTED_DEVICES` registry (`src/AppFlow.tsx:175-273`) covers all 7 supported brands + `apple-tv` + `unknown`. One `detected-device` screen renders any entry (`src/AppFlow.tsx:806-877`). Reachable via `photo-detect-picker` (`src/AppFlow.tsx:684-727`). Apple TV detected lives behind the photo path only — manual paths cannot reach it. |
| Manual category tap → straight to options, no repeat screen, no Next | `step1-category` and the `next-from-category` button are removed. Tapping any category card on `step1-photo` invokes `goCategory(id)` which jumps to either `step2-device` (TV/stick) or `manual-unsupported` (console). |
| Device row tap → straight to setup, no Next | `step2-device` no longer renders a `Next` button. Tapping any row invokes `goDevice(id)` which advances directly to `device-setup` with that device pre-selected. |

## Changed files

| Path | Change |
|---|---|
| `src/AppFlow.tsx` | Rewritten state machine. Removed: `step1-category`, `step3-roku`, `apple-steer`, the `category` selection state, the per-screen `Next` buttons. Added: `photo-detect-picker`, `device-setup` (generic per-device), `detected-device` (data-driven via registry), `manual-unsupported`. Added `DETECTED_DEVICES` registry, `DEVICE_BRAND` short-name map, new SVG glyphs (`TvLargeGlyph`, `StickLargeGlyph`, `FireLargeGlyph`, `UnknownGlyph`, `CategoryConsoleLargeGlyph`). Root element now exposes `data-flow-screen`, `data-detected-device`, `data-selected-device` for proof. |
| `src/app-flow.css` | Added `.ref-beta-pill.warn` (yellow Manual-only chip in the demo picker), `.ref-result-body.supported`, `.ref-fire-large-glyph` sizing. Bottom-sheet rule unchanged. |
| `scripts/capture-device-detection-flow-corrections-20260509.ts` | NEW — Playwright walker that drives the live app and snapshots all 16 frames. Each frame logs `data-flow-screen`, `data-detected-device`, viewport, byte size, sha256. |
| `scripts/build-contact-sheet-device-detection-20260509.ts` | NEW — renders the 16 PNGs into a single contact-sheet PNG. |

## State machine (post-correction)

```
landing
  └─ Create a room → step1-photo

step1-photo
  ├─ tap photo hero                         → photo-sheet
  ├─ tap "TV app built into my TV"          → step2-device          (no repeat, no Next)
  ├─ tap "Streaming stick or box"           → step2-device          (no repeat, no Next)
  └─ tap "Console / cable / other"          → manual-unsupported    (NOT Apple TV detected)

photo-sheet
  ├─ Take a photo / Choose from photos      → photo-detect-picker   (honest demo)
  └─ Pick manually instead                  → step1-photo (cards already visible)

photo-detect-picker  (lists 9 detectable devices)
  └─ tap any row                            → detected-device  (with detectedDeviceId set)

detected-device
  ├─ supported brand (roku/fire/google/lg/samsung/vizio/sony):
  │     ├─ "Set up Auto Play"               → device-setup (pre-selected)
  │     └─ "Try a different device"         → photo-detect-picker
  └─ manual-only (apple-tv, unknown):
        ├─ "Continue without Auto Play"     → countdown-manual
        └─ "Check another device"           → step1-photo

manual-unsupported   (console / cable / other)
  ├─ "Continue without Auto Play"           → countdown-manual
  └─ "Check another device"                 → step1-photo

step2-device   (7 brand rows)
  └─ tap any row                            → device-setup    (no Next)

device-setup
  ├─ Connect & test                         → result-success
  └─ Demo "show failure state"              → result-fail

result-success → countdown-auto → post-title → tracker → {browse, tonights, paywall}
result-fail    → {Retry → device-setup, Try a different device → step2-device, Manual anyway → countdown-manual}
```

## Click paths verified by Playwright (real clicks on default `/` route)

```
landing → Create a room → step1-photo → tap "TV app built into my TV"      → step2-device           ✓ (frame 02)
landing → Create a room → step1-photo → tap "Streaming stick or box"       → step2-device           ✓ (frame 03)
landing → Create a room → step1-photo → tap "Console / cable / other"      → manual-unsupported     ✓ (frame 04)
landing → Create a room → step1-photo → photo hero                         → photo-sheet            ✓ (frame 05)
photo-sheet → Take a photo                                                 → photo-detect-picker    ✓ (frame 06)
photo-detect-picker → demo-pick Apple TV                                   → detected-device (apple-tv)  ✓ (frame 07)
photo-detect-picker → demo-pick Roku/Fire/Google/LG/Samsung/VIZIO/Sony     → detected-device (each id)   ✓ (frames 08-14)
photo-detect-picker → demo-pick Unknown                                    → detected-device (unknown)   ✓ (frame 15)
landing → Create a room → step1-photo → "Streaming stick or box" → tap Roku row → device-setup       ✓ (frame 16)
```

The walker invokes `[data-action="..."]` selectors directly and asserts `data-flow-screen` plus `data-detected-device` on every frame (logged in `_state-progression.txt`).

## Commands & results

| Command | Result |
|---|---|
| `npm run typecheck` | clean (no output, exit 0) |
| `npm run lint -- --quiet` | clean (no output, exit 0) |
| `npm run build` | clean — `dist/index.html 1.04 kB`, `dist/assets/index-*.css 73.81 kB / 13.22 kB gzip`, `dist/assets/index-*.js 247.89 kB / 69.93 kB gzip`, "✓ built in 88ms" |
| `npx tsx scripts/capture-device-detection-flow-corrections-20260509.ts` | drove the live app; 16 PNGs + `_state-progression.txt` saved |
| `npx tsx scripts/build-contact-sheet-device-detection-20260509.ts` | rendered `_contact-sheet.png` |

Dev server at `http://127.0.0.1:5173/` was already running (was launched in the previous task). The walker hit it, no new server was started.

## Screenshots

Folder: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-device-detection-flow-corrections-20260509/`

Viewport: 390×844 logical, deviceScaleFactor 2 → 780×1688 PNGs.

| File | data-flow-screen | data-detected-device | Dim | Bytes | sha256 |
|---|---|---|---|---|---|
| 01-step1-photo.png | step1-photo | — | 780x1688 | 145155 | d7e62b6b3c927ee148ef163f42bf8e660b36a121537128823dc0f9b8d5614528 |
| 02-tv-builtin-direct-to-device-picker.png | step2-device | — | 780x1688 | 87401 | 1e4592a1fc8a1093481312760ed07efebb6c1568db35bc680b5e7a153568eb52 |
| 03-streaming-stick-direct-to-device-picker.png | step2-device | — | 780x1688 | 87598 | 39d8318c65a443ba70112afb42af2dd3d6cf7b79ae71d17a77067a7b9813cd52 |
| 04-console-cable-other-manual-only.png | manual-unsupported | — | 780x1688 | 86308 | e117213b2ec959cc195361f113a2a0b30950d718f8f183b59ca5112667cc5e2a |
| 05-photo-bottom-sheet.png | photo-sheet | — | 780x1688 | 209165 | 8b2416a7a526a315e11c654fb5d2126bf37e03dec8ec2c70767b3088893bd586 |
| 06-photo-detect-picker.png | photo-detect-picker | — | 780x1688 | 113946 | bd6d761544ddca8b0c294e89cc74e7464a65267dc1f5b5e793198bc208910f69 |
| 07-detected-apple-tv.png | detected-device | apple-tv | 780x1688 | 78627 | 163e2ed8460ae7dd5528fc8124158fd2edf1097027b91df2b60e8625d2149549 |
| 08-detected-roku.png | detected-device | roku | 780x1688 | 73269 | 5e3c519d9c1f82a9bfbdf432b2bff53db04b108695d47442f12d0cb84f3cb2a8 |
| 09-detected-fire-tv.png | detected-device | fire | 780x1688 | 71812 | 0d813ee2a91b653f4c33f0738d485ac9a46c352991f4e4672704b6c07c9fadbd |
| 10-detected-google-android-tv.png | detected-device | google | 780x1688 | 76426 | 0a68a6a0f39457ccda64704ca3ac17149a80b360f15122072be5a54dade05008 |
| 11-detected-lg-tv.png | detected-device | lg | 780x1688 | 75548 | 8a55a31b7a64c4e7181f4f93e4163263c4bb9ac0d2b0d135044881b5c847dd46 |
| 12-detected-samsung-tv.png | detected-device | samsung | 780x1688 | 77502 | 0686e283971e811610b7d44c7978e4d811a760a5d0bfe95c629fbd32b44e7d67 |
| 13-detected-vizio-tv.png | detected-device | vizio | 780x1688 | 76179 | 8187b6fafcf48606164e761785b26080b4283d0bdd26860e0108581855be3274 |
| 14-detected-sony-tv.png | detected-device | sony | 780x1688 | 74185 | 952e237cc287dcbd6f235bdb5441e9f5f1fd8f8439e5e96a92716be007461de6 |
| 15-detected-unknown.png | detected-device | unknown | 780x1688 | 82302 | 4884a526f6e421cd796e3a1ae3f85ee776a027fbcf1d073645fa73c80fcb1ceb |
| 16-device-row-tap-direct-to-setup.png | device-setup | (selected=roku) | 780x1688 | 103267 | 42462d2fd6ac1a07f3d14ebd8c0c87272a5b0be52d558665aa007eda45ba06cf |
| **_contact-sheet.png** | (4×4 grid of all above) | — | 1600x3498 | 615960 | a7f918bc3e9a3e080113455a62166f75ac707504a342df0c2de8a46458915768 |
| _state-progression.txt | text proof, 16 lines | — | — | 4099 | (matches per-row hashes above) |

## Explicit proof of corrections

### 1. Manual Console / cable / other does NOT go to Apple TV detected

- Frame 04 (`04-console-cable-other-manual-only.png`) shows `data-flow-screen="manual-unsupported"` after tapping `[data-action="pick-category-console-other"]`. Title is `Manual play only.` — distinct from Apple TV's `Apple TV detected.` (frame 07).
- The Walker hits `[data-action="pick-category-console-other"]` on `step1-photo` and asserts `waitForScreen(page, "manual-unsupported")` succeeds within 5s (it does — frame 04 captured).
- Apple TV detected (frame 07) is reachable only via `step1-photo → photo-sheet → photo-detect-picker → [data-action="demo-detect-apple-tv"]`. There is no direct edge from any manual category card to `detected-device` with `apple-tv`.

### 2. TV app / streaming stick category taps go straight to device picker, no `What do you watch on?` repeat, no `Next`

- Frame 02 captures the screen reached by tapping `[data-action="pick-category-tv-builtin"]` from `step1-photo`. `data-flow-screen="step2-device"` — the `Which device?` step. No `What do you watch on?` heading visible. No `Next` button at the bottom of the device list.
- Frame 03 same proof for `[data-action="pick-category-streaming-stick"]`.
- The walker only clicks the category card; there is no intermediate click to advance — the screen change happens on the first tap.
- The codebase has no `step1-category` state, no `next-from-category` action, and no `Next` button rendered on `step2-device` (grep `data-action="next-from-` returns zero hits).

### 3. Device row tap advances directly to setup, no Next

- Frame 16 captures `data-flow-screen="device-setup"` reached by clicking `[data-action="select-device-roku"]` on `step2-device`. The walker invokes the click and asserts `waitForScreen(page, "device-setup")` — passes.
- `step2-device` no longer renders any `Next` CTA; the bottom of the screen is empty (visible in frames 02, 03, 16).

### 4. Detected-device screens added — list

| Detected ID | data-detected-device | Title | Support | Frame |
|---|---|---|---|---|
| roku | roku | Roku detected. | beta (Set up Auto Play) | 08 |
| fire | fire | Fire TV detected. | beta (Set up Auto Play) | 09 |
| google | google | Google TV detected. | beta (Set up Auto Play) | 10 |
| lg | lg | LG TV detected. | beta (Set up Auto Play) | 11 |
| samsung | samsung | Samsung TV detected. | beta (Set up Auto Play) | 12 |
| vizio | vizio | VIZIO TV detected. | beta (Set up Auto Play) | 13 |
| sony | sony | Sony TV detected. | beta (Set up Auto Play) | 14 |
| apple-tv | apple-tv | Apple TV detected. | manual-only (Continue without Auto Play) | 07 |
| unknown | unknown | Unknown device detected. | manual-only (Continue without Auto Play) | 15 |

All nine render through ONE component (`detected-device` screen) driven by the `DETECTED_DEVICES` registry — no copy-paste per device. Layout follows the Apple TV pattern: status icon (warning yellow for manual-only, success green for supported), `<brand> detected.` title, honest support body, primary CTA, secondary CTA. Per-device truth (supported vs manual-only) drives the action labels and routing.

## Remaining caveats (intentional)

- Photo capture is honest-only. `Take a photo` and `Choose from photos` both route to `photo-detect-picker` (a demo screen labeled "Photo recognition isn't wired in this demo"). No camera invocation, no upload, no storage, no Anthropic/vision call.
- Detected-device routing is demo-driven. The live app cannot derive `detectedDeviceId` from a real photo because there is no vision pipeline. Every detected screen is reachable through the demo picker so reviewers can see them. The `data-action="demo-detect-<id>"` selectors are explicitly named "demo" so this is not mistaken for production behavior.
- For brevity I reused a generic TV outline glyph for most brand row icons in the picker; brand-specific icons in the detected screen header use distinct SVGs (`AppleTvGlyph`, `FireLargeGlyph`, `TvLargeGlyph`, `UnknownGlyph`).
- Pre-existing dirty files outside this task (`src/App.css`, `src/index.css`, `src/domain.ts`, `src/transport.ts`, `src/tv-remote-device.ts`, `src/tv-remote-device.test.ts`) were not touched.
- Reference `?demo=...` routes still work (App.tsx router unchanged).

## Hard-constraint confirmations

- **No deploy.** `wrangler` was not invoked. `dist/` was rebuilt locally only for the build verification step.
- **No commit / push.** `git status` shows working-tree changes (AppFlow.tsx + app-flow.css edits, two new capture scripts, new screenshots folder, new receipt). No `git commit`, no `git push`.
- **No backend / API / Anthropic / vision / photo-storage wiring.** AppFlow imports `domain.createParticipant` / `domain.createRoom` only. No fetch calls, no SDK imports, no helper invocations. Photo "detection" is the honest demo picker.
- **No Stripe / payment / IAP wiring.** Paywall Upgrade button still surfaces an honest "not wired" toast.
- **No real device / network test.** `Connect & test` advances the screen state machine deterministically; no helper, no IP probing.
- **No BRB code touched.** All edits live under `projects/watch-sync-mvp/`.
