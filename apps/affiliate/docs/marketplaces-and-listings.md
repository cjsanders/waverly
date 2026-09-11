# Marketplaces, products, and listings

Design for the brand catalog in the affiliate app. Terms are defined in the root [CONTEXT.md](../../../CONTEXT.md); decisions are in [docs/adr](../../../docs/adr) 0001 through 0007. This document holds the working detail those records point at.

## Model

```
marketplaces (global)         brandProducts (brand tenant)
  key, platform, kind           name, sku, description, images
  countryCode?, domain?              │
  currency?, status                  │ 1..n
        │                            ▼
        │ 1..n               listings (brand tenant)
        ├───────────────────► productId, marketplaceId, storefrontId?
        │                     externalId, parentExternalId?, url
        │                     priceCents?, currency?, status
        │                     source, lastSyncedAt?, snapshot?
        │ 1..n                        ▲
        ▼                             │ 0..1
brandStorefronts (brand tenant)       │
  marketplaceId, url,           offers.listingId? (optional, new offers set it)
  externalSellerRef?, status
```

### `marketplaces`

Global reference data, no `tenantId` (ADR 0002). Seeded from a static list in `shared/marketplaces.ts`; operators may add rows later through an internal mutation.

| Field                    | Type                  | Notes                                                                                   |
| ------------------------ | --------------------- | --------------------------------------------------------------------------------------- |
| `key`                    | string                | Stable slug: `amazon-us`, `amazon-ca`, `walmart-us`, `shopify`. Unique.                 |
| `platform`               | string                | Groups sites of one company: `amazon`, `walmart`, `target`, `shopify`. Indexed.         |
| `kind`                   | `'retailer' \| 'dtc'` | ADR 0004.                                                                               |
| `name`                   | string                | Display name: `Amazon US`.                                                              |
| `countryCode`            | string, optional      | ISO 3166-1 alpha-2. Required when `kind` is `retailer`, absent for `dtc`.               |
| `domain`                 | string, optional      | `amazon.com`, `amazon.ca`. Absent for `dtc`.                                            |
| `currency`               | string, optional      | ISO 4217 default for listings on this site. Absent for `dtc`.                           |
| `status`                 | string                | `active` or `inactive`. Inactive sites are hidden from pickers but keep their listings. |
| `createdAt`, `updatedAt` | number                |                                                                                         |
| `metadata`               | any, optional         |                                                                                         |

Indexes: `by_key`, `by_platform`, `by_status`.

Initial rows: Amazon US, Amazon CA, Walmart US, Target US, Shopify (dtc). The fixture's `'Amazon' | 'Shopify' | 'Walmart'` plus `countryCode` collapses into `marketplaceKey`.

### `brandProducts`

Brand-owned catalog, tenant-scoped (ADR 0003). No `advertiserId` (ADR 0003, 0006). Named `brandProducts` because the legacy preview seed left a `products` placeholder table in reused previews; an undeclared table is not validated on schema push, so no migration is needed. The Convex module is still `products`.

| Field                    | Type                     | Notes                                                         |
| ------------------------ | ------------------------ | ------------------------------------------------------------- |
| `tenantId`               | string                   | Required. New tables do not inherit the legacy optional form. |
| `name`                   | string                   |                                                               |
| `sku`                    | string, optional         | Brand's internal identifier. Unique per tenant when present.  |
| `description`            | string, optional         |                                                               |
| `imageUrls`              | string[]                 | Local assets under `public/network` for seeded rows.          |
| `status`                 | string                   | `active`, `archived`. History in `statusHistory`.             |
| `createdAt`, `updatedAt` | number                   |                                                               |
| `statusHistory`          | statusChange[], optional |                                                               |
| `metadata`               | any, optional            |                                                               |

Indexes: `by_tenantId`, `by_tenantId_sku`, `by_tenantId_status`.

### `listings`

One buyable item on one marketplace (ADR 0003). Unique per tenant on `marketplaceId` + `externalId`; the insert mutation checks the index and rejects duplicates.

| Field                    | Type                           | Notes                                                                    |
| ------------------------ | ------------------------------ | ------------------------------------------------------------------------ |
| `tenantId`               | string                         | Required. Must equal the product's tenant.                               |
| `productId`              | id(products)                   |                                                                          |
| `marketplaceId`          | id(marketplaces)               |                                                                          |
| `storefrontId`           | id(brandStorefronts), optional | Must belong to the same tenant and marketplace.                          |
| `externalId`             | string                         | Child ASIN, Walmart item id, Shopify variant id.                         |
| `parentExternalId`       | string, optional               | Parent ASIN or equivalent for variant grouping.                          |
| `url`                    | string                         | Canonical listing URL. Default link destination (ADR 0005).              |
| `title`                  | string, optional               | Title as shown on the marketplace when it differs from the product name. |
| `priceCents`             | number, optional               |                                                                          |
| `currency`               | string, optional               | Defaults from the marketplace; required for `dtc` sites.                 |
| `status`                 | string                         | `active`, `paused`, `unavailable`, `archived`.                           |
| `source`                 | string                         | `manual` now; a provider key (`amazon`) once imports exist.              |
| `lastSyncedAt`           | number, optional               | Set only by imports.                                                     |
| `snapshot`               | any, optional                  | Last raw marketplace payload, set only by imports.                       |
| `createdAt`, `updatedAt` | number                         |                                                                          |
| `statusHistory`          | statusChange[], optional       |                                                                          |
| `metadata`               | any, optional                  |                                                                          |

Indexes: `by_tenantId`, `by_productId`, `by_tenantId_marketplaceId_externalId`, `by_tenantId_marketplaceId`, `by_storefrontId`.

### `brandStorefronts`

