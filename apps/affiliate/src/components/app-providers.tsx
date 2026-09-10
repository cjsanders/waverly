import { useQuery } from '@tanstack/react-query'
import {
  AuthKitProvider,
  getAuthAction,
  useAccessToken,
  useAuth,
} from '@workos/authkit-tanstack-react-start/client'
import { ConvexProviderWithAuth, type ConvexReactClient } from 'convex/react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { authQueryOptions, authScope, type ClientAuth } from '../lib/auth-state'

export function AppProviders({
  auth,
  convexClient,
  children,
}: {
  auth: ClientAuth
  convexClient: ConvexReactClient
  children: ReactNode
}) {
  const [initialAuth] = useState(auth)
  return (
    <AuthKitProvider initialAuth={initialAuth}>
      <SessionBoundary initialAuth={initialAuth}>
        {/* oxlint-disable-next-line react/hooks -- Convex invokes this hook inside its auth provider. */}
        <ConvexProviderWithAuth client={convexClient} useAuth={useAuthFromAuthKit}>
          {children}
        </ConvexProviderWithAuth>
      </SessionBoundary>
    </AuthKitProvider>
  )
}

function SessionBoundary({
  initialAuth,
  children,
}: {
  initialAuth: ClientAuth
  children: ReactNode
}) {
  // Revalidate in the background, never as a prerequisite for a sidebar click or preload.
  const { data } = useQuery({
    ...authQueryOptions(getAuthAction),
    refetchOnWindowFocus: 'always',
    refetchInterval: 60_000,
  })
  const changed = data !== undefined && authScope(data) !== authScope(initialAuth)
  useEffect(() => {
    if (changed) window.location.reload()
  }, [changed])
  return changed ? null : children
}

function useAuthFromAuthKit() {
  const { loading, user } = useAuth()
  const { getAccessToken, refresh } = useAccessToken()
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!user) return null
      return forceRefreshToken ? ((await refresh()) ?? null) : ((await getAccessToken()) ?? null)
    },
    [getAccessToken, refresh, user],
  )

  return useMemo(
    () => ({ isLoading: loading, isAuthenticated: Boolean(user), fetchAccessToken }),
    [fetchAccessToken, loading, user],
  )
}
