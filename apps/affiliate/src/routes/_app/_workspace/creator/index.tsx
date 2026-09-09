import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

import { NetworkWorkspace } from '#/features/network/NetworkWorkspace'
import { parseWorkspaceSearch, type WorkspaceSearch } from '#/features/network/workspace-search'
import { redirectUnlessKind } from '#/lib/mode-routes'
import { useWorkspace } from '#/lib/workspace'

export const Route = createFileRoute('/_app/_workspace/creator/')({
  validateSearch: parseWorkspaceSearch,
  beforeLoad: ({ context }) => redirectUnlessKind(context.workspace, 'creator'),
  component: CreatorWorkspace,
})

function CreatorWorkspace() {
  const workspace = useWorkspace()
  const navigate = useNavigate({ from: '/creator/' })
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
      mode="creator"
      search={search}
      onSearchChange={onSearchChange}
    />
  )
}
