export function validateCors(
  allowedDomains: string[] | null | undefined,
  origin: string | null
): string | null {
  if (!origin) return null
  if (!allowedDomains || allowedDomains.length === 0) return null // deny all

  const isAllowed = allowedDomains.some((domain) => {
    const normalizedDomain = domain.startsWith('http') ? domain : `https://${domain}`
    return (
      origin === normalizedDomain ||
      origin === normalizedDomain.replace('https://', 'http://')
    )
  })

  return isAllowed ? origin : null
}

export function buildCorsHeaders(allowedOrigin: string | null): Record<string, string> {
  if (!allowedOrigin) return {}
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
