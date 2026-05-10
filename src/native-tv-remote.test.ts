import { describe, expect, it, vi } from "vitest";
import type { TVRemoteBridge } from "../packages/tv-remote-bridge";
import type { LinkedTvDevice } from "./tv-remote-device";
import {
  armNativeTvRemotePlay,
  mapLinkedPlatformToNativeProtocol,
  runNativeTvRemoteTestPlay,
  sendNativeTvRemotePlayNow,
} from "./native-tv-remote";

function makeDevice(patch: Partial<LinkedTvDevice> = {}): LinkedTvDevice {
  return {
    platform: "roku",
    label: "Roku TV",
    host: "192.168.1.23",
    helperUrl: "http://127.0.0.1:8790",
    useRemoteStartAtGo: false,
    ...patch,
  };
}

function makeBridge(): TVRemoteBridge {
  return {
    getPermissionState: vi.fn(async () => ({ localNetwork: "unknown" as const })),
    requestPermissions: vi.fn(async () => ({ localNetwork: "granted" as const })),
    discoverDevices: vi.fn(async () => []),
    addManualDevice: vi.fn(async (input) => ({
      id: `${input.protocol}:device-1`,
      protocol: input.protocol,
      displayName: "Native test device",
      host: input.host,
      port: input.port,
      requiresPairing: false,
      capabilities: ["play", "testCommand"],
    })),
    pairDevice: vi.fn(async () => ({ ok: false })),
    listPairedDevices: vi.fn(async () => []),
    removePairedDevice: vi.fn(async () => ({ ok: true })),
    validateDevice: vi.fn(async (deviceId) => ({ ok: true, deviceId, capabilities: ["play", "testCommand"] })),
    testPlay: vi.fn(async () => ({ ok: true, protocol: "roku-ecp", command: "play", sentAtMonotonicMs: 1 })),
    armPlay: vi.fn(async (input) => ({ ok: true, deviceId: input.deviceId, countdownId: input.countdownId, armedForMonotonicMs: input.playAtMonotonicMs })),
    cancelArmedPlay: vi.fn(async () => ({ ok: true })),
    sendPlayNow: vi.fn(async () => ({ ok: true, protocol: "roku-ecp", command: "play", sentAtMonotonicMs: 1 })),
  };
}

describe("native TVRemote bridge wiring helpers", () => {
  it("maps linked setup platforms to native protocol ids", () => {
    expect(mapLinkedPlatformToNativeProtocol("roku")).toBe("roku-ecp");
    expect(mapLinkedPlatformToNativeProtocol("vizio_smartcast")).toBe("vizio-smartcast");
    expect(mapLinkedPlatformToNativeProtocol("lg_webos")).toBe("lg-webos");
    expect(mapLinkedPlatformToNativeProtocol("samsung")).toBe("samsung-tizen");
    expect(mapLinkedPlatformToNativeProtocol("sony_bravia")).toBe("sony-bravia");
    expect(mapLinkedPlatformToNativeProtocol("android_adb")).toBe("android-tv");
    expect(mapLinkedPlatformToNativeProtocol("apple_tv_manual")).toBe("manual");
  });

  it("requests local-network permission, validates, and sends Test Play through TVRemote", async () => {
    const bridge = makeBridge();
    const result = await runNativeTvRemoteTestPlay(makeDevice(), bridge);

    expect(bridge.getPermissionState).toHaveBeenCalledTimes(1);
    expect(bridge.requestPermissions).toHaveBeenCalledTimes(1);
    expect(bridge.addManualDevice).toHaveBeenCalledWith({ protocol: "roku-ecp", host: "192.168.1.23", port: 8060 });
    expect(bridge.validateDevice).toHaveBeenCalledWith("roku-ecp:device-1");
    expect(bridge.testPlay).toHaveBeenCalledWith("roku-ecp:device-1");
    expect(result).toEqual({ deviceId: "roku-ecp:device-1", platform: "roku", label: "Roku TV" });
  });

  it("accepts platform-safe local network states without blocking native validation", async () => {
    const bridge = makeBridge();
    vi.mocked(bridge.getPermissionState).mockResolvedValueOnce({ localNetwork: "not_required" });
    await expect(runNativeTvRemoteTestPlay(makeDevice(), bridge)).resolves.toMatchObject({ deviceId: "roku-ecp:device-1" });
    expect(bridge.requestPermissions).not.toHaveBeenCalled();

    const iosBridge = makeBridge();
    vi.mocked(iosBridge.requestPermissions).mockResolvedValueOnce({ localNetwork: "unknown" } as never);
    await expect(runNativeTvRemoteTestPlay(makeDevice(), iosBridge)).resolves.toMatchObject({ deviceId: "roku-ecp:device-1" });
  });

  it("does not mark ready when validation or Test Play fails", async () => {
    const bridge = makeBridge();
    vi.mocked(bridge.validateDevice).mockResolvedValueOnce({
      ok: false,
      deviceId: "roku-ecp:device-1",
      capabilities: [],
      errorCode: "VALIDATION_FAILED",
    });
    await expect(runNativeTvRemoteTestPlay(makeDevice(), bridge)).rejects.toThrow(/VALIDATION_FAILED/);

    const bridge2 = makeBridge();
    vi.mocked(bridge2.testPlay).mockResolvedValueOnce({
      ok: false,
      protocol: "roku-ecp",
      command: "play",
      sentAtMonotonicMs: 1,
      errorCode: "COMMAND_FAILED",
    });
    await expect(runNativeTvRemoteTestPlay(makeDevice(), bridge2)).rejects.toThrow(/COMMAND_FAILED/);
  });

  it("arms using server timing translated to monotonic time and sends exactly one Play Now command", async () => {
    const bridge = makeBridge();
    await armNativeTvRemotePlay({
      countdownId: "c1",
      deviceId: "roku-ecp:device-1",
      playAtServerMs: 10_500,
      estimatedServerNowMs: 10_000,
      nowMonotonicMs: 250,
    }, bridge);
    expect(bridge.armPlay).toHaveBeenCalledWith({
      countdownId: "c1",
      deviceId: "roku-ecp:device-1",
      playAtServerMs: 10_500,
      playAtMonotonicMs: 750,
    });

    await sendNativeTvRemotePlayNow("c1", "roku-ecp:device-1", bridge);
    expect(bridge.sendPlayNow).toHaveBeenCalledTimes(1);
    expect(bridge.sendPlayNow).toHaveBeenCalledWith({ countdownId: "c1", deviceId: "roku-ecp:device-1" });
  });
});
