import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import './App.css'
import {
  applyRoomEvent,
  bothReady,
  createParticipant,
  createRoom,
  normalizeRoomCode,
  nowIso,
  participantList,
  type Participant,
  type RoomEvent,
  type RoomState,
  type WatchSetup,
} from './domain'
import { createWebSocketRoomTransport, type RoomTransport, type TransportStatus } from './transport'

const LOCAL_PARTICIPANT_KEY = 'watch-sync.localParticipant'
const CURRENT_ROOM_KEY = 'watch-sync.currentRoom'
const storageKey = (roomId: string) => `watch-sync.room.${roomId}`
const realtimeUrl = import.meta.env.VITE_REALTIME_URL || 'ws://127.0.0.1:8787'

function loadRoom(roomId: string): RoomState | null {
  const raw = localStorage.getItem(storageKey(roomId))
  if (!raw) return null

  try {
    return JSON.parse(raw) as RoomState
  } catch {
    return null
  }
}

function persistRoom(room: RoomState) {
  localStorage.setItem(storageKey(room.roomId), JSON.stringify(room))
  localStorage.setItem(CURRENT_ROOM_KEY, room.roomId)
}

function getOrCreateLocalParticipant(displayName: string, role: 'host' | 'guest'): Participant {
  const raw = sessionStorage.getItem(LOCAL_PARTICIPANT_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Participant
      const updated = {
        ...parsed,
        displayName: displayName.trim() || parsed.displayName,
        role,
        lastSeenAt: nowIso(),
      }
      sessionStorage.setItem(LOCAL_PARTICIPANT_KEY, JSON.stringify(updated))
      return updated
    } catch {
      sessionStorage.removeItem(LOCAL_PARTICIPANT_KEY)
    }
  }

  const participant = createParticipant(displayName, role)
  sessionStorage.setItem(LOCAL_PARTICIPANT_KEY, JSON.stringify(participant))
  return participant
}

