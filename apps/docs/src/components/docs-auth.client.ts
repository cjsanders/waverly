import { mount } from '@cloudflare/nimbus-docs/client'

type SessionResponse = { user: { id: string; email: string } | null }

function initAuth(root: HTMLElement): () => void {
  const controller = new AbortController()

  void (async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'same-origin',
        signal: controller.signal,
      })
      if (!response.ok) return
      const data = (await response.json()) as SessionResponse
      const signedIn = Boolean(data.user)
      root.dataset.signedIn = signedIn ? 'true' : 'false'
      for (const el of root.querySelectorAll<HTMLElement>('[data-docs-when="signed-in"]')) {
        el.hidden = !signedIn
      }
      for (const el of root.querySelectorAll<HTMLElement>('[data-docs-when="signed-out"]')) {
        el.hidden = signedIn
      }
    } catch {
      // Keep the signed-out markup when the session endpoint is unavailable.
    }
  })()

  return () => controller.abort()
}

mount('[data-docs-auth]', initAuth)
