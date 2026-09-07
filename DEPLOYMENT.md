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

For affiliate, leave the build command empty. The deployment helper fetches Doppler configuration before building:

- Deploy: `node ../../scripts/cloudflare.mjs affiliate deploy`
- Non-production deploy: `node ../../scripts/cloudflare.mjs affiliate preview`

The helper uses the Worker name in its Wrangler config, blocks production deployment from a non-main Cloudflare build, and creates a stable branch alias for previews. The account's Workers subdomain is `waverly-d46.workers.dev`.

The Bun version comes from the repository's `packageManager` field. Cloudflare installs monorepo dependencies using the root lockfile. Build watch paths should include the app, `packages/design-system/**`, `scripts/cloudflare*`, `bun.lock`, and the root `package.json`.

## Doppler

Each app has a `doppler.yaml` pointing at its development config. Run `doppler login` once, then `doppler setup` inside the app directory. For affiliate local development, run `doppler run -- bun run dev`.

The website and docs currently have no application secrets, so their Doppler projects are ready for future configuration and need no CI token yet. For affiliate, create read-only service tokens for configs `prd` and `preview`, and save them as encrypted **Cloudflare Build secrets**, not Worker runtime secrets:

- `DOPPLER_TOKEN_PRODUCTION`: reads `waverly-affiliate/prd`
- `DOPPLER_TOKEN_PREVIEW`: reads `waverly-affiliate/preview`

Cloudflare Build secrets are available to build commands on connected branches. Only trusted contributors should push branches to this repository.

Required affiliate values in both deployed configs:

| Name                     | Purpose                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `VITE_CONVEX_URL`        | HTTPS Convex deployment URL embedded in the browser bundle |
| `WORKOS_CLIENT_ID`       | WorkOS client ID                                           |
| `WORKOS_API_KEY`         | Server-only WorkOS API key                                 |
| `WORKOS_COOKIE_PASSWORD` | Session encryption secret, at least 32 characters          |
| `WORKOS_REDIRECT_URI`    | Registered deployed HTTPS callback URL                     |

Optional values: `VITE_CONVEX_SITE_URL`, `WORKOS_API_HOSTNAME`, `TINYBIRD_API_URL`, and `TINYBIRD_PIPE_READ_TOKEN`.

The production callback is `https://waverly-affiliate.waverly-d46.workers.dev/api/auth/callback` unless a custom domain is configured. For previews, the helper overrides `WORKOS_REDIRECT_URI` with that branch's stable alias callback. Allow `https://*-waverly-affiliate.waverly-d46.workers.dev/api/auth/callback` in WorkOS, which is restricted to this Worker's preview hostnames. Test sign-in using the branch alias URL, not the version-hash URL, so OAuth cookies stay on the same hostname. Preserve existing local callbacks. Do not use the local `.localhost` callback in deployed configs.

The initial `dev`, `prd`, and `preview` configs were seeded with the seven existing local Convex/WorkOS values, excluding test-user credentials. Development preserves the local callback; deployed configs use Workers URLs. These configurations currently share the existing Convex and WorkOS environments, so previews are not isolated from production backend data. Replace the `prd` and `preview` credentials with separate backend environments when isolation is needed.

The helper downloads an explicit allowlist from Doppler. Only public Convex values enter the build environment; only server runtime values enter a permission-restricted temporary secrets file. Wrangler uploads that file with the code using `--secrets-file`, including for previews, then the helper removes the file. It does not use `wrangler secret bulk`, which could change the active deployment. Test-user passwords and Doppler tokens are never uploaded as Worker runtime secrets.

Updating Doppler values takes effect on the next successful build. Trigger a rebuild after rotating runtime secrets. Wrangler applies secrets additively: deleting a key in Doppler alone does not delete an existing Worker secret. Remove obsolete Worker secrets deliberately through Cloudflare.

After changing Cloudflare Build commands or encrypted Build variables, push a new commit to verify the new configuration. Retrying an earlier failed build can reuse that build's previous configuration snapshot. In the fresh affiliate build, confirm the standalone build command is empty and the deployment helper runs with both encrypted Doppler token variables present.

Convex deployments remain separate. Point preview configuration at the intended development backend, and deploy compatible Convex functions before a frontend that depends on them.

## Validation

Run `node --test scripts/cloudflare.test.mjs` to check preview command safety, branch alias validity, and secret filtering. Use a feature branch to confirm all three Cloudflare checks provide preview URLs while each Worker's active production version remains unchanged.

Sources: [Cloudflare Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [preview URLs](https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/), and [Doppler Workers guidance](https://docs.doppler.com/docs/cloudflare-workers).
