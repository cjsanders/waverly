export const DEMO_ANCHOR_MS = Date.UTC(2026, 7, 15, 12)
export const DAY_MS = 86_400_000

export interface SeedProvider {
  key: string
  name: string
  latencyMinutes: number
  status: 'healthy' | 'warning'
}

export interface SeedAdvertiser {
  key: string
  name: string
  category: string
  logoUrl: string
}

export interface SeedProgramOffer {
  key: string
  advertiserKey: string
  providerKey: string
  programName: string
  offerName: string
  publisherShareBps: number
  attributionWindowDays: number
  featured: boolean
  productImageUrl: string
  productSku: string
  priceCents: number
  commissionRateBps: number
  marketplace: 'Amazon' | 'Shopify' | 'Walmart'
  countryCode: 'US' | 'CA'
  rating: number
  reviewCount: number
  access: 'partnered' | 'eligible' | 'review'
  isDeal: boolean
  dealEndsAt?: number
  samplesAvailable: boolean
  cpcCents: number
  loyaltyBonusCents: number
}

export interface SeedPublisher {
  key: string
  name: string
  status: 'active' | 'pending' | 'paused'
  shareBps: number
}

export interface SeedProperty {
  key: string
  publisherKey: string
  name: string
  type: 'website' | 'newsletter' | 'social' | 'app'
  approvalStatus: 'approved' | 'pending'
  urlOrHandle: string
}

export interface SeedLink {
  key: string
  slug: string
  publisherKey: string
  propertyKey: string
  offerKey: string
  displayName: string
  createdAt: number
}

export interface SeedDay {
  date: string
  occurredAt: number
  clicks: number
  uniqueClicks: number
  conversions: number
  orderValueCents: number
  grossCommissionCents: number
  publisherEarningsCents: number
  waverlyRevenueCents: number
  reversals: number
}

export interface SeedConversion {
  key: string
  providerKey: string
  providerTransactionId: string
  publisherKey: string
  propertyKey: string
  advertiserKey: string
  offerKey: string
  linkKey: string
  occurredAt: number
  status: 'pending' | 'approved' | 'locked' | 'paid' | 'reversed'
  orderValueCents: number
  grossCommissionCents: number
  publisherEarningsCents: number
  waverlyRevenueCents: number
}

function lcg(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0
    return state / 4_294_967_296
  }
}

export const providers: SeedProvider[] = [
  { key: 'amazon', name: 'Amazon Attribution', latencyMinutes: 18, status: 'healthy' },
  { key: 'impact', name: 'Creator Connections', latencyMinutes: 42, status: 'healthy' },
  { key: 'shopify', name: 'Shopify', latencyMinutes: 96, status: 'warning' },
]

const advertiserSeeds: Array<Omit<SeedAdvertiser, 'logoUrl'>> = [
  { key: 'aster-grove', name: 'Rocco & Roxie Supply Co.', category: 'Pets' },
  { key: 'trail-kind', name: 'HumanN', category: 'Wellness' },
  { key: 'lumen-audio', name: 'TruSkin', category: 'Beauty' },
  { key: 'north-thread', name: 'Auraglow', category: 'Beauty' },
  { key: 'good-day-kitchen', name: 'Sports Research', category: 'Wellness' },
  { key: 'field-notes-co', name: 'LUXE Bidet', category: 'Home' },
  { key: 'kinship-skin', name: 'Hero Cosmetics', category: 'Beauty' },
  { key: 'morrow-cycle', name: "Physician's Choice", category: 'Wellness' },
  { key: 'ember-coffee', name: 'Squatty Potty', category: 'Home' },
  { key: 'grove-games', name: 'Zesty Paws', category: 'Pets' },
  { key: 'axis-travel', name: 'Jacked Factory', category: 'Fitness' },
  { key: 'quietform', name: 'RENPHO', category: 'Wellness' },
  { key: 'tide-timber', name: 'BB Company', category: 'Wellness' },
  { key: 'solis-gear', name: 'Lumineux', category: 'Beauty' },
  { key: 'arbor-pets', name: 'PowerStep', category: 'Wellness' },
  { key: 'vera-studio', name: 'Coop Sleep Goods', category: 'Home' },
  { key: 'halo-wellness', name: 'COSLUS', category: 'Beauty' },
  { key: 'paper-crane', name: 'PuroAir', category: 'Home' },
  { key: 'kindred-tech', name: 'hOmeLabs', category: 'Home' },
  { key: 'common-table', name: 'Nutricost', category: 'Wellness' },
]

