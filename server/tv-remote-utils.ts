export function sanitizeLanHost(input: string): string {
  const host = input.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
  if (!/^[a-zA-Z0-9.-]+$/.test(host)) throw new Error('Host must be a hostname or IP address.')
  if (host.length === 0) throw new Error('Host is required.')
  if (host.length > 253) throw new Error('Host is too long.')
  return host
}
