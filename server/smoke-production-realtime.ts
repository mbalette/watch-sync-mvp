import WebSocket, { type RawData } from 'ws'
import { createParticipant, nowIso, type RoomState } from '../src/domain.ts'
import type { ServerToClientMessage } from './realtime.ts'

type PendingMessage = {
  resolve: (message: ServerToClientMessage) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

class BufferedRealtimeSocket {
  private readonly socket: WebSocket
  private readonly queue: ServerToClientMessage[] = []
  private readonly waiters: PendingMessage[] = []
  private closedError: Error | null = null

  constructor(socket: WebSocket) {
    this.socket = socket
    socket.on('message', (data) => this.handleMessage(data))
    socket.on('error', (error) => this.fail(error))
    socket.on('close', (code, reason) => {
      const suffix = reason.length > 0 ? `: ${reason.toString()}` : ''
      this.fail(new Error(`websocket closed (${code})${suffix}`))
    })
  }

  send(data: string): void {
    this.socket.send(data)
  }

  close(): void {
    this.socket.close()
  }

  nextMessage(): Promise<ServerToClientMessage> {
    const queued = this.queue.shift()
    if (queued) return Promise.resolve(queued)
    if (this.closedError) return Promise.reject(this.closedError)

    return new Promise((resolve, reject) => {
      const waiter: PendingMessage = {
        resolve,
        reject,
        timeout: setTimeout(() => {
          this.removeWaiter(waiter)
          reject(new Error('timed out waiting for websocket message'))
        }, 10_000),
      }
      this.waiters.push(waiter)
    })
  }

  private handleMessage(data: RawData): void {
    let message: ServerToClientMessage
    try {
      message = JSON.parse(data.toString()) as ServerToClientMessage
    } catch (error) {
      this.fail(error instanceof Error ? error : new Error(String(error)))
      return
    }

    const waiter = this.waiters.shift()
    if (waiter) {
      clearTimeout(waiter.timeout)
      waiter.resolve(message)
      return
    }

    this.queue.push(message)
  }

  private removeWaiter(waiter: PendingMessage): void {
    const index = this.waiters.indexOf(waiter)
    if (index >= 0) this.waiters.splice(index, 1)
  }

  private fail(error: Error): void {
    if (!this.closedError) this.closedError = error
    while (this.waiters.length > 0) {
      const waiter = this.waiters.shift()
      if (!waiter) continue
      clearTimeout(waiter.timeout)
      waiter.reject(error)
    }
  }
}

function resolveRealtimeUrl(): string {
  const candidate = process.argv[2] ?? process.env.REALTIME_URL ?? 'wss://api.kyrosdirect.tech'
  if (!candidate.startsWith('ws://') && !candidate.startsWith('wss://')) {
    throw new Error(`Realtime URL must start with ws:// or wss://, got ${candidate}`)
  }
  return candidate
}

function openSocket(url: string): Promise<BufferedRealtimeSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url)
    const client = new BufferedRealtimeSocket(socket)
    let settled = false

    const timeout = setTimeout(() => {
      if (settled) return
      settled = true
      client.close()
      reject(new Error(`timed out opening websocket ${url}`))
    }, 10_000)

    socket.once('open', () => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      resolve(client)
    })
    socket.once('error', (error) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      reject(error)
    })
  })
}

async function waitForSnapshot(socket: BufferedRealtimeSocket, predicate: (room: RoomState) => boolean): Promise<RoomState> {
  for (let index = 0; index < 20; index += 1) {
    const message = await socket.nextMessage()
    if (message.type === 'room_snapshot' && predicate(message.room)) return message.room
    if (message.type === 'error') throw new Error(message.message)
  }
  throw new Error('snapshot predicate was not met')
}

const realtimeUrl = resolveRealtimeUrl()
const hostSocket = await openSocket(realtimeUrl)
const guestSocket = await openSocket(realtimeUrl)
const extensionSocket = await openSocket(realtimeUrl)
const host = createParticipant('Prod Smoke Host', 'host')
const guest = createParticipant('Prod Smoke Guest', 'guest')

try {
  hostSocket.send(JSON.stringify({ type: 'create_room', participant: host }))
  const created = await waitForSnapshot(hostSocket, (room) => room.hostId === host.id)
  console.log(`created production smoke room ${created.roomId}`)

  guestSocket.send(JSON.stringify({ type: 'join_room', roomId: created.roomId, participant: guest }))
  await waitForSnapshot(hostSocket, (room) => Boolean(room.participants[guest.id]))
  await waitForSnapshot(guestSocket, (room) => Boolean(room.participants[guest.id]))
  console.log('guest joined and both PWA clients received participant snapshot')

  hostSocket.send(JSON.stringify({
    type: 'room_event',
    roomId: created.roomId,
    event: { type: 'chat_message', actorId: host.id, message: 'production smoke hello', at: nowIso() },
  }))
  await waitForSnapshot(guestSocket, (room) => room.lastSignal?.message === 'production smoke hello')
  console.log('chat_message propagated to guest')

  guestSocket.send(JSON.stringify({
    type: 'room_event',
    roomId: created.roomId,
    event: { type: 'participant_ready', participantId: guest.id, ready: true, at: nowIso() },
  }))
  await waitForSnapshot(hostSocket, (room) => room.readyState[guest.id] === 'ready')
  console.log('ready event propagated to host')

  hostSocket.send(JSON.stringify({
    type: 'room_event',
    roomId: created.roomId,
    event: { type: 'countdown_started', actorId: host.id, startsAtEpochMs: Date.now() + 3_000, durationSeconds: 3, at: nowIso() },
  }))
  await waitForSnapshot(guestSocket, (room) => room.countdownState.phase === 'counting')
  console.log('countdown_started propagated to guest')

  extensionSocket.send(JSON.stringify({
    type: 'pair_extension',
    roomId: created.roomId,
    participantId: host.id,
    extensionId: 'ext_prod_smoke',
    capabilities: { html5Video: true, play: true, pause: true, seek: true },
    tabTitle: 'Production Smoke Video',
    urlOrigin: 'https://example.test',
  }))
  await waitForSnapshot(hostSocket, (room) => room.extensions.ext_prod_smoke?.participantId === host.id)
  await waitForSnapshot(extensionSocket, (room) => room.extensions.ext_prod_smoke?.participantId === host.id)
  console.log('extension paired and snapshots propagated')

  extensionSocket.send(JSON.stringify({
    type: 'room_event',
    roomId: created.roomId,
    event: {
      type: 'playback_status',
      actorId: host.id,
      extensionId: 'ext_prod_smoke',
      paused: false,
      currentTime: 37,
      duration: 120,
      playbackRate: 1,
      readyState: 4,
      at: nowIso(),
    },
  }))
  const playbackHostView = await waitForSnapshot(hostSocket, (room) => room.playbackByParticipant[host.id]?.currentTime === 37)
  const playbackGuestView = await waitForSnapshot(guestSocket, (room) => room.playbackByParticipant[host.id]?.currentTime === 37)
  if (playbackHostView.playbackByParticipant[host.id]?.extensionId !== 'ext_prod_smoke' || playbackGuestView.playbackByParticipant[host.id]?.paused !== false) {
    throw new Error('extension playback_status did not propagate to both PWA clients')
  }
  console.log('extension playback_status propagated to both PWA clients')
} finally {
  hostSocket.close()
  guestSocket.close()
  extensionSocket.close()
}
