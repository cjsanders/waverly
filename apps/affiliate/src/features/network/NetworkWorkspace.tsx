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
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Orbit } from 'lucide-react'
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { DemoBootstrap } from './DemoBootstrap'
import { availablePages, roleOptions } from './navigation'
import { Selector } from './ui/primitives'

import type { CreatorPage } from './CreatorPortalSurface'
import type { SellerPage } from './SellerPortalSurface'

import { discoveryPageViews } from './navigation'
import { NetworkNav } from './NetworkNav'
import { Overview, PendingPublisherOverview } from './Overview'
import { getPageHeader } from './page-header'
import { DataSurface } from './RecordsSurface'
import { demoSessionKey, readDemoSession } from './session'
import type { DemoIdentity } from './types'
export function NetworkWorkspace() {
  const navigate = useNavigate({ from: '/dashboard' })
  const search = useSearch({ from: '/dashboard' })
  const [restored] = useState(() => readDemoSession())
  const identity = search.demoIdentity ?? search.role ?? restored?.identity ?? 'operator'
  const requestedPage = search.demoIdentity
    ? 'Messages'
    : (search.page ?? restored?.currentPage ?? 'Overview')
  const currentPage = availablePages(identity).has(requestedPage) ? requestedPage : 'Overview'
  const [activeStep, setActiveStep] = useState(restored?.activeStep ?? 0)
  const initialMessageThreadId = search.demoThread ?? null
  const contentRef = useRef<HTMLDivElement>(null)
  const isCompactHeader = useMediaQuery('(max-width: 700px)')

  const goTo = (role: DemoIdentity, page: string) => {
    void navigate({ search: { role, page }, resetScroll: true })
  }
  const setCurrentPage = (page: string) => goTo(identity, page)

  useEffect(() => {
    if (search.role !== identity || search.page !== currentPage || search.demoIdentity) {
      void navigate({
        search: { role: identity, page: currentPage, demoThread: search.demoThread },
        replace: true,
      })
    }
    try {
      window.sessionStorage.setItem(
        demoSessionKey,
        JSON.stringify({ identity, currentPage, activeStep }),
      )
    } catch {
      /* Storage may be unavailable; URL navigation still works. */
    }
    contentRef.current?.scrollTo({ top: 0 })
  }, [
    activeStep,
    currentPage,
    identity,
    navigate,
    search.demoIdentity,
    search.demoThread,
    search.page,
    search.role,
  ])

  const nav = (
    <NetworkNav
      identity={identity}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onIdentityChange={(nextIdentity) => goTo(nextIdentity, 'Overview')}
    />
  )
  const handleStepChange = (step: number) => {
    setActiveStep(step)
    goTo(step >= 3 && step <= 5 ? 'northstar' : 'operator', 'Overview')
  }

  const pageHeader = getPageHeader(identity, currentPage)
  const isPendingReview = identity === 'everyday' && currentPage === 'Overview'
  const pagePadding: 4 | 6 = isCompactHeader ? 4 : 6

  return (
    <AppShell sideNav={nav} height="fill" variant="section" contentPadding={0}>
      <DemoBootstrap />
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
                <Selector
                  label="Demo identity"
                  options={roleOptions}
                  value={identity}
                  onChange={(value) => goTo(value as DemoIdentity, 'Overview')}
                />
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
                  Demo workspace · Sample data · USD
                </Text>
              </HStack>
              <p className="text-xs text-muted-foreground">
                Explore five demo roles. Messages are shared with signed-in demo users; other
                actions are simulated.
              </p>
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
              {identity === 'puroair' && !['Messages', 'Settings'].includes(currentPage) ? (
                <SellerPortalSurface page={currentPage as SellerPage} onNavigate={setCurrentPage} />
              ) : identity === 'avery' && !['Messages', 'Settings'].includes(currentPage) ? (
                <CreatorPortalSurface
                  page={currentPage as CreatorPage}
                  onNavigate={setCurrentPage}
                />
              ) : currentPage === 'Overview' ? (
                identity === 'everyday' ? (
                  <PendingPublisherOverview
                    activeStep={activeStep}
                    onStepChange={handleStepChange}
                    onNavigate={setCurrentPage}
                  />
                ) : (
                  <Overview
                    identity={identity}
                    activeStep={activeStep}
                    onStepChange={handleStepChange}
                    onNavigate={setCurrentPage}
                  />
                )
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
