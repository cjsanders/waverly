/**
 * Global marketplace catalog (ADR 0001, 0002, 0004). One row per country site; `platform` groups
 * the sites of one company, and `kind: 'dtc'` marks brand-owned store platforms with no country.
 */
export type MarketplaceKind = 'retailer' | 'dtc'

export interface MarketplaceSeed {
  key: string
  platform: string
  kind: MarketplaceKind
  name: string
  countryCode?: string
  domain?: string
  currency?: string
}

export const marketplaces = [
  {
    key: 'amazon-us',
    platform: 'amazon',
    kind: 'retailer',
    name: 'Amazon US',
    countryCode: 'US',
    domain: 'amazon.com',
    currency: 'USD',
  },
  {
    key: 'amazon-ca',
    platform: 'amazon',
    kind: 'retailer',
    name: 'Amazon CA',
    countryCode: 'CA',
    domain: 'amazon.ca',
    currency: 'CAD',
  },
  {
    key: 'walmart-us',
    platform: 'walmart',
    kind: 'retailer',
    name: 'Walmart US',
    countryCode: 'US',
    domain: 'walmart.com',
    currency: 'USD',
  },
  {
    key: 'target-us',
    platform: 'target',
    kind: 'retailer',
    name: 'Target US',
    countryCode: 'US',
    domain: 'target.com',
    currency: 'USD',
  },
  { key: 'shopify', platform: 'shopify', kind: 'dtc', name: 'Shopify' },
] as const satisfies readonly MarketplaceSeed[]

export type MarketplaceKey = (typeof marketplaces)[number]['key']

export function marketplaceForKey(key: MarketplaceKey): MarketplaceSeed {
  const marketplace = marketplaces.find((candidate) => candidate.key === key)
  if (!marketplace) throw new Error(`Unknown marketplace ${key}`)
  return marketplace
}

/**
 * Canonical product URL for a listing. Retail sites resolve against the shared domain; DTC sites
 * resolve against the brand's own storefront, which is why a storefront URL is required there.
 */
export function listingUrl(
  marketplace: Pick<MarketplaceSeed, 'kind' | 'platform' | 'name' | 'domain'>,
  externalId: string,
  storefrontUrl?: string,
): string {
  if (marketplace.kind === 'dtc') {
    if (!storefrontUrl) throw new Error(`Listings on ${marketplace.name} need a storefront URL`)
    const base = storefrontUrl.startsWith('http') ? storefrontUrl : `https://${storefrontUrl}`
    return `${base.replace(/\/$/, '')}/products/${externalId}`
  }
  const path =
    marketplace.platform === 'amazon'
      ? `/dp/${externalId}`
      : marketplace.platform === 'walmart'
        ? `/ip/${externalId}`
        : marketplace.platform === 'target'
          ? `/p/-/A-${externalId}`
          : `/products/${externalId}`
  return `https://www.${marketplace.domain}${path}`
}
