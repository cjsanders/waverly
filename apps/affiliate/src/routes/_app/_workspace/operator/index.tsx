import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

import { loadWorkspaceData } from '#/features/network/queries'
import { NetworkWorkspace } from '#/features/network/NetworkWorkspace'
import { parseWorkspaceSearch, type WorkspaceSearch } from '#/features/network/workspace-search'
import { redirectUnlessKind } from '#/lib/mode-routes'
import { useWorkspace } from '#/lib/workspace'

export const Route = createFileRoute('/_app/_workspace/operator/')({
  validateSearch: parseWorkspaceSearch,
  loaderDeps: ({ search }) => search,
  loader: loadWorkspaceData,
  beforeLoad: ({ context }) => redirectUnlessKind(context.workspace, 'operator'),
  component: OperatorWorkspace,
})

function OperatorWorkspace() {
  const workspace = useWorkspace()
  const navigate = useNavigate({ from: '/operator/' })
  const search = Route.useSearch()
  const onSearchChange = useCallback(
    (next: WorkspaceSearch, replace = false) => {
      void navigate({ search: next, replace, resetScroll: true })
    },
    [navigate],
  )
  return (
    <NetworkWorkspace
      key={workspace.organization.workosOrganizationId}
      mode="operator"
      search={search}
      onSearchChange={onSearchChange}
    />
  )
}