export const advertisers: SeedAdvertiser[] = advertiserSeeds.map((advertiser) => ({
  ...advertiser,
  logoUrl: `/demo/catalog/brands/${advertiser.key}.png`,
}))

type OfferSeed = Omit<SeedProgramOffer, 'productImageUrl'>

const offerSeeds: OfferSeed[] = [
  {
    key: 'aster-impact',
    advertiserKey: 'aster-grove',
    providerKey: 'impact',
    programName: 'Rocco & Roxie Creator Program',
    offerName: 'Enzyme stain & odor eliminator · 1 gallon',
    publisherShareBps: 7800,
    attributionWindowDays: 30,
    featured: true,
    productSku: 'B00J9MYM5O',
    priceCents: 5_997,
    commissionRateBps: 2000,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.4,
    reviewCount: 127_134,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: false,
    cpcCents: 25,
    loyaltyBonusCents: 20_000,
  },
  {
    key: 'aster-shopify',
    advertiserKey: 'lumen-audio',
    providerKey: 'amazon',
    programName: 'TruSkin Canada Attribution',
    offerName: 'Vitamin C face serum · 2 fl oz',
    publisherShareBps: 7600,
    attributionWindowDays: 14,
    featured: false,
    productSku: 'B01EKUBU5Y',
    priceCents: 4_895,
    commissionRateBps: 4000,
    marketplace: 'Amazon',
    countryCode: 'CA',
    rating: 4.2,
    reviewCount: 146_367,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: false,
    cpcCents: 35,
    loyaltyBonusCents: 25_000,
  },
  {
    key: 'trail-amazon',
    advertiserKey: 'trail-kind',
    providerKey: 'amazon',
    programName: 'HumanN Attribution',
    offerName: 'SuperBeets heart chews · 180 count',
    publisherShareBps: 7200,
    attributionWindowDays: 14,
    featured: false,
    productSku: 'B0DLPGZTBL',
    priceCents: 8_995,
    commissionRateBps: 0,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.5,
    reviewCount: 75_426,
    access: 'review',
    isDeal: false,
    samplesAvailable: false,
    cpcCents: 10,
    loyaltyBonusCents: 10_000,
  },
  {
    key: 'lumen-impact',
    advertiserKey: 'lumen-audio',
    providerKey: 'impact',
    programName: 'TruSkin Creator Connections',
    offerName: 'Brightening vitamin C serum · 1 fl oz',
    publisherShareBps: 8000,
    attributionWindowDays: 30,
    featured: true,
    productSku: 'B01M4MCUAF',
    priceCents: 1_999,
    commissionRateBps: 5500,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.4,
    reviewCount: 156_345,
    access: 'partnered',
    isDeal: true,
    dealEndsAt: Date.UTC(2026, 8, 13, 23, 59),
    samplesAvailable: false,
    cpcCents: 100,
    loyaltyBonusCents: 35_000,
  },
  {
    key: 'thread-shopify',
    advertiserKey: 'north-thread',
    providerKey: 'amazon',
    programName: 'Auraglow Attribution',
    offerName: 'LED teeth whitening kit',
    publisherShareBps: 7500,
    attributionWindowDays: 21,
    featured: true,
    productSku: 'B00YI5VJW6',
    priceCents: 4_800,
    commissionRateBps: 4000,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.2,
    reviewCount: 48_632,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: true,
    cpcCents: 50,
    loyaltyBonusCents: 30_000,
  },
  {
    key: 'kitchen-amazon',
    advertiserKey: 'good-day-kitchen',
    providerKey: 'amazon',
    programName: 'Sports Research Attribution',
    offerName: 'Vegan vitamin D3 + K2 · 120 plantgels',
    publisherShareBps: 7000,
    attributionWindowDays: 14,
    featured: false,
    productSku: 'B07NXW4GW7',
    priceCents: 4_395,
    commissionRateBps: 2500,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.8,
    reviewCount: 54_315,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: true,
    cpcCents: 25,
    loyaltyBonusCents: 18_000,
  },
  {
    key: 'notes-impact',
    advertiserKey: 'field-notes-co',
    providerKey: 'impact',
    programName: 'LUXE Bidet Creator Program',
    offerName: 'NEO 185 bidet attachment',
    publisherShareBps: 7900,
    attributionWindowDays: 30,
    featured: false,
    productSku: 'B00P2XZIP2',
    priceCents: 4_999,
    commissionRateBps: 2000,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.6,
    reviewCount: 54_888,
    access: 'eligible',
    isDeal: false,
    samplesAvailable: true,
    cpcCents: 15,
    loyaltyBonusCents: 12_000,
  },
  {
    key: 'skin-shopify',
    advertiserKey: 'kinship-skin',
    providerKey: 'impact',
    programName: 'Hero Cosmetics Creator Program',
    offerName: 'Mighty Patch original · 36 count',
    publisherShareBps: 7700,
    attributionWindowDays: 14,
    featured: true,
    productSku: 'B074PVTPBW',
    priceCents: 1_299,
    commissionRateBps: 4000,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.6,
    reviewCount: 184_570,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: true,
    cpcCents: 40,
    loyaltyBonusCents: 28_000,
  },
  {
    key: 'cycle-impact',
    advertiserKey: 'morrow-cycle',
    providerKey: 'impact',
    programName: "Physician's Choice Creator Program",
    offerName: "Women's probiotic · 50 billion CFU",
    publisherShareBps: 7400,
    attributionWindowDays: 30,
    featured: false,
    productSku: 'B07B8BSGPL',
    priceCents: 2_498,
    commissionRateBps: 3800,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.6,
    reviewCount: 56_772,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: true,
    cpcCents: 50,
    loyaltyBonusCents: 40_000,
  },
  {
    key: 'trail-impact',
    advertiserKey: 'ember-coffee',
    providerKey: 'impact',
    programName: 'Squatty Potty Creator Program',
    offerName: 'Simple Curve toilet stool · 7 inch',
    publisherShareBps: 8100,
    attributionWindowDays: 30,
    featured: false,
    productSku: 'B00HSR1B9W',
    priceCents: 2_299,
    commissionRateBps: 2000,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.6,
    reviewCount: 59_646,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: false,
    cpcCents: 20,
    loyaltyBonusCents: 16_000,
  },
  {
    key: 'lumen-amazon',
    advertiserKey: 'grove-games',
    providerKey: 'amazon',
    programName: 'Zesty Paws Attribution',
    offerName: 'Dog allergy relief chews · 90 count',
    publisherShareBps: 6900,
    attributionWindowDays: 14,
    featured: false,
    productSku: 'B071WCV19B',
    priceCents: 3_297,
    commissionRateBps: 2000,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.2,
    reviewCount: 100_807,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: false,
    cpcCents: 25,
    loyaltyBonusCents: 22_000,
  },
  {
    key: 'kitchen-shopify',
    advertiserKey: 'ember-coffee',
    providerKey: 'amazon',
    programName: 'Squatty Potty Attribution',
    offerName: 'Original toilet stool · 7 inch',
    publisherShareBps: 7600,
    attributionWindowDays: 21,
    featured: false,
    productSku: 'B00ESKVN7W',
    priceCents: 2_499,
    commissionRateBps: 2000,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.6,
    reviewCount: 63_702,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: false,
    cpcCents: 20,
    loyaltyBonusCents: 20_000,
  },
  {
    key: 'ember-shopify',
    advertiserKey: 'axis-travel',
    providerKey: 'impact',
    programName: 'Jacked Factory Creator Program',
    offerName: 'Burn-XT thermogenic supplement · 60 count',
    publisherShareBps: 7800,
    attributionWindowDays: 21,
    featured: false,
    productSku: 'B01BXLYEQ0',
    priceCents: 1_998,
    commissionRateBps: 3000,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 3.8,
    reviewCount: 71_546,
    access: 'eligible',
    isDeal: false,
    samplesAvailable: false,
    cpcCents: 15,
    loyaltyBonusCents: 12_000,
  },
  {
    key: 'games-impact',
    advertiserKey: 'quietform',
    providerKey: 'impact',
    programName: 'RENPHO Creator Program',
    offerName: 'Shiatsu foot massager with heat',
    publisherShareBps: 7300,
    attributionWindowDays: 30,
    featured: false,
    productSku: 'B07F2H1NQR',
    priceCents: 14_998,
    commissionRateBps: 1600,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.2,
    reviewCount: 29_532,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: false,
    cpcCents: 25,
    loyaltyBonusCents: 30_000,
  },
  {
    key: 'axis-impact',
    advertiserKey: 'tide-timber',
    providerKey: 'impact',
    programName: 'BB Company Creator Program',
    offerName: 'Provitalize probiotics · 2 pack',
    publisherShareBps: 8100,
    attributionWindowDays: 30,
    featured: false,
    productSku: 'B089QFPV6X',
    priceCents: 9_799,
    commissionRateBps: 5000,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.0,
    reviewCount: 38_211,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: false,
    cpcCents: 75,
    loyaltyBonusCents: 45_000,
  },
  {
    key: 'quietform-shopify',
    advertiserKey: 'solis-gear',
    providerKey: 'amazon',
    programName: 'Lumineux Attribution',
    offerName: 'Peroxide-free whitening strips · 21 treatments',
    publisherShareBps: 7700,
    attributionWindowDays: 14,
    featured: false,
    productSku: 'B082TPDTM2',
    priceCents: 4_497,
    commissionRateBps: 3000,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.2,
    reviewCount: 33_586,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: false,
    cpcCents: 35,
    loyaltyBonusCents: 24_000,
  },
  {
    key: 'tide-amazon',
    advertiserKey: 'arbor-pets',
    providerKey: 'amazon',
    programName: 'PowerStep Attribution',
    offerName: 'Pinnacle plantar fasciitis insoles',
    publisherShareBps: 7000,
    attributionWindowDays: 14,
    featured: false,
    productSku: 'B000KPOMYU',
    priceCents: 4_999,
    commissionRateBps: 3000,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.5,
    reviewCount: 31_582,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: true,
    cpcCents: 30,
    loyaltyBonusCents: 18_000,
  },
  {
    key: 'solis-impact',
    advertiserKey: 'vera-studio',
    providerKey: 'impact',
    programName: 'Coop Sleep Goods Creator Program',
    offerName: 'Original adjustable memory foam pillow · queen',
    publisherShareBps: 8000,
    attributionWindowDays: 30,
    featured: false,
    productSku: 'B00EINBSEW',
    priceCents: 7_120,
    commissionRateBps: 700,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.5,
    reviewCount: 63_842,
    access: 'partnered',
    isDeal: true,
    samplesAvailable: false,
    cpcCents: 10,
    loyaltyBonusCents: 14_000,
  },
  {
    key: 'arbor-shopify',
    advertiserKey: 'halo-wellness',
    providerKey: 'impact',
    programName: 'COSLUS Creator Program',
    offerName: 'C20 water dental flosser · 300 ml',
    publisherShareBps: 7600,
    attributionWindowDays: 21,
    featured: false,
    productSku: 'B0BG52SJ5N',
    priceCents: 3_998,
    commissionRateBps: 1860,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.4,
    reviewCount: 52_894,
    access: 'partnered',
    isDeal: true,
    samplesAvailable: true,
    cpcCents: 25,
    loyaltyBonusCents: 20_000,
  },
  {
    key: 'vera-impact',
    advertiserKey: 'paper-crane',
    providerKey: 'amazon',
    programName: 'PuroAir Attribution',
    offerName: '130i smart HEPA purifier · 2 pack',
    publisherShareBps: 7900,
    attributionWindowDays: 30,
    featured: true,
    productSku: 'B0F9NVWBMC',
    priceCents: 19_999,
    commissionRateBps: 4000,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.5,
    reviewCount: 19_221,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: false,
    cpcCents: 75,
    loyaltyBonusCents: 50_000,
  },
  {
    key: 'halo-amazon',
    advertiserKey: 'paper-crane',
    providerKey: 'amazon',
    programName: 'PuroAir Canada Attribution',
    offerName: '240 HEPA purifier · 1,000 sq ft',
    publisherShareBps: 7100,
    attributionWindowDays: 14,
    featured: false,
    productSku: 'B0998FWTHP',
    priceCents: 22_200,
    commissionRateBps: 5000,
    marketplace: 'Amazon',
    countryCode: 'CA',
    rating: 4.6,
    reviewCount: 11_769,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: false,
    cpcCents: 50,
    loyaltyBonusCents: 40_000,
  },
  {
    key: 'crane-shopify',
    advertiserKey: 'paper-crane',
    providerKey: 'shopify',
    programName: 'PuroAir Direct',
    offerName: '130i smart HEPA purifier · 1 pack',
    publisherShareBps: 7700,
    attributionWindowDays: 14,
    featured: false,
    productSku: '48301582713078',
    priceCents: 12_499,
    commissionRateBps: 2000,
    marketplace: 'Shopify',
    countryCode: 'US',
    rating: 4.7,
    reviewCount: 2_184,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: true,
    cpcCents: 30,
    loyaltyBonusCents: 30_000,
  },
  {
    key: 'kindred-impact',
    advertiserKey: 'kindred-tech',
    providerKey: 'impact',
    programName: 'hOmeLabs Marketplace Program',
    offerName: 'True HEPA H13 replacement filters · 2 pack',
    publisherShareBps: 8200,
    attributionWindowDays: 30,
    featured: false,
    productSku: '934604251',
    priceCents: 3_699,
    commissionRateBps: 3000,
    marketplace: 'Walmart',
    countryCode: 'US',
    rating: 4.8,
    reviewCount: 1_902,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: false,
    cpcCents: 20,
    loyaltyBonusCents: 18_000,
  },
  {
    key: 'common-shopify',
    advertiserKey: 'common-table',
    providerKey: 'amazon',
    programName: 'Nutricost Attribution',
    offerName: 'Vitamin C with rose hips · 240 capsules',
    publisherShareBps: 7500,
    attributionWindowDays: 21,
    featured: true,
    productSku: 'B074GCB1ND',
    priceCents: 1_795,
    commissionRateBps: 4000,
    marketplace: 'Amazon',
    countryCode: 'US',
    rating: 4.8,
    reviewCount: 24_061,
    access: 'partnered',
    isDeal: false,
    samplesAvailable: false,
    cpcCents: 40,
    loyaltyBonusCents: 32_000,
  },
]

