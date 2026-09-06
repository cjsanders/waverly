import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const statusChange = v.object({
  status: v.string(),
  reason: v.optional(v.string()),
  changedAt: v.number(),
  changedBy: v.string(),
})

export default defineSchema(
  {
    products: defineTable({ title: v.string(), imageId: v.string(), price: v.number() }),
    publishers: defineTable({
      slug: v.string(),
      name: v.string(),
      status: v.string(),
      defaultPublisherShareBps: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
      statusHistory: v.optional(v.array(statusChange)),
      metadata: v.optional(v.any()),
    })
      .index('by_slug', ['slug'])
      .index('by_status', ['status']),

    properties: defineTable({
      publisherId: v.id('publishers'),
      name: v.string(),
      type: v.string(),
      urlOrHandle: v.string(),
      approvalStatus: v.string(),
      verificationStatus: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      statusHistory: v.optional(v.array(statusChange)),
      metadata: v.optional(v.any()),
    })
      .index('by_publisherId', ['publisherId'])
      .index('by_publisherId_approvalStatus', ['publisherId', 'approvalStatus']),

    providers: defineTable({
      key: v.string(),
      name: v.string(),
      status: v.string(),
      dataLatencyMinutes: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
      metadata: v.optional(v.any()),
    }).index('by_key', ['key']),

    providerAccounts: defineTable({
      providerId: v.id('providers'),
      externalAccountRef: v.string(),
      connectionStatus: v.string(),
      lastSuccessfulSyncAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
      metadata: v.optional(v.any()),
    })
      .index('by_providerId', ['providerId'])
      .index('by_providerId_externalAccountRef', ['providerId', 'externalAccountRef']),

    advertisers: defineTable({
      slug: v.string(),
      name: v.string(),
      status: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      metadata: v.optional(v.any()),
    })
      .index('by_slug', ['slug'])
      .index('by_status', ['status']),

    programs: defineTable({
      providerId: v.id('providers'),
      advertiserId: v.id('advertisers'),
      externalProgramRef: v.string(),
      name: v.string(),
      status: v.string(),
      attributionWindowDays: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
      metadata: v.optional(v.any()),
    })
      .index('by_providerId', ['providerId'])
      .index('by_advertiserId', ['advertiserId'])
      .index('by_advertiserId_providerId', ['advertiserId', 'providerId']),

    offers: defineTable({
      advertiserId: v.id('advertisers'),
      programId: v.id('programs'),
      providerId: v.id('providers'),
      slug: v.string(),
      name: v.string(),
      summary: v.string(),
      status: v.string(),
      access: v.string(),
      featured: v.boolean(),
      defaultPublisherShareBps: v.number(),
      attributionWindowDays: v.number(),
      startsAt: v.optional(v.number()),
      endsAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
      terms: v.optional(v.any()),
      metadata: v.optional(v.any()),
    })
      .index('by_slug', ['slug'])
      .index('by_programId', ['programId'])
      .index('by_advertiserId', ['advertiserId'])
      .index('by_status_featured', ['status', 'featured']),

    links: defineTable({
      publisherId: v.id('publishers'),
      propertyId: v.id('properties'),
      advertiserId: v.id('advertisers'),
      offerId: v.optional(v.id('offers')),
      slug: v.string(),
      displayName: v.string(),
      status: v.string(),
      currentVersionId: v.optional(v.id('linkVersions')),
      currentVersion: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
      reporting: v.optional(v.any()),
    })
      .index('by_slug', ['slug'])
      .index('by_publisherId', ['publisherId'])
      .index('by_publisherId_createdAt', ['publisherId', 'createdAt'])
      .index('by_offerId', ['offerId']),

    linkVersions: defineTable({
      linkId: v.id('links'),
      version: v.number(),
      providerId: v.id('providers'),
      programId: v.id('programs'),
      originalDestinationUrl: v.string(),
      normalizedDestinationUrl: v.string(),
      providerTrackingUrl: v.string(),
      createdAt: v.number(),
      createdBy: v.string(),
      changeReason: v.string(),
      attributionDefaults: v.optional(v.any()),
      providerSnapshot: v.optional(v.any()),
    })
      .index('by_linkId_version', ['linkId', 'version'])
      .index('by_providerId', ['providerId']),

    clicks: defineTable({
      linkId: v.id('links'),
      linkVersionId: v.id('linkVersions'),
      publisherId: v.id('publishers'),
      propertyId: v.id('properties'),
      clickedAt: v.number(),
      uniqueKey: v.optional(v.string()),
      attribution: v.optional(v.any()),
      request: v.optional(v.any()),
    })
      .index('by_linkId_clickedAt', ['linkId', 'clickedAt'])
      .index('by_publisherId_clickedAt', ['publisherId', 'clickedAt']),

    commissionRules: defineTable({
      scopeType: v.string(),
      publisherId: v.optional(v.id('publishers')),
      offerId: v.optional(v.id('offers')),
      programId: v.optional(v.id('programs')),
      publisherShareBps: v.number(),
      active: v.boolean(),
      startsAt: v.number(),
      endsAt: v.optional(v.number()),
      createdAt: v.number(),
      createdBy: v.string(),
      metadata: v.optional(v.any()),
    })
      .index('by_publisherId_offerId_active', ['publisherId', 'offerId', 'active'])
      .index('by_publisherId_programId_active', ['publisherId', 'programId', 'active'])
      .index('by_publisherId_active', ['publisherId', 'active'])
      .index('by_scopeType_active', ['scopeType', 'active']),

    conversions: defineTable({
      providerId: v.id('providers'),
      providerTransactionId: v.string(),
      publisherId: v.id('publishers'),
      propertyId: v.id('properties'),
      advertiserId: v.id('advertisers'),
      programId: v.id('programs'),
      offerId: v.optional(v.id('offers')),
      linkId: v.optional(v.id('links')),
      linkVersionId: v.optional(v.id('linkVersions')),
      occurredAt: v.number(),
      updatedAt: v.number(),
      status: v.string(),
      currency: v.string(),
      orderValueCents: v.number(),
      grossCommissionCents: v.number(),
      publisherEarningsCents: v.number(),
      waverlyRevenueCents: v.number(),
      commissionRuleId: v.optional(v.id('commissionRules')),
      commissionRuleSnapshot: v.any(),
      attributionSnapshot: v.optional(v.any()),
      providerSnapshot: v.optional(v.any()),
      reversal: v.optional(v.any()),
    })
      .index('by_providerId_providerTransactionId', ['providerId', 'providerTransactionId'])
      .index('by_publisherId_occurredAt', ['publisherId', 'occurredAt'])
      .index('by_linkId', ['linkId'])
      .index('by_status', ['status']),

    providerSyncRuns: defineTable({
      providerId: v.id('providers'),
      providerAccountId: v.id('providerAccounts'),
      externalRunRef: v.optional(v.string()),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
      status: v.string(),
      recordsRead: v.number(),
      recordsCreated: v.number(),
      recordsUpdated: v.number(),
      recordsSkipped: v.number(),
      warnings: v.optional(v.array(v.string())),
      cursor: v.optional(v.string()),
    })
      .index('by_providerId_startedAt', ['providerId', 'startedAt'])
      .index('by_providerAccountId_startedAt', ['providerAccountId', 'startedAt']),

    providerRawRecords: defineTable({
      providerId: v.id('providers'),
      providerAccountId: v.id('providerAccounts'),
      syncRunId: v.id('providerSyncRuns'),
      externalRecordId: v.string(),
      providerTransactionId: v.optional(v.string()),
      recordType: v.string(),
      observedAt: v.number(),
      payloadHash: v.string(),
      normalizationStatus: v.string(),
      normalizedConversionId: v.optional(v.id('conversions')),
      raw: v.any(),
    })
      .index('by_providerId_externalRecordId', ['providerId', 'externalRecordId'])
      .index('by_providerId_providerTransactionId', ['providerId', 'providerTransactionId'])
      .index('by_syncRunId', ['syncRunId']),

    ledgerEntries: defineTable({
      publisherId: v.id('publishers'),
      conversionId: v.optional(v.id('conversions')),
      payoutId: v.optional(v.id('payouts')),
      entryType: v.string(),
      balanceState: v.string(),
      amountCents: v.number(),
      currency: v.string(),
      effectiveAt: v.number(),
      createdAt: v.number(),
      createdBy: v.string(),
      idempotencyKey: v.string(),
      memo: v.string(),
      snapshot: v.optional(v.any()),
    })
      .index('by_idempotencyKey', ['idempotencyKey'])
      .index('by_publisherId_effectiveAt', ['publisherId', 'effectiveAt'])
      .index('by_publisherId_balanceState', ['publisherId', 'balanceState'])
      .index('by_conversionId', ['conversionId'])
      .index('by_payoutId', ['payoutId']),

    payouts: defineTable({
      publisherId: v.id('publishers'),
      status: v.string(),
      currency: v.string(),
      amountCents: v.number(),
      periodStart: v.number(),
      periodEnd: v.number(),
      scheduledAt: v.optional(v.number()),
      processedAt: v.optional(v.number()),
      externalPayoutRef: v.optional(v.string()),
      createdAt: v.number(),
      createdBy: v.string(),
      metadata: v.optional(v.any()),
    })
      .index('by_publisherId_createdAt', ['publisherId', 'createdAt'])
      .index('by_status', ['status']),

    payoutItems: defineTable({
      payoutId: v.id('payouts'),
      publisherId: v.id('publishers'),
      ledgerEntryId: v.id('ledgerEntries'),
      amountCents: v.number(),
      currency: v.string(),
      createdAt: v.number(),
    })
      .index('by_payoutId', ['payoutId'])
      .index('by_ledgerEntryId', ['ledgerEntryId']),

    messageThreads: defineTable({
      key: v.string(),
      subject: v.string(),
      team: v.string(),
      status: v.union(v.literal('online'), v.literal('away')),
      lastMessageAt: v.number(),
      lastMessagePreview: v.string(),
      createdAt: v.number(),
    })
      .index('by_key', ['key'])
      .index('by_lastMessageAt', ['lastMessageAt']),

    messageThreadParticipants: defineTable({
      threadId: v.id('messageThreads'),
      identityKey: v.union(
        v.literal('operator'),
        v.literal('northstar'),
        v.literal('everyday'),
        v.literal('avery'),
        v.literal('puroair'),
      ),
      title: v.string(),
      team: v.string(),
      unreadCount: v.number(),
      joinedAt: v.number(),
    })
      .index('by_identityKey', ['identityKey'])
      .index('by_threadId', ['threadId'])
      .index('by_threadId_and_identityKey', ['threadId', 'identityKey']),

    messageEntries: defineTable({
      threadId: v.id('messageThreads'),
      senderIdentityKey: v.string(),
      senderLabel: v.string(),
      body: v.string(),
      sentAt: v.number(),
      clientNonce: v.optional(v.string()),
    })
      .index('by_threadId_and_sentAt', ['threadId', 'sentAt'])
      .index('by_clientNonce', ['clientNonce']),

    messageAttachments: defineTable({
      threadId: v.id('messageThreads'),
      messageId: v.id('messageEntries'),
      storageId: v.id('_storage'),
      fileName: v.string(),
      contentType: v.string(),
      size: v.number(),
      createdAt: v.number(),
    })
      .index('by_threadId', ['threadId'])
      .index('by_messageId', ['messageId'])
      .index('by_storageId', ['storageId']),

    messageReactions: defineTable({
      threadId: v.id('messageThreads'),
      messageId: v.id('messageEntries'),
      identityKey: v.union(
        v.literal('operator'),
        v.literal('northstar'),
        v.literal('everyday'),
        v.literal('avery'),
        v.literal('puroair'),
      ),
      emoji: v.union(
        v.literal('👍'),
        v.literal('❤️'),
        v.literal('🎉'),
        v.literal('😂'),
        v.literal('👀'),
      ),
      createdAt: v.number(),
    })
      .index('by_threadId', ['threadId'])
      .index('by_messageId', ['messageId'])
      .index('by_messageId_and_identityKey_and_emoji', ['messageId', 'identityKey', 'emoji']),
  },
  {
    schemaValidation: true,
    strictTableNameTypes: true,
  },
)
