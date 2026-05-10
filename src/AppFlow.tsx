/**
 * AppFlow — stateful screen-by-screen flow.
 * Visual-only: no backend, payment, or photo-storage wiring.
 * Reuses ref-* CSS from reference-screens.css.
 *
 * Manual category taps advance immediately (no Next gate, no repeated
 * "What do you watch on?" screen). Manual console/cable/other goes to a
 * dedicated manual-unsupported screen, NOT Apple TV detected. Apple TV
 * detected is reachable only from the photo-detection demo path.
 */

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import "./reference-screens.css";
import "./app-flow.css";
import { createParticipant, createRoom, type RoomState } from "./domain";

type AppScreen =
  | "landing"
  | "step1-photo"
  | "photo-sheet"
  | "photo-detect-picker"
  | "step2-device"
  | "device-setup"
  | "test-confirm"
  | "result-success"
  | "result-fail"
  | "detected-device"
  | "manual-unsupported"
  | "countdown-auto"
  | "countdown-manual"
  | "post-title"
  | "tracker"
  | "paywall"
  | "browse"
  | "tonights";

type CategoryId = "tv-builtin" | "streaming-stick" | "console-other";
type DeviceId =
  | "roku"
  | "fire"
  | "google"
  | "lg"
  | "samsung"
  | "vizio"
  | "sony";
type DetectedDeviceId = DeviceId | "apple-tv" | "unknown";

interface CategoryOption {
  id: CategoryId;
  name: string;
  description: string;
  glyph: ReactNode;
}

interface DeviceOption {
  id: DeviceId;
  name: string;
}

interface BrowseTitle {
  id: string;
  title: string;
  meta: string;
  initial: string;
}

interface SetupGuide {
  eyebrow: string;
  title: string;
  sub: string;
  steps: Array<{
    title: string;
    body: string;
    badge?: string;
    inputLabel?: string;
    inputValue?: string;
    helperAction?: string;
  }>;
  primaryAction: string;
  failureHint: string;
}

interface DetectedDevice {
  id: DetectedDeviceId;
  brand: string;
  fullName: string;
  support: "beta" | "manual-only";
  body: string;
  glyph: "tv" | "stick" | "fire" | "apple-tv" | "unknown";
}

const CATEGORY_GLYPHS = {
  tv: (
    <svg viewBox="0 0 24 24" className="ref-glyph" aria-hidden="true">
      <rect
        x="3.5"
        y="5"
        width="17"
        height="11"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9 19h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  stick: (
    <svg viewBox="0 0 24 24" className="ref-glyph" aria-hidden="true">
      <rect
        x="9"
        y="4"
        width="6"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="20" r="0.9" fill="currentColor" />
    </svg>
  ),
  console: (
    <svg viewBox="0 0 24 24" className="ref-glyph" aria-hidden="true">
      <rect
        x="3"
        y="9"
        width="18"
        height="8"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="8" cy="13" r="0.9" fill="currentColor" />
      <circle cx="11" cy="13" r="0.9" fill="currentColor" />
      <circle cx="16" cy="11.5" r="0.9" fill="currentColor" />
      <circle cx="16" cy="14.5" r="0.9" fill="currentColor" />
    </svg>
  ),
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: "tv-builtin",
    name: "TV app built into my TV",
    description: "Your TV's built-in streaming apps.",
    glyph: CATEGORY_GLYPHS.tv,
  },
  {
    id: "streaming-stick",
    name: "Streaming stick or box",
    description: "Roku, Fire TV, Android TV, etc.",
    glyph: CATEGORY_GLYPHS.stick,
  },
  {
    id: "console-other",
    name: "Console / cable / other",
    description: "More devices coming soon.",
    glyph: CATEGORY_GLYPHS.console,
  },
];

const DEVICE_OPTIONS: DeviceOption[] = [
  { id: "roku", name: "Roku / Roku TV" },
  { id: "fire", name: "Fire TV / Fire TV Stick" },
  { id: "google", name: "Google TV / Android TV" },
  { id: "lg", name: "LG TV" },
  { id: "samsung", name: "Samsung TV" },
  { id: "vizio", name: "VIZIO TV" },
  { id: "sony", name: "Sony TV" },
];

