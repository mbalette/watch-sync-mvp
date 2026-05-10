# 321Play / Watch Sync — Every Visible Word Inventory

Generated for Matt from current local corrected source after the Remote Start device-card fixes.

Scope: every user-visible label, button, dropdown option, instruction, helper, status/error template, caveat, mock recommendation card, and Remote Start wizard copy found in the app source. This is the source-grounded text inventory for the app screens/states; it is broader than the PNG contact sheet because it includes dropdown options and conditional/status messages that may not all be simultaneously visible in one screenshot.

---

- Repo: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`
- Branch: `main`
- Dirty source files at extraction: `src/App.css`, `src/App.tsx`, `src/tv-remote-device.test.ts`, `src/tv-remote-device.ts`

---

# Landing / welcome screen

## Brand / intro

- Date night, together
- Watch Sync
- The shared remote for long-distance movie nights.

## Truth card

- Use it manually with any TV
- Auto-sync is available for supported browser tabs with the Chrome extension

## Create / join form

Labels / placeholders / aria:

- Your name
- Alex
- Room code
- AB12CD

Buttons / links:

- Create room
- Join movie night
- Already invited? Enter a code
- Starting fresh? Create a room

Status / errors:

- Creating room...
- Joining room...
- Room not found. Check the code or ask your partner for a fresh invite link.
- Link copied!
- Copy this link: `{inviteLink}`

---

# Room header / room status

## Header

- Watch Sync
- Laptop auto-sync available
- TV/manual mode
- Invite
- Copy invite link

## Room strip

- Live room connected
- Private local room
- `{readyCount}/{maxPeople} ready`

---

# Early Remote Start setup block

## Heading

- Remote Start setup
- What are you using to watch?
- Choose the screen or device playing the title. Manual countdown stays as fallback for all choices; Remote Start only sends a local Play at GO when a safe path exists.

## Setup sequence labels

- 1 Watch method
- 2 Device
- 3 Connect it

## Early method buttons

- TV app built into my TV
- Streaming stick or box
- Console / cable / not sure

## Early helper text

- Next: pick the remote you’d normally press Play with.
- No TV or streaming device is selected yet — choose a watch method first.

## Early CTA

- Continue to device setup
- Start guided setup

---

# Countdown hero

## Labels

- Both pause at
- Ready in
- Press play

## Countdown display values

- 00:00
- 3
- PLAY

## Hints

- Get ready to press play!
- Press play now!
- Waiting for your partner to join...
- Invite your partner, then tap ready.
- Waiting for your partner...
- Both pause at this time, then tap ready.

## Partner status

- `(you)`
- Waiting for partner

## Ready button

- I'm ready
- Ready — tap to undo

## Solo preview

- Try solo countdown
- Preview only — real sync starts when both partners are ready.

---

# Room setup sheet

## Invite card

- Invite
- Send the room, then ready up together.
- Manual sync is available for any TV. Auto-sync is for supported browser tabs.
- Copy invite

## Pause time card

- Pause time
- Set the timestamp both screens should pause at.
- 00:00
- Set

---

# Quick actions / controls

- Chat
- Resync
- Time
- Find watch
- Remote Start setup
- Continue device setup
- Pick watch method first

---

# Chat panel

- A tiny backchannel for “pause?” and “ready”.
- Message...
- Chat message
- Send
- Partner

---

# Tonight selected watch card

- Tonight
- Open this title in your own streaming app, pause at the sync point, then use manual countdown or TV Remote Mode to start together.

---

# Tonight queue

## Header / empty state

- Room picks
- Tonight's queue
- `{count} queued`
- Search by your services, add a few picks, then let the room vote on what to watch tonight.

## Recommendation card labels

- Series
- Movie
- Any service
- Rating unavailable
- Details
- Set for tonight
- 👍 `{votes}`
- 👎 `{votes}`
- Selected
- Set tonight
- Sets the room's title and clears ready/countdown state so everyone can open the same show and sync from the start.

## Queue attribution templates

- Added by Partner
- First added by `{firstName}`; latest by `{latestName}`
- Added by `{firstName}`
- `{recommendCount} add`
- `{recommendCount} adds`

## Recommendation action statuses

- `{title} is already in Tonight's queue.`
- Added `{title}` to Tonight's queue.
- Voted yes on `{title}`.
- Voted no on `{title}`.
- `{title}` set as tonight's watch. Everyone should pause at 00:00 and ready up.

