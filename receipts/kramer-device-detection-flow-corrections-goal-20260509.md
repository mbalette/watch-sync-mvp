# /goal — Kramer: Fix 321 Play stateful device-choice logic + detected-device screens

You are Kramer in HOST CLI. This is a follow-up correction from Matt after the stateful-flow pass.

## Target repo
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`

## Current local app
`http://127.0.0.1:5173/`

## Reference package
`/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports`

Read first:
- `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/kramer-watchsync-stateful-flow-20260509.md`
- `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/src/AppFlow.tsx`
- `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/src/app-flow.css`
- `/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/README.md`
- `/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/REFERENCE.md`
- primary reference for detected device screen if available: Apple TV detected screen in the export/source/contact sheet.

## Matt's correction — exact product logic

1. **Console / cable / other must NOT go to Apple TV detected.**
   - Matt: “if u click console / cable / other it shoudlnt go to apple tv detected thats just for when someone takes a picture of an apple tv lmfao”
   - Apple TV detected is ONLY for a photo/device-ID result where the photo recognized Apple TV.
   - Manual `Console / cable / other` should go to an honest manual/unsupported/category path, not Apple TV detected.

2. **Build detected-device screens for each possible detected device.**
   - Matt: “u need to have kramer essentially copy that apple tv detected screen and build out screens for each 'detected' device we could possibly have”
   - Copy the Apple TV detected screen pattern and make a reusable detected-device result/state for likely devices.
   - At minimum cover the current device picker set:
     - Roku / Roku TV
     - Fire TV / Fire TV Stick
     - Google TV / Android TV
     - LG TV
     - Samsung TV
     - VIZIO TV
     - Sony TV
     - Apple TV
     - generic unknown/manual-only result if photo cannot identify or identifies unsupported console/cable/other
   - Visual-only. No real camera/photo/vision/backend. The bottom sheet photo actions may demo-route to a detected device selection/result, but make it honest.
   - The detected screen should tell the truth per device: supported/beta/manual-only, setup next step, manual fallback.
   - Apple TV detected should be a detected-photo result only and should steer manual-only, not appear from the manual console category.

3. **Manual category taps should advance immediately. No repeat screen, no Next button.**
   - Matt: “if i click tv app built into my tv it should take me right to the options not ask me again what do you watch on.... same with streaming stick of box... also u shouldnt have to hit next its just a tap...”
   - On Step 1 photo/manual screen:
     - Tap `TV app built into my TV` → immediately go to the device/options picker. Do not show another `What do you watch on?` category screen. Do not require `Next`.
     - Tap `Streaming stick or box` → immediately go to the device/options picker. Do not show another `What do you watch on?` category screen. Do not require `Next`.
     - Tap `Console / cable / other` → immediately go to an appropriate manual-only/unsupported/options screen, NOT Apple TV detected.
   - If a separate category screen remains for some edge path, it must not be the default manual tap behavior and must not repeat the same question.

4. **Device row taps should also advance, not require Next, unless there is a clear reason.**
   - Keep the app fast: tap category → options, tap device → setup/detected-specific path.
   - Do not make users select and then hit Next for obvious single-choice cards.

## Required implementation behavior

- Preserve the screen-by-screen state-machine model. Do not regress to long scroll.
- Update `AppFlow.tsx` / CSS / capture script as needed.
- Add/rename `data-flow-screen` markers for new states so Jackie can verify mechanically.
- Keep `?demo=<id>` reference routes working.
- Visual-only only. No backend, no photo upload/storage, no Anthropic/vision API, no payment wiring, no deploy, no commit.

## Suggested state model

Use whatever names are clean, but something like:

- `step1-photo`
- `photo-sheet`
- `photo-detected-device` or per-device `detected-roku`, `detected-apple-tv`, etc.
- `device-picker` / `step2-device` reached directly from TV/streaming categories
- `device-setup-roku` or generic per-device setup
- `manual-unsupported` for console/cable/other manual path
- `countdown-auto`, `countdown-manual`, etc.

For detected screens, prefer a data-driven registry so all detected devices share the same layout/pattern rather than 9 copy-pasted components.

## Proof required

Update or create proof scripts and save screenshots under:
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-device-detection-flow-corrections-20260509/`

Capture at least:
1. Step 1 initial.
2. Tap `TV app built into my TV` → device/options screen directly, no repeated category screen, no Next gate.
3. Tap `Streaming stick or box` → device/options screen directly, no repeated category screen, no Next gate.
4. Tap `Console / cable / other` → manual-only/unsupported path, NOT Apple TV detected.
5. Tap photo hero → photo chooser sheet.
6. Photo action/demo detected Apple TV → Apple TV detected screen.
7. Detected Roku screen.
8. Detected Fire TV screen.
9. Detected Google/Android TV screen.
10. Detected LG screen.
11. Detected Samsung screen.
12. Detected VIZIO screen.
13. Detected Sony screen.
14. Detected unknown/manual-only screen.
15. Device row tap advances directly to setup/result without requiring Next.

Include contact sheet and state progression text.

## Verification commands

Run:
```bash
npm run typecheck
npm run lint -- --quiet
npm run build
```

Also run the updated capture script(s).

## Receipt required

Write:
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/kramer-device-detection-flow-corrections-20260509.md`

Receipt must include:
- verdict
- exact Matt corrections implemented
- changed files
- state machine changes
- click paths tested
- command results
- screenshot/contact sheet paths + dimensions + SHA256
- explicit proof that manual console/cable/other no longer goes to Apple TV detected
- explicit proof that TV app / streaming stick category taps go straight to device/options and do not repeat `What do you watch on?` or require `Next`
- explicit list of detected device screens added
- remaining caveats
- no deploy/no commit/no backend/no photo-storage/no payment confirmation

## Acceptance

Do not call done if:
- manual console/cable/other still routes to Apple TV detected;
- TV app or streaming stick still shows a redundant category/`What do you watch on?` screen;
- user must select a category and then hit Next;
- device rows require a needless Next;
- only Apple TV detected exists;
- proof is static/demo-route-only rather than real clicks in the default app.
