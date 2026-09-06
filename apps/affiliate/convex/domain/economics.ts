export type CommissionRuleScope =
  | 'publisher_offer'
  | 'publisher_program'
  | 'publisher_default'
  | 'network_default'

export interface CommissionRuleCandidate {
  id: string
  scopeType: CommissionRuleScope
  publisherShareBps: number
  active: boolean
  startsAt: number
  endsAt?: number
}

export interface EconomicsSnapshot {
  grossCommissionCents: number
  publisherEarningsCents: number
  waverlyRevenueCents: number
  selectedRule: CommissionRuleCandidate
}

const commissionRuleScopes = new Set<CommissionRuleScope>([
  'publisher_offer',
  'publisher_program',
  'publisher_default',
  'network_default',
])

const precedence: Record<CommissionRuleScope, number> = {
  publisher_offer: 4,
  publisher_program: 3,
  publisher_default: 2,
  network_default: 1,
}

export function selectCommissionRule(
  candidates: CommissionRuleCandidate[],
  occurredAt: number,
): CommissionRuleCandidate {
  const selected = candidates
    .filter(
      (rule) =>
        rule.active &&
        rule.startsAt <= occurredAt &&
        (rule.endsAt === undefined || rule.endsAt > occurredAt),
    )
    .sort(
      (a, b) =>
        precedence[b.scopeType] - precedence[a.scopeType] ||
        b.startsAt - a.startsAt ||
        a.id.localeCompare(b.id),
    )[0]

  if (!selected) {
    throw new Error('No active commission rule applies to this conversion')
  }

  return selected
}

export function snapshotEconomics(
  grossCommissionCents: number,
  selectedRule: CommissionRuleCandidate,
): EconomicsSnapshot {
  if (!Number.isInteger(grossCommissionCents) || grossCommissionCents < 0) {
    throw new Error('Gross commission must be a non-negative integer of cents')
  }
  if (
    !Number.isInteger(selectedRule.publisherShareBps) ||
    selectedRule.publisherShareBps < 0 ||
    selectedRule.publisherShareBps > 10_000
  ) {
    throw new Error('Publisher share must be between 0 and 10,000 basis points')
  }

  const publisherEarningsCents = Math.round(
    (grossCommissionCents * selectedRule.publisherShareBps) / 10_000,
  )

  return {
    grossCommissionCents,
    publisherEarningsCents,
    waverlyRevenueCents: grossCommissionCents - publisherEarningsCents,
    selectedRule: { ...selectedRule },
  }
}

export function commissionRuleFromSnapshot(snapshot: unknown): CommissionRuleCandidate {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('Conversion commission rule snapshot is missing')
  }

  const value = snapshot as Record<string, unknown>
  const id = value.id ?? value.ruleId
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Conversion commission rule snapshot has no rule identity')
  }
  if (
    typeof value.scopeType !== 'string' ||
    !commissionRuleScopes.has(value.scopeType as CommissionRuleScope)
  ) {
    throw new Error('Conversion commission rule snapshot has an invalid scope')
  }
  if (
    typeof value.publisherShareBps !== 'number' ||
    !Number.isInteger(value.publisherShareBps) ||
    value.publisherShareBps < 0 ||
    value.publisherShareBps > 10_000
  ) {
    throw new Error('Conversion commission rule snapshot has an invalid publisher share')
  }

  return {
    id,
    scopeType: value.scopeType as CommissionRuleScope,
    publisherShareBps: value.publisherShareBps,
    active: typeof value.active === 'boolean' ? value.active : true,
    startsAt: typeof value.startsAt === 'number' ? value.startsAt : 0,
    endsAt: typeof value.endsAt === 'number' ? value.endsAt : undefined,
  }
}
