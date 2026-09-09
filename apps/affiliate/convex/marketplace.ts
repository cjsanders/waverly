import { requireNetworkSession, requireTenantDocument } from './networkAccess'
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const listOffers = query({
  args: { status: v.optional(v.string()), featured: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const { tenantId } = await requireNetworkSession(ctx)
    const rows = await ctx.db
      .query('offers')
      .withIndex('by_tenantId', (q) => q.eq('tenantId', tenantId))
      .collect()
    return rows.filter(
      (row) =>
        (args.status === undefined || row.status === args.status) &&
        (args.featured === undefined || row.featured === args.featured),
    )
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
    const { tenantId } = await requireNetworkSession(ctx)
    const { offerId, ...changes } = args
    requireTenantDocument(await ctx.db.get(offerId), tenantId, 'Offer not found')
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
