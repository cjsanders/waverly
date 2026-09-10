const SESSION_COOKIE = 'wos-docs-session'
const STATE_COOKIE = 'wos-docs-state'
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7
const STATE_MAX_AGE_SEC = 60 * 10
const INTERNAL_HOME = '/internal'

const LEGACY_REDIRECTS: Record<string, string> = {
  '/getting-started': INTERNAL_HOME,
  '/workspaces': '/internal/workspaces',
  '/onboarding': '/internal/onboarding',
  '/workos': '/internal/workos',
  '/ssr-and-prefetching': '/internal/ssr-and-prefetching',
  '/agent-login': '/internal/agent-login',
}

export type DocsAuthEnv = {
  WORKOS_CLIENT_ID?: string
  WORKOS_API_KEY?: string
  WORKOS_COOKIE_PASSWORD?: string
  WORKOS_API_HOSTNAME?: string
  DOCS_AUTH_BYPASS?: string
}

export type DocsUser = {
  id: string
  email: string
}

export type DocsAuthOptions = {
  bypassAuth?: boolean
  fetch?: typeof fetch
  now?: () => number
  randomBytes?: (size: number) => Uint8Array
}

type SessionPayload = DocsUser & { exp: number }

export function normalizePath(pathname: string): string {
  const path = pathname.replace(/\/+$/, '')
  return path === '' ? '/' : path
}

export function isInternalPath(pathname: string): boolean {
  const path = normalizePath(pathname)
  return path === INTERNAL_HOME || path.startsWith(`${INTERNAL_HOME}/`)
}

export function isAuthApiPath(pathname: string): boolean {
  const path = normalizePath(pathname)
  return path === '/api/auth' || path.startsWith('/api/auth/')
}

export function legacyRedirectPath(pathname: string): string | null {
  return LEGACY_REDIRECTS[normalizePath(pathname)] ?? null
}

export function sanitizeReturnPath(value: string | null | undefined): string {
  if (!value?.startsWith('/') || value.startsWith('//')) return INTERNAL_HOME
  try {
    const url = new URL(value, 'http://localhost')
    if (url.origin !== 'http://localhost' || url.pathname.startsWith('//')) return INTERNAL_HOME
    const path = `${url.pathname}${url.search}${url.hash}`
    return path.startsWith(INTERNAL_HOME) ? path : INTERNAL_HOME
  } catch {
    return INTERNAL_HOME
  }
}

export function isAuthConfigured(env: DocsAuthEnv): boolean {
  return Boolean(
    env.WORKOS_CLIENT_ID &&
    env.WORKOS_API_KEY &&
    env.WORKOS_COOKIE_PASSWORD &&
    env.WORKOS_COOKIE_PASSWORD.length >= 32,
  )
}

export function shouldBypassAuth(env: DocsAuthEnv, options?: DocsAuthOptions): boolean {
  return env.DOCS_AUTH_BYPASS === 'true' || options?.bypassAuth === true
}

function workosOrigin(env: DocsAuthEnv): string {
  const hostname = env.WORKOS_API_HOSTNAME || 'api.workos.com'
  const protocol = hostname === 'localhost' || hostname === '127.0.0.1' ? 'http' : 'https'
  return `${protocol}://${hostname}`
}

function redirectUri(request: Request): string {
  return new URL('/api/auth/callback', request.url).href
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function getRandomBytes(size: number, randomBytes?: (size: number) => Uint8Array): Uint8Array {
  if (randomBytes) return randomBytes(size)
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  return bytes
}

async function sessionKey(password: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export async function sealSession(
  payload: SessionPayload,
  password: string,
  randomBytes?: (size: number) => Uint8Array,
): Promise<string> {
  const iv = getRandomBytes(12, randomBytes)
  const key = await sessionKey(password)
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      new TextEncoder().encode(JSON.stringify(payload)),
    ),
  )
  const packed = new Uint8Array(iv.length + ciphertext.length)
  packed.set(iv, 0)
  packed.set(ciphertext, iv.length)
  return bytesToBase64Url(packed)
}

