import { describe, expect, it } from 'vitest'

import {
  handleDocsAccessGet,
  handleDocsAccessRedeem,
  isAllowedDocsReturnUrl,
  signDocsAccessTicket,
  verifyDocsAccessTicket,
} from './docs-access'

const password = 'waverly-docs-cookie-password-32-chars'
const docsReturn =
  'https://cursor-docs-use-case-nav-9b0c-waverly-docs.waverly-d46.workers.dev/internal'

describe('docs return URLs', () => {
  it('allows Waverly docs hosts and rejects others', () => {
    expect(isAllowedDocsReturnUrl(docsReturn)).toBe(true)
    expect(isAllowedDocsReturnUrl('https://docs.waverly.com/internal')).toBe(true)
    expect(isAllowedDocsReturnUrl('https://evil.example/internal')).toBe(false)
    expect(
      isAllowedDocsReturnUrl('https://waverly-affiliate.waverly-d46.workers.dev/internal'),
    ).toBe(false)
  })
})

describe('docs access tickets', () => {
  it('round-trips a valid operator ticket', () => {
    const ticket = signDocsAccessTicket(
      {
        id: 'user_1',
        email: 'ops@waverly.com',
        iss: 'https://affiliate.example',
        aud: 'https://docs.example',
        exp: Date.now() + 60_000,
        kind: 'operator',
      },
      password,
    )
    expect(verifyDocsAccessTicket(ticket, password)?.email).toBe('ops@waverly.com')
    expect(verifyDocsAccessTicket(ticket, 'different-password-that-is-32-chars!!')).toBeNull()
  })
})

describe('handleDocsAccessGet', () => {
  it('sends anonymous operators through affiliate sign-in', async () => {
    const response = await handleDocsAccessGet(
      new Request(
        `https://preview-affiliate.example/api/docs-access?return=${encodeURIComponent(docsReturn)}`,
      ),
      { getAuth: async () => ({ user: null }) },
    )
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toContain('/api/auth/sign-in?returnPathname=')
  })

  it('issues a ticket for an operator and returns to docs', async () => {
    const response = await handleDocsAccessGet(
      new Request(
        `https://branch-cursor-docs-use-case-nav-9b0c-b55dcb4e-waverly-affiliate.waverly-d46.workers.dev/api/docs-access?return=${encodeURIComponent(docsReturn)}`,
      ),
      {
        getAuth: async () => ({ user: { id: 'user_1', email: 'ops@waverly.com' } }),
        listMemberships: async () => [
          {
            role: 'owner',
            organization: {
              workosOrganizationId: 'org_operator',
              name: 'Waverly',
              kind: 'operator' as const,
            },
          },
        ],
        password,
        now: () => 1_700_000_000_000,
      },
    )
    expect(response.status).toBe(302)
    const location = new URL(response.headers.get('Location') ?? '')
    expect(location.origin).toBe(
      'https://cursor-docs-use-case-nav-9b0c-waverly-docs.waverly-d46.workers.dev',
    )
    expect(location.pathname).toBe('/api/auth/operator')
    expect(location.searchParams.get('returnPathname')).toBe('/internal')
    expect(location.searchParams.get('ticket')).toBeTruthy()
  })

  it('rejects creators', async () => {
    const response = await handleDocsAccessGet(
      new Request(
        `https://preview-affiliate.example/api/docs-access?return=${encodeURIComponent(docsReturn)}`,
      ),
      {
        getAuth: async () => ({ user: { id: 'user_2', email: 'creator@waverly.com' } }),
        listMemberships: async () => [
          {
            role: 'owner',
            organization: {
              workosOrganizationId: 'org_creator',
              name: 'Studio',
              kind: 'creator' as const,
            },
          },
        ],
        password,
      },
    )
    expect(response.status).toBe(403)
  })
})

describe('handleDocsAccessRedeem', () => {
  it('returns the operator user for a valid ticket', async () => {
    const iss =
      'https://branch-cursor-docs-use-case-nav-9b0c-b55dcb4e-waverly-affiliate.waverly-d46.workers.dev'
    const ticket = signDocsAccessTicket(
      {
        id: 'user_1',
        email: 'ops@waverly.com',
        iss,
        aud: 'https://docs.waverly.com',
        exp: Date.now() + 60_000,
        kind: 'operator',
      },
      password,
    )
    const response = await handleDocsAccessRedeem(
      new Request(`${iss}/api/docs-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket }),
      }),
      { password },
    )
    expect(await response.json()).toEqual({ user: { id: 'user_1', email: 'ops@waverly.com' } })
  })
})
