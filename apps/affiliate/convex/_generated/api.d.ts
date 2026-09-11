/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as brandStorefronts from "../brandStorefronts.js";
import type * as domain_economics from "../domain/economics.js";
import type * as domain_links from "../domain/links.js";
import type * as ledger from "../ledger.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_marketplaces from "../lib/marketplaces.js";
import type * as links from "../links.js";
import type * as listings from "../listings.js";
import type * as marketplaces from "../marketplaces.js";
import type * as messages from "../messages.js";
import type * as network from "../network.js";
import type * as networkAccess from "../networkAccess.js";
import type * as offers from "../offers.js";
import type * as payouts from "../payouts.js";
import type * as presence from "../presence.js";
import type * as previewSeed from "../previewSeed.js";
import type * as products from "../products.js";
import type * as providers from "../providers.js";
import type * as publishers from "../publishers.js";
import type * as viewer from "../viewer.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  brandStorefronts: typeof brandStorefronts;
  "domain/economics": typeof domain_economics;
  "domain/links": typeof domain_links;
  ledger: typeof ledger;
  "lib/access": typeof lib_access;
  "lib/marketplaces": typeof lib_marketplaces;
  links: typeof links;
  listings: typeof listings;
  marketplaces: typeof marketplaces;
  messages: typeof messages;
  network: typeof network;
  networkAccess: typeof networkAccess;
  offers: typeof offers;
  payouts: typeof payouts;
  presence: typeof presence;
  previewSeed: typeof previewSeed;
  products: typeof products;
  providers: typeof providers;
  publishers: typeof publishers;
  viewer: typeof viewer;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
};