---

# Find next watch drawer

## Drawer toggle

- Find next watch
- Live TMDB browse/search
- Pick services + browse

## Intro paragraph

- Pick the services you have and your country/region, browse TMDB discovery filters, or search a specific title. Availability is best-effort and varies by country, plan, and date; ratings shown here are TMDB User Ratings. Watch Sync does not scrape provider catalogs and is not endorsed by TMDB or any streaming service.

## Browse category tabs

- Popular
- New-ish
- Recently aired

## Movies / shows dropdown

Label / aria:

- Movies / shows
- Recommendation media type

Options:

- Movies + shows
- Movies only
- Shows only

## Country / region dropdown

Label / aria:

- Country / region
- Recommendation country or region

Options:

- United States (US)
- Canada (CA)
- United Kingdom (GB)
- Australia (AU)
- Germany (DE)
- France (FR)
- Japan (JP)

## Search field

- Search title
- Try The Bear, Dune, comedy...
- Search watch recommendations

## Recommendation actions

- Browse TMDB
- Search TMDB
- Use mock
- Live
- Mock

## Active filters row

- Active filters:
- All services
- Movies + shows
- Movies only
- Shows only
- Search all services
- Save services
- Clear filters

## Streaming service filter buttons

- Netflix
- Prime Video
- Disney+
- Paramount+
- Max
- Hulu
- Peacock
- Apple TV+

## Empty / no-match recovery

- No matches for the active filters. Try all services, clear filters, browse TMDB, or search another title.
- Search all services
- Clear filters

## Recommendation result buttons

- In queue
- Add to queue

## Disclaimer / caveat

- Availability is best-effort TMDB provider data and can vary by country, plan, and date. TMDB ratings are TMDB User Ratings. This product uses the TMDB API but is not endorsed or certified by TMDB; Watch Sync does not scrape JustWatch, Rotten Tomatoes, IMDb, Metacritic, or provider catalogs.

## Recommendation status messages

Initial / mock:

- Showing a safe mock catalog. Live TMDB search is optional once a server token is configured.
- Showing the safe mock catalog. Live TMDB search can be retried any time.

Services / filters:

- Services saved locally on this device.
- Provider filters cleared and local service preferences removed. Browse TMDB or search again across all services.
- Provider filters cleared. Browsing TMDB across all services...
- Provider filters cleared. Searching TMDB across all services...

Browse/search in progress:

- Browsing TMDB provider catalog via the server token proxy...
- Searching TMDB via the server token proxy...
- Type a title or keyword before live TMDB search. Mock recommendations are still available.

Success:

- Showing provider-filtered TMDB browse results. Availability can vary by region, account plan, and date.
- Showing live TMDB results for the selected region/providers. Provider availability can vary by account and date.
- Showing TMDB browse results across all services. Availability can vary by region, account plan, and date.
- Showing live TMDB results across all services. Provider availability can vary by region, account, and date.

No results:

- TMDB returned no provider-filtered titles for those filters. Try a different service or tab, or use mock cards.
- TMDB returned no matching titles for those filters. Showing an empty live result set; clear live search to return to mock cards.
- TMDB returned no titles across all services for this tab. Try another tab/search or use mock cards.
- TMDB returned no matching titles across all services. Try another search or use mock cards.

Failures / fallback templates:

