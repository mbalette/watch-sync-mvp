# Watch Sync TV Remote Mode — Subagent Synthesis

Verdict: Remote Mode can be a major product pillar if framed as “sends best-effort generic remote keys on supported TVs after everyone manually stages the stream,” not universal smart-TV/app control.

## Build order
1. Roku native iOS MVP: manual IP, Local Network permission, device-info probe, send documented Play toggle at GO.
2. LG webOS native iOS: manual IP, WebSocket pairing, store client key, send `ssap://media.controls/play` / `pause` after hardware validation.
3. Samsung experimental beta: unofficial WebSocket remote protocol, manual IP + TV approval token, `KEY_PLAY` / `KEY_PAUSE`, only after hardware matrix.
4. Cast mode as separate path for Cast-owned sessions.
5. Fire TV / Android TV ADB only as advanced/helper mode, not mainstream consumer setup.
6. Apple TV manual-only for App Store MVP; reverse-engineered helper-only if ever pursued.

## Product claim
Safe: “Works with every streaming service manually. On supported TVs, Watch Sync can press a best-effort Play/start command for you over your home Wi‑Fi after you open the show and pause at the sync point.”

Avoid: “Universal Bluetooth remote,” “controls every smart TV,” “auto-syncs Apple TV/Netflix/native apps,” “seeks both TVs automatically.”

## Architecture
Native iOS app sends LAN commands locally per participant. Backend coordinates room, ready state, countdown, and server time. Each participant’s phone controls only their own linked TV.

## Key constraints
- Wi‑Fi/LAN remote protocols are device/vendor-specific; not all TVs expose the same API.
- Bluetooth should not be claimed as a general path.
- PWA cannot reliably do LAN discovery/control because of CORS, mixed content, Private Network Access, UDP multicast restrictions, and cert issues.
- Commands are best-effort; streaming apps may ignore generic Play/Pause in some states.
