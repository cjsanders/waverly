import { type IconType } from '#/features/network/ui/primitives'
import {
  BadgeDollarSign,
  Building2,
  ChartNoAxesCombined,
  ChartSpline,
  CircleDollarSign,
  ClipboardList,
  FolderHeart,
  Gift,
  Handshake,
  Landmark,
  LayoutDashboard,
  Link2,
  ListChecks,
  Megaphone,
  MessageSquareText,
  MousePointerClick,
  PlugZap,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Tags,
  UserRound,
  Users,
  WalletCards,
} from 'lucide-react'

import { type DiscoveryView } from './DiscoverySurface'
import type { OrganizationKind } from '#/lib/workspace'

import type { NavSection } from './types'
export const operatorNav: NavSection[] = [
  { title: 'Network', items: ['Overview', 'Publishers'] },
  { title: 'Marketplace', items: ['Advertisers', 'Programs', 'Offers'] },
  { title: 'Performance', items: ['Links', 'Clicks', 'Conversions', 'Reports'] },
  { title: 'Finance', items: ['Balances', 'Payouts'] },
  { title: 'Operations', items: ['Providers', 'Messages', 'Settings'] },
]

export const creatorNav: NavSection[] = [
  { title: 'Home', items: ['Overview', 'Getting started'] },
  {
    title: 'Discovery',
    items: [
      'For you',
      'Product catalog',
      'Brand catalog',
      'Cost-per-click',
      'Loyalty programs',
      'Lists',
    ],
  },
  {
    title: 'Work',
    items: [
      'Opportunities',
      'Projects',
      'Portfolio',
      'Partnerships',
      'Placements',
      'Tracking',
      'Storefront',
    ],
  },
  { title: 'Insights', items: ['Performance', 'Reports', 'Earnings', 'Payouts'] },
  { title: 'Organization', items: ['Publishers', 'Properties', 'Messages', 'Settings'] },
]

export const sellerNav: NavSection[] = [
  {
    title: 'Program',
    items: ['Overview', 'Brand profile', 'Products & commissions', 'Deals & CPC', 'Samples'],
  },
  {
    title: 'Creators',
    items: ['Creator directory', 'Applications', 'Partnerships', 'Paid placements'],
  },
  { title: 'Reporting', items: ['Performance', 'Deep reports'] },
  { title: 'Finance', items: ['Billing'] },
  { title: 'Workspace', items: ['Messages', 'Settings'] },
]

export const navIcons: Record<string, IconType> = {
  Overview: LayoutDashboard,
  'Getting started': ListChecks,
  Publishers: Users,
  Advertisers: Building2,
  Programs: Megaphone,
  Offers: Tags,
  Links: Link2,
  Clicks: MousePointerClick,
  Conversions: BadgeDollarSign,
  Reports: ChartNoAxesCombined,
  Balances: WalletCards,
  Payouts: Landmark,
  Providers: PlugZap,
  Messages: MessageSquareText,
  Settings,
  Discover: Search,
  'For you': Sparkles,
  'Product catalog': ShoppingBag,
  'Brand catalog': Building2,
  'Cost-per-click': MousePointerClick,
  'Loyalty programs': Gift,
  Lists: ListChecks,
  'My offers': Tags,
  Partnerships: Handshake,
  Placements: ReceiptText,
  Tracking: Link2,
  Storefront: Store,
  Performance: ChartSpline,
  Earnings: CircleDollarSign,
  Properties: Building2,
  Opportunities: Sparkles,
  Projects: ClipboardList,
  Portfolio: FolderHeart,
  'Brand profile': Building2,
  'Products & commissions': ShoppingBag,
  'Deals & CPC': Megaphone,
  Samples: Gift,
  'Creator directory': Users,
  Applications: UserRound,
  'Paid placements': ReceiptText,
  'Deep reports': ChartNoAxesCombined,
  Billing: WalletCards,
}

export const discoveryPageViews: Record<string, DiscoveryView> = {
  Discover: 'for-you',
  'For you': 'for-you',
  'Product catalog': 'products',
  'Brand catalog': 'brands',
  'Cost-per-click': 'cpc',
  'Loyalty programs': 'loyalty',
  Lists: 'lists',
}

export function navForKind(kind: OrganizationKind) {
  return kind === 'operator' ? operatorNav : kind === 'brand' ? sellerNav : creatorNav
}

export function availablePages(kind: OrganizationKind) {
  const sections = navForKind(kind)
  return new Set(sections.flatMap((section) => section.items))
}

export const workflowSteps = [
  'Health',
  'Approvals',
  'Offer',
  'Discover',
  'Link',
  'Sync & review',
  'Payout',
] as const

export const stepMessages = [
  ['Network health is current', 'Review performance, balances, alerts, and provider freshness.'],
  [
    'Publisher review is queued',
    'Everyday Finds and two properties are ready for an operator decision.',
  ],
  [
    'Offer terms are ready',
    'PuroAir is represented across Amazon Attribution, Creator Connections, and Shopify.',
  ],
  [
    'Publisher scope enabled',
    'Northstar sees eligible offers without provider-specific complexity.',
  ],
  [
    'Stable link model ready',
    'Destination or provider changes create a new immutable link version.',
  ],
  [
    'Idempotent sync ready',
    'Provider transaction identity prevents duplicate normalized conversions.',
  ],
  ['Payable balance ready', 'A payout moves funds using append-only ledger entries.'],
] as const
