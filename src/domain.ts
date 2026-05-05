export type ActiveMode = 'tv_manual' | 'laptop_auto'
export type ParticipantRole = 'host' | 'guest'
export type ReadyStatus = 'idle' | 'ready'
export type CountdownPhase = 'idle' | 'counting' | 'play' | 'cancelled'
export type RemoteSignal = 'pause' | 'buffering' | 'resync' | 'next_episode' | 'play_now' | 'message' | 'recommendation'

export interface Participant {
  id: string
  displayName: string
  role: ParticipantRole
  joinedAt: string
  lastSeenAt: string
}

export interface WatchSetup {
  service: string
  title: string
  targetTimestamp: string
}

export interface CountdownState {
  phase: CountdownPhase
  startedAt?: string
  startsAtEpochMs?: number
  durationSeconds: number
}

export interface ExtensionCapabilities {
  html5Video: boolean
  play: boolean
  pause: boolean
  seek: boolean
}

export interface ExtensionPairing {
  extensionId: string
  participantId: string
  pairedAt: string
  lastSeenAt: string
  tabTitle?: string
  urlOrigin?: string
  capabilities: ExtensionCapabilities
}

export interface WatchRecommendation {
  source: 'mock' | 'tmdb' | 'omdb'
  sourceId: string
  mediaType: 'movie' | 'tv'
  title: string
  year?: string
  overview: string
  providers: string[]
  posterUrl?: string
  ratingLabel?: string
  ratingValue?: string
  externalUrl?: string
}

export type RecommendationVote = 'up' | 'down'

export interface RecommendationQueueItem {
  key: string
  item: WatchRecommendation
  firstRecommendedAt: string
  latestRecommendedAt: string
  firstRecommendedBy: string
  latestRecommendedBy: string
  recommendedBy: string[]
  recommendCount: number
  votesByParticipant: Record<string, RecommendationVote>
  upVotes: number
  downVotes: number
  score: number
  selected: boolean
  selectedAt?: string
  selectedBy?: string
}

