# Watch Sync / 321 Play copy follow-up — 2026-05-09

## Verdict
Applied remaining still-relevant copy changes from `Watch-Sync-Copy-Changes.md` against local source. No deploy and no commit.

## Scope
Repo: `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`

Touched/verified files:
- `src/App.tsx`
- `src/tv-remote-device.ts`
- `src/tv-remote-device.test.ts`
- `src/transport.ts`

## Notable applied deltas
- Header room-code label changed from `ROOM CODE` to `Room code`.
- Ready count now reads `0 of 2 ready` shape instead of `0/2 ready`.
- Early Auto Play setup header now uses `Auto Play setup` / `Set up your TV`.
- Step 1 copy now asks `What do you watch on?` and explains Auto Play in plain language.
- Step 2 no longer renders a locked/disabled state before Step 1 selection; it appears only after the watch method is selected.
- Step 3 no longer renders the locked `No device selected yet` state; it appears only after a device is selected.
- Device card helper copy simplified for TV apps, streaming sticks/boxes, Roku, Fire/Android/Google TV, VIZIO, LG, Samsung, and Sony.
- Fire/Android/Google TV status changed away from `Setup beta` to `Auto Play (beta)`.
- Recommendation tabs shortened away from `Recently aired`.
- Connection failure toast copy changed to `Shared rooms reconnect automatically.` in `src/transport.ts`.
- Tests updated to match the copy/status changes.

## Verification
Commands run in `/Users/home/Desktop/kyrosworkspace/projects/watch-sync-mvp`:

```bash
npm run typecheck
npm run test:remote-start-beta
npm run lint -- --quiet
npm run build
git diff --check
```

Results:
- `npm run typecheck` — pass
- `npm run test:remote-start-beta` — pass, 23 tests
- `npm run lint -- --quiet` — pass
- `npm run build` — pass, Vite built `dist/assets/index-Co8eyUxG.js`
- `git diff --check` — pass

Targeted stale-copy grep:
- No `.tsx` matches for the old visible strings checked: `DATE NIGHT`, `Use it manually`, `Auto-sync`, `YOUR NAME`, `ROOM CODE`, `REMOTE START SETUP`, `Remote Start beta`, `Guided setup`, `Test Play`, `Recently aired`, `No device selected yet`, `This step unlocks`, `Pick how you are watching`, `Countdown Mode`, `Chat / Resync`, `PAUSE TIME`, `Tonight's queue`, `0 queued`, `ready up`, `Continue to device setup`, etc.
- Remaining `.ts` match for `Test Play` is in a test name only (`src/tv-remote-device.test.ts:640`).

## Caveats
- This is local source only. No production deploy was performed.
- The repo already had unrelated dirty/untracked files before this follow-up; I did not clean or reset them.
- Internal code symbols still use `RemoteStart*` terminology. I treated the document as user-facing copy guidance, not an internal architecture rename.
- I did not generate fresh screenshots in this follow-up pass.