export const programOffers: SeedProgramOffer[] = offerSeeds.map((offer) => ({
  ...offer,
  productImageUrl: `/demo/catalog/products/${offer.key}.jpg`,
}))

const publisherNames = [
  'Northstar Media',
  'Everyday Finds',
  'Signal & Story',
  'The Useful Edit',
  'Cedar House',
  'Brightside Weekly',
  'Honest Kit',
  'Good Measure',
  'Weekend Index',
  'Field Tested',
  'The Daily Detail',
  'Modern Common',
  'Kindred Lists',
  'Plainspoken Goods',
  'Found Well',
]

export const publishers: SeedPublisher[] = publisherNames.map((name, index) => ({
  key: name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, ''),
  name,
  status: index === 1 || index === 12 ? 'pending' : index === 10 ? 'paused' : 'active',
  shareBps: index === 0 ? 8200 : 7400 + ((index * 137) % 700),
}))

export const properties: SeedProperty[] = publishers.flatMap((publisher, index) => {
  const primaryType = (['website', 'newsletter', 'social', 'app'] as const)[index % 4]
  const secondaryType = (['newsletter', 'social', 'website', 'newsletter'] as const)[index % 4]
  return [
    {
      key: `${publisher.key}-primary`,
      publisherKey: publisher.key,
      name:
        index === 0
          ? 'Northstar Living'
          : `${publisher.name} ${primaryType === 'website' ? 'Guide' : 'Main'}`,
      type: primaryType,
      approvalStatus: publisher.status === 'pending' ? 'pending' : 'approved',
      urlOrHandle: `https://${publisher.key}.example`,
    },
    {
      key: `${publisher.key}-secondary`,
      publisherKey: publisher.key,
      name: index === 1 ? 'Everyday Finds Weekly' : `${publisher.name} Notes`,
      type: secondaryType,
      approvalStatus: index === 1 ? 'pending' : 'approved',
      urlOrHandle: `@${publisher.key.replaceAll('-', '')}`,
    },
  ]
})

