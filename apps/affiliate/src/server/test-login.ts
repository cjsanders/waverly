import { getConfig, sessionEncryption } from '@workos/authkit-session'
import { getAuthkit } from '@workos/authkit-tanstack-react-start'

export const TEST_LOGIN_DEFAULT_RETURN_PATH = '/dashboard'

export type TestUserCredentials = {
  email: string
  password: string
}

/** Read the WorkOS test user used by agents and local tools. Returns null when either secret is missing. */
export function getTestUserCredentials(
  env: NodeJS.ProcessEnv = process.env,
): TestUserCredentials | null {
  const email = env.TEST_USER_EMAIL?.trim()
  const password = env.TEST_USER_PASSWORD
  if (!email || !password) return null
  return { email, password }
}

/**
 * Keep `returnPathname` on this origin. Absolute URLs, protocol-relative
 * paths, and unparseable values fall back to the dashboard.
 */
export function sanitizeTestLoginReturnPath(input: string | null | undefined): string {
  for (const candidate of [input, TEST_LOGIN_DEFAULT_RETURN_PATH]) {
    if (!candidate) continue
    try {
      const parsed = new URL(candidate, 'https://placeholder.invalid')
      const path = `/${parsed.pathname.replace(/^\/+/, '')}`
      return `${path}${parsed.search}${parsed.hash}`
    } catch {
      // Try the next candidate.
    }
  }

  return TEST_LOGIN_DEFAULT_RETURN_PATH
}

export function workosErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code
  }
}

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function applySessionCookies(
  headers: Headers,
  saved: { headers?: Record<string, string | string[]>; response?: Response },
) {
  if (saved.headers) {
    for (const [key, value] of Object.entries(saved.headers)) {
      for (const entry of Array.isArray(value) ? value : [value]) {
        headers.append(key, entry)
      }
    }
    return
  }

  for (const cookie of saved.response?.headers.getSetCookie() ?? []) {
    headers.append('Set-Cookie', cookie)
  }
}

type PasswordAuth = {
  authenticateWithPassword: (payload: {
    clientId: string
    email: string
    password: string
  }) => Promise<{
    accessToken: string
    refreshToken: string
    user: unknown
    impersonator?: unknown
  }>
  authenticateWithOrganizationSelection: (payload: {
    clientId: string
    organizationId: string
    pendingAuthenticationToken: string
  }) => Promise<{
    accessToken: string
    refreshToken: string
    user: unknown
    impersonator?: unknown
  }>
  listUsers: (options: { email: string }) => Promise<{ data: Array<{ id: string }> }>
  updateUser: (options: { userId: string; emailVerified: boolean }) => Promise<unknown>
}

function workosPendingAuth(error: unknown): { token?: string; organizationId?: string } {
  if (!error || typeof error !== 'object') return {}
  const token =
    'pendingAuthenticationToken' in error && typeof error.pendingAuthenticationToken === 'string'
      ? error.pendingAuthenticationToken
      : undefined
  const rawData = 'rawData' in error ? error.rawData : undefined
  const organizations =
    rawData && typeof rawData === 'object' && 'organizations' in rawData
      ? rawData.organizations
      : undefined
  const organizationId =
    Array.isArray(organizations) && organizations[0] && typeof organizations[0].id === 'string'
      ? organizations[0].id
      : undefined
  return { token, organizationId }
}

async function authenticateTestUser(
  userManagement: PasswordAuth,
  credentials: TestUserCredentials,
) {
  const clientId = getConfig('clientId')
  const payload = {
    clientId,
    email: credentials.email,
    password: credentials.password,
  }

  const complete = async (error: unknown) => {
    if (workosErrorCode(error) === 'email_verification_required') {
      const users = await userManagement.listUsers({ email: credentials.email })
      const user = users.data[0]
      if (!user) throw error
      await userManagement.updateUser({ userId: user.id, emailVerified: true })
      try {
        return await userManagement.authenticateWithPassword(payload)
      } catch (retryError) {
        return completeOrganizationSelection(retryError)
      }
    }

    return completeOrganizationSelection(error)
  }

  const completeOrganizationSelection = async (error: unknown) => {
    if (workosErrorCode(error) !== 'organization_selection_required') throw error
    const { token, organizationId } = workosPendingAuth(error)
    if (!token || !organizationId) throw error
    return userManagement.authenticateWithOrganizationSelection({
      clientId,
      organizationId,
      pendingAuthenticationToken: token,
    })
  }

  try {
    return await userManagement.authenticateWithPassword(payload)
  } catch (error) {
    return complete(error)
  }
}

/**
 * Dev-only: sign in as `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` and set the
 * AuthKit session cookie. Production builds always 404 so this cannot ship.
 */
export async function handleTestLogin(request: Request): Promise<Response> {
  if (!import.meta.env.DEV) {
    return new Response(null, { status: 404 })
  }

  const credentials = getTestUserCredentials()
  if (!credentials) {
    return jsonError(503, 'TEST_USER_EMAIL and TEST_USER_PASSWORD must be set to use agent login')
  }

  const returnPathname = sanitizeTestLoginReturnPath(
    new URL(request.url).searchParams.get('returnPathname'),
  )

  try {
    const authkit = await getAuthkit()
    const authResponse = await authenticateTestUser(authkit.getWorkOS().userManagement, credentials)
    const encryptedSession = await sessionEncryption.sealData(
      {
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
        user: authResponse.user,
        impersonator: authResponse.impersonator,
      },
      { password: getConfig('cookiePassword'), ttl: 0 },
    )
    const saved = await authkit.saveSession(new Response(), encryptedSession)
    const headers = new Headers({ Location: returnPathname })
    applySessionCookies(headers, saved)
    return new Response(null, { status: 307, headers })
  } catch (error) {
    console.error(
      '[test-login] WorkOS password authentication failed',
      workosErrorCode(error) ?? 'unknown',
    )
    return jsonError(401, 'Test user authentication failed')
  }
}
