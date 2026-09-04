import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Card, CardDescription, CardHeader, CardTitle } from '@waverly/design-system/ui/card'

import { AppShell } from '#/components/app-shell'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({
        href: `/api/auth/sign-in?returnPathname=${encodeURIComponent(location.href)}`,
      })
    }
  },
  component: Dashboard,
})

function Dashboard() {
  return (
    <AppShell title="Overview">
      <ConvexSessionStatus />
      <Card className="shadow-sm">
        <CardHeader className="items-center py-16 text-center">
          <CardTitle className="text-2xl">Nothing to show yet</CardTitle>
          <CardDescription className="mt-1 max-w-md text-base">
            Creator sales, commissions, and campaign performance will appear here once data starts
            flowing.
          </CardDescription>
        </CardHeader>
      </Card>
    </AppShell>
  )
}

/** Shows what Convex sees after verifying the WorkOS access token, so a broken token chain is visible. */
function ConvexSessionStatus() {
  const { data: viewer, isPending } = useQuery(convexQuery(api.viewer.get, {}))

  const label = isPending
    ? 'Connecting to Convex…'
    : viewer
      ? [
          'Convex session',
          viewer.role ?? 'member',
          viewer.organizationId ?? 'no organization',
        ].join(' · ')
      : 'Convex did not accept the session'

  return (
    <p data-testid="convex-session" className="mb-4 text-xs text-muted-foreground">
      {label}
    </p>
  )
}
