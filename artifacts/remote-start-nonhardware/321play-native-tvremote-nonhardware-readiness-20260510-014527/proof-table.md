| Proof item | Evidence | Verdict |
|---|---|---|
| Dirty preflight | `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/321play-native-tvremote-nonhardware-preflight-20260510-014527.md` + git status in bundle | PASS |
| Android compile | `android-build-output.txt`; `cd android && ./gradlew assembleDebug` BUILD SUCCESSFUL with JDK21/ANDROID_HOME | PASS |
| React bridge wiring | `src/native-tv-remote.ts`, `src/native-tv-remote.test.ts`, `src/LiveRoomApp.tsx`; no-LAN scan | PASS |
| Mock protocol tests | `npm run test:remote-start-runtime-beta:all-platforms` covers helper protocol mocks; `src/native-tv-remote.test.ts` covers bridge envelopes | PASS |
| iOS bridge behavior | `xcodebuild ... CODE_SIGNING_ALLOWED=NO` BUILD SUCCEEDED in verification log | PASS |
| Android bridge behavior | `cd android && ./gradlew assembleDebug` BUILD SUCCESSFUL; Android plugin safe stubs compile | PASS |
| Backend timing seam | `src/domain.ts` countdown_go timing-only event + `src/domain.test.ts` rejects TV credential fields | PASS |
| Outcome logging | `src/remote-start-outcome-sanitizer.ts`, `outcome-sample.json`, redaction/leak scan | PASS |
| Simulator matrix | `simulator-matrix.json`/`.md`; 152 rows; all hardwareValidation false | PASS |
| Claim guards | `scan:no-react-lan`, `scan:remote-start-artifacts`, `scan:remote-start-public-claims` | PASS |
| Verification chain | `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp/receipts/321play-native-tvremote-nonhardware-verification-final-20260510-014027.log` | PASS |
| Bundle | zip + SHA256 generated after this table | PASS |
