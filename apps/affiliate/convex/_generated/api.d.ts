/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as demo from "../demo.js";
import type * as demoAccess from "../demoAccess.js";
import type * as domain_economics from "../domain/economics.js";
import type * as domain_links from "../domain/links.js";
import type * as ledger from "../ledger.js";
import type * as links from "../links.js";
import type * as marketplace from "../marketplace.js";
import type * as messages from "../messages.js";
import type * as payouts from "../payouts.js";
import type * as presence from "../presence.js";
import type * as providers from "../providers.js";
import type * as publishers from "../publishers.js";
import type * as viewer from "../viewer.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  demo: typeof demo;
  demoAccess: typeof demoAccess;
  "domain/economics": typeof domain_economics;
  "domain/links": typeof domain_links;
  ledger: typeof ledger;
  links: typeof links;
  marketplace: typeof marketplace;
  messages: typeof messages;
  payouts: typeof payouts;
  presence: typeof presence;
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
