import type { Auth } from 'convex/server'

export type TenantScopedDocument = { tenantId?: string }

/** Require a verified WorkOS organization session before accessing network data. */
export async function requireNetworkSession(ctx: { auth: Auth }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Sign in to access this workspace.')
  const tenantId = identity.org_id
  if (typeof tenantId !== 'string' || tenantId.length === 0) {
    throw new Error('Select an organization to access this workspace.')
  }
  return { ...identity, tenantId }
}

/** Hide both missing and cross-tenant records behind the same not-found response. */
export function requireTenantDocument<T extends TenantScopedDocument>(
  document: T | null,
  tenantId: string,
  message = 'Record not found.',
): T {
  if (!document || document.tenantId !== tenantId) throw new Error(message)
  return document
}

/**
 * Global reference data such as `marketplaces` has no tenant (ADR 0002). Callers still need a
 * network session; this helper only makes the exemption visible at the call site instead of
 * leaving it implied by an undefined `tenantId`.
 */
export function requireGlobalDocument<T>(document: T | null, message = 'Record not found.'): T {
  if (!document) throw new Error(message)
  return document
}
