import { Thumbnail } from '@waverly/design-system/ui/thumbnail'
import { useSavedProducts } from './use-saved-products'
import {
  AspectRatio,
  Banner,
  Button,
  Card,
  Grid,
  HStack,
  Heading,
  Icon,
  List,
  ListItem,
  MetricGroup,
  ProgressBar,
  Section,
  Selector,
  StatusDot,
  Tab,
  TabList,
  Table,
  Text,
  TextInput,
  Token,
  Toolbar,
  VStack,
  pixel,
  proportional,
  useMediaQuery,
  type TableColumn,
} from '#/features/network/ui/primitives'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Clock3,
  Gift,
  Heart,
  Link2,
  ListChecks,
  MessageSquareText,
  PackageCheck,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { advertisers, conversions, programOffers, providers } from '../../../shared/demoData'

export type DiscoveryView = 'for-you' | 'products' | 'brands' | 'cpc' | 'loyalty' | 'lists'

interface CatalogItem {
  id: string
  name: string
  brand: string
  category: string
  provider: string
  share: number
  attributionDays: number
  fit: number
  reason: string
  access: 'Partnered' | 'Eligible' | 'Review'
  priceCents: number
  conversions: number
  earningsCents: number
  epcCents: number
  remainingClicks: number
  loyaltyBonusCents: number
  imageUrl: string
  brandLogoUrl: string
  productSku: string
  commissionRate: number
  marketplace: string
  countryCode: string
  rating: number
  reviewCount: number
  isDeal: boolean
  samplesAvailable: boolean
}

interface BrandRow extends Record<string, unknown> {
  id: string
  brand: string
  category: string
  offers: string
  rate: string
  performance: string
  earnings: number
  maxShare: number
  fit: number | null
  access: string
  logoUrl: string
}

interface CpcRow extends Record<string, unknown> {
  id: string
  campaign: string
  brand: string
  epc: string
  remaining: string
  potential: string
  fit: number
  state: string
}

interface LoyaltyRow extends Record<string, unknown> {
  id: string
  brand: string
  offer: string
  products: string
  progress: number
  progressLabel: string
  bonus: string
  state: string
}

interface SavedListRow extends Record<string, unknown> {
  id: string
  list: string
  description: string
  products: string
  value: string
  updated: string
  owner: string
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const integer = new Intl.NumberFormat('en-US')
const discoveryViewKey = 'waverly-network.discovery-view.v1'
const catalogImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
}

const reasonByCategory: Record<string, string> = {
  Home: 'Strong overlap with your small-space living coverage',
  Outdoors: 'Seasonal fit for your weekend guide audience',
  Electronics: 'High intent among readers of your gear reviews',
  Apparel: 'Matches your travel and capsule wardrobe content',
  Office: 'Useful for your productivity newsletter segment',
  Beauty: 'Consistent interest from your routine-led content',
  Fitness: 'Growing response from wellness-focused readers',
  'Food & drink': 'High save rate in your weekly recommendations',
  Entertainment: 'Good fit for your social and newsletter formats',
  Travel: 'Relevant to your upcoming city-guide calendar',
  Pets: 'Reliable conversion intent across evergreen guides',
  Wellness: 'Strong audience affinity and repeat purchase potential',
  Software: 'High-value fit for your focused-work audience',
}

const catalog: CatalogItem[] = programOffers.map((offer, index) => {
  const brand = advertisers.find((item) => item.key === offer.advertiserKey)
  const provider = providers.find((item) => item.key === offer.providerKey)
  const offerConversions = conversions.filter((item) => item.offerKey === offer.key)
  const earningsCents = offerConversions.reduce((sum, item) => sum + item.publisherEarningsCents, 0)
  const category = brand?.category ?? 'Lifestyle'
  return {
    id: offer.key,
    name: offer.offerName,
    brand: brand?.name ?? offer.advertiserKey,
    category,
    provider: provider?.name ?? offer.providerKey,
    share: offer.publisherShareBps / 100,
    attributionDays: offer.attributionWindowDays,
    fit: 72 + ((index * 11 + 17) % 27),
    reason: reasonByCategory[category] ?? 'Relevant to your audience and publishing cadence',
    access:
      offer.access === 'review' ? 'Review' : offer.access === 'eligible' ? 'Eligible' : 'Partnered',
    priceCents: offer.priceCents,
    conversions: offerConversions.length,
    earningsCents,
    epcCents: offer.cpcCents,
    remainingClicks: 620 + ((index * 2_311) % 29_000),
    loyaltyBonusCents: offer.loyaltyBonusCents,
    imageUrl: offer.productImageUrl,
    brandLogoUrl: brand?.logoUrl ?? '',
    productSku: offer.productSku,
    commissionRate: offer.commissionRateBps / 100,
    marketplace: offer.marketplace,
    countryCode: offer.countryCode,
    rating: offer.rating,
    reviewCount: offer.reviewCount,
    isDeal: offer.isDeal,
    samplesAvailable: offer.samplesAvailable,
  }
})

const savedLists: SavedListRow[] = [
  {
    id: 'favorites',
    list: 'Favorites',
    description: 'Fast shortlist for ideas worth revisiting',
    products: '8',
    value: '$624',
    updated: 'Today',
    owner: 'You',
  },
  {
    id: 'fall-home',
    list: 'Fall home refresh',
    description: 'Small-space products for September coverage',
    products: '12',
    value: '$1,480',
    updated: '2h ago',
    owner: 'You',
  },
  {
    id: 'newsletter',
    list: 'Newsletter · Aug 31',
    description: 'Six products ready for the weekly send',
    products: '6',
    value: '$537',
    updated: 'Yesterday',
    owner: 'Maya · Waverly',
  },
  {
    id: 'trail',
    list: 'Weekend trail kit',
    description: 'Outdoor picks with 14-day attribution',
    products: '9',
    value: '$892',
    updated: 'Aug 26',
    owner: 'You',
  },
  {
    id: 'editorial',
    list: 'High-confidence evergreen',
    description: '90+ fit products with durable search demand',
    products: '15',
    value: '$2,240',
    updated: 'Aug 23',
    owner: 'Waverly',
  },
  {
    id: 'holiday',
    list: 'Holiday watchlist',
    description: 'Giftable products with room for commission boosts',
    products: '18',
    value: '$3,120',
    updated: 'Aug 20',
    owner: 'You',
  },
]

function statusVariant(value: string): 'success' | 'warning' | 'accent' | 'neutral' {
  if (['Partnered', 'Active', 'Unlocked'].includes(value)) return 'success'
  if (['Review', 'Ending soon'].includes(value)) return 'warning'
  if (['Eligible', 'Available'].includes(value)) return 'accent'
  return 'neutral'
}

