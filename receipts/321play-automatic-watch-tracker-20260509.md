# 321 Play automatic Watch Tracker UX pass — 2026-05-09

## Verdict
Implemented the user-approved north star: `Your time together, remembered automatically.` Landing is clean again with no pricing cards. Watch Tracker now treats title logging as optional enrichment, not the primary flow.

## Source inputs
- User-supplied doc: `/Users/home/.hermes/profiles/auditor/cache/documents/doc_1fb73c3bbda0_321Play-Pricing-Session-UX-Flow.md`
- Repo: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`

## Changed
- `src/App.tsx`
  - Removed Free/Pro pricing cards from landing.
  - Removed extra landing subtitle so landing matches clean create/join flow.
  - Watch Tracker headline changed to `Your time together, remembered automatically.`
  - Watch Tracker copy now says the app auto-saves night/time/partner/device/start mode.
  - Title prompt is now optional: `Add title anytime`, `Titles are optional`, `Save to history`, `Not now`.
  - Added blurred/frosted Pro preview card for full history / Year in Sync.
- `src/App.css`
  - Added styling for the premium preview / blurred recap / quieter optional title card.
- `scripts/capture-copy-qa-contact-sheet-20260509.mjs`
  - Updated screenshot capture anchor to the new Watch Tracker headline.

## Verification commands
```bash
npm run typecheck
npm run test:remote-start-beta
npm run lint -- --quiet
npm run build
git diff --check
```

Results:
- typecheck: pass
- `src/tv-remote-device.test.ts`: pass, 23 tests
- lint quiet: pass
- build: pass
  - CSS: `dist/assets/index-ChYB-iFz.css`
  - JS: `dist/assets/index-0bj-Dr8_.js`
- diff whitespace check: pass

## Text proof from captured page body
- `Your time together, remembered automatically.`: 10
- `We save the night, time, partner, device`: 10
- `Add the title later`: 10
- `Titles are optional`: 10
- `See what's in Pro`: 10
- `$4.99/mo`: 0
- `5 free sessions`: 0
- `Pricing plans`: 0

## Screenshot proof
- Contact sheet: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/copy-qa-20260509-latest/321play-automatic-time-tracker-contact-sheet-20260509.png`
- Panels: 12
- Dimensions: `1242 x 3674`
- Size: `1,174,925` bytes
- SHA256: `23cb780f11431d9ab1d5ed721cdc92002c1a6830e0fd2d41d3f2ad7924828232`

Vision QA confirmed:
- Landing no longer shows pricing cards.
- Watch Tracker headline is visible as `Your time together, remembered automatically.`
- No blank panels.

## Caveats
- Local source/UI only.
- No deploy and no commit.
- This does not yet implement real backend persistence, account auth, App Store subscription, or DeviceCheck enforcement.
