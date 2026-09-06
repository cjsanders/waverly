import type { Auth } from 'convex/server'

/** This deployment is a shared demo sandbox; persona selection is not authorization. */
export async function requireDemoSession(ctx: { auth: Auth }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Sign in to access the demo workspace.')
  return identity
}
