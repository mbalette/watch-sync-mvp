# Jackie verification — Kramer device detection flow corrections

**Date:** 2026-05-09  
**Target repo:** `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`  
**Kramer goal:** `receipts/kramer-device-detection-flow-corrections-goal-20260509.md`  
**Kramer receipt:** `receipts/kramer-device-detection-flow-corrections-20260509.md`

## Verdict

**Pass.** Kramer's follow-up implemented Matt's corrections and Jackie independently verified them against live-click proof.

Specific verified corrections:

1. `Console / cable / other` no longer routes to Apple TV detected. It routes to `manual-unsupported` with `Manual play only.` copy.
2. `TV app built into my TV` and `Streaming stick or box` taps go straight to `step2-device` / `Which device?`; no repeated `What do you watch on?` category screen and no `Next` gate.
3. Device rows advance directly to `device-setup`; no device-picker `Next` button.
4. Detected-device screens exist for Roku, Fire TV, Google/Android TV, LG, Samsung, VIZIO, Sony, Apple TV, and Unknown. Apple TV detected is reached through the photo/demo-detect path only.

## Evidence checked

- Read Kramer receipt: `receipts/kramer-device-detection-flow-corrections-20260509.md`
- Read state proof: `screenshots/kramer-device-detection-flow-corrections-20260509/_state-progression.txt`
- Re-ran proof capture:
  - `npx tsx scripts/capture-device-detection-flow-corrections-20260509.ts`
  - `npx tsx scripts/build-contact-sheet-device-detection-20260509.ts`
- Searched `src/AppFlow.tsx` for removed/stale state names and Next actions. Only `What do you watch on?` occurrence is the intended Step 1 screen; `step1-category`, `apple-steer`, and `next-from-category` no longer appear as active state/action names.
- Vision spot-checks:
  - `04-console-cable-other-manual-only.png` shows `Manual play only.`, not Apple TV detected.
  - `02-tv-builtin-direct-to-device-picker.png` shows `STEP 2 / Which device? / Tap your device to continue`, no repeated category question, no `Next` button.

## Verification commands rerun by Jackie

From `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`:

```text
npm run typecheck
# exit 0

npm run lint -- --quiet
# exit 0

npm run build
# exit 0
# dist/index.html                   1.04 kB │ gzip:  0.49 kB
# dist/assets/index-BVBO62_w.css   73.81 kB │ gzip: 13.22 kB
# dist/assets/index-CseYgLkV.js   247.89 kB │ gzip: 69.93 kB
# ✓ built in 87ms

npx tsx scripts/capture-device-detection-flow-corrections-20260509.ts
# exit 0 — saved 16 proof frames

npx tsx scripts/build-contact-sheet-device-detection-20260509.ts
# exit 0 — saved contact sheet
```

## Latest screenshot proof after Jackie recapture

Folder: `screenshots/kramer-device-detection-flow-corrections-20260509/`

| File | State | Dimensions | Bytes | SHA-256 |
|---|---|---:|---:|---|
| `01-step1-photo.png` | step1-photo | 780x1688 | 144719 | `07d73ea4cdca0af3d031f31cc3405bba1b846da47c6ff3ee10f9902d287f8339` |
| `02-tv-builtin-direct-to-device-picker.png` | step2-device | 780x1688 | 86984 | `788b52d8aa9880712ad0539434fed0d20749a47832e21026cdf59646d9757823` |
| `03-streaming-stick-direct-to-device-picker.png` | step2-device | 780x1688 | 87353 | `87f99844c10fe9259e4705cbdddb2748d38589184d3f8b6011e16fdea67fa094` |
| `04-console-cable-other-manual-only.png` | manual-unsupported | 780x1688 | 86468 | `7515fe8cb9989dd2a2bd62e2c77124ee836ac9c44911611836c15ae3201c9e47` |
| `05-photo-bottom-sheet.png` | photo-sheet | 780x1688 | 209165 | `8b2416a7a526a315e11c654fb5d2126bf37e03dec8ec2c70767b3088893bd586` |
| `06-photo-detect-picker.png` | photo-detect-picker | 780x1688 | 113678 | `2abe043fc4bda8e8848283dd138ff8d51fa4549f067a2228a812290363286b5e` |
| `07-detected-apple-tv.png` | detected-device / apple-tv | 780x1688 | 78548 | `8319e4d2ec1afd0100aa4a293ed9203e0621e147b82708c738401db025ca994b` |
| `08-detected-roku.png` | detected-device / roku | 780x1688 | 73047 | `12e364b231e899aec73bd9e51a0233efc967986594376349aea42936acd8e7ea` |
| `09-detected-fire-tv.png` | detected-device / fire | 780x1688 | 72298 | `996c5078b1470d3d258ccc5c70f9814618316a5e025126800e1782384d308e1f` |
| `10-detected-google-android-tv.png` | detected-device / google | 780x1688 | 76603 | `0dad33df6e1f53e8c69bc3125099b1463de461b3943435d003717e9ac37473ed` |
| `11-detected-lg-tv.png` | detected-device / lg | 780x1688 | 75617 | `7b3c595d727feea0ab424303438a1bc82ae2359c0c81535d354b69a563b9afd0` |
| `12-detected-samsung-tv.png` | detected-device / samsung | 780x1688 | 77954 | `a6e649a077fff83e030d0796225116c1328ebdecfbdec3aa947b8a319a6166ff` |
| `13-detected-vizio-tv.png` | detected-device / vizio | 780x1688 | 76027 | `1de98897322802348760cbc07551bea937b9d35d7d5b35891c854f65d941f836` |
| `14-detected-sony-tv.png` | detected-device / sony | 780x1688 | 74208 | `59114508d1b65ae0cc5da54102b39acd221d910c3679526793b72df5722bfaa5` |
| `15-detected-unknown.png` | detected-device / unknown | 780x1688 | 81880 | `768896992ff96e5984510d28437d488a021fadf6c13c2fcc91a8dce48224af73` |
| `16-device-row-tap-direct-to-setup.png` | device-setup / selected=roku | 780x1688 | 103052 | `9504775b833003873e48e6b0a9f66114d34082504b1e7676713b683d68b39145` |
| `_contact-sheet.png` | all 16 frames | 1600x3498 | 616123 | `a89dd3145fa9d03d6d97960fea6866be28c99b2ff3cce3c4af2b2cb58c17b17d` |

## Current local URL

The app remains available locally at:

`http://127.0.0.1:5173/`

## Safety / scope

- No deploy by Jackie.
- No commit/push by Jackie.
- No backend/Anthropic/vision/photo-storage wiring found in the new flow files.
- No payment wiring.
- Work remains local and visual/state-machine only.

## Caveats

1. Detected-device behavior is still a demo picker after photo action; no actual photo recognition exists yet.
2. Brand-specific detected screens are data-driven visual variants, not hardware validation.
3. Repo remains broadly dirty from prior Watch Sync work, so review staged/unstaged diffs carefully before any commit/deploy.
