# Kramer — Auto Play Step 1 Photo/Device-ID Visual Match (Final)

**Date:** 2026-05-09
**Persona:** Kramer (Discord runtime)
**Goal:** Visual-only fix so Auto Play Step 1 matches `dark/02-auto-play-step1-photo-id.png` and `dark/03-photo-bottom-sheet.png`. No backend wiring.
**Target repo:** `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`
**Reference exports:** `/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/dark/`

## Diagnosis

Before this pass, the inline Step 1 photo/device-ID screen had the right structural skeleton (purple `Step 1` kicker, "What do you watch on?" title, hero photo card, privacy note, "or pick manually" divider, three method choices, no rejected bottom CTAs) — but the three manual-choice buttons were rendered as title-only rows. Without their reference helper sub-line, they read as a cramped settings list and competed with the photo hero instead of clearly stepping below it. That matched the prior "dense settings component" critique.

Photo bottom-sheet (`03-photo-bottom-sheet`) was already shaped correctly.

## What changed

Reference parity for the manual-choice cards in both the inline Step 1 view and the in-drawer Step 1 view: each button now renders a 2-line copy block (`<strong>` title + muted `<em>` helper), matching the reference rows like "TV app built into my TV / Your TV's built-in streaming apps." Also tuned card geometry (slightly larger glyph, looser radius, taller min-height) so manual cards read as substantial rows rather than a dense list — but stay clearly secondary to the photo hero.

### Files touched in this session

| File | What |
|------|------|
| `src/App.tsx` | Inline `early-method-choice` (line ~1725): wrap `<strong>` + new `<em>` helper inside `.early-method-copy`. Drawer `tv-choice-card.method-choice-card` (line ~2470): swap `<small>` helper for `<em>` and use the same reference copy. |
| `src/App.css` | In the `Kramer 321 Play photo/device-ID visual match` block: scope icon styling to `.method-glyph` (was `span`) so it doesn't leak onto the new copy span; add `.early-method-copy` / `.tv-choice-copy` defensive overrides (`width auto`, `justify-items: start`, `text-align: left`, neutralize the older `.early-method-choice span` icon-shape rule); add `em` style (11px, `#504F5A`, normal-style); bump card `min-height` 58→64, glyph 32→36, radius 10→12. |

No new components, no new files, no scope creep into behavior or backend.

### Copy used (verbatim from reference)

- TV app built into my TV / Your TV's built-in streaming apps.
- Streaming stick or box / Roku, Fire TV, Android TV, etc.
- Console / cable / other / More devices coming soon.

(The data file already contained the long-form helpers; reference uses the shorter forms, so the JSX overrides for the streaming-stick and console rows.)

## Verification commands

```text
$ npm run typecheck
> tsc --noEmit
(clean)

$ npm run lint -- --quiet
> eslint . --quiet
(clean)

$ npm run build
> tsc -b && vite build
dist/index.html                   1.04 kB │ gzip:  0.49 kB
dist/assets/index-7mPDywL6.css   69.49 kB │ gzip: 12.63 kB
dist/assets/index-DSVzs1RY.js   309.21 kB │ gzip: 89.31 kB
✓ built in 86ms
```

## Visual proof

Generated with `scripts/capture-kramer-photo-id-visual-20260509-final.mjs` against the running Vite dev server (`http://127.0.0.1:5173/`), iPhone-class viewport `390 × 844`, `deviceScaleFactor: 2`, `isMobile: true`.

| File | SHA-256 | Bytes |
|------|---------|-------|
| `screenshots/kramer-photo-id-visual-20260509-final/01-auto-play-step1-photo-id.png` | `8cc1fcfdbaf46c467000bc4fc925aec82212fb404be7c295f86ce5eaf07c3d84` | 191 213 |
| `screenshots/kramer-photo-id-visual-20260509-final/01b-auto-play-step1-photo-id-card-aligned.png` | `5f4676aa1e9be0c63a58c6326f954083badb9b6f49bd4a13314ed85122a9435d` | 183 586 |
| `screenshots/kramer-photo-id-visual-20260509-final/02-photo-bottom-sheet.png` | `d2ca28f43c0ffb2bcdc6fecab164ee0745968b1c7b3e998a6de3dc57d1894593` | 139 056 |
| `screenshots/kramer-photo-id-visual-20260509-final/03-drawer-step1-after-method-pick.png` | `7097370be2b856e6428cd5881ba7481bfedf19f8b7f7331460a1ba944057277a` | 179 699 |
| `screenshots/kramer-photo-id-visual-20260509-final/04-drawer-step2-device-picker.png` | `31c324d6cd7caa2e0e61e4eae07d0c10aac9eddcf7da8c3b393489633694d737` | 130 432 |

Capture script: `scripts/capture-kramer-photo-id-visual-20260509-final.mjs`
Records JSON: `screenshots/kramer-photo-id-visual-20260509-final/records.json`

## Self-critique vs reference PNGs

