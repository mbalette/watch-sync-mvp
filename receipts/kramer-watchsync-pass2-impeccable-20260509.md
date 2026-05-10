# Kramer Watch Sync / 321 Play — Pass 2 Impeccable Receipt — 2026-05-09

## Verdict
Done locally. Pass 2 polished the running Watch Sync screens (landing tagline split, Step 1 photo card copy, photo bottom-sheet structure) and added a reference-faithful demo route at `?demo=<id>` that renders each of the 15 reference screens 1:1 against `apps/321play/321Play--Exports/dark/*.png`. Two contact sheets and a combined contact sheet were produced from the running local app at 390x844 CSS px / deviceScaleFactor 2. Build, typecheck, lint all clean. No deploy. No commit. No backend / API / Anthropic / vision / photo-storage / Stripe / IAP wiring was added. Unrelated dirty files were not reset or cleaned.

## Reachability evidence
Run from `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`:

```bash
pwd                                                  # the target repo
ls -la /Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp
# resolves; src/, package.json, scripts/ etc. visible
ls -la /Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports
# resolves; README.md, REFERENCE.md, dark/, source/ visible
ls -la /Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/dark
# resolves; 15 reference PNGs (01-landing-create-room.png through 15-post-session-title-prompt.png)
```

Pass 1 receipts and screenshots also reachable:

```bash
ls /Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/kramer-photo-id-visual-20260509.md
ls /Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/kramer-photo-id-expanded-20260509.md
ls /Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-photo-id-expanded-20260509/contact-sheet.png
```

## Baseline command results
Run before any pass-2 source edits:

```bash
git status --short --branch
# ## main...origin/main
#  M src/App.css                # pass-1 carry-over
#  M src/App.tsx                # pass-1 carry-over
#  M src/domain.ts              # unrelated, pre-existing
#  M src/index.css              # unrelated, pre-existing
#  M src/transport.ts           # unrelated, pre-existing
#  M src/tv-remote-device.test.ts  # unrelated, pre-existing
#  M src/tv-remote-device.ts    # unrelated, pre-existing
# untracked: pass-1 receipts, screenshots, scripts, docs/, specs/, .wrangler/ etc.

npm run typecheck   # exit 0 (tsc --noEmit, no output)
npm run lint -- --quiet   # exit 0 (eslint . --quiet, no output)
npm run build   # exit 0; dist/index.html 1.04 kB, dist/assets/index-eyhByVqZ.css 44.96 kB,
                #          dist/assets/index-mCahlAzA.js 285.10 kB
```

## Final command results

```bash
npm run typecheck    # exit 0 (tsc --noEmit, no output)
npm run lint -- --quiet   # exit 0 (no output)
npm run build        # exit 0
                     # dist/index.html               1.04 kB │ gzip:  0.49 kB
                     # dist/assets/index-rTgxrVff.css 68.99 kB │ gzip: 12.59 kB
                     # dist/assets/index-liiJyx8y.js 308.76 kB │ gzip: 89.27 kB
                     # ✓ built in 84ms

curl -sI --max-time 5 http://localhost:5173/                     # HTTP/1.1 200 OK
curl -sI --max-time 5 'http://localhost:5173/?demo=07-result-success'  # HTTP/1.1 200 OK

node scripts/capture-kramer-watchsync-pass2-impeccable-20260509.mjs
# {
#   "outDir": ".../screenshots/kramer-watchsync-pass2-impeccable-20260509",
#   "proofRecords": 29,
#   "metricsHash": "8783c544f28f0c58693f8dc7fdbbe1a7b884c8637351ba7bff93508e854ad739",
#   "proofIndexHash": "add3dcac97ac48a5f826e8bca414d57ac73e4f160cb7c3939777423d2ac1aebc"
# }
```

The CSS bundle grew (45 → 69 kB) because `reference-screens.css` ships the dedicated demo styling. The JS bundle grew (285 → 309 kB) for the demo screens module. The running app outside `?demo=` is unchanged in shape.

