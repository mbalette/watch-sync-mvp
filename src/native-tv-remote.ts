import { Capacitor } from "@capacitor/core";
import { TVRemote, type TVProtocol, type TVRemoteBridge } from "../packages/tv-remote-bridge";
import type { LinkedTvDevice } from "./tv-remote-device";

export interface NativeTvRemoteReadyCandidate {
  deviceId: string;
  platform: LinkedTvDevice["platform"];
  label: string;
}

export interface NativeTvRemotePlayInput {
  countdownId: string;
  deviceId: string;
  playAtServerMs: number;
  estimatedServerNowMs: number;
  nowMonotonicMs: number;
}

export function shouldUseNativeTvRemote(): boolean {
  // Android native adapter is scaffold-only in this pass; keep Android on manual/helper fallback until implemented.
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

function localNetworkStatusAllowsAttempt(status: "unknown" | "granted" | "denied" | "not_required"): boolean {
  // iOS reports unknown because Local Network consent is triggered by the first motivated LAN access.
  return status === "granted" || status === "not_required" || status === "unknown";
}

export function mapLinkedPlatformToNativeProtocol(platform: LinkedTvDevice["platform"]): TVProtocol {
  switch (platform) {
    case "roku":
      return "roku-ecp";
    case "vizio_smartcast":
      return "vizio-smartcast";
    case "lg_webos":
      return "lg-webos";
    case "samsung":
      return "samsung-tizen";
    case "sony_bravia":
      return "sony-bravia";
    case "android_adb":
      return "android-tv";
    default:
      return "manual";
  }
}

export async function runNativeTvRemoteTestPlay(
  device: LinkedTvDevice,
  bridge: TVRemoteBridge = TVRemote,
): Promise<NativeTvRemoteReadyCandidate> {
  const protocol = mapLinkedPlatformToNativeProtocol(device.platform);
  if (protocol === "manual") {
    throw new Error("Native Auto Play is not available for this manual-only path.");
  }

  const permission = await bridge.getPermissionState();
  if (!localNetworkStatusAllowsAttempt(permission.localNetwork)) {
    const requested = await bridge.requestPermissions();
    if (!localNetworkStatusAllowsAttempt(requested.localNetwork)) {
      throw new Error("Local Network permission is required before Auto Play can test your TV.");
    }
  } else if (permission.localNetwork === "unknown") {
    const requested = await bridge.requestPermissions();
    if (!localNetworkStatusAllowsAttempt(requested.localNetwork)) {
      throw new Error("Local Network permission is required before Auto Play can test your TV.");
    }
  }

  const candidate = await bridge.addManualDevice({
    protocol,
    host: device.host,
    port: device.platform === "roku" ? 8060 : undefined,
  });
  const validation = await bridge.validateDevice(candidate.id);
  if (!validation.ok) {
    throw new Error(validation.errorMessage ?? validation.errorCode ?? "Native TV validation failed.");
  }

  const testResult = await bridge.testPlay(candidate.id);
  if (!testResult.ok) {
    throw new Error(testResult.errorMessage ?? testResult.errorCode ?? "Native Test Play failed.");
  }

  return { deviceId: candidate.id, platform: device.platform, label: device.label };
}

export async function armNativeTvRemotePlay(
  input: NativeTvRemotePlayInput,
  bridge: TVRemoteBridge = TVRemote,
) {
  const playAtMonotonicMs = input.nowMonotonicMs + Math.max(0, input.playAtServerMs - input.estimatedServerNowMs);
  return bridge.armPlay({
    countdownId: input.countdownId,
    deviceId: input.deviceId,
    playAtServerMs: input.playAtServerMs,
    playAtMonotonicMs,
  });
}

export async function sendNativeTvRemotePlayNow(
  countdownId: string,
  deviceId: string,
  bridge: TVRemoteBridge = TVRemote,
) {
  return bridge.sendPlayNow({ countdownId, deviceId });
}
