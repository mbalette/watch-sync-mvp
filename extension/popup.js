const defaults = { wsUrl: 'ws://127.0.0.1:8787', roomCode: '', participantId: '' }
const fields = {
  wsUrl: document.getElementById('wsUrl'),
  roomCode: document.getElementById('roomCode'),
  participantId: document.getElementById('participantId'),
}
const statusEl = document.getElementById('status')

init().catch((error) => setStatus(`Popup error: ${error.message}`))

async function init() {
  const stored = await chrome.storage.local.get({ ...defaults, status: 'Idle.' })
  fields.wsUrl.value = stored.wsUrl
  fields.roomCode.value = stored.roomCode
  fields.participantId.value = stored.participantId
  setStatus(stored.status || 'Idle.')

  for (const [key, input] of Object.entries(fields)) {
    input.addEventListener('input', () => chrome.storage.local.set({ [key]: input.value.trim() }))
  }

  document.getElementById('pairButton').addEventListener('click', pairTab)
  document.getElementById('detectButton').addEventListener('click', detectVideo)

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.status) setStatus(changes.status.newValue || '')
  })
}

async function pairTab() {
  try {
    const settings = readSettings()
    if (!settings.wsUrl || !settings.roomCode || !settings.participantId) throw new Error('Enter WebSocket URL, room code, and participant ID.')
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) throw new Error('No active tab found.')
    await chrome.storage.local.set(settings)
    await chrome.runtime.sendMessage({ type: 'pair_tab', tabId: tab.id, tabTitle: tab.title || '', tabUrl: tab.url || '', ...settings })
    setStatus('Pairing requested...')
  } catch (error) {
    setStatus(`Pair failed: ${error.message}`)
  }
}

async function detectVideo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) throw new Error('No active tab found.')
    await chrome.runtime.sendMessage({ type: 'detect_video', tabId: tab.id })
    setStatus('Detecting video...')
  } catch (error) {
    setStatus(`Detect failed: ${error.message}`)
  }
}

function readSettings() {
  return {
    wsUrl: fields.wsUrl.value.trim() || defaults.wsUrl,
    roomCode: fields.roomCode.value.trim().toUpperCase(),
    participantId: fields.participantId.value.trim(),
  }
}

function setStatus(message) {
  statusEl.textContent = message
  chrome.storage.local.set({ status: message }).catch(() => {})
}
