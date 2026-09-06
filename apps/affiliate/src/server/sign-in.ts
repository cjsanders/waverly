/**
 * Keep emulated sign-in on the application's origin. Browsers outside a cloud
 * agent cannot follow a redirect to the emulator's loopback address.
 */
export function getEmulatedSignInRedirect(
  request: Request,
  returnPathname: string | null,
): Response | null {
  if (!import.meta.env.DEV || process.env.WORKOS_EMULATE !== 'true') return null

  const testLoginUrl = new URL('/api/auth/test-login', request.url)
  if (returnPathname !== null) {
    testLoginUrl.searchParams.set('returnPathname', returnPathname)
  }

  return new Response(null, {
    status: 307,
    headers: { Location: `${testLoginUrl.pathname}${testLoginUrl.search}` },
  })
}
