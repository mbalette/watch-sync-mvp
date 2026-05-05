import { networkInterfaces } from 'node:os'

const vitePort = Number(process.env.VITE_PORT ?? 5173)
const realtimePort = Number(process.env.REALTIME_PORT ?? 8787)

function localIpv4Addresses(): string[] {
  return Object.values(networkInterfaces())
    .flatMap((items) => items ?? [])
    .filter((item) => item.family === 'IPv4' && !item.internal)
    .map((item) => item.address)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

const addresses = localIpv4Addresses()

console.log('Watch Sync LAN helper')
console.log('')
console.log('1) Start the realtime server on the LAN interface:')
console.log(`   REALTIME_HOST=0.0.0.0 REALTIME_PORT=${realtimePort} npm run dev:realtime`)
console.log('')
console.log('2) In another terminal, start Vite with one detected LAN address:')

if (addresses.length === 0) {
  console.log('   No non-internal IPv4 address detected. Connect to Wi-Fi/Ethernet and rerun npm run lan:help.')
} else {
  for (const address of addresses) {
    console.log(`   VITE_REALTIME_URL=ws://${address}:${realtimePort} npm run dev -- --host 0.0.0.0 --port ${vitePort}`)
  }
}

console.log('')
console.log('3) Phone URLs to try from the same Wi-Fi/LAN:')
if (addresses.length === 0) {
  console.log(`   http://<your-computer-lan-ip>:${vitePort}/`)
} else {
  for (const address of addresses) console.log(`   http://${address}:${vitePort}/`)
}

console.log('')
console.log('Health check from this computer after realtime is running:')
console.log(`   curl http://127.0.0.1:${realtimePort}/health`)
console.log('')
console.log('Security caveat: this binds dev servers to your local network only. Use trusted Wi-Fi; do not port-forward or expose these ports to the internet.')