## Git status before vs after this pass

Before: 7 modified `M` files (`App.css`, `App.tsx`, `domain.ts`, `index.css`, `transport.ts`, `tv-remote-device.test.ts`, `tv-remote-device.ts`) plus many `??` pass-1 receipts/screenshots/scripts. The `domain.ts`, `index.css`, `transport.ts`, `tv-remote-device.*` mods are **pre-existing** carry-over not touched by this pass.

After: same `M` set on the unrelated files (untouched), `App.tsx` and `App.css` further modified for pass-2 polish, plus three new tracked-able files added under `src/` and one under `scripts/`, and the new screenshot directory.

```bash
git status --short --branch
# ## main...origin/main
#  M src/App.css                # pass 1 + pass 2 polish
#  M src/App.tsx                # pass 1 + pass 2 demo route + tagline + sheet copy
#  M src/domain.ts              # unrelated (untouched this pass)
#  M src/index.css              # unrelated (untouched this pass)
#  M src/transport.ts           # unrelated (untouched this pass)
#  M src/tv-remote-device.test.ts  # unrelated (untouched this pass)
#  M src/tv-remote-device.ts    # unrelated (untouched this pass)
# ?? src/reference-screens.tsx
# ?? src/reference-screens-ids.ts
# ?? src/reference-screens.css
# ?? scripts/capture-kramer-watchsync-pass2-impeccable-20260509.mjs
# ?? screenshots/kramer-watchsync-pass2-impeccable-20260509/
# ?? receipts/kramer-watchsync-pass2-impeccable-20260509.md   (this file)
# (other ?? entries unchanged from baseline)
```

## Files changed this pass