export const links: SeedLink[] = Array.from({ length: 100 }, (_, index) => {
  const publisher = publishers[index % publishers.length]
  const property =
    properties.find(
      (item) =>
        item.publisherKey === publisher.key &&
        index % 2 === (item.key.endsWith('secondary') ? 1 : 0),
    ) ?? properties[0]
  const offer = programOffers[(index * 5 + 2) % programOffers.length]
  return {
    key: `link-${String(index + 1).padStart(3, '0')}`,
    slug: `o${(index + 1).toString(36).padStart(4, '0')}`,
    publisherKey: publisher.key,
    propertyKey: property.key,
    offerKey: offer.key,
    displayName: `${offer.offerName} · ${index + 1}`,
    createdAt: DEMO_ANCHOR_MS - (99 - index) * 19_800_000,
  }
})

const dailyRandom = lcg(0x0a71_0f5)
export const dailyPerformance: SeedDay[] = Array.from({ length: 90 }, (_, index) => {
  const occurredAt = DEMO_ANCHOR_MS - (89 - index) * DAY_MS
  const weekday = new Date(occurredAt).getUTCDay()
  const seasonality = weekday === 0 || weekday === 6 ? 0.86 : 1
  const growth = 1 + index * 0.0048
  const clicks = Math.round((1_320 + dailyRandom() * 410) * seasonality * growth)
  const conversions = Math.max(1, Math.round(clicks * (0.031 + dailyRandom() * 0.009)))
  const orderValueCents = Math.round(conversions * (7_900 + dailyRandom() * 4_300))
  const grossCommissionCents = Math.round(orderValueCents * (0.112 + dailyRandom() * 0.018))
  const publisherEarningsCents = Math.round(grossCommissionCents * 0.772)
  return {
    date: new Date(occurredAt).toISOString().slice(0, 10),
    occurredAt,
    clicks,
    uniqueClicks: Math.round(clicks * 0.84),
    conversions,
    orderValueCents,
    grossCommissionCents,
    publisherEarningsCents,
    waverlyRevenueCents: grossCommissionCents - publisherEarningsCents,
    reversals: index % 17 === 0 ? 2 : index % 9 === 0 ? 1 : 0,
  }
})

