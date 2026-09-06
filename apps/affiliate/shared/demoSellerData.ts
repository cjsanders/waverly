export type SellerMarketplace = 'Amazon US' | 'Amazon CA' | 'Shopify'

export interface SellerCreatorProfile {
  id: string
  name: string
  creatorType: 'Publisher' | 'Influencer' | 'Media buyer' | 'Deal site'
  category: string
  platforms: string[]
  audience: number
  clicks: number
  salesCents: number
  conversionRate: number
  status: 'Partnered' | 'Invited' | 'Available'
  publicCommissionBps: number
  privateCommissionBps?: number
}

export interface SellerApplication {
  id: string
  creatorId: string
  appliedAt: string
  pitch: string
  requestedProducts: string[]
  status: 'Review' | 'Accepted' | 'Declined'
}

export interface SellerSampleRequest {
  id: string
  creatorId: string
  productOfferKey: string
  requestedAt: string
  fulfillment: 'Review' | 'Approved' | 'Fulfilled' | 'Delivered'
  destination: string
}

export interface SellerPlacement {
  id: string
  creatorId: string
  deliverable: string
  channel: string
  feeCents: number
  due: string
  status: 'Rate card' | 'Proposal' | 'Agreement' | 'In production' | 'Delivered' | 'Approved'
  escrow: 'Not funded' | 'Funded' | 'Released'
}

export interface SellerCampaign {
  id: string
  name: string
  type: 'Deal' | 'CPC'
  productOfferKey: string
  starts: string
  ends: string
  status: 'Scheduled' | 'Live' | 'Complete'
  cpcCents?: number
  budgetCents?: number
  spentCents?: number
  discount?: string
}

export const sellerChannels = [
  {
    id: 'amazon-us',
    marketplace: 'Amazon US' as const,
    storefront: 'amazon.com/stores/PuroAir',
    products: 18,
    autoAccept: true,
    status: 'Live' as const,
  },
  {
    id: 'amazon-ca',
    marketplace: 'Amazon CA' as const,
    storefront: 'amazon.ca/stores/PuroAir',
    products: 7,
    autoAccept: false,
    status: 'Live' as const,
  },
  {
    id: 'shopify',
    marketplace: 'Shopify' as const,
    storefront: 'puroair.com',
    products: 12,
    autoAccept: false,
    status: 'Live' as const,
  },
]

export const sellerCreators: SellerCreatorProfile[] = [
  {
    id: 'northstar',
    name: 'Northstar Media',
    creatorType: 'Publisher',
    category: 'Home',
    platforms: ['Web', 'Newsletter'],
    audience: 1_420_000,
    clicks: 18_420,
    salesCents: 4_864_000,
    conversionRate: 0.041,
    status: 'Partnered',
    publicCommissionBps: 1200,
    privateCommissionBps: 1500,
  },
  {
    id: 'avery',
    name: 'Avery Lane',
    creatorType: 'Influencer',
    category: 'Home',
    platforms: ['Instagram', 'TikTok'],
    audience: 284_000,
    clicks: 9_870,
    salesCents: 2_176_000,
    conversionRate: 0.038,
    status: 'Partnered',
    publicCommissionBps: 1200,
    privateCommissionBps: 1800,
  },
  {
    id: 'useful-edit',
    name: 'The Useful Edit',
    creatorType: 'Publisher',
    category: 'Home',
    platforms: ['Web', 'Newsletter'],
    audience: 692_000,
    clicks: 7_440,
    salesCents: 1_942_000,
    conversionRate: 0.044,
    status: 'Partnered',
    publicCommissionBps: 1200,
  },
  {
    id: 'maya-home',
    name: 'Maya Home Lab',
    creatorType: 'Influencer',
    category: 'Home',
    platforms: ['YouTube', 'Instagram'],
    audience: 518_000,
    clicks: 6_980,
    salesCents: 1_655_000,
    conversionRate: 0.036,
    status: 'Available',
    publicCommissionBps: 1200,
  },
  {
    id: 'field-tested',
    name: 'Field Tested',
    creatorType: 'Publisher',
    category: 'Lifestyle',
    platforms: ['Web', 'YouTube'],
    audience: 811_000,
    clicks: 5_820,
    salesCents: 1_384_000,
    conversionRate: 0.034,
    status: 'Invited',
    publicCommissionBps: 1200,
  },
  {
    id: 'deal-room',
    name: 'The Deal Room',
    creatorType: 'Deal site',
    category: 'Shopping',
    platforms: ['Web', 'Newsletter'],
    audience: 1_870_000,
    clicks: 22_460,
    salesCents: 3_218_000,
    conversionRate: 0.029,
    status: 'Partnered',
    publicCommissionBps: 1000,
  },
  {
    id: 'carmen-cho',
    name: 'Carmen Cho',
    creatorType: 'Influencer',
    category: 'Wellness',
    platforms: ['TikTok', 'Instagram'],
    audience: 176_000,
    clicks: 3_420,
    salesCents: 864_000,
    conversionRate: 0.043,
    status: 'Available',
    publicCommissionBps: 1200,
  },
  {
    id: 'signal-story',
    name: 'Signal & Story',
    creatorType: 'Publisher',
    category: 'Design',
    platforms: ['Newsletter', 'Web'],
    audience: 438_000,
    clicks: 4_160,
    salesCents: 978_000,
    conversionRate: 0.039,
    status: 'Available',
    publicCommissionBps: 1200,
  },
  {
    id: 'social-lift',
    name: 'Social Lift Media',
    creatorType: 'Media buyer',
    category: 'Home',
    platforms: ['Meta', 'TikTok'],
    audience: 0,
    clicks: 13_260,
    salesCents: 2_542_000,
    conversionRate: 0.032,
    status: 'Partnered',
    publicCommissionBps: 900,
    privateCommissionBps: 1100,
  },
  {
    id: 'bright-room',
    name: 'Bright Room Living',
    creatorType: 'Influencer',
    category: 'Home',
    platforms: ['Instagram', 'YouTube'],
    audience: 349_000,
    clicks: 4_980,
    salesCents: 1_122_000,
    conversionRate: 0.037,
    status: 'Invited',
    publicCommissionBps: 1200,
  },
  {
    id: 'weekend-index',
    name: 'Weekend Index',
    creatorType: 'Publisher',
    category: 'Lifestyle',
    platforms: ['Newsletter'],
    audience: 226_000,
    clicks: 2_840,
    salesCents: 704_000,
    conversionRate: 0.041,
    status: 'Available',
    publicCommissionBps: 1200,
  },
  {
    id: 'savewise',
    name: 'Savewise',
    creatorType: 'Deal site',
    category: 'Shopping',
    platforms: ['Web', 'App'],
    audience: 1_130_000,
    clicks: 16_220,
    salesCents: 2_834_000,
    conversionRate: 0.028,
    status: 'Available',
    publicCommissionBps: 900,
  },
]

