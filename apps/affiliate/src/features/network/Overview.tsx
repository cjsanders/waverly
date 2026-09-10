import {
  Banner,
  Button,
  Card,
  Divider,
  Grid,
  GridSpan,
  HStack,
  Heading,
  Icon,
  List,
  ListItem,
  ProgressBar,
  StatusDot,
  Table,
  Text,
  Token,
  Toolbar,
  VStack,
  pixel,
  proportional,
  useMediaQuery,
  type TableColumn,
} from '#/features/network/ui/primitives'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Minus,
  Store,
  Users,
} from 'lucide-react'
import { useId, useState, type ComponentProps } from 'react'
import { useHydrated } from '#/lib/use-hydrated'
import { cn } from '#/lib/utils'
import {
  advertisers,
  conversions,
  dailyPerformance,
  networkExceptions,
  programOffers,
  properties,
  providers,
  publishers,
  summarizePerformance,
  type SeedDay,
} from '../../../shared/networkData'

import { PerformanceChart, type PerformanceSeries } from './PerformanceChart'

import {
  displayStatus,
  formatDate,
  formatMoney,
  integer,
  scopeFactor,
  scopedConversions,
  statusVariant,
} from './formatters'
import type {
  AlertRow,
  BalanceRow,
  ConversionRow,
  NetworkIdentity,
  OfferRow,
  RankingRow,
  SurfaceRow,
} from './types'
export function MetricSummary({
  items,
  isCompact = false,
  isEditorial = false,
}: {
  items: Array<{ label: string; value: string; context?: string }>
  isCompact?: boolean
  isEditorial?: boolean
}) {
  const isNarrowEditorial = useMediaQuery('(max-width: 1100px)')
  const isVeryNarrow = useMediaQuery('(max-width: 340px)')
  const columns = isEditorial
    ? { minWidth: 150, max: isNarrowEditorial ? 2 : items.length + 1, repeat: 'fit' as const }
    : { minWidth: 180, max: items.length, repeat: 'fit' as const }
  return (
    <Grid columns={columns} gap={4}>
      {items.map((item, index) => {
        const metric = (
          <Card
            padding={isEditorial && index === 0 ? 5 : 4}
            variant={isEditorial && index === 0 ? 'deep' : 'default'}
            height="100%"
          >
            <VStack gap={1}>
              <Text type="supporting" color="secondary" className="waverly-metric-label">
                {item.label}
              </Text>
              <Text
                type={isEditorial && index === 0 ? 'display-2' : isCompact ? 'large' : 'display-3'}
                weight="semibold"
                hasTabularNumbers
              >
                {item.value}
              </Text>
              {item.context ? (
                <Text type="supporting" color="secondary" className="waverly-metric-context">
                  {item.context}
                </Text>
              ) : null}
            </VStack>
          </Card>
        )
        return isEditorial && index === 0 && !isNarrowEditorial ? (
          <GridSpan key={item.label} columns={2}>
            {metric}
          </GridSpan>
        ) : (
          <GridSpan key={item.label} columns={isVeryNarrow ? 'full' : 1}>
            {metric}
          </GridSpan>
        )
      })}
    </Grid>
  )
}

