import { demoExceptions, properties } from '../../../shared/demoData'
import { sellerApplications, sellerSamples } from '../../../shared/demoSellerData'
import { formatMoney, scopedConversions } from './formatters'
import type { DemoIdentity } from './types'

export interface WorkspaceAlert {
  id: string
  title: string
  detail: string
  page: string
}

/** Notices from the same sample workspace data displayed on the destination pages. */
export function workspaceAlerts(identity: DemoIdentity): WorkspaceAlert[] {
  if (identity === 'operator') {
    const pages = {
      review: 'Publishers',
      sync: 'Providers',
      match: 'Conversions',
      payout: 'Payouts',
    }
    return demoExceptions.map((item) => ({
      id: item.type,
      title: item.label,
      detail: item.detail,
      page: pages[item.type],
    }))
  }
  if (identity === 'everyday') {
    const count = properties.filter((item) => item.publisherKey === 'everyday-finds').length
    return [
      {
        id: 'application',
        title: 'Application review in progress',
        detail: `${count} submitted properties are awaiting partner review.`,
        page: 'Properties',
      },
    ]
  }
  if (identity === 'avery') {
    return [
      {
        id: 'project-puroair',
        title: 'PuroAir project deadline',
        detail: 'Vertical video and 3 story frames due Sep 3.',
        page: 'Projects',
      },
    ]
  }
  if (identity === 'puroair') {
    const applications = sellerApplications.filter((item) => item.status === 'Review').length
    const samples = sellerSamples.filter((item) => item.fulfillment === 'Review').length
    return [
      ...(applications
        ? [
            {
              id: 'applications',
              title: 'Creator applications need review',
              detail: `${applications} applications are awaiting a decision.`,
              page: 'Applications',
            },
          ]
        : []),
      ...(samples
        ? [
            {
              id: 'samples',
              title: 'Sample requests need review',
              detail: `${samples} requests are awaiting a decision.`,
              page: 'Samples',
            },
          ]
        : []),
    ]
  }
  const conversions = scopedConversions(identity)
  const reversed = conversions.filter((item) => item.status === 'reversed').length
  const payable = conversions
    .filter((item) => item.status === 'locked')
    .reduce((sum, item) => sum + item.publisherEarningsCents, 0)
  return [
    ...(reversed
      ? [
          {
            id: 'reversals',
            title: 'Review reversed conversions',
            detail: `${reversed} reversed conversions are reflected in your earnings.`,
            page: 'Earnings',
          },
        ]
      : []),
    ...(payable
      ? [
          {
            id: 'payable',
            title: 'Payable balance available',
            detail: `${formatMoney(payable)} is ready in your payout balance.`,
            page: 'Payouts',
          },
        ]
      : []),
  ]
}
