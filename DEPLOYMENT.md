# Cloudflare and Doppler

Waverly uses exactly three Cloudflare Workers in account `d464b0c0c3eb92aeb343cc1a2bb1c177`.

| App       | Worker              | Repository root directory | Doppler project     |
| --------- | ------------------- | ------------------------- | ------------------- |
| Website   | `waverly-website`   | `apps/website`            | `waverly-website`   |
| Affiliate | `waverly-affiliate` | `apps/affiliate`          | `waverly-affiliate` |
| Docs      | `waverly-docs`      | `apps/docs`               | `waverly-docs`      |

Each Worker connects to `cjsanders/waverly` through Cloudflare Workers Builds. `main` is the production branch. Enable builds for non-production branches on each Worker. Previews use `wrangler versions upload` on the same named Worker; they never create a branch-specific Worker or promote a preview to production.

## Build settings

For website and docs, use these commands with the root directory above:

- Build: `bun run build`
- Deploy: `bunx wrangler deploy`
- Non-production deploy: `bunx wrangler versions upload`

For affiliate, use an explicit no-op build command. The deployment helper fetches Doppler configuration before building:

- Build: `true`
- Deploy: `node ../../scripts/cloudflare.mjs affiliate deploy`
- Non-production deploy: `node ../../scripts/cloudflare.mjs affiliate preview`

The helper uses the Worker name in its Wrangler config, reads Cloudflare's `WORKERS_CI_BRANCH`, blocks production deployment from a non-main Cloudflare build, and creates a stable branch alias for previews. A Cloudflare build with missing branch metadata fails before downloading credentials or deploying. The account's Workers subdomain is `waverly-d46.workers.dev`.

The Bun version comes from the repository's `packageManager` field. Cloudflare installs monorepo dependencies using the root lockfile. Build watch paths should include the app, `packages/design-system/**`, `scripts/cloudflare*`, `bun.lock`, and the root `package.json`.

## Doppler

Each app has a `doppler.yaml` pointing at its development config. Run `doppler login` once, then `doppler setup --no-interactive` inside each app directory. Normal `bun run dev` commands now invoke `doppler run` inside each app, so the root command also loads each project's settings independently. Affiliate's `bun run dev:convex` uses the same selected Doppler config. Use `doppler setup --config dev_personal` inside an app for personal overrides. The credential-free `dev:agent` stack stays independent of Doppler.

Existing `.env.local` files may still supply optional local-only values, but matching values supplied by Doppler take precedence. Do not use `.dev.vars` files for Doppler-backed affiliate development, because that Cloudflare loading path bypasses process-environment secrets. Restart local dev processes after updating Doppler values. See the root README for the complete local setup.

The website and docs currently have no application secrets, so their Doppler projects are ready for future configuration and need no CI token yet. For affiliate, create read-only service tokens for configs `prd` and `preview`, and save them as encrypted **Cloudflare Build secrets**, not Worker runtime secrets:

- Production build trigger: `DOPPLER_TOKEN_PRODUCTION` reads `waverly-affiliate/prd`.
- Preview build trigger: `DOPPLER_TOKEN_PREVIEW` reads `waverly-affiliate/preview`.