export interface PlaybackStatus {
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

export interface RoomState {
  roomId: string
  hostId: string
  participants: Record<string, Participant>
  service: string
  title: string
  targetTimestamp: string
  readyState: Record<string, ReadyStatus>
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

export interface RoomSignal {
  type: RemoteSignal
  message: string
  actorId: string
  actorName: string
  createdAt: string
}

export type RoomEvent =
  | { type: 'participant_joined'; participant: Participant; at: string }
  | { type: 'participant_ready'; participantId: string; ready: boolean; at: string }
  | { type: 'setup_updated'; setup: WatchSetup; actorId: string; at: string }
  | { type: 'countdown_started'; actorId: string; startsAtEpochMs: number; durationSeconds: number; at: string }
  | { type: 'countdown_cancelled'; actorId: string; at: string }
  | { type: 'play_now'; actorId: string; at: string }
  | { type: 'pause_requested'; actorId: string; at: string }
  | { type: 'buffering_started'; actorId: string; at: string }
  | { type: 'buffering_resolved'; actorId: string; at: string }
  | { type: 'resync_requested'; actorId: string; timestamp: string; at: string }
  | { type: 'timestamp_submitted'; actorId: string; timestamp: string; at: string }
  | { type: 'chat_message'; actorId: string; message: string; at: string }
  | { type: 'recommendation_sent'; actorId: string; item: WatchRecommendation; note?: string; at: string }
  | { type: 'recommendation_voted'; actorId: string; sourceId: string; vote: 'up' | 'down'; at: string }
  | { type: 'recommendation_selected'; actorId: string; item: WatchRecommendation; at: string }
  | { type: 'next_episode_requested'; actorId: string; at: string }
  | { type: 'extension_paired'; extensionId: string; participantId: string; capabilities: ExtensionCapabilities; tabTitle?: string; urlOrigin?: string; at: string }
  | { type: 'playback_status'; actorId: string; extensionId: string; paused: boolean; currentTime: number; duration?: number; playbackRate?: number; readyState?: number; seeking?: boolean; ended?: boolean; tabTitle?: string; urlOrigin?: string; at: string }
  | { type: 'extension_error'; actorId: string; extensionId: string; message: string; at: string }
  | { type: 'extension_command'; extensionId: string; command: string; payload?: unknown; at: string }

export const DEFAULT_SETUP: WatchSetup = {
  service: '',
  title: '',
  targetTimestamp: '00:00',
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function recommendationQueueKey(item: WatchRecommendation): string {
  const sourceId = item.sourceId.trim().toLowerCase()
  const mediaType = item.mediaType
  if (item.source !== 'mock' && sourceId) {
    const idWithoutMediaPrefix = sourceId.replace(/^(movie|tv)[:_/-]/, '')
    return `${item.source}:${mediaType}:${idWithoutMediaPrefix}`
  }

  return `local:${mediaType}:${normalizeRecommendationTitle(item.title)}:${normalizeRecommendationYear(item.year)}:${normalizeRecommendationProviders(item.providers)}`
}

export function buildRecommendationQueue(events: RoomEvent[]): RecommendationQueueItem[] {
  const queueByKey = new Map<string, RecommendationQueueItem>()
  const keyBySourceId = new Map<string, string>()

  for (const event of events) {
    if (event.type !== 'recommendation_sent') continue
    const key = recommendationQueueKey(event.item)
    keyBySourceId.set(event.item.sourceId, key)
    const existing = queueByKey.get(key)
    if (!existing) {
      queueByKey.set(key, {
        key,
        item: event.item,
        firstRecommendedAt: event.at,
        latestRecommendedAt: event.at,
        firstRecommendedBy: event.actorId,
        latestRecommendedBy: event.actorId,
        recommendedBy: [event.actorId],
        recommendCount: 1,
        votesByParticipant: {},
        upVotes: 0,
        downVotes: 0,
        score: 0,
        selected: false,
      })
      continue
    }

    queueByKey.set(key, {
      ...existing,
      item: event.item,
      latestRecommendedAt: event.at,
      latestRecommendedBy: event.actorId,
      recommendedBy: existing.recommendedBy.includes(event.actorId) ? existing.recommendedBy : [...existing.recommendedBy, event.actorId],
      recommendCount: existing.recommendCount + 1,
    })
  }

  let selectedKey = ''
  let selectedAt = ''
  let selectedBy = ''
  for (const event of events) {
    if (event.type === 'recommendation_sent') {
      keyBySourceId.set(event.item.sourceId, recommendationQueueKey(event.item))
      continue
    }

    if (event.type === 'recommendation_voted') {
      const key = keyBySourceId.get(event.sourceId) ?? event.sourceId
      const existing = queueByKey.get(key)
      if (!existing) continue
      queueByKey.set(key, {
        ...existing,
        votesByParticipant: { ...existing.votesByParticipant, [event.actorId]: event.vote },
      })
      continue
    }

    if (event.type === 'recommendation_selected') {
      const key = recommendationQueueKey(event.item)
      keyBySourceId.set(event.item.sourceId, key)
      selectedKey = key
      selectedAt = event.at
      selectedBy = event.actorId
      if (!queueByKey.has(key)) {
        queueByKey.set(key, {
          key,
          item: event.item,
          firstRecommendedAt: event.at,
          latestRecommendedAt: event.at,
          firstRecommendedBy: event.actorId,
          latestRecommendedBy: event.actorId,
          recommendedBy: [event.actorId],
          recommendCount: 0,
          votesByParticipant: {},
          upVotes: 0,
          downVotes: 0,
          score: 0,
          selected: false,
        })
      }
    }
  }

  return Array.from(queueByKey.values())
    .map((entry) => {
      const votes = Object.values(entry.votesByParticipant)
      const upVotes = votes.filter((vote) => vote === 'up').length
      const downVotes = votes.filter((vote) => vote === 'down').length
      return {
        ...entry,
        upVotes,
        downVotes,
        score: upVotes - downVotes,
        selected: entry.key === selectedKey,
        selectedAt: entry.key === selectedKey ? selectedAt : undefined,
        selectedBy: entry.key === selectedKey ? selectedBy : undefined,
      }
    })
    .sort(compareRecommendationQueueItems)
}

export function makeId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)
  return `${prefix}_${random.replaceAll('-', '').slice(0, 10)}`
}

export function makeRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const values = new Uint8Array(6)
  globalThis.crypto?.getRandomValues?.(values)
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('')
}

export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
}

