# 321 Play — Camera Device Identification

**Feature:** Take a photo of your TV or remote → we identify the device → auto-route to the correct setup wizard.

---

## Why

Most users don't know if they have "LG webOS" or "Samsung Tizen." They know they have a TV and a remote. Asking them to pick from a list of platform names is the biggest friction point in onboarding. A photo solves it in one tap.

No competitor does this. It's a "wow" moment in the first 30 seconds.

## Cost

~$0.003 per call (one third of a penny). Using Claude Haiku 4.5 vision API.

- Image input: ~1,500–2,000 tokens ($0.002)
- Text prompt: ~200 tokens ($0.0002)
- Response: ~150 tokens ($0.00075)
- **Total per identification: ~$0.003**
- At 10,000 users: ~$30
- At 100,000 users: ~$300

This is negligible. Do not optimize for cost here.

---

## UX flow

### Step 1 screen (updated)

```
STEP 1
What do you watch on?

┌─────────────────────────────────────┐
│  📷  Take a photo of your TV       │
│  or remote — we'll figure it out   │
└─────────────────────────────────────┘

or pick manually:

[TV app built into my TV]
[Streaming stick or box]
[Console / cable / other]
```

Photo option is the hero — largest, most prominent element. Manual selection is the fallback below it.

### Photo capture

Open native iOS camera. User takes photo of one of:
- Their TV (brand logo on bezel, or on-screen interface visible)
- Their remote (shape, buttons, branding)
- Their streaming device (Roku stick, Fire stick, Chromecast, Apple TV box)

Any of these works. The prompt handles all three.

### Loading state

```
Identifying your device...
```

Show for 1-2 seconds (API response is fast with Haiku).

### Confirmation screen

```
┌─────────────────────────────────────┐
│                                     │
│  Looks like a Roku TV.              │
│                                     │
│  [Yes — set up Roku]                │
│  [No — let me pick manually]        │
│                                     │
└─────────────────────────────────────┘
```

ALWAYS confirm before routing. Never auto-route without user confirmation — if the AI gets it wrong and dumps them into the wrong setup wizard, that's worse than asking.

### Low confidence handling

If the API returns `"confidence": "low"`:

```
┌─────────────────────────────────────┐
│                                     │
│  We're not sure — the photo         │
│  was hard to read.                  │
│                                     │
│  [Try another photo]                │
│  [Pick manually instead]            │
│                                     │
└─────────────────────────────────────┘
```

Don't guess when unsure. Fall back to manual gracefully.

### After confirmation

Route directly to the correct device setup wizard (Roku setup, LG setup, Fire TV setup, etc). Skip Step 2 device selection entirely — they already confirmed their device.

---

## Device preference tiers

Not all devices are equal for us. The AI should steer users toward the devices WE support best, not just identify what they have.

### Tier ranking

| Tier | Devices | Why | Setup time |
|---|---|---|---|
| 1 (best) | Roku / Roku TV | Cleanest API path, fastest setup, most reliable | ~1 min |
| 2 (good) | LG TV, Samsung TV, VIZIO TV | One-time pairing, solid support | ~2 min |
| 3 (works) | Fire TV / Android TV / Google TV | Works well but needs Developer Options, more friction | ~5 min |
| 4 (limited) | Sony Bravia | Needs IP Control enabled, limited model support | ~5 min |
| 5 (manual only) | Apple TV, cable boxes, game consoles, generic Chromecast | No Auto Play path. Manual countdown only. | N/A |

### Steering logic

The AI identifies the device, but we add a server-side preference layer AFTER the API response. The AI just identifies — your server steers.

```javascript
const DEVICE_TIERS = {
  "roku":        { tier: 1, steer: true,  message: null },
  "lg":          { tier: 2, steer: true,  message: null },
  "samsung":     { tier: 2, steer: true,  message: null },
  "vizio":       { tier: 2, steer: true,  message: null },
  "fire_tv":     { tier: 3, steer: true,  message: "Takes about 5 min to set up, but worth it." },
  "android_tv":  { tier: 3, steer: true,  message: "Takes about 5 min to set up, but worth it." },
  "google_tv":   { tier: 3, steer: true,  message: "Takes about 5 min to set up, but worth it." },
  "sony":        { tier: 4, steer: true,  message: "Limited model support. Setup may vary." },
  "apple_tv":    { tier: 5, steer: false, message: "Apple TV doesn't support Auto Play yet." },
  "chromecast":  { tier: 5, steer: false, message: "Chromecast doesn't support Auto Play yet." },
  "cable_box":   { tier: 5, steer: false, message: "Cable boxes don't support Auto Play yet." },
  "game_console":{ tier: 5, steer: false, message: "Consoles don't support Auto Play yet." },
  "other":       { tier: 5, steer: false, message: null }
};
```

