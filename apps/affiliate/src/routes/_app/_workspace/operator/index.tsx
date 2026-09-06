import { createFileRoute } from '@tanstack/react-router'

import { AppShell } from '#/components/app-shell'
import { EmptyOverview } from '#/components/empty-overview'
import { redirectUnlessKind } from '#/lib/mode-routes'

export const Route = createFileRoute('/_app/_workspace/operator/')({
  beforeLoad: ({ context }) => redirectUnlessKind(context.workspace, 'operator'),
  component: Overview,
})

function Overview() {
  return (
    <AppShell title="Overview">
      <EmptyOverview>
        Network-wide brands, creators, and payouts will appear here once data starts flowing.
      </EmptyOverview>
    </AppShell>
  )
}
