import {
  requireGlobalDocument,
  requireNetworkSession,
  requireTenantDocument,
} from './networkAccess'
import { mutation, query, type MutationCtx } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'

/**
 * A listing is one buyable item on one marketplace (ADR 0003): unique per tenant on
 * `marketplaceId` + `externalId`, owned by a product in the same tenant, optionally tied to the
 * brand's storefront on that marketplace (ADR 0004).
 */
export const list = query({
  args: {
    productId: v.optional(v.id('brandProducts')),
    marketplaceId: v.optional(v.id('marketplaces')),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireNetworkSession(ctx)
    const rows =
      args.productId !== undefined
        ? await ctx.db
            .query('listings')
            .withIndex('by_productId', (q) => q.eq('productId', args.productId!))
            .collect()
        : args.marketplaceId !== undefined
          ? await ctx.db
              .query('listings')
              .withIndex('by_tenantId_marketplaceId', (q) =>
                q.eq('tenantId', tenantId).eq('marketplaceId', args.marketplaceId!),
              )
              .collect()
          : await ctx.db
              .query('listings')
              .withIndex('by_tenantId', (q) => q.eq('tenantId', tenantId))
              .collect()
    return rows.filter(
      (row) =>
        row.tenantId === tenantId && (args.status === undefined || row.status === args.status),
    )
  },
})

export const get = query({
  args: { listingId: v.id('listings') },
  handler: async (ctx, { listingId }) => {
    const { tenantId } = await requireNetworkSession(ctx)
    const listing = requireTenantDocument(
      await ctx.db.get(listingId),
      tenantId,
      'Listing not found',
    )
    const [product, marketplace] = await Promise.all([
      ctx.db.get(listing.productId),
      ctx.db.get(listing.marketplaceId),
    ])
    return { listing, product, marketplace }
  },
})

export const create = mutation({
  args: {
    productId: v.id('brandProducts'),
    marketplaceId: v.id('marketplaces'),
    storefrontId: v.optional(v.id('brandStorefronts')),
    externalId: v.string(),
    parentExternalId: v.optional(v.string()),
    url: v.string(),
    title: v.optional(v.string()),
    priceCents: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  returns: v.id('listings'),
  handler: async (ctx, args) => {
    const session = await requireNetworkSession(ctx)
    const { tenantId } = session
    requireTenantDocument(await ctx.db.get(args.productId), tenantId, 'Product not found')
    const marketplace = requireGlobalDocument(
      await ctx.db.get(args.marketplaceId),
      'Marketplace not found',
    )
    if (args.storefrontId !== undefined) {
      const storefront = requireTenantDocument(
        await ctx.db.get(args.storefrontId),
        tenantId,
        'Storefront not found',
      )
      if (storefront.marketplaceId !== args.marketplaceId) {
        throw new Error(`That storefront is not on ${marketplace.name}`)
      }
    }
    const currency = args.currency ?? marketplace.currency
    if (!currency) throw new Error(`Listings on ${marketplace.name} must set a currency`)
    await requireUnusedExternalId(
      ctx,
      tenantId,
      args.marketplaceId,
      args.externalId,
      marketplace.name,
    )
    const now = Date.now()
    return ctx.db.insert('listings', {
      tenantId,
      productId: args.productId,
      marketplaceId: args.marketplaceId,
      storefrontId: args.storefrontId,
      externalId: args.externalId,
      parentExternalId: args.parentExternalId,
      url: args.url,
      title: args.title,
      priceCents: args.priceCents,
      currency,
      status: 'active',
      source: 'manual',
      createdAt: now,
      updatedAt: now,
      statusHistory: [{ status: 'active', changedAt: now, changedBy: session.tokenIdentifier }],
    })
  },
})

export const update = mutation({
  args: {
    listingId: v.id('listings'),
    storefrontId: v.optional(v.id('brandStorefronts')),
    parentExternalId: v.optional(v.string()),
    url: v.optional(v.string()),
    title: v.optional(v.string()),
    priceCents: v.optional(v.number()),
    currency: v.optional(v.string()),
    status: v.optional(v.string()),
    reason: v.optional(v.string()),
  },
  returns: v.id('listings'),
  handler: async (ctx, args) => {
    const session = await requireNetworkSession(ctx)
    const { tenantId } = session
    const { listingId, reason, ...changes } = args
    const listing = requireTenantDocument(
      await ctx.db.get(listingId),
      tenantId,
      'Listing not found',
    )
    if (changes.storefrontId !== undefined) {
      const storefront = requireTenantDocument(
        await ctx.db.get(changes.storefrontId),
        tenantId,
        'Storefront not found',
      )
      if (storefront.marketplaceId !== listing.marketplaceId) {
        throw new Error('That storefront is on a different marketplace')
      }
    }
    const now = Date.now()
    const statusHistory =
      changes.status !== undefined && changes.status !== listing.status
        ? [
            ...(listing.statusHistory ?? []),
            { status: changes.status, reason, changedAt: now, changedBy: session.tokenIdentifier },
          ]
        : listing.statusHistory
    await ctx.db.patch(listingId, { ...changes, statusHistory, updatedAt: now })
    return listingId
  },
})

async function requireUnusedExternalId(
  ctx: Pick<MutationCtx, 'db'>,
  tenantId: string,
  marketplaceId: Id<'marketplaces'>,
  externalId: string,
  marketplaceName: string,
) {
  const clash = await ctx.db
    .query('listings')
    .withIndex('by_tenantId_marketplaceId_externalId', (q) =>
      q.eq('tenantId', tenantId).eq('marketplaceId', marketplaceId).eq('externalId', externalId),
    )
    .first()
  if (clash) throw new Error(`${externalId} is already listed on ${marketplaceName}`)
}
