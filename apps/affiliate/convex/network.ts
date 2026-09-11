import { mutation } from './_generated/server'
import { internal } from './_generated/api'
/* eslint-disable no-await-in-loop -- Preserve ordered writes inside a single Convex transaction. */
import { requireNetworkSession } from './networkAccess'
import { internalMutationGeneric, queryGeneric } from 'convex/server'
import { v } from 'convex/values'
import {
  NETWORK_ANCHOR_MS,
  advertisers,
  conversions,
  dailyPerformance,
  links,
  programOffers,
  properties,
  providers,
  publishers,
  seedCounts,
} from '../shared/networkData'
import { networkMessageThreads } from '../shared/networkMessages'
import { sellerChannels } from '../shared/networkSellerData'
import { listingUrl, marketplaceForKey } from '../shared/marketplaces'
import { upsertMarketplaces } from './lib/marketplaces'
import type { SeedProgramOffer } from '../shared/networkData'

export const summary = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireNetworkSession(ctx)
    const providerRows = await ctx.db
      .query('providers')
      .withIndex('by_tenantId', (q) => q.eq('tenantId', tenantId))
      .collect()
    const publisherRows = await ctx.db
      .query('publishers')
      .withIndex('by_tenantId', (q) => q.eq('tenantId', tenantId))
      .collect()
    const conversionRows = await ctx.db
      .query('conversions')
      .withIndex('by_tenantId', (q) => q.eq('tenantId', tenantId))
      .collect()
    const ledgerRows = await ctx.db
      .query('ledgerEntries')
      .withIndex('by_tenantId', (q) => q.eq('tenantId', tenantId))
      .collect()
    return {
      providers: providerRows.length,
      publishers: publisherRows.length,
      conversions: conversionRows.length,
      grossCommissionCents: conversionRows.reduce((sum, row) => sum + row.grossCommissionCents, 0),
      publisherEarningsCents: conversionRows.reduce(
        (sum, row) => sum + row.publisherEarningsCents,
        0,
      ),
      waverlyRevenueCents: conversionRows.reduce((sum, row) => sum + row.waverlyRevenueCents, 0),
      ledgerEntries: ledgerRows.length,
    }
  },
})

const networkTables = [
  'messageReactions',
  'messageAttachments',
  'messageUploads',
  'messageUploadAuthorizations',
  'messageEntries',
  'messageThreadParticipants',
  'messageThreads',
  'payoutItems',
  'payouts',
  'ledgerEntries',
  'providerRawRecords',
  'providerSyncRuns',
  'conversions',
  'clicks',
  'linkVersions',
  'links',
  'commissionRules',
  'offers',
  'listings',
  'brandProducts',
  'brandStorefronts',
  'programs',
  'properties',
  'publishers',
  'providerAccounts',
  'providers',
  'advertisers',
  'dailyMetrics',
] as const

export const reset = internalMutationGeneric({
  args: {
    tenantId: v.string(),
    confirmation: v.literal('DELETE_AND_RESEED_NETWORK'),
  },
  returns: v.object({ reset: v.boolean(), deleted: v.number() }),
  handler: async (ctx, { tenantId }) => {
    let deleted = 0
    for (const table of networkTables) {
      const rows = await ctx.db
        .query(table)
        .withIndex('by_tenantId', (q) => q.eq('tenantId', tenantId))
        .take(1_000)
      if (rows.length === 1_000) {
        throw new Error(
          `Refusing to reset ${table}: the table is larger than the seed safety limit.`,
        )
      }
      for (const row of rows) {
        await ctx.db.delete(row._id)
        deleted += 1
      }
    }
    return { reset: true, deleted }
  },
})

