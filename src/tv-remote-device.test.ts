import { describe, expect, it } from "vitest";
import {
  LINKED_TV_DEVICE_KEY,
  REMOTE_START_ONBOARDING_CHOICES,
  REMOTE_START_WATCHING_METHOD_CHOICES,
  TV_PLATFORM_OPTIONS,
  buildDevicePauseRequest,
  buildDevicePlayRequest,
  buildDeviceTestRequest,
  canUseRemoteStartAtGo,
  getVisibleRemoteStartChoices,
  getRemoteStartCapability,
  getRemoteStartReadiness,
  getRemoteStartWizard,
  isAllowedLocalHelperUrl,
  loadLinkedTvDevice,
  normalizeLinkedTvDevice,
} from "./tv-remote-device";
import { sanitizeRemoteStartOutcome } from "./remote-start-outcome-log";
import {
  DEFAULT_REMOTE_START_RUNTIME_CONFIG,
  isRemoteStartInternalBetaUnlocked,
  normalizeRemoteStartRuntimeConfig,
} from "./remote-start-runtime-config";

describe("linked TV device helper routing", () => {
  function makeMemoryStorage(): Storage {
    const values = new Map<string, string>();
    return {
      get length() {
        return values.size;
      },
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      key: (index: number) => Array.from(values.keys())[index] ?? null,
      removeItem: (key: string) => {
        values.delete(key);
      },
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
  }

  it("starts fresh Remote Start storage with no linked/default device", () => {
    const storage = makeMemoryStorage();

    expect(loadLinkedTvDevice(storage)).toBeNull();
    expect(storage.getItem(LINKED_TV_DEVICE_KEY)).toBeNull();
  });

  it("normalizes Remote Start opt-in to false and always keeps manual fallback required", () => {
    const device = normalizeLinkedTvDevice({
      platform: "roku",
      host: "192.168.1.2",
    });

    expect(device.useRemoteStartAtGo).toBe(false);
    expect(getRemoteStartCapability("roku")).toMatchObject({
      canTestConnection: true,
      canSendPlay: true,
      canSendPause: false,
      canAutoPlayAtGo: true,
      publicClaimLevel: "primary-beta",
      safeGoCommand: "Play",
      manualFallbackRequired: true,
    });
  });

  it("exposes requested platform statuses including advanced and manual-only choices", () => {
    expect(
      TV_PLATFORM_OPTIONS.map((option) => [option.id, option.status]),
    ).toEqual([
      ["roku", "Remote Start beta / primary"],
      ["lg_webos", "Remote Start beta / primary"],
      ["samsung", "Remote Start beta"],
      ["android_adb", "Guided setup beta"],
      ["sony_bravia", "Remote Start beta for supported Sony TVs"],
      ["philips_jointspace", "Later beta"],
      ["vizio_smartcast", "Later beta"],
      ["home_assistant_webhook", "Not supported yet"],
      ["apple_tv_manual", "Manual-only"],
    ]);
  });

  it("offers a click-through consumer onboarding path before technical setup fields", () => {
    expect(
      REMOTE_START_WATCHING_METHOD_CHOICES.map((choice) => [
        choice.id,
        choice.title,
      ]),
    ).toEqual([
      ["built_in_tv_app", "TV app built into my TV"],
      ["streaming_stick_or_box", "Streaming stick or box"],
      ["game_console_or_other", "Game console / cable box / not sure"],
    ]);
    expect(
      REMOTE_START_WATCHING_METHOD_CHOICES.find(
        (choice) => choice.id === "streaming_stick_or_box",
      )?.nextCopy,
    ).toMatch(/pick Roku/i);

    expect(
      REMOTE_START_ONBOARDING_CHOICES.map((choice) => [
        choice.platform,
        choice.title,
        choice.recommended,
        choice.watchingMethods,
      ]),
    ).toEqual([
      [
        "roku",
        "Roku / Roku TV",
        true,
        ["built_in_tv_app", "streaming_stick_or_box"],
      ],
      ["lg_webos", "LG TV", true, ["built_in_tv_app"]],
      ["samsung", "Samsung TV", true, ["built_in_tv_app"]],
      ["sony_bravia", "Sony Bravia TV", true, ["built_in_tv_app"]],
      [
        "android_adb",
        "Fire / Android / Google TV",
        true,
        ["built_in_tv_app", "streaming_stick_or_box"],
      ],
      [
        "apple_tv_manual",
        "Apple TV / not sure",
        false,
        ["streaming_stick_or_box", "game_console_or_other"],
      ],
    ]);
    expect(
      REMOTE_START_ONBOARDING_CHOICES.find(
        (choice) => choice.platform === "apple_tv_manual",
      )?.nextCopy,
    ).toMatch(/manual countdown/i);
    expect(
      REMOTE_START_ONBOARDING_CHOICES.find(
        (choice) => choice.platform === "android_adb",
      )?.setupPreview,
    ).toMatch(/guided setup beta/i);
  });

  it("provides device-specific guided setup wizard steps and actions", () => {
    expect(getRemoteStartWizard("roku")).toMatchObject({
      title: "Roku / Roku TV setup",
      label: "Remote Start beta / primary",
      primaryAction: "Check Roku",
      steps: expect.arrayContaining([
        expect.stringMatching(/same Wi-Fi/i),
        expect.stringMatching(/Control by mobile apps/i),
        expect.stringMatching(/Test Play/i),
      ]),
      safeGoCommand: "Play only",
    });
    expect(getRemoteStartWizard("android_adb")).toMatchObject({
      title: "Fire / Android / Google TV guided setup",
      label: "Guided setup beta",
      primaryAction: "Connect ADB",
      steps: expect.arrayContaining([
        expect.stringMatching(/Developer Options/i),
        expect.stringMatching(/pairing code/i),
        expect.stringMatching(/Some devices may need reconnect/i),
      ]),
      safeGoCommand: "KEYCODE_MEDIA_PLAY only",
    });
    expect(getRemoteStartWizard("apple_tv_manual")).toMatchObject({
      title: "Apple TV",
      label: "Manual-only",
      primaryAction: "Use manual countdown",
      safeGoCommand: "None",
    });
  });

  it("builds Roku and Samsung GO play requests", () => {
    expect(
      buildDevicePlayRequest(
        normalizeLinkedTvDevice({ platform: "roku", host: "192.168.1.2" }),
      ),
    ).toEqual({
      path: "/roku/keypress",
      method: "POST",
      body: { host: "192.168.1.2", key: "Play" },
    });
    expect(
      buildDevicePlayRequest(
        normalizeLinkedTvDevice({
          platform: "samsung",
          host: "192.168.1.3",
          token: "tok",
        }),
      ),
    ).toEqual({
      path: "/samsung/keypress",
      method: "POST",
      body: { host: "192.168.1.3", token: "tok", key: "KEY_PLAY" },
    });
  });

  it("requires pairing/code for LG and Sony GO commands and blocks Philips toggle GO", () => {
    expect(
      buildDevicePlayRequest(
        normalizeLinkedTvDevice({ platform: "lg_webos", host: "192.168.1.4" }),
      ).unsafeReason,
    ).toMatch(/client key/);
    expect(
      buildDevicePlayRequest(
        normalizeLinkedTvDevice({
          platform: "sony_bravia",
          host: "192.168.1.5",
        }),
      ).unsafeReason,
    ).toMatch(/IRCC/);
    expect(
      buildDevicePlayRequest(
        normalizeLinkedTvDevice({
          platform: "philips_jointspace",
          host: "192.168.1.6",
        }),
      ).unsafeReason,
    ).toMatch(/not a public Remote Start lane|manual countdown/i);
    expect(getRemoteStartCapability("philips_jointspace")).toMatchObject({
      canAutoPlayAtGo: false,
    });
    expect(
      getRemoteStartCapability("philips_jointspace").safeGoCommand,
    ).toBeUndefined();
  });

  it("keeps Apple TV manual-only with no direct commands", () => {
    const apple = normalizeLinkedTvDevice({
      platform: "apple_tv_manual",
      host: "apple-tv.local",
      useRemoteStartAtGo: true,
    });

    expect(getRemoteStartCapability("apple_tv_manual")).toMatchObject({
      canTestConnection: false,
      canSendPlay: false,
      canSendPause: false,
      canAutoPlayAtGo: false,
      publicClaimLevel: "manual-only",
      manualFallbackRequired: true,
    });
    expect(buildDeviceTestRequest(apple).unsafeReason).toMatch(/manual-only/i);
    expect(buildDevicePlayRequest(apple).unsafeReason).toMatch(
      /manual countdown|not a public Remote Start lane/i,
    );
    expect(buildDevicePauseRequest(apple).unsafeReason).toMatch(/manual-only/i);
    expect(canUseRemoteStartAtGo(apple)).toBe(false);
  });

  it("requires Remote Start GO opt-in and safe auto-play capability", () => {
    expect(
      canUseRemoteStartAtGo(
        normalizeLinkedTvDevice({ platform: "roku", host: "192.168.1.2" }),
      ),
    ).toBe(false);
    expect(
      canUseRemoteStartAtGo(
        normalizeLinkedTvDevice({
          platform: "roku",
          host: "192.168.1.2",
          useRemoteStartAtGo: true,
        }),
      ),
    ).toBe(false);
    expect(
      canUseRemoteStartAtGo(
        normalizeLinkedTvDevice({
          platform: "roku",
          host: "192.168.1.2",
          lastTestedAt: "2026-05-06T00:00:00.000Z",
          useRemoteStartAtGo: true,
        }),
      ),
    ).toBe(true);
    expect(
      canUseRemoteStartAtGo(
        normalizeLinkedTvDevice({
          platform: "philips_jointspace",
          host: "192.168.1.6",
          useRemoteStartAtGo: true,
        }),
      ),
    ).toBe(false);
    expect(
      canUseRemoteStartAtGo(
        normalizeLinkedTvDevice({
          platform: "home_assistant_webhook",
          webhookUrl: "http://ha.local/api/webhook/id",
          useRemoteStartAtGo: true,
        }),
      ),
    ).toBe(false);
    expect(
      canUseRemoteStartAtGo(
        normalizeLinkedTvDevice({
          platform: "vizio_smartcast",
          host: "192.168.1.8",
          authToken: "tok",
          useRemoteStartAtGo: true,
        }),
      ),
    ).toBe(false);
  });

  it("only allows local/private helper URLs before sending local credentials", () => {
    expect(isAllowedLocalHelperUrl("http://127.0.0.1:8790")).toBe(true);
    expect(isAllowedLocalHelperUrl("http://localhost:8790")).toBe(true);
    expect(isAllowedLocalHelperUrl("http://192.168.1.42:8790")).toBe(true);
    expect(isAllowedLocalHelperUrl("http://10.0.0.5:8790")).toBe(true);
    expect(isAllowedLocalHelperUrl("http://tv-helper.local:8790")).toBe(true);
    expect(isAllowedLocalHelperUrl("https://evil.example/collect")).toBe(false);
    expect(isAllowedLocalHelperUrl("http://8.8.8.8:8790")).toBe(false);
    expect(isAllowedLocalHelperUrl("file:///tmp/helper")).toBe(false);
  });

  it("builds platform-specific test requests", () => {
    expect(
      buildDeviceTestRequest(
        normalizeLinkedTvDevice({ platform: "roku", host: "192.168.1.2" }),
      ),
    ).toEqual({
      path: "/roku/keypress",
      method: "POST",
      body: { host: "192.168.1.2", key: "Play" },
    });
    expect(
      buildDeviceTestRequest(
        normalizeLinkedTvDevice({
          platform: "lg_webos",
          host: "tv.local",
          url: "ws://tv.local:3000",
        }),
      ),
    ).toEqual({
      path: "/lg-webos/pair",
      method: "POST",
      body: { host: "tv.local", url: "ws://tv.local:3000" },
    });
    expect(
      buildDeviceTestRequest(
        normalizeLinkedTvDevice({
          platform: "sony_bravia",
          host: "sony.local",
          psk: "1234",
        }),
      ),
    ).toEqual({
      path: "/sony/remote-controller-info",
      method: "POST",
      body: { host: "sony.local", psk: "1234" },
    });
  });

  it("builds safe pause requests only where the capability allows them", () => {
    expect(
      buildDevicePauseRequest(
        normalizeLinkedTvDevice({
          platform: "lg_webos",
          host: "192.168.1.4",
          clientKey: "lg-key",
        }),
      ),
    ).toEqual({
      path: "/lg-webos/media",
      method: "POST",
      body: { host: "192.168.1.4", clientKey: "lg-key", command: "pause" },
    });
    expect(
      buildDevicePauseRequest(
        normalizeLinkedTvDevice({ platform: "samsung", host: "192.168.1.3" }),
      ),
    ).toEqual({
      path: "/samsung/keypress",
      method: "POST",
      body: { host: "192.168.1.3", key: "KEY_PAUSE" },
    });
    expect(
      buildDevicePauseRequest(
        normalizeLinkedTvDevice({ platform: "roku", host: "192.168.1.2" }),
      ).unsafeReason,
    ).toMatch(/Pause is not claimed/i);
    expect(
      buildDevicePauseRequest(
        normalizeLinkedTvDevice({
          platform: "philips_jointspace",
          host: "192.168.1.6",
        }),
      ).unsafeReason,
    ).toMatch(/toggle-risk/i);
  });

  it("routes Android/Fire/Google TV ADB helper through discrete Play and Pause only", () => {
    const device = normalizeLinkedTvDevice({
      platform: "android_adb",
      host: "192.168.1.50:5555",
      useRemoteStartAtGo: true,
    });

    expect(getRemoteStartCapability("android_adb")).toMatchObject({
      requiresLocalHelper: true,
      requiresAdvancedSetup: true,
      publicClaimLevel: "guided-setup-beta",
      safeGoCommand: "KEYCODE_MEDIA_PLAY",
    });
    expect(buildDeviceTestRequest(device)).toEqual({
      path: "/adb/connect",
      method: "POST",
      body: { host: "192.168.1.50:5555" },
    });
    expect(buildDevicePlayRequest(device)).toEqual({
      path: "/adb/media-key",
      method: "POST",
      body: { host: "192.168.1.50:5555", key: "KEYCODE_MEDIA_PLAY" },
    });
    expect(buildDevicePauseRequest(device)).toEqual({
      path: "/adb/media-key",
      method: "POST",
      body: { host: "192.168.1.50:5555", key: "KEYCODE_MEDIA_PAUSE" },
    });
    expect(JSON.stringify(buildDevicePlayRequest(device))).not.toContain(
      "KEYCODE_MEDIA_PLAY_PAUSE",
    );
  });

  it("classifies Remote Start readiness without upgrading unvalidated hardware to supported", () => {
    expect(
      getRemoteStartReadiness(normalizeLinkedTvDevice({ platform: "roku" })),
    ).toMatchObject({
      state: "not_configured",
      label: "Needs setup",
    });
    expect(
      getRemoteStartReadiness(
        normalizeLinkedTvDevice({ platform: "roku", host: "192.168.1.2" }),
      ),
    ).toMatchObject({
      state: "reconnect_needed",
      label: "Reconnect needed",
    });
    expect(
      getRemoteStartReadiness(
        normalizeLinkedTvDevice({
          platform: "roku",
          host: "192.168.1.2",
          lastTestedAt: "2026-05-05T00:00:00.000Z",
        }),
      ),
    ).toMatchObject({
      state: "unverified_hardware_behavior",
      label: "Device behavior not verified yet",
    });
    expect(
      getRemoteStartReadiness(
        normalizeLinkedTvDevice({ platform: "apple_tv_manual" }),
      ),
    ).toMatchObject({
      state: "manual_tonight",
      label: "Manual countdown tonight",
    });
  });

  it("keeps Home Assistant helper routing out of the D2C Remote Start UI path", () => {
    const device = normalizeLinkedTvDevice({
      platform: "home_assistant_webhook",
      webhookUrl: " http://ha.local:8123/api/webhook/random-id ",
    });

    expect(device.host).toBe("");
    expect(device.webhookUrl).toBe(
      "http://ha.local:8123/api/webhook/random-id",
    );
    expect(buildDeviceTestRequest(device).unsafeReason).toMatch(
      /manual countdown fallback|not currently/i,
    );
    expect(buildDevicePlayRequest(device).unsafeReason).toMatch(
      /manual countdown|not a public Remote Start lane/i,
    );
  });

  it("blocks Home Assistant webhook routing with a local config error when the webhook URL is missing", () => {
    const request = buildDevicePlayRequest(
      normalizeLinkedTvDevice({ platform: "home_assistant_webhook" }),
    );

    expect(request).toMatchObject({ path: "", method: "POST" });
    expect(request.unsafeReason).toMatch(
      /manual countdown|not a public Remote Start lane/i,
    );
  });

  it("does not add Home Assistant token or entity fields to helper request bodies", () => {
    const request = buildDevicePlayRequest(
      normalizeLinkedTvDevice({
        platform: "home_assistant_webhook",
        webhookUrl: "https://ha.example/api/webhook/secret-id",
      }),
    );

    expect(request.body).toBeUndefined();
    expect(request.unsafeReason).toMatch(
      /manual countdown|not a public Remote Start lane/i,
    );
  });

  it("gates Roku runtime beta behind internal audience and kill switch", () => {
    const internalRoku = normalizeRemoteStartRuntimeConfig({
      ...DEFAULT_REMOTE_START_RUNTIME_CONFIG,
      remoteStartPublicEnabled: false,
      remoteStartRuntimeBetaAudience: "internal",
      rokuRuntimeBetaEnabled: true,
      vizioRuntimeBetaEnabled: false,
    });
    const readyRoku = normalizeLinkedTvDevice({
      platform: "roku",
      host: "192.168.1.2",
      lastTestedAt: "2026-05-07T00:00:00.000Z",
      useRemoteStartAtGo: true,
    });

    expect(
      getVisibleRemoteStartChoices(
        "streaming_stick_or_box",
        internalRoku,
        false,
      ).map((choice) => choice.platform),
    ).toEqual(["apple_tv_manual"]);
    expect(
      getVisibleRemoteStartChoices(
        "streaming_stick_or_box",
        internalRoku,
        true,
      ).map((choice) => choice.platform),
    ).toEqual(["roku", "apple_tv_manual"]);
    expect(canUseRemoteStartAtGo(readyRoku, internalRoku, false)).toBe(false);
    expect(canUseRemoteStartAtGo(readyRoku, internalRoku, true)).toBe(true);

    const killed = normalizeRemoteStartRuntimeConfig({
      ...internalRoku,
      remoteStartKillSwitchEnabled: true,
    });
    expect(
      getVisibleRemoteStartChoices("streaming_stick_or_box", killed, true).map(
        (choice) => choice.platform,
      ),
    ).toEqual(["apple_tv_manual"]);
    expect(canUseRemoteStartAtGo(readyRoku, killed, true)).toBe(false);
  });

  it("uses URL/localStorage opt-in for internal beta without enabling public flags", () => {
    const storage = makeMemoryStorage();
    expect(
      isRemoteStartInternalBetaUnlocked("?remoteStartBeta=internal", storage),
    ).toBe(true);
    expect(storage.getItem("watch-sync.remoteStartInternalBeta.v1")).toBe(
      "internal",
    );
    expect(isRemoteStartInternalBetaUnlocked("", storage)).toBe(true);
    expect(
      isRemoteStartInternalBetaUnlocked("?remoteStartBeta=off", storage),
    ).toBe(false);
    expect(storage.getItem("watch-sync.remoteStartInternalBeta.v1")).toBeNull();
  });

  it("redacts forbidden outcome event fields before logging", () => {
    const event = sanitizeRemoteStartOutcome({
      type: "go_attempted",
      platform: "roku",
      deviceModel: "Roku Ultra",
      streamingApp: "Netflix",
      phone: "+15551234567",
      email: "user@example.com",
      host: "192.168.1.2",
      rokuSerial: "SERIAL",
      pairingToken: "secret",
    });

    expect(event).toMatchObject({
      type: "go_attempted",
      platform: "roku",
      deviceModel: "Roku Ultra",
      streamingApp: "Netflix",
    });
    expect(JSON.stringify(event)).not.toContain("15551234567");
    expect(JSON.stringify(event)).not.toContain("192.168.1.2");
    expect(JSON.stringify(event)).not.toContain("SERIAL");
    expect(JSON.stringify(event)).not.toContain("secret");
  });
});
