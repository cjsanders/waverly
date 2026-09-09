export type WorkspaceSearch = {
  page?: string
  thread?: string
}

export function parseWorkspaceSearch(search: Record<string, unknown>): WorkspaceSearch {
  return {
    page: typeof search.page === 'string' ? search.page : undefined,
    thread: typeof search.thread === 'string' ? search.thread : undefined,
  }
}
