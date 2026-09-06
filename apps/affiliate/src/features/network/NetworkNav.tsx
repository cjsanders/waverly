import { UserMenu } from '#/components/user-menu'
import {
  Selector,
  SideNav,
  SideNavItem,
  SideNavSection,
  Text,
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
import { WorkspaceActions } from './WorkspaceActions'
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
          <div className="flex items-center justify-between gap-3">
            {isNavCollapsed && !isMobileTopBar ? <LogoIcon size={24} /> : <Logo height={22} />}
            {isMobileTopBar ? (
              <WorkspaceActions
                key={identity}
                identity={identity}
                currentPage={currentPage}
                onPageChange={onPageChange}
                mode="mobile"
              />
            ) : null}
          </div>
          {!isNavCollapsed && !isMobileTopBar ? (
            <VStack gap={1.5} className="waverly-workspace-picker">
              <Selector
                label="Demo identity"
                isLabelHidden
                options={roleOptions}
                value={identity}
                onChange={(value) => onIdentityChange(value as DemoIdentity)}
                width="100%"
              />
              <Text type="supporting" color="secondary">
                {identity === 'operator'
                  ? 'Partner operations'
                  : identity === 'avery'
                    ? 'Creator workspace'
                    : identity === 'puroair'
                      ? 'Brand workspace'
                      : 'Publisher workspace'}
              </Text>
            </VStack>
          ) : null}
        </VStack>
      }
      footer={
        !isNavCollapsed && !isMobileTopBar ? (
          <VStack gap={3} padding={3}>
            <WorkspaceActions
              key={identity}
              identity={identity}
              currentPage={currentPage}
              onPageChange={onPageChange}
            />
            <UserMenu className="w-full" />
            <span data-testid="convex-session" className="sr-only">
              {sessionLabel}
            </span>
          </VStack>
        ) : undefined
      }
      footerIcons={
        isNavCollapsed && !isMobileTopBar ? (
          <div className="flex flex-col items-center gap-3 py-3">
            <WorkspaceActions
              key={identity}
              identity={identity}
              currentPage={currentPage}
              onPageChange={onPageChange}
              mode="collapsed"
            />
            <UserMenu className="w-10 overflow-hidden p-1" />
          </div>
        ) : undefined
      }
    >
      {sections.map((section) => (
        <SideNavSection key={section.title} title={section.title}>
          {section.items
            .filter((item) => item !== 'Messages')
            .map((item) => (
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
