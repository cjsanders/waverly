import { describe, expect, test } from 'vitest'
import {
  commissionRuleFromSnapshot,
  selectCommissionRule,
  snapshotEconomics,
} from '../../../convex/domain/economics'
import { nextLinkVersion, targetRequiresNewVersion } from '../../../convex/domain/links'
import {
  advertisers,
  conversions,
  dailyPerformance,
  programOffers,
  publishers,
  seedCounts,
} from '../../../shared/demoData'
import { demoMessageThreads } from '../../../shared/demoMessages'
import {
  sellerApplications,
  sellerCampaigns,
  sellerCreators,
  sellerPlacements,
  sellerSamples,
  sellerSeedCounts,
} from '../../../shared/demoSellerData'

describe('Waverly financial invariants', () => {
  test('the most specific active rule wins', () => {
    const now = Date.UTC(2026, 7, 1)
    const selected = selectCommissionRule(
      [
        {
          id: 'network',
          scopeType: 'network_default',
          publisherShareBps: 7000,
          active: true,
          startsAt: 0,
        },
        {
          id: 'publisher',
          scopeType: 'publisher_default',
          publisherShareBps: 7600,
          active: true,
          startsAt: 0,
        },
        {
          id: 'offer',
          scopeType: 'publisher_offer',
          publisherShareBps: 8200,
          active: true,
          startsAt: 0,
        },
      ],
      now,
    )

    expect(selected.id).toBe('offer')
  })

  test('gross commission always reconciles exactly', () => {
    const snapshot = snapshotEconomics(1_337, {
      id: 'rule',
      scopeType: 'publisher_default',
      publisherShareBps: 7750,
      active: true,
      startsAt: 0,
    })

    expect(snapshot.publisherEarningsCents + snapshot.waverlyRevenueCents).toBe(
      snapshot.grossCommissionCents,
    )
  })

  test('a persisted rule snapshot retains the historical share', () => {
    const selected = commissionRuleFromSnapshot({
      id: 'historical-rule',
      scopeType: 'publisher_default',
      publisherShareBps: 8125,
      active: true,
      startsAt: 100,
      selectedAt: 200,
    })

    expect(snapshotEconomics(2_000, selected)).toMatchObject({
      publisherEarningsCents: 1_625,
      waverlyRevenueCents: 375,
      selectedRule: { id: 'historical-rule', publisherShareBps: 8125 },
    })
  })
})

describe('Waverly attribution invariants', () => {
  const baseTarget = {
    providerKey: 'impact',
    programKey: 'aster-impact',
    originalDestinationUrl: 'https://aster.example/vase',
    normalizedDestinationUrl: 'https://aster.example/vase',
    providerTrackingUrl: 'https://impact.example/c/aster/vase',
  }

  test('reporting-only edits do not create a target version', () => {
    expect(targetRequiresNewVersion(baseTarget, { ...baseTarget })).toBe(false)
  })

  test('provider or destination changes require a new immutable version', () => {
    expect(targetRequiresNewVersion(baseTarget, { ...baseTarget, providerKey: 'shopify' })).toBe(
      true,
    )
    expect(
      targetRequiresNewVersion(baseTarget, {
        ...baseTarget,
        originalDestinationUrl: 'https://aster.example/vase?source=editorial',
      }),
    ).toBe(true)
    expect(
      targetRequiresNewVersion(baseTarget, {
        ...baseTarget,
        normalizedDestinationUrl: 'https://aster.example/linen',
      }),
    ).toBe(true)
    expect(nextLinkVersion(3)).toBe(4)
  })
})

