import { createServer, type Server as HttpServer } from 'node:http'
import { WebSocketServer, type WebSocket } from 'ws'
import {
  applyRoomEvent,
  createRoom,
  isExtensionCapabilities,
  isParticipant,
  isRoomEvent,
  normalizeRoomCode,
  nowIso,
  type ExtensionCapabilities,
  type Participant,
  type RoomEvent,
  type RoomState,
} from '../src/domain.ts'

export type ClientToServerMessage =
  | { type: 'create_room'; participant: Participant }
  | { type: 'join_room'; roomId: string; participant: Participant }
  | { type: 'pair_extension'; roomId: string; participantId: string; extensionId: string; capabilities: ExtensionCapabilities; tabTitle?: string; urlOrigin?: string }
  | { type: 'room_event'; roomId: string; event: RoomEvent }
  | { type: 'ping' }

export type ServerToClientMessage =
  | { type: 'status'; status: 'connected'; serverTime: string }
  | { type: 'room_snapshot'; room: RoomState }
  | { type: 'pong'; serverTime: string }
  | { type: 'error'; message: string }

interface RealtimeServerOptions {
  port?: number
  host?: string
  cleanupIntervalMs?: number
  roomTtlMs?: number
}

interface RealtimeServerHandle {
  url: string
  port: number
  rooms: Map<string, ServerRoom>
  close: () => Promise<void>
}

interface ServerRoom {
  state: RoomState
  sockets: Set<WebSocket>
  lastActivityAt: number
}

interface ClientSession {
  roomId?: string
  participantId?: string
  extensionId?: string
  clientKind?: 'pwa' | 'extension'
}

const DEFAULT_PORT = 8787
const DEFAULT_CLEANUP_INTERVAL_MS = 30_000
const DEFAULT_ROOM_TTL_MS = 30 * 60_000
const sessions = new WeakMap<WebSocket, ClientSession>()

export async function createRealtimeServer(options: RealtimeServerOptions = {}): Promise<RealtimeServerHandle> {
  const rooms = new Map<string, ServerRoom>()
  const httpServer = createServer((request, response) => {
    if (request.url === '/health') {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ ok: true, rooms: rooms.size }))
      return
    }
    response.writeHead(404)
    response.end('Not found')
  })
  const wss = new WebSocketServer({ server: httpServer })
  const cleanupInterval = setInterval(() => cleanupRooms(rooms, options.roomTtlMs ?? DEFAULT_ROOM_TTL_MS), options.cleanupIntervalMs ?? DEFAULT_CLEANUP_INTERVAL_MS)

  wss.on('connection', (socket) => {
    sessions.set(socket, {})
    send(socket, { type: 'status', status: 'connected', serverTime: nowIso() })

    socket.on('message', (data) => {
      try {
        const message = parseClientMessage(data.toString())
        handleClientMessage(rooms, socket, message)
      } catch (error) {
        send(socket, { type: 'error', message: error instanceof Error ? error.message : 'Invalid message' })
      }
    })

    socket.on('close', () => removeSocketFromRooms(rooms, socket))
  })

  await new Promise<void>((resolve) => {
    httpServer.listen(options.port ?? DEFAULT_PORT, options.host ?? '127.0.0.1', () => resolve())
  })

  const address = httpServer.address()
  if (!address || typeof address === 'string') throw new Error('Realtime server did not expose a TCP address')
  const host = options.host ?? '127.0.0.1'

  return {
    url: `ws://${host}:${address.port}`,
    port: address.port,
    rooms,
    close: () => closeServer(httpServer, wss, cleanupInterval),
  }
}

function handleClientMessage(rooms: Map<string, ServerRoom>, socket: WebSocket, message: ClientToServerMessage) {
  if (message.type === 'ping') {
    send(socket, { type: 'pong', serverTime: nowIso() })
    return
  }

  if (message.type === 'create_room') {
    if (!isParticipant(message.participant)) throw new Error('Invalid participant')
    const room = createRoom({ ...message.participant, role: 'host', lastSeenAt: nowIso() })
    const serverRoom: ServerRoom = { state: room, sockets: new Set([socket]), lastActivityAt: Date.now() }
    rooms.set(room.roomId, serverRoom)
    sessions.set(socket, { roomId: room.roomId, participantId: message.participant.id, clientKind: 'pwa' })
    send(socket, { type: 'room_snapshot', room })
    return
  }

  if (message.type === 'join_room') {
    const roomId = normalizeRoomCode(message.roomId)
    const serverRoom = rooms.get(roomId)
    if (!serverRoom) throw new Error('Room not found')
    if (!isParticipant(message.participant)) throw new Error('Invalid participant')
    const participant = { ...message.participant, role: 'guest' as const, lastSeenAt: nowIso() }
    serverRoom.sockets.add(socket)
    serverRoom.state = applyRoomEvent(serverRoom.state, { type: 'participant_joined', participant, at: nowIso() })
    serverRoom.lastActivityAt = Date.now()
    sessions.set(socket, { roomId, participantId: participant.id, clientKind: 'pwa' })
    broadcast(serverRoom)
    return
  }

  if (message.type === 'pair_extension') {
    const roomId = normalizeRoomCode(message.roomId)
    const serverRoom = rooms.get(roomId)
    if (!serverRoom) throw new Error('Room not found')
    if (!serverRoom.state.participants[message.participantId]) throw new Error('Participant not found in room')
    if (!message.extensionId.trim()) throw new Error('Invalid extensionId')
    if (!isExtensionCapabilities(message.capabilities)) throw new Error('Invalid extension capabilities')

    serverRoom.sockets.add(socket)
    sessions.set(socket, {
      roomId,
      participantId: message.participantId,
      extensionId: message.extensionId,
      clientKind: 'extension',
    })
    touchParticipant(serverRoom, message.participantId)
    serverRoom.state = applyRoomEvent(serverRoom.state, {
      type: 'extension_paired',
      extensionId: message.extensionId,
      participantId: message.participantId,
      capabilities: message.capabilities,
      tabTitle: message.tabTitle,
      urlOrigin: message.urlOrigin,
      at: nowIso(),
    })
    serverRoom.lastActivityAt = Date.now()
    broadcast(serverRoom)
    return
  }

  if (message.type === 'room_event') {
    if (!isRoomEvent(message.event)) throw new Error('Invalid room event')
    const roomId = normalizeRoomCode(message.roomId)
    const serverRoom = rooms.get(roomId)
    if (!serverRoom) throw new Error('Room not found')
    const session = sessions.get(socket)
    if (session?.roomId !== roomId || !session.participantId || !serverRoom.sockets.has(socket)) {
      throw new Error('Socket is not joined to the target room')
    }
    if (message.event.type === 'extension_paired') throw new Error('Use pair_extension to pair extensions')
    if (session.clientKind === 'extension') validateExtensionEvent(message.event, session)
    const actorId = getActorId(message.event)
    if (actorId && actorId !== session.participantId) throw new Error('room_event actorId must match the joined participant')
    touchParticipant(serverRoom, session.participantId)
    serverRoom.state = applyRoomEvent(serverRoom.state, message.event)
    serverRoom.lastActivityAt = Date.now()
    broadcast(serverRoom)
  }
}

