import { Thumbnail } from '@waverly/design-system/ui/thumbnail'
import {
  Avatar,
  AvatarStatusDot,
  Banner,
  Button,
  Card,
  Divider,
  Grid,
  HStack,
  Heading,
  Icon,
  List,
  ListItem,
  NumberInput,
  ProgressBar,
  Section,
  Selector,
  StatusDot,
  Switch,
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
  type TableColumn,
} from '#/features/network/ui/primitives'
import {
  BadgeDollarSign,
  BarChart3,
  Building2,
  Check,
  ClipboardCheck,
  Copy,
  FileText,
  Gift,
  HandCoins,
  Handshake,
  Megaphone,
  MousePointerClick,
  PackageCheck,
  PackageSearch,
  ReceiptText,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  Store,
  Tags,
  TrendingUp,
  UserCheck,
  Users,
  WalletCards,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { dailyPerformance, programOffers, type SeedProgramOffer } from '../../../shared/demoData'
import {
  sellerApplications,
  sellerCampaigns,
  sellerChannels,
  sellerCreators,
  sellerInvoices,
  sellerPlacements,
  sellerReportHighlights,
  sellerSamples,
  type SellerApplication,
  type SellerCreatorProfile,
  type SellerPlacement,
  type SellerSampleRequest,
} from '../../../shared/demoSellerData'
import { ReportingChart, type ReportRankingPoint, type ReportTrendPoint } from './ReportingChart'

export type SellerPage =
  | 'Overview'
  | 'Brand profile'
  | 'Products & commissions'
  | 'Deals & CPC'
  | 'Samples'
  | 'Creator directory'
  | 'Applications'
  | 'Partnerships'
  | 'Paid placements'
  | 'Performance'
  | 'Deep reports'
  | 'Billing'

type Notice = { status: 'success' | 'info' | 'warning'; title: string; description: string } | null

interface ProductRow extends Record<string, unknown> {
  id: string
  offer: SeedProgramOffer
  product: string
  marketplace: string
  priceCents: number
  commissionBps: number
  privateRate: string
  state: 'Active' | 'Paused'
}

interface CreatorRow extends Record<string, unknown> {
  id: string
  creator: SellerCreatorProfile
  name: string
  audience: number
  clicks: number
  salesCents: number
  rate: number
  status: SellerCreatorProfile['status']
}

interface InvoiceRow extends Record<string, unknown> {
  id: string
  period: string
  saasCents: number
  commissionsCents: number
  placementsCents: number
  totalCents: number
  status: 'Open' | 'Paid'
  due: string
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const integer = new Intl.NumberFormat('en-US')
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

const puroAirOffers = programOffers.filter((offer) => offer.advertiserKey === 'paper-crane')

function creatorById(id: string) {
  return sellerCreators.find((creator) => creator.id === id) ?? sellerCreators[0]
}

function offerByKey(key: string) {
  return programOffers.find((offer) => offer.key === key) ?? programOffers[0]
}

function formatMoney(cents: number) {
  return money.format(cents / 100)
}

function CreatorIdentity({
  creator,
  supporting,
}: {
  creator: SellerCreatorProfile
  supporting?: string
}) {
  return (
    <HStack gap={3} align="center">
      <Avatar
        name={creator.name}
        size="md"
        status={
          <AvatarStatusDot
            variant={creator.status === 'Partnered' ? 'success' : 'neutral'}
            label={creator.status}
          />
        }
      />
      <VStack gap={0.5}>
        <Text weight="semibold">{creator.name}</Text>
        <Text type="supporting" color="secondary">
          {supporting ?? `${creator.creatorType} · ${creator.platforms.join(' + ')}`}
        </Text>
      </VStack>
    </HStack>
  )
}

function ProductIdentity({ offer }: { offer: SeedProgramOffer }) {
  return (
    <HStack gap={3} align="center">
      <ProductThumb offer={offer} />
      <VStack gap={0.5}>
        <Text weight="semibold">{offer.offerName}</Text>
        <Text type="supporting" color="secondary">
          {offer.productSku} · {offer.marketplace} {offer.countryCode}
        </Text>
      </VStack>
    </HStack>
  )
}

function ProductThumb({ offer }: { offer: SeedProgramOffer }) {
  return <Thumbnail src={offer.productImageUrl} alt={offer.offerName} />
}

function PageContext({
  icon,
  title,
  description,
  meta,
}: {
  icon: typeof Store
  title: string
  description: string
  meta: string
}) {
  return (
    <Section variant="muted" padding={5}>
      <HStack justify="between" align="center" gap={4} wrap="wrap">
        <HStack gap={3} align="center">
          <Icon icon={icon} color="accent" size="lg" />
          <VStack gap={0.5}>
            <Text weight="semibold">{title}</Text>
            <Text color="secondary">{description}</Text>
          </VStack>
        </HStack>
        <Text type="supporting" color="secondary">
          {meta}
        </Text>
      </HStack>
    </Section>
  )
}

function MetricStrip() {
  const metrics = [
    { label: 'Attributed sales', value: '$184,620', detail: '+18.4% vs prior period' },
    { label: 'Creator conversions', value: '1,684', detail: '3.92% conversion rate' },
    { label: 'Creator commissions', value: '$18,940', detail: '10.3% blended rate' },
    { label: 'Program ROAS', value: '8.4×', detail: 'Including paid placements' },
  ]
  return (
    <Grid columns={{ minWidth: 170, max: 4, repeat: 'fit' }} gap={3}>
      {metrics.map((metric, index) => (
        <Card
          key={metric.label}
          padding={4}
          variant={index === 0 ? 'blue' : 'default'}
          height="100%"
        >
          <VStack gap={1}>
            <Text type="supporting" color="secondary" weight="semibold">
              {metric.label.toUpperCase()}
            </Text>
            <Text type="display-3" weight="semibold" hasTabularNumbers>
              {metric.value}
            </Text>
            <Text type="supporting" color="secondary">
              {metric.detail}
            </Text>
          </VStack>
        </Card>
      ))}
    </Grid>
  )
}

function SellerOverview({ onNavigate }: { onNavigate: (page: string) => void }) {
  const trend: ReportTrendPoint[] = dailyPerformance.slice(-30).map((day) => ({
    id: day.date,
    label: day.date,
    value: (day.orderValueCents * 0.118) / 100,
  }))
  const leaders = sellerCreators
    .filter((creator) => creator.status === 'Partnered')
    .slice()
    .sort((a, b) => b.salesCents - a.salesCents)
    .slice(0, 5)
  return (
    <VStack gap={6}>
      <Banner
        status="warning"
        title="Three creator decisions are waiting"
        description="Two sample requests and one application can move today. PuroAir's 130i launch campaign has 30% of its CPC budget remaining."
        endContent={
          <Button
            label="Review queue"
            icon={<Icon icon={ClipboardCheck} />}
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('Applications')}
          />
        }
      />
      <MetricStrip />
      <Grid columns={{ minWidth: 360, max: 2, repeat: 'fit' }} gap={5}>
        <Card padding={5} height="100%">
          <VStack gap={4}>
            <HStack justify="between" align="end" gap={3}>
              <VStack gap={0.5}>
                <Heading level={2}>Program sales</Heading>
                <Text color="secondary">Attributed order value across Amazon and Shopify</Text>
              </VStack>
              <Token label="30 days" size="sm" />
            </HStack>
            <ReportingChart
              mode="trend"
              trend={trend}
              metricLabel="Attributed sales"
              ariaLabel="PuroAir attributed sales over the last 30 days"
            />
          </VStack>
        </Card>
        <Section padding={0}>
          <List
            density="balanced"
            hasDividers
            header={
              <HStack justify="between" align="end">
                <VStack gap={0.5}>
                  <Heading level={2}>Action queue</Heading>
                  <Text color="secondary">Ordered by revenue impact and deadline</Text>
                </VStack>
                <Button
                  label="View samples"
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('Samples')}
                />
              </HStack>
            }
          >
            <ListItem
              label="Approve Maya Home Lab"
              description="130i sample request · projected $8.4K opportunity"
              startContent={<Icon icon={Gift} color="orange" />}
              endContent={<Token label="Today" color="yellow" size="sm" />}
              onClick={() => onNavigate('Samples')}
            />
            <ListItem
              label="Review Carmen Cho"
              description="Application · TikTok and Instagram · 176K followers"
              startContent={<Icon icon={UserCheck} color="accent" />}
              endContent={<Token label="1 day" color="blue" size="sm" />}
              onClick={() => onNavigate('Applications')}
            />
            <ListItem
              label="Respond to Maya's proposal"
              description="YouTube integration + 2 Shorts · $3,100"
              startContent={<Icon icon={ReceiptText} color="accent" />}
              endContent={<Token label="2 days" size="sm" />}
              onClick={() => onNavigate('Paid placements')}
            />
            <ListItem
              label="Refill CPC budget"
              description="130i launch support · $1,815 remaining"
              startContent={<Icon icon={MousePointerClick} color="orange" />}
              endContent={<Token label="30%" color="yellow" size="sm" />}
              onClick={() => onNavigate('Deals & CPC')}
            />
          </List>
        </Section>
      </Grid>
      <List
        density="balanced"
        hasDividers
        header={
          <HStack justify="between" align="end">
            <VStack gap={0.5}>
              <Heading level={2}>Top creator partners</Heading>
              <Text color="secondary">Who is moving attributed sales now</Text>
            </VStack>
            <Button
              label="All partnerships"
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('Partnerships')}
            />
          </HStack>
        }
      >
        {leaders.map((creator) => (
          <ListItem
            key={creator.id}
            label={<CreatorIdentity creator={creator} />}
            description={`${integer.format(creator.clicks)} clicks · ${(creator.conversionRate * 100).toFixed(1)}% CVR`}
            endContent={
              <VStack gap={0.5} align="end">
                <Text weight="semibold" hasTabularNumbers>
                  {formatMoney(creator.salesCents)}
                </Text>
                <Text type="supporting" color="secondary">
                  {((creator.privateCommissionBps ?? creator.publicCommissionBps) / 100).toFixed(0)}
                  % commission
                </Text>
              </VStack>
            }
            onClick={() => onNavigate('Partnerships')}
          />
        ))}
      </List>
    </VStack>
  )
}

