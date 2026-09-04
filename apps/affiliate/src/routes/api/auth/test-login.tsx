import { createFileRoute } from '@tanstack/react-router'

import { handleTestLogin } from '#/server/test-login'

export const Route = createFileRoute('/api/auth/test-login')({
  server: {
    handlers: {
      GET: async ({ request }) => handleTestLogin(request),
    },
  },
})
