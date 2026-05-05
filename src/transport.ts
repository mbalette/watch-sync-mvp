import { normalizeRoomCode, type Participant, type RoomEvent, type RoomState } from './domain'

export type TransportMode = 'realtime' | 'local_fallback'
export type TransportStatus = 'idle' | 'connecting' | 'connected' | 'local_fallback' | 'error'

export type ServerToClientMessage =
  | { type: 'status'; status: 'connected'; serverTime: string }
  | { type: 'room_snapshot'; room: RoomState }
  | { type: 'pong'; serverTime: string }
  | { type: 'error'; message: string }

export interface RoomTransport {
  mode: TransportMode
  createRoom: (participant: Participant) => void
  joinRoom: (roomId: string, participant: Participant) => void
  sendEvent: (roomId: string, event: RoomEvent) => void
  close: () => void
}

export interface TransportCallbacks {
  onSnapshot: (room: RoomState) => void
  onStatus: (status: TransportStatus, detail?: string) => void
  onError: (message: string) => void
}

export function defaultRealtimeUrl(): string {
  return import.meta.env.VITE_REALTIME_URL || 'ws://127.0.0.1:8787'
}

export function createWebSocketRoomTransport(callbacks: TransportCallbacks, url = defaultRealtimeUrl()): RoomTransport {
  const socket = new WebSocket(url)
  const pending: string[] = []
  let connected = false

  callbacks.onStatus('connecting', `Connecting to ${url}`)

  socket.addEventListener('open', () => {
    connected = true
    callbacks.onStatus('connected', `Realtime server ${url}`)
    while (pending.length > 0) socket.send(pending.shift() ?? '')
  })

  socket.addEventListener('message', (event) => {
    const message = parseServerMessage(event.data)
    if (!message) return
    if (message.type === 'room_snapshot') callbacks.onSnapshot(message.room)
    if (message.type === 'error') {
      callbacks.onError(message.message)
      callbacks.onStatus('error', message.message)
    }
  })

  socket.addEventListener('close', () => {
    connected = false
    callbacks.onStatus('local_fallback', 'Connection is limited. This room is only saved on this browser for now.')
  })

  socket.addEventListener('error', () => {
    callbacks.onError('Connection is limited. Shared rooms may not sync until the live room reconnects.')
    callbacks.onStatus('local_fallback', 'Connection is limited. This room is only saved on this browser for now.')
  })

  function send(payload: unknown) {
    const raw = JSON.stringify(payload)
    if (connected && socket.readyState === WebSocket.OPEN) {
      socket.send(raw)
      return
    }
    pending.push(raw)
  }

  return {
    mode: 'realtime',
    createRoom: (participant) => send({ type: 'create_room', participant }),
    joinRoom: (roomId, participant) => send({ type: 'join_room', roomId: normalizeRoomCode(roomId), participant }),
    sendEvent: (roomId, event) => send({ type: 'room_event', roomId: normalizeRoomCode(roomId), event }),
    close: () => socket.close(),
  }
}

function parseServerMessage(raw: unknown): ServerToClientMessage | null {
  if (typeof raw !== 'string') return null
  try {
    const parsed = JSON.parse(raw) as ServerToClientMessage
    return parsed
  } catch {
    return null
  }
}
