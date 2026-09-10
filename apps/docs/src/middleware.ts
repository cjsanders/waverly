import { defineMiddleware } from 'astro:middleware'

import { handleDocsRequest, type DocsAuthEnv } from './lib/docs-auth'

function envFromProcess(): DocsAuthEnv {
  return {
    WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID,
    WORKOS_API_KEY: process.env.WORKOS_API_KEY,
    WORKOS_COOKIE_PASSWORD: process.env.WORKOS_COOKIE_PASSWORD,
    WORKOS_API_HOSTNAME: process.env.WORKOS_API_HOSTNAME,
    DOCS_AUTH_BYPASS: process.env.DOCS_AUTH_BYPASS,
  }
}

export const onRequest = defineMiddleware((context, next) => {
  // Static HTML must be emitted during `astro build`. Production gating is
  // the Cloudflare worker (`src/worker.ts`), not this middleware.
  if (context.isPrerendered) return next()

  const env = envFromProcess()
  const bypassAuth = import.meta.env.DEV && !env.WORKOS_CLIENT_ID
  return handleDocsRequest(context.request, env, next, { bypassAuth })
})