const conversionRandom = lcg(0x0c0f_2026)
export const conversions: SeedConversion[] = Array.from({ length: 180 }, (_, index) => {
  const link = links[(index * 13) % links.length]
  const offer = programOffers.find((item) => item.key === link.offerKey) ?? programOffers[0]
  const advertiser = advertisers.find((item) => item.key === offer.advertiserKey) ?? advertisers[0]
  const publisher = publishers.find((item) => item.key === link.publisherKey) ?? publishers[0]
  const orderValueCents = Math.round(4_500 + conversionRandom() * 24_000)
  const grossCommissionCents = Math.round(orderValueCents * (0.1 + conversionRandom() * 0.05))
  const publisherEarningsCents = Math.round(grossCommissionCents * (publisher.shareBps / 10_000))
  const status =
    index % 31 === 0
      ? 'reversed'
      : index < 38
        ? 'pending'
        : index < 102
          ? 'approved'
          : index < 146
            ? 'locked'
            : 'paid'
  return {
    key: `conversion-${String(index + 1).padStart(4, '0')}`,
    providerKey: offer.providerKey,
    providerTransactionId: `${offer.providerKey.toUpperCase()}-${20260000 + index + 1}`,
    publisherKey: link.publisherKey,
    propertyKey: link.propertyKey,
    advertiserKey: advertiser.key,
    offerKey: offer.key,
    linkKey: link.key,
    occurredAt: DEMO_ANCHOR_MS - (index % 90) * DAY_MS - (index % 19) * 1_800_000,
    status,
    orderValueCents,
    grossCommissionCents,
    publisherEarningsCents,
    waverlyRevenueCents: grossCommissionCents - publisherEarningsCents,
  }
})

