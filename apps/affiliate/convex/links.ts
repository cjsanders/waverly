import { requireDemoSession } from './demoAccess'
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { nextLinkVersion, targetRequiresNewVersion } from './domain/links'

const targetArgs = {
  providerId: v.id('providers'),
  programId: v.id('programs'),
  originalDestinationUrl: v.string(),
  normalizedDestinationUrl: v.string(),
  providerTrackingUrl: v.string(),
}

export const resolve = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    await requireDemoSession(ctx)
    const link = await ctx.db
      .query('links')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    if (!link || link.status !== 'active' || !link.currentVersionId) return null
    const version = await ctx.db.get(link.currentVersionId)
    return version ? { link, version } : null
  },
})

export const create = mutation({
  args: {
    publisherId: v.id('publishers'),
    propertyId: v.id('properties'),
    advertiserId: v.id('advertisers'),
    offerId: v.optional(v.id('offers')),
    slug: v.string(),
    displayName: v.string(),
    actor: v.string(),
    reporting: v.optional(v.any()),
    ...targetArgs,
  },
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    const existing = await ctx.db
      .query('links')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()
    if (existing) throw new Error('This Waverly link slug is already in use')

    const now = Date.now()
    const linkId = await ctx.db.insert('links', {
      publisherId: args.publisherId,
      propertyId: args.propertyId,
      advertiserId: args.advertiserId,
      offerId: args.offerId,
      slug: args.slug,
      displayName: args.displayName,
      status: 'active',
      currentVersion: 1,
      createdAt: now,
      updatedAt: now,
      reporting: args.reporting,
    })
    const versionId = await ctx.db.insert('linkVersions', {
      linkId,
      version: 1,
      providerId: args.providerId,
      programId: args.programId,
      originalDestinationUrl: args.originalDestinationUrl,
      normalizedDestinationUrl: args.normalizedDestinationUrl,
      providerTrackingUrl: args.providerTrackingUrl,
      createdAt: now,
      createdBy: (await requireDemoSession(ctx)).tokenIdentifier,
      changeReason: 'initial_target',
    })
    await ctx.db.patch(linkId, { currentVersionId: versionId })
    return { linkId, versionId }
  },
})

export const changeTarget = mutation({
  args: {
    linkId: v.id('links'),
    actor: v.string(),
    reason: v.string(),
    ...targetArgs,
  },
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    const link = await ctx.db.get(args.linkId)
    if (!link?.currentVersionId) throw new Error('Link or current version not found')
    const current = await ctx.db.get(link.currentVersionId)
    if (!current) throw new Error('Current link version not found')

    const changed = targetRequiresNewVersion(
      {
        providerKey: String(current.providerId),
        programKey: String(current.programId),
        originalDestinationUrl: current.originalDestinationUrl,
        normalizedDestinationUrl: current.normalizedDestinationUrl,
        providerTrackingUrl: current.providerTrackingUrl,
      },
      {
        providerKey: String(args.providerId),
        programKey: String(args.programId),
        originalDestinationUrl: args.originalDestinationUrl,
        normalizedDestinationUrl: args.normalizedDestinationUrl,
        providerTrackingUrl: args.providerTrackingUrl,
      },
    )
    if (!changed) return { linkId: args.linkId, versionId: current._id, changed: false }

    const now = Date.now()
    const version = nextLinkVersion(link.currentVersion)
    const versionId = await ctx.db.insert('linkVersions', {
      linkId: args.linkId,
      version,
      providerId: args.providerId,
      programId: args.programId,
      originalDestinationUrl: args.originalDestinationUrl,
      normalizedDestinationUrl: args.normalizedDestinationUrl,
      providerTrackingUrl: args.providerTrackingUrl,
      createdAt: now,
      createdBy: (await requireDemoSession(ctx)).tokenIdentifier,
      changeReason: args.reason,
    })
    await ctx.db.patch(args.linkId, {
      currentVersionId: versionId,
      currentVersion: version,
      updatedAt: now,
    })
    return { linkId: args.linkId, versionId, changed: true }
  },
})

export const updateReporting = mutation({
  args: {
    linkId: v.id('links'),
    displayName: v.optional(v.string()),
    reporting: v.optional(v.any()),
  },
  handler: async (ctx, { linkId, ...changes }) => {
    await requireDemoSession(ctx)
    const link = await ctx.db.get(linkId)
    if (!link) throw new Error('Link not found')
    await ctx.db.patch(linkId, { ...changes, updatedAt: Date.now() })
    return linkId
  },
})