A brand's presence on one marketplace (ADR 0004). Unique per tenant on `marketplaceId`.

| Field                    | Type              | Notes                                          |
| ------------------------ | ----------------- | ---------------------------------------------- |
| `tenantId`               | string            | Required.                                      |
| `marketplaceId`          | id(marketplaces)  |                                                |
| `name`                   | string            | `PuroAir` store name.                          |
| `url`                    | string            | `amazon.com/stores/PuroAir`, `puroair.com`.    |
| `externalSellerRef`      | string, optional  | Seller or merchant id on the marketplace.      |
| `status`                 | string            | `live`, `pending`, `disconnected`.             |
| `autoAcceptApplications` | boolean, optional | Carried over from the seller channels fixture. |
| `createdAt`, `updatedAt` | number            |                                                |
| `metadata`               | any, optional     |                                                |

Indexes: `by_tenantId`, `by_tenantId_marketplaceId`.

### Changes to existing tables

- `offers.listingId: v.optional(v.id('listings'))` with index `by_listingId` (ADR 0005). The offer mutation that creates non-seeded offers requires it and checks the listing belongs to the same tenant.
- `convex/marketplace.ts` is renamed to `convex/offers.ts` (ADR 0007). Callers of `api.marketplace.*` move to `api.offers.*`.
- No change to programs, providers, links, conversions, ledger, or payouts.

## Invariants

- A listing's tenant equals its product's tenant, and its storefront (if set) belongs to the same tenant and the same marketplace. Mutations enforce this; cross-tenant ids are treated as missing, matching `requireTenantDocument`.
- A `retailer` marketplace has `countryCode`, `domain`, and `currency`; a `dtc` marketplace has none of them, and listings on it carry their own `currency`.
- `marketplaces` is read-only through public functions. Writes go through an internal mutation used by the seed.
- Global marketplace reads do not require a tenant document check but still require an authenticated network session, so the catalog is not anonymous.

## Access

`networkAccess` gains a `requireGlobalDocument` helper (or the marketplace queries call `requireNetworkSession` and skip the tenant check) so the exemption in ADR 0002 is visible in code rather than implied by an `undefined` tenant. Products, listings, and storefronts use the existing `requireTenantDocument`.

## Seed and fixture

- `shared/marketplaces.ts` exports the initial global rows. `network.initialize` upserts them by `key` before seeding the tenant.
- `shared/networkSellerData.ts` `sellerChannels` becomes the seed for `brandStorefronts` in brand tenants; `SellerMarketplace` (`'Amazon US' | 'Amazon CA' | 'Shopify'`) is replaced by marketplace keys.
- `shared/networkData.ts` `SeedProgramOffer` gains `marketplaceKey`, `productKey`, and `externalId`, replacing `marketplace` + `countryCode` + `productSku`. The seed creates products and listings per tenant, then sets `offers.listingId`. `offers.metadata` product fields are removed in the same change (ADR 0005).
- Programs keep `metadata.marketplace` and `metadata.countryCode` until programs get their own marketplace reference, which is out of scope here.
- The seed writes PuroAir's storefronts for every tenant, matching how the rest of the demo copy (publishers, advertisers, seller data) is seeded per tenant regardless of workspace kind.
- Tenants seeded before listings existed are backfilled on the next `network.seed` refresh: each offer gets a product and listing, `listingId` is set, and the product fields leave `offers.metadata`.
- `previewSeed` (preview deployments) now seeds the global marketplace catalog instead of the legacy placeholder `products` table. That table is no longer declared in the schema; rows left in older previews are ignored and expire with the preview.

## Tests

- convex-test: marketplace catalog readable by any signed-in session; products, listings, storefronts rejected across tenants; duplicate `(marketplaceId, externalId)` rejected; listing with a storefront from another marketplace rejected; `dtc` listing without currency rejected; offer creation with a foreign listing rejected.
- Seed test: repeatable seeding leaves one row per marketplace key and one storefront per brand per marketplace.

## Open questions

| Question                                                                      | Depends on                     | Status                                                                       |
| ----------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| How does a listing become visible to creators and operators in other tenants? | Network-wide read model        | Deferred by ADR 0006. Next decision in this area.                            |
| Should programs reference a marketplace directly instead of `metadata`?       | Provider and attribution model | Out of scope; revisit when provider imports land.                            |
| Do listings need a price history, or is the conversion snapshot enough?       | Reporting requirements         | Not needed for the first cut. Conversions already snapshot commission terms. |
| Who can add marketplace rows: operators in the app, or only the seed?         | Operator settings surface      | Seed only until an operator surface exists.                                  |

## Implementation, 2026-09-10

Landed in one change: the four tables and `offers.listingId` in `convex/schema.ts`; `shared/marketplaces.ts` (catalog, `marketplaceForKey`, `listingUrl`); `convex/lib/marketplaces.ts` (`upsertMarketplaces`, shape check); modules `marketplaces`, `products`, `listings`, `brandStorefronts`, and `offers` (renamed from `marketplace`, plus `createOffer`); `requireGlobalDocument` in `networkAccess`; `links.create` defaults the destination to the offer's listing URL; the fixture carries `marketplaceKey`, `productKey`, `externalId`; tests in `convex/catalog.test.ts`.

## Decisions, 2026-09-10

Grilling session that produced ADRs 0001 to 0007. Marketplace is one country site with a `platform` grouping key; the catalog is global and Waverly-managed; brands own products, listings are buyable items unique on marketplace plus external id, entered manually with import-ready fields; DTC stores are marketplaces of kind `dtc` and brand storefronts record presence; offers reference a listing; listings stay brand-tenant-scoped with cross-tenant discovery explicitly deferred; the word Marketplace is reserved and the offer module is renamed.
