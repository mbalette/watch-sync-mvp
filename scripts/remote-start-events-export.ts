import { mkdir, writeFile } from "node:fs/promises";
import { loadEvents } from "./remote-start-summary";

const artifactDir = new URL("../artifacts/remote-start-runtime-beta/", import.meta.url);
await mkdir(artifactDir, { recursive: true });
const { events, sourceNote } = await loadEvents();
await writeFile(new URL("events-export.json", artifactDir), `${JSON.stringify({ generatedAt: new Date().toISOString(), sourceNote, piiIncluded: false, events }, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, exported: events.length, output: "artifacts/remote-start-runtime-beta/events-export.json" }));
