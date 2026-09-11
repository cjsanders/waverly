import { BUILD_AFFILIATE_ORIGIN } from './affiliate-origin.generated'

const WORKERS_DEV = 'waverly-d46.workers.dev'

function parseOrigin(value: string): URL | null {
  try {
    const url = new URL(value)
    if (url.username || url.password) return null
    return url
  } catch {
    return null
  }
}

function asOrigin(value: string): string | null {
  const url = parseOrigin(value)
  return url ? url.origin : null
}

export function isAllowedAffiliateOrigin(value: string): boolean {
  const url = parseOrigin(value)
  if (!url) return false
  const host = url.hostname
  if (url.protocol === 'https:') {
    return (
      host === `waverly-affiliate.${WORKERS_DEV}` ||
      host.endsWith(`-waverly-affiliate.${WORKERS_DEV}`) ||
      host === 'affiliate.waverly.localhost'
    )
  }
  return url.protocol === 'http:' && (host === 'localhost' || host === '127.0.0.1')
}

export function isAllowedDocsOrigin(value: string): boolean {
  const url = parseOrigin(value)
  if (!url) return false
  const host = url.hostname
  if (url.protocol === 'https:') {
    return (
      host === 'docs.waverly.com' ||
      host === `waverly-docs.${WORKERS_DEV}` ||
      host.endsWith(`-waverly-docs.${WORKERS_DEV}`) ||
      host === 'docs.waverly.localhost'
    )
  }
  return url.protocol === 'http:' && (host === 'localhost' || host === '127.0.0.1')
}

export function resolveAffiliateOrigin(env: { AFFILIATE_ORIGIN?: string } = {}): string | null {
  // Empty string is an explicit opt-out for tests. Unset falls back to the
  // origin baked at Cloudflare build time (preview alias or production).
  if (env.AFFILIATE_ORIGIN === '') return null
  const raw = env.AFFILIATE_ORIGIN || BUILD_AFFILIATE_ORIGIN
  const origin = asOrigin(raw)
  if (!origin || !isAllowedAffiliateOrigin(origin)) return null
  return origin
}