### `01-auto-play-step1-photo-id.png` vs `dark/02-auto-play-step1-photo-id.png`

Matches:

- `STEP 1` kicker: purple, uppercase, tracked. Same color as reference.
- "What do you watch on?" title: weight, size, letter-spacing align with reference.
- Step sub-line "We'll set up Auto Play for your device.": present, secondary text, single line.
- Photo hero: rounded card, top-anchored radial purple tint, centered camera glyph in tinted purple square, "Identify with a photo" then sub-line "Snap your TV or remote, or choose from photos." All copy verbatim.
- Privacy note "Photo identifies your device only. Not saved." rendered small / tertiary, below the hero.
- Divider "or pick manually" rendered as muted text with thin gradient rules either side.
- Manual cards: icon-on-left + title-on-right + muted helper sub-line. 2-line layout. Stack of three, gap matches reference.
- No bottom CTA ("Set up your TV", "Choose your TV or device", "Choose what you watch on first") — verified absent.
- Photo card is clearly the dominant action; manual cards read as secondary.

Mismatches / caveats:

- **App chrome above the Step 1 section** (321 Play wordmark / room code chip / "PRIVATE LOCAL ROOM | 0 OF 2 READY" strip) is present in the live shot but absent from the reference, because the reference is a stand-alone screen from the export package. This pushes Step 1 down ~135px. Out of scope to remove — that header is the live room context the actual app needs. If this becomes a blocker, recommend a brief from Matt: do we hide the app chrome on the early-onboarding state, or do we accept the difference as expected for a live app vs a static reference?
- **Manual-card glyphs** are CSS line glyphs (TV outline + stand, streaming-stick pill, console pill with dots) rather than the reference's filled-square device illustrations. Per the reference rule "SVG icon paths (match style not exact)", line-glyph style is acceptable, but a future SVG pass could swap to filled tinted squares to match the reference more literally.
- The scrollbar / safe-area aesthetics are native dark-mode and not stylized.

### `02-photo-bottom-sheet.png` vs `dark/03-photo-bottom-sheet.png`

Matches:

- Sheet docked to bottom, rounded top corners, top drag handle pill.
- "Press Play together." title + "from anywhere" subtitle (verbatim).
- Two action rows ("Take a photo" + camera glyph, "Choose from photos" + photo-stack glyph) with tinted purple icon squares.
- "Pick manually instead" tertiary text link below the actions.
- Background page is dim-blurred behind the sheet.

Mismatches / caveats:

- Acceptable.

### `03-drawer-step1-after-method-pick.png` vs `dark/04-manual-step1-category.png`

Matches:

- Three manual cards now show 2-line layout (title + helper sub-line) consistent with reference 04 device-card style.
- Selected card shows purple border + tint background + purple-tinted icon.

Mismatches / caveats:

- The drawer flow shows a transient "Good. Next: choose your TV or device." hint paragraph after a method is selected and auto-scrolls to Step 2. Reference 04 instead shows a stationary screen with a `Next` primary button. This is the in-app interactive-state difference rather than a Step 1 visual divergence — left out of scope per the brief ("visuals only", "Do not proceed into behavior sections").

### `04-drawer-step2-device-picker.png` vs `dark/05-manual-step2-device-picker.png`

Matches:

- Step 2 kicker, "Which device?" title, "Tap your device." sub.
- 6-row scrolling device list, each row icon + title + helper + Auto Play (beta) badge.

Mismatches / caveats:

- Live cards are taller than reference (each row carries description + badge whereas reference compresses) — also out of scope; the brief was Step 1.

## Remaining mismatches / caveats summary

1. App-chrome header above Step 1 is present in live shot but absent from the static reference — needs Matt's call on whether to hide chrome on the onboarding state.
2. Manual-card icons are CSS line glyphs, not the reference's filled tinted squares.
3. Drawer-mode interactive state (selected hint / auto-scroll to step 2) intentionally untouched per "visuals only" scope.
4. Step 2 device cards are denser than reference because they carry full helper + badge in the live app.

## Acceptance check

- ✅ Photo card is the dominant hero action.
- ✅ Manual cards are below the hero, readable, with helper sub-line — no longer cramped/competing.
- ✅ Take photo / Choose from photos appear in the bottom-sheet matching `03-photo-bottom-sheet.png`.
- ✅ No `Set up your TV`, `Choose your TV or device`, or `Choose what you watch on first` CTA on the Step 1 screen.
- ✅ Privacy note small/understated.
- ✅ 321 Play dark token palette preserved (`#0A0A0E`, `#111118`, `#191922`, `#7B5CDB`, `#EDEAE5`, `#8A8895`, `#504F5A`).
- ✅ `npm run typecheck` clean.
- ✅ `npm run lint -- --quiet` clean.
- ✅ `npm run build` clean — 309 kB JS / 69 kB CSS, gzipped 89 / 13 kB.
- ✅ Screenshots captured at `390 × 844`, retina, mobile context.

No commits. No deploy. Ready for Matt / Big Mike review.
