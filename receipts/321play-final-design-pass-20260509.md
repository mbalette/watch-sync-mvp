# 321 Play final design pass — 2026-05-09

## Verdict
Implemented the supplied `321Play-Design-Changes-Final.md` layout/spacing/hierarchy pass in local source. No deploy and no commit.

## Source input
- User document: `/Users/home/.hermes/profiles/auditor/cache/documents/doc_eca0355b3ad0_321Play-Design-Changes-Final.md`
- Repo: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`

## Changed
- `src/App.tsx`
  - Clean landing remains pricing-free.
  - Shared-room reconnect toast can render as bare/plain text instead of a pill/card.
  - Auto Play full setup hides when a device/platform has been chosen; post-setup summary renders as `AUTO PLAY / <device> · Connected ✓ / Change`.
  - During active countdown with no Auto Play, a subtle `Auto Play not set up` banner appears instead of a full setup CTA.
  - Shortened Auto Play drawer paragraph to `One-time setup. After this, we press Play for you every movie night.`
  - Watch Tracker stat labels changed: `starts synced` -> `countdowns`, `start mode` -> `play mode`.
  - `See what's in Pro` is now an explicit visible text-link CTA.
- `src/App.css`
  - Pulled landing stack upward.
  - Added final-pass plain reconnect text styling.
  - Thinned container/card borders and kept selected device cards at `1.5px solid #7B5CDB`.
  - Added Auto Play summary and manual countdown notice styles.
  - Increased quick-action gap to 12px.
  - Made Auto Play shortcut primary and its secondary text link-like.
  - Changed Watch Tracker stats to 2x2 grid with larger values.
  - Added visual separation before Pro / Year in Sync preview.
- `scripts/capture-copy-qa-contact-sheet-20260509.mjs`
  - Reused to regenerate proof for the 12 representative mobile states.

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
- remote-start beta tests: pass, 23 tests
- lint quiet: pass
- build: pass
  - CSS: `dist/assets/index-DEldCusR.css`
  - JS: `dist/assets/index-C5EKECYQ.js`
- diff whitespace check: pass

## Runtime/dev-server note
A prior Vite watch-pattern alert caught a transient `Transform failed` during an intermediate save. Current verification shows it is not active:
- `curl -I http://127.0.0.1:5174/` returned `HTTP/1.1 200 OK`.
- Fetching `/src/App.tsx` returned transformed Vite module content.
- Fresh `npm run typecheck` and `npm run build` passed after the alert.

## Captured text proof
From regenerated `capture-metrics.json`:
- `One-time setup. After this, we press Play for you every movie night.`: 9
- `Auto Play is a one-time setup`: 0
- `starts synced`: 0
- `start mode`: 0
- `countdowns`: 10
- `play mode`: 20
- `See what's in Pro`: 10
- `Your time together, remembered automatically.`: 10
- `Auto Play not set up.`: 1
- `You’ll press Play manually tonight.`: 1

## Screenshot proof
- Contact sheet: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/copy-qa-20260509-latest/321play-final-design-pass-contact-sheet-20260509.png`
- Panels: 12
- Dimensions: `1242 x 3674`
- Size: `1,144,854` bytes
- SHA256: `02f228a96b8f5894b08a4e85cb8cc7f45ef31fdc95d498046962f54d539e7c77`

Vision QA confirmed:
- No blank panels.
- Landing has no pricing cards.
- Watch Tracker stats appear 2x2 and include `countdowns` / `play mode`.
- Setup paragraph is short.
- Countdown has subtle `Auto Play not set up` banner.
- Minor artifact note: contact sheet labels duplicate `04`; UI itself is fine.

## Caveats
- Local source/UI only.
- No deploy and no commit.
- Auto Play connected summary is based on local selected platform state; real backend/native persistence is not implemented here.