function BrandProfileSurface({
  notice,
  setNotice,
}: {
  notice: Notice
  setNotice: (notice: Notice) => void
}) {
  const [bio, setBio] = useState(
    'PuroAir builds quiet, high-coverage air purifiers for healthier everyday spaces.',
  )
  const [contact, setContact] = useState('creators@puroair.example')
  const [autoAccept, setAutoAccept] = useState<Record<string, boolean>>(
    Object.fromEntries(sellerChannels.map((channel) => [channel.id, channel.autoAccept])),
  )
  const copySignup = () => {
    void navigator.clipboard?.writeText('https://waverly.example/join/puroair')
    setNotice({
      status: 'success',
      title: 'Creator sign-up link copied',
      description: 'Share the PuroAir application link in outreach, campaigns, and creator briefs.',
    })
  }
  return (
    <VStack gap={6}>
      <PageContext
        icon={Building2}
        title="Creator-facing brand profile"
        description="Keep channel-specific storefronts and enrollment rules clear before creators apply."
        meta="3 live channels"
      />
      {notice ? <Banner {...notice} isDismissable onDismiss={() => setNotice(null)} /> : null}
      <Grid columns={{ minWidth: 360, max: 2, repeat: 'fit' }} gap={6}>
        <VStack gap={5}>
          <VStack gap={1}>
            <Heading level={2}>Public program identity</Heading>
            <Text color="secondary">
              This is what creators see in the marketplace and application flow.
            </Text>
          </VStack>
          <TextInput
            label="Brand name"
            value="PuroAir"
            onChange={() => {}}
            isReadOnly
            width="100%"
          />
          <TextInput label="Brand bio" value={bio} onChange={setBio} width="100%" />
          <TextInput label="Creator contact" value={contact} onChange={setContact} width="100%" />
          <TextInput
            label="Creator sign-up link"
            value="https://waverly.example/join/puroair"
            onChange={() => {}}
            isReadOnly
            width="100%"
          />
          <HStack gap={2} wrap="wrap">
            <Button
              label="Copy sign-up link"
              icon={<Icon icon={Copy} />}
              variant="secondary"
              onClick={copySignup}
            />
            <Button
              label="Save profile"
              icon={<Icon icon={Check} />}
              variant="primary"
              onClick={() =>
                setNotice({
                  status: 'success',
                  title: 'Brand profile saved',
                  description:
                    'Creator-facing profile changes are reflected across all live channels.',
                })
              }
            />
          </HStack>
        </VStack>
        <List
          density="spacious"
          hasDividers
          header={
            <VStack gap={0.5}>
              <Heading level={2}>Marketplace storefronts</Heading>
              <Text color="secondary">
                Each commerce channel keeps its own catalog and approval policy.
              </Text>
            </VStack>
          }
        >
          {sellerChannels.map((channel) => (
            <ListItem
              key={channel.id}
              label={channel.marketplace}
              description={`${channel.storefront} · ${channel.products} products`}
              startContent={
                <Icon
                  icon={channel.marketplace === 'Shopify' ? ShoppingBag : Store}
                  color="accent"
                />
              }
              endContent={
                <VStack gap={1} align="end">
                  <StatusDot variant="success" label={`${channel.marketplace} is live`} />
                  <Switch
                    label={`Auto-accept ${channel.marketplace} applications`}
                    isLabelHidden
                    value={autoAccept[channel.id] ?? false}
                    onChange={(value) =>
                      setAutoAccept((current) => ({ ...current, [channel.id]: value }))
                    }
                  />
                </VStack>
              }
            />
          ))}
        </List>
      </Grid>
    </VStack>
  )
}

