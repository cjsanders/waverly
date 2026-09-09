import { createFileRoute } from '@tanstack/react-router'

import { handleSignOut } from '#/server/sign-out'

export const Route = createFileRoute('/api/auth/sign-out')({
  server: {
    handlers: {
      GET: async ({ request }) => handleSignOut(request),
    },
  },
})
