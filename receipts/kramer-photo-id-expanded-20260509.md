# Kramer 321 Play Photo / Device-ID Expanded Visual Receipt — 2026-05-09

## Verdict
Corrected after Matt's review. The generic emoji/text device icons were replaced with CSS-drawn line icons, and the proof package now includes an expanded mobile contact sheet with pricing/paywall and the other major in-app sections, not just the four Step 1 reference states.

No deploy. No commit.

## Changes in this correction pass
- `src/App.tsx`
  - Added `getWatchingMethodGlyphClass()` and `getPlatformGlyphClass()` helpers.
  - Replaced generic/emoji photo and device icons in:
    - Auto Play Step 1 photo hero
    - Photo bottom sheet
    - Manual Step 1 category cards
    - Manual Step 2 device picker cards
  - Added a visible Pro pricing section under the Watch Tracker / Pro preview area using the project-approved pricing:
    - Monthly: `$4.99`
    - Yearly: `$29.99`
    - Free: 5 sessions
    - Pro: unlimited sessions + tracker/history unlocks
- `src/App.css`
  - Added CSS-drawn line icons under `/* Non-emoji line icons for 321 Play device/photo UI. */`.
  - Added pricing/paywall section styling under `/* Pricing/paywall section added to broaden 321 Play proof coverage. */`.
- `scripts/capture-kramer-photo-id-expanded-20260509.mjs`
  - New broad capture script for landing, photo ID, bottom sheet, manual/device setup, countdown, watch tracker, pricing, tonight list, and browse-service sections.
- `screenshots/kramer-photo-id-expanded-20260509/`
  - Fresh expanded screenshot proof.

## Verification commands
Run from `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`:

```bash
npm run typecheck
# exit 0

npm run lint -- --quiet
# exit 0

npm run build
# exit 0
# dist/index.html 1.04 kB
# dist/assets/index-eyhByVqZ.css 44.96 kB
# dist/assets/index-mCahlAzA.js 285.10 kB

curl -I --max-time 3 http://127.0.0.1:5173/
# HTTP/1.1 200 OK

node scripts/capture-kramer-photo-id-expanded-20260509.mjs
# captured 11 mobile screenshots at 390x844 CSS px, deviceScaleFactor 2
```

## Expanded visual proof
Directory:
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-photo-id-expanded-20260509/`

| Artifact | Dimensions | SHA256 |
|---|---:|---|
| `01-landing-create-room.png` | 780x1688 | `88dc0c0c0dbdd79e1ec1c7307d8ebb6671204ae489f26581e173f5be427db493` |
| `02-auto-play-step1-photo-id.png` | 780x1688 | `432821b8589861f26e20b83ba45f26ce20bcdda7b6078eab4e3f45233c251c93` |
| `03-photo-bottom-sheet.png` | 780x1688 | `ecbf5eaca0b3a9bdb07b58912bde638cb560c73115baaf8981fb0744e655006b` |
| `04-manual-step1-category.png` | 780x1688 | `6092d1c21ad5b29c71c16c17ed429bfc92da26b24fd15128e4449ce1a6b2a85c` |
| `05-manual-step2-device-picker.png` | 780x1688 | `20d938a60312c2f66ee95f06b1f5be7e47ea8c7d1bee1222773b5894f77e71a6` |
| `06-manual-step3-roku-setup.png` | 780x1688 | `a44aecd7d447579abd9c0119e51671fc0cf9b2c734e516854021c3af8b82c753` |
| `07-countdown-ready-section.png` | 780x1688 | `a7e51c79831ed33f4868b14866b8c023b4aa518b567df412f6fbd4cadd430282` |
| `08-watch-tracker-section.png` | 780x1688 | `6a547300caa709790260687c053ae8a048dadf8a20e2cb0cc1a16562a995bcee` |
| `09-pricing-section.png` | 780x1688 | `5a62fff1f95e8ac21adf70c2de97bdb7a296d90c1dfa64b87cc476b0d0d967af` |
| `10-tonights-list-section.png` | 780x1688 | `6d010ad836de2482b500349c6c42771ff1bc5f0797da24f1e6d3b043eef1394c` |
| `11-browse-service-section.png` | 780x1688 | `ca9f008d4948436596a85b9dddb7e9ae544b70432bad66aec65e2ba0dbdb15e3` |
| `contact-sheet.png` | 2428x7054 | `1eb1ecb7959468612a4d2df1d08697d5194f9b60fe37861b8835990fb5d6de0c` |
| `metrics.json` | n/a | `5b4fe88ddeee57bfb5d9f96237ccae0acba480c2b36ada881d6fdb86ea9d02fa` |

## Visual QA notes
- Step 1 no longer uses emoji/generic icon text. Vision check confirmed: custom line icons are visible for camera, TV, streaming device, and console/other.
- Expanded proof now includes pricing/paywall and broader sections, addressing the missing-section complaint.
- Pricing section is currently an in-app visual section under Watch Tracker / Pro preview; this is still visual-only and not wired to Stripe/backend purchase behavior.
- No photo storage/backend/API behavior was added.

## Caveats
- The target app still uses the existing Watch Sync room shell, so top room/status chrome remains visible; reference exports are standalone framed screens.
- Pricing is now visually present, but true session-6 gate behavior and payment wiring remain out of scope and unimplemented.
- Existing unrelated dirty/untracked repo files predated this pass and were left untouched.
