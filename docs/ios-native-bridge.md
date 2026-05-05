# iOS native bridge notes

A native iOS app should share the room/event model with the PWA instead of inventing a separate product flow.

## Why native later

Native iOS can improve:

- Haptic quality and timing feel.
- Push notifications for room invites or partner prompts.
- Universal links/deep links into a room.
- Lock-screen/background reliability.
- Audio/haptic scheduling reliability.
- App Store distribution and trust.

Those are valuable after the manual sync loop is proven. They are not required for this PWA MVP.

## Shared concepts

A native client should preserve:

- Room code/link joining.
- Display names and participants.
- Service/title/timestamp setup.
- Ready states.
- Shared countdown.
- PAUSE, BUFFERING, RESYNC, and NEXT EPISODE events.
- Future extension pairing.
- Honest TV manual mode language.

## Suggested native boundary

Use the protocol in `docs/protocol.md` as the network contract. Native code should send and receive room events through the future realtime backend and derive local UI state from the current room snapshot/event stream.

Potential Swift-facing models:

- `RoomState`
- `Participant`
- `WatchSetup`
- `CountdownState`
- `RoomEvent`
- `RoomSignal`

## Native implementation choices still open

- SwiftUI native app vs. Expo/React Native.
- Realtime transport choice.
- Push notification provider and Apple entitlements.
- Universal link domain.
- TestFlight/App Store account setup.
- Privacy labels and review-safe copy.
- Real-device haptic/audio timing tests.

## Bridge principle

The iOS app may make timing feel better, but it must not imply smart-TV automation in TV manual mode. If a user is watching through a native smart-TV app, the app remains a coach: pause at the target timestamp, both tap ready, hold play, release on GO.