export const seed = internalMutationGeneric({
  args: { tenantId: v.string() },
  returns: v.object({
    seeded: v.boolean(),
    refreshed: v.boolean(),
    reason: v.union(v.literal('seeded'), v.literal('network_catalog_refreshed')),
    counts: v.any(),
  }),
  handler: async (ctx, { tenantId }) => {
    const seedMessaging = async () => {
      for (const thread of networkMessageThreads) {
        const existingThread = await ctx.db
          .query('messageThreads')
          .withIndex('by_key', (q) => q.eq('key', thread.key))
          .filter((q) => q.eq(q.field('tenantId'), tenantId))
          .unique()
        const lastMessage = thread.messages.at(-1)
        if (!lastMessage) continue
        const threadId =
          existingThread?._id ??
          (await ctx.db.insert('messageThreads', {
            tenantId,
            key: thread.key,
            subject: thread.subject,
            team: thread.team,
            status: thread.status,
            lastMessageAt: lastMessage.sentAt,
            lastMessagePreview: lastMessage.body,
            createdAt: thread.messages[0]?.sentAt ?? NETWORK_ANCHOR_MS,
          }))
        if (existingThread) {
          await ctx.db.patch(existingThread._id, {
            subject: thread.subject,
            team: thread.team,
            status: thread.status,
          })
        }
        for (const participant of thread.participants) {
          const existingParticipants = await ctx.db
            .query('messageThreadParticipants')
            .withIndex('by_threadId', (q) => q.eq('threadId', threadId))
            .filter((q) => q.eq(q.field('tenantId'), tenantId))
            .take(10)
          const existingParticipant = existingParticipants.find(
            (row) => row.identityKey === participant.identityKey,
          )
          if (existingParticipant) {
            await ctx.db.patch(existingParticipant._id, {
              title: participant.title,
              team: participant.team,
            })
          } else {
            await ctx.db.insert('messageThreadParticipants', {
              tenantId,
              threadId,
              identityKey: participant.identityKey,
              title: participant.title,
              team: participant.team,
              unreadCount: participant.unreadCount,
              joinedAt: thread.messages[0]?.sentAt ?? NETWORK_ANCHOR_MS,
            })
          }
        }
        if (existingThread) continue
        for (const message of thread.messages) {
          await ctx.db.insert('messageEntries', {
            tenantId,
            threadId,
            senderIdentityKey: message.senderIdentityKey,
            senderLabel: message.senderLabel,
            body: message.body,
            sentAt: message.sentAt,
          })
        }
      }
    }

    // The marketplace catalog is global (ADR 0002): refreshed once, shared by every tenant.
    const { ids: marketplaceIds } = await upsertMarketplaces(ctx.db, NETWORK_ANCHOR_MS)

    // PuroAir's storefronts (ADR 0004), one per marketplace, refreshed on every seed.
    const storefronts = new Map<string, { id: any; url: string }>()
    for (const channel of sellerChannels) {
      const marketplaceId = marketplaceIds.get(channel.marketplaceKey)
      const url = `https://${channel.storefront}`
      const fields = {
        name: channel.name,
        url,
        status: channel.status.toLowerCase(),
        autoAcceptApplications: channel.autoAccept,
        updatedAt: NETWORK_ANCHOR_MS,
        metadata: { seeded: true, productsCount: channel.products },
      }
      const row = await ctx.db
        .query('brandStorefronts')
        .withIndex('by_tenantId', (q) => q.eq('tenantId', tenantId))
        .filter((q) => q.eq(q.field('marketplaceId'), marketplaceId))
        .unique()
      if (row) {
        await ctx.db.patch(row._id, fields)
        storefronts.set(channel.marketplaceKey, { id: row._id, url })
        continue
      }
      const id = await ctx.db.insert('brandStorefronts', {
        tenantId,
        marketplaceId,
        createdAt: NETWORK_ANCHOR_MS - 140 * 86_400_000,
        ...fields,
      })
      storefronts.set(channel.marketplaceKey, { id, url })
    }

    // Products and listings (ADR 0003). Each offer promotes one listing (ADR 0005); listings
    // for the seeded brand's own marketplaces hang off its storefronts.
    const productIds = new Map<string, any>()
    const listingUrls = new Map<string, string>()
    const ensureListing = async (item: SeedProgramOffer, existingListingId?: any) => {
      const marketplace = marketplaceForKey(item.marketplaceKey)
      const storefront =
        item.advertiserKey === 'paper-crane' ? storefronts.get(item.marketplaceKey) : undefined
      const url = listingUrl(
        marketplace,
        item.externalId,
        storefront?.url ?? `https://${item.advertiserKey}.example`,
      )
      listingUrls.set(item.key, url)
      const productFields = {
        name: item.offerName,
        imageUrls: [item.productImageUrl],
        updatedAt: NETWORK_ANCHOR_MS,
      }
      const listingFields = {
        storefrontId: storefront?.id,
        url,
        priceCents: item.priceCents,
        currency: marketplace.currency ?? 'USD',
        updatedAt: NETWORK_ANCHOR_MS,
      }
      const existingListing = existingListingId ? await ctx.db.get(existingListingId) : null
      if (existingListing) {
        await ctx.db.patch(existingListing._id, listingFields)
        await ctx.db.patch(existingListing.productId, productFields)
        productIds.set(item.productKey, existingListing.productId)
        return existingListing._id
      }
      let productId = productIds.get(item.productKey)
      if (!productId) {
        productId = await ctx.db.insert('brandProducts', {
          tenantId,
          ...productFields,
          status: 'active',
          createdAt: NETWORK_ANCHOR_MS - 100 * 86_400_000,
          statusHistory: [
            {
              status: 'active',
              changedAt: NETWORK_ANCHOR_MS - 100 * 86_400_000,
              changedBy: 'network.seed',
            },
          ],
          metadata: { seeded: true, seedKey: item.productKey, advertiserKey: item.advertiserKey },
        })
        productIds.set(item.productKey, productId)
      }
      return ctx.db.insert('listings', {
        tenantId,
        productId,
        marketplaceId: marketplaceIds.get(item.marketplaceKey),
        externalId: item.externalId,
        ...listingFields,
        status: 'active',
        source: 'manual',
        createdAt: NETWORK_ANCHOR_MS - 95 * 86_400_000,
        statusHistory: [
          {
            status: 'active',
            changedAt: NETWORK_ANCHOR_MS - 95 * 86_400_000,
            changedBy: 'network.seed',
          },
        ],
        metadata: { seeded: true },
      })
    }
    const programMetadata = (item: SeedProgramOffer) => {
      const marketplace = marketplaceForKey(item.marketplaceKey)
      return {
        simulated: true,
        marketplaceKey: item.marketplaceKey,
        marketplace: marketplace.platform,
        countryCode: marketplace.countryCode,
      }
    }
    const offerMetadata = (item: SeedProgramOffer, previous?: unknown) => {
      const carried =
        typeof previous === 'object' && previous !== null
          ? { ...(previous as Record<string, unknown>) }
          : {}
      // Product fields now live on products and listings (ADR 0005).
      for (const key of [
        'productImageUrl',
        'productSku',
        'priceCents',
        'marketplace',
        'countryCode',
      ]) {
        delete carried[key]
      }
      return {
        ...carried,
        commissionRateBps: item.commissionRateBps,
        rating: item.rating,
        reviewCount: item.reviewCount,
        access: item.access,
        isDeal: item.isDeal,
        samplesAvailable: item.samplesAvailable,
        cpcCents: item.cpcCents,
        loyaltyBonusCents: item.loyaltyBonusCents,
        seeded: true,
      }
    }

    const existing = await ctx.db
      .query('providers')
      .withIndex('by_key', (q) => q.eq('key', 'amazon'))
      .filter((q) => q.eq(q.field('tenantId'), tenantId))
      .unique()
    if (existing) {
      for (const provider of providers) {
        const row = await ctx.db
          .query('providers')
          .withIndex('by_key', (q) => q.eq('key', provider.key))
          .filter((q) => q.eq(q.field('tenantId'), tenantId))
          .unique()
        if (row) {
          await ctx.db.patch(row._id, {
            name: provider.name,
            status: provider.status === 'healthy' ? 'connected' : 'attention',
            dataLatencyMinutes: provider.latencyMinutes,
            updatedAt: NETWORK_ANCHOR_MS,
          })
        }
      }

      for (const advertiser of advertisers) {
        const row = await ctx.db
          .query('advertisers')
          .withIndex('by_slug', (q) => q.eq('slug', advertiser.key))
          .filter((q) => q.eq(q.field('tenantId'), tenantId))
          .unique()
        if (row) {
          await ctx.db.patch(row._id, {
            name: advertiser.name,
            status: 'active',
            updatedAt: NETWORK_ANCHOR_MS,
            metadata: {
              ...(typeof row.metadata === 'object' && row.metadata !== null ? row.metadata : {}),
              category: advertiser.category,
              logoUrl: advertiser.logoUrl,
            },
          })
        }
      }

      for (const offer of programOffers) {
        const row = await ctx.db
          .query('offers')
          .withIndex('by_slug', (q) => q.eq('slug', offer.key))
          .filter((q) => q.eq(q.field('tenantId'), tenantId))
          .unique()
        if (row) {
          // Tenants seeded before listings existed get their product and listing backfilled here.
          const listingId = await ensureListing(offer, row.listingId)
          await ctx.db.patch(row.programId, {
            name: offer.programName,
            status: 'active',
            attributionWindowDays: offer.attributionWindowDays,
            updatedAt: NETWORK_ANCHOR_MS,
            metadata: programMetadata(offer),
          })
          await ctx.db.patch(row._id, {
            listingId,
            name: offer.offerName,
            summary: `${offer.offerName} with normalized Waverly terms and catalog economics.`,
            status: 'active',
            access: offer.access === 'review' ? 'approval_required' : 'open',
            featured: offer.featured,
            defaultPublisherShareBps: offer.publisherShareBps,
            attributionWindowDays: offer.attributionWindowDays,
            endsAt: offer.dealEndsAt,
            updatedAt: NETWORK_ANCHOR_MS,
            metadata: offerMetadata(offer, row.metadata),
          })
        }
      }

      await seedMessaging()

      return {
        seeded: false,
        refreshed: true,
        reason: 'network_catalog_refreshed' as const,
        counts: seedCounts,
      }
    }

    const providerIds = new Map<string, any>()
    const providerAccountIds = new Map<string, any>()
    const advertiserIds = new Map<string, any>()
    const publisherIds = new Map<string, any>()
    const propertyIds = new Map<string, any>()
    const programIds = new Map<string, any>()
    const offerIds = new Map<string, any>()
    const ruleIds = new Map<string, any>()
    const linkIds = new Map<string, any>()
    const linkVersionIds = new Map<string, any>()

    for (const provider of providers) {
      const providerId = await ctx.db.insert('providers', {
        tenantId,
        key: provider.key,
        name: provider.name,
        status: provider.status === 'healthy' ? 'connected' : 'attention',
        dataLatencyMinutes: provider.latencyMinutes,
        createdAt: NETWORK_ANCHOR_MS - 180 * 86_400_000,
        updatedAt: NETWORK_ANCHOR_MS,
        metadata: { simulated: true },
      })
      providerIds.set(provider.key, providerId)
      const accountId = await ctx.db.insert('providerAccounts', {
        tenantId,
        providerId,
        externalAccountRef: `waverly-${provider.key}-network`,
        connectionStatus: provider.status === 'healthy' ? 'connected' : 'delayed',
        lastSuccessfulSyncAt: NETWORK_ANCHOR_MS - provider.latencyMinutes * 60_000,
        createdAt: NETWORK_ANCHOR_MS - 180 * 86_400_000,
        updatedAt: NETWORK_ANCHOR_MS,
        metadata: { mode: 'simulated' },
      })
      providerAccountIds.set(provider.key, accountId)
      await ctx.db.insert('providerSyncRuns', {
        tenantId,
        providerId,
        providerAccountId: accountId,
        externalRunRef: `seed-${provider.key}-latest`,
        startedAt: NETWORK_ANCHOR_MS - (provider.latencyMinutes + 4) * 60_000,
        completedAt: NETWORK_ANCHOR_MS - provider.latencyMinutes * 60_000,
        status: provider.status === 'healthy' ? 'succeeded' : 'warning',
        recordsRead: 61 + provider.latencyMinutes,
        recordsCreated: 11,
        recordsUpdated: 8,
        recordsSkipped: 42 + provider.latencyMinutes,
        warnings: provider.status === 'warning' ? ['Freshness exceeds the 60-minute target'] : [],
        cursor: `cursor-${provider.key}-090`,
      })
    }

    for (const advertiser of advertisers) {
      advertiserIds.set(
        advertiser.key,
        await ctx.db.insert('advertisers', {
          tenantId,
          slug: advertiser.key,
          name: advertiser.name,
          status: 'active',
          createdAt: NETWORK_ANCHOR_MS - 160 * 86_400_000,
          updatedAt: NETWORK_ANCHOR_MS,
          metadata: {
            category: advertiser.category,
            logoUrl: advertiser.logoUrl,
          },
        }),
      )
    }

    for (const publisher of publishers) {
      publisherIds.set(
        publisher.key,
        await ctx.db.insert('publishers', {
          tenantId,
          slug: publisher.key,
          name: publisher.name,
          status: publisher.status,
          defaultPublisherShareBps: publisher.shareBps,
          createdAt: NETWORK_ANCHOR_MS - 150 * 86_400_000,
          updatedAt: NETWORK_ANCHOR_MS,
          statusHistory: [
            {
              status: publisher.status,
              changedAt: NETWORK_ANCHOR_MS - 14 * 86_400_000,
              changedBy: 'network.seed',
            },
          ],
          metadata: {
            networkIdentity:
              publisher.key === 'northstar-media' || publisher.key === 'everyday-finds',
          },
        }),
      )
    }

    for (const property of properties) {
      const publisherId = publisherIds.get(property.publisherKey)
      propertyIds.set(
        property.key,
        await ctx.db.insert('properties', {
          tenantId,
          publisherId,
          name: property.name,
          type: property.type,
          urlOrHandle: property.urlOrHandle,
          approvalStatus: property.approvalStatus,
          verificationStatus: property.approvalStatus === 'approved' ? 'verified' : 'unverified',
          createdAt: NETWORK_ANCHOR_MS - 120 * 86_400_000,
          updatedAt: NETWORK_ANCHOR_MS,
          statusHistory: [
            {
              status: property.approvalStatus,
              changedAt: NETWORK_ANCHOR_MS - 8 * 86_400_000,
              changedBy: 'network.seed',
            },
          ],
          metadata: { countries: ['US', 'CA'], trafficSources: ['organic', 'newsletter'] },
        }),
      )
    }

    for (const item of programOffers) {
      const providerId = providerIds.get(item.providerKey)
      const advertiserId = advertiserIds.get(item.advertiserKey)
      const programId = await ctx.db.insert('programs', {
        tenantId,
        providerId,
        advertiserId,
        externalProgramRef: `program-${item.key}`,
        name: item.programName,
        status: 'active',
        attributionWindowDays: item.attributionWindowDays,
        createdAt: NETWORK_ANCHOR_MS - 110 * 86_400_000,
        updatedAt: NETWORK_ANCHOR_MS,
        metadata: programMetadata(item),
      })
      programIds.set(item.key, programId)
      const listingId = await ensureListing(item)
      const offerId = await ctx.db.insert('offers', {
        tenantId,
        advertiserId,
        programId,
        providerId,
        listingId,
        slug: item.key,
        name: item.offerName,
        summary: `A publisher-ready ${item.offerName.toLowerCase()} package with normalized Waverly terms.`,
        status: 'active',
        access: item.access === 'review' ? 'approval_required' : 'open',
        featured: item.featured,
        defaultPublisherShareBps: item.publisherShareBps,
        attributionWindowDays: item.attributionWindowDays,
        endsAt: item.dealEndsAt,
        createdAt: NETWORK_ANCHOR_MS - 90 * 86_400_000,
        updatedAt: NETWORK_ANCHOR_MS,
        terms: {
          currency: 'USD',
          allowedCountries: ['US', 'CA'],
          restrictions: ['No paid search on brand terms'],
        },
        metadata: offerMetadata(item),
      })
      offerIds.set(item.key, offerId)
    }

    const networkRuleId = await ctx.db.insert('commissionRules', {
      tenantId,
      scopeType: 'network_default',
      publisherShareBps: 7400,
      active: true,
      startsAt: NETWORK_ANCHOR_MS - 365 * 86_400_000,
      createdAt: NETWORK_ANCHOR_MS - 365 * 86_400_000,
      createdBy: 'network.seed',
      metadata: { label: 'POC network default' },
    })
    ruleIds.set('network', networkRuleId)
    for (const publisher of publishers) {
      const ruleId = await ctx.db.insert('commissionRules', {
        tenantId,
        scopeType: 'publisher_default',
        publisherId: publisherIds.get(publisher.key),
        publisherShareBps: publisher.shareBps,
        active: true,
        startsAt: NETWORK_ANCHOR_MS - 180 * 86_400_000,
        createdAt: NETWORK_ANCHOR_MS - 180 * 86_400_000,
        createdBy: 'network.seed',
        metadata: { label: `${publisher.name} default` },
      })
      ruleIds.set(publisher.key, ruleId)
    }

    for (const item of links) {
      const offer = programOffers.find((candidate) => candidate.key === item.offerKey)!
      const advertiser = advertisers.find((candidate) => candidate.key === offer.advertiserKey)!
      const linkId = await ctx.db.insert('links', {
        tenantId,
        publisherId: publisherIds.get(item.publisherKey),
        propertyId: propertyIds.get(item.propertyKey),
        advertiserId: advertiserIds.get(advertiser.key),
        offerId: offerIds.get(offer.key),
        slug: item.slug,
        displayName: item.displayName,
        status: 'active',
        currentVersion: 1,
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
        reporting: {
          campaign: 'poc-launch',
          placement: item.key.endsWith('0') ? 'hero' : 'article',
        },
      })
      linkIds.set(item.key, linkId)
      const destination =
        listingUrls.get(offer.key) ?? `https://${offer.advertiserKey}.example/products/${item.slug}`
      const versionId = await ctx.db.insert('linkVersions', {
        tenantId,
        linkId,
        version: 1,
        providerId: providerIds.get(offer.providerKey),
        programId: programIds.get(offer.key),
        originalDestinationUrl: destination,
        normalizedDestinationUrl: destination,
        providerTrackingUrl: `https://track.${offer.providerKey}.example/click?program=${offer.key}&dest=${encodeURIComponent(destination)}`,
        createdAt: item.createdAt,
        createdBy: 'network.seed',
        changeReason: 'initial_target',
        attributionDefaults: { campaign: 'poc-launch' },
        providerSnapshot: { provider: offer.providerKey, programRef: `program-${offer.key}` },
      })
      linkVersionIds.set(item.key, versionId)
      await ctx.db.patch(linkId, { currentVersionId: versionId })
    }

    for (const conversion of conversions) {
      const offer = programOffers.find((item) => item.key === conversion.offerKey)!
      const publisher = publishers.find((item) => item.key === conversion.publisherKey)!
      const ruleId = ruleIds.get(conversion.publisherKey) ?? networkRuleId
      const conversionId = await ctx.db.insert('conversions', {
        tenantId,
        providerId: providerIds.get(conversion.providerKey),
        providerTransactionId: conversion.providerTransactionId,
        publisherId: publisherIds.get(conversion.publisherKey),
        propertyId: propertyIds.get(conversion.propertyKey),
        advertiserId: advertiserIds.get(conversion.advertiserKey),
        programId: programIds.get(conversion.offerKey),
        offerId: offerIds.get(conversion.offerKey),
        linkId: linkIds.get(conversion.linkKey),
        linkVersionId: linkVersionIds.get(conversion.linkKey),
        occurredAt: conversion.occurredAt,
        updatedAt: conversion.occurredAt,
        status: conversion.status,
        currency: 'USD',
        orderValueCents: conversion.orderValueCents,
        grossCommissionCents: conversion.grossCommissionCents,
        publisherEarningsCents: conversion.publisherEarningsCents,
        waverlyRevenueCents: conversion.waverlyRevenueCents,
        commissionRuleId: ruleId,
        commissionRuleSnapshot: {
          id: String(ruleId),
          scopeType: 'publisher_default',
          publisherShareBps: publisher.shareBps,
          active: true,
          startsAt: NETWORK_ANCHOR_MS - 180 * 86_400_000,
          selectedAt: conversion.occurredAt,
        },
        attributionSnapshot: { linkKey: conversion.linkKey, campaign: 'poc-launch' },
        providerSnapshot: { providerTransactionId: conversion.providerTransactionId },
        reversal:
          conversion.status === 'reversed'
            ? { reversedAt: conversion.occurredAt + 3 * 86_400_000, reason: 'provider_refund' }
            : undefined,
      })
      const balanceState =
        conversion.status === 'pending'
          ? 'pending'
          : conversion.status === 'approved' || conversion.status === 'reversed'
            ? 'approved'
            : conversion.status === 'locked'
              ? 'payable'
              : 'paid'
      await ctx.db.insert('ledgerEntries', {
        tenantId,
        publisherId: publisherIds.get(conversion.publisherKey),
        conversionId,
        entryType: 'conversion_earning',
        balanceState,
        amountCents: conversion.publisherEarningsCents,
        currency: 'USD',
        effectiveAt: conversion.occurredAt,
        createdAt: conversion.occurredAt,
        createdBy: 'network.seed',
        idempotencyKey: `conversion:${conversion.providerKey}:${conversion.providerTransactionId}:${balanceState}`,
        memo: `${offer.offerName} publisher earning`,
        snapshot: {
          grossCommissionCents: conversion.grossCommissionCents,
          commissionRuleId: ruleId,
        },
      })
      if (conversion.status === 'reversed') {
        const reversedAt = conversion.occurredAt + 3 * 86_400_000
        await ctx.db.insert('ledgerEntries', {
          tenantId,
          publisherId: publisherIds.get(conversion.publisherKey),
          conversionId,
          entryType: 'conversion_reversal',
          balanceState,
          amountCents: -conversion.publisherEarningsCents,
          currency: 'USD',
          effectiveAt: reversedAt,
          createdAt: reversedAt,
          createdBy: 'network.seed',
          idempotencyKey: `conversion:${conversion.providerKey}:${conversion.providerTransactionId}:reversed`,
          memo: `${offer.offerName} provider reversal`,
          snapshot: {
            originalAmountCents: conversion.publisherEarningsCents,
            reason: 'provider_refund',
          },
        })
      }
    }

    for (const day of dailyPerformance) {
      await ctx.db.insert('dailyMetrics', {
        tenantId,
        scope: 'network',
        ...day,
        currency: 'USD',
      })
    }

    await seedMessaging()

    return {
      seeded: true,
      refreshed: false,
      reason: 'seeded' as const,
      counts: seedCounts,
    }
  },
})

/** Lazily initialize only an empty development dataset. Existing edits are never reset. */
export const initialize = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { tenantId } = await requireNetworkSession(ctx)
    const existing = await ctx.db
      .query('providers')
      .withIndex('by_tenantId', (q) => q.eq('tenantId', tenantId))
      .first()
    if (!existing) {
      await ctx.runMutation(internal.network.seed, { tenantId })
    }
    return null
  },
})
