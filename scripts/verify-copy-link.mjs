import { chromium } from 'playwright'

const url = process.argv[2] || 'http://127.0.0.1:4173/'
const browser = await chromium.launch()
const context = await browser.newContext()
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(url).origin })
const page = await context.newPage()
await page.goto(url, { waitUntil: 'networkidle' })
await page.getByLabel('Your name').fill('Jose QA')
await page.getByRole('button', { name: 'Create room' }).click()
await page.getByRole('button', { name: 'Copy invite link' }).click()
await page.getByText('Link copied!').waitFor({ timeout: 5000 })
const copied = await page.evaluate(() => navigator.clipboard.readText())
const current = new URL(page.url())
const copiedUrl = new URL(copied)
if (copiedUrl.origin !== current.origin) {
  throw new Error(`Copied origin mismatch: copied=${copiedUrl.origin} current=${current.origin}`)
}
if (!copiedUrl.searchParams.get('room')) {
  throw new Error(`Copied link missing room param: ${copied}`)
}
const roomPillText = await page.locator('.room-pill span').innerText()
if (copiedUrl.searchParams.get('room') !== roomPillText.trim()) {
  throw new Error(`Copied room mismatch: copied=${copiedUrl.searchParams.get('room')} UI=${roomPillText}`)
}
console.log(JSON.stringify({ ok: true, copied, room: roomPillText.trim() }, null, 2))
await browser.close()
