import WebSocket from 'ws'
import { createParticipant, nowIso, type RoomState } from '../src/domain.ts'
import { createRealtimeServer, type ServerToClientMessage } from './realtime.ts'

function openSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url)
    socket.once('open', () => resolve(socket))
    socket.once('error', reject)
  })
}

function nextMessage(socket: WebSocket): Promise<ServerToClientMessage> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timed out waiting for websocket message')), 2_000)
    socket.once('message', (data) => {
      clearTimeout(timeout)
      resolve(JSON.parse(data.toString()) as ServerToClientMessage)
    })
    socket.once('error', reject)
  })
}

async function waitForSnapshot(socket: WebSocket, predicate: (room: RoomState) => boolean): Promise<RoomState> {
  for (let index = 0; index < 10; index += 1) {
    const message = await nextMessage(socket)
    if (message.type === 'room_snapshot' && predicate(message.room)) return message.room
    if (message.type === 'error') throw new Error(message.message)
  }
  throw new Error('snapshot predicate was not met')
}

const server = await createRealtimeServer({ port: 0 })
const hostSocket = await openSocket(server.url)
const guestSocket = await openSocket(server.url)
const extensionSocket = await openSocket(server.url)
const host = createParticipant('Smoke Host', 'host')
const guest = createParticipant('Smoke Guest', 'guest')

try {
  hostSocket.send(JSON.stringify({ type: 'create_room', participant: host }))
  const created = await waitForSnapshot(hostSocket, (room) => room.hostId === host.id)
  console.log(`created room ${created.roomId}`)

  guestSocket.send(JSON.stringify({ type: 'join_room', roomId: created.roomId, participant: guest }))
  await waitForSnapshot(hostSocket, (room) => Boolean(room.participants[guest.id]))
  await waitForSnapshot(guestSocket, (room) => Boolean(room.participants[guest.id]))
  console.log('guest joined and both clients received participant snapshot')

  guestSocket.send(JSON.stringify({
    type: 'room_event',
    roomId: created.roomId,
    event: { type: 'buffering_started', actorId: guest.id, at: nowIso() },
  }))

  const hostView = await waitForSnapshot(hostSocket, (room) => room.lastSignal?.type === 'buffering')
  const guestView = await waitForSnapshot(guestSocket, (room) => room.lastSignal?.type === 'buffering')
  if (hostView.lastSignal?.actorName !== 'Smoke Guest' || guestView.lastSignal?.type !== 'buffering') {
    throw new Error('buffering event did not propagate to both clients')
  }

  console.log(`two-client propagation OK: ${hostView.lastSignal.message}`)

  extensionSocket.send(JSON.stringify({
    type: 'pair_extension',
    roomId: created.roomId,
    participantId: host.id,
    extensionId: 'ext_smoke',
    capabilities: { html5Video: true, play: true, pause: true, seek: true },
    tabTitle: 'Smoke Video',
    urlOrigin: 'https://example.test',
  }))
  await waitForSnapshot(hostSocket, (room) => room.extensions.ext_smoke?.participantId === host.id)
  await waitForSnapshot(extensionSocket, (room) => room.extensions.ext_smoke?.participantId === host.id)

  extensionSocket.send(JSON.stringify({
    type: 'room_event',
    roomId: created.roomId,
    event: { type: 'playback_status', actorId: host.id, extensionId: 'ext_smoke', paused: false, currentTime: 37, duration: 120, at: nowIso() },
  }))
  const playbackHostView = await waitForSnapshot(hostSocket, (room) => room.playbackByParticipant[host.id]?.currentTime === 37)
  const playbackGuestView = await waitForSnapshot(guestSocket, (room) => room.playbackByParticipant[host.id]?.currentTime === 37)
  if (playbackHostView.playbackByParticipant[host.id]?.extensionId !== 'ext_smoke' || playbackGuestView.playbackByParticipant[host.id]?.paused !== false) {
    throw new Error('extension playback_status did not propagate to both PWA clients')
  }
  console.log('extension pairing and playback status propagation OK')
} finally {
  hostSocket.close()
  guestSocket.close()
  extensionSocket.close()
  await server.close()
}
