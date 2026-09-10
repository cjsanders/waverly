import { convexQuery } from '@convex-dev/react-query'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { api } from '../../convex/_generated/api'
import { syncViewerFn } from '#/server/viewer'

/** Signed-in area. Requires a session and loads the viewer's mirrored user and workspaces. */
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context, location }) => {
    if (!context.user) {
      throw redirect({
        href: `/api/auth/sign-in?returnPathname=${encodeURIComponent(location.href)}`,
      })
    }

    const viewerQuery = convexQuery(api.viewer.get, {})
    let viewer = await context.queryClient.ensureQueryData(viewerQuery)

    if (!viewer) {
      // The sign-in hook did not mirror this user yet (or failed); do it now and re-read.
      await syncViewerFn()
      // The SSR client's consistent timestamp predates the sync mutation. Re-read at the
      // latest timestamp so a newly mirrored account is visible in this request.
      viewer = context.convexQueryClient.serverHttpClient
        ? await context.convexQueryClient.serverHttpClient.query(api.viewer.get, {})
        : await context.queryClient.fetchQuery({ ...viewerQuery, staleTime: 0 })
      context.queryClient.setQueryData(viewerQuery.queryKey, viewer)
    }

    if (!viewer) throw new Error('Could not load your account')

    return { viewer }
  },
  component: Outlet,
})
