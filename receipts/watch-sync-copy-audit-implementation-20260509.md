# 321 Play Copy Audit Implementation Receipt — 2026-05-09

## Verdict
Implemented the supplied `Watch-Sync-Copy-Audit.md` against the local Watch Sync / 321 Play source in `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`.

No deploy, no commit, no production claim.

## Scope implemented
- Rebranded visible app chrome from `Watch Sync` to `321 Play`.
- Landing page simplified:
  - removed `Date night, together`;
  - removed pre-commit mode explanation card;
  - subtitle changed to `Press Play together, from anywhere.`;
  - CTA remains `Create a room`;
  - join path remains `Already invited? Enter a code` / `Join movie night`.
- Terminology cleanup:
  - `Remote Start` visible setup copy -> `Auto Play`;
  - `Guided setup` -> `Setup` / setup beta;
  - `Test Play` visible copy -> `test connection` / `Test connection`;
  - `Manual sync` removed from visible TSX copy;
  - `Auto-sync` visible copy -> `Browser sync`;
  - `Resync` -> `Sync`;
  - `Pause time` -> `Pause at`;
  - `Tonight's queue` -> `Tonight's list` / `picks`.
- In-room invite/timing copy tightened:
  - `Send the room code, then both get ready.`
  - `Both pause your video at this timestamp.`
- Auto Play setup copy changed from engineering language to user-facing flow language:
  - `What are you watching on?`
  - `One-time setup — after this, we press Play for you every movie night.`
  - `Which TV or device? Pick the one running your streaming app right now.`
- Device setup copy reduced jargon:
  - replaced visible `hostname`, `LAN`, `client key`, and `Test Play` setup copy with `TV IP address`, `same Wi‑Fi`, `pairing approval`, and `test connection` wording.
  - technical surfaces are hidden behind `Show technical details` or relabeled as advanced/local settings.
- Failure recovery added in setup flow:
  - `Retry`
  - `Try a different device`
  - `Start movie night anyway`
  - copy: `We’ll get Auto Play set up next session.`
- Browser sync panel simplified:
  - visible room code only;
  - participant ID and WebSocket URL moved behind `Show technical details`;
  - status changed to `Status: Not connected yet.`

## Files changed by this pass
- `src/App.tsx`
- `src/tv-remote-device.ts`
- `src/tv-remote-device.test.ts`
- `src/domain.ts`
- `scripts/capture-all-pages-contact-sheet.mjs`

Note: prior design-spec work had already changed `src/App.css` and `src/index.css`; those remain dirty from the previous visual pass.

## Verification
Commands run from `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`:

```bash
npm run typecheck
npm run test:remote-start-beta
npm run lint -- --quiet
npm run build
git diff --check
```

Results:
- `npm run typecheck`: PASS
- `npm run test:remote-start-beta`: PASS — 23 tests passed
- `npm run lint -- --quiet`: PASS
- `npm run build`: PASS
  - `dist/index.html` 1.04 kB gzip 0.49 kB
  - `dist/assets/index-DvcXOh4H.css` 27.35 kB gzip 6.13 kB
  - `dist/assets/index-LXacMYXW.js` 279.38 kB gzip 82.95 kB
- `git diff --check`: PASS

Copy grep check:
- No visible TSX matches for: `Date night`, `Use it manually`, `Manual sync`, `Auto-sync`, `Remote Start setup`, `Remote Start beta`, `Countdown Mode`, `Guided setup`, `Test Play`, `Try solo countdown`, `ready up`, `Tonight's queue`, `Resync`, `Continue to device setup`, `Press play now`, `Get ready to press play`, `WEBSOCKET URL`, `PARTICIPANT ID`, `hostname`, `LAN`, `client key`.
- Remaining matches are internal/test/code-level only, e.g. `parsed.hostname` and test names.

## Visual QA artifacts
Local dev URL: `http://127.0.0.1:5173/`

Fresh copy-pass contact sheet:
- `screenshots/all-pages-copy-pass-20260509/321play-copy-pass-contact-sheet-20260509.png`
- Dimensions: `774 x 2384`
- Size: `536,225` bytes
- SHA256: `15ec1d7616e207c8f6dde27129c6c073fa5e64b10b6a188df47bc42445eb70b4`

Representative individual screenshots:
- `screenshots/all-pages-copy-pass-20260509/01-landing-create-room.png`
- `screenshots/all-pages-copy-pass-20260509/02-landing-enter-code.png`
- `screenshots/all-pages-copy-pass-20260509/03-room-home.png`
- `screenshots/all-pages-copy-pass-20260509/06-remote-setup-roku.png`
- `screenshots/all-pages-copy-pass-20260509/11-countdown.png`

Mobile layout metrics from capture:
- `innerWidth`: 390
- `docScrollWidth`: 390
- `bodyScrollWidth`: 390

Vision QA samples:
- `03-room-home.png`: confirmed visible `321 Play` / `Set up Auto Play (beta)` copy; no visible `Watch Sync`, `Remote Start`, `Date night`, `manual sync`, `auto-sync`, or orange/brown.
- `06-remote-setup-roku.png`: confirmed visible setup flow avoids stale jargon (`Watch Sync`, `Remote Start`, `Date night`, `manual sync`, `auto-sync`, `Test Play`, `hostname`, `LAN`, `client key`) and presents step-based Auto Play setup rather than README-style wall copy.

## Caveats / boundaries
- The code still uses internal symbols/types such as `RemoteStart*` for implementation continuity; visible user-facing copy was the target.
- `Join movie night` was kept because the audit explicitly marked it as good copy.
- `Connection is limited. Shared rooms may not sync until the live room reconnects.` remains because it is emitted by realtime/transport status and was not fully redesigned in this pass.
- No hardware validation was performed.
- No deploy or commit was performed.