export function isRoomEvent(value: unknown): value is RoomEvent {
  if (!isRecord(value) || typeof value.type !== 'string' || typeof value.at !== 'string') return false

  switch (value.type) {
    case 'participant_joined':
      return isParticipant(value.participant)
    case 'participant_ready':
      return typeof value.participantId === 'string' && value.participantId.length > 0 && typeof value.ready === 'boolean'
    case 'setup_updated':
      return isWatchSetup(value.setup) && hasActor(value)
    case 'countdown_started':
      return hasActor(value) && typeof value.startsAtEpochMs === 'number' && typeof value.durationSeconds === 'number'
    case 'countdown_cancelled':
    case 'play_now':
    case 'pause_requested':
    case 'buffering_started':
    case 'buffering_resolved':
    case 'next_episode_requested':
      return hasActor(value)
    case 'resync_requested':
    case 'timestamp_submitted':
      return hasActor(value) && typeof value.timestamp === 'string'
    case 'chat_message':
      return hasActor(value) && typeof value.message === 'string' && value.message.trim().length > 0
    case 'recommendation_sent':
      return hasActor(value) && isWatchRecommendation(value.item) && optionalString(value.note)
    case 'recommendation_voted':
      return hasActor(value)
        && typeof value.sourceId === 'string'
        && value.sourceId.length > 0
        && (value.vote === 'up' || value.vote === 'down')
    case 'recommendation_selected':
      return hasActor(value) && isWatchRecommendation(value.item)
    case 'extension_paired':
      return typeof value.extensionId === 'string'
        && value.extensionId.length > 0
        && typeof value.participantId === 'string'
        && value.participantId.length > 0
        && isExtensionCapabilities(value.capabilities)
        && optionalString(value.tabTitle)
        && optionalString(value.urlOrigin)
    case 'playback_status':
      return hasActor(value)
        && typeof value.extensionId === 'string'
        && value.extensionId.length > 0
        && typeof value.paused === 'boolean'
        && typeof value.currentTime === 'number'
        && optionalNumber(value.duration)
        && optionalNumber(value.playbackRate)
        && optionalNumber(value.readyState)
        && optionalBoolean(value.seeking)
        && optionalBoolean(value.ended)
        && optionalString(value.tabTitle)
        && optionalString(value.urlOrigin)
    case 'extension_error':
      return hasActor(value)
        && typeof value.extensionId === 'string'
        && value.extensionId.length > 0
        && typeof value.message === 'string'
        && value.message.trim().length > 0
    case 'extension_command':
      return typeof value.extensionId === 'string' && value.extensionId.length > 0 && typeof value.command === 'string' && value.command.length > 0
    default:
      return false
  }
}

export function isParticipant(value: unknown): value is Participant {
  return isRecord(value)
    && typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.displayName === 'string'
    && (value.role === 'host' || value.role === 'guest')
    && typeof value.joinedAt === 'string'
    && typeof value.lastSeenAt === 'string'
}

export function isExtensionCapabilities(value: unknown): value is ExtensionCapabilities {
  return isRecord(value)
    && typeof value.html5Video === 'boolean'
    && typeof value.play === 'boolean'
    && typeof value.pause === 'boolean'
    && typeof value.seek === 'boolean'
}

function isWatchRecommendation(value: unknown): value is WatchRecommendation {
  return isRecord(value)
    && (value.source === 'mock' || value.source === 'tmdb' || value.source === 'omdb')
    && typeof value.sourceId === 'string'
    && value.sourceId.length > 0
    && (value.mediaType === 'movie' || value.mediaType === 'tv')
    && typeof value.title === 'string'
    && value.title.trim().length > 0
    && optionalString(value.year)
    && typeof value.overview === 'string'
    && value.overview.trim().length > 0
    && Array.isArray(value.providers)
    && value.providers.every((provider) => typeof provider === 'string' && provider.trim().length > 0)
    && optionalString(value.posterUrl)
    && optionalString(value.ratingLabel)
    && optionalString(value.ratingValue)
    && optionalString(value.externalUrl)
}

