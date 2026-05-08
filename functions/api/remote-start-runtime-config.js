const boolFromEnv = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase())
}

const audienceFromEnv = (value) => {
  if (value === 'all' || value === 'internal' || value === 'off') return value
  return 'internal'
}

export async function onRequestGet({ env }) {
  let kvConfig = {}
  if (env.REMOTE_START_CONFIG?.get) {
    try {
      kvConfig = JSON.parse(await env.REMOTE_START_CONFIG.get('runtime') || '{}')
    } catch {
      kvConfig = {}
    }
  }

  const envConfig = {
    remoteStartPublicEnabled: boolFromEnv(env.REMOTE_START_PUBLIC_ENABLED, false),
    remoteStartRuntimeBetaAudience: audienceFromEnv(env.REMOTE_START_RUNTIME_BETA_AUDIENCE),
    remoteStartKillSwitchEnabled: boolFromEnv(env.REMOTE_START_KILL_SWITCH_ENABLED, false),
    rokuRuntimeBetaEnabled: boolFromEnv(env.ROKU_RUNTIME_BETA_ENABLED, true),
    vizioRuntimeBetaEnabled: boolFromEnv(env.VIZIO_RUNTIME_BETA_ENABLED, false),
    lgRuntimeBetaEnabled: boolFromEnv(env.LG_RUNTIME_BETA_ENABLED, false),
    samsungRuntimeBetaEnabled: boolFromEnv(env.SAMSUNG_RUNTIME_BETA_ENABLED, false),
    sonyRuntimeBetaEnabled: boolFromEnv(env.SONY_RUNTIME_BETA_ENABLED, false),
  }

  const config = { ...envConfig, ...kvConfig }

  return new Response(JSON.stringify(config), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    },
  })
}
