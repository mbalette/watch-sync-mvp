# TV Remote Mode native iOS bridge plan

Verdict: a native iOS app is the realistic consumer path for TV Remote Mode because hosted PWAs cannot reliably discover or command private-LAN TVs.

## Runtime split

- Existing Cloudflare realtime backend: room creation, join, participant state, ready state, countdown timestamps, chat/status events.
- iOS app: authenticated/user-visible room client plus local-network TV controller.
- TV/device: receives commands only from the participant's own iPhone or local helper on the participant's LAN.

The backend must never send commands to TVs and should not store LAN IPs, pairing secrets, or device tokens unless a separate privacy/security review approves it.

## Linking model

Each participant links their own device locally:

```ts
interface LocalLinkedTvDevice {
  id: string
  platform: 'roku' | 'lg_webos' | 'samsung_beta' | 'cast_session' | 'adb_helper'
  displayName: string
  host?: string
  pairingTokenStoredInKeychain?: boolean
  capabilities: {
    play: boolean
    pause?: boolean
    toggleOnly?: boolean
  }
  lastVerifiedAt?: string
}
```

Minimum UX:

1. Choose TV platform.
2. Enter IP or scan local network where permitted.
3. Probe device info.
4. Complete pairing if required.
5. Send a safe test key only after user confirmation.
6. Store capability result locally.

## Countdown command flow

1. App receives `countdown_started` from `wss://api.kyrosdirect.tech`.
2. App schedules local UI countdown from server timestamp.
3. At GO / `play_now`, app computes an idempotency key:
   - `roomId:countdownStartedAt:participantId:deviceId:Play`.
4. If key was already sent, do nothing.
5. If not sent and device is linked/reachable, send exactly one Play/start command.
6. If command fails or is uncertain, show manual fallback. Do not blindly retry toggle commands.

## Phase adapters

- Roku: official ECP, `POST http://<host>:8060/keypress/Play`, no discrete Pause claim until hardware/docs verification.
- LG webOS: paired WebSocket/SSAP; verify `ssap://media.controls/play` and `pause` on hardware before shipping.
- Samsung beta: unofficial LAN WebSocket remote keys; label beta and require hardware model matrix.
- Cast: separate flow only for Cast media sessions Watch Sync owns/joins.
- Fire/Android ADB: advanced helper/dev-mode only.
- Apple TV: manual-only unless a public App-Store-safe path is proven.

## Required iOS permissions/copy

- `NSLocalNetworkUsageDescription`: "Watch Sync needs local network access to find and control your own TV on your Wi‑Fi."
- Bonjour service declarations only for protocols actually used in discovery.
- Keychain for LG/Samsung/Vizio pairing tokens if implemented.

## Error copy

- Device unreachable: "TV not reachable. Check that your phone and TV are on the same Wi‑Fi."
- Local network denied: "Local Network access is off. Enable it in iOS Settings to link this TV."
- Wrong Wi‑Fi/VPN: "This phone cannot see that TV from the current network."
- Pairing denied: "The TV did not approve pairing. Try again while the TV screen is visible."
- Command ignored: "Play was sent, but the TV app may have ignored it. Use the countdown manually."
- Unsupported: "Manual countdown still works. Remote control is not supported for this device yet."
