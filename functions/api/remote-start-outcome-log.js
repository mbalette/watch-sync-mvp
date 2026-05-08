const SAFE_KEYS = new Set([
  "type",
  "platform",
  "deviceType",
  "deviceModel",
  "streamingApp",
  "testPlayResult",
  "goResult",
  "failureCode",
  "manualPlayFallbackUsed",
  "wrongScreenOrOverlay",
  "timestamp",
  "appVersion",
]);

function sanitize(input) {
  const clean = {};
  if (!input || typeof input !== "object") return clean;
  for (const [key, value] of Object.entries(input)) {
    if (!SAFE_KEYS.has(key)) continue;
    if (
      typeof value === "string" ||
      typeof value === "boolean" ||
      typeof value === "number"
    )
      clean[key] = value;
  }
  clean.timestamp =
    typeof clean.timestamp === "string"
      ? clean.timestamp
      : new Date().toISOString();
  return clean;
}

export async function onRequestPost({ request, env }) {
  const payload = sanitize(await request.json().catch(() => ({})));
  if (!payload.type) {
    return new Response(JSON.stringify({ ok: false, error: "missing_type" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const id = `${Date.now()}-${crypto.randomUUID()}`;
  if (env.REMOTE_START_OUTCOME_EVENTS?.put) {
    await env.REMOTE_START_OUTCOME_EVENTS.put(id, JSON.stringify(payload));
    return new Response(JSON.stringify({ ok: true, id, storage: "kv" }), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store, max-age=0",
      },
    });
  }

  console.log("REMOTE_START_OUTCOME_EVENT", JSON.stringify(payload));
  return new Response(JSON.stringify({ ok: true, id, storage: "log_only" }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
    },
  });
}
