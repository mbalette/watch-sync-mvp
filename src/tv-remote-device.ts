import {
  DEFAULT_REMOTE_START_RUNTIME_CONFIG,
  isRemoteStartPlatformEnabled,
  type RemoteStartRuntimeConfig,
} from "./remote-start-runtime-config";
export type LinkedTvPlatform =
  | "roku"
  | "lg_webos"
  | "samsung"
  | "android_adb"
  | "sony_bravia"
  | "philips_jointspace"
  | "vizio_smartcast"
  | "home_assistant_webhook"
  | "apple_tv_manual";

export type PublicClaimLevel =
  | "primary-beta"
  | "guided-setup-beta"
  | "reverse-engineered-beta"
  | "account-pairing-beta"
  | "later-beta"
  | "manual-only"
  | "not-supported-yet";
export type PlatformStatusLabel =
  | "Auto Play (beta)"
  | "Reverse-engineered beta"
  | "Account-pairing beta"
  | "Later beta"
  | "Manual-only"
  | "Not supported yet";
export type RemoteStartReadiness =
  | "not_configured"
  | "needs_setup"
  | "ready"
  | "reconnect_needed"
  | "test_failed"
  | "manual_tonight"
  | "unsupported"
  | "unverified_hardware_behavior";

export interface RemoteStartReadinessResult {
  state: RemoteStartReadiness;
  label:
    | "Auto Play ready"
    | "Reconnect needed"
    | "Needs setup"
    | "Manual countdown tonight"
    | "Device behavior not verified yet"
    | "Not supported yet";
  reason: string;
}

export interface RemoteStartWizardSpec {
  title: string;
  label: PlatformStatusLabel;
  summary: string;
  steps: string[];
  tvSideSetting: string;
  pairingPersistence: string;
  safeGoCommand: string;
  pausePolicy: string;
  togglePolicy: string;
  primaryAction: string;
  publicCopy: string;
}

export interface RemoteStartCapability {
  canTestConnection: boolean;
  canSendPlay: boolean;
  canSendPause: boolean;
  canAutoPlayAtGo: boolean;
  requiresLocalHelper: boolean;
  requiresPairing: boolean;
  requiresAdvancedSetup: boolean;
  hardwareValidated: boolean;
  publicClaimLevel: PublicClaimLevel;
  safeGoCommand?: string;
  manualFallbackRequired: true;
}

export interface LinkedTvDevice {
  platform: LinkedTvPlatform;
  label: string;
  host: string;
  url?: string;
  webhookUrl?: string;
  helperUrl: string;
  clientKey?: string;
  token?: string;
  psk?: string;
  irccCode?: string;
  apiVersion?: number;
  authToken?: string;
  lastTestedAt?: string;
  useRemoteStartAtGo: boolean;
}

export interface HelperRequestSpec {
  path: string;
  method: "GET" | "POST";
  body?: Record<string, unknown>;
  unsafeReason?: string;
}

export type RemoteStartWatchingMethod =
  | "built_in_tv_app"
  | "streaming_stick_or_box"
  | "game_console_or_other";

export interface RemoteStartWatchingMethodChoice {
  id: RemoteStartWatchingMethod;
  title: string;
  icon: string;
  helper: string;
  nextCopy: string;
}

export interface RemoteStartOnboardingChoice {
  platform: LinkedTvPlatform;
  title: string;
  badge: PlatformStatusLabel;
  icon: string;
  setupPreview: string;
  nextCopy: string;
  recommended: boolean;
  watchingMethods: RemoteStartWatchingMethod[];
}

export const LINKED_TV_DEVICE_KEY = "watch-sync.linkedTvDevice.v1";

export interface VizioD2cStepCopy {
  id:
    | "card"
    | "before-setup"
    | "pair-code"
    | "open-movie"
    | "test-play"
    | "confirm";
  title: string;
  body: string;
  primaryCta: string;
  secondaryCta?: string;
}

export interface VizioD2cFlowCopy {
  card: {
    title: string;
    badge: string;
    description: string;
    truthLine: string;
  };
  beforeSetup: {
    title: string;
    body: string;
    privacyLine: string;
    checklist: string[];
    primaryCta: string;
    fallbackCta: string;
  };
  pairCode: {
    title: string;
    body: string;
    fieldLabel: string;
    primaryCta: string;
    helper: string;
    secondaryCta: string;
  };
  openMovie: {
    title: string;
    body: string;
    pauseInstruction: string;
    warning: string;
    primaryCta: string;
  };
  testPlay: {
    title: string;
    body: string;
    afterTestInstruction: string;
    primaryCta: string;
    fallbackCta: string;
  };
  confirm: {
    title: string;
    yesCta: string;
    noCta: string;
    successTitle: string;
    successBody: string;
    savedNote: string;
    successPrimary: string;
    successSecondary: string;
    successTertiary: string;
  };
  saved: {
    title: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    tertiaryCta: string;
    caveat: string;
    needsReverifyHint: string;
  };
}

