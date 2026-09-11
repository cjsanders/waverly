import { requireNetworkSession, requireTenantDocument } from './networkAccess'
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

/**
 * The offer catalog publishers browse. "Marketplace" is reserved for retail sites (ADR 0007), so
 * this module is `offers`, not `marketplace`. Each new offer promotes exactly one listing (ADR 0005).
 */
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

export const createOffer = mutation({
  args: {
    listingId: v.id('listings'),
    programId: v.id('programs'),
    slug: v.string(),
    name: v.string(),
    summary: v.string(),
    defaultPublisherShareBps: v.number(),
    attributionWindowDays: v.optional(v.number()),
    access: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    terms: v.optional(v.any()),
  },
  returns: v.id('offers'),
  handler: async (ctx, args) => {
    const { tenantId } = await requireNetworkSession(ctx)
    requireTenantDocument(await ctx.db.get(args.listingId), tenantId, 'Listing not found')
    const program = requireTenantDocument(
      await ctx.db.get(args.programId),
      tenantId,
      'Program not found',
    )
    requirePublisherShare(args.defaultPublisherShareBps)
    const existing = await ctx.db
      .query('offers')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .filter((q) => q.eq(q.field('tenantId'), tenantId))
      .first()
    if (existing) throw new Error('This offer slug is already in use')
    const now = Date.now()
    return ctx.db.insert('offers', {
      tenantId,
      advertiserId: program.advertiserId,
      programId: program._id,
      providerId: program.providerId,
      listingId: args.listingId,
      slug: args.slug,
      name: args.name,
      summary: args.summary,
      status: 'active',
      access: args.access ?? 'open',
      featured: args.featured ?? false,
      defaultPublisherShareBps: args.defaultPublisherShareBps,
      attributionWindowDays: args.attributionWindowDays ?? program.attributionWindowDays,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      createdAt: now,
      updatedAt: now,
      terms: args.terms,
    })
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
    if (changes.defaultPublisherShareBps !== undefined) {
      requirePublisherShare(changes.defaultPublisherShareBps)
    }
    await ctx.db.patch(offerId, { ...changes, updatedAt: Date.now() })
    return offerId
  },
})

function requirePublisherShare(bps: number) {
  if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) {
    throw new Error('Publisher share must be between 0 and 10,000 basis points')
  }
}
