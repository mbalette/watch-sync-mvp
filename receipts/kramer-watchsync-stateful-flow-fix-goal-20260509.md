# /goal — Kramer: Convert Watch Sync / 321 Play from long scroll into step-by-step app flow

You are Kramer in HOST CLI. Jackie/Matt are rejecting the current local app flow because it behaves like one long continuous scrolling dashboard. The desired product behavior is a stateful mobile app: user taps, advances to next screen, taps/chooses, advances to the next screen depending on prompts/choices.

## Target repo
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`

## Reference package
`/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports`

Read first:
- `/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/README.md`
- `/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/REFERENCE.md`
- `/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/321Play-All-Screens-Contact-Sheet.png`
- `/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/source/screens.jsx`
- `/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/source/components.jsx`
- `/Users/home/Desktop/kyrosworkspace/apps/321play/321Play--Exports/source/tokens.css`

## Problem to fix
The current running app at `http://127.0.0.1:5173/` is too much of a long continuous page/dashboard. Pass 2 added `?demo=<id>` reference screens, but those are separate demo routes. Matt wants the real app flow to behave like screens:

- user sees one focused screen/state;
- user clicks/taps the primary action or chooses an option;
- app advances to the next focused screen;
- next screen depends on the prompt/choice;
- previous/secondary actions are intentional;
- no giant stacked page where Step 1, countdown, tracker, pricing, browse, etc. all sit below each other.

## Required product-flow interpretation
Implement a visual-only state machine in the actual running app flow, using existing local React state. Do not wire backend/API/payment/photo storage.

The flow should be roughly:

1. Landing / create room
   - User enters name and taps `Create a room`.
   - Next screen: Auto Play Step 1.

2. Auto Play Step 1 photo/device ID
   - Focused screen, not stacked above countdown/tracker.
   - Dominant photo card.
   - Manual fallback choices below.
   - Tap photo card -> photo chooser bottom sheet.
   - Tap manual category -> Manual Step 2 device picker.
   - No countdown/tracker/pricing visible below this screen.

3. Photo chooser bottom sheet
   - `Take a photo`, `Choose from photos`, `Pick manually instead`.
   - Since backend/photo ID is out of scope, photo actions can close sheet and show a visual-only “not wired yet / pick manually” path or advance to manual category/device picker. No photo storage.
   - `Pick manually instead` -> Manual Step 1 or Manual Step 2 depending on flow clarity.

4. Manual Step 1 category
   - One focused screen.
   - Progress dots.
   - Cards: TV app built into my TV, Streaming stick or box, Console/cable/other.
   - User taps a category; selected state appears; `Next` becomes primary.
   - Next -> Manual Step 2 device picker.

5. Manual Step 2 device picker
   - One focused screen.
   - Progress dots.
   - 7 device rows when appropriate: Roku, Fire TV, Google/Android TV, LG, Samsung, VIZIO, Sony.
   - User taps device; selected state appears; `Next` advances.
   - Roku -> Manual Step 3 Roku setup.
   - Apple TV/manual-only if present -> Apple TV steer/manual-only screen.
   - Unsupported/other -> manual fallback state.

6. Manual Step 3 Roku/device setup
   - One focused screen.
   - Reference-like numbered steps, not a dense settings panel.
   - `Connect & test` visual-only button.
   - On click, show either success/failure state using local UI only. If no real helper details, default to a visual-only success/failure toggle or deterministic demo outcome; no network/backend.

7. Result success / failure / Apple TV steer
   - Focused result screen.
   - Success -> `Continue to countdown`.
   - Failure/manual-only -> `Use manual countdown`.

8. Countdown screen
   - Focused countdown screen.
   - Show either Auto Play ready or no Auto Play/manual state depending on prior path.
   - User taps ready/start/continue as appropriate.
   - After countdown/play moment, advance to post-session title prompt or tracker preview.

9. Post-session title prompt
   - Focused prompt.
   - User can enter title and save, or skip.
   - Then advance to Watch Tracker.

10. Watch Tracker free/pro
   - Focused tracker screen.
   - Free/basic by default.
   - Include path to pricing/paywall but do not show pricing on landing.

11. Paywall/session-6 pricing
   - Focused paywall screen when triggered by session gate or `See Pro`/pricing action.
   - Visual only. No payment wiring.

12. Browse/find-watch and Tonight’s list
   - These should be reachable as screens/tabs/actions, not dumped under setup by default.
   - If included in current app, put behind `Find watch` / `Tonight’s list` navigation states.

## Hard constraints
- Watch Sync / 321 Play only. Do not touch BRB.
- No deploy.
- No commit/push.
- No backend/API/Anthropic/vision/photo-storage wiring.
- No Stripe/payment/IAP wiring.
- No real device/network test beyond current local-only UI if already safe.
- Do not reset/clean unrelated dirty files.
- Preserve product truth: Auto Play is local/generic remote command only; manual fallback remains true.
- No generic emoji/text device/photo icons.

## Implementation guidance
- Prefer a small explicit screen state enum, e.g. `appScreen` / `setupScreen`, over scroll-to-section UI.
- Hide non-current major sections instead of stacking them.
- Keep local state for selected category/device/result/title.
- Use existing reference demo components/styles if helpful, but wire them into the actual flow rather than only `?demo=` routes.
- It is okay for result/success/failure/payment/photo flows to be visual-only placeholders as long as they are honest and do not claim backend behavior.
- Preserve existing room creation basics enough that the app still works locally.

## Verification
Run:
```bash
npm run typecheck
npm run lint -- --quiet
npm run build
```
Start local app and capture proof from the real flow via clicks, not only static demo routes.

## Required proof
Save screenshots to:
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/kramer-watchsync-stateful-flow-20260509/`

Capture at least:
1. landing initial
2. after create room -> Step 1
3. photo card clicked -> bottom sheet
4. pick manually/category selected
5. next -> device picker
6. device selected
7. next -> Roku setup
8. connect/test -> result success or failure
9. continue -> countdown auto/manual
10. post-session title prompt
11. tracker
12. paywall/pricing
13. browse/find-watch screen if present
14. tonight’s list if present

Include a contact sheet and metrics/text proof showing state progression.

## Required receipt
Write:
`/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/kramer-watchsync-stateful-flow-20260509.md`

Receipt must include:
- verdict
- changed files
- state machine/screens implemented
- click path tested
- commands/results
- screenshot/contact sheet paths + dimensions + SHA256
- remaining mismatches/caveats
- explicit confirmation no deploy/commit/backend/photo storage/payment wiring

## Acceptance bar
Do not call done if the app still feels like one continuous long scroll. The default user journey must feel like screen -> click -> next screen -> click -> next screen, with sections/tabs/actions reachable intentionally.