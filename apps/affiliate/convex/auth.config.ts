const clientId = process.env.WORKOS_CLIENT_ID

/**
 * Base URL of the WorkOS API that mints and signs access tokens. Production leaves it unset;
 * the end-to-end suite points it at a local WorkOS emulator so the issuer and JWKS resolve there.
 */
const apiUrl = (process.env.WORKOS_API_URL ?? 'https://api.workos.com').replace(/\/+$/, '')

export default {
  providers: [
    {
      type: 'customJwt' as const,
      issuer: `${apiUrl}/`,
      algorithm: 'RS256' as const,
      jwks: `${apiUrl}/sso/jwks/${clientId}`,
      applicationID: clientId,
    },
    {
      type: 'customJwt' as const,
      issuer: `${apiUrl}/user_management/${clientId}`,
      algorithm: 'RS256' as const,
      jwks: `${apiUrl}/sso/jwks/${clientId}`,
    },
  ],
}
