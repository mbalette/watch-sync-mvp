let socket = null
let paired = null
let reconnectTimer = null
let lastEventCursor = ''
let lastStatusSentAt = 0

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then((result) => sendResponse(result)).catch((error) => {
    setStatus(`Extension error: ${error.message}`)
    sendResponse({ ok: false, error: error.message })
  })
  return true
})

async function handleMessage(message, sender) {
  if (!message || typeof message.type !== 'string') throw new Error('Invalid extension message')
  if (message.type === 'pair_tab') return pairTab(message)
  if (message.type === 'detect_video') return sendToTab(message.tabId, { type: 'detect' })
  if (message.type === 'video_status') return publishPlaybackStatus(message.status, sender.tab)
  if (message.type === 'content_error') return publishExtensionError(message.message || 'Content script error')
  return { ok: false, error: 'Unknown extension message' }
}

async function pairTab(message) {
  const tabId = Number(message.tabId)
  if (!tabId) throw new Error('Missing active tab id')
  paired = {
    tabId,
    wsUrl: String(message.wsUrl || 'ws://127.0.0.1:8787'),
    roomCode: String(message.roomCode || '').trim().toUpperCase(),
    participantId: String(message.participantId || '').trim(),
    extensionId: await getExtensionId(),
    tabTitle: String(message.tabTitle || ''),
    urlOrigin: safeOrigin(message.tabUrl),
  }
  if (!paired.roomCode || !paired.participantId) throw new Error('Room code and participant ID are required')
  await injectContentScript(tabId)
  await sendToTab(tabId, { type: 'detect' })
  connectSocket()
  await chrome.storage.local.set({ ...paired, status: 'Pairing WebSocket...' })
  return { ok: true }
}

async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content_script.js'] })
  } catch (error) {
    const message = String(error?.message || error)
    if (!message.includes('Cannot access') && !message.includes('The extensions gallery')) throw error
    throw new Error(`Cannot inject content script on this page: ${message}`)
  }
}

function connectSocket() {
  clearTimeout(reconnectTimer)
  if (!paired) return
  if (socket) socket.close()
  socket = new WebSocket(paired.wsUrl)
  socket.addEventListener('open', () => {
    setStatus('WebSocket connected. Pairing room...')
    socket.send(JSON.stringify({
      type: 'pair_extension',
      roomId: paired.roomCode,
      participantId: paired.participantId,
      extensionId: paired.extensionId,
      capabilities: { html5Video: true, play: true, pause: true, seek: true },
      tabTitle: paired.tabTitle,
      urlOrigin: paired.urlOrigin,
    }))
  })
  socket.addEventListener('message', (event) => handleSocketMessage(event.data))
  socket.addEventListener('error', () => setStatus('WebSocket error. Check the local realtime server URL.'))
  socket.addEventListener('close', () => {
    setStatus('WebSocket closed. Reconnect will be attempted while popup/service worker is alive.')
    reconnectTimer = setTimeout(connectSocket, 2000)
  })
}

function handleSocketMessage(raw) {
  try {
    const message = JSON.parse(raw)
    if (message.type === 'error') {
      setStatus(`Server error: ${message.message}`)
      return
    }
    if (message.type !== 'room_snapshot' || !message.room) return
    setStatus('Extension paired. Watching room events.')
    replayNewRoomEvents(message.room)
  } catch (error) {
    setStatus(`Bad server message: ${error.message}`)
  }
}

function replayNewRoomEvents(room) {
  const events = Array.isArray(room.eventLog) ? room.eventLog : []
  events.forEach((event, index) => {
    const cursor = `${room.updatedAt || ''}:${events.length}:${index}:${event.type}:${event.at || ''}`
    if (cursor <= lastEventCursor) return
    handleRoomEvent(event, room)
    lastEventCursor = cursor
  })
}

