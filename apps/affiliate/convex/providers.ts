import { requireDemoSession } from './demoAccess'
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import {
  commissionRuleFromSnapshot,
  selectCommissionRule,
  snapshotEconomics,
  type CommissionRuleScope,
} from './domain/economics'

export const recentSyncs = query({
  args: { providerId: v.id('providers'), limit: v.optional(v.number()) },
  handler: async (ctx, { providerId, limit = 10 }) => {
    await requireDemoSession(ctx)
    return ctx.db
      .query('providerSyncRuns')
      .withIndex('by_providerId_startedAt', (q) => q.eq('providerId', providerId))
      .order('desc')
      .take(Math.min(Math.max(limit, 1), 100))
  },
})

export const importConversion = mutation({
  args: {
    providerId: v.id('providers'),
    providerAccountId: v.id('providerAccounts'),
    syncRunId: v.id('providerSyncRuns'),
    externalRecordId: v.string(),
    providerTransactionId: v.string(),
    payloadHash: v.string(),
    raw: v.any(),
    publisherId: v.id('publishers'),
    propertyId: v.id('properties'),
    advertiserId: v.id('advertisers'),
    programId: v.id('programs'),
    offerId: v.optional(v.id('offers')),
    linkId: v.optional(v.id('links')),
    linkVersionId: v.optional(v.id('linkVersions')),
    occurredAt: v.number(),
    status: v.string(),
    orderValueCents: v.number(),
    grossCommissionCents: v.number(),
    attributionSnapshot: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    const existingRaw = await ctx.db
      .query('providerRawRecords')
      .withIndex('by_providerId_externalRecordId', (q) => q.eq('providerId', args.providerId))
      .filter((q) => q.eq(q.field('externalRecordId'), args.externalRecordId))
      .unique()
    const existingConversion = await ctx.db
      .query('conversions')
      .withIndex('by_providerId_providerTransactionId', (q) => q.eq('providerId', args.providerId))
      .filter((q) => q.eq(q.field('providerTransactionId'), args.providerTransactionId))
      .unique()

    if (existingRaw?.payloadHash === args.payloadHash && existingConversion) {
      return { conversionId: existingConversion._id, outcome: 'skipped' as const }
    }

    let economics
    let commissionRuleId
    let commissionRuleSnapshot
    if (existingConversion) {
      const retainedRule = commissionRuleFromSnapshot(existingConversion.commissionRuleSnapshot)
      economics = snapshotEconomics(args.grossCommissionCents, retainedRule)
      commissionRuleId = existingConversion.commissionRuleId
      commissionRuleSnapshot = existingConversion.commissionRuleSnapshot
    } else {
      const ruleDocuments = await ctx.db.query('commissionRules').collect()
      const applicableRules = ruleDocuments.filter((rule) => {
        if (!rule.active) return false
        if (rule.scopeType === 'network_default') return true
        if (rule.publisherId !== args.publisherId) return false
        if (rule.scopeType === 'publisher_default') return true
        if (rule.scopeType === 'publisher_program') return rule.programId === args.programId
        if (rule.scopeType === 'publisher_offer') return rule.offerId === args.offerId
        return false
      })
      const selectedRule = selectCommissionRule(
        applicableRules.map((rule) => ({
          id: String(rule._id),
          scopeType: rule.scopeType as CommissionRuleScope,
          publisherShareBps: rule.publisherShareBps,
          active: rule.active,
          startsAt: rule.startsAt,
          endsAt: rule.endsAt,
        })),
        args.occurredAt,
      )
      const selectedRuleDocument = applicableRules.find(
        (rule) => String(rule._id) === selectedRule.id,
      )
      if (!selectedRuleDocument) {
        throw new Error('Selected commission rule was not found')
      }
      economics = snapshotEconomics(args.grossCommissionCents, selectedRule)
      commissionRuleId = selectedRuleDocument._id
      commissionRuleSnapshot = {
        ...economics.selectedRule,
        selectedAt: args.occurredAt,
      }
    }

    const conversionFields = {
      providerId: args.providerId,
      providerTransactionId: args.providerTransactionId,
      publisherId: args.publisherId,
      propertyId: args.propertyId,
      advertiserId: args.advertiserId,
      programId: args.programId,
      offerId: args.offerId,
      linkId: args.linkId,
      linkVersionId: args.linkVersionId,
      occurredAt: args.occurredAt,
      updatedAt: Date.now(),
      status: args.status,
      currency: 'USD',
      orderValueCents: args.orderValueCents,
      grossCommissionCents: economics.grossCommissionCents,
      publisherEarningsCents: economics.publisherEarningsCents,
      waverlyRevenueCents: economics.waverlyRevenueCents,
      commissionRuleId,
      commissionRuleSnapshot,
      attributionSnapshot: args.attributionSnapshot,
      providerSnapshot: args.raw,
    }

    let conversionId = existingConversion?._id
    let outcome: 'created' | 'updated' = 'updated'
    if (conversionId) {
      await ctx.db.patch(conversionId, conversionFields)
    } else {
      conversionId = await ctx.db.insert('conversions', conversionFields)
      outcome = 'created'
    }

    const rawFields = {
      providerId: args.providerId,
      providerAccountId: args.providerAccountId,
      syncRunId: args.syncRunId,
      externalRecordId: args.externalRecordId,
      providerTransactionId: args.providerTransactionId,
      recordType: 'conversion',
      observedAt: Date.now(),
      payloadHash: args.payloadHash,
      normalizationStatus: 'normalized',
      normalizedConversionId: conversionId,
      raw: args.raw,
    }
    if (existingRaw) await ctx.db.patch(existingRaw._id, rawFields)
    else await ctx.db.insert('providerRawRecords', rawFields)

    return { conversionId, outcome }
  },
})
