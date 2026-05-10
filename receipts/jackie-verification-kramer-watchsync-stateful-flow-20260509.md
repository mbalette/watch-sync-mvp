# Jackie verification — Kramer Watch Sync / 321 Play stateful flow

**Date:** 2026-05-09  
**Target repo:** `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`  
**Kramer goal packet:** `receipts/kramer-watchsync-stateful-flow-fix-goal-20260509.md`  
**Kramer receipt:** `receipts/kramer-watchsync-stateful-flow-20260509.md`

## Verdict

**Pass, with implementation-risk caveat.** Kramer converted the default app route from the prior long-scroll/stacked dashboard into a screen-by-screen React state machine. Independent verification confirms the actual local app can be click-walked through discrete screens via `data-flow-screen`, with Step 1, photo sheet, category picker, device picker, Roku setup, result states, countdown, post-title prompt, tracker, paywall, browse, Tonight's list, and Apple/manual steer appearing as separate states rather than one continuous page.

Caveat: Kramer made a large replacement: `src/App.tsx` is now a 14-line router and the previous monolithic long-scroll `RoomApp` body is removed from that entrypoint. This satisfies Matt's “not one long scroll” demand, but it is a major visual/app-flow rewrite and should be reviewed before any commit/deploy.

## Evidence checked

- Read Kramer receipt: `receipts/kramer-watchsync-stateful-flow-20260509.md`
- Read new router: `src/App.tsx`
- Read new flow source start: `src/AppFlow.tsx`
- Read state proof: `screenshots/kramer-watchsync-stateful-flow-20260509/_state-progression.txt`
- Re-ran local proof capture against `http://127.0.0.1:5173/` using:
  - `npx tsx scripts/capture-stateful-flow.ts`
  - `npx tsx scripts/build-contact-sheet.ts`
- Independently inspected screenshots:
  - `02-step1-photo.png` shows Step 1 only, no countdown/tracker/pricing/browse stacked below.
  - `13-tracker-titled.png` shows a focused Watch Tracker screen with its own back chrome, not a setup subsection.

## Verification commands rerun by Jackie

From `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`:

```text
npm run typecheck
# exit 0

npm run lint -- --quiet
# initially failed on scripts/capture-stateful-flow.ts unused interface Step
# Jackie removed that unused interface
# rerun exit 0

npm run build
# exit 0
# dist/index.html                   1.04 kB │ gzip:  0.49 kB
# dist/assets/index-MkfJkx-x.css   73.59 kB │ gzip: 13.18 kB
# dist/assets/index-Bw-Gu6fn.js   242.94 kB │ gzip: 68.59 kB
# ✓ built in 85ms

npx tsx scripts/capture-stateful-flow.ts
# exit 0 — saved 20 screen PNGs, state proof

npx tsx scripts/build-contact-sheet.ts
# exit 0 — saved _contact-sheet.png
```

## Current screenshot proof after Jackie recapture

Folder: `screenshots/kramer-watchsync-stateful-flow-20260509/`

