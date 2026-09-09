import { requireNetworkSession, requireTenantDocument } from './networkAccess'
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const balances = query({
  args: { publisherId: v.id('publishers') },
  handler: async (ctx, { publisherId }) => {
    const { tenantId } = await requireNetworkSession(ctx)
    requireTenantDocument(await ctx.db.get(publisherId), tenantId, 'Publisher not found')
    const entries = await ctx.db
      .query('ledgerEntries')
      .withIndex('by_publisherId_effectiveAt', (q) => q.eq('publisherId', publisherId))
      .filter((q) => q.eq(q.field('tenantId'), tenantId))
      .collect()
    return entries.reduce<Record<string, number>>((totals, entry) => {
      totals[entry.balanceState] = (totals[entry.balanceState] ?? 0) + entry.amountCents
      return totals
    }, {})
  },
})

export const append = mutation({
  args: {
    publisherId: v.id('publishers'),
    conversionId: v.optional(v.id('conversions')),
    payoutId: v.optional(v.id('payouts')),
    entryType: v.string(),
    balanceState: v.string(),
    amountCents: v.number(),
    effectiveAt: v.number(),
    actor: v.string(),
    idempotencyKey: v.string(),
    memo: v.string(),
    snapshot: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const session = await requireNetworkSession(ctx)
    const { tenantId } = session
    requireTenantDocument(await ctx.db.get(args.publisherId), tenantId, 'Publisher not found')
    if (args.conversionId) {
      requireTenantDocument(await ctx.db.get(args.conversionId), tenantId, 'Conversion not found')
    }
    if (args.payoutId) {
      requireTenantDocument(await ctx.db.get(args.payoutId), tenantId, 'Payout not found')
    }
    if (!Number.isInteger(args.amountCents))
      throw new Error('Ledger amounts must use integer cents')
    const existing = await ctx.db
      .query('ledgerEntries')
      .withIndex('by_idempotencyKey', (q) => q.eq('idempotencyKey', args.idempotencyKey))
      .filter((q) => q.eq(q.field('tenantId'), tenantId))
      .unique()
    if (existing) return { ledgerEntryId: existing._id, created: false }

    const ledgerEntryId = await ctx.db.insert('ledgerEntries', {
      tenantId,
      publisherId: args.publisherId,
      conversionId: args.conversionId,
      payoutId: args.payoutId,
      entryType: args.entryType,
      balanceState: args.balanceState,
      amountCents: args.amountCents,
      currency: 'USD',
      effectiveAt: args.effectiveAt,
      createdAt: Date.now(),
      createdBy: session.tokenIdentifier,
      idempotencyKey: args.idempotencyKey,
      memo: args.memo,
      snapshot: args.snapshot,
    })
    return { ledgerEntryId, created: true }
  },
})
