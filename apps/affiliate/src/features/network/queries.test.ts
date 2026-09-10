import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import type { Membership, OrganizationKind } from '../../lib/workspace'
import { loadWorkspaceData, messageThreadsQuery, threadMessagesQuery } from './queries'

function setup(kind: OrganizationKind = 'operator', threads = [{ id: 'first' }, { id: 'second' }]) {
  const queryFn = vi.fn<(context: { queryKey: readonly unknown[] }) => Promise<unknown>>(
    async ({ queryKey }) =>
      queryKey[1] === 'messages:listThreads' ? threads : [{ text: 'Persisted message' }],
  )
  const queryClient = new QueryClient({
    defaultOptions: { queries: { queryFn, retry: false, gcTime: Infinity } },
  })
  const workspace = { organization: { kind } } as Membership
  return { queryFn, context: { queryClient, workspace } }
}

describe('workspace route data', () => {
  it('does not fetch protected data until a workspace and Messages page are selected', async () => {
    const { context, queryFn } = setup()
    await loadWorkspaceData({
      context: { ...context, workspace: null },
      deps: { page: 'Messages' },
    })
    await loadWorkspaceData({ context, deps: { page: 'Overview' } })
    expect(queryFn).not.toHaveBeenCalled()
  })

  it.each([
    ['operator', 'operator'],
    ['brand', 'puroair'],
    ['creator', 'northstar'],
  ] as const)('prefetches %s data into the cache consumed by the view', async (kind, identity) => {
    const { context, queryFn } = setup(kind)
    await loadWorkspaceData({ context, deps: { page: 'Messages', thread: 'second' } })
    expect(context.queryClient.getQueryData(messageThreadsQuery(identity).queryKey)).toEqual([
      { id: 'first' },
      { id: 'second' },
    ])
    expect(
      context.queryClient.getQueryData(threadMessagesQuery(identity, 'second').queryKey),
    ).toEqual([{ text: 'Persisted message' }])
    // Other conversations wait for hover intent in the inbox, so first render stays small.
    expect(
      context.queryClient.getQueryData(threadMessagesQuery(identity, 'first').queryKey),
    ).toBeUndefined()
    // Navigating after intent prefetch consumes the cache instead of requesting the data again.
    await loadWorkspaceData({ context, deps: { page: 'Messages', thread: 'second' } })
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('falls back to the first accessible thread for an unknown deep link', async () => {
    const { context } = setup()
    await loadWorkspaceData({ context, deps: { page: 'Messages', thread: 'inaccessible' } })
    expect(
      context.queryClient.getQueryData(threadMessagesQuery('operator', 'first').queryKey),
    ).toBeDefined()
    expect(
      context.queryClient.getQueryData(threadMessagesQuery('operator', 'inaccessible').queryKey),
    ).toBeUndefined()
  })

  it('does not request messages when the inbox is empty', async () => {
    const { context, queryFn } = setup('operator', [])
    await loadWorkspaceData({ context, deps: { page: 'Messages' } })
    expect(queryFn).toHaveBeenCalledTimes(1)
  })
})