function ProductsSurface({
  privateRates,
  setPrivateRates,
  notice,
  setNotice,
}: {
  privateRates: Record<string, number>
  setPrivateRates: (rates: Record<string, number>) => void
  notice: Notice
  setNotice: (notice: Notice) => void
}) {
  const [search, setSearch] = useState('')
  const [marketplace, setMarketplace] = useState('all')
  const [defaultRate, setDefaultRate] = useState(12)
  const normalized = search.trim().toLowerCase()
  const rows: ProductRow[] = puroAirOffers
    .filter(
      (offer) =>
        marketplace === 'all' || `${offer.marketplace}-${offer.countryCode}` === marketplace,
    )
    .filter(
      (offer) =>
        !normalized || `${offer.offerName} ${offer.productSku}`.toLowerCase().includes(normalized),
    )
    .map((offer) => ({
      id: offer.key,
      offer,
      product: offer.offerName,
      marketplace: `${offer.marketplace} ${offer.countryCode}`,
      priceCents: offer.priceCents,
      commissionBps: defaultRate * 100,
      privateRate: privateRates[offer.key] ? `${privateRates[offer.key]}% · Avery Lane` : 'None',
      state: 'Active',
    }))
  const columns: TableColumn<ProductRow>[] = [
    {
      key: 'product',
      header: 'Product',
      width: proportional(2.4),
      renderCell: (row) => <ProductIdentity offer={row.offer} />,
    },
    { key: 'marketplace', header: 'Channel', width: proportional(1) },
    {
      key: 'priceCents',
      header: 'Price',
      width: pixel(100),
      align: 'end',
      renderCell: (row) => <Text hasTabularNumbers>{formatMoney(row.priceCents)}</Text>,
    },
    {
      key: 'commissionBps',
      header: 'Public commission',
      width: pixel(150),
      align: 'end',
      renderCell: (row) => <Text hasTabularNumbers>{(row.commissionBps / 100).toFixed(0)}%</Text>,
    },
    {
      key: 'privateRate',
      header: 'Private boost',
      width: proportional(1.1),
      renderCell: (row) => (
        <Text color={row.privateRate === 'None' ? 'secondary' : 'accent'}>{row.privateRate}</Text>
      ),
    },
    {
      key: 'state',
      header: 'State',
      width: pixel(100),
      renderCell: () => (
        <HStack gap={2} align="center">
          <StatusDot variant="success" label="Active product" />
          <Text>Active</Text>
        </HStack>
      ),
    },
    {
      key: 'id',
      header: '',
      width: pixel(140),
      align: 'end',
      renderCell: (row) => (
        <Button
          label={privateRates[row.id] ? 'Remove boost' : 'Boost Avery'}
          variant="ghost"
          size="sm"
          onClick={() => {
            const next = { ...privateRates }
            if (next[row.id]) delete next[row.id]
            else next[row.id] = 18
            setPrivateRates(next)
            setNotice({
              status: 'success',
              title: next[row.id] ? 'Private commission added' : 'Private commission removed',
              description: `${row.product} now uses ${next[row.id] ? 'an 18% private rate for Avery Lane' : 'the public program rate'}.`,
            })
          }}
        />
      ),
    },
  ]
  return (
    <VStack gap={5}>
      <PageContext
        icon={PackageSearch}
        title="Activated catalog and commissions"
        description="Set public product rates, then add private creator-specific boosts without duplicating offers."
        meta={`${rows.length} active products`}
      />
      {notice ? <Banner {...notice} isDismissable onDismiss={() => setNotice(null)} /> : null}
      <Card padding={4} variant="blue">
        <HStack justify="between" align="end" gap={4} wrap="wrap">
          <VStack gap={0.5}>
            <Text weight="semibold">Program default</Text>
            <Text color="secondary">
              Newly activated products inherit this public creator commission.
            </Text>
          </VStack>
          <HStack gap={2} align="end" wrap="wrap">
            <NumberInput
              label="Public commission"
              value={defaultRate}
              onChange={setDefaultRate}
              min={1}
              max={40}
              step={1}
              units="%"
              hasNumberSteppers
              isWheelEnabled={false}
              width={180}
            />
            <Button
              label="Apply to active products"
              variant="primary"
              onClick={() =>
                setNotice({
                  status: 'success',
                  title: 'Public commission updated',
                  description: `All active PuroAir products now use a ${defaultRate}% public rate; private creator rates remain intact.`,
                })
              }
            />
          </HStack>
        </HStack>
      </Card>
      <VStack gap={0}>
        <Toolbar
          label="Catalog controls"
          size="sm"
          variant="muted"
          dividers={['bottom']}
          startContent={
            <TextInput
              label="Search PuroAir catalog"
              isLabelHidden
              placeholder="Search product or SKU…"
              startIcon={Search}
              value={search}
              onChange={setSearch}
              hasClear
              width={260}
            />
          }
          endContent={
            <Selector
              label="Marketplace"
              isLabelHidden
              options={[
                { value: 'all', label: 'All channels' },
                { value: 'Amazon-US', label: 'Amazon US' },
                { value: 'Amazon-CA', label: 'Amazon CA' },
                { value: 'Shopify-US', label: 'Shopify' },
              ]}
              value={marketplace}
              onChange={setMarketplace}
              size="sm"
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
    </VStack>
  )
}

function CampaignsSurface({
  notice,
  setNotice,
}: {
  notice: Notice
  setNotice: (notice: Notice) => void
}) {
  const [tab, setTab] = useState('all')
  const visible = sellerCampaigns.filter(
    (campaign) => tab === 'all' || campaign.type.toLowerCase() === tab,
  )
  return (
    <VStack gap={5}>
      <PageContext
        icon={Megaphone}
        title="Deals and CPC campaigns"
        description="Pair promotion timing with click budgets that automatically fall back to CPA when spend is exhausted."
        meta="2 live · 1 scheduled"
      />
      <Banner
        status="info"
        title="CPC links preserve their destination"
        description="When a click budget is exhausted, the active link automatically returns to the standard CPA commission—no creator relinking required."
      />
      {notice ? <Banner {...notice} isDismissable onDismiss={() => setNotice(null)} /> : null}
      <TabList value={tab} onChange={setTab} size="sm" hasDivider>
        <Tab value="all" label="All campaigns" icon={<Icon icon={Sparkles} />} />
        <Tab value="deal" label="Deals" icon={<Icon icon={Tags} />} />
        <Tab value="cpc" label="CPC" icon={<Icon icon={MousePointerClick} />} />
      </TabList>
      <List
        density="spacious"
        hasDividers
        header={<Text weight="semibold">Campaign calendar</Text>}
      >
        {visible.map((campaign) => {
          const offer = offerByKey(campaign.productOfferKey)
          const budgetUsed =
            campaign.type === 'CPC' && campaign.budgetCents
              ? Math.round(((campaign.spentCents ?? 0) / campaign.budgetCents) * 100)
              : null
          return (
            <ListItem
              key={campaign.id}
              label={campaign.name}
              description={
                <VStack gap={2}>
                  <Text color="secondary">
                    {offer.offerName} · {campaign.starts}–{campaign.ends}
                  </Text>
                  {budgetUsed === null ? (
                    <Text type="supporting" color="secondary">
                      {campaign.discount}
                    </Text>
                  ) : (
                    <ProgressBar
                      label={`${campaign.name} budget used`}
                      value={budgetUsed}
                      hasValueLabel
                    />
                  )}
                </VStack>
              }
              startContent={<ProductThumb offer={offer} />}
              endContent={
                <VStack gap={2} align="end">
                  <Token
                    label={campaign.status}
                    color={campaign.status === 'Live' ? 'green' : 'blue'}
                    size="sm"
                  />
                  <Text weight="semibold">
                    {campaign.type === 'CPC'
                      ? `$${((campaign.cpcCents ?? 0) / 100).toFixed(2)} / click`
                      : campaign.discount}
                  </Text>
                  <Button
                    label={campaign.type === 'CPC' ? 'Add budget' : 'Edit deal'}
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setNotice({
                        status: 'success',
                        title: campaign.type === 'CPC' ? 'Budget updated' : 'Deal opened',
                        description: `${campaign.name} remains connected to its activated product and creator links.`,
                      })
                    }
                  />
                </VStack>
              }
            />
          )
        })}
      </List>
      <Button
        label="Create campaign"
        icon={<Icon icon={Megaphone} />}
        variant="primary"
        onClick={() =>
          setNotice({
            status: 'info',
            title: 'Campaign builder opened',
            description:
              'Choose products, dates, promotion terms, and an optional CPC budget before publishing to creators.',
          })
        }
      />
    </VStack>
  )
}

