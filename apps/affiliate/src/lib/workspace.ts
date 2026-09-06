import { useRouteContext } from '@tanstack/react-router'

import type { Doc } from '../../convex/_generated/dataModel'

export type OrganizationKind = Doc<'organizations'>['kind']

export type Membership = Doc<'memberships'> & { organization: Doc<'organizations'> }

export type Viewer = { user: Doc<'users'>; memberships: Membership[] }

export const organizationKinds = [
  'creator',
  'brand',
  'operator',
] as const satisfies OrganizationKind[]

export const kindLabels: Record<OrganizationKind, string> = {
  creator: 'Creator',
  brand: 'Brand',
  operator: 'Operator',
}

/** Where each mode of the app starts. Every mode route lives under its own prefix. */
export const homePaths = {
  creator: '/creator',
  brand: '/brand',
  operator: '/operator',
} as const satisfies Record<OrganizationKind, string>

export type HomePath = (typeof homePaths)[OrganizationKind]

export function isOrganizationKind(value: unknown): value is OrganizationKind {
  return typeof value === 'string' && (organizationKinds as readonly string[]).includes(value)
}

/** The active workspace, available to every route under the workspace layout. */
export function useWorkspace(): Membership {
  const { workspace } = useRouteContext({ from: '/_app/_workspace' })
  if (!workspace) throw new Error('useWorkspace must be used inside an active workspace')
  return workspace
}
