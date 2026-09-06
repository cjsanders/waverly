import type { ISODateString } from '#/features/network/ui/primitives'
import {
  Button,
  Card,
  DateRangeInput,
  Divider,
  Grid,
  HStack,
  Heading,
  Icon,
  IconButton,
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
  type DateRange,
  type TableColumn,
} from '#/features/network/ui/primitives'
import {
  Building2,
  ChartSpline,
  Download,
  Fingerprint,
  MousePointerClick,
  PackageSearch,
  Search,
  Waypoints,
} from 'lucide-react'
import { useState } from 'react'
import {
  advertisers,
  dailyPerformance,
  programOffers,
  providers,
  summarizePerformance,
  type SeedDay,
} from '../../../shared/demoData'
import { ReportingChart, type ReportRankingPoint, type ReportTrendPoint } from './ReportingChart'
import type { DemoIdentity } from './types'

type ReportView = 'performance' | 'product' | 'brand' | 'source' | 'cpc' | 'shared-id'
type ReportMetric = 'orderValue' | 'grossCommission' | 'net'

interface ReportSummary {
  clicks: number
  uniqueClicks: number
  conversions: number
  orderValueCents: number
  grossCommissionCents: number
  publisherEarningsCents: number
  waverlyRevenueCents: number
  reversals: number
}

interface ReportRow extends Record<string, unknown> {
  id: string
  name: string
  context: string
  status: 'Rising' | 'Steady' | 'Review'
  clicks: number
  conversions: number
  conversionRate: number
  orderValueCents: number
  grossCommissionCents: number
  publisherEarningsCents: number
  waverlyRevenueCents: number
}

const integer = new Intl.NumberFormat('en-US')
const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const compactMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const providerShares: Record<string, number> = {
  amazon: 0.42,
  impact: 0.36,
  shopify: 0.22,
}

const initialRange: DateRange = { start: '2026-07-17', end: '2026-08-15' }
const reportPresets = [
  {
    label: 'Last 7 days',
    getRange: () => ({ start: '2026-08-09' as ISODateString, end: '2026-08-15' as ISODateString }),
  },
  {
    label: 'Last 14 days',
    getRange: () => ({ start: '2026-08-02' as ISODateString, end: '2026-08-15' as ISODateString }),
  },
  {
    label: 'Last 30 days',
    getRange: () => ({ start: '2026-07-17' as ISODateString, end: '2026-08-15' as ISODateString }),
  },
  {
    label: 'Full 90 days',
    getRange: () => ({ start: '2026-05-18' as ISODateString, end: '2026-08-15' as ISODateString }),
  },
]

function scopeFactor(identity: DemoIdentity) {
  if (identity === 'northstar') return 0.186
  if (identity === 'everyday') return 0.024
  return 1
}

function formatMoney(cents: number) {
  return money.format(cents / 100)
}

function formatCompactMoney(cents: number) {
  return compactMoney.format(cents / 100)
}

function ReportMetricCard({
  label,
  value,
  detail,
  isFeatured = false,
}: {
  label: string
  value: string
  detail: string
  isFeatured?: boolean
}) {
  return (
    <Card
      padding={4}
      variant={isFeatured ? 'blue' : 'default'}
      elevation={isFeatured ? 'low' : 'none'}
      height="100%"
    >
      <VStack gap={1}>
        <Text type="supporting" color="secondary" weight="semibold">
          {label}
        </Text>
        <Text type="display-3" weight="semibold" hasTabularNumbers>
          {value}
        </Text>
        <Text type="supporting" color="secondary">
          {detail}
        </Text>
      </VStack>
    </Card>
  )
}

function formatReportDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(timestamp)
}

