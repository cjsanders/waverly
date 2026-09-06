# Network demo feature map

Waverly carries the core feature set from `orion-network` into the authenticated affiliate app. Open `/dashboard` after signing in and use **Demo identity** to explore five personas. These are demo perspectives, not authorization roles.

## Workspaces

| Persona               | Included pages                                                                                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operator              | Overview, publishers, advertisers, programs, offers, links, clicks, conversions, reports, balances, payouts, providers, messages, settings                                                                      |
| Established publisher | Overview, recommendations, product and brand catalogs, CPC campaigns, loyalty programs, saved lists, partnerships, placements, tracking, storefront, reports, earnings, payouts, properties, messages, settings |
| New publisher         | Onboarding and property review, recommendations, product and brand catalogs, CPC campaigns, loyalty programs, saved lists, properties, messages, settings                                                       |
| Creator               | Overview, opportunities, projects, portfolio, performance, earnings, payouts, publisher relationships, messages, settings                                                                                       |
| Brand seller          | Overview, brand profile, products and commissions, deals and CPC, samples, creator directory, applications, partnerships, paid placements, performance, deep reports, billing, messages, settings               |

The seven-step guided journey is retained on the overview. Search, filters, product and brand details, report date ranges, CSV exports, role switching, mobile navigation, and browser back/forward work across the relevant pages. Saved product selections persist per persona in browser session storage.

## Persistence and demo boundaries

- **Persisted in Convex:** shared message threads, replies, attachments, reactions and read state. Typing indicators use the Convex presence component. Message access verifies both a real authenticated session and membership of the selected demo persona in the thread. Nonces prevent duplicate sends.
- **Browser session:** selected persona/page and saved products. URL parameters (`role` and `page`) support direct links and history; invalid pages fall back to that persona's overview.
- **Simulated in the UI:** application and sample decisions, creator briefs and project progress, private rates, settings, campaigns, placements, storefront editing, and operational actions. These retain the source demo's behavior; they do not contact brands, fulfill samples, distribute tracking traffic, import live provider data, or send money. Other than saved products, simulation state may reset when leaving its workspace or refreshing.
- **Backend foundation:** publisher/property approval, offer edits, stable links with immutable destination versions, idempotent conversion imports with snapshotted commission terms, append-only ledger entries, and payout reservation/settlement. These APIs are retained and tested independently of the simulated UI. Backend mutations record the real session identity for actor audit fields.

All signed-in users share this sample sandbox and can choose any demo persona. WorkOS organizations are not yet separate tenants of the network data. Do not introduce real partner, customer, or financial records without adding tenant isolation and server-side role permissions first.

## Data and initialization

The deterministic fixture contains 3 providers, 20 advertisers, 24 offers/programs, 15 publishers, 30 properties, 100 links, 180 conversions and 90 daily performance records. Seller and creator fixtures add commercial programs, applications, samples, placements and reporting. Product photography and brand assets are local under `public/demo`; no asset-generation service is required.

`demo.initialize` requires authentication and seeds only an empty database on first dashboard access. It does not reset existing demo changes. `demo.seed` is an internal, repeatable catalog refresh; `demo.reset` remains an internal development utility with an explicit destructive confirmation. Schema validation is enabled and the original Waverly `products` table is preserved.

## Architecture

- `src/features/network/`: feature modules for each workspace, navigation/search state, formatting, reporting, and messaging. Large portals are loaded on demand.
- `src/features/network/ui/`: layout and interaction components adapted from the reference; basic controls use `@waverly/design-system`. Base UI supports the imported accessible selectors, popovers, tabs and messaging components.
- `shared/`: deterministic fixtures used by both the browser and the seed.
- `convex/domain/`: pure financial and link rules. Convex APIs enforce sign-in through `demoAccess` and preserve Waverly's existing WorkOS authentication configuration.

## Verification

From the repository root:

```sh
bun run check
bun run --cwd apps/affiliate test:e2e
```

The end-to-end harness uses local WorkOS and Convex emulators, seeds the sample data, builds the production app, and runs browser tests without cloud credentials. Coverage includes all 65 navigation pages, authentication, history and refresh, filtering, saved products, CSV downloads, seller applications, creator briefs, shared messages, and mobile role switching. Unit/integration tests cover deterministic data, schema-valid repeatable seeding, anonymous access rejection, messaging/attachments/reactions/presence, immutable link versions, conversion deduplication, and payout balance conservation.

Cloud deployment remains the existing separate Convex and Cloudflare workflow. Deploy the updated Convex functions before publishing an affiliate build that references them.
