import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import "./App.css";
import {
  applyRoomEvent,
  bothReady,
  buildRecommendationQueue,
  createParticipant,
  createRoom,
  normalizeRoomCode,
  nowIso,
  participantList,
  recommendationQueueKey,
  type Participant,
  type RecommendationQueueItem,
  type RoomEvent,
  type RoomState,
  type WatchRecommendation,
  type WatchSetup,
} from "./domain";
import {
  createWebSocketRoomTransport,
  type RoomTransport,
  type TransportStatus,
} from "./transport";
import {
  buildDevicePauseRequest,
  buildDevicePlayRequest,
  buildDeviceTestRequest,
  canUseRemoteStartAtGo,
  getRemoteStartCapability,
  getRemoteStartReadiness,
  getRemoteStartWizard,
  getVisibleRemoteStartChoices,
  getVisibleTvPlatformOptions,
  isAllowedLocalHelperUrl,
  REMOTE_START_ONBOARDING_CHOICES,
  REMOTE_START_WATCHING_METHOD_CHOICES,
  loadLinkedTvDevice,
  normalizeLinkedTvDevice,
  platformNeedsHost,
  platformNeedsPairing,
  platformNeedsSonyIrcc,
  saveLinkedTvDevice,
  TV_PLATFORM_OPTIONS,
  type LinkedTvDevice,
  type RemoteStartWatchingMethod,
} from "./tv-remote-device";
import {
  DEFAULT_REMOTE_START_RUNTIME_CONFIG,
  isRemoteStartInternalBetaUnlocked,
  isRemoteStartPlatformEnabled,
  applyQaRemoteStartBetaPlatform,
  normalizeRemoteStartRuntimeConfig,
} from "./remote-start-runtime-config";
import { logRemoteStartOutcome } from "./remote-start-outcome-log";
import {
  buildRecommendationDiscoverApiUrl,
  buildRecommendationSearchApiUrl,
  filterRecommendations,
  getRecommendationProviderLabel,
  normalizeRecommendationProviderSlugs,
  normalizeRecommendationRegion,
  RECOMMENDATION_PROVIDER_OPTIONS,
} from "./recommendations";

const LOCAL_PARTICIPANT_KEY = "watch-sync.localParticipant";
const CURRENT_ROOM_KEY = "watch-sync.currentRoom";
const RECOMMENDATION_PROVIDERS_KEY = "watch-sync.recommendationProviders";
const RECOMMENDATION_REGION_KEY = "watch-sync.recommendationRegion";
const storageKey = (roomId: string) => `watch-sync.room.${roomId}`;
const realtimeUrl = import.meta.env.VITE_REALTIME_URL || "ws://127.0.0.1:8787";

function inferWatchingMethod(
  platform: LinkedTvDevice["platform"],
): RemoteStartWatchingMethod {
  if (
    platform === "lg_webos" ||
    platform === "samsung" ||
    platform === "sony_bravia"
  )
    return "built_in_tv_app";
  if (platform === "apple_tv_manual") return "streaming_stick_or_box";
  if (platform === "roku" || platform === "android_adb")
    return "streaming_stick_or_box";
  return "game_console_or_other";
}

function loadRecommendationProviders(): string[] {
  const raw = localStorage.getItem(RECOMMENDATION_PROVIDERS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return normalizeRecommendationProviderSlugs(
      parsed.filter(
        (provider): provider is string => typeof provider === "string",
      ),
    );
  } catch {
    localStorage.removeItem(RECOMMENDATION_PROVIDERS_KEY);
    return [];
  }
}

function persistRecommendationProviders(providers: string[]) {
  const providerSlugs = normalizeRecommendationProviderSlugs(providers);
  if (providerSlugs.length === 0) {
    localStorage.removeItem(RECOMMENDATION_PROVIDERS_KEY);
    return;
  }
  localStorage.setItem(
    RECOMMENDATION_PROVIDERS_KEY,
    JSON.stringify(providerSlugs),
  );
}

function loadRecommendationRegion(): string {
  return normalizeRecommendationRegion(
    localStorage.getItem(RECOMMENDATION_REGION_KEY) ?? "US",
  );
}

function persistRecommendationRegion(region: string) {
  localStorage.setItem(
    RECOMMENDATION_REGION_KEY,
    normalizeRecommendationRegion(region),
  );
}