### Multi-device steering (the key feature)

When a photo shows multiple devices OR when we detect a Tier 5 device, steer them toward something better.

**Scenario: Photo shows Apple TV remote**
```
┌─────────────────────────────────────┐
│                                     │
│  That looks like an Apple TV        │
│  remote.                            │
│                                     │
│  Apple TV doesn't support Auto      │
│  Play yet — you'd have to press     │
│  Play manually every time.          │
│                                     │
│  Do you also have a smart TV        │
│  (Roku, LG, Samsung, etc.)?        │
│  Auto Play works best with those.   │
│                                     │
│  [Take another photo]               │
│  [Pick my device manually]          │
│  [Use Apple TV anyway (manual)]     │
│                                     │
└─────────────────────────────────────┘
```

**Scenario: Photo shows Samsung TV with Apple TV box**
```
┌─────────────────────────────────────┐
│                                     │
│  Looks like you have a Samsung TV   │
│  with an Apple TV.                  │
│                                     │
│  Good news — your Samsung TV        │
│  supports Auto Play. We'll press    │
│  Play for you automatically.        │
│                                     │
│  The Apple TV doesn't support       │
│  Auto Play yet, so let's use your   │
│  Samsung's built-in apps instead.   │
│                                     │
│  [Set up Samsung TV]                │
│  [Use Apple TV anyway (manual)]     │
│                                     │
└─────────────────────────────────────┘
```

**Scenario: Photo shows Roku remote**
```
┌─────────────────────────────────────┐
│                                     │
│  Looks like a Roku.                 │
│  Great pick — fastest Auto Play     │
│  setup, about 1 minute.             │
│                                     │
│  [Yes — set up Roku]                │
│  [No — pick manually]               │
│                                     │
└─────────────────────────────────────┘
```

Notice: Tier 1 devices get positive reinforcement ("Great pick — fastest setup"). Tier 3 devices get an honest time estimate. Tier 5 devices get steered away.

### Steering copy by tier

| Tier | Confirmation copy |
|---|---|
| 1 | "Great pick — fastest Auto Play setup, about 1 minute." |
| 2 | "Supports Auto Play. One-time pairing, about 2 minutes." |
| 3 | "Supports Auto Play. One-time setup, about 5 minutes — needs Developer Options." |
| 4 | "May support Auto Play on some models. Setup takes about 5 minutes." |
| 5 | "[Device] doesn't support Auto Play yet. Do you also have a smart TV? Auto Play works best with those." |

### The redirect pitch for Tier 5 users

If a user has ONLY a Tier 5 device (Apple TV, console, cable box) and nothing else:

```
┌─────────────────────────────────────┐
│                                     │
│  [Device] doesn't support Auto      │
│  Play yet.                          │
│                                     │
│  You can still use 321 Play —       │
│  you'll both press Play on the      │
│  countdown together. It works       │
│  great, just not automatic.         │
│                                     │
│  [Continue with manual countdown]   │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Have a different TV or streaming   │
│  device? Auto Play might work       │
│  with it.                           │
│                                     │
│  [Check another device]             │
│                                     │
└─────────────────────────────────────┘
```

Don't dead-end them. Manual countdown still works — they just don't get the automatic press. Frame it as "works great, just not automatic" not "sorry, your device sucks."

---

## API implementation

### Endpoint

```
POST https://api.anthropic.com/v1/messages
```

### Model

```
claude-haiku-4-5-20251001
```

Use Haiku, not Sonnet. Haiku is more than capable of reading a brand logo on a remote. No need to pay 3x for this task.

### Request

```javascript
const identifyDevice = async (photoBase64) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: photoBase64
            }
          },
          {
            type: "text",
            text: `Identify ALL TVs, remotes, and streaming devices visible in this photo.

Return ONLY valid JSON, no other text:
{
  "devices": [
    {
      "device_type": "roku | fire_tv | android_tv | google_tv | chromecast | lg | samsung | sony | vizio | apple_tv | cable_box | game_console | other",
      "device_name": "Human readable, e.g. Roku Streaming Stick or LG Smart TV",
      "brand": "Brand name if visible",
      "is_remote": true,
      "is_tv": false,
      "is_streaming_device": false,
      "confidence": "high | medium | low"
    }
  ],
  "best_device": "device_type of the device most likely used for streaming apps",
  "multiple_devices_detected": true,
  "photo_quality": "good | poor | unrelated"
}

