import { v } from 'convex/values'

import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { getViewerUser } from './lib/access'
import { organizationKind } from './schema'

const kindOrder: Record<Doc<'organizations'>['kind'], number> = {
  operator: 0,
  brand: 1,
  creator: 2,
}

/** The signed-in user and every workspace they belong to, or null before the first sync. */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerUser(ctx)
    if (!user) return null

    const rows = await ctx.db
      .query('memberships')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    const organizations = await Promise.all(rows.map((row) => ctx.db.get(row.organizationId)))
    const memberships = rows.flatMap((row, index) => {
      const organization = organizations[index]
      return organization ? [{ ...row, organization }] : []
    })

    memberships.sort(
      (a, b) =>
        kindOrder[a.organization.kind] - kindOrder[b.organization.kind] ||
        a.organization.name.localeCompare(b.organization.name),
    )

    return { user, memberships }
  },
})

/**
 * Mirrors the viewer's WorkOS user, organizations, and memberships. The Start server gathers the
 * payload from the WorkOS API and calls this with the viewer's own access token, so the token
 * subject must match the user being written.
 */
export const sync = mutation({
  args: {
    user: v.object({
      workosUserId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      profilePictureUrl: v.optional(v.string()),
    }),
    memberships: v.array(
      v.object({
        role: v.string(),
        organization: v.object({
          workosOrganizationId: v.string(),
          name: v.string(),
          kind: organizationKind,
        }),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not signed in')
    if (identity.subject !== args.user.workosUserId) {
      throw new Error('Cannot sync another user')
    }

    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', args.user.workosUserId))
      .unique()
    const userId = existingUser
      ? (await ctx.db.patch(existingUser._id, args.user), existingUser._id)
      : await ctx.db.insert('users', args.user)

    const current = await ctx.db
      .query('memberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    const keep = await Promise.all(
      args.memberships.map(async ({ organization, role }) => {
        const existingOrganization = await ctx.db
          .query('organizations')
          .withIndex('by_workos_organization_id', (q) =>
            q.eq('workosOrganizationId', organization.workosOrganizationId),
          )
          .unique()
        const organizationId = existingOrganization
          ? (await ctx.db.patch(existingOrganization._id, organization), existingOrganization._id)
          : await ctx.db.insert('organizations', organization)

        const membership = current.find((row) => row.organizationId === organizationId)
        if (!membership) {
          await ctx.db.insert('memberships', { userId, organizationId, role })
        } else if (membership.role !== role) {
          await ctx.db.patch(membership._id, { role })
        }

        return organizationId
      }),
    )

    await Promise.all(
      current
        .filter((row) => !keep.includes(row.organizationId))
        .map((row) => ctx.db.delete(row._id)),
    )
  },
})
