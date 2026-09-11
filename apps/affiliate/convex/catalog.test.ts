import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import schema from './schema'
import { modules } from './test.setup'
import { marketplaces } from '../shared/marketplaces'
import { sellerChannels } from '../shared/networkSellerData'

async function seeded() {
  const t = convexTest(schema, modules)
  await t.mutation(internal.network.seed, { tenantId: 'org-a' })
  await t.mutation(internal.network.seed, { tenantId: 'org-b' })
  const orgA = t.withIdentity({ subject: 'user-a', org_id: 'org-a' })
  const orgB = t.withIdentity({ subject: 'user-b', org_id: 'org-b' })
  const marketplaceId = async (key: string) =>
    (await t.run((ctx) =>
      ctx.db
        .query('marketplaces')
        .withIndex('by_key', (q) => q.eq('key', key))
        .unique(),
    ))!._id
  return { t, orgA, orgB, marketplaceId }
}

describe('marketplace catalog', () => {
  test('is global: every signed-in workspace reads the same rows, anonymous clients none', async () => {
    const { t, orgA } = await seeded()
    const fresh = t.withIdentity({ subject: 'user-c', org_id: 'org-never-seeded' })
    const keys = marketplaces.map((marketplace) => marketplace.key).sort()
    expect((await orgA.query(api.marketplaces.list, {})).map((row) => row.key).sort()).toEqual(keys)
    expect((await fresh.query(api.marketplaces.list, {})).map((row) => row.key).sort()).toEqual(
      keys,
    )
    await expect(t.query(api.marketplaces.list, {})).rejects.toThrow('Sign in')
  })

  test('seeding twice leaves one row per marketplace key and one storefront per tenant per site', async () => {
    const { t } = await seeded()
    await t.mutation(internal.network.seed, { tenantId: 'org-a' })
    const rows = await t.run((ctx) => ctx.db.query('marketplaces').collect())
    expect(rows).toHaveLength(marketplaces.length)
    expect(new Set(rows.map((row) => row.key)).size).toBe(marketplaces.length)
    const perTenant = await Promise.all(
      ['org-a', 'org-b'].map((tenantId) =>
        t.run((ctx) =>
          ctx.db
            .query('brandStorefronts')
            .withIndex('by_tenantId', (q) => q.eq('tenantId', tenantId))
            .collect(),
        ),
      ),
    )
    for (const storefronts of perTenant) {
      expect(storefronts).toHaveLength(sellerChannels.length)
      expect(new Set(storefronts.map((row) => row.marketplaceId)).size).toBe(sellerChannels.length)
    }
  })

  test('the seed gives every offer a listing whose product shares its tenant', async () => {
    const { t } = await seeded()
    const offers = await t.run((ctx) =>
      ctx.db
        .query('offers')
        .withIndex('by_tenantId', (q) => q.eq('tenantId', 'org-a'))
        .collect(),
    )
    expect(offers.length).toBeGreaterThan(0)
    const pairs = await t.run((ctx) =>
      Promise.all(
        offers.map(async (offer) => {
          const listing = (await ctx.db.get(offer.listingId!))!
          return { offer, listing, product: (await ctx.db.get(listing.productId))! }
        }),
      ),
    )
    for (const { offer, listing, product } of pairs) {
      expect(offer.listingId).toBeDefined()
      expect(offer.metadata.productSku).toBeUndefined()
      expect(listing.tenantId).toBe('org-a')
      expect(product.tenantId).toBe('org-a')
      expect(listing.url).toMatch(/^https:\/\//)
    }
    const version = await t.run(async (ctx) => {
      const link = (await ctx.db
        .query('links')
        .withIndex('by_tenantId', (q) => q.eq('tenantId', 'org-a'))
        .first())!
      return ctx.db.get(link.currentVersionId!)
    })
    expect(version?.originalDestinationUrl).toMatch(
      /amazon\.com\/dp\/|walmart\.com\/ip\/|\/products\//,
    )
  })

  test('a tenant seeded before listings existed is backfilled on refresh', async () => {
    const { t } = await seeded()
    const offer = (await t.run((ctx) =>
      ctx.db
        .query('offers')
        .withIndex('by_tenantId', (q) => q.eq('tenantId', 'org-a'))
        .first(),
    ))!
    await t.run(async (ctx) => {
      await ctx.db.patch(offer._id, {
        listingId: undefined,
        metadata: { ...offer.metadata, productSku: 'LEGACY', marketplace: 'Amazon' },
      })
    })
    await t.mutation(internal.network.seed, { tenantId: 'org-a' })
    const refreshed = (await t.run((ctx) => ctx.db.get(offer._id)))!
    expect(refreshed.listingId).toBeDefined()
    expect(refreshed.metadata.productSku).toBeUndefined()
    expect(refreshed.metadata.marketplace).toBeUndefined()
  })
})

describe('products, listings, and storefronts', () => {
  test('are rejected across tenants', async () => {
    const { orgA, orgB, marketplaceId } = await seeded()
    const productId = await orgA.mutation(api.products.create, { name: 'Org A product' })
    const amazonUs = await marketplaceId('amazon-us')
    await expect(
      orgB.mutation(api.listings.create, {
        productId,
        marketplaceId: amazonUs,
        externalId: 'B000000001',
        url: 'https://www.amazon.com/dp/B000000001',
      }),
    ).rejects.toThrow('Product not found')
    await expect(
      orgB.mutation(api.products.update, { productId, name: 'Hijacked' }),
    ).rejects.toThrow('Product not found')
    const storefrontId = await orgA.mutation(api.brandStorefronts.create, {
      marketplaceId: await marketplaceId('target-us'),
      name: 'Org A on Target',
      url: 'https://www.target.com/b/org-a',
    })
    await expect(
      orgB.mutation(api.brandStorefronts.update, { storefrontId, status: 'live' }),
    ).rejects.toThrow('Storefront not found')
    const listingId = await orgA.mutation(api.listings.create, {
      productId,
      marketplaceId: amazonUs,
      externalId: 'B000000001',
      url: 'https://www.amazon.com/dp/B000000001',
    })
    await expect(orgB.query(api.listings.get, { listingId })).rejects.toThrow('Listing not found')
    expect((await orgB.query(api.listings.list, {})).map((row) => row._id)).not.toContain(listingId)
  })

  test('reject a duplicate external id on the same marketplace within a tenant', async () => {
    const { orgA, marketplaceId } = await seeded()
    const productId = await orgA.mutation(api.products.create, { name: 'Purifier' })
    const amazonUs = await marketplaceId('amazon-us')
    const args = {
      productId,
      marketplaceId: amazonUs,
      externalId: 'B0DUPLICATE',
      url: 'https://www.amazon.com/dp/B0DUPLICATE',
    }
    await orgA.mutation(api.listings.create, args)
    await expect(orgA.mutation(api.listings.create, args)).rejects.toThrow('already listed')
    // The same external id on another site is a different listing.
    await orgA.mutation(api.listings.create, {
      ...args,
      marketplaceId: await marketplaceId('amazon-ca'),
      url: 'https://www.amazon.ca/dp/B0DUPLICATE',
    })
  })

  test('reject a storefront from another marketplace', async () => {
    const { orgA, marketplaceId } = await seeded()
    const productId = await orgA.mutation(api.products.create, { name: 'Purifier' })
    const storefronts = await orgA.query(api.brandStorefronts.list, {})
    const amazonCa = storefronts.find((row) => row.marketplace?.key === 'amazon-ca')!
    await expect(
      orgA.mutation(api.listings.create, {
        productId,
        marketplaceId: await marketplaceId('amazon-us'),
        storefrontId: amazonCa.storefront._id,
        externalId: 'B0WRONGSITE',
        url: 'https://www.amazon.com/dp/B0WRONGSITE',
      }),
    ).rejects.toThrow('not on Amazon US')
  })

  test('a DTC listing must carry its own currency', async () => {
    const { orgA, marketplaceId } = await seeded()
    const productId = await orgA.mutation(api.products.create, { name: 'Purifier' })
    const shopify = await marketplaceId('shopify')
    await expect(
      orgA.mutation(api.listings.create, {
        productId,
        marketplaceId: shopify,
        externalId: 'variant-1',
        url: 'https://puroair.com/products/variant-1',
      }),
    ).rejects.toThrow('must set a currency')
    const listingId = await orgA.mutation(api.listings.create, {
      productId,
      marketplaceId: shopify,
      externalId: 'variant-1',
      url: 'https://puroair.com/products/variant-1',
      currency: 'USD',
    })
    expect((await orgA.query(api.listings.get, { listingId })).listing.currency).toBe('USD')
  })

  test('a product SKU is unique within a tenant', async () => {
    const { orgA, orgB } = await seeded()
    await orgA.mutation(api.products.create, { name: 'One', sku: 'SKU-1' })
    await expect(orgA.mutation(api.products.create, { name: 'Two', sku: 'SKU-1' })).rejects.toThrow(
      'already used',
    )
    await orgB.mutation(api.products.create, { name: 'Elsewhere', sku: 'SKU-1' })
  })
})

describe('offers and links on listings', () => {
  test('an offer cannot promote a listing from another tenant', async () => {
    const { t, orgA, orgB } = await seeded()
    const program = (await t.run((ctx) =>
      ctx.db
        .query('programs')
        .withIndex('by_tenantId', (q) => q.eq('tenantId', 'org-b'))
        .first(),
    ))!
    const listingA = (await orgA.query(api.listings.list, {}))[0]!
    const listingB = (await orgB.query(api.listings.list, {}))[0]!
    const args = {
      programId: program._id,
      slug: 'new-offer',
      name: 'New offer',
      summary: 'Promotes a listing',
      defaultPublisherShareBps: 7000,
    }
    await expect(
      orgB.mutation(api.offers.createOffer, { ...args, listingId: listingA._id }),
    ).rejects.toThrow('Listing not found')
    const offerId = await orgB.mutation(api.offers.createOffer, {
      ...args,
      listingId: listingB._id,
    })
    expect(await t.run((ctx) => ctx.db.get(offerId))).toMatchObject({
      tenantId: 'org-b',
      listingId: listingB._id,
      advertiserId: program.advertiserId,
      providerId: program.providerId,
    })
  })

  test('a link for an offer defaults its destination to the listing URL', async () => {
    const { t, orgA } = await seeded()
    const fixture = await t.run(async (ctx) => {
      const offer = (await ctx.db
        .query('offers')
        .withIndex('by_tenantId', (q) => q.eq('tenantId', 'org-a'))
        .first())!
      const listing = (await ctx.db.get(offer.listingId!))!
      const property = (await ctx.db
        .query('properties')
        .withIndex('by_tenantId', (q) => q.eq('tenantId', 'org-a'))
        .first())!
      return { offer, listing, property }
    })
    const { linkId, versionId } = await orgA.mutation(api.links.create, {
      publisherId: fixture.property.publisherId,
      propertyId: fixture.property._id,
      advertiserId: fixture.offer.advertiserId,
      offerId: fixture.offer._id,
      providerId: fixture.offer.providerId,
      programId: fixture.offer.programId,
      slug: 'listing-default',
      displayName: 'Listing default',
      actor: 'test',
      providerTrackingUrl: 'https://track.example/listing-default',
    })
    const version = (await t.run((ctx) => ctx.db.get(versionId)))!
    expect(version.linkId).toBe(linkId)
    expect(version.originalDestinationUrl).toBe(fixture.listing.url)
    expect(version.normalizedDestinationUrl).toBe(fixture.listing.url)
  })
})

describe('catalog maintenance', () => {
  test('the internal marketplace upsert enforces the retailer and DTC shapes and never duplicates a key', async () => {
    const { t } = await seeded()
    await expect(
      t.mutation(internal.marketplaces.upsert, {
        key: 'target-ca',
        platform: 'target',
        kind: 'retailer',
        name: 'Target CA',
      }),
    ).rejects.toThrow('needs countryCode, domain, and currency')
    await expect(
      t.mutation(internal.marketplaces.upsert, {
        key: 'bigcommerce',
        platform: 'bigcommerce',
        kind: 'dtc',
        name: 'BigCommerce',
        domain: 'bigcommerce.com',
      }),
    ).rejects.toThrow('must not carry a country, domain, or currency')
    const first = await t.mutation(internal.marketplaces.upsert, {
      key: 'amazon-us',
      platform: 'amazon',
      kind: 'retailer',
      name: 'Amazon United States',
      countryCode: 'US',
      domain: 'amazon.com',
      currency: 'USD',
      status: 'inactive',
    })
    const again = await t.mutation(internal.marketplaces.upsert, {
      key: 'amazon-us',
      platform: 'amazon',
      kind: 'retailer',
      name: 'Amazon US',
      countryCode: 'US',
      domain: 'amazon.com',
      currency: 'USD',
    })
    expect(again).toBe(first)
    const rows = await t.run((ctx) => ctx.db.query('marketplaces').collect())
    expect(rows.filter((row) => row.key === 'amazon-us')).toHaveLength(1)
    const orgA = t.withIdentity({ subject: 'user-a', org_id: 'org-a' })
    const active = await orgA.query(api.marketplaces.list, { status: 'active' })
    expect(active.map((row) => row.key)).not.toContain('amazon-us')
    expect(active).toHaveLength(marketplaces.length - 1)
  })

  test('a tenant has at most one storefront per marketplace', async () => {
    const { orgA, marketplaceId } = await seeded()
    const args = {
      marketplaceId: await marketplaceId('amazon-us'),
      name: 'Second store',
      url: 'https://www.amazon.com/stores/second',
    }
    await expect(orgA.mutation(api.brandStorefronts.create, args)).rejects.toThrow(
      'already has a storefront on Amazon US',
    )
    const targetId = await orgA.mutation(api.brandStorefronts.create, {
      ...args,
      marketplaceId: await marketplaceId('target-us'),
    })
    const listed = await orgA.query(api.brandStorefronts.list, {})
    expect(listed.find((row) => row.storefront._id === targetId)).toMatchObject({
      storefront: { status: 'pending' },
      marketplace: { key: 'target-us' },
    })
  })

  test('product and listing updates keep a status history and refuse a storefront on another site', async () => {
    const { orgA, marketplaceId } = await seeded()
    const productId = await orgA.mutation(api.products.create, { name: 'Purifier', sku: 'P-1' })
    await orgA.mutation(api.products.update, {
      productId,
      status: 'archived',
      reason: 'Discontinued',
    })
    const { product, listings } = await orgA.query(api.products.get, { productId })
    expect(product.status).toBe('archived')
    expect(product.statusHistory?.map((change) => change.status)).toEqual(['active', 'archived'])
    expect(product.statusHistory?.at(-1)?.reason).toBe('Discontinued')
    expect(listings).toEqual([])

    const listingId = await orgA.mutation(api.listings.create, {
      productId,
      marketplaceId: await marketplaceId('amazon-us'),
      externalId: 'B0UPDATE01',
      url: 'https://www.amazon.com/dp/B0UPDATE01',
    })
    await orgA.mutation(api.listings.update, { listingId, status: 'paused', priceCents: 1_999 })
    const { listing } = await orgA.query(api.listings.get, { listingId })
    expect(listing).toMatchObject({ status: 'paused', priceCents: 1_999 })
    expect(listing.statusHistory?.map((change) => change.status)).toEqual(['active', 'paused'])
    const storefronts = await orgA.query(api.brandStorefronts.list, {})
    const shopify = storefronts.find((row) => row.marketplace?.key === 'shopify')!
    await expect(
      orgA.mutation(api.listings.update, { listingId, storefrontId: shopify.storefront._id }),
    ).rejects.toThrow('different marketplace')
  })

  test('listing queries filter by product, marketplace, and status within the tenant', async () => {
    const { orgA, marketplaceId } = await seeded()
    const productId = await orgA.mutation(api.products.create, { name: 'Filtered' })
    const amazonUs = await marketplaceId('amazon-us')
    const walmartUs = await marketplaceId('walmart-us')
    const a = await orgA.mutation(api.listings.create, {
      productId,
      marketplaceId: amazonUs,
      externalId: 'B0FILTER01',
      url: 'https://www.amazon.com/dp/B0FILTER01',
    })
    const b = await orgA.mutation(api.listings.create, {
      productId,
      marketplaceId: walmartUs,
      externalId: '100200300',
      url: 'https://www.walmart.com/ip/100200300',
    })
    await orgA.mutation(api.listings.update, { listingId: b, status: 'unavailable' })
    const ids = (rows: Array<{ _id: string }>) => rows.map((row) => row._id).sort()
    expect(ids(await orgA.query(api.listings.list, { productId }))).toEqual([a, b].sort())
    const onWalmart = await orgA.query(api.listings.list, { marketplaceId: walmartUs })
    expect(ids(onWalmart)).toContain(b)
    expect(onWalmart.every((row) => row.marketplaceId === walmartUs)).toBe(true)
    expect(ids(await orgA.query(api.listings.list, { productId, status: 'unavailable' }))).toEqual([
      b,
    ])
  })

  test('resetting a tenant removes its catalog rows but keeps the global marketplaces', async () => {
    const { t } = await seeded()
    await t.mutation(internal.network.reset, {
      tenantId: 'org-a',
      confirmation: 'DELETE_AND_RESEED_NETWORK',
    })
    const count = (table: 'products' | 'listings' | 'brandStorefronts', tenantId: string) =>
      t.run(
        async (ctx) =>
          (
            await ctx.db
              .query(table)
              .withIndex('by_tenantId', (q) => q.eq('tenantId', tenantId))
              .collect()
          ).length,
      )
    expect(await count('products', 'org-a')).toBe(0)
    expect(await count('listings', 'org-a')).toBe(0)
    expect(await count('brandStorefronts', 'org-a')).toBe(0)
    expect(await count('listings', 'org-b')).toBeGreaterThan(0)
    expect(await t.run((ctx) => ctx.db.query('marketplaces').collect())).toHaveLength(
      marketplaces.length,
    )
  })
})