export const VIZIO_D2C_FLOW: VizioD2cFlowCopy = {
  card: {
    title: "VIZIO TV",
    badge: "Pair with TV code",
    description:
      "Pair once with your TV, then 3-2-1 Play can press Play at the countdown.",
    truthLine:
      "Works when the movie is playing in the app on your VIZIO TV. If you’re casting from your phone, use manual countdown.",
  },
  beforeSetup: {
    title: "Keep your VIZIO on and nearby",
    body: "We’ll look for your TV on your Wi‑Fi and ask it to show a short pairing code.",
    privacyLine:
      "3-2-1 Play does not access your streaming accounts or choose titles. It only sends a local Play command to your TV.",
    checklist: [
      "VIZIO TV is on",
      "This phone/browser is on the same Wi‑Fi",
      "You’ll open the streaming app directly on the TV",
      "You have the VIZIO remote nearby",
    ],
    primaryCta: "Find my VIZIO TV",
    fallbackCta: "Use manual countdown tonight",
  },
  pairCode: {
    title: "Enter the code from your TV",
    body: "Your VIZIO should show a pairing code. Type it here to connect this device.",
    fieldLabel: "TV code",
    primaryCta: "Pair TV",
    helper:
      "If you don’t see a code, make sure your TV is on the same Wi‑Fi and try again.",
    secondaryCta: "I don’t see a code",
  },
  openMovie: {
    title: "Open the movie on your VIZIO",
    body: "Use your normal VIZIO remote. Open the streaming app on the TV and start the movie.",
    pauseInstruction: "Pause it exactly where you both want to begin.",
    warning:
      "Don’t cast from your phone for this setup. The video needs to be playing on the VIZIO TV app itself.",
    primaryCta: "I paused the movie",
  },
  testPlay: {
    title: "Test Auto Play",
    body: "We’ll send one Play command to your VIZIO. Your movie should start.",
    afterTestInstruction:
      "After it starts, pause it again so it’s ready for the real countdown.",
    primaryCta: "Send Test Play",
    fallbackCta: "Use manual countdown instead",
  },
  confirm: {
    title: "Did the movie start?",
    yesCta: "Yes — I paused it again",
    noCta: "No — use manual countdown",
    successTitle: "VIZIO ready",
    successBody:
      "3-2-1 Play can press Play on this TV after you open the movie and pause it.",
    savedNote:
      "Your VIZIO is paired on this device. Next movie night, you won’t need to enter the code again.",
    successPrimary: "Start 3-2-1 Play",
    successSecondary: "Test Play again",
    successTertiary: "Pair a different TV",
  },
  saved: {
    title: "Saved VIZIO TV",
    body: "Your VIZIO is paired on this device.",
    primaryCta: "Use this VIZIO",
    secondaryCta: "Test Play again",
    tertiaryCta: "Pair a different TV",
    caveat:
      "You may need to pair again if you use a different browser, clear browser data, reset the TV, or change Wi‑Fi.",
    needsReverifyHint: "Test Play before movie night",
  },
};

export type VizioSavedDeviceState =
  | "fresh"
  | "saved-needs-test"
  | "saved-ready";

export function getVizioSavedDeviceState(
  device: LinkedTvDevice | null,
): VizioSavedDeviceState {
  if (!device || device.platform !== "vizio_smartcast") return "fresh";
  const hasPairing = Boolean(
    device.host?.trim() && (device.authToken?.trim() ?? "") !== "",
  );
  if (!hasPairing) return "fresh";
  if (!device.lastTestedAt || !device.useRemoteStartAtGo)
    return "saved-needs-test";
  return "saved-ready";
}

export function getVizioD2cFlow(): VizioD2cFlowCopy {
  return VIZIO_D2C_FLOW;
}

const REMOTE_START_CAPABILITIES: Record<
  LinkedTvPlatform,
  RemoteStartCapability