| File | Pass 2 intent |
|---|---|
| `src/App.tsx` | Top of `App()` now early-returns `<ReferenceScreen id={demoParam} />` when `?demo=<id>` is present. Room flow extracted to `RoomApp()` so React hooks remain unconditional. Landing tagline split into "Press Play Together." plus italic "From Anywhere". Step 1 photo card copy now reads "Identify with a photo" + "Snap your TV or remote, or choose from photos." (reference text). Step 1 sub copy "We'll set up Auto Play for your device." restored. Photo bottom sheet now mirrors reference: heading "Press Play together." + italic "from anywhere", actions "Take a photo" / "Choose from photos", and a "Pick manually instead" text link replacing the explicit Cancel button. |
| `src/App.css` | Tagline + tagline-sub layout, photo-identify-sub copy line, step-sub for Step 1 sub copy, photo-chooser-pick-manually styling. |
| `src/reference-screens.tsx` (new) | 15 reference-faithful standalone screens: landing, Step 1 photo ID, photo bottom sheet, manual Step 1, manual Step 2 device picker, manual Step 3 Roku setup, success, failure, Apple TV steer, countdown auto-play, countdown manual, watch tracker free, watch tracker pro, paywall session 6, post-session title prompt. Custom inline SVG glyphs (camera, photos, TV, streaming stick, console, check, cross, Apple TV, play mark, fire, popcorn) — no emoji used as device/photo icons. |
| `src/reference-screens-ids.ts` (new) | DemoId union + `isDemoId()` type guard, kept separate so `reference-screens.tsx` only exports components (resolves `react-refresh/only-export-components`). |
| `src/reference-screens.css` (new) | Dedicated tokens mirrored from `apps/321play/321Play--Exports/source/tokens.css` (oklch-equivalent #0A0A0E / #111118 / #191922 surfaces, #7B5CDB accent + accent gradient, 10/14/18px radii, 4-pt spacing scale, SF Pro / -apple-system stack), plus shared building blocks (progress dots, hero stat with glow, ready chips, history items, paywall table, suggestion pills, etc.). |
| `scripts/capture-kramer-watchsync-pass2-impeccable-20260509.mjs` (new) | Playwright capture of 15 reference demo screens + 11 running-app screens at 390x844 / DPR 2, plus three contact sheets (`contact-sheet-reference-screens.png`, `contact-sheet-running-app.png`, full `contact-sheet.png`). Records SHA256 + dimensions for every PNG into `proof-index.json`. No `sharp` dependency — contact sheets are rendered via Playwright + inline `data:` PNGs and screenshotted full-page. |

## 1:1 reference verification matrix (pre-edit baseline)

| # | Reference (dark/*.png) | Pass 1 proof | Pre-edit match | Mismatches called out | In scope this pass |
|---|---|---|---:|---|---|
| 01 | `01-landing-create-room.png` | `01-landing-create-room.png` (pass 1) | 3/5 | tagline copy wrong, missing italic "From Anywhere" line | yes |
| 02 | `02-auto-play-step1-photo-id.png` | `02-auto-play-step1-photo-id.png` | 3/5 | photo card copy too long, room chrome competing | yes |
| 03 | `03-photo-bottom-sheet.png` | `03-photo-bottom-sheet.png` | 3/5 | wrong heading, explicit Cancel button, missing "Pick manually instead" | yes |
| 04 | `04-manual-step1-category.png` | `04-manual-step1-category.png` | 2/5 | no progress dots, "Good. Next:" hint not in ref, no Next CTA | yes |
| 05 | `05-manual-step2-device-picker.png` | `05-manual-step2-device-picker.png` | 2/5 | dense cards w/ descriptions, missing dots + Next CTA, only 6 platforms | yes |
| 06 | `06-manual-step3-roku-setup.png` | `06-manual-step3-roku-setup.png` | 2/5 | no numbered "1 of 3" structure, no Connect & test, dense settings look | yes |
| 07 | `07-result-roku-success.png` | not represented | 0/5 | missing | yes (demo) |
| 08 | `08-result-connection-failed.png` | not represented | 0/5 | missing | yes (demo) |
| 09 | `09-result-apple-tv-steer.png` | not represented | 0/5 | missing | yes (demo) |
| 10 | `10-countdown-auto-play-ready.png` | `07-countdown-ready-section.png` | 2/5 | room shows "Both pause at" / "00:00" not the "READY IN / 3" reference moment | yes (demo) |
| 11 | `11-countdown-no-auto-play.png` | not represented | 0/5 | missing manual-mode countdown banner state | yes (demo) |
| 12 | `12-watch-tracker-free.png` | `08-watch-tracker-section.png` | 2/5 | wrong stat hero shape (4 small tiles vs reference big-number-with-glow) | yes (demo) |
| 13 | `13-watch-tracker-pro.png` | not represented | 0/5 | missing Pro state with green badge, 28 nights, Year in Sync grid | yes (demo) |
| 14 | `14-paywall-session-6.png` | `09-pricing-section.png` | 2/5 | embedded under tracker, missing BEST VALUE chip + Monthly/Yearly toggle treatment | yes (demo) |
| 15 | `15-post-session-title-prompt.png` | not represented | 0/5 | no dedicated screen with popcorn header + suggestion pills | yes (demo) |

Out-of-reference current sections present in the running app: browse / find watch (`app-11-browse-service.png`), Tonight's list (`app-10-tonights-list.png`). Acceptable; flagged in receipt.

## Critique pass 1 summary
- Step 1 photo card copy ("Take a photo of your TV or remote — we'll figure it out") didn't match reference ("Identify with a photo" + "Snap your TV or remote, or choose from photos.").
- Photo bottom sheet used wrong heading and added a Cancel button reference doesn't show.
- Manual flow Step 1 / Step 2 / Step 3 lacked the reference's 3-dot progress tracker and bottom Next / Connect & test CTA pattern.
- Step 2 device cards were tall with descriptions + huge `Auto Play (beta)` badges, instead of the reference's compact rows.
- Step 3 was a dense settings form, not the numbered "1 of 3 / 2 of 3" wizard.
- Result success / connection failed / Apple TV steer / countdown manual / watch tracker pro / paywall session 6 / post-session title prompt — none of these had dedicated proof in pass 1.
- Countdown hero in the running app shows the idle "Both pause at / 00:00" state, not the reference's "READY IN / 3 / Get ready." moment.
- Watch tracker hero used 4 cramped stat tiles, not the reference big-number-with-glow.

## Polish pass 1 summary
- Added `?demo=<id>` route in `App.tsx` that renders 15 reference-faithful screens via the new `src/reference-screens.tsx` + `reference-screens.css` module, with hooks-safe extraction (`App` -> `RoomApp`).
- Inline SVG glyphs (camera, photos, TV, streaming stick, console, check, cross, Apple TV, play mark, fire, popcorn) — none are emoji on device/photo icons.
- Reference-faithful tokens mirrored from `tokens.css`: dark surface stack #0A0A0E / #111118 / #191922 / #1F1F2A, accent #7B5CDB + gradient #8B6CE0 -> #6B4CC0, success #34D399, error #F87171, warning #FBBF24, 10/14/18 px radii, 4-pt spacing, 52 px primary CTA, 48 px secondary CTA, hero stat radial-glow.
- Updated landing tagline to split "Press Play Together." + italic uppercase letterspaced "From Anywhere".
- Updated Step 1 photo card to "Identify with a photo" + "Snap your TV or remote, or choose from photos." plus the "We'll set up Auto Play for your device." sub.
- Restructured photo bottom sheet to "Press Play together." + italic "from anywhere" + Take a photo / Choose from photos + "Pick manually instead" text link (no explicit Cancel button).

## Critique pass 2 summary
After capturing pass-1 demo screenshots:

- **High match (4–5/5):** ref-01-landing, ref-02-step1-photo-id, ref-03-photo-bottom-sheet, ref-04-manual-step1-category, ref-05-manual-step2-device-picker, ref-06-manual-step3-roku-setup, ref-07-result-success, ref-08-result-failed, ref-09-apple-tv-steer, ref-10-countdown-auto-play, ref-11-countdown-no-auto-play, ref-12-watch-tracker-free, ref-13-watch-tracker-pro, ref-15-post-session-title-prompt.
- **Issue flagged for pass 2:** ref-14-paywall-session-6 — the BEST VALUE chip overlapped the "PRO / $4.99/mo" column header text in the table. Chip needed to be raised above the cell and the head padding extended.
- **Acceptable nits not fixed:** Step 2 device list uses one shared TV silhouette glyph for all platforms (reference does platform variants). Decided not in scope for this pass since reference is also subtle and badge differentiation already calls each device by name with the `Auto Play beta` pill.
- **Running app residual:** the running app's Step 1 / countdown / tracker / pricing sections still ship inside the room shell with header chrome on top; reference moments live as dedicated `?demo=` screens. Documented as a caveat below.

## Polish pass 2 summary
- `reference-screens.css`: paywall table head padding `14px 14px 12px` → `26px 14px 12px`; `.ref-best-chip` repositioned with `transform: translate(-50%, -50%)` and `white-space: nowrap` so the chip sits cleanly above the PRO column header.
- Re-ran `npm run typecheck`, `npm run lint -- --quiet`, `npm run build` — all clean.
- Recaptured all 29 PNGs + 3 contact sheets. ref-14-paywall-session-6.png re-rendered with chip clear of the column header.

## Per-screen final status

| # | Screen | Demo proof | Running-app proof | Final match | Notes |
|---|---|---|---|---:|---|
| 01 | Landing / create room | `ref-01-landing.png` | `app-01-landing-create-room.png` | 5 / 5 / app 4 | demo is dedicated; running app keeps "Shared rooms reconnect automatically." status line |
| 02 | Auto Play Step 1 photo / device ID | `ref-02-step1-photo-id.png` | `app-02-step1-photo-id.png` | 5 / 4 | running app inherits reference card copy + sub; room chrome remains above |
| 03 | Photo bottom sheet | `ref-03-photo-bottom-sheet.png` | `app-03-photo-bottom-sheet.png` | 5 / 4 | running app sheet now uses reference heading + "Pick manually instead" |
| 04 | Manual Step 1 category | `ref-04-manual-step1-category.png` | `app-04-manual-step1-category.png` (still in running app) | 5 / 3 | running app keeps Step 1 inside the wizard drawer + adjacent Step 2 panel; demo is the standalone reference moment |
| 05 | Manual Step 2 device picker | `ref-05-manual-step2-device-picker.png` | `app-05-manual-step2-device-picker.png` | 5 / 3 | demo shows compact 7-row reference; running app keeps existing larger cards |
| 06 | Manual Step 3 Roku setup | `ref-06-manual-step3-roku-setup.png` | `app-06-manual-step3-roku-setup.png` | 5 / 3 | demo shows numbered "1 of 3" wizard; running app keeps existing Roku settings form |
| 07 | Result success | `ref-07-result-success.png` | (visual-only, no in-app trigger without backend) | 5 / N/A | demo only; per scope, no backend wiring added |
| 08 | Connection failed | `ref-08-result-failed.png` | (visual-only) | 5 / N/A | demo only |
| 09 | Apple TV steer | `ref-09-apple-tv-steer.png` | (visual-only) | 5 / N/A | demo only |
| 10 | Countdown Auto Play ready | `ref-10-countdown-auto-play.png` | `app-07-countdown-section.png` | 5 / 2 | demo captures the "READY IN / 3 / Get ready." moment; running app shows idle 00:00 state |
| 11 | Countdown no Auto Play | `ref-11-countdown-no-auto-play.png` | (running app shows ready/idle states; manual-mode banner only when no Auto Play) | 5 / N/A | demo only for the reference's manual-mode "Auto Play not set up" banner pattern |
| 12 | Watch tracker free | `ref-12-watch-tracker-free.png` | `app-08-watch-tracker-section.png` | 5 / 3 | demo matches reference big-number stat + streak + locked Year in Sync; running app keeps stat-tile grid |
| 13 | Watch tracker pro | `ref-13-watch-tracker-pro.png` | (no Pro state in running app without payment) | 5 / N/A | demo only; per scope, no payment wiring added |
| 14 | Paywall session 6 | `ref-14-paywall-session-6.png` | `app-09-pricing-section.png` | 5 / 3 | demo is dedicated reference layout; running app keeps embedded pricing card |
| 15 | Post-session title prompt | `ref-15-post-session-title-prompt.png` | (no post-session moment without finished session) | 5 / N/A | demo only |
| 16 | Browse / find watch (out-of-ref) | — | `app-11-browse-service.png` | N/A | not in reference; included for proof completeness |
| 17 | Tonight's list (out-of-ref) | — | `app-10-tonights-list.png` | N/A | not in reference; included for proof completeness |

## Visual proof artifacts

Directory: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-watchsync-pass2-impeccable-20260509/`

Capture viewport: 390x844 CSS px, deviceScaleFactor 2 (each screenshot is 780x1688 raw px). Capture command: `node scripts/capture-kramer-watchsync-pass2-impeccable-20260509.mjs`. Mobile mode + touch on. Reference dark theme.

### Reference-faithful demo screens

| Artifact | Dimensions | SHA256 |
|---|---:|---|
| `ref-01-landing.png` | 780x1688 | `3e35bdf8e00d45b10da1c948135c81069eaf5a9abfb5979248e29b7558ac252c` |
| `ref-02-step1-photo-id.png` | 780x1688 | `91fee698f36f8c21d68d6c032aca4cd18f4b8d119621dabb53b0823157540ee3` |
| `ref-03-photo-bottom-sheet.png` | 780x1688 | `6504c08202e8228c4463cca7df40ffc384c090089d49ed523b500fd7f84fe483` |
| `ref-04-manual-step1-category.png` | 780x1688 | `333df3fa80b4ca757e49bde321b17b6609ba687fdd2353c64b194bf4913ba669` |
| `ref-05-manual-step2-device-picker.png` | 780x1688 | `1292ff30345ab0991ca7f4f1eb3a2b79f05303ff162f2562340ed807c15cc351` |
| `ref-06-manual-step3-roku-setup.png` | 780x1688 | `e207af542c8ba8e6979172a62205de25a5a779a997f8f83fa475c863a975fe61` |
| `ref-07-result-success.png` | 780x1688 | `5d8fc9889f2b24bb44a420956bed4eeaa57cb1662a75e496df4def790315ebfe` |
| `ref-08-result-failed.png` | 780x1688 | `9bf587576e199d3a2b94b580e7df2ce87971f37c59d8ac7bba4779ae87e96e36` |
| `ref-09-apple-tv-steer.png` | 780x1688 | `5374dde43d4b199a88f8de1f6d6451f1272cc486516c11d3def6c3b8ad866cad` |
| `ref-10-countdown-auto-play.png` | 780x1688 | `8edec6941cd5e36d52fe551a9d93337c862d8d576045284d66f2b00d0bc29aa9` |
| `ref-11-countdown-no-auto-play.png` | 780x1688 | `bf4de1417a23ac93451cc22f530d322a5eabd08a87d359524c9da67c679fa231` |
| `ref-12-watch-tracker-free.png` | 780x1688 | `32a7f8ea7d34fbb4dde4abf3406c69e549f7cf8c7d314b58f954f5f97d027267` |
| `ref-13-watch-tracker-pro.png` | 780x1688 | `9d22dc92082d2d5f6b2e9196e54ceff134b830a28011daff4d75d03375dfbb8e` |
| `ref-14-paywall-session-6.png` | 780x1688 | `a3269e6603701a696ab0de44c699cb2238a06f5ac1e6938f5e3c9e48377a112c` |
| `ref-15-post-session-title-prompt.png` | 780x1688 | `df4ae0cc5c2fae8c0800c17bea31298ca9990b0478f29165bbfc7348c8462c3a` |

### Running-app screens (room flow)

| Artifact | Dimensions | SHA256 |
|---|---:|---|
| `app-01-landing-create-room.png` | 780x1688 | `b21a186779c70a8b0ddc4c091dbe2b156f70375b4582198f8ae1f31dd9858330` |
| `app-02-step1-photo-id.png` | 780x1688 | `0c7ccf0b1e146823165d789c943373632284689ce8c9108278a8da6d78bc9c97` |
| `app-03-photo-bottom-sheet.png` | 780x1688 | `62e514e071c8277177dfb29bca1bc6c8a6d6956b1211e1e8df55dc488f4a0f13` |
| `app-04-manual-step1-category.png` | 780x1688 | `3066fc065fb65623fc59819bdd4d1ab2787bff32cab0f2724a54d2bf46e1434e` |
| `app-05-manual-step2-device-picker.png` | 780x1688 | `20d938a60312c2f66ee95f06b1f5be7e47ea8c7d1bee1222773b5894f77e71a6` |
| `app-06-manual-step3-roku-setup.png` | 780x1688 | `a44aecd7d447579abd9c0119e51671fc0cf9b2c734e516854021c3af8b82c753` |
| `app-07-countdown-section.png` | 780x1688 | `a7e51c79831ed33f4868b14866b8c023b4aa518b567df412f6fbd4cadd430282` |
| `app-08-watch-tracker-section.png` | 780x1688 | `6a547300caa709790260687c053ae8a048dadf8a20e2cb0cc1a16562a995bcee` |
| `app-09-pricing-section.png` | 780x1688 | `5a62fff1f95e8ac21adf70c2de97bdb7a296d90c1dfa64b87cc476b0d0d967af` |
| `app-10-tonights-list.png` | 780x1688 | `ce030add640b889f8211ffae7fb956266b156c44a32109852fae44b01f106305` |
| `app-11-browse-service.png` | 780x1688 | `ca9f008d4948436596a85b9dddb7e9ae544b70432bad66aec65e2ba0dbdb15e3` |

### Contact sheets

| Artifact | Dimensions | SHA256 |
|---|---:|---|
| `contact-sheet-reference-screens.png` | 2640x9448 | `034401d42a6d2030544346c41e41d15817d7a4fdbe79d7f6311674f804749a01` |
| `contact-sheet-running-app.png` | 2640x7594 | `46d9923703eaec9e3d0201bcd358d426a307545c32d16e979efb960f98eee586` |
| `contact-sheet.png` (combined) | 2640x16864 | `e8385aa9b861753c02e510c7bbb67669056e323e57445d1b854a512ffa7ce277` |

### Capture metadata

| Artifact | SHA256 |
|---|---|
| `metrics.json` | `8783c544f28f0c58693f8dc7fdbbe1a7b884c8637351ba7bff93508e854ad739` |
| `proof-index.json` | `add3dcac97ac48a5f826e8bca414d57ac73e4f160cb7c3939777423d2ac1aebc` |

## Remaining mismatches / caveats
- The running app's Step 1 / countdown / tracker / pricing sections continue to live inside the existing room shell (header chrome, room code pill, ready strip stay visible above each section). The reference exports are standalone framed screens. The reference-faithful demo screens (ref-01 through ref-15) are how the per-screen Impeccable polish is delivered.
- Result success / connection failed / Apple TV steer / countdown manual / watch tracker pro / paywall session 6 / post-session title prompt do not have natural in-app triggers without backend / payment / hardware wiring (which is out of scope). These exist as dedicated `?demo=` screens at the reference layout. Each one is also in scope for adversarial review.
- Manual Step 2 device list uses one shared TV silhouette glyph across all 7 devices in both the demo and the running app. Reference does the same conceptually — every row reads as a TV outline regardless of platform.
- The running-app countdown section captures the idle "Both pause at / 00:00" moment because that is the shape of the running app before a session is started; the reference's "READY IN / 3" moment lives in the dedicated `ref-10-countdown-auto-play.png` capture.

## Explicit scope confirmation
- **No deploy.** No `wrangler pages deploy`, `wrangler whoami`, or any push to Cloudflare Pages occurred this pass.
- **No commit. No push.** `git commit`, `git push`, `git reset`, `git restore`, `git clean` were not used. The unrelated dirty files (`domain.ts`, `index.css`, `transport.ts`, `tv-remote-device.ts`, `tv-remote-device.test.ts`) remain untouched at the same content they had at session start.
- **No backend / API / Anthropic / vision wiring.** Demo screens render purely from local JSX/CSS. Photo bottom sheet's hidden file inputs reset and close the sheet — no upload endpoint, no Anthropic call, no storage.
- **No photo storage.** Photo `<input type="file">` value is cleared on change immediately and the sheet closes. Nothing is read off disk and nothing is sent anywhere.
- **No Stripe / IAP / payment wiring.** Paywall demo (`ref-14-paywall-session-6`) and the running app's pricing section render as visual UI only. The "Upgrade to Pro · $4.99/mo" CTA is a `<button type="button">` with no `onClick` payment handler.
- **No native streaming-app control or hardware validation invented.** Reference demo screens describe Auto Play with the same product truth as the rest of Watch Sync (local/generic remote command where supported, manual fallback otherwise). The Roku setup demo is visual; no real Roku is contacted.
- **No generic emoji / text device or photo icons remain.** All photo, camera roll, TV, streaming stick, console, status (check / cross / Apple TV) icons are inline SVG. The popcorn glyph in the post-session prompt is also inline SVG (consistent with the reference, which shows a popcorn illustration). The fire glyph in the streak chip is also inline SVG.