function formatMoney(cents: number) {
  return money.format(cents / 100)
}

function formatEpc(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card padding={4}>
      <VStack gap={1}>
        <Text type="supporting" color="secondary" weight="semibold">
          {label.toUpperCase()}
        </Text>
        <Heading level={2}>{value}</Heading>
        <Text type="supporting" color="secondary">
          {detail}
        </Text>
      </VStack>
    </Card>
  )
}

function CatalogCard({
  item,
  isSaved,
  onSave,
  onOpen,
}: {
  item: CatalogItem
  isSaved: boolean
  onSave: () => void
  onOpen: () => void
}) {
  return (
    <Card padding={0} className="waverly-product-card" height="100%">
      <div className="waverly-product-media">
        <AspectRatio ratio={4 / 3} fit="contain">
          <img src={item.imageUrl} alt={item.name} style={catalogImageStyle} loading="lazy" />
        </AspectRatio>
      </div>
      <div className="waverly-product-copy">
        <div className="waverly-product-status">
          <span>
            <StatusDot variant={statusVariant(item.access)} label={`${item.access} access`} />
            {item.access}
          </span>
          <span>{item.fit}% fit</span>
        </div>
        <div>
          <Text type="supporting" color="secondary">
            {item.brand}
          </Text>
          <Heading level={3}>{item.name}</Heading>
        </div>
        <Text type="supporting" color="secondary">
          {item.marketplace} · {item.countryCode} · {item.rating.toFixed(1)} ★
          <span className="sr-only"> out of 5</span>
        </Text>
        <Text type="supporting" color="secondary">
          {item.reason}
        </Text>
        <div className="waverly-product-tags">
          {item.isDeal ? <Token label="Deal live" color="orange" size="sm" /> : null}
          {item.samplesAvailable ? <Token label="Samples" color="green" size="sm" /> : null}
        </div>
        <dl className="waverly-product-terms">
          <div>
            <dt>Publisher share</dt>
            <dd>{item.share.toFixed(0)}%</dd>
          </div>
          <div>
            <dt>Attribution</dt>
            <dd>{item.attributionDays} days</dd>
          </div>
          <div>
            <dt>Retail price</dt>
            <dd>{formatMoney(item.priceCents)}</dd>
          </div>
        </dl>
        <div className="waverly-product-actions">
          <Button
            label="View product"
            icon={<Icon icon={ArrowRight} />}
            variant="secondary"
            size="sm"
            onClick={onOpen}
          />
          <Button
            label={isSaved ? 'Saved' : 'Save'}
            icon={<Icon icon={Heart} />}
            variant="ghost"
            size="sm"
            aria-pressed={isSaved}
            onClick={onSave}
          />
        </div>
      </div>
    </Card>
  )
}

function BrandLogo({ src, name }: { src: string; name: string }) {
  return <Thumbnail src={src} alt={name} fit="cover" size="sm" />
}

const brandPositioning: Record<string, { summary: string; audience: string; content: string }> = {
  Pets: {
    summary:
      'Practical pet-care products built for repeat-purchase routines and high-intent problem solving.',
    audience: 'Pet parents researching everyday health, cleanup, and comfort solutions.',
    content:
      'How-to guides, routine refreshes, before-and-after stories, and evergreen product comparisons.',
  },
  Wellness: {
    summary:
      'Evidence-minded wellness products designed to become part of a consistent daily routine.',
    audience:
      'Readers actively comparing supplements, recovery tools, and preventative wellness products.',
    content:
      'Routine-led reviews, ingredient explainers, long-term tests, and benefit-focused roundups.',
  },
  Beauty: {
    summary:
      'Accessible personal-care products with clear use cases, visible outcomes, and strong repeat intent.',
    audience: 'Beauty shoppers looking for practical routines and credible product demonstrations.',
    content:
      'Routine walkthroughs, tutorials, ingredient education, and honest comparison content.',
  },
  Home: {
    summary:
      'Useful home products that solve recognizable problems without adding complexity to the space.',
    audience:
      'Homeowners and renters investing in comfort, organization, sleep, and cleaner living.',
    content:
      'Room refreshes, problem-solution stories, seasonal guides, and long-term household tests.',
  },
  Fitness: {
    summary:
      'Performance-focused products for readers building sustainable training and recovery habits.',
    audience: 'Active shoppers researching training support, recovery, and measurable progress.',
    content:
      'Training diaries, product comparisons, routine integrations, and goal-based fitness guides.',
  },
}