If multiple devices are visible (e.g. a Samsung TV with an Apple TV box on the shelf), list ALL of them. Set best_device to whichever is most commonly used for streaming apps.

If the photo is unclear or shows no TV/remote/streaming device, return:
{"devices": [], "best_device": null, "multiple_devices_detected": false, "photo_quality": "unrelated"}`
          }
        ]
      }]
    })
  });

  const data = await response.json();
  const text = data.content[0].text;
  const result = JSON.parse(text.replace(/```json|```/g, "").trim());

  // Apply device preference steering (server-side, not in the AI prompt)
  return applyDevicePreference(result);
};

// Device tier system — steer users toward our best-supported devices
const DEVICE_TIERS = {
  "roku":         { tier: 1, autoPlay: true,  label: "Roku" },
  "lg":           { tier: 2, autoPlay: true,  label: "LG TV" },
  "samsung":      { tier: 2, autoPlay: true,  label: "Samsung TV" },
  "vizio":        { tier: 2, autoPlay: true,  label: "VIZIO TV" },
  "fire_tv":      { tier: 3, autoPlay: true,  label: "Fire TV" },
  "android_tv":   { tier: 3, autoPlay: true,  label: "Android TV" },
  "google_tv":    { tier: 3, autoPlay: true,  label: "Google TV" },
  "sony":         { tier: 4, autoPlay: true,  label: "Sony TV" },
  "apple_tv":     { tier: 5, autoPlay: false, label: "Apple TV" },
  "chromecast":   { tier: 5, autoPlay: false, label: "Chromecast" },
  "cable_box":    { tier: 5, autoPlay: false, label: "cable box" },
  "game_console": { tier: 5, autoPlay: false, label: "console" },
  "other":        { tier: 5, autoPlay: false, label: "device" }
};

const applyDevicePreference = (aiResult) => {
  if (!aiResult.devices || aiResult.devices.length === 0) {
    return { ...aiResult, recommendation: "manual_pick" };
  }

  // Sort detected devices by our preference tier
  const ranked = aiResult.devices
    .map(d => ({ ...d, tier: DEVICE_TIERS[d.device_type]?.tier || 5 }))
    .sort((a, b) => a.tier - b.tier);

  const best = ranked[0];
  const hasAutoPlayDevice = ranked.some(d => d.tier <= 4);
  const hasManualOnlyDevice = ranked.some(d => d.tier === 5);

  return {
    ...aiResult,
    recommended_device: best,
    has_better_option: hasAutoPlayDevice && hasManualOnlyDevice,
    steer_away_from: ranked.filter(d => d.tier === 5),
    steer_toward: ranked.filter(d => d.tier <= 4)[0] || null
  };
};
```

### Response mapping

Map the recommended device to your setup wizards:

```javascript
const SETUP_ROUTES = {
  "roku":        "roku_setup",
  "fire_tv":     "fire_android_google_setup",
  "android_tv":  "fire_android_google_setup",
  "google_tv":   "fire_android_google_setup",
  "lg":          "lg_setup",
  "samsung":     "samsung_setup",
  "sony":        "sony_setup",
  "vizio":       "vizio_setup"
  // Tier 5 devices don't have setup routes — they get the steering screen
};
```

---

## What the AI can identify

### From a remote (highest accuracy)

| Remote | Distinguishing features |
|---|---|
| Roku | Purple buttons, distinctive flat shape, dedicated streaming buttons |
| Fire TV (Alexa) | Alexa button, microphone icon, Amazon branding |
| Apple TV (Siri) | Silver/black minimal design, clickpad/touchpad, Siri button |
| Samsung Smart | Slim, minimal buttons, Samsung logo |
| LG Magic | Pointer-style, scroll wheel, LG branding |
| Sony | Standard IR shape, Sony branding |
| VIZIO | VIZIO branding, smartcast button |
| Cable/satellite | Large button grid, number pad, DVR buttons |
| Game controller | Xbox/PlayStation shape — obvious |

### From a TV screen (medium accuracy)

