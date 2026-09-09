import { createFileRoute } from '@tanstack/react-router'
import { getSignInUrl } from '@workos/authkit-tanstack-react-start'

import { getEmulatedSignInRedirect } from '#/server/sign-in'

export const Route = createFileRoute('/api/auth/sign-in')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const searchParams = new URL(request.url).searchParams
        const returnPathname = searchParams.get('returnPathname')
        const organizationId = searchParams.get('organizationId')
        const emulatedRedirect = getEmulatedSignInRedirect(request, returnPathname)
        if (emulatedRedirect) return emulatedRedirect

        const url = await getSignInUrl({
          data: {
            ...(returnPathname ? { returnPathname } : {}),
            ...(organizationId ? { organizationId } : {}),
          },
        })

        return new Response(null, {
          status: 307,
          headers: { Location: url },
        })
      },
    },
  },
})