function ProductDetail({
  item,
  isSaved,
  onSave,
  onBack,
  onOpenBrand,
}: {
  item: CatalogItem
  isSaved: boolean
  onSave: () => void
  onBack: () => void
  onOpenBrand: () => void
}) {
  const [notice, setNotice] = useState<string | null>(null)
  const projectedEarnings = Math.round(
    item.priceCents * (item.commissionRate / 100) * (item.share / 100),
  )
  return (
    <VStack gap={5}>
      <HStack justify="between" align="center" gap={3} wrap="wrap">
        <Button
          label="Back to catalog"
          icon={<Icon icon={ArrowLeft} />}
          variant="ghost"
          size="sm"
          onClick={onBack}
        />
        <HStack gap={2} wrap="wrap">
          <Button
            label={isSaved ? 'Saved' : 'Save product'}
            icon={<Icon icon={Heart} />}
            variant={isSaved ? 'secondary' : 'ghost'}
            size="sm"
            onClick={onSave}
          />
          <Button
            label="Create product link"
            icon={<Icon icon={Link2} />}
            variant="primary"
            size="sm"
            onClick={() =>
              setNotice(
                'A draft tracking link is ready. Choose a property in Tracking to publish it.',
              )
            }
          />
        </HStack>
      </HStack>
      {notice ? (
        <Banner
          status="success"
          title="Draft link created"
          description={notice}
          endContent={
            <Button label="Dismiss" variant="ghost" size="sm" onClick={() => setNotice(null)} />
          }
        />
      ) : null}
      <Grid columns={{ minWidth: 300, max: 2, repeat: 'fit' }} gap={6}>
        <Card padding={5} variant="muted">
          <AspectRatio ratio={4 / 3} fit="contain">
            <img src={item.imageUrl} alt={item.name} style={catalogImageStyle} />
          </AspectRatio>
        </Card>
        <VStack gap={5}>
          <VStack gap={3}>
            <Button
              label={item.brand}
              icon={<Icon icon={Building2} />}
              variant="ghost"
              size="sm"
              onClick={onOpenBrand}
            />
            <VStack gap={1}>
              <Heading level={2} type="display-3">
                {item.name}
              </Heading>
              <Text color="secondary">
                {item.productSku} · {item.marketplace} {item.countryCode} · {item.rating.toFixed(1)}{' '}
                ★ from {integer.format(item.reviewCount)} reviews
              </Text>
            </VStack>
            <HStack gap={2} wrap="wrap">
              <Token label={`${item.fit}% audience fit`} color={item.fit >= 90 ? 'blue' : 'gray'} />
              <Token label={`${item.commissionRate.toFixed(0)}% gross commission`} color="green" />
              {item.samplesAvailable ? <Token label="Sample available" color="blue" /> : null}
              {item.isDeal ? <Token label="Deal live" color="purple" /> : null}
            </HStack>
            <Text>
              {item.reason}. Waverly recommends this product because its commercial terms and
              audience signal are both above the catalog baseline.
            </Text>
          </VStack>
          <Grid columns={{ minWidth: 120, max: 2, repeat: 'fit' }} gap={3}>
            <MetricCard
              label="Typical price"
              value={formatMoney(item.priceCents)}
              detail="Current catalog price"
            />
            <MetricCard
              label="Est. earnings"
              value={formatMoney(projectedEarnings)}
              detail="Per approved order"
            />
            <MetricCard
              label="Publisher share"
              value={`${item.share.toFixed(0)}%`}
              detail="Of gross commission"
            />
            <MetricCard
              label="Attribution"
              value={`${item.attributionDays} days`}
              detail={item.provider}
            />
          </Grid>
        </VStack>
      </Grid>
      <Grid columns={{ minWidth: 280, max: 2, repeat: 'fit' }} gap={5}>
        <Section padding={4}>
          <List
            density="balanced"
            hasDividers
            header={<Heading level={3}>Promotion terms</Heading>}
          >
            <ListItem
              label="Access"
              description={`${item.access} · ${item.marketplace} ${item.countryCode}`}
              startContent={
                <StatusDot variant={statusVariant(item.access)} label={`${item.access} access`} />
              }
            />
            <ListItem
              label="Commission"
              description={`${item.commissionRate.toFixed(0)}% gross rate · ${item.share.toFixed(0)}% publisher share`}
              startContent={<Icon icon={TrendingUp} />}
            />
            <ListItem
              label="Attribution window"
              description={`${item.attributionDays} days from the qualified click`}
              startContent={<Icon icon={Clock3} />}
            />
            <ListItem
              label="Product support"
              description={
                item.samplesAvailable
                  ? 'Samples are currently available'
                  : 'No sample inventory is currently listed'
              }
              startContent={<Icon icon={PackageCheck} />}
            />
          </List>
        </Section>
        <Section padding={4}>
          <List
            density="balanced"
            hasDividers
            header={<Heading level={3}>Why it fits Northstar</Heading>}
          >
            <ListItem
              label="Audience alignment"
              description={item.reason}
              startContent={<Icon icon={Sparkles} />}
            />
            <ListItem
              label="Recent network signal"
              description={`${item.conversions} conversions and ${formatMoney(item.earningsCents)} in publisher earnings in this demo window`}
              startContent={<Icon icon={TrendingUp} />}
            />
            <ListItem
              label="Editorial angle"
              description={`Build a practical ${item.category.toLowerCase()} story around the problem this product solves.`}
              startContent={<Icon icon={ListChecks} />}
            />
          </List>
        </Section>
      </Grid>
    </VStack>
  )
}

