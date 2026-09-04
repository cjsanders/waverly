import { query } from './_generated/server'

/**
 * The signed-in user as Convex sees them after verifying the WorkOS access token.
 * WorkOS scopes a session to one organization, so the token's `org_id` and `role` claims
 * describe the active workspace.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    return {
      subject: identity.subject,
      organizationId: stringClaim(identity.org_id),
      role: stringClaim(identity.role),
    }
  },
})

function stringClaim(value: unknown) {
  return typeof value === 'string' ? value : null
}
