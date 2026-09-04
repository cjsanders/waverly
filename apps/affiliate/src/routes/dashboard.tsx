import { createFileRoute, redirect } from '@tanstack/react-router'
import { Card, CardDescription, CardHeader, CardTitle } from '@waverly/design-system/ui/card'

import { AppShell } from '#/components/app-shell'

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
