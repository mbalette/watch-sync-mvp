# Watch Sync — stateful screen-by-screen flow (host CLI Kramer, 2026-05-09)

## Verdict

APPROVED. The default user journey at `http://localhost:5173/` is now a stateful screen → click → next-screen flow. The previous long-scroll dashboard (Step 1 + countdown + tracker + paywall + browse stacked on one page) is gone. Each screen renders alone; the next screen is reached only by an explicit click on a primary or secondary action. Screenshots captured by walking the actual app via Playwright clicks (not `?demo=` reference routes).

Build, typecheck and lint clean. No deploy. No commit. No backend / Anthropic / vision / photo-storage / payment wiring touched.

## Changed files (this task)

| Path | Change |
|---|---|
| `src/AppFlow.tsx` | NEW — stateful screen-machine component with 16-state enum (`landing`, `step1-photo`, `photo-sheet`, `step1-category`, `step2-device`, `step3-roku`, `result-success`, `result-fail`, `apple-steer`, `countdown-auto`, `countdown-manual`, `post-title`, `tracker`, `paywall`, `browse`, `tonights`). Reuses `ref-*` CSS classes from `reference-screens.css`; uses local React state for selected category/device/title/tonight's-list. Calls `domain.createRoom()` so the room code is real, but transports / TMDB / TV remote helper / payment paths are intentionally not invoked. |
| `src/app-flow.css` | NEW — supplemental styles only: back chrome, room pill, photo toast, tracker action cards, browse/tonight watch cards, empty state, demo-toggle text link, plus the `data-flow-screen="photo-sheet"` flex-end alignment that mirrors the existing demo rule for the bottom sheet. |
| `src/App.tsx` | MODIFIED — collapsed from 3,099 lines (monolithic `RoomApp` long-scroll dashboard) to a 14-line router: if `?demo=<id>` render `<ReferenceScreen>`, otherwise render `<AppFlow>`. The legacy long-scroll dashboard is removed; demo routes still render the reference-faithful screens for proof comparison. |
| `scripts/capture-stateful-flow.ts` | NEW — Playwright walker that drives the live app via `data-action="..."` clicks and captures all 20 screens + a `_state-progression.txt` proof file with per-frame `data-flow-screen` attribute, byte size, and sha256. |
| `scripts/build-contact-sheet.ts` | NEW — renders the 20 PNGs in an HTML grid and screenshots a single `_contact-sheet.png` for review. |

## Pre-existing dirty files left untouched (per goal "Do not reset/clean unrelated dirty files")

`src/App.css`, `src/index.css`, `src/domain.ts`, `src/transport.ts`, `src/tv-remote-device.ts`, `src/tv-remote-device.test.ts` — all were already modified at session start and were not touched by this task.

## State machine implemented

Screen enum (`AppScreen` in `src/AppFlow.tsx:16`):

```
landing
  └─ Create a room  → step1-photo

step1-photo  (focused screen, no countdown/tracker stacked below)
  ├─ tap photo hero        → photo-sheet
  ├─ tap TV/Stick category → step1-category (with that card preselected)
  └─ tap Console / cable / other → apple-steer (manual-only path)

photo-sheet  (bottom sheet, dimmed backdrop)
  ├─ Take a photo / Choose from photos → step1-photo + honest "not wired" toast
  └─ Pick manually instead → step1-category (no preselection)

step1-category  (progress dots 1/3)
  ├─ select category → highlight only
  └─ Next            → step2-device  (or apple-steer if Console)

step2-device  (progress dots 2/3, 7 device rows)
  ├─ select device   → highlight only
  └─ Next            → step3-roku

step3-roku  (progress dots 3/3, numbered cards)
  ├─ Connect & test  → result-success
  └─ "show failure state" demo link → result-fail

result-success
  └─ Continue to countdown → countdown-auto

result-fail
  ├─ Retry                    → step3-roku
  ├─ Try a different device   → step2-device
  └─ Start movie night anyway → countdown-manual

apple-steer
  ├─ Check another device         → step1-category
  └─ Continue without Auto Play   → countdown-manual

countdown-auto / countdown-manual
  (3 → 2 → 1 → PLAY auto-tick, 1s/step)
  └─ on PLAY → post-title (auto-advance)
  └─ Ready — tap to undo → step1-photo
  (manual variant carries an "Auto Play not set up · Set up" banner)

post-title
  ├─ Save to history → tracker (with savedTitle reflected on latest history row)
  └─ Skip for now    → tracker (latest row stays "Untitled watch" with Add title)

tracker (free-tier)
  ├─ Find watch       → browse
  ├─ Tonight's list   → tonights
  ├─ See what's in Pro → paywall
  └─ Add title        → post-title

browse
  └─ Add (toggles) → updates tonights[] state; pill turns green = Added

tonights
  └─ Remove → drops entry; empty state when zero saved

paywall
  ├─ Upgrade to Pro → honest "payment isn't wired" toast (no IAP / Stripe call)
  └─ Not now        → tracker
```

