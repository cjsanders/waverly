import {
  Card,
  HStack,
  Heading,
  Selector,
  StatusDot,
  Table,
  Text,
  TextInput,
  Toolbar,
  VStack,
  pixel,
  proportional,
  type TableColumn,
} from '#/features/network/ui/primitives'
import { useState } from 'react'
import {
  advertisers,
  conversions,
  dailyPerformance,
  demoExceptions,
  links,
  programOffers,
  properties,
  providers,
  publishers,
  summarizePerformance,
} from '../../../shared/demoData'

import {
  displayStatus,
  formatDate,
  formatMoney,
  integer,
  publisherKeyForIdentity,
  scopeFactor,
  scopedConversions,
  statusVariant,
} from './formatters'
import { MetricSummary, makeBalanceRows } from './Overview'
import type { DemoIdentity, SurfaceConfig, SurfaceRow } from './types'
export function makeSurfaceConfig(page: string, identity: DemoIdentity): SurfaceConfig {
  const publisherKey = publisherKeyForIdentity(identity)
  const publisherLabel =
    identity === 'operator'
      ? 'Network'
      : identity === 'northstar'
        ? 'Northstar Media'
        : 'Everyday Finds'
  const conversionScope = scopedConversions(identity)
  const linkScope = publisherKey
    ? links.filter((link) => link.publisherKey === publisherKey)
    : links
  const propertyScope = publisherKey
    ? properties.filter((property) => property.publisherKey === publisherKey)
    : properties

  let description = 'Operational records from the deterministic Waverly dataset.'
  let primaryLabel = 'Record'
  let contextLabel = 'Context'
  let metricLabel = 'Activity'
  let valueLabel = 'Value'
  let rows: SurfaceRow[]

  if (page === 'Publishers') {
    description = 'Publisher health, property footprint, conversion activity, and accrued earnings.'
    primaryLabel = 'Publisher'
    contextLabel = 'Footprint'
    metricLabel = 'Conversions'
    valueLabel = 'Earnings'
    rows = publishers.map((publisher) => {
      const publisherConversions = conversions.filter((item) => item.publisherKey === publisher.key)
      return {
        id: publisher.key,
        primary: publisher.name,
        context: `${properties.filter((item) => item.publisherKey === publisher.key).length} properties · ${links.filter((item) => item.publisherKey === publisher.key).length} links`,
        status: displayStatus(publisher.status),
        metric: integer.format(publisherConversions.length),
        value: formatMoney(
          publisherConversions.reduce((sum, item) => sum + item.publisherEarningsCents, 0),
        ),
      }
    })
  } else if (page === 'Advertisers') {
    description =
      'Commercial coverage across advertisers, categories, providers, and gross commission.'
    primaryLabel = 'Advertiser'
    contextLabel = 'Category'
    metricLabel = 'Offers'
    valueLabel = 'Gross commission'
    rows = advertisers.map((advertiser) => {
      const advertiserPrograms = programOffers.filter(
        (item) => item.advertiserKey === advertiser.key,
      )
      const gross = conversions
        .filter((item) => item.advertiserKey === advertiser.key)
        .reduce((sum, item) => sum + item.grossCommissionCents, 0)
      return {
        id: advertiser.key,
        primary: advertiser.name,
        context: advertiser.category,
        status: 'Active',
        metric: integer.format(advertiserPrograms.length),
        value: formatMoney(gross),
      }
    })
  } else if (['Programs', 'Offers', 'Discover', 'My offers'].includes(page)) {
    const joinedOfferKeys = new Set(linkScope.map((link) => link.offerKey))
    const visibleOffers =
      page === 'My offers'
        ? programOffers.filter((offer) => joinedOfferKeys.has(offer.key))
        : programOffers
    description =
      page === 'Discover'
        ? 'Compare publisher-eligible offers without provider-specific complexity.'
        : page === 'My offers'
          ? "Offers currently connected to this publisher's Waverly links."
          : page === 'Programs'
            ? "Provider programs normalized into Waverly's commercial model."
            : 'Offer terms publishers can use across the network.'
    primaryLabel = page === 'Programs' ? 'Program' : 'Offer'
    contextLabel = 'Advertiser · provider'
    metricLabel = 'Attribution'
    valueLabel = 'Publisher share'
    rows = visibleOffers.map((offer) => ({
      id: offer.key,
      primary: page === 'Programs' ? offer.programName : offer.offerName,
      context: `${advertisers.find((item) => item.key === offer.advertiserKey)?.name ?? offer.advertiserKey} · ${providers.find((item) => item.key === offer.providerKey)?.name ?? offer.providerKey}`,
      status: offer.featured ? 'Featured' : 'Active',
      metric: `${offer.attributionWindowDays} days`,
      value: `${(offer.publisherShareBps / 100).toFixed(0)}%`,
    }))
  } else if (page === 'Links') {
    description =
      'Stable Waverly links with publisher scope, destination ownership, and immutable version context.'
    primaryLabel = 'Link'
    contextLabel = 'Publisher · property'
    metricLabel = 'Created'
    valueLabel = 'Slug'
    rows = linkScope.slice(0, 20).map((link) => ({
      id: link.key,
      primary: link.displayName,
      context: `${publishers.find((item) => item.key === link.publisherKey)?.name ?? link.publisherKey} · ${properties.find((item) => item.key === link.propertyKey)?.name ?? link.propertyKey}`,
      status: 'Active',
      metric: formatDate(link.createdAt),
      value: link.slug,
    }))
  } else if (page === 'Clicks') {
    description = 'Daily click volume and conversion response across Waverly links.'
    primaryLabel = 'Reporting date'
    contextLabel = 'Traffic'
    metricLabel = 'Conversion rate'
    valueLabel = 'Conversions'
    rows = dailyPerformance
      .slice(-30)
      .toReversed()
      .map((day) => ({
        id: day.date,
        primary: day.date,
        context: `${integer.format(Math.round(day.clicks * scopeFactor(identity)))} clicks · ${integer.format(Math.round(day.uniqueClicks * scopeFactor(identity)))} unique`,
        status: day.reversals > 0 ? 'Review' : 'Reporting',
        metric: `${((day.conversions / day.clicks) * 100).toFixed(2)}%`,
        value: integer.format(Math.round(day.conversions * scopeFactor(identity))),
      }))
  } else if (['Reports', 'Performance'].includes(page)) {
    description =
      page === 'Reports'
        ? 'Daily commercial reporting with gross commission and Waverly revenue separated.'
        : 'Traffic, conversion, and publisher earnings over the reporting window.'
    primaryLabel = 'Reporting date'
    contextLabel = page === 'Reports' ? 'Order value' : 'Traffic'
    metricLabel = page === 'Reports' ? 'Gross commission' : 'Conversions'
    valueLabel = page === 'Reports' ? 'Waverly revenue' : 'Earnings'
    rows = dailyPerformance
      .slice(-30)
      .toReversed()
      .map((day) => ({
        id: day.date,
        primary: day.date,
        context:
          page === 'Reports'
            ? formatMoney(day.orderValueCents)
            : `${integer.format(Math.round(day.clicks * scopeFactor(identity)))} clicks · ${integer.format(Math.round(day.uniqueClicks * scopeFactor(identity)))} unique`,
        status: day.reversals > 0 ? 'Review' : 'Reporting',
        metric:
          page === 'Reports'
            ? formatMoney(day.grossCommissionCents)
            : integer.format(Math.round(day.conversions * scopeFactor(identity))),
        value:
          page === 'Reports'
            ? formatMoney(day.waverlyRevenueCents)
            : formatMoney(Math.round(day.publisherEarningsCents * scopeFactor(identity))),
      }))
  } else if (['Conversions', 'Earnings'].includes(page)) {
    description =
      'Provider transactions with snapshotted attribution, status, and publisher economics.'
    primaryLabel = 'Provider transaction'
    contextLabel = 'Advertiser'
    metricLabel = page === 'Earnings' ? 'Gross commission' : 'Order value'
    valueLabel = 'Publisher earnings'
    rows = conversionScope
      .slice()
      .sort((a, b) => b.occurredAt - a.occurredAt)
      .slice(0, 20)
      .map((conversion) => ({
        id: conversion.key,
        primary: conversion.providerTransactionId,
        context: `${advertisers.find((item) => item.key === conversion.advertiserKey)?.name ?? conversion.advertiserKey} · ${formatDate(conversion.occurredAt)}`,
        status: displayStatus(conversion.status),
        metric: formatMoney(
          page === 'Earnings' ? conversion.grossCommissionCents : conversion.orderValueCents,
        ),
        value: formatMoney(conversion.publisherEarningsCents),
      }))
  } else if (page === 'Balances') {
    description =
      'Publisher liabilities grouped by the ledger state that controls payout eligibility.'
    primaryLabel = 'Balance state'
    contextLabel = 'Settlement meaning'
    metricLabel = 'Conversions'
    valueLabel = 'Amount'
    rows = makeBalanceRows(identity).map((balance) => ({
      id: balance.id,
      primary: balance.label,
      context:
        balance.status === 'pending'
          ? 'Awaiting advertiser decision'
          : balance.status === 'approved'
            ? 'Approved, not yet locked'
            : balance.status === 'payable'
              ? 'Eligible for next payout'
              : 'Already settled',
      status: balance.label,
      metric: integer.format(balance.count),
      value: formatMoney(balance.amount),
    }))
  } else if (page === 'Payouts') {
    description = 'Payout readiness derived from payable balances and the $50 settlement minimum.'
    primaryLabel = 'Payout batch'
    contextLabel = 'Publisher · period'
    metricLabel = 'Entries'
    valueLabel = 'Amount'
    const payoutPublishers =
      identity === 'operator'
        ? publishers.slice(0, 10)
        : publishers.filter((publisher) => publisher.key === publisherKey)
    rows = payoutPublishers.map((publisher, index) => {
      const payable = conversions.filter(
        (item) => item.publisherKey === publisher.key && item.status === 'locked',
      )
      const amount = payable.reduce((sum, item) => sum + item.publisherEarningsCents, 0)
      const meetsMinimum = amount >= 5_000
      return {
        id: `payout-${publisher.key}`,
        primary: meetsMinimum ? `PO-${20260800 + index + 1}` : 'Balance accruing',
        context: `${publisher.name} · Jul 1–31`,
        status: meetsMinimum ? (index % 3 === 0 ? 'Paid' : 'Scheduled') : 'Below minimum',
        metric: integer.format(payable.length),
        value: formatMoney(amount),
      }
    })
  } else if (page === 'Providers') {
    description = 'Connection freshness and normalized record volume for each provider account.'
    primaryLabel = 'Provider'
    contextLabel = 'Connection'
    metricLabel = 'Freshness'
    valueLabel = 'Transactions'
    rows = providers.map((provider) => ({
      id: provider.key,
      primary: provider.name,
      context: `waverly-${provider.key}-demo`,
      status: provider.status === 'healthy' ? 'Fresh' : 'Delayed',
      metric: `${provider.latencyMinutes}m`,
      value: integer.format(conversions.filter((item) => item.providerKey === provider.key).length),
    }))
  } else if (page === 'Properties') {
    description = 'Publisher channels and the review state that controls offer and link access.'
    primaryLabel = 'Property'
    contextLabel = 'Type · address'
    metricLabel = 'Links'
    valueLabel = 'Publisher'
    rows = propertyScope.map((property) => ({
      id: property.key,
      primary: property.name,
      context: `${displayStatus(property.type)} · ${property.urlOrHandle}`,
      status: displayStatus(property.approvalStatus),
      metric: integer.format(links.filter((item) => item.propertyKey === property.key).length),
      value:
        publishers.find((item) => item.key === property.publisherKey)?.name ??
        property.publisherKey,
    }))
  } else if (page === 'Messages') {
    description =
      identity === 'operator'
        ? 'Exceptions routed to the team that can resolve them.'
        : "Updates relevant to this publisher's application and account."
    primaryLabel = 'Notice'
    contextLabel = 'Detail'
    metricLabel = 'Owner'
    valueLabel = 'Age'
    const visibleMessages =
      identity === 'operator'
        ? demoExceptions.map((item) => ({
            type: item.type,
            label: item.label,
            detail: item.detail,
          }))
        : identity === 'everyday'
          ? [
              {
                type: 'review',
                label: 'Application review started',
                detail: 'Everyday Finds · submitted Aug 14',
              },
              {
                type: 'review',
                label: 'Two properties received',
                detail: 'Website and newsletter are being reviewed together',
              },
            ]
          : [
              {
                type: 'payout',
                label: 'August payout is on schedule',
                detail: 'Payable balance exceeds the $50 minimum',
              },
              {
                type: 'review',
                label: 'New offer terms available',
                detail: '4 featured offers were added this week',
              },
            ]
    rows = visibleMessages.map((item, index) => ({
      id: `${item.type}-${index}`,
      primary: item.label,
      context: item.detail,
      status: item.type === 'payout' ? 'Attention' : 'Review',
      metric:
        item.type === 'sync' ? 'Data ops' : item.type === 'payout' ? 'Finance' : 'Partner ops',
      value: `${index + 1}h`,
    }))
  } else {
    description =
      identity === 'operator'
        ? 'Settlement and reporting preferences for the Waverly network.'
        : 'Organization preferences for the current publisher workspace.'
    primaryLabel = 'Setting'
    contextLabel = 'Purpose'
    metricLabel = 'Source'
    valueLabel = 'Value'
    rows = [
      {
        id: 'currency',
        primary: 'Settlement currency',
        context: 'Financial reporting and payouts',
        status: 'Active',
        metric: 'Finance',
        value: 'USD',
      },
      {
        id: 'window',
        primary: 'Reporting window',
        context: 'Default performance comparison',
        status: 'Active',
        metric: 'Reporting',
        value: '30 days',
      },
      {
        id: 'minimum',
        primary: 'Payout minimum',
        context: 'Minimum payable balance',
        status: 'Active',
        metric: 'Finance',
        value: '$50',
      },
      {
        id: 'notices',
        primary: 'Operational notices',
        context: 'Email and workspace delivery',
        status: 'Active',
        metric: 'Notifications',
        value: identity === 'operator' ? 'Daily digest' : 'Important only',
      },
    ]
  }

  return {
    eyebrow:
      identity === 'operator'
        ? 'NETWORK OPERATIONS'
        : page === 'Settings'
          ? 'ORGANIZATION'
          : 'PUBLISHER WORKSPACE',
    description,
    tableTitle: surfaceTableTitles[page] ?? page,
    tableDescription:
      surfaceTableDescriptions[page] ?? `Current ${page.toLowerCase()} ordered for review`,
    primaryLabel,
    contextLabel,
    metricLabel,
    valueLabel,
    rows,
    highlights: makeSurfaceHighlights(
      page,
      identity,
      rows,
      conversionScope,
      linkScope,
      propertyScope,
      publisherLabel,
    ),
  }
}

