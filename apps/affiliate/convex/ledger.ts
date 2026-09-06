import { requireDemoSession } from './demoAccess'
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const balances = query({
  args: { publisherId: v.id('publishers') },
  handler: async (ctx, { publisherId }) => {
    await requireDemoSession(ctx)
    const entries = await ctx.db
      .query('ledgerEntries')
      .withIndex('by_publisherId_effectiveAt', (q) => q.eq('publisherId', publisherId))
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
    await requireDemoSession(ctx)
    if (!Number.isInteger(args.amountCents))
      throw new Error('Ledger amounts must use integer cents')
    const existing = await ctx.db
      .query('ledgerEntries')
      .withIndex('by_idempotencyKey', (q) => q.eq('idempotencyKey', args.idempotencyKey))
      .unique()
    if (existing) return { ledgerEntryId: existing._id, created: false }

    const ledgerEntryId = await ctx.db.insert('ledgerEntries', {
      publisherId: args.publisherId,
      conversionId: args.conversionId,
      payoutId: args.payoutId,
      entryType: args.entryType,
      balanceState: args.balanceState,
      amountCents: args.amountCents,
      currency: 'USD',
      effectiveAt: args.effectiveAt,
      createdAt: Date.now(),
      createdBy: (await requireDemoSession(ctx)).tokenIdentifier,
      idempotencyKey: args.idempotencyKey,
      memo: args.memo,
      snapshot: args.snapshot,
    })
    return { ledgerEntryId, created: true }
  },
})
