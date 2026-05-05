# Deep Research Prompt: TV Remote Mode for Watch Sync — Roku, Fire TV/Android TV, LG webOS, Samsung Tizen, Apple TV

I’m building Watch Sync, a long-distance couples watch-together product.

Current product shape:
- Mode 1: TV/manual mode — works with any TV because users manually open the show/movie, seek to the timestamp, then the app coordinates ready checks, countdown, haptics/audio cues, chat, pause/buffering/resync/next-episode flows.
- Mode 2: Laptop/browser mode — Chrome extension pairs with the room and attempts auto-sync on supported accessible HTML5 video tabs.
- New optional Mode 3: TV Remote Mode — the phone app may send generic remote commands like Play/Pause to supported TV devices after the user manually opens the streaming app and pauses at the right timestamp.

Important constraint:
I am NOT trying to control Netflix/Hulu/Disney native smart-TV apps at the content/timestamp level. I only want generic remote commands where feasible: Play, Pause, Play/Pause toggle, maybe Home/Back/OK/select/arrows later. The app must be positioned honestly.

Existing implementation:
- Roku-first MVP exists using Roku ECP:
  - `GET http://<roku-ip>:8060/query/device-info`
  - `POST http://<roku-ip>:8060/keypress/Play`
- It currently exposes the documented/safe `Play` path only; treat discrete Roku `Pause`/`PlayPause` as unverified until checked against current docs and real hardware.
- It currently uses a local helper because hosted PWAs/mobile browsers may block local LAN HTTP calls due to mixed content, CORS, and Private Network Access rules.
- Production frontend is a Cloudflare Pages PWA at `https://app.kyrosdirect.tech`.
- Realtime backend is `wss://api.kyrosdirect.tech`.

Research target devices/platforms:
1. Roku / Roku TV / Roku Streaming Stick
2. Fire TV / Fire TV Stick / Fire OS
3. Android TV / Google TV
4. LG webOS TVs
5. Samsung Tizen TVs
6. Apple TV / tvOS
7. Any other common living-room platform worth considering

Research goals:
I need a practical implementation plan, not generic smart-home fluff. For each platform, determine:

1. Is generic remote control feasible from:
   - a hosted PWA in mobile Safari/Chrome?
   - a native iOS app?
   - a local helper/desktop companion?
   - a cloud backend only?

2. What protocol/API exists?
   - Official docs/source links.
   - Transport: HTTP, WebSocket, mDNS/SSDP, ADB, Bluetooth, private protocol, vendor SDK, etc.
   - Required pairing/auth/token flow.
   - Whether LAN discovery is possible and how.
   - Whether commands include Play/Pause specifically.

3. What are the browser/PWA blockers?
   - CORS support or lack of CORS.
   - HTTPS-to-local-HTTP mixed content.
   - Private Network Access restrictions.
   - Local network permission behavior on iOS Safari/Chrome.
   - Whether WebSockets to local TV devices work from HTTPS pages.

4. What are native iOS blockers?
   - Local Network privacy permission.
   - Bonjour/mDNS entitlements/usage strings.
   - App Store policy risk.
   - Private API risk.
   - Background/network constraints.

5. What is the minimal user flow?
   Example: “enter TV IP manually,” “scan LAN,” “TV shows pairing prompt,” “save token,” “test Play/Pause.”

6. What should Watch Sync honestly claim for this platform?
   Good claims should sound like:
   - “Can press Play/Pause on supported Roku devices.”
   - “Open your show first, then Watch Sync helps both sides press play together.”
   Bad claims to avoid:
   - “Auto-syncs Netflix on smart TVs.”
   - “Works with every TV app.”

7. Implementation difficulty score:
   - 1 = easy MVP in a week
   - 2 = doable but pairing/native helper needed
   - 3 = significant protocol/auth/device variance
   - 4 = possible but fragile/not worth MVP
   - 5 = avoid

8. Recommended build order:
   - Which device should be next after Roku?
   - Which should be research-only or never for MVP?
   - What is the fastest path to a believable App Store app?

Output format required:

## 1. Executive verdict
Short answer: which platforms are worth doing and in what order.

## 2. Feasibility matrix
Table columns:
- Platform
- Protocol/API
- PWA feasible?
- Native iOS feasible?
- Local helper feasible?
- Pairing/auth required?
- Supports Play/Pause?
- MVP score
- Recommendation

## 3. Platform-by-platform detail
For each platform:
- Official/source links
- Protocol summary
- Discovery/pairing flow
- Exact Play/Pause command shape if known
- PWA limitations
- Native iOS limitations
- Security/App Store risk
- Suggested UX copy
- Implementation steps

## 4. Architecture recommendation
Compare these options:
A. Hosted PWA only
B. Native iOS app only
C. PWA + local helper
D. Native iOS app + optional desktop helper
E. Cloud backend only

Explain which architecture is realistic for Watch Sync and why.

## 5. Product positioning
Give final honest copy for the app/landing page/settings screen.
Include compatibility language and warnings without killing conversion.

## 6. MVP implementation plan
Give a concrete phased plan:
- Phase 1: Roku polish
- Phase 2: next best TV platform
- Phase 3: native iOS local-network app
- Phase 4: optional integrations
Include files/modules likely needed, test strategy, and hardware needed.

## 7. Red flags / do-not-build list
List platforms or claims that are too fragile, private, legally risky, or likely to waste time.

Style gate:
- Be blunt and practical.
- No hype.
- Cite sources/official docs wherever possible.
- Separate verified facts from assumptions.
- If a protocol is private/unofficial, say so clearly.
- Bring every answer back to Watch Sync’s actual product goal: making long-distance TV watching easier without lying about automation.
