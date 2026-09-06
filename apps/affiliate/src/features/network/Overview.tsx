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
  Step,
  Stepper,
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
import { Activity, ArrowRight, Building2, RefreshCw, Store, Users } from 'lucide-react'
import {
  advertisers,
  conversions,
  dailyPerformance,
  demoExceptions,
  programOffers,
  properties,
  providers,
  publishers,
  summarizePerformance,
} from '../../../shared/demoData'

import { PerformanceChart } from './PerformanceChart'

import {
  displayStatus,
  formatDate,
  formatMoney,
  integer,
  scopeFactor,
  scopedConversions,
  statusVariant,
} from './formatters'
import { demoSteps, stepMessages } from './navigation'
import type {
  AlertRow,
  BalanceRow,
  ConversionRow,
  DemoIdentity,
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
            variant={index === 0 ? 'blue' : 'default'}
            elevation={index === 0 ? 'low' : 'none'}
            height="100%"
          >
            <VStack gap={1}>
              <Text type="supporting" color="secondary" weight="semibold">
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
                <Text type="supporting" color="secondary">
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

export const alertRows: AlertRow[] = demoExceptions.map((item, index) => ({
  id: `${item.type}-${index}`,
  item: item.label,
  detail: item.detail,
  severity: item.type === 'payout' ? 'error' : item.type === 'review' ? 'accent' : 'warning',
}))

export function makeConversionRows(identity: DemoIdentity, limit = 8): ConversionRow[] {
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

export function makeBalanceRows(identity: DemoIdentity): BalanceRow[] {
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

export const balanceColumns: TableColumn<BalanceRow>[] = [
  {
    key: 'label',
    header: 'Balance state',
    width: proportional(2),
    renderCell: (row) => (
      <HStack gap={2} align="center">
        <StatusDot
          variant={statusVariant(row.status)}
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
                label={activeStep === 1 ? 'Continue demo' : 'Show review step'}
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
  activeStep,
  onStepChange,
  onNavigate,
}: {
  identity: DemoIdentity
  activeStep: number
  onStepChange: (step: number) => void
  onNavigate: (page: string) => void
}) {
  const hasWideSignalLayout = useMediaQuery('(min-width: 1200px)')
  const factor = scopeFactor(identity)
  const last30 = summarizePerformance(dailyPerformance.slice(-30))
  const scoped = (value: number) => Math.round(value * factor)
  const conversionRate = last30.conversions / last30.clicks
  const [messageTitle, messageDescription] = stepMessages[activeStep]
  const balances = makeBalanceRows(identity)
  const payableBalance = balances.find((row) => row.status === 'payable')?.amount ?? 0

  return (
    <VStack gap={8}>
      <Banner
        status={activeStep === 5 ? 'warning' : activeStep === 6 ? 'success' : 'info'}
        title={messageTitle}
        description={messageDescription}
        endContent={
          <Button
            label={activeStep === demoSteps.length - 1 ? 'Restart route' : 'Next step'}
            icon={<Icon icon={activeStep === demoSteps.length - 1 ? RefreshCw : ArrowRight} />}
            variant="secondary"
            onClick={() => onStepChange(activeStep === demoSteps.length - 1 ? 0 : activeStep + 1)}
          />
        }
      >
        <Stepper
          activeStep={activeStep}
          onStepClick={onStepChange}
          label="Canonical Waverly demo journey"
          density="compact"
          indicatorPosition="on-track"
        >
          {demoSteps.map((label, index) => (
            <Step key={label} step={index} label={label} indicator="auto" />
          ))}
        </Stepper>
      </Banner>

      <MetricSummary
        isEditorial
        items={[
          {
            label: 'Order value',
            value: formatMoney(scoped(last30.orderValueCents)),
            context: '+12.4% from prior period',
          },
          {
            label: 'Conversions',
            value: integer.format(scoped(last30.conversions)),
            context: `${(conversionRate * 100).toFixed(2)}% from ${integer.format(scoped(last30.clicks))} clicks`,
          },
          {
            label: identity === 'operator' ? 'Publisher earnings' : 'Earnings',
            value: formatMoney(scoped(last30.publisherEarningsCents)),
            context: 'Original economics retained',
          },
          {
            label: identity === 'operator' ? 'Waverly revenue' : 'Payable now',
            value:
              identity === 'operator'
                ? formatMoney(last30.waverlyRevenueCents)
                : formatMoney(payableBalance),
            context: identity === 'operator' ? '22.8% effective margin' : 'Next payout Sep 1',
          },
        ]}
      />

      <Grid columns={hasWideSignalLayout ? 3 : { minWidth: 380, max: 2, repeat: 'fit' }} gap={5}>
        <GridSpan columns={hasWideSignalLayout ? 2 : 1}>
          <Card padding={0} height="100%">
            <VStack gap={0}>
              <Toolbar
                label={
                  identity === 'operator' ? 'Economic flow controls' : 'Earnings trend controls'
                }
                size="sm"
                variant="muted"
                dividers={['bottom']}
                startContent={
                  <VStack gap={0.5}>
                    <Text weight="semibold">
                      {identity === 'operator' ? 'Economic flow' : 'Earnings trend'}
                    </Text>
                    <Text type="supporting" color="secondary">
                      {identity === 'operator'
                        ? 'Publisher earnings and Waverly revenue'
                        : 'Approved and pending earnings'}
                    </Text>
                  </VStack>
                }
                endContent={<Token label="USD · daily" size="sm" />}
              />
              <VStack padding={3}>
                <PerformanceChart factor={factor} isOperator={identity === 'operator'} />
              </VStack>
            </VStack>
          </Card>
        </GridSpan>
        {identity === 'operator' ? (
          <GridSpan columns={1}>
            <OperationsRail />
          </GridSpan>
        ) : (
          <GridSpan columns={1}>
            <Card padding={0} height="100%">
              <VStack gap={0}>
                <VStack gap={0.5} padding={4}>
                  <Heading level={2}>Money route</Heading>
                  <Text type="supporting" color="secondary">
                    Conversion earnings by ledger state
                  </Text>
                </VStack>
                <Divider />
                <Table
                  data={balances}
                  columns={balanceColumns}
                  idKey="id"
                  density="compact"
                  dividers="rows"
                  textOverflow="truncate"
                />
              </VStack>
            </Card>
          </GridSpan>
        )}
      </Grid>

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