> = {
  roku: {
    canTestConnection: true,
    canSendPlay: true,
    canSendPause: false,
    canAutoPlayAtGo: true,
    requiresLocalHelper: true,
    requiresPairing: false,
    requiresAdvancedSetup: false,
    hardwareValidated: false,
    publicClaimLevel: "primary-beta",
    safeGoCommand: "Play",
    manualFallbackRequired: true,
  },
  lg_webos: {
    canTestConnection: true,
    canSendPlay: true,
    canSendPause: true,
    canAutoPlayAtGo: true,
    requiresLocalHelper: true,
    requiresPairing: true,
    requiresAdvancedSetup: false,
    hardwareValidated: false,
    publicClaimLevel: "primary-beta",
    safeGoCommand: "ssap://media.controls/play",
    manualFallbackRequired: true,
  },
  samsung: {
    canTestConnection: true,
    canSendPlay: true,
    canSendPause: true,
    canAutoPlayAtGo: true,
    requiresLocalHelper: true,
    requiresPairing: true,
    requiresAdvancedSetup: false,
    hardwareValidated: false,
    publicClaimLevel: "primary-beta",
    safeGoCommand: "KEY_PLAY",
    manualFallbackRequired: true,
  },
  android_adb: {
    canTestConnection: true,
    canSendPlay: true,
    canSendPause: true,
    canAutoPlayAtGo: true,
    requiresLocalHelper: true,
    requiresPairing: true,
    requiresAdvancedSetup: true,
    hardwareValidated: false,
    publicClaimLevel: "guided-setup-beta",
    safeGoCommand: "KEYCODE_MEDIA_PLAY",
    manualFallbackRequired: true,
  },
  sony_bravia: {
    canTestConnection: true,
    canSendPlay: true,
    canSendPause: false,
    canAutoPlayAtGo: true,
    requiresLocalHelper: true,
    requiresPairing: true,
    requiresAdvancedSetup: false,
    hardwareValidated: false,
    publicClaimLevel: "primary-beta",
    safeGoCommand: "IRCC Play code",
    manualFallbackRequired: true,
  },
  philips_jointspace: {
    canTestConnection: false,
    canSendPlay: true,
    canSendPause: false,
    canAutoPlayAtGo: false,
    requiresLocalHelper: true,
    requiresPairing: false,
    requiresAdvancedSetup: false,
    hardwareValidated: false,
    publicClaimLevel: "later-beta",
    manualFallbackRequired: true,
  },
  vizio_smartcast: {
    canTestConnection: true,
    canSendPlay: true,
    canSendPause: false,
    canAutoPlayAtGo: true,
    requiresLocalHelper: true,
    requiresPairing: true,
    requiresAdvancedSetup: false,
    hardwareValidated: false,
    publicClaimLevel: "primary-beta",
    manualFallbackRequired: true,
  },
  home_assistant_webhook: {
    canTestConnection: false,
    canSendPlay: true,
    canSendPause: false,
    canAutoPlayAtGo: false,
    requiresLocalHelper: true,
    requiresPairing: false,
    requiresAdvancedSetup: true,
    hardwareValidated: false,
    publicClaimLevel: "not-supported-yet",
    manualFallbackRequired: true,
  },
  apple_tv_manual: {
    canTestConnection: false,
    canSendPlay: false,
    canSendPause: false,
    canAutoPlayAtGo: false,
    requiresLocalHelper: false,
    requiresPairing: false,
    requiresAdvancedSetup: false,
    hardwareValidated: false,
    publicClaimLevel: "manual-only",
    manualFallbackRequired: true,
  },
};

export const REMOTE_START_WATCHING_METHOD_CHOICES: RemoteStartWatchingMethodChoice[] =
  [
    {
      id: "built_in_tv_app",
      title: "TV app built into my TV",
      icon: "TV",
      helper:
        "Your TV's built-in streaming apps.",
      nextCopy:
        "Next: choose your TV or device.",
    },
    {
      id: "streaming_stick_or_box",
      title: "Streaming stick or box",
      icon: "▭",
      helper:
        "Roku, Fire TV, Android TV, Google TV, etc.",
      nextCopy:
        "Next: choose your TV or device.",
    },
    {
      id: "game_console_or_other",
      title: "Console / cable / other",
      icon: "?",
      helper:
        "Don’t see yours? More devices coming soon.",
      nextCopy:
        "You’ll both press Play on the countdown tonight.",
    },
  ];

export const REMOTE_START_ONBOARDING_CHOICES: RemoteStartOnboardingChoice[] = [
  {
    platform: "roku",
    title: "Roku / Roku TV",
    badge: "Auto Play (beta)",
    icon: "▣",
    setupPreview: "One-time setup. Works over Wi-Fi.",
    nextCopy: "Pick Roku if your TV or streaming stick says Roku.",
    recommended: true,
    watchingMethods: ["built_in_tv_app", "streaming_stick_or_box"],
  },
  {
    platform: "android_adb",
    title: "Fire TV / Android TV / Google TV",
    badge: "Auto Play (beta)",
    icon: "F",
    setupPreview:
      "One-time setup, about 5 min. Needs Developer Options.",
    nextCopy:
      "Pick this for Fire TV, Firestick, Android TV, Google TV, Chromecast with Google TV, or Google TV Streamer.",
    recommended: true,
    watchingMethods: ["built_in_tv_app", "streaming_stick_or_box"],
  },
  {
    platform: "vizio_smartcast",
    title: "VIZIO TV",
    badge: "Auto Play (beta)",
    icon: "V",
    setupPreview:
      "Pair once with an on-screen code.",
    nextCopy: "Pick this for VIZIO TVs using the built-in TV streaming app.",
    recommended: true,
    watchingMethods: ["built_in_tv_app"],
  },
  {
    platform: "lg_webos",
    title: "LG TV",
    badge: "Auto Play (beta)",
    icon: "LG",
    setupPreview:
      "Pair once through your TV.",
    nextCopy: "Pick this for LG webOS smart TVs.",
    recommended: true,
    watchingMethods: ["built_in_tv_app"],
  },
  {
    platform: "samsung",
    title: "Samsung TV",
    badge: "Auto Play (beta)",
    icon: "S",
    setupPreview: "Pair once through your TV.",
    nextCopy: "Pick this for Samsung/Tizen smart TVs.",
    recommended: true,
    watchingMethods: ["built_in_tv_app"],
  },
  {
    platform: "sony_bravia",
    title: "Sony TV",
    badge: "Auto Play (beta)",
    icon: "B",
    setupPreview:
      "Needs IP Control enabled. Limited models.",
    nextCopy: "Pick this for Sony Bravia TVs with IP Control.",
    recommended: true,
    watchingMethods: ["built_in_tv_app"],
  },
  {
    platform: "apple_tv_manual",
    title: "Other / console / cable box",
    badge: "Manual-only",
    icon: "?",
    setupPreview:
      "Start movie night with manual countdown.",
    nextCopy:
      "Don’t see yours? More devices coming soon.",
    recommended: false,
    watchingMethods: ["game_console_or_other"],
  },
];