describe('deterministic demo data', () => {
  test('matches the approved POC scale', () => {
    expect(seedCounts).toEqual({
      providers: 3,
      advertisers: 20,
      programs: 24,
      offers: 24,
      brandImages: 20,
      productImages: 24,
      publishers: 15,
      properties: 30,
      links: 100,
      days: 90,
      conversions: 180,
    })
  })

  test('every catalog record has deterministic local brand and product photography', () => {
    for (const advertiser of advertisers) {
      expect(advertiser.logoUrl).toBe(`/demo/catalog/brands/${advertiser.key}.png`)
      expect(advertiser.name.length).toBeGreaterThan(2)
    }
    for (const offer of programOffers) {
      expect(offer.productImageUrl).toBe(`/demo/catalog/products/${offer.key}.jpg`)
      expect(offer.productSku.length).toBeGreaterThan(4)
      expect(offer.priceCents).toBeGreaterThan(0)
      expect(offer.commissionRateBps).toBeGreaterThanOrEqual(0)
      expect(offer.marketplace).toMatch(/^(Amazon|Shopify|Walmart)$/)
      expect(offer.countryCode).toMatch(/^(US|CA)$/)
      expect(offer.rating).toBeGreaterThanOrEqual(3.5)
      expect(offer.reviewCount).toBeGreaterThan(0)
    }
  })

  test('message fixtures connect operator, publisher, and creator workspaces', () => {
    expect(new Set(demoMessageThreads.map((thread) => thread.key)).size).toBe(
      demoMessageThreads.length,
    )
    expect(demoMessageThreads.length).toBeGreaterThanOrEqual(9)
    for (const identityKey of ['operator', 'northstar', 'everyday', 'avery', 'puroair'] as const) {
      expect(
        demoMessageThreads.some((thread) =>
          thread.participants.some((participant) => participant.identityKey === identityKey),
        ),
      ).toBe(true)
    }
    for (const publisherIdentity of ['northstar', 'everyday'] as const) {
      expect(
        demoMessageThreads.some((thread) => {
          const identities = new Set(
            thread.participants.map((participant) => participant.identityKey),
          )
          return identities.has('operator') && identities.has(publisherIdentity)
        }),
      ).toBe(true)
    }
    expect(
      demoMessageThreads.some((thread) => {
        const identities = new Set(
          thread.participants.map((participant) => participant.identityKey),
        )
        return (
          identities.has('avery') && (identities.has('northstar') || identities.has('everyday'))
        )
      }),
    ).toBe(true)
    expect(
      demoMessageThreads.some((thread) => {
        const identities = new Set(
          thread.participants.map((participant) => participant.identityKey),
        )
        return identities.has('puroair') && identities.has('avery')
      }),
    ).toBe(true)
    for (const thread of demoMessageThreads) {
      expect(thread.messages.length).toBeGreaterThan(0)
      expect(thread.messages.every((message) => message.body.trim().length > 0)).toBe(true)
    }
  })

  test('seller fixtures cover the creator-program operating loop', () => {
    expect(sellerSeedCounts).toEqual({
      channels: 3,
      creators: 12,
      applications: 5,
      samples: 6,
      placements: 6,
      campaigns: 4,
      invoices: 3,
    })
    const creatorIds = new Set(sellerCreators.map((creator) => creator.id))
    expect(creatorIds.size).toBe(sellerCreators.length)
    for (const application of sellerApplications)
      expect(creatorIds.has(application.creatorId)).toBe(true)
    for (const sample of sellerSamples) expect(creatorIds.has(sample.creatorId)).toBe(true)
    for (const placement of sellerPlacements) expect(creatorIds.has(placement.creatorId)).toBe(true)
    for (const campaign of sellerCampaigns) {
      expect(
        programOffers.some(
          (offer) =>
            offer.key === campaign.productOfferKey && offer.advertiserKey === 'paper-crane',
        ),
      ).toBe(true)
    }
  })

  test('every daily and conversion total reconciles', () => {
    for (const day of dailyPerformance) {
      expect(day.publisherEarningsCents + day.waverlyRevenueCents).toBe(day.grossCommissionCents)
    }
    for (const conversion of conversions) {
      expect(conversion.publisherEarningsCents + conversion.waverlyRevenueCents).toBe(
        conversion.grossCommissionCents,
      )
    }
  })

  test('conversion economics use the selected publisher-default rule', () => {
    for (const conversion of conversions) {
      const publisher = publishers.find((item) => item.key === conversion.publisherKey)
      expect(publisher).toBeDefined()
      expect(conversion.publisherEarningsCents).toBe(
        Math.round(conversion.grossCommissionCents * ((publisher?.shareBps ?? 0) / 10_000)),
      )
    }
  })

  test('provider transaction IDs are unique', () => {
    const ids = conversions.map(
      (conversion) => `${conversion.providerKey}:${conversion.providerTransactionId}`,
    )
    expect(new Set(ids).size).toBe(ids.length)
  })
})
