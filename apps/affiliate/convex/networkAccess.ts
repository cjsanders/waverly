import type { Auth } from 'convex/server'

/** Require a verified WorkOS session before accessing network data. */
export async function requireNetworkSession(ctx: { auth: Auth }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Sign in to access this workspace.')
  return identity
}
