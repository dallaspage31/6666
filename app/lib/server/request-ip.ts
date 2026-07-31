export function getClientIp(headers: Headers): string {
  const xRealIp = headers.get('x-real-ip')
  const xForwardedFor = headers.get('x-forwarded-for')

  if (xForwardedFor) {
    const parts = xForwardedFor.split(',')
    const ip = parts[0]?.trim()
    if (ip) return ip
  }

  if (xRealIp) return xRealIp

  return 'unknown'
}