function handleRoomEvent(event, room) {
  if (!paired || !event || typeof event.type !== 'string') return
  if (event.type === 'extension_paired' || event.type === 'playback_status' || event.type === 'extension_error') return
  if (event.type === 'countdown_started') {
    const delayMs = Math.max(0, Number(event.startsAtEpochMs || Date.now()) + Number(event.durationSeconds || 0) * 1000 - Date.now())
    sendToTab(paired.tabId, { type: 'schedulePlay', delayMs }).catch(reportError)
    return
  }
  if (event.type === 'play_now') sendToTab(paired.tabId, { type: 'play' }).catch(reportError)
  if (event.type === 'pause_requested' || event.type === 'buffering_started') sendToTab(paired.tabId, { type: 'pause' }).catch(reportError)
  if (event.type === 'setup_updated') sendSeekIfParseable(event.setup?.targetTimestamp)
  if (event.type === 'timestamp_submitted') sendSeekIfParseable(event.timestamp)
  if (event.type === 'resync_requested') {
    sendToTab(paired.tabId, { type: 'pause' }).catch(reportError)
    sendSeekIfParseable(event.timestamp || room.targetTimestamp)
  }
}

function sendSeekIfParseable(timestamp) {
  const seconds = parseTimestamp(timestamp)
  if (seconds !== null && paired) sendToTab(paired.tabId, { type: 'seek', seconds }).catch(reportError)
}

async function publishPlaybackStatus(status, tab) {
  if (!paired || !socket || socket.readyState !== WebSocket.OPEN) return { ok: false, error: 'Not paired or socket closed' }
  const now = Date.now()
  if (now - lastStatusSentAt < 900 && !status?.force) return { ok: true, throttled: true }
  lastStatusSentAt = now
  socket.send(JSON.stringify({
    type: 'room_event',
    roomId: paired.roomCode,
    event: {
      type: 'playback_status',
      actorId: paired.participantId,
      extensionId: paired.extensionId,
      paused: Boolean(status.paused),
      currentTime: Number(status.currentTime || 0),
      duration: finiteOrUndefined(status.duration),
      playbackRate: finiteOrUndefined(status.playbackRate),
      readyState: finiteOrUndefined(status.readyState),
      seeking: Boolean(status.seeking),
      ended: Boolean(status.ended),
      tabTitle: tab?.title || paired.tabTitle,
      urlOrigin: paired.urlOrigin,
      at: new Date().toISOString(),
    },
  }))
  return { ok: true }
}

function publishExtensionError(message) {
  reportError(new Error(message))
  return { ok: true }
}

function reportError(error) {
  const message = error?.message || String(error)
  setStatus(`Extension error: ${message}`)
  if (!paired || !socket || socket.readyState !== WebSocket.OPEN) return
  socket.send(JSON.stringify({
    type: 'room_event',
    roomId: paired.roomCode,
    event: { type: 'extension_error', actorId: paired.participantId, extensionId: paired.extensionId, message, at: new Date().toISOString() },
  }))
}

async function sendToTab(tabId, message) {
  await chrome.tabs.sendMessage(tabId, message)
  return { ok: true }
}

async function getExtensionId() {
  const stored = await chrome.storage.local.get({ extensionId: '' })
  if (stored.extensionId) return stored.extensionId
  const id = `ext_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`
  await chrome.storage.local.set({ extensionId: id })
  return id
}

function safeOrigin(url) {
  try {
    return new URL(url).origin
  } catch {
    return ''
  }
}

function finiteOrUndefined(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function parseTimestamp(value) {
  if (typeof value !== 'string') return null
  const parts = value.trim().split(':').map((part) => Number(part))
  if (parts.length < 1 || parts.length > 3 || parts.some((part) => !Number.isFinite(part) || part < 0)) return null
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] * 3600 + parts[1] * 60 + parts[2]
}

function setStatus(status) {
  chrome.storage.local.set({ status }).catch(() => {})
}
