import { loadWorkspaceData } from './queries'
import { preloadWorkspaceSurface } from './surfaces'

export async function loadWorkspace(options: Parameters<typeof loadWorkspaceData>[0]) {
  const { context, deps } = options
  if (!context.workspace) return
  // Start the module and Convex requests together, including during link intent preloads.
  await Promise.all([
    preloadWorkspaceSurface(context.workspace.organization.kind, deps.page),
    loadWorkspaceData(options),
  ])
}