function SamplesSurface({
  samples,
  setSamples,
  notice,
  setNotice,
}: {
  samples: SellerSampleRequest[]
  setSamples: (samples: SellerSampleRequest[]) => void
  notice: Notice
  setNotice: (notice: Notice) => void
}) {
  const update = (id: string, fulfillment: SellerSampleRequest['fulfillment']) => {
    const row = samples.find((sample) => sample.id === id)
    setSamples(samples.map((sample) => (sample.id === id ? { ...sample, fulfillment } : sample)))
    setNotice({
      status: 'success',
      title: fulfillment === 'Approved' ? 'Sample approved' : 'Fulfillment advanced',
      description: row
        ? `${creatorById(row.creatorId).name}'s sample will be routed through the connected commerce channel.`
        : 'Sample updated.',
    })
  }
  return (
    <VStack gap={5}>
      <PageContext
        icon={Gift}
        title="Product samples"
        description="Review creator fit and social context before triggering connected fulfillment."
        meta={`${samples.filter((sample) => sample.fulfillment === 'Review').length} awaiting review`}
      />
      {notice ? <Banner {...notice} isDismissable onDismiss={() => setNotice(null)} /> : null}
      <List
        density="spacious"
        hasDividers
        header={
          <VStack gap={0.5}>
            <Heading level={2}>Sample queue</Heading>
            <Text color="secondary">
              Amazon MCF and Shopify fulfillment stay attached to the original request.
            </Text>
          </VStack>
        }
      >
        {samples.map((sample) => {
          const creator = creatorById(sample.creatorId)
          const offer = offerByKey(sample.productOfferKey)
          return (
            <ListItem
              key={sample.id}
              label={
                <CreatorIdentity
                  creator={creator}
                  supporting={`${creator.platforms.join(' + ')} · ${creator.audience ? `${compact.format(creator.audience)} followers` : 'Performance media'}`}
                />
              }
              description={`${offer.offerName} · requested ${sample.requestedAt} · ${sample.destination}`}
              startContent={<ProductThumb offer={offer} />}
              endContent={
                <HStack gap={3} align="center">
                  <Token
                    label={sample.fulfillment}
                    color={
                      sample.fulfillment === 'Review'
                        ? 'yellow'
                        : sample.fulfillment === 'Delivered'
                          ? 'green'
                          : 'blue'
                    }
                    size="sm"
                  />
                  {sample.fulfillment === 'Review' ? (
                    <Button
                      label="Approve sample"
                      icon={<Icon icon={PackageCheck} />}
                      variant="primary"
                      size="sm"
                      onClick={() => update(sample.id, 'Approved')}
                    />
                  ) : sample.fulfillment === 'Approved' ? (
                    <Button
                      label="Send to fulfillment"
                      variant="secondary"
                      size="sm"
                      onClick={() => update(sample.id, 'Fulfilled')}
                    />
                  ) : null}
                </HStack>
              }
            />
          )
        })}
      </List>
    </VStack>
  )
}