Cloudflare stores build commands and variables separately for the production and preview triggers. Configure and verify both through the [Builds API](https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/). The dashboard currently has a [reported preview-trigger configuration bug](https://github.com/cloudflare/workers-sdk/issues/15349): its visible settings can differ from the preview trigger, and dashboard edits can reset preview variables. After a dashboard edit, recheck the preview command and encrypted token before relying on previews. Never place the production Doppler token on the preview trigger.

Cloudflare Build secrets are available to commands run by their build trigger. Only trusted contributors should push branches to this repository.

Required affiliate values in both deployed configs:

| Name                     | Purpose                                           |
| ------------------------ | ------------------------------------------------- |
| `WORKOS_CLIENT_ID`       | WorkOS client ID                                  |
| `WORKOS_API_KEY`         | Server-only WorkOS API key                        |
| `WORKOS_COOKIE_PASSWORD` | Session encryption secret, at least 32 characters |
| `WORKOS_REDIRECT_URI`    | Registered deployed HTTPS callback URL            |

Production also requires `VITE_CONVEX_URL` and may set `VITE_CONVEX_SITE_URL`. Preview requires `CONVEX_PREVIEW_DEPLOY_KEY`, a **project preview deploy key** generated in the existing Convex project's settings. Store it only in `waverly-affiliate/preview` in Doppler. The existing read-only preview Doppler token can retrieve it; no additional Cloudflare Build token is needed. Never use a production, development, or broad project key here—the helper rejects those key types.

Optional runtime values: `WORKOS_API_HOSTNAME`, `TINYBIRD_API_URL`, and `TINYBIRD_PIPE_READ_TOKEN`.

The production callback is `https://waverly-affiliate.waverly-d46.workers.dev/api/auth/callback` unless a custom domain is configured. For previews, the helper overrides `WORKOS_REDIRECT_URI` with that branch's stable alias callback. Allow `https://*-waverly-affiliate.waverly-d46.workers.dev/api/auth/callback` in WorkOS, which is restricted to this Worker's preview hostnames. Test sign-in using the branch alias URL, not the version-hash URL, so OAuth cookies stay on the same hostname. Preserve existing local callbacks. Do not use the local `.localhost` callback in deployed configs.

The initial `dev`, `prd`, and `preview` configs were seeded with the seven existing local Convex/WorkOS values, excluding test-user credentials. Development preserves the local callback; deployed configs use Workers URLs. Production's existing Convex connection is unchanged. New preview builds ignore any fixed Convex URL or deployment identifier still present in Doppler and use an isolated Convex preview instead. WorkOS remains shared; database isolation does not create a separate WorkOS tenant.

The helper downloads an explicit allowlist from Doppler. Only public Convex values enter the frontend build environment; only server runtime values enter a permission-restricted temporary secrets file. The Convex preview deploy key is passed only to Convex CLI subprocesses, never to Vite or Worker runtime bindings. Wrangler uploads runtime secrets with the code using `--secrets-file`, including for previews, then the helper removes the temporary files. It does not use `wrangler secret bulk`, which could change the active deployment. Test-user passwords and Doppler tokens are never uploaded as Worker runtime secrets.

Updating Doppler values takes effect on the next successful build. Trigger a rebuild after rotating runtime secrets. Wrangler applies secrets additively: deleting a key in Doppler alone does not delete an existing Worker secret. Remove obsolete Worker secrets deliberately through Cloudflare.

After changing Cloudflare Build commands or encrypted Build variables, save the settings and verify a new build. The standalone affiliate build command should be `true`; the deployment helper performs the real build after downloading Doppler configuration. Check the execution log, not only the build summary, to confirm which commands actually ran.

## Isolated Convex previews and seed data

Each affiliate PR branch gets a stable Convex preview name derived from its full branch name, including a hash to avoid normalized-name collisions. Later commits to that branch reuse its backend and data with `convex deploy --preview-name`; the helper never uses destructive `--preview-create`. Since Cloudflare currently builds all non-main branches, branches without a PR also get previews. Reusing the same branch for another PR reuses its Convex preview until it expires.

The deployment order is:

1. Read the preview-only deploy key from Doppler and validate its type.
2. Create or reuse the branch's Convex preview and capture its canonical cloud/site URLs via Convex's `--cmd` environment variables.
3. Deploy that branch's schema/functions and run the internal `previewSeed` mutation.
4. Build the frontend with that preview's URLs, then upload a version to the existing `waverly-affiliate` Worker.

A provisioning, backend deployment, seeding, or URL-validation failure stops the build before a Worker version is uploaded. It never falls back to the shared backend. Production builds do not provision or seed Convex; production backend deployment remains a separate operation.

Configure these **preview-only default environment variables** in the Convex project before its first preview is created:

- `WORKOS_CLIENT_ID`: the same client ID as Doppler's affiliate preview config.
- `WORKOS_API_URL`: `https://api.workos.com` for the current shared WorkOS environment.
- `WAVERLY_PREVIEW_SEED_ENABLED`: `true`. Do not enable this in production.

`apps/affiliate/convex/previewSeed.ts` creates six synthetic product fixtures when the products table is empty. It is an internal mutation, refuses to run without the preview opt-in, and does not replace or append to an existing catalog. Fixture `imageId` values are placeholders, not uploaded images. The current dashboard does not render products yet.

Convex's `--preview-run previewSeed` seeds new deployments. The helper also reruns the idempotent mutation after deployment to recover from an earlier failed seed attempt; existing product IDs and edits are preserved. If the entire products table is emptied, the next successful build seeds it again.

Preview defaults apply when a deployment is created. If an existing preview is missing the opt-in or has outdated WorkOS settings, update that preview's variables explicitly and rebuild; do not reset its data merely to update configuration. Convex automatically expires preview deployments according to the team's plan. Rebuild an expired preview to recreate and seed it; an old Worker preview URL alone does not keep its backend alive. No production data is copied.

## Validation

Run `node --test scripts/cloudflare.test.mjs` to check preview command safety, deploy-key validation, URL isolation, and secret filtering. Run `bun run --cwd apps/affiliate test` for seed schema, opt-in, and repeat-run safety tests. Use a feature branch to confirm all three Cloudflare checks provide preview URLs while each Worker's active production version remains unchanged. On the affiliate preview, verify six synthetic products exist and a second build reuses the same Convex deployment and document IDs.

Sources: [Cloudflare Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [Worker preview URLs](https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/), [Doppler Workers guidance](https://docs.doppler.com/docs/cloudflare-workers), [Convex preview deployments](https://docs.convex.dev/production/multiple-deployments#using-preview-deployments), and [seeding preview data](https://stack.convex.dev/seeding-data-for-preview-deployments).
