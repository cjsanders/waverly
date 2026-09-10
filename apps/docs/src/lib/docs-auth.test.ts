import { describe, expect, it } from 'bun:test'

import {
  handleDocsRequest,
  isAuthApiPath,
  isAuthConfigured,
  isInternalPath,
  legacyRedirectPath,
  sanitizeReturnPath,
  sealSession,
  unsealSession,
  type DocsAuthEnv,
} from './docs-auth'

const password = 'waverly-docs-cookie-password-32-chars'
const env: DocsAuthEnv = {
  WORKOS_CLIENT_ID: 'client_docs',
  WORKOS_API_KEY: 'sk_test',
  WORKOS_COOKIE_PASSWORD: password,
}

function request(path: string, init?: RequestInit) {
  return new Request(`https://docs.waverly.com${path}`, init)
}

describe('docs auth paths', () => {
  it('treats internal HTML, markdown, and llms routes as gated', () => {
    expect(isInternalPath('/internal')).toBe(true)
    expect(isInternalPath('/internal/')).toBe(true)
    expect(isInternalPath('/internal/workspaces')).toBe(true)
    expect(isInternalPath('/internal/workspaces/index.md')).toBe(true)
    expect(isInternalPath('/creators')).toBe(false)
    expect(isInternalPath('/sellers/program')).toBe(false)
  })

  it('recognizes auth API routes and legacy doc URLs', () => {
    expect(isAuthApiPath('/api/auth/sign-in')).toBe(true)
    expect(isAuthApiPath('/api/auth/session')).toBe(true)
    expect(legacyRedirectPath('/getting-started')).toBe('/internal')
    expect(legacyRedirectPath('/workspaces')).toBe('/internal/workspaces')
    expect(legacyRedirectPath('/creators')).toBeNull()
  })

  it('keeps return paths on the internal section', () => {
    expect(sanitizeReturnPath('/internal/workos')).toBe('/internal/workos')
    expect(sanitizeReturnPath('/creators')).toBe('/internal')
    expect(sanitizeReturnPath('https://evil.example/internal')).toBe('/internal')
    expect(sanitizeReturnPath('//evil.example')).toBe('/internal')
  })
})

describe('session sealing', () => {
  it('round-trips a valid session and rejects expired payloads', async () => {
    const token = await sealSession(
      { id: 'user_1', email: 'ops@waverly.com', exp: Date.now() + 60_000 },
      password,
      () => new Uint8Array(12).fill(7),
    )
    expect(await unsealSession(token, password)).toEqual({
      id: 'user_1',
      email: 'ops@waverly.com',
    })
    expect(await unsealSession(token, password, Date.now() + 120_000)).toBeNull()
    expect(await unsealSession(token, 'different-password-that-is-32-chars!!')).toBeNull()
  })
})

describe('handleDocsRequest', () => {
  it('lets public pages through without a session', async () => {
    const response = await handleDocsRequest(
      request('/creators'),
      env,
      async () => new Response('ok'),
    )
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('ok')
  })

  it('redirects anonymous internal requests to WorkOS sign-in', async () => {
    const response = await handleDocsRequest(request('/internal/workspaces'), env, async () => {
      throw new Error('should not serve internal docs')
    })
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe(
      '/api/auth/sign-in?returnPathname=%2Finternal%2Fworkspaces',
    )
  })

  it('serves internal docs when auth is bypassed', async () => {
    const response = await handleDocsRequest(
      request('/internal'),
      env,
      async () => new Response('team'),
      { bypassAuth: true },
    )
    expect(await response.text()).toBe('team')
  })

  it('fails closed when WorkOS is missing in production', async () => {
    const response = await handleDocsRequest(request('/internal'), {}, async () => {
      throw new Error('should not serve internal docs')
    })
    expect(response.status).toBe(503)
  })

  it('redirects retired public URLs into the internal section', async () => {
    const response = await handleDocsRequest(request('/agent-login'), env, async () => {
      throw new Error('legacy path should redirect')
    })
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('/internal/agent-login')
  })

  it('exchanges a WorkOS code for a session cookie', async () => {
    expect(isAuthConfigured(env)).toBe(true)
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ user: { id: 'user_1', email: 'ops@waverly.com' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    const nonce = 'n'.repeat(22)
    const state = btoa(JSON.stringify({ n: nonce, r: '/internal/workos' }))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '')
    const response = await handleDocsRequest(
      request(`/api/auth/callback?code=abc&state=${state}`, {
        headers: { Cookie: `wos-docs-state=${nonce}` },
      }),
      env,
      async () => new Response('nope'),
      {
        fetch: fetchImpl,
        now: () => 1_700_000_000_000,
        randomBytes: () => new Uint8Array(12).fill(1),
      },
    )
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('/internal/workos')
    const cookie = response.headers
      .getSetCookie()
      .find((value) => value.startsWith('wos-docs-session='))
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Secure')
  })

  it('returns the current user from the session endpoint', async () => {
    const token = await sealSession(
      { id: 'user_1', email: 'ops@waverly.com', exp: Date.now() + 60_000 },
      password,
      () => new Uint8Array(12).fill(3),
    )
    const response = await handleDocsRequest(
      request('/api/auth/session', { headers: { Cookie: `wos-docs-session=${token}` } }),
      env,
      async () => new Response('nope'),
    )
    expect(await response.json()).toEqual({ user: { id: 'user_1', email: 'ops@waverly.com' } })
  })
})
