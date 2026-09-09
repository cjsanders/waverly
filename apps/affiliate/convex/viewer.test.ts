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

    await asAlice.mutation(api.viewer.sync, {
      user: { workosUserId: 'user_alice', email: 'alice@waverly.test' },
      memberships: [
        {
          role: 'admin',
          organization: {
            workosOrganizationId: 'org_brand',
            name: 'Acme Brand',
            kind: 'brand',
          },
        },
      ],
    })

    await expect(asAlice.query(api.viewer.get, {})).resolves.toMatchObject({
      organizationId: 'org_brand',
      role: 'admin',
      user: { workosUserId: 'user_alice', email: 'alice@waverly.test' },
      memberships: [
        {
          role: 'admin',
          organization: {
            workosOrganizationId: 'org_brand',
            name: 'Acme Brand',
            kind: 'brand',
          },
        },
      ],
    })
  })

  it('returns null until the signed-in user has been mirrored', async () => {
    const t = convexTest(schema, modules)
    const asGuest = t.withIdentity({ subject: 'user_guest' })

    await expect(asGuest.query(api.viewer.get, {})).resolves.toBeNull()
  })
})
