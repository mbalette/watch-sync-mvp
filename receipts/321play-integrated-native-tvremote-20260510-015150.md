# 321 Play native TVRemote integration receipt — 2026-05-10 01:51 CDT

## Verdict
PASS — integrated the native TVRemote/non-hardware readiness path into the app entrypoint.

## What changed
- `src/App.tsx` now routes the default app surface to `LiveRoomApp`, the app path that imports and calls `src/native-tv-remote.ts`.
- `src/app-surface.ts` adds a small tested routing selector:
  - default / `?room=...` / `?realtime=1` => `live`
  - `?flow=1`, `?visualFlow=1`, or legacy `?visual=1` => visual `AppFlow`
  - existing `?demo=<reference-id>` => reference screen
- `src/App.test.ts` locks the entrypoint contract so the visual flow cannot silently become the default again.
- Ran `npx cap sync ios` and `npx cap sync android` after the build so the generated native shells receive the integrated web assets.

## Evidence
- `src/App.tsx:6-18` imports `selectAppSurface`, preserves reference screens, keeps explicit visual-flow routes, and returns `<LiveRoomApp />` by default.
- `src/app-surface.ts:1-14` defines the app-surface selector.
- `src/App.test.ts:8-25` proves default route is `live`, room/realtime links are `live`, and visual/reference routes remain explicit.
- Existing native bridge integration remains in `src/LiveRoomApp.tsx:64-69`, `src/LiveRoomApp.tsx:641-643`, and `src/LiveRoomApp.tsx:792-812`.
- Existing native bridge wrapper remains in `src/native-tv-remote.ts:19-96`.

## Verification run
- `npm run typecheck` — PASS
- `npm test` — PASS, 19 files / 107 tests
- `npm run test:remote-start-runtime-beta:all-platforms` — PASS, 6 files / 45 tests
- `npm run test:tv-remote-bridge` — PASS
- `npm run test:remote-start-simulator` — PASS, 152-row simulator matrix exported with `hardwareValidation=false`
- `npm run scan:no-react-lan` — PASS
- `npm run scan:remote-start-artifacts` — PASS after sanitizing one public Capacitor package URL from the prior untracked verification-output artifact so the local artifact leak scanner could complete
- `npm run scan:remote-start-public-claims` — PASS
- `npm run lint -- --quiet` — PASS
- `npm run build` — PASS; built `dist/assets/index-BoISDT-9.js`
- `npx cap sync ios` — PASS
- `npx cap sync android` — PASS
- `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' build CODE_SIGNING_ALLOWED=NO` — PASS
- `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ANDROID_HOME=/opt/homebrew/share/android-commandlinetools ./gradlew assembleDebug` from `android/` — PASS
- `git diff --check` — PASS

## Boundaries / caveats
- No deploy performed.
- No public flags flipped.
- No hardware validation claimed; Roku/VIZIO/LG/Samsung/Sony/Android/Google/Fire remain `hardwareValidation=false` until real device testing.
- Repo already had broad pre-existing dirty/untracked native/non-hardware work; this receipt only covers the entrypoint integration and verification above.
