import { createFileRoute } from '@tanstack/react-router'
import { handleCallbackRoute } from '@workos/authkit-tanstack-react-start'

import { syncViewer } from '#/server/viewer'

export const Route = createFileRoute('/api/auth/callback')({
  server: {
    handlers: {
      GET: handleCallbackRoute({
        onSuccess: async ({ user, accessToken }) => {
          try {
            await syncViewer({ user, accessToken })
          } catch (error) {
            // Sign-in still succeeds; the app layout re-syncs when it finds no mirror.
            console.error('Failed to sync viewer after sign-in', error)
          }
        },
      }),
    },
  },
})
