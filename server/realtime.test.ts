import { describe, expect, it } from 'vitest'
import WebSocket from 'ws'
import { createParticipant, nowIso, type RoomState } from '../src/domain'
import { createRealtimeServer, type ServerToClientMessage } from './realtime'

function nextMessage(socket: WebSocket): Promise<ServerToClientMessage> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timed out waiting for websocket message')), 1500)
    socket.once('message', (data) => {
      clearTimeout(timeout)
      resolve(JSON.parse(data.toString()) as ServerToClientMessage)
    })
    socket.once('error', reject)
  })
}

async function waitForSnapshot(socket: WebSocket, predicate: (room: RoomState) => boolean): Promise<RoomState> {
  for (let index = 0; index < 8; index += 1) {
    const message = await nextMessage(socket)
    if (message.type === 'room_snapshot' && predicate(message.room)) return message.room
  }
  throw new Error('snapshot predicate was not met')
}

async function waitForError(socket: WebSocket): Promise<string> {
  for (let index = 0; index < 4; index += 1) {
    const message = await nextMessage(socket)
    if (message.type === 'error') return message.message
  }
  throw new Error('error message was not received')
}

function openSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url)
    socket.once('open', () => resolve(socket))
    socket.once('error', reject)
  })
}

describe('realtime websocket room flow', () => {
  it('creates a room, joins a second client, and broadcasts synced events', async () => {
    const server = await createRealtimeServer({ port: 0, cleanupIntervalMs: 60_000 })
    const hostSocket = await openSocket(server.url)
    const guestSocket = await openSocket(server.url)
    const host = createParticipant('Host', 'host')
    const guest = createParticipant('Guest', 'guest')

    hostSocket.send(JSON.stringify({ type: 'create_room', participant: host }))
    const created = await waitForSnapshot(hostSocket, (room) => room.hostId === host.id)

    guestSocket.send(JSON.stringify({ type: 'join_room', roomId: created.roomId, participant: guest }))
    await waitForSnapshot(hostSocket, (room) => Boolean(room.participants[guest.id]))
    const guestJoined = await waitForSnapshot(guestSocket, (room) => Boolean(room.participants[guest.id]))

    guestSocket.send(JSON.stringify({
      type: 'room_event',
      roomId: created.roomId,
      event: { type: 'pause_requested', actorId: guest.id, at: nowIso() },
    }))

    const hostView = await waitForSnapshot(hostSocket, (room) => room.lastSignal?.type === 'pause')
    const guestView = await waitForSnapshot(guestSocket, (room) => room.lastSignal?.type === 'pause')

    expect(guestJoined.roomId).toBe(created.roomId)
    expect(hostView.lastSignal?.actorName).toBe('Guest')
    expect(guestView.lastSignal?.message).toContain('pause your TV now')

    hostSocket.close()
    guestSocket.close()
    await server.close()
  })

  it('rejects malformed client messages without mutating room state', async () => {
    const server = await createRealtimeServer({ port: 0, cleanupIntervalMs: 60_000 })
    const socket = await openSocket(server.url)

    socket.send(JSON.stringify({ type: 'room_event', roomId: 'MISSING', event: { type: 'smart_tv_auto_pause' } }))
    const message = await waitForError(socket)

    expect(message).toContain('Invalid')

    socket.close()
    await server.close()
  })

  it('rejects room events from sockets that have not joined the target room', async () => {
    const server = await createRealtimeServer({ port: 0, cleanupIntervalMs: 60_000 })
    const hostSocket = await openSocket(server.url)
    const straySocket = await openSocket(server.url)
    const host = createParticipant('Host', 'host')

    hostSocket.send(JSON.stringify({ type: 'create_room', participant: host }))
    const created = await waitForSnapshot(hostSocket, (room) => room.hostId === host.id)

    straySocket.send(JSON.stringify({
      type: 'room_event',
      roomId: created.roomId,
      event: { type: 'pause_requested', actorId: host.id, at: nowIso() },
    }))

    const message = await waitForError(straySocket)
    expect(message).toContain('not joined')
    expect(server.rooms.get(created.roomId)?.state.lastSignal).toBeUndefined()

    hostSocket.close()
    straySocket.close()
    await server.close()
  })

  it('rejects actor events when actorId does not match the joined participant', async () => {
    const server = await createRealtimeServer({ port: 0, cleanupIntervalMs: 60_000 })
    const hostSocket = await openSocket(server.url)
    const host = createParticipant('Host', 'host')
    const impostor = createParticipant('Impostor', 'guest')

    hostSocket.send(JSON.stringify({ type: 'create_room', participant: host }))
    const created = await waitForSnapshot(hostSocket, (room) => room.hostId === host.id)

    hostSocket.send(JSON.stringify({
      type: 'room_event',
      roomId: created.roomId,
      event: { type: 'pause_requested', actorId: impostor.id, at: nowIso() },
    }))

    const message = await waitForError(hostSocket)
    expect(message).toContain('actorId')
    expect(server.rooms.get(created.roomId)?.state.lastSignal).toBeUndefined()

    hostSocket.close()
    await server.close()
  })

  it('rejects invalid participant payloads for create and join', async () => {
    const server = await createRealtimeServer({ port: 0, cleanupIntervalMs: 60_000 })
    const hostSocket = await openSocket(server.url)
    const guestSocket = await openSocket(server.url)
    const host = createParticipant('Host', 'host')

    hostSocket.send(JSON.stringify({ type: 'create_room', participant: { id: '', displayName: 'Nope' } }))
    expect(await waitForError(hostSocket)).toContain('Invalid participant')
    expect(server.rooms.size).toBe(0)

    hostSocket.send(JSON.stringify({ type: 'create_room', participant: host }))
    const created = await waitForSnapshot(hostSocket, (room) => room.hostId === host.id)

    guestSocket.send(JSON.stringify({ type: 'join_room', roomId: created.roomId, participant: { id: '', displayName: 'Bad Guest' } }))
    expect(await waitForError(guestSocket)).toContain('Invalid participant')
    expect(Object.keys(server.rooms.get(created.roomId)?.state.participants ?? {})).not.toContain('')

    hostSocket.close()
    guestSocket.close()
    await server.close()
  })

  it('pairs an extension, broadcasts playback status, and rejects extension spoofing', async () => {
    const server = await createRealtimeServer({ port: 0, cleanupIntervalMs: 60_000 })
    const hostSocket = await openSocket(server.url)
    const extensionSocket = await openSocket(server.url)
    const host = createParticipant('Host', 'host')

    hostSocket.send(JSON.stringify({ type: 'create_room', participant: host }))
    const created = await waitForSnapshot(hostSocket, (room) => room.hostId === host.id)

    extensionSocket.send(JSON.stringify({
      type: 'pair_extension',
      roomId: created.roomId.toLowerCase(),
      participantId: host.id,
      extensionId: 'ext_test',
      capabilities: { html5Video: true, play: true, pause: true, seek: true },
      tabTitle: 'Video Tab',
      urlOrigin: 'https://example.test',
    }))

    const paired = await waitForSnapshot(hostSocket, (room) => room.extensions.ext_test?.participantId === host.id)
    expect(paired.activeMode).toBe('laptop_auto')

    extensionSocket.send(JSON.stringify({
      type: 'room_event',
      roomId: created.roomId,
      event: { type: 'playback_status', actorId: host.id, extensionId: 'ext_test', paused: false, currentTime: 12.5, at: nowIso() },
    }))
    const status = await waitForSnapshot(hostSocket, (room) => room.playbackByParticipant[host.id]?.currentTime === 12.5)
    expect(status.playbackByParticipant[host.id]?.extensionId).toBe('ext_test')

    extensionSocket.send(JSON.stringify({
      type: 'room_event',
      roomId: created.roomId,
      event: { type: 'play_now', actorId: host.id, at: nowIso() },
    }))
    expect(await waitForError(extensionSocket)).toContain('Extension sockets may not send')

    extensionSocket.send(JSON.stringify({
      type: 'room_event',
      roomId: created.roomId,
      event: { type: 'playback_status', actorId: host.id, extensionId: 'other_ext', paused: true, currentTime: 0, at: nowIso() },
    }))
    expect(await waitForError(extensionSocket)).toContain('extensionId')

    hostSocket.close()
    extensionSocket.close()
    await server.close()
  })

  it('rejects extension pairing for unknown rooms and participants', async () => {
    const server = await createRealtimeServer({ port: 0, cleanupIntervalMs: 60_000 })
    const hostSocket = await openSocket(server.url)
    const badRoomSocket = await openSocket(server.url)
    const badParticipantSocket = await openSocket(server.url)
    const host = createParticipant('Host', 'host')

    badRoomSocket.send(JSON.stringify({ type: 'pair_extension', roomId: 'MISSING', participantId: host.id, extensionId: 'ext_bad', capabilities: { html5Video: true, play: true, pause: true, seek: true } }))
    expect(await waitForError(badRoomSocket)).toContain('Room not found')

    hostSocket.send(JSON.stringify({ type: 'create_room', participant: host }))
    const created = await waitForSnapshot(hostSocket, (room) => room.hostId === host.id)
    badParticipantSocket.send(JSON.stringify({ type: 'pair_extension', roomId: created.roomId, participantId: 'person_missing', extensionId: 'ext_bad', capabilities: { html5Video: true, play: true, pause: true, seek: true } }))
    expect(await waitForError(badParticipantSocket)).toContain('Participant not found')

    hostSocket.close()
    badRoomSocket.close()
    badParticipantSocket.close()
    await server.close()
  })
})
