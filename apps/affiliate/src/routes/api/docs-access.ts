import { createFileRoute } from '@tanstack/react-router'

import { handleDocsAccessGet, handleDocsAccessRedeem } from '#/server/docs-access'

export const Route = createFileRoute('/api/docs-access')({
  server: {
    handlers: {
      GET: async ({ request }) => handleDocsAccessGet(request),
      POST: async ({ request }) => handleDocsAccessRedeem(request),
    },
  },
})
