import type { OrganizationKind } from '#/lib/workspace'
import { availablePages, workflowSteps } from './navigation'

export function workspaceSessionKey(tenantId: string) {
  return `waverly-network.workspace-session.${tenantId}.v1`
}

export interface WorkspaceSessionState {
  kind: OrganizationKind
  currentPage: string
  activeStep: number
}

export function readWorkspaceSession(
  kind: OrganizationKind,
  tenantId: string,
): WorkspaceSessionState | null {
  try {
    const stored = window.sessionStorage.getItem(workspaceSessionKey(tenantId))
    if (!stored) return null
    const parsed = JSON.parse(stored) as Partial<WorkspaceSessionState>
    if (parsed.kind !== kind) return null
    const currentPage =
      typeof parsed.currentPage === 'string' && availablePages(kind).has(parsed.currentPage)
        ? parsed.currentPage
        : 'Overview'
    const activeStep =
      typeof parsed.activeStep === 'number' && Number.isInteger(parsed.activeStep)
        ? Math.min(Math.max(parsed.activeStep, 0), workflowSteps.length - 1)
        : 0
    return { kind, currentPage, activeStep }
  } catch {
    return null
  }
}