export const sellerApplications: SellerApplication[] = [
  {
    id: 'app-maya',
    creatorId: 'maya-home',
    appliedAt: 'Aug 15',
    pitch: 'A 30-day air-quality diary for families with pets.',
    requestedProducts: ['130i smart HEPA purifier'],
    status: 'Review',
  },
  {
    id: 'app-carmen',
    creatorId: 'carmen-cho',
    appliedAt: 'Aug 14',
    pitch: 'Short-form allergy-season routines for apartment living.',
    requestedProducts: ['240 HEPA purifier'],
    status: 'Review',
  },
  {
    id: 'app-signal',
    creatorId: 'signal-story',
    appliedAt: 'Aug 13',
    pitch: 'A design-minded guide to cleaner bedrooms and quieter devices.',
    requestedProducts: ['130i smart HEPA purifier'],
    status: 'Review',
  },
  {
    id: 'app-weekend',
    creatorId: 'weekend-index',
    appliedAt: 'Aug 11',
    pitch: 'Newsletter testing slot in our fall home issue.',
    requestedProducts: ['130i smart HEPA purifier'],
    status: 'Accepted',
  },
  {
    id: 'app-savewise',
    creatorId: 'savewise',
    appliedAt: 'Aug 9',
    pitch: 'Deal coverage tied to Labor Day promotional inventory.',
    requestedProducts: ['130i 2-pack'],
    status: 'Declined',
  },
]

export const sellerSamples: SellerSampleRequest[] = [
  {
    id: 'sample-maya',
    creatorId: 'maya-home',
    productOfferKey: 'vera-impact',
    requestedAt: 'Aug 15',
    fulfillment: 'Review',
    destination: 'Austin, TX',
  },
  {
    id: 'sample-carmen',
    creatorId: 'carmen-cho',
    productOfferKey: 'halo-amazon',
    requestedAt: 'Aug 14',
    fulfillment: 'Review',
    destination: 'Seattle, WA',
  },
  {
    id: 'sample-avery',
    creatorId: 'avery',
    productOfferKey: 'vera-impact',
    requestedAt: 'Aug 12',
    fulfillment: 'Delivered',
    destination: 'Brooklyn, NY',
  },
  {
    id: 'sample-bright',
    creatorId: 'bright-room',
    productOfferKey: 'crane-shopify',
    requestedAt: 'Aug 11',
    fulfillment: 'Fulfilled',
    destination: 'Denver, CO',
  },
  {
    id: 'sample-signal',
    creatorId: 'signal-story',
    productOfferKey: 'vera-impact',
    requestedAt: 'Aug 10',
    fulfillment: 'Approved',
    destination: 'Portland, OR',
  },
  {
    id: 'sample-northstar',
    creatorId: 'northstar',
    productOfferKey: 'halo-amazon',
    requestedAt: 'Aug 8',
    fulfillment: 'Delivered',
    destination: 'New York, NY',
  },
]