function RecommendationPoster({ item }: { item: WatchRecommendation }) {
  const initial = item.title.trim().charAt(0).toUpperCase() || "▶";

  return (
    <div
      className={`recommendation-poster ${item.posterUrl ? "" : "fallback"}`}
      aria-hidden="true"
    >
      {item.posterUrl ? (
        <img src={item.posterUrl} alt="" loading="lazy" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

function loadRoom(roomId: string): RoomState | null {
  const raw = localStorage.getItem(storageKey(roomId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as RoomState;
  } catch {
    return null;
  }
}

function persistRoom(room: RoomState) {
  localStorage.setItem(storageKey(room.roomId), JSON.stringify(room));
  localStorage.setItem(CURRENT_ROOM_KEY, room.roomId);
}

function getOrCreateLocalParticipant(
  displayName: string,
  role: "host" | "guest",
): Participant {
  const raw = sessionStorage.getItem(LOCAL_PARTICIPANT_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Participant;
      const updated = {
        ...parsed,
        displayName: displayName.trim() || parsed.displayName,
        role,
        lastSeenAt: nowIso(),
      };
      sessionStorage.setItem(LOCAL_PARTICIPANT_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      sessionStorage.removeItem(LOCAL_PARTICIPANT_KEY);
    }
  }

  const participant = createParticipant(displayName, role);
  sessionStorage.setItem(LOCAL_PARTICIPANT_KEY, JSON.stringify(participant));
  return participant;
}

function App() {
  const queryRoom = new URLSearchParams(window.location.search).get("room");
  const rememberedRoom = localStorage.getItem(CURRENT_ROOM_KEY);
  const initialRoomId = normalizeRoomCode(queryRoom ?? rememberedRoom ?? "");
  const [room, setRoom] = useState<RoomState | null>(() =>
    initialRoomId ? loadRoom(initialRoomId) : null,
  );
  const [displayName, setDisplayName] = useState("");
  const [joinCode, setJoinCode] = useState(initialRoomId);
  const [showJoinForm, setShowJoinForm] = useState(Boolean(initialRoomId));
  const [setupDraft, setSetupDraft] = useState<WatchSetup>({
    service: "",
    title: "",
    targetTimestamp: "00:00",
  });
  const [copyStatus, setCopyStatus] = useState("");
  const [showSetupSheet, setShowSetupSheet] = useState(false);
  const [showLaptopDrawer, setShowLaptopDrawer] = useState(false);
  const [showTvRemoteDrawer, setShowTvRemoteDrawer] = useState(
    () => !loadLinkedTvDevice(),
  );
  const [showRemoteSetupDetails, setShowRemoteSetupDetails] = useState(false);
  const [showRecommendDrawer, setShowRecommendDrawer] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [recommendationQuery, setRecommendationQuery] = useState("");
  const [selectedRecommendationProviders, setSelectedRecommendationProviders] =
    useState<string[]>(loadRecommendationProviders);
  const [recommendationRegion, setRecommendationRegion] = useState(
    loadRecommendationRegion,
  );
  const [recommendationMediaType, setRecommendationMediaType] = useState<
    "all" | "movie" | "tv"
  >("all");
  const [recommendationCategory, setRecommendationCategory] = useState<
    "popular" | "new" | "recent"
  >("popular");
  const [liveRecommendationResults, setLiveRecommendationResults] = useState<
    WatchRecommendation[]
  >([]);
  const [recommendationStatus, setRecommendationStatus] = useState(
    "Showing a safe mock catalog. Live TMDB search is optional once a server token is configured.",
  );
  const [recommendationSource, setRecommendationSource] = useState<
    "mock" | "tmdb"
  >("mock");
  const [linkedTvDevice, setLinkedTvDevice] = useState<LinkedTvDevice>(
    () => loadLinkedTvDevice() ?? normalizeLinkedTvDevice({ platform: "roku" }),
  );
  const [remoteStartRuntimeConfig, setRemoteStartRuntimeConfig] = useState(
    DEFAULT_REMOTE_START_RUNTIME_CONFIG,
  );
  const [remoteStartInternalUnlocked] = useState(() =>
    isRemoteStartInternalBetaUnlocked(),
  );
  const [remoteWatchingMethod, setRemoteWatchingMethod] = useState<
    RemoteStartWatchingMethod | ""
  >(() => {
    const saved = loadLinkedTvDevice();
    return saved ? inferWatchingMethod(saved.platform) : "";
  });
  const [hasChosenRemotePlatform, setHasChosenRemotePlatform] = useState(() =>
    Boolean(loadLinkedTvDevice()),
  );
  const [tvRemoteStatus, setTvRemoteStatus] = useState(
    "No linked TV yet. Start with how you watch, pick your device, then follow the setup steps.",
  );
  const [pendingReadyDevice, setPendingReadyDevice] =
    useState<LinkedTvDevice | null>(null);
  const [countdownText, setCountdownText] = useState("3");
  const [transportStatus, setTransportStatus] =
    useState<TransportStatus>("idle");
  const transportRef = useRef<RoomTransport | null>(null);
  const autoCountdownDispatchKeyRef = useRef("");
  const playNowDispatchKeyRef = useRef("");

  const [localParticipant, setLocalParticipant] = useState<Participant | null>(
    () => {
      const raw = sessionStorage.getItem(LOCAL_PARTICIPANT_KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as Participant;
      } catch {
        return null;
      }
    },
  );

  const people = room ? participantList(room) : [];
  const currentParticipantId = localParticipant?.id ?? "";
  const inviteLink = room
    ? `${window.location.origin}${window.location.pathname}?room=${room.roomId}`
    : "";
  const isReady = Boolean(
    room &&
    currentParticipantId &&
    room.readyState[currentParticipantId] === "ready",
  );
  const isSoloRoom = people.length === 1;
  const chatMessages = room
    ? room.eventLog.filter((event) => event.type === "chat_message").slice(-20)
    : [];
  const recommendationMessages = room
    ? room.eventLog
        .filter((event) => event.type === "recommendation_sent")
        .slice(-10)
    : [];
  const recommendationQueue = room
    ? buildRecommendationQueue(room.eventLog)
    : [];
  const queuedRecommendationKeys = new Set(
    recommendationQueue.map((item) => item.key),
  );
  const selectedWatchEvent = room
    ? room.eventLog.findLast(
        (event) => event.type === "recommendation_selected",
      )
    : undefined;
  const mockRecommendationResults = filterRecommendations(
    recommendationQuery,
    selectedRecommendationProviders,
    { mediaType: recommendationMediaType, category: recommendationCategory },
  );
  const recommendationResults =
    recommendationSource === "tmdb"
      ? liveRecommendationResults
      : mockRecommendationResults;
  const selectedRecommendationProviderLabels =
    selectedRecommendationProviders.map((provider) =>
      getRecommendationProviderLabel(provider),
    );
  const pairedExtensions = room ? Object.values(room.extensions ?? {}) : [];
  const localPlayback =
    room && currentParticipantId
      ? room.playbackByParticipant?.[currentParticipantId]
      : undefined;
  const readyCount = room
    ? people.filter((person) => room.readyState[person.id] === "ready").length
    : 0;
  const setupOpen = Boolean(
    room && (room.targetTimestamp === "00:00" || showSetupSheet),
  );
  const manualModeLabel =
    pairedExtensions.length > 0
      ? "Laptop auto-sync available"
      : "TV/manual mode";
  const tvCapability = getRemoteStartCapability(linkedTvDevice.platform);
  const isPublicRemoteStartLane =
    isRemoteStartPlatformEnabled(
      linkedTvDevice.platform,
      remoteStartRuntimeConfig,
      remoteStartInternalUnlocked,
    ) &&
    (tvCapability.publicClaimLevel === "primary-beta" ||
      tvCapability.publicClaimLevel === "guided-setup-beta");
  const linkedTvMissingConfig =
    linkedTvDevice.platform === "home_assistant_webhook"
      ? !linkedTvDevice.webhookUrl?.trim()
      : platformNeedsHost(linkedTvDevice.platform) &&
        !linkedTvDevice.host.trim();
  const hasRecentHelperCheck = Boolean(linkedTvDevice.lastTestedAt);
  const remoteStartWizard = getRemoteStartWizard(linkedTvDevice.platform);
  const canRunConnectionCheck =
    isPublicRemoteStartLane &&
    tvCapability.canTestConnection &&
    !linkedTvMissingConfig;
  const canSaveRemoteSetup = !isPublicRemoteStartLane || !linkedTvMissingConfig;
  const remoteStartAtGoEnabled = canUseRemoteStartAtGo(
    linkedTvDevice,
    remoteStartRuntimeConfig,
    remoteStartInternalUnlocked,
  );
  const remoteStartReadiness = getRemoteStartReadiness(
    linkedTvDevice,
    Boolean(linkedTvDevice.lastTestedAt),
    remoteStartRuntimeConfig,
    remoteStartInternalUnlocked,
  );
  const selectedTvPlatformOption = hasChosenRemotePlatform
    ? TV_PLATFORM_OPTIONS.find(
        (option) => option.id === linkedTvDevice.platform,
      )
    : undefined;
  const selectedRemoteChoice = hasChosenRemotePlatform
    ? REMOTE_START_ONBOARDING_CHOICES.find(
        (choice) => choice.platform === linkedTvDevice.platform,
      )
    : undefined;
  const visibleRemoteChoices = getVisibleRemoteStartChoices(
    remoteWatchingMethod,
    remoteStartRuntimeConfig,
    remoteStartInternalUnlocked,
  );
  const visibleTvPlatformOptions = getVisibleTvPlatformOptions(
    remoteStartRuntimeConfig,
    remoteStartInternalUnlocked,
  );
  const selectedWatchingMethod = remoteWatchingMethod
    ? REMOTE_START_WATCHING_METHOD_CHOICES.find(
        (choice) => choice.id === remoteWatchingMethod,
      )
    : undefined;
  const methodHelperCopy = (
    choice: (typeof REMOTE_START_WATCHING_METHOD_CHOICES)[number],
  ) => {
    if (!remoteStartRuntimeConfig.remoteStartKillSwitchEnabled)
      return choice.helper;
    if (choice.id === "streaming_stick_or_box")
      return "Streaming boxes stay on manual countdown tonight.";
    if (choice.id === "built_in_tv_app")
      return "TV apps stay on manual countdown tonight.";
    return choice.helper;
  };
  const methodNextCopy = selectedWatchingMethod
    ? remoteStartRuntimeConfig.remoteStartKillSwitchEnabled
      ? "Manual countdown works tonight. Remote Start setup is not available for this session."
      : selectedWatchingMethod.nextCopy
    : "";
  const tvRemoteRoadmap = [
    {
      label: "Roku / Roku TV",
      status: "Remote Start beta / primary",
      note: "Local ECP Play at GO; some Roku OS builds require Control by mobile apps/network access.",
    },
    {
      label: "LG webOS",
      status: "Remote Start beta / primary",
      note: "Pair on TV prompt, save client key locally, then Test Play/Pause. Hardware validation pending.",
    },
    {
      label: "Samsung Tizen",
      status: "Remote Start beta",
      note: "TV approval/token if required, Test Play/Pause. Model/firmware variance expected.",
    },
    {
      label: "Sony Bravia",
      status: "Remote Start beta for supported Sony TVs",
      note: "Enable IP Control/PSK or PIN if needed, discover Play IRCC code, then Test Play.",
    },
    {
      label: "Fire TV / Android TV / Google TV",
      status: "Guided setup beta",
      note: "Developer Options/debugging, IP or pairing code, approve prompt, Test Play, Save. Some devices may need reconnect.",
    },
    {
      label: "Apple TV",
      status: "Manual-only",
      note: "No public direct-control headline claim; reverse-engineered pairing stays internal/beta only if accepted.",
    },
    {
      label: "Xbox / Cable / ISP boxes / Cast-AirPlay",
      status: "Manual-only",
      note: "Manual countdown remains the truthful public path unless a safe account/session-specific beta is separately accepted.",
    },
  ];

  useEffect(() => {
    let cancelled = false;
    fetch("/api/remote-start-runtime-config", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled) return;
        const nextConfig = applyQaRemoteStartBetaPlatform(
          normalizeRemoteStartRuntimeConfig(payload),
        );
        setRemoteStartRuntimeConfig(nextConfig);
        if (nextConfig.remoteStartKillSwitchEnabled) {
          setPendingReadyDevice(null);
          setLinkedTvDevice((current) =>
            normalizeLinkedTvDevice({
              ...current,
              lastTestedAt: undefined,
              useRemoteStartAtGo: false,
            }),
          );
        }
      })
      .catch(() => {
        if (!cancelled)
          setRemoteStartRuntimeConfig(DEFAULT_REMOTE_START_RUNTIME_CONFIG);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const transport = createWebSocketRoomTransport({
      onSnapshot: (nextRoom) => {
        setRoom(nextRoom);
        setSetupDraft({
          service: nextRoom.service,
          title: nextRoom.title,
          targetTimestamp: nextRoom.targetTimestamp,
        });
        setJoinCode(nextRoom.roomId);
        setCopyStatus((current) =>
          current === "Creating room..." || current === "Joining room..."
            ? ""
            : current,
        );
        localStorage.setItem(CURRENT_ROOM_KEY, nextRoom.roomId);
        window.history.replaceState(null, "", `?room=${nextRoom.roomId}`);
      },
      onStatus: (status, detail) => {
        setTransportStatus(status);
        if (status === "error" && detail) setCopyStatus(detail);
      },
      onError: (message) => setCopyStatus(message),
    });
    transportRef.current = transport;
    return () => transport.close();
  }, []);

  useEffect(() => {
    if (!room) return;
    persistRoom(room);
  }, [room]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!room || event.key !== storageKey(room.roomId) || !event.newValue)
        return;
      try {
        const nextRoom = JSON.parse(event.newValue) as RoomState;
        setRoom(nextRoom);
        setSetupDraft({
          service: nextRoom.service,
          title: nextRoom.title,
          targetTimestamp: nextRoom.targetTimestamp,
        });
      } catch {
        return;
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [room]);

  const dispatch = useCallback(
    (event: RoomEvent) => {
      if (room && transportStatus === "connected" && transportRef.current) {
        transportRef.current.sendEvent(room.roomId, event);
        return;
      }

      setRoom((current) => {
        if (!current) return current;
        return applyRoomEvent(current, event);
      });
    },
    [room, transportStatus],
  );

  const callTvRemoteHelper = useCallback(
    async (path: string, init?: RequestInit) => {
      const baseUrl = linkedTvDevice.helperUrl.trim().replace(/\/$/, "");
      if (!baseUrl) throw new Error("Enter the TV remote helper URL first.");
      if (!isAllowedLocalHelperUrl(baseUrl))
        throw new Error(
          "Helper URL must be localhost, a private LAN address, or a .local host before Watch Sync sends local pairing details.",
        );
      const response = await fetch(`${baseUrl}${path}`, init);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        throw new Error(
          payload?.error ?? `TV remote helper returned ${response.status}`,
        );
      }
      return payload;
    },
    [linkedTvDevice.helperUrl],
  );

  const runHelperRequest = useCallback(
    async (
      request:
        | ReturnType<typeof buildDevicePlayRequest>
        | ReturnType<typeof buildDevicePauseRequest>
        | ReturnType<typeof buildDeviceTestRequest>,
    ) => {
      if (request.unsafeReason) throw new Error(request.unsafeReason);
      if (request.method === "GET") return callTvRemoteHelper(request.path);
      return callTvRemoteHelper(request.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.body ?? {}),
      });
    },
    [callTvRemoteHelper],
  );

  const saveLinkedDevice = useCallback(
    (patch: Partial<LinkedTvDevice> = {}) => {
      const next = normalizeLinkedTvDevice({ ...linkedTvDevice, ...patch });
      setLinkedTvDevice(next);
      saveLinkedTvDevice(next);
      const storageCopy =
        next.platform === "home_assistant_webhook"
          ? "Home Assistant advanced bridge saved locally. Watch Sync servers do not store HA credentials, entity IDs, or webhook URLs."
          : next.platform === "apple_tv_manual"
            ? "Apple TV saved as manual-only. Watch Sync will not send direct Apple TV commands; manual countdown remains the path."
            : `${next.label} saved locally for Remote Start. Room backend still only coordinates countdown; this helper controls your local device on your LAN.`;
      setTvRemoteStatus(storageCopy);
    },
    [linkedTvDevice],
  );

  const testLinkedDevice = useCallback(async () => {
    const savedDevice = normalizeLinkedTvDevice(linkedTvDevice);
    saveLinkedTvDevice(savedDevice);
    setTvRemoteStatus(`Testing ${savedDevice.label} via local helper...`);
    try {
      const request = buildDeviceTestRequest(
        savedDevice,
        remoteStartRuntimeConfig,
        remoteStartInternalUnlocked,
      );
      logRemoteStartOutcome({
        type: "roku_test_play_attempt",
        platform: savedDevice.platform,
        testPlayResult: "unknown",
      });
      const payload = await runHelperRequest(request);
      const updates: Partial<LinkedTvDevice> = {};
      if (
        savedDevice.platform === "lg_webos" &&
        typeof payload?.clientKey === "string"
      )
        updates.clientKey = payload.clientKey;
      if (
        savedDevice.platform === "samsung" &&
        typeof payload?.token === "string"
      )
        updates.token = payload.token;
      const pending = normalizeLinkedTvDevice({
        ...savedDevice,
        ...updates,
        lastTestedAt: undefined,
        useRemoteStartAtGo: false,
      });
      setPendingReadyDevice(pending);
      setLinkedTvDevice(pending);
      saveLinkedTvDevice(pending);
      logRemoteStartOutcome({
        type: "test_play_pass",
        platform: savedDevice.platform,
        testPlayResult: "pass",
      });
      setTvRemoteStatus(
        `${savedDevice.label} Test Play sent. Confirm that the video started, then pause it again before enabling GO Play.`,
      );
    } catch (error) {
      logRemoteStartOutcome({
        type: "test_play_fail",
        platform: savedDevice.platform,
        testPlayResult: "fail",
        failureCode: error instanceof Error ? error.message : "helper_failed",
      });
      setPendingReadyDevice(null);
      setTvRemoteStatus(
        error instanceof Error
          ? error.message
          : `${savedDevice.label} helper check failed.`,
      );
    }
  }, [
    linkedTvDevice,
    remoteStartInternalUnlocked,
    remoteStartRuntimeConfig,
    runHelperRequest,
    saveLinkedDevice,
  ]);

  const confirmTestPlayStarted = useCallback(() => {
    if (!pendingReadyDevice) return;
    const ready = normalizeLinkedTvDevice({
      ...pendingReadyDevice,
      lastTestedAt: nowIso(),
      useRemoteStartAtGo: true,
    });
    setPendingReadyDevice(null);
    setLinkedTvDevice(ready);
    saveLinkedTvDevice(ready);
    logRemoteStartOutcome({
      type: "ready_confirmed",
      platform: ready.platform,
      testPlayResult: "pass",
    });
    setTvRemoteStatus(
      `${ready.label} is ready for 3·2·1 Play. Keep the video paused; Watch Sync will send one Play command at PLAY.`,
    );
  }, [pendingReadyDevice]);

  const rejectTestPlayStarted = useCallback(() => {
    if (pendingReadyDevice)
      logRemoteStartOutcome({
        type: "manual_play_fallback",
        platform: pendingReadyDevice.platform,
        testPlayResult: "fail",
        manualPlayFallbackUsed: true,
      });
    setPendingReadyDevice(null);
    setLinkedTvDevice((current) =>
      normalizeLinkedTvDevice({
        ...current,
        lastTestedAt: undefined,
        useRemoteStartAtGo: false,
      }),
    );
    setTvRemoteStatus(
      "Use manual countdown tonight. No Remote Start command will be sent at PLAY.",
    );
  }, [pendingReadyDevice]);

  const sendLinkedTvPlay = useCallback(
    async (source: "manual" | "countdown" = "manual") => {
      const savedDevice = normalizeLinkedTvDevice(linkedTvDevice);
      const missingLocalConfig =
        savedDevice.platform === "home_assistant_webhook"
          ? !savedDevice.webhookUrl?.trim()
          : platformNeedsHost(savedDevice.platform) && !savedDevice.host.trim();
      if (
        source === "countdown" &&
        !canUseRemoteStartAtGo(
          savedDevice,
          remoteStartRuntimeConfig,
          remoteStartInternalUnlocked,
        )
      ) {
        logRemoteStartOutcome({
          type: "manual_play_fallback",
          platform: savedDevice.platform,
          goResult: "manual",
          manualPlayFallbackUsed: true,
        });
        setTvRemoteStatus(
          "Remote Start at GO is off or this platform has no safe GO Play command. Manual countdown remains the fallback.",
        );
        return;
      }
      if (missingLocalConfig) {
        setTvRemoteStatus(
          savedDevice.platform === "home_assistant_webhook"
            ? "Add a Home Assistant webhook URL before sending GO. Manual countdown still works."
            : "Link a supported TV/device before sending Play. Manual countdown still works.",
        );
        return;
      }
      saveLinkedTvDevice(savedDevice);
      setTvRemoteStatus(
        savedDevice.platform === "home_assistant_webhook"
          ? "Sending one Home Assistant webhook GO via local helper..."
          : `Sending one ${savedDevice.label} Play command via local helper...`,
      );
      try {
        const request = buildDevicePlayRequest(
          savedDevice,
          remoteStartRuntimeConfig,
          remoteStartInternalUnlocked,
        );
        if (savedDevice.platform === "home_assistant_webhook") {
          request.body = {
            ...(request.body ?? {}),
            roomId: room?.roomId,
            countdownId: String(
              room?.countdownState.startedAt ??
                room?.countdownState.startsAtEpochMs ??
                "",
            ),
            issuedAt: nowIso(),
          };
        }
        logRemoteStartOutcome({
          type: "go_attempted",
          platform: savedDevice.platform,
          goResult: "unknown",
        });
        await runHelperRequest(request);
        logRemoteStartOutcome({
          type: "go_sent",
          platform: savedDevice.platform,
          goResult: "sent",
        });
        setTvRemoteStatus(
          savedDevice.platform === "home_assistant_webhook"
            ? `Home Assistant webhook GO sent (${source}). Compatibility depends on your HA automation/integration/device/app; use manual fallback if it does not play.`
            : `${savedDevice.label} Play sent (${source}). This is a generic remote command only; use manual fallback if the TV app ignores it.`,
        );
      } catch (error) {
        logRemoteStartOutcome({
          type: "go_failed",
          platform: savedDevice.platform,
          goResult: "failed",
          failureCode: error instanceof Error ? error.message : "helper_failed",
        });
        setTvRemoteStatus(
          error instanceof Error
            ? error.message
            : `${savedDevice.label} Play failed. Use manual countdown.`,
        );
      }
    },
    [
      linkedTvDevice,
      remoteStartInternalUnlocked,
      remoteStartRuntimeConfig,
      room,
      runHelperRequest,
    ],
  );

  const sendLinkedTvPause = useCallback(async () => {
    const savedDevice = normalizeLinkedTvDevice(linkedTvDevice);
    saveLinkedTvDevice(savedDevice);
    setTvRemoteStatus(
      `Sending one ${savedDevice.label} Pause command via local helper...`,
    );
    try {
      const request = buildDevicePauseRequest(savedDevice);
      await runHelperRequest(request);
      setTvRemoteStatus(
        `${savedDevice.label} Pause sent. This is a generic remote command only; if the app ignores it, pause manually at the sync point.`,
      );
    } catch (error) {
      setTvRemoteStatus(
        error instanceof Error
          ? error.message
          : `${savedDevice.label} Pause failed. Pause manually at the sync point.`,
      );
    }
  }, [linkedTvDevice, runHelperRequest]);

  const tick = useCallback((frequency = 660) => {
    if ("vibrate" in navigator) navigator.vibrate(frequency > 900 ? 180 : 80);
  }, []);

  useEffect(() => {
    if (
      !room ||
      !bothReady(room) ||
      room.countdownState.phase !== "idle" ||
      !currentParticipantId ||
      currentParticipantId !== room.hostId
    )
      return;
    const readyKey = `${room.roomId}:${room.updatedAt}:${Object.entries(
      room.readyState,
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, status]) => `${id}:${status}`)
      .join("|")}`;
    if (autoCountdownDispatchKeyRef.current === readyKey) return;
    autoCountdownDispatchKeyRef.current = readyKey;
    dispatch({
      type: "countdown_started",
      actorId: currentParticipantId,
      startsAtEpochMs: Date.now() + 500,
      durationSeconds: 3,
      at: nowIso(),
    });
  }, [currentParticipantId, dispatch, room]);

  useEffect(() => {
    if (
      !room ||
      room.countdownState.phase !== "counting" ||
      !room.countdownState.startsAtEpochMs ||
      !currentParticipantId
    )
      return;

    const interval = window.setInterval(() => {
      const elapsedMs =
        Date.now() - (room.countdownState.startsAtEpochMs ?? Date.now());
      const remaining =
        room.countdownState.durationSeconds - Math.floor(elapsedMs / 1000);

      if (remaining > 0) {
        setCountdownText(String(remaining));
        tick(remaining === 1 ? 880 : 660);
        return;
      }

      window.clearInterval(interval);
      setCountdownText("PLAY");
      tick(1040);
      if (currentParticipantId === room.hostId) {
        const playKey = `${room.roomId}:${room.countdownState.startedAt ?? room.countdownState.startsAtEpochMs ?? ""}`;
        if (playNowDispatchKeyRef.current === playKey) return;
        playNowDispatchKeyRef.current = playKey;
        dispatch({
          type: "play_now",
          actorId: currentParticipantId,
          at: nowIso(),
        });
        if (remoteStartAtGoEnabled) void sendLinkedTvPlay("countdown");
        if (isSoloRoom) {
          window.setTimeout(() => {
            dispatch({
              type: "countdown_cancelled",
              actorId: currentParticipantId,
              at: nowIso(),
            });
          }, 900);
        }
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [
    currentParticipantId,
    dispatch,
    isSoloRoom,
    remoteStartAtGoEnabled,
    room,
    sendLinkedTvPlay,
    tick,
  ]);

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const host = getOrCreateLocalParticipant(displayName, "host");
    setLocalParticipant(host);

    if (transportStatus === "connected" && transportRef.current) {
      transportRef.current.createRoom(host);
      setCopyStatus("Creating room...");
      return;
    }

    const newRoom = createRoom(host);
    setRoom(newRoom);
    setSetupDraft({
      service: newRoom.service,
      title: newRoom.title,
      targetTimestamp: newRoom.targetTimestamp,
    });
    setJoinCode(newRoom.roomId);
    window.history.replaceState(null, "", `?room=${newRoom.roomId}`);
  }

  function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const roomId = normalizeRoomCode(joinCode);
    const guest = getOrCreateLocalParticipant(displayName, "guest");
    setLocalParticipant(guest);

    if (transportStatus === "connected" && transportRef.current) {
      transportRef.current.joinRoom(roomId, guest);
      setCopyStatus("Joining room...");
      return;
    }

    const existing = loadRoom(roomId);
    if (!existing) {
      setCopyStatus(
        "Room not found. Check the code or ask your partner for a fresh invite link.",
      );
      return;
    }

    const joined = applyRoomEvent(existing, {
      type: "participant_joined",
      participant: guest,
      at: nowIso(),
    });
    setRoom(joined);
    setSetupDraft({
      service: joined.service,
      title: joined.title,
      targetTimestamp: joined.targetTimestamp,
    });
    window.history.replaceState(null, "", `?room=${joined.roomId}`);
  }

  function saveSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!room || !currentParticipantId) return;
    dispatch({
      type: "setup_updated",
      setup: {
        ...setupDraft,
        targetTimestamp: setupDraft.targetTimestamp || "00:00",
      },
      actorId: currentParticipantId,
      at: nowIso(),
    });
    setShowSetupSheet(false);
  }

  async function copyInvite() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyStatus("Link copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch {
      setCopyStatus(`Copy this link: ${inviteLink}`);
    }
  }

  function requestResync() {
    if (!room || !currentParticipantId) return;
    dispatch({
      type: "resync_requested",
      actorId: currentParticipantId,
      timestamp: room.targetTimestamp || "00:00",
      at: nowIso(),
    });
  }

  function toggleReady() {
    if (!room || !currentParticipantId) return;
    dispatch({
      type: "participant_ready",
      participantId: currentParticipantId,
      ready: !isReady,
      at: nowIso(),
    });
  }

  async function copyPairingDetails() {
    if (!room || !currentParticipantId) return;
    const details = JSON.stringify(
      {
        roomCode: room.roomId,
        participantId: currentParticipantId,
        websocketUrl: realtimeUrl,
      },
      null,
      2,
    );
    try {
      await navigator.clipboard.writeText(details);
      setCopyStatus("Pairing details copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch {
      setCopyStatus(`Pairing details: ${details}`);
    }
  }

  function trySoloCountdown() {
    if (
      !room ||
      !currentParticipantId ||
      !isSoloRoom ||
      room.countdownState.phase === "counting"
    )
      return;
    setCountdownText("3");
    dispatch({
      type: "countdown_started",
      actorId: currentParticipantId,
      startsAtEpochMs: Date.now() + 500,
      durationSeconds: 3,
      at: nowIso(),
    });
  }

  function updateLinkedDevice(patch: Partial<LinkedTvDevice>) {
    setLinkedTvDevice((current) =>
      normalizeLinkedTvDevice({ ...current, ...patch }),
    );
  }

  function toggleRecommendationProvider(provider: string) {
    const providerSlug = normalizeRecommendationProviderSlugs([provider])[0];
    if (!providerSlug) return;
    setSelectedRecommendationProviders((current) =>
      current.includes(providerSlug)
        ? current.filter((item) => item !== providerSlug)
        : [...current, providerSlug],
    );
  }

  function updateRecommendationRegion(region: string) {
    const nextRegion = normalizeRecommendationRegion(region);
    setRecommendationRegion(nextRegion);
    persistRecommendationRegion(nextRegion);
  }

  function saveRecommendationServices() {
    persistRecommendationProviders(selectedRecommendationProviders);
    setRecommendationStatus("Services saved locally on this device.");
  }

  async function browseLiveRecommendations() {
    setRecommendationStatus(
      "Browsing TMDB provider catalog via the server token proxy...",
    );
    try {
      const response = await fetch(
        buildRecommendationDiscoverApiUrl({
          providers: selectedRecommendationProviders,
          mediaType: recommendationMediaType,
          category: recommendationCategory,
          region: recommendationRegion,
        }),
      );
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        items?: WatchRecommendation[];
        error?: string;
        fallback?: string;
      };
      if (!response.ok || payload.ok === false) {
        setRecommendationSource("mock");
        setLiveRecommendationResults([]);
        setRecommendationStatus(
          `${payload.error ?? `TMDB discover returned ${response.status}`} Showing mock catalog instead.`,
        );
        return;
      }
      setLiveRecommendationResults(payload.items ?? []);
      setRecommendationSource("tmdb");
      setRecommendationStatus(
        (payload.items?.length ?? 0) > 0
          ? "Showing provider-filtered TMDB browse results. Availability can vary by region, account plan, and date."
          : "TMDB returned no provider-filtered titles for those filters. Try a different service or tab, or use mock cards.",
      );
    } catch (error) {
      setRecommendationSource("mock");
      setLiveRecommendationResults([]);
      setRecommendationStatus(
        error instanceof Error
          ? `${error.message}. Showing mock catalog instead.`
          : "TMDB provider browsing failed. Showing mock catalog instead.",
      );
    }
  }

  async function searchLiveRecommendations() {
    const query = recommendationQuery.trim();
    if (!query) {
      setRecommendationSource("mock");
      setRecommendationStatus(
        "Type a title or keyword before live TMDB search. Mock recommendations are still available.",
      );
      return;
    }
    setRecommendationStatus("Searching TMDB via the server token proxy...");
    try {
      const response = await fetch(
        buildRecommendationSearchApiUrl(
          query,
          selectedRecommendationProviders,
          recommendationRegion,
        ),
      );
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        items?: WatchRecommendation[];
        error?: string;
        fallback?: string;
      };
      if (!response.ok || payload.ok === false) {
        setRecommendationSource("mock");
        setLiveRecommendationResults([]);
        setRecommendationStatus(
          `${payload.error ?? `TMDB search returned ${response.status}`} Showing mock catalog instead.`,
        );
        return;
      }
      setLiveRecommendationResults(payload.items ?? []);
      setRecommendationSource("tmdb");
      setRecommendationStatus(
        (payload.items?.length ?? 0) > 0
          ? "Showing live TMDB results for the selected region/providers. Provider availability can vary by account and date."
          : "TMDB returned no matching titles for those filters. Showing an empty live result set; clear live search to return to mock cards.",
      );
    } catch (error) {
      setRecommendationSource("mock");
      setLiveRecommendationResults([]);
      setRecommendationStatus(
        error instanceof Error
          ? `${error.message}. Showing mock catalog instead.`
          : "TMDB search failed. Showing mock catalog instead.",
      );
    }
  }

  function clearLiveRecommendations() {
    setRecommendationSource("mock");
    setLiveRecommendationResults([]);
    setRecommendationStatus(
      "Showing the safe mock catalog. Live TMDB search can be retried any time.",
    );
  }

  function openRecommendDrawer(nextOpen = true) {
    setShowRecommendDrawer(nextOpen);
    if (nextOpen) {
      setShowTvRemoteDrawer(false);
      setShowLaptopDrawer(false);
      setShowChat(false);
    }
  }

  function openTvRemoteDrawer(nextOpen = true) {
    setShowTvRemoteDrawer(nextOpen);
    if (nextOpen) {
      setShowRecommendDrawer(false);
      setShowLaptopDrawer(false);
      setShowChat(false);
    }
  }

  function openLaptopAutoDrawer(nextOpen = true) {
    setShowLaptopDrawer(nextOpen);
    if (nextOpen) {
      setShowRecommendDrawer(false);
      setShowTvRemoteDrawer(false);
      setShowChat(false);
    }
  }

  function toggleChatPanel() {
    setShowChat((current) => {
      const nextOpen = !current;
      if (nextOpen) {
        setShowRecommendDrawer(false);
        setShowTvRemoteDrawer(false);
        setShowLaptopDrawer(false);
      }
      return nextOpen;
    });
  }

  function clearRecommendationFilters() {
    setSelectedRecommendationProviders([]);
    localStorage.removeItem(RECOMMENDATION_PROVIDERS_KEY);
    setRecommendationStatus(
      "Provider filters cleared and local service preferences removed. Browse TMDB or search again across all services.",
    );
  }

  async function searchAllServices() {
    setSelectedRecommendationProviders([]);
    const query = recommendationQuery.trim();
    if (!query) {
      setRecommendationStatus(
        "Provider filters cleared. Browsing TMDB across all services...",
      );
      try {
        const response = await fetch(
          buildRecommendationDiscoverApiUrl({
            providers: [],
            mediaType: recommendationMediaType,
            category: recommendationCategory,
            region: recommendationRegion,
          }),
        );
        const payload = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          items?: WatchRecommendation[];
          error?: string;
          fallback?: string;
        };
        if (!response.ok || payload.ok === false) {
          setRecommendationSource("mock");
          setLiveRecommendationResults([]);
          setRecommendationStatus(
            `${payload.error ?? `TMDB discover returned ${response.status}`} Provider filters are cleared; showing mock catalog instead.`,
          );
          return;
        }
        setLiveRecommendationResults(payload.items ?? []);
        setRecommendationSource("tmdb");
        setRecommendationStatus(
          (payload.items?.length ?? 0) > 0
            ? "Showing TMDB browse results across all services. Availability can vary by region, account plan, and date."
            : "TMDB returned no titles across all services for this tab. Try another tab/search or use mock cards.",
        );
      } catch (error) {
        setRecommendationSource("mock");
        setLiveRecommendationResults([]);
        setRecommendationStatus(
          error instanceof Error
            ? `${error.message}. Provider filters are cleared; showing mock catalog instead.`
            : "TMDB browse failed after clearing filters. Showing mock catalog instead.",
        );
      }
      return;
    }

    setRecommendationStatus(
      "Provider filters cleared. Searching TMDB across all services...",
    );
    try {
      const response = await fetch(
        buildRecommendationSearchApiUrl(query, [], recommendationRegion),
      );
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        items?: WatchRecommendation[];
        error?: string;
        fallback?: string;
      };
      if (!response.ok || payload.ok === false) {
        setRecommendationSource("mock");
        setLiveRecommendationResults([]);
        setRecommendationStatus(
          `${payload.error ?? `TMDB search returned ${response.status}`} Provider filters are cleared; showing mock catalog instead.`,
        );
        return;
      }
      setLiveRecommendationResults(payload.items ?? []);
      setRecommendationSource("tmdb");
      setRecommendationStatus(
        (payload.items?.length ?? 0) > 0
          ? "Showing live TMDB results across all services. Provider availability can vary by region, account, and date."
          : "TMDB returned no matching titles across all services. Try another search or use mock cards.",
      );
    } catch (error) {
      setRecommendationSource("mock");
      setLiveRecommendationResults([]);
      setRecommendationStatus(
        error instanceof Error
          ? `${error.message}. Provider filters are cleared; showing mock catalog instead.`
          : "TMDB search failed after clearing filters. Showing mock catalog instead.",
      );
    }
  }

  function findRecommendationItem(
    sourceIdOrQueueKey: string,
  ): WatchRecommendation | undefined {
    return (
      recommendationResults.find(
        (candidate) =>
          candidate.sourceId === sourceIdOrQueueKey ||
          recommendationQueueKey(candidate) === sourceIdOrQueueKey,
      ) ??
      recommendationQueue.find(
        (queueItem) =>
          queueItem.key === sourceIdOrQueueKey ||
          queueItem.item.sourceId === sourceIdOrQueueKey,
      )?.item ??
      recommendationMessages.find(
        (event) => event.item.sourceId === sourceIdOrQueueKey,
      )?.item ??
      (selectedWatchEvent?.item.sourceId === sourceIdOrQueueKey ||
      (selectedWatchEvent &&
        recommendationQueueKey(selectedWatchEvent.item) === sourceIdOrQueueKey)
        ? selectedWatchEvent.item
        : undefined)
    );
  }

  function getRecommendationVoteSummary(sourceIdOrQueueKey: string) {
    const queueItem = recommendationQueue.find(
      (candidate) =>
        candidate.key === sourceIdOrQueueKey ||
        candidate.item.sourceId === sourceIdOrQueueKey,
    );
    return {
      up: queueItem?.upVotes ?? 0,
      down: queueItem?.downVotes ?? 0,
      current:
        currentParticipantId && queueItem
          ? queueItem.votesByParticipant[currentParticipantId]
          : undefined,
    };
  }

  function sendRecommendation(sourceId: string) {
    if (!room || !currentParticipantId) return;
    const item = findRecommendationItem(sourceId);
    if (!item) return;
    if (queuedRecommendationKeys.has(recommendationQueueKey(item))) {
      setCopyStatus(`${item.title} is already in Tonight's queue.`);
      setTimeout(() => setCopyStatus(""), 2200);
      return;
    }
    dispatch({
      type: "recommendation_sent",
      actorId: currentParticipantId,
      item,
      at: nowIso(),
    });
    setCopyStatus(`Added ${item.title} to Tonight's queue.`);
    setTimeout(() => setCopyStatus(""), 2200);
  }

  function voteRecommendation(sourceId: string, vote: "up" | "down") {
    if (!room || !currentParticipantId) return;
    const item = findRecommendationItem(sourceId);
    if (!item) return;
    dispatch({
      type: "recommendation_voted",
      actorId: currentParticipantId,
      sourceId,
      vote,
      at: nowIso(),
    });
    setCopyStatus(
      `${vote === "up" ? "Voted yes" : "Voted no"} on ${item.title}.`,
    );
    setTimeout(() => setCopyStatus(""), 1800);
  }

  function selectRecommendation(sourceId: string) {
    if (!room || !currentParticipantId) return;
    const item = findRecommendationItem(sourceId);
    if (!item) return;
    dispatch({
      type: "recommendation_selected",
      actorId: currentParticipantId,
      item,
      at: nowIso(),
    });
    setSetupDraft({
      service: item.providers[0] ?? "",
      title: item.title,
      targetTimestamp: "00:00",
    });
    setCopyStatus(
      `${item.title} set as tonight's watch. Everyone should pause at 00:00 and ready up.`,
    );
    setTimeout(() => setCopyStatus(""), 2400);
  }

  function sendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!room || !currentParticipantId) return;
    const message = chatDraft.trim();
    if (!message) return;
    dispatch({
      type: "chat_message",
      actorId: currentParticipantId,
      message,
      at: nowIso(),
    });
    setChatDraft("");
  }

  function getCountdownHint() {
    if (!room) return "";
    if (room.countdownState.phase === "counting")
      return "Get ready to press play!";
    if (room.countdownState.phase === "play") return "Press play now!";
    if (isSoloRoom) {
      return isReady
        ? "Waiting for your partner to join..."
        : "Invite your partner, then tap ready.";
    }
    if (isReady && !bothReady(room)) return "Waiting for your partner...";
    return "Both pause at this time, then tap ready.";
  }

  function countdownDisplay() {
    if (!room) return "00:00";
    if (room.countdownState.phase === "counting") return countdownText;
    if (room.countdownState.phase === "play") return "PLAY";
    return room.targetTimestamp || "00:00";
  }

  function getCountdownClass() {
    if (!room) return "";
    if (room.countdownState.phase === "counting") return "active";
    if (room.countdownState.phase === "play") return "play";
    return "";
  }

  function recommendationSubtitle(item: WatchRecommendation) {
    const mediaLabel = item.mediaType === "tv" ? "Series" : "Movie";
    return [item.year, mediaLabel, item.providers.join(", ") || "Any service"]
      .filter(Boolean)
      .join(" · ");
  }

  function queueRecommenderLabel(queueItem: RecommendationQueueItem) {
    if (!room) return "Added by Partner";
    const firstName =
      room.participants[queueItem.firstRecommendedBy]?.displayName ?? "Partner";
    const latestName =
      room.participants[queueItem.latestRecommendedBy]?.displayName ??
      "Partner";
    return queueItem.recommendCount > 1
      ? `First added by ${firstName}; latest by ${latestName}`
      : `Added by ${firstName}`;
  }

  // Landing / Welcome Screen
  if (!room) {
    return (
      <main className="app-shell landing" aria-labelledby="app-title">
        <section className="welcome-screen">
          <div className="welcome-orb" aria-hidden="true">
            <span>▶</span>
          </div>
          <div className="welcome-header">
            <p className="eyebrow">Date night, together</p>
            <h1 id="app-title">Watch Sync</h1>
            <p className="tagline">
              The shared remote for long-distance movie nights.
            </p>
          </div>

          <div className="truth-card" aria-label="How Watch Sync works">
            <span>Use it manually with any TV</span>
            <span>
              Auto-sync is available for supported browser tabs with the Chrome
              extension
            </span>
          </div>

          <form
            className="welcome-form"
            onSubmit={showJoinForm && joinCode ? handleJoin : handleCreate}
          >
            <label className="field-label">
              <span>Your name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Alex"
                aria-label="Your name"
                autoComplete="name"
              />
            </label>

            {showJoinForm ? (
              <>
                <label className="field-label">
                  <span>Room code</span>
                  <input
                    value={joinCode}
                    onChange={(event) =>
                      setJoinCode(normalizeRoomCode(event.target.value))
                    }
                    placeholder="AB12CD"
                    aria-label="Room code"
                    style={{
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                    }}
                  />
                </label>
                <button className="primary" type="submit">
                  Join movie night
                </button>
                <p className="join-toggle">
                  Starting fresh?{" "}
                  <button type="button" onClick={() => setShowJoinForm(false)}>
                    Create a room
                  </button>
                </p>
              </>
            ) : (
              <>
                <button className="primary" type="submit">
                  Create room
                </button>
                <p className="join-toggle">
                  Already invited?{" "}
                  <button type="button" onClick={() => setShowJoinForm(true)}>
                    Enter a code
                  </button>
                </p>
              </>
            )}
          </form>

          {copyStatus && (
            <p className="status-toast" role="status">
              {copyStatus}
            </p>
          )}
        </section>
      </main>
    );
  }

  // Room View
  return (
    <main className="app-shell" aria-labelledby="room-title">
      <header className="room-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            ▶
          </span>
          <div>
            <span className="brand-name">Watch Sync</span>
            <span className="mode-label">{manualModeLabel}</span>
          </div>
        </div>
        <button
          className="room-pill"
          type="button"
          onClick={copyInvite}
          aria-label="Copy invite link"
        >
          <span>{room.roomId}</span>
          <small>Invite</small>
        </button>
      </header>

      <section className="room-strip" aria-label="Room status">
        <span
          className={`connection-dot ${transportStatus === "connected" ? "" : "offline"}`}
        />
        <span>
          {transportStatus === "connected"
            ? "Live room connected"
            : "Private local room"}
        </span>
        <span className="strip-divider" aria-hidden="true" />
        <span>
          {readyCount}/{Math.max(people.length, 2)} ready
        </span>
      </section>

      <section
        className="early-remote-onboarding"
        aria-label="Remote Start quick setup"
      >
        <div className="onboarding-heading early-remote-heading">
          <span className="wizard-kicker">Remote Start setup</span>
          <h2>What are you using to watch?</h2>
          <p>
            Choose the screen or device playing the title. Manual countdown
            stays as fallback for all choices; Remote Start only sends a local
            Play at GO when a safe path exists.
          </p>
        </div>
        <div
          className="setup-sequence early-setup-sequence"
          aria-label="Remote Start setup steps"
        >
          <span>
            <strong>1</strong>Watch method
          </span>
          <span>
            <strong>2</strong>Device
          </span>
          <span>
            <strong>3</strong>Connect it
          </span>
        </div>
        <div
          className="early-method-row"
          aria-label="What are you using to watch choices"
        >
          {REMOTE_START_WATCHING_METHOD_CHOICES.map((choice) => {
            const active = remoteWatchingMethod === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                className={`early-method-choice ${active ? "active" : ""}`}
                aria-pressed={active}
                onClick={() => {
                  setRemoteWatchingMethod(choice.id);
                  setHasChosenRemotePlatform(false);
                  setShowRemoteSetupDetails(false);
                  logRemoteStartOutcome({
                    type: "setup_start",
                    deviceType: choice.title,
                  });
                  openTvRemoteDrawer(true);
                }}
              >
                <span aria-hidden="true">{choice.icon}</span>
                <strong>
                  {choice.id === "game_console_or_other"
                    ? "Console / cable / not sure"
                    : choice.title}
                </strong>
              </button>
            );
          })}
        </div>
        {!hasChosenRemotePlatform && (
          <p className="early-no-device">
            No TV or streaming device is selected yet — choose a watch method
            first.
          </p>
        )}
        <button
          className="early-remote-open"
          type="button"
          onClick={() => openTvRemoteDrawer(true)}
        >
          {remoteWatchingMethod
            ? "Continue to device setup"
            : "Start guided setup"}
        </button>
      </section>

      <section
        className="countdown-hero"
        aria-live="polite"
        aria-label="Countdown"
      >
        <div className="hero-copy">
          <p className="countdown-label">
            {room.countdownState.phase === "idle"
              ? "Both pause at"
              : room.countdownState.phase === "counting"
                ? "Ready in"
                : "Press play"}
          </p>
          <div
            className={`countdown-number ${getCountdownClass()}`}
            id="room-title"
          >
            {countdownDisplay()}
          </div>
          <p className="countdown-hint">{getCountdownHint()}</p>
        </div>

        <div className="partner-status" aria-label="Partner ready status">
          {people.map((person) => (
            <span
              className={`partner-chip ${room.readyState[person.id] === "ready" ? "ready" : ""} ${person.id === currentParticipantId ? "you" : ""}`}
              key={person.id}
            >
              <span className="status-dot" />
              <span>
                {person.displayName}
                {person.id === currentParticipantId ? " (you)" : ""}
              </span>
            </span>
          ))}
          {people.length < 2 && (
            <span className="partner-chip ghost">
              <span className="status-dot" />
              Waiting for partner
            </span>
          )}
        </div>

        <button
          className={`ready-button ${isReady ? "is-ready" : ""}`}
          type="button"
          onClick={toggleReady}
        >
          {isReady ? "Ready — tap to undo" : "I'm ready"}
        </button>

        {isSoloRoom && room.countdownState.phase !== "counting" && (
          <div className="solo-preview">
            <button type="button" onClick={trySoloCountdown}>
              Try solo countdown
            </button>
            <p>Preview only — real sync starts when both partners are ready.</p>
          </div>
        )}
      </section>

      {setupOpen && (
        <section className="setup-sheet" aria-label="Room setup">
          <div className="setup-section invite-card">
            <div>
              <p className="eyebrow">Invite</p>
              <h2>Send the room, then ready up together.</h2>
              <p>
                Manual sync is available for any TV. Auto-sync is for supported
                browser tabs.
              </p>
            </div>
            <button className="copy-button" type="button" onClick={copyInvite}>
              Copy invite
            </button>
          </div>

          <form className="setup-section time-card" onSubmit={saveSetup}>
            <div>
              <p className="eyebrow">Pause time</p>
              <h2>Set the timestamp both screens should pause at.</h2>
            </div>
            <div className="time-input-row">
              <input
                value={setupDraft.targetTimestamp}
                onChange={(event) =>
                  setSetupDraft({
                    ...setupDraft,
                    targetTimestamp: event.target.value,
                  })
                }
                placeholder="00:00"
                inputMode="numeric"
                aria-label="Pause time"
              />
              <button type="submit">Set</button>
            </div>
          </form>
        </section>
      )}

      {room.lastSignal && (
        <section className="alert-banner" role="status">
          <strong>{room.lastSignal.actorName}</strong>
          <span>{room.lastSignal.message}</span>
        </section>
      )}

      <section className="control-stack" aria-label="Room controls">
        <div className="quick-actions">
          <button
            className="secondary-action"
            type="button"
            onClick={toggleChatPanel}
            aria-expanded={showChat}
          >
            <span>Chat</span>
            {chatMessages.length > 0 && <small>{chatMessages.length}</small>}
          </button>
          <button
            className="secondary-action"
            type="button"
            onClick={requestResync}
          >
            Resync
          </button>
          <button
            className="secondary-action"
            type="button"
            onClick={() => setShowSetupSheet(!showSetupSheet)}
            aria-expanded={setupOpen}
          >
            Time
          </button>
          <button
            className="secondary-action"
            type="button"
            onClick={() => openRecommendDrawer(!showRecommendDrawer)}
            aria-expanded={showRecommendDrawer}
          >
            Find watch
          </button>
          <button
            className="secondary-action remote-start-shortcut"
            type="button"
            onClick={() => openTvRemoteDrawer(!showTvRemoteDrawer)}
            aria-expanded={showTvRemoteDrawer}
          >
            <span>Remote Start setup</span>
            <small>
              {remoteWatchingMethod
                ? "Continue device setup"
                : "Pick watch method first"}
            </small>
          </button>
        </div>

        {showChat && (
          <div className="chat-panel">
            <div className="chat-messages" aria-live="polite">
              {chatMessages.length === 0 ? (
                <p className="chat-empty">
                  A tiny backchannel for “pause?” and “ready”.
                </p>
              ) : (
                chatMessages.map((messageEvent) => (
                  <div
                    className={`chat-bubble ${messageEvent.actorId === currentParticipantId ? "sent" : "received"}`}
                    key={`${messageEvent.at}-${messageEvent.actorId}`}
                  >
                    {messageEvent.actorId !== currentParticipantId && (
                      <span className="sender">
                        {room.participants[messageEvent.actorId]?.displayName ??
                          "Partner"}
                      </span>
                    )}
                    {messageEvent.message}
                  </div>
                ))
              )}
            </div>
            <form className="chat-input-row" onSubmit={sendChatMessage}>
              <input
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                placeholder="Message..."
                maxLength={160}
                aria-label="Chat message"
              />
              <button type="submit" aria-label="Send">
                Send
              </button>
            </form>
          </div>
        )}

        {selectedWatchEvent && (
          <section
            className="tonight-card"
            aria-label="Tonight's selected watch"
          >
            <span className="eyebrow">Tonight</span>
            <strong>
              {selectedWatchEvent.item.title}
              {selectedWatchEvent.item.year
                ? ` (${selectedWatchEvent.item.year})`
                : ""}
            </strong>
            <p>
              Open this title in your own streaming app, pause at the sync
              point, then use manual countdown or TV Remote Mode to start
              together.
            </p>
          </section>
        )}

        <section
          className="recommendation-feed queue-section"
          aria-label="Tonight's queue"
        >
          <div className="queue-header">
            <div>
              <p className="eyebrow">Room picks</p>
              <h2>Tonight's queue</h2>
            </div>
            <span>{recommendationQueue.length} queued</span>
          </div>
          {recommendationQueue.length === 0 ? (
            <p className="queue-empty">
              Search by your services, add a few picks, then let the room vote
              on what to watch tonight.
            </p>
          ) : (
            recommendationQueue.map((queueItem) => {
              const votes = getRecommendationVoteSummary(queueItem.key);
              return (
                <article
                  className={`recommendation-card queue-card ${queueItem.selected ? "selected" : ""}`}
                  key={queueItem.key}
                >
                  <div className="recommendation-card-body">
                    <RecommendationPoster item={queueItem.item} />
                    <div className="recommendation-copy">
                      <div>
                        <strong>
                          {queueItem.item.title}
                          {queueItem.item.year
                            ? ` (${queueItem.item.year})`
                            : ""}
                        </strong>
                        <span>{recommendationSubtitle(queueItem.item)}</span>
                        <span>
                          {queueRecommenderLabel(queueItem)} ·{" "}
                          {queueItem.recommendCount} add
                          {queueItem.recommendCount === 1 ? "" : "s"}
                        </span>
                      </div>
                      <p>{queueItem.item.overview}</p>
                      <div className="recommendation-meta">
                        <span>
                          {queueItem.item.ratingLabel &&
                          queueItem.item.ratingValue
                            ? `${queueItem.item.ratingLabel}: ${queueItem.item.ratingValue}`
                            : "Rating unavailable"}
                        </span>
                        {queueItem.item.externalUrl && (
                          <a
                            href={queueItem.item.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Details
                          </a>
                        )}
                      </div>
                      {queueItem.selected && (
                        <span className="selected-badge">Set for tonight</span>
                      )}
                    </div>
                  </div>
                  <div
                    className="vote-row"
                    aria-label={`Votes for ${queueItem.item.title}`}
                  >
                    <button
                      className={votes.current === "up" ? "current-vote" : ""}
                      type="button"
                      onClick={() => voteRecommendation(queueItem.key, "up")}
                      aria-pressed={votes.current === "up"}
                    >
                      👍 {votes.up}
                    </button>
                    <button
                      className={votes.current === "down" ? "current-vote" : ""}
                      type="button"
                      onClick={() => voteRecommendation(queueItem.key, "down")}
                      aria-pressed={votes.current === "down"}
                    >
                      👎 {votes.down}
                    </button>
                    <button
                      type="button"
                      onClick={() => selectRecommendation(queueItem.key)}
                    >
                      {queueItem.selected ? "Selected" : "Set tonight"}
                    </button>
                  </div>
                  <p className="set-tonight-helper">
                    Sets the room's title and clears ready/countdown state so
                    everyone can open the same show and sync from the start.
                  </p>
                </article>
              );
            })
          )}
        </section>

        <div className="recommend-drawer">
          <button
            className={`drawer-toggle ${showRecommendDrawer ? "open" : ""}`}
            type="button"
            onClick={() => openRecommendDrawer(!showRecommendDrawer)}
            aria-expanded={showRecommendDrawer}
          >
            <span>Find next watch</span>
            <small>
              {recommendationSource === "tmdb"
                ? "Live TMDB browse/search"
                : "Pick services + browse"}
            </small>
          </button>

          {showRecommendDrawer && (
            <div className="drawer-content recommend-panel">
              <p>
                Pick the services you have and your country/region, browse TMDB
                discovery filters, or search a specific title. Availability is
                best-effort and varies by country, plan, and date; ratings shown
                here are TMDB User Ratings. Watch Sync does not scrape provider
                catalogs and is not endorsed by TMDB or any streaming service.
              </p>
              <div className="recommendation-tabs" aria-label="Browse category">
                {(
                  [
                    ["popular", "Popular"],
                    ["new", "New-ish"],
                    ["recent", "Recently aired"],
                  ] as const
                ).map(([category, label]) => (
                  <button
                    key={category}
                    className={
                      recommendationCategory === category ? "selected" : ""
                    }
                    type="button"
                    onClick={() => setRecommendationCategory(category)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="field-label compact">
                <span>Movies / shows</span>
                <select
                  value={recommendationMediaType}
                  onChange={(event) =>
                    setRecommendationMediaType(
                      event.target.value as "all" | "movie" | "tv",
                    )
                  }
                  aria-label="Recommendation media type"
                >
                  <option value="all">Movies + shows</option>
                  <option value="movie">Movies only</option>
                  <option value="tv">Shows only</option>
                </select>
              </label>
              <label className="field-label compact">
                <span>Country / region</span>
                <select
                  value={recommendationRegion}
                  onChange={(event) =>
                    updateRecommendationRegion(event.target.value)
                  }
                  aria-label="Recommendation country or region"
                >
                  <option value="US">United States (US)</option>
                  <option value="CA">Canada (CA)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="AU">Australia (AU)</option>
                  <option value="DE">Germany (DE)</option>
                  <option value="FR">France (FR)</option>
                  <option value="JP">Japan (JP)</option>
                </select>
              </label>
              <label className="field-label compact">
                <span>Search title</span>
                <input
                  value={recommendationQuery}
                  onChange={(event) =>
                    setRecommendationQuery(event.target.value)
                  }
                  placeholder="Try The Bear, Dune, comedy..."
                  aria-label="Search watch recommendations"
                />
              </label>
              <div className="remote-button-row triple recommendation-actions">
                <button type="button" onClick={browseLiveRecommendations}>
                  Browse TMDB
                </button>
                <button type="button" onClick={searchLiveRecommendations}>
                  Search TMDB
                </button>
                <button type="button" onClick={clearLiveRecommendations}>
                  Use mock
                </button>
                <span className={`source-pill ${recommendationSource}`}>
                  {recommendationSource === "tmdb" ? "Live" : "Mock"}
                </span>
              </div>
              <p className="mode-caveat">{recommendationStatus}</p>
              <div
                className="active-filter-row"
                aria-label="Active recommendation filters"
              >
                <span>
                  Active filters:{" "}
                  {selectedRecommendationProviderLabels.length > 0
                    ? selectedRecommendationProviderLabels.join(", ")
                    : "All services"}{" "}
                  · {recommendationRegion} ·{" "}
                  {recommendationMediaType === "all"
                    ? "Movies + shows"
                    : recommendationMediaType === "movie"
                      ? "Movies only"
                      : "Shows only"}
                </span>
                <button type="button" onClick={searchAllServices}>
                  Search all services
                </button>
                <button type="button" onClick={saveRecommendationServices}>
                  Save services
                </button>
                <button type="button" onClick={clearRecommendationFilters}>
                  Clear filters
                </button>
              </div>
              <div
                className="provider-filter-row"
                aria-label="Streaming service filters"
              >
                {RECOMMENDATION_PROVIDER_OPTIONS.map((provider) => (
                  <button
                    key={provider.slug}
                    className={
                      selectedRecommendationProviders.includes(provider.slug)
                        ? "selected"
                        : ""
                    }
                    type="button"
                    onClick={() => toggleRecommendationProvider(provider.slug)}
                  >
                    {provider.label}
                  </button>
                ))}
              </div>
              <div className="recommendation-results">
                {recommendationResults.length === 0 ? (
                  <div className="recommendation-empty-state">
                    <p className="chat-empty">
                      No matches for the active filters. Try all services, clear
                      filters, browse TMDB, or search another title.
                    </p>
                    <div
                      className="active-filter-row compact"
                      aria-label="No-match recovery actions"
                    >
                      <button type="button" onClick={searchAllServices}>
                        Search all services
                      </button>
                      <button
                        type="button"
                        onClick={clearRecommendationFilters}
                      >
                        Clear filters
                      </button>
                    </div>
                  </div>
                ) : (
                  recommendationResults.map((item) => {
                    const queued = queuedRecommendationKeys.has(
                      recommendationQueueKey(item),
                    );
                    return (
                      <article
                        className={`recommendation-card ${queued ? "queued" : ""}`}
                        key={item.sourceId}
                      >
                        <div className="recommendation-card-body">
                          <RecommendationPoster item={item} />
                          <div className="recommendation-copy">
                            <div>
                              <strong>
                                {item.title}
                                {item.year ? ` (${item.year})` : ""}
                              </strong>
                              <span>
                                {item.mediaType === "tv" ? "Series" : "Movie"} ·{" "}
                                {item.providers.join(", ") || "Any service"}
                              </span>
                            </div>
                            <p>{item.overview}</p>
                            <div className="recommendation-meta">
                              <span>
                                {item.ratingLabel && item.ratingValue
                                  ? `${item.ratingLabel}: ${item.ratingValue}`
                                  : "Rating unavailable"}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  sendRecommendation(item.sourceId)
                                }
                                disabled={queued}
                              >
                                {queued ? "In queue" : "Add to queue"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
              <p className="mode-caveat">
                Availability is best-effort TMDB provider data and can vary by
                country, plan, and date. TMDB ratings are TMDB User Ratings.
                This product uses the TMDB API but is not endorsed or certified
                by TMDB; Watch Sync does not scrape JustWatch, Rotten Tomatoes,
                IMDb, Metacritic, or provider catalogs.
              </p>
            </div>
          )}
        </div>

        <div className="tv-remote-drawer">
          <button
            className={`drawer-toggle ${showTvRemoteDrawer ? "open" : ""}`}
            type="button"
            onClick={() => openTvRemoteDrawer(!showTvRemoteDrawer)}
            aria-expanded={showTvRemoteDrawer}
          >
            <span>Remote Start setup</span>
            <small>What are you using to watch?</small>
          </button>

          {showTvRemoteDrawer && (
            <div className="drawer-content tv-remote-panel">
              <p>
                Remote Start is local device control at countdown GO. Everyone
                still opens the title themselves in their own streaming app,
                pauses at the sync point, readies up, and uses manual countdown
                as the universal fallback. If enabled below, Watch Sync sends
                one local Play command at GO only when the selected platform has
                a safe discrete Play path.
              </p>
              {hasChosenRemotePlatform &&
                tvCapability.publicClaimLevel === "manual-only" && (
                  <p className="mode-caveat">
                    {linkedTvDevice.label} is manual-only here. Watch Sync does
                    not claim direct control for this platform.
                  </p>
                )}
              {hasChosenRemotePlatform &&
                linkedTvDevice.platform === "home_assistant_webhook" && (
                  <p className="mode-caveat">
                    Home Assistant webhook is not a D2C default path. It is only
                    for users already running HA locally and stays outside
                    public Remote Start support. Watch Sync servers do not store
                    HA credentials, tokens, entity IDs, or webhook URLs. Manual
                    countdown remains the fallback.
                  </p>
                )}
              <section
                className="remote-onboarding-flow"
                aria-label="Remote Start onboarding"
              >
                <div className="onboarding-heading">
                  <span className="wizard-kicker">Step 1</span>
                  <h3>What are you using to watch?</h3>
                  <p>
                    Start here. Pick the thing actually playing
                    Netflix/Hulu/Prime/YouTube, then Watch Sync will narrow the
                    setup to the right device.
                  </p>
                </div>
                <div className="tv-choice-grid method-choice-grid">
                  {REMOTE_START_WATCHING_METHOD_CHOICES.map((choice) => {
                    const active = remoteWatchingMethod === choice.id;
                    return (
                      <button
                        key={choice.id}
                        type="button"
                        className={`tv-choice-card method-choice-card ${active ? "active" : ""}`}
                        aria-pressed={active}
                        onClick={() => {
                          setRemoteWatchingMethod(choice.id);
                          setHasChosenRemotePlatform(false);
                          setShowRemoteSetupDetails(false);
                          logRemoteStartOutcome({
                            type: "setup_start",
                            deviceType: choice.title,
                          });
                        }}
                      >
                        <span className="tv-choice-icon" aria-hidden="true">
                          {choice.icon}
                        </span>
                        <span className="tv-choice-copy">
                          <strong>{choice.title}</strong>
                          <small>{methodHelperCopy(choice)}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedWatchingMethod && (
                  <p className="selected-tv-hint">
                    <strong>Good.</strong> {methodNextCopy}
                  </p>
                )}
              </section>

              <section
                className={`remote-onboarding-flow ${remoteWatchingMethod ? "" : "disabled-step"}`}
                aria-label="Choose your TV or streaming device for Remote Start"
              >
                <div className="onboarding-heading">
                  <span className="wizard-kicker">Step 2</span>
                  <h3>
                    {remoteWatchingMethod
                      ? "Which device is it?"
                      : "Pick how you watch first"}
                  </h3>
                  <p>
                    {remoteWatchingMethod
                      ? "Tap the closest match. Nothing connects until you choose one and save/test it."
                      : "This step unlocks after Step 1 so the app does not default to any device."}
                  </p>
                </div>
                {remoteWatchingMethod ? (
                  <div className="tv-choice-grid">
                    {visibleRemoteChoices.map((choice) => {
                      const active =
                        hasChosenRemotePlatform &&
                        linkedTvDevice.platform === choice.platform;
                      return (
                        <button
                          key={choice.platform}
                          type="button"
                          className={`tv-choice-card ${active ? "active" : ""}`}
                          aria-pressed={active}
                          onClick={() => {
                            updateLinkedDevice({
                              platform: choice.platform,
                              label:
                                TV_PLATFORM_OPTIONS.find(
                                  (option) => option.id === choice.platform,
                                )?.label ?? choice.title,
                            });
                            setHasChosenRemotePlatform(true);
                            setShowRemoteSetupDetails(false);
                            logRemoteStartOutcome({
                              type: "setup_start",
                              platform: choice.platform,
                              deviceType: choice.title,
                            });
                          }}
                        >
                          <span className="tv-choice-icon" aria-hidden="true">
                            {choice.icon}
                          </span>
                          <span className="tv-choice-copy">
                            <strong>{choice.title}</strong>
                            <small>{choice.setupPreview}</small>
                          </span>
                          <span
                            className={`tv-choice-badge ${choice.recommended ? "recommended" : "manual"}`}
                          >
                            {choice.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-next-step">
                    Choose TV app, streaming stick/box, or not sure above.
                  </div>
                )}
                {hasChosenRemotePlatform && selectedRemoteChoice && (
                  <p className="selected-tv-hint">
                    <strong>Selected:</strong> {selectedRemoteChoice.title}.{" "}
                    {selectedRemoteChoice.nextCopy}
                  </p>
                )}
              </section>

              {hasChosenRemotePlatform ? (
                <section
                  className="remote-setup-wizard"
                  aria-label={`${remoteStartWizard.title} wizard`}
                >
                  <div className="wizard-heading-row">
                    <div>
                      <span className="wizard-kicker">Step 3 · Connect it</span>
                      <h3>{remoteStartWizard.title}</h3>
                    </div>
                    <span
                      className={`wizard-status ${remoteStartWizard.label === "Manual-only" ? "manual" : remoteStartWizard.label === "Guided setup beta" ? "guided" : remoteStartWizard.label === "Not supported yet" ? "unsupported" : "beta"}`}
                    >
                      {remoteStartWizard.label}
                    </span>
                  </div>
                  <p>{remoteStartWizard.summary}</p>
                  <ol className="wizard-steps">
                    {remoteStartWizard.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <button
                    className="details-toggle"
                    type="button"
                    onClick={() =>
                      setShowRemoteSetupDetails((current) => !current)
                    }
                  >
                    {showRemoteSetupDetails
                      ? "Hide setup details"
                      : "Show setup details"}
                  </button>
                  {showRemoteSetupDetails && (
                    <dl className="wizard-facts">
                      <div>
                        <dt>TV setting</dt>
                        <dd>{remoteStartWizard.tvSideSetting}</dd>
                      </div>
                      <div>
                        <dt>Reconnect expectation</dt>
                        <dd>{remoteStartWizard.pairingPersistence}</dd>
                      </div>
                      <div>
                        <dt>GO command</dt>
                        <dd>{remoteStartWizard.safeGoCommand}</dd>
                      </div>
                      <div>
                        <dt>Pause / toggle policy</dt>
                        <dd>
                          {remoteStartWizard.pausePolicy}{" "}
                          {remoteStartWizard.togglePolicy}
                        </dd>
                      </div>
                    </dl>
                  )}
                  <div className="wizard-action-row">
                    <strong>What next:</strong>
                    <span>
                      Enter the local details below → Save setup → Test Play →
                      enable GO Play if it works.
                    </span>
                  </div>
                  <p className="mode-caveat">{remoteStartWizard.publicCopy}</p>
                </section>
              ) : (
                <section
                  className="remote-setup-wizard empty-wizard"
                  aria-label="Remote Start setup locked until device selection"
                >
                  <span className="wizard-kicker">Step 3 · Connect it</span>
                  <h3>No device selected yet</h3>
                  <p>
                    Pick how you are watching, then pick the exact TV/streaming
                    device. The connection steps and buttons will appear after
                    that.
                  </p>
                </section>
              )}
              {hasChosenRemotePlatform && (
                <>
                  <label className="field-label compact">
                    <span>Advanced: exact platform</span>
                    <select
                      value={linkedTvDevice.platform}
                      onChange={(event) => {
                        const platform = event.target
                          .value as LinkedTvDevice["platform"];
                        updateLinkedDevice({
                          platform,
                          label:
                            TV_PLATFORM_OPTIONS.find(
                              (option) => option.id === platform,
                            )?.label ?? "Linked TV",
                        });
                        setRemoteWatchingMethod(inferWatchingMethod(platform));
                        setHasChosenRemotePlatform(true);
                      }}
                      aria-label="TV remote platform"
                    >
                      {visibleTvPlatformOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.displayLabel ??
                            `${option.label} — ${option.status}`}
                        </option>
                      ))}
                    </select>
                    {selectedTvPlatformOption && (
                      <small className="platform-picker-note">
                        {selectedTvPlatformOption.label}
                        {selectedTvPlatformOption.helperLabel
                          ? ` · ${selectedTvPlatformOption.helperLabel}`
                          : ""}
                        {" · "}
                        {selectedTvPlatformOption.status}
                      </small>
                    )}
                  </label>
                  {linkedTvDevice.platform === "home_assistant_webhook" ? (
                    <label className="field-label compact">
                      <span>Home Assistant webhook URL</span>
                      <input
                        value={linkedTvDevice.webhookUrl ?? ""}
                        onChange={(event) =>
                          updateLinkedDevice({ webhookUrl: event.target.value })
                        }
                        placeholder="http://homeassistant.local:8123/api/webhook/REPLACE_WITH_RANDOM_ID"
                        type="password"
                        autoComplete="off"
                        inputMode="url"
                        aria-label="Home Assistant webhook URL"
                      />
                    </label>
                  ) : platformNeedsHost(linkedTvDevice.platform) ? (
                    <label className="field-label compact">
                      <span>
                        {linkedTvDevice.platform === "android_adb"
                          ? "ADB device host[:port]"
                          : "TV IP / hostname"}
                      </span>
                      <input
                        value={linkedTvDevice.host}
                        onChange={(event) =>
                          updateLinkedDevice({ host: event.target.value })
                        }
                        placeholder={
                          linkedTvDevice.platform === "android_adb"
                            ? "192.168.1.50:5555"
                            : "192.168.1.42"
                        }
                        inputMode="url"
                        aria-label="TV IP address or hostname"
                      />
                    </label>
                  ) : null}
                  {tvCapability.requiresLocalHelper && (
                    <label className="field-label compact">
                      <span>Helper URL</span>
                      <input
                        value={linkedTvDevice.helperUrl}
                        onChange={(event) =>
                          updateLinkedDevice({ helperUrl: event.target.value })
                        }
                        placeholder="http://127.0.0.1:8790"
                        inputMode="url"
                        aria-label="TV remote helper URL"
                      />
                    </label>
                  )}
                  {linkedTvDevice.platform !== "roku" &&
                    linkedTvDevice.platform !== "home_assistant_webhook" &&
                    linkedTvDevice.platform !== "android_adb" &&
                    linkedTvDevice.platform !== "apple_tv_manual" && (
                      <label className="field-label compact">
                        <span>Protocol URL override</span>
                        <input
                          value={linkedTvDevice.url ?? ""}
                          onChange={(event) =>
                            updateLinkedDevice({ url: event.target.value })
                          }
                          placeholder="Optional: ws://tv:3000 or http://tv:1925"
                          inputMode="url"
                          aria-label="Protocol URL override"
                        />
                      </label>
                    )}
                  {platformNeedsPairing(linkedTvDevice.platform) && (
                    <label className="field-label compact">
                      <span>
                        {linkedTvDevice.platform === "lg_webos"
                          ? "LG client key"
                          : linkedTvDevice.platform === "samsung"
                            ? "Samsung token"
                            : "Vizio auth token"}
                      </span>
                      <input
                        value={
                          linkedTvDevice.platform === "lg_webos"
                            ? (linkedTvDevice.clientKey ?? "")
                            : linkedTvDevice.platform === "samsung"
                              ? (linkedTvDevice.token ?? "")
                              : (linkedTvDevice.authToken ?? "")
                        }
                        onChange={(event) =>
                          updateLinkedDevice(
                            linkedTvDevice.platform === "lg_webos"
                              ? { clientKey: event.target.value }
                              : linkedTvDevice.platform === "samsung"
                                ? { token: event.target.value }
                                : { authToken: event.target.value },
                          )
                        }
                        placeholder="Stored locally only"
                        type="password"
                        autoComplete="off"
                        aria-label="Local pairing token"
                      />
                    </label>
                  )}
                  {platformNeedsSonyIrcc(linkedTvDevice.platform) && (
                    <>
                      <label className="field-label compact">
                        <span>Sony PSK (if enabled)</span>
                        <input
                          value={linkedTvDevice.psk ?? ""}
                          onChange={(event) =>
                            updateLinkedDevice({ psk: event.target.value })
                          }
                          placeholder="Optional local PSK"
                          type="password"
                          autoComplete="off"
                          aria-label="Sony PSK"
                        />
                      </label>
                      <label className="field-label compact">
                        <span>Sony Play IRCC code</span>
                        <input
                          value={linkedTvDevice.irccCode ?? ""}
                          onChange={(event) =>
                            updateLinkedDevice({ irccCode: event.target.value })
                          }
                          placeholder="From remote-controller-info"
                          aria-label="Sony Play IRCC code"
                        />
                      </label>
                    </>
                  )}
                  {linkedTvDevice.platform === "philips_jointspace" && (
                    <label className="field-label compact">
                      <span>JointSpace API version</span>
                      <input
                        value={linkedTvDevice.apiVersion ?? 6}
                        onChange={(event) =>
                          updateLinkedDevice({
                            apiVersion: Number(event.target.value) || 6,
                          })
                        }
                        inputMode="numeric"
                        aria-label="Philips JointSpace API version"
                      />
                    </label>
                  )}
                  <div
                    className="wizard-action-row setup-next-line"
                    aria-label="Remote Start setup sequence"
                  >
                    <strong>Next:</strong>
                    <span>
                      {linkedTvMissingConfig
                        ? "Enter the device details above, then save setup."
                        : "Save setup, test Play, then enable GO Play only if the test works."}
                    </span>
                  </div>
                  <div className="remote-button-row triple primary-setup-actions">
                    <button
                      type="button"
                      onClick={() => saveLinkedDevice()}
                      disabled={!canSaveRemoteSetup}
                    >
                      {linkedTvMissingConfig
                        ? "Save setup after details"
                        : "Save setup"}
                    </button>
                    {isPublicRemoteStartLane ? (
                      <button
                        type="button"
                        onClick={testLinkedDevice}
                        disabled={!canRunConnectionCheck}
                      >
                        {linkedTvMissingConfig
                          ? "Test Play after details"
                          : remoteStartWizard.primaryAction}
                      </button>
                    ) : (
                      <button type="button" disabled>
                        Use manual countdown
                      </button>
                    )}
                  </div>
                  {pendingReadyDevice &&
                    !remoteStartRuntimeConfig.remoteStartKillSwitchEnabled && (
                      <div
                        className="wizard-action-row setup-next-line"
                        aria-label="Confirm Test Play result"
                      >
                        <strong>Did the video start?</strong>
                        <span>
                          Pause it again before marking Remote Start ready.
                        </span>
                        <button type="button" onClick={confirmTestPlayStarted}>
                          Yes — I paused it again
                        </button>
                        <button type="button" onClick={rejectTestPlayStarted}>
                          No — use manual countdown
                        </button>
                      </div>
                    )}
                  {isPublicRemoteStartLane &&
                    hasRecentHelperCheck &&
                    tvCapability.canSendPlay && (
                      <div
                        className="remote-button-row triple advanced-test-actions"
                        aria-label="Optional Remote Start test commands"
                      >
                        <button
                          type="button"
                          onClick={() => sendLinkedTvPlay("manual")}
                        >
                          Test Play now
                        </button>
                        {tvCapability.canSendPause && (
                          <button type="button" onClick={sendLinkedTvPause}>
                            Test Pause
                          </button>
                        )}
                      </div>
                    )}
                  <label className="field-label compact checkbox-row enable-go-row">
                    <input
                      type="checkbox"
                      checked={
                        linkedTvDevice.useRemoteStartAtGo &&
                        isPublicRemoteStartLane &&
                        hasRecentHelperCheck
                      }
                      disabled={
                        !isPublicRemoteStartLane ||
                        !hasRecentHelperCheck ||
                        !tvCapability.canAutoPlayAtGo ||
                        !tvCapability.safeGoCommand
                      }
                      onChange={(event) =>
                        updateLinkedDevice({
                          useRemoteStartAtGo: event.target.checked,
                        })
                      }
                      aria-label="Use Remote Start at GO"
                    />
                    <span>3 Enable Remote Start at GO</span>
                  </label>
                  <p className="mode-caveat">
                    Readiness: {remoteStartReadiness.label} —{" "}
                    {remoteStartReadiness.reason} GO opt-in status:{" "}
                    {remoteStartAtGoEnabled
                      ? "enabled — a single safe Play command can be sent at GO."
                      : hasRecentHelperCheck
                        ? "off or unavailable for unsupported/later/manual lanes — manual countdown remains active."
                        : "test the connection first, then enable GO Play if this lane supports it."}{" "}
                    Release lane: {tvCapability.publicClaimLevel}; real-device
                    evidence:{" "}
                    {tvCapability.hardwareValidated ? "yes" : "not yet"}.
                  </p>
                  <div className="extension-status">{tvRemoteStatus}</div>
                  {showRemoteSetupDetails && (
                    <div
                      className="compatibility-mini"
                      aria-label="TV Remote Mode compatibility"
                    >
                      {tvRemoteRoadmap.map((target) => (
                        <span key={target.label}>
                          <strong>
                            {target.label} — {target.status}:
                          </strong>{" "}
                          {target.note}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
              <p className="mode-caveat">
                Pairing tokens and Home Assistant webhook URLs stay in this
                browser/helper config, not the room backend. Watch Sync servers
                do not store HA credentials or entity IDs. Helper calls are
                limited to localhost/private LAN/.local helper URLs before local
                pairing details are sent. Manual countdown remains available as fallback. Hosted
                mobile Safari/Chrome may block local-LAN helper calls; reliable
                iPhone TV remote control needs a native app or local companion.
              </p>
            </div>
          )}
        </div>

        <div className="laptop-drawer">
          <button
            className={`drawer-toggle ${showLaptopDrawer ? "open" : ""}`}
            type="button"
            onClick={() => openLaptopAutoDrawer(!showLaptopDrawer)}
            aria-expanded={showLaptopDrawer}
          >
            <span>Laptop auto-sync</span>
            <small>Supported browser tabs only</small>
          </button>

          {showLaptopDrawer && (
            <div className="drawer-content">
              <p>
                Manual mode works with any TV. Auto-sync only works on supported
                browser tabs where the Chrome extension can access an HTML5
                video.
              </p>
              <dl className="pairing-info">
                <div className="pairing-row">
                  <dt>Room code</dt>
                  <dd>{room.roomId}</dd>
                </div>
                <div className="pairing-row">
                  <dt>Participant ID</dt>
                  <dd>{currentParticipantId || "Join/create first"}</dd>
                </div>
                <div className="pairing-row">
                  <dt>WebSocket URL</dt>
                  <dd>{realtimeUrl}</dd>
                </div>
              </dl>
              <button type="button" onClick={copyPairingDetails}>
                Copy pairing details
              </button>

              <div className="extension-status">
                {localPlayback
                  ? `Playback: ${localPlayback.paused ? "paused" : "playing"} at ${localPlayback.currentTime.toFixed(1)}s`
                  : pairedExtensions.length > 0
                    ? `Extension paired: ${pairedExtensions.map((ext) => ext.tabTitle || ext.extensionId).join(", ")}`
                    : "Extension status: not paired yet."}
              </div>
            </div>
          )}
        </div>
      </section>

      {copyStatus && (
        <p className="status-toast floating" role="status">
          {copyStatus}
        </p>
      )}
    </main>
  );
}

export default App;
