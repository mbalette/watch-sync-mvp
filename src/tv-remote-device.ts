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
  | "Remote Start beta / primary"
  | "Remote Start beta"
  | "Remote Start beta for supported Sony TVs"
  | "Guided setup beta"
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
    | "Remote Start ready"
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
        "Netflix, Hulu, Disney+, Prime, Max, or YouTube opened from the TV home screen.",
      nextCopy:
        "Next, pick your TV brand so Watch Sync can show the right setup steps.",
    },
    {
      id: "streaming_stick_or_box",
      title: "Streaming stick or box",
      icon: "▭",
      helper:
        "Roku devices can use the internal beta; other streaming boxes stay manual tonight.",
      nextCopy:
        "Next, pick Roku if the device says Roku, or use manual countdown for other streaming boxes.",
    },
    {
      id: "game_console_or_other",
      title: "Game console / cable box / not sure",
      icon: "?",
      helper:
        "Consoles, cable boxes, casting sessions, or anything not listed stay on manual countdown.",
      nextCopy:
        "Manual countdown works tonight. Remote Start only appears when a safe local Play path exists.",
    },
  ];

export const REMOTE_START_ONBOARDING_CHOICES: RemoteStartOnboardingChoice[] = [
  {
    platform: "roku",
    title: "Roku / Roku TV",
    badge: "Remote Start beta / primary",
    icon: "▣",
    setupPreview: "Start here for Roku devices: enter the Roku IP, save, then Test Play.",
    nextCopy: "Pick Roku if your TV or streaming stick says Roku.",
    recommended: true,
    watchingMethods: ["built_in_tv_app", "streaming_stick_or_box"],
  },
  {
    platform: "vizio_smartcast",
    title: "VIZIO TV",
    badge: "Remote Start beta",
    icon: "V",
    setupPreview:
      "Pair with the TV code, save the auth token locally, then Test Play.",
    nextCopy: "Pick this for VIZIO TVs using the built-in TV streaming app.",
    recommended: true,
    watchingMethods: ["built_in_tv_app"],
  },
  {
    platform: "lg_webos",
    title: "LG TV",
    badge: "Remote Start beta / primary",
    icon: "LG",
    setupPreview:
      "Pair on the TV prompt, save the local client key, then Test Play.",
    nextCopy: "Pick this for LG webOS smart TVs.",
    recommended: true,
    watchingMethods: ["built_in_tv_app"],
  },
  {
    platform: "samsung",
    title: "Samsung TV",
    badge: "Remote Start beta",
    icon: "S",
    setupPreview: "Approve the TV prompt/token if shown, then Test Play.",
    nextCopy: "Pick this for Samsung/Tizen smart TVs.",
    recommended: true,
    watchingMethods: ["built_in_tv_app"],
  },
  {
    platform: "sony_bravia",
    title: "Sony Bravia TV",
    badge: "Remote Start beta for supported Sony TVs",
    icon: "B",
    setupPreview:
      "Enable IP Control on supported Bravia models, then discover/test Play.",
    nextCopy: "Pick this for Sony Bravia TVs with IP Control.",
    recommended: true,
    watchingMethods: ["built_in_tv_app"],
  },
  {
    platform: "apple_tv_manual",
    title: "Apple TV / not sure",
    badge: "Manual-only",
    icon: "",
    setupPreview:
      "No direct Remote Start claim yet. Use manual countdown tonight.",
    nextCopy:
      "If your device is not listed, use manual countdown. It still works with any TV.",
    recommended: false,
    watchingMethods: ["streaming_stick_or_box", "game_console_or_other"],
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
    status: "Remote Start beta / primary",
  },
  {
    id: "lg_webos",
    label: "LG webOS",
    status: "Remote Start beta / primary",
    requiresSecret: true,
  },
  {
    id: "samsung",
    label: "Samsung / Tizen",
    status: "Remote Start beta",
    requiresSecret: true,
  },
  {
    id: "sony_bravia",
    label: "Sony / Bravia",
    status: "Remote Start beta for supported Sony TVs",
    requiresSecret: true,
  },
  {
    id: "philips_jointspace",
    label: "Philips JointSpace",
    status: "Later beta",
  },
  {
    id: "vizio_smartcast",
    label: "VIZIO TV",
    status: "Remote Start beta",
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
    title: "Roku / Roku TV setup",
    label: "Remote Start beta / primary",
    summary:
      "First internal Remote Start lane: local Roku ECP Play at GO after the user opens and pauses the title.",
    steps: [
      "Keep this device and your Watch Sync helper on the same Wi-Fi/LAN.",
      "If keypresses fail, enable Roku Control by mobile apps / Network access in TV settings.",
      "Enter the Roku IP or hostname, save locally, then Test Play before movie night.",
    ],
    tvSideSetting:
      "May require Control by mobile apps / Network access on newer Roku OS builds.",
    pairingPersistence:
      "No token pairing. Reliability depends on LAN access, device reachability, and IP/discovery.",
    safeGoCommand: "Play only",
    pausePolicy:
      "Pause is not exposed as a safe automatic command. Pause manually at 00:00.",
    togglePolicy: "No Play/Pause toggle at GO and no blind retries.",
    primaryAction: "Check Roku",
    publicCopy:
      "Roku Remote Start beta sends one local Play command at GO. Manual countdown remains available as fallback.",
  },
  lg_webos: {
    title: "LG webOS setup",
    label: "Remote Start beta / primary",
    summary:
      "Pair with the TV prompt, save the LG client key locally, then test discrete Play/Pause.",
    steps: [
      "Enter the LG TV IP or hostname and keep the helper on the same LAN.",
      "Run Pair/Test and accept the pairing prompt on the TV.",
      "Save the client key locally, then Test Play/Pause before movie night.",
    ],
    tvSideSetting: "LG Connect Apps / TV prompt pairing may be required.",
    pairingPersistence:
      "Client key is expected to persist but must be hardware-validated after sleep/reboot/helper restart.",
    safeGoCommand: "SSAP media.controls/play only",
    pausePolicy:
      "Discrete Pause exists for test/setup; GO still sends Play only.",
    togglePolicy: "No Play/Pause toggle at GO.",
    primaryAction: "Pair TV",
    publicCopy:
      "LG webOS Remote Start beta uses local TV pairing. Hardware behavior is not verified yet.",
  },
  samsung: {
    title: "Samsung Tizen setup",
    label: "Remote Start beta",
    summary:
      "Beta local-key path after Samsung TV approval/token when required; model variance expected.",
    steps: [
      "Enter the Samsung TV IP or hostname and optional protocol URL/token if already known.",
      "Run Pair/Test and approve the TV prompt if shown.",
      "Save the token locally, then Test Play/Pause on a paused video.",
    ],
    tvSideSetting:
      "TV approval prompt/token may be required; ports and behavior vary by model/firmware.",
    pairingPersistence:
      "Token persistence is model-dependent and hardware-unverified.",
    safeGoCommand: "KEY_PLAY only",
    pausePolicy:
      "KEY_PAUSE is available for testing where it behaves discretely.",
    togglePolicy: "Do not use KEY_PLAYPAUSE at GO.",
    primaryAction: "Pair TV",
    publicCopy:
      "Samsung Remote Start beta is for supported TVs after local approval; not official universal support.",
  },
  android_adb: {
    title: "Fire / Android / Google TV guided setup",
    label: "Guided setup beta",
    summary:
      "Guided ADB beta for Fire OS, Android TV, Google TV, Nvidia Shield, Onn, Chromecast with Google TV, and Google TV Streamer. Fire TV Vega is not supported yet.",
    steps: [
      "Open Developer Options / debugging on the TV or streamer.",
      "Enter the device IP/port or wireless debugging pairing code flow, then approve the prompt.",
      "Run Connect ADB + Test Play. Some devices may need reconnect before movie night.",
    ],
    tvSideSetting:
      "Developer Options, ADB/wireless debugging, and an approval prompt are required.",
    pairingPersistence:
      "May persist with stable ADB keys, but sleep/reboot/network changes remain hardware-unverified.",
    safeGoCommand: "KEYCODE_MEDIA_PLAY only",
    pausePolicy:
      "KEYCODE_MEDIA_PAUSE is available for setup/testing; GO uses Play only.",
    togglePolicy: "KEYCODE_MEDIA_PLAY_PAUSE / 85 is blocked for GO.",
    primaryAction: "Connect ADB",
    publicCopy:
      "Guided setup beta. Some devices may need reconnect. Manual countdown remains available as fallback.",
  },
  sony_bravia: {
    title: "Sony Bravia setup",
    label: "Remote Start beta for supported Sony TVs",
    summary:
      "Supported Bravia/IP Control models can use local IRCC Play after IP Control and Play-code discovery.",
    steps: [
      "Enable IP Control on the supported Sony Bravia TV and configure PSK/PIN if needed.",
      "Enter the TV IP/hostname and run remote-controller-info to discover the Play IRCC code.",
      "Save the Play IRCC code locally, then Test Play before movie night.",
    ],
    tvSideSetting:
      "IP Control must be enabled and supported by the model; PSK/PIN may be required.",
    pairingPersistence:
      "Expected to persist while IP Control/PSK remain stable, but hardware validation is required.",
    safeGoCommand: "Discovered Play IRCC code only",
    pausePolicy: "Pause is not exposed as safe in the current panel.",
    togglePolicy: "No toggle command at GO.",
    primaryAction: "Discover Play code",
    publicCopy:
      "Remote Start beta for supported Sony TVs only. Do not imply all Sony Google TVs work.",
  },
  philips_jointspace: {
    title: "Philips JointSpace later beta",
    label: "Later beta",
    summary:
      "Later/experimental only because common paths expose PlayPause toggle risk.",
    steps: [
      "Use manual countdown tonight.",
      "Only revisit this adapter after primary lanes are validated.",
      "Do not enable automatic GO unless a discrete Play path is proven.",
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
    title: "VIZIO Remote Start Beta",
    label: "Remote Start beta",
    summary:
      "Watch Sync will pair with your VIZIO TV and test one Play command. Remote Start is only enabled if the test starts your paused video.",
    steps: [
      "Open the streaming app directly on your VIZIO TV; do not use phone/tablet/computer casting for this beta.",
      "Enter the TV IP, start pairing, then enter the newest code shown on the TV.",
      "Test Play sends one Play command; use Manual Play tonight if it does not start the paused video.",
    ],
    tvSideSetting: "Your VIZIO TV will show a code during pairing.",
    pairingPersistence:
      "Auth token is stored locally after pairing and must be hardware-validated by model.",
    safeGoCommand: "VIZIO key_command Play only",
    pausePolicy:
      "Pause is not part of GO. Keep the video paused manually after Test Play confirmation.",
    togglePolicy:
      "No app launch, title launch, Cast takeover, or Play/Pause toggle at GO.",
    primaryAction: "Pair with TV code",
    publicCopy:
      "VIZIO Remote Start Beta tests one local Play command only after direct-TV-app setup.",
  },
  home_assistant_webhook: {
    title: "Home Assistant bridge",
    label: "Not supported yet",
    summary:
      "Not a D2C default. Only use if a user already has local Home Assistant automation.",
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
      "Manual-only by default. No public App-Store-safe direct-control path is proven.",
    steps: [
      "Open the title on Apple TV yourself.",
      "Pause at 00:00.",
      "Use the Watch Sync countdown and press Play manually at GO.",
    ],
    tvSideSetting: "None for Watch Sync public control.",
    pairingPersistence:
      "No public Watch Sync pairing. Reverse-engineered pairing is not headline support.",
    safeGoCommand: "None",
    pausePolicy: "Manual pause only.",
    togglePolicy:
      "No private Apple APIs and no reverse-engineered public headline claim.",
    primaryAction: "Use manual countdown",
    publicCopy:
      "Apple TV stays manual-only unless an explicit internal beta is accepted later.",
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
        "Remote Start beta is paused or not enabled for this audience; manual countdown remains available.",
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
      reason: "This platform is not currently a D2C Remote Start target.",
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
        "This platform stays manual-only unless a safe public control path is proven.",
    };
  }
  if (missingConfig) {
    return {
      state: "not_configured",
      label: "Needs setup",
      reason:
        "Add the local device/helper details before enabling Remote Start.",
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
      reason: "LG webOS needs TV prompt pairing and a saved client key.",
    };
  }
  if (device.platform === "sony_bravia" && !device.irccCode) {
    return {
      state: "needs_setup",
      label: "Needs setup",
      reason:
        "Sony Bravia needs IP Control enabled and a discovered Play IRCC code.",
    };
  }
  if (!lastHelperOk) {
    return {
      state: "reconnect_needed",
      label: "Reconnect needed",
      reason:
        "Run Pair/Test before movie night so the helper can confirm the device is reachable.",
    };
  }
  if (!capability.hardwareValidated) {
    return {
      state: "unverified_hardware_behavior",
      label: "Device behavior not verified yet",
      reason:
        "Mock/helper checks passed, but real TV/app behavior is still hardware-unverified.",
    };
  }
  return {
    state: "ready",
    label: "Remote Start ready",
    reason: "Hardware validation and the local helper check are both current.",
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
      "Remote Start beta is paused or unavailable for this device. Use manual countdown tonight.",
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
      return {
        path: "/lg/pair/start",
        method: "POST",
        body: compactBody({
          host: device.host,
          url: device.url,
          clientKey: device.clientKey,
        }),
      };
    case "samsung":
      return {
        path: "/samsung/pair/start",
        method: "POST",
        body: compactBody({
          host: device.host,
          url: device.url,
          token: device.token,
        }),
      };
    case "android_adb":
      return {
        path: "/adb/connect",
        method: "POST",
        body: { host: device.host },
      };
    case "sony_bravia":
      return {
        path: "/sony/connect",
        method: "POST",
        body: compactBody({
          host: device.host,
          url: device.url,
          psk: device.psk,
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
      "Remote Start beta is paused or unavailable for this device. Use manual countdown tonight.",
    );
  if (
    capability.publicClaimLevel !== "primary-beta" &&
    capability.publicClaimLevel !== "guided-setup-beta"
  )
    return unsafe(
      `${device.label} is not a public Remote Start lane. Use manual countdown.`,
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
          "LG webOS needs a paired client key before GO can send Play.",
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
        path: "/sony/ircc",
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
        "Roku Pause is not claimed safe for this Remote Start panel. Pause manually at the sync point.",
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
          "LG webOS needs a paired client key before sending Pause.",
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
    throw new Error("Enter a TV IP address or hostname first.");
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
