import { UserMenu } from '#/components/user-menu'
import {
  AppShell,
  Heading,
  Layout,
  LayoutContent,
  LayoutHeader,
  useMediaQuery,
} from '#/features/network/ui/primitives'
import { WorkspaceSwitcher } from '#/components/workspace-switcher'
import { useWorkspace, type OrganizationKind } from '#/lib/workspace'
import { useHydrated } from '#/lib/use-hydrated'
import { useRouteContext } from '@tanstack/react-router'
import { Suspense, useEffect, useRef, useState } from 'react'
import {
  CreatorPortalSurface,
  CreatorWorkspaceSurface,
  DiscoverySurface,
  ReportingSurface,
  SellerPortalSurface,
  MessagesSurface,
  SettingsSurface,
  creatorPortalPages,
} from './surfaces'
import { NetworkBootstrap } from './NetworkBootstrap'
import { availablePages } from './navigation'
import { workspaceIdentity } from './queries'

import type { CreatorPage } from './CreatorPortalSurface'
import type { SellerPage } from './SellerPortalSurface'

import { discoveryPageViews } from './navigation'
import { NetworkNav } from './NetworkNav'
import { Overview, PendingPublisherOverview } from './Overview'
import { getPageHeader } from './page-header'
import { DataSurface } from './RecordsSurface'
import { readWorkspaceSession, workspaceSessionKey } from './session'
import type { NetworkIdentity } from './types'
import type { WorkspaceSearch } from './workspace-search'

type NetworkWorkspaceProps = {
  mode: OrganizationKind
  search: WorkspaceSearch
  onSearchChange: (search: WorkspaceSearch, replace?: boolean) => void
}

export function NetworkWorkspace({ mode, search, onSearchChange }: NetworkWorkspaceProps) {
  const workspace = useWorkspace()
  const tenantId = workspace.organization.workosOrganizationId
  const { viewer } = useRouteContext({ from: '/_app' })
  const mounted = useHydrated()
  const [restored] = useState(() => readWorkspaceSession(mode, tenantId))
  const identity = workspaceIdentity(mode)
  // Browser preferences are applied only after the server markup has hydrated.
  const requestedPage = search.page ?? (mounted ? restored?.currentPage : undefined) ?? 'Overview'
  const currentPage = availablePages(mode).has(requestedPage) ? requestedPage : 'Overview'
  const [savedStep, setActiveStep] = useState(restored?.activeStep ?? 0)
  const activeStep = mounted ? savedStep : 0
  const initialMessageThreadId = search.thread ?? null
  const contentRef = useRef<HTMLDivElement>(null)
  const isCompactHeader = useMediaQuery('(max-width: 700px)')

  const setCurrentPage = (page: string) => onSearchChange({ page })

  useEffect(() => {
    if (!mounted) return
    if (search.page !== currentPage) {
      onSearchChange({ page: currentPage, thread: search.thread }, true)
    }
    try {
      window.sessionStorage.setItem(
        workspaceSessionKey(tenantId),
        JSON.stringify({ kind: mode, currentPage, activeStep }),
      )
    } catch {
      /* Storage may be unavailable; URL navigation still works. */
    }
    contentRef.current?.scrollTo({ top: 0 })
  }, [activeStep, currentPage, mode, mounted, onSearchChange, search.thread, search.page, tenantId])

  const nav = <NetworkNav currentPage={currentPage} onPageChange={setCurrentPage} />
  const handleStepChange = (step: number) => {
    setActiveStep(step)
    setCurrentPage('Overview')
  }

  const pageIdentity: NetworkIdentity =
    mode === 'creator' && creatorPortalPages.has(currentPage)
      ? 'avery'
      : currentPage === 'Getting started'
        ? 'everyday'
        : identity
  const pageHeader = getPageHeader(
    pageIdentity,
    currentPage === 'Getting started' ? 'Overview' : currentPage,
    workspace.organization.name,
  )
  const pagePadding: 4 | 6 = isCompactHeader ? 4 : 6

  return (
    <AppShell sideNav={nav} height="fill" variant="section" contentPadding={0}>
      <NetworkBootstrap />
      <Layout
        height="fill"
        defaultHasDividers
        header={
          <LayoutHeader padding={pagePadding}>
            <div className="waverly-page-header">
              <div className="waverly-page-header-copy">
                <p className="waverly-page-header-eyebrow">{pageHeader.eyebrow}</p>
                <div className="flex flex-wrap items-center gap-2 min-[901px]:hidden">
                  <WorkspaceSwitcher viewer={viewer} workspace={workspace} />
                  <UserMenu />
                </div>
                <Heading level={1}>{pageHeader.title}</Heading>
                <p className="waverly-page-header-description">{pageHeader.description}</p>
              </div>
            </div>
          </LayoutHeader>
        }
        content={
          <LayoutContent
            ref={contentRef}
            padding={currentPage === 'Messages' || currentPage === 'Settings' ? 0 : pagePadding}
          >
            <Suspense
              fallback={
                <output className="block p-6 text-muted-foreground">Loading workspace…</output>
              }
            >
              {mode === 'brand' && !['Messages', 'Settings'].includes(currentPage) ? (
                <SellerPortalSurface page={currentPage as SellerPage} onNavigate={setCurrentPage} />
              ) : mode === 'creator' && creatorPortalPages.has(currentPage) ? (
                <CreatorPortalSurface
                  page={currentPage as CreatorPage}
                  onNavigate={setCurrentPage}
                />
              ) : currentPage === 'Getting started' ? (
                <PendingPublisherOverview
                  activeStep={activeStep}
                  onStepChange={handleStepChange}
                  onNavigate={setCurrentPage}
                />
              ) : currentPage === 'Overview' ? (
                <Overview identity={identity} onNavigate={setCurrentPage} />
              ) : currentPage === 'Messages' ? (
                <MessagesSurface
                  key={`${identity}:${initialMessageThreadId ?? ''}`}
                  identity={identity}
                  initialThreadId={initialMessageThreadId}
                />
              ) : currentPage === 'Settings' ? (
                <SettingsSurface identity={identity} />
              ) : currentPage === 'Reports' || currentPage === 'Performance' ? (
                <ReportingSurface identity={identity} />
              ) : discoveryPageViews[currentPage] ? (
                <DiscoverySurface
                  tenantId={tenantId}
                  identity={identity}
                  key={`${identity}-${currentPage}`}
                  view={discoveryPageViews[currentPage]}
                  onSurfaceChange={() => contentRef.current?.scrollTo({ top: 0 })}
                />
              ) : ['Partnerships', 'Placements', 'Tracking', 'Storefront'].includes(currentPage) ? (
                <CreatorWorkspaceSurface
                  page={currentPage as 'Partnerships' | 'Placements' | 'Tracking' | 'Storefront'}
                />
              ) : (
                <DataSurface
                  key={`${identity}-${currentPage}`}
                  page={currentPage}
                  identity={identity}
                />
              )}
            </Suspense>
          </LayoutContent>
        }
      />
    </AppShell>
  )
}