function BrandDetail({
  brandId,
  onBack,
  onOpenProduct,
  saved,
  toggleSaved,
}: {
  brandId: string
  onBack: () => void
  onOpenProduct: (item: CatalogItem) => void
  saved: Set<string>
  toggleSaved: (id: string) => void
}) {
  const [tab, setTab] = useState('overview')
  const [notice, setNotice] = useState<string | null>(null)
  const brand = advertisers.find((item) => item.key === brandId)
  if (!brand) return null
  const offers = catalog.filter((item) => item.brand === brand.name)
  const earningsCents = offers.reduce((sum, item) => sum + item.earningsCents, 0)
  const conversionsCount = offers.reduce((sum, item) => sum + item.conversions, 0)
  const fit = Math.max(...offers.map((item) => item.fit), 0)
  const access = offers[0]?.access ?? 'Eligible'
  const positioning = brandPositioning[brand.category] ?? brandPositioning.Wellness

  return (
    <VStack gap={5}>
      <HStack>
        <Button
          label="All brands"
          icon={<Icon icon={ArrowLeft} />}
          variant="ghost"
          size="sm"
          onClick={onBack}
        />
      </HStack>
      <Section variant="muted" padding={5}>
        <VStack gap={5}>
          <HStack justify="between" align="start" gap={5} wrap="wrap">
            <HStack gap={4} align="center">
              <Card padding={2}>
                <BrandLogo src={brand.logoUrl} name={brand.name} />
              </Card>
              <VStack gap={1}>
                <HStack gap={2} wrap="wrap" align="center">
                  <Heading level={2} type="display-3">
                    {brand.name}
                  </Heading>
                  <Token label={`${fit}% fit`} color={fit >= 90 ? 'blue' : 'gray'} />
                </HStack>
                <Text color="secondary">
                  {brand.category} · {offers.length} active{' '}
                  {offers.length === 1 ? 'product' : 'products'}
                </Text>
                <HStack gap={2} align="center">
                  <StatusDot variant={statusVariant(access)} label={`${access} access`} />
                  <Text type="supporting" weight="semibold">
                    {access}
                  </Text>
                </HStack>
              </VStack>
            </HStack>
            <HStack gap={2} wrap="wrap">
              <Button
                label="Message brand"
                icon={<Icon icon={MessageSquareText} />}
                variant="secondary"
                size="sm"
                onClick={() =>
                  setNotice(`A draft conversation with ${brand.name} is ready in Messages.`)
                }
              />
              <Button
                label={access === 'Partnered' ? 'View partnership' : 'Request partnership'}
                icon={<Icon icon={ArrowRight} />}
                variant="primary"
                size="sm"
                onClick={() =>
                  setNotice(
                    access === 'Partnered'
                      ? `${brand.name} is active in your Partnerships workspace.`
                      : `Your request for ${brand.name} is ready for review.`,
                  )
                }
              />
            </HStack>
          </HStack>
          <Text>{positioning.summary}</Text>
          <TabList value={tab} onChange={setTab} size="sm" hasDivider>
            <Tab value="overview" label="Overview" />
            <Tab value="products" label={`Products (${offers.length})`} />
            <Tab value="terms" label="Terms & fit" />
          </TabList>
        </VStack>
      </Section>
      {notice ? (
        <Banner
          status="success"
          title="Action ready"
          description={notice}
          endContent={
            <Button label="Dismiss" variant="ghost" size="sm" onClick={() => setNotice(null)} />
          }
        />
      ) : null}
      {tab === 'overview' ? (
        <VStack gap={5}>
          <Grid columns={{ minWidth: 170, max: 4, repeat: 'fit' }} gap={4}>
            <MetricCard
              label="Recent earnings"
              value={formatMoney(earningsCents)}
              detail="Publisher earnings · 90 days"
            />
            <MetricCard
              label="Conversions"
              value={integer.format(conversionsCount)}
              detail="Across active products"
            />
            <MetricCard
              label="Best commission"
              value={`${Math.max(...offers.map((item) => item.commissionRate), 0).toFixed(0)}%`}
              detail="Gross commission"
            />
            <MetricCard
              label="Best EPC"
              value={formatEpc(Math.max(...offers.map((item) => item.epcCents), 0))}
              detail="Active CPC opportunity"
            />
          </Grid>
          <Grid columns={{ minWidth: 300, max: 2, repeat: 'fit' }} gap={5}>
            <Section padding={4}>
              <List
                density="balanced"
                hasDividers
                header={<Heading level={3}>Brand brief</Heading>}
              >
                <ListItem
                  label="Core audience"
                  description={positioning.audience}
                  startContent={<Icon icon={Search} />}
                />
                <ListItem
                  label="Content that performs"
                  description={positioning.content}
                  startContent={<Icon icon={Sparkles} />}
                />
                <ListItem
                  label="Commercial signal"
                  description={`${fit}% audience fit with ${formatMoney(earningsCents)} in recent publisher earnings.`}
                  startContent={<Icon icon={TrendingUp} />}
                />
              </List>
            </Section>
            <Section padding={4}>
              <List
                density="balanced"
                hasDividers
                header={<Heading level={3}>Relationship</Heading>}
              >
                <ListItem
                  label="Access status"
                  description={`${access} across ${offers.length} catalog ${offers.length === 1 ? 'product' : 'products'}`}
                  startContent={
                    <StatusDot variant={statusVariant(access)} label={`${access} access`} />
                  }
                />
                <ListItem
                  label="Response time"
                  description="Brand team typically responds within 2 business days"
                  startContent={<Icon icon={Clock3} />}
                />
                <ListItem
                  label="Support available"
                  description={
                    offers.some((item) => item.samplesAvailable)
                      ? 'Samples are available for at least one product'
                      : 'Direct messaging and product assets are available'
                  }
                  startContent={<Icon icon={PackageCheck} />}
                />
              </List>
            </Section>
          </Grid>
        </VStack>
      ) : tab === 'products' ? (
        <Grid columns={{ minWidth: 300, max: 3, repeat: 'fit' }} gap={4}>
          {offers.map((item) => (
            <CatalogCard
              key={item.id}
              item={item}
              isSaved={saved.has(item.id)}
              onSave={() => toggleSaved(item.id)}
              onOpen={() => onOpenProduct(item)}
            />
          ))}
        </Grid>
      ) : (
        <VStack gap={4}>
          <Banner
            status="info"
            title="Terms are compared product by product"
            description="Commission, attribution, marketplace, and support can differ inside one brand relationship. Waverly keeps the commercial detail visible before a link is created."
          />
          <Section padding={0}>
            <List
              density="spacious"
              hasDividers
              header={<Heading level={3}>Available programs</Heading>}
            >
              {offers.map((item) => (
                <ListItem
                  key={item.id}
                  label={item.name}
                  description={`${item.marketplace} ${item.countryCode} · ${item.commissionRate.toFixed(0)}% gross commission · ${item.share.toFixed(0)}% publisher share · ${item.attributionDays}-day attribution`}
                  startContent={<BrandLogo src={item.imageUrl} name={item.name} />}
                  endContent={
                    <Button
                      label="View product"
                      icon={<Icon icon={ArrowRight} />}
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenProduct(item)}
                    />
                  }
                />
              ))}
            </List>
          </Section>
        </VStack>
      )}
    </VStack>
  )
}

function CatalogToolbar({
  search,
  onSearch,
  category,
  onCategory,
  resultCount,
}: {
  search: string
  onSearch: (value: string) => void
  category: string
  onCategory: (value: string) => void
  resultCount: number
}) {
  const categories = [
    'All categories',
    ...Array.from(new Set(catalog.map((item) => item.category))),
  ]
  return (
    <Toolbar
      label="Discovery filters"
      size="sm"
      variant="muted"
      startContent={
        <TextInput
          label="Search opportunities"
          isLabelHidden
          placeholder="Search products or brands…"
          value={search}
          onChange={onSearch}
          hasClear
          width={260}
        />
      }
      endContent={
        <HStack gap={2} align="center">
          <Text type="supporting" color="secondary">
            {integer.format(resultCount)} results
          </Text>
          <Selector
            label="Category"
            isLabelHidden
            options={categories}
            value={category}
            onChange={onCategory}
            variant="ghost"
          />
        </HStack>
      }
    />
  )
}

function ForYouView({
  saved,
  toggleSaved,
  onOpenProduct,
}: {
  saved: Set<string>
  toggleSaved: (id: string) => void
  onOpenProduct: (item: CatalogItem) => void
}) {
  const recommendations = [...catalog].sort((a, b) => b.fit - a.fit).slice(0, 4)
  const opportunityValue = recommendations.reduce((sum, item) => sum + item.earningsCents, 0)
  return (
    <VStack gap={5}>
      <MetricGroup
        items={[
          {
            label: 'High-fit matches',
            value: String(catalog.filter((item) => item.fit >= 90).length),
            context: '90% audience fit or better',
          },
          {
            label: 'Opportunity value',
            value: formatMoney(opportunityValue),
            context: 'Recent network earnings',
          },
          { label: 'Bonus available', value: '$980', context: 'Across loyalty programs' },
          { label: 'Ending soon', value: '3', context: 'In the next 7 days' },
        ]}
      />
      <VStack gap={3}>
        <HStack justify="between" align="end" gap={4} wrap="wrap">
          <VStack gap={0.5}>
            <Heading level={2}>Best next opportunities</Heading>
            <Text color="secondary">
              Selected for your audience, ranked by fit and recent performance.
            </Text>
          </VStack>
          <Token label="Updated today" size="sm" />
        </HStack>
        <div className="waverly-product-grid">
          {recommendations.map((item) => (
            <CatalogCard
              key={item.id}
              item={item}
              isSaved={saved.has(item.id)}
              onSave={() => toggleSaved(item.id)}
              onOpen={() => onOpenProduct(item)}
            />
          ))}
        </div>
      </VStack>
      <Section padding={0}>
        <List
          density="balanced"
          hasDividers
          header={<Heading level={2}>Why these are moving up</Heading>}
        >
          <ListItem
            label="Small-space home products are accelerating"
            description="Conversion rate is 22% above your 30-day baseline, led by kitchen and bedroom content."
            startContent={<Icon icon={Sparkles} />}
            endContent={<Token label="Momentum" color="blue" size="sm" />}
          />
          <ListItem
            label="Three loyalty bonuses are within reach"
            description="One more approved sale could unlock $350 across PuroAir and RENPHO."
            startContent={<Icon icon={Gift} />}
            endContent={<Token label="$350 close" color="green" size="sm" />}
          />
          <ListItem
            label="Your September trail guide has an open slot"
            description="Two outdoor offers have above-average attribution windows and available inventory."
            startContent={<Icon icon={ListChecks} />}
            endContent={<Token label="2 matches" size="sm" />}
          />
        </List>
      </Section>
    </VStack>
  )
}