export async function unsealSession(
  token: string,
  password: string,
  now = Date.now(),
): Promise<DocsUser | null> {
  try {
    const packed = base64UrlToBytes(token)
    if (packed.length < 13) return null
    const iv = packed.slice(0, 12)
    const ciphertext = packed.slice(12)
    const key = await sessionKey(password)
    const decoded = new TextDecoder().decode(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        ciphertext as BufferSource,
      ),
    )
    const payload = JSON.parse(decoded) as SessionPayload
    if (!payload.id || !payload.email || payload.exp <= now) return null
    return { id: payload.id, email: payload.email }
  } catch {
    return null
  }
}

function cookieBase(request: Request, maxAge: number): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

function serializeCookie(request: Request, name: string, value: string, maxAge: number): string {
  return `${name}=${value}; ${cookieBase(request, maxAge)}`
}

function clearCookie(request: Request, name: string): string {
  return `${name}=; ${cookieBase(request, 0)}`
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const trimmed = part.trim()
    const split = trimmed.indexOf('=')
    if (split === -1) continue
    if (trimmed.slice(0, split) === name) return decodeURIComponent(trimmed.slice(split + 1))
  }
  return null
}

export async function readSession(request: Request, env: DocsAuthEnv): Promise<DocsUser | null> {
  if (!isAuthConfigured(env) || !env.WORKOS_COOKIE_PASSWORD) return null
  const token = readCookie(request, SESSION_COOKIE)
  if (!token) return null
  return unsealSession(token, env.WORKOS_COOKIE_PASSWORD)
}

function redirect(location: string, cookies: string[] = []): Response {
  const headers = new Headers({ Location: location })
  for (const cookie of cookies) headers.append('Set-Cookie', cookie)
  return new Response(null, { status: 302, headers })
}

function json(data: unknown, status = 200, cookies: string[] = []): Response {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' })
  for (const cookie of cookies) headers.append('Set-Cookie', cookie)
  return new Response(JSON.stringify(data), { status, headers })
}

