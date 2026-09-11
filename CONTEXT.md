# Waverly context

Shared vocabulary and decision index for the Waverly monorepo. Decisions live in [docs/adr](docs/adr). Affiliate app design docs live in [apps/affiliate/docs](apps/affiliate/docs).

## Language

**Marketplace**:
A single sales site where products are listed and bought, specific to one country for retailers (Amazon US, Amazon CA, Walmart US) or country-less for DTC platforms (Shopify). Global reference data managed by Waverly, not tenant-scoped.
_Avoid_: channel, offer marketplace, store

**Platform**:
The company behind one or more marketplaces, held as a `platform` key on each marketplace row (`amazon` groups Amazon US and Amazon CA). Not a table.
_Avoid_: retailer (Shopify is a platform but not a retailer), network

**Marketplace kind**:
Whether a marketplace is a third-party `retailer` or a `dtc` platform the brand operates itself.
_Avoid_: channel type

**Brand Storefront**:
A brand's presence on one marketplace: its storefront URL, external seller reference, and status. Tenant-scoped, one per brand per marketplace.
_Avoid_: channel, seller account, store

**Product**:
An item in a brand's own catalog, owned by the brand's tenant and independent of where it is sold.
_Avoid_: SKU (that is the brand's internal identifier field on a product), item, ASIN

**Listing**:
One buyable item for one product on one marketplace, identified by the marketplace's external id (child ASIN, Walmart item id, Shopify variant). A product may have several listings per marketplace.
_Avoid_: product page, offer, SKU

**External id**:
The marketplace's own identifier for a listing. `parentExternalId` groups variant listings under the marketplace's parent item.
_Avoid_: ASIN (Amazon-specific), item id

**Offer**:
Commission terms under which publishers and creators may promote one listing through a program. The catalog of offers publishers browse is the offer catalog.
_Avoid_: marketplace, deal (a deal is an offer with `isDeal`)

**Tenant**:
The active WorkOS organization, carried as `tenantId` on every network record except the global `marketplaces` table.
_Avoid_: workspace (that is the UI mode for a tenant), account
