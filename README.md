# Waverly

Bun and Turborepo monorepo for the Waverly affiliate network.

## Apps

- `apps/affiliate` — TanStack Start, Convex, WorkOS AuthKit, TanStack Charts, Tailwind CSS, and shadcn/ui
- `apps/website` — Astro marketing site
- `apps/docs` — Nimbus documentation site
- `apps/e2e` — Stagehand browser tests run by Vitest

## Packages

- `packages/design-system` — `@waverly/design-system`: Waverly tokens, Tailwind v4 theme, self-hosted fonts, brand assets, and shadcn/ui component overrides shared by every app. See its README for usage.

All three web apps are configured for Cloudflare Workers. The website and docs apps deploy as static Worker assets; the affiliate app runs through the Cloudflare Vite plugin. Oxfmt formats supported repository files, with Prettier handling Astro files that Oxfmt does not yet support. Nimbus's generated `DocsLayout.astro` is excluded because the Astro plugin cannot parse its inline restoration script.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the three-Worker GitHub deployment setup, shared-Worker previews, and Doppler configuration.

## Setup

```sh
bun install
cp apps/affiliate/.env.example apps/affiliate/.env.local
bun run dev
```

Fill in the affiliate app's Convex and WorkOS values before starting it. Create the Convex development deployment from `apps/affiliate` with `bunx convex dev`.

`bun install` also installs the Lefthook Git hooks. Commits fix and restage files with Oxlint, Oxfmt, and Prettier for Astro files. Pushes run typechecking and unit tests. Run a hook manually with `bunx lefthook run pre-commit` or temporarily bypass hooks with `LEFTHOOK=0 git commit`.

### Local URLs

Each `dev` script is wrapped in [portless](https://github.com/vercel-labs/portless), which gives every app a stable HTTPS URL instead of a port number:

| App       | URL                                   |
| --------- | ------------------------------------- |
| affiliate | `https://affiliate.waverly.localhost` |
| website   | `https://website.waverly.localhost`   |
| docs      | `https://docs.waverly.localhost`      |

The `.waverly` segment keeps these names from colliding with other projects on the same machine. Portless assigns each server a random port through `PORT`, so the dev scripts do not pin ports. On first run it generates a local certificate authority and adds it to the system trust store, which may prompt for your password; `bunx portless doctor` diagnoses proxy or certificate problems. Safari needs `bunx portless hosts sync` once.

The affiliate callback URL in `.env.local` is `https://affiliate.waverly.localhost/api/auth/callback`. Register that URL, and the matching `/api/auth/sign-in` URL, in the WorkOS development environment.

Astro backgrounds `astro dev` when it detects a coding agent, which makes portless drop the route as soon as the wrapper exits. Agents should set `ASTRO_DEV_BACKGROUND=1` when starting the website or docs servers so Astro stays in the foreground:

```sh
ASTRO_DEV_BACKGROUND=1 bun run dev
```

### Agent login (screenshots and screencasts)

Cloud agents can run an isolated local WorkOS and Convex stack without credentials:

```sh
bun run setup:agent
bun run dev:agent
```

`setup:agent` creates the ignored local state and performs a one-shot Convex sync. `dev:agent` supervises WorkOS Emulate, Convex, and the affiliate app at `http://localhost:5173` (or `$PORT`). It is suitable for Cursor Cloud Agents and other Linux cloud-agent environments. It refuses to start when dotenv or Wrangler variable files would select a shared backend or override the isolated emulator settings.

Other local tools can instead sign in against a real WorkOS Email + Password user without driving the hosted AuthKit UI. Set these secrets (never commit the values):

```sh
TEST_USER_EMAIL=
TEST_USER_PASSWORD=
```

In `.env.local`, copy them from `apps/affiliate/.env.example`. The user must exist in the WorkOS development environment with Email + Password enabled. Cloud agents use the deterministic user seeded in `apps/affiliate/workos-emulate.config.yaml` instead.

The normal “Sign in with WorkOS” action automatically uses the seeded account in the agent stack, without sending the browser to the emulator's loopback address. Agents can also open `/api/auth/test-login` directly (optional `?returnPathname=/dashboard`). That route is **dev-only**; production builds return 404. See `.cursor/skills/nimbus-docs-sync/SKILL.md` for the screenshot workflow.

### Amp orb portal

Amp uses the same agent setup through `.agents/setup`, while `.amp/services.yaml` gives its native supervisor ownership of the long-running processes. Local state is stored under the ignored `apps/affiliate/.convex/` and `apps/affiliate/.workos-emulate/` directories. A small front proxy routes browser Convex traffic through the affiliate origin and leaves Vite/Cloudflare ownership of its own WebSockets, so a forwarded browser never needs access to the agent's loopback address.

In an Amp orb, start the declared services with:

```sh
amp orb services ensure
```

Use the exact affiliate portal URL printed by that command; do not save or construct it. Amp injects the current URL as `PUBLIC_URL`, and the service uses it for the callback URL. The Amp service starts the agent front proxy directly and does not use portless, so the local `.waverly.localhost` URLs do not apply inside an orb.

For E2E tests, set `E2E_BASE_URL` at runtime to either the current portal URL or a Cloudflare preview URL. Browserbase runs outside the orb, so a private portal also requires a freshly minted one-use login URL in `E2E_PORTAL_LOGIN_URL`. Do not save that login URL as an Amp variable. Cloudflare preview runs do not need `E2E_PORTAL_LOGIN_URL`.

## Commands

```sh
bun run dev          # run all development servers
bun run build        # build every app
bun run check        # lint, formatting, types, and unit tests
bun run test:e2e     # Stagehand smoke test (requires BROWSERBASE_API_KEY and E2E_BASE_URL)
```

Deploy an individual app only after authenticating Wrangler:

```sh
bun run --cwd apps/affiliate deploy
bun run --cwd apps/website deploy
bun run --cwd apps/docs deploy
```

Cloudflare and Convex are separate deployments. Deploy Convex functions from `apps/affiliate` before deploying an affiliate build that depends on schema changes.
