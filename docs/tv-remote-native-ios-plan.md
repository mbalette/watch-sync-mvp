# TV Remote Mode native iOS Roku plan

Verdict: Apple-side native iOS known-IP Roku control is technically feasible with public APIs, but public launch is **Build later** until Roku resolves contradictory official guidance about third-party mobile ECP use. A narrow internal/TestFlight beta may be useful for learning if the product explicitly accepts that Roku policy ambiguity.

## Runtime split

- Existing Cloudflare realtime backend: room creation, join, participant state, ready state, countdown timestamps, chat/status events.
- iOS app: authenticated/user-visible room client plus local-network Roku controller.
- Roku device: receives commands only from the participant's own iPhone on the participant's LAN.

The backend must never connect to TVs, store Roku LAN IPs, store Roku credentials, or store local TV credentials/device tokens. Roku metadata stays local on the iPhone.

## MVP scope after policy clearance / beta-only scope now

Keep the first build narrow and Roku-first:

1. Manual IP first. Ask the user to enter the Roku IP from Roku Settings > Network > About.
2. Foreground-only. Do not promise GO execution while the phone is locked or the app is backgrounded.
3. Link/probe with `GET http://<roku-ip>:8060/query/device-info`.
4. Store only local Roku metadata in the iOS app container, such as IP, user label, model/name from `device-info`, `lastSeenAt`, and whether the user enabled Roku Play at GO.
5. At countdown GO, if the room is active, the app is foregrounded, Roku mode is enabled, and the GO id has not already fired on this device, send exactly one `POST http://<roku-ip>:8060/keypress/Play`.
6. Do not auto-retry. Show manual fallback on failure, uncertainty, duplicate GO, denied local-network permission, or background/locked state.
7. Manual countdown fallback remains available always, including when the user declines Local Network permission.

## Linking model

```ts
interface LocalLinkedRokuDevice {
  id: string
  platform: 'roku'
  ip: string
  displayName: string
  modelName?: string
  userDeviceName?: string
  udn?: string
  sendPlayAtGo: boolean
  lastVerifiedAt?: string
  lastGoIdSent?: string
}
```

Minimum UX:

1. Explain that Watch Sync uses the local network only to connect to the user's Roku on this Wi-Fi and send one Play command at countdown GO.
2. Ask for manual Roku IP entry.
3. Probe `GET /query/device-info` only after user action.
4. Show the returned Roku label/model so the user can confirm the right device.
5. Save Roku metadata locally only.
6. Offer a user-controlled test/send Play action with the toggle-risk warning.

## Countdown command flow

1. App receives countdown state from `wss://api.kyrosdirect.tech`.
2. App schedules local UI countdown from server timestamp.
3. At GO, app computes and stores an idempotency key such as `roomId:countdownId:participantId:deviceId:Play`.
4. If the key was already sent on this device, do nothing.
5. If not sent, and the app is foregrounded with Roku mode enabled and a linked Roku, send exactly one `POST /keypress/Play`.
6. If command delivery fails or is uncertain, show manual fallback. Do not blindly retry because Roku `Play` can behave like a remote-style Play/Pause action depending on app/state.

## Required iOS permissions/copy

- `NSLocalNetworkUsageDescription`: “Watch Sync uses your local network to connect to your Roku on this Wi‑Fi and send one Play command at countdown GO.”
- Trigger Local Network permission only from a user action such as Link Roku or Test Roku, not at app launch.
- ATS/local HTTP caveat: Roku ECP is plain local HTTP on port `8060`. Use the narrowest local-network/local-IP ATS exceptions that work on supported iOS versions; do not use broad arbitrary loads. A real-device matrix is required before public release.
- No SSID/wrong-Wi-Fi auto-detection in MVP unless adding Location permission. Use user-facing copy instead of reading SSID/BSSID.
- `NSBonjourServices` is not needed for manual-IP Roku MVP. Add only for protocols actually used later.