type StripMetric = {
  id: string
  label: string
  value: string
  subtitle: string
  /** Percent change against the prior period; omitted when there is no comparison. */
  trend?: number
  /** Daily values for the period, drawn as a sparkline; omitted for point-in-time figures. */
  series?: number[]
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

/** Overview headline metrics: one card, one column per metric, hairline dividers between.
    With `onSelect`, metrics that carry a series become toggles that drive the chart below. */
export function MetricStrip({
  items,
  selectedId,
  onSelect,
}: {
  items: StripMetric[]
  selectedId?: string
  onSelect?: (id: string) => void
}) {
  return (
    <Card padding={0} className="waverly-metric-strip">
      <div className="waverly-metric-strip-grid">
        {items.map((item) => {
          const selectable = Boolean(onSelect && item.series && item.series.length > 1)
          const body = (
            <>
              <h3 className="waverly-metric-title">{item.label}</h3>
              <p className="waverly-metric-subtitle">{item.subtitle}</p>
              <div className="waverly-metric-body">
                <div className="waverly-metric-figure">
                  <strong className="waverly-metric-value tabular-nums">{item.value}</strong>
                  {item.trend !== undefined ? <TrendPill value={item.trend} /> : null}
                </div>
                {item.series && item.series.length > 1 ? <Sparkline values={item.series} /> : null}
              </div>
            </>
          )
          return selectable ? (
            <button
              key={item.id}
              type="button"
              className={cn('waverly-metric', 'waverly-metric-selectable')}
              aria-pressed={item.id === selectedId}
              onClick={() => onSelect?.(item.id)}
            >
              {body}
            </button>
          ) : (
            <article key={item.id} className="waverly-metric">
              {body}
            </article>
          )
        })}
      </div>
    </Card>
  )
}

function TrendPill({ value }: { value: number }) {
  const direction = value > 0.05 ? 'up' : value < -0.05 ? 'down' : 'flat'
  const TrendIcon =
    direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus
  return (
    <span className={`waverly-trend waverly-trend-${direction}`}>
      <TrendIcon aria-hidden />
      <span className="sr-only">
        {direction === 'up' ? 'Up' : direction === 'down' ? 'Down' : 'Unchanged'}
      </span>
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

/** A static SVG drawn from the period's daily values; no measurement, so it is SSR-stable.
    The fill fades toward the baseline and the final day is marked, so the eye lands on "now". */
function Sparkline({ values }: { values: number[] }) {
  // React ids carry punctuation that is unsafe inside `url(#…)`; keep only word characters.
  const gradientId = `sparkline-${useId().replace(/[^\w-]/g, '')}`
  const width = 120
  const height = 40
  const inset = 3
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const coordinates = values.map((value, index) => ({
    x: inset + (index / (values.length - 1)) * (width - inset * 2),
    y: inset + (1 - (value - min) / span) * (height - inset * 2),
  }))
  const points = coordinates.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`)
  const line = `M${points.join(' L')}`
  const area = `${line} L${(width - inset).toFixed(1)},${height} L${inset},${height} Z`
  const last = coordinates[coordinates.length - 1]!
  return (
    <svg className="waverly-sparkline" viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sunset)" stopOpacity="0.3" />
          <stop offset="1" stopColor="var(--sunset)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path className="waverly-sparkline-line" d={line} />
      <circle className="waverly-sparkline-end" cx={last.x} cy={last.y} r="2.4" />
    </svg>
  )
}

export function makeRankings(): RankingRow[] {
  const totals = new Map<string, { conversions: number; earnings: number }>()
  for (const conversion of conversions) {
    const current = totals.get(conversion.publisherKey) ?? { conversions: 0, earnings: 0 }
    current.conversions += 1
    current.earnings += conversion.publisherEarningsCents
    totals.set(conversion.publisherKey, current)
  }
  return publishers
    .map((publisher) => ({
      id: publisher.key,
      name: publisher.name,
      context: publisher.key === 'northstar-media' ? '2 properties · 34 links' : '2 properties',
      status: publisher.status === 'active' ? ('healthy' as const) : ('attention' as const),
      conversions: totals.get(publisher.key)?.conversions ?? 0,
      earnings: totals.get(publisher.key)?.earnings ?? 0,
    }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 6)
}

export const rankingColumns: TableColumn<RankingRow>[] = [
  {
    key: 'name',
    header: 'Publisher',
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
    header: 'State',
    width: proportional(1),
    renderCell: (row) => (
      <HStack gap={2} align="center">
        <StatusDot
          variant={row.status === 'healthy' ? 'success' : 'warning'}
          label={`Status indicator for ${row.name}`}
        />
        <Text>{row.status === 'healthy' ? 'Active' : 'Review'}</Text>
      </HStack>
    ),
  },
  {
    key: 'conversions',
    header: 'Conversions',
    width: pixel(120),
    align: 'end',
    renderCell: (row) => <Text hasTabularNumbers>{integer.format(row.conversions)}</Text>,
  },
  {
    key: 'earnings',
    header: 'Publisher earnings',
    width: pixel(160),
    align: 'end',
    renderCell: (row) => <Text hasTabularNumbers>{formatMoney(row.earnings)}</Text>,
  },
]

export const alertRows: AlertRow[] = networkExceptions.map((item, index) => ({
  id: `${item.type}-${index}`,
  item: item.label,
  detail: item.detail,
  severity: item.type === 'payout' ? 'error' : item.type === 'review' ? 'accent' : 'warning',
}))

export function makeConversionRows(identity: NetworkIdentity, limit = 8): ConversionRow[] {
  return scopedConversions(identity)
    .slice()
    .sort((a, b) => b.occurredAt - a.occurredAt)
    .slice(0, limit)
    .map((conversion) => {
      const advertiser = advertisers.find((item) => item.key === conversion.advertiserKey)
      return {
        id: conversion.key,
        transaction: conversion.providerTransactionId,
        advertiser: advertiser?.name ?? conversion.advertiserKey,
        occurredAt: conversion.occurredAt,
        status: conversion.status,
        orderValue: conversion.orderValueCents,
        earnings: conversion.publisherEarningsCents,
      }
    })
}

export const conversionColumns: TableColumn<ConversionRow>[] = [
  {
    key: 'transaction',
    header: 'Provider transaction',
    width: proportional(2),
    renderCell: (row) => (
      <VStack gap={0.5}>
        <Text type="code">{row.transaction}</Text>
        <Text type="supporting" color="secondary">
          {row.advertiser}
        </Text>
      </VStack>
    ),
  },
  {
    key: 'occurredAt',
    header: 'Date',
    width: pixel(90),
    renderCell: (row) => <Text>{formatDate(row.occurredAt)}</Text>,
  },
  {
    key: 'status',
    header: 'State',
    width: pixel(120),
    renderCell: (row) => (
      <HStack gap={2} align="center">
        <StatusDot
          variant={statusVariant(row.status)}
          label={`Status indicator for ${row.transaction}`}
        />
        <Text>{displayStatus(row.status)}</Text>
      </HStack>
    ),
  },
  {
    key: 'orderValue',
    header: 'Order value',
    width: pixel(120),
    align: 'end',
    renderCell: (row) => <Text hasTabularNumbers>{formatMoney(row.orderValue)}</Text>,
  },
  {
    key: 'earnings',
    header: 'Publisher earnings',
    width: pixel(150),
    align: 'end',
    renderCell: (row) => (
      <Text weight="semibold" hasTabularNumbers>
        {formatMoney(row.earnings)}
      </Text>
    ),
  },
]

export function makeBalanceRows(identity: NetworkIdentity): BalanceRow[] {
  const rows = scopedConversions(identity)
  const definitions: Array<BalanceRow['status']> = ['pending', 'approved', 'payable', 'paid']
  return definitions.map((status) => {
    const matching = rows.filter((conversion) => {
      if (status === 'payable') return conversion.status === 'locked'
      return conversion.status === status
    })
    return {
      id: status,
      label: displayStatus(status),
      count: matching.length,
      amount: matching.reduce((sum, conversion) => sum + conversion.publisherEarningsCents, 0),
      status,
    }
  })
}

/** Ledger states form a sequence toward payout; their markers deepen with the wave. */
const ledgerDepth: Record<BalanceRow['status'], string> = {
  pending: 'depth-1',
  approved: 'depth-2',
  payable: 'depth-3',
  paid: 'depth-4',
}

export const balanceColumns: TableColumn<BalanceRow>[] = [
  {
    key: 'label',
    header: 'Balance state',
    width: proportional(2),
    renderCell: (row) => (
      <HStack gap={2} align="center">
        <StatusDot
          variant={ledgerDepth[row.status]}
          label={`Status indicator for ${row.label} balance`}
        />
        <Text weight="semibold">{row.label}</Text>
      </HStack>
    ),
  },
  {
    key: 'count',
    header: 'Conversions',
    width: pixel(110),
    align: 'end',
    renderCell: (row) => <Text hasTabularNumbers>{integer.format(row.count)}</Text>,
  },
  {
    key: 'amount',
    header: 'Amount',
    width: pixel(120),
    align: 'end',
    renderCell: (row) => (
      <Text weight="semibold" hasTabularNumbers>
        {formatMoney(row.amount)}
      </Text>
    ),
  },
]

export function makeOfferRows(limit = 6): OfferRow[] {
  return programOffers.slice(0, limit).map((offer) => ({
    id: offer.key,
    offer: offer.offerName,
    advertiser:
      advertisers.find((item) => item.key === offer.advertiserKey)?.name ?? offer.advertiserKey,
    provider: providers.find((item) => item.key === offer.providerKey)?.name ?? offer.providerKey,
    window: `${offer.attributionWindowDays} days`,
    share: `${(offer.publisherShareBps / 100).toFixed(0)}%`,
  }))
}

export const offerColumns: TableColumn<OfferRow>[] = [
  {
    key: 'offer',
    header: 'Offer',
    width: proportional(2),
    renderCell: (row) => (
      <VStack gap={0.5}>
        <Text weight="semibold">{row.offer}</Text>
        <Text type="supporting" color="secondary">
          {row.advertiser}
        </Text>
      </VStack>
    ),
  },
  { key: 'provider', header: 'Provider', width: proportional(1) },
  { key: 'window', header: 'Attribution', width: pixel(110) },
  { key: 'share', header: 'Publisher share', width: pixel(130), align: 'end' },
]

export function ProviderFreshness() {
  return (
    <List
      density="compact"
      hasDividers
      header={
        <VStack gap={0.5}>
          <Heading level={2}>Provider freshness</Heading>
          <Text type="supporting" color="secondary">
            Target under 60 minutes
          </Text>
        </VStack>
      }
    >
      {providers.map((provider) => (
        <ListItem
          key={provider.key}
          label={provider.name}
          startContent={
            <StatusDot
              variant={provider.status === 'healthy' ? 'success' : 'warning'}
              label={`${provider.name} ${provider.status === 'healthy' ? 'fresh' : 'delayed'}`}
            />
          }
          description={
            <VStack gap={1.5}>
              <Text type="supporting" color="secondary">
                Account connected · last successful sync
              </Text>
              <ProgressBar
                label={`${provider.name} sync freshness`}
                value={provider.latencyMinutes}
                max={120}
                variant={provider.status === 'healthy' ? 'success' : 'warning'}
                isLabelHidden
                marks={[{ value: 60, label: '60 minute target' }]}
              />
            </VStack>
          }
          endContent={
            <Text type="code" hasTabularNumbers>
              {provider.latencyMinutes}m
            </Text>
          }
        />
      ))}
    </List>
  )
}

export function OperationsRail() {
  return (
    <Card padding={0}>
      <VStack gap={0}>
        <Toolbar
          label="Network signal"
          size="sm"
          dividers={['bottom']}
          startContent={
            <HStack gap={2} align="center">
              <Icon icon={Activity} color="accent" />
              <VStack gap={0.5}>
                <Text weight="semibold">Network signal</Text>
                <Text type="supporting" color="secondary">
                  Freshness and exceptions
                </Text>
              </VStack>
            </HStack>
          }
          endContent={<Token label={`${providers.length} providers`} size="sm" color="teal" />}
        />
        <VStack gap={5} padding={4}>
          <ProviderFreshness />
          <Divider />
          <List
            density="compact"
            hasDividers
            header={
              <HStack justify="between" align="center">
                <Heading level={2}>Open exceptions</Heading>
                <Token label={`${alertRows.length} open`} size="sm" color="orange" />
              </HStack>
            }
          >
            {alertRows.map((alert) => (
              <ListItem
                key={alert.id}
                label={alert.item}
                description={alert.detail}
                startContent={<StatusDot variant={alert.severity} label="Attention indicator" />}
              />
            ))}
          </List>
        </VStack>
      </VStack>
    </Card>
  )
}

export function PendingPublisherOverview({
  activeStep,
  onStepChange,
  onNavigate,
}: {
  activeStep: number
  onStepChange: (step: number) => void
  onNavigate: (page: string) => void
}) {
  const pendingProperties = properties.filter(
    (property) => property.publisherKey === 'everyday-finds',
  )
  const pendingPropertyRows: SurfaceRow[] = pendingProperties.map((property) => ({
    id: property.key,
    primary: property.name,
    context: displayStatus(property.type),
    status: 'Pending',
    metric: property.urlOrHandle,
    value: 'Partner review',
  }))

  return (
    <VStack gap={8}>
      <Banner
        status="warning"
        title="Application review in progress"
        description="Submitted Aug 14 · Typical review time is 2–3 business days"
        endContent={
          <Button
            label="View submitted properties"
            icon={<Icon icon={Building2} />}
            variant="secondary"
            onClick={() => onNavigate('Properties')}
          />
        }
      />

      <Grid columns={{ minWidth: 360, max: 2, repeat: 'fit' }} gap={6}>
        <Card padding={4}>
          <VStack gap={4}>
            <VStack gap={0.5}>
              <Heading level={2}>Setup progress</Heading>
              <Text type="supporting" color="secondary">
                Three milestones before links and reporting unlock
              </Text>
            </VStack>
            <ProgressBar
              label="Publisher setup progress"
              value={1}
              max={3}
              hasValueLabel
              formatValueLabel={() => '1 of 3 complete'}
            />
            <List
              density="compact"
              hasDividers
              header={<Text weight="semibold">Approval milestones</Text>}
            >
              <ListItem
                label="Organization profile complete"
                description="Identity and contact details saved"
                startContent={<StatusDot variant="success" label="Complete" />}
              />
              <ListItem
                label="2 properties awaiting review"
                description="Website and newsletter are in the same review"
                startContent={<StatusDot variant="warning" label="In review" />}
              />
              <ListItem
                label="Payout setup unlocks after approval"
                description="No earnings or payout history exists yet"
                startContent={<StatusDot variant="neutral" label="Locked" />}
              />
            </List>
          </VStack>
        </Card>

        <Card padding={4}>
          <VStack gap={4}>
            <VStack gap={0.5}>
              <Heading level={2}>What you can do now</Heading>
              <Text type="supporting" color="secondary">
                Explore terms while partner operations completes the review
              </Text>
            </VStack>
            <VStack gap={3}>
              <Text>
                Browse {integer.format(programOffers.length)} eligible offers across{' '}
                {integer.format(advertisers.length)} advertisers.
              </Text>
              <Text>
                Compare attribution windows and publisher share without provider-specific
                terminology.
              </Text>
              <Text color="secondary">
                Creating links, performance reporting, and payouts unlock after approval.
              </Text>
            </VStack>
            <HStack gap={2} wrap="wrap">
              <Button
                label="Discover offers"
                icon={<Icon icon={Store} />}
                variant="primary"
                size="sm"
                onClick={() => onNavigate('For you')}
              />
              <Button
                label={activeStep === 1 ? 'Continue workflow' : 'Show review step'}
                icon={<Icon icon={ArrowRight} />}
                variant="ghost"
                size="sm"
                onClick={() => onStepChange(activeStep === 1 ? 2 : 1)}
              />
            </HStack>
          </VStack>
        </Card>
      </Grid>

      <VStack gap={3}>
        <HStack justify="between" align="center">
          <VStack gap={0.5}>
            <Heading level={2}>Submitted properties</Heading>
            <Text type="supporting" color="secondary">
              Both properties move together through partner review
            </Text>
          </VStack>
          <Text type="supporting" color="secondary">
            {pendingProperties.length} submitted
          </Text>
        </HStack>
        <Table
          data={pendingPropertyRows}
          columns={[
            {
              key: 'primary',
              header: 'Property',
              width: proportional(2),
              renderCell: (row) => <Text weight="semibold">{row.primary}</Text>,
            },
            { key: 'context', header: 'Channel', width: proportional(1) },
            { key: 'metric', header: 'Address', width: proportional(2) },
            {
              key: 'status',
              header: 'Review state',
              width: pixel(140),
              renderCell: (row) => (
                <HStack gap={2} align="center">
                  <StatusDot variant="warning" label={`Review indicator for ${row.primary}`} />
                  <Text>Pending</Text>
                </HStack>
              ),
            },
          ]}
          idKey="id"
          density="compact"
          dividers="rows"
          textOverflow="truncate"
        />
      </VStack>
    </VStack>
  )
}

export function Overview({
  identity,
  onNavigate,
}: {
  identity: NetworkIdentity
  onNavigate: (page: string) => void
}) {
  const hasWideSignalLayout = useMediaQuery('(min-width: 1200px)')
  const factor = scopeFactor(identity)
  const last30Days = dailyPerformance.slice(-30)
  const last30 = summarizePerformance(last30Days)
  const prior30 = summarizePerformance(dailyPerformance.slice(-60, -30))
  const scoped = (value: number) => Math.round(value * factor)
  const conversionRate = last30.conversions / last30.clicks
  const balances = makeBalanceRows(identity)
  const payableBalance = balances.find((row) => row.status === 'payable')?.amount ?? 0
  const prior30Days = dailyPerformance.slice(-60, -30)
  const [selectedMetric, setSelectedMetric] = useState('orderValue')
  const chartMetrics: Record<
    string,
    { label: string; format: 'money' | 'count'; pick: (day: SeedDay) => number }
  > = {
    orderValue: {
      label: 'Order value',
      format: 'money',
      pick: (day) => scoped(day.orderValueCents) / 100,
    },
    conversions: {
      label: 'Conversions',
      format: 'count',
      pick: (day) => scoped(day.conversions),
    },
    earnings: {
      label: identity === 'operator' ? 'Publisher earnings' : 'Earnings',
      format: 'money',
      pick: (day) => scoped(day.publisherEarningsCents) / 100,
    },
    revenue: {
      label: 'Waverly revenue',
      format: 'money',
      pick: (day) => day.waverlyRevenueCents / 100,
    },
  }
  const chartMetric = chartMetrics[selectedMetric] ?? chartMetrics.orderValue!
  const currentSeries: PerformanceSeries = {
    name: 'Last 30 days',
    values: last30Days.map(chartMetric.pick),
  }
  const previousSeries: PerformanceSeries = {
    name: 'Previous 30 days',
    values: prior30Days.map(chartMetric.pick),
  }

  const chartCard = (
    <Card padding={0} height="100%">
      <VStack gap={0}>
        <Toolbar
          label={`${chartMetric.label} trend`}
          size="sm"
          variant="muted"
          dividers={['bottom']}
          startContent={
            <VStack gap={0.5}>
              <Text weight="semibold">{chartMetric.label} by day</Text>
              <Text type="supporting" color="secondary">
                Pick a metric above to change the chart.
              </Text>
            </VStack>
          }
          endContent={<TrendLegend />}
        />
        <VStack padding={3}>
          <TrendChart
            current={currentSeries}
            previous={previousSeries}
            dates={last30Days.map((day) => day.occurredAt)}
            format={chartMetric.format}
            ariaLabel={`${chartMetric.label} per day for the last 30 days and the previous 30 days`}
          />
        </VStack>
      </VStack>
    </Card>
  )

  return (
    <VStack gap={8}>
      <MetricStrip
        selectedId={selectedMetric}
        onSelect={setSelectedMetric}
        items={[
          {
            id: 'orderValue',
            label: 'Order value',
            value: formatMoney(scoped(last30.orderValueCents)),
            subtitle: 'Over last 30 days',
            trend: percentChange(last30.orderValueCents, prior30.orderValueCents),
            series: last30Days.map((day) => day.orderValueCents),
          },
          {
            id: 'conversions',
            label: 'Conversions',
            value: integer.format(scoped(last30.conversions)),
            subtitle: `${(conversionRate * 100).toFixed(2)}% of ${integer.format(scoped(last30.clicks))} clicks`,
            trend: percentChange(last30.conversions, prior30.conversions),
            series: last30Days.map((day) => day.conversions),
          },
          {
            id: 'earnings',
            label: identity === 'operator' ? 'Publisher earnings' : 'Earnings',
            value: formatMoney(scoped(last30.publisherEarningsCents)),
            subtitle: 'Over last 30 days',
            trend: percentChange(last30.publisherEarningsCents, prior30.publisherEarningsCents),
            series: last30Days.map((day) => day.publisherEarningsCents),
          },
          identity === 'operator'
            ? {
                id: 'revenue',
                label: 'Waverly revenue',
                value: formatMoney(last30.waverlyRevenueCents),
                subtitle: 'Over last 30 days',
                trend: percentChange(last30.waverlyRevenueCents, prior30.waverlyRevenueCents),
                series: last30Days.map((day) => day.waverlyRevenueCents),
              }
            : {
                id: 'payable',
                label: 'Payable now',
                value: formatMoney(payableBalance),
                subtitle: 'Next payout Sep 1',
              },
        ]}
      />

      {identity === 'operator' ? (
        <Grid columns={hasWideSignalLayout ? 3 : { minWidth: 380, max: 2, repeat: 'fit' }} gap={5}>
          <GridSpan columns={hasWideSignalLayout ? 2 : 1}>{chartCard}</GridSpan>
          <GridSpan columns={1}>
            <OperationsRail />
          </GridSpan>
        </Grid>
      ) : (
        chartCard
      )}

      <Card padding={0}>
        <VStack gap={0}>
          <Toolbar
            label="Recent conversion actions"
            size="sm"
            variant="muted"
            dividers={['bottom']}
            startContent={
              <VStack gap={0.5}>
                <Text weight="semibold">Recent conversions</Text>
                <Text type="supporting" color="secondary">
                  Provider identity, state, and snapshotted economics
                </Text>
              </VStack>
            }
            endContent={
              <Button
                label="View all"
                icon={<Icon icon={ArrowRight} />}
                variant="ghost"
                onClick={() => onNavigate(identity === 'operator' ? 'Conversions' : 'Earnings')}
              />
            }
          />
          <Table
            data={makeConversionRows(identity)}
            columns={conversionColumns}
            idKey="id"
            density="compact"
            dividers="rows"
            hasHover
            textOverflow="truncate"
          />
        </VStack>
      </Card>

      {identity === 'operator' ? (
        <Card padding={0}>
          <VStack gap={0}>
            <Toolbar
              label="Publisher movement actions"
              size="sm"
              variant="muted"
              dividers={['bottom']}
              startContent={<Text weight="semibold">Publisher movement</Text>}
              endContent={
                <Button
                  label="View publishers"
                  icon={<Icon icon={Users} />}
                  variant="ghost"
                  onClick={() => onNavigate('Publishers')}
                />
              }
            />
            <Table
              data={makeRankings()}
              columns={rankingColumns}
              idKey="id"
              density="compact"
              dividers="rows"
              hasHover
              textOverflow="truncate"
            />
          </VStack>
        </Card>
      ) : (
        <Card padding={0}>
          <VStack gap={0}>
            <Toolbar
              label="Eligible offer actions"
              size="sm"
              variant="muted"
              dividers={['bottom']}
              startContent={
                <VStack gap={0.5}>
                  <Text weight="semibold">Eligible offers</Text>
                  <Text type="supporting" color="secondary">
                    Normalized terms across every connected provider
                  </Text>
                </VStack>
              }
              endContent={
                <Button
                  label="Explore offers"
                  icon={<Icon icon={Store} />}
                  variant="secondary"
                  onClick={() => onNavigate('For you')}
                />
              }
            />
            <Table
              data={makeOfferRows()}
              columns={offerColumns}
              idKey="id"
              density="compact"
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

/** Legend for the trend chart: the live line and the comparison line. */
export function TrendLegend() {
  return (
    <span className="waverly-chart-legend">
      <span>
        <i aria-hidden />
        Last 30 days
      </span>
      <span>
        <i aria-hidden className="waverly-chart-legend-compare" />
        Previous 30 days
      </span>
    </span>
  )
}

/** The responsive SVG measures its container, so render it after hydration to keep SSR stable. */
export function TrendChart(props: ComponentProps<typeof PerformanceChart>) {
  const mounted = useHydrated()

  if (!mounted) return <div className="h-[280px]" aria-hidden />
  return <PerformanceChart {...props} />
}