function ProductsView({
  saved,
  toggleSaved,
  onOpenProduct,
}: {
  saved: Set<string>
  toggleSaved: (id: string) => void
  onOpenProduct: (item: CatalogItem) => void
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All categories')
  const isNarrow = useMediaQuery('(max-width: 768px)')
  const categories = [
    'All categories',
    ...Array.from(new Set(catalog.map((item) => item.category))),
  ]
  const normalized = search.trim().toLowerCase()
  const visible = catalog.filter((item) => {
    const matchesCategory = category === 'All categories' || item.category === category
    const matchesSearch =
      !normalized ||
      [item.name, item.brand, item.category].some((value) =>
        value.toLowerCase().includes(normalized),
      )
    return matchesCategory && matchesSearch
  })
  return (
    <VStack gap={4}>
      {isNarrow ? (
        <VStack gap={2}>
          <TextInput
            label="Search opportunities"
            isLabelHidden
            placeholder="Search products or brands…"
            value={search}
            onChange={setSearch}
            hasClear
            width="100%"
          />
          <Selector
            label="Category"
            isLabelHidden
            options={categories}
            value={category}
            onChange={setCategory}
            width="100%"
          />
          <Text type="supporting" color="secondary">
            {integer.format(visible.length)} results
          </Text>
        </VStack>
      ) : (
        <CatalogToolbar
          search={search}
          onSearch={setSearch}
          category={category}
          onCategory={setCategory}
          resultCount={visible.length}
        />
      )}
      <div className="waverly-product-grid">
        {visible.map((item) => (
          <CatalogCard
            key={item.id}
            item={item}
            isSaved={saved.has(item.id)}
            onSave={() => toggleSaved(item.id)}
            onOpen={() => onOpenProduct(item)}
          />
        ))}
      </div>
    </VStack>
  )
}

function BrandsView({ onOpenBrand }: { onOpenBrand: (brandId: string) => void }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All categories')
  const [access, setAccess] = useState('All access')
  const [sort, setSort] = useState('Best fit')
  const allRows: BrandRow[] = advertisers.map((brand) => {
    const offers = catalog.filter((item) => item.brand === brand.name)
    const minShare = Math.min(...offers.map((item) => item.share))
    const maxShare = Math.max(...offers.map((item) => item.share))
    const earnings = offers.reduce((sum, item) => sum + item.earningsCents, 0)
    return {
      id: brand.key,
      brand: brand.name,
      category: brand.category,
      offers: integer.format(offers.length),
      rate: !offers.length
        ? '—'
        : minShare === maxShare
          ? `${minShare.toFixed(0)}%`
          : `${minShare.toFixed(0)}–${maxShare.toFixed(0)}%`,
      maxShare: offers.length ? maxShare : 0,
      earnings,
      performance: formatMoney(earnings),
      fit: offers[0]?.fit ?? null,
      access: offers[0]?.access ?? 'Eligible',
      logoUrl: brand.logoUrl,
    }
  })
  const normalized = search.trim().toLowerCase()
  const rows = allRows
    .filter(
      (row) =>
        (!normalized ||
          [row.brand, row.category, row.access].some((value) =>
            value.toLowerCase().includes(normalized),
          )) &&
        (category === 'All categories' || row.category === category) &&
        (access === 'All access' || row.access === access),
    )
    .sort((a, b) => {
      if (sort === 'Brand name') return a.brand.localeCompare(b.brand)
      if (sort === 'Highest earnings') return b.earnings - a.earnings
      if (sort === 'Highest share') return b.maxShare - a.maxShare
      return (b.fit ?? -1) - (a.fit ?? -1)
    })
  const hasFilters = Boolean(search || category !== 'All categories' || access !== 'All access')
  const resetFilters = () => {
    setSearch('')
    setCategory('All categories')
    setAccess('All access')
  }
  const fitIndicator = (row: BrandRow) => (
    <span className="waverly-fit">
      {row.fit === null ? (
        <>
          <span aria-hidden="true">—</span>
          <span className="sr-only">Fit unavailable</span>
        </>
      ) : (
        <>
          <span className="waverly-fit-track" aria-hidden="true">
            <span style={{ width: `${row.fit}%` }} />
          </span>
          <span>{row.fit}%</span>
        </>
      )}
    </span>
  )
  const brandButton = (row: BrandRow) => (
    <button
      type="button"
      className="waverly-brand-link"
      aria-label={`View ${row.brand}`}
      onClick={() => onOpenBrand(row.id)}
    >
      <BrandLogo src={row.logoUrl} name={row.brand} />
      <span>{row.brand}</span>
    </button>
  )
  const accessStatus = (row: BrandRow) => (
    <Token
      label={row.access}
      color={row.access === 'Partnered' ? 'green' : row.access === 'Review' ? 'orange' : 'blue'}
      size="sm"
    />
  )
  const columns: TableColumn<BrandRow>[] = [
    { key: 'brand', header: 'Brand', width: proportional(2.5), renderCell: brandButton },
    { key: 'category', header: 'Category', width: pixel(100) },
    { key: 'access', header: 'Access', width: pixel(110), renderCell: accessStatus },
    { key: 'offers', header: 'Offers', width: pixel(60), align: 'end' },
    { key: 'rate', header: 'Publisher share', width: pixel(120), align: 'end' },
    { key: 'performance', header: 'Network earnings', width: pixel(135), align: 'end' },
    {
      key: 'fit',
      header: 'Audience fit',
      width: pixel(125),
      align: 'end',
      renderCell: fitIndicator,
    },
  ]
  return (
    <section className="waverly-brand-catalog" aria-label="Brand catalog">
      <div className="waverly-catalog-intro">
        <div>
          <Heading level={2}>Find your next brand partner</Heading>
          <Text color="secondary">Compare audience fit, access, and earning potential.</Text>
        </div>
        <details className="waverly-catalog-help">
          <summary>How to compare</summary>
          <p>
            Publisher share is your share of commission, not the product price. Network earnings
            show recent activity across the demo network. Audience fit is a sample alignment score.
            Review means approval is required.
          </p>
        </details>
      </div>
      <Card padding={0} className="waverly-catalog-surface">
        <fieldset className="waverly-catalog-controls" aria-label="Brand catalog controls">
          <TextInput
            label="Search brands"
            isLabelHidden
            placeholder="Search brands or categories…"
            value={search}
            onChange={setSearch}
            hasClear
            startIcon={Search}
          />
          <Selector
            label="Category"
            className="data-[size=default]:h-[var(--control-height)]"
            isLabelHidden
            options={[
              'All categories',
              ...Array.from(new Set(allRows.map((row) => row.category))).sort(),
            ]}
            value={category}
            onChange={setCategory}
          />
          <Selector
            label="Access"
            className="data-[size=default]:h-[var(--control-height)]"
            isLabelHidden
            options={['All access', 'Partnered', 'Eligible', 'Review']}
            value={access}
            onChange={setAccess}
          />
          <Selector
            label="Sort brands"
            className="data-[size=default]:h-[var(--control-height)]"
            isLabelHidden
            options={['Best fit', 'Brand name', 'Highest earnings', 'Highest share']}
            value={sort}
            onChange={setSort}
          />
        </fieldset>
        <div className="waverly-catalog-results">
          <output>
            {rows.length} of {allRows.length} brands
          </output>
          {hasFilters ? (
            <button type="button" onClick={resetFilters}>
              Clear filters
            </button>
          ) : (
            <span>USD · Sample data</span>
          )}
        </div>
        {rows.length ? (
          <>
            <div className="waverly-catalog-desktop">
              <Table
                label="Brands"
                data={rows}
                columns={columns}
                idKey="id"
                density="balanced"
                dividers="rows"
                hasHover
                textOverflow="truncate"
              />
            </div>
            <ul className="waverly-catalog-mobile" aria-label="Brands">
              {rows.map((row) => (
                <li key={row.id}>
                  <div className="waverly-brand-summary">
                    {brandButton(row)}
                    {accessStatus(row)}
                  </div>
                  <div className="waverly-brand-category">
                    {row.category} · {row.offers} {row.offers === '1' ? 'offer' : 'offers'}
                  </div>
                  <dl>
                    <div>
                      <dt>Publisher share</dt>
                      <dd>{row.rate}</dd>
                    </div>
                    <div>
                      <dt>Network earnings</dt>
                      <dd>{row.performance}</dd>
                    </div>
                    <div>
                      <dt>Audience fit</dt>
                      <dd>{fitIndicator(row)}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="waverly-catalog-empty">
            <Search aria-hidden="true" />
            <Heading level={3}>No brands match your filters</Heading>
            <Text color="secondary">Try another name or clear the filters to see all brands.</Text>
            <Button label="Reset filters" variant="secondary" onClick={resetFilters} />
          </div>
        )}
      </Card>
    </section>
  )
}

function CpcView() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('Best fit')
  const [preview, setPreview] = useState<string | null>(null)
  const isNarrow = useMediaQuery('(max-width: 768px)')
  const sortedCatalog = [...catalog].sort((a, b) => {
    if (sort === 'Highest EPC') return b.epcCents - a.epcCents
    if (sort === 'Most remaining clicks') return b.remainingClicks - a.remainingClicks
    if (sort === 'Ending soon')
      return Number(catalog.indexOf(a) % 8 !== 0) - Number(catalog.indexOf(b) % 8 !== 0)
    return b.fit - a.fit
  })
  const allRows: CpcRow[] = sortedCatalog.map((item) => ({
    id: item.id,
    campaign: item.name,
    brand: item.brand,
    epc: formatEpc(item.epcCents),
    remaining: integer.format(item.remainingClicks),
    potential: formatMoney(item.epcCents * item.remainingClicks),
    fit: item.fit,
    state: catalog.indexOf(item) % 8 === 0 ? 'Ending soon' : 'Active',
  }))
  const normalized = search.trim().toLowerCase()
  const rows = allRows.filter(
    (row) =>
      !normalized ||
      [row.campaign, row.brand, row.state].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
  )
  const columns: TableColumn<CpcRow>[] = [
    {
      key: 'campaign',
      header: 'Campaign',
      width: proportional(3),
      renderCell: (row) => (
        <VStack gap={0.5}>
          <Text weight="semibold">{row.campaign}</Text>
          <Text type="supporting" color="secondary">
            {row.brand}
          </Text>
        </VStack>
      ),
    },
    {
      key: 'state',
      header: 'State',
      width: pixel(125),
      renderCell: (row) => (
        <HStack gap={2} align="center">
          <StatusDot variant={statusVariant(row.state)} label={`${row.state} campaign`} />
          <Text>{row.state}</Text>
        </HStack>
      ),
    },
    {
      key: 'epc',
      header: 'EPC',
      width: pixel(100),
      align: 'end',
      renderCell: (row) => <Text weight="semibold">{row.epc}</Text>,
    },
    { key: 'remaining', header: 'Clicks left', width: pixel(115), align: 'end' },
    { key: 'potential', header: 'Potential', width: pixel(120), align: 'end' },
    {
      key: 'fit',
      header: 'Fit',
      width: pixel(85),
      align: 'end',
      renderCell: (row) => (
        <Token label={`${row.fit}%`} color={row.fit >= 90 ? 'blue' : 'gray'} size="sm" />
      ),
    },
    {
      key: 'id',
      header: '',
      width: pixel(120),
      align: 'end',
      renderCell: (row) => (
        <Button
          label="Preview"
          variant="ghost"
          size="sm"
          onClick={() => setPreview(row.campaign)}
        />
      ),
    },
  ]
  return (
    <VStack gap={4}>
      <Grid columns={{ minWidth: 220, max: 3, repeat: 'fit' }} gap={4}>
        <MetricCard label="Highest EPC" value="$1.00" detail="2 active campaigns" />
        <MetricCard label="Available clicks" value="312K" detail="Across 24 campaigns" />
        <MetricCard label="Potential earnings" value="$18.4K" detail="At current campaign caps" />
      </Grid>
      {preview ? (
        <Banner
          status="info"
          title={`${preview} selected`}
          description="Campaign preview opened locally. No campaign was joined and no external state changed."
          endContent={
            <Button
              label="Close preview"
              variant="ghost"
              size="sm"
              onClick={() => setPreview(null)}
            />
          }
        />
      ) : null}
      {isNarrow ? (
        <VStack gap={3}>
          <TextInput
            label="Search CPC campaigns"
            isLabelHidden
            placeholder="Search campaigns…"
            value={search}
            onChange={setSearch}
            hasClear
            width="100%"
          />
          <Selector
            label="Sort campaigns"
            isLabelHidden
            options={['Best fit', 'Highest EPC', 'Most remaining clicks', 'Ending soon']}
            value={sort}
            onChange={setSort}
            width="100%"
          />
          <List
            density="balanced"
            hasDividers
            header={<Text weight="semibold">{rows.length} campaigns</Text>}
          >
            {rows.map((row) => (
              <ListItem
                key={row.id}
                label={row.campaign}
                description={`${row.brand} · ${row.epc} EPC · ${row.remaining} clicks left · ${row.potential} potential`}
                startContent={
                  <StatusDot variant={statusVariant(row.state)} label={`${row.state} campaign`} />
                }
                endContent={
                  <Button
                    label="Preview"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreview(row.campaign)}
                  />
                }
              />
            ))}
          </List>
        </VStack>
      ) : (
        <Card padding={0}>
          <VStack gap={0}>
            <Toolbar
              label="CPC campaign controls"
              size="sm"
              variant="muted"
              dividers={['bottom']}
              startContent={
                <TextInput
                  label="Search CPC campaigns"
                  isLabelHidden
                  placeholder="Search CPC campaigns…"
                  value={search}
                  onChange={setSearch}
                  hasClear
                  width={260}
                />
              }
              endContent={
                <Selector
                  label="Sort campaigns"
                  isLabelHidden
                  options={['Best fit', 'Highest EPC', 'Most remaining clicks', 'Ending soon']}
                  value={sort}
                  onChange={setSort}
                  variant="ghost"
                />
              }
            />
            <Table
              data={rows}
              columns={columns}
              idKey="id"
              density="balanced"
              dividers="rows"
              hasHover
              textOverflow="truncate"
            />
          </VStack>
        </Card>
      )}
    </VStack>
  )
}

function LoyaltyView() {
  const [search, setSearch] = useState('')
  const isNarrow = useMediaQuery('(max-width: 768px)')
  const allRows: LoyaltyRow[] = catalog.slice(0, 14).map((item, index) => {
    const progress = 35 + ((index * 13) % 62)
    return {
      id: item.id,
      brand: item.brand,
      offer: item.name,
      products: integer.format(2 + (index % 8)),
      progress,
      progressLabel: `${progress}% to next bonus`,
      bonus: formatMoney(item.loyaltyBonusCents),
      state: progress >= 90 ? 'Unlocked' : 'Available',
    }
  })
  const normalized = search.trim().toLowerCase()
  const rows = allRows.filter(
    (row) =>
      !normalized ||
      [row.brand, row.offer, row.state].some((value) => value.toLowerCase().includes(normalized)),
  )
  const columns: TableColumn<LoyaltyRow>[] = [
    {
      key: 'brand',
      header: 'Brand',
      width: proportional(2),
      renderCell: (row) => (
        <VStack gap={0.5}>
          <Text weight="semibold">{row.brand}</Text>
          <Text type="supporting" color="secondary">
            {row.offer}
          </Text>
        </VStack>
      ),
    },
    { key: 'products', header: 'Products', width: pixel(100), align: 'end' },
    {
      key: 'progress',
      header: 'Progress',
      width: proportional(2),
      renderCell: (row) => (
        <ProgressBar
          label={`Progress for ${row.brand}`}
          value={row.progress}
          max={100}
          isLabelHidden
          hasValueLabel
          formatValueLabel={() => row.progressLabel}
        />
      ),
    },
    {
      key: 'bonus',
      header: 'Next bonus',
      width: pixel(130),
      align: 'end',
      renderCell: (row) => <Text weight="semibold">{row.bonus}</Text>,
    },
    {
      key: 'state',
      header: 'State',
      width: pixel(120),
      renderCell: (row) => (
        <HStack gap={2} align="center">
          <StatusDot variant={statusVariant(row.state)} label={`${row.state} bonus`} />
          <Text>{row.state}</Text>
        </HStack>
      ),
    },
  ]
  return (
    <VStack gap={4}>
      <Banner
        status="success"
        title="$980 in reachable bonuses"
        description="Waverly ranks programs by distance to the next payout, so the most actionable bonuses are visible first."
        endContent={
          <Button
            label="View bonus strategy"
            icon={<Icon icon={Trophy} />}
            variant="secondary"
            size="sm"
          />
        }
      />
      {isNarrow ? (
        <VStack gap={3}>
          <TextInput
            label="Search loyalty programs"
            isLabelHidden
            placeholder="Search brands or offers…"
            value={search}
            onChange={setSearch}
            hasClear
            width="100%"
          />
          <List
            density="balanced"
            hasDividers
            header={<Text weight="semibold">{rows.length} loyalty programs</Text>}
          >
            {rows.map((row) => (
              <ListItem
                key={row.id}
                label={row.brand}
                description={`${row.offer} · ${row.progressLabel}`}
                startContent={
                  <StatusDot variant={statusVariant(row.state)} label={`${row.state} bonus`} />
                }
                endContent={
                  <Token
                    label={`${row.bonus} next`}
                    color={row.state === 'Unlocked' ? 'green' : 'blue'}
                    size="sm"
                  />
                }
              />
            ))}
          </List>
        </VStack>
      ) : (
        <Card padding={0}>
          <VStack gap={0}>
            <Toolbar
              label="Loyalty program controls"
              size="sm"
              variant="muted"
              dividers={['bottom']}
              startContent={
                <TextInput
                  label="Search loyalty programs"
                  isLabelHidden
                  placeholder="Search brands or offers…"
                  value={search}
                  onChange={setSearch}
                  hasClear
                  width={260}
                />
              }
              endContent={
                <Text type="supporting" color="secondary">
                  {rows.length} active programs
                </Text>
              }
            />
            <Table
              data={rows}
              columns={columns}
              idKey="id"
              density="balanced"
              dividers="rows"
              hasHover
              textOverflow="truncate"
            />
          </VStack>
        </Card>
      )}
    </VStack>
  )
}

function ListsView() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('Recent activity')
  const [selectedList, setSelectedList] = useState<string | null>(null)
  const isNarrow = useMediaQuery('(max-width: 768px)')
  const normalized = search.trim().toLowerCase()
  const rows = savedLists
    .filter(
      (row) =>
        !normalized ||
        [row.list, row.description, row.owner].some((value) =>
          value.toLowerCase().includes(normalized),
        ),
    )
    .sort((a, b) => {
      if (sort === 'Most products') return Number(b.products) - Number(a.products)
      if (sort === 'Highest value')
        return Number(b.value.replaceAll(/[$,]/g, '')) - Number(a.value.replaceAll(/[$,]/g, ''))
      if (sort === 'Name') return a.list.localeCompare(b.list)
      return (
        savedLists.findIndex((item) => item.id === a.id) -
        savedLists.findIndex((item) => item.id === b.id)
      )
    })
  const columns: TableColumn<SavedListRow>[] = [
    {
      key: 'list',
      header: 'List',
      width: proportional(3),
      renderCell: (row) => (
        <VStack gap={0.5}>
          <Text weight="semibold">{row.list}</Text>
          <Text type="supporting" color="secondary">
            {row.description}
          </Text>
        </VStack>
      ),
    },
    { key: 'products', header: 'Products', width: pixel(100), align: 'end' },
    { key: 'value', header: 'Catalog value', width: pixel(125), align: 'end' },
    { key: 'owner', header: 'Created by', width: pixel(140) },
    { key: 'updated', header: 'Last activity', width: pixel(120) },
    {
      key: 'id',
      header: '',
      width: pixel(110),
      align: 'end',
      renderCell: (row) => (
        <Button label="Open" variant="ghost" size="sm" onClick={() => setSelectedList(row.list)} />
      ),
    },
  ]
  return (
    <VStack gap={4}>
      <HStack justify="between" align="end" gap={4} wrap="wrap">
        <VStack gap={0.5}>
          <Heading level={2}>Saved collections</Heading>
          <Text color="secondary">
            Editorial lists keep research, economics, and publishing context together.
          </Text>
        </VStack>
        <Button label="New list" icon={<Icon icon={ListChecks} />} variant="primary" size="sm" />
      </HStack>
      {selectedList ? (
        <Banner
          status="info"
          title={`${selectedList} opened`}
          description="This local preview keeps the list context visible without navigating away from Discovery."
          endContent={
            <Button label="Close" variant="ghost" size="sm" onClick={() => setSelectedList(null)} />
          }
        />
      ) : null}
      {isNarrow ? (
        <VStack gap={3}>
          <TextInput
            label="Search saved lists"
            isLabelHidden
            placeholder="Search lists…"
            value={search}
            onChange={setSearch}
            hasClear
            width="100%"
          />
          <Selector
            label="Sort lists"
            isLabelHidden
            options={['Recent activity', 'Most products', 'Highest value', 'Name']}
            value={sort}
            onChange={setSort}
            width="100%"
          />
          <List
            density="balanced"
            hasDividers
            header={<Text weight="semibold">{rows.length} saved lists</Text>}
          >
            {rows.map((row) => (
              <ListItem
                key={row.id}
                label={row.list}
                description={`${row.description} · ${row.products} products · ${row.value}`}
                startContent={<Icon icon={ListChecks} />}
                endContent={
                  <Button
                    label="Open"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedList(row.list)}
                  />
                }
              />
            ))}
          </List>
        </VStack>
      ) : (
        <Card padding={0}>
          <VStack gap={0}>
            <Toolbar
              label="Saved list controls"
              size="sm"
              variant="muted"
              dividers={['bottom']}
              startContent={
                <TextInput
                  label="Search saved lists"
                  isLabelHidden
                  placeholder="Search lists…"
                  value={search}
                  onChange={setSearch}
                  hasClear
                  width={240}
                />
              }
              endContent={
                <Selector
                  label="Sort lists"
                  isLabelHidden
                  options={['Recent activity', 'Most products', 'Highest value', 'Name']}
                  value={sort}
                  onChange={setSort}
                  variant="ghost"
                />
              }
            />
            <Table
              data={rows}
              columns={columns}
              idKey="id"
              density="spacious"
              dividers="rows"
              hasHover
              textOverflow="truncate"
            />
          </VStack>
        </Card>
      )}
    </VStack>
  )
}

