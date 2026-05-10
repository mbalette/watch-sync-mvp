import { mkdir, writeFile } from "node:fs/promises";
import { sanitizeRemoteStartOutcome } from "../src/remote-start-outcome-sanitizer";

const outDir = new URL("../artifacts/remote-start-nonhardware/", import.meta.url);
await mkdir(outDir, { recursive: true });
const sample = sanitizeRemoteStartOutcome({
  type: "go_sent",
  platform: "roku",
  deviceType: "roku_tv",
  adapterFamily: "roku",
  source: "synthetic",
  latencyMs: 37,
  goResult: "sent",
  hardwareValidation: true,
  host: "192.168.1.23",
  token: "secret-token",
  webhookUrl: "http://homeassistant.local/api/webhook/secret",
  failureCode: "debug http://192.168.1.23:8060/keypress/Play?token=secret",
});
await writeFile(new URL("outcome-sample.json", outDir), `${JSON.stringify(sample, null, 2)}\n`);
console.log("remote-start nonhardware outcome sample exported: artifacts/remote-start-nonhardware/outcome-sample.json; hardwareValidation=false");