- `{error or TMDB discover returned status}` Showing mock catalog instead.
- `{error or TMDB search returned status}` Showing mock catalog instead.
- `{error}. Showing mock catalog instead.`
- TMDB provider browsing failed. Showing mock catalog instead.
- TMDB search failed. Showing mock catalog instead.
- `{error or TMDB discover returned status}` Provider filters are cleared; showing mock catalog instead.
- `{error or TMDB search returned status}` Provider filters are cleared; showing mock catalog instead.
- `{error}. Provider filters are cleared; showing mock catalog instead.
- TMDB browse failed after clearing filters. Showing mock catalog instead.
- TMDB search failed after clearing filters. Showing mock catalog instead.

---

# Mock recommendation card text

## Arrival

- Title: Arrival
- Year: 2016
- Media: Movie
- Providers: Netflix, Prime Video
- Rating: TMDB User Rating: 7.6
- Overview: A thoughtful sci-fi drama about language, time, and connection — strong for a focused date-night watch.

## The Bear

- Title: The Bear
- Year: 2022
- Media: Series
- Providers: Hulu, Disney+
- Rating: TMDB User Rating: 8.2
- Overview: Fast, emotional, and easy to discuss after each episode. Better for short synced sessions than a long movie.

## Dune: Part Two

- Title: Dune: Part Two
- Year: 2024
- Media: Movie
- Providers: Max
- Rating: TMDB User Rating: 8.1
- Overview: Big-screen sci-fi spectacle with strong shared-watch energy if both people can commit to the runtime.

## Only Murders in the Building

- Title: Only Murders in the Building
- Year: 2021
- Media: Series
- Providers: Hulu
- Rating: TMDB User Rating: 8.0
- Overview: Cozy mystery comedy with light cliffhangers and plenty to chat about between episodes.

## Andor

- Title: Andor
- Year: 2022
- Media: Series
- Providers: Disney+
- Rating: TMDB User Rating: 8.2
- Overview: Prestige sci-fi with grounded tension. Best when both people want something more serious than background TV.

## Poker Face

- Title: Poker Face
- Year: 2023
- Media: Series
- Providers: Peacock
- Rating: TMDB User Rating: 7.8
- Overview: A case-of-the-week mystery comedy with easy episode-by-episode watch-party energy.

## Severance

- Title: Severance
- Year: 2022
- Media: Series
- Providers: Apple TV+
- Rating: TMDB User Rating: 8.4
- Overview: A tense, premium mystery series that works well for couples who want theories between episodes.

## Oppenheimer

- Title: Oppenheimer
- Year: 2023
- Media: Movie
- Providers: Peacock, Prime Video
- Rating: TMDB User Rating: 8.1
- Overview: A long, intense prestige movie pick for nights when everyone is ready for a serious watch.

## Mission: Impossible — Fallout

- Title: Mission: Impossible — Fallout
- Year: 2018
- Media: Movie
- Providers: Paramount+
- Rating: TMDB User Rating: 7.4
- Overview: High-energy action that works well for groups because it is visual, fast, and easy to jump into.

---

# Remote Start drawer

## Drawer toggle

- Remote Start setup
- What are you using to watch?

## Intro paragraph

- Remote Start is local device control at countdown GO. Everyone still opens the title themselves in their own streaming app, pauses at the sync point, readies up, and uses manual countdown as the universal fallback. If enabled below, Watch Sync sends one local Play command at GO only when the selected platform has a safe discrete Play path.

## Manual-only / Home Assistant caveats

- `{linkedTvDevice.label}` is manual-only here. Watch Sync does not claim direct control for this platform.
- Home Assistant webhook is not a D2C default path. It is only for users already running HA locally and stays outside public Remote Start support. Watch Sync servers do not store HA credentials, tokens, entity IDs, or webhook URLs. Manual countdown remains the fallback.

---

# Remote Start Step 1 — watch method

## Heading

- Step 1
- What are you using to watch?
- Start here. Pick the thing actually playing Netflix/Hulu/Prime/YouTube, then Watch Sync will narrow the setup to the right device.

## Choices

### TV app built into my TV

- Icon: TV
- Helper: Netflix, Hulu, Disney+, Prime, Max, or YouTube opened from the TV home screen.
- Next copy: Next, pick your TV brand so Watch Sync can show the right setup steps.

### Streaming stick or box

- Icon: ▭
- Helper: Roku, Fire TV, Android TV, and Google TV paths can be set up and tested when available.
- Next copy: Next, pick the remote you’d normally press Play with — Roku, Fire TV, Android TV, Google TV, or manual fallback.

### Game console / cable box / not sure

- Icon: ?
- Helper: Consoles, cable boxes, casting sessions, or anything not listed stay on manual countdown.
- Next copy: Manual countdown works tonight. Remote Start only appears when a safe local Play path exists.

## Runtime helper variants when kill switch is on

- Streaming boxes stay on manual countdown tonight.
- TV apps stay on manual countdown tonight.
- Manual countdown works tonight. Remote Start setup is not available for this session.

## Selected hint

- Good. `{methodNextCopy}`

---

# Remote Start Step 2 — device choice cards

## Heading / locked state

- Step 2
- Which device is it?
- Pick how you watch first
- Tap the closest match. Nothing connects until you choose one and save/test it.
- This step unlocks after Step 1 so the app does not default to any device.
- Choose TV app, streaming stick/box, or not sure above.

## Device cards

### Roku / Roku TV

- Badge: Remote Start beta / primary
- Icon: ▣
- Setup preview: Start here for Roku devices: enter the Roku IP, save, then Test Play.
- Next copy: Pick Roku if your TV or streaming stick says Roku.
- Watching methods: TV app built into my TV; Streaming stick or box

### Fire TV / Android TV / Google TV

- Badge: Guided setup beta
- Icon: F
- Setup preview: Connect over local debugging/pairing, approve the TV prompt, then Test Play.
- Next copy: Pick this for Fire TV, Firestick, Android TV, Google TV, Chromecast with Google TV, or Google TV Streamer.
- Watching methods: TV app built into my TV; Streaming stick or box

### VIZIO TV

- Badge: Remote Start beta
- Icon: V
- Setup preview: Pair with the TV code, save the auth token locally, then Test Play.
- Next copy: Pick this for VIZIO TVs using the built-in TV streaming app.
- Watching methods: TV app built into my TV

### LG TV

- Badge: Remote Start beta / primary
- Icon: LG
- Setup preview: Pair on the TV prompt, save the local client key, then Test Play.
- Next copy: Pick this for LG webOS smart TVs.
- Watching methods: TV app built into my TV

### Samsung TV

- Badge: Remote Start beta
- Icon: S
- Setup preview: Approve the TV prompt/token if shown, then Test Play.
- Next copy: Pick this for Samsung/Tizen smart TVs.
- Watching methods: TV app built into my TV

### Sony Bravia TV

- Badge: Remote Start beta for supported Sony TVs
- Icon: B
- Setup preview: Enable IP Control on supported Bravia models, then discover/test Play.
- Next copy: Pick this for Sony Bravia TVs with IP Control.
- Watching methods: TV app built into my TV

### Other / console / cable box

- Badge: Manual-only
- Icon: ?
- Setup preview: No direct Remote Start path yet. Use manual countdown tonight.
- Next copy: If your device is not listed, use manual countdown. It is available with any TV.
- Watching methods: Game console / cable box / not sure

## Selected hint

- Selected: `{selectedRemoteChoice.title}`. `{selectedRemoteChoice.nextCopy}`

---

# Remote Start Step 3 — common connect wizard UI

## Empty state

- Step 3 · Connect it
- No device selected yet
- Pick how you are watching, then pick the exact TV/streaming device. The connection steps and buttons will appear after that.

## Wizard common labels

- Step 3 · Connect it
- Show setup details
- Hide setup details
- TV setting
- Reconnect expectation
- GO command
- Pause / toggle policy
- What next:
- Enter the local details below → Save setup → Test Play → enable GO Play if it works.

---

# Remote Start Step 3 — platform wizard text

## Roku / Roku TV setup

- Label: Remote Start beta / primary
- Summary: First internal Remote Start lane: local Roku ECP Play at GO after the user opens and pauses the title.
- Steps:
  1. Keep this device and your Watch Sync helper on the same Wi-Fi/LAN.
  2. If keypresses fail, enable Roku Control by mobile apps / Network access in TV settings.
  3. Enter the Roku IP or hostname, save locally, then Test Play before movie night.
- TV setting: May require Control by mobile apps / Network access on newer Roku OS builds.
- Reconnect expectation: No token pairing. Reliability depends on LAN access, device reachability, and IP/discovery.
- GO command: Play only
- Pause policy: Pause is not exposed as a safe automatic command. Pause manually at 00:00.
- Toggle policy: No Play/Pause toggle at GO and no blind retries.
- Primary action: Check Roku
- Public copy: Roku Remote Start beta sends one local Play command at GO. Manual countdown remains available as fallback.

## LG webOS setup

- Label: Remote Start beta / primary
- Summary: Pair with the TV prompt, save the LG client key locally, then test discrete Play/Pause.
- Steps:
  1. Enter the LG TV IP or hostname and keep the helper on the same LAN.
  2. Run Pair/Test and accept the pairing prompt on the TV.
  3. Save the client key locally, then Test Play/Pause before movie night.
- TV setting: LG Connect Apps / TV prompt pairing may be required.
- Reconnect expectation: Client key is expected to persist but must be hardware-validated after sleep/reboot/helper restart.
- GO command: SSAP media.controls/play only
- Pause policy: Discrete Pause exists for test/setup; GO still sends Play only.
- Toggle policy: No Play/Pause toggle at GO.
- Primary action: Pair TV
- Public copy: LG webOS Remote Start beta uses local TV pairing. Hardware behavior is not verified yet.

## Samsung Tizen setup

- Label: Remote Start beta
- Summary: Beta local-key path after Samsung TV approval/token when required; model variance expected.
- Steps:
  1. Enter the Samsung TV IP or hostname and optional protocol URL/token if already known.
  2. Run Pair/Test and approve the TV prompt if shown.
  3. Save the token locally, then Test Play/Pause on a paused video.
- TV setting: TV approval prompt/token may be required; ports and behavior vary by model/firmware.
- Reconnect expectation: Token persistence is model-dependent and hardware-unverified.
- GO command: KEY_PLAY only
- Pause policy: KEY_PAUSE is available for testing where it behaves discretely.
- Toggle policy: Do not use KEY_PLAYPAUSE at GO.
- Primary action: Pair TV
- Public copy: Samsung Remote Start beta is for supported TVs after local approval; not official universal support.

## Fire / Android / Google TV guided setup

- Label: Guided setup beta
- Summary: Guided ADB beta for Fire OS, Android TV, Google TV, Nvidia Shield, Onn, Chromecast with Google TV, and Google TV Streamer. Fire TV Vega is not supported yet.
- Steps:
  1. Open Developer Options / debugging on the TV or streamer.
  2. Enter the device IP/port or wireless debugging pairing code flow, then approve the prompt.
  3. Run Connect ADB + Test Play. Some devices may need reconnect before movie night.
- TV setting: Developer Options, ADB/wireless debugging, and an approval prompt are required.
- Reconnect expectation: May persist with stable ADB keys, but sleep/reboot/network changes remain hardware-unverified.
- GO command: KEYCODE_MEDIA_PLAY only
- Pause policy: KEYCODE_MEDIA_PAUSE is available for setup/testing; GO uses Play only.
- Toggle policy: KEYCODE_MEDIA_PLAY_PAUSE / 85 is blocked for GO.
- Primary action: Connect ADB
- Public copy: Guided setup beta. Some devices may need reconnect. Manual countdown remains available as fallback.

## Sony Bravia setup

- Label: Remote Start beta for supported Sony TVs
- Summary: Supported Bravia/IP Control models can use local IRCC Play after IP Control and Play-code discovery.
- Steps:
  1. Enable IP Control on the supported Sony Bravia TV and configure PSK/PIN if needed.
  2. Enter the TV IP/hostname and run remote-controller-info to discover the Play IRCC code.
  3. Save the Play IRCC code locally, then Test Play before movie night.
- TV setting: IP Control must be enabled and supported by the model; PSK/PIN may be required.
- Reconnect expectation: Expected to persist while IP Control/PSK remain stable, but hardware validation is required.
- GO command: Discovered Play IRCC code only
- Pause policy: Pause is not exposed as safe in the current panel.
- Toggle policy: No toggle command at GO.
- Primary action: Discover Play code
- Public copy: Remote Start beta for supported Sony TVs only. Do not imply all Sony Google TVs work.

## Philips JointSpace later beta

- Label: Later beta
- Summary: Later/experimental only because common paths expose PlayPause toggle risk.
- Steps:
  1. Use manual countdown tonight.
  2. Only revisit this adapter after primary lanes are validated.
  3. Do not enable automatic GO unless a discrete Play path is proven.
- TV setting: Model/API-generation settings vary.
- Reconnect expectation: Unknown.
- GO command: None for automatic GO
- Pause policy: Toggle-risk pause/play is not safe for automatic setup.
- Toggle policy: PlayPause toggle is not allowed for GO.
- Primary action: Use manual countdown
- Public copy: Later beta only; manual countdown remains the public path.

## VIZIO Remote Start Beta

- Label: Remote Start beta
- Summary: Watch Sync will pair with your VIZIO TV and test one Play command. Remote Start is only enabled if the test starts your paused video.
- Steps:
  1. Open the streaming app directly on your VIZIO TV; do not use phone/tablet/computer casting for this beta.
  2. Enter the TV IP, start pairing, then enter the newest code shown on the TV.
  3. Test Play sends one Play command; use Manual Play tonight if it does not start the paused video.
- TV setting: Your VIZIO TV will show a code during pairing.
- Reconnect expectation: Auth token is stored locally after pairing and must be hardware-validated by model.
- GO command: VIZIO key_command Play only
- Pause policy: Pause is not part of GO. Keep the video paused manually after Test Play confirmation.
- Toggle policy: No app launch, title launch, Cast takeover, or Play/Pause toggle at GO.
- Primary action: Pair with TV code
- Public copy: VIZIO Remote Start Beta tests one local Play command only after direct-TV-app setup.

## Home Assistant bridge

- Label: Not supported yet
- Summary: Not a D2C default. Only use if a user already has local Home Assistant automation.
- Steps:
  1. Use manual countdown unless you already run HA locally.
  2. Keep webhook URLs local/private.
  3. Do not present HA/Broadlink/CEC as default consumer setup.
- TV setting: External bridge setup outside Watch Sync.
- Reconnect expectation: Depends on the user bridge.
- GO command: User-owned automation only
- Pause policy: Depends on bridge; not public support.
- Toggle policy: User automation must avoid toggle-risk GO.
- Primary action: Use manual countdown
- Public copy: Not a default consumer path.

## Apple TV

- Label: Manual-only
- Summary: Manual-only by default. No public App-Store-safe direct-control path is proven.
- Steps:
  1. Open the title on Apple TV yourself.
  2. Pause at 00:00.
  3. Use the Watch Sync countdown and press Play manually at GO.
- TV setting: None for Watch Sync public control.
- Reconnect expectation: No public Watch Sync pairing. Reverse-engineered pairing is not headline support.
- GO command: None
- Pause policy: Manual pause only.
- Toggle policy: No private Apple APIs and no reverse-engineered public headline claim.
- Primary action: Use manual countdown
- Public copy: Apple TV stays manual-only unless an explicit internal beta is accepted later.

---

# Advanced exact-platform dropdown

Label / aria:

- Advanced: exact platform
- TV remote platform

Options shown by current source option list:

- Roku / Roku TV — Remote Start beta / primary
- LG webOS — Remote Start beta / primary
- Samsung / Tizen — Remote Start beta
- Sony / Bravia — Remote Start beta for supported Sony TVs
- Fire TV / Android TV / Google TV — Guided setup beta
- Philips JointSpace — Later beta
- VIZIO TV — Remote Start beta
- Home Assistant local bridge — Not supported yet
- Apple TV — Manual-only

Platform picker note template:

- `{label} · {helperLabel if present} · {status}`

---

# Remote Start setup fields

## Home Assistant

- Home Assistant webhook URL
- http://homeassistant.local:8123/api/webhook/REPLACE_WITH_RANDOM_ID
- Home Assistant webhook URL

## Host / IP

- ADB device host[:port]
- TV IP / hostname
- 192.168.1.50:5555
- 192.168.1.42
- TV IP address or hostname

## Helper URL

- Helper URL
- http://127.0.0.1:8790
- TV remote helper URL

## Protocol override

- Protocol URL override
- Optional: ws://tv:3000 or http://tv:1925
- Protocol URL override

## Pairing / tokens

- LG client key
- Samsung token
- Vizio auth token
- Stored locally only
- Local pairing token

## Sony-specific

- Sony PSK (if enabled)
- Optional local PSK
- Sony PSK
- Sony Play IRCC code
- From remote-controller-info
- Sony Play IRCC code

## Philips-specific

- JointSpace API version
- Philips JointSpace API version

---

# Remote Start setup actions / readiness copy

## Next line

- Next:
- Enter the device details above, then save setup.
- Save setup, test Play, then enable GO Play only if the test works.

## Primary actions

- Save setup after details
- Save setup
- Test Play after details
- Use manual countdown
- Check Roku
- Pair TV
- Connect ADB
- Discover Play code
- Pair with TV code

## Confirm Test Play result

- Did the video start?
- Pause it again before marking Remote Start ready.
- Yes — I paused it again
- No — use manual countdown

## Optional test commands

- Test Play now
- Test Pause

## GO checkbox

- 3 Enable Remote Start at GO
- Use Remote Start at GO

## Readiness status paragraph

Template:

- Readiness: `{remoteStartReadiness.label}` — `{remoteStartReadiness.reason}` GO opt-in status: `{statusCopy}` Release lane: `{tvCapability.publicClaimLevel}`; real-device evidence: `{yes|not yet}`.

GO opt-in status variants:

- enabled — a single safe Play command can be sent at GO.
- off or unavailable for unsupported/later/manual lanes — manual countdown remains active.
- test the connection first, then enable GO Play if this lane supports it.

## Readiness labels / reasons

- Manual countdown tonight — Remote Start beta is paused or not enabled for this audience; manual countdown remains available.
- Not supported yet — This platform is not currently a D2C Remote Start target.
- Manual countdown tonight — This platform stays manual-only unless a safe public control path is proven.
- Needs setup — Add the local device/helper details before enabling Remote Start.
- Needs setup — LG webOS needs TV prompt pairing and a saved client key.
- Needs setup — Sony Bravia needs IP Control enabled and a discovered Play IRCC code.
- Reconnect needed — Run Pair/Test before movie night so the helper can confirm the device is reachable.
- Device behavior not verified yet — Mock/helper checks passed, but real TV/app behavior is still hardware-unverified.
- Remote Start ready — Hardware validation and the local helper check are both current.

## Extension / TV remote status defaults and templates

- No linked TV yet. Start with how you watch, pick your device, then follow the setup steps.
- Home Assistant advanced bridge saved locally. Watch Sync servers do not store HA credentials, entity IDs, or webhook URLs.
- Apple TV saved as manual-only. Watch Sync will not send direct Apple TV commands; manual countdown remains the path.
- `{deviceLabel}` saved locally for Remote Start. Room backend still only coordinates countdown; this helper controls your local device on your LAN.
- Testing `{deviceLabel}` via local helper...
- `{deviceLabel}` Test Play sent. Confirm that the video started, then pause it again before enabling GO Play.
- `{deviceLabel}` helper check failed.
- `{deviceLabel}` is ready for 3·2·1 Play. Keep the video paused; Watch Sync will send one Play command at PLAY.
- Use manual countdown tonight. No Remote Start command will be sent at PLAY.
- Remote Start at GO is off or this platform has no safe GO Play command. Manual countdown remains the fallback.
- Add a Home Assistant webhook URL before sending GO. Manual countdown still works.
- Link a supported TV/device before sending Play. Manual countdown still works.
- Sending one Home Assistant webhook GO via local helper...
- Sending one `{deviceLabel}` Play command via local helper...
- Home Assistant webhook GO sent (`{source}`). Compatibility depends on your HA automation/integration/device/app; use manual fallback if it does not play.
- `{deviceLabel}` Play sent (`{source}`). This is a generic remote command only; use manual fallback if the TV app ignores it.
- `{deviceLabel}` Play failed. Use manual countdown.
- Sending one `{deviceLabel}` Pause command via local helper...
- `{deviceLabel}` Pause sent. This is a generic remote command only; if the app ignores it, pause manually at the sync point.
- `{deviceLabel}` Pause failed. Pause manually at the sync point.

## Local helper / safety errors

- Enter the TV remote helper URL first.
- Helper URL must be localhost, a private LAN address, or a .local host before Watch Sync sends local pairing details.
- TV remote helper returned `{status}`
- Enter a TV IP address or hostname first.
- Remote Start beta is paused or unavailable for this device. Use manual countdown tonight.
- `{deviceLabel}` is manual-only. Use the manual countdown fallback.
- Apple TV is manual-only. Watch Sync does not claim direct Apple TV remote control.
- LG TV needs a paired client key before Test Play can send one Play command.
- Sony TV needs a discovered Play IRCC code before Test Play can send one Play command.
- `{deviceLabel}` is not a public Remote Start lane. Use manual countdown.
- `{deviceLabel}` is manual-only. Watch Sync will not send remote commands.
- LG webOS needs a paired client key before GO can send Play.
- Sony Bravia needs a Play IRCC code from remote-controller-info before GO can send Play.
- Philips JointSpace PlayPause is a risky toggle, so GO will not send it automatically. Use manual countdown.
- Roku Pause is not claimed safe for this Remote Start panel. Pause manually at the sync point.
- Philips pause uses a PlayPause toggle-risk path, so Watch Sync does not expose it as safe pause.
- `{deviceLabel}` is manual-only or does not have a safe Pause command. Pause manually at the sync point.
- No safe Pause command is available for this platform.
- Enter a Home Assistant webhook URL first. Manual countdown still works.

## Compatibility mini-roadmap

- Roku / Roku TV — Remote Start beta / primary: Local ECP Play at GO; some Roku OS builds require Control by mobile apps/network access.
- LG webOS — Remote Start beta / primary: Pair on TV prompt, save client key locally, then Test Play/Pause. Hardware validation pending.
- Samsung Tizen — Remote Start beta: TV approval/token if required, Test Play/Pause. Model/firmware variance expected.
- Sony Bravia — Remote Start beta for supported Sony TVs: Enable IP Control/PSK or PIN if needed, discover Play IRCC code, then Test Play.
- Fire TV / Android TV / Google TV — Guided setup beta: Developer Options/debugging, IP or pairing code, approve prompt, Test Play, Save. Some devices may need reconnect.
- Apple TV — Manual-only: No public direct-control headline claim; reverse-engineered pairing stays internal/beta only if accepted.
- Xbox / Cable / ISP boxes / Cast-AirPlay — Manual-only: Manual countdown remains the truthful public path unless a safe account/session-specific beta is separately accepted.

## Remote Start persistent caveat

- Pairing tokens and Home Assistant webhook URLs stay in this browser/helper config, not the room backend. Watch Sync servers do not store HA credentials or entity IDs. Helper calls are limited to localhost/private LAN/.local helper URLs before local pairing details are sent. Manual countdown remains available as fallback. Hosted mobile Safari/Chrome may block local-LAN helper calls; reliable iPhone TV remote control needs a native app or local companion.

---

# Laptop auto-sync drawer

## Toggle

- Laptop auto-sync
- Supported browser tabs only

## Intro paragraph

- Manual mode works with any TV. Auto-sync only works on supported browser tabs where the Chrome extension can access an HTML5 video.

## Pairing info labels

- Room code
- Participant ID
- Join/create first
- WebSocket URL
- Copy pairing details

## Extension status

- Pairing details copied!
- Pairing details: `{details}`
- Playback: `{paused|playing}` at `{seconds}s`
- Extension paired: `{tabTitle or extensionId list}`
- Extension status: not paired yet.

---

# Room signal / event messages

- GO — press play now.
- Partner needs a pause — pause your TV now.
- Partner is buffering — pause now.
- Buffering fixed — both tap ready again.
- RESYNC — seek manually to `{timestamp}`.
- Recommended: `{title}`
- voted yes on a recommendation.
- voted no on a recommendation.
- Tonight's watch: `{title}` — pause at 00:00, then ready up.
- Next episode — pause at 00:00, then both tap ready.
- Chrome extension paired.
- Extension error: `{message}`

---

# Notes / unverified

- I did not audit server routes, Chrome extension copy, deployment bundle text, or screenshots in this inventory.
- This inventory reflects local source after the current Remote Start corrections; production may still serve an older bundle unless separately verified/deployed.
