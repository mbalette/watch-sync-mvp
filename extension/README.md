# Watch Sync local browser extension MVP

This is a local-first Chrome MV3 WebExtension for pairing a laptop browser tab's HTML5 video with a Watch Sync room. It has no extension build step and is not published to an extension store.

## Chrome: load unpacked for local testing

1. Start the local realtime server from the project root:
   `npm run dev:realtime`
2. Open Chrome and go to `chrome://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select this `extension/` folder.

## Chrome: create the local ZIP package

From the project root, run:

`npm run package:extension`

The script validates `extension/manifest.json`, checks the required extension files, excludes junk files such as `.DS_Store`, and writes:

`release/watch-sync-chrome-unpacked.zip`

For local testing, the unpacked `extension/` folder is still the fastest path. The ZIP is a portable copy of the same Chrome MVP source, not a Chrome Web Store submission package.

## Pair a tab

1. In the PWA, create or join a room.
2. Click Laptop auto-sync and copy the pairing details.
3. Open a desktop Chrome tab containing an accessible HTML5 `<video>`.
4. Open the Watch Sync extension popup.
5. Paste WebSocket URL, room code, and participant ID.
6. Click Detect video, then Pair this tab.

## Safari status

The source is WebExtension-style and should be a feasible starting point for Safari, but Safari requires Apple's native app wrapper workflow. A real Safari extension/app wrapper cannot be produced in this environment without full Xcode.

On a Mac with full Xcode installed, the conversion path is:

`xcrun safari-web-extension-converter extension --project-location <output-folder>`

Distribution beyond local development also requires Apple's signing and packaging flow. Do not treat the Chrome ZIP as a Safari extension build.

## Limitations

- Controls only pages that expose a usable HTML5 `<video>` to extension content scripts.
- Autoplay policy, DRM, cross-origin iframes, browser security rules, and site-specific controls may block play, pause, seek, or detection.
- Local WebSocket only by default: `ws://127.0.0.1:8787`; a hosted backend is needed for internet-scale use.
- No service-specific integrations are included in the MVP.
- No smart-TV/native app/Netflix TV control.
- Not a production-hosted realtime system and not a Chrome Web Store extension.
