import { mount } from '@cloudflare/nimbus-docs/client'

import {
  shouldAttemptSilentOperatorSso,
  shouldShowDocsAuthWhen,
  type DocsSessionJson,
} from '@/lib/docs-auth'

const SILENT_SSO_PROBE_KEY = 'wos-docs-sso-probe-at'
const SILENT_SSO_OPT_OUT_KEY = 'wos-docs-sso-opt-out'

function readProbedAt(): number | null {
  try {
    const raw = sessionStorage.getItem(SILENT_SSO_PROBE_KEY)
    if (!raw) return null
    const value = Number(raw)
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

function markProbed(): void {
  try {
    sessionStorage.setItem(SILENT_SSO_PROBE_KEY, String(Date.now()))
  } catch {
    // Private mode can throw; skip the probe rather than looping.
  }
}

function isSsoOptedOut(): boolean {
  try {
    return sessionStorage.getItem(SILENT_SSO_OPT_OUT_KEY) === '1'
  } catch {
    return false
  }
}

function optOutSilentSso(): void {
  try {
    sessionStorage.setItem(SILENT_SSO_OPT_OUT_KEY, '1')
  } catch {
    // Ignore storage failures; the docs session cookie is still cleared.
  }
}

function currentReturnPath(): string {
  return `${location.pathname}${location.search}` || '/'
}

function initAuth(root: HTMLElement): () => void {
  const controller = new AbortController()

  for (const el of root.querySelectorAll('[data-docs-opt-out-sso]')) {
    el.addEventListener('click', optOutSilentSso, { signal: controller.signal })
  }

  void (async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'same-origin',
        signal: controller.signal,
      })
      if (!response.ok) return
      const data = (await response.json()) as DocsSessionJson
      if (
        shouldAttemptSilentOperatorSso(data, {
          pathname: location.pathname,
          probedAt: readProbedAt(),
          optedOut: isSsoOptedOut(),
        })
      ) {
        markProbed()
        const dest = new URL('/api/auth/sign-in', location.origin)
        dest.searchParams.set('returnPathname', currentReturnPath())
        dest.searchParams.set('silent', '1')
        location.replace(`${dest.pathname}${dest.search}`)
        return
      }
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