function CreatorDirectorySurface({
  invited,
  setInvited,
  notice,
  setNotice,
}: {
  invited: Set<string>
  setInvited: (invited: Set<string>) => void
  notice: Notice
  setNotice: (notice: Notice) => void
}) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [platform, setPlatform] = useState('all')
  const [audience, setAudience] = useState('all')
  const normalized = search.trim().toLowerCase()
  const visible = sellerCreators.filter((creator) => {
    if (type !== 'all' && creator.creatorType !== type) return false
    if (platform !== 'all' && !creator.platforms.includes(platform)) return false
    if (audience === '100k' && creator.audience < 100_000) return false
    if (audience === '500k' && creator.audience < 500_000) return false
    return (
      !normalized ||
      `${creator.name} ${creator.category} ${creator.creatorType} ${creator.platforms.join(' ')}`
        .toLowerCase()
        .includes(normalized)
    )
  })
  const rows: CreatorRow[] = visible.map((creator) => ({
    id: creator.id,
    creator,
    name: creator.name,
    audience: creator.audience,
    clicks: creator.clicks,
    salesCents: creator.salesCents,
    rate: creator.privateCommissionBps ?? creator.publicCommissionBps,
    status: creator.status,
  }))
  const columns: TableColumn<CreatorRow>[] = [
    {
      key: 'name',
      header: 'Creator',
      width: proportional(2),
      renderCell: (row) => <CreatorIdentity creator={row.creator} />,
    },
    {
      key: 'audience',
      header: 'Audience',
      width: pixel(110),
      align: 'end',
      renderCell: (row) => (
        <Text hasTabularNumbers>{row.audience ? compact.format(row.audience) : '—'}</Text>
      ),
    },
    {
      key: 'clicks',
      header: 'Network clicks',
      width: pixel(130),
      align: 'end',
      renderCell: (row) => <Text hasTabularNumbers>{integer.format(row.clicks)}</Text>,
    },
    {
      key: 'salesCents',
      header: 'Recent sales',
      width: pixel(130),
      align: 'end',
      renderCell: (row) => <Text hasTabularNumbers>{formatMoney(row.salesCents)}</Text>,
    },
    {
      key: 'rate',
      header: 'Rate',
      width: pixel(90),
      align: 'end',
      renderCell: (row) => <Text>{(row.rate / 100).toFixed(0)}%</Text>,
    },
    {
      key: 'status',
      header: 'Access',
      width: pixel(120),
      renderCell: (row) => (
        <HStack gap={2} align="center">
          <StatusDot
            variant={
              row.status === 'Partnered'
                ? 'success'
                : row.status === 'Invited' || invited.has(row.id)
                  ? 'accent'
                  : 'neutral'
            }
            label={row.status}
          />
          <Text>{invited.has(row.id) ? 'Invited' : row.status}</Text>
        </HStack>
      ),
    },
    {
      key: 'id',
      header: '',
      width: pixel(120),
      align: 'end',
      renderCell: (row) => (
        <Button
          label={row.status === 'Partnered' ? 'Open' : invited.has(row.id) ? 'Invited' : 'Invite'}
          icon={<Icon icon={row.status === 'Partnered' || invited.has(row.id) ? Check : Send} />}
          variant={row.status === 'Partnered' ? 'ghost' : 'secondary'}
          size="sm"
          isDisabled={invited.has(row.id)}
          onClick={() => {
            if (row.status === 'Partnered') return
            setInvited(new Set([...invited, row.id]))
            setNotice({
              status: 'success',
              title: 'Creator invited',
              description: `${row.name} received PuroAir's program profile, products, public commission, and application link.`,
            })
          }}
        />
      ),
    },
  ]
  return (
    <VStack gap={5}>
      <PageContext
        icon={Users}
        title="Creator directory"
        description="Search the full partner spectrum—publishers, influencers, media buyers, and deal sites—with evidence beside each profile."
        meta={`${visible.length} of ${sellerCreators.length} creators`}
      />
      {notice ? <Banner {...notice} isDismissable onDismiss={() => setNotice(null)} /> : null}
      <VStack gap={0}>
        <Toolbar
          label="Creator filters"
          size="sm"
          variant="muted"
          dividers={['bottom']}
          startContent={
            <TextInput
              label="Search creators"
              isLabelHidden
              placeholder="Search name, category, or channel…"
              startIcon={Search}
              value={search}
              onChange={setSearch}
              hasClear
              width={300}
            />
          }
          endContent={
            <HStack gap={2} align="center">
              <Selector
                label="Creator type"
                isLabelHidden
                options={[
                  { value: 'all', label: 'All creator types' },
                  'Publisher',
                  'Influencer',
                  'Media buyer',
                  'Deal site',
                ]}
                value={type}
                onChange={setType}
                variant="ghost"
                size="sm"
              />
              <Selector
                label="Platform"
                isLabelHidden
                options={[
                  { value: 'all', label: 'All platforms' },
                  'Web',
                  'Newsletter',
                  'Instagram',
                  'TikTok',
                  'YouTube',
                  'Meta',
                ]}
                value={platform}
                onChange={setPlatform}
                variant="ghost"
                size="sm"
              />
              <Selector
                label="Audience"
                isLabelHidden
                options={[
                  { value: 'all', label: 'Any audience' },
                  { value: '100k', label: '100K+' },
                  { value: '500k', label: '500K+' },
                ]}
                value={audience}
                onChange={setAudience}
                variant="ghost"
                size="sm"
              />
            </HStack>
          }
        />
        <Table
          data={rows}
          columns={columns}
          idKey="id"
          density="compact"
          dividers="rows"
          hasHover
          textOverflow="truncate"
        />
      </VStack>
    </VStack>
  )
}

function ApplicationsSurface({
  applications,
  setApplications,
  notice,
  setNotice,
}: {
  applications: SellerApplication[]
  setApplications: (applications: SellerApplication[]) => void
  notice: Notice
  setNotice: (notice: Notice) => void
}) {
  const update = (id: string, status: SellerApplication['status']) => {
    const row = applications.find((application) => application.id === id)
    setApplications(
      applications.map((application) =>
        application.id === id ? { ...application, status } : application,
      ),
    )
    setNotice({
      status: status === 'Accepted' ? 'success' : 'info',
      title: status === 'Accepted' ? 'Application accepted' : 'Application declined',
      description: row
        ? `${creatorById(row.creatorId).name} is now ${status === 'Accepted' ? 'an active PuroAir partner with the public rate' : 'removed from the review queue'}.`
        : 'Application updated.',
    })
  }
  return (
    <VStack gap={5}>
      <PageContext
        icon={UserCheck}
        title="Inbound applications"
        description="Review a creator's channel mix, audience, pitch, and requested products before granting program access."
        meta={`${applications.filter((application) => application.status === 'Review').length} awaiting review`}
      />
      {notice ? <Banner {...notice} isDismissable onDismiss={() => setNotice(null)} /> : null}
      <List
        density="spacious"
        hasDividers
        header={<Text weight="semibold">Application review queue</Text>}
      >
        {applications.map((application) => {
          const creator = creatorById(application.creatorId)
          return (
            <ListItem
              key={application.id}
              label={
                <CreatorIdentity
                  creator={creator}
                  supporting={`${creator.creatorType} · ${creator.platforms.join(' + ')} · ${creator.audience ? `${compact.format(creator.audience)} followers` : 'performance media'}`}
                />
              }
              description={
                <VStack gap={1}>
                  <Text>{application.pitch}</Text>
                  <Text type="supporting" color="secondary">
                    Requests: {application.requestedProducts.join(', ')} · Applied{' '}
                    {application.appliedAt}
                  </Text>
                </VStack>
              }
              endContent={
                <HStack gap={2} align="center">
                  <Token
                    label={application.status}
                    color={
                      application.status === 'Review'
                        ? 'yellow'
                        : application.status === 'Accepted'
                          ? 'green'
                          : 'blue'
                    }
                    size="sm"
                  />
                  {application.status === 'Review' ? (
                    <>
                      <Button
                        label="Decline"
                        variant="ghost"
                        size="sm"
                        onClick={() => update(application.id, 'Declined')}
                      />
                      <Button
                        label="Accept"
                        icon={<Icon icon={Check} />}
                        variant="primary"
                        size="sm"
                        onClick={() => update(application.id, 'Accepted')}
                      />
                    </>
                  ) : null}
                </HStack>
              }
            />
          )
        })}
      </List>
    </VStack>
  )
}

