import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

/**
 * What a workspace is for. The kind lives on the WorkOS organization as `metadata.kind` and is
 * mirrored here; it decides which mode of the app (creator, brand, operator) the workspace opens in.
 */
export const organizationKind = v.union(
  v.literal('creator'),
  v.literal('brand'),
  v.literal('operator'),
)

export default defineSchema({
  products: defineTable({
    title: v.string(),
    imageId: v.string(),
    price: v.number(),
  }),

  /** One row per WorkOS user, mirrored on sign-in. */
  users: defineTable({
    workosUserId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
  }).index('by_workos_user_id', ['workosUserId']),

  /** One row per WorkOS organization, mirrored when any member signs in. */
  organizations: defineTable({
    workosOrganizationId: v.string(),
    name: v.string(),
    kind: organizationKind,
  }).index('by_workos_organization_id', ['workosOrganizationId']),

  /** Mirrors WorkOS organization memberships. `role` is the WorkOS role slug. */
  memberships: defineTable({
    userId: v.id('users'),
    organizationId: v.id('organizations'),
    role: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_organization', ['organizationId'])
    .index('by_user_organization', ['userId', 'organizationId']),
})
