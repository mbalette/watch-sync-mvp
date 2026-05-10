# Kramer 321 Play Photo / Device-ID Visual Receipt — 2026-05-09

## Verdict
Done locally: the running Watch Sync/321 Play app now presents Auto Play Step 1 as a simple 321 Play reference-style screen: one dominant photo action, small privacy note, manual fallback choices underneath, and no extra Step 1 CTA. A photo chooser bottom sheet is available from the hero photo card. No deploy and no commit were performed.

## Scope honored
- Visual/layout/component/CSS only.
- No backend/API/Anthropic/vision wiring.
- No photo persistence; file inputs are reset immediately and only close the visual chooser.
- No deploy.
- No commit.

## Files intentionally changed/created for this pass
- `src/App.tsx`
  - Added `showPhotoDeviceChooser` UI-only state.
  - Replaced the competing inline `Choose from camera roll` secondary control with a single dominant photo card in both the early Step 1 surface and drawer Step 1 surface.
  - Added bottom-sheet photo chooser with `Take photo`, `Choose from camera roll`, privacy note, and cancel.
  - Removed helper copy from drawer Step 1 manual category cards so Step 1 stays close to the reference hierarchy.
- `src/App.css`
  - Added reference-aligned overrides beginning at `/* Kramer 321 Play photo/device-ID visual match — reference export alignment. */`.
  - Restyled photo hero, privacy note, manual divider, manual fallback cards, and photo chooser sheet toward the reference tokens: `#0A0A0E/#111118/#191922`, purple `#7B5CDB`, muted secondary/tertiary text.
  - Extended the first Step 1 panel height so the countdown section no longer competes in the first viewport.
- `scripts/capture-kramer-photo-id-visual-20260509.mjs`
  - Fresh Playwright capture script for this receipt.
- `screenshots/kramer-photo-id-visual-20260509/`
  - Fresh local browser screenshots and contact sheet.

## Existing dirty repo caveat
Before this pass, the repo already had unrelated modified/untracked files, including `src/domain.ts`, `src/index.css`, `src/transport.ts`, `src/tv-remote-device.test.ts`, `src/tv-remote-device.ts`, older receipts/screenshots/scripts, `.wrangler/`, `docs/product/`, and `specs/`. I did not reset or clean those.

## Verification commands
Run from `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`:

```bash
npm run typecheck
# exit 0 — tsc --noEmit

npm run lint -- --quiet
# exit 0 — eslint . --quiet

npm run build
# exit 0 — tsc -b && vite build
# Vite output: dist/index.html 1.04 kB, dist/assets/index-2Hfwcw2l.css 40.37 kB, dist/assets/index-Co9L6Mwv.js 283.06 kB

curl -I --max-time 3 http://127.0.0.1:5173/
# HTTP/1.1 200 OK

node scripts/capture-kramer-photo-id-visual-20260509.mjs
# captured 4 mobile screenshots at 390x844 CSS px / deviceScaleFactor 2
```

Local dev server used:
- URL: `http://127.0.0.1:5173/`
- Hermes process session: `proc_1b18ce64c3c7`

## Visual proof artifacts

Directory:
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-photo-id-visual-20260509/`

| Artifact | Dimensions | SHA256 |
|---|---:|---|
| `01-auto-play-step1-photo-id.png` | 780x1688 | `cda290d33b923aed29baeed8126fbecb7e98e69155562381d870337cfe8211db` |
| `02-photo-bottom-sheet.png` | 780x1688 | `8fbada806d4c9be44ff5c6c499d126505cb1e97ab4a5a4db6c17dac0224ce652` |
| `03-manual-step1-category-selected.png` | 780x1688 | `ecdddf108efdf7dd185fadf4818d2836641e9abece7d8f97a02c8eb161db885b` |
| `04-manual-step2-device-picker.png` | 780x1688 | `a09e21ea686bfb6163cffc71ec67d3bb7772d6876312d867d27ee595fe7951a4` |
| `contact-sheet.png` | 1632x3536 | `653da21d9f76ca53a6013a2018bb22086d28480884f3a3d7d6180adee9454131` |
| `metrics.json` | n/a | `8bc0d65c86fa089cb59e09e55a63e24d263f306243a88ae16ecd72b40d887e05` |

## Reference comparison

Primary reference: `dark/02-auto-play-step1-photo-id.png`
- Match: Step 1 has a purple uppercase kicker, white “What do you watch on?” title, dominant centered photo hero, small privacy note, divider-style “or pick manually:”, and three stacked manual choices.
- Match: `Take photo` and `Choose from camera roll` are no longer competing on the Step 1 screen; they appear only in the chooser state.
- Match: No Step 1 bottom CTA such as “Set up your TV”, “Choose your TV or device”, or “Choose what you watch on first”.
- Match: Countdown/next section is pushed out of the first mobile screenshot viewport so Step 1 remains the focus.

Primary reference: `dark/03-photo-bottom-sheet.png`
- Match: Photo card opens a bottom sheet with drag handle, dark elevated surface, photo source choices, small privacy note, and cancel action.
- Match: No backend/upload/storage/Anthropic promise copy in the sheet.

References: `dark/04-manual-step1-category.png` and `dark/05-manual-step2-device-picker.png`
- Match: Manual category choices are stacked, dark, rounded cards with left icon blocks and text, selected state uses purple border/accent.
- Match: Device picker retains stacked dark cards, left icon blocks, purple selected state, and beta badges.

## Remaining mismatches / caveats
- The implementation still sits inside the existing Watch Sync room shell, so the top room header/status row is visible above Step 1; the reference export is a standalone iPhone-frame screen without the room code header.
- Icons are still emoji/text-like placeholders rather than exact custom SVG line icons from the reference package.
- The exact iOS font rendering and spacing can differ in Chromium versus the reference PNG export.
- `03-manual-step1-category-selected.png` is captured from the integrated drawer/onboarding flow after selection, not a standalone reference screen with a fixed bottom `Next` button.
- No production/deploy parity was checked; proof is from local Vite only.
