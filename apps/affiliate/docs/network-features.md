# Network feature map

Waverly carries the core feature set from `orion-network` into the authenticated affiliate app.
The `/operator`, `/brand`, and `/creator` routes are selected from the active WorkOS organization.
Use the sidebar workspace switcher to move between organizations.

## Workspaces

| Organization | Included pages                                                                                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operator     | Overview, publishers, advertisers, programs, offers, links, clicks, conversions, reports, balances, payouts, providers, messages, settings                                                                           |
| Creator      | Overview, onboarding, discovery catalogs, CPC and loyalty programs, opportunities, projects, portfolio, partnerships, placements, tracking, storefront, reporting, earnings, payouts, properties, messages, settings |
| Brand        | Overview, brand profile, products and commissions, deals and CPC, samples, creator directory, applications, partnerships, paid placements, performance, deep reports, billing, messages, settings                    |

The seven-step guided journey is retained on the overview. Search, filters, product and brand details, report date ranges, CSV exports, organization switching, mobile navigation, and browser back/forward work across the relevant pages. Saved product selections persist per workspace in browser session storage.

## Persistence and development-data boundaries

- **Persisted in Convex:** message threads, replies, attachments, reactions and read state are scoped to the active WorkOS organization. Typing rooms, room/session tokens, upload authorizations and attachment claims carry the same boundary. Message access requires a real authenticated organization session and a matching network participant. Nonces prevent duplicate sends within an organization.
- **Browser session:** the selected page and saved products are keyed by WorkOS organization. The `page` URL parameter supports direct links and history; invalid pages fall back to the active organization's overview.
- **Simulated in the UI:** application and sample decisions, creator briefs and project progress, private rates, settings, campaigns, placements, storefront editing, and operational actions. These do not yet contact brands, fulfill samples, distribute tracking traffic, import live provider data, or send money. Other than saved products, simulation state may reset when leaving its workspace or refreshing.
- **Backend foundation:** publisher/property approval, offer edits, stable links with immutable destination versions, idempotent conversion imports with snapshotted commission terms, append-only ledger entries, and payout reservation/settlement. These APIs are retained and tested independently of the simulated UI. Backend mutations record the real session identity for actor audit fields.

Every network record carries a `tenantId` derived only from the verified WorkOS `org_id` claim. Queries select that tenant, writes stamp it, and mutations treat cross-tenant IDs as missing. Legacy fixture rows without a tenant remain schema-compatible for deployment migration but are inaccessible through public functions.

## Data and initialization

The deterministic fixture contains 3 providers, 20 advertisers, 24 offers/programs, 15 publishers, 30 properties, 100 links, 180 conversions and 90 daily performance records. Seller and creator fixtures add commercial programs, applications, samples, placements and reporting. Product photography and brand assets are local under `public/network`; no asset-generation service is required.

`network.initialize` requires an authenticated organization and seeds only that tenant on first workspace access. It does not reset existing changes. `network.seed` is an internal, repeatable per-tenant catalog refresh; `network.reset` remains an internal per-tenant development utility with an explicit destructive confirmation. Schema validation is enabled; the original placeholder `products` table is no longer declared (the brand catalog lives in `brandProducts`).

## Architecture

The brand catalog (marketplaces, products, listings, brand storefronts) is designed in [marketplaces-and-listings.md](marketplaces-and-listings.md); vocabulary is in the root `CONTEXT.md` and decisions in `docs/adr`.

- `src/features/network/`: feature modules for each workspace, navigation/search state, formatting, reporting, and messaging. Large portals are loaded on demand.
- `src/features/network/ui/`: layout and interaction components adapted from the reference; basic controls use `@waverly/design-system`. Base UI supports the imported accessible selectors, popovers, tabs and messaging components.
- `shared/`: deterministic fixtures used by both the browser and the seed.
- `convex/domain/`: pure financial and link rules. Convex APIs enforce sign-in through `networkAccess` and preserve Waverly's existing WorkOS authentication configuration.

## Verification

From the repository root:

```sh
bun run check
bun run --cwd apps/affiliate test:e2e
```

The end-to-end harness uses local WorkOS and Convex emulators, seeds the sample data, builds the production app, and runs browser tests without cloud credentials. Coverage includes the workspace pages, authentication, history and refresh, filtering, saved products, CSV downloads, seller applications, creator briefs, shared messages, and organization switching. Unit/integration tests cover deterministic data, schema-valid repeatable seeding, anonymous access rejection, messaging/attachments/reactions/presence, immutable link versions, conversion deduplication, and payout balance conservation.

Cloud deployment remains the existing separate Convex and Cloudflare workflow. Deploy the updated Convex functions before publishing an affiliate build that references them.
