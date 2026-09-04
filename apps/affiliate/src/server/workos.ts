import { createServerOnlyFn } from '@tanstack/react-start'
import { WorkOS } from '@workos-inc/node'

import { isOrganizationKind, type OrganizationKind } from '#/lib/workspace'

let client: WorkOS | undefined

/** The WorkOS management client. AuthKit handles sessions; this is for organizations and memberships. */
export const getWorkOS = createServerOnlyFn(() => {
  if (client) return client

  const apiKey = process.env.WORKOS_API_KEY
  if (!apiKey) throw new Error('WORKOS_API_KEY is required')

  client = new WorkOS(apiKey, {
    clientId: process.env.WORKOS_CLIENT_ID,
    apiHostname: process.env.WORKOS_API_HOSTNAME,
  })
  return client
})

export type WorkOSMembership = {
  role: string
  organization: { workosOrganizationId: string; name: string; kind: OrganizationKind }
}

/**
 * The user's active WorkOS memberships with each organization's `kind`. Organizations without a
 * valid `kind` in their metadata are skipped so they cannot open the app in an undefined mode.
 */
export const listWorkOSMemberships = createServerOnlyFn(
  async (workosUserId: string): Promise<WorkOSMembership[]> => {
    const workos = getWorkOS()
    const { data } = await workos.userManagement.listOrganizationMemberships({
      userId: workosUserId,
      statuses: ['active'],
      limit: 100,
    })

    const organizations = await Promise.all(
      data.map((membership) => workos.organizations.getOrganization(membership.organizationId)),
    )

    const memberships: WorkOSMembership[] = []
    for (const [index, membership] of data.entries()) {
      const organization = organizations[index]!
      const kind = organization.metadata.kind

      if (!isOrganizationKind(kind)) {
        console.warn(
          `Skipping WorkOS organization ${organization.id} (${organization.name}): metadata.kind is ${JSON.stringify(kind)}`,
        )
        continue
      }

      memberships.push({
        role: membership.role.slug,
        organization: { workosOrganizationId: organization.id, name: organization.name, kind },
      })
    }

    return memberships
  },
)

/** Creates a WorkOS organization of the given kind and makes the user its owner. */
export const createWorkOSOrganization = createServerOnlyFn(
  async (input: { workosUserId: string; name: string; kind: OrganizationKind }) => {
    const workos = getWorkOS()
    const organization = await workos.organizations.createOrganization({
      name: input.name,
      metadata: { kind: input.kind },
    })

    await workos.userManagement.createOrganizationMembership({
      organizationId: organization.id,
      userId: input.workosUserId,
      roleSlug: 'owner',
    })

    return organization
  },
)