export const demoExceptions = [
  { type: 'review', label: 'Everyday Finds is ready for review', detail: '2 properties pending' },
  { type: 'sync', label: 'Shopify sync is delayed', detail: 'Last success 1h 36m ago' },
  {
    type: 'match',
    label: '3 provider records need matching',
    detail: 'Creator Connections · PuroAir',
  },
  { type: 'payout', label: 'One payout needs attention', detail: 'Bank details incomplete' },
] as const

export function summarizePerformance(rows = dailyPerformance) {
  return rows.reduce(
    (total, day) => ({
      clicks: total.clicks + day.clicks,
      uniqueClicks: total.uniqueClicks + day.uniqueClicks,
      conversions: total.conversions + day.conversions,
      orderValueCents: total.orderValueCents + day.orderValueCents,
      grossCommissionCents: total.grossCommissionCents + day.grossCommissionCents,
      publisherEarningsCents: total.publisherEarningsCents + day.publisherEarningsCents,
      waverlyRevenueCents: total.waverlyRevenueCents + day.waverlyRevenueCents,
      reversals: total.reversals + day.reversals,
    }),
    {
      clicks: 0,
      uniqueClicks: 0,
      conversions: 0,
      orderValueCents: 0,
      grossCommissionCents: 0,
      publisherEarningsCents: 0,
      waverlyRevenueCents: 0,
      reversals: 0,
    },
  )
}

export const seedCounts = {
  providers: providers.length,
  advertisers: advertisers.length,
  programs: programOffers.length,
  offers: programOffers.length,
  brandImages: advertisers.length,
  productImages: programOffers.length,
  publishers: publishers.length,
  properties: properties.length,
  links: links.length,
  days: dailyPerformance.length,
  conversions: conversions.length,
}