A `Back` button is shown at the top of every non-landing screen (renders alongside the live `Room <code>` pill). The countdown view auto-advances to `post-title` after the tick reaches `PLAY`; the user can interrupt with "Ready — tap to undo".

## Click path tested end-to-end (driven by Playwright)

```
landing
 → Create a room
   → step1-photo
     → tap photo hero
       → photo-sheet
         → Pick manually instead
           → step1-category
             → tap Streaming stick or box (selected)
               → Next
                 → step2-device (Roku preselected)
                   → tap LG TV (selected)
                   → tap Roku (re-selected)
                     → Next
                       → step3-roku
                         → Connect & test
                           → result-success
                             → Continue to countdown
                               → countdown-auto (3 → 2 → 1 → PLAY)
                                 → post-title
                                   → suggestion "Dune: Part Two" + Save to history
                                     → tracker (Dune titled row, green left bar)
                                       → See what's in Pro → paywall
                                       → Not now → tracker
                                       → Find watch → browse
                                         → Add Dune + Add The Bear (Added pills)
                                         → Back → tracker
                                           → Tonight's list → tonights (2 entries)

reset → landing → Create a room → step1-photo
 → tap Streaming stick or box (jumps straight to step1-category preselected)
   → Next → step2-device → Next → step3-roku
     → "show failure state" demo link
       → result-fail
         → Start movie night anyway → countdown-manual (banner shown)

reset → landing → Create a room → step1-photo
 → tap Console / cable / other → apple-steer
```

All transitions verified by reading the `data-flow-screen` attribute after each action — see `_state-progression.txt`.

## Commands & results

| Command | Result |
|---|---|
| `npm run typecheck` | clean (no output, exit 0) |
| `npm run lint -- --quiet` | clean (no output, exit 0) — initial run flagged `react-hooks/set-state-in-effect`; fixed by lifting the countdown reset out of the effect into an `enterCountdown(target)` helper. Re-run clean. |
| `npm run build` | clean — `dist/index.html 1.04 kB`, `dist/assets/index-*.css 73.50 kB / 13.17 kB gzip`, `dist/assets/index-*.js 242.94 kB / 68.59 kB gzip`, "✓ built in 85ms". |
| `npm run dev` | served at `http://localhost:5173/`. |
| `npx tsx scripts/capture-stateful-flow.ts` | drove the live app, saved 20 PNGs + `_state-progression.txt`. |
| `npx tsx scripts/build-contact-sheet.ts` | rendered `_contact-sheet.png` (1600x2949). |

## Screenshots