export function DiscoverySurface({
  identity,
  view,
  onSurfaceChange,
}: {
  identity: string
  view: DiscoveryView
  onSurfaceChange?: () => void
}) {
  const [saved, setSaved] = useSavedProducts(
    identity,
    catalog.filter((_, index) => index % 6 === 0).map((item) => item.id),
  )
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null)

  useEffect(() => {
    try {
      window.sessionStorage.setItem(discoveryViewKey, view)
    } catch {
      /* Optional demo preference. */
    }
  }, [view])

  const toggleSaved = (id: string) => {
    setSaved((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const resetScroll = () => window.requestAnimationFrame(() => onSurfaceChange?.())
  const openProduct = (item: CatalogItem) => {
    setSelectedProduct(item)
    resetScroll()
  }
  const openBrand = (brandId: string) => {
    setSelectedBrandId(brandId)
    setSelectedProduct(null)
    resetScroll()
  }

  const openBrandForProduct = (item: CatalogItem) => {
    const brand = advertisers.find((candidate) => candidate.name === item.brand)
    if (brand) openBrand(brand.key)
  }

  if (selectedProduct) {
    return (
      <ProductDetail
        item={selectedProduct}
        isSaved={saved.has(selectedProduct.id)}
        onSave={() => toggleSaved(selectedProduct.id)}
        onBack={() => {
          setSelectedProduct(null)
          resetScroll()
        }}
        onOpenBrand={() => openBrandForProduct(selectedProduct)}
      />
    )
  }

  if (selectedBrandId) {
    return (
      <BrandDetail
        brandId={selectedBrandId}
        onBack={() => {
          setSelectedBrandId(null)
          resetScroll()
        }}
        onOpenProduct={openProduct}
        saved={saved}
        toggleSaved={toggleSaved}
      />
    )
  }

  let content
  if (view === 'for-you')
    content = <ForYouView saved={saved} toggleSaved={toggleSaved} onOpenProduct={openProduct} />
  else if (view === 'products')
    content = <ProductsView saved={saved} toggleSaved={toggleSaved} onOpenProduct={openProduct} />
  else if (view === 'brands') content = <BrandsView onOpenBrand={openBrand} />
  else if (view === 'cpc') content = <CpcView />
  else if (view === 'loyalty') content = <LoyaltyView />
  else content = <ListsView />

  return <VStack gap={5}>{content}</VStack>
}