function PartnershipsSurface({
  privateRates,
  setPrivateRates,
  notice,
  setNotice,
}: {
  privateRates: Record<string, number>
  setPrivateRates: (rates: Record<string, number>) => void
  notice: Notice
  setNotice: (notice: Notice) => void
}) {
  const partners = sellerCreators.filter((creator) => creator.status === 'Partnered')
  return (
    <VStack gap={6}>
      <PageContext
        icon={Handshake}
        title="Active creator partnerships"
        description="Organize partners by role, monitor performance, and apply private rates without changing public terms."
        meta={`${partners.length} active · 3 groups`}
      />
      {notice ? <Banner {...notice} isDismissable onDismiss={() => setNotice(null)} /> : null}
      <Grid columns={{ minWidth: 240, max: 3, repeat: 'fit' }} gap={3}>
        {[
          {
            name: 'Home authority',
            count: 3,
            detail: 'Publishers and creators with evergreen home coverage',
            icon: Building2,
          },
          {
            name: 'Launch partners',
            count: 4,
            detail: 'High-intent partners for the 130i launch',
            icon: TrendingUp,
          },
          {
            name: 'Performance media',
            count: 2,
            detail: 'Media buyers and deal sites with capped rates',
            icon: MousePointerClick,
          },
        ].map((group) => (
          <Card key={group.name} padding={4} height="100%">
            <VStack gap={3}>
              <HStack justify="between" align="center">
                <Icon icon={group.icon} color="accent" />
                <Token label={`${group.count} creators`} size="sm" />
              </HStack>
              <VStack gap={0.5}>
                <Text weight="semibold">{group.name}</Text>
                <Text color="secondary">{group.detail}</Text>
              </VStack>
            </VStack>
          </Card>
        ))}
      </Grid>
      <List density="balanced" hasDividers header={<Text weight="semibold">Partner roster</Text>}>
        {partners.map((creator) => {
          const currentRate =
            privateRates[creator.id] ??
            (creator.privateCommissionBps
              ? creator.privateCommissionBps / 100
              : creator.publicCommissionBps / 100)
          return (
            <ListItem
              key={creator.id}
              label={<CreatorIdentity creator={creator} />}
              description={`${integer.format(creator.clicks)} clicks · ${(creator.conversionRate * 100).toFixed(1)}% CVR · ${formatMoney(creator.salesCents)} sales`}
              endContent={
                <HStack gap={3} align="center">
                  <VStack gap={0.5} align="end">
                    <Text weight="semibold">{currentRate}%</Text>
                    <Text type="supporting" color="secondary">
                      {creator.privateCommissionBps || privateRates[creator.id]
                        ? 'Private rate'
                        : 'Public rate'}
                    </Text>
                  </VStack>
                  <Button
                    label="Set private rate"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setPrivateRates({
                        ...privateRates,
                        [creator.id]: currentRate === 18 ? 15 : 18,
                      })
                      setNotice({
                        status: 'success',
                        title: 'Private commission saved',
                        description: `${creator.name} now receives ${currentRate === 18 ? 15 : 18}% without changing PuroAir's public program rate.`,
                      })
                    }}
                  />
                </HStack>
              }
            />
          )
        })}
      </List>
    </VStack>
  )
}

function PlacementsSurface({
  placements,
  setPlacements,
  notice,
  setNotice,
}: {
  placements: SellerPlacement[]
  setPlacements: (placements: SellerPlacement[]) => void
  notice: Notice
  setNotice: (notice: Notice) => void
}) {
  const nextStatus: Partial<Record<SellerPlacement['status'], SellerPlacement['status']>> = {
    'Rate card': 'Proposal',
    Proposal: 'Agreement',
    Agreement: 'In production',
    'In production': 'Delivered',
    Delivered: 'Approved',
  }
  const advance = (placement: SellerPlacement) => {
    const status = nextStatus[placement.status]
    if (!status) return
    const escrow =
      status === 'Agreement' || status === 'In production' || status === 'Delivered'
        ? 'Funded'
        : status === 'Approved'
          ? 'Released'
          : placement.escrow
    setPlacements(
      placements.map((row) => (row.id === placement.id ? { ...row, status, escrow } : row)),
    )
    setNotice({
      status: 'success',
      title: `Placement moved to ${status.toLowerCase()}`,
      description: `${creatorById(placement.creatorId).name}'s ${placement.deliverable} keeps its proposal, agreement, delivery, and payment history together.`,
    })
  }
  return (
    <VStack gap={5}>
      <PageContext
        icon={ReceiptText}
        title="Paid placements"
        description="Negotiate flat-fee deliverables from creator rate card through agreement, escrow, delivery, and approval."
        meta={`${placements.filter((placement) => placement.escrow === 'Funded').length} funded in escrow`}
      />
      {notice ? <Banner {...notice} isDismissable onDismiss={() => setNotice(null)} /> : null}
      <Banner
        status="info"
        title="Affiliate upside remains separate"
        description="Flat placement fees and performance commissions are tracked as distinct earning events, so ROAS and approval gates stay auditable."
      />
      <List
        density="spacious"
        hasDividers
        header={<Text weight="semibold">Placement pipeline</Text>}
      >
        {placements.map((placement) => {
          const creator = creatorById(placement.creatorId)
          const action = nextStatus[placement.status]
          return (
            <ListItem
              key={placement.id}
              label={
                <CreatorIdentity
                  creator={creator}
                  supporting={`${placement.channel} · ${placement.deliverable}`}
                />
              }
              description={`${placement.due} · ${placement.escrow}`}
              endContent={
                <HStack gap={3} align="center">
                  <VStack gap={0.5} align="end">
                    <Text weight="semibold">{formatMoney(placement.feeCents)}</Text>
                    <Token
                      label={placement.status}
                      color={
                        placement.status === 'Approved'
                          ? 'green'
                          : placement.status === 'Delivered'
                            ? 'yellow'
                            : 'blue'
                      }
                      size="sm"
                    />
                  </VStack>
                  {action ? (
                    <Button
                      label={
                        action === 'Proposal'
                          ? 'Send proposal'
                          : action === 'Agreement'
                            ? 'Create agreement'
                            : action === 'In production'
                              ? 'Fund escrow'
                              : action === 'Delivered'
                                ? 'Mark delivered'
                                : 'Approve work'
                      }
                      variant={action === 'Approved' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => advance(placement)}
                    />
                  ) : null}
                </HStack>
              }
            />
          )
        })}
      </List>
    </VStack>
  )
}