| TV interface | Distinguishing features |
|---|---|
| Roku TV | Purple/dark UI, Roku home grid |
| Fire TV | Dark blue UI, Fire TV home row |
| webOS (LG) | Bottom launcher bar, webOS cards |
| Tizen (Samsung) | Samsung smart hub, app row |
| Google TV | Google TV recommendations UI |
| Apple TV | tvOS grid, Apple styling |

### From a TV bezel (medium accuracy)

Brand logos: LG, Samsung, Sony, VIZIO, TCL, Hisense — usually visible on the bottom bezel. May need to combine with remote or screen info for setup path.

### From a streaming device (high accuracy)

| Device | Distinguishing features |
|---|---|
| Roku stick/box | Purple tab, Roku branding |
| Fire TV Stick | Amazon/Fire branding, USB-stick form factor |
| Chromecast / Google TV | Google branding, puck/dongle shape |
| Apple TV box | Small black/silver box, Apple logo |

---

## Image optimization

Before sending to the API, resize the photo to reduce tokens and speed up the call:

```javascript
const optimizePhoto = (imageFile) => {
  // Resize to max 1024px on longest side
  // Convert to JPEG at 80% quality
  // This keeps the image readable while minimizing tokens
  // A 1024px JPEG is ~1,500 tokens vs ~4,000+ for a full-res photo
};
```

Target: max 1024px longest side, JPEG 80% quality. Anything higher is wasting tokens — Haiku doesn't need 4K to read "ROKU" on a remote.

---

## Edge cases

| Scenario | Handling |
|---|---|
| Photo is blurry/dark | Low confidence → "Try another photo" |
| Photo shows multiple devices | Identify all, steer toward highest-tier device |
| Photo shows only a Tier 5 device | Steer: "Do you also have a smart TV? Auto Play works best with those." |
| Photo shows Tier 5 + Tier 1-4 | Steer toward supported one: "Let's use your [Roku]" |
| Photo is not a TV/remote at all | `photo_quality: "unrelated"` → fall back to manual |
| Photo shows just a wall/ceiling | Same as above |
| User takes photo of their phone | "That looks like a phone — take a photo of your TV or remote instead" |
| TV brand visible but platform unclear | "Is that a [Brand] smart TV using built-in apps, or do you use a separate streaming device?" |

### Multi-device steering examples

**Samsung TV + Apple TV box (common setup):**
```
We found a Samsung TV and an Apple TV.

Your Samsung TV supports Auto Play —
we can press Play for you automatically.

Apple TV doesn't support Auto Play yet,
so let's use your Samsung's built-in
streaming apps instead.

[Set up Samsung TV]       ← primary CTA
[Use Apple TV (manual)]   ← secondary text link
```

**Roku + Fire TV (both supported, different tiers):**
```
We found a Roku and a Fire TV.

Roku is the fastest Auto Play setup —
about 1 minute.

Fire TV works too but takes about 5 min
and needs Developer Options enabled.

[Set up Roku]             ← primary CTA
[Set up Fire TV instead]  ← secondary
```

**Only Apple TV:**
```
That looks like an Apple TV.

Apple TV doesn't support Auto Play yet.
You can still use 321 Play — you'll both
press Play on the countdown together.

Do you also have a smart TV (Roku, LG,
Samsung)? Auto Play works great with
those — even if you normally use Apple TV.

[Check another device]
[Continue without Auto Play]
```

**Only Xbox/PlayStation:**
```
Looks like an [Xbox/PlayStation].

Consoles don't support Auto Play yet.
You'll press Play on the countdown
together — works great, just not automatic.

Have a smart TV or streaming stick too?

[Check another device]
[Continue without Auto Play]
```

---

## Security

- Do NOT send the photo to any third-party service other than the Anthropic API
- Do NOT store the photo after identification — process and discard
- Do NOT log the image content server-side
- The Anthropic API does not retain input data for training (per their data policy)
- Add a one-line privacy note below the camera button: "Photo is used to identify your device only. Not saved."

---

## Where this runs

The API call should go through YOUR server, not directly from the client. The client sends the photo to your backend, your backend calls Anthropic, and returns the result. This keeps your API key server-side.

```
iPhone camera → your server → Anthropic API → your server → iPhone (result)
```

---

## Priority

This is a nice-to-have for v1 launch but a strong differentiator. If it delays launch, ship without it and add it in v1.1. The manual selection flow works fine — this just makes it better.

If you build it: add it to the onboarding flow only. Don't offer it for device changes mid-session — the manual picker is fine for that since they already know what device they have by then.
