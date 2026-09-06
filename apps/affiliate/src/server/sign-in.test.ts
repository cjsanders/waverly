import { afterEach, describe, expect, it, vi } from 'vitest'

import { getEmulatedSignInRedirect } from './sign-in'

describe('getEmulatedSignInRedirect', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('keeps emulated sign-in on the application origin', () => {
    vi.stubEnv('WORKOS_EMULATE', 'true')
    const request = new Request(
      'https://affiliate.example/api/auth/sign-in?returnPathname=%2Fdashboard%3Ftab%3Dsettings',
    )

    const response = getEmulatedSignInRedirect(request, '/dashboard?tab=settings')

    expect(response?.status).toBe(307)
    expect(response?.headers.get('Location')).toBe(
      '/api/auth/test-login?returnPathname=%2Fdashboard%3Ftab%3Dsettings',
    )
  })

  it('uses hosted WorkOS when emulation is disabled', () => {
    vi.stubEnv('WORKOS_EMULATE', 'false')

    expect(
      getEmulatedSignInRedirect(new Request('https://affiliate.example/api/auth/sign-in'), null),
    ).toBeNull()
  })
})
