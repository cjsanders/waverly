import { v } from 'convex/values'
import { internalMutation } from './_generated/server'
import { upsertMarketplaces } from './lib/marketplaces'

/**
 * Seeds the global marketplace catalog on isolated preview deployments (ADR 0002). Tenant demo
 * data still seeds lazily on first sign-in through `network.initialize`.
 */
export default internalMutation({
  args: {},
  returns: v.object({ seeded: v.boolean(), inserted: v.number() }),
  handler: async (ctx) => {
    // This opt-in is configured only in the project's preview defaults.
    if (process.env.WAVERLY_PREVIEW_SEED_ENABLED !== 'true') {
      throw new Error('Preview seeding is disabled for this deployment')
    }
    if (await ctx.db.query('marketplaces').first()) return { seeded: false, inserted: 0 }
    const { inserted } = await upsertMarketplaces(ctx.db, Date.now())
    return { seeded: true, inserted }
  },
})
