import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['artifacts/remote-start-nonhardware', 'artifacts/remote-start-simulator'];
const forbidden = [
  /\b(?:10|127|169\.254|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b/i,
  /https?:\/\/[^\s"']+/i,
  /\.local\b/i,
  /bearer\s+[a-z0-9._-]+/i,
  /webhook/i,
  /secret/i,
  /auth[_-]?token/i,
  /pairing[_-]?pin/i,
  /client[_-]?key/i,
  /psk/i,
  /serial/i,
];
const allowed = new Set(['simulator-matrix.md']);
const files = [];
function walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(json|md|txt)$/i.test(entry)) files.push(full);
  }
}
for (const root of roots) walk(root);
const offenders = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(text) && !allowed.has(file.split('/').pop())) offenders.push(`${file}: ${pattern}`);
  }
}
if (offenders.length) {
  console.error('Remote Start nonhardware artifact leak scan failed:');
  for (const offender of offenders) console.error(`- ${offender}`);
  process.exit(1);
}
console.log(`PASS remote-start nonhardware artifact leak scan (${files.length} files)`);
