import { requireNetworkSession, requireTenantDocument } from './networkAccess'
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { tenantId } = await requireNetworkSession(ctx)
    const rows = await ctx.db
      .query('publishers')
      .withIndex('by_tenantId', (q) => q.eq('tenantId', tenantId))
      .collect()
    return args.status ? rows.filter((row) => row.status === args.status) : rows
  },
})

export const approvePublisher = mutation({
  args: {
    publisherId: v.id('publishers'),
    reason: v.string(),
    actor: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requireNetworkSession(ctx)
    const publisher = requireTenantDocument(
      await ctx.db.get(args.publisherId),
      session.tenantId,
      'Publisher not found',
    )
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
          changedBy: session.tokenIdentifier,
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
    const session = await requireNetworkSession(ctx)
    const property = requireTenantDocument(
      await ctx.db.get(args.propertyId),
      session.tenantId,
      'Property not found',
    )
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
          changedBy: session.tokenIdentifier,
        },
      ],
    })
    return args.propertyId
  },
})
