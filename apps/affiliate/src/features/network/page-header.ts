import { type DiscoveryView } from './DiscoverySurface'

import { discoveryPageViews } from './navigation'
import { makeSurfaceConfig } from './RecordsSurface'
import type { DemoIdentity } from './types'
export function getPageHeader(identity: DemoIdentity, page: string) {
  if (identity === 'puroair') {
    const sellerHeaders: Record<string, { eyebrow: string; title: string; description: string }> = {
      Overview: {
        eyebrow: 'BRAND PROGRAM',
        title: 'PuroAir creator program',
        description:
          'Unified sales, creator decisions, campaign spend, and program health across Amazon and Shopify.',
      },
      'Brand profile': {
        eyebrow: 'PROGRAM SETUP',
        title: 'Brand profile',
        description:
          'Manage the creator-facing profile, storefronts, contact details, and application policy for each channel.',
      },
      'Products & commissions': {
        eyebrow: 'PROGRAM SETUP',
        title: 'Products & commissions',
        description:
          'Activate catalog items, set public product rates, and grant private creator-specific boosts.',
      },
      'Deals & CPC': {
        eyebrow: 'CAMPAIGNS',
        title: 'Deals & CPC',
        description:
          'Schedule promotions and fund click campaigns that fall back to CPA when their budget ends.',
      },
      Samples: {
        eyebrow: 'CREATOR ACTIVATION',
        title: 'Samples',
        description:
          'Review creator fit and trigger Amazon or Shopify fulfillment without leaving the request.',
      },
      'Creator directory': {
        eyebrow: 'CREATOR NETWORK',
        title: 'Creator directory',
        description:
          'Discover publishers, influencers, media buyers, and deal sites using audience and performance evidence.',
      },
      Applications: {
        eyebrow: 'CREATOR NETWORK',
        title: 'Applications',
        description:
          "Review inbound creator applications and grant access to PuroAir's products and public terms.",
      },
      Partnerships: {
        eyebrow: 'CREATOR NETWORK',
        title: 'Partnerships',
        description:
          'Monitor active partners, organize groups, and manage private commission rates.',
      },
      'Paid placements': {
        eyebrow: 'CREATOR PROGRAM',
        title: 'Paid placements',
        description:
          'Move flat-fee content from rate card and proposal through agreement, escrow, delivery, and approval.',
      },
      Performance: {
        eyebrow: 'PROGRAM REPORTING',
        title: 'Performance',
        description:
          'Compare periods and marketplaces across clicks, conversions, sales, commission, and ROAS.',
      },
      'Deep reports': {
        eyebrow: 'PROGRAM REPORTING',
        title: 'Deep reports',
        description:
          'Measure halo revenue, new-to-brand acquisition, best seller rank lift, and referral credits.',
      },
      Billing: {
        eyebrow: 'PROGRAM FINANCE',
        title: 'Billing',
        description:
          'Review the consolidated monthly invoice for platform fees, creator commissions, and paid placements.',
      },
      Messages: {
        eyebrow: 'CREATOR RELATIONSHIPS',
        title: 'Messages',
        description:
          'Negotiate creator opportunities and resolve delivery questions in the shared commercial context.',
      },
      Settings: {
        eyebrow: 'BRAND PROGRAM',
        title: 'Settings',
        description:
          "Manage PuroAir's workspace, commerce connections, notifications, and billing preferences.",
      },
    }
    return sellerHeaders[page] ?? sellerHeaders.Overview
  }
  if (identity === 'avery') {
    const creatorHeaders: Record<string, { eyebrow: string; title: string; description: string }> =
      {
        Overview: {
          eyebrow: 'CREATOR WORKSPACE',
          title: 'Good morning, Avery',
          description:
            'Your briefs, deadlines, approvals, and publisher payments in one production view.',
        },
        Opportunities: {
          eyebrow: 'PUBLISHER OPPORTUNITIES',
          title: 'Find your next collaboration',
          description:
            'Review complete briefs from publishers that match your formats, audience, and rates.',
        },
        Projects: {
          eyebrow: 'PRODUCTION',
          title: 'Projects',
          description:
            'Move each collaboration from locked brief to publisher approval without losing feedback or versions.',
        },
        Portfolio: {
          eyebrow: 'CREATOR PROFILE',
          title: 'Portfolio',
          description:
            'Curate proof of work that helps publishers understand your voice, formats, and audience.',
        },
        Publishers: {
          eyebrow: 'RELATIONSHIPS',
          title: 'Publishers',
          description:
            'Manage the people and media companies that commission and distribute your work.',
        },
        Performance: {
          eyebrow: 'CREATOR INSIGHTS',
          title: 'Performance',
          description: 'Connect content reach, engagement, and attributed publisher outcomes.',
        },
        Earnings: {
          eyebrow: 'CREATOR FINANCE',
          title: 'Earnings',
          description:
            'Track project fees, approval gates, and affiliate upside as separate earning events.',
        },
        Payouts: {
          eyebrow: 'CREATOR FINANCE',
          title: 'Payouts',
          description:
            'Know which publisher payments are included in every settlement and when they will arrive.',
        },
        Messages: {
          eyebrow: 'RELATIONSHIPS',
          title: 'Messages',
          description:
            'Work directly with publisher editors and partnership leads around the shared brief.',
        },
        Settings: {
          eyebrow: 'CREATOR PROFILE',
          title: 'Settings',
          description:
            'Manage Avery Lane Studio, notifications, connected accounts, and payout preferences.',
        },
      }
    return creatorHeaders[page] ?? creatorHeaders.Overview
  }
  if (page === 'Overview') {
    if (identity === 'everyday') {
      return {
        eyebrow: 'PUBLISHER ONBOARDING',
        title: 'Everyday Finds is under review',
        description: 'Waverly partner operations is reviewing both submitted properties.',
      }
    }
    return {
      eyebrow: identity === 'operator' ? 'NETWORK CONTROL' : 'PUBLISHER PERFORMANCE',
      title: identity === 'operator' ? 'Network overview' : 'Northstar overview',
      description: 'Jul 17–Aug 15, 2026 · Compared with previous 30 days',
    }
  }
  if (discoveryPageViews[page]) {
    const discoveryHeaders: Record<DiscoveryView, { title: string; description: string }> = {
      'for-you': {
        title: 'For you',
        description:
          'Prioritized opportunities based on audience fit, live terms, and recent performance.',
      },
      products: {
        title: 'Product catalog',
        description:
          'Compare products, commercial terms, ratings, samples, and audience fit before creating a link.',
      },
      brands: {
        title: 'Brand catalog',
        description:
          'Open a brand to review its products, partnership status, terms, and performance.',
      },
      cpc: {
        title: 'Cost-per-click',
        description:
          'Find active click campaigns with available budget and a strong audience match.',
      },
      loyalty: {
        title: 'Loyalty programs',
        description:
          'Track progress toward brand bonuses and focus on the rewards closest to unlocking.',
      },
      lists: {
        title: 'Lists',
        description:
          'Organize products into editorial collections for upcoming coverage and publishing.',
      },
    }
    const header = discoveryHeaders[discoveryPageViews[page]]
    return {
      eyebrow: 'OPPORTUNITY DISCOVERY',
      title: header.title,
      description: header.description,
    }
  }
  const workspaceHeaders: Record<string, { eyebrow: string; description: string }> = {
    Partnerships: {
      eyebrow: 'PARTNER WORKSPACE',
      description:
        'Manage brand relationships, products, samples, announcements, campaigns, and loyalty programs.',
    },
    Placements: {
      eyebrow: 'PAID COLLABORATIONS',
      description: 'Track contracts, deliverables, fixed fees, and a creator-facing rate card.',
    },
    Tracking: {
      eyebrow: 'LINK MANAGEMENT',
      description:
        'Create and organize product links, storefront routes, archives, and discount codes.',
    },
    Storefront: {
      eyebrow: 'SHOPPABLE PROFILE',
      description: 'Curate products, posts, folders, and the public Northstar storefront.',
    },
  }
  if (workspaceHeaders[page]) {
    return {
      eyebrow: workspaceHeaders[page].eyebrow,
      title: page,
      description: workspaceHeaders[page].description,
    }
  }
  const config = makeSurfaceConfig(page, identity)
  return { eyebrow: config.eyebrow, title: page, description: config.description }
}
