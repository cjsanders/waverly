import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import schema from './schema'
import { modules } from './test.setup'

describe('network demo integration', () => {
  test('seed validates against the schema and is repeatable without duplicating data', async () => {
    const t = convexTest(schema, modules)
    await t.mutation(internal.demo.seed, {})
    const user = t.withIdentity({ subject: 'demo-user' })
    const before = await user.query(api.demo.summary, {})
    expect(before).toMatchObject({ providers: 3, publishers: 15, conversions: 180 })
    await t.mutation(internal.demo.seed, {})
    expect(await user.query(api.demo.summary, {})).toEqual(before)
    expect(
      (await user.query(api.messages.listThreads, { identityKey: 'puroair' })).length,
    ).toBeGreaterThan(0)
  })

  test('anonymous clients cannot read network or message records', async () => {
    const t = convexTest(schema, modules)
    await expect(t.query(api.demo.summary, {})).rejects.toThrow('Sign in')
    await expect(t.query(api.publishers.list, {})).rejects.toThrow('Sign in')
    await expect(t.query(api.messages.listThreads, { identityKey: 'operator' })).rejects.toThrow(
      'Sign in',
    )
  })
})

test('link edits append a version while preserving the original destination', async () => {
  const t = convexTest(schema, modules)
  await t.mutation(internal.demo.seed, {})
  const user = t.withIdentity({ subject: 'link-editor', issuer: 'https://test.example' })
  const { link, original } = await t.run(async (ctx) => {
    const link = (await ctx.db.query('links').first())!
    return { link, original: (await ctx.db.get(link.currentVersionId!))! }
  })
  const target = {
    linkId: link._id,
    actor: 'spoofed-actor',
    reason: 'Updated demo destination',
    providerId: original.providerId,
    programId: original.programId,
    originalDestinationUrl: 'https://shop.example/new-product',
    normalizedDestinationUrl: 'https://shop.example/new-product',
    providerTrackingUrl: 'https://tracking.example/new-product',
  }
  const updated = await user.mutation(api.links.changeTarget, target)
  expect(updated.changed).toBe(true)
  expect(updated.versionId).not.toBe(original._id)
  await t.run(async (ctx) => {
    expect(await ctx.db.get(original._id)).toEqual(original)
    const version = (await ctx.db.get(updated.versionId))!
    expect(version.createdBy).not.toBe('spoofed-actor')
    expect(version.version).toBe(original.version + 1)
  })
  expect((await user.mutation(api.links.changeTarget, target)).changed).toBe(false)
})

test('payouts reserve funds once, preserve ledger history, and settle idempotently', async () => {
  const t = convexTest(schema, modules)
  await t.mutation(internal.demo.seed, {})
  const user = t.withIdentity({ subject: 'finance-user' })
  const publisher = await t.run(async (ctx) => (await ctx.db.query('publishers').first())!)
  const credit = await user.mutation(api.ledger.append, {
    publisherId: publisher._id,
    entryType: 'commission',
    balanceState: 'payable',
    amountCents: 10000,
    effectiveAt: Date.now(),
    actor: 'demo',
    idempotencyKey: 'test-credit',
    memo: 'Demo earnings',
  })
  const args = {
    publisherId: publisher._id,
    ledgerEntryIds: [credit.ledgerEntryId],
    periodStart: 1,
    periodEnd: Date.now(),
    actor: 'demo',
  }
  const before = await user.query(api.ledger.balances, { publisherId: publisher._id })
  const payoutId = await user.mutation(api.payouts.create, args)
  const reserved = await user.query(api.ledger.balances, { publisherId: publisher._id })
  expect(reserved.payable).toBe(before.payable - 10000)
  expect(reserved.scheduled).toBe((before.scheduled ?? 0) + 10000)
  await expect(user.mutation(api.payouts.create, args)).rejects.toThrow('already assigned')
  await user.mutation(api.payouts.markPaid, {
    payoutId,
    actor: 'demo',
    externalPayoutRef: 'demo-payment',
  })
  const settled = await user.query(api.ledger.balances, { publisherId: publisher._id })
  expect(settled.scheduled).toBe(before.scheduled ?? 0)
  expect(settled.paid).toBe((before.paid ?? 0) + 10000)
  await user.mutation(api.payouts.markPaid, {
    payoutId,
    actor: 'demo',
    externalPayoutRef: 'demo-payment',
  })
  expect(await user.query(api.ledger.balances, { publisherId: publisher._id })).toEqual(settled)
  expect(await t.run((ctx) => ctx.db.get(credit.ledgerEntryId))).toMatchObject({
    amountCents: 10000,
    balanceState: 'payable',
  })
})

test('provider imports deduplicate transactions and retain the original commission terms', async () => {
  const t = convexTest(schema, modules)
  await t.mutation(internal.demo.seed, {})
  const user = t.withIdentity({ subject: 'provider-user' })
  const fixture = await t.run(async (ctx) => {
    const conversion = (await ctx.db.query('conversions').first())!
    const account = (await ctx.db
      .query('providerAccounts')
      .withIndex('by_providerId', (q) => q.eq('providerId', conversion.providerId))
      .first())!
    const sync = (await ctx.db
      .query('providerSyncRuns')
      .withIndex('by_providerId_startedAt', (q) => q.eq('providerId', conversion.providerId))
      .first())!
    return { conversion, account, sync }
  })
  const { conversion: c } = fixture
  const args = {
    providerId: c.providerId,
    providerAccountId: fixture.account._id,
    syncRunId: fixture.sync._id,
    externalRecordId: 'test-record',
    providerTransactionId: 'test-transaction',
    payloadHash: 'first',
    raw: {},
    publisherId: c.publisherId,
    propertyId: c.propertyId,
    advertiserId: c.advertiserId,
    programId: c.programId,
    offerId: c.offerId,
    occurredAt: c.occurredAt,
    status: 'approved',
    orderValueCents: 10000,
    grossCommissionCents: 1000,
  }
  const created = await user.mutation(api.providers.importConversion, args)
  expect(created.outcome).toBe('created')
  expect((await user.mutation(api.providers.importConversion, args)).outcome).toBe('skipped')
  const original = await t.run((ctx) => ctx.db.get(created.conversionId))
  await user.mutation(api.providers.importConversion, {
    ...args,
    payloadHash: 'changed',
    grossCommissionCents: 2000,
  })
  const updated = await t.run((ctx) => ctx.db.get(created.conversionId))
  expect(updated?.commissionRuleSnapshot).toEqual(original?.commissionRuleSnapshot)
  expect(updated!.publisherEarningsCents + updated!.waverlyRevenueCents).toBe(2000)
})
