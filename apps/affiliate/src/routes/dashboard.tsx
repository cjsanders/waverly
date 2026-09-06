import { isDemoIdentity } from '#/features/network/navigation'
import { NetworkWorkspace } from '#/features/network/NetworkWorkspace'
import type { DemoIdentity } from '#/features/network/types'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  ssr: false,
  validateSearch: (
    search: Record<string, unknown>,
  ): { role?: DemoIdentity; page?: string; demoIdentity?: DemoIdentity; demoThread?: string } => ({
    role: isDemoIdentity(search.role) ? search.role : undefined,
    page: typeof search.page === 'string' ? search.page : undefined,
    demoIdentity: isDemoIdentity(search.demoIdentity) ? search.demoIdentity : undefined,
    demoThread: typeof search.demoThread === 'string' ? search.demoThread : undefined,
  }),
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({
        reloadDocument: true,
        href: `/api/auth/sign-in?returnPathname=${encodeURIComponent(location.href)}`,
      })
    }
  },
  component: Dashboard,
})

function Dashboard() {
  return <NetworkWorkspace />
}
