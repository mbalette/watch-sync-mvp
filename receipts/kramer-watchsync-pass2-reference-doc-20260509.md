# Kramer Watch Sync / 321 Play Pass 2 Reference Doc

## Purpose
This document is the operating reference for Kramer’s **second pass** on Watch Sync / 321 Play.

Pass 1 produced local visual work and proof, but it is not accepted as final. Kramer must now:
1. verify the current Watch Sync implementation against the 321 Play reference package as close to 1:1 as practical;
2. identify every mismatch screen-by-screen;
3. run an Impeccable product-UI polish pass on each individual screen;
4. regenerate proof from the running local app;
5. write a final receipt that Jackie can audit independently.

This is for **Watch Sync / 321 Play only**. Do not touch BRB or any other app.

---

## Roles

### Matt
Founder/reviewer. Wants direct visual match and no fake completion.

### Kramer
CLI design/build specialist. Must run in a host CLI session with access to local paths. Kramer owns the design polish pass.

### Jackie
Auditor/orchestrator. Jackie will monitor Kramer’s receipt/proof, verify artifacts, reject weak claims, and report only evidence-backed status to Matt.

---

## Target implementation repo

```text
/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp
```

This is the only implementation repo in scope.

---

## Reference package — source of truth

```text
/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports
```

Kramer must read and use:

```text
/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/README.md
/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/REFERENCE.md
/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/321Play-All-Screens-Contact-Sheet.png
/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/source/tokens.css
/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/source/components.jsx
/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/source/screens.jsx
/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/source/frame.jsx
/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/dark/*.png
```

Primary reference screens for this pass:

```text
dark/01-landing-create-room.png
dark/02-auto-play-step1-photo-id.png
dark/03-photo-bottom-sheet.png
dark/04-manual-step1-category.png
dark/05-manual-step2-device-picker.png
dark/06-manual-step3-roku-setup.png
dark/07-result-roku-success.png
dark/08-result-connection-failed.png
dark/09-result-apple-tv-steer.png
dark/10-countdown-auto-play-ready.png
dark/11-countdown-no-auto-play.png
dark/12-watch-tracker-free.png
dark/13-watch-tracker-pro.png
dark/14-paywall-session-6.png
dark/15-post-session-title-prompt.png
```

---

## Existing pass 1 artifacts to inspect, not trust blindly

```text
/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/kramer-photo-id-visual-20260509.md
/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/kramer-photo-id-expanded-20260509.md
/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-photo-id-expanded-20260509/contact-sheet.png
```

Pass 1 known issues / Matt feedback:
- proof was initially too narrow;
- icons looked generic/emoji/text-like;
- pricing and other sections were missing from first proof;
- Step 1 must look like a consumer app screen, not a dense settings panel.

Kramer must treat pass 1 as **input evidence**, not final acceptance.

---

## Product truth / constraints

- Product: Watch Sync / 321 Play.
- Auto Play = local/generic remote command only where supported.
- Manual fallback remains true.
- Do not claim native streaming-app content/timestamp control.
- Do not invent hardware validation.
- Photo/device ID is visual-only for this pass.
- No photo storage.
- No Anthropic/vision/API wiring.
- No backend wiring.
- No Stripe/payment/IAP wiring.
- No deploy.
- No commit.
- No push.
- Do not clean/reset unrelated dirty files.

Pricing truth:
- Free = 5 completed 3-2-1-PLAY sessions.
- Pro = `$4.99/mo` or `$29.99/yr`.
- Session 6 gates creation only.
- Pricing/paywall should match reference intent and must not appear on landing unless explicitly represented by the reference.

Visual direction:
- Use the export tokens: dark charcoal/black surfaces, purple accent, iOS-like product clarity.
- No orange/brown-heavy UI.
- No generic AI SaaS polish.
- No glassy decorative filler unless reference requires it.
- No generic emoji icons unless the reference itself uses emoji.

---

## Required pass structure

### Pass 2A — Reachability and baseline
Kramer must prove host CLI can read the local paths:

```bash
pwd
ls -la /Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp
ls -la /Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports
ls -la /Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/dark
```

Then in the target repo:

```bash
git status --short --branch
npm run typecheck
npm run lint -- --quiet
npm run build
```

Record results. If baseline fails, record exact failure and whether it is pre-existing or caused by this pass.

---

### Pass 2B — 1:1 reference verification matrix
Before editing, Kramer must build a screen-by-screen matrix:

| Reference screen | Reference PNG | Current app state/proof | Match score 1–5 | Mismatches | Fix in scope? |
|---|---|---|---:|---|---|

Use all 15 reference screens plus any current Watch Sync sections that exist but are not in the reference package, such as browse/find-watch or tonight’s list.

The matrix must explicitly call out:
- missing states;
- generic icons;
- wrong hierarchy;
- dense settings look;
- missing pricing/tracker/countdown/title sections;
- clipped/low-contrast text;
- extra CTAs/helper copy not in reference;
- first viewport competition from surrounding Watch Sync room chrome.

