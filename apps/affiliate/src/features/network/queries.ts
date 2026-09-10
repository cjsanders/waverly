import { convexQuery } from '@convex-dev/react-query'
import type { QueryClient } from '@tanstack/react-query'

import { api } from '../../../convex/_generated/api'
import type { Membership, OrganizationKind } from '../../lib/workspace'
import type { NetworkIdentity } from './types'
import type { WorkspaceSearch } from './workspace-search'

export function workspaceIdentity(kind: OrganizationKind): NetworkIdentity {
  return kind === 'operator' ? 'operator' : kind === 'brand' ? 'puroair' : 'northstar'
}

export const messageThreadsQuery = (identity: NetworkIdentity) =>
  convexQuery(api.messages.listThreads, { identityKey: identity })

export const threadMessagesQuery = (identity: NetworkIdentity, threadKey: string | null) =>
  convexQuery(api.messages.listMessages, threadKey ? { identityKey: identity, threadKey } : 'skip')

/** Runs on SSR, navigation, and link intent; uses the same keys as the live message view. */
export async function loadWorkspaceData({
  context,
  deps,
}: {
  context: { queryClient: QueryClient; workspace: Membership | null }
  deps: WorkspaceSearch
}) {
  // A session without an organization must finish workspace selection before querying messages.
  if (!context.workspace || deps.page !== 'Messages') return

  const identity = workspaceIdentity(context.workspace.organization.kind)
  const threads = await context.queryClient.ensureQueryData(messageThreadsQuery(identity))
  // Only the conversation that renders on arrival is fetched here. The inbox warms the others
  // as they are hovered or focused, so large inboxes do not slow the first render.
  const thread = threads.find((item) => item.id === deps.thread) ?? threads[0]
  if (thread) {
    await context.queryClient.ensureQueryData(threadMessagesQuery(identity, thread.id))
  }
}