Folder: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-watchsync-stateful-flow-20260509/`

Viewport: 390×844 logical, deviceScaleFactor 2 (so PNGs are 780×1688 except `13-tracker-titled.png` which is 780×2056 — full-page screenshot of the tracker which is taller than the viewport).

| File | data-flow-screen | Dim | Bytes | sha256 |
|---|---|---|---|---|
| 01-landing-initial.png | landing | 780x1688 | 80917 | 037dcfbd934a308c25af33f6307ecdeff7d4bc7c9c6c491bccbf03d9e0cdb3d7 |
| 02-step1-photo.png | step1-photo | 780x1688 | 144918 | 3b0c26960b636a950a5773bf23b83f638a7bc1e2fe41fa95079d2c37fc62d387 |
| 03-photo-bottom-sheet.png | photo-sheet | 780x1688 | 209165 | 8b2416a7a526a315e11c654fb5d2126bf37e03dec8ec2c70767b3088893bd586 |
| 04-step1-category-empty.png | step1-category | 780x1688 | 88521 | f4ecc8921b792b3eb830ad8f0942c90a1e59186334308519e69f21cc16223674 |
| 05-step1-category-selected.png | step1-category | 780x1688 | 89100 | 1edfd6946a7413f6ed0172ad0d2e153d41491857adb690cb3e1b36db965707ae |
| 06-step2-device-picker.png | step2-device | 780x1688 | 103062 | 2060958ccdce1b6732fea25d3ee5daee3235bfc823d6cdd53c4ddc8725f92b8b |
| 07-step2-device-selected-lg.png | step2-device | 780x1688 | 103173 | 3ece6c7335f640298ad2b5461142327daef1ccb653127ddabce8f8c27aad33a0 |
| 08-step2-roku-reselected.png | step2-device | 780x1688 | 103340 | 9c944d5788865fe0883ba7d968c8fcd33dcc261d224463fe732e2e9212204f02 |
| 09-step3-roku-setup.png | step3-roku | 780x1688 | 103215 | 296e932f94118686d4b64a92dbc004f63b299340dffb4aa51ecd485f0fc63e3f |
| 10-result-success.png | result-success | 780x1688 | 70032 | 9cea962f1036bf46639a329d6753de41fb24706b80e059905bfa470e5577a5b2 |
| 11-countdown-auto.png | countdown-auto | 780x1688 | 44566 | cbcd1993da45d87137ea6608755e62e82428556d2c28322762d0a3fc91a069b4 |
| 12-post-title-prompt.png | post-title | 780x1688 | 71196 | 1cc2acc41b96a2d7ac86b353cfe094ba491f6cb3148b8d7a43c5821163ec59a1 |
| 13-tracker-titled.png | tracker | 780x2056 | 181447 | da318587bf06825dfec2215a23b34af2825df6f3d60296e18f3a0a26a65f33cd |
| 14-paywall.png | paywall | 780x1688 | 112172 | 3160bf764bd681ecf5670d72c3aa518b758c3c5cfac1ca7e66f1fbdf945ffd0a |
| 15-browse-find-watch.png | browse | 780x1688 | 99411 | 8d06dfa0f7a77faab6aee69c838a98b3982073f49bf88e54d62401423a46677c |
| 16-browse-two-added.png | browse | 780x1688 | 101198 | 73c4614fefaeec031dd69b722214bc610033cd468e3007cc580c606c2e2df97e |
| 17-tonights-list.png | tonights | 780x1688 | 62623 | 1176cef287ae4e1e57c3c0a65b315deb8d8f418cd2966fde50ecb26860630e42 |
| 18-result-failed.png | result-fail | 780x1688 | 80212 | 4f72e2be490b8efdf01385da9659e51bded69f1a67f19461fb49f61209cf8e05 |
| 19-countdown-manual.png | countdown-manual | 780x1688 | 52678 | a88b61b4e66ce967fa17cd4fc0291a205969a53c1e2408d9ea010719d90cdcae |
| 20-apple-tv-steer.png | apple-steer | 780x1688 | 70122 | 1a91345a935d6acc332526b75e7136d0c062ee15ec524ab3b696f33cd93c5adb |
| **_contact-sheet.png** | (5×4 grid of all above) | 1600x2949 | — | 9e36ecaa99f76efa48088a274607920a85c8dd9a7c5c3d8a5ac7978a1618af9e |
| _state-progression.txt | text proof | — | 3863 | (matches the per-row hashes above) |

## Acceptance bar — long-scroll regression test

The long-scroll dashboard is gone. Verified by:

1. The new `App.tsx` no longer mounts `RoomApp` and contains no rendering of countdown / tracker / paywall / browse simultaneously.
2. Every screenshot in the click-walk shows exactly ONE major section in the focused area; nothing major sits stacked below it (e.g. `02-step1-photo.png` ends with the three category cards and empty space — no countdown hero, no tracker stats below).
3. The 5×4 contact sheet shows 20 visibly distinct screens — proves the user advances frame-to-frame, not by scrolling.
4. `Find watch` and `Tonight's list` are reachable only via explicit buttons on the tracker, not exposed under setup.

