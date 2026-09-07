import { v } from 'convex/values'
import { internalMutation } from './_generated/server'

// Synthetic fixtures only. imageId values are placeholder identifiers, not uploaded assets.
const products = [
  { title: 'Preview Trail Bottle', imageId: 'preview-trail-bottle', price: 24.95 },
  { title: 'Preview Everyday Tote', imageId: 'preview-everyday-tote', price: 18 },
  { title: 'Preview Travel Organizer', imageId: 'preview-travel-organizer', price: 32.5 },
  { title: 'Preview Desk Lamp', imageId: 'preview-desk-lamp', price: 79 },
  { title: 'Preview Starter Notebook', imageId: 'preview-starter-notebook', price: 9.99 },
  { title: 'Preview Gift Bundle', imageId: 'preview-gift-bundle', price: 125 },
]

export default internalMutation({
  args: {},
  returns: v.object({ seeded: v.boolean(), inserted: v.number() }),
  handler: async (ctx) => {
    // This opt-in is configured only in the project's preview defaults.
    if (process.env.WAVERLY_PREVIEW_SEED_ENABLED !== 'true') {
      throw new Error('Preview seeding is disabled for this deployment')
    }
    if (await ctx.db.query('products').first()) return { seeded: false, inserted: 0 }
    await Promise.all(products.map((product) => ctx.db.insert('products', product)))
    return { seeded: true, inserted: products.length }
  },
})
