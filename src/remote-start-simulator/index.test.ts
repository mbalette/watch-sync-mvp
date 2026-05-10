import { describe, expect, it } from "vitest";
import {
  REMOTE_START_SIMULATOR_PLATFORMS,
  REMOTE_START_SIMULATOR_STATES,
  buildRemoteStartSimulatorStateMatrix,
  createRemoteStartSimulatorSession,
  isRemoteStartSimulatorValidPausedState,
  runRemoteStartSimulatorAction,
  type RemoteStartSimulatorPlatform,
} from "./index";
import { sanitizeRemoteStartOutcome } from "../remote-start-outcome-sanitizer";
import {
  DEFAULT_REMOTE_START_RUNTIME_CONFIG,
  applyQaRemoteStartBetaPlatform,
  isRemoteStartPlatformEnabled,
  normalizeRemoteStartRuntimeConfig,
} from "../remote-start-runtime-config";

const forbiddenFields = [
  "email",
  "phone",
  "ip",
  "ipAddress",
  "host",
  "url",
  "titleName",
  "profileName",
  "streamingAccount",
  "pairingToken",
  "helperToken",
  "authToken",
  "token",
  "rokuSerial",
  "serialNumber",
  "vizioToken",
  "lgClientKey",
  "samsungToken",
  "sonyPsk",
  "psk",
  "password",
];

function exerciseValidState(platform: RemoteStartSimulatorPlatform) {
  const afterTest = runRemoteStartSimulatorAction(
    createRemoteStartSimulatorSession(platform, "paused_content"),
    "test_play",
  );
  const afterConfirm = runRemoteStartSimulatorAction(afterTest, "confirm_yes");
  const afterGo = runRemoteStartSimulatorAction(afterConfirm, "go");
  const afterManual = runRemoteStartSimulatorAction(
    createRemoteStartSimulatorSession(platform, "paused_content"),
    "manual",
  );
  return { afterTest, afterConfirm, afterGo, afterManual };
}

