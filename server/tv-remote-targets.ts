export type TvRemoteTargetId =
  | 'roku-ecp'
  | 'lg-webos-experimental'
  | 'samsung-tizen-beta'
  | 'cast-session'
  | 'adb-helper-advanced'
  | 'sony-bravia-beta'
  | 'philips-jointspace-experimental'
  | 'vizio-smartcast-experimental'
  | 'vidaa-remotenow-research'
  | 'apple-tv-manual-only'
  | 'xbox-account-pairing-beta'
  | 'cable-isp-manual-only'

export type TvRemoteBuildPriority = 'build-now' | 'primary-beta' | 'guided-setup-beta' | 'reverse-engineered-beta' | 'account-pairing-beta' | 'later-beta' | 'manual-only' | 'not-supported-yet' | 'research'
export type TvRemoteProtocolStatus = 'official' | 'semi-official' | 'unofficial' | 'reverse-engineered' | 'account-pairing' | 'session-scoped' | 'manual-only' | 'not-supported-yet'

export interface TvRemoteCommandSpec {
  id: string
  label: string
  command: string
  riskyToggle?: boolean
  goSafe?: boolean
  notes: string
}

export interface TvRemoteTargetSpec {
  id: TvRemoteTargetId
  label: string
  priority: TvRemoteBuildPriority
  protocolStatus: TvRemoteProtocolStatus
  implementedInHelper: boolean
  hardwareValidated: boolean
  pairing: string
  pwaFeasible: 'yes' | 'limited' | 'no'
  nativeFeasible: 'yes' | 'limited' | 'no'
  localHelperFeasible: 'yes' | 'limited' | 'no'
  exactProtocol: string
  commands: TvRemoteCommandSpec[]
  safeClaim: string
  caveats: string[]
  evidenceUrls: string[]
}