function scaleSummary(rows: SeedDay[], identity: DemoIdentity, provider: string): ReportSummary {
  const base = summarizePerformance(rows)
  const scale = scopeFactor(identity) * (provider === 'all' ? 1 : (providerShares[provider] ?? 1))
  return {
    clicks: Math.round(base.clicks * scale),
    uniqueClicks: Math.round(base.uniqueClicks * scale),
    conversions: Math.round(base.conversions * scale),
    orderValueCents: Math.round(base.orderValueCents * scale),
    grossCommissionCents: Math.round(base.grossCommissionCents * scale),
    publisherEarningsCents: Math.round(base.publisherEarningsCents * scale),
    waverlyRevenueCents: Math.round(base.waverlyRevenueCents * scale),
    reversals: Math.round(base.reversals * scale),
  }
}

function percentDelta(current: number, previous: number) {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

function deltaLabel(current: number, previous: number) {
  const delta = percentDelta(current, previous)
  if (delta === null) return 'No complete baseline'
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}% vs previous period`
}

function weightFor(value: string) {
  return (value.split('').reduce((total, character) => total + character.charCodeAt(0), 0) % 17) + 8
}

function buildDimensionRows(
  view: Exclude<ReportView, 'performance'>,
  summary: ReportSummary,
  provider: string,
): ReportRow[] {
  const visibleOffers = programOffers.filter(
    (offer) => provider === 'all' || offer.providerKey === provider,
  )
  let seeds: Array<{ id: string; name: string; context: string; weight: number }>
  if (view === 'product' || view === 'cpc') {
    seeds = visibleOffers
      .filter((offer) => view !== 'cpc' || offer.cpcCents > 0)
      .map((offer) => {
        const advertiser = advertisers.find((item) => item.key === offer.advertiserKey)
        const providerName =
          providers.find((item) => item.key === offer.providerKey)?.name ?? offer.providerKey
        return {
          id: offer.key,
          name: offer.offerName,
          context:
            view === 'cpc'
              ? `${advertiser?.name ?? offer.advertiserKey} · $${(offer.cpcCents / 100).toFixed(2)} EPC · ${providerName}`
              : `${advertiser?.name ?? offer.advertiserKey} · ${providerName}`,
          weight:
            weightFor(offer.key) +
            (offer.featured ? 9 : 0) +
            (view === 'cpc' ? offer.cpcCents / 5 : 0),
        }
      })
  } else if (view === 'brand') {
    seeds = advertisers.flatMap((advertiser) => {
      const offers = visibleOffers.filter((offer) => offer.advertiserKey === advertiser.key)
      if (offers.length === 0) return []
      return [
        {
          id: advertiser.key,
          name: advertiser.name,
          context: `${advertiser.category} · ${offers.length} live ${offers.length === 1 ? 'offer' : 'offers'}`,
          weight: offers.reduce(
            (total, offer) => total + weightFor(offer.key) + (offer.featured ? 9 : 0),
            0,
          ),
        },
      ]
    })
  } else if (view === 'source') {
    seeds = [
      {
        id: 'newsletter',
        name: 'Newsletter',
        context: 'Owned · tagged campaign links',
        weight: 34,
      },
      {
        id: 'organic-search',
        name: 'Organic search',
        context: 'Evergreen guides and reviews',
        weight: 29,
      },
      { id: 'instagram', name: 'Instagram', context: 'Stories, bio, and reels', weight: 19 },
      {
        id: 'direct',
        name: 'Direct / untagged',
        context: 'No explicit source parameter',
        weight: 10,
      },
      { id: 'youtube', name: 'YouTube', context: 'Descriptions and pinned comments', weight: 8 },
    ]
  } else {
    seeds = [
      {
        id: 'newsletter-aug-31',
        name: 'newsletter-aug-31',
        context: 'Newsletter · Everyday upgrades',
        weight: 31,
      },
      {
        id: 'fall-home-refresh',
        name: 'fall-home-refresh',
        context: 'Storefront · Fall home folder',
        weight: 24,
      },
      {
        id: 'wellness-reset',
        name: 'wellness-reset',
        context: 'Article · Wellness essentials',
        weight: 19,
      },
      {
        id: 'ig-stories-home',
        name: 'ig-stories-home',
        context: 'Instagram · Stories',
        weight: 15,
      },
      {
        id: 'youtube-description',
        name: 'youtube-description',
        context: 'YouTube · Description links',
        weight: 11,
      },
    ]
  }

  const totalWeight = seeds.reduce((total, item) => total + item.weight, 0)
  const averageRate = summary.clicks > 0 ? summary.conversions / summary.clicks : 0

  return seeds
    .map((seed, index) => {
      const share = totalWeight > 0 ? seed.weight / totalWeight : 0
      const conversionLift = 0.88 + ((index * 7) % 23) / 100
      const clicks = Math.max(1, Math.round(summary.clicks * share))
      const conversions = Math.max(0, Math.round(summary.conversions * share * conversionLift))
      const conversionRate = conversions / clicks
      return {
        id: seed.id,
        name: seed.name,
        context: seed.context,
        status:
          conversionRate > averageRate * 1.06
            ? 'Rising'
            : conversionRate < averageRate * 0.9
              ? 'Review'
              : 'Steady',
        clicks,
        conversions,
        conversionRate,
        orderValueCents: Math.round(summary.orderValueCents * share),
        grossCommissionCents: Math.round(summary.grossCommissionCents * share),
        publisherEarningsCents: Math.round(summary.publisherEarningsCents * share),
        waverlyRevenueCents: Math.round(summary.waverlyRevenueCents * share),
      } satisfies ReportRow
    })
    .sort((left, right) => right.orderValueCents - left.orderValueCents)
}

function buildPerformanceRows(
  days: SeedDay[],
  identity: DemoIdentity,
  provider: string,
): ReportRow[] {
  return days.toReversed().map((day) => {
    const summary = scaleSummary([day], identity, provider)
    return {
      id: day.date,
      name: formatReportDate(day.occurredAt),
      context: `${integer.format(summary.uniqueClicks)} unique clicks`,
      status:
        day.reversals > 0 ? 'Review' : day.conversions / day.clicks > 0.036 ? 'Rising' : 'Steady',
      clicks: summary.clicks,
      conversions: summary.conversions,
      conversionRate: summary.clicks > 0 ? summary.conversions / summary.clicks : 0,
      orderValueCents: summary.orderValueCents,
      grossCommissionCents: summary.grossCommissionCents,
      publisherEarningsCents: summary.publisherEarningsCents,
      waverlyRevenueCents: summary.waverlyRevenueCents,
    }
  })
}

function statusVariant(status: ReportRow['status']): 'success' | 'warning' | 'accent' {
  if (status === 'Rising') return 'success'
  if (status === 'Review') return 'warning'
  return 'accent'
}

function metricValue(day: SeedDay, metric: ReportMetric, identity: DemoIdentity, provider: string) {
  const summary = scaleSummary([day], identity, provider)
  if (metric === 'orderValue') return summary.orderValueCents / 100
  if (metric === 'grossCommission') return summary.grossCommissionCents / 100
  return (
    (identity === 'operator' ? summary.waverlyRevenueCents : summary.publisherEarningsCents) / 100
  )
}

function rowMetricValue(row: ReportRow, metric: ReportMetric, identity: DemoIdentity) {
  if (metric === 'orderValue') return row.orderValueCents / 100
  if (metric === 'grossCommission') return row.grossCommissionCents / 100
  return (identity === 'operator' ? row.waverlyRevenueCents : row.publisherEarningsCents) / 100
}

function escapeCsv(value: string | number) {
  const stringValue = String(value)
  return `"${stringValue.replaceAll('"', '""')}"`
}

