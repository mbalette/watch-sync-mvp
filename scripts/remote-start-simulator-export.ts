import { mkdir, writeFile } from "node:fs/promises";
import { buildRemoteStartSimulatorStateMatrix } from "../src/remote-start-simulator/index";

const outDir = new URL("../artifacts/remote-start-simulator/", import.meta.url);
await mkdir(outDir, { recursive: true });
const matrix = buildRemoteStartSimulatorStateMatrix();
await writeFile(new URL("state-matrix.json", outDir), `${JSON.stringify({ generatedAt: new Date().toISOString(), hardwareValidation: false, matrix }, null, 2)}\n`);
console.log(`remote-start simulator matrix exported: ${matrix.length} rows; hardwareValidation=false`);
