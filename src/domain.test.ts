import { describe, expect, it } from 'vitest'
import {
  applyRoomEvent,
  bothReady,
  createParticipant,
  createRoom,
  isRoomEvent,
  nowIso,
  type RoomEvent,
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
