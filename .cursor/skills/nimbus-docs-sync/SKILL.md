---
name: nimbus-docs-sync
description: Keep the Nimbus docs app (apps/docs) in sync with product and code changes, including screenshots and screencasts. Use when updating Waverly documentation, writing MDX in apps/docs, capturing product UI media, or running the Cursor automation that follows PRs and merges to main.
---

# Nimbus docs sync

Waverly docs live in `apps/docs` (Astro + `@cloudflare/nimbus-docs`). Product code lives mainly in `apps/affiliate`, `apps/website`, and `packages/design-system`.

Follow `apps/docs/AGENT.md` for site structure, lint, and nimbus CLI. This skill covers **when** to update docs, **how** to add screenshots/screencasts, and **how the Cursor automation should behave** so docs stay current without blocking feature work.

## Goals

- No large gaps between a user-facing code change and the docs that describe it.
- Never slow the feature PR: do not push to it, request changes, assign reviewers, or require docs before merge.
- Prefer a separate `docs:` pull request that can merge on its own after the change is on `main`.

## When docs need an update

Update docs when the change is user-facing or operator-facing, including:

- New or renamed routes, screens, or navigation in `apps/affiliate` or `apps/website`
- Auth, billing, dashboard, or settings behavior
- Public APIs, env vars, or setup steps operators must follow
- User-visible copy, empty states, or workflows that existing pages describe incorrectly

Skip (do nothing, no comment, no PR) when the diff is only:

- Docs themselves (`apps/docs/**`) — avoid automation loops
- Tests, e2e, lint, formatting, lockfiles, CI, generated files
- Refactors with no user-visible behavior change
- Dependabot / Renovate / chore-only PRs
- This automation's own previous `docs:` PR

If existing MDX already describes the change accurately, stop.

## How to write the docs

- Pages: `apps/docs/src/content/docs/<slug>.mdx`. Required frontmatter: `title`. Optional: `description`.
- Do not repeat the page H1 in the body; it comes from `title`.
- Every PascalCase MDX component must be registered in `apps/docs/src/components.ts`.
- Shared snippets go in `apps/docs/src/content/partials/` and are included with `<Render file="slug" />`.
- After edits, from `apps/docs` run `bunx --bun @cloudflare/nimbus-docs check --json` (or `bun run lint:docs`). Fix findings. Do not leave a broken docs build.

## Screenshots and screencasts

Cursor automations **can** capture these. Computer use is on by default for automations. The agent should drive the running app, take screenshots or short recordings, and **commit the files into the docs site** so they deploy with the page.

Walkthrough artifacts attached only to the Cursor run or GitHub PR description are extra evidence. They are **not** a substitute for files in `apps/docs/public/docs/`, because the published docs site cannot depend on those URLs.

### File conventions

| Kind       | Path                                                   | Format                                 |
| ---------- | ------------------------------------------------------ | -------------------------------------- |
| Screenshot | `apps/docs/public/docs/<page>-<step>.png` (or `.webp`) | One screen, cropped to the relevant UI |
| Screencast | `apps/docs/public/docs/<page>-<flow>.webm`             | Short clip of a single flow            |

- Public URL is `/docs/<filename>` (the `public/` prefix is not in the URL).
- Prefer screenshots for static UI; add a screencast only when motion or a multi-step flow matters (sign-in, creating a record, a wizard).
- Keep recordings short (about 10–30s). If a file is larger than ~5MB, put a still screenshot in the page and attach the recording to the docs PR description instead of git.
- Every image needs meaningful `alt` text. Captions explain what the reader should notice, not "screenshot".

### MDX

`Frame` is registered globally. Use it for both images and video:

```mdx
<Frame caption="Affiliate dashboard home" aspect="16/9">
  <img src="/docs/affiliate-dashboard.png" alt="Affiliate dashboard home" />
</Frame>

<Frame caption="Signing in to the affiliate app" aspect="16/9">
  <video src="/docs/affiliate-sign-in.webm" controls playsinline />
</Frame>
```