---

### Pass 2C — Impeccable critique pass 1
Run an Impeccable-style critique in **product UI mode**.

Check every screen for:
- task clarity;
- hierarchy;
- spacing/rhythm;
- typography;
- color/token match;
- cards/radii/borders/shadows;
- icon quality;
- copy fidelity;
- density;
- mobile clipping/overflow;
- accessibility basics;
- proof coverage.

Do not redesign from scratch. This is iterative visual matching and polish.

---

### Pass 2D — Polish pass 1
Make scoped source edits for the highest-impact mismatches.

Prioritize:
1. Step 1 photo/device ID reference match.
2. Photo bottom sheet reference match.
3. Manual category and device picker reference rhythm.
4. Countdown ready/manual states.
5. Watch Tracker free/pro states.
6. Paywall/session-6 pricing state.
7. Post-session title prompt state.
8. Browse/find-watch and Tonight’s list states if present in current app.
9. Non-generic line/SVG icons throughout visible device/photo UI.
10. Removal of visual clutter and dense settings look.

---

### Pass 2E — Fresh proof capture
Run the local app and capture fresh mobile proof from the running implementation.

Output folder:

```text
/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-watchsync-pass2-impeccable-20260509/
```

Required:
- individual PNG per screen/state;
- combined contact sheet;
- capture metadata/text/viewport metrics if possible;
- dimensions + SHA256 for every proof file.

Target capture size:
- ~390x844 CSS px;
- deviceScaleFactor 2.

---

### Pass 2F — Impeccable critique pass 2
Critique the fresh proof.

For every screen, answer:
- Is it close to the reference hierarchy?
- Is first viewport focused?
- Are icons non-generic?
- Is text unclipped/readable?
- Does it avoid dense settings look?
- Are pricing/tracker/countdown/title states present where expected?
- What still mismatches?

---

### Pass 2G — Polish pass 2
Fix the critique pass 2 issues.

Then rerun:

```bash
npm run typecheck
npm run lint -- --quiet
npm run build
```

Regenerate final proof after final changes.

---

## Screen/state coverage required in final proof

At minimum:

1. Landing / create room
2. Auto Play Step 1 photo/device ID
3. Photo bottom sheet
4. Manual Step 1 category picker
5. Manual Step 2 device picker
6. Manual Step 3 Roku/device setup
7. Setup success / closest current success state
8. Connection failed / closest current failure/manual state
9. Apple TV steer/manual-only state if represented
10. Countdown Auto Play ready
11. Countdown no Auto Play/manual mode
12. Watch Tracker free/basic
13. Watch Tracker Pro/unlocked
14. Paywall/session-6 pricing
15. Post-session title prompt
16. Browse/find-watch / streaming service section, if present
17. Tonight’s list / queue section, if present

If any reference screen cannot be represented without backend wiring, Kramer must state that explicitly in the receipt and provide the closest visual-only state.

---

## Required final receipt

```text
/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/kramer-watchsync-pass2-impeccable-20260509.md
```

Receipt must include:
- verdict: done / partial / blocked;
- reachability check results;
- baseline command results;
- changed files;
- no-deploy/no-commit confirmation;
- screenshot/contact sheet paths;
- SHA256 + dimensions for proof files;
- 1:1 reference verification matrix summary;
- critique pass 1 summary;
- polish pass 1 summary;
- critique pass 2 summary;
- polish pass 2 summary;
- per-screen final status table;
- remaining mismatches/caveats;
- explicit confirmation no backend/API/photo storage/payment wiring was added.

---

## Jackie verification after Kramer

Jackie must independently verify before reporting done to Matt:

```bash
test -f /Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/kramer-watchsync-pass2-impeccable-20260509.md
ls -la /Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-watchsync-pass2-impeccable-20260509/
sha256sum /Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/kramer-watchsync-pass2-impeccable-20260509.md
```

Then Jackie should spot-check:
- at least Step 1 screenshot;
- bottom sheet screenshot;
- pricing/paywall screenshot;
- final contact sheet;
- `npm run typecheck`, `npm run lint -- --quiet`, `npm run build` results in receipt;
- changed files are plausible and scoped to Watch Sync.

Reject if:
- receipt missing;
- screenshots stale/missing;
- only a narrow subset of screens captured;
- generic icons remain;
- pricing/paywall omitted;
- claims of deploy/commit/backend wiring appear;
- no command evidence.

---

## Acceptance bar
Kramer is not done until:
- all listed screens/states have fresh running-app proof or documented closest visual-only representation;
- proof is generated from Watch Sync / 321 Play local app;
- visual hierarchy is close to reference package;
- each screen received explicit critique and polish attention;
- pricing/tracker/countdown/title/browse/list sections are included where applicable;
- no generic emoji/text device/photo icons remain;
- command verification is recorded;
- final receipt exists at the required path.
