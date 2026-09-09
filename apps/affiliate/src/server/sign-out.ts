import { getAuthKitContext, getAuthkit } from '@workos/authkit-tanstack-react-start'

export async function handleSignOut(request: Request): Promise<Response> {
  const returnTo = sanitizeSignOutReturnPath(new URL(request.url).searchParams.get('returnTo'))
  const auth = getAuthKitContext().auth()

  if (!auth.user) return redirectTo(returnTo)

  const authkit = await getAuthkit()
  const emulated = import.meta.env.DEV && process.env.WORKOS_EMULATE === 'true'
  const { logoutUrl } = await authkit.signOut(auth.sessionId, {
    // Emulate validates redirect hosts even though its loopback logout page is
    // never opened. The app performs the final same-origin redirect below.
    returnTo: emulated ? 'http://localhost/' : returnTo,
  })

  return redirectTo(emulated ? returnTo : logoutUrl)
}

export function sanitizeSignOutReturnPath(value: string | null | undefined): string {
  if (!value?.startsWith('/') || value.startsWith('//')) return '/'

  try {
    const url = new URL(value, 'http://localhost')
    if (url.origin !== 'http://localhost' || url.pathname.startsWith('//')) return '/'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/'
  }
}

function redirectTo(location: string): Response {
  return new Response(null, { status: 307, headers: { Location: location } })
}