function isWatchSetup(value: unknown): value is WatchSetup {
  return isRecord(value)
    && typeof value.service === 'string'
    && typeof value.title === 'string'
    && typeof value.targetTimestamp === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function compareRecommendationQueueItems(a: RecommendationQueueItem, b: RecommendationQueueItem): number {
  return (b.score - a.score)
    || (b.upVotes - a.upVotes)
    || (a.downVotes - b.downVotes)
    || (b.recommendCount - a.recommendCount)
    || a.firstRecommendedAt.localeCompare(b.firstRecommendedAt)
    || a.item.title.localeCompare(b.item.title)
}

function normalizeRecommendationTitle(title: string): string {
  return title.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function normalizeRecommendationYear(year: string | undefined): string {
  const match = year?.match(/\d{4}/)
  return match?.[0] ?? ''
}

function normalizeRecommendationProviders(providers: string[]): string {
  return providers.map((provider) => provider.trim().toLowerCase()).filter(Boolean).sort().join(',')
}

function hasActor(value: Record<string, unknown>): value is Record<string, unknown> & { actorId: string } {
  return typeof value.actorId === 'string' && value.actorId.length > 0
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string'
}

function optionalNumber(value: unknown): boolean {
  return value === undefined || typeof value === 'number'
}

function optionalBoolean(value: unknown): boolean {
  return value === undefined || typeof value === 'boolean'
}

export function createParticipant(displayName: string, role: ParticipantRole): Participant {
  const at = nowIso()
  return {
    id: makeId('person'),
    displayName: displayName.trim() || (role === 'host' ? 'Host' : 'Partner'),
    role,
    joinedAt: at,
    lastSeenAt: at,
  }
}

export function createRoom(host: Participant): RoomState {
  const at = nowIso()
  const roomId = makeRoomCode()
  return {
    roomId,
    hostId: host.id,
    participants: { [host.id]: host },
    service: DEFAULT_SETUP.service,
    title: DEFAULT_SETUP.title,
    targetTimestamp: DEFAULT_SETUP.targetTimestamp,
    readyState: { [host.id]: 'idle' },
    countdownState: { phase: 'idle', durationSeconds: 3 },
    activeMode: 'tv_manual',
    extensions: {},
    playbackByParticipant: {},
    eventLog: [{ type: 'participant_joined', participant: host, at }],
    createdAt: at,
    updatedAt: at,
  }
}

export function participantList(room: RoomState): Participant[] {
  return Object.values(room.participants).sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))
}

export function bothReady(room: RoomState): boolean {
  const people = participantList(room)
  return people.length >= 2 && people.every((person) => room.readyState[person.id] === 'ready')
}

