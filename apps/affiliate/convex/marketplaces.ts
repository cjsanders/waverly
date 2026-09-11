import { requireGlobalDocument, requireNetworkSession } from './networkAccess'
import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'
import { marketplaceKind } from './schema'
import { assertMarketplaceShape } from './lib/marketplaces'

/**
 * The marketplace catalog is global reference data (ADR 0002): any signed-in workspace reads the
 * same rows, so these queries deliberately skip the tenant filter. Writes stay internal until an
 * operator surface exists.
 */
export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireNetworkSession(ctx)
    const rows =
      args.status === undefined
        ? await ctx.db.query('marketplaces').collect()
        : await ctx.db
            .query('marketplaces')
            .withIndex('by_status', (q) => q.eq('status', args.status!))
            .collect()
    return rows.sort((a, b) => a.name.localeCompare(b.name))
  },
})

export const get = query({
  args: { marketplaceId: v.id('marketplaces') },
  handler: async (ctx, { marketplaceId }) => {
    await requireNetworkSession(ctx)
    return requireGlobalDocument(await ctx.db.get(marketplaceId), 'Marketplace not found')
  },
})

export const upsert = internalMutation({
  args: {
    key: v.string(),
    platform: v.string(),
    kind: marketplaceKind,
    name: v.string(),
    countryCode: v.optional(v.string()),
    domain: v.optional(v.string()),
    currency: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.id('marketplaces'),
  handler: async (ctx, args) => {
    assertMarketplaceShape(args)
    const now = Date.now()
    const existing = await ctx.db
      .query('marketplaces')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()
    const { status, ...fields } = args
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...fields,
        status: status ?? existing.status,
        updatedAt: now,
      })
      return existing._id
    }
    return ctx.db.insert('marketplaces', {
      ...fields,
      status: status ?? 'active',
      createdAt: now,
      updatedAt: now,
    })
  },
})
