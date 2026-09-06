const clientId = process.env.WORKOS_CLIENT_ID
const apiUrl = (process.env.WORKOS_API_URL ?? 'https://api.workos.com').replace(/\/$/, '')

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