export const surfaceTableTitles: Record<string, string> = {
  Publishers: 'Publisher directory',
  Advertisers: 'Advertiser directory',
  Programs: 'Provider programs',
  Offers: 'Network offers',
  Discover: 'Eligible offers',
  'My offers': 'Connected offers',
  Links: 'Current links',
  Clicks: 'Daily traffic',
  Reports: 'Daily economics',
  Performance: 'Daily performance',
  Conversions: 'Conversion ledger',
  Earnings: 'Earning events',
  Balances: 'Balance states',
  Payouts: 'Publisher payout readiness',
  Providers: 'Provider connections',
  Properties: 'Submitted properties',
  Messages: 'Open notices',
  Settings: 'Current preferences',
}

export const surfaceTableDescriptions: Record<string, string> = {
  Publishers: 'Active partners and applications that need review',
  Advertisers: 'Commercial relationships ordered by advertiser name',
  Programs: "Provider programs normalized into Waverly's commercial model",
  Offers: 'Normalized attribution and publisher-share terms',
  Discover: 'Compare terms without provider-specific complexity',
  'My offers': 'Only offers already in use by this publisher',
  Links: 'Current destinations; historical versions remain immutable',
  Clicks: 'Most recent 30 days, newest first',
  Reports: 'Order value, gross commission, and Waverly revenue',
  Performance: 'Traffic, conversions, and publisher earnings',
  Conversions: 'Provider identity and current conversion state',
  Earnings: 'Publisher economics retained at conversion time',
  Balances: 'Ledger totals grouped by payout eligibility',
  Payouts: 'Balances below the $50 minimum continue accruing',
  Providers: 'Freshness target: under 60 minutes',
  Properties: 'Review state controls offer and link access',
  Messages: 'Messages visible to the current workspace',
  Settings: 'Settlement, reporting, and notification values',
}

