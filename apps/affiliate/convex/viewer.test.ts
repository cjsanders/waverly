import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'

import { api } from './_generated/api'
import schema from './schema'
import { modules } from './test.setup'

describe('viewer.get', () => {
  it('returns null without a session', async () => {
    const t = convexTest(schema, modules)

    await expect(t.query(api.viewer.get, {})).resolves.toBeNull()
  })

  it('reports the organization and role from the WorkOS token', async () => {
    const t = convexTest(schema, modules)
    const asAlice = t.withIdentity({
      subject: 'user_alice',
      org_id: 'org_brand',
      role: 'admin',
    })

    await expect(asAlice.query(api.viewer.get, {})).resolves.toEqual({
      subject: 'user_alice',
      organizationId: 'org_brand',
      role: 'admin',
    })
  })

  it('leaves the organization empty for a session with no membership', async () => {
    const t = convexTest(schema, modules)
    const asGuest = t.withIdentity({ subject: 'user_guest' })

    await expect(asGuest.query(api.viewer.get, {})).resolves.toEqual({
      subject: 'user_guest',
      organizationId: null,
      role: null,
    })
  })
})
