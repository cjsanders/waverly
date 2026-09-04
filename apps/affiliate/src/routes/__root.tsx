import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { getAuth } from '@workos/authkit-tanstack-react-start'
import faviconUrl from '@waverly/design-system/brand/waverly-icon.svg?url'
import { useEffect } from 'react'

import appCss from '../styles.css?url'
import type { RouterContext } from '../router'

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Waverly Affiliate Network',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: faviconUrl,
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const auth = await getAuth()

    if (auth.user) {
      context.convexQueryClient.serverHttpClient?.setAuth(auth.accessToken)
    }

    return { user: auth.user }
  },
  component: () => <Outlet />,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <DisableDevBfcache />
        {children}
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'TanStack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

/**
 * Chrome 149+ closes WebSockets when a page enters the back-forward cache. Vite treats that as a
 * lost dev-server connection and reloads the page when it becomes active again. An unload listener
 * opts this development-only document out of BFCache while preserving HMR.
 */
function DisableDevBfcache() {
  useEffect(() => {
    if (!import.meta.env.DEV) return

    const handleUnload = () => {}
    window.addEventListener('unload', handleUnload)

    return () => window.removeEventListener('unload', handleUnload)
  }, [])

  return null
}
