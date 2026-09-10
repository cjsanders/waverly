import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

import { loadWorkspace } from '#/features/network/load-workspace'
import { NetworkWorkspace } from '#/features/network/NetworkWorkspace'
import { parseWorkspaceSearch, type WorkspaceSearch } from '#/features/network/workspace-search'
import { redirectUnlessKind } from '#/lib/mode-routes'
import { useWorkspace } from '#/lib/workspace'

export const Route = createFileRoute('/_app/_workspace/brand/')({
  validateSearch: parseWorkspaceSearch,
  loaderDeps: ({ search }) => search,
  loader: loadWorkspace,
  beforeLoad: ({ context }) => redirectUnlessKind(context.workspace, 'brand'),
  component: BrandWorkspace,
})

function BrandWorkspace() {
  const workspace = useWorkspace()
  const navigate = useNavigate({ from: '/brand/' })
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
      mode="brand"
      search={search}
      onSearchChange={onSearchChange}
    />
  )
}