export const sellerPlacements: SellerPlacement[] = [
  {
    id: 'placement-avery',
    creatorId: 'avery',
    deliverable: '45–60 sec vertical video + 3 story frames',
    channel: 'Instagram + TikTok',
    feeCents: 240_000,
    due: 'Sep 3',
    status: 'In production',
    escrow: 'Funded',
  },
  {
    id: 'placement-northstar',
    creatorId: 'northstar',
    deliverable: 'Dedicated fall home newsletter feature',
    channel: 'Newsletter',
    feeCents: 425_000,
    due: 'Sep 8',
    status: 'Agreement',
    escrow: 'Funded',
  },
  {
    id: 'placement-maya',
    creatorId: 'maya-home',
    deliverable: 'YouTube integration + 2 Shorts',
    channel: 'YouTube',
    feeCents: 310_000,
    due: 'Sep 14',
    status: 'Proposal',
    escrow: 'Not funded',
  },
  {
    id: 'placement-carmen',
    creatorId: 'carmen-cho',
    deliverable: '3 TikTok videos',
    channel: 'TikTok',
    feeCents: 180_000,
    due: 'Sep 18',
    status: 'Rate card',
    escrow: 'Not funded',
  },
  {
    id: 'placement-useful',
    creatorId: 'useful-edit',
    deliverable: 'Air purifier comparison update',
    channel: 'Web + Newsletter',
    feeCents: 275_000,
    due: 'Aug 28',
    status: 'Delivered',
    escrow: 'Funded',
  },
  {
    id: 'placement-signal',
    creatorId: 'signal-story',
    deliverable: 'Editorial photography + review',
    channel: 'Newsletter',
    feeCents: 165_000,
    due: 'Aug 22',
    status: 'Approved',
    escrow: 'Released',
  },
]

export const sellerCampaigns: SellerCampaign[] = [
  {
    id: 'deal-labor-day',
    name: 'Labor Day home reset',
    type: 'Deal',
    productOfferKey: 'vera-impact',
    starts: 'Aug 29',
    ends: 'Sep 3',
    status: 'Scheduled',
    discount: '20% off',
  },
  {
    id: 'deal-filter-event',
    name: 'Replacement filter event',
    type: 'Deal',
    productOfferKey: 'crane-shopify',
    starts: 'Aug 12',
    ends: 'Aug 18',
    status: 'Live',
    discount: 'Buy 2, save 15%',
  },
  {
    id: 'cpc-130i-launch',
    name: '130i launch support',
    type: 'CPC',
    productOfferKey: 'vera-impact',
    starts: 'Aug 1',
    ends: 'Aug 31',
    status: 'Live',
    cpcCents: 75,
    budgetCents: 600_000,
    spentCents: 418_500,
  },
  {
    id: 'cpc-canada',
    name: 'Canada awareness',
    type: 'CPC',
    productOfferKey: 'halo-amazon',
    starts: 'Aug 8',
    ends: 'Sep 8',
    status: 'Live',
    cpcCents: 50,
    budgetCents: 350_000,
    spentCents: 126_000,
  },
]

export const sellerInvoices = [
  {
    id: 'INV-2026-08',
    period: 'August 2026',
    saasCents: 99_900,
    commissionsCents: 486_400,
    placementsCents: 590_000,
    totalCents: 1_176_300,
    status: 'Open' as const,
    due: 'Sep 5',
  },
  {
    id: 'INV-2026-07',
    period: 'July 2026',
    saasCents: 99_900,
    commissionsCents: 442_800,
    placementsCents: 275_000,
    totalCents: 817_700,
    status: 'Paid' as const,
    due: 'Aug 5',
  },
  {
    id: 'INV-2026-06',
    period: 'June 2026',
    saasCents: 99_900,
    commissionsCents: 391_600,
    placementsCents: 165_000,
    totalCents: 656_500,
    status: 'Paid' as const,
    due: 'Jul 5',
  },
]

export const sellerReportHighlights = [
  {
    id: 'halo',
    label: 'Halo revenue',
    valueCents: 3_842_000,
    detail: '31% of attributed order value came from products other than the promoted ASIN.',
  },
  {
    id: 'new-to-brand',
    label: 'New-to-brand customers',
    value: '89%',
    detail: 'First-time PuroAir customers among attributed buyers.',
  },
  {
    id: 'bsr',
    label: 'Best seller rank lift',
    value: '+18',
    detail: 'Average category rank improvement during creator campaign windows.',
  },
  {
    id: 'brb',
    label: 'Brand referral bonus',
    valueCents: 684_000,
    detail: 'Amazon credits from qualifying external attribution traffic.',
  },
]

export const sellerSeedCounts = {
  channels: sellerChannels.length,
  creators: sellerCreators.length,
  applications: sellerApplications.length,
  samples: sellerSamples.length,
  placements: sellerPlacements.length,
  campaigns: sellerCampaigns.length,
  invoices: sellerInvoices.length,
}
