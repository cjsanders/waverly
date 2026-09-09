import { redirect } from '@tanstack/react-router'

import { homePaths, type Membership, type OrganizationKind } from './workspace'

/**
 * Mode routes only render for a workspace of their kind. A workspace of another kind is sent to
 * its own home; a missing workspace is left to the workspace layout, which selects one.
 */
export function redirectUnlessKind(workspace: Membership | null, kind: OrganizationKind) {
  if (workspace && workspace.organization.kind !== kind) {
    throw redirect({ to: homePaths[workspace.organization.kind] })
  }
}