## Remaining mismatches / caveats (intentional)

- **Photo capture is honest-only.** "Take a photo" / "Choose from photos" close the sheet and surface a yellow toast saying photo capture isn't wired in this demo, then steer the user to manual selection. No camera invocation, no upload, no storage.
- **Connect & test is deterministic.** Tapping it always succeeds (advances to `result-success`). A small "Demo: show failure state" text link below the CTA exists so reviewers can capture the failure path. No real network call, no helper invocation, no IP probing.
- **Countdown auto-tick is local only.** A `setInterval` ticks 3 → 2 → 1 → PLAY in the UI; no `play_now` event is dispatched anywhere. After PLAY the user lands on the post-title prompt.
- **Paywall Upgrade button is honest-only.** It surfaces a toast saying payment isn't wired. No Stripe / IAP / RevenueCat call.
- **Tracker stats are placeholder.** The "4 watch nights / 2 night streak / 2 countdowns / Fri" numbers are static reference values — they do not derive from the local session events. (The reference PNGs use the same numbers; this matches the source-of-truth visuals.)
- **Browse catalog is mock.** Four hand-coded titles (Dune Part Two, The Bear S3, Severance S2, Past Lives). No TMDB call, no provider proxy.
- **Tonight's list is in-memory only.** It resets on page reload (state lives in `useState`, not localStorage). For demo proof this is sufficient since the click walker exercises Browse → Tonight's in one session.
- **Room code is real.** `domain.createRoom()` is called so a real 8-char room code (e.g. `A8BQW7`) appears in the chrome pill across screens; this preserves "room creation basics" per the goal. The websocket transport is NOT mounted, so there is no live partner sync — Meredith's chip on the auto-countdown is shown as ready as a visual companion (to match the reference). The manual-countdown variant correctly shows Meredith as a ghost chip ("waiting").
- **Reference `?demo=01-landing` etc. routes still work.** Both demo routes and the live AppFlow share the same `ref-*` CSS, so visual parity remains tight; reviewers can A/B the live frame against the reference PNG by toggling `?demo=...`.

## Hard-constraint confirmations

- **No deploy.** `wrangler` was not invoked. `dist/` was rebuilt locally for the build verification step only.
- **No commit / push.** `git status` shows working-tree changes only; no `git commit`, no `git push`. Pre-existing dirty files were not touched.
- **No backend / API / Anthropic / vision / photo-storage wiring.** AppFlow imports `domain.createParticipant` / `domain.createRoom` only. No network fetch, no helper, no SDK import.
- **No Stripe / payment / IAP wiring.** The Upgrade button surfaces an honest "not wired" toast.
- **No real device / network test.** `Connect & test` does not call any helper; it advances the screen state machine deterministically.
- **No BRB code touched.** All edits live under `projects/watch-sync-mvp/`.
- **Product truth preserved.** Copy on the failure result, Apple TV steer, and manual countdown banner all still point users to manual fallback. Auto Play remains framed as a generic remote command path.
- **No generic emoji icons.** All glyphs are inline SVG (camera, photos, TV, stick, console, check, cross, Apple TV, fire, popcorn). No emoji used as device or photo glyphs.
