# Room protocol

The MVP uses a typed event model in `src/domain.ts`. The reducer remains the source of truth for room state transitions in browser fallback mode, the local WebSocket server, and extension-originated playback facts.

## Room state

```ts
type ActiveMode = 'tv_manual' | 'laptop_auto'

type RoomState = {
  roomId: string
  hostId: string
  participants: Record<string, Participant>
  service: string
  title: string
  targetTimestamp: string
  readyState: Record<string, 'idle' | 'ready'>
  countdownState: CountdownState
  lastSyncAt?: string
  activeMode: ActiveMode
  lastSignal?: RoomSignal
  resyncTimestamp?: string
  extensions: Record<string, ExtensionPairing>
  playbackByParticipant: Record<string, PlaybackStatus>
  eventLog: RoomEvent[]
  createdAt: string
  updatedAt: string
}
```

Extension state:

```ts
type ExtensionPairing = {
  extensionId: string
  participantId: string
  pairedAt: string
  lastSeenAt: string
  tabTitle?: string
  urlOrigin?: string
  capabilities: { html5Video: boolean; play: boolean; pause: boolean; seek: boolean }
}

type PlaybackStatus = {
  extensionId: string
  participantId: string
  paused: boolean
  currentTime: number
  duration?: number
  playbackRate?: number
  readyState?: number
  seeking?: boolean
  ended?: boolean
  tabTitle?: string
  urlOrigin?: string
  updatedAt: string
}
```

Important fields:

- `activeMode`: `tv_manual` by default; set to `laptop_auto` when an extension pairs.
- `extensions`: currently paired local Chrome extension sessions by extension id.
- `playbackByParticipant`: latest reported playback status by paired participant id.
- `eventLog`: recent audit/debug event trail, capped by the reducer.

## Events

Implemented/defined event union:

- `participant_joined`
- `participant_ready`
- `setup_updated`
- `countdown_started`
- `countdown_cancelled`
- `play_now`
- `pause_requested`
- `buffering_started`
- `buffering_resolved`
- `resync_requested`
- `timestamp_submitted`
- `chat_message`
- `next_episode_requested`
- `extension_paired`
- `playback_status`
- `extension_error`
- `extension_command`

Each event includes an `at` ISO timestamp. Events that represent participant action include `actorId`. `src/domain.ts` exports `isRoomEvent`, `isParticipant`, and `isExtensionCapabilities` guards so browser and server transports reject malformed messages before applying them.

Extension event semantics:

- `extension_paired`: stores pairing metadata/capabilities, sets `activeMode: 'laptop_auto'`, and updates `lastSignal` with an honest paired message.
- `playback_status`: updates `playbackByParticipant[actorId]` and the extension `lastSeenAt`; it does not intentionally spam `lastSignal`.
- `extension_error`: records an extension-originated error in `lastSignal` so the room can surface failures.

## Local WebSocket transport

`server/realtime.ts` runs a local Node WebSocket server with ephemeral in-memory rooms.

Client-to-server messages:

```ts
type ClientToServerMessage =
  | { type: 'create_room'; participant: Participant }
  | { type: 'join_room'; roomId: string; participant: Participant }
  | { type: 'pair_extension'; roomId: string; participantId: string; extensionId: string; capabilities: ExtensionCapabilities; tabTitle?: string; urlOrigin?: string }
  | { type: 'room_event'; roomId: string; event: RoomEvent }
  | { type: 'ping' }
```

Server-to-client messages:

```ts
type ServerToClientMessage =
  | { type: 'status'; status: 'connected'; serverTime: string }
  | { type: 'room_snapshot'; room: RoomState }
  | { type: 'pong'; serverTime: string }
  | { type: 'error'; message: string }
```

Server behavior:

- `create_room` validates the participant payload, forces the socket participant to host, creates a new room through `createRoom(host)`, and records a PWA socket session for that room.
- `join_room` normalizes the room id, validates the participant payload, forces the joined participant to guest, applies `participant_joined`, and records a PWA socket session.
- `pair_extension` normalizes the room id, requires an existing room and participant, validates extension capabilities, records an extension socket session, applies `extension_paired`, and broadcasts a full snapshot.
- `room_event` validates the event with `isRoomEvent`, rejects sockets that are not joined/paired to the target room, rejects mismatched `actorId`, applies the event through `applyRoomEvent`, then broadcasts the resulting `room_snapshot` to all sockets in the room.
- Extension sockets may only send `playback_status`, `extension_error`, or `extension_command`; they cannot spoof `participant_ready`, `resync_requested`, `play_now`, or other PWA/user events.
- Extension sockets must use the same `actorId` and `extensionId` as their pairing session.
- Sockets receive full snapshots instead of patches to keep client logic small and auditable.
- Rooms are in memory only and are removed after inactivity/empty-room cleanup.
- No auth, accounts, persistence, secrets, or public deployment are included.

## Browser transport abstraction

`src/transport.ts` defines a small room transport interface used by `src/App.tsx`:

```ts
interface RoomTransport {
  mode: 'realtime' | 'local_fallback'
  createRoom(participant: Participant): void
  joinRoom(roomId: string, participant: Participant): void
  sendEvent(roomId: string, event: RoomEvent): void
  close(): void
}
```

When the WebSocket is connected, create/join/event actions go through the realtime server. If it is not connected, the UI clearly labels local fallback and keeps the prior localStorage cross-tab behavior.

## Extension command behavior

The unpacked Chrome extension watches snapshots and acts on new room events where browser policy allows:

- `countdown_started`: schedule `video.play()` for `startsAtEpochMs + durationSeconds * 1000`.
- `play_now`: call `video.play()`.
- `pause_requested` or `buffering_started`: call `video.pause()`.
- `setup_updated` or `timestamp_submitted`: parse `SS`, `MM:SS`, or `HH:MM:SS` and seek.
- `resync_requested`: pause and seek if a timestamp is parseable.

All play/seek/detect failures are caught and sent back as extension status/errors; browser autoplay, DRM, cross-origin frames, or site controls may still prevent control.

## Persistence in MVP

Local fallback storage keys:

- `watch-sync.currentRoom`: last opened room code.
- `watch-sync.localParticipant`: sessionStorage participant identity for this tab.
- `watch-sync.room.<ROOM_ID>`: serialized `RoomState`.

Chrome extension storage keys include the local pairing inputs/status (`wsUrl`, `roomCode`, `participantId`, `extensionId`, `status`). WebSocket server state is intentionally memory-only and disappears when the local server exits.