## Explicitly out of scope

- SSDP discovery in Phase 1. Treat SSDP as Phase 2 only because Roku discovery uses multicast and carries entitlement/discovery risk on iOS. Manual IP must remain permanently available.
- Roku `Pause` or `PlayPause` product claims. Only `Play` is in the verified MVP path.
- App launching, DIAL/deep links, media-player state reads, timestamp reads, seeking, or claims that Watch Sync controls a native streaming app's exact playback position.
- Background or locked-phone execution promises.
- Apple TV direct control.
- Backend TV connection, Roku credential storage, LAN credential storage, or server-side TV command routing.
- Universal TV remote claims.

## Roku support/error copy

- Wrong Wi-Fi: “This iPhone and your Roku are not on the same local network. Connect both to the same Wi‑Fi and try again.”
- VPN interference: “A VPN may be blocking local traffic to your Roku. Turn off the VPN for this test and try again.”
- Roku control disabled: “Roku is blocking mobile commands. On Roku, open Settings > System > Advanced system settings and enable Control by mobile apps. On some models this appears as External Control > Network access.”
- Device unreachable: “We couldn’t reach that Roku at this address. Check the IP, make sure the Roku is on, and confirm both devices are on the same network.”
- Command sent but ignored: “Play signal sent. If nothing happened, the current TV app likely ignored the remote command. Use the countdown and press Play manually.”
- Toggle-risk warning: “The Roku Play command can behave like a remote-style Play/Pause action. Watch Sync sends it once only. Open the title and pause at the sync point before GO.”
- Manual fallback: “TV Remote Mode failed or is unavailable. Keep both videos paused at the sync point and use the countdown to press Play manually.”
- Local Network denied: “Local Network access is off. Manual countdown still works. Enable Local Network in iOS Settings only if you want Watch Sync to send one local Play command to your Roku.”

## TV Remote truth constraints

Keep existing TV Remote Mode claims narrow:

- Watch Sync coordinates the room/countdown; the participant's own iPhone sends the local Roku command.
- Users still open the same title themselves and pause at the sync point.
- Remote commands are best-effort and app-dependent.
- Manual countdown remains the reliable fallback.
- Do not imply official Roku partnership, universal app control, exact timestamp sync inside native TV apps, or support for every TV/streaming device.

## Build roadmap

1. **Now / beta-only if policy ambiguity is accepted**: native iOS Roku known-IP prototype with manual IP, `query/device-info`, local-only storage, foreground-only GO handling, exactly one `Play` at GO, no SSDP, and manual fallback.
2. **Public launch**: Build later, after Roku clarifies in writing that third-party mobile ECP use is permitted.
3. **Phase 2 after policy clearance and MVP learning**: optional SSDP discovery only if entitlement/discovery risk is resolved and validated on real devices. Keep manual IP fallback.
4. **Later platforms**: require the same bar: public official API, local-only credentials, safe copy, hardware validation, and no timestamp/app-control overclaims. Apple TV remains manual-only unless a public App-Store-safe direct-control path is documented and validated.

## Required validation before public release

- Real Roku players and Roku TVs across current Roku OS versions.
- iOS real-device matrix for Local Network allow/deny flows and narrow ATS/local-IP HTTP exceptions.
- Same Wi-Fi, guest/client-isolated Wi-Fi, VPN on/off, wired Roku plus Wi-Fi phone, DHCP IP change, weak Wi-Fi, and unreachable-device cases.
- Major streaming apps paused at the sync point to observe whether `Play` resumes, toggles, or is ignored.
- Support copy for Roku control disabled / External Control wording across Roku UI variants.

## Verification sources

- New Deep Research report: `/Users/home/.hermes/profiles/auditor/cache/documents/doc_f85986ac5406_deep-research-report.md`.
- Roku ECP developer docs and Roku support docs are contradictory as of the report date; treat public launch as policy-blocked until clarified.