export const TV_PLATFORM_OPTIONS: Array<{
  id: LinkedTvPlatform;
  label: string;
  status: PlatformStatusLabel;
  displayLabel?: string;
  helperLabel?: string;
  requiresSecret?: boolean;
}> = [
  {
    id: "roku",
    label: "Roku / Roku TV",
    status: "Auto Play (beta)",
  },
  {
    id: "lg_webos",
    label: "LG webOS",
    status: "Auto Play (beta)",
    requiresSecret: true,
  },
  {
    id: "samsung",
    label: "Samsung / Tizen",
    status: "Auto Play (beta)",
    requiresSecret: true,
  },
  {
    id: "sony_bravia",
    label: "Sony / Bravia",
    status: "Auto Play (beta)",
    requiresSecret: true,
  },
  {
    id: "android_adb",
    label: "Fire TV / Android TV / Google TV",
    status: "Auto Play (beta)",
  },
  {
    id: "philips_jointspace",
    label: "Philips JointSpace",
    status: "Later beta",
  },
  {
    id: "vizio_smartcast",
    label: "VIZIO TV",
    status: "Auto Play (beta)",
    requiresSecret: true,
  },
  {
    id: "home_assistant_webhook",
    label: "Home Assistant local bridge",
    status: "Not supported yet",
  },
  { id: "apple_tv_manual", label: "Apple TV", status: "Manual-only" },
];

