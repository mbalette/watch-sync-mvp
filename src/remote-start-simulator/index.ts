export type RemoteStartSimulatorState =
  | "paused_content"
  | "paused_controls_visible"
  | "paused_controls_hidden"
  | "already_playing"
  | "app_home"
  | "profile_picker"
  | "pre_roll_ad"
  | "mid_roll_ad"
  | "still_watching"
  | "screensaver"
  | "device_asleep"
  | "wrong_app_focused"
  | "helper_unavailable"
  | "network_blocked"
  | "pairing_denied"
  | "pairing_timeout"
  | "token_expired"
  | "command_failed";

export type RemoteStartSimulatorPlatform =
  | "roku_tv"
  | "roku_streaming"
  | "vizio"
  | "lg"
  | "sony"
  | "samsung";

export type RemoteStartSimulatorAction = "test_play" | "confirm_yes" | "go" | "manual";

export interface RemoteStartSimulatorSession {
  platform: RemoteStartSimulatorPlatform;
  state: RemoteStartSimulatorState;
  helperCommands: string[];
  readyPersisted: boolean;
  pendingUserConfirmation: boolean;
  manualFallbackVisible: boolean;
  certifiedHardwareValidation: false;
  fakeSuccessClaimed: false;
  testPlayResult?: "pass_pending_confirmation" | "fail_manual_fallback";
  goResult?: "sent" | "blocked" | "manual";
}

export const REMOTE_START_SIMULATOR_STATES: RemoteStartSimulatorState[] = [
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
  "network_blocked",
  "pairing_denied",
  "pairing_timeout",
  "token_expired",
  "command_failed",
];

export const REMOTE_START_SIMULATOR_PLATFORMS: RemoteStartSimulatorPlatform[] = [
  "roku_tv",
  "roku_streaming",
  "vizio",
  "lg",
  "sony",
  "samsung",
];

const VALID_PAUSED_STATES = new Set<RemoteStartSimulatorState>([
  "paused_content",
  "paused_controls_visible",
  "paused_controls_hidden",
]);

const PLATFORM_COMMAND: Record<RemoteStartSimulatorPlatform, string> = {
  roku_tv: "roku.keypress.Play",
  roku_streaming: "roku.keypress.Play",
  vizio: "vizio.KEY_PLAY",
  lg: "lg.ssap.media.controls.play",
  sony: "sony.IRCC.Play",
  samsung: "samsung.KEY_PLAY",
};

export function isRemoteStartSimulatorValidPausedState(state: RemoteStartSimulatorState): boolean {
  return VALID_PAUSED_STATES.has(state);
}

export function createRemoteStartSimulatorSession(
  platform: RemoteStartSimulatorPlatform,
  state: RemoteStartSimulatorState,
): RemoteStartSimulatorSession {
  return {
    platform,
    state,
    helperCommands: [],
    readyPersisted: false,
    pendingUserConfirmation: false,
    manualFallbackVisible: true,
    certifiedHardwareValidation: false,
    fakeSuccessClaimed: false,
  };
}

export function runRemoteStartSimulatorAction(
  session: RemoteStartSimulatorSession,
  action: RemoteStartSimulatorAction,
): RemoteStartSimulatorSession {
  const next = { ...session, helperCommands: [...session.helperCommands] };
  if (action === "manual") {
    next.goResult = "manual";
    next.manualFallbackVisible = true;
    return next;
  }
  if (action === "test_play") {
    if (VALID_PAUSED_STATES.has(next.state)) {
      next.helperCommands.push(PLATFORM_COMMAND[next.platform]);
      next.pendingUserConfirmation = true;
      next.readyPersisted = false;
      next.testPlayResult = "pass_pending_confirmation";
    } else {
      next.pendingUserConfirmation = false;
      next.readyPersisted = false;
      next.testPlayResult = "fail_manual_fallback";
    }
    next.manualFallbackVisible = true;
    return next;
  }
  if (action === "confirm_yes") {
    if (next.pendingUserConfirmation) {
      next.readyPersisted = true;
      next.pendingUserConfirmation = false;
    }
    return next;
  }
  if (action === "go") {
    if (next.readyPersisted) {
      next.helperCommands.push(PLATFORM_COMMAND[next.platform]);
      next.goResult = "sent";
    } else {
      next.goResult = "blocked";
      next.manualFallbackVisible = true;
    }
    return next;
  }
  return next;
}

export function buildRemoteStartSimulatorStateMatrix() {
  return REMOTE_START_SIMULATOR_PLATFORMS.flatMap((platform) =>
    REMOTE_START_SIMULATOR_STATES.map((state) => {
      const afterTest = runRemoteStartSimulatorAction(
        createRemoteStartSimulatorSession(platform, state),
        "test_play",
      );
      const afterConfirm = runRemoteStartSimulatorAction(afterTest, "confirm_yes");
      const afterGo = runRemoteStartSimulatorAction(afterConfirm, "go");
      return {
        platform,
        state,
        validPausedState: VALID_PAUSED_STATES.has(state),
        testPlayCommands: afterTest.helperCommands.length,
        pendingUserConfirmationAfterTest: afterTest.pendingUserConfirmation,
        readyAfterTestOnly: afterTest.readyPersisted,
        readyAfterYesConfirmation: afterConfirm.readyPersisted,
        goCommandsAfterConfirmation:
          afterGo.helperCommands.length - afterConfirm.helperCommands.length,
        manualFallbackVisible: afterTest.manualFallbackVisible,
        certifiedHardwareValidation: false,
        fakeSuccessClaimed: false,
        note: VALID_PAUSED_STATES.has(state)
          ? "Synthetic helper command success; user confirmation required before ready. Not hardware validation."
          : "Synthetic invalid state fails with manual fallback; no certification or fake success.",
      };
    }),
  );
}