export function makeSurfaceHighlights(
  page: string,
  identity: DemoIdentity,
  rows: SurfaceRow[],
  conversionScope: typeof conversions,
  linkScope: typeof links,
  propertyScope: typeof properties,
  publisherLabel: string,
): SurfaceConfig['highlights'] {
  const gross = conversionScope.reduce((sum, item) => sum + item.grossCommissionCents, 0)
  const earnings = conversionScope.reduce((sum, item) => sum + item.publisherEarningsCents, 0)
  if (page === 'Publishers')
    return [
      {
        label: 'Active publishers',
        value: integer.format(publishers.filter((item) => item.status === 'active').length),
      },
      {
        label: 'Awaiting review',
        value: integer.format(publishers.filter((item) => item.status === 'pending').length),
      },
      { label: 'Current links', value: integer.format(links.length) },
    ]
  if (page === 'Advertisers')
    return [
      { label: 'Advertisers', value: integer.format(advertisers.length) },
      { label: 'Live offers', value: integer.format(programOffers.length) },
      {
        label: 'Gross commission',
        value: formatMoney(conversions.reduce((sum, item) => sum + item.grossCommissionCents, 0)),
      },
    ]
  if (['Programs', 'Offers', 'Discover', 'My offers'].includes(page))
    return [
      {
        label: page === 'My offers' ? 'Connected offers' : 'Available offers',
        value: integer.format(rows.length),
      },
      {
        label: 'Featured now',
        value: integer.format(rows.filter((row) => row.status === 'Featured').length),
      },
      { label: 'Connected providers', value: integer.format(providers.length) },
    ]
  if (page === 'Links')
    return [
      { label: 'Current links', value: integer.format(linkScope.length) },
      { label: 'Properties', value: integer.format(propertyScope.length) },
      { label: 'Revised destinations', value: identity === 'operator' ? '4' : '1' },
    ]
  if (['Clicks', 'Reports', 'Performance'].includes(page)) {
    const summary = summarizePerformance(dailyPerformance.slice(-30))
    return page === 'Reports'
      ? [
          { label: 'Order value', value: formatMoney(summary.orderValueCents) },
          { label: 'Gross commission', value: formatMoney(summary.grossCommissionCents) },
          { label: 'Waverly revenue', value: formatMoney(summary.waverlyRevenueCents) },
        ]
      : [
          {
            label: 'Clicks',
            value: integer.format(Math.round(summary.clicks * scopeFactor(identity))),
          },
          {
            label: 'Conversions',
            value: integer.format(Math.round(summary.conversions * scopeFactor(identity))),
          },
          {
            label: page === 'Clicks' ? 'Conversion rate' : 'Publisher earnings',
            value:
              page === 'Clicks'
                ? `${((summary.conversions / summary.clicks) * 100).toFixed(2)}%`
                : formatMoney(Math.round(summary.publisherEarningsCents * scopeFactor(identity))),
          },
        ]
  }
  if (['Conversions', 'Earnings'].includes(page))
    return [
      { label: 'Conversions', value: integer.format(conversionScope.length) },
      { label: 'Gross commission', value: formatMoney(gross) },
      { label: 'Publisher earnings', value: formatMoney(earnings) },
    ]
  if (page === 'Balances') {
    const balanceRows = makeBalanceRows(identity)
    return [
      {
        label: 'Pending',
        value: formatMoney(balanceRows.find((item) => item.status === 'pending')?.amount ?? 0),
      },
      {
        label: 'Payable',
        value: formatMoney(balanceRows.find((item) => item.status === 'payable')?.amount ?? 0),
      },
      {
        label: 'Paid',
        value: formatMoney(balanceRows.find((item) => item.status === 'paid')?.amount ?? 0),
      },
    ]
  }
  if (page === 'Payouts')
    return [
      {
        label: 'Ready or scheduled',
        value: integer.format(rows.filter((row) => row.status !== 'Below minimum').length),
      },
      {
        label: 'Below minimum',
        value: integer.format(rows.filter((row) => row.status === 'Below minimum').length),
      },
      { label: 'Payout minimum', value: '$50' },
    ]
  if (page === 'Providers')
    return [
      { label: 'Connected', value: integer.format(providers.length) },
      {
        label: 'Within target',
        value: integer.format(providers.filter((item) => item.latencyMinutes < 60).length),
      },
      {
        label: 'Needs attention',
        value: integer.format(providers.filter((item) => item.latencyMinutes >= 60).length),
      },
    ]
  if (page === 'Properties')
    return [
      { label: 'Properties', value: integer.format(propertyScope.length) },
      {
        label: 'Approved',
        value: integer.format(
          propertyScope.filter((item) => item.approvalStatus === 'approved').length,
        ),
      },
      {
        label: 'In review',
        value: integer.format(
          propertyScope.filter((item) => item.approvalStatus === 'pending').length,
        ),
      },
    ]
  if (page === 'Messages')
    return [
      { label: 'Open notices', value: integer.format(rows.length) },
      {
        label: 'Needs action',
        value: integer.format(rows.filter((row) => row.status === 'Attention').length),
      },
      { label: 'Audience', value: identity === 'operator' ? 'Operations' : publisherLabel },
    ]
  return [
    { label: 'Settlement currency', value: 'USD' },
    { label: 'Payout minimum', value: '$50' },
    { label: 'Reporting timezone', value: 'Pacific' },
  ]
}

