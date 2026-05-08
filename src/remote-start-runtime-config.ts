import type { LinkedTvPlatform } from "./tv-remote-device";

export type RemoteStartRuntimeAudience = "off" | "internal" | "all";

export interface RemoteStartRuntimeConfig {
  remoteStartPublicEnabled: boolean;
  remoteStartRuntimeBetaAudience: RemoteStartRuntimeAudience;
  remoteStartKillSwitchEnabled: boolean;
  rokuRuntimeBetaEnabled: boolean;
  vizioRuntimeBetaEnabled: boolean;
  lgRuntimeBetaEnabled: boolean;
  samsungRuntimeBetaEnabled: boolean;
  sonyRuntimeBetaEnabled: boolean;
}

export const DEFAULT_REMOTE_START_RUNTIME_CONFIG: RemoteStartRuntimeConfig = {
  remoteStartPublicEnabled: false,
  remoteStartRuntimeBetaAudience: "internal",
  remoteStartKillSwitchEnabled: false,
  rokuRuntimeBetaEnabled: false,
  vizioRuntimeBetaEnabled: false,
  lgRuntimeBetaEnabled: false,
  samsungRuntimeBetaEnabled: false,
  sonyRuntimeBetaEnabled: false,
};

const INTERNAL_BETA_STORAGE_KEY = "watch-sync.remoteStartInternalBeta.v1";

export function normalizeRemoteStartRuntimeConfig(
  input: unknown,
): RemoteStartRuntimeConfig {
  const raw =
    typeof input === "object" && input
      ? (input as Partial<Record<keyof RemoteStartRuntimeConfig, unknown>>)
      : {};
  const audience =
    raw.remoteStartRuntimeBetaAudience === "all" ||
    raw.remoteStartRuntimeBetaAudience === "off" ||
    raw.remoteStartRuntimeBetaAudience === "internal"
      ? raw.remoteStartRuntimeBetaAudience
      : DEFAULT_REMOTE_START_RUNTIME_CONFIG.remoteStartRuntimeBetaAudience;

  return {
    remoteStartPublicEnabled: raw.remoteStartPublicEnabled === true,
    remoteStartRuntimeBetaAudience: audience,
    remoteStartKillSwitchEnabled: raw.remoteStartKillSwitchEnabled === true,
    rokuRuntimeBetaEnabled: raw.rokuRuntimeBetaEnabled === true,
    vizioRuntimeBetaEnabled: raw.vizioRuntimeBetaEnabled === true,
    lgRuntimeBetaEnabled: raw.lgRuntimeBetaEnabled === true,
    samsungRuntimeBetaEnabled: raw.samsungRuntimeBetaEnabled === true,
    sonyRuntimeBetaEnabled: raw.sonyRuntimeBetaEnabled === true,
  };
}

export function isRemoteStartInternalBetaUnlocked(
  urlSearch = typeof window === "undefined" ? "" : window.location.search,
  storage: Storage | null = typeof localStorage === "undefined"
    ? null
    : localStorage,
): boolean {
  const params = new URLSearchParams(urlSearch);
  const requested = params.get("remoteStartBeta");
  if (requested === "internal") {
    storage?.setItem(INTERNAL_BETA_STORAGE_KEY, "internal");
    return true;
  }
  if (requested === "off") {
    storage?.removeItem(INTERNAL_BETA_STORAGE_KEY);
    return false;
  }
  return storage?.getItem(INTERNAL_BETA_STORAGE_KEY) === "internal";
}

export function isRuntimeBetaFlagEnabled(
  platform: LinkedTvPlatform,
  config: RemoteStartRuntimeConfig,
): boolean {
  switch (platform) {
    case "roku":
      return config.rokuRuntimeBetaEnabled;
    case "vizio_smartcast":
      return config.vizioRuntimeBetaEnabled;
    case "lg_webos":
      return config.lgRuntimeBetaEnabled;
    case "samsung":
      return config.samsungRuntimeBetaEnabled;
    case "sony_bravia":
      return config.sonyRuntimeBetaEnabled;
    case "android_adb":
    case "philips_jointspace":
    case "home_assistant_webhook":
    case "apple_tv_manual":
      return false;
  }
}

export function isRemoteStartPlatformEnabled(
  platform: LinkedTvPlatform,
  config: RemoteStartRuntimeConfig,
  internalUnlocked = false,
): boolean {
  if (config.remoteStartKillSwitchEnabled) return false;
  if (config.remoteStartPublicEnabled) return true;
  if (config.remoteStartRuntimeBetaAudience === "all")
    return isRuntimeBetaFlagEnabled(platform, config);
  if (config.remoteStartRuntimeBetaAudience === "internal" && internalUnlocked)
    return isRuntimeBetaFlagEnabled(platform, config);
  return false;
}

export type InternalRemoteStartBetaPlatform = "vizio" | "lg" | "sony" | "samsung";

export function applyInternalRemoteStartBetaPlatform(
  config: RemoteStartRuntimeConfig,
  urlSearch = typeof window === "undefined" ? "" : window.location.search,
): RemoteStartRuntimeConfig {
  const params = new URLSearchParams(urlSearch);
  const platform = params.get(
    "platformBeta",
  ) as InternalRemoteStartBetaPlatform | null;
  if (
    config.remoteStartRuntimeBetaAudience !== "internal" ||
    !isRemoteStartInternalBetaUnlocked(urlSearch)
  )
    return config;
  return {
    ...config,
    rokuRuntimeBetaEnabled: platform ? false : config.rokuRuntimeBetaEnabled,
    vizioRuntimeBetaEnabled: platform === "vizio",
    lgRuntimeBetaEnabled: platform === "lg",
    sonyRuntimeBetaEnabled: platform === "sony",
    samsungRuntimeBetaEnabled: platform === "samsung",
  };
}

export const applyQaRemoteStartBetaPlatform =
  applyInternalRemoteStartBetaPlatform;
