import { requireDemoSession } from './demoAccess'
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const listOffers = query({
  args: { status: v.optional(v.string()), featured: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    if (args.status !== undefined && args.featured !== undefined) {
      return ctx.db
        .query('offers')
        .filter((q) =>
          q.and(q.eq(q.field('status'), args.status), q.eq(q.field('featured'), args.featured)),
        )
        .collect()
    }
    return ctx.db.query('offers').collect()
  },
})

export const updateOffer = mutation({
  args: {
    offerId: v.id('offers'),
    name: v.optional(v.string()),
    summary: v.optional(v.string()),
    status: v.optional(v.string()),
    defaultPublisherShareBps: v.optional(v.number()),
    terms: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    const { offerId, ...changes } = args
    const offer = await ctx.db.get(offerId)
    if (!offer) throw new Error('Offer not found')
    if (
      changes.defaultPublisherShareBps !== undefined &&
      (!Number.isInteger(changes.defaultPublisherShareBps) ||
        changes.defaultPublisherShareBps < 0 ||
        changes.defaultPublisherShareBps > 10_000)
    ) {
      throw new Error('Publisher share must be between 0 and 10,000 basis points')
    }
    await ctx.db.patch(offerId, { ...changes, updatedAt: Date.now() })
    return offerId
  },
})
