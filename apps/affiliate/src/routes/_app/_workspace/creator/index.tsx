import { createFileRoute } from '@tanstack/react-router'

import { AppShell } from '#/components/app-shell'
import { EmptyOverview } from '#/components/empty-overview'
import { redirectUnlessKind } from '#/lib/mode-routes'

export const Route = createFileRoute('/_app/_workspace/creator/')({
  beforeLoad: ({ context }) => redirectUnlessKind(context.workspace, 'creator'),
  component: Overview,
})

function Overview() {
  return (
    <AppShell title="Overview">
      <EmptyOverview>
        Your sales, commissions, and campaign performance will appear here once data starts flowing.
      </EmptyOverview>
    </AppShell>
  )
}