| File | Screen | Dimensions | Bytes | SHA-256 |
|---|---|---:|---:|---|
| `01-landing-initial.png` | landing | 780x1688 | 80917 | `037dcfbd934a308c25af33f6307ecdeff7d4bc7c9c6c491bccbf03d9e0cdb3d7` |
| `02-step1-photo.png` | step1-photo | 780x1688 | 144509 | `6dc68bfe4de930ee71ca8a15b0da1cc10bbe56514abef2196824746fe9e9dde2` |
| `03-photo-bottom-sheet.png` | photo-sheet | 780x1688 | 209165 | `8b2416a7a526a315e11c654fb5d2126bf37e03dec8ec2c70767b3088893bd586` |
| `04-step1-category-empty.png` | step1-category | 780x1688 | 88036 | `b4600170fec1da5b83effcfcbeb744114dc8781794aa08f103d806cda2824b71` |
| `05-step1-category-selected.png` | step1-category | 780x1688 | 88614 | `614079877060236c54b9b2fa7594fe4c215d67b5cd4c24ec47cb93a3455da87c` |
| `06-step2-device-picker.png` | step2-device | 780x1688 | 102601 | `cfd6a07363d0dff2793a14ebc91b1a7284dc8dfe5dd611d6d6205e3bc631c119` |
| `07-step2-device-selected-lg.png` | step2-device | 780x1688 | 102718 | `9da015caedfd890bea6c8ab9c55b915081e16ac64adf9598e959e3be9fd88aa8` |
| `08-step2-roku-reselected.png` | step2-device | 780x1688 | 102912 | `43ac4432e031d5b4148b442be6b1a1c2d373f3113c655b10c5422c8da28ff2a2` |
| `09-step3-roku-setup.png` | step3-roku | 780x1688 | 102753 | `2450443453bff1e6b0a2266f8b51377c30573442ffb279c149ff58ecd913e8ca` |
| `10-result-success.png` | result-success | 780x1688 | 69525 | `e25dd74c46c65eb6da17fb4fc97a3ca11e6fa29e498e9c16f02f0d5ee6c38d96` |
| `11-countdown-auto.png` | countdown-auto | 780x1688 | 44566 | `cbcd1993da45d87137ea6608755e62e82428556d2c28322762d0a3fc91a069b4` |
| `12-post-title-prompt.png` | post-title | 780x1688 | 70818 | `2d6ac83716b00109c55bbeccfe972debd41dbd356d3759d5a6772deb0f2b9e2c` |
| `13-tracker-titled.png` | tracker | 780x2056 | 180997 | `a7de56b04be9804ef4937f3838ec8b64dc5aa8795db175a30c84ba299afc9c1a` |
| `14-paywall.png` | paywall | 780x1688 | 111777 | `b2c33dd7fdaa1206306cae70d96cac60dc2e8d0df6b6243c2cea0136c44f8dd3` |
| `15-browse-find-watch.png` | browse | 780x1688 | 98906 | `d92088312d8abb7212c4d8fd6259c0eb183d68d06827c8d9bc64f23f5abf783c` |
| `16-browse-two-added.png` | browse | 780x1688 | 100713 | `b4995a73a2edeca91a115e97de1166c045bfe821b97b935eab9bb0a0c06647ee` |
| `17-tonights-list.png` | tonights | 780x1688 | 62111 | `f6cc2b23f5fd6cd90b849c7df0270c0e545ad21a09acb6de39bd4a9b705dc7e0` |
| `18-result-failed.png` | result-fail | 780x1688 | 80549 | `702b0f517fd052312457d9c4cc2357ab6d3cbba5abdbc8c38e81bb5d350e01c7` |
| `19-countdown-manual.png` | countdown-manual | 780x1688 | 52678 | `a88b61b4e66ce967fa17cd4fc0291a205969a53c1e2408d9ea010719d90cdcae` |
| `20-apple-tv-steer.png` | apple-steer | 780x1688 | 70567 | `2f61f5743ab93d528b2b426873f02cf735a099fa28f24b20f7947d514e5a29a0` |
| `_contact-sheet.png` | all screens | 1600x2949 | 524402 | `40a8f63f2b84bfc85b877c24d773f3bb5a32ea82d9ac96e92afd7b245ff6fd1e` |

## Facts verified

- `src/App.tsx` now routes `?demo=<id>` to reference screens and otherwise renders `<AppFlow />`.
- `src/AppFlow.tsx` defines explicit states including `landing`, `step1-photo`, `photo-sheet`, `step1-category`, `step2-device`, `step3-roku`, `result-success`, `result-fail`, `apple-steer`, `countdown-auto`, `countdown-manual`, `post-title`, `tracker`, `paywall`, `browse`, and `tonights`.
- `scripts/capture-stateful-flow.ts` walks the live app by clicks and records the visible `data-flow-screen` after each step.
- `grep` over new stateful-flow files found no `fetch`, `XMLHttpRequest`, Stripe, Anthropic, vision API, localStorage, or payment wiring beyond a comment containing the word `payment`.
- No deploy or commit was run by Jackie.

## Caveats / risks

1. The rewrite is large and removes the prior monolithic default UI from `src/App.tsx`; review before committing or deploying.
2. The flow is intentionally visual/local only: no realtime partner sync, no actual TV helper call, no photo storage, no TMDB, no payments.
3. Some stats/catalog/list behavior is mock/in-memory.
4. Kramer receipt hash table is stale after Jackie recaptured screenshots; use this verification receipt for the latest screenshot hashes.
5. Repo was already dirty before this task; do not treat the full working tree as solely this stateful-flow pass.