function PerformanceSurface() {
  const [view, setView] = useState('performance')
  const [marketplace, setMarketplace] = useState('all')
  const marketplaceFactor = marketplace === 'amazon' ? 0.72 : marketplace === 'shopify' ? 0.28 : 1
  const trend: ReportTrendPoint[] = dailyPerformance.slice(-30).map((day, index) => ({
    id: day.date,
    label: day.date,
    value: (day.orderValueCents * 0.118 * marketplaceFactor) / 100,
    previousValue: dailyPerformance[index + 30]?.orderValueCents
      ? (dailyPerformance[index + 30].orderValueCents * 0.103 * marketplaceFactor) / 100
      : undefined,
  }))
  const ranking: ReportRankingPoint[] =
    view === 'creator'
      ? sellerCreators
          .map((creator) => ({
            id: creator.id,
            label: creator.name,
            value: (creator.salesCents * marketplaceFactor) / 100,
          }))
          .sort((a, b) => b.value - a.value)
      : puroAirOffers.map((offer, index) => ({
          id: offer.key,
          label: offer.offerName,
          value: (68_400 - index * 12_800) * marketplaceFactor,
        }))
  return (
    <VStack gap={6}>
      <PageContext
        icon={BarChart3}
        title="Unified program reporting"
        description="Compare periods and channels, then move from the aggregate to the product or creator responsible."
        meta="Updated 18m ago"
      />
      <Section variant="muted" padding={4}>
        <HStack justify="between" align="center" gap={4} wrap="wrap">
          <TabList value={view} onChange={setView} size="sm" hasDivider>
            <Tab value="performance" label="Performance" icon={<Icon icon={TrendingUp} />} />
            <Tab value="product" label="Products" icon={<Icon icon={PackageSearch} />} />
            <Tab value="creator" label="Creators" icon={<Icon icon={Users} />} />
          </TabList>
          <Selector
            label="Marketplace"
            isLabelHidden
            options={[
              { value: 'all', label: 'All marketplaces' },
              { value: 'amazon', label: 'Amazon' },
              { value: 'shopify', label: 'Shopify' },
            ]}
            value={marketplace}
            onChange={setMarketplace}
            variant="ghost"
            size="sm"
          />
        </HStack>
      </Section>
      <MetricStrip />
      <Card padding={5}>
        <VStack gap={4}>
          <HStack justify="between" align="end">
            <VStack gap={0.5}>
              <Heading level={2}>
                {view === 'performance'
                  ? 'Attributed sales over time'
                  : view === 'product'
                    ? 'Sales by product'
                    : 'Sales by creator'}
              </Heading>
              <Text color="secondary">
                {view === 'performance'
                  ? 'Selected period compared with the previous 30 days'
                  : 'Ranked by attributed order value'}
              </Text>
            </VStack>
            <Token
              label={
                marketplace === 'all'
                  ? 'All channels'
                  : marketplace === 'amazon'
                    ? 'Amazon'
                    : 'Shopify'
              }
              size="sm"
            />
          </HStack>
          <ReportingChart
            mode={view === 'performance' ? 'trend' : 'ranking'}
            trend={trend}
            ranking={ranking}
            metricLabel="Attributed sales"
            ariaLabel={`PuroAir ${view} reporting`}
          />
        </VStack>
      </Card>
      <Grid columns={{ minWidth: 220, max: 4, repeat: 'fit' }} gap={3}>
        {[
          { label: 'Clicks', value: '42,938', detail: '+14.2%' },
          { label: 'Conversions', value: '1,684', detail: '3.92% CVR' },
          { label: 'Commission', value: '$18,940', detail: '10.3% of sales' },
          { label: 'ROAS', value: '8.4×', detail: '+1.1× vs prior' },
        ].map((metric) => (
          <Card key={metric.label} padding={4}>
            <VStack gap={1}>
              <Text type="supporting" color="secondary">
                {metric.label.toUpperCase()}
              </Text>
              <Text type="display-3" weight="semibold">
                {metric.value}
              </Text>
              <Text type="supporting" color="secondary">
                {metric.detail}
              </Text>
            </VStack>
          </Card>
        ))}
      </Grid>
    </VStack>
  )
}

function DeepReportsSurface() {
  const [selectedReport, setSelectedReport] = useState<
    (typeof sellerReportHighlights)[number] | null
  >(null)
  return (
    <VStack gap={6}>
      <PageContext
        icon={BadgeDollarSign}
        title="Incrementality and marketplace reports"
        description="Go beyond attributed sales to understand halo revenue, new customer acquisition, organic rank, and referral credits."
        meta="Amazon + Shopify"
      />
      {selectedReport ? (
        <Banner
          status="info"
          title={`${selectedReport.label} report opened`}
          description={`${selectedReport.detail} The detailed POC view preserves the marketplace, creator, product, and attribution-link dimensions behind this result.`}
          isDismissable
          onDismiss={() => setSelectedReport(null)}
        />
      ) : null}
      <Grid columns={{ minWidth: 280, max: 2, repeat: 'fit' }} gap={4}>
        {sellerReportHighlights.map((report) => (
          <Card
            key={report.id}
            padding={5}
            variant={report.id === 'new-to-brand' ? 'blue' : 'default'}
            height="100%"
          >
            <VStack gap={4} height="100%" justify="between">
              <VStack gap={2}>
                <HStack justify="between" align="center">
                  <Icon
                    icon={
                      report.id === 'halo'
                        ? Sparkles
                        : report.id === 'new-to-brand'
                          ? UserCheck
                          : report.id === 'bsr'
                            ? TrendingUp
                            : HandCoins
                    }
                    color="accent"
                  />
                  <Token
                    label={
                      report.id === 'new-to-brand'
                        ? 'Acquisition'
                        : report.id === 'bsr'
                          ? 'Organic'
                          : 'Revenue'
                    }
                    size="sm"
                  />
                </HStack>
                <VStack gap={0.5}>
                  <Text weight="semibold">{report.label}</Text>
                  <Text type="display-3" weight="semibold">
                    {typeof report.valueCents === 'number'
                      ? formatMoney(report.valueCents)
                      : report.value}
                  </Text>
                </VStack>
                <Text color="secondary">{report.detail}</Text>
              </VStack>
              <Button
                label={`Open ${report.label.toLowerCase()} report`}
                variant="secondary"
                size="sm"
                onClick={() => setSelectedReport(report)}
              />
            </VStack>
          </Card>
        ))}
      </Grid>
      <List
        density="balanced"
        hasDividers
        header={
          <VStack gap={0.5}>
            <Heading level={2}>What Waverly improves</Heading>
            <Text color="secondary">
              The reports share one attribution and economics model instead of reconciling provider
              exports after the fact.
            </Text>
          </VStack>
        }
      >
        <ListItem
          label="Halo revenue keeps the whole basket"
          description="See promoted and non-promoted PuroAir items in the same attributed order."
          startContent={<Icon icon={ShoppingBag} color="accent" />}
        />
        <ListItem
          label="New-to-brand measures acquisition"
          description="Separate first-time PuroAir customers from repeat buyers before evaluating creator quality."
          startContent={<Icon icon={UserCheck} color="accent" />}
        />
        <ListItem
          label="Rank overlays campaign windows"
          description="Compare creator conversions with Amazon best seller rank without exporting two timelines."
          startContent={<Icon icon={TrendingUp} color="accent" />}
        />
        <ListItem
          label="Referral credits reconcile to traffic"
          description="Connect Amazon brand referral bonus credits back to external attribution links."
          startContent={<Icon icon={BadgeDollarSign} color="accent" />}
        />
      </List>
    </VStack>
  )
}

