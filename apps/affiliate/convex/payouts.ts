/* eslint-disable no-await-in-loop -- Preserve ordered writes inside a single Convex transaction. */
import { requireDemoSession } from './demoAccess'
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: { publisherId: v.optional(v.id('publishers')) },
  handler: async (ctx, { publisherId }) => {
    await requireDemoSession(ctx)
    if (publisherId) {
      return ctx.db
        .query('payouts')
        .withIndex('by_publisherId_createdAt', (q) => q.eq('publisherId', publisherId))
        .order('desc')
        .collect()
    }
    return ctx.db.query('payouts').order('desc').collect()
  },
})

export const create = mutation({
  args: {
    publisherId: v.id('publishers'),
    ledgerEntryIds: v.array(v.id('ledgerEntries')),
    periodStart: v.number(),
    periodEnd: v.number(),
    actor: v.string(),
  },
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    if (args.ledgerEntryIds.length === 0)
      throw new Error('Select at least one payable ledger entry')
    if (new Set(args.ledgerEntryIds.map(String)).size !== args.ledgerEntryIds.length) {
      throw new Error('A ledger entry can only appear once in a payout')
    }
    const entries = await Promise.all(args.ledgerEntryIds.map((id) => ctx.db.get(id)))
    if (entries.some((entry) => !entry || entry.publisherId !== args.publisherId)) {
      throw new Error('Every payout item must belong to the selected publisher')
    }
    if (entries.some((entry) => entry?.balanceState !== 'payable')) {
      throw new Error('Only payable ledger entries can be scheduled')
    }
    const existingPayoutItems = await Promise.all(
      args.ledgerEntryIds.map((ledgerEntryId) =>
        ctx.db
          .query('payoutItems')
          .withIndex('by_ledgerEntryId', (q) => q.eq('ledgerEntryId', ledgerEntryId))
          .first(),
      ),
    )
    if (existingPayoutItems.some(Boolean)) {
      throw new Error('A selected ledger entry is already assigned to a payout')
    }
    const amountCents = entries.reduce((sum, entry) => sum + (entry?.amountCents ?? 0), 0)
    if (amountCents < 5_000) throw new Error('Payout does not meet the $50 minimum')

    const now = Date.now()
    const payoutId = await ctx.db.insert('payouts', {
      publisherId: args.publisherId,
      status: 'scheduled',
      currency: 'USD',
      amountCents,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      scheduledAt: now,
      createdAt: now,
      createdBy: (await requireDemoSession(ctx)).tokenIdentifier,
    })

    for (const entry of entries) {
      if (!entry) continue
      await ctx.db.insert('payoutItems', {
        payoutId,
        publisherId: args.publisherId,
        ledgerEntryId: entry._id,
        amountCents: entry.amountCents,
        currency: 'USD',
        createdAt: now,
      })
    }
    await ctx.db.insert('ledgerEntries', {
      publisherId: args.publisherId,
      payoutId,
      entryType: 'payout_scheduled',
      balanceState: 'payable',
      amountCents: -amountCents,
      currency: 'USD',
      effectiveAt: now,
      createdAt: now,
      createdBy: (await requireDemoSession(ctx)).tokenIdentifier,
      idempotencyKey: `payout:${payoutId}:scheduled`,
      memo: 'Funds reserved for scheduled payout',
    })
    await ctx.db.insert('ledgerEntries', {
      publisherId: args.publisherId,
      payoutId,
      entryType: 'payout_scheduled',
      balanceState: 'scheduled',
      amountCents,
      currency: 'USD',
      effectiveAt: now,
      createdAt: now,
      createdBy: (await requireDemoSession(ctx)).tokenIdentifier,
      idempotencyKey: `payout:${payoutId}:scheduled-balance`,
      memo: 'Funds moved into scheduled balance',
    })
    return payoutId
  },
})

export const markPaid = mutation({
  args: { payoutId: v.id('payouts'), actor: v.string(), externalPayoutRef: v.string() },
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    const payout = await ctx.db.get(args.payoutId)
    if (!payout) throw new Error('Payout not found')
    if (payout.status === 'paid') return args.payoutId
    const now = Date.now()
    await ctx.db.patch(args.payoutId, {
      status: 'paid',
      processedAt: now,
      externalPayoutRef: args.externalPayoutRef,
    })
    await ctx.db.insert('ledgerEntries', {
      publisherId: payout.publisherId,
      payoutId: args.payoutId,
      entryType: 'payout_paid',
      balanceState: 'scheduled',
      amountCents: -payout.amountCents,
      currency: 'USD',
      effectiveAt: now,
      createdAt: now,
      createdBy: (await requireDemoSession(ctx)).tokenIdentifier,
      idempotencyKey: `payout:${args.payoutId}:paid`,
      memo: 'Scheduled payout completed',
    })
    await ctx.db.insert('ledgerEntries', {
      publisherId: payout.publisherId,
      payoutId: args.payoutId,
      entryType: 'payout_paid',
      balanceState: 'paid',
      amountCents: payout.amountCents,
      currency: 'USD',
      effectiveAt: now,
      createdAt: now,
      createdBy: (await requireDemoSession(ctx)).tokenIdentifier,
      idempotencyKey: `payout:${args.payoutId}:paid-balance`,
      memo: 'Publisher payout completed',
    })
    return args.payoutId
  },
})
