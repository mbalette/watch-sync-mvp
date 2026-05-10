# Jose receipt — Remote Start device setup flow — 2026-05-09

## Verdict

Fixed.

## Root cause found

The top Remote Start onboarding was setting `remoteWatchingMethod` and opening `showTvRemoteDrawer`, but it did not move the mobile viewport or focus to the lower Step 2 device setup section. In the iPhone-sized viewport, the drawer content lived far below the countdown/controls, so tapping a watch method or `Continue to device setup` appeared dead even though state changed.

Second issue found during polish: with public Remote Start flags off, `getVisibleRemoteStartChoices(...)` could return no enabled device rows for `TV app built into my TV`. That made Step 2 technically visible after the scroll fix, but not honest/useful enough. The UI now shows the appropriate device paths for the selected watch method and marks unavailable beta paths as `Use Countdown Mode` instead of hiding them or implying public support.

## Files changed

- `src/App.tsx`
  - Added refs/focus/scroll targeting for Remote Start Step 1/2/3.
  - Updated top watch-method buttons and `Continue to device setup` to open the drawer and scroll/focus Step 2.
  - Updated drawer Step 1 choices to also scroll/focus Step 2.
  - Updated Step 2 device selection to show method-appropriate device rows even when beta/public flags are closed, with disabled/honest `Use Countdown Mode` copy.
  - Updated enabled device selection to scroll/focus Step 3 after a device is picked.
- `src/App.css`
  - Polished Remote Start selection/action colors away from orange/brown-heavy treatment into charcoal + blue/indigo.
  - Added focus outlines/scroll margins for the Step 2/Step 3 transition.
  - Added disabled/unavailable device-card treatment.
- `scripts/jose-remote-flow-proof.mjs`
  - Temporary/local proof script used for iPhone-size Playwright screenshots and DOM rect JSON.

## Impeccable critique pass 1 summary

- The CTA felt dead because the app stayed at the top of the room screen (`scrollY: 0`) after method selection/continue.
- The drawer existed but started around `top: 1807px` in the mobile DOM, far below the visible viewport.
- Step 2/Step 3 had no direct focus target or visible transition from the top CTA.
- The top selected state and action treatment used warm gold/orange; task direction requested charcoal + blue/indigo for selections/actions.

## Polish pass 1 summary

- Added scroll/focus refs for Step 1/2/3.
- Changed top method choices and `Continue to device setup` to open the drawer and scroll/focus Step 2.
- Added Step 3 scroll/focus after selecting an enabled device.
- Swapped Remote Start action/selection treatments to blue/indigo accents and added focus outline.

## Impeccable critique pass 2 summary

- Step 2 now visibly appeared after continuing for all methods.
- Remaining defect: when Remote Start public/internal flags were closed, built-in TV method could show Step 2 with no actionable/device rows, which still felt incomplete and risked confusing users.
- Streaming/cable paths were more honest because Apple/manual appeared, but Roku/beta availability was still too implicit when disabled.

## Polish pass 2 summary

- Step 2 now renders the method-appropriate device paths regardless of beta availability.
- Disabled/closed beta paths show `Use Countdown Mode` and clear copy: `Remote Start setup is not available for this device tonight. Manual countdown still works.`
- No public Remote Start flags were enabled; disabled beta rows are explanatory only.

## Commands run + results

- `curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5174/` → `200`
- `node scripts/jose-remote-flow-proof.mjs /tmp/321play-before-fix` → passed; proved pre-fix drawer was offscreen (`scrollY: 0`, drawer top around `1807px`).
- `npm run typecheck` → passed.
- `npm run lint -- --quiet` → passed.
- `node scripts/jose-remote-flow-proof.mjs screenshots/jose-remote-start-flow-20260509-pass1` → passed; proved initial scroll/focus fix and exposed empty/weak Step 2 for disabled built-in TV beta choices.
- `node scripts/jose-remote-flow-proof.mjs screenshots/jose-remote-start-flow-20260509-pass2` → passed; final screenshot/DOM proof for all required methods.
- `npm test` → passed; 16 test files, 93 tests passed.
- `npm run build` → passed; `tsc -b && vite build` completed.

## Screenshot paths

Final pass screenshots:

1. Initial Remote Start setup  
   `screenshots/jose-remote-start-flow-20260509-pass2/01-initial.png`
2. After selecting `TV app built into my TV` and continuing  
   `screenshots/jose-remote-start-flow-20260509-pass2/02-after-tv-built-in.png`
3. After selecting `Streaming stick or box` and continuing  
   `screenshots/jose-remote-start-flow-20260509-pass2/02-after-streaming-stick-box.png`
4. After selecting `Console / cable / not sure` and continuing  
   `screenshots/jose-remote-start-flow-20260509-pass2/02-after-console-cable-not-sure.png`

DOM proof JSON beside screenshots:

- `screenshots/jose-remote-start-flow-20260509-pass2/01-initial.json`
- `screenshots/jose-remote-start-flow-20260509-pass2/02-after-tv-built-in.json`
- `screenshots/jose-remote-start-flow-20260509-pass2/02-after-streaming-stick-box.json`
- `screenshots/jose-remote-start-flow-20260509-pass2/02-after-console-cable-not-sure.json`

Temporary/pre-fix proof:

- `/tmp/321play-before-fix/02-after-tv-built-in.json`
- `/tmp/321play-before-fix/02-after-streaming-stick-box.json`
- `/tmp/321play-before-fix/02-after-console-cable-not-sure.json`

## Remaining gaps / unverified items

- I verified in mobile Playwright at `390x844` against the local Vite URL. I did not use Apple/Xcode simulator APIs directly.
- I did not run `npm run smoke:realtime` because it was not requested in this packet’s verification list, and the scoped bug was static UI flow.
- `.wrangler/` was already untracked before this work; I did not touch it.

## Safety statement

No deploy performed. No Cloudflare changes. No secrets used or printed. No public Remote Start flags enabled. No hardware validation claimed.
