// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, expect, test, vi } from 'vitest'
import { internal } from '../../convex/_generated/api'
import schema from '../../convex/schema'
import previewSeed from '../../convex/previewSeed'

const modules = import.meta.glob('../../convex/**/*.{js,ts}')
afterEach(() => vi.unstubAllEnvs())

test('seeding is internal and disabled without the preview-only opt-in', async () => {
  vi.stubEnv('WAVERLY_PREVIEW_SEED_ENABLED', undefined)
  const t = convexTest(schema, modules)
  expect(previewSeed.isInternal).toBe(true)
  await expect(t.mutation(internal.previewSeed.default, {})).rejects.toThrow(
    'Preview seeding is disabled',
  )
  expect(await t.run((ctx) => ctx.db.query('products').collect())).toEqual([])
})

test('seeds a synthetic catalog that satisfies the products schema', async () => {
  vi.stubEnv('WAVERLY_PREVIEW_SEED_ENABLED', 'true')
  const t = convexTest(schema, modules)
  expect(await t.mutation(internal.previewSeed.default, {})).toEqual({ seeded: true, inserted: 6 })
  const products = await t.run((ctx) => ctx.db.query('products').collect())
  expect(products).toHaveLength(6)
  expect(new Set(products.map((product) => product.imageId)).size).toBe(6)
  for (const product of products) {
    expect(product.title).toMatch(/^Preview /)
    expect(product.imageId).toMatch(/^preview-/)
    expect(product.price).toBeGreaterThan(0)
  }
})

test('repeated seeding preserves existing IDs and edits without adding duplicates', async () => {
  vi.stubEnv('WAVERLY_PREVIEW_SEED_ENABLED', 'true')
  const t = convexTest(schema, modules)
  await t.mutation(internal.previewSeed.default, {})
  await t.run(async (ctx) => {
    const product = await ctx.db.query('products').first()
    if (!product) throw new Error('Missing seeded product')
    await ctx.db.patch(product._id, { title: 'Edited in this PR', price: 99 })
  })
  const before = await t.run((ctx) => ctx.db.query('products').collect())
  expect(await t.mutation(internal.previewSeed.default, {})).toEqual({ seeded: false, inserted: 0 })
  expect(await t.run((ctx) => ctx.db.query('products').collect())).toEqual(before)
})

test('does not replace or append to a pre-existing catalog', async () => {
  vi.stubEnv('WAVERLY_PREVIEW_SEED_ENABLED', 'true')
  const t = convexTest(schema, modules)
  await t.run((ctx) =>
    ctx.db.insert('products', { title: 'Existing product', imageId: 'existing', price: 12 }),
  )
  const before = await t.run((ctx) => ctx.db.query('products').collect())
  expect(await t.mutation(internal.previewSeed.default, {})).toEqual({ seeded: false, inserted: 0 })
  expect(await t.run((ctx) => ctx.db.query('products').collect())).toEqual(before)
})