function BillingSurface() {
  const rows: InvoiceRow[] = sellerInvoices.map((invoice) => ({ ...invoice }))
  const columns: TableColumn<InvoiceRow>[] = [
    {
      key: 'id',
      header: 'Invoice',
      width: proportional(1),
      renderCell: (row) => (
        <VStack gap={0.5}>
          <Text weight="semibold">{row.id}</Text>
          <Text type="supporting" color="secondary">
            {row.period}
          </Text>
        </VStack>
      ),
    },
    {
      key: 'saasCents',
      header: 'Platform',
      width: pixel(120),
      align: 'end',
      renderCell: (row) => <Text hasTabularNumbers>{formatMoney(row.saasCents)}</Text>,
    },
    {
      key: 'commissionsCents',
      header: 'Creator commission',
      width: pixel(160),
      align: 'end',
      renderCell: (row) => <Text hasTabularNumbers>{formatMoney(row.commissionsCents)}</Text>,
    },
    {
      key: 'placementsCents',
      header: 'Placements',
      width: pixel(130),
      align: 'end',
      renderCell: (row) => <Text hasTabularNumbers>{formatMoney(row.placementsCents)}</Text>,
    },
    {
      key: 'totalCents',
      header: 'Total',
      width: pixel(130),
      align: 'end',
      renderCell: (row) => (
        <Text weight="semibold" hasTabularNumbers>
          {formatMoney(row.totalCents)}
        </Text>
      ),
    },
    {
      key: 'status',
      header: 'State',
      width: pixel(100),
      renderCell: (row) => (
        <HStack gap={2} align="center">
          <StatusDot variant={row.status === 'Paid' ? 'success' : 'warning'} label={row.status} />
          <Text>{row.status}</Text>
        </HStack>
      ),
    },
    { key: 'due', header: 'Due', width: pixel(100) },
  ]
  const downloadInvoice = () => {
    const invoice = rows[0]
    const text = [
      `Invoice ${invoice.id}`,
      invoice.period,
      `Platform: ${formatMoney(invoice.saasCents)}`,
      `Creator commissions: ${formatMoney(invoice.commissionsCents)}`,
      `Paid placements: ${formatMoney(invoice.placementsCents)}`,
      `Total: ${formatMoney(invoice.totalCents)}`,
      `Due: ${invoice.due}`,
    ].join('\n')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${invoice.id}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return (
    <VStack gap={6}>
      <PageContext
        icon={WalletCards}
        title="Consolidated billing"
        description="One monthly invoice covers platform access, creator commissions, and paid placements across every marketplace."
        meta="Stripe billing · USD"
      />
      <Banner
        status="success"
        title="Creator tax administration is handled by Waverly"
        description="Creator payouts, W-9 collection, and 1099 issuance stay outside PuroAir's accounts-payable workflow."
      />
      <Grid columns={{ minWidth: 220, max: 4, repeat: 'fit' }} gap={3}>
        <Card padding={4} variant="blue">
          <VStack gap={1}>
            <Text type="supporting" color="secondary">
              OPEN INVOICE
            </Text>
            <Text type="display-3" weight="semibold">
              $11,763
            </Text>
            <Text type="supporting" color="secondary">
              Due Sep 5
            </Text>
          </VStack>
        </Card>
        <Card padding={4}>
          <VStack gap={1}>
            <Text type="supporting" color="secondary">
              CREATOR COMMISSIONS
            </Text>
            <Text type="display-3" weight="semibold">
              $4,864
            </Text>
            <Text type="supporting" color="secondary">
              41% of August bill
            </Text>
          </VStack>
        </Card>
        <Card padding={4}>
          <VStack gap={1}>
            <Text type="supporting" color="secondary">
              PLACEMENT ESCROW
            </Text>
            <Text type="display-3" weight="semibold">
              $5,900
            </Text>
            <Text type="supporting" color="secondary">
              2 funded agreements
            </Text>
          </VStack>
        </Card>
        <Card padding={4}>
          <VStack gap={1}>
            <Text type="supporting" color="secondary">
              TAX DOCUMENTS
            </Text>
            <Text type="display-3" weight="semibold">
              Handled
            </Text>
            <Text type="supporting" color="secondary">
              W-9 + 1099 by Waverly
            </Text>
          </VStack>
        </Card>
      </Grid>
      <VStack gap={0}>
        <Toolbar
          label="Invoice history"
          startContent={<Heading level={2}>Invoices</Heading>}
          endContent={
            <Button
              label="Download open invoice"
              icon={<Icon icon={FileText} />}
              variant="secondary"
              size="sm"
              onClick={downloadInvoice}
            />
          }
        />
        <Divider />
        <Table
          data={rows}
          columns={columns}
          idKey="id"
          density="balanced"
          dividers="rows"
          hasHover
        />
      </VStack>
    </VStack>
  )
}

export function SellerPortalSurface({
  page,
  onNavigate,
}: {
  page: SellerPage
  onNavigate: (page: string) => void
}) {
  const [notice, setNotice] = useState<Notice>(null)
  const [applications, setApplications] = useState(sellerApplications)
  const [samples, setSamples] = useState(sellerSamples)
  const [placements, setPlacements] = useState(sellerPlacements)
  const [invited, setInvited] = useState<Set<string>>(
    new Set(
      sellerCreators.filter((creator) => creator.status === 'Invited').map((creator) => creator.id),
    ),
  )
  const [privateRates, setPrivateRates] = useState<Record<string, number>>({
    'vera-impact': 18,
    avery: 18,
  })

  const [lastPage, setLastPage] = useState(page)
  if (lastPage !== page) {
    setLastPage(page)
    setNotice(null)
  }

  return useMemo(() => {
    if (page === 'Overview') return <SellerOverview onNavigate={onNavigate} />
    if (page === 'Brand profile')
      return <BrandProfileSurface notice={notice} setNotice={setNotice} />
    if (page === 'Products & commissions')
      return (
        <ProductsSurface
          privateRates={privateRates}
          setPrivateRates={setPrivateRates}
          notice={notice}
          setNotice={setNotice}
        />
      )
    if (page === 'Deals & CPC') return <CampaignsSurface notice={notice} setNotice={setNotice} />
    if (page === 'Samples')
      return (
        <SamplesSurface
          samples={samples}
          setSamples={setSamples}
          notice={notice}
          setNotice={setNotice}
        />
      )
    if (page === 'Creator directory')
      return (
        <CreatorDirectorySurface
          invited={invited}
          setInvited={setInvited}
          notice={notice}
          setNotice={setNotice}
        />
      )
    if (page === 'Applications')
      return (
        <ApplicationsSurface
          applications={applications}
          setApplications={setApplications}
          notice={notice}
          setNotice={setNotice}
        />
      )
    if (page === 'Partnerships')
      return (
        <PartnershipsSurface
          privateRates={privateRates}
          setPrivateRates={setPrivateRates}
          notice={notice}
          setNotice={setNotice}
        />
      )
    if (page === 'Paid placements')
      return (
        <PlacementsSurface
          placements={placements}
          setPlacements={setPlacements}
          notice={notice}
          setNotice={setNotice}
        />
      )
    if (page === 'Performance') return <PerformanceSurface />
    if (page === 'Deep reports') return <DeepReportsSurface />
    return <BillingSurface />
  }, [applications, invited, notice, onNavigate, page, placements, privateRates, samples])
}
