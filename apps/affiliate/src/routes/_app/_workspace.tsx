import { Outlet, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useAuth } from '@workos/authkit-tanstack-react-start/client'
import { useEffect } from 'react'

import type { Membership } from '#/lib/workspace'

/**
 * Everything that needs an active workspace. The active workspace is the WorkOS organization on
 * the session; when the session has none yet (fresh sign-up, or a membership added elsewhere) the
 * first workspace is selected client-side, which also refreshes the session claims.
 */
export const Route = createFileRoute('/_app/_workspace')({
  beforeLoad: ({ context }) => {
    const { viewer, session } = context

    if (viewer.memberships.length === 0) throw redirect({ to: '/onboarding' })

    const workspace: Membership | null =
      viewer.memberships.find(
        (membership) => membership.organization.workosOrganizationId === session?.organizationId,
      ) ?? null

    return { workspace }
  },
  component: WorkspaceLayout,
})

function WorkspaceLayout() {
  const { workspace, viewer } = Route.useRouteContext()

  if (!workspace) return <SelectWorkspace membership={viewer.memberships[0]!} />

  return <Outlet />
}

function SelectWorkspace({ membership }: { membership: Membership }) {
  const { switchToOrganization } = useAuth()
  const router = useRouter()
  const organizationId = membership.organization.workosOrganizationId

  useEffect(() => {
    let cancelled = false

    async function select() {
      const result = await switchToOrganization(organizationId)
      if (cancelled) return
      if (result && 'error' in result) {
        console.error('Failed to select workspace', result.error)
        return
      }
      await router.invalidate()
    }

    void select()

    return () => {
      cancelled = true
    }
  }, [organizationId, router, switchToOrganization])

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Opening {membership.organization.name}…
    </div>
  )
}
