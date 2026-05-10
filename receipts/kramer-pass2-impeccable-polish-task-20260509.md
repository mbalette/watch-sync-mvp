# /goal — Kramer 321 Play Pass 2 Verification + Impeccable Polish

You are Kramer. This is a follow-up to Jackie/Matt's pass 1 work on the Watch Sync / 321 Play target repo.

## Objective
Run a second independent visual pass, then Impeccable-polish each individual screen/state in the current 321 Play mobile flow.

This is NOT a backend task. This is product UI mode, visual QA/polish only.

## Target repo
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`

## Reference package / source of truth
`/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports`

Read first:
- `/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/README.md`
- `/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/REFERENCE.md`
- `/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/321Play-All-Screens-Contact-Sheet.png`
- source files under `/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/source/`

Primary reference screens:
- `dark/02-auto-play-step1-photo-id.png`
- `dark/03-photo-bottom-sheet.png`
- `dark/04-manual-step1-category.png`
- `dark/05-manual-step2-device-picker.png`
- plus the all-screens contact sheet for broader sections/pricing/tracker/countdown.

## Current Jackie pass 1 artifacts to verify
- Receipt: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/kramer-photo-id-expanded-20260509.md`
- Expanded contact sheet: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-photo-id-expanded-20260509/contact-sheet.png`
- Capture script: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/scripts/capture-kramer-photo-id-expanded-20260509.mjs`

Matt's explicit feedback after pass 1:
1. He disliked generic icons.
2. He asked where pricing and the other sections were.
3. Jackie replaced emoji/generic icons with CSS line icons and added pricing/proof, but this is still only pass 1. You must verify and then polish.

## Required sequence

### Step A — reachability check
Before doing work, confirm you can read:
- target repo path
- reference package path
- pass 1 receipt/contact sheet
If you cannot read any path from your runtime, report BLOCKED with exact missing path and stop.

### Step B — verify pass 1, adversarially
Compare the current running app/screenshots/source against the reference package.
Reject anything that still looks like:
- generic emoji/text icons (`📷`, `🖼️`, `TV`, `?`, `▭`) in visible device UI
- dense settings panels instead of consumer mobile screens
- competing controls on Step 1
- missing pricing/paywall/tracker/countdown/browse sections in proof
- extra helper copy/CTAs that are not in the reference
- clipped text, awkward spacing, low contrast, dead controls, or mobile overflow

### Step C — Impeccable product UI polish, each individual screen
Use Impeccable 3 iterative design mode.
Product UI mode, not marketing page mode.
Do not redesign from scratch; polish the current implementation toward the reference export.

Run the loop manually or with slash commands if available:
1. `/critique` the current all-screens/contact-sheet proof.
2. `/polish` the highest-impact screen issues.
3. `/critique` again after changes.
4. `/polish` again until each screen is at least visually acceptable.

Polish each screen/state in the expanded proof set:
- Landing / create room
- Auto Play Step 1 photo ID
- Photo bottom sheet
- Manual Step 1 category
- Manual Step 2 device picker
- Roku/device setup
- Countdown ready section
- Watch Tracker section
- Pricing/paywall section
- Tonight's list
- Browse streaming service section

For each screen, check:
- reference hierarchy and copy intent
- non-generic icons/assets
- spacing/radius/type/color consistency with tokens
- no clipped text
- no over-dense settings look
- no irrelevant CTA clutter
- mobile first viewport owns the task
- pricing/paywall is present in proof and visually coherent

## Hard constraints
- No deploy.
- No commit.
- No backend/API/Anthropic/vision/photo storage wiring.
- Do not add Stripe/payment behavior; visual pricing/paywall only unless explicitly asked later.
- Do not destroy/reset unrelated dirty files.
- Do not invent claims, platforms, hardware validation, pricing, or capabilities.
- Keep Watch Sync truth: Auto Play is local/generic remote control only; manual fallback remains true.

## Verification commands
From target repo:
```bash
npm run typecheck
npm run lint -- --quiet
npm run build
```
Also run local app and capture fresh mobile screenshots/contact sheet at ~390x844.

## Required fresh artifacts
Use a new folder:
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-pass2-impeccable-polish-20260509/`

Write final receipt:
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/kramer-pass2-impeccable-polish-20260509.md`

Receipt must include:
- verdict
- reachability check result
- changed files or `no files changed`
- commands/results
- screenshot/contact sheet paths + dimensions + SHA256
- critique pass 1 summary
- polish pass 1 summary
- critique pass 2 summary
- polish pass 2 summary
- per-screen status table for all screens listed above
- remaining mismatches/caveats
- explicit confirmation: no deploy, no commit, no backend/API/photo storage/payment wiring

## Done criteria
Do not call done unless fresh screenshots prove every listed section exists and has been individually checked/polished. If blocked by runtime path access, report BLOCKED clearly instead of pretending.
