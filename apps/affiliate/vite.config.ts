import { defineConfig, loadEnv, type Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

/**
 * Portless terminates TLS and proxies to Vite over HTTP/1.1. For HTTP/2 client
 * requests some proxy versions drop the Host header, so Vite (and the Cloudflare
 * plugin, which builds `request.url` from Host) sees `127.0.0.1:<port>` instead
 * of `affiliate.waverly.localhost`. Restore Host from X-Forwarded-Host so
 * origin-based redirects, like the AuthKit callback, point at the public URL.
 */
function trustForwardedHost(): Plugin {
  return {
    name: 'waverly:trust-forwarded-host',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const forwarded = req.headers['x-forwarded-host']
        const host = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim()

        if (host) {
          req.headers.host = host
          // The Cloudflare plugin reads `rawHeaders`, not the parsed `headers`.
          const index = req.rawHeaders.findIndex(
            (h, i) => i % 2 === 0 && h.toLowerCase() === 'host',
          )
          if (index === -1) req.rawHeaders.push('Host', host)
          else req.rawHeaders[index + 1] = host
        }

        next()
      })
    },
  }
}

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  if (!env.VITE_CONVEX_URL) {
    throw new Error('VITE_CONVEX_URL must be set before building or starting the affiliate app')
  }

  return {
    resolve: { tsconfigPaths: true },
    server: {
      allowedHosts: process.env.AMP_ORB ? true : undefined,
    },
    plugins: [
      trustForwardedHost(),
      devtools(),
      cloudflare({ viteEnvironment: { name: 'ssr' } }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
  }
})

export default config
