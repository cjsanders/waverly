import { createFileRoute } from '@tanstack/react-router'

import { AppShell } from '#/components/app-shell'
import { EmptyOverview } from '#/components/empty-overview'
import { redirectUnlessKind } from '#/lib/mode-routes'

export const Route = createFileRoute('/_app/_workspace/brand/')({
  beforeLoad: ({ context }) => redirectUnlessKind(context.workspace, 'brand'),
  component: Overview,
})

function Overview() {
  return (
    <AppShell title="Overview">
      <EmptyOverview>
        Creator activity, conversions, and campaign spend will appear here once data starts flowing.
      </EmptyOverview>
    </AppShell>
  )
}
