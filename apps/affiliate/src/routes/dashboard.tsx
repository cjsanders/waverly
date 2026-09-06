import { createFileRoute, redirect } from '@tanstack/react-router'

import { homePaths } from '#/lib/workspace'

/** Legacy entry point: sends the user to the home of their active workspace's mode. */
export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({
        href: `/api/auth/sign-in?returnPathname=${encodeURIComponent(location.href)}`,
      })
    }
    // The workspace layout resolves which mode to open; creator is only the first hop.
    throw redirect({ to: homePaths.creator })
  },
})