export function ReportingSurface({ identity }: { identity: DemoIdentity }) {
  const isNarrow = useMediaQuery('(max-width: 700px)')
  const [view, setView] = useState<ReportView>('performance')
  const [range, setRange] = useState<DateRange | null>(initialRange)
  const [provider, setProvider] = useState('all')
  const [metric, setMetric] = useState<ReportMetric>('orderValue')
  const [search, setSearch] = useState('')

  const rangeStart = range?.start ?? initialRange.start
  const rangeEnd = range?.end ?? initialRange.end
  const currentDays = dailyPerformance.filter(
    (day) => day.date >= rangeStart && day.date <= rangeEnd,
  )
  const firstIndex = dailyPerformance.findIndex((day) => day.date === currentDays[0]?.date)
  const previousDays =
    firstIndex > 0
      ? dailyPerformance.slice(Math.max(0, firstIndex - currentDays.length), firstIndex)
      : []
  const currentSummary = scaleSummary(currentDays, identity, provider)
  const previousSummary = scaleSummary(previousDays, identity, provider)
  const currentRate =
    currentSummary.clicks > 0 ? currentSummary.conversions / currentSummary.clicks : 0
  const previousRate =
    previousSummary.clicks > 0 ? previousSummary.conversions / previousSummary.clicks : 0

  const reportRows =
    view === 'performance'
      ? buildPerformanceRows(currentDays, identity, provider)
      : buildDimensionRows(view, currentSummary, provider)

  const normalizedSearch = search.trim().toLowerCase()
  const visibleRows = reportRows.filter(
    (row) =>
      !normalizedSearch || `${row.name} ${row.context}`.toLowerCase().includes(normalizedSearch),
  )
  const topRow = reportRows[0]
  const topShare =
    topRow && currentSummary.orderValueCents > 0
      ? topRow.orderValueCents / currentSummary.orderValueCents
      : 0

  const trendPoints: ReportTrendPoint[] = currentDays.map((day, index) => ({
    id: day.date,
    label: day.date,
    value: metricValue(day, metric, identity, provider),
    previousValue: previousDays[index]
      ? metricValue(previousDays[index], metric, identity, provider)
      : undefined,
  }))
  const rankingPoints: ReportRankingPoint[] = reportRows.map((row) => ({
    id: row.id,
    label: row.name.length > 24 ? `${row.name.slice(0, 23)}…` : row.name,
    value: rowMetricValue(row, metric, identity),
  }))

  const metricOptions = [
    { value: 'orderValue', label: 'Order value' },
    { value: 'grossCommission', label: 'Gross commission' },
    { value: 'net', label: identity === 'operator' ? 'Waverly revenue' : 'Publisher earnings' },
  ]
  const providerOptions = [
    { value: 'all', label: 'All providers' },
    ...providers.map((item) => ({ value: item.key, label: item.name })),
  ]
  const viewLabels: Record<ReportView, string> = {
    performance: 'Daily performance',
    product: 'Product performance',
    brand: 'Brand performance',
    source: 'Source performance',
    cpc: 'CPC performance',
    'shared-id': 'Shared ID performance',
  }
  const viewLabel = viewLabels[view]
  const dimensionLabel =
    view === 'product'
      ? 'product'
      : view === 'brand'
        ? 'brand'
        : view === 'source'
          ? 'source'
          : view === 'cpc'
            ? 'campaign'
            : 'shared ID'
  const metricLabel =
    metricOptions.find((option) => option.value === metric)?.label ?? 'Order value'

  const columns: TableColumn<ReportRow>[] = [
    {
      key: 'name',
      header:
        view === 'performance'
          ? 'Date'
          : view === 'product'
            ? 'Product / offer'
            : view === 'brand'
              ? 'Brand'
              : view === 'source'
                ? 'Source'
                : view === 'cpc'
                  ? 'CPC campaign'
                  : 'Shared ID',
      width: proportional(2),
      renderCell: (row) => (
        <VStack gap={0.5}>
          <Text weight="semibold">{row.name}</Text>
          <Text type="supporting" color="secondary">
            {row.context}
          </Text>
        </VStack>
      ),
    },
    {
      key: 'status',
      header: 'Signal',
      width: pixel(110),
      renderCell: (row) => (
        <HStack gap={2} align="center">
          <StatusDot
            variant={statusVariant(row.status)}
            label={`${row.status} signal for ${row.name}`}
          />
          <Text>{row.status}</Text>
        </HStack>
      ),
    },
    {
      key: 'clicks',
      header: 'Clicks',
      width: pixel(110),
      align: 'end',
      renderCell: (row) => <Text hasTabularNumbers>{integer.format(row.clicks)}</Text>,
    },
    {
      key: 'conversions',
      header: 'Conversions',
      width: pixel(120),
      align: 'end',
      renderCell: (row) => <Text hasTabularNumbers>{integer.format(row.conversions)}</Text>,
    },
    {
      key: 'conversionRate',
      header: 'CVR',
      width: pixel(90),
      align: 'end',
      renderCell: (row) => <Text hasTabularNumbers>{(row.conversionRate * 100).toFixed(2)}%</Text>,
    },
    {
      key: 'orderValueCents',
      header: 'Order value',
      width: pixel(130),
      align: 'end',
      renderCell: (row) => <Text hasTabularNumbers>{formatMoney(row.orderValueCents)}</Text>,
    },
    {
      key: 'publisherEarningsCents',
      header: identity === 'operator' ? 'Waverly revenue' : 'Earnings',
      width: pixel(130),
      align: 'end',
      renderCell: (row) => (
        <Text hasTabularNumbers>
          {formatMoney(
            identity === 'operator' ? row.waverlyRevenueCents : row.publisherEarningsCents,
          )}
        </Text>
      ),
    },
  ]

  const exportReport = () => {
    const header = [
      'Name',
      'Context',
      'Signal',
      'Clicks',
      'Conversions',
      'CVR',
      'Order value',
      identity === 'operator' ? 'Waverly revenue' : 'Earnings',
    ]
    const body = visibleRows.map((row) => [
      row.name,
      row.context,
      row.status,
      row.clicks,
      row.conversions,
      `${(row.conversionRate * 100).toFixed(2)}%`,
      (row.orderValueCents / 100).toFixed(2),
      (
        (identity === 'operator' ? row.waverlyRevenueCents : row.publisherEarningsCents) / 100
      ).toFixed(2),
    ])
    const csv = [header, ...body].map((row) => row.map(escapeCsv).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `waverly-${view}-report-${rangeEnd}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <VStack gap={6}>
      <Section variant="muted" padding={5}>
        <VStack gap={4}>
          <HStack justify="between" align="center" gap={4} wrap="wrap">
            <TabList
              value={view}
              onChange={(value) => setView(value as ReportView)}
              size="sm"
              hasDivider
              overflow="scroll"
            >
              <Tab value="performance" label="Performance" icon={<Icon icon={ChartSpline} />} />
              <Tab value="product" label="Products" icon={<Icon icon={PackageSearch} />} />
              <Tab value="brand" label="Brands" icon={<Icon icon={Building2} />} />
              <Tab value="source" label="Sources" icon={<Icon icon={Waypoints} />} />
              <Tab value="cpc" label="CPC" icon={<Icon icon={MousePointerClick} />} />
              <Tab value="shared-id" label="Shared IDs" icon={<Icon icon={Fingerprint} />} />
            </TabList>
            <HStack gap={2} align="center">
              <StatusDot variant="success" label="Reporting data is current" />
              <Text type="supporting" color="secondary">
                Updated 18m ago
              </Text>
              <Token label={`${currentDays.length} days`} size="sm" />
            </HStack>
          </HStack>
          <Divider />
          <Grid columns={{ minWidth: 260, max: 4, repeat: 'fit' }} gap={4}>
            <DateRangeInput
              label="Report period"
              value={range}
              onChange={setRange}
              presets={reportPresets}
              min="2026-05-18"
              max="2026-08-15"
              numberOfMonths={1}
              size="sm"
              width="100%"
              hasClear={false}
            />
            <Selector
              label="Compare with"
              options={[{ value: 'previous', label: 'Previous period' }]}
              value="previous"
              onChange={() => undefined}
              size="sm"
              width="100%"
            />
            <Selector
              label="Provider"
              options={providerOptions}
              value={provider}
              onChange={setProvider}
              size="sm"
              width="100%"
            />
            <Selector
              label="Chart metric"
              options={metricOptions}
              value={metric}
              onChange={(value) => setMetric(value as ReportMetric)}
              size="sm"
              width="100%"
            />
          </Grid>
        </VStack>
      </Section>

      <Grid columns={{ minWidth: 160, max: 3, repeat: 'fit' }} gap={3}>
        <ReportMetricCard
          label="Order value"
          value={formatCompactMoney(currentSummary.orderValueCents)}
          detail={deltaLabel(currentSummary.orderValueCents, previousSummary.orderValueCents)}
          isFeatured
        />
        <ReportMetricCard
          label="Gross commission"
          value={formatCompactMoney(currentSummary.grossCommissionCents)}
          detail={`${((currentSummary.grossCommissionCents / Math.max(currentSummary.orderValueCents, 1)) * 100).toFixed(1)}% of order value`}
        />
        <ReportMetricCard
          label={identity === 'operator' ? 'Waverly revenue' : 'Earnings'}
          value={formatCompactMoney(
            identity === 'operator'
              ? currentSummary.waverlyRevenueCents
              : currentSummary.publisherEarningsCents,
          )}
          detail="Snapshotted economics"
        />
        <ReportMetricCard
          label="Clicks"
          value={integer.format(currentSummary.clicks)}
          detail={deltaLabel(currentSummary.clicks, previousSummary.clicks)}
        />
        <ReportMetricCard
          label="Conversions"
          value={integer.format(currentSummary.conversions)}
          detail={`${(currentRate * 100).toFixed(2)}% conversion rate`}
        />
        <ReportMetricCard
          label="Conversion rate"
          value={`${(currentRate * 100).toFixed(2)}%`}
          detail={deltaLabel(currentRate, previousRate)}
        />
      </Grid>

      <Card padding={0}>
        <VStack gap={0}>
          <Toolbar
            label={`${viewLabel} chart controls`}
            size="sm"
            variant="muted"
            dividers={['bottom']}
            startContent={
              <VStack gap={0.5}>
                <Text weight="semibold">
                  {view === 'performance'
                    ? `${metricLabel} over time`
                    : `${metricLabel} by ${dimensionLabel}`}
                </Text>
                <Text type="supporting" color="secondary">
                  {view === 'performance'
                    ? 'Selected period compared day-for-day'
                    : `Top ${dimensionLabel} results in the current filter`}
                </Text>
              </VStack>
            }
            endContent={
              <Token
                label={
                  provider === 'all'
                    ? 'All providers'
                    : (providers.find((item) => item.key === provider)?.name ?? provider)
                }
                size="sm"
              />
            }
          />
          <VStack padding={4}>
            <ReportingChart
              mode={view === 'performance' ? 'trend' : 'ranking'}
              trend={trendPoints}
              ranking={rankingPoints}
              metricLabel={`${metricLabel} · USD`}
              ariaLabel={
                view === 'performance'
                  ? `${metricLabel} for the selected and previous reporting periods`
                  : `${metricLabel} ranked by ${dimensionLabel}`
              }
            />
          </VStack>
        </VStack>
      </Card>

      <Card padding={4} variant="muted">
        <VStack gap={4}>
          <HStack justify="between" align="center" gap={4} wrap="wrap">
            <VStack gap={0.5}>
              <Heading level={2}>Report signal</Heading>
              <Text type="supporting" color="secondary">
                The short version of what moved and where to look next
              </Text>
            </VStack>
            <Token
              label={
                previousDays.length === currentDays.length
                  ? 'Complete comparison'
                  : 'Partial comparison'
              }
              size="sm"
              color={previousDays.length === currentDays.length ? 'green' : 'yellow'}
            />
          </HStack>
          <Divider />
          <Grid columns={{ minWidth: 220, max: 3, repeat: 'fit' }} gap={5}>
            <HStack gap={3} align="start">
              <StatusDot
                variant={
                  (percentDelta(currentSummary.orderValueCents, previousSummary.orderValueCents) ??
                    0) >= 0
                    ? 'success'
                    : 'warning'
                }
                label="Order value movement"
              />
              <VStack gap={0.5}>
                <Text weight="semibold">Order value</Text>
                <Text>
                  {deltaLabel(currentSummary.orderValueCents, previousSummary.orderValueCents)}
                </Text>
                <Text type="supporting" color="secondary">
                  {formatMoney(currentSummary.orderValueCents)} attributed in the selected period.
                </Text>
              </VStack>
            </HStack>
            <HStack gap={3} align="start">
              <StatusDot
                variant={currentRate >= previousRate ? 'success' : 'warning'}
                label="Conversion efficiency movement"
              />
              <VStack gap={0.5}>
                <Text weight="semibold">Conversion efficiency</Text>
                <Text>{deltaLabel(currentRate, previousRate)}</Text>
                <Text type="supporting" color="secondary">
                  Current CVR is {(currentRate * 100).toFixed(2)}% across{' '}
                  {integer.format(currentSummary.clicks)} clicks.
                </Text>
              </VStack>
            </HStack>
            <HStack gap={3} align="start">
              <StatusDot
                variant={topShare > 0.25 ? 'warning' : 'accent'}
                label="Revenue concentration"
              />
              <VStack gap={0.5}>
                <Text weight="semibold">Concentration</Text>
                <Text>
                  {view === 'performance'
                    ? `${provider === 'all' ? 'Three' : 'One'} providers in scope`
                    : `${(topShare * 100).toFixed(1)}% from ${topRow?.name ?? 'the leader'}`}
                </Text>
                <Text type="supporting" color="secondary">
                  {view === 'performance'
                    ? 'Switch to Products or Brands to find the sources.'
                    : 'Use this signal to spot dependency risk, not just winners.'}
                </Text>
              </VStack>
            </HStack>
          </Grid>
        </VStack>
      </Card>

      <Card padding={0}>
        <VStack gap={0}>
          <Toolbar
            label={`${viewLabel} table controls`}
            size="sm"
            variant="muted"
            dividers={['bottom']}
            startContent={
              <TextInput
                label={`Search ${viewLabel.toLowerCase()}`}
                isLabelHidden
                placeholder={view === 'performance' ? 'Search dates…' : `Search ${dimensionLabel}…`}
                value={search}
                onChange={setSearch}
                startIcon={Search}
                hasClear
                width={isNarrow ? 180 : 240}
              />
            }
            endContent={
              isNarrow ? (
                <IconButton
                  icon={<Icon icon={Download} />}
                  label={`Export ${viewLabel} as CSV`}
                  variant="secondary"
                  onClick={exportReport}
                />
              ) : (
                <HStack gap={3} align="center">
                  <Text type="supporting" color="secondary">
                    {integer.format(visibleRows.length)} rows
                  </Text>
                  <Button
                    label="Export CSV"
                    icon={<Icon icon={Download} />}
                    variant="secondary"
                    onClick={exportReport}
                  />
                </HStack>
              )
            }
          />
          <Table
            data={visibleRows}
            columns={columns}
            idKey="id"
            density="compact"
            dividers="rows"
            hasHover
            textOverflow="truncate"
          />
        </VStack>
      </Card>
    </VStack>
  )
}
