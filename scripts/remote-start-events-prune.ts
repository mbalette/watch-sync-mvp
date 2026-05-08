import { mkdir, writeFile } from "node:fs/promises";

const retentionDays = Number(process.env.REMOTE_START_OUTCOME_RETENTION_DAYS ?? 30);
const artifactDir = new URL("../artifacts/remote-start-runtime-beta/", import.meta.url);
await mkdir(artifactDir, { recursive: true });
const result = {
  ok: true,
  mode: "offline-safe",
  retentionDays,
  note: "KV writes use expirationTtl where available. This prune script records retention intent without deleting production data unless a parent operator runs it with explicit Cloudflare access.",
};
await writeFile(new URL("events-prune.json", artifactDir), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
