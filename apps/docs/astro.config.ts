import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import nimbus, { defineConfig as defineNimbusConfig } from '@cloudflare/nimbus-docs'
import { tableScroll } from '@cloudflare/nimbus-docs/markdown'

const nimbusConfig = defineNimbusConfig({
  // CHANGE_ME: your site's canonical origin (no trailing slash). Drives
  // canonical URLs, absolute OG image URLs, robots.txt, sitemap, and the
  // links in /llms.txt — leaving the placeholder breaks all of them.
  site: 'https://docs.waverly.com',
  // CHANGE_ME: your project's name — used for <title>, the home H1, and OG.
  title: 'Waverly Docs',
  // CHANGE_ME: a one-line description of your docs — used for meta + OG.
  description: 'Guides for Waverly creators and sellers.',
  locale: 'en',
  github: null,
  homeLabel: 'Docs',
  socialImageAlt: 'Waverly documentation preview',
  sidebar: {
    scope: 'section',
    indexDisplay: 'overview-leaf',
    overviewLabel: true,
    items: [
      {
        label: 'Creators',
        icon: 'ph:user-circle',
        autogenerate: { directory: 'creators' },
      },
      {
        label: 'Sellers',
        icon: 'ph:storefront',
        autogenerate: { directory: 'sellers' },
      },
      {
        label: 'Internal',
        icon: 'ph:lock-simple',
        autogenerate: { directory: 'internal' },
      },
    ],
  },
})

export default defineConfig({
  // nimbus:adapter
  output: 'static',
  // Tailwind v4 via its Vite plugin (the integration Astro recommends for
  // Tailwind v4 — replaces the PostCSS plugin, which doesn't build under
  // Astro 7's Vite 8 bundler).
  vite: {
    plugins: [tailwindcss()],
  },
  // Astro-native hover prefetch for in-site docs links (section tabs, sidebar,
  // homepage cards, pagination). `<ClientRouter />` already defaults to
  // `prefetchAll`; this keeps that explicit and uses hover (not viewport/load)
  // so hidden Internal/auth links are not fetched until they can be hovered.
  // `@cloudflare/nimbus-docs` does not add a second prefetch layer. Opt out
  // per link with `data-astro-prefetch="false"` (auth routes, downloads).
  // External URLs are skipped by Astro.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  integrations: [
    nimbus(nimbusConfig, {
      // Authoring rules are opt-in by design — your repo, your taste. The
      // two below are the load-bearing pair: frontmatter has to validate
      // against the content schema for the page to render properly, and
      // broken internal links are 404s for your readers. Add the others
      // (heading hierarchy, code-block language, style, etc.) when you're
      // ready to enforce them — see `nimbus-docs lint --help`.
      rules: {
        'nimbus/frontmatter-shape': 'error',
        'nimbus/internal-link': 'error',
      },
      sitemap: {
        serialize(item) {
          if (new URL(item.url).pathname.startsWith('/internal')) return undefined
          return item
        },
      },
      // Wrap wide tables so they scroll instead of overflowing the page
      // (styled by `.nb-table-scroll` in src/styles/prose.css).
      markdown: {
        hastPlugins: [tableScroll()],
      },
    }),
  ],
  redirects: {
    '/getting-started': '/internal',
    '/workspaces': '/internal/workspaces',
    '/onboarding': '/internal/onboarding',
    '/workos': '/internal/workos',
    '/ssr-and-prefetching': '/internal/ssr-and-prefetching',
    '/agent-login': '/internal/agent-login',
  },
})
