import { createServerFn, createServerOnlyFn } from '@tanstack/react-start'
import { getAuth, type User } from '@workos/authkit-tanstack-react-start'
import { ConvexHttpClient } from 'convex/browser'

import { api } from '../../convex/_generated/api'
import { listWorkOSMemberships } from './workos'

/**
 * Mirrors a WorkOS user and their memberships into Convex. Runs after sign-in and whenever the
 * app finds a signed-in user with no mirror yet. Convex trusts the access token, not this server.
 */
export const syncViewer = createServerOnlyFn(
  async ({ user, accessToken }: { user: User; accessToken: string }) => {
    const convexUrl = process.env.VITE_CONVEX_URL ?? import.meta.env.VITE_CONVEX_URL
    if (!convexUrl) throw new Error('VITE_CONVEX_URL is required')

    const memberships = await listWorkOSMemberships(user.id)
    const convex = new ConvexHttpClient(convexUrl)
    convex.setAuth(accessToken)

    await convex.mutation(api.viewer.sync, {
      user: {
        workosUserId: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        profilePictureUrl: user.profilePictureUrl ?? undefined,
      },
      memberships,
    })
  },
)

/** Re-syncs the signed-in user. Used as a safety net when the sign-in hook did not run. */
export const syncViewerFn = createServerFn({ method: 'POST' }).handler(async () => {
  const auth = await getAuth()
  if (!auth.user) throw new Error('Not signed in')

  await syncViewer({ user: auth.user, accessToken: auth.accessToken })
})
