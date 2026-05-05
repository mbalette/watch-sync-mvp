# Browser extension status

## What exists now

A Chrome Manifest V3 local MVP exists under `extension/`. It pairs a desktop Chrome tab with a Watch Sync room by injecting a content script, finding an accessible HTML5 `<video>`, and sending play/pause/seek/status messages over the local realtime WebSocket.

Use it locally by loading `extension/` as an unpacked extension in `chrome://extensions` with Developer mode enabled.

A portable local ZIP can be created with:

`npm run package:extension`

Output:

`release/watch-sync-chrome-unpacked.zip`

## Safari path

Safari support is feasible because the MVP source follows the WebExtension model, but Safari still requires Apple's conversion and native app wrapper workflow. That means full Xcode, `xcrun safari-web-extension-converter`, and signing for distribution.

Expected conversion command on a Mac with full Xcode:

`xcrun safari-web-extension-converter extension --project-location <output-folder>`

This repository/environment should not claim to produce a real Safari extension package unless that Xcode conversion succeeds. Store/TestFlight/App Store distribution requires Apple signing and account steps outside this MVP.

## MVP integration approach

No service-specific integrations are needed for the MVP. Generic HTML5 video detection/control is the first path because it works across many sites when the page exposes a controllable `<video>` element.

Site adapters can be added later only where generic video control fails and after confirming the target site's controls, iframe structure, DRM behavior, and extension permissions make an adapter viable.

## Known technical limits

- HTML5 video only.
- Autoplay, DRM, cross-origin iframes, and site-specific controls can block extension control.
- Local WebSocket by default until a hosted realtime backend exists.
- Chrome ZIP output is for local portability/testing; it is not a store submission or Safari build.
