import { dehydrate, hydrate, QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { authQueryOptions, authScope, clientAuth, type ClientAuth } from './auth-state'

const session = {
  user: { id: 'user_1' },
  sessionId: 'session_1',
  organizationId: 'org_1',
  role: 'admin',
} as ClientAuth & { user: NonNullable<ClientAuth['user']> }

describe('hydrated authentication', () => {
  it('reuses SSR auth for browser navigation without serializing access tokens', async () => {
    const server = new QueryClient()
    const browser = new QueryClient()
    const loadAuth = vi.fn<() => Promise<ClientAuth>>().mockResolvedValue(session)
    await server.ensureQueryData(
      authQueryOptions(async () =>
        clientAuth({ ...session, accessToken: 'server-only-token' } as ClientAuth),
      ),
    )
    const dehydrated = dehydrate(server)
    expect(JSON.stringify(dehydrated)).not.toContain('server-only-token')
    hydrate(browser, dehydrated)
    expect(await browser.ensureQueryData(authQueryOptions(loadAuth))).toEqual(session)
    await browser.ensureQueryData(authQueryOptions(loadAuth))
    expect(loadAuth).not.toHaveBeenCalled()
    server.clear()
    browser.clear()
  })

  it('keeps independent request caches isolated and permits explicit session refresh', async () => {
    const first = new QueryClient()
    const second = new QueryClient()
    const loadAuth = vi
      .fn<() => Promise<ClientAuth>>()
      .mockResolvedValueOnce(session)
      .mockResolvedValueOnce({ user: null })
    await first.ensureQueryData(authQueryOptions(loadAuth))
    expect(await second.ensureQueryData(authQueryOptions(loadAuth))).toEqual({ user: null })
    loadAuth.mockResolvedValue({ user: null })
    await first.invalidateQueries({ queryKey: ['auth', 'session'] })
    expect(await first.fetchQuery(authQueryOptions(loadAuth))).toEqual({ user: null })
    first.clear()
    second.clear()
  })

  it('detects sign-out, organization switches, and permission changes', () => {
    expect(authScope(session)).not.toEqual(authScope({ user: null }))
    expect(authScope(session)).not.toEqual(authScope({ ...session, organizationId: 'org_2' }))
    expect(authScope(session)).not.toEqual(authScope({ ...session, role: 'member' }))
    expect(authScope({ ...session, permissions: ['read', 'write'] })).toEqual(
      authScope({ ...session, permissions: ['write', 'read'] }),
    )
  })
})
