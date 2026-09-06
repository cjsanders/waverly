import type { Id } from '../../../convex/_generated/dataModel'
export type DemoIdentity = 'operator' | 'northstar' | 'everyday' | 'avery' | 'puroair'

export interface NavSection {
  title: string
  items: string[]
}

export interface RankingRow extends Record<string, unknown> {
  id: string
  name: string
  context: string
  status: 'healthy' | 'attention'
  conversions: number
  earnings: number
}

export interface AlertRow extends Record<string, unknown> {
  id: string
  item: string
  detail: string
  severity: 'warning' | 'error' | 'accent'
}

export interface ConversionRow extends Record<string, unknown> {
  id: string
  transaction: string
  advertiser: string
  occurredAt: number
  status: 'pending' | 'approved' | 'locked' | 'paid' | 'reversed'
  orderValue: number
  earnings: number
}

export interface BalanceRow extends Record<string, unknown> {
  id: string
  label: string
  count: number
  amount: number
  status: 'pending' | 'approved' | 'payable' | 'paid'
}

export interface OfferRow extends Record<string, unknown> {
  id: string
  offer: string
  advertiser: string
  provider: string
  window: string
  share: string
}

export interface SurfaceRow extends Record<string, unknown> {
  id: string
  primary: string
  context: string
  status: string
  metric: string
  value: string
}

export interface SurfaceConfig {
  eyebrow: string
  description: string
  tableTitle: string
  tableDescription: string
  primaryLabel: string
  contextLabel: string
  metricLabel: string
  valueLabel: string
  rows: SurfaceRow[]
  highlights: Array<{ label: string; value: string }>
}

export interface SettingsCategory {
  id: 'workspace' | 'notifications' | 'integrations' | 'payouts'
  label: string
  description: string
}

export interface ConversationMessage {
  id: string
  backendId?: Id<'messageEntries'>
  sender: 'user' | 'assistant'
  author: string
  text: string
  time: string
  attachments?: MessageAttachment[]
  reactions?: MessageReaction[]
}

export type ReactionEmoji = '👍' | '❤️' | '🎉' | '😂' | '👀'

export interface MessageAttachment {
  id: string
  name: string
  contentType: string
  size: number
  url: string
}

export interface MessageReaction {
  emoji: ReactionEmoji
  count: number
  reactedByCurrentUser: boolean
}

export interface ConversationThread {
  id: string
  title: string
  team: string
  counterpartIdentityKey?: DemoIdentity | null
  preview: string
  time: string
  unread: number
  status: 'online' | 'away'
  messages: ConversationMessage[]
}