function htmlError(title: string, message: string, status: number): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1><p>${message}</p></body></html>`,
    {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    },
  )
}

function notFoundPage(): Response {
  return htmlError('Page not found', 'This page does not exist.', 404)
}

export type DocsSessionJson = {
  user: DocsUser | null
  authEnabled: boolean
}

export function docsSessionJson(user: DocsUser | null, env: DocsAuthEnv): DocsSessionJson {
  return { user, authEnabled: isAuthConfigured(env) }
}

export function shouldShowDocsAuthWhen(
  when: 'signed-in' | 'signed-out',
  session: Pick<DocsSessionJson, 'user' | 'authEnabled'>,
): boolean {
  const signedIn = Boolean(session.user)
  if (when === 'signed-in') return signedIn
  return session.authEnabled && !signedIn
}

async function handleSignIn(
  request: Request,
  env: DocsAuthEnv,
  options: DocsAuthOptions,
): Promise<Response> {
  if (!isAuthConfigured(env)) return notFoundPage()

  const url = new URL(request.url)
  const returnPath = sanitizeReturnPath(url.searchParams.get('returnPathname'))
  const nonce = bytesToBase64Url(getRandomBytes(16, options.randomBytes))
  const state = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify({ n: nonce, r: returnPath })),
  )
  const authorize = new URL('/user_management/authorize', workosOrigin(env))
  authorize.searchParams.set('client_id', env.WORKOS_CLIENT_ID!)
  authorize.searchParams.set('redirect_uri', redirectUri(request))
  authorize.searchParams.set('response_type', 'code')
  authorize.searchParams.set('provider', 'authkit')
  authorize.searchParams.set('state', state)

  return redirect(authorize.href, [
    serializeCookie(request, STATE_COOKIE, nonce, STATE_MAX_AGE_SEC),
  ])
}

async function handleCallback(
  request: Request,
  env: DocsAuthEnv,
  options: DocsAuthOptions,
): Promise<Response> {
  if (!isAuthConfigured(env) || !env.WORKOS_COOKIE_PASSWORD) return notFoundPage()

  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const expectedNonce = readCookie(request, STATE_COOKIE)
  if (!code || !state || !expectedNonce) {
    return htmlError('Sign-in failed', 'The WorkOS callback was missing a code or state.', 400)
  }

  let returnPath = INTERNAL_HOME
  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(state))) as {
      n?: string
      r?: string
    }
    if (parsed.n !== expectedNonce) {
      return htmlError('Sign-in failed', 'The WorkOS callback state did not match.', 400)
    }
    returnPath = sanitizeReturnPath(parsed.r)
  } catch {
    return htmlError('Sign-in failed', 'The WorkOS callback state was invalid.', 400)
  }

  const fetchImpl = options.fetch ?? fetch
  const tokenResponse = await fetchImpl(
    new URL('/user_management/authenticate', workosOrigin(env)),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.WORKOS_API_KEY}`,
      },
      body: JSON.stringify({
        client_id: env.WORKOS_CLIENT_ID,
        client_secret: env.WORKOS_API_KEY,
        grant_type: 'authorization_code',
        code,
      }),
    },
  )

  if (!tokenResponse.ok) {
    return htmlError('Sign-in failed', 'WorkOS rejected the authorization code.', 401)
  }

  const body = (await tokenResponse.json()) as { user?: { id?: string; email?: string } }
  if (!body.user?.id || !body.user.email) {
    return htmlError('Sign-in failed', 'WorkOS did not return a user.', 401)
  }

  const now = options.now?.() ?? Date.now()
  const token = await sealSession(
    { id: body.user.id, email: body.user.email, exp: now + SESSION_MAX_AGE_SEC * 1000 },
    env.WORKOS_COOKIE_PASSWORD,
    options.randomBytes,
  )

  return redirect(returnPath, [
    serializeCookie(request, SESSION_COOKIE, token, SESSION_MAX_AGE_SEC),
    clearCookie(request, STATE_COOKIE),
  ])
}

function handleSignOut(request: Request): Response {
  const returnTo = sanitizeReturnPath(new URL(request.url).searchParams.get('returnTo'))
  const location = returnTo === INTERNAL_HOME ? '/' : returnTo
  return redirect(location, [clearCookie(request, SESSION_COOKIE)])
}

async function handleSession(request: Request, env: DocsAuthEnv): Promise<Response> {
  const user = await readSession(request, env)
  return json(docsSessionJson(user, env))
}

export async function handleDocsRequest(
  request: Request,
  env: DocsAuthEnv,
  next: () => Promise<Response>,
  options: DocsAuthOptions = {},
): Promise<Response> {
  const path = normalizePath(new URL(request.url).pathname)
  const bypass = shouldBypassAuth(env, options)

  if (isAuthApiPath(path)) {
    if (path === '/api/auth/sign-in') return handleSignIn(request, env, options)
    if (path === '/api/auth/callback') return handleCallback(request, env, options)
    if (path === '/api/auth/sign-out') return handleSignOut(request)
    if (path === '/api/auth/session') return handleSession(request, env)
    return json({ error: 'Not found' }, 404)
  }

  const legacy = legacyRedirectPath(path)
  if (legacy) return redirect(legacy)

  if (!isInternalPath(path)) return next()
  if (bypass) return next()
  if (!isAuthConfigured(env)) return notFoundPage()

  const user = await readSession(request, env)
  if (!user) {
    const signIn = new URL('/api/auth/sign-in', request.url)
    signIn.searchParams.set('returnPathname', `${path}${new URL(request.url).search}`)
    return redirect(signIn.pathname + signIn.search)
  }

  return next()
}

export { INTERNAL_HOME, SESSION_COOKIE }
