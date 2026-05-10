# 321Play all-screens PNG contact sheet — 2026-05-09

Verdict: generated locally from the corrected 321Play/Watch Sync source. No deploy.

## Artifact

- PNG contact sheet: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/screenshots/321play-all-screens-20260509/321play-all-screens-contact-sheet-20260509.png`
- SHA256: `b3ac2fdd5625cbedfd658caa7a66254a73ca6e35a1d641e541e649f55b7e5626`
- Dimensions: `2460 x 8902`
- File size: `5,339,687` bytes

## Source capture

- Local URL: `http://127.0.0.1:5174/`
- Capture method: Playwright Chromium mobile viewport, `390 x 844`, `deviceScaleFactor: 2`.
- Individual panel size: `780 x 1688` PNG.

## Included panels

1. Welcome / Create room
2. Welcome / Join room
3. Room / default countdown + remote setup
4. Chat panel
5. Find watch / TMDB + filters
6. Remote Start / TV app method choices
7. Remote Start / LG connect
8. Remote Start / streaming devices
9. Remote Start / Fire Android Google connect
10. Remote Start / manual fallback
11. Laptop auto-sync drawer
12. Solo countdown preview
13. PLAY state

## Verification

- Vite server responded `HTTP/1.1 200 OK` at `http://127.0.0.1:5174/` before capture.
- Generated 13 individual PNGs plus a combined contact sheet.
- PIL verification read all 13 source PNGs as nonblank `780 x 1688` images and the final sheet as `2460 x 8902`.

## Caveats

- This is a local visual artifact from current source, not a deployed production bundle audit.
- It is a representative all-main-states sheet, not every permutation of every device/platform dropdown option.
- No deployment, Cloudflare changes, hardware validation, real room invite send, or helper-device command was performed.
