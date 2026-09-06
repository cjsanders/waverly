import { requireDemoSession } from './demoAccess'
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    const status = args.status
    if (status) {
      return ctx.db
        .query('publishers')
        .withIndex('by_status', (q) => q.eq('status', status))
        .collect()
    }
    return ctx.db.query('publishers').collect()
  },
})

export const approvePublisher = mutation({
  args: {
    publisherId: v.id('publishers'),
    reason: v.string(),
    actor: v.string(),
  },
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    const publisher = await ctx.db.get(args.publisherId)
    if (!publisher) throw new Error('Publisher not found')
    const now = Date.now()
    await ctx.db.patch(args.publisherId, {
      status: 'active',
      updatedAt: now,
      statusHistory: [
        ...(publisher.statusHistory ?? []),
        {
          status: 'active',
          reason: args.reason,
          changedAt: now,
          changedBy: (await requireDemoSession(ctx)).tokenIdentifier,
        },
      ],
    })
    return args.publisherId
  },
})

export const approveProperty = mutation({
  args: {
    propertyId: v.id('properties'),
    reason: v.string(),
    actor: v.string(),
  },
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    const property = await ctx.db.get(args.propertyId)
    if (!property) throw new Error('Property not found')
    const now = Date.now()
    await ctx.db.patch(args.propertyId, {
      approvalStatus: 'approved',
      updatedAt: now,
      statusHistory: [
        ...(property.statusHistory ?? []),
        {
          status: 'approved',
          reason: args.reason,
          changedAt: now,
          changedBy: (await requireDemoSession(ctx)).tokenIdentifier,
        },
      ],
    })
    return args.propertyId
  },
})
