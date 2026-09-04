import { createServerFn } from '@tanstack/react-start'
import { getAuth } from '@workos/authkit-tanstack-react-start'

import { isOrganizationKind, type OrganizationKind } from '#/lib/workspace'
import { syncViewer } from './viewer'
import { createWorkOSOrganization } from './workos'

export type CreateWorkspaceInput = { name: string; kind: Exclude<OrganizationKind, 'operator'> }

function validateInput(input: unknown): CreateWorkspaceInput {
  if (typeof input !== 'object' || input === null) throw new Error('Invalid input')
  const { name, kind } = input as Record<string, unknown>

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    throw new Error('Workspace name must be between 2 and 80 characters')
  }
  // Operator workspaces are provisioned by Waverly, never through onboarding.
  if (!isOrganizationKind(kind) || kind === 'operator') {
    throw new Error('Choose a brand or creator workspace')
  }

  return { name: name.trim(), kind }
}

/** Creates a workspace for the signed-in user and returns the WorkOS organization to switch to. */
export const createWorkspaceFn = createServerFn({ method: 'POST' })
  .validator(validateInput)
  .handler(async ({ data }) => {
    const auth = await getAuth()
    if (!auth.user) throw new Error('Not signed in')

    const organization = await createWorkOSOrganization({
      workosUserId: auth.user.id,
      name: data.name,
      kind: data.kind,
    })
    await syncViewer({ user: auth.user, accessToken: auth.accessToken })

    return { workosOrganizationId: organization.id, kind: data.kind }
  })
