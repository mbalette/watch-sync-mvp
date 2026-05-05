(() => {
  if (window.__watchSyncContentLoaded) return
  window.__watchSyncContentLoaded = true

  let video = null
  let scheduleTimer = null
  let lastReportAt = 0

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    handleCommand(message).then((result) => sendResponse(result)).catch((error) => {
      reportError(error.message || String(error))
      sendResponse({ ok: false, error: error.message || String(error) })
    })
    return true
  })

  async function handleCommand(message) {
    if (!message || typeof message.type !== 'string') throw new Error('Invalid content command')
    if (message.type === 'detect') {
      video = findBestVideo()
      if (!video) throw new Error('No usable HTML5 <video> found on this tab')
      attachVideoListeners(video)
      reportStatus(true)
      return { ok: true, found: true }
    }
    const current = ensureVideo()
    if (message.type === 'play') {
      await current.play()
      reportStatus(true)
      return { ok: true }
    }
    if (message.type === 'pause') {
      current.pause()
      reportStatus(true)
      return { ok: true }
    }
    if (message.type === 'seek') {
      const seconds = Number(message.seconds)
      if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Invalid seek timestamp')
      current.currentTime = Math.min(seconds, Number.isFinite(current.duration) ? current.duration : seconds)
      reportStatus(true)
      return { ok: true }
    }
    if (message.type === 'schedulePlay') {
      clearTimeout(scheduleTimer)
      const delayMs = Math.max(0, Number(message.delayMs || 0))
      scheduleTimer = setTimeout(() => {
        ensureVideo().play().then(() => reportStatus(true)).catch((error) => reportError(`Scheduled play failed: ${error.message || error}`))
      }, delayMs)
      return { ok: true, delayMs }
    }
    throw new Error(`Unknown content command: ${message.type}`)
  }

  function ensureVideo() {
    if (video && isUsableVideo(video)) return video
    video = findBestVideo()
    if (!video) throw new Error('No usable HTML5 <video> found on this tab')
    attachVideoListeners(video)
    return video
  }

  function findBestVideo() {
    const videos = Array.from(document.querySelectorAll('video')).filter(isUsableVideo)
    videos.sort((a, b) => videoScore(b) - videoScore(a))
    return videos[0] || null
  }

  function isUsableVideo(candidate) {
    return candidate instanceof HTMLVideoElement && candidate.readyState >= 0 && candidate.offsetWidth >= 1 && candidate.offsetHeight >= 1
  }

  function videoScore(candidate) {
    const rect = candidate.getBoundingClientRect()
    const area = Math.max(1, rect.width * rect.height)
    const hasSource = candidate.currentSrc || candidate.src ? 1000000 : 0
    return area + hasSource
  }

  function attachVideoListeners(target) {
    if (target.__watchSyncAttached) return
    target.__watchSyncAttached = true
    ;['play', 'pause', 'seeked', 'timeupdate', 'ratechange', 'ended', 'loadedmetadata', 'waiting', 'playing'].forEach((eventName) => {
      target.addEventListener(eventName, () => reportStatus(eventName !== 'timeupdate'))
    })
  }

  function reportStatus(force = false) {
    const current = video || findBestVideo()
    if (!current) return
    const now = Date.now()
    if (!force && now - lastReportAt < 1000) return
    lastReportAt = now
    chrome.runtime.sendMessage({
      type: 'video_status',
      status: {
        force,
        paused: current.paused,
        currentTime: finiteOrUndefined(current.currentTime) || 0,
        duration: finiteOrUndefined(current.duration),
        playbackRate: finiteOrUndefined(current.playbackRate),
        readyState: finiteOrUndefined(current.readyState),
        seeking: current.seeking,
        ended: current.ended,
      },
    }).catch((error) => console.debug('watch-sync status failed', error))
  }

  function reportError(message) {
    chrome.runtime.sendMessage({ type: 'content_error', message }).catch(() => {})
  }

  function finiteOrUndefined(value) {
    const number = Number(value)
    return Number.isFinite(number) ? number : undefined
  }
})()
