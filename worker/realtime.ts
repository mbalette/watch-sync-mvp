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

export interface Env {
  ROOMS: DurableObjectNamespace<WatchSyncRoomDurableObject>
}

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

const GLOBAL_ROOM_DO_NAME = 'watch-sync-global-room-v1'
const DEFAULT_ROOM_TTL_MS = 30 * 60_000
const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if ((request.method === 'GET' || request.method === 'HEAD') && url.pathname === '/health') {
      if (request.method === 'HEAD') return new Response(null, { status: 200, headers: JSON_HEADERS })

      return Response.json({
        ok: true,
        service: 'watch-sync-realtime',
        backend: 'cloudflare-worker-durable-object',
        rooms: 'ephemeral-global-durable-object',
        serverTime: nowIso(),
      }, { headers: JSON_HEADERS })
    }

    if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
      const id = env.ROOMS.idFromName(GLOBAL_ROOM_DO_NAME)
      return env.ROOMS.get(id).fetch(request)
    }

    return new Response('Not found', { status: 404 })
  },
}

export class WatchSyncRoomDurableObject {
  private rooms = new Map<string, ServerRoom>()
  private sessions = new WeakMap<WebSocket, ClientSession>()

  fetch(request: Request): Response {
    if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Durable Object expects a WebSocket upgrade', { status: 426 })
    }

    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]

    server.accept()
    this.sessions.set(server, {})
    this.send(server, { type: 'status', status: 'connected', serverTime: nowIso() })

    server.addEventListener('message', (event) => {
      try {
        this.cleanupRooms(DEFAULT_ROOM_TTL_MS)
        const message = this.parseClientMessage(String(event.data))
        this.handleClientMessage(server, message)
      } catch (error) {
        this.send(server, { type: 'error', message: error instanceof Error ? error.message : 'Invalid message' })
      }
    })

    server.addEventListener('close', () => this.removeSocketFromRooms(server))
    server.addEventListener('error', () => this.removeSocketFromRooms(server))

    return new Response(null, { status: 101, webSocket: client })
  }

  private handleClientMessage(socket: WebSocket, message: ClientToServerMessage) {
    if (message.type === 'ping') {
      this.send(socket, { type: 'pong', serverTime: nowIso() })
      return
    }

    if (message.type === 'create_room') {
      if (!isParticipant(message.participant)) throw new Error('Invalid participant')
      const room = createRoom({ ...message.participant, role: 'host', lastSeenAt: nowIso() })
      const serverRoom: ServerRoom = { state: room, sockets: new Set([socket]), lastActivityAt: Date.now() }
      this.rooms.set(room.roomId, serverRoom)
      this.sessions.set(socket, { roomId: room.roomId, participantId: message.participant.id, clientKind: 'pwa' })
      this.send(socket, { type: 'room_snapshot', room })
      return
    }

    if (message.type === 'join_room') {
      const roomId = normalizeRoomCode(message.roomId)
      const serverRoom = this.rooms.get(roomId)
      if (!serverRoom) throw new Error('Room not found')
      if (!isParticipant(message.participant)) throw new Error('Invalid participant')
      const participant = { ...message.participant, role: 'guest' as const, lastSeenAt: nowIso() }
      serverRoom.sockets.add(socket)
      serverRoom.state = applyRoomEvent(serverRoom.state, { type: 'participant_joined', participant, at: nowIso() })
      serverRoom.lastActivityAt = Date.now()
      this.sessions.set(socket, { roomId, participantId: participant.id, clientKind: 'pwa' })
      this.broadcast(serverRoom)
      return
    }

    if (message.type === 'pair_extension') {
      const roomId = normalizeRoomCode(message.roomId)
      const serverRoom = this.rooms.get(roomId)
      if (!serverRoom) throw new Error('Room not found')
      if (!serverRoom.state.participants[message.participantId]) throw new Error('Participant not found in room')
      if (!message.extensionId.trim()) throw new Error('Invalid extensionId')
      if (!isExtensionCapabilities(message.capabilities)) throw new Error('Invalid extension capabilities')

      serverRoom.sockets.add(socket)
      this.sessions.set(socket, {
        roomId,
        participantId: message.participantId,
        extensionId: message.extensionId,
        clientKind: 'extension',
      })
      this.touchParticipant(serverRoom, message.participantId)
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
      this.broadcast(serverRoom)
      return
    }

    if (message.type === 'room_event') {
      if (!isRoomEvent(message.event)) throw new Error('Invalid room event')
      const roomId = normalizeRoomCode(message.roomId)
      const serverRoom = this.rooms.get(roomId)
      if (!serverRoom) throw new Error('Room not found')
      const session = this.sessions.get(socket)
      if (session?.roomId !== roomId || !session.participantId || !serverRoom.sockets.has(socket)) {
        throw new Error('Socket is not joined to the target room')
      }
      if (message.event.type === 'extension_paired') throw new Error('Use pair_extension to pair extensions')
      if (session.clientKind === 'extension') this.validateExtensionEvent(message.event, session)
      const actorId = this.getActorId(message.event)
      if (actorId && actorId !== session.participantId) throw new Error('room_event actorId must match the joined participant')
      this.touchParticipant(serverRoom, session.participantId)
      serverRoom.state = applyRoomEvent(serverRoom.state, message.event)
      serverRoom.lastActivityAt = Date.now()
      this.broadcast(serverRoom)
    }
  }

  private validateExtensionEvent(event: RoomEvent, session: ClientSession) {
    if (event.type !== 'playback_status' && event.type !== 'extension_error' && event.type !== 'extension_command') {
      throw new Error('Extension sockets may not send that room_event type')
    }
    if ('actorId' in event && event.actorId !== session.participantId) throw new Error('Extension actorId must match paired participant')
    if ('extensionId' in event && event.extensionId !== session.extensionId) throw new Error('Extension extensionId must match paired extension')
  }

  private parseClientMessage(raw: string): ClientToServerMessage {
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

  private getActorId(event: RoomEvent): string | undefined {
    return 'actorId' in event ? event.actorId : undefined
  }

  private touchParticipant(serverRoom: ServerRoom, participantId: string) {
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

  private send(socket: WebSocket, message: ServerToClientMessage): boolean {
    if (socket.readyState !== WebSocket.OPEN && socket.readyState !== 1) return false

    try {
      socket.send(JSON.stringify(message))
      return true
    } catch {
      return false
    }
  }

  private broadcast(serverRoom: ServerRoom) {
    for (const socket of serverRoom.sockets) {
      if (!this.send(socket, { type: 'room_snapshot', room: serverRoom.state })) serverRoom.sockets.delete(socket)
    }
  }

  private removeSocketFromRooms(socket: WebSocket) {
    for (const room of this.rooms.values()) room.sockets.delete(socket)
  }

  private cleanupRooms(ttlMs: number) {
    const cutoff = Date.now() - ttlMs
    for (const [roomId, room] of this.rooms) {
      if (room.lastActivityAt < cutoff || room.sockets.size === 0) this.rooms.delete(roomId)
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