const REMOTE_START_WIZARDS: Record<LinkedTvPlatform, RemoteStartWizardSpec> = {
  roku: {
    title: "Roku setup",
    label: "Auto Play (beta)",
    summary:
      "One-time setup — takes about 1 minute.",
    steps: [
      "Make sure your phone/computer and Roku are on the same Wi‑Fi.",
      "If setup fails, turn on “Control by mobile apps” in Roku settings.",
      "Enter your Roku IP address. Find this in Settings → Network → About on your Roku. Usually 192.168.X.XX",
    ],
    tvSideSetting:
      "Your Roku may ask you to allow mobile app control.",
    pairingPersistence:
      "Usually stays ready on the same Wi‑Fi. If your Roku address changes, reconnect it.",
    safeGoCommand: "Play only",
    pausePolicy:
      "Pause is not exposed as a safe automatic command. Pause manually at 00:00.",
    togglePolicy: "No Play/Pause toggle at GO and no blind retries.",
    primaryAction: "Check Roku",
    publicCopy:
      "Roku Auto Play (beta) starts only after setup and a connection test.",
  },
  lg_webos: {
    title: "LG TV setup",
    label: "Auto Play (beta)",
    summary:
      "One-time setup — takes about 2 minutes. After this, we press Play for you every movie night.",
    steps: [
      "Make sure your phone/computer and LG TV are on the same Wi‑Fi.",
      "Approve the on-screen prompt on your TV.",
      "Save setup, then test your connection before movie night.",
    ],
    tvSideSetting: "Your LG TV may show an on-screen prompt.",
    pairingPersistence:
      "Usually stays ready after pairing. Reconnect if your TV sleeps or changes Wi‑Fi.",
    safeGoCommand: "SSAP media.controls/play only",
    pausePolicy:
      "Discrete Pause exists for test/setup; GO still sends Play only.",
    togglePolicy: "No Play/Pause toggle at GO.",
    primaryAction: "Pair TV",
    publicCopy:
      "LG Auto Play (beta) starts only after setup and a connection test.",
  },
  samsung: {
    title: "Samsung TV setup",
    label: "Auto Play (beta)",
    summary:
      "One-time setup. Approve your Samsung TV if it asks, then test your connection.",
    steps: [
      "Enter your Samsung TV IP address.",
      "Approve the on-screen prompt on your TV if one appears.",
      "Save setup, then test your connection on a paused video.",
    ],
    tvSideSetting:
      "Your TV may ask you to approve this device.",
    pairingPersistence:
      "Some Samsung TVs may need reconnecting later.",
    safeGoCommand: "KEY_PLAY only",
    pausePolicy:
      "KEY_PAUSE is available for testing where it behaves discretely.",
    togglePolicy: "Do not use KEY_PLAYPAUSE at GO.",
    primaryAction: "Pair TV",
    publicCopy:
      "Samsung Auto Play (beta) starts only after setup and a connection test.",
  },
  android_adb: {
    title: "Fire TV / Android TV setup",
    label: "Auto Play (beta)",
    summary:
      "One-time setup — takes about 5 minutes. This one needs Developer Options enabled on your TV. We’ll walk you through it.",
    steps: [
      "Enable Developer Options on your TV or streaming device.",
      "Turn on Wireless Debugging or ADB Debugging, then approve the on-screen prompt on your TV.",
      "Pair your TV, then test your connection before movie night.",
    ],
    tvSideSetting:
      "Developer Options and an on-screen approval prompt are required.",
    pairingPersistence:
      "Some devices may need reconnecting after sleep, reboot, or Wi‑Fi changes.",
    safeGoCommand: "KEYCODE_MEDIA_PLAY only",
    pausePolicy:
      "KEYCODE_MEDIA_PAUSE is available for setup/testing; GO uses Play only.",
    togglePolicy: "KEYCODE_MEDIA_PLAY_PAUSE / 85 is blocked for GO.",
    primaryAction: "Connect ADB",
    publicCopy:
      "Auto Play beta. Some devices may need reconnecting.",
  },
  sony_bravia: {
    title: "Sony TV setup",
    label: "Auto Play (beta)",
    summary:
      "One-time setup for supported Sony TVs. Turn on TV control, then test your connection.",
    steps: [
      "Turn on IP Control in your Sony TV settings if your model supports it.",
      "Enter your Sony TV IP address and find the Play code.",
      "Save setup, then test your connection before movie night.",
    ],
    tvSideSetting:
      "Your Sony TV must support IP Control. Some models ask for a PIN or password.",
    pairingPersistence:
      "Usually stays ready if your TV settings and Wi‑Fi stay the same.",
    safeGoCommand: "Discovered Play IRCC code only",
    pausePolicy: "Pause is not exposed as safe in the current panel.",
    togglePolicy: "No toggle command at GO.",
    primaryAction: "Discover Play code",
    publicCopy:
      "Sony Auto Play (beta) supports setup only on compatible Sony TVs.",
  },
  philips_jointspace: {
    title: "Philips TV",
    label: "Later beta",
    summary:
      "Manual countdown is the right path for this TV tonight.",
    steps: [
      "Start movie night with manual countdown.",
      "Try another device if you have one.",
      "We’ll get Auto Play set up in a later session.",
    ],
    tvSideSetting: "Model/API-generation settings vary.",
    pairingPersistence: "Unknown.",
    safeGoCommand: "None for automatic GO",
    pausePolicy: "Toggle-risk pause/play is not safe for automatic setup.",
    togglePolicy: "PlayPause toggle is not allowed for GO.",
    primaryAction: "Use manual countdown",
    publicCopy: "Later beta only; manual countdown remains the public path.",
  },
  vizio_smartcast: {
    title: "VIZIO TV setup",
    label: "Auto Play (beta)",
    summary:
      "Pair once with an on-screen code, then test your connection.",
    steps: [
      "Open the streaming app directly on your VIZIO TV.",
      "Enter your VIZIO TV IP address, then type the code shown on the TV.",
      "Test your connection. If it does not start the paused video, start movie night anyway.",
    ],
    tvSideSetting: "Your VIZIO TV will show a code during pairing.",
    pairingPersistence:
      "Pairing is saved on this device. Some models may need reconnecting.",
    safeGoCommand: "VIZIO key_command Play only",
    pausePolicy:
      "Pause is not part of PLAY. After the test starts your video, pause it again.",
    togglePolicy:
      "No app launch, title launch, Cast takeover, or Play/Pause toggle at GO.",
    primaryAction: "Pair with TV code",
    publicCopy:
      "VIZIO Auto Play starts only after setup and a connection test.",
  },
  home_assistant_webhook: {
    title: "Other setup",
    label: "Not supported yet",
    summary:
      "Manual countdown is the right path tonight unless you already have your own local automation.",
    steps: [
      "Use manual countdown unless you already run HA locally.",
      "Keep webhook URLs local/private.",
      "Do not present HA/Broadlink/CEC as default consumer setup.",
    ],
    tvSideSetting: "External bridge setup outside Watch Sync.",
    pairingPersistence: "Depends on the user bridge.",
    safeGoCommand: "User-owned automation only",
    pausePolicy: "Depends on bridge; not public support.",
    togglePolicy: "User automation must avoid toggle-risk GO.",
    primaryAction: "Use manual countdown",
    publicCopy: "Not a default consumer path.",
  },
  apple_tv_manual: {
    title: "Apple TV",
    label: "Manual-only",
    summary:
      "Manual countdown is the right path for Apple TV tonight.",
    steps: [
      "Open the title on Apple TV yourself.",
      "Pause at 00:00.",
      "Use the countdown and press Play yourself at PLAY.",
    ],
    tvSideSetting: "None for Watch Sync public control.",
    pairingPersistence:
      "No setup needed.",
    safeGoCommand: "None",
    pausePolicy: "Manual pause only.",
    togglePolicy:
      "No private Apple APIs and no reverse-engineered public headline claim.",
    primaryAction: "Use manual countdown",
    publicCopy:
      "Apple TV uses manual countdown tonight.",
  },
};

export function getRemoteStartWizard(
  platform: LinkedTvPlatform,
): RemoteStartWizardSpec {
  return REMOTE_START_WIZARDS[platform];
}

export function getRemoteStartCapability(
  platform: LinkedTvPlatform,
): RemoteStartCapability {
  return REMOTE_START_CAPABILITIES[platform];
}

