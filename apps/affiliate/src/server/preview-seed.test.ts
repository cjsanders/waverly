// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, expect, test, vi } from 'vitest'
import { internal } from '../../convex/_generated/api'
import schema from '../../convex/schema'
import previewSeed from '../../convex/previewSeed'
import { marketplaces } from '../../shared/marketplaces'

const modules = import.meta.glob('../../convex/**/*.{js,ts}')
afterEach(() => vi.unstubAllEnvs())

test('seeding is internal and disabled without the preview-only opt-in', async () => {
  vi.stubEnv('WAVERLY_PREVIEW_SEED_ENABLED', undefined)
  const t = convexTest(schema, modules)
  expect(previewSeed.isInternal).toBe(true)
  await expect(t.mutation(internal.previewSeed.default, {})).rejects.toThrow(
    'Preview seeding is disabled',
  )
  expect(await t.run((ctx) => ctx.db.query('marketplaces').collect())).toEqual([])
})

test('seeds the global marketplace catalog that satisfies the schema', async () => {
  vi.stubEnv('WAVERLY_PREVIEW_SEED_ENABLED', 'true')
  const t = convexTest(schema, modules)
  expect(await t.mutation(internal.previewSeed.default, {})).toEqual({
    seeded: true,
    inserted: marketplaces.length,
  })
  const rows = await t.run((ctx) => ctx.db.query('marketplaces').collect())
  expect(rows.map((row) => row.key).sort()).toEqual(
    marketplaces.map((marketplace) => marketplace.key).sort(),
  )
  expect(rows.every((row) => row.status === 'active')).toBe(true)
  expect(
    rows.every((row) =>
      row.kind === 'retailer'
        ? /^[A-Z]{2}$/.test(row.countryCode ?? '')
        : row.countryCode === undefined,
    ),
  ).toBe(true)
})

test('repeated seeding preserves existing IDs and edits without adding duplicates', async () => {
  vi.stubEnv('WAVERLY_PREVIEW_SEED_ENABLED', 'true')
  const t = convexTest(schema, modules)
  await t.mutation(internal.previewSeed.default, {})
  await t.run(async (ctx) => {
    const marketplace = await ctx.db.query('marketplaces').first()
    if (!marketplace) throw new Error('Missing seeded marketplace')
    await ctx.db.patch(marketplace._id, { status: 'inactive' })
  })
  const before = await t.run((ctx) => ctx.db.query('marketplaces').collect())
  expect(await t.mutation(internal.previewSeed.default, {})).toEqual({ seeded: false, inserted: 0 })
  expect(await t.run((ctx) => ctx.db.query('marketplaces').collect())).toEqual(before)
})

test('does not replace or append to a pre-existing catalog', async () => {
  vi.stubEnv('WAVERLY_PREVIEW_SEED_ENABLED', 'true')
  const t = convexTest(schema, modules)
  await t.run((ctx) =>
    ctx.db.insert('marketplaces', {
      key: 'existing-site',
      platform: 'existing',
      kind: 'dtc',
      name: 'Existing site',
      status: 'active',
      createdAt: 1,
      updatedAt: 1,
    }),
  )
  const before = await t.run((ctx) => ctx.db.query('marketplaces').collect())
  expect(await t.mutation(internal.previewSeed.default, {})).toEqual({ seeded: false, inserted: 0 })
  expect(await t.run((ctx) => ctx.db.query('marketplaces').collect())).toEqual(before)
})
