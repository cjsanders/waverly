import { queryOptions } from '@tanstack/react-query'
import type { AuthKitProviderProps } from '@workos/authkit-tanstack-react-start/client'

export type ClientAuth = NonNullable<AuthKitProviderProps['initialAuth']>

/** Only public session claims belong in the dehydrated query cache. */
export function clientAuth(auth: ClientAuth): ClientAuth {
  if (!auth.user) return { user: null }
  return {
    user: auth.user,
    sessionId: auth.sessionId,
    organizationId: auth.organizationId,
    role: auth.role,
    roles: auth.roles,
    permissions: auth.permissions,
    entitlements: auth.entitlements,
    featureFlags: auth.featureFlags,
    impersonator: auth.impersonator,
  }
}

export function authQueryOptions(fetchAuth: () => Promise<ClientAuth>) {
  return queryOptions({
    queryKey: ['auth', 'session'],
    queryFn: fetchAuth,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
}

/** A changed identity or authorization scope needs fresh Convex clients and route context. */
export function authScope(auth: ClientAuth) {
  return auth.user
    ? JSON.stringify([
        auth.user.id,
        auth.sessionId,
        auth.organizationId,
        auth.role,
        [...(auth.roles ?? [])].sort(),
        [...(auth.permissions ?? [])].sort(),
        [...(auth.entitlements ?? [])].sort(),
        [...(auth.featureFlags ?? [])].sort(),
        auth.impersonator,
      ])
    : null
}
