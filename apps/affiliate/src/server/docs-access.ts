import { createHmac, timingSafeEqual } from 'node:crypto'

import { getAuth } from '@workos/authkit-tanstack-react-start'

import { listWorkOSMemberships, type WorkOSMembership } from './workos'

const TICKET_MAX_AGE_MS = 60 * 60 * 24 * 7
const WORKERS_DEV = 'waverly-d46.workers.dev'

export type DocsAccessTicket = {
  id: string
  email: string
  iss: string
  aud: string
  exp: number
  kind: 'operator'
}

function parseUrl(value: string): URL | null {
  try {
    const url = new URL(value)
    if (url.username || url.password) return null
    return url
  } catch {
    return null
  }
}

export function isAllowedDocsReturnUrl(value: string): boolean {
  const url = parseUrl(value)
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

export function isAllowedAffiliateOrigin(value: string): boolean {
  const url = parseUrl(value)
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

function htmlError(title: string, message: string, status: number): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1><p>${message}</p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

export function signDocsAccessTicket(payload: DocsAccessTicket, password: string): string {
  const body = JSON.stringify(payload)
  const signature = createHmac('sha256', password).update(body).digest()
  return `${Buffer.from(body).toString('base64url')}.${Buffer.from(signature).toString('base64url')}`
}

export function verifyDocsAccessTicket(
  ticket: string,
  password: string,
  now = Date.now(),
): DocsAccessTicket | null {
  const split = ticket.indexOf('.')
  if (split === -1) return null
  try {
    const body = Buffer.from(ticket.slice(0, split), 'base64url')
    const signature = Buffer.from(ticket.slice(split + 1), 'base64url')
    const expected = createHmac('sha256', password).update(body).digest()
    if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null
    const payload = JSON.parse(body.toString('utf8')) as DocsAccessTicket
    if (
      !payload.id ||
      !payload.email ||
      payload.kind !== 'operator' ||
      typeof payload.iss !== 'string' ||
      typeof payload.aud !== 'string' ||
      payload.exp <= now
    ) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

type DocsAccessUser = { id: string; email: string }

export async function handleDocsAccessGet(
  request: Request,
  deps: {
    getAuth?: () => Promise<{ user: DocsAccessUser | null }>
    listMemberships?: (userId: string) => Promise<WorkOSMembership[]>
    password?: string
    now?: () => number
  } = {},
): Promise<Response> {
  const redeemTicket = new URL(request.url).searchParams.get('ticket')
  if (redeemTicket) return handleDocsAccessRedeemTicket(redeemTicket, deps)

  const returnUrl = new URL(request.url).searchParams.get('return')
  if (!returnUrl || !isAllowedDocsReturnUrl(returnUrl)) {
    return htmlError(
      'Team docs sign-in failed',
      'The return URL is not a Waverly docs origin.',
      400,
    )
  }

  const auth = await (deps.getAuth ?? (async () => getAuth()))()
  if (!auth.user) {
    const signIn = new URL('/api/auth/sign-in', request.url)
    signIn.searchParams.set(
      'returnPathname',
      `/api/docs-access?return=${encodeURIComponent(returnUrl)}`,
    )
    return new Response(null, {
      status: 302,
      headers: { Location: `${signIn.pathname}${signIn.search}` },
    })
  }

  const memberships = await (deps.listMemberships ?? listWorkOSMemberships)(auth.user.id)
  if (!memberships.some((membership) => membership.organization.kind === 'operator')) {
    return htmlError(
      'Team docs are restricted',
      'Team docs are only available to Waverly operators.',
      403,
    )
  }

  const password = deps.password ?? process.env.WORKOS_COOKIE_PASSWORD
  if (!password || password.length < 32) {
    return htmlError(
      'Team docs sign-in failed',
      'WorkOS session encryption is not configured.',
      503,
    )
  }

  const now = deps.now?.() ?? Date.now()
  const docsOrigin = new URL(returnUrl).origin
  const ticket = signDocsAccessTicket(
    {
      id: auth.user.id,
      email: auth.user.email,
      iss: new URL(request.url).origin,
      aud: docsOrigin,
      exp: now + TICKET_MAX_AGE_MS,
      kind: 'operator',
    },
    password,
  )

  const next = new URL('/api/auth/operator', docsOrigin)
  const returnPath = `${new URL(returnUrl).pathname}${new URL(returnUrl).search}`
  next.searchParams.set('ticket', ticket)
  next.searchParams.set(
    'returnPathname',
    returnPath.startsWith('/internal') ? returnPath : '/internal',
  )
  return new Response(null, { status: 302, headers: { Location: next.href } })
}

export async function handleDocsAccessRedeem(
  request: Request,
  deps: { password?: string; now?: () => number } = {},
): Promise<Response> {
  const password = deps.password ?? process.env.WORKOS_COOKIE_PASSWORD
  if (!password || password.length < 32) {
    return Response.json({ error: 'Not configured' }, { status: 503 })
  }

  let ticket: string | undefined
  try {
    const body = (await request.json()) as { ticket?: string }
    ticket = body.ticket
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }
  if (!ticket) return Response.json({ error: 'Missing ticket' }, { status: 400 })
  return handleDocsAccessRedeemTicket(ticket, deps)
}

async function handleDocsAccessRedeemTicket(
  ticket: string,
  deps: { password?: string; now?: () => number } = {},
): Promise<Response> {
  const password = deps.password ?? process.env.WORKOS_COOKIE_PASSWORD
  if (!password || password.length < 32) {
    return Response.json({ error: 'Not configured' }, { status: 503 })
  }

  const payload = verifyDocsAccessTicket(ticket, password, deps.now?.() ?? Date.now())
  // Worker-to-worker fetch on workers.dev often presents the canonical worker
  // hostname, not the preview alias baked into `iss`. HMAC is the real check.
  if (
    !payload ||
    !isAllowedAffiliateOrigin(payload.iss) ||
    !isAllowedDocsReturnUrl(`${payload.aud}/`)
  ) {
    return Response.json({ error: 'Invalid ticket' }, { status: 401 })
  }

  return Response.json({ user: { id: payload.id, email: payload.email } })
}