export const TV_REMOTE_TARGETS: TvRemoteTargetSpec[] = [
  {
    id: 'roku-ecp',
    label: 'Roku / Roku TV',
    priority: 'primary-beta',
    protocolStatus: 'official',
    implementedInHelper: true,
    hardwareValidated: false,
    pairing: 'Usually none; Roku Control by mobile apps/network setting must allow ECP.',
    pwaFeasible: 'limited',
    nativeFeasible: 'yes',
    localHelperFeasible: 'yes',
    exactProtocol: 'HTTP ECP on port 8060: GET /query/device-info; POST /keypress/Play.',
    commands: [
      { id: 'roku-play', label: 'Play', command: 'POST /keypress/Play', goSafe: true, notes: 'Current MVP GO command. Treat discrete Pause/PlayPause as unverified until docs + hardware prove it.' },
    ],
    safeClaim: 'Roku Remote Start beta can send local Play after the user manually opens and pauses the show; real TV/app behavior remains hardware-unverified.',
    caveats: ['No content selection or timestamp control.', 'Hosted HTTPS PWA may not be able to reach LAN HTTP directly.'],
    evidenceUrls: ['https://developer.roku.com/en-ca/docs/developer-program/dev-tools/external-control-api.md'],
  },
  {
    id: 'lg-webos-experimental',
    label: 'LG webOS',
    priority: 'primary-beta',
    protocolStatus: 'semi-official',
    implementedInHelper: true,
    hardwareValidated: false,
    pairing: 'PROMPT pairing over webOS second-screen WebSocket; TV returns client-key for local storage.',
    pwaFeasible: 'no',
    nativeFeasible: 'yes',
    localHelperFeasible: 'yes',
    exactProtocol: 'WebSocket SSAP, commonly ws://host:3000 or wss://host:3001; register with manifest, then request ssap://media.controls/play.',
    commands: [
      { id: 'lg-play', label: 'Play', command: 'ssap://media.controls/play', goSafe: true, notes: 'Good Phase 2 candidate after mock + hardware validation.' },
      { id: 'lg-pause', label: 'Pause', command: 'ssap://media.controls/pause', notes: 'Useful for tests/settings, but countdown GO should use play only.' },
    ],
    safeClaim: 'Some LG webOS TVs may support generic media play/pause after local pairing.',
    caveats: ['Raw SSAP details are verified from Connect SDK source/community implementations, not a compact standalone public LG protocol page.', 'Model/firmware behavior varies.'],
    evidenceUrls: [
      'https://webostv.developer.lge.com/develop/guides/connect-sdk-guide',
      'https://github.com/ConnectSDK/Connect-SDK-iOS-Core',
      'https://github.com/hobbyquaker/lgtv2',
    ],
  },
  {
    id: 'samsung-tizen-beta',
    label: 'Samsung Smart TV / Tizen',
    priority: 'primary-beta',
    protocolStatus: 'unofficial',
    implementedInHelper: true,
    hardwareValidated: false,
    pairing: 'TV approval prompt; optional token on newer models, stored locally only.',
    pwaFeasible: 'no',
    nativeFeasible: 'limited',
    localHelperFeasible: 'yes',
    exactProtocol: 'Unofficial WebSocket ms.remote.control on /api/v2/channels/samsung.remote.control, usually ports 8001/8002.',
    commands: [
      { id: 'samsung-play', label: 'Play', command: 'KEY_PLAY', goSafe: true, notes: 'Experimental beta only; do not call official Samsung support.' },
      { id: 'samsung-pause', label: 'Pause', command: 'KEY_PAUSE', notes: 'Manual/test only until hardware matrix proves reliability.' },
    ],
    safeClaim: 'Samsung Remote Start beta may send generic remote keys after local TV approval on supported models; do not call it official or universally supported.',
    caveats: ['LAN protocol is community documented/unofficial for external apps.', 'Token and port behavior vary by model and firmware.'],
    evidenceUrls: [
      'https://developer.samsung.com/smarttv/develop/guides/user-interaction/remote-control.html',
      'https://github.com/Ape/samsungctl',
      'https://github.com/Toxblh/samsung-tv-remote',
    ],
  },
  {
    id: 'cast-session',
    label: 'Chromecast / Google Cast session',
    priority: 'manual-only',
    protocolStatus: 'session-scoped',
    implementedInHelper: false,
    hardwareValidated: false,
    pairing: 'User starts/joins a Cast session; controls only active Cast media session.',
    pwaFeasible: 'limited',
    nativeFeasible: 'yes',
    localHelperFeasible: 'limited',
    exactProtocol: 'Google Cast sender SDK media.play()/media.pause() on current Cast media session.',
    commands: [
      { id: 'cast-play', label: 'Play Cast session', command: 'chrome.cast.media.Media.play()', goSafe: true, notes: 'Only for Cast sessions Watch Sync owns/joins; not arbitrary TV app control.' },
    ],
    safeClaim: 'Watch Sync can control playback for Cast sessions it starts or joins.',
    caveats: ['Not generic Android TV/Google TV/native streaming app control.', 'Requires a Cast sender/session UX.'],
    evidenceUrls: ['https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.Media'],
  },
  {
    id: 'adb-helper-advanced',
    label: 'Fire TV / Android TV / Google TV ADB helper',
    priority: 'guided-setup-beta',
    protocolStatus: 'official',
    implementedInHelper: true,
    hardwareValidated: false,
    pairing: 'Developer options, wireless debugging/ADB auth/pairing required.',
    pwaFeasible: 'no',
    nativeFeasible: 'no',
    localHelperFeasible: 'yes',
    exactProtocol: 'adb connect <host[:port]>, then adb -s <host[:port]> shell input keyevent KEYCODE_MEDIA_PLAY (126) for GO or KEYCODE_MEDIA_PAUSE (127) for safe pause. Do not use KEYCODE_MEDIA_PLAY_PAUSE/85 for GO.',
    commands: [
      { id: 'adb-play', label: 'ADB media play', command: 'adb -s <host[:port]> shell input keyevent KEYCODE_MEDIA_PLAY (126)', goSafe: true, notes: 'Advanced technical-user helper only; discrete Play avoids toggle risk at GO.' },
      { id: 'adb-pause', label: 'ADB media pause', command: 'adb -s <host[:port]> shell input keyevent KEYCODE_MEDIA_PAUSE (127)', notes: 'Optional manual setup/test helper after ADB authorization.' },
      { id: 'adb-toggle', label: 'ADB play/pause toggle', command: 'adb shell input keyevent KEYCODE_MEDIA_PLAY_PAUSE (85)', riskyToggle: true, notes: 'Avoid for GO because duplicate toggles can pause instead of play.' },
    ],
    safeClaim: 'Guided setup beta can send discrete ADB media Play after the owner enables debugging/pairing; some devices may need reconnect and Fire TV Vega is not supported yet.',
    caveats: ['Guided wizard can help, but setup still uses developer/debugging concepts.', 'Should not be marketed as normal Fire TV/Android TV support.'],
    evidenceUrls: ['https://developer.android.com/tools/adb', 'https://developer.android.com/reference/android/view/KeyEvent', 'https://developer.amazon.com/docs/fire-tv/connecting-adb-to-device.html'],
  },
  {
    id: 'sony-bravia-beta',
    label: 'Sony / Bravia IP Control',
    priority: 'primary-beta',
    protocolStatus: 'official',
    implementedInHelper: true,
    hardwareValidated: false,
    pairing: 'Enable IP Control; often PSK via X-Auth-PSK or model-specific auth.',
    pwaFeasible: 'no',
    nativeFeasible: 'yes',
    localHelperFeasible: 'yes',
    exactProtocol: 'Sony JSON-RPC/IRCC-IP under /sony/* with remote codes from getRemoteControllerInfo.',
    commands: [
      { id: 'sony-play', label: 'Play IRCC', command: 'IRCC Play code from getRemoteControllerInfo', goSafe: true, notes: 'Best non-Roku brand-specific candidate after LG.' },
    ],
    safeClaim: 'Supported Bravia IP Control displays may receive generic remote keys after IP Control is enabled.',
    caveats: ['Official docs strongest for Professional Displays; consumer models vary.'],
    evidenceUrls: ['https://pro-bravia.sony.net/remote-display-control/', 'https://pro-bravia.sony.net/remote-display-control/ircc-ip/'],
  },
  {
    id: 'philips-jointspace-experimental',
    label: 'Philips JointSpace',
    priority: 'later-beta',
    protocolStatus: 'semi-official',
    implementedInHelper: true,
    hardwareValidated: false,
    pairing: 'Varies by API generation: none, PIN, digest/auth, HTTP 1925 or HTTPS 1926.',
    pwaFeasible: 'no',
    nativeFeasible: 'limited',
    localHelperFeasible: 'yes',
    exactProtocol: 'JointSpace POST /<api-version>/input/key with JSON body such as {"key":"PlayPause"}.',
    commands: [
      { id: 'philips-playpause', label: 'Play/Pause', command: 'POST /6/input/key {"key":"PlayPause"}', riskyToggle: true, notes: 'Toggle only; not ideal for countdown GO unless staged state is guaranteed.' },
    ],
    safeClaim: 'Some Philips TVs with JointSpace may support generic remote keys.',
    caveats: ['Niche/model-specific.', 'Toggle command can be risky for GO.'],
    evidenceUrls: ['https://jointspace.sourceforge.net/download.html'],
  },
  {
    id: 'vizio-smartcast-experimental',
    label: 'Vizio SmartCast',
    priority: 'later-beta',
    protocolStatus: 'unofficial',
    implementedInHelper: true,
    hardwareValidated: false,
    pairing: 'PIN pairing/token; token stored locally only.',
    pwaFeasible: 'no',
    nativeFeasible: 'limited',
    localHelperFeasible: 'yes',
    exactProtocol: 'Community HTTPS REST, commonly ports 7345/9000; PUT /key_command/ with code set/key codes.',
    commands: [
      { id: 'vizio-play', label: 'Play', command: 'PUT /key_command/ with community-documented Play code', goSafe: true, notes: 'Implement only as experimental after mock envelope tests.' },
    ],
    safeClaim: 'Some Vizio SmartCast TVs may support generic keys after local pairing.',
    caveats: ['Public consumer LAN remote API unclear; community documented.', 'TLS/cert and model behavior vary.'],
    evidenceUrls: ['https://api.developer.external.plat.vizio.com/', 'https://github.com/exiva/Vizio_SmartCast_API'],
  },
  {
    id: 'vidaa-remotenow-research',
    label: 'Hisense VIDAA / RemoteNow',
    priority: 'research',
    protocolStatus: 'unofficial',
    implementedInHelper: false,
    hardwareValidated: false,
    pairing: 'Unofficial PIN/pairing; MQTT/MQTTS behavior varies.',
    pwaFeasible: 'no',
    nativeFeasible: 'limited',
    localHelperFeasible: 'limited',
    exactProtocol: 'Community RemoteNow/VIDAA MQTT/MQTTS on port 36669 with /remoteapp topics.',
    commands: [],
    safeClaim: 'Support depends on the TV operating system; Hisense/TCL Roku models use Roku path, Google TV models use Cast/ADB limits, VIDAA remains research.',
    caveats: ['Do not market brand-wide Hisense/TCL support.', 'OS detection matters more than brand.'],
    evidenceUrls: [],
  },
  {
    id: 'apple-tv-manual-only',
    label: 'Apple TV',
    priority: 'manual-only',
    protocolStatus: 'manual-only',
    implementedInHelper: false,
    hardwareValidated: false,
    pairing: 'No public App-Store-safe generic LAN remote path verified; pyatv-style pairing remains reverse-engineered beta only if separately accepted.',
    pwaFeasible: 'no',
    nativeFeasible: 'no',
    localHelperFeasible: 'limited',
    exactProtocol: 'pyatv-style reverse-engineered protocols exist but are not public headline support and are not implemented in the helper.',
    commands: [],
    safeClaim: 'Manual countdown by default. Optional Apple TV beta requires explicit reverse-engineered-pairing acceptance and hardware validation.',
    caveats: ['Do not claim official Apple TV remote support.', 'Do not use private Apple APIs.'],
    evidenceUrls: ['https://github.com/postlund/pyatv'],
  },
  {
    id: 'xbox-account-pairing-beta',
    label: 'Xbox One / Series account-pairing beta',
    priority: 'manual-only',
    protocolStatus: 'account-pairing',
    implementedInHelper: false,
    hardwareValidated: false,
    pairing: 'Xbox account/OAuth-style setup plus console Remote Features; not D2C headline support.',
    pwaFeasible: 'no',
    nativeFeasible: 'limited',
    localHelperFeasible: 'limited',
    exactProtocol: 'Xbox Network/account-paired remote commands are possible through integrations, but no Watch Sync helper adapter is implemented.',
    commands: [],
    safeClaim: 'Manual countdown by default. Optional Xbox beta requires account/Remote Features acceptance and hardware validation.',
    caveats: ['Do not headline Xbox support.', 'Requires account and console settings.'],
    evidenceUrls: ['https://www.home-assistant.io/integrations/xbox/'],
  },
  {
    id: 'cable-isp-manual-only',
    label: 'Cable / ISP boxes',
    priority: 'manual-only',
    protocolStatus: 'manual-only',
    implementedInHelper: false,
    hardwareValidated: false,
    pairing: 'No public generic third-party remote path established.',
    pwaFeasible: 'no',
    nativeFeasible: 'no',
    localHelperFeasible: 'no',
    exactProtocol: 'Provider-specific remotes only; Watch Sync public path is manual countdown.',
    commands: [],
    safeClaim: 'Manual countdown only.',
    caveats: ['Do not claim direct control for Xfinity, Spectrum, Cox, DirecTV, or arbitrary ISP boxes.'],
    evidenceUrls: [],
  },
]

export function getTvRemoteTarget(id: TvRemoteTargetId): TvRemoteTargetSpec {
  const target = TV_REMOTE_TARGETS.find((candidate) => candidate.id === id)
  if (!target) throw new Error(`Unknown TV remote target: ${id}`)
  return target
}

export function helperAdvertisedTargets(): TvRemoteTargetId[] {
  return TV_REMOTE_TARGETS.filter((target) => target.implementedInHelper).map((target) => target.id)
}

export function uiVisibleTargets(): TvRemoteTargetSpec[] {
  return TV_REMOTE_TARGETS.filter((target) => ['primary-beta', 'guided-setup-beta'].includes(target.priority))
}

export function safeGoCommand(targetId: TvRemoteTargetId): TvRemoteCommandSpec | undefined {
  return getTvRemoteTarget(targetId).commands.find((command) => command.goSafe && !command.riskyToggle)
}
