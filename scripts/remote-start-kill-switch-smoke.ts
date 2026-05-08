import { mkdir, writeFile } from "node:fs/promises";

const artifactDir = new URL("../artifacts/remote-start-non-hardware-readiness/", import.meta.url);
await mkdir(artifactDir, { recursive: true });
const text = `Kill switch smoke helper\n\nThis task does not deploy production and does not leave the kill switch on.\nIf run by an operator with Cloudflare access, temporarily write remoteStartKillSwitchEnabled=true, verify Remote Start hidden with Manual Play visible, then restore the previous config.\n`;
await writeFile(new URL("kill-switch-smoke.txt", artifactDir), text);
console.log("kill-switch smoke artifact written; no production mutation performed");
