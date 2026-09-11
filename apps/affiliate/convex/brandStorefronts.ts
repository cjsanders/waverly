import {
  requireGlobalDocument,
  requireNetworkSession,
  requireTenantDocument,
} from './networkAccess'
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

/** A brand's presence on one marketplace (ADR 0004). Unique per tenant on `marketplaceId`. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireNetworkSession(ctx)
    const rows = await ctx.db
      .query('brandStorefronts')
      .withIndex('by_tenantId', (q) => q.eq('tenantId', tenantId))
      .collect()
    const marketplaces = await Promise.all(rows.map((row) => ctx.db.get(row.marketplaceId)))
    return rows.map((storefront, index) => ({ storefront, marketplace: marketplaces[index] }))
  },
})

export const create = mutation({
  args: {
    marketplaceId: v.id('marketplaces'),
    name: v.string(),
    url: v.string(),
    externalSellerRef: v.optional(v.string()),
    autoAcceptApplications: v.optional(v.boolean()),
  },
  returns: v.id('brandStorefronts'),
  handler: async (ctx, args) => {
    const { tenantId } = await requireNetworkSession(ctx)
    const marketplace = requireGlobalDocument(
      await ctx.db.get(args.marketplaceId),
      'Marketplace not found',
    )
    const existing = await ctx.db
      .query('brandStorefronts')
      .withIndex('by_tenantId_marketplaceId', (q) =>
        q.eq('tenantId', tenantId).eq('marketplaceId', args.marketplaceId),
      )
      .first()
    if (existing) throw new Error(`This workspace already has a storefront on ${marketplace.name}`)
    const now = Date.now()
    return ctx.db.insert('brandStorefronts', {
      tenantId,
      marketplaceId: args.marketplaceId,
      name: args.name,
      url: args.url,
      externalSellerRef: args.externalSellerRef,
      status: 'pending',
      autoAcceptApplications: args.autoAcceptApplications,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    storefrontId: v.id('brandStorefronts'),
    name: v.optional(v.string()),
    url: v.optional(v.string()),
    externalSellerRef: v.optional(v.string()),
    status: v.optional(v.string()),
    autoAcceptApplications: v.optional(v.boolean()),
  },
  returns: v.id('brandStorefronts'),
  handler: async (ctx, args) => {
    const { tenantId } = await requireNetworkSession(ctx)
    const { storefrontId, ...changes } = args
    requireTenantDocument(await ctx.db.get(storefrontId), tenantId, 'Storefront not found')
    await ctx.db.patch(storefrontId, { ...changes, updatedAt: Date.now() })
    return storefrontId
  },
})
