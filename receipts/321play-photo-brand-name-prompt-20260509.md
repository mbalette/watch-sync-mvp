# 321 Play photo brand-name prompt receipt — 2026-05-09

## Verdict

Added a clear, user-facing prompt to the visual/photo-ID flow telling users to make sure the TV or remote brand name is visible when taking or choosing a photo.

## Changed

- `src/AppFlow.tsx`
  - Step 1 photo card now says: `Make sure the brand name is clearly showing.`
  - Photo bottom sheet now says: `Make sure the TV or remote brand name is clearly showing.`

## Verification

```text
npm run typecheck -> pass
npm run lint -- --quiet -> pass
npm run build:prod -> pass
```

Build asset produced during verification:

```text
dist/assets/index-tZJE0DQr.js
```

## Scope

- Copy-only prompt addition.
- No photo ID backend/API/Anthropic/storage wiring.
- No change to default realtime room route.
- Visual/photo-ID flow remains behind `?visual=1`.
