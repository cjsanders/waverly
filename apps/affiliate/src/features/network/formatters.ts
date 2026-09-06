import { conversions } from '../../../shared/demoData'

import type { DemoIdentity } from './types'
export const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export const integer = new Intl.NumberFormat('en-US')

export function formatMoney(cents: number) {
  return money.format(cents / 100)
}

export function scopeFactor(identity: DemoIdentity) {
  if (identity === 'northstar') return 0.186
  if (identity === 'everyday') return 0.024
  return 1
}

export function publisherKeyForIdentity(identity: DemoIdentity) {
  if (identity === 'northstar') return 'northstar-media'
  if (identity === 'everyday') return 'everyday-finds'
  return null
}

export function scopedConversions(identity: DemoIdentity) {
  const publisherKey = publisherKeyForIdentity(identity)
  return publisherKey
    ? conversions.filter((conversion) => conversion.publisherKey === publisherKey)
    : conversions
}

export function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(timestamp)
}

export function statusVariant(status: string): 'success' | 'warning' | 'error' | 'accent' {
  if (
    ['active', 'approved', 'locked', 'paid', 'fresh', 'connected', 'reporting'].includes(
      status.toLowerCase(),
    )
  ) {
    return 'success'
  }
  if (['reversed', 'failed', 'attention'].includes(status.toLowerCase())) {
    return 'error'
  }
  if (
    ['pending', 'delayed', 'review', 'paused', 'below minimum', 'accruing'].includes(
      status.toLowerCase(),
    )
  ) {
    return 'warning'
  }
  return 'accent'
}

export function displayStatus(status: string) {
  return status.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}
