import { UserMenu } from '#/components/user-menu'
import {
  AppShell,
  HStack,
  Heading,
  Icon,
  Layout,
  LayoutContent,
  LayoutHeader,
  StatusDot,
  Text,
  VStack,
  useMediaQuery,
} from '#/features/network/ui/primitives'
import { WorkspaceSwitcher } from '#/components/workspace-switcher'
import { kindLabels, useWorkspace, type OrganizationKind } from '#/lib/workspace'
import { useHydrated } from '#/lib/use-hydrated'
import { useRouteContext } from '@tanstack/react-router'
import { Orbit } from 'lucide-react'
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { NetworkBootstrap } from './NetworkBootstrap'
import { availablePages } from './navigation'

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

const creatorPortalPages = new Set([
  'Opportunities',
  'Projects',
  'Portfolio',
  'Publishers',
  'Performance',
  'Earnings',
  'Payouts',
])

export function NetworkWorkspace({ mode, search, onSearchChange }: NetworkWorkspaceProps) {
  const workspace = useWorkspace()
  const { viewer } = useRouteContext({ from: '/_app' })
  const mounted = useHydrated()
  const [restored] = useState(() => readWorkspaceSession(mode))
  const identity: NetworkIdentity =
    mode === 'operator' ? 'operator' : mode === 'brand' ? 'puroair' : 'northstar'
  const requestedPage = search.page ?? restored?.currentPage ?? 'Overview'
  const currentPage = availablePages(mode).has(requestedPage) ? requestedPage : 'Overview'
  const [activeStep, setActiveStep] = useState(restored?.activeStep ?? 0)
  const initialMessageThreadId = search.thread ?? null
  const contentRef = useRef<HTMLDivElement>(null)
  const isCompactHeader = useMediaQuery('(max-width: 700px)')

  const setCurrentPage = (page: string) => onSearchChange({ page })

  useEffect(() => {
    if (search.page !== currentPage) {
      onSearchChange({ page: currentPage, thread: search.thread }, true)
    }
    try {
      window.sessionStorage.setItem(
        workspaceSessionKey,
        JSON.stringify({ kind: mode, currentPage, activeStep }),
      )
    } catch {
      /* Storage may be unavailable; URL navigation still works. */
    }
    contentRef.current?.scrollTo({ top: 0 })
  }, [activeStep, currentPage, mode, onSearchChange, search.thread, search.page])

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
  const isPendingReview = currentPage === 'Getting started'
  const pagePadding: 4 | 6 = isCompactHeader ? 4 : 6

  if (!mounted) {
    return (
      <output className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading workspace…
      </output>
    )
  }

  return (
    <AppShell sideNav={nav} height="fill" variant="section" contentPadding={0}>
      <NetworkBootstrap />
      <Layout
        height="fill"
        defaultHasDividers
        header={
          <LayoutHeader padding={pagePadding}>
            <VStack gap={2}>
              <HStack gap={2} align="center">
                <Icon icon={Orbit} color="accent" />
                <Text type="supporting" color="accent" weight="semibold">
                  {pageHeader.eyebrow}
                </Text>
              </HStack>
              <div className="flex flex-wrap items-center gap-2 min-[901px]:hidden">
                <WorkspaceSwitcher viewer={viewer} workspace={workspace} />
                <UserMenu />
              </div>
              <Heading level={1} type="display-3">
                {pageHeader.title}
              </Heading>
              <Text color="secondary">{pageHeader.description}</Text>
              <HStack gap={2} align="center">
                <StatusDot
                  variant={isPendingReview ? 'warning' : 'success'}
                  label="Workspace state"
                />
                <Text type="supporting" color="secondary">
                  {kindLabels[mode]} workspace · USD
                </Text>
              </HStack>
            </VStack>
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
                <Overview
                  identity={identity}
                  activeStep={activeStep}
                  onStepChange={handleStepChange}
                  onNavigate={setCurrentPage}
                />
              ) : currentPage === 'Messages' ? (
                <MessagesSurface
                  key={identity}
                  identity={identity}
                  initialThreadId={initialMessageThreadId}
                />
              ) : currentPage === 'Settings' ? (
                <SettingsSurface identity={identity} />
              ) : currentPage === 'Reports' || currentPage === 'Performance' ? (
                <ReportingSurface identity={identity} />
              ) : discoveryPageViews[currentPage] ? (
                <DiscoverySurface
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

const CreatorPortalSurface = lazy(() =>
  import('./CreatorPortalSurface').then((module) => ({ default: module.CreatorPortalSurface })),
)

const CreatorWorkspaceSurface = lazy(() =>
  import('./CreatorWorkspaceSurface').then((module) => ({
    default: module.CreatorWorkspaceSurface,
  })),
)

const DiscoverySurface = lazy(() =>
  import('./DiscoverySurface').then((module) => ({ default: module.DiscoverySurface })),
)

const ReportingSurface = lazy(() =>
  import('./ReportingSurface').then((module) => ({ default: module.ReportingSurface })),
)

const SellerPortalSurface = lazy(() =>
  import('./SellerPortalSurface').then((module) => ({ default: module.SellerPortalSurface })),
)

const MessagesSurface = lazy(() =>
  import('./MessagesSurface').then((module) => ({ default: module.MessagesSurface })),
)

const SettingsSurface = lazy(() =>
  import('./SettingsSurface').then((module) => ({ default: module.SettingsSurface })),
)
