import { mount } from '@cloudflare/nimbus-docs/client'

import { shouldShowDocsAuthWhen, type DocsSessionJson } from '@/lib/docs-auth'

function initAuth(root: HTMLElement): () => void {
  const controller = new AbortController()

  void (async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'same-origin',
        signal: controller.signal,
      })
      if (!response.ok) return
      const data = (await response.json()) as DocsSessionJson
      const signedIn = Boolean(data.user)
      root.dataset.signedIn = signedIn ? 'true' : 'false'
      root.dataset.authEnabled = data.authEnabled ? 'true' : 'false'
      for (const el of root.querySelectorAll<HTMLElement>('[data-docs-when]')) {
        const when = el.dataset.docsWhen
        if (when !== 'signed-in' && when !== 'signed-out' && when !== 'auth-enabled') continue
        el.hidden = !shouldShowDocsAuthWhen(when, data)
      }
    } catch {
      // Keep Team / Sign out hidden when the session endpoint is unavailable.
    }
  })()

  return () => controller.abort()
}

mount('[data-docs-auth]', initAuth)
