import { lazyRouteComponent } from '@tanstack/react-router'
import type { OrganizationKind } from '../../lib/workspace'
import { availablePages, discoveryPageViews } from './navigation'

export const CreatorPortalSurface = lazyRouteComponent(
  () => import('./CreatorPortalSurface'),
  'CreatorPortalSurface',
)
export const CreatorWorkspaceSurface = lazyRouteComponent(
  () => import('./CreatorWorkspaceSurface'),
  'CreatorWorkspaceSurface',
)
export const DiscoverySurface = lazyRouteComponent(
  () => import('./DiscoverySurface'),
  'DiscoverySurface',
)
export const ReportingSurface = lazyRouteComponent(
  () => import('./ReportingSurface'),
  'ReportingSurface',
)
export const SellerPortalSurface = lazyRouteComponent(
  () => import('./SellerPortalSurface'),
  'SellerPortalSurface',
)
export const MessagesSurface = lazyRouteComponent(
  () => import('./MessagesSurface'),
  'MessagesSurface',
)
export const SettingsSurface = lazyRouteComponent(
  () => import('./SettingsSurface'),
  'SettingsSurface',
)

export const creatorPortalPages = new Set([
  'Opportunities',
  'Projects',
  'Portfolio',
  'Publishers',
  'Performance',
  'Earnings',
  'Payouts',
])

/** Preload the actual component instance used by the view, including its Vite dependencies. */
export function preloadWorkspaceSurface(kind: OrganizationKind, requestedPage = 'Overview') {
  const page = availablePages(kind).has(requestedPage) ? requestedPage : 'Overview'
  if (kind === 'brand' && !['Messages', 'Settings'].includes(page))
    return SellerPortalSurface.preload?.()
  if (kind === 'creator' && creatorPortalPages.has(page)) return CreatorPortalSurface.preload?.()
  if (page === 'Messages') return MessagesSurface.preload?.()
  if (page === 'Settings') return SettingsSurface.preload?.()
  if (page === 'Reports' || page === 'Performance') return ReportingSurface.preload?.()
  if (discoveryPageViews[page]) return DiscoverySurface.preload?.()
  if (['Partnerships', 'Placements', 'Tracking', 'Storefront'].includes(page))
    return CreatorWorkspaceSurface.preload?.()
}
