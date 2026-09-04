import { getConfig, sessionEncryption } from '@workos/authkit-session'
import { getAuthkit } from '@workos/authkit-tanstack-react-start'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@workos/authkit-tanstack-react-start', () => ({
  getAuthkit: vi.fn<() => Promise<unknown>>(),
}))

vi.mock('@workos/authkit-session', () => ({
  getConfig: vi.fn<(key: string) => string>(),
  sessionEncryption: {
    sealData:
      vi.fn<(data: unknown, options: { password: string; ttl?: number }) => Promise<string>>(),
  },
}))

import { getTestUserCredentials, handleTestLogin, sanitizeTestLoginReturnPath } from './test-login'

const authenticateWithPassword =
  vi.fn<(payload: { email: string; password: string }) => Promise<unknown>>()
const saveSession =
  vi.fn<(response: Response, sessionData: string) => Promise<{ headers: Record<string, string> }>>()

describe('getTestUserCredentials', () => {
  it('returns null when either secret is missing', () => {
    expect(getTestUserCredentials({})).toBeNull()
    expect(getTestUserCredentials({ TEST_USER_EMAIL: 'agent@example.com' })).toBeNull()
    expect(getTestUserCredentials({ TEST_USER_PASSWORD: 'secret' })).toBeNull()
    expect(
      getTestUserCredentials({ TEST_USER_EMAIL: '  ', TEST_USER_PASSWORD: 'secret' }),
    ).toBeNull()
  })

  it('returns trimmed email and the password when both are set', () => {
    expect(
      getTestUserCredentials({
        TEST_USER_EMAIL: '  agent@example.com  ',
        TEST_USER_PASSWORD: 'secret',
      }),
    ).toEqual({ email: 'agent@example.com', password: 'secret' })
  })
})

describe('sanitizeTestLoginReturnPath', () => {
  it.each(['/dashboard', '/dashboard?tab=settings', '/creator#overview'])(
    'keeps same-origin path %s',
    (path) => {
      expect(sanitizeTestLoginReturnPath(path)).toBe(path)
    },
  )

  it('falls back to the dashboard when the value is missing', () => {
    expect(sanitizeTestLoginReturnPath(null)).toBe('/dashboard')
    expect(sanitizeTestLoginReturnPath(undefined)).toBe('/dashboard')
    expect(sanitizeTestLoginReturnPath('')).toBe('/dashboard')
  })

  it('does not redirect off-origin', () => {
    expect(sanitizeTestLoginReturnPath('https://evil.example/steal')).toBe('/steal')
    expect(sanitizeTestLoginReturnPath('//evil.example/steal')).toBe('/steal')
  })
})

describe('handleTestLogin', () => {
  beforeEach(() => {
    vi.stubEnv('TEST_USER_EMAIL', 'agent@example.com')
    vi.stubEnv('TEST_USER_PASSWORD', 'secret')
    authenticateWithPassword.mockReset()
    saveSession.mockReset()
    vi.mocked(getAuthkit).mockResolvedValue({
      getWorkOS: () => ({ userManagement: { authenticateWithPassword } }),
      saveSession,
    } as never)
    vi.mocked(getConfig).mockReturnValue('cookie-password-that-is-32-chars!')
    vi.mocked(sessionEncryption.sealData).mockReset()
    vi.mocked(sessionEncryption.sealData).mockResolvedValue('encrypted-session')
    saveSession.mockResolvedValue({
      headers: { 'Set-Cookie': 'wos-session=encrypted-session; Path=/; HttpOnly' },
    })
    authenticateWithPassword.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'user_1', email: 'agent@example.com' },
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 503 when the test user secrets are missing', async () => {
    vi.stubEnv('TEST_USER_EMAIL', '')
    vi.stubEnv('TEST_USER_PASSWORD', '')

    const response = await handleTestLogin(new Request('http://localhost/api/auth/test-login'))

    expect(response.status).toBe(503)
    expect(authenticateWithPassword).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({
      error: 'TEST_USER_EMAIL and TEST_USER_PASSWORD must be set to use agent login',
    })
  })

  it('sets the AuthKit cookie and redirects to the dashboard', async () => {
    const response = await handleTestLogin(
      new Request('http://localhost/api/auth/test-login?returnPathname=/dashboard'),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('Location')).toBe('/dashboard')
    expect(response.headers.get('Set-Cookie')).toContain('wos-session=encrypted-session')
    expect(authenticateWithPassword).toHaveBeenCalledWith({
      email: 'agent@example.com',
      password: 'secret',
    })
    expect(sessionEncryption.sealData).toHaveBeenCalledWith(
      {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'user_1', email: 'agent@example.com' },
        impersonator: undefined,
      },
      { password: 'cookie-password-that-is-32-chars!', ttl: 0 },
    )
  })

  it('returns 401 when WorkOS rejects the test user', async () => {
    authenticateWithPassword.mockRejectedValue(new Error('invalid credentials'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await handleTestLogin(new Request('http://localhost/api/auth/test-login'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Test user authentication failed' })
    consoleError.mockRestore()
  })
})
