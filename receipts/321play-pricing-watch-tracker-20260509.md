# 321 Play pricing + watch tracker pass — 2026-05-09

## Verdict
Implemented local-source UI for Free/Pro pricing and a first-pass Watch tracker / history / Year in Sync retention loop. No deploy and no commit.

## Scope
Repo: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`

Touched paths:
- `src/App.tsx`
- `src/App.css`
- `scripts/capture-copy-qa-contact-sheet-20260509.mjs`
- existing tests affected by prior copy edits still verified: `src/tv-remote-device.test.ts`

## Implemented UI
Landing:
- Added product framing: `Watch together in sync. Open what you want to watch. We’ll keep everyone in sync.`
- Added pricing cards:
  - `Free` / `$0` / `5 free sessions to try movie night together.`
  - `Pro` / `$4.99/mo` / `Unlimited watches, shared history, and Year in Sync recaps.`

Room:
- Added `Watch tracker` section with:
  - `Track your time together`
  - `Year in Sync` badge
  - title logging prompt: `Save this watch night to your history and stats.`
  - input label: `What are you watching?`
  - actions: `Add title to history`, `Skip for now`
  - current-room stats: sessions, starts synced, ready now, start mode
  - history preview rows: `This week`, `Watching with`, `Recent watch night`

## Verification
Commands run in repo:
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
- build: pass, output JS `dist/assets/index-BOYg0X1P.js`
- diff whitespace check: pass

Captured screenshot proof:
- Contact sheet: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/copy-qa-20260509-latest/321play-pricing-tracker-contact-sheet-20260509.png`
- Panels: 12
- Dimensions: `1242 x 3674`
- Size: `1,216,314` bytes
- SHA256: `cfc9858262b3bdc02797cdeabc34c939c2a42f82bee32431eb146fcc9df3d431`

Captured-text grep from `capture-metrics.json`:
- `5 free sessions`: 2
- `$4.99/mo`: 2
- `Unlimited watches`: 2
- `Track your time together`: 10
- `Year in Sync`: 12
- `Save this watch night`: 10
- `Add title to history`: 10
- stale `Connection is limited`: 0
- stale `A tiny backchannel`: 0
- stale `Auto Play (beta) for supported Sony TVs`: 0
- stale `Manual countdown remains available`: 0

Vision QA:
- Contact sheet is readable, includes pricing cards and Watch Tracker / Year in Sync stats/history screen, and has no blank panels.

## Caveats
- This is UI/local source only.
- The watch tracker uses current-room derived stats plus preview/history copy; no production persistence, billing, Stripe, or account gating was added.
- No deploy and no commit.