export function loadLinkedTvDevice(
  storage: Storage = localStorage,
): LinkedTvDevice | null {
  const raw = storage.getItem(LINKED_TV_DEVICE_KEY);
  if (!raw) return null;
  try {
    return normalizeLinkedTvDevice(JSON.parse(raw) as Partial<LinkedTvDevice>);
  } catch {
    return null;
  }
}

export function saveLinkedTvDevice(
  device: LinkedTvDevice,
  storage: Storage = localStorage,
): void {
  storage.setItem(
    LINKED_TV_DEVICE_KEY,
    JSON.stringify(normalizeLinkedTvDevice(device)),
  );
}

export function normalizeLinkedTvDevice(
  device: Partial<LinkedTvDevice>,
): LinkedTvDevice {
  const platform = isLinkedTvPlatform(device.platform)
    ? device.platform
    : "roku";
  return {
    platform,
    label: trimOr(
      device.label,
      TV_PLATFORM_OPTIONS.find((option) => option.id === platform)?.label ??
        "Linked TV",
    ),
    host: trimOr(device.host, ""),
    helperUrl: trimOr(device.helperUrl, "http://127.0.0.1:8790"),
    url: optionalTrim(device.url),
    webhookUrl: optionalTrim(device.webhookUrl),
    clientKey: optionalTrim(device.clientKey),
    token: optionalTrim(device.token),
    psk: optionalTrim(device.psk),
    irccCode: optionalTrim(device.irccCode),
    apiVersion:
      typeof device.apiVersion === "number" &&
      Number.isFinite(device.apiVersion)
        ? device.apiVersion
        : undefined,
    authToken: optionalTrim(device.authToken),
    lastTestedAt: optionalTrim(device.lastTestedAt),
    useRemoteStartAtGo: device.useRemoteStartAtGo === true,
  };
}

export function getRemoteStartReadiness(
  deviceInput: LinkedTvDevice,
  lastHelperOk = Boolean(deviceInput.lastTestedAt),
  config?: RemoteStartRuntimeConfig,
  internalUnlocked = true,
): RemoteStartReadinessResult {
  const device = normalizeLinkedTvDevice(deviceInput);
  const capability = getRemoteStartCapability(device.platform);
  if (
    config &&
    !isRemoteStartPlatformEnabled(device.platform, config, internalUnlocked)
  ) {
    return {
      state: "manual_tonight",
      label: "Manual countdown tonight",
      reason:
        "Auto Play beta is paused for this session; manual countdown remains available.",
    };
  }
  const missingConfig =
    device.platform === "home_assistant_webhook"
      ? !device.webhookUrl?.trim()
      : platformNeedsHost(device.platform) && !device.host.trim();

  if (capability.publicClaimLevel === "not-supported-yet") {
    return {
      state: "unsupported",
      label: "Not supported yet",
      reason: "This device is not currently an Auto Play setup target.",
    };
  }
  if (
    capability.publicClaimLevel === "manual-only" ||
    !capability.canSendPlay
  ) {
    return {
      state: "manual_tonight",
      label: "Manual countdown tonight",
      reason:
        "This device uses manual countdown tonight.",
    };
  }
  if (missingConfig) {
    return {
      state: "not_configured",
      label: "Needs setup",
      reason:
        "Add the local device/helper details before enabling Auto Play.",
    };
  }
  if (
    capability.requiresPairing &&
    device.platform === "lg_webos" &&
    !device.clientKey
  ) {
    return {
      state: "needs_setup",
      label: "Needs setup",
      reason: "LG TV needs pairing approval before Auto Play.",
    };
  }
  if (device.platform === "sony_bravia" && !device.irccCode) {
    return {
      state: "needs_setup",
      label: "Needs setup",
      reason:
        "Sony TV needs TV control enabled and a saved Play code.",
    };
  }
  if (!lastHelperOk) {
    return {
      state: "reconnect_needed",
      label: "Reconnect needed",
      reason:
        "Test your connection before movie night.",
    };
  }
  if (!capability.hardwareValidated) {
    return {
      state: "unverified_hardware_behavior",
      label: "Device behavior not verified yet",
      reason:
        "Software checks passed, but real TV behavior still needs a device test.",
    };
  }
  return {
    state: "ready",
    label: "Auto Play ready",
    reason: "Connection test and real-device check are current.",
  };
}

export function canUseRemoteStartAtGo(
  deviceInput: LinkedTvDevice,
  config?: RemoteStartRuntimeConfig,
  internalUnlocked = true,
): boolean {
  const device = normalizeLinkedTvDevice(deviceInput);
  const capability = getRemoteStartCapability(device.platform);
  if (
    config &&
    !isRemoteStartPlatformEnabled(device.platform, config, internalUnlocked)
  )
    return false;
  if (
    capability.publicClaimLevel !== "primary-beta" &&
    capability.publicClaimLevel !== "guided-setup-beta"
  )
    return false;
  if (!device.lastTestedAt) return false;
  if (
    !device.useRemoteStartAtGo ||
    !capability.canAutoPlayAtGo ||
    !capability.safeGoCommand
  )
    return false;
  if (buildDevicePlayRequest(device, config, internalUnlocked).unsafeReason)
    return false;
  return true;
}