function App() {
  const queryRoom = new URLSearchParams(window.location.search).get('room')
  const rememberedRoom = localStorage.getItem(CURRENT_ROOM_KEY)
  const initialRoomId = normalizeRoomCode(queryRoom ?? rememberedRoom ?? '')
  const [room, setRoom] = useState<RoomState | null>(() => (initialRoomId ? loadRoom(initialRoomId) : null))
  const [displayName, setDisplayName] = useState('')
  const [joinCode, setJoinCode] = useState(initialRoomId)
  const [showJoinForm, setShowJoinForm] = useState(Boolean(initialRoomId))
  const [setupDraft, setSetupDraft] = useState<WatchSetup>({ service: '', title: '', targetTimestamp: '00:00' })
  const [copyStatus, setCopyStatus] = useState('')
  const [showSetupSheet, setShowSetupSheet] = useState(false)
  const [showLaptopDrawer, setShowLaptopDrawer] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatDraft, setChatDraft] = useState('')
  const [countdownText, setCountdownText] = useState('3')
  const [transportStatus, setTransportStatus] = useState<TransportStatus>('idle')
  const transportRef = useRef<RoomTransport | null>(null)

  const [localParticipant, setLocalParticipant] = useState<Participant | null>(() => {
    const raw = sessionStorage.getItem(LOCAL_PARTICIPANT_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as Participant
    } catch {
      return null
    }
  })

  const people = room ? participantList(room) : []
  const currentParticipantId = localParticipant?.id ?? ''
  const inviteLink = room ? `${window.location.origin}${window.location.pathname}?room=${room.roomId}` : ''
  const isReady = Boolean(room && currentParticipantId && room.readyState[currentParticipantId] === 'ready')
  const isSoloRoom = people.length === 1
  const chatMessages = room ? room.eventLog.filter((event) => event.type === 'chat_message').slice(-20) : []
  const pairedExtensions = room ? Object.values(room.extensions ?? {}) : []
  const localPlayback = room && currentParticipantId ? room.playbackByParticipant?.[currentParticipantId] : undefined
  const readyCount = room ? people.filter((person) => room.readyState[person.id] === 'ready').length : 0
  const setupOpen = Boolean(room && (room.targetTimestamp === '00:00' || showSetupSheet))
  const manualModeLabel = pairedExtensions.length > 0 ? 'Laptop auto-sync available' : 'TV/manual mode'

  useEffect(() => {
    const transport = createWebSocketRoomTransport({
      onSnapshot: (nextRoom) => {
        setRoom(nextRoom)
        setSetupDraft({ service: nextRoom.service, title: nextRoom.title, targetTimestamp: nextRoom.targetTimestamp })
        setJoinCode(nextRoom.roomId)
        localStorage.setItem(CURRENT_ROOM_KEY, nextRoom.roomId)
        window.history.replaceState(null, '', `?room=${nextRoom.roomId}`)
      },
      onStatus: (status, detail) => {
        setTransportStatus(status)
        if (status === 'error' && detail) setCopyStatus(detail)
      },
      onError: (message) => setCopyStatus(message),
    })
    transportRef.current = transport
    return () => transport.close()
  }, [])

  useEffect(() => {
    if (!room) return
    persistRoom(room)
  }, [room])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!room || event.key !== storageKey(room.roomId) || !event.newValue) return
      try {
        const nextRoom = JSON.parse(event.newValue) as RoomState
        setRoom(nextRoom)
        setSetupDraft({ service: nextRoom.service, title: nextRoom.title, targetTimestamp: nextRoom.targetTimestamp })
      } catch {
        return
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [room])

  const dispatch = useCallback((event: RoomEvent) => {
    if (room && transportStatus === 'connected' && transportRef.current) {
      transportRef.current.sendEvent(room.roomId, event)
      return
    }

    setRoom((current) => {
      if (!current) return current
      return applyRoomEvent(current, event)
    })
  }, [room, transportStatus])

  const tick = useCallback((frequency = 660) => {
    if ('vibrate' in navigator) navigator.vibrate(frequency > 900 ? 180 : 80)
  }, [])

  useEffect(() => {
    if (!room || !bothReady(room) || room.countdownState.phase !== 'idle' || !currentParticipantId || currentParticipantId !== room.hostId) return
    dispatch({
      type: 'countdown_started',
      actorId: currentParticipantId,
      startsAtEpochMs: Date.now() + 500,
      durationSeconds: 3,
      at: nowIso(),
    })
  }, [currentParticipantId, dispatch, room])

  useEffect(() => {
    if (!room || room.countdownState.phase !== 'counting' || !room.countdownState.startsAtEpochMs || !currentParticipantId) return

    const interval = window.setInterval(() => {
      const elapsedMs = Date.now() - (room.countdownState.startsAtEpochMs ?? Date.now())
      const remaining = room.countdownState.durationSeconds - Math.floor(elapsedMs / 1000)

      if (remaining > 0) {
        setCountdownText(String(remaining))
        tick(remaining === 1 ? 880 : 660)
        return
      }

      window.clearInterval(interval)
      setCountdownText('PLAY')
      tick(1040)
      if (currentParticipantId === room.hostId) {
        dispatch({ type: 'play_now', actorId: currentParticipantId, at: nowIso() })
        if (isSoloRoom) {
          window.setTimeout(() => {
            dispatch({ type: 'countdown_cancelled', actorId: currentParticipantId, at: nowIso() })
          }, 900)
        }
      }
    }, 250)

    return () => window.clearInterval(interval)
  }, [currentParticipantId, dispatch, isSoloRoom, room, tick])

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const host = getOrCreateLocalParticipant(displayName, 'host')
    setLocalParticipant(host)

    if (transportStatus === 'connected' && transportRef.current) {
      transportRef.current.createRoom(host)
      setCopyStatus('Creating room...')
      return
    }

    const newRoom = createRoom(host)
    setRoom(newRoom)
    setSetupDraft({ service: newRoom.service, title: newRoom.title, targetTimestamp: newRoom.targetTimestamp })
    setJoinCode(newRoom.roomId)
    window.history.replaceState(null, '', `?room=${newRoom.roomId}`)
  }

  function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const roomId = normalizeRoomCode(joinCode)
    const guest = getOrCreateLocalParticipant(displayName, 'guest')
    setLocalParticipant(guest)

    if (transportStatus === 'connected' && transportRef.current) {
      transportRef.current.joinRoom(roomId, guest)
      setCopyStatus('Joining room...')
      return
    }

    const existing = loadRoom(roomId)
    if (!existing) {
      setCopyStatus('Room not found. Check the code or ask your partner for a fresh invite link.')
      return
    }

    const joined = applyRoomEvent(existing, { type: 'participant_joined', participant: guest, at: nowIso() })
    setRoom(joined)
    setSetupDraft({ service: joined.service, title: joined.title, targetTimestamp: joined.targetTimestamp })
    window.history.replaceState(null, '', `?room=${joined.roomId}`)
  }

  function saveSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!room || !currentParticipantId) return
    dispatch({
      type: 'setup_updated',
      setup: { ...setupDraft, targetTimestamp: setupDraft.targetTimestamp || '00:00' },
      actorId: currentParticipantId,
      at: nowIso(),
    })
    setShowSetupSheet(false)
  }

  async function copyInvite() {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopyStatus('Link copied!')
      setTimeout(() => setCopyStatus(''), 2000)
    } catch {
      setCopyStatus(`Copy this link: ${inviteLink}`)
    }
  }

  function requestResync() {
    if (!room || !currentParticipantId) return
    dispatch({ type: 'resync_requested', actorId: currentParticipantId, timestamp: room.targetTimestamp || '00:00', at: nowIso() })
  }

  function toggleReady() {
    if (!room || !currentParticipantId) return
    dispatch({ type: 'participant_ready', participantId: currentParticipantId, ready: !isReady, at: nowIso() })
  }

  async function copyPairingDetails() {
    if (!room || !currentParticipantId) return
    const details = JSON.stringify({ roomCode: room.roomId, participantId: currentParticipantId, websocketUrl: realtimeUrl }, null, 2)
    try {
      await navigator.clipboard.writeText(details)
      setCopyStatus('Pairing details copied!')
      setTimeout(() => setCopyStatus(''), 2000)
    } catch {
      setCopyStatus(`Pairing details: ${details}`)
    }
  }

  function trySoloCountdown() {
    if (!room || !currentParticipantId || !isSoloRoom || room.countdownState.phase === 'counting') return
    setCountdownText('3')
    dispatch({
      type: 'countdown_started',
      actorId: currentParticipantId,
      startsAtEpochMs: Date.now() + 500,
      durationSeconds: 3,
      at: nowIso(),
    })
  }

  function sendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!room || !currentParticipantId) return
    const message = chatDraft.trim()
    if (!message) return
    dispatch({ type: 'chat_message', actorId: currentParticipantId, message, at: nowIso() })
    setChatDraft('')
  }

  function getCountdownHint() {
    if (!room) return ''
    if (room.countdownState.phase === 'counting') return 'Get ready to press play!'
    if (room.countdownState.phase === 'play') return 'Press play now!'
    if (isSoloRoom) {
      return isReady
        ? 'Waiting for your partner to join...'
        : 'Invite your partner, then tap ready.'
    }
    if (isReady && !bothReady(room)) return 'Waiting for your partner...'
    return 'Both pause at this time, then tap ready.'
  }

  function countdownDisplay() {
    if (!room) return '00:00'
    if (room.countdownState.phase === 'counting') return countdownText
    if (room.countdownState.phase === 'play') return 'PLAY'
    return room.targetTimestamp || '00:00'
  }

  function getCountdownClass() {
    if (!room) return ''
    if (room.countdownState.phase === 'counting') return 'active'
    if (room.countdownState.phase === 'play') return 'play'
    return ''
  }

  // Landing / Welcome Screen
  if (!room) {
    return (
      <main className="app-shell landing" aria-labelledby="app-title">
        <section className="welcome-screen">
          <div className="welcome-orb" aria-hidden="true">
            <span>▶</span>
          </div>
          <div className="welcome-header">
            <p className="eyebrow">Date night, together</p>
            <h1 id="app-title">Watch Sync</h1>
            <p className="tagline">The shared remote for long-distance movie nights.</p>
          </div>

          <div className="truth-card" aria-label="How Watch Sync works">
            <span>Use it manually with any TV</span>
            <span>Auto-sync is available for supported browser tabs with the Chrome extension</span>
          </div>

          <form className="welcome-form" onSubmit={showJoinForm && joinCode ? handleJoin : handleCreate}>
            <label className="field-label">
              <span>Your name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Alex"
                aria-label="Your name"
                autoComplete="name"
              />
            </label>

            {showJoinForm ? (
              <>
                <label className="field-label">
                  <span>Room code</span>
                  <input
                    value={joinCode}
                    onChange={(event) => setJoinCode(normalizeRoomCode(event.target.value))}
                    placeholder="AB12CD"
                    aria-label="Room code"
                    style={{ textTransform: 'uppercase', letterSpacing: '0.15em' }}
                  />
                </label>
                <button className="primary" type="submit">Join movie night</button>
                <p className="join-toggle">
                  Starting fresh? <button type="button" onClick={() => setShowJoinForm(false)}>Create a room</button>
                </p>
              </>
            ) : (
              <>
                <button className="primary" type="submit">Create room</button>
                <p className="join-toggle">
                  Already invited? <button type="button" onClick={() => setShowJoinForm(true)}>Enter a code</button>
                </p>
              </>
            )}
          </form>

          {copyStatus && <p className="status-toast" role="status">{copyStatus}</p>}
        </section>
      </main>
    )
  }

  // Room View
  return (
    <main className="app-shell" aria-labelledby="room-title">
      <header className="room-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">▶</span>
          <div>
            <span className="brand-name">Watch Sync</span>
            <span className="mode-label">{manualModeLabel}</span>
          </div>
        </div>
        <button className="room-pill" type="button" onClick={copyInvite} aria-label="Copy invite link">
          <span>{room.roomId}</span>
          <small>Invite</small>
        </button>
      </header>

      <section className="room-strip" aria-label="Room status">
        <span className={`connection-dot ${transportStatus === 'connected' ? '' : 'offline'}`} />
        <span>{transportStatus === 'connected' ? 'Live room connected' : 'Private local room'}</span>
        <span className="strip-divider" aria-hidden="true" />
        <span>{readyCount}/{Math.max(people.length, 2)} ready</span>
      </section>


      <section className="countdown-hero" aria-live="polite" aria-label="Countdown">
        <div className="hero-copy">
          <p className="countdown-label">
            {room.countdownState.phase === 'idle' ? 'Both pause at' : room.countdownState.phase === 'counting' ? 'Ready in' : 'Press play'}
          </p>
          <div className={`countdown-number ${getCountdownClass()}`} id="room-title">
            {countdownDisplay()}
          </div>
          <p className="countdown-hint">{getCountdownHint()}</p>
        </div>

        <div className="partner-status" aria-label="Partner ready status">
          {people.map((person) => (
            <span
              className={`partner-chip ${room.readyState[person.id] === 'ready' ? 'ready' : ''} ${person.id === currentParticipantId ? 'you' : ''}`}
              key={person.id}
            >
              <span className="status-dot" />
              <span>{person.displayName}{person.id === currentParticipantId ? ' (you)' : ''}</span>
            </span>
          ))}
          {people.length < 2 && <span className="partner-chip ghost"><span className="status-dot" />Waiting for partner</span>}
        </div>

        <button
          className={`ready-button ${isReady ? 'is-ready' : ''}`}
          type="button"
          onClick={toggleReady}
        >
          {isReady ? 'Ready — tap to undo' : "I'm ready"}
        </button>

        {isSoloRoom && room.countdownState.phase !== 'counting' && (
          <div className="solo-preview">
            <button type="button" onClick={trySoloCountdown}>Try solo countdown</button>
            <p>Preview only — real sync starts when both partners are ready.</p>
          </div>
        )}
      </section>

      {setupOpen && (
        <section className="setup-sheet" aria-label="Room setup">
          <div className="setup-section invite-card">
            <div>
              <p className="eyebrow">Invite</p>
              <h2>Send the room, then ready up together.</h2>
              <p>Manual sync works with any TV. Auto-sync is for supported browser tabs.</p>
            </div>
            <button className="copy-button" type="button" onClick={copyInvite}>Copy invite</button>
          </div>

          <form className="setup-section time-card" onSubmit={saveSetup}>
            <div>
              <p className="eyebrow">Pause time</p>
              <h2>Set the timestamp both screens should pause at.</h2>
            </div>
            <div className="time-input-row">
              <input
                value={setupDraft.targetTimestamp}
                onChange={(event) => setSetupDraft({ ...setupDraft, targetTimestamp: event.target.value })}
                placeholder="00:00"
                inputMode="numeric"
                aria-label="Pause time"
              />
              <button type="submit">Set</button>
            </div>
          </form>
        </section>
      )}

      {room.lastSignal && (
        <section className="alert-banner" role="status">
          <strong>{room.lastSignal.actorName}</strong>
          <span>{room.lastSignal.message}</span>
        </section>
      )}

      <section className="control-stack" aria-label="Room controls">
        <div className="quick-actions">
          <button className="secondary-action" type="button" onClick={() => setShowChat(!showChat)} aria-expanded={showChat}>
            <span>Chat</span>
            {chatMessages.length > 0 && <small>{chatMessages.length}</small>}
          </button>
          <button className="secondary-action" type="button" onClick={requestResync}>Resync</button>
          <button className="secondary-action" type="button" onClick={() => setShowSetupSheet(!showSetupSheet)} aria-expanded={setupOpen}>
            Time
          </button>
        </div>

        {showChat && (
          <div className="chat-panel">
            <div className="chat-messages" aria-live="polite">
              {chatMessages.length === 0 ? (
                <p className="chat-empty">A tiny backchannel for “pause?” and “ready”.</p>
              ) : chatMessages.map((messageEvent) => (
                <div
                  className={`chat-bubble ${messageEvent.actorId === currentParticipantId ? 'sent' : 'received'}`}
                  key={`${messageEvent.at}-${messageEvent.actorId}`}
                >
                  {messageEvent.actorId !== currentParticipantId && (
                    <span className="sender">{room.participants[messageEvent.actorId]?.displayName ?? 'Partner'}</span>
                  )}
                  {messageEvent.message}
                </div>
              ))}
            </div>
            <form className="chat-input-row" onSubmit={sendChatMessage}>
              <input
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                placeholder="Message..."
                maxLength={160}
                aria-label="Chat message"
              />
              <button type="submit" aria-label="Send">Send</button>
            </form>
          </div>
        )}

        <div className="laptop-drawer">
          <button
            className={`drawer-toggle ${showLaptopDrawer ? 'open' : ''}`}
            type="button"
            onClick={() => setShowLaptopDrawer(!showLaptopDrawer)}
            aria-expanded={showLaptopDrawer}
          >
            <span>Laptop auto-sync</span>
            <small>Supported browser tabs only</small>
          </button>

          {showLaptopDrawer && (
            <div className="drawer-content">
              <p>
                Manual mode works with any TV. Auto-sync only works on supported browser tabs where the Chrome extension can access an HTML5 video.
              </p>
              <dl className="pairing-info">
                <div className="pairing-row">
                  <dt>Room code</dt>
                  <dd>{room.roomId}</dd>
                </div>
                <div className="pairing-row">
                  <dt>Participant ID</dt>
                  <dd>{currentParticipantId || 'Join/create first'}</dd>
                </div>
                <div className="pairing-row">
                  <dt>WebSocket URL</dt>
                  <dd>{realtimeUrl}</dd>
                </div>
              </dl>
              <button type="button" onClick={copyPairingDetails}>Copy pairing details</button>

              <div className="extension-status">
                {localPlayback
                  ? `Playback: ${localPlayback.paused ? 'paused' : 'playing'} at ${localPlayback.currentTime.toFixed(1)}s`
                  : pairedExtensions.length > 0
                    ? `Extension paired: ${pairedExtensions.map((ext) => ext.tabTitle || ext.extensionId).join(', ')}`
                    : 'Extension status: not paired yet.'}
              </div>
            </div>
          )}
        </div>
      </section>

      {copyStatus && <p className="status-toast floating" role="status">{copyStatus}</p>}
    </main>
  )
}

export default App
