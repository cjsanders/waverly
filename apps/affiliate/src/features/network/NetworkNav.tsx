import { Button } from '@waverly/design-system/ui/button'
import { Bell, MessageCircle } from 'lucide-react'
import { UserMenu } from '#/components/user-menu'
import { WorkspaceSwitcher } from '#/components/workspace-switcher'
import {
  SideNav,
  SideNavHeading,
  SideNavSection,
  VStack,
  useSideNavRenderMode,
} from '#/features/network/ui/primitives'
import { Logo, LogoIcon } from '@waverly/design-system/brand'
import { Link, useRouteContext } from '@tanstack/react-router'
import { useState } from 'react'
import { homePaths, kindLabels, useWorkspace } from '#/lib/workspace'

import { navForKind, navIcons } from './navigation'
export function NetworkNav({
  currentPage,
  onPageChange,
}: {
  currentPage: string
  onPageChange: (page: string) => void
}) {
  const workspace = useWorkspace()
  const { viewer } = useRouteContext({ from: '/_app' })
  const kind = workspace.organization.kind
  const sections = navForKind(kind)
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
            heading={workspace.organization.name}
            subheading={isMobileTopBar ? undefined : `${kindLabels[kind]} workspace`}
          />
        </VStack>
      }
      footer={
        !isNavCollapsed ? (
          <VStack gap={3} padding={3}>
            <WorkspaceSwitcher viewer={viewer} workspace={workspace} />
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
          </VStack>
        ) : undefined
      }
      footerIcons={<UserMenu />}
    >
      {sections.map((section) => (
        <SideNavSection key={section.title} title={section.title}>
          {section.items.map((item) => {
            const IconComponent = navIcons[item]
            return (
              <Link
                key={item}
                to={homePaths[kind]}
                search={{ page: item }}
                preload="intent"
                aria-current={currentPage === item ? 'page' : undefined}
                className={`waverly-nav-item${currentPage === item ? ' waverly-nav-item-selected' : ''}`}
              >
                <IconComponent aria-hidden />
                <span>{item}</span>
              </Link>
            )
          })}
        </SideNavSection>
      ))}
    </SideNav>
  )
}