export function isAllowedLocalHelperUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  if (parsed.username || parsed.password) return false;
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local")
  )
    return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  const private172 = host.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31)
    return true;
  return false;
}

export function buildDeviceTestRequest(
  deviceInput: LinkedTvDevice,
  config?: RemoteStartRuntimeConfig,
  internalUnlocked = true,
): HelperRequestSpec {
  const device = normalizeLinkedTvDevice(deviceInput);
  if (
    config &&
    !isRemoteStartPlatformEnabled(device.platform, config, internalUnlocked)
  )
    return unsafe(
      "Auto Play beta is paused or unavailable for this device. Start movie night with manual countdown.",
    );
  if (!getRemoteStartCapability(device.platform).canTestConnection)
    return unsafe(
      `${device.label} is manual-only. Use the manual countdown fallback.`,
    );
  if (device.platform === "home_assistant_webhook")
    return buildHomeAssistantWebhookRequest(device, true);
  if (device.platform === "apple_tv_manual")
    return unsafe(
      "Apple TV is manual-only. Watch Sync does not claim direct Apple TV remote control.",
    );
  requireHost(device);
  switch (device.platform) {
    case "roku":
      return {
        path: "/roku/keypress",
        method: "POST",
        body: { host: device.host, key: "Play" },
      };
    case "lg_webos":
      if (!device.clientKey)
        return unsafe(
          "LG TV needs pairing approval before testing the connection.",
        );
      return {
        path: "/lg/keypress",
        method: "POST",
        body: compactBody({
          host: device.host,
          url: device.url,
          clientKey: device.clientKey,
          command: "play",
        }),
      };
    case "samsung":
      return {
        path: "/samsung/keypress",
        method: "POST",
        body: compactBody({
          host: device.host,
          url: device.url,
          token: device.token,
          key: "KEY_PLAY",
        }),
      };
    case "android_adb":
      return {
        path: "/adb/connect",
        method: "POST",
        body: { host: device.host },
      };
    case "sony_bravia":
      if (!device.irccCode)
        return unsafe(
          "Sony TV needs a saved Play code before testing the connection.",
        );
      return {
        path: "/sony/keypress",
        method: "POST",
        body: compactBody({
          host: device.host,
          url: device.url,
          psk: device.psk,
          irccCode: device.irccCode,
        }),
      };
    case "philips_jointspace":
      return {
        path: "/philips/key",
        method: "POST",
        body: compactBody({
          host: device.host,
          url: device.url,
          apiVersion: device.apiVersion,
          key: "Pause",
        }),
      };
    case "vizio_smartcast":
      return {
        path: "/vizio/keypress",
        method: "POST",
        body: compactBody({
          host: device.host,
          url: device.url,
          authToken: device.authToken,
          key: "play",
        }),
      };
  }
}

export function buildDevicePlayRequest(
  deviceInput: LinkedTvDevice,
  config?: RemoteStartRuntimeConfig,
  internalUnlocked = true,
): HelperRequestSpec {
  const device = normalizeLinkedTvDevice(deviceInput);
  const capability = getRemoteStartCapability(device.platform);
  if (
    config &&
    !isRemoteStartPlatformEnabled(device.platform, config, internalUnlocked)
  )
    return unsafe(
      "Auto Play beta is paused or unavailable for this device. Start movie night with manual countdown.",
    );
  if (
    capability.publicClaimLevel !== "primary-beta" &&
    capability.publicClaimLevel !== "guided-setup-beta"
  )
    return unsafe(
      `${device.label} is not a public Auto Play lane. Use manual countdown.`,
    );
  if (!capability.canSendPlay)
    return unsafe(
      `${device.label} is manual-only. Watch Sync will not send remote commands.`,
    );
  if (device.platform === "home_assistant_webhook")
    return buildHomeAssistantWebhookRequest(device, false);
  if (device.platform === "apple_tv_manual")
    return unsafe(
      "Apple TV is manual-only. Watch Sync does not claim direct Apple TV remote control.",
    );
  requireHost(device);
  switch (device.platform) {
    case "roku":
      return {
        path: "/roku/keypress",
        method: "POST",
        body: { host: device.host, key: "Play" },
      };
    case "lg_webos":
      if (!device.clientKey)
        return unsafe(
          "LG TV needs pairing approval before Auto Play can press Play.",
        );
      return {
        path: "/lg/keypress",
        method: "POST",
        body: compactBody({
          host: device.host,
          url: device.url,
          clientKey: device.clientKey,
          command: "play",
        }),
      };
    case "samsung":
      return {
        path: "/samsung/keypress",
        method: "POST",
        body: compactBody({
          host: device.host,
          url: device.url,
          token: device.token,
          key: "KEY_PLAY",
        }),
      };
    case "android_adb":
      return {
        path: "/adb/media-key",
        method: "POST",
        body: { host: device.host, key: "KEYCODE_MEDIA_PLAY" },
      };
    case "sony_bravia":
      if (!device.irccCode)
        return unsafe(
          "Sony Bravia needs a Play IRCC code from remote-controller-info before GO can send Play.",
        );
      return {
        path: "/sony/keypress",
        method: "POST",
        body: compactBody({
          host: device.host,
          url: device.url,
          psk: device.psk,
          irccCode: device.irccCode,
        }),
      };
    case "philips_jointspace":
      return unsafe(
        "Philips JointSpace PlayPause is a risky toggle, so GO will not send it automatically. Use manual countdown.",
      );
    case "vizio_smartcast":
      return {
        path: "/vizio/keypress",
        method: "POST",
        body: compactBody({
          host: device.host,
          url: device.url,
          authToken: device.authToken,
          key: "play",
        }),
      };
  }
}