export function DataSurface({ page, identity }: { page: string; identity: DemoIdentity }) {
  const config = makeSurfaceConfig(page, identity)
  const [filterState, setFilterState] = useState('All states')
  const [search, setSearch] = useState('')
  const statusOptions = ['All states', ...Array.from(new Set(config.rows.map((row) => row.status)))]
  const normalizedSearch = search.trim().toLowerCase()
  const visibleRows = config.rows.filter((row) => {
    const matchesState = filterState === 'All states' || row.status === filterState
    const matchesSearch =
      !normalizedSearch ||
      [row.primary, row.context, row.status, row.metric, row.value].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      )
    return matchesState && matchesSearch
  })
  const columns: TableColumn<SurfaceRow>[] = [
    {
      key: 'primary',
      header: config.primaryLabel,
      width: proportional(2),
      renderCell: (row) => <Text weight="semibold">{row.primary}</Text>,
    },
    { key: 'context', header: config.contextLabel, width: proportional(2) },
    {
      key: 'status',
      header: 'State',
      width: pixel(120),
      renderCell: (row) => (
        <HStack gap={2} align="center">
          <StatusDot
            variant={statusVariant(row.status)}
            label={`Status indicator for ${row.primary}`}
          />
          <Text>{row.status}</Text>
        </HStack>
      ),
    },
    { key: 'metric', header: config.metricLabel, width: pixel(130), align: 'end' },
    { key: 'value', header: config.valueLabel, width: pixel(150), align: 'end' },
  ]

  return (
    <VStack gap={6}>
      <MetricSummary items={config.highlights} isCompact />
      <VStack gap={3}>
        <VStack gap={0.5}>
          <Heading level={2}>{config.tableTitle}</Heading>
          <Text type="supporting" color="secondary">
            {config.tableDescription}
          </Text>
        </VStack>
        <Card padding={0}>
          <VStack gap={0}>
            <Toolbar
              label={`${page} table controls`}
              size="sm"
              variant="muted"
              dividers={['bottom']}
              startContent={
                <TextInput
                  label={`Search ${page.toLowerCase()}`}
                  isLabelHidden
                  placeholder={`Search ${page.toLowerCase()}…`}
                  value={search}
                  onChange={setSearch}
                  hasClear
                  width={220}
                />
              }
              endContent={
                <HStack gap={2} align="center">
                  <Text type="supporting" color="secondary">
                    {integer.format(visibleRows.length)} of {integer.format(config.rows.length)}
                  </Text>
                  <Selector
                    label="Filter by state"
                    isLabelHidden
                    options={statusOptions}
                    value={filterState}
                    onChange={setFilterState}
                    variant="ghost"
                  />
                </HStack>
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
    </VStack>
  )
}