const SETUP_GUIDES: Record<DeviceId, SetupGuide> = {
  roku: {
    eyebrow: "Roku setup",
    title: "Connect your Roku",
    sub: "Same network + Roku mobile control.",
    primaryAction: "Check Roku",
    failureHint:
      "Check that Roku mobile-app control is enabled and the Roku is reachable on your home network.",
    steps: [
      {
        title: "Same Wi‑Fi",
        body: "Phone/helper and Roku must be on the same home network.",
        badge: "Same network",
      },
      {
        title: "Allow mobile control",
        body: "On Roku: Settings → System → Advanced system settings → Control by mobile apps → Permissive.",
      },
      {
        title: "Roku IP address",
        body: "Find it at Settings → Network → About, then test the local helper.",
        inputLabel: "Roku IP address",
        inputValue: "192.168.1.142",
        helperAction: "Find Roku automatically",
      },
    ],
  },
  fire: {
    eyebrow: "Fire TV setup",
    title: "Pair Fire TV debugging",
    sub: "Advanced helper path — not just Wi‑Fi/IP.",
    primaryAction: "Connect ADB",
    failureHint:
      "Check Developer Options, wireless debugging, pairing approval, and that the local helper can run ADB.",
    steps: [
      {
        title: "Turn on Developer Options",
        body: "On Fire TV, enable Developer Options for this device.",
      },
      {
        title: "Enable ADB debugging",
        body: "Turn on ADB or Wireless Debugging, then approve the pairing prompt/code.",
      },
      {
        title: "Pair local helper",
        body: "Use the helper to pair with the Fire TV and send KEYCODE_MEDIA_PLAY at GO.",
        inputLabel: "Fire TV host or pair code",
        inputValue: "firetv.local:5555",
        helperAction: "Pair ADB helper",
      },
    ],
  },
  google: {
    eyebrow: "Google / Android TV setup",
    title: "Pair Android TV debugging",
    sub: "Wireless debugging / ADB helper path.",
    primaryAction: "Connect ADB",
    failureHint:
      "Check Developer Options, wireless debugging, pairing approval, and that the helper can send KEYCODE_MEDIA_PLAY.",
    steps: [
      {
        title: "Enable Developer Options",
        body: "On Google TV / Android TV, reveal Developer Options and enable Wireless Debugging.",
      },
      {
        title: "Pair with code",
        body: "Use the on-screen pairing code or ADB auth prompt from the TV.",
        inputLabel: "Pairing host/code",
        inputValue: "192.168.1.54:37123",
      },
      {
        title: "Test media Play",
        body: "The helper sends KEYCODE_MEDIA_PLAY only; no risky Play/Pause toggle at GO.",
        helperAction: "Test ADB Play",
      },
    ],
  },
  lg: {
    eyebrow: "LG webOS setup",
    title: "Pair your LG TV",
    sub: "TV approval prompt + saved client key.",
    primaryAction: "Pair LG webOS",
    failureHint:
      "Accept the LG TV pairing prompt and keep the saved client key on this device/helper.",
    steps: [
      {
        title: "Same network",
        body: "Phone/helper and LG TV need to be on the same local network.",
        badge: "Same network",
      },
      {
        title: "Approve TV prompt",
        body: "LG webOS shows a pairing prompt the first time Watch Sync connects.",
      },
      {
        title: "Save client key",
        body: "The helper stores the local client key and then sends webOS media Play.",
        inputLabel: "LG host or client key",
        inputValue: "lg-tv.local",
        helperAction: "Pair / test LG",
      },
    ],
  },
  samsung: {
    eyebrow: "Samsung setup",
    title: "Approve Samsung remote",
    sub: "TV approval/token path.",
    primaryAction: "Pair Samsung",
    failureHint:
      "Approve the Samsung TV remote prompt and keep the token local to the helper.",
    steps: [
      {
        title: "Same network",
        body: "Phone/helper and Samsung TV need to be on the same local network.",
        badge: "Same network",
      },
      {
        title: "Approve TV remote",
        body: "Samsung TVs may show an approval prompt and return a local token.",
      },
      {
        title: "Send KEY_PLAY",
        body: "The helper sends Samsung KEY_PLAY; avoid Play/Pause toggle for countdown GO.",
        inputLabel: "Samsung host/token",
        inputValue: "samsung.local",
        helperAction: "Pair / test Samsung",
      },
    ],
  },
  vizio: {
    eyebrow: "VIZIO TV setup",
    title: "Pair your VIZIO TV",
    sub: "Pair with TV code, then send one Test Play.",
    primaryAction: "Find my VIZIO TV",
    failureHint:
      "If pairing or Test Play fails, use manual countdown tonight and try pairing again later.",
    steps: [
      {
        title: "Start pairing",
        body: "Your VIZIO should show a short code when setup starts.",
      },
      {
        title: "Enter the code from your TV",
        body: "Type the code once. 3-2-1 Play saves this VIZIO only on this browser/device.",
        inputLabel: "Code shown on TV",
        inputValue: "1234",
      },
      {
        title: "Send Test Play",
        body: "Open the movie on your VIZIO, pause it, then send one Play command.",
        helperAction: "Send Test Play",
      },
    ],
  },
  sony: {
    eyebrow: "Sony Bravia setup",
    title: "Enable Bravia IP Control",
    sub: "IP Control + Play IRCC code.",
    primaryAction: "Check Bravia",
    failureHint:
      "Enable Bravia IP Control, confirm PSK/auth if required, and select the Play IRCC command.",
    steps: [
      {
        title: "Enable IP Control",
        body: "On Sony/Bravia, turn on IP Control / Remote Start where your model supports it.",
      },
      {
        title: "Set auth / PSK if needed",
        body: "Some models require a pre-shared key or auth setting before remote commands work.",
        inputLabel: "Sony host / PSK",
        inputValue: "bravia.local",
      },
      {
        title: "Confirm Play command",
        body: "The helper fetches remote codes and uses the Play IRCC code only.",
        helperAction: "Find Play IRCC",
      },
    ],
  },
};

const DEVICE_BRAND: Record<DeviceId, string> = {
  roku: "Roku",
  fire: "Fire TV",
  google: "Google TV",
  lg: "LG TV",
  samsung: "Samsung TV",
  vizio: "VIZIO TV",
  sony: "Sony TV",
};

const DETECTED_DEVICES: Record<DetectedDeviceId, DetectedDevice> = {
  roku: {
    id: "roku",
    brand: "Roku",
    fullName: "Roku / Roku TV",
    support: "beta",
    body:
      "Auto Play supports Roku in beta.\n" +
      "We'll send Play to your Roku over Wi-Fi.",
    glyph: "tv",
  },
  fire: {
    id: "fire",
    brand: "Fire TV",
    fullName: "Fire TV / Fire TV Stick",
    support: "beta",
    body:
      "Auto Play supports Fire TV in beta.\n" +
      "ADB pairing required on first run.",
    glyph: "fire",
  },
  google: {
    id: "google",
    brand: "Google TV",
    fullName: "Google TV / Android TV",
    support: "beta",
    body:
      "Auto Play supports Google / Android TV in beta.\n" +
      "ADB pairing required on first run.",
    glyph: "tv",
  },
  lg: {
    id: "lg",
    brand: "LG TV",
    fullName: "LG TV",
    support: "beta",
    body:
      "Auto Play supports LG TVs in beta.\n" +
      "WebOS prompt appears on first connect.",
    glyph: "tv",
  },
  samsung: {
    id: "samsung",
    brand: "Samsung TV",
    fullName: "Samsung TV",
    support: "beta",
    body:
      "Auto Play supports Samsung TVs in beta.\n" +
      "Tizen pairing PIN on first connect.",
    glyph: "tv",
  },
  vizio: {
    id: "vizio",
    brand: "VIZIO TV",
    fullName: "VIZIO TV",
    support: "beta",
    body:
      "Auto Play supports VIZIO TVs in beta.\n" +
      "Pair with a TV code on first connect.",
    glyph: "tv",
  },
  sony: {
    id: "sony",
    brand: "Sony TV",
    fullName: "Sony TV",
    support: "beta",
    body:
      "Auto Play supports Sony TVs in beta.\n" +
      "Bravia IP control required.",
    glyph: "tv",
  },
  "apple-tv": {
    id: "apple-tv",
    brand: "Apple TV",
    fullName: "Apple TV",
    support: "manual-only",
    body:
      "Apple TV doesn't support Auto Play yet.\n" +
      "We'll handle the countdown — you press Play.",
    glyph: "apple-tv",
  },
  unknown: {
    id: "unknown",
    brand: "Unknown device",
    fullName: "Unknown device",
    support: "manual-only",
    body:
      "We couldn't identify this device.\n" +
      "Pick from the list or play it manually.",
    glyph: "unknown",
  },
};

const DETECTED_ORDER: DetectedDeviceId[] = [
  "roku",
  "fire",
  "google",
  "lg",
  "samsung",
  "vizio",
  "sony",
  "apple-tv",
  "unknown",
];

const BROWSE_CATALOG: BrowseTitle[] = [
  {
    id: "dune-2",
    title: "Dune: Part Two",
    meta: "2024 · Movie · Max",
    initial: "D",
  },
  {
    id: "the-bear",
    title: "The Bear · S3",
    meta: "Series · Hulu",
    initial: "B",
  },
  {
    id: "severance",
    title: "Severance · S2",
    meta: "Series · Apple TV+",
    initial: "S",
  },
  {
    id: "past-lives",
    title: "Past Lives",
    meta: "2023 · Movie · Paramount+",
    initial: "P",
  },
];

function PlayMarkGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="ref-app-mark-glyph" aria-hidden="true">
      <path d="M11 8.5 23 16 11 23.5Z" fill="#fff" />
    </svg>
  );
}

function BackArrow() {
  return (
    <svg viewBox="0 0 16 16" className="flow-back-arrow" aria-hidden="true">
      <path
        d="M10 3 5 8l5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CameraGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="ref-glyph" aria-hidden="true">
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2.2l1.05-1.4A1.5 1.5 0 0 1 10.95 4h2.1c.47 0 .92.22 1.2.6L15.3 6h2.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="13"
        r="3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function PhotosGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="ref-glyph" aria-hidden="true">
      <rect
        x="4.4"
        y="4.4"
        width="15.2"
        height="15.2"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="9" cy="9.5" r="1.4" fill="currentColor" opacity="0.85" />
      <path
        d="M5 17 9.4 13l3.2 3 2.6-2.4L19 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="ref-glyph ref-glyph-large"
      aria-hidden="true"
    >
      <path
        d="M8 16.5 14 22l10-12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossGlyph() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="ref-glyph ref-glyph-large"
      aria-hidden="true"
    >
      <path
        d="M10 10 22 22M22 10 10 22"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AppleTvGlyph() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="ref-glyph ref-glyph-large"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="7"
        width="22"
        height="14"
        rx="2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M12 25h8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TvLargeGlyph() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="ref-glyph ref-glyph-large"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="7"
        width="22"
        height="14"
        rx="2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M12 25h8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M11 14l5 0 0 -3"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StickLargeGlyph() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="ref-glyph ref-glyph-large"
      aria-hidden="true"
    >
      <rect
        x="13"
        y="5"
        width="6"
        height="18"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <circle cx="16" cy="26" r="1.2" fill="currentColor" />
    </svg>
  );
}

function FireLargeGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="ref-fire-large-glyph" aria-hidden="true">
      <path
        d="M16 4c2 3.4 6 5.6 6 11a6 6 0 0 1-12 0c0-2.6 1-4 2-5.4 0 2.2 0.8 3.4 2.2 3.4 0-3.4 0.6-5.8 1.8-9Z"
        fill="#FB923C"
      />
    </svg>
  );
}

function UnknownGlyph() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="ref-glyph ref-glyph-large"
      aria-hidden="true"
    >
      <circle
        cx="16"
        cy="16"
        r="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M12 13a4 4 0 0 1 8 0c0 2.4-3 2.6-3 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="17" cy="22" r="1.4" fill="currentColor" />
    </svg>
  );
}

function FireGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="ref-fire-glyph" aria-hidden="true">
      <path
        d="M12 3.5c1.4 2.4 4.6 4.2 4.6 8.4a4.6 4.6 0 0 1-9.2 0c0-2 0.7-3 1.4-4 0 1.6 0.6 2.6 1.6 2.6 0-2.6 0.5-4.4 1.6-7Z"
        fill="#FB923C"
      />
    </svg>
  );
}

function PopcornGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="ref-popcorn-glyph" aria-hidden="true">
      <path
        d="M14 18c0-4 4-7 8-7 2.5-3.5 7.5-3.5 10 0 4 0 8 3 8 7l-3 22a2 2 0 0 1-2 1.7H19a2 2 0 0 1-2-1.7L14 18Z"
        fill="#F5C84B"
      />
      <path
        d="M19 18c0-3 3-5 5-5 1.5-2.5 5-2.5 6.5 0 3 0 5 2 5 5"
        fill="#F87171"
      />
      <path d="M22 24v15M28 24v15M25 21v18" stroke="#fff" strokeWidth="1.4" />
    </svg>
  );
}

function ProgressDots({ current }: { current: number }) {
  return (
    <div className="ref-progress-dots" aria-hidden="true">
      {[0, 1, 2].map((index) => {
        const state =
          index < current ? "done" : index === current ? "now" : "next";
        return <span key={index} className={`ref-dot ${state}`} />;
      })}
    </div>
  );
}

function ScreenChrome({
  onBack,
  roomCode,
}: {
  onBack?: () => void;
  roomCode?: string;
}) {
  if (!onBack && !roomCode) return null;
  return (
    <div className="flow-chrome">
      {onBack ? (
        <button type="button" className="flow-back" onClick={onBack}>
          <BackArrow />
          Back
        </button>
      ) : (
        <span />
      )}
      {roomCode && (
        <span className="flow-room-pill" aria-label="Room code">
          Room <strong>{roomCode}</strong>
        </span>
      )}
    </div>
  );
}

function detectedGlyphFor(kind: DetectedDevice["glyph"]) {
  switch (kind) {
    case "fire":
      return <FireLargeGlyph />;
    case "apple-tv":
      return <AppleTvGlyph />;
    case "stick":
      return <StickLargeGlyph />;
    case "unknown":
      return <UnknownGlyph />;
    case "tv":
    default:
      return <TvLargeGlyph />;
  }
}

const TV_REMOTE_HELPER_URL = "http://127.0.0.1:8790";

type VizioHelperResponse = {
  ok?: boolean;
  error?: string;
  pairingToken?: string;
  challengeType?: string;
  authToken?: string;
};

