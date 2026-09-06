import type { Doc, Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'

/** The signed-in user's mirrored row, or null when there is no session or no mirror yet. */
export async function getViewerUser(ctx: QueryCtx): Promise<Doc<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) return null

  return ctx.db
    .query('users')
    .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
    .unique()
}

export async function requireViewerUser(ctx: QueryCtx): Promise<Doc<'users'>> {
  const user = await getViewerUser(ctx)
  if (!user) throw new Error('Not signed in')
  return user
}

/**
 * The viewer's membership in an organization. Authorization is decided by this table, not by the
 * `org_id` claim on the token, so a stale token after switching workspaces cannot grant access.
 */
export async function requireMembership(ctx: QueryCtx, organizationId: Id<'organizations'>) {
  const user = await requireViewerUser(ctx)
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_user_organization', (q) =>
      q.eq('userId', user._id).eq('organizationId', organizationId),
    )
    .unique()

  if (!membership) throw new Error('Not a member of this organization')
  return { user, membership }
}