Do not add `Frame` to a page without registering it (it is already in `src/components.ts`). To reinstall from the nimbus registry: `bunx --bun @cloudflare/nimbus-docs add frame`.

### Capturing media with computer use

1. Start only what you need. Docs: `ASTRO_DEV_BACKGROUND=1 bun run --cwd apps/docs dev`. Affiliate app: Cloud Agent environments run the credential-free local stack with `bun run dev:agent` on `http://localhost:5173` (see `.cursor/environment.json`).
2. For **authenticated** screens, open `http://localhost:5173/api/auth/test-login?returnPathname=/dashboard` in computer use. The dev-only route uses the WorkOS Emulate user prepared by `bun run setup:agent`, sets the AuthKit session cookie, and redirects. A real WorkOS environment instead needs `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` in `apps/affiliate/.env.local`; never print the password. To capture the hosted WorkOS sign-in UI itself, use `/api/auth/sign-in` instead.
3. If the local stack cannot run or the affiliate app cannot sign in, still write accurate prose from the code. Capture whatever UI is reachable (marketing site, docs site, unauthenticated screens). Do **not** block the docs PR on the development environment.
4. Screenshot the actual product UI, not the code editor or terminal.
5. Copy chosen files into `apps/docs/public/docs/` and reference them from MDX as above.
6. Optionally attach the same recordings to the docs PR description so reviewers can watch without checking out.

## Automation behavior (Cursor dashboard)

Create the automation at [cursor.com/automations](https://cursor.com/automations) using `references/automation-prompt.md` in this skill folder. Cloud agents cannot create the automation themselves; a human (or a local `/automate` session) must save it.

### Recommended triggers (all three)

These cover "PR opened", "merged to main", and "commit pushed to main with no PR":

1. **Pull request opened** — GitHub, this repo. Start docs work early. Do not touch the feature branch.
2. **Pull request merged** — GitHub, this repo. Land or refresh the docs PR after the code is on `main`.
3. **Push to branch `main`** — GitHub, this repo. Catches direct commits that never had a PR.

Do **not** also enable **pull request pushed** (too noisy) or **draft opened** (incomplete work).

**Pull request merged** plus **push to main** can both fire for one merge. Treat that as one job: if a `docs:` PR already covers the change, update it or exit.

### Tools

Enable: pull request creation, comment on pull request (comments only — **no** approve / request changes), computer use, memories.

Disable: request reviewers.

### Decision rules

On **every** run:

1. If the triggering PR title starts with `docs:`, or the author is this automation / Cursor, **exit**.
2. If the triggering commit/PR only changes `apps/docs/**`, tests, CI, lockfiles, or formatting, **exit**.
3. Diff the change against `apps/docs/src/content`. Decide whether user-facing docs are missing or wrong.
4. Search open PRs for an existing `docs:` follow-up for this change (title or memory). Reuse it instead of opening a duplicate.

On **pull request opened**:

- Never commit to the feature branch.
- Never request changes, approve, or add reviewers.
- If the feature PR already includes adequate docs, **exit** (no comment).
- If docs are needed, open or update a **separate** branch from `main` with docs-only commits. Open a **draft** PR titled `docs: <short topic> (follow-up for #<feature PR>)`. Body must link the feature PR and say it should merge after the feature lands. Do not request review yet.
- Optional: one short, non-blocking comment on the feature PR with a link to the draft docs PR. No checklist theater, no "please add docs before merge".

On **pull request merged** or **push to main**:

- Re-diff `main`. If docs on `main` already match, close any leftover draft and **exit**.
- Otherwise branch from current `main`, add or finish docs + media, run the nimbus check, and open (or mark ready) a `docs:` PR into `main`.
- Keep the PR docs-only. Do not bundle unrelated refactors.

Memories: store `feature-pr → docs-pr` mappings so later triggers do not duplicate work. Delete mappings after the docs PR merges.

## Quality bar

- Open a docs PR only when a reader would be misled or stuck without the update.
- Match the tone of existing pages: concise, operational, no marketing fluff.
- One topic per page; link instead of duplicating.
- After media + MDX, `nimbus-docs check` must not fail.
