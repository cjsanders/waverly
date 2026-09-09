import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

import { NetworkWorkspace } from '#/features/network/NetworkWorkspace'
import { parseWorkspaceSearch, type WorkspaceSearch } from '#/features/network/workspace-search'
import { redirectUnlessKind } from '#/lib/mode-routes'

export const Route = createFileRoute('/_app/_workspace/operator/')({
  validateSearch: parseWorkspaceSearch,
  beforeLoad: ({ context }) => redirectUnlessKind(context.workspace, 'operator'),
  component: OperatorWorkspace,
})

function OperatorWorkspace() {
  const navigate = useNavigate({ from: '/operator/' })
  const search = Route.useSearch()
  const onSearchChange = useCallback(
    (next: WorkspaceSearch, replace = false) => {
      void navigate({ search: next, replace, resetScroll: true })
    },
    [navigate],
  )
  return <NetworkWorkspace mode="operator" search={search} onSearchChange={onSearchChange} />
}
