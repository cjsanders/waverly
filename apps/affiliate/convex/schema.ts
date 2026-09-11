import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

/**
 * What a workspace is for. The kind lives on the WorkOS organization as `metadata.kind` and is
 * mirrored here; it decides which mode of the app (creator, brand, operator) the workspace opens in.
 */
export const organizationKind = v.union(
  v.literal('creator'),
  v.literal('brand'),
  v.literal('operator'),
)

/** Retail sites carry a country; brand-owned store platforms (Shopify) do not (ADR 0004). */
export const marketplaceKind = v.union(v.literal('retailer'), v.literal('dtc'))

const statusChange = v.object({
  status: v.string(),
  reason: v.optional(v.string()),
  changedAt: v.number(),
  changedBy: v.string(),
})

export default defineSchema(
  {
    /** One row per WorkOS user, mirrored on sign-in. */
    users: defineTable({
      workosUserId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      profilePictureUrl: v.optional(v.string()),
    }).index('by_workos_user_id', ['workosUserId']),

    /** One row per WorkOS organization, mirrored when any member signs in. */
    organizations: defineTable({
      workosOrganizationId: v.string(),
      name: v.string(),
      kind: organizationKind,
    }).index('by_workos_organization_id', ['workosOrganizationId']),

    /** Mirrors WorkOS organization memberships. `role` is the WorkOS role slug. */
    memberships: defineTable({
      userId: v.id('users'),
      organizationId: v.id('organizations'),
      role: v.string(),
    })
      .index('by_user', ['userId'])
      .index('by_organization', ['organizationId'])
      .index('by_user_organization', ['userId', 'organizationId']),

    publishers: defineTable({
      tenantId: v.optional(v.string()),
      slug: v.string(),
      name: v.string(),
      status: v.string(),
      defaultPublisherShareBps: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
      statusHistory: v.optional(v.array(statusChange)),
      metadata: v.optional(v.any()),
    })
      .index('by_tenantId', ['tenantId'])
      .index('by_slug', ['slug'])
      .index('by_status', ['status']),

    properties: defineTable({
      tenantId: v.optional(v.string()),
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
      .index('by_tenantId', ['tenantId'])
      .index('by_publisherId', ['publisherId'])
      .index('by_publisherId_approvalStatus', ['publisherId', 'approvalStatus']),

    providers: defineTable({
      tenantId: v.optional(v.string()),
      key: v.string(),
      name: v.string(),
      status: v.string(),
      dataLatencyMinutes: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
      metadata: v.optional(v.any()),
    })
      .index('by_tenantId', ['tenantId'])
      .index('by_key', ['key']),

    providerAccounts: defineTable({
      tenantId: v.optional(v.string()),
      providerId: v.id('providers'),
      externalAccountRef: v.string(),
      connectionStatus: v.string(),
      lastSuccessfulSyncAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
      metadata: v.optional(v.any()),
    })
      .index('by_tenantId', ['tenantId'])
      .index('by_providerId', ['providerId'])
      .index('by_providerId_externalAccountRef', ['providerId', 'externalAccountRef']),

    advertisers: defineTable({
      tenantId: v.optional(v.string()),
      slug: v.string(),
      name: v.string(),
      status: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      metadata: v.optional(v.any()),
    })
      .index('by_tenantId', ['tenantId'])
      .index('by_slug', ['slug'])
      .index('by_status', ['status']),

    /**
     * Global marketplace catalog, one row per country site (ADR 0001). The only network table
     * without a `tenantId` (ADR 0002): Amazon US is the same site for every workspace.
     */
    marketplaces: defineTable({
      key: v.string(),
      platform: v.string(),
      kind: marketplaceKind,
      name: v.string(),
      countryCode: v.optional(v.string()),
      domain: v.optional(v.string()),
      currency: v.optional(v.string()),
      status: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      metadata: v.optional(v.any()),
    })
      .index('by_key', ['key'])
      .index('by_platform', ['platform'])
      .index('by_status', ['status']),

    /** A brand's presence on one marketplace (ADR 0004). Unique per tenant on `marketplaceId`. */
    brandStorefronts: defineTable({
      tenantId: v.string(),
      marketplaceId: v.id('marketplaces'),
      name: v.string(),
      url: v.string(),
      externalSellerRef: v.optional(v.string()),
      status: v.string(),
      autoAcceptApplications: v.optional(v.boolean()),
      createdAt: v.number(),
      updatedAt: v.number(),
      metadata: v.optional(v.any()),
    })
      .index('by_tenantId', ['tenantId'])
      .index('by_tenantId_marketplaceId', ['tenantId', 'marketplaceId']),

    /** Brand-owned catalog (ADR 0003). Tenant-scoped; no advertiser reference (ADR 0006). */
    products: defineTable({
      tenantId: v.string(),
      name: v.string(),
      sku: v.optional(v.string()),
      description: v.optional(v.string()),
      imageUrls: v.array(v.string()),
      status: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      statusHistory: v.optional(v.array(statusChange)),
      metadata: v.optional(v.any()),
    })
      .index('by_tenantId', ['tenantId'])
      .index('by_tenantId_sku', ['tenantId', 'sku'])
      .index('by_tenantId_status', ['tenantId', 'status']),

    /**
     * One buyable item on one marketplace (ADR 0003): unique per tenant on `marketplaceId` +
     * `externalId`. `source`, `lastSyncedAt`, and `snapshot` are shaped for provider imports.
     */
    listings: defineTable({
      tenantId: v.string(),
      productId: v.id('products'),
      marketplaceId: v.id('marketplaces'),
      storefrontId: v.optional(v.id('brandStorefronts')),
      externalId: v.string(),
      parentExternalId: v.optional(v.string()),
      url: v.string(),
      title: v.optional(v.string()),
      priceCents: v.optional(v.number()),
      currency: v.optional(v.string()),
      status: v.string(),
      source: v.string(),
      lastSyncedAt: v.optional(v.number()),
      snapshot: v.optional(v.any()),
      createdAt: v.number(),
      updatedAt: v.number(),
      statusHistory: v.optional(v.array(statusChange)),
      metadata: v.optional(v.any()),
    })
      .index('by_tenantId', ['tenantId'])
      .index('by_productId', ['productId'])
      .index('by_tenantId_marketplaceId_externalId', ['tenantId', 'marketplaceId', 'externalId'])
      .index('by_tenantId_marketplaceId', ['tenantId', 'marketplaceId'])
      .index('by_storefrontId', ['storefrontId']),

    programs: defineTable({
      tenantId: v.optional(v.string()),
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
      .index('by_tenantId', ['tenantId'])
      .index('by_providerId', ['providerId'])
      .index('by_advertiserId', ['advertiserId'])
      .index('by_advertiserId_providerId', ['advertiserId', 'providerId']),

    offers: defineTable({
      tenantId: v.optional(v.string()),
      advertiserId: v.id('advertisers'),
      programId: v.id('programs'),
      providerId: v.id('providers'),
      /** The listing this offer promotes (ADR 0005). Optional only for legacy seeded rows. */
      listingId: v.optional(v.id('listings')),
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
      .index('by_tenantId', ['tenantId'])
      .index('by_slug', ['slug'])
      .index('by_programId', ['programId'])
      .index('by_advertiserId', ['advertiserId'])
      .index('by_listingId', ['listingId'])
      .index('by_status_featured', ['status', 'featured']),

    links: defineTable({
      tenantId: v.optional(v.string()),
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
      .index('by_tenantId', ['tenantId'])
      .index('by_slug', ['slug'])
      .index('by_publisherId', ['publisherId'])
      .index('by_publisherId_createdAt', ['publisherId', 'createdAt'])
      .index('by_offerId', ['offerId']),

    linkVersions: defineTable({
      tenantId: v.optional(v.string()),
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
      .index('by_tenantId', ['tenantId'])
      .index('by_linkId_version', ['linkId', 'version'])
      .index('by_providerId', ['providerId']),

    clicks: defineTable({
      tenantId: v.optional(v.string()),
      linkId: v.id('links'),
      linkVersionId: v.id('linkVersions'),
      publisherId: v.id('publishers'),
      propertyId: v.id('properties'),
      clickedAt: v.number(),
      uniqueKey: v.optional(v.string()),
      attribution: v.optional(v.any()),
      request: v.optional(v.any()),
    })
      .index('by_tenantId', ['tenantId'])
      .index('by_linkId_clickedAt', ['linkId', 'clickedAt'])
      .index('by_publisherId_clickedAt', ['publisherId', 'clickedAt']),

    commissionRules: defineTable({
      tenantId: v.optional(v.string()),
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
      .index('by_tenantId', ['tenantId'])
      .index('by_publisherId_offerId_active', ['publisherId', 'offerId', 'active'])
      .index('by_publisherId_programId_active', ['publisherId', 'programId', 'active'])
      .index('by_publisherId_active', ['publisherId', 'active'])
      .index('by_scopeType_active', ['scopeType', 'active']),

    conversions: defineTable({
      tenantId: v.optional(v.string()),
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
      .index('by_tenantId', ['tenantId'])
      .index('by_providerId_providerTransactionId', ['providerId', 'providerTransactionId'])
      .index('by_publisherId_occurredAt', ['publisherId', 'occurredAt'])
      .index('by_linkId', ['linkId'])
      .index('by_status', ['status']),

    providerSyncRuns: defineTable({
      tenantId: v.optional(v.string()),
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
      .index('by_tenantId', ['tenantId'])
      .index('by_providerId_startedAt', ['providerId', 'startedAt'])
      .index('by_providerAccountId_startedAt', ['providerAccountId', 'startedAt']),

    providerRawRecords: defineTable({
      tenantId: v.optional(v.string()),
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
      .index('by_tenantId', ['tenantId'])
      .index('by_providerId_externalRecordId', ['providerId', 'externalRecordId'])
      .index('by_providerId_providerTransactionId', ['providerId', 'providerTransactionId'])
      .index('by_syncRunId', ['syncRunId']),

    ledgerEntries: defineTable({
      tenantId: v.optional(v.string()),
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
      .index('by_tenantId', ['tenantId'])
      .index('by_idempotencyKey', ['idempotencyKey'])
      .index('by_publisherId_effectiveAt', ['publisherId', 'effectiveAt'])
      .index('by_publisherId_balanceState', ['publisherId', 'balanceState'])
      .index('by_conversionId', ['conversionId'])
      .index('by_payoutId', ['payoutId']),

    payouts: defineTable({
      tenantId: v.optional(v.string()),
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
      .index('by_tenantId', ['tenantId'])
      .index('by_publisherId_createdAt', ['publisherId', 'createdAt'])
      .index('by_status', ['status']),

    payoutItems: defineTable({
      tenantId: v.optional(v.string()),
      payoutId: v.id('payouts'),
      publisherId: v.id('publishers'),
      ledgerEntryId: v.id('ledgerEntries'),
      amountCents: v.number(),
      currency: v.string(),
      createdAt: v.number(),
    })
      .index('by_tenantId', ['tenantId'])
      .index('by_payoutId', ['payoutId'])
      .index('by_ledgerEntryId', ['ledgerEntryId']),

    dailyMetrics: defineTable({
      tenantId: v.optional(v.string()),
      scope: v.string(),
      date: v.string(),
      occurredAt: v.number(),
      clicks: v.number(),
      uniqueClicks: v.number(),
      conversions: v.number(),
      orderValueCents: v.number(),
      grossCommissionCents: v.number(),
      publisherEarningsCents: v.number(),
      waverlyRevenueCents: v.number(),
      reversals: v.number(),
      currency: v.string(),
    })
      .index('by_tenantId', ['tenantId'])
      .index('by_tenantId_date', ['tenantId', 'date']),

    messageThreads: defineTable({
      tenantId: v.optional(v.string()),
      key: v.string(),
      subject: v.string(),
      team: v.string(),
      status: v.union(v.literal('online'), v.literal('away')),
      lastMessageAt: v.number(),
      lastMessagePreview: v.string(),
      createdAt: v.number(),
    })
      .index('by_tenantId', ['tenantId'])
      .index('by_key', ['key'])
      .index('by_lastMessageAt', ['lastMessageAt']),

    messageThreadParticipants: defineTable({
      tenantId: v.optional(v.string()),
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
      .index('by_tenantId', ['tenantId'])
      .index('by_identityKey', ['identityKey'])
      .index('by_threadId', ['threadId'])
      .index('by_threadId_and_identityKey', ['threadId', 'identityKey']),

    messageEntries: defineTable({
      tenantId: v.optional(v.string()),
      threadId: v.id('messageThreads'),
      senderIdentityKey: v.string(),
      senderLabel: v.string(),
      body: v.string(),
      sentAt: v.number(),
      clientNonce: v.optional(v.string()),
    })
      .index('by_tenantId', ['tenantId'])
      .index('by_threadId_and_sentAt', ['threadId', 'sentAt'])
      .index('by_clientNonce', ['clientNonce']),

    messageUploadAuthorizations: defineTable({
      tenantId: v.optional(v.string()),
      token: v.string(),
      threadId: v.id('messageThreads'),
      identityKey: v.string(),
      createdAt: v.number(),
    })
      .index('by_tenantId', ['tenantId'])
      .index('by_token', ['token']),

    messageUploads: defineTable({
      tenantId: v.optional(v.string()),
      storageId: v.id('_storage'),
      threadId: v.id('messageThreads'),
      identityKey: v.string(),
      createdAt: v.number(),
    })
      .index('by_tenantId', ['tenantId'])
      .index('by_storageId', ['storageId']),

    messageAttachments: defineTable({
      tenantId: v.optional(v.string()),
      threadId: v.id('messageThreads'),
      messageId: v.id('messageEntries'),
      storageId: v.id('_storage'),
      fileName: v.string(),
      contentType: v.string(),
      size: v.number(),
      createdAt: v.number(),
    })
      .index('by_tenantId', ['tenantId'])
      .index('by_threadId', ['threadId'])
      .index('by_messageId', ['messageId'])
      .index('by_storageId', ['storageId']),

    messageReactions: defineTable({
      tenantId: v.optional(v.string()),
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
      .index('by_tenantId', ['tenantId'])
      .index('by_threadId', ['threadId'])
      .index('by_messageId', ['messageId'])
      .index('by_messageId_and_identityKey_and_emoji', ['messageId', 'identityKey', 'emoji']),
  },
  {
    schemaValidation: true,
    strictTableNameTypes: true,
  },
)
