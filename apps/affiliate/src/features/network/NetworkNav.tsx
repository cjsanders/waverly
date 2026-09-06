import { Button } from '@waverly/design-system/ui/button'
import { Bell, MessageCircle } from 'lucide-react'
import { UserMenu } from '#/components/user-menu'
import {
  Selector,
  SideNav,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
  VStack,
  useSideNavRenderMode,
} from '#/features/network/ui/primitives'
import { Logo, LogoIcon } from '@waverly/design-system/brand'
import { useConvexAuth, useQuery as useConvexQuery } from 'convex/react'
import { useState } from 'react'
import { api as convexApi } from '../../../convex/_generated/api'

import {
  creatorNav,
  navIcons,
  operatorNav,
  pendingPublisherNav,
  publisherNav,
  roleOptions,
  sellerNav,
} from './navigation'
import type { DemoIdentity } from './types'
export function NetworkNav({
  identity,
  currentPage,
  onPageChange,
  onIdentityChange,
}: {
  identity: DemoIdentity
  currentPage: string
  onPageChange: (page: string) => void
  onIdentityChange: (identity: DemoIdentity) => void
}) {
  const { isAuthenticated } = useConvexAuth()
  const viewer = useConvexQuery(convexApi.viewer.get, isAuthenticated ? {} : 'skip')
  const sessionLabel = viewer
    ? ['Convex session', viewer.role ?? 'member', viewer.organizationId ?? 'no organization'].join(
        ' · ',
      )
    : 'Connecting to Convex…'
  const sections =
    identity === 'operator'
      ? operatorNav
      : identity === 'puroair'
        ? sellerNav
        : identity === 'avery'
          ? creatorNav
          : identity === 'everyday'
            ? pendingPublisherNav
            : publisherNav
  const [isNavCollapsed, setIsNavCollapsed] = useState(false)
  const renderMode = useSideNavRenderMode()
  const isMobileTopBar = renderMode === 'topbar'
  return (
    <SideNav
      aria-label="Waverly navigation"
      collapsible={{
        isCollapsed: isNavCollapsed,
        onCollapsedChange: setIsNavCollapsed,
        buttonLabel: 'Collapse navigation',
      }}
      header={
        <VStack gap={3}>
          {isNavCollapsed && !isMobileTopBar ? <LogoIcon size={24} /> : <Logo height={24} />}
          <SideNavHeading
            heading={
              identity === 'operator'
                ? 'Operations'
                : identity === 'northstar'
                  ? 'Northstar Media'
                  : identity === 'everyday'
                    ? 'Everyday Finds'
                    : identity === 'puroair'
                      ? 'PuroAir'
                      : 'Avery Lane'
            }
            subheading={
              isMobileTopBar
                ? undefined
                : identity === 'operator'
                  ? 'Partner operations'
                  : identity === 'avery'
                    ? 'Creator workspace'
                    : identity === 'puroair'
                      ? 'Brand seller workspace'
                      : 'Publisher workspace'
            }
          />
        </VStack>
      }
      footer={
        !isNavCollapsed ? (
          <VStack gap={3} padding={3}>
            <Selector
              label="Demo identity"
              options={roleOptions}
              value={identity}
              onChange={(value) => onIdentityChange(value as DemoIdentity)}
              size="sm"
              width="100%"
            />
            <div className="flex items-center gap-2">
              <UserMenu className="min-w-0 flex-1" />
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label="Messages"
                onClick={() => onPageChange('Messages')}
              >
                <MessageCircle />
              </Button>
              <Button variant="secondary" size="icon-sm" aria-label="Alerts">
                <Bell />
              </Button>
            </div>
            <span data-testid="convex-session" className="sr-only">
              {sessionLabel}
            </span>
          </VStack>
        ) : undefined
      }
      footerIcons={<UserMenu />}
    >
      {sections.map((section) => (
        <SideNavSection key={section.title} title={section.title}>
          {section.items.map((item) => (
            <SideNavItem
              key={item}
              label={item}
              icon={navIcons[item]}
              isSelected={currentPage === item}
              onClick={() => onPageChange(item)}
            />
          ))}
        </SideNavSection>
      ))}
    </SideNav>
  )
}