async function postTvRemoteHelper(
  path: string,
  body: Record<string, string>,
): Promise<VizioHelperResponse> {
  const response = await fetch(`${TV_REMOTE_HELPER_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as VizioHelperResponse;
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `TV helper returned HTTP ${response.status}`);
  }
  return payload;
}

function friendlyTvHelperError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/Failed to fetch/i.test(message)) {
    return "The browser blocked this local TV setup. For this beta, open 3-2-1 Play from localhost on the Mac running the TV helper, then pair your VIZIO there.";
  }
  return message;
}

function canUseBrowserTvHelper(): boolean {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

export function AppFlow() {
  const [screen, setScreen] = useState<AppScreen>("landing");
  const [room, setRoom] = useState<RoomState | null>(null);
  const [name, setName] = useState("");
  const [device, setDevice] = useState<DeviceId | null>(null);
  const [detectedDeviceId, setDetectedDeviceId] =
    useState<DetectedDeviceId | null>(null);
  const [autoPlayActive, setAutoPlayActive] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [savedTitle, setSavedTitle] = useState<string | null>(null);
  const [photoToast, setPhotoToast] = useState("");
  const [countdownText, setCountdownText] = useState("3");
  const [tonights, setTonights] = useState<string[]>([]);
  const [vizioHost, setVizioHost] = useState("");
  const [vizioPin, setVizioPin] = useState("");
  const [vizioPairingToken, setVizioPairingToken] = useState("");
  const [vizioChallengeType, setVizioChallengeType] = useState("");
  const [vizioAuthToken, setVizioAuthToken] = useState("");
  const [vizioStatus, setVizioStatus] = useState("");
  const [vizioBusy, setVizioBusy] = useState<
    "start" | "confirm" | "test" | null
  >(null);

  const roomCode = room?.roomId;

  const handleCreate = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const host = createParticipant(name.trim() || "Host", "host");
      setRoom(createRoom(host));
      setScreen("step1-photo");
    },
    [name],
  );

  const showPhotoToast = useCallback((message: string) => {
    setPhotoToast(message);
    window.setTimeout(() => setPhotoToast(""), 3200);
  }, []);

  const goCategory = useCallback((id: CategoryId) => {
    if (id === "console-other") {
      setScreen("manual-unsupported");
    } else {
      setScreen("step2-device");
    }
  }, []);

  // Tap a device row -> immediately advance to per-device setup. No Next gate.
  const goDevice = useCallback((id: DeviceId) => {
    setDevice(id);
    setScreen("device-setup");
  }, []);

  // Pick a device from the photo-detect demo picker -> show its detected screen.
  const goDetected = useCallback((id: DetectedDeviceId) => {
    setDetectedDeviceId(id);
    setScreen("detected-device");
  }, []);

  // Countdown auto-tick when on countdown screens.
  useEffect(() => {
    if (screen !== "countdown-auto" && screen !== "countdown-manual") return;
    let value = 3;
    const tickInterval = window.setInterval(() => {
      value -= 1;
      if (value > 0) {
        setCountdownText(String(value));
      } else if (value === 0) {
        setCountdownText("PLAY");
      } else {
        window.clearInterval(tickInterval);
        setScreen("post-title");
      }
    }, 1000);
    return () => window.clearInterval(tickInterval);
  }, [screen]);

  function enterCountdown(target: "countdown-auto" | "countdown-manual") {
    setCountdownText("3");
    setScreen(target);
  }

  function handleSaveTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = titleDraft.trim();
    setSavedTitle(value || null);
    setScreen("tracker");
  }

  function pickSuggestion(value: string) {
    setTitleDraft(value);
  }

  function resetFlow() {
    setRoom(null);
    setDevice(null);
    setDetectedDeviceId(null);
    setAutoPlayActive(false);
    setSavedTitle(null);
    setTitleDraft("");
    setTonights([]);
    setScreen("landing");
  }

  function toggleTonights(id: string) {
    setTonights((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  }

  async function startVizioPairingFromSite() {
    const host = vizioHost.trim();
    if (!host) {
      setVizioStatus("Enter your VIZIO TV IP address first.");
      return;
    }
    if (!canUseBrowserTvHelper()) {
      setVizioStatus(
        "For this beta, VIZIO pairing opens from the local setup page on the Mac running the TV helper. Start the helper, then open http://127.0.0.1:5173/ in this browser.",
      );
      return;
    }
    setVizioBusy("start");
    setVizioStatus("Starting VIZIO pairing… watch the TV for a code.");
    setVizioPairingToken("");
    setVizioChallengeType("");
    setVizioAuthToken("");
    try {
      const result = await postTvRemoteHelper("/vizio/pair/start", { host });
      if (!result.pairingToken) {
        throw new Error("The TV did not return a pairing token.");
      }
      setVizioPairingToken(result.pairingToken);
      setVizioChallengeType(result.challengeType ?? "1");
      setVizioStatus("Pairing started. Enter the code shown on the TV.");
    } catch (error) {
      setVizioStatus(friendlyTvHelperError(error));
    } finally {
      setVizioBusy(null);
    }
  }

  async function confirmVizioPairingFromSite() {
    const host = vizioHost.trim();
    const code = vizioPin.trim();
    if (!host || !code || !vizioPairingToken) {
      setVizioStatus("Start pairing first, then enter the PIN from the TV.");
      return;
    }
    setVizioBusy("confirm");
    setVizioStatus("Confirming VIZIO pairing…");
    try {
      const result = await postTvRemoteHelper("/vizio/pair/confirm", {
        host,
        code,
        pairingToken: vizioPairingToken,
        challengeType: vizioChallengeType || "1",
      });
      if (!result.authToken) {
        throw new Error("The TV did not return a saved auth token.");
      }
      setVizioAuthToken(result.authToken);
      setVizioStatus("VIZIO paired. Open your movie, pause it, then send Test Play.");
    } catch (error) {
      setVizioStatus(friendlyTvHelperError(error));
    } finally {
      setVizioBusy(null);
    }
  }

  async function testVizioPlayFromSite() {
    const host = vizioHost.trim();
    if (!host || !vizioAuthToken) {
      setVizioStatus("Pair the TV first so we have the local auth token.");
      return;
    }
    setVizioBusy("test");
    setVizioStatus("Sending one VIZIO Play command…");
    try {
      await postTvRemoteHelper("/vizio/keypress", {
        host,
        authToken: vizioAuthToken,
        key: "play",
      });
      setVizioStatus("Test Play sent. Did the movie start? If yes, pause it again before continuing.");
      setScreen("test-confirm");
    } catch (error) {
      setVizioStatus(friendlyTvHelperError(error));
    } finally {
      setVizioBusy(null);
    }
  }

  // From a detected device's "Set up Auto Play" CTA, route to device-setup
  // pre-selected with the matching DeviceId. Apple TV / unknown have no
  // matching DeviceId, so they steer to manual instead (handled per-screen).
  function setUpDetected(detected: DetectedDevice) {
    if (detected.support === "manual-only") {
      setAutoPlayActive(false);
      enterCountdown("countdown-manual");
      return;
    }
    setDevice(detected.id as DeviceId);
    setScreen("device-setup");
  }

  const detected = detectedDeviceId ? DETECTED_DEVICES[detectedDeviceId] : null;
  const setupDevice = device ?? "roku";
  const setupGuide = SETUP_GUIDES[setupDevice];

  return (
    <main
      className="ref-screen"
      data-flow-screen={screen}
      data-detected-device={detectedDeviceId ?? undefined}
      data-selected-device={device ?? undefined}
      data-variant={
        screen === "landing" ||
        screen === "test-confirm" ||
        screen === "result-success" ||
        screen === "result-fail" ||
        screen === "detected-device" ||
        screen === "manual-unsupported" ||
        screen === "countdown-auto" ||
        screen === "countdown-manual" ||
        screen === "paywall" ||
        screen === "post-title"
          ? "center"
          : "scroll"
      }
    >
      <div className="ref-canvas">
        {/* ─── 01 LANDING ─── */}
        {screen === "landing" && (
          <div className="ref-landing-stack">
            <div className="ref-app-mark">
              <span className="ref-app-mark-glow" aria-hidden="true" />
              <span className="ref-app-mark-tile" aria-hidden="true">
                <PlayMarkGlyph />
              </span>
            </div>
            <h1 className="ref-app-name">3-2-1 Play</h1>
            <p className="ref-app-tagline">Watch Together</p>
            <p className="ref-app-tagline-sub">From Anywhere</p>
            <form
              onSubmit={handleCreate}
              style={{ width: "100%" }}
              aria-label="Create a room"
            >
              <label className="ref-field">
                <span>Your name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  aria-label="Your name"
                  autoComplete="name"
                />
              </label>
              <button
                type="submit"
                className="ref-cta-primary full"
                data-action="create-room"
              >
                Create a room
              </button>
            </form>
            <p className="ref-already-invited">
              Already invited? <strong>Enter a code</strong>
            </p>
          </div>
        )}

        {/* ─── 02 STEP 1 PHOTO ID ─── */}
        {screen === "step1-photo" && (
          <>
            <ScreenChrome onBack={resetFlow} roomCode={roomCode} />
            <header className="ref-step-header">
              <span className="ref-step-tag">Step 1</span>
              <h1>What do you watch on?</h1>
              <p>We'll set up Auto Play for your device.</p>
            </header>
            {photoToast && <p className="flow-photo-toast">{photoToast}</p>}
            <button
              type="button"
              className="ref-photo-hero flow-tap"
              onClick={() => setScreen("photo-sheet")}
              data-action="open-photo-sheet"
              aria-label="Identify with a photo"
            >
              <span className="ref-photo-hero-icon" aria-hidden="true">
                <CameraGlyph />
              </span>
              <strong>Identify with a photo</strong>
              <em>
                Snap your TV or remote, or<br />choose from photos. Make sure the brand name is clearly showing.
              </em>
            </button>
            <p className="ref-photo-privacy">
              Photo identifies your device only. Not saved.
            </p>
            <p className="ref-divider-label">or pick manually</p>
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="ref-device-card flow-tap"
                onClick={() => goCategory(option.id)}
                data-action={`pick-category-${option.id}`}
              >
                <div className="ref-device-icon" aria-hidden="true">
                  {option.glyph}
                </div>
                <div className="ref-device-copy">
                  <strong>{option.name}</strong>
                  <span>{option.description}</span>
                </div>
              </button>
            ))}
          </>
        )}

        {/* ─── 03 PHOTO BOTTOM SHEET ─── */}
        {screen === "photo-sheet" && (
          <>
            <div className="ref-sheet-backdrop" aria-hidden="true" />
            <div className="ref-sheet" role="dialog" aria-label="Photo options">
              <span className="ref-sheet-handle" aria-hidden="true" />
              <h2 className="ref-sheet-title">Press Play together.</h2>
              <p className="ref-sheet-sub">
                Make sure the TV or remote brand name is clearly showing.
              </p>
              <button
                type="button"
                className="ref-sheet-action flow-tap"
                onClick={() => setScreen("photo-detect-picker")}
                data-action="take-photo"
              >
                <span className="ref-sheet-action-icon" aria-hidden="true">
                  <CameraGlyph />
                </span>
                <strong>Take a photo</strong>
              </button>
              <button
                type="button"
                className="ref-sheet-action flow-tap"
                onClick={() => setScreen("photo-detect-picker")}
                data-action="choose-photo"
              >
                <span className="ref-sheet-action-icon" aria-hidden="true">
                  <PhotosGlyph />
                </span>
                <strong>Choose from photos</strong>
              </button>
              <button
                type="button"
                className="ref-sheet-pick-manually"
                onClick={() => {
                  setScreen("step1-photo");
                  showPhotoToast("Pick a category card below.");
                }}
                data-action="pick-manually"
              >
                Pick manually instead
              </button>
            </div>
          </>
        )}

        {/* ─── PHOTO DETECT PICKER (honest demo) ─── */}
        {screen === "photo-detect-picker" && (
          <>
            <ScreenChrome
              onBack={() => setScreen("step1-photo")}
              roomCode={roomCode}
            />
            <header className="ref-step-header">
              <span className="ref-step-tag">Photo detection</span>
              <h1>Pick a device to preview</h1>
              <p>
                Photo recognition isn't wired in this demo. Tap a device to see
                the result it would produce.
              </p>
            </header>
            <div className="ref-device-list">
              {DETECTED_ORDER.map((id) => {
                const entry = DETECTED_DEVICES[id];
                return (
                  <button
                    key={id}
                    type="button"
                    className="ref-device-row flow-tap"
                    onClick={() => goDetected(id)}
                    data-action={`demo-detect-${id}`}
                  >
                    <div className="ref-device-row-icon" aria-hidden="true">
                      {CATEGORY_GLYPHS.tv}
                    </div>
                    <div className="ref-device-row-copy">
                      <strong>{entry.fullName}</strong>
                      <span
                        className={`ref-beta-pill ${entry.support === "manual-only" ? "warn" : ""}`}
                      >
                        {entry.support === "beta"
                          ? "Auto Play beta"
                          : "Manual only"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ─── STEP 2 DEVICE PICKER ─── */}
        {screen === "step2-device" && (
          <>
            <ScreenChrome
              onBack={() => setScreen("step1-photo")}
              roomCode={roomCode}
            />
            <header className="ref-step-header">
              <ProgressDots current={1} />
              <span className="ref-step-tag">Step 2</span>
              <h1>Which device?</h1>
              <p>Tap your device to continue.</p>
            </header>
            <div className="ref-device-list">
              {DEVICE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="ref-device-row flow-tap"
                  onClick={() => goDevice(option.id)}
                  data-action={`select-device-${option.id}`}
                >
                  <div className="ref-device-row-icon" aria-hidden="true">
                    {CATEGORY_GLYPHS.tv}
                  </div>
                  <div className="ref-device-row-copy">
                    <strong>{option.name}</strong>
                    <span className="ref-beta-pill">Auto Play beta</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ─── DEVICE SETUP (per-device label) ─── */}
        {screen === "device-setup" && (
          <>
            <ScreenChrome
              onBack={() => setScreen("step2-device")}
              roomCode={roomCode}
            />
            <header className="ref-step-header">
              <ProgressDots current={2} />
              <span className="ref-step-tag">{setupGuide.eyebrow}</span>
              <h1>{setupGuide.title}</h1>
              <p>{setupGuide.sub}</p>
            </header>
            {setupGuide.steps.map((step, index) => (
              <div className="ref-numbered-card" key={step.title}>
                <span className="ref-numbered-tag">
                  {index + 1} of {setupGuide.steps.length}
                </span>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
                {step.badge && (
                  <div className="ref-success-pill">
                    <span aria-hidden="true">✓</span>
                    {step.badge}
                  </div>
                )}
                {step.inputLabel && (
                  <div className="ref-input">
                    <input
                      defaultValue={step.inputValue}
                      aria-label={step.inputLabel}
                    />
                  </div>
                )}
                {step.helperAction && setupDevice !== "vizio" && (
                  <button type="button" className="ref-find-auto">
                    {step.helperAction}
                  </button>
                )}
              </div>
            ))}
            {setupDevice === "vizio" && (
              <div className="ref-numbered-card" data-vizio-live-pairing="true">
                <span className="ref-numbered-tag">Local setup beta</span>
                <strong>Pair from local setup</strong>
                <p>
                  Public HTTPS browsers can block TV pairing. For this beta, run
                  the helper on this Mac and open the local setup page at
                  http://127.0.0.1:5173/.
                </p>
                <label className="ref-input-label" htmlFor="vizio-host-input">
                  VIZIO TV IP address
                </label>
                <div className="ref-input">
                  <input
                    id="vizio-host-input"
                    value={vizioHost}
                    onChange={(event) => setVizioHost(event.currentTarget.value)}
                    placeholder="10.0.0.22"
                    inputMode="decimal"
                    autoComplete="off"
                  />
                </div>
                <button
                  type="button"
                  className="ref-find-auto"
                  onClick={startVizioPairingFromSite}
                  disabled={vizioBusy !== null}
                >
                  {vizioBusy === "start" ? "Starting…" : "Start pairing"}
                </button>
                {vizioPairingToken && (
                  <p className="ref-helper-note">
                    Pairing started. Now enter the code shown on your TV.
                  </p>
                )}
                <label className="ref-input-label" htmlFor="vizio-pin-input">
                  Code shown on TV
                </label>
                <div className="ref-input">
                  <input
                    id="vizio-pin-input"
                    value={vizioPin}
                    onChange={(event) => setVizioPin(event.currentTarget.value)}
                    placeholder="1234"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>
                <button
                  type="button"
                  className="ref-find-auto"
                  onClick={confirmVizioPairingFromSite}
                  disabled={vizioBusy !== null || !vizioPairingToken}
                >
                  {vizioBusy === "confirm" ? "Pairing…" : "Confirm PIN"}
                </button>
                <button
                  type="button"
                  className="ref-find-auto"
                  onClick={testVizioPlayFromSite}
                  disabled={vizioBusy !== null || !vizioAuthToken}
                >
                  {vizioBusy === "test" ? "Sending Play…" : "Send Test Play"}
                </button>
                {vizioStatus && (
                  <p className="ref-helper-note" role="status">
                    {vizioStatus}
                  </p>
                )}
                <button
                  type="button"
                  className="ref-find-auto"
                  onClick={() => enterCountdown("countdown-manual")}
                  data-action="vizio-manual-countdown"
                >
                  Use manual countdown tonight
                </button>
              </div>
            )}
            <div className="ref-bottom-cta">
              <button
                type="button"
                className="ref-cta-primary full"
                onClick={() => {
                  if (setupDevice === "vizio") {
                    void startVizioPairingFromSite();
                    return;
                  }
                  setAutoPlayActive(true);
                  setScreen("result-success");
                }}
                data-action="connect-and-test"
              >
                {setupDevice === "vizio" && vizioBusy === "start"
                  ? "Starting…"
                  : setupGuide.primaryAction}
              </button>
              <p className="flow-demo-toggle" aria-label="Demo result toggles">
                <span>Demo:</span>
                <button
                  type="button"
                  onClick={() => {
                    setAutoPlayActive(false);
                    setScreen("result-fail");
                  }}
                  data-action="demo-fail"
                >
                  show failure state
                </button>
              </p>
            </div>
          </>
        )}

        {/* ─── TEST PLAY CONFIRM ─── */}
        {screen === "test-confirm" && (
          <div className="ref-result-stack">
            <ScreenChrome
              onBack={() => setScreen("device-setup")}
              roomCode={roomCode}
            />
            <div className="ref-status-icon ref-status-success">
              <CheckGlyph />
            </div>
            <h1 className="ref-result-title">Did the movie start?</h1>
            <p className="ref-result-body">
              If Test Play started the movie, pause it again now. Remote Start is
              only ready after you confirm that paused state.
            </p>
            {vizioStatus && (
              <p className="ref-helper-note" role="status">
                {vizioStatus}
              </p>
            )}
            <button
              type="button"
              className="ref-cta-primary full"
              onClick={() => {
                setAutoPlayActive(true);
                setVizioStatus("VIZIO ready. Keep the movie paused until 3-2-1 Play.");
                setScreen("result-success");
              }}
              data-action="confirm-test-play-paused"
            >
              Yes — I paused it again
            </button>
            <button
              type="button"
              className="ref-cta-secondary full"
              onClick={() => {
                setAutoPlayActive(false);
                setVizioStatus("Use manual countdown tonight. No VIZIO Play command will be sent at PLAY.");
                setScreen("result-fail");
              }}
              data-action="reject-test-play"
            >
              No — use manual countdown
            </button>
          </div>
        )}

        {/* ─── RESULT SUCCESS ─── */}
        {screen === "result-success" && (
          <div className="ref-result-stack">
            <ScreenChrome
              onBack={() => setScreen("device-setup")}
              roomCode={roomCode}
            />
            <div className="ref-status-icon ref-status-success">
              <CheckGlyph />
            </div>
            <h1 className="ref-result-title">You're set.</h1>
            <p className="ref-result-success-sub">Auto Play is ready.</p>
            <p className="ref-result-body">
              Every movie night, we'll press
              <br />
              Play on your {DEVICE_BRAND[setupDevice]} for you.
            </p>
            <button
              type="button"
              className="ref-cta-primary full"
              onClick={() => enterCountdown("countdown-auto")}
              data-action="continue-to-countdown"
            >
              Continue to countdown
            </button>
          </div>
        )}

        {/* ─── RESULT FAIL ─── */}
        {screen === "result-fail" && (
          <div className="ref-result-stack">
            <ScreenChrome
              onBack={() => setScreen("device-setup")}
              roomCode={roomCode}
            />
            <div className="ref-status-icon ref-status-error">
              <CrossGlyph />
            </div>
            <h1 className="ref-result-title">Didn't work this time.</h1>
            <p className="ref-result-body">
              {setupGuide.failureHint}
            </p>
            <button
              type="button"
              className="ref-cta-primary full"
              onClick={() => setScreen("device-setup")}
              data-action="retry-setup"
            >
              Retry
            </button>
            <button
              type="button"
              className="ref-cta-ghost"
              onClick={() => setScreen("step2-device")}
              data-action="try-different-device"
            >
              Try a different device
            </button>
            <p className="ref-result-skip">
              <button
                type="button"
                onClick={() => {
                  setAutoPlayActive(false);
                  enterCountdown("countdown-manual");
                }}
                style={{
                  appearance: "none",
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                  color: "inherit",
                  font: "inherit",
                }}
                data-action="manual-anyway"
              >
                <strong>Start movie night anyway</strong>
                <br />
                <span>We'll pick this up next session.</span>
              </button>
            </p>
          </div>
        )}

        {/* ─── DETECTED DEVICE (per-device, photo path only) ─── */}
        {screen === "detected-device" && detected && (
          <div className="ref-result-stack">
            <ScreenChrome
              onBack={() => setScreen("photo-detect-picker")}
              roomCode={roomCode}
            />
            <div
              className={`ref-status-icon ${
                detected.support === "manual-only"
                  ? "ref-status-warning"
                  : "ref-status-success"
              }`}
            >
              {detectedGlyphFor(detected.glyph)}
            </div>
            <h1 className="ref-result-title">{detected.brand} detected.</h1>
            <p
              className={`ref-result-body ${detected.support === "manual-only" ? "" : "supported"}`}
            >
              {detected.body.split("\n").map((line, idx, arr) => (
                <span key={idx}>
                  {line}
                  {idx < arr.length - 1 && <br />}
                </span>
              ))}
            </p>
            {detected.support === "beta" ? (
              <>
                <button
                  type="button"
                  className="ref-cta-primary full"
                  onClick={() => setUpDetected(detected)}
                  data-action="detected-set-up"
                >
                  Set up Auto Play
                </button>
                <button
                  type="button"
                  className="ref-cta-ghost"
                  onClick={() => setScreen("photo-detect-picker")}
                  data-action="detected-different"
                >
                  Try a different device
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="ref-cta-primary full"
                  onClick={() => {
                    setAutoPlayActive(false);
                    enterCountdown("countdown-manual");
                  }}
                  data-action="detected-manual-continue"
                >
                  Continue without Auto Play
                </button>
                <button
                  type="button"
                  className="ref-cta-ghost"
                  onClick={() => setScreen("step1-photo")}
                  data-action="detected-check-another"
                >
                  Check another device
                </button>
              </>
            )}
          </div>
        )}

        {/* ─── MANUAL UNSUPPORTED (console / cable / other) ─── */}
        {screen === "manual-unsupported" && (
          <div className="ref-result-stack">
            <ScreenChrome
              onBack={() => setScreen("step1-photo")}
              roomCode={roomCode}
            />
            <div className="ref-status-icon ref-status-warning">
              <CategoryConsoleLargeGlyph />
            </div>
            <h1 className="ref-result-title">Manual play only.</h1>
            <p className="ref-result-body">
              Consoles, cable boxes, and projectors
              <br />
              don't support Auto Play yet.
            </p>
            <p className="ref-result-body" style={{ marginTop: "8px" }}>
              We'll handle the countdown
              <br />
              and you press Play.
            </p>
            <button
              type="button"
              className="ref-cta-primary full"
              onClick={() => {
                setAutoPlayActive(false);
                enterCountdown("countdown-manual");
              }}
              data-action="manual-continue"
            >
              Continue without Auto Play
            </button>
            <button
              type="button"
              className="ref-cta-ghost"
              onClick={() => setScreen("step1-photo")}
              data-action="manual-check-another"
            >
              Check another device
            </button>
          </div>
        )}

        {/* ─── COUNTDOWN ─── */}
        {(screen === "countdown-auto" || screen === "countdown-manual") && (
          <>
            {screen === "countdown-manual" && (
              <div className="ref-countdown-banner">
                <span>Auto Play not set up.</span>
                <button
                  type="button"
                  onClick={() => setScreen("step1-photo")}
                  data-action="banner-set-up"
                >
                  Set up
                </button>
              </div>
            )}
            <div className="ref-countdown-stack">
              <p className="ref-countdown-label">
                {countdownText === "PLAY" ? "Playing" : "Ready in"}
              </p>
              <div className="ref-countdown-number">{countdownText}</div>
              <p className="ref-countdown-sub">
                {screen === "countdown-auto"
                  ? "Get ready."
                  : "Press Play on your remote."}
              </p>
              <div className="flow-empty-room" aria-label="Room participants">
                <span>No one has joined yet.</span>
                <small>Share the room code when you're ready.</small>
              </div>
              <button
                type="button"
                className="ref-cta-ghost"
                onClick={() => {
                  setAutoPlayActive(false);
                  setScreen("step1-photo");
                }}
                data-action="undo-ready"
              >
                Ready — tap to undo
              </button>
              {screen === "countdown-auto" && device && (
                <p className="ref-countdown-footer">
                  {DEVICE_BRAND[device]} · Auto Play ready
                </p>
              )}
            </div>
          </>
        )}

        {/* ─── POST SESSION TITLE PROMPT ─── */}
        {screen === "post-title" && (
          <form
            className="ref-title-stack"
            onSubmit={handleSaveTitle}
            aria-label="Save watch title"
          >
            <ScreenChrome roomCode={roomCode} />
            <PopcornGlyph />
            <h1 className="ref-title-prompt-title">Save this watch night?</h1>
            <p className="ref-title-prompt-sub">
              Add a title for richer stats and recaps.
            </p>
            <label className="ref-field">
              <span>What did you watch?</span>
              <input
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                placeholder="Search titles..."
                aria-label="Watch title"
              />
            </label>
            <div className="ref-suggestion-pills">
              {["Dune: Part Two", "The Bear", "Severance"].map((title) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => pickSuggestion(title)}
                  data-action={`suggest-${title.replace(/\W+/g, "-").toLowerCase()}`}
                >
                  {title}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="ref-cta-primary full"
              data-action="save-watch-title"
            >
              Save to history
            </button>
            <button
              type="button"
              className="ref-text-link dim"
              onClick={() => {
                setSavedTitle(null);
                setScreen("tracker");
              }}
              data-action="skip-watch-title"
            >
              Skip for now
            </button>
          </form>
        )}

        {/* ─── WATCH TRACKER (FREE) ─── */}
        {screen === "tracker" && (
          <>
            <ScreenChrome onBack={resetFlow} roomCode={roomCode} />
            <div className="ref-tracker-header">
              <span className="ref-tracker-eyebrow">Watch tracker</span>
              <span className="ref-tracker-badge purple">Year in Sync</span>
            </div>
            <h2 className="ref-tracker-title">
              Your time together,
              <br />
              remembered automatically.
            </h2>
            <p className="ref-tracker-sub">
              Add a title later for richer recaps.
            </p>
            <div className="ref-hero-stat">
              <div className="ref-hero-stat-glow" aria-hidden="true" />
              <div className="ref-hero-stat-number">4</div>
              <div className="ref-hero-stat-unit">Watch nights</div>
              <div className="ref-hero-stat-partner">with your partner</div>
            </div>
            <div className="ref-streak">
              <FireGlyph />
              <strong>2 night streak</strong>
              <span>· this week</span>
            </div>
            <div className="ref-stat-pills">
              <div>
                <strong>2</strong>
                <span>Countdowns</span>
              </div>
              <div>
                <strong>Fri</strong>
                <span>Fav night</span>
              </div>
            </div>
            <div className="flow-tracker-actions">
              <button
                type="button"
                onClick={() => setScreen("browse")}
                data-action="open-browse"
              >
                <strong>Find watch</strong>
                <span>Browse by streaming service</span>
              </button>
              <button
                type="button"
                onClick={() => setScreen("tonights")}
                data-action="open-tonights"
              >
                <strong>Tonight's list</strong>
                <span>{tonights.length} saved</span>
              </button>
            </div>
            <div className="ref-yis-locked">
              <div className="ref-yis-blur" aria-hidden="true">
                <span className="ref-yis-row">
                  <em>YEAR IN SYNC</em>
                </span>
                <span className="ref-yis-row">
                  <strong>3 watch nights</strong>
                </span>
                <span className="ref-yis-row">
                  <em>Top partner: —</em>
                </span>
                <span className="ref-yis-row blur" />
                <span className="ref-yis-row blur" />
              </div>
              <p className="ref-yis-upgrade">Upgrade to Pro for full history</p>
              <button
                type="button"
                className="ref-yis-link"
                onClick={() => setScreen("paywall")}
                data-action="see-pro"
              >
                See what's in Pro
              </button>
            </div>
            <div className="ref-history-list">
              <div
                className={`ref-history-item ${savedTitle ? "titled" : ""}`}
              >
                <div>
                  <strong>{savedTitle ?? "Untitled watch"}</strong>
                  <span>Partner · 1h 44m · Today</span>
                </div>
                {savedTitle ? (
                  <span className="ref-history-check" aria-hidden="true">
                    ✓
                  </span>
                ) : (
                  <button
                    type="button"
                    className="ref-history-add"
                    onClick={() => setScreen("post-title")}
                    data-action="add-title"
                  >
                    Add title
                  </button>
                )}
              </div>
              <div className="ref-history-item titled">
                <div>
                  <strong>Dune: Part Two</strong>
                  <span>Partner · 2h 46m · Yesterday</span>
                </div>
                <span className="ref-history-check" aria-hidden="true">
                  ✓
                </span>
              </div>
              <div className="ref-history-item">
                <div>
                  <strong>Untitled watch</strong>
                  <span>Partner · 52m · Mon</span>
                </div>
                <button type="button" className="ref-history-add">
                  Add title
                </button>
              </div>
            </div>
          </>
        )}

        {/* ─── PAYWALL ─── */}
        {screen === "paywall" && (
          <div className="ref-paywall-stack">
            <ScreenChrome
              onBack={() => setScreen("tracker")}
              roomCode={roomCode}
            />
            <h1 className="ref-paywall-title">
              You've watched 5
              <br />
              nights together.
            </h1>
            <p className="ref-paywall-sub">Keep it going.</p>
            <div className="ref-paywall-toggle">
              <span>Monthly</span>
              <span className="active">
                Yearly <em>SAVE 50%</em>
              </span>
            </div>
            <div className="ref-paywall-table">
              <div className="ref-paywall-table-head">
                <span />
                <span>
                  <em>FREE</em>
                  <strong>$0</strong>
                </span>
                <span className="best">
                  <span className="ref-best-chip">BEST VALUE</span>
                  <em>PRO</em>
                  <strong>$4.99/mo</strong>
                </span>
              </div>
              {[
                ["Watch sessions", "5", "Unlimited"],
                ["Watch Tracker", "Basic", "Full"],
                ["Year in Sync", "—", "✓"],
                ["Shared history", "—", "✓"],
                ["User Insights", "—", "✓"],
              ].map(([feature, free, pro]) => (
                <div className="ref-paywall-table-row" key={feature}>
                  <span>{feature}</span>
                  <span>{free}</span>
                  <span className="pro">{pro}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="ref-cta-primary full"
              onClick={() =>
                setPhotoToast(
                  "Payment isn't wired in this demo — visual only.",
                )
              }
              data-action="upgrade-pro"
            >
              Upgrade to Pro · $4.99/mo
            </button>
            {photoToast && <p className="flow-photo-toast">{photoToast}</p>}
            <p className="ref-paywall-fine">Cancel anytime</p>
            <p className="ref-paywall-fine fine">
              Terms · Privacy · Restore Purchase
            </p>
            <button
              type="button"
              className="ref-paywall-not-now"
              onClick={() => setScreen("tracker")}
              data-action="paywall-not-now"
              style={{
                appearance: "none",
                border: 0,
                background: "transparent",
                cursor: "pointer",
                font: "inherit",
              }}
            >
              Not now
            </button>
          </div>
        )}

        {/* ─── BROWSE ─── */}
        {screen === "browse" && (
          <>
            <ScreenChrome
              onBack={() => setScreen("tracker")}
              roomCode={roomCode}
            />
            <header className="ref-step-header">
              <span className="ref-step-tag">Find watch</span>
              <h1>Browse titles</h1>
              <p>Add to Tonight's list. Real catalog browsing isn't wired here.</p>
            </header>
            <div className="flow-list-stack">
              {BROWSE_CATALOG.map((entry) => {
                const added = tonights.includes(entry.id);
                return (
                  <div className="flow-watch-card" key={entry.id}>
                    <div className="flow-watch-thumb" aria-hidden="true">
                      {entry.initial}
                    </div>
                    <div className="flow-watch-copy">
                      <strong>{entry.title}</strong>
                      <span>{entry.meta}</span>
                    </div>
                    <button
                      type="button"
                      className={`flow-watch-add ${added ? "added" : ""}`}
                      onClick={() => toggleTonights(entry.id)}
                      data-action={`toggle-tonight-${entry.id}`}
                    >
                      {added ? "Added" : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ─── TONIGHT'S LIST ─── */}
        {screen === "tonights" && (
          <>
            <ScreenChrome
              onBack={() => setScreen("tracker")}
              roomCode={roomCode}
            />
            <header className="ref-step-header">
              <span className="ref-step-tag">Tonight</span>
              <h1>Tonight's list</h1>
              <p>Picks saved from Find watch.</p>
            </header>
            {tonights.length === 0 ? (
              <p className="flow-empty">
                No picks yet. Open <strong>Find watch</strong> from the tracker
                and tap Add.
              </p>
            ) : (
              <div className="flow-list-stack">
                {tonights
                  .map((id) => BROWSE_CATALOG.find((entry) => entry.id === id))
                  .filter((entry): entry is BrowseTitle => Boolean(entry))
                  .map((entry) => (
                    <div className="flow-watch-card" key={entry.id}>
                      <div className="flow-watch-thumb" aria-hidden="true">
                        {entry.initial}
                      </div>
                      <div className="flow-watch-copy">
                        <strong>{entry.title}</strong>
                        <span>{entry.meta}</span>
                      </div>
                      <button
                        type="button"
                        className="flow-watch-add added"
                        onClick={() => toggleTonights(entry.id)}
                        data-action={`remove-tonight-${entry.id}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}

        {screen === "landing" && (
          <p className="flow-landing-helper">
            Local visual demo.{" "}
            <button type="button" onClick={resetFlow}>
              Reset state
            </button>
          </p>
        )}

        {autoPlayActive && screen === "countdown-auto" && null}
      </div>
    </main>
  );
}

function CategoryConsoleLargeGlyph() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="ref-glyph ref-glyph-large"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="11"
        width="24"
        height="11"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <circle cx="10" cy="16.5" r="1.2" fill="currentColor" />
      <circle cx="14" cy="16.5" r="1.2" fill="currentColor" />
      <circle cx="21" cy="14.5" r="1.2" fill="currentColor" />
      <circle cx="21" cy="18.5" r="1.2" fill="currentColor" />
    </svg>
  );
}
