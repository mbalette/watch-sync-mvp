import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const files = [
  'src/App.tsx',
  'src/AppFlow.tsx',
  'src/LiveRoomApp.tsx',
  'src/tv-remote-device.ts',
  'src/native-tv-remote.ts',
  'packages/tv-remote-bridge/index.ts',
];
const forbidden = [
  /fetch\(['"]http:\/\/192\.168\./,
  /fetch\(['"]http:\/\/10\./,
  /fetch\(['"]http:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /fetch\(['"]http:\/\/127\.0\.0\.1/,
  /fetch\(['"]http:\/\/localhost/,
  /ws:\/\/192\.168\./,
  /ssdp:\/\//i,
  /mdns:\/\//i,
];
const offenders = [];
for (const file of files) {
  const content = readFileSync(join(process.cwd(), file), 'utf8');
  forbidden.forEach((pattern) => {
    if (pattern.test(content)) offenders.push(`${file}: ${pattern}`);
  });
}
if (offenders.length) {
  console.error('Raw LAN calls found in React/native bridge UI surface:');
  for (const offender of offenders) console.error(`- ${offender}`);
  process.exit(1);
}
console.log(`PASS no direct raw LAN fetch/ws/mdns/ssdp calls in ${files.length} app UI/bridge files`);
