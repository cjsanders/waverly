import { createFileRoute } from '@tanstack/react-router'
import { getSignInUrl } from '@workos/authkit-tanstack-react-start'

import { getEmulatedSignInRedirect } from '#/server/sign-in'

export const Route = createFileRoute('/api/auth/sign-in')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const returnPathname = new URL(request.url).searchParams.get('returnPathname')
        const emulatedRedirect = getEmulatedSignInRedirect(request, returnPathname)
        if (emulatedRedirect) return emulatedRedirect

        const url = await getSignInUrl(returnPathname ? { data: { returnPathname } } : undefined)

        return new Response(null, {
          status: 307,
          headers: { Location: url },
        })
      },
    },
  },
})
