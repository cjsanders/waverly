import { describe, expect, it } from 'bun:test'

import { previewAlias } from '../../../../scripts/cloudflare.mjs'
import {
  isAllowedAffiliateOrigin,
  isAllowedDocsOrigin,
  resolveAffiliateOrigin,
} from './affiliate-origin'
import { BUILD_AFFILIATE_ORIGIN } from './affiliate-origin.generated'

const previewAffiliate = `https://${previewAlias('cursor/docs-use-case-nav-9b0c', 'waverly-affiliate')}-waverly-affiliate.waverly-d46.workers.dev`

describe('affiliate and docs origins', () => {
  it('allows Waverly affiliate preview hosts', () => {
    expect(previewAffiliate).toBe(
      'https://branch-cursor-docs-use-case-nav-9b0c-b55dcb4e-waverly-affiliate.waverly-d46.workers.dev',
    )
    expect(isAllowedAffiliateOrigin(previewAffiliate)).toBe(true)
    expect(isAllowedAffiliateOrigin('https://waverly-affiliate.waverly-d46.workers.dev')).toBe(true)
    expect(isAllowedAffiliateOrigin('https://evil.example')).toBe(false)
  })

  it('allows Waverly docs hosts', () => {
    expect(
      isAllowedDocsOrigin(
        'https://cursor-docs-use-case-nav-9b0c-waverly-docs.waverly-d46.workers.dev',
      ),
    ).toBe(true)
    expect(isAllowedDocsOrigin('https://docs.waverly.com')).toBe(true)
    expect(isAllowedDocsOrigin(previewAffiliate)).toBe(false)
  })
})

describe('resolveAffiliateOrigin', () => {
  it('uses the baked origin when the env override is unset', () => {
    expect(resolveAffiliateOrigin()).toBe(BUILD_AFFILIATE_ORIGIN)
    expect(resolveAffiliateOrigin({})).toBe(BUILD_AFFILIATE_ORIGIN)
  })

  it('treats an empty override as an explicit opt-out', () => {
    expect(resolveAffiliateOrigin({ AFFILIATE_ORIGIN: '' })).toBeNull()
  })

  it('prefers a valid env override', () => {
    expect(resolveAffiliateOrigin({ AFFILIATE_ORIGIN: previewAffiliate })).toBe(previewAffiliate)
  })
})