describe("remote-start synthetic playback-state simulator", () => {
  it("defines the required playback-state matrix and never labels synthetic output hardware validation", () => {
    expect(REMOTE_START_SIMULATOR_STATES).toEqual([
      "paused_content",
      "paused_controls_visible",
      "paused_controls_hidden",
      "already_playing",
      "app_home",
      "profile_picker",
      "pre_roll_ad",
      "mid_roll_ad",
      "still_watching",
      "screensaver",
      "device_asleep",
      "wrong_app_focused",
      "helper_unavailable",
      "native_bridge_unavailable",
      "network_blocked",
      "pairing_denied",
      "pairing_timeout",
      "token_expired",
      "command_failed",
    ]);
    const matrix = buildRemoteStartSimulatorStateMatrix();
    expect(matrix).toHaveLength(REMOTE_START_SIMULATOR_PLATFORMS.length * REMOTE_START_SIMULATOR_STATES.length);
    expect(matrix.every((row) => row.certifiedHardwareValidation === false && row.fakeSuccessClaimed === false)).toBe(true);
  });

  it("covers non-manual platform valid-state gating", () => {
    for (const platform of REMOTE_START_SIMULATOR_PLATFORMS) {
      if (platform === "manual_countdown") continue;
      const { afterTest, afterConfirm, afterGo, afterManual } = exerciseValidState(platform);
      expect(afterTest.helperCommands).toHaveLength(1);
      expect(afterTest.pendingUserConfirmation).toBe(true);
      expect(afterTest.readyPersisted).toBe(false);
      expect(afterConfirm.readyPersisted).toBe(true);
      expect(afterGo.helperCommands).toHaveLength(2);
      expect(afterGo.goResult).toBe("sent");
      expect(afterManual.helperCommands).toHaveLength(0);
      expect(afterManual.goResult).toBe("manual");
    }
  });

  it("keeps manual countdown in no-command fallback even for paused synthetic states", () => {
    const { afterTest, afterConfirm, afterGo, afterManual } = exerciseValidState("manual_countdown");
    expect(afterTest.helperCommands).toHaveLength(0);
    expect(afterTest.pendingUserConfirmation).toBe(false);
    expect(afterConfirm.readyPersisted).toBe(false);
    expect(afterGo.goResult).toBe("blocked");
    expect(afterGo.manualFallbackVisible).toBe(true);
    expect(afterManual.goResult).toBe("manual");
  });

  it("keeps invalid states manual-only with no persisted ready and no fake success", () => {
    for (const state of REMOTE_START_SIMULATOR_STATES.filter((item) => !isRemoteStartSimulatorValidPausedState(item))) {
      const afterTest = runRemoteStartSimulatorAction(
        createRemoteStartSimulatorSession("roku_tv", state),
        "test_play",
      );
      const afterConfirm = runRemoteStartSimulatorAction(afterTest, "confirm_yes");
      const afterGo = runRemoteStartSimulatorAction(afterConfirm, "go");
      expect(afterTest.helperCommands).toHaveLength(0);
      expect(afterTest.readyPersisted).toBe(false);
      expect(afterConfirm.readyPersisted).toBe(false);
      expect(afterGo.goResult).toBe("blocked");
      expect(afterGo.manualFallbackVisible).toBe(true);
      expect(afterGo.fakeSuccessClaimed).toBe(false);
    }
  });

  it("blocks by kill switch, hides when flags are off, allows QA-only exposure, and keeps normal users safe", () => {
    const internalRoku = normalizeRemoteStartRuntimeConfig({
      ...DEFAULT_REMOTE_START_RUNTIME_CONFIG,
      remoteStartRuntimeBetaAudience: "internal",
      rokuRuntimeBetaEnabled: true,
    });
    expect(isRemoteStartPlatformEnabled("roku", internalRoku, false)).toBe(false);
    expect(isRemoteStartPlatformEnabled("roku", internalRoku, true)).toBe(true);
    expect(isRemoteStartPlatformEnabled("roku", { ...internalRoku, remoteStartKillSwitchEnabled: true }, true)).toBe(false);
    expect(isRemoteStartPlatformEnabled("vizio_smartcast", internalRoku, true)).toBe(false);

    const qa = applyQaRemoteStartBetaPlatform(internalRoku, "?remoteStartBeta=internal&qaBetaPlatform=vizio");
    expect(isRemoteStartPlatformEnabled("vizio_smartcast", qa, true)).toBe(true);
    expect(isRemoteStartPlatformEnabled("vizio_smartcast", qa, false)).toBe(false);
    const legacyAlias = applyQaRemoteStartBetaPlatform(internalRoku, "?remoteStartBeta=internal&platformBeta=vizio");
    expect(isRemoteStartPlatformEnabled("vizio_smartcast", legacyAlias, true)).toBe(true);
    expect(normalizeRemoteStartRuntimeConfig({ remoteStartPublicEnabled: "yes", rokuRuntimeBetaEnabled: "yes" })).toMatchObject({
      remoteStartPublicEnabled: false,
      rokuRuntimeBetaEnabled: false,
      vizioRuntimeBetaEnabled: false,
      lgRuntimeBetaEnabled: false,
      samsungRuntimeBetaEnabled: false,
      sonyRuntimeBetaEnabled: false,
    });
  });

  it("redacts forbidden fields before client/API/KV/export summary use", () => {
    const payload = Object.fromEntries(forbiddenFields.map((field) => [field, `secret-${field}`]));
    const clean = sanitizeRemoteStartOutcome({
      ...payload,
      type: "go_sent",
      platform: "roku",
      deviceType: "roku_tv",
      streamingApp: "Netflix",
      adapterFamily: "roku",
      latencyMs: 42,
      source: "synthetic",
      goResult: "success_self_report",
      failureCode: "failed for http://192.168.1.23:8060/path?token=abc123",
      hardwareValidation: true,
    });
    for (const field of forbiddenFields) expect(Object.hasOwn(clean, field)).toBe(false);
    expect(clean).toMatchObject({
      type: "go_sent",
      platform: "roku",
      deviceType: "roku_tv",
      adapterFamily: "roku",
      latencyMs: 42,
      source: "synthetic",
      hardwareValidation: false,
    });
    expect(clean.failureCode).toBeUndefined();
    expect(JSON.stringify(clean)).not.toMatch(/secret-|redacted@example|192\.168|token=|http:\/\//);
  });
});
