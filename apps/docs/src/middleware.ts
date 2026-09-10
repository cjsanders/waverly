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
  // Production gating is the Cloudflare worker. `astro dev` always serves
  // Internal pages so local and agent workflows do not depend on WorkOS.
  if (!import.meta.env.DEV) return next()

  return handleDocsRequest(context.request, envFromProcess(), next, { bypassAuth: true })
})
