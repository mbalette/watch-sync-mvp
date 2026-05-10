# /goal — Kramer Host CLI: Watch Sync / 321 Play Pass 2 Verification + Impeccable Screen Polish

You are Kramer in a HOST CLI session. Jackie is orchestrating/supervising this pass for Matt.

## Mission
Make Watch Sync / 321 Play visually match the 321 Play reference docs/screens as closely as practical, then run Impeccable polish on **each individual screen/state**.

This is pass 2. Treat prior work as pass 1 only; do not assume it is accepted.

## Read this reference doc first
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/kramer-watchsync-pass2-reference-doc-20260509.md`

That doc is the detailed operating spec for this pass. Follow it.

## Target repo
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`

## Reference package / source of truth
`/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports`

Read the README, REFERENCE.md, contact sheet, dark PNGs, and source files in that package before editing.

## What Matt specifically wants
1. Do another pass to verify Watch Sync looks exactly like the reference docs/screens as close to 1:1 as practical.
2. That previous work was only pass 1.
3. After verification, Impeccable-polish **every individual screen**, not just Step 1.
4. Produce proof and a receipt that Jackie can independently audit.

## Required workflow
1. Reachability check for target repo + reference package + pass 1 artifacts.
2. Baseline `git status`, `npm run typecheck`, `npm run lint -- --quiet`, `npm run build`.
3. Build 1:1 reference comparison matrix before editing.
4. Critique pass 1.
5. Polish pass 1.
6. Fresh running-app mobile screenshots/contact sheet.
7. Critique pass 2.
8. Polish pass 2.
9. Final typecheck/lint/build.
10. Final running-app mobile screenshots/contact sheet.
11. Final receipt.

## Required final artifacts
Screenshot folder:
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-watchsync-pass2-impeccable-20260509/`

Receipt:
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/kramer-watchsync-pass2-impeccable-20260509.md`

## Must cover at minimum
- Landing / create room
- Auto Play Step 1 photo/device ID
- Photo bottom sheet
- Manual Step 1 category picker
- Manual Step 2 device picker
- Manual Step 3 Roku/device setup
- Success / failure / manual fallback closest states
- Apple TV steer/manual-only if represented
- Countdown Auto Play ready
- Countdown no Auto Play/manual mode
- Watch Tracker free/basic
- Watch Tracker Pro/unlocked
- Paywall/session-6 pricing
- Post-session title prompt
- Browse/find-watch / streaming service section if present
- Tonight’s list / queue section if present

## Hard constraints
- Watch Sync / 321 Play only. Do not touch BRB.
- No deploy.
- No commit/push.
- No backend/API/Anthropic/vision/photo-storage wiring.
- No Stripe/payment/IAP wiring.
- Do not reset/clean unrelated dirty files.
- Do not invent hardware validation/native streaming-app control.
- No generic emoji/text device/photo icons.

## Required receipt contents
- verdict
- reachability evidence
- baseline/final command results
- git status before/after summary
- changed files
- screenshot/contact sheet paths
- dimensions and SHA256 for proof files
- 1:1 comparison matrix summary
- critique pass 1 summary
- polish pass 1 summary
- critique pass 2 summary
- polish pass 2 summary
- per-screen final status table
- remaining mismatches/caveats
- explicit no deploy/no commit/no backend/no photo storage/no payment wiring confirmation

If blocked, write a blocker receipt at the final receipt path with exact missing path/command/error and stop.
