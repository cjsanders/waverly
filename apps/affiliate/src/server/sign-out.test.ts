import { getAuthKitContext, getAuthkit } from '@workos/authkit-tanstack-react-start'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@workos/authkit-tanstack-react-start', () => ({
  getAuthKitContext: vi.fn<typeof getAuthKitContext>(),
  getAuthkit: vi.fn<typeof getAuthkit>(),
}))

import { handleSignOut, sanitizeSignOutReturnPath } from './sign-out'

const signOut =
  vi.fn<(sessionId: string, options: { returnTo?: string }) => Promise<{ logoutUrl: string }>>()

describe('sanitizeSignOutReturnPath', () => {
  it.each([null, '', 'https://evil.example', '//evil.example', '/.//evil.example'])(
    'rejects %s',
    (value) => {
      expect(sanitizeSignOutReturnPath(value)).toBe('/')
    },
  )

  it('keeps same-origin paths', () => {
    expect(sanitizeSignOutReturnPath('/dashboard?tab=one#section')).toBe(
      '/dashboard?tab=one#section',
    )
  })
})

describe('handleSignOut', () => {
  beforeEach(() => {
    signOut.mockReset()
    signOut.mockResolvedValue({ logoutUrl: 'https://api.workos.com/logout' })
    vi.mocked(getAuthKitContext).mockReturnValue({
      auth: () => ({ user: { id: 'user_1' }, sessionId: 'session_1' }),
    } as never)
    vi.mocked(getAuthkit).mockResolvedValue({ signOut } as never)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('clears the emulated session and redirects on the application origin', async () => {
    vi.stubEnv('WORKOS_EMULATE', 'true')

    const response = await handleSignOut(
      new Request('https://affiliate.example/api/auth/sign-out?returnTo=%2Fdashboard'),
    )

    expect(signOut).toHaveBeenCalledWith('session_1', { returnTo: 'http://localhost/' })
    expect(response.status).toBe(307)
    expect(response.headers.get('Location')).toBe('/dashboard')
  })

  it('uses the hosted WorkOS logout URL when emulation is disabled', async () => {
    vi.stubEnv('WORKOS_EMULATE', 'false')

    const response = await handleSignOut(
      new Request('https://affiliate.example/api/auth/sign-out?returnTo=%2F'),
    )

    expect(signOut).toHaveBeenCalledWith('session_1', { returnTo: '/' })
    expect(response.headers.get('Location')).toBe('https://api.workos.com/logout')
  })
})