export function applyRoomEvent(room: RoomState, event: RoomEvent): RoomState {
  const normalizedRoom = ensureExtensionContainers(room)
  const eventLog = [...normalizedRoom.eventLog.slice(-49), event]
  const updatedAt = event.at
  const next: RoomState = { ...normalizedRoom, eventLog, updatedAt }

  switch (event.type) {
    case 'participant_joined':
      return {
        ...next,
        participants: { ...normalizedRoom.participants, [event.participant.id]: event.participant },
        readyState: { ...normalizedRoom.readyState, [event.participant.id]: 'idle' },
      }
    case 'participant_ready':
      return {
        ...next,
        readyState: { ...normalizedRoom.readyState, [event.participantId]: event.ready ? 'ready' : 'idle' },
      }
    case 'setup_updated':
      return {
        ...next,
        service: event.setup.service,
        title: event.setup.title,
        targetTimestamp: event.setup.targetTimestamp || '00:00',
        readyState: resetReady(normalizedRoom),
        countdownState: { phase: 'idle', durationSeconds: 3 },
      }
    case 'countdown_started':
      return {
        ...next,
        countdownState: {
          phase: 'counting',
          startedAt: event.at,
          startsAtEpochMs: event.startsAtEpochMs,
          durationSeconds: event.durationSeconds,
        },
      }
    case 'countdown_cancelled':
      return { ...next, countdownState: { phase: 'idle', durationSeconds: 3 }, readyState: resetReady(normalizedRoom) }
    case 'play_now':
      return {
        ...next,
        countdownState: { ...normalizedRoom.countdownState, phase: 'play' },
        lastSyncAt: event.at,
        lastSignal: makeSignal(normalizedRoom, event.actorId, 'play_now', 'GO — press play now.', event.at),
      }
    case 'pause_requested':
      return { ...next, lastSignal: makeSignal(normalizedRoom, event.actorId, 'pause', 'Partner needs a pause — pause your TV now.', event.at) }
    case 'buffering_started':
      return {
        ...next,
        lastSignal: makeSignal(normalizedRoom, event.actorId, 'buffering', 'Partner is buffering — pause now.', event.at),
        readyState: resetReady(normalizedRoom),
        countdownState: { phase: 'idle', durationSeconds: 3 },
      }
    case 'buffering_resolved':
      return { ...next, lastSignal: makeSignal(normalizedRoom, event.actorId, 'buffering', 'Buffering fixed — both tap ready again.', event.at) }
    case 'resync_requested':
      return {
        ...next,
        targetTimestamp: event.timestamp || normalizedRoom.targetTimestamp,
        resyncTimestamp: event.timestamp,
        lastSignal: makeSignal(normalizedRoom, event.actorId, 'resync', `RESYNC — seek manually to ${event.timestamp || normalizedRoom.targetTimestamp}.`, event.at),
        readyState: resetReady(normalizedRoom),
        countdownState: { phase: 'idle', durationSeconds: 3 },
      }
    case 'timestamp_submitted':
      return { ...next, targetTimestamp: event.timestamp || normalizedRoom.targetTimestamp, resyncTimestamp: event.timestamp }
    case 'chat_message':
      return { ...next, lastSignal: makeSignal(normalizedRoom, event.actorId, 'message', event.message.trim(), event.at) }
    case 'recommendation_sent':
      return { ...next, lastSignal: makeSignal(normalizedRoom, event.actorId, 'recommendation', `Recommended: ${event.item.title}`, event.at) }
    case 'recommendation_voted':
      return { ...next, lastSignal: makeSignal(normalizedRoom, event.actorId, 'recommendation', `${event.vote === 'up' ? 'voted yes' : 'voted no'} on a recommendation.`, event.at) }
    case 'recommendation_selected':
      return {
        ...next,
        service: event.item.providers[0] ?? '',
        title: event.item.title,
        targetTimestamp: '00:00',
        readyState: resetReady(normalizedRoom),
        countdownState: { phase: 'idle', durationSeconds: 3 },
        lastSignal: makeSignal(normalizedRoom, event.actorId, 'recommendation', `Tonight's watch: ${event.item.title} — pause at 00:00, then ready up.`, event.at),
      }
    case 'next_episode_requested':
      return {
        ...next,
        targetTimestamp: '00:00',
        lastSignal: makeSignal(normalizedRoom, event.actorId, 'next_episode', 'Next episode — pause at 00:00, then both tap ready.', event.at),
        readyState: resetReady(normalizedRoom),
        countdownState: { phase: 'idle', durationSeconds: 3 },
      }
    case 'extension_paired':
      return {
        ...next,
        activeMode: 'laptop_auto',
        extensions: {
          ...normalizedRoom.extensions,
          [event.extensionId]: {
            extensionId: event.extensionId,
            participantId: event.participantId,
            pairedAt: normalizedRoom.extensions[event.extensionId]?.pairedAt ?? event.at,
            lastSeenAt: event.at,
            tabTitle: event.tabTitle,
            urlOrigin: event.urlOrigin,
            capabilities: event.capabilities,
          },
        },
        lastSignal: makeSignal(normalizedRoom, event.participantId, 'message', 'Chrome extension paired.', event.at),
      }
    case 'playback_status':
      return {
        ...next,
        playbackByParticipant: {
          ...normalizedRoom.playbackByParticipant,
          [event.actorId]: {
            extensionId: event.extensionId,
            participantId: event.actorId,
            paused: event.paused,
            currentTime: event.currentTime,
            duration: event.duration,
            playbackRate: event.playbackRate,
            readyState: event.readyState,
            seeking: event.seeking,
            ended: event.ended,
            tabTitle: event.tabTitle,
            urlOrigin: event.urlOrigin,
            updatedAt: event.at,
          },
        },
        extensions: normalizedRoom.extensions[event.extensionId]
          ? {
              ...normalizedRoom.extensions,
              [event.extensionId]: {
                ...normalizedRoom.extensions[event.extensionId],
                lastSeenAt: event.at,
                tabTitle: event.tabTitle ?? normalizedRoom.extensions[event.extensionId].tabTitle,
                urlOrigin: event.urlOrigin ?? normalizedRoom.extensions[event.extensionId].urlOrigin,
              },
            }
          : normalizedRoom.extensions,
      }
    case 'extension_error':
      return { ...next, lastSignal: makeSignal(normalizedRoom, event.actorId, 'message', `Extension error: ${event.message.trim()}`, event.at) }
    case 'extension_command':
      return next
    default:
      return next
  }
}

function ensureExtensionContainers(room: RoomState): RoomState {
  return {
    ...room,
    extensions: room.extensions ?? {},
    playbackByParticipant: room.playbackByParticipant ?? {},
  }
}

function resetReady(room: RoomState): Record<string, ReadyStatus> {
  return Object.fromEntries(Object.keys(room.participants).map((id) => [id, 'idle']))
}

function makeSignal(room: RoomState, actorId: string, type: RemoteSignal, message: string, at: string): RoomSignal {
  const actorName = room.participants[actorId]?.displayName ?? 'Partner'
  return { type, message, actorId, actorName, createdAt: at }
}
