# SSR and prefetching

The affiliate app uses [Convex's TanStack Start integration](https://docs.convex.dev/client/tanstack/tanstack-start/). Each router creates its own Convex and TanStack Query clients. The root route supplies the WorkOS access token to the server HTTP client before protected routes load, and the SSR query integration transfers fetched data to the browser. Convex resumes live queries through the same query cache. The browser client waits for authentication before sending queries.

The operator, brand, and creator routes use `loaderDeps` for the `page` and `thread` search parameters. Their shared `loadWorkspaceData` loader fetches the Messages inbox and the requested accessible conversation (or the first conversation). `ensureQueryData` makes that data available before rendering. The message view uses the same query factories through TanStack Query; typing presence stays client-only. Other workspace surfaces currently render local fixture data and do not need Convex fetches.

Sidebar links preload on hover or focus. Query caching uses TanStack Query's defaults: five minutes in the browser and no garbage collection during SSR. Add future protected page queries to `src/features/network/queries.ts` and consume the same options in the page component. Use `ensureQueryData` for required data or `void queryClient.prefetchQuery(...)` for optional data whose component supports a loading state. Do not run mutations from prefetch loaders.

Workspace selection and switching start a new document request after WorkOS updates the organization. This creates fresh query clients for the new auth scope; existing Convex query keys do not include the organization. Browser preferences are applied after hydration, and reporting dates use UTC so the initial markup is stable across server and browser time zones.

Run `bun run --cwd apps/affiliate test` for loader/cache tests and `bun run --cwd apps/affiliate test:e2e` for the local production-build suite. The browser suite covers all workspace pages, messages rendered with JavaScript disabled, link-intent prefetching, message persistence, and organization switching.
