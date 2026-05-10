# TASK_PACKET: Jose — 321 Play camera/photo device identification, section-by-section

## Recipient
Jose

## Goal
Implement the Camera Device Identification onboarding feature for 321 Play **section by section**, with Jackie as verification gate after each section. Do not move to the next section until Jackie verifies your visual QA or sends corrections.

## Context
Matt approved the idea: users can take a picture OR choose from camera roll/upload a photo of their TV, remote, or streaming device. The app identifies the device and routes to the right Auto Play setup wizard after user confirmation. Manual pick remains available. This is a UX/wow feature for Auto Play onboarding, not a replacement for manual setup.

Target repo:
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`

Source spec copied into repo:
`docs/product/321Play-Camera-Device-ID-Spec.md`

Recent local design state to preserve:
- Landing has no pricing cards.
- Watch Tracker north star: `Your time together, remembered automatically.`
- Auto Play top copy is short: `One-time setup. After this, we press Play for you every movie night.`
- Purple borders are intentionally thinner; selected device cards only get strong purple.
- Current proof receipt before this task: `receipts/321play-final-design-pass-20260509.md`

## Critical safety / truth constraints
- Do **not** call Anthropic directly from the browser/client. API key must stay server-side.
- Do **not** store photos in repo/localStorage/backend logs. Process and discard.
- Do **not** auto-route solely from AI output. Always show confirmation first.
- Do **not** remove manual selection.
- Do **not** deploy, commit, or touch production secrets.
- If backend/API credentials are missing, build a safe mock/local UI + typed server seam, and clearly label live vision as not configured.

## Implementation plan — gated sections
You must work one section at a time and send Jackie visual QA/proof after each section.

### Section 1 — Frontend onboarding entry UI only
Implement the Step 1 hero card and manual fallback layout.

Expected UI:
```text
STEP 1
What do you watch on?

[ 📷 Identify with a photo ]
Take a photo of your TV, remote, or streaming device.
Or choose one from your camera roll.
Photo is used to identify your device only. Not saved.

or pick manually:
[TV app built into my TV]
[Streaming stick or box]
[Console / cable / other]
```

Requirements:
- Photo option is visually the hero/largest element in Auto Play Step 1.
- Manual pick remains visible below as fallback.
- Include both choices conceptually: take photo + choose from camera roll/upload.
- On web/PWA, use safe file input affordance(s); for native iOS later, this maps to camera/library permissions.
- No backend/API yet in Section 1 unless trivial placeholder wiring is needed.

Section 1 proof to send Jackie:
- Changed files.
- `npm run typecheck`, `npm run lint -- --quiet`, `npm run build` results.
- Fresh mobile screenshot/contact sheet showing Step 1 with photo hero and manual fallback.
- Receipt: `receipts/jose-camera-device-id/section-1-receipt.md`.

### Section 2 — Client-side image intake + loading/low-confidence/result states
Add non-live identification state machine/UI using mockable typed results.

States required:
- image selected / preview or filename shown if safe
- `Identifying your device...`
- high/medium confidence confirmation screen
- low confidence / poor photo screen
- unrelated photo fallback screen
- tier 5/manual-only steering screen

Confirmation must include:
- `Looks like a Roku.` or equivalent device label.
- Positive tier copy where applicable.
- `[Yes — set up Roku]`
- `[No — let me pick manually]`

Low confidence must include:
- `We're not sure — the photo was hard to read.`
- `[Try another photo]`
- `[Pick manually instead]`

Section 2 proof to send Jackie:
- Changed files.
- Any unit tests for mapping/state helpers.
- Build/lint/typecheck results.
- Screenshot/contact sheet of all key states.
- Receipt: `receipts/jose-camera-device-id/section-2-receipt.md`.

### Section 3 — Device tier/preference mapping + route-to-existing setup wizard
Implement typed device-tier helper and map recommendations to existing setup wizard paths/state.

Requirements:
- Implement DEVICE_TIERS equivalent from spec.
- Implement setup route mapping:
  - roku -> Roku setup
  - fire_tv/android_tv/google_tv -> Fire/Android/Google setup
  - lg -> LG setup
  - samsung -> Samsung setup
  - sony -> Sony setup
  - vizio -> VIZIO setup
  - tier 5 -> manual countdown / steering screen
- Multi-device steering should prefer best Auto Play tier when photo detects both supported and unsupported device.
- Confirmation click should set the existing linked device/platform state and open the relevant setup step, skipping Step 2 device card selection.
- Tier 5 should not dead-end. Offer manual countdown + check another device.

Section 3 proof to send Jackie:
- Changed files.
- Unit tests for tier ranking, multi-device steering, and setup-route mapping.
- Build/lint/typecheck/test results.
- Screenshots for Roku, Samsung+Apple TV steering, Apple TV-only manual path.
- Receipt: `receipts/jose-camera-device-id/section-3-receipt.md`.

### Section 4 — Server/API seam, no secrets in client
Add the backend/server seam for live identification but keep it safe if credentials are absent.

Requirements:
- Client posts optimized image to our backend endpoint, not Anthropic directly.
- Backend calls Anthropic only if `ANTHROPIC_API_KEY` is configured.
- If key missing, return safe mock/setup response, not a crash.
- Do not log/store image content.
- Validate image size/type; resize client-side if practical or document native/server responsibility.
- Return structured JSON only.
- Add privacy note in UI.

Section 4 proof to send Jackie:
- Changed files.
- Tests for no-key fallback, invalid image handling, structured JSON/mapping, and no client-exposed API key.
- Grep proof that `ANTHROPIC_API_KEY` is not referenced in browser bundle/source paths except server files/docs.
- Build/lint/typecheck/test results.
- Receipt: `receipts/jose-camera-device-id/section-4-receipt.md`.

## Jackie verification protocol
After each section:
1. Send Jackie the receipt path, screenshot/contact sheet path, changed files, and exact commands/results.
2. Stop and wait.
3. If Jackie sends corrections, apply only those corrections for that section and resend proof.
4. Do not proceed to the next section until Jackie explicitly verifies the section.

## General proof commands
Run at minimum before every section receipt:
```bash
npm run typecheck
npm run lint -- --quiet
npm run build
```
Run relevant tests if you add helpers:
```bash
npm test -- <relevant files>
# or vitest run <specific test files>
```

## Visual proof requirements
- Mobile viewport around 390x844.
- Include clean first-run state with storage cleared.
- Include Step 1, confirmation, low-confidence, tier steering, and final routed setup state as applicable by section.
- Save screenshots under:
  `screenshots/jose-camera-device-id-20260509/`
- If you regenerate a contact sheet, include SHA256 and dimensions in receipt.

## Block conditions
Report BLOCKED instead of guessing if:
- Existing Auto Play setup state cannot be routed without major refactor.
- Backend/server framework target is unclear.
- Live Anthropic credentials are needed but unavailable.
- You cannot produce visual QA artifacts.
- A change would require deploy, production secrets, or native iOS code outside this repo.

## Required receipt format
For each section:
```text
SECTION <n> READY FOR JACKIE REVIEW
Changed files:
- ...
Verification:
- command — pass/fail
Visual QA:
- screenshot/contact sheet path
Notes/caveats:
- ...
```

Final receipt after all verified sections:
`receipts/jose-camera-device-id/final-receipt.md`
