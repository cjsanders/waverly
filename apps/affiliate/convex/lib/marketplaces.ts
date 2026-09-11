/* eslint-disable no-await-in-loop -- Preserve ordered writes inside a single Convex transaction. */
import type { GenericDatabaseWriter } from 'convex/server'
import type { DataModel, Id } from '../_generated/dataModel'
import { marketplaces, type MarketplaceSeed } from '../../shared/marketplaces'

/** A retail site needs a country, domain, and currency; a DTC platform has none (ADR 0004). */
export function assertMarketplaceShape(marketplace: MarketplaceSeed) {
  const sited = Boolean(marketplace.countryCode && marketplace.domain && marketplace.currency)
  const bare = !marketplace.countryCode && !marketplace.domain && !marketplace.currency
  if (marketplace.kind === 'retailer' && !sited) {
    throw new Error(`Retail marketplace ${marketplace.key} needs countryCode, domain, and currency`)
  }
  if (marketplace.kind === 'dtc' && !bare) {
    throw new Error(
      `DTC marketplace ${marketplace.key} must not carry a country, domain, or currency`,
    )
  }
}

/**
 * Upsert the static catalog by `key`. Marketplaces are global (ADR 0002), so this runs outside any
 * tenant and is safe to repeat: existing rows are refreshed, never duplicated.
 */
export async function upsertMarketplaces(db: GenericDatabaseWriter<DataModel>, now: number) {
  const ids = new Map<string, Id<'marketplaces'>>()
  let inserted = 0
  for (const marketplace of marketplaces as readonly MarketplaceSeed[]) {
    assertMarketplaceShape(marketplace)
    const existing = await db
      .query('marketplaces')
      .withIndex('by_key', (q) => q.eq('key', marketplace.key))
      .unique()
    const fields = {
      platform: marketplace.platform,
      kind: marketplace.kind,
      name: marketplace.name,
      countryCode: marketplace.countryCode,
      domain: marketplace.domain,
      currency: marketplace.currency,
      updatedAt: now,
    }
    if (existing) {
      await db.patch(existing._id, fields)
      ids.set(marketplace.key, existing._id)
      continue
    }
    ids.set(
      marketplace.key,
      await db.insert('marketplaces', {
        key: marketplace.key,
        status: 'active',
        createdAt: now,
        ...fields,
      }),
    )
    inserted += 1
  }
  return { ids, inserted }
}
