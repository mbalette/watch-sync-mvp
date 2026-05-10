import { describe, expect, it } from 'vitest'
import {
  applyRoomEvent,
  bothReady,
  createParticipant,
  createRoom,
  isRoomEvent,
  nowIso,
  buildRecommendationQueue,
  recommendationQueueKey,
  type RoomEvent,
  type WatchRecommendation,
} from './domain'

describe('room reducer/event model', () => {
  it('syncs a participant join and ready state through events', () => {
    const host = createParticipant('Host', 'host')
    const guest = createParticipant('Guest', 'guest')
    const room = createRoom(host)

    const joined = applyRoomEvent(room, { type: 'participant_joined', participant: guest, at: nowIso() })
    const readyHost = applyRoomEvent(joined, { type: 'participant_ready', participantId: host.id, ready: true, at: nowIso() })
    const readyBoth = applyRoomEvent(readyHost, { type: 'participant_ready', participantId: guest.id, ready: true, at: nowIso() })

    expect(Object.keys(readyBoth.participants)).toEqual([host.id, guest.id])
    expect(readyBoth.readyState[host.id]).toBe('ready')
    expect(readyBoth.readyState[guest.id]).toBe('ready')
    expect(bothReady(readyBoth)).toBe(true)
  })

  it('resync, countdown cancel, and next-episode events reset ready state for manual TV sync', () => {
    const host = createParticipant('Host', 'host')
    const guest = createParticipant('Guest', 'guest')
    const room = applyRoomEvent(createRoom(host), { type: 'participant_joined', participant: guest, at: nowIso() })
    const ready = applyRoomEvent(
      applyRoomEvent(room, { type: 'participant_ready', participantId: host.id, ready: true, at: nowIso() }),
      { type: 'participant_ready', participantId: guest.id, ready: true, at: nowIso() },
    )

    const resynced = applyRoomEvent(ready, { type: 'resync_requested', actorId: host.id, timestamp: '12:34', at: nowIso() })
    const counting = applyRoomEvent(ready, { type: 'countdown_started', actorId: host.id, startsAtEpochMs: Date.now(), durationSeconds: 3, at: nowIso() })
    const cancelled = applyRoomEvent(counting, { type: 'countdown_cancelled', actorId: host.id, at: nowIso() })
    const nextEpisode = applyRoomEvent(resynced, { type: 'next_episode_requested', actorId: guest.id, at: nowIso() })

    expect(resynced.targetTimestamp).toBe('12:34')
    expect(resynced.readyState[host.id]).toBe('idle')
    expect(resynced.readyState[guest.id]).toBe('idle')
    expect(resynced.lastSignal?.message).toContain('seek manually')
    expect(cancelled.countdownState.phase).toBe('idle')
    expect(cancelled.readyState[host.id]).toBe('idle')
    expect(cancelled.readyState[guest.id]).toBe('idle')
    expect(nextEpisode.targetTimestamp).toBe('00:00')
    expect(nextEpisode.lastSignal?.type).toBe('next_episode')
  })

  it('validates room events before they are accepted by transports', () => {
    const goodEvent: RoomEvent = { type: 'pause_requested', actorId: 'person_1', at: nowIso() }
    expect(isRoomEvent(goodEvent)).toBe(true)
    expect(isRoomEvent({ type: 'pause_requested', actorId: 'person_1' })).toBe(false)
    expect(isRoomEvent({ type: 'participant_ready', participantId: '', ready: 'yes', at: nowIso() })).toBe(false)
    expect(isRoomEvent({ type: 'smart_tv_auto_pause', actorId: 'person_1', at: nowIso() })).toBe(false)
  })

  it('accepts countdown_go timing-only events and rejects TV credential fields', () => {
    const host = createParticipant('Host', 'host')
    const room = createRoom(host)
    const event: RoomEvent = { type: 'countdown_go', countdownId: 'c_123', playAtServerMs: Date.now() + 3000, at: nowIso() }

    expect(isRoomEvent(event)).toBe(true)
    expect(isRoomEvent({ ...event, host: '192.168.1.23' })).toBe(false)
    expect(isRoomEvent({ ...event, token: 'secret-token' })).toBe(false)
    expect(isRoomEvent({ ...event, webhookUrl: 'http://homeassistant.local/api/webhook/secret' })).toBe(false)

    const updated = applyRoomEvent(room, event)
    expect(updated.countdownState.phase).toBe('play')
    expect(updated.lastSignal?.message).toContain('no TV secrets')
  })

  it('accepts chat messages as actor-owned manual coordination events', () => {
    const host = createParticipant('Host', 'host')
    const room = createRoom(host)
    const at = nowIso()
    const chatEvent: RoomEvent = { type: 'chat_message', actorId: host.id, message: 'Ready when you are', at }

    expect(isRoomEvent(chatEvent)).toBe(true)
    expect(isRoomEvent({ type: 'chat_message', actorId: host.id, message: '', at })).toBe(false)
    expect(isRoomEvent({ type: 'chat_message', actorId: '', message: 'Hi', at })).toBe(false)

    const updated = applyRoomEvent(room, chatEvent)
    expect(updated.eventLog.at(-1)).toEqual(chatEvent)
    expect(updated.lastSignal?.type).toBe('message')
    expect(updated.lastSignal?.message).toBe('Ready when you are')
    expect(updated.lastSignal?.actorName).toBe('Host')
  })

  it('accepts watch recommendation cards as room-visible events', () => {
    const host = createParticipant('Host', 'host')
    const room = createRoom(host)
    const event: RoomEvent = {
      type: 'recommendation_sent',
      actorId: host.id,
      item: {
        source: 'mock',
        sourceId: 'mock_1',
        mediaType: 'movie',
        title: 'Arrival',
        year: '2016',
        overview: 'A thoughtful sci-fi drama for a synchronized movie night.',
        providers: ['Netflix', 'Prime Video'],
        ratingLabel: 'TMDB',
        ratingValue: '7.6',
      },
      note: 'Good date-night pick',
      at: nowIso(),
    }

    expect(isRoomEvent(event)).toBe(true)
    expect(isRoomEvent({ ...event, item: { ...event.item, providers: [] } })).toBe(true)
    expect(isRoomEvent({ ...event, item: { ...event.item, title: '' } })).toBe(false)

    const updated = applyRoomEvent(room, event)
    expect(updated.eventLog.at(-1)).toEqual(event)
    expect(updated.lastSignal?.type).toBe('recommendation')
    expect(updated.lastSignal?.message).toBe('Recommended: Arrival')
  })


  it('accepts recommendation votes as room-visible events without changing setup', () => {
    const host = createParticipant('Host', 'host')
    const room = createRoom(host)
    const event: RoomEvent = { type: 'recommendation_voted', actorId: host.id, sourceId: 'mock_1', vote: 'up', at: nowIso() }

    expect(isRoomEvent(event)).toBe(true)
    expect(isRoomEvent({ ...event, sourceId: '' })).toBe(false)
    expect(isRoomEvent({ ...event, vote: 'maybe' })).toBe(false)

    const updated = applyRoomEvent(room, event)
    expect(updated.eventLog.at(-1)).toEqual(event)
    expect(updated.title).toBe('')
    expect(updated.targetTimestamp).toBe('00:00')
    expect(updated.lastSignal?.type).toBe('recommendation')
    expect(updated.lastSignal?.message).toContain('voted yes')
  })

  it('selects a recommendation as tonight\'s watch and resets ready/countdown state', () => {
    const host = createParticipant('Host', 'host')
    const guest = createParticipant('Guest', 'guest')
    const joined = applyRoomEvent(createRoom(host), { type: 'participant_joined', participant: guest, at: nowIso() })
    const ready = applyRoomEvent(
      applyRoomEvent(joined, { type: 'participant_ready', participantId: host.id, ready: true, at: nowIso() }),
      { type: 'participant_ready', participantId: guest.id, ready: true, at: nowIso() },
    )
    const counting = applyRoomEvent(ready, { type: 'countdown_started', actorId: host.id, startsAtEpochMs: Date.now(), durationSeconds: 3, at: nowIso() })
    const event: RoomEvent = {
      type: 'recommendation_selected',
      actorId: host.id,
      item: {
        source: 'mock',
        sourceId: 'mock_2',
        mediaType: 'tv',
        title: 'Slow Horses',
        year: '2022',
        overview: 'Spy series pick for tonight.',
        providers: ['Apple TV+'],
        ratingLabel: 'TMDB',
        ratingValue: '8.1',
      },
      at: nowIso(),
    }

    expect(isRoomEvent(event)).toBe(true)
    expect(isRoomEvent({ ...event, item: { ...event.item, title: '' } })).toBe(false)

    const selected = applyRoomEvent(counting, event)
    expect(selected.title).toBe('Slow Horses')
    expect(selected.service).toBe('Apple TV+')
    expect(selected.targetTimestamp).toBe('00:00')
    expect(selected.readyState[host.id]).toBe('idle')
    expect(selected.readyState[guest.id]).toBe('idle')
    expect(selected.countdownState.phase).toBe('idle')
    expect(selected.lastSignal?.message).toContain("Tonight's watch: Slow Horses")
  })

  it('builds a deduped recommendation queue with recommender metadata and stable ranking', () => {
    const arrivalTmdb: WatchRecommendation = {
      source: 'tmdb',
      sourceId: 'movie:329865',
      mediaType: 'movie',
      title: 'Arrival',
      year: '2016',
      overview: 'A thoughtful sci-fi drama for a synchronized movie night.',
      providers: ['Netflix'],
      ratingLabel: 'TMDB',
      ratingValue: '7.6',
    }
    const arrivalDuplicate: WatchRecommendation = { ...arrivalTmdb, providers: ['Prime Video'] }
    const mockArrival: WatchRecommendation = { ...arrivalTmdb, source: 'mock', sourceId: 'mock_arrival', providers: ['Hulu'] }
    const mockArrivalDuplicate: WatchRecommendation = { ...mockArrival, sourceId: 'local_arrival' }
    const bear: WatchRecommendation = {
      source: 'mock',
      sourceId: 'mock_bear',
      mediaType: 'tv',
      title: 'The Bear',
      year: '2022',
      overview: 'Kitchen intensity for the room.',
      providers: ['Hulu'],
      ratingLabel: 'TMDB',
      ratingValue: '8.2',
    }

    const queue = buildRecommendationQueue([
      { type: 'recommendation_sent', actorId: 'person_host', item: arrivalTmdb, at: '2026-01-01T00:00:00.000Z' },
      { type: 'recommendation_sent', actorId: 'person_guest', item: bear, at: '2026-01-01T00:01:00.000Z' },
      { type: 'recommendation_sent', actorId: 'person_guest', item: arrivalDuplicate, at: '2026-01-01T00:02:00.000Z' },
      { type: 'recommendation_sent', actorId: 'person_other', item: mockArrival, at: '2026-01-01T00:03:00.000Z' },
      { type: 'recommendation_sent', actorId: 'person_guest', item: mockArrivalDuplicate, at: '2026-01-01T00:04:00.000Z' },
    ])

    expect(queue).toHaveLength(3)
    expect(queue[0].item.title).toBe('Arrival')
    expect(queue[0].recommendCount).toBe(2)
    expect(queue[0].firstRecommendedBy).toBe('person_host')
    expect(queue[0].latestRecommendedBy).toBe('person_guest')
    expect(queue[0].recommendedBy).toEqual(['person_host', 'person_guest'])
    expect(queue[0].item.providers).toEqual(['Prime Video'])
    expect(queue[1].recommendCount).toBe(2)
    expect(recommendationQueueKey(mockArrivalDuplicate)).toBe(recommendationQueueKey(mockArrival))
  })

  it('tracks latest participant votes and ranks by score/up/down/recommend count/time/title', () => {
    const arrival: WatchRecommendation = {
      source: 'tmdb',
      sourceId: 'movie:329865',
      mediaType: 'movie',
      title: 'Arrival',
      year: '2016',
      overview: 'A thoughtful sci-fi drama for a synchronized movie night.',
      providers: ['Netflix'],
    }
    const bear: WatchRecommendation = {
      source: 'mock',
      sourceId: 'mock_bear',
      mediaType: 'tv',
      title: 'The Bear',
      year: '2022',
      overview: 'Kitchen intensity for the room.',
      providers: ['Hulu'],
    }

    const queue = buildRecommendationQueue([
      { type: 'recommendation_sent', actorId: 'host', item: arrival, at: '2026-01-01T00:00:00.000Z' },
      { type: 'recommendation_sent', actorId: 'guest', item: bear, at: '2026-01-01T00:01:00.000Z' },
      { type: 'recommendation_voted', actorId: 'host', sourceId: 'movie:329865', vote: 'down', at: '2026-01-01T00:02:00.000Z' },
      { type: 'recommendation_voted', actorId: 'host', sourceId: 'movie:329865', vote: 'up', at: '2026-01-01T00:03:00.000Z' },
      { type: 'recommendation_voted', actorId: 'guest', sourceId: 'movie:329865', vote: 'up', at: '2026-01-01T00:04:00.000Z' },
      { type: 'recommendation_voted', actorId: 'host', sourceId: 'mock_bear', vote: 'up', at: '2026-01-01T00:05:00.000Z' },
      { type: 'recommendation_voted', actorId: 'guest', sourceId: 'mock_bear', vote: 'down', at: '2026-01-01T00:06:00.000Z' },
    ])

    expect(queue.map((item) => item.item.title)).toEqual(['Arrival', 'The Bear'])
    expect(queue[0]).toMatchObject({ upVotes: 2, downVotes: 0, score: 2 })
    expect(queue[0].votesByParticipant).toEqual({ host: 'up', guest: 'up' })
    expect(queue[1]).toMatchObject({ upVotes: 1, downVotes: 1, score: 0 })
    expect(queue[1].votesByParticipant).toEqual({ host: 'up', guest: 'down' })
  })

  it('marks the latest selected queue title and selected recommendation resets setup state', () => {
    const host = createParticipant('Host', 'host')
    const guest = createParticipant('Guest', 'guest')
    const joined = applyRoomEvent(createRoom(host), { type: 'participant_joined', participant: guest, at: nowIso() })
    const ready = applyRoomEvent(
      applyRoomEvent(joined, { type: 'participant_ready', participantId: host.id, ready: true, at: nowIso() }),
      { type: 'participant_ready', participantId: guest.id, ready: true, at: nowIso() },
    )
    const counting = applyRoomEvent(ready, { type: 'countdown_started', actorId: host.id, startsAtEpochMs: Date.now(), durationSeconds: 3, at: nowIso() })
    const item: WatchRecommendation = {
      source: 'mock',
      sourceId: 'mock_slow_horses',
      mediaType: 'tv',
      title: 'Slow Horses',
      year: '2022',
      overview: 'Spy series pick for tonight.',
      providers: ['Apple TV+'],
    }
    const selected = applyRoomEvent(counting, { type: 'recommendation_selected', actorId: host.id, item, at: '2026-01-01T00:02:00.000Z' })
    const queue = buildRecommendationQueue([
      { type: 'recommendation_sent', actorId: guest.id, item, at: '2026-01-01T00:01:00.000Z' },
      { type: 'recommendation_selected', actorId: host.id, item, at: '2026-01-01T00:02:00.000Z' },
    ])

    expect(queue[0].selected).toBe(true)
    expect(queue[0].selectedAt).toBe('2026-01-01T00:02:00.000Z')
    expect(selected.title).toBe('Slow Horses')
    expect(selected.service).toBe('Apple TV+')
    expect(selected.targetTimestamp).toBe('00:00')
    expect(selected.readyState[host.id]).toBe('idle')
    expect(selected.readyState[guest.id]).toBe('idle')
    expect(selected.countdownState.phase).toBe('idle')
  })

  it('stores extension pairing, playback status, and errors without accepting malformed extension events', () => {
    const host = createParticipant('Host', 'host')
    const room = createRoom(host)
    const at = nowIso()
    const paired: RoomEvent = {
      type: 'extension_paired',
      extensionId: 'ext_123',
      participantId: host.id,
      capabilities: { html5Video: true, play: true, pause: true, seek: true },
      tabTitle: 'Example Video',
      urlOrigin: 'https://example.test',
      at,
    }
    const status: RoomEvent = {
      type: 'playback_status',
      actorId: host.id,
      extensionId: 'ext_123',
      paused: false,
      currentTime: 42,
      duration: 120,
      playbackRate: 1,
      readyState: 4,
      seeking: false,
      ended: false,
      tabTitle: 'Example Video',
      urlOrigin: 'https://example.test',
      at: nowIso(),
    }
    const error: RoomEvent = { type: 'extension_error', actorId: host.id, extensionId: 'ext_123', message: 'play() blocked', at: nowIso() }

    expect(isRoomEvent(paired)).toBe(true)
    expect(isRoomEvent(status)).toBe(true)
    expect(isRoomEvent(error)).toBe(true)
    expect(isRoomEvent({ type: 'extension_paired', extensionId: 'ext_123', participantId: host.id, capabilities: { html5Video: 'yes' }, at })).toBe(false)
    expect(isRoomEvent({ type: 'playback_status', actorId: host.id, extensionId: 'ext_123', paused: false, currentTime: '42', at })).toBe(false)
    expect(isRoomEvent({ type: 'extension_error', actorId: host.id, extensionId: 'ext_123', message: '', at })).toBe(false)

    const afterPair = applyRoomEvent(room, paired)
    const afterStatus = applyRoomEvent(afterPair, status)
    const afterError = applyRoomEvent(afterStatus, error)

    expect(afterPair.activeMode).toBe('laptop_auto')
    expect(afterPair.extensions.ext_123).toMatchObject({ participantId: host.id, tabTitle: 'Example Video' })
    expect(afterStatus.playbackByParticipant[host.id]).toMatchObject({ extensionId: 'ext_123', paused: false, currentTime: 42 })
    expect(afterError.lastSignal?.type).toBe('message')
    expect(afterError.lastSignal?.message).toContain('Extension error: play() blocked')
  })
})