export function buildDevicePauseRequest(
  deviceInput: LinkedTvDevice,
): HelperRequestSpec {
  const device = normalizeLinkedTvDevice(deviceInput);
  const capability = getRemoteStartCapability(device.platform);
  if (!capability.canSendPause) {
    if (device.platform === "roku")
      return unsafe(
        "Roku Pause is not claimed safe for this Auto Play panel. Pause manually at the sync point.",
      );
    if (device.platform === "philips_jointspace")
      return unsafe(
        "Philips pause uses a PlayPause toggle-risk path, so Watch Sync does not expose it as safe pause.",
      );
    return unsafe(
      `${device.label} is manual-only or does not have a safe Pause command. Pause manually at the sync point.`,
    );
  }
  requireHost(device);
  switch (device.platform) {
    case "lg_webos":
      if (!device.clientKey)
        return unsafe(
          "LG TV needs pairing approval before testing pause.",
        );
      return {
        path: "/lg/keypress",
        method: "POST",
        body: compactBody({
          host: device.host,
          url: device.url,
          clientKey: device.clientKey,
          command: "pause",
        }),
      };
    case "samsung":
      return {
        path: "/samsung/keypress",
        method: "POST",
        body: compactBody({
          host: device.host,
          url: device.url,
          token: device.token,
          key: "KEY_PAUSE",
        }),
      };
    case "android_adb":
      return {
        path: "/adb/media-key",
        method: "POST",
        body: { host: device.host, key: "KEYCODE_MEDIA_PAUSE" },
      };
    case "vizio_smartcast":
      return {
        path: "/vizio/keypress",
        method: "POST",
        body: compactBody({
          host: device.host,
          url: device.url,
          authToken: device.authToken,
          key: "pause",
        }),
      };
    case "roku":
    case "sony_bravia":
    case "philips_jointspace":
    case "home_assistant_webhook":
    case "apple_tv_manual":
      return unsafe("No safe Pause command is available for this platform.");
  }
}

export function platformNeedsPairing(platform: LinkedTvPlatform): boolean {
  return (
    getRemoteStartCapability(platform).requiresPairing &&
    platform !== "android_adb"
  );
}

export function platformNeedsSonyIrcc(platform: LinkedTvPlatform): boolean {
  return platform === "sony_bravia";
}

export function platformNeedsHost(platform: LinkedTvPlatform): boolean {
  return (
    platform !== "home_assistant_webhook" && platform !== "apple_tv_manual"
  );
}

export function getVisibleRemoteStartChoices(
  method: RemoteStartWatchingMethod | "",
  config: RemoteStartRuntimeConfig = DEFAULT_REMOTE_START_RUNTIME_CONFIG,
  internalUnlocked = false,
): RemoteStartOnboardingChoice[] {
  if (!method) return [];
  return REMOTE_START_ONBOARDING_CHOICES.filter((choice) => {
    if (!choice.watchingMethods.includes(method)) return false;
    if (choice.platform === "apple_tv_manual") return true;
    return isRemoteStartPlatformEnabled(
      choice.platform,
      config,
      internalUnlocked,
    );
  });
}

export function getVisibleTvPlatformOptions(
  config: RemoteStartRuntimeConfig = DEFAULT_REMOTE_START_RUNTIME_CONFIG,
  internalUnlocked = false,
): typeof TV_PLATFORM_OPTIONS {
  return TV_PLATFORM_OPTIONS.filter(
    (option) =>
      option.id === "apple_tv_manual" ||
      REMOTE_START_ONBOARDING_CHOICES.some(
        (choice) => choice.platform === option.id,
      ) ||
      isRemoteStartPlatformEnabled(option.id, config, internalUnlocked),
  );
}

function isLinkedTvPlatform(value: unknown): value is LinkedTvPlatform {
  return (
    typeof value === "string" &&
    TV_PLATFORM_OPTIONS.some((option) => option.id === value)
  );
}

function requireHost(device: LinkedTvDevice): void {
  if (!device.host.trim())
    throw new Error("Enter your TV IP address first.");
}

function buildHomeAssistantWebhookRequest(
  device: LinkedTvDevice,
  test: boolean,
): HelperRequestSpec {
  if (!device.webhookUrl) {
    return unsafe(
      "Enter a Home Assistant webhook URL first. Manual countdown still works.",
    );
  }
  return {
    path: "/home-assistant/webhook",
    method: "POST",
    body: compactBody({
      webhookUrl: device.webhookUrl,
      test: test ? true : undefined,
    }),
  };
}

function unsafe(unsafeReason: string): HelperRequestSpec {
  return { path: "", method: "POST", unsafeReason };
}

function compactBody(body: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(body).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  );
}

function optionalTrim(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function trimOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}
