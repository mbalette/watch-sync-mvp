import { readFileSync } from 'node:fs';

const files = [
  'src/App.tsx',
  'src/AppFlow.tsx',
  'src/LiveRoomApp.tsx',
  'src/tv-remote-device.ts',
  'src/native-tv-remote.ts',
];
const forbidden = [
  /works with any TV/i,
  /Roku works/i,
  /VIZIO works/i,
  /validated on Roku/i,
  /validated on VIZIO/i,
  /Auto Play works with (Netflix|Hulu|Disney|Prime|Max)/i,
  /universal TV remote/i,
  /guaranteed/i,
];
const offenders = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(text)) offenders.push(`${file}: ${pattern}`);
  }
}
if (offenders.length) {
  console.error('Forbidden public Remote Start claim found:');
  for (const offender of offenders) console.error(`- ${offender}`);
  process.exit(1);
}
console.log(`PASS no forbidden broad Remote Start public claims in ${files.length} user-facing source files`);
