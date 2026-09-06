import { availablePages, demoSteps, isDemoIdentity } from './navigation'
import type { DemoIdentity } from './types'
export const demoSessionKey = 'waverly-network.demo-session.v1'

export interface DemoSessionState {
  identity: DemoIdentity
  currentPage: string
  activeStep: number
}

export function readDemoSession(): DemoSessionState | null {
  try {
    const stored = window.sessionStorage.getItem(demoSessionKey)
    if (!stored) return null
    const parsed = JSON.parse(stored) as Partial<DemoSessionState>
    if (!isDemoIdentity(parsed.identity)) return null
    const currentPage =
      typeof parsed.currentPage === 'string' &&
      availablePages(parsed.identity).has(parsed.currentPage)
        ? parsed.currentPage
        : 'Overview'
    const activeStep =
      typeof parsed.activeStep === 'number' && Number.isInteger(parsed.activeStep)
        ? Math.min(Math.max(parsed.activeStep, 0), demoSteps.length - 1)
        : 0
    return { identity: parsed.identity, currentPage, activeStep }
  } catch {
    return null
  }
}