function validateExtensionEvent(event: RoomEvent, session: ClientSession) {
  if (event.type !== 'playback_status' && event.type !== 'extension_error' && event.type !== 'extension_command') {
    throw new Error('Extension sockets may not send that room_event type')
  }
  if ('actorId' in event && event.actorId !== session.participantId) throw new Error('Extension actorId must match paired participant')
  if ('extensionId' in event && event.extensionId !== session.extensionId) throw new Error('Extension extensionId must match paired extension')
}

function parseClientMessage(raw: string): ClientToServerMessage {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    throw new Error('Invalid JSON message')
  }
  if (!isRecord(parsed) || typeof parsed.type !== 'string') throw new Error('Invalid client message')
  if (parsed.type === 'ping') return { type: 'ping' }
  if (parsed.type === 'create_room') return { type: 'create_room', participant: parsed.participant as Participant }
  if (parsed.type === 'join_room') return { type: 'join_room', roomId: String(parsed.roomId ?? ''), participant: parsed.participant as Participant }
  if (parsed.type === 'pair_extension') {
    return {
      type: 'pair_extension',
      roomId: String(parsed.roomId ?? ''),
      participantId: String(parsed.participantId ?? ''),
      extensionId: String(parsed.extensionId ?? ''),
      capabilities: parsed.capabilities as ExtensionCapabilities,
      tabTitle: typeof parsed.tabTitle === 'string' ? parsed.tabTitle : undefined,
      urlOrigin: typeof parsed.urlOrigin === 'string' ? parsed.urlOrigin : undefined,
    }
  }
  if (parsed.type === 'room_event') return { type: 'room_event', roomId: String(parsed.roomId ?? ''), event: parsed.event as RoomEvent }
  throw new Error('Invalid client message type')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getActorId(event: RoomEvent): string | undefined {
  return 'actorId' in event ? event.actorId : undefined
}

function touchParticipant(serverRoom: ServerRoom, participantId: string) {
  const participant = serverRoom.state.participants[participantId]
  if (!participant) return
  serverRoom.state = {
    ...serverRoom.state,
    participants: {
      ...serverRoom.state.participants,
      [participantId]: { ...participant, lastSeenAt: nowIso() },
    },
  }
}

function send(socket: WebSocket, message: ServerToClientMessage) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message))
}

function broadcast(serverRoom: ServerRoom) {
  for (const socket of serverRoom.sockets) send(socket, { type: 'room_snapshot', room: serverRoom.state })
}

function removeSocketFromRooms(rooms: Map<string, ServerRoom>, socket: WebSocket) {
  for (const room of rooms.values()) room.sockets.delete(socket)
}

function cleanupRooms(rooms: Map<string, ServerRoom>, ttlMs: number) {
  const cutoff = Date.now() - ttlMs
  for (const [roomId, room] of rooms) {
    if (room.lastActivityAt < cutoff || room.sockets.size === 0) rooms.delete(roomId)
  }
}

async function closeServer(httpServer: HttpServer, wss: WebSocketServer, cleanupInterval: NodeJS.Timeout): Promise<void> {
  clearInterval(cleanupInterval)
  for (const client of wss.clients) client.close()
  await new Promise<void>((resolve) => wss.close(() => resolve()))
  await new Promise<void>((resolve, reject) => httpServer.close((error) => error ? reject(error) : resolve()))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.REALTIME_PORT ?? DEFAULT_PORT)
  const host = process.env.REALTIME_HOST ?? '127.0.0.1'
  const server = await createRealtimeServer({ port, host })
  console.log(`watch-sync realtime server listening on ${server.url}`)
}
