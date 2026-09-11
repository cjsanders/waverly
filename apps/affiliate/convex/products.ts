import { requireNetworkSession, requireTenantDocument } from './networkAccess'
import { mutation, query, type MutationCtx } from './_generated/server'
import { v } from 'convex/values'

/** Brand-owned catalog in `brandProducts`, tenant-scoped (ADR 0003). Listings hang off these rows. */
export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { tenantId } = await requireNetworkSession(ctx)
    const rows =
      args.status === undefined
        ? await ctx.db
            .query('brandProducts')
            .withIndex('by_tenantId', (q) => q.eq('tenantId', tenantId))
            .collect()
        : await ctx.db
            .query('brandProducts')
            .withIndex('by_tenantId_status', (q) =>
              q.eq('tenantId', tenantId).eq('status', args.status!),
            )
            .collect()
    return rows.sort((a, b) => a.name.localeCompare(b.name))
  },
})

export const get = query({
  args: { productId: v.id('brandProducts') },
  handler: async (ctx, { productId }) => {
    const { tenantId } = await requireNetworkSession(ctx)
    const product = requireTenantDocument(
      await ctx.db.get(productId),
      tenantId,
      'Product not found',
    )
    const listings = await ctx.db
      .query('listings')
      .withIndex('by_productId', (q) => q.eq('productId', productId))
      .collect()
    return { product, listings }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    sku: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
  },
  returns: v.id('brandProducts'),
  handler: async (ctx, args) => {
    const session = await requireNetworkSession(ctx)
    const { tenantId } = session
    if (args.sku !== undefined) await requireUnusedSku(ctx, tenantId, args.sku)
    const now = Date.now()
    return ctx.db.insert('brandProducts', {
      tenantId,
      name: args.name,
      sku: args.sku,
      description: args.description,
      imageUrls: args.imageUrls ?? [],
      status: 'active',
      createdAt: now,
      updatedAt: now,
      statusHistory: [{ status: 'active', changedAt: now, changedBy: session.tokenIdentifier }],
    })
  },
})

export const update = mutation({
  args: {
    productId: v.id('brandProducts'),
    name: v.optional(v.string()),
    sku: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
    reason: v.optional(v.string()),
  },
  returns: v.id('brandProducts'),
  handler: async (ctx, args) => {
    const session = await requireNetworkSession(ctx)
    const { tenantId } = session
    const { productId, reason, ...changes } = args
    const product = requireTenantDocument(
      await ctx.db.get(productId),
      tenantId,
      'Product not found',
    )
    if (changes.sku !== undefined && changes.sku !== product.sku) {
      await requireUnusedSku(ctx, tenantId, changes.sku)
    }
    const now = Date.now()
    const statusHistory =
      changes.status !== undefined && changes.status !== product.status
        ? [
            ...(product.statusHistory ?? []),
            { status: changes.status, reason, changedAt: now, changedBy: session.tokenIdentifier },
          ]
        : product.statusHistory
    await ctx.db.patch(productId, { ...changes, statusHistory, updatedAt: now })
    return productId
  },
})

async function requireUnusedSku(ctx: Pick<MutationCtx, 'db'>, tenantId: string, sku: string) {
  const clash = await ctx.db
    .query('brandProducts')
    .withIndex('by_tenantId_sku', (q) => q.eq('tenantId', tenantId).eq('sku', sku))
    .first()
  if (clash) throw new Error(`SKU ${sku} is already used by ${clash.name}`)
}
